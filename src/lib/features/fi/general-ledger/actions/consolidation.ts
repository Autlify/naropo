/**
 * GL Consolidation Server Actions
 * FI-GL Module - Multi-entity consolidation and elimination
 */

'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { logGLAudit } from './audit'
import {
  createConsolidationSnapshotSchema,
  consolidationAdjustmentSchema,
  intercompanyEliminationSchema,
  type CreateConsolidationSnapshotInput,
  type ConsolidationAdjustmentInput,
  type IntercompanyEliminationInput,
} from '@/lib/schemas/fi/general-ledger/consolidation'
import { Decimal } from 'decimal.js'
import { ConsolidationStatus } from '@/generated/prisma/client'
import { getActionContext, hasContextPermission, type ActionContext } from '@/lib/features/iam/authz/action-context'

// ========== Types ==========

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

type ConsolidationContext = ActionContext

// ========== Helper Functions ==========

const getContext = getActionContext
const checkPermission = hasContextPermission

// ========== Consolidation Mapping ==========

/**
 * Get consolidation mappings for an entity
 */
export const getConsolidationMappings = async (
  subAccountId?: string
): Promise<ActionResult<any[]>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.consolidation.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const whereClause: any = { agencyId: context.agencyId }
    if (subAccountId) {
      whereClause.subAccountId = subAccountId
    }

    const mappings = await db.consolidationMapping.findMany({
      where: whereClause,
      include: {
        SubAccount: { select: { id: true, name: true } }, 
        GroupCOA: { select: { id: true, code: true, name: true } },
      },
      orderBy: { subAccountCOACode: 'asc' },
    })

    return { success: true, data: mappings }
  } catch (error) {
    console.error('Error fetching consolidation mappings:', error)
    return { success: false, error: 'Failed to fetch consolidation mappings' }
  }
}

/**
 * Create or update consolidation mapping
 */
export const upsertConsolidationMapping = async (
  mapping: {
    subAccountId: string
    subAccountCOACode: string
    groupCOAId: string
    mappingPercentage?: number
  }
): Promise<ActionResult<any>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    if (!context.agencyId) {
      return { success: false, error: 'Agency context required for consolidation' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.consolidation.manage')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    // Check if mapping exists
    const existing = await db.consolidationMapping.findFirst({
      where: {
        agencyId: context.agencyId,
        subAccountId: mapping.subAccountId,
        subAccountCOACode: mapping.subAccountCOACode,
      },
    })

    let result
    if (existing) {
      result = await db.consolidationMapping.update({
        where: { id: existing.id },
        data: {
          groupCOAId: mapping.groupCOAId,
          mappingPercentage: mapping.mappingPercentage ?? 100,
          updatedBy: context.userId,
        },
      })
    } else {
      result = await db.consolidationMapping.create({
        data: {
          agencyId: context.agencyId,
          subAccountId: mapping.subAccountId,
          subAccountCOACode: mapping.subAccountCOACode,
          groupCOAId: mapping.groupCOAId,
          mappingPercentage: mapping.mappingPercentage ?? 100,
          createdBy: context.userId,
        },
      })
    }

    await logGLAudit({
      action: existing ? 'UPDATE' : 'CREATE',
      entityType: 'ConsolidationMapping',
      entityId: result.id,
      agencyId: context.agencyId,
      description: `${existing ? 'Updated' : 'Created'} consolidation mapping`,
    })

    revalidatePath(`/agency/${context.agencyId}/fi/general-ledger/consolidation`)

    return { success: true, data: result }
  } catch (error) {
    console.error('Error upserting consolidation mapping:', error)
    return { success: false, error: 'Failed to save consolidation mapping' }
  }
}

/**
 * Auto-generate mappings based on account codes
 */
export const generateAutoMappings = async (
  subAccountId: string
): Promise<ActionResult<{ created: number }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    if (!context.agencyId) {
      return { success: false, error: 'Agency context required for consolidation' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.consolidation.manage')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    // Get SubAccount accounts
    const subAccountAccounts = await db.chartOfAccount.findMany({
      where: { subAccountId, isActive: true },
    })

    // Get Agency Group COAs
    const agencyGroupCOAs = await db.agencyGroupCOA.findMany({
      where: { agencyId: context.agencyId, isActive: true },
    })

    const groupCOAsByCode = new Map(agencyGroupCOAs.map(a => [a.code, a]))

    let created = 0

    for (const sourceAccount of subAccountAccounts) {
      // Try to find matching agency group COA by code
      const targetGroupCOA = groupCOAsByCode.get(sourceAccount.code)

      if (targetGroupCOA) {
        // Check if mapping already exists
        const existing = await db.consolidationMapping.findFirst({
          where: {
            agencyId: context.agencyId,
            subAccountId,
            subAccountCOACode: sourceAccount.code,
          },
        })

        if (!existing) {
          await db.consolidationMapping.create({
            data: {
              agencyId: context.agencyId,
              subAccountId,
              subAccountCOACode: sourceAccount.code,
              groupCOAId: targetGroupCOA.id,
              mappingPercentage: 100,
              createdBy: context.userId,
            },
          })
          created++
        }
      }
    }

    return { success: true, data: { created } }
  } catch (error) {
    console.error('Error generating auto mappings:', error)
    return { success: false, error: 'Failed to generate auto mappings' }
  }
}

// ========== Consolidation Snapshots ==========

/**
 * Create consolidation snapshot
 */
export const createConsolidationSnapshot = async (
  input: CreateConsolidationSnapshotInput
): Promise<ActionResult<any>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    if (!context.agencyId) {
      return { success: false, error: 'Agency context required for consolidation' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.consolidation.manage')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const parsed = createConsolidationSnapshotSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    // Get GL config for consolidation settings
    const config = await db.gLConfiguration.findFirst({
      where: { agencyId: context.agencyId },
    })

    if (!config?.consolidationEnabled) {
      return { success: false, error: 'Consolidation is not enabled' }
    }

    // Get all SubAccounts to consolidate
    const subAccounts = await db.subAccount.findMany({
      where: { agencyId: context.agencyId },
      select: { id: true, name: true },
    })

    // Generate snapshot number
    const snapshotCount = await db.consolidationSnapshot.count({ where: { agencyId: context.agencyId } })
    const snapshotNumber = `CS-${new Date().getFullYear()}-${String(snapshotCount + 1).padStart(5, '0')}`

    // Create snapshot
    const snapshot = await db.consolidationSnapshot.create({
      data: {
        agencyId: context.agencyId,
        periodId: parsed.data.periodId,
        snapshotNumber,
        name: parsed.data.name,
        description: parsed.data.description,
        subAccountIds: subAccounts.map(s => s.id),
        consolidationMethod: parsed.data.consolidationMethod,
        consolidatedBalances: {},
        balanceSheet: {},
        incomeStatement: {},
        cashFlowStatement: {},
        eliminationEntries: [],
        adjustmentEntries: [],
        consolidatedBy: context.userId,
      },
    })

    // Capture balances for each entity and create worksheet lines
    for (const subAccount of subAccounts) {
      const balances = await db.accountBalance.findMany({
        where: {
          subAccountId: subAccount.id,
          periodId: parsed.data.periodId,
        },
        include: {
          Account: { select: { code: true, name: true, accountType: true } },
        },
      })

      for (const balance of balances) {
        // Get consolidation mapping
        const mapping = await db.consolidationMapping.findFirst({
          where: {
            agencyId: context.agencyId,
            subAccountId: subAccount.id,
            subAccountCOACode: balance.Account?.code ?? '',
          },
        })

        if (mapping) {
          // Create worksheet line for mapped accounts
          await db.consolidationWorksheetLine.create({
            data: {
              snapshotId: snapshot.id,
              groupCOAId: mapping.groupCOAId,
              accountCode: balance.Account?.code ?? '',
              accountName: balance.Account?.name ?? '',
              subAccountBalances: {
                [subAccount.id]: {
                  balance: balance.closingBalance.toNumber(),
                  percentage: mapping.mappingPercentage.toNumber(),
                },
              },
              totalBeforeAdj: balance.closingBalance,
              consolidatedBalance: balance.closingBalance.times(mapping.mappingPercentage.dividedBy(100)),
            },
          })
        }
      }
    }

    await logGLAudit({
      action: 'CREATE',
      entityType: 'ConsolidationSnapshot',
      entityId: snapshot.id,
      agencyId: context.agencyId,
      description: `Created consolidation snapshot for period ${parsed.data.periodId}`,
    })

    revalidatePath(`/agency/${context.agencyId}/fi/general-ledger/consolidation`)

    return { success: true, data: snapshot }
  } catch (error) {
    console.error('Error creating consolidation snapshot:', error)
    return { success: false, error: 'Failed to create consolidation snapshot' }
  }
}

/**
 * List consolidation snapshots
 */
export const listConsolidationSnapshots = async (options?: {
  periodId?: string
  status?: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED'
  page?: number
  pageSize?: number
}): Promise<ActionResult<{ snapshots: any[]; total: number }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.consolidation.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const page = options?.page ?? 1
    const pageSize = options?.pageSize ?? 20
    const skip = (page - 1) * pageSize

    const whereClause: any = { agencyId: context.agencyId }

    if (options?.periodId) {
      whereClause.periodId = options.periodId
    }

    if (options?.status) {
      whereClause.status = options.status
    }

    const [snapshots, total] = await Promise.all([
      db.consolidationSnapshot.findMany({
        where: whereClause,
        include: {
          Period: { select: { id: true, name: true } },
          _count: { select: { WorksheetLines: true, Adjustments: true, Eliminations: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      db.consolidationSnapshot.count({ where: whereClause }),
    ])

    return { success: true, data: { snapshots, total } }
  } catch (error) {
    console.error('Error listing consolidation snapshots:', error)
    return { success: false, error: 'Failed to list consolidation snapshots' }
  }
}

/**
 * Get consolidation snapshot with details
 */
export const getConsolidationSnapshot = async (
  id: string
): Promise<ActionResult<any>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.consolidation.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const snapshot = await db.consolidationSnapshot.findUnique({
      where: { id },
      include: {
        Period: { select: { id: true, name: true, startDate: true, endDate: true } },
        WorksheetLines: {
          include: {
            GroupCOA: { select: { code: true, name: true } },
          },
        },
        Adjustments: true,
        Eliminations: true,
      },
    })

    if (!snapshot) {
      return { success: false, error: 'Consolidation snapshot not found' }
    }

    if (snapshot.agencyId !== context.agencyId) {
      return { success: false, error: 'Unauthorized: Access denied' }
    }

    return { success: true, data: snapshot }
  } catch (error) {
    console.error('Error fetching consolidation snapshot:', error)
    return { success: false, error: 'Failed to fetch consolidation snapshot' }
  }
}

// ========== Consolidation Adjustments ==========

/**
 * Create consolidation adjustment
 */
export const createConsolidationAdjustment = async (
  input: ConsolidationAdjustmentInput
): Promise<ActionResult<any>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.consolidation.manage')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const parsed = consolidationAdjustmentSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    // Generate adjustment number
    const adjCount = await db.consolidationAdjustment.count({ where: { snapshotId: parsed.data.snapshotId } })
    const adjustmentNumber = `ADJ-${String(adjCount + 1).padStart(4, '0')}`

    const adjustment = await db.consolidationAdjustment.create({
      data: {
        ...parsed.data,
        adjustmentNumber,
        amount: new Decimal(parsed.data.amount),
        createdBy: context.userId,
      },
    })

    await logGLAudit({
      action: 'CREATE',
      entityType: 'ConsolidationAdjustment',
      entityId: adjustment.id,
      agencyId: context.agencyId,
      description: `Created consolidation adjustment: ${adjustment.description}`,
    })

    revalidatePath(`/agency/${context.agencyId}/fi/general-ledger/consolidation`)

    return { success: true, data: adjustment }
  } catch (error) {
    console.error('Error creating consolidation adjustment:', error)
    return { success: false, error: 'Failed to create consolidation adjustment' }
  }
}

// ========== Intercompany Eliminations ==========

/**
 * Create intercompany elimination
 */
export const createConsolidationElimination = async (
  input: IntercompanyEliminationInput
): Promise<ActionResult<any>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.consolidation.manage')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const parsed = intercompanyEliminationSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
    }

    // Generate elimination number
    const elimCount = await db.intercompanyElimination.count({ where: { snapshotId: parsed.data.snapshotId } })
    const eliminationNumber = `ELIM-${String(elimCount + 1).padStart(4, '0')}`

    const elimination = await db.intercompanyElimination.create({
      data: {
        ...parsed.data,
        eliminationNumber,
        amount: new Decimal(parsed.data.amount),
        createdBy: context.userId,
      },
    })

    await logGLAudit({
      action: 'CREATE',
      entityType: 'ConsolidationElimination',
      entityId: elimination.id,
      agencyId: context.agencyId,
      description: `Created intercompany elimination: ${elimination.description}`,
    })

    revalidatePath(`/agency/${context.agencyId}/fi/general-ledger/consolidation`)

    return { success: true, data: elimination }
  } catch (error) {
    console.error('Error creating consolidation elimination:', error)
    return { success: false, error: 'Failed to create consolidation elimination' }
  }
}

/**
 * Auto-detect intercompany transactions
 */
export const detectIntercompanyTransactions = async (
  snapshotId: string
): Promise<ActionResult<{ detected: number }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    if (!context.agencyId) {
      return { success: false, error: 'Agency context required' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.consolidation.manage')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const snapshot = await db.consolidationSnapshot.findUnique({
      where: { id: snapshotId },
    })

    if (!snapshot) {
      return { success: false, error: 'Snapshot not found' }
    }

    // Find journal entries marked as intercompany
    const icEntries = await db.journalEntryLine.findMany({
      where: {
        isIntercompany: true,
        JournalEntry: {
          agencyId: context.agencyId,
          status: 'POSTED',
        },
      },
      include: {
        JournalEntry: { select: { subAccountId: true, entryNumber: true } },
        Account: { select: { code: true, name: true } },
      },
    })

    let detected = 0

    // Generate elimination number prefix
    const elimCount = await db.intercompanyElimination.count({ where: { snapshotId } })
    let elimCounter = elimCount

    // Group by journal entry and create eliminations
    const icGroups = new Map<string, typeof icEntries>()
    for (const line of icEntries) {
      const ref = line.JournalEntry?.entryNumber ?? line.journalEntryId
      if (!icGroups.has(ref)) {
        icGroups.set(ref, [])
      }
      icGroups.get(ref)!.push(line)
    }

    for (const [ref, lines] of icGroups) {
      if (lines.length < 2) continue

      // Calculate net amount
      const totalDebit = lines.reduce((sum, l) => sum.plus(new Decimal(l.debitAmount)), new Decimal(0))
      const totalCredit = lines.reduce((sum, l) => sum.plus(new Decimal(l.creditAmount)), new Decimal(0))

      if (totalDebit.equals(totalCredit)) {
        elimCounter++
        // Create elimination entry
        await db.intercompanyElimination.create({
          data: {
            snapshotId,
            eliminationNumber: `ELIM-${String(elimCounter).padStart(4, '0')}`,
            eliminationType: 'REVENUE_EXPENSE',
            subAccountId1: lines[0]?.JournalEntry?.subAccountId ?? '',
            subAccountId2: lines[1]?.JournalEntry?.subAccountId ?? '',
            accountCode1: lines[0]?.Account?.code ?? '',
            accountCode2: lines[1]?.Account?.code ?? '',
            amount: totalDebit,
            description: `IC Elimination: ${ref}`,
            isAutoGenerated: true,
            createdBy: context.userId,
          },
        })
        detected++
      }
    }

    return { success: true, data: { detected } }
  } catch (error) {
    console.error('Error detecting intercompany transactions:', error)
    return { success: false, error: 'Failed to detect intercompany transactions' }
  }
}

// ========== Finalize Consolidation ==========

/**
 * Finalize consolidation snapshot
 */
export const finalizeConsolidation = async (
  snapshotId: string
): Promise<ActionResult<any>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'fi.general_ledger.consolidation.manage')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const snapshot = await db.consolidationSnapshot.findUnique({
      where: { id: snapshotId },
      include: {
        WorksheetLines: true,
        Adjustments: true,
        Eliminations: true,
      },
    })

    if (!snapshot) {
      return { success: false, error: 'Snapshot not found' }
    }

    // Calculate consolidated totals from worksheet lines
    let totalAssets = new Decimal(0)
    let totalLiabilities = new Decimal(0)
    let totalEquity = new Decimal(0)
    let totalRevenue = new Decimal(0)
    let totalExpenses = new Decimal(0)

    for (const line of snapshot.WorksheetLines) {
      const amount = new Decimal(line.consolidatedBalance)
      // TODO: Look up account type to categorize properly
    }

    // Apply adjustments
    for (const adj of snapshot.Adjustments) {
      // Apply to totals based on adjustment type
      totalAssets = totalAssets.plus(new Decimal(adj.amount))
    }

    // Apply eliminations
    for (const elim of snapshot.Eliminations) {
      // Reduce intercompany amounts
      totalAssets = totalAssets.minus(new Decimal(elim.amount))
    }

    // Update consolidated balances
    const consolidatedBalances = {
      assets: totalAssets.toNumber(),
      liabilities: totalLiabilities.toNumber(),
      equity: totalEquity.toNumber(),
      revenue: totalRevenue.toNumber(),
      expenses: totalExpenses.toNumber(),
    }

    const updated = await db.consolidationSnapshot.update({
      where: { id: snapshotId },
      data: {
        status: ConsolidationStatus.APPROVED,
        consolidatedBalances,
      },
    })

    await logGLAudit({
      action: 'UPDATE',
      entityType: 'ConsolidationSnapshot',
      entityId: snapshotId,
      agencyId: context.agencyId,
      description: 'Finalized consolidation snapshot',
    })

    revalidatePath(`/agency/${context.agencyId}/fi/general-ledger/consolidation`)

    return { success: true, data: updated }
  } catch (error) {
    console.error('Error finalizing consolidation:', error)
    return { success: false, error: 'Failed to finalize consolidation' }
  }
}
