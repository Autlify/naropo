/**
 * Journal Upload Service
 * FI-GL Module - Bulk journal entry upload with validation
 * 
 * Uses actual Prisma schema models:
 * - JournalUploadBatch (no rows relation)
 * - JournalEntry + JournalEntryLine
 * 
 * @namespace Autlify.Lib.Features.FI.GL.Actions.JournalUpload
 */

'use server'

import { UploadStatus, JournalEntryType, JournalEntryStatus, SourceModule, PeriodType, PeriodStatus } from '@/generated/prisma/client'
import { db } from '@/lib/db'
import { Decimal } from 'decimal.js'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getGLContext } from '../core/context'
import { ActionResult, errorResult, successResult } from '../core/errors'
import { checkGLPermission } from '../core/permissions'
import { GL_PERMISSION_KEYS } from '../core/utils'
import { logGLAudit } from './audit'
import { recordTemplateUsage, getTemplateColumns, TemplateColumn } from './templates'

// =====================================================
// SCHEMAS
// =====================================================

const journalRowSchema = z.object({
  entryDate: z.string().or(z.date()),
  accountCode: z.string().min(1),
  description: z.string().min(1),
  debitAmount: z.number().nonnegative().optional(),
  creditAmount: z.number().nonnegative().optional(),
  reference: z.string().optional(),
  currency: z.string().length(3).optional(),
  exchangeRate: z.number().positive().optional(),
  costCenter: z.string().optional(),
  profitCenter: z.string().optional(),
  taxCode: z.string().optional(),
  projectCode: z.string().optional(),
  externalId: z.string().optional(),
})

const uploadBatchSchema = z.object({
  templateId: z.string(),
  filename: z.string(),
  rows: z.array(journalRowSchema),
  validateOnly: z.boolean().default(false),
  autoPost: z.boolean().default(false),
})

export type JournalRowInput = z.infer<typeof journalRowSchema>
export type UploadBatchInput = z.infer<typeof uploadBatchSchema>

// =====================================================
// VALIDATION
// =====================================================

export interface ValidationError {
  row: number
  column: string
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  summary: {
    totalRows: number
    validRows: number
    invalidRows: number
    totalDebit: number
    totalCredit: number
    isBalanced: boolean
  }
}

/**
 * Validate journal upload rows
 */
export async function validateJournalRows(
  rows: JournalRowInput[],
  subAccountId?: string
): Promise<ActionResult<ValidationResult>> {
  const contextResult = await getGLContext()
  if (!contextResult.success) {
    return errorResult(contextResult.error.error)
  }

  const { context } = contextResult

  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []
  let totalDebit = 0
  let totalCredit = 0
  let validRows = 0

  // Get valid account codes
  const accounts = await db.chartOfAccount.findMany({
    where: { agencyId: context.agencyId, isActive: true },
    select: { code: true, name: true },
  })
  const validCodes = new Set(accounts.map((a) => a.code))

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 1
    let rowValid = true

    // Validate account code
    if (!validCodes.has(row.accountCode)) {
      errors.push({
        row: rowNum,
        column: 'accountCode',
        message: `Invalid account code: ${row.accountCode}`,
        severity: 'error',
      })
      rowValid = false
    }

    // Validate amounts
    const debit = row.debitAmount ?? 0
    const credit = row.creditAmount ?? 0

    if (debit === 0 && credit === 0) {
      errors.push({
        row: rowNum,
        column: 'amount',
        message: 'Row must have either debit or credit amount',
        severity: 'error',
      })
      rowValid = false
    }

    if (debit > 0 && credit > 0) {
      warnings.push({
        row: rowNum,
        column: 'amount',
        message: 'Row has both debit and credit - will use net amount',
        severity: 'warning',
      })
    }

    // Validate date
    const entryDate = new Date(row.entryDate)
    if (isNaN(entryDate.getTime())) {
      errors.push({
        row: rowNum,
        column: 'entryDate',
        message: 'Invalid date format',
        severity: 'error',
      })
      rowValid = false
    } else if (entryDate > new Date()) {
      warnings.push({
        row: rowNum,
        column: 'entryDate',
        message: 'Entry date is in the future',
        severity: 'warning',
      })
    }

    // Validate currency if provided
    if (row.currency && !/^[A-Z]{3}$/.test(row.currency)) {
      errors.push({
        row: rowNum,
        column: 'currency',
        message: 'Currency must be 3-letter ISO code',
        severity: 'error',
      })
      rowValid = false
    }

    // Track totals
    if (rowValid) {
      totalDebit += debit
      totalCredit += credit
      validRows++
    }
  }

  // Check balance
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01

  if (!isBalanced) {
    warnings.push({
      row: 0,
      column: 'balance',
      message: `Entries are not balanced. Debit: ${totalDebit.toFixed(2)}, Credit: ${totalCredit.toFixed(2)}`,
      severity: 'warning',
    })
  }

  return successResult({
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalRows: rows.length,
      validRows,
      invalidRows: rows.length - validRows,
      totalDebit,
      totalCredit,
      isBalanced,
    },
  })
}

// =====================================================
// UPLOAD PROCESSING
// =====================================================

/**
 * Generate next entry number
 */
async function generateEntryNumber(agencyId: string): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `JE-${year}-`

  const lastEntry = await db.journalEntry.findFirst({
    where: {
      agencyId,
      entryNumber: { startsWith: prefix },
    },
    orderBy: { entryNumber: 'desc' },
  })

  if (lastEntry) {
    const lastNum = parseInt(lastEntry.entryNumber.split('-').pop() ?? '0', 10)
    return `${prefix}${String(lastNum + 1).padStart(5, '0')}`
  }

  return `${prefix}00001`
}

/**
 * Get or create period for date
 */
async function getOrCreatePeriod(agencyId: string, date: Date): Promise<string> {
  const fiscalYear = date.getFullYear()
  const fiscalPeriod = date.getMonth() + 1

  // Try to find existing period
  const period = await db.financialPeriod.findFirst({
    where: {
      agencyId,
      fiscalYear,
      fiscalPeriod,
      periodType: PeriodType.MONTH,
    },
  })

  if (period) return period.id

  // Create period
  const startDate = new Date(fiscalYear, fiscalPeriod - 1, 1)
  const endDate = new Date(fiscalYear, fiscalPeriod, 0) // Last day of month

  const newPeriod = await db.financialPeriod.create({
    data: {
      agencyId,
      name: `${date.toLocaleString('default', { month: 'long' })} ${fiscalYear}`,
      shortName: `${date.toLocaleString('default', { month: 'short' })}-${String(fiscalYear).slice(2)}`,
      periodType: PeriodType.MONTH,
      fiscalYear,
      fiscalPeriod,
      startDate,
      endDate,
      status: PeriodStatus.OPEN,
      createdBy: 'SYSTEM',
    },
  })

  return newPeriod.id
}

/**
 * Process journal upload batch
 */
export async function processJournalUpload(
  input: UploadBatchInput,
  subAccountId?: string
): Promise<ActionResult<{ batchId: string; result: ValidationResult; entriesCreated?: number }>> {
  const contextResult = await getGLContext()
  if (!contextResult.success) {
    return errorResult(contextResult.error.error)
  }

  const { context } = contextResult

  // Check permission
  const hasPermission = await checkGLPermission(
    context,
    GL_PERMISSION_KEYS.journal_entries.create
  )
  if (!hasPermission) {
    return errorResult('Permission denied: Cannot upload journal entries')
  }

  const validation = uploadBatchSchema.safeParse(input)
  if (!validation.success) {
    return errorResult(`Validation error: ${validation.error.message}`)
  }

  const { templateId, filename, rows, validateOnly, autoPost } = validation.data

  // Validate rows
  const validationResult = await validateJournalRows(rows, subAccountId)
  if (!validationResult.success) {
    return errorResult(validationResult.error ?? 'Validation failed')
  }

  const result = validationResult.data

  // Estimate file size (rough approximation)
  const estimatedFileSize = JSON.stringify(rows).length

  // Create batch record (matches actual schema)
  const batch = await db.journalUploadBatch.create({
    data: {
      agencyId: context.agencyId!,
      subAccountId: subAccountId ?? null,
      createdBy: context.userId!,
      templateId,
      filename,
      fileSize: estimatedFileSize,
      rowCount: rows.length,
      validRows: result.summary.validRows,
      errorRows: result.summary.invalidRows,
      status: validateOnly
        ? UploadStatus.VALIDATED
        : result.isValid
        ? UploadStatus.PROCESSING
        : UploadStatus.FAILED,
      validationErrors: result.errors.length > 0 ? JSON.parse(JSON.stringify(result.errors)) : undefined,
    },
  })

  // If validate only, return now
  if (validateOnly) {
    return successResult({ batchId: batch.id, result })
  }

  // If validation failed, return
  if (!result.isValid) {
    return successResult({ batchId: batch.id, result })
  }

  // Process valid rows into journal entries
  let entriesCreated = 0
  const journalEntryIds: string[] = []

  try {
    // Get valid rows
    const validRowData = rows.filter(
      (_, i) => !result.errors.some((e) => e.row === i + 1)
    )

    // Group by reference to create journal entries
    const groupedByRef = new Map<string, JournalRowInput[]>()
    for (const row of validRowData) {
      const key = row.reference || `UPLOAD-${batch.id.slice(0, 8)}-${groupedByRef.size + 1}`
      if (!groupedByRef.has(key)) {
        groupedByRef.set(key, [])
      }
      groupedByRef.get(key)!.push(row)
    }

    // Create journal entries
    for (const [reference, entryRows] of groupedByRef) {
      const firstRow = entryRows[0]
      const entryDate = new Date(firstRow.entryDate)

      // Get period
      const periodId = await getOrCreatePeriod(context.agencyId!, entryDate)

      // Generate entry number
      const entryNumber = await generateEntryNumber(context.agencyId!)

      // Calculate totals
      const totalD = entryRows.reduce((sum, r) => sum + (r.debitAmount ?? 0), 0)
      const totalC = entryRows.reduce((sum, r) => sum + (r.creditAmount ?? 0), 0)

      // Create JournalEntry
      const journalEntry = await db.journalEntry.create({
        data: {
          agencyId: context.agencyId!,
          subAccountId: subAccountId ?? null,
          entryNumber,
          reference,
          periodId,
          entryDate,
          entryType: JournalEntryType.NORMAL,
          sourceModule: SourceModule.MANUAL,
          description: firstRow.description,
          currencyCode: firstRow.currency ?? 'USD',
          exchangeRate: new Decimal(firstRow.exchangeRate ?? 1),
          totalDebit: new Decimal(totalD),
          totalCredit: new Decimal(totalC),
          totalDebitBase: new Decimal(totalD),
          totalCreditBase: new Decimal(totalC),
          status: autoPost ? JournalEntryStatus.POSTED : JournalEntryStatus.DRAFT,
          createdBy: context.userId!,
          postedAt: autoPost ? new Date() : null,
          postedBy: autoPost ? context.userId : null,
        },
      })

      journalEntryIds.push(journalEntry.id)

      // Create line items
      let lineNumber = 1
      for (const row of entryRows) {
        const account = await db.chartOfAccount.findFirst({
          where: { agencyId: context.agencyId, code: row.accountCode },
        })

        if (account) {
          await db.journalEntryLine.create({
            data: {
              journalEntryId: journalEntry.id,
              lineNumber: lineNumber++,
              accountId: account.id,
              description: row.description,
              debitAmount: new Decimal(row.debitAmount ?? 0),
              creditAmount: new Decimal(row.creditAmount ?? 0),
              debitAmountBase: new Decimal(row.debitAmount ?? 0),
              creditAmountBase: new Decimal(row.creditAmount ?? 0),
            },
          })
        }
      }

      entriesCreated++
    }

    // Update batch status
    await db.journalUploadBatch.update({
      where: { id: batch.id },
      data: {
        status: UploadStatus.COMPLETED,
        processedAt: new Date(),
        journalEntryIds,
      },
    })

    // Record template usage
    await recordTemplateUsage(templateId)

    // Audit log
    await logGLAudit({
      action: 'CREATE',
      entityType: 'JOURNAL_UPLOAD',
      entityId: batch.id,
      description: `Uploaded ${entriesCreated} journal entries from batch`,
      agencyId: context.agencyId ?? undefined,
    })

    revalidatePath('/agency/[agencyId]/fi/general-ledger')

    return successResult({ batchId: batch.id, result, entriesCreated })
  } catch (error) {
    console.error('Error processing journal upload:', error)

    // Update batch to failed
    await db.journalUploadBatch.update({
      where: { id: batch.id },
      data: {
        status: UploadStatus.FAILED,
        validationErrors: {
          processingError: error instanceof Error ? error.message : 'Unknown error',
        },
      },
    })

    return errorResult('Failed to process journal entries')
  }
}

// =====================================================
// BATCH MANAGEMENT
// =====================================================

/**
 * Get upload batches
 */
export async function getUploadBatches(
  subAccountId?: string,
  limit = 50
): Promise<ActionResult<any[]>> {
  const contextResult = await getGLContext()
  if (!contextResult.success) {
    return errorResult(contextResult.error.error)
  }

  const { context } = contextResult

  try {
    const where: Record<string, unknown> = { agencyId: context.agencyId }
    if (subAccountId) where.subAccountId = subAccountId

    const batches = await db.journalUploadBatch.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return successResult(batches)
  } catch (error) {
    console.error('Error fetching batches:', error)
    return errorResult('Failed to fetch upload batches')
  }
}

/**
 * Get batch details
 */
export async function getBatchDetails(
  batchId: string
): Promise<ActionResult<any>> {
  const contextResult = await getGLContext()
  if (!contextResult.success) {
    return errorResult(contextResult.error.error)
  }

  const { context } = contextResult

  try {
    const batch = await db.journalUploadBatch.findUnique({
      where: { id: batchId },
    })

    if (!batch) {
      return errorResult('Batch not found')
    }

    if (batch.agencyId !== context.agencyId) {
      return errorResult('Access denied')
    }

    // Get related journal entries if any
    let journalEntries: unknown[] = []
    if (batch.journalEntryIds.length > 0) {
      journalEntries = await db.journalEntry.findMany({
        where: { id: { in: batch.journalEntryIds } },
        include: { Lines: true },
      })
    }

    return successResult({ ...batch, journalEntries })
  } catch (error) {
    console.error('Error fetching batch:', error)
    return errorResult('Failed to fetch batch details')
  }
}

/**
 * Delete upload batch (if not yet processed)
 */
export async function deleteUploadBatch(batchId: string): Promise<ActionResult<void>> {
  const contextResult = await getGLContext()
  if (!contextResult.success) {
    return errorResult(contextResult.error.error)
  }

  const { context } = contextResult
  const hasPermission = await checkGLPermission(
    context,
    GL_PERMISSION_KEYS.journal_entries.create
  )
  if (!hasPermission) {
    return errorResult('Permission denied')
  }

  try {
    const batch = await db.journalUploadBatch.findUnique({
      where: { id: batchId },
    })

    if (!batch) {
      return errorResult('Batch not found')
    }

    if (batch.agencyId !== context.agencyId) {
      return errorResult('Access denied')
    }

    // Can only delete if not completed
    if (batch.status === UploadStatus.COMPLETED && batch.journalEntryIds.length > 0) {
      return errorResult('Cannot delete batch with created journal entries')
    }

    await db.journalUploadBatch.delete({
      where: { id: batchId },
    })

    await logGLAudit({
      action: 'DELETE',
      entityType: 'JOURNAL_UPLOAD',
      entityId: batchId,
      description: `Deleted upload batch`,
      agencyId: context.agencyId ?? undefined,
    })

    revalidatePath('/agency/[agencyId]/fi/general-ledger')

    return successResult(undefined)
  } catch (error) {
    console.error('Error deleting batch:', error)
    return errorResult('Failed to delete batch')
  }
}

// =====================================================
// TEMPLATE DOWNLOAD
// =====================================================

/**
 * Generate template CSV content for download
 */
export async function generateTemplateCSV(
  templateId: string,
  entitlements?: string[]
): Promise<ActionResult<{ filename: string; content: string }>> {
  const columnsResult = await getTemplateColumns(templateId, entitlements)
  if (!columnsResult.success) {
    return errorResult(columnsResult.error ?? 'Failed to get template columns')
  }

  const columns = columnsResult.data

  // Header row
  const headers = columns.map((c: TemplateColumn) => c.header)

  // Example rows
  const examples = [
    // Row 1 - Debit side of cash receipt
    columns.map((c: TemplateColumn) => {
      switch (c.key) {
        case 'entryDate':
          return '2026-02-01'
        case 'accountCode':
          return '1100'
        case 'description':
          return 'Cash receipt from client'
        case 'debitAmount':
          return '1000.00'
        case 'creditAmount':
          return ''
        case 'reference':
          return 'REC-001'
        case 'currency':
          return 'USD'
        case 'exchangeRate':
          return '1.00'
        case 'costCenter':
          return 'CC-100'
        default:
          return ''
      }
    }),
    // Row 2 - Credit side of cash receipt
    columns.map((c: TemplateColumn) => {
      switch (c.key) {
        case 'entryDate':
          return '2026-02-01'
        case 'accountCode':
          return '4000'
        case 'description':
          return 'Cash receipt from client'
        case 'debitAmount':
          return ''
        case 'creditAmount':
          return '1000.00'
        case 'reference':
          return 'REC-001'
        case 'currency':
          return 'USD'
        case 'exchangeRate':
          return '1.00'
        case 'costCenter':
          return 'CC-100'
        default:
          return ''
      }
    }),
  ]

  // Build CSV content
  const allRows = [headers, ...examples]
  const content = allRows.map((row) => row.map((v) => `"${v}"`).join(',')).join('\n')

  return successResult({
    filename: `journal_template_${templateId}.csv`,
    content,
  })
}

/**
 * Parse uploaded CSV content
 */
export async function parseCSVContent(
  content: string,
  templateId: string
): Promise<ActionResult<JournalRowInput[]>> {
  const columnsResult = await getTemplateColumns(templateId)
  if (!columnsResult.success) {
    return errorResult(columnsResult.error ?? 'Failed to get template columns')
  }

  const columns = columnsResult.data

  // Parse CSV
  const lines = content.split('\n').filter((line) => line.trim().length > 0)
  if (lines.length < 2) {
    return errorResult('CSV must have header row and at least one data row')
  }

  // Parse header
  const header = parseCSVLine(lines[0])
  const columnMap = new Map<number, TemplateColumn>()

  for (let i = 0; i < header.length; i++) {
    const headerName = header[i].toLowerCase().trim()
    const col = columns.find(
      (c: TemplateColumn) =>
        c.header.toLowerCase() === headerName || c.key.toLowerCase() === headerName
    )
    if (col) {
      columnMap.set(i, col)
    }
  }

  // Parse data rows
  const rows: JournalRowInput[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const row: Record<string, unknown> = {}

    for (const [index, col] of columnMap) {
      const value = values[index]?.trim() ?? ''

      if (col.type === 'number') {
        row[col.key] = value ? parseFloat(value) : undefined
      } else if (col.type === 'date') {
        row[col.key] = value || undefined
      } else {
        row[col.key] = value || undefined
      }
    }

    // Only add if has required fields
    if (row.entryDate && row.accountCode && row.description) {
      rows.push(row as unknown as JournalRowInput)
    }
  }

  return successResult(rows)
}

/**
 * Helper: Parse CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}
