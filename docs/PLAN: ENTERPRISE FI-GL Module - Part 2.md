# PLAN: Enterprise FI-GL Module - Part 2

> **Version:** 1.0.0  
> **Created:** 2026-01-16  
> **Status:** Implementation Ready  
> **Continues From:** PLAN: ENTERPRISE FI-GL Module.md

---

## Table of Contents (Part 2)

1. [Reconciliation Server Actions](#1-reconciliation-server-actions)
2. [Consolidation Server Actions](#2-consolidation-server-actions)
3. [Posting Rules Server Actions](#3-posting-rules-server-actions)
4. [GL Configuration Server Actions](#4-gl-configuration-server-actions)
5. [COA Templates & Setup Wizard](#5-coa-templates--setup-wizard)
6. [Report Generation Server Actions](#6-report-generation-server-actions)
7. [Reconciliation UI Components](#7-reconciliation-ui-components)
8. [Consolidation UI Components](#8-consolidation-ui-components)
9. [Settings UI Components](#9-settings-ui-components)
10. [Setup Wizard UI](#10-setup-wizard-ui)
11. [Additional Seed Scripts](#11-additional-seed-scripts)
12. [Utility Functions](#12-utility-functions)

---

## 1. Reconciliation Server Actions

### 1.1 Core Reconciliation Actions

```typescript
// src/lib/finance/gl/actions/reconciliation.ts

'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { hasAgencyPermission, hasSubAccountPermission } from '@/lib/iam/authz/permissions'
import {
  createReconciliationSchema,
  reconciliationItemSchema,
  matchItemsSchema,
  reconciliationRuleSchema,
  type CreateReconciliationInput,
  type ReconciliationItemInput,
  type ReconciliationRuleInput,
} from '@/lib/schemas/finance/gl/reconciliation'
import { logGLAudit } from './audit'
import { ReconciliationStatus, ReconciliationItemStatus, Prisma } from '@/generated/prisma/client'

// ========== Types ==========

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

type ReconciliationContext = {
  agencyId?: string
  subAccountId?: string
  userId: string
}

// ========== Helper Functions ==========

const getContext = async (): Promise<ReconciliationContext | null> => {
  const session = await auth()
  if (!session?.user?.id) return null

  const dbSession = await db.session.findFirst({
    where: { userId: session.user.id },
    select: { activeAgencyId: true, activeSubAccountId: true },
  })

  return {
    userId: session.user.id,
    agencyId: dbSession?.activeAgencyId ?? undefined,
    subAccountId: dbSession?.activeSubAccountId ?? undefined,
  }
}

const checkPermission = async (
  context: ReconciliationContext,
  permissionKey: string
): Promise<boolean> => {
  if (context.subAccountId) {
    return hasSubAccountPermission(context.subAccountId, permissionKey)
  }
  if (context.agencyId) {
    return hasAgencyPermission(context.agencyId, permissionKey)
  }
  return false
}

const generateReconciliationNumber = async (
  agencyId?: string,
  subAccountId?: string
): Promise<string> => {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  
  const count = await db.reconciliation.count({
    where: {
      ...(subAccountId ? { subAccountId } : { agencyId, subAccountId: null }),
      createdAt: {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      },
    },
  })

  const sequence = (count + 1).toString().padStart(5, '0')
  const prefix = subAccountId ? 'SREC' : 'REC'
  return `${prefix}-${year}${month}-${sequence}`
}

// ========== CRUD Operations ==========

export const createReconciliation = async (
  input: CreateReconciliationInput
): Promise<ActionResult<{ id: string; reconciliationNumber: string }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.reconciliation.create')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.reconciliation.create' }
    }

    const validated = createReconciliationSchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const data = validated.data

    // Verify account exists and belongs to context
    const account = await db.chartOfAccount.findFirst({
      where: {
        id: data.accountId,
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId, subAccountId: null }),
      },
    })

    if (!account) {
      return { success: false, error: 'Account not found or access denied' }
    }

    // Verify period exists
    const period = await db.financialPeriod.findUnique({
      where: { id: data.periodId },
    })

    if (!period) {
      return { success: false, error: 'Financial period not found' }
    }

    // Check for existing open reconciliation for this account/period
    const existingRecon = await db.reconciliation.findFirst({
      where: {
        accountId: data.accountId,
        periodId: data.periodId,
        status: { in: [ReconciliationStatus.IN_PROGRESS, ReconciliationStatus.PENDING_REVIEW] },
      },
    })

    if (existingRecon) {
      return { success: false, error: 'An open reconciliation already exists for this account and period' }
    }

    const reconciliationNumber = await generateReconciliationNumber(
      context.agencyId,
      context.subAccountId
    )

    // Get account balance for the period
    const accountBalance = await db.accountBalance.findUnique({
      where: {
        accountId_periodId: { accountId: data.accountId, periodId: data.periodId },
      },
    })

    const reconciliation = await db.reconciliation.create({
      data: {
        reconciliationNumber,
        accountId: data.accountId,
        periodId: data.periodId,
        reconciliationDate: data.reconciliationDate,
        statementBalance: data.statementBalance,
        bookBalance: accountBalance?.closingBalance ?? 0,
        difference: (data.statementBalance ?? 0) - (accountBalance?.closingBalance ?? 0),
        status: ReconciliationStatus.IN_PROGRESS,
        notes: data.notes,
        createdBy: context.userId,
        agencyId: context.agencyId ?? null,
        subAccountId: context.subAccountId ?? null,
      },
    })

    // Audit log
    await logGLAudit({
      action: 'CREATE',
      entityType: 'Reconciliation',
      entityId: reconciliation.id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Created reconciliation: ${reconciliationNumber} for account ${account.code}`,
    })

    revalidatePath(`/agency/${context.agencyId}/finance/gl/reconciliation`)

    return {
      success: true,
      data: { id: reconciliation.id, reconciliationNumber },
    }
  } catch (error) {
    console.error('Error creating reconciliation:', error)
    return { success: false, error: 'Failed to create reconciliation' }
  }
}

export const addReconciliationItem = async (
  reconciliationId: string,
  input: ReconciliationItemInput
): Promise<ActionResult<{ id: string }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.reconciliation.create')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const validated = reconciliationItemSchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const data = validated.data

    // Verify reconciliation exists and is in progress
    const reconciliation = await db.reconciliation.findFirst({
      where: {
        id: reconciliationId,
        status: ReconciliationStatus.IN_PROGRESS,
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId }),
      },
    })

    if (!reconciliation) {
      return { success: false, error: 'Reconciliation not found or not in progress' }
    }

    const item = await db.reconciliationItem.create({
      data: {
        reconciliationId,
        itemType: data.itemType,
        transactionDate: data.transactionDate,
        reference: data.reference,
        description: data.description,
        amount: data.amount,
        status: ReconciliationItemStatus.UNMATCHED,
        notes: data.notes,
      },
    })

    // Update reconciliation totals
    await updateReconciliationTotals(reconciliationId)

    return { success: true, data: { id: item.id } }
  } catch (error) {
    console.error('Error adding reconciliation item:', error)
    return { success: false, error: 'Failed to add reconciliation item' }
  }
}

export const matchItems = async (
  input: { reconciliationId: string; itemIds: string[] }
): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.reconciliation.execute')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const validated = matchItemsSchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const { reconciliationId, itemIds } = validated.data

    // Verify reconciliation is in progress
    const reconciliation = await db.reconciliation.findFirst({
      where: {
        id: reconciliationId,
        status: ReconciliationStatus.IN_PROGRESS,
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId }),
      },
    })

    if (!reconciliation) {
      return { success: false, error: 'Reconciliation not found or not in progress' }
    }

    // Get items to match
    const items = await db.reconciliationItem.findMany({
      where: {
        id: { in: itemIds },
        reconciliationId,
        status: ReconciliationItemStatus.UNMATCHED,
      },
    })

    if (items.length !== itemIds.length) {
      return { success: false, error: 'Some items not found or already matched' }
    }

    // Verify items balance (book items should net against statement items)
    const bookTotal = items
      .filter((i) => i.itemType === 'BOOK')
      .reduce((sum, i) => sum + Number(i.amount), 0)
    const statementTotal = items
      .filter((i) => i.itemType === 'STATEMENT')
      .reduce((sum, i) => sum + Number(i.amount), 0)

    if (Math.abs(bookTotal - statementTotal) > 0.01) {
      return {
        success: false,
        error: `Items do not balance. Book: ${bookTotal}, Statement: ${statementTotal}`,
      }
    }

    // Create match group (use first item as the anchor)
    const matchGroupId = items[0].id

    await db.$transaction(async (tx) => {
      for (const item of items) {
        await tx.reconciliationItem.update({
          where: { id: item.id },
          data: {
            status: ReconciliationItemStatus.MATCHED,
            matchedItemId: matchGroupId,
            matchedAt: new Date(),
          },
        })
      }
    })

    // Update totals
    await updateReconciliationTotals(reconciliationId)

    // Audit log
    await logGLAudit({
      action: 'RECONCILE',
      entityType: 'ReconciliationItem',
      entityId: matchGroupId,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Matched ${items.length} items in reconciliation ${reconciliation.reconciliationNumber}`,
    })

    return { success: true }
  } catch (error) {
    console.error('Error matching items:', error)
    return { success: false, error: 'Failed to match items' }
  }
}

export const unmatchItem = async (
  itemId: string
): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.reconciliation.execute')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const item = await db.reconciliationItem.findUnique({
      where: { id: itemId },
      include: { Reconciliation: true },
    })

    if (!item) {
      return { success: false, error: 'Item not found' }
    }

    if (item.Reconciliation.status !== ReconciliationStatus.IN_PROGRESS) {
      return { success: false, error: 'Reconciliation is not in progress' }
    }

    // Unmatch all items in the same match group
    const matchGroupId = item.matchedItemId || item.id

    await db.reconciliationItem.updateMany({
      where: {
        OR: [
          { id: matchGroupId },
          { matchedItemId: matchGroupId },
        ],
      },
      data: {
        status: ReconciliationItemStatus.UNMATCHED,
        matchedItemId: null,
        matchedAt: null,
      },
    })

    await updateReconciliationTotals(item.reconciliationId)

    return { success: true }
  } catch (error) {
    console.error('Error unmatching item:', error)
    return { success: false, error: 'Failed to unmatch item' }
  }
}

export const markAsDiscrepancy = async (
  itemId: string,
  notes: string
): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.reconciliation.execute')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const item = await db.reconciliationItem.findUnique({
      where: { id: itemId },
      include: { Reconciliation: true },
    })

    if (!item) {
      return { success: false, error: 'Item not found' }
    }

    if (item.Reconciliation.status !== ReconciliationStatus.IN_PROGRESS) {
      return { success: false, error: 'Reconciliation is not in progress' }
    }

    await db.reconciliationItem.update({
      where: { id: itemId },
      data: {
        status: ReconciliationItemStatus.DISCREPANCY,
        notes,
      },
    })

    await updateReconciliationTotals(item.reconciliationId)

    return { success: true }
  } catch (error) {
    console.error('Error marking discrepancy:', error)
    return { success: false, error: 'Failed to mark as discrepancy' }
  }
}

// ========== Workflow Operations ==========

export const submitReconciliation = async (
  reconciliationId: string
): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.reconciliation.create')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const reconciliation = await db.reconciliation.findFirst({
      where: {
        id: reconciliationId,
        status: ReconciliationStatus.IN_PROGRESS,
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId }),
      },
      include: {
        items: true,
      },
    })

    if (!reconciliation) {
      return { success: false, error: 'Reconciliation not found or not in progress' }
    }

    // Check for unmatched items
    const unmatchedCount = reconciliation.items.filter(
      (i) => i.status === ReconciliationItemStatus.UNMATCHED
    ).length

    if (unmatchedCount > 0) {
      return {
        success: false,
        error: `Cannot submit: ${unmatchedCount} unmatched items remain`,
      }
    }

    await db.reconciliation.update({
      where: { id: reconciliationId },
      data: {
        status: ReconciliationStatus.PENDING_REVIEW,
        submittedAt: new Date(),
        submittedBy: context.userId,
      },
    })

    await logGLAudit({
      action: 'SUBMIT',
      entityType: 'Reconciliation',
      entityId: reconciliationId,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Submitted reconciliation ${reconciliation.reconciliationNumber} for review`,
    })

    revalidatePath(`/agency/${context.agencyId}/finance/gl/reconciliation`)

    return { success: true }
  } catch (error) {
    console.error('Error submitting reconciliation:', error)
    return { success: false, error: 'Failed to submit reconciliation' }
  }
}

export const approveReconciliation = async (
  reconciliationId: string,
  notes?: string
): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.reconciliation.approve')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const reconciliation = await db.reconciliation.findFirst({
      where: {
        id: reconciliationId,
        status: ReconciliationStatus.PENDING_REVIEW,
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId }),
      },
    })

    if (!reconciliation) {
      return { success: false, error: 'Reconciliation not found or not pending review' }
    }

    // Cannot approve own submission
    if (reconciliation.submittedBy === context.userId) {
      return { success: false, error: 'Cannot approve your own reconciliation' }
    }

    await db.reconciliation.update({
      where: { id: reconciliationId },
      data: {
        status: ReconciliationStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: context.userId,
        approvalNotes: notes,
      },
    })

    await logGLAudit({
      action: 'APPROVE',
      entityType: 'Reconciliation',
      entityId: reconciliationId,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Approved reconciliation ${reconciliation.reconciliationNumber}`,
    })

    revalidatePath(`/agency/${context.agencyId}/finance/gl/reconciliation`)

    return { success: true }
  } catch (error) {
    console.error('Error approving reconciliation:', error)
    return { success: false, error: 'Failed to approve reconciliation' }
  }
}

export const closeReconciliation = async (
  reconciliationId: string
): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.reconciliation.close')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const reconciliation = await db.reconciliation.findFirst({
      where: {
        id: reconciliationId,
        status: ReconciliationStatus.APPROVED,
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId }),
      },
    })

    if (!reconciliation) {
      return { success: false, error: 'Reconciliation not found or not approved' }
    }

    await db.reconciliation.update({
      where: { id: reconciliationId },
      data: {
        status: ReconciliationStatus.CLOSED,
        closedAt: new Date(),
        closedBy: context.userId,
      },
    })

    await logGLAudit({
      action: 'CLOSE',
      entityType: 'Reconciliation',
      entityId: reconciliationId,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Closed reconciliation ${reconciliation.reconciliationNumber}`,
    })

    revalidatePath(`/agency/${context.agencyId}/finance/gl/reconciliation`)

    return { success: true }
  } catch (error) {
    console.error('Error closing reconciliation:', error)
    return { success: false, error: 'Failed to close reconciliation' }
  }
}

// ========== Auto-Matching ==========

export const executeAutoMatch = async (
  reconciliationId: string
): Promise<ActionResult<{ matchedCount: number }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.reconciliation.execute')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const reconciliation = await db.reconciliation.findFirst({
      where: {
        id: reconciliationId,
        status: ReconciliationStatus.IN_PROGRESS,
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId }),
      },
      include: {
        items: {
          where: { status: ReconciliationItemStatus.UNMATCHED },
        },
      },
    })

    if (!reconciliation) {
      return { success: false, error: 'Reconciliation not found or not in progress' }
    }

    // Get active matching rules
    const rules = await db.reconciliationRule.findMany({
      where: {
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId }),
        isActive: true,
      },
      orderBy: { priority: 'asc' },
    })

    const bookItems = reconciliation.items.filter((i) => i.itemType === 'BOOK')
    const statementItems = reconciliation.items.filter((i) => i.itemType === 'STATEMENT')

    let matchedCount = 0

    // Try to match each book item with statement items
    for (const bookItem of bookItems) {
      for (const statementItem of statementItems) {
        // Skip if already matched
        if (
          bookItem.status !== ReconciliationItemStatus.UNMATCHED ||
          statementItem.status !== ReconciliationItemStatus.UNMATCHED
        ) {
          continue
        }

        // Apply matching rules
        let isMatch = false

        for (const rule of rules) {
          const ruleConfig = rule.matchingCriteria as {
            matchAmount?: boolean
            matchReference?: boolean
            matchDate?: boolean
            dateTolerance?: number
            amountTolerance?: number
          }

          let matches = true

          // Amount matching
          if (ruleConfig.matchAmount) {
            const tolerance = ruleConfig.amountTolerance || 0
            const diff = Math.abs(Number(bookItem.amount) - Number(statementItem.amount))
            if (diff > tolerance) matches = false
          }

          // Reference matching
          if (matches && ruleConfig.matchReference) {
            if (bookItem.reference !== statementItem.reference) matches = false
          }

          // Date matching
          if (matches && ruleConfig.matchDate) {
            const tolerance = ruleConfig.dateTolerance || 0
            const daysDiff = Math.abs(
              (bookItem.transactionDate.getTime() - statementItem.transactionDate.getTime()) /
                (1000 * 60 * 60 * 24)
            )
            if (daysDiff > tolerance) matches = false
          }

          if (matches) {
            isMatch = true
            break
          }
        }

        if (isMatch) {
          // Create match
          await db.$transaction(async (tx) => {
            await tx.reconciliationItem.update({
              where: { id: bookItem.id },
              data: {
                status: ReconciliationItemStatus.MATCHED,
                matchedItemId: statementItem.id,
                matchedAt: new Date(),
              },
            })
            await tx.reconciliationItem.update({
              where: { id: statementItem.id },
              data: {
                status: ReconciliationItemStatus.MATCHED,
                matchedItemId: bookItem.id,
                matchedAt: new Date(),
              },
            })
          })

          matchedCount++
          break // Move to next book item
        }
      }
    }

    await updateReconciliationTotals(reconciliationId)

    await logGLAudit({
      action: 'RECONCILE',
      entityType: 'Reconciliation',
      entityId: reconciliationId,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Auto-matched ${matchedCount} items in reconciliation ${reconciliation.reconciliationNumber}`,
    })

    return { success: true, data: { matchedCount } }
  } catch (error) {
    console.error('Error executing auto-match:', error)
    return { success: false, error: 'Failed to execute auto-match' }
  }
}

// ========== Query Operations ==========

export const getReconciliations = async (options?: {
  accountId?: string
  periodId?: string
  status?: ReconciliationStatus
  page?: number
  pageSize?: number
}): Promise<ActionResult<{ reconciliations: any[]; total: number }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.reconciliation.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const page = options?.page || 1
    const pageSize = options?.pageSize || 20
    const skip = (page - 1) * pageSize

    const where: Prisma.ReconciliationWhereInput = {
      ...(context.subAccountId
        ? { subAccountId: context.subAccountId }
        : { agencyId: context.agencyId, subAccountId: null }),
      ...(options?.accountId ? { accountId: options.accountId } : {}),
      ...(options?.periodId ? { periodId: options.periodId } : {}),
      ...(options?.status ? { status: options.status } : {}),
    }

    const [reconciliations, total] = await Promise.all([
      db.reconciliation.findMany({
        where,
        include: {
          Account: { select: { code: true, name: true } },
          Period: { select: { name: true, fiscalYear: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      db.reconciliation.count({ where }),
    ])

    return { success: true, data: { reconciliations, total } }
  } catch (error) {
    console.error('Error fetching reconciliations:', error)
    return { success: false, error: 'Failed to fetch reconciliations' }
  }
}

export const getReconciliationById = async (
  id: string
): Promise<ActionResult<any>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.reconciliation.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const reconciliation = await db.reconciliation.findFirst({
      where: {
        id,
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId }),
      },
      include: {
        Account: true,
        Period: true,
        items: {
          orderBy: [{ transactionDate: 'asc' }, { createdAt: 'asc' }],
        },
        CreatedByUser: { select: { id: true, name: true, email: true } },
        SubmittedByUser: { select: { id: true, name: true, email: true } },
        ApprovedByUser: { select: { id: true, name: true, email: true } },
      },
    })

    if (!reconciliation) {
      return { success: false, error: 'Reconciliation not found' }
    }

    return { success: true, data: reconciliation }
  } catch (error) {
    console.error('Error fetching reconciliation:', error)
    return { success: false, error: 'Failed to fetch reconciliation' }
  }
}

// ========== Helper Functions ==========

const updateReconciliationTotals = async (reconciliationId: string): Promise<void> => {
  const items = await db.reconciliationItem.findMany({
    where: { reconciliationId },
  })

  const matchedAmount = items
    .filter((i) => i.status === ReconciliationItemStatus.MATCHED)
    .reduce((sum, i) => sum + Math.abs(Number(i.amount)), 0)

  const unmatchedAmount = items
    .filter((i) => i.status === ReconciliationItemStatus.UNMATCHED)
    .reduce((sum, i) => sum + Math.abs(Number(i.amount)), 0)

  const discrepancyAmount = items
    .filter((i) => i.status === ReconciliationItemStatus.DISCREPANCY)
    .reduce((sum, i) => sum + Math.abs(Number(i.amount)), 0)

  await db.reconciliation.update({
    where: { id: reconciliationId },
    data: {
      matchedAmount,
      unmatchedAmount,
      discrepancyAmount,
      updatedAt: new Date(),
    },
  })
}
```

### 1.2 Reconciliation Rules Management

```typescript
// src/lib/finance/gl/actions/reconciliation-rules.ts

'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { hasAgencyPermission, hasSubAccountPermission } from '@/lib/iam/authz/permissions'
import {
  reconciliationRuleSchema,
  type ReconciliationRuleInput,
} from '@/lib/schemas/finance/gl/reconciliation'
import { logGLAudit } from './audit'

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

export const createReconciliationRule = async (
  input: ReconciliationRuleInput
): Promise<ActionResult<{ id: string }>> => {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const dbSession = await db.session.findFirst({
      where: { userId: session.user.id },
      select: { activeAgencyId: true, activeSubAccountId: true },
    })

    const agencyId = dbSession?.activeAgencyId
    const subAccountId = dbSession?.activeSubAccountId

    // Check permission
    if (subAccountId) {
      const hasPermission = await hasSubAccountPermission(
        subAccountId,
        'finance.gl.reconciliation.create'
      )
      if (!hasPermission) {
        return { success: false, error: 'Unauthorized' }
      }
    } else if (agencyId) {
      const hasPermission = await hasAgencyPermission(
        agencyId,
        'finance.gl.reconciliation.create'
      )
      if (!hasPermission) {
        return { success: false, error: 'Unauthorized' }
      }
    }

    const validated = reconciliationRuleSchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const data = validated.data

    const rule = await db.reconciliationRule.create({
      data: {
        name: data.name,
        description: data.description,
        matchingCriteria: data.matchingCriteria as any,
        priority: data.priority,
        isActive: data.isActive,
        agencyId: agencyId ?? null,
        subAccountId: subAccountId ?? null,
      },
    })

    await logGLAudit({
      action: 'CREATE',
      entityType: 'ReconciliationRule',
      entityId: rule.id,
      agencyId,
      subAccountId,
      description: `Created reconciliation rule: ${data.name}`,
    })

    return { success: true, data: { id: rule.id } }
  } catch (error) {
    console.error('Error creating reconciliation rule:', error)
    return { success: false, error: 'Failed to create reconciliation rule' }
  }
}

export const updateReconciliationRule = async (
  id: string,
  input: Partial<ReconciliationRuleInput>
): Promise<ActionResult<void>> => {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const dbSession = await db.session.findFirst({
      where: { userId: session.user.id },
      select: { activeAgencyId: true, activeSubAccountId: true },
    })

    const rule = await db.reconciliationRule.findFirst({
      where: {
        id,
        ...(dbSession?.activeSubAccountId
          ? { subAccountId: dbSession.activeSubAccountId }
          : { agencyId: dbSession?.activeAgencyId }),
      },
    })

    if (!rule) {
      return { success: false, error: 'Rule not found' }
    }

    await db.reconciliationRule.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        matchingCriteria: input.matchingCriteria as any,
        priority: input.priority,
        isActive: input.isActive,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Error updating reconciliation rule:', error)
    return { success: false, error: 'Failed to update reconciliation rule' }
  }
}

export const deleteReconciliationRule = async (
  id: string
): Promise<ActionResult<void>> => {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const dbSession = await db.session.findFirst({
      where: { userId: session.user.id },
      select: { activeAgencyId: true, activeSubAccountId: true },
    })

    const rule = await db.reconciliationRule.findFirst({
      where: {
        id,
        ...(dbSession?.activeSubAccountId
          ? { subAccountId: dbSession.activeSubAccountId }
          : { agencyId: dbSession?.activeAgencyId }),
      },
    })

    if (!rule) {
      return { success: false, error: 'Rule not found' }
    }

    await db.reconciliationRule.delete({ where: { id } })

    return { success: true }
  } catch (error) {
    console.error('Error deleting reconciliation rule:', error)
    return { success: false, error: 'Failed to delete reconciliation rule' }
  }
}

export const getReconciliationRules = async (): Promise<ActionResult<any[]>> => {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const dbSession = await db.session.findFirst({
      where: { userId: session.user.id },
      select: { activeAgencyId: true, activeSubAccountId: true },
    })

    const rules = await db.reconciliationRule.findMany({
      where: {
        ...(dbSession?.activeSubAccountId
          ? { subAccountId: dbSession.activeSubAccountId }
          : { agencyId: dbSession?.activeAgencyId }),
      },
      orderBy: { priority: 'asc' },
    })

    return { success: true, data: rules }
  } catch (error) {
    console.error('Error fetching reconciliation rules:', error)
    return { success: false, error: 'Failed to fetch reconciliation rules' }
  }
}
```

---

## 2. Consolidation Server Actions

### 2.1 Core Consolidation Actions

```typescript
// src/lib/finance/gl/actions/consolidation.ts

'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { hasAgencyPermission } from '@/lib/iam/authz/permissions'
import {
  createConsolidationSnapshotSchema,
  consolidationAdjustmentSchema,
  intercompanyEliminationSchema,
  subAccountOwnershipSchema,
  type CreateConsolidationSnapshotInput,
  type ConsolidationAdjustmentInput,
  type IntercompanyEliminationInput,
  type SubAccountOwnershipInput,
} from '@/lib/schemas/finance/gl/consolidation'
import { logGLAudit } from './audit'
import {
  ConsolidationStatus,
  ConsolidationMethod,
  JournalEntryStatus,
  JournalEntryType,
  Prisma,
} from '@/generated/prisma/client'

// ========== Types ==========

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

type ConsolidationContext = {
  agencyId: string
  userId: string
}

// ========== Helper Functions ==========

const getContext = async (): Promise<ConsolidationContext | null> => {
  const session = await auth()
  if (!session?.user?.id) return null

  const dbSession = await db.session.findFirst({
    where: { userId: session.user.id },
    select: { activeAgencyId: true },
  })

  if (!dbSession?.activeAgencyId) return null

  return {
    userId: session.user.id,
    agencyId: dbSession.activeAgencyId,
  }
}

const checkPermission = async (
  agencyId: string,
  permissionKey: string
): Promise<boolean> => {
  return hasAgencyPermission(agencyId, permissionKey)
}

// ========== Snapshot Management ==========

export const createConsolidationSnapshot = async (
  input: CreateConsolidationSnapshotInput
): Promise<ActionResult<{ id: string }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No agency context found' }
    }

    const hasPermission = await checkPermission(context.agencyId, 'finance.gl.consolidation.create')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.consolidation.create' }
    }

    const validated = createConsolidationSnapshotSchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const data = validated.data

    // Verify period exists and belongs to agency
    const period = await db.financialPeriod.findFirst({
      where: {
        id: data.periodId,
        agencyId: context.agencyId,
        subAccountId: null, // Agency-level period
      },
    })

    if (!period) {
      return { success: false, error: 'Financial period not found' }
    }

    // Verify all subaccounts exist and belong to agency
    const subAccounts = await db.subAccount.findMany({
      where: {
        id: { in: data.subAccountIds },
        agencyId: context.agencyId,
      },
    })

    if (subAccounts.length !== data.subAccountIds.length) {
      return { success: false, error: 'Some subaccounts not found' }
    }

    // Get current version for this period
    const existingSnapshots = await db.consolidationSnapshot.count({
      where: {
        agencyId: context.agencyId,
        periodId: data.periodId,
      },
    })

    const snapshot = await db.$transaction(async (tx) => {
      const created = await tx.consolidationSnapshot.create({
        data: {
          agencyId: context.agencyId,
          periodId: data.periodId,
          consolidationMethod: data.consolidationMethod || ConsolidationMethod.FULL,
          includeIntercompanyElim: data.includeIntercompanyElim ?? true,
          version: existingSnapshots + 1,
          status: ConsolidationStatus.DRAFT,
          notes: data.notes,
          createdBy: context.userId,
        },
      })

      // Link subaccounts to snapshot
      await tx.consolidationSnapshotSubAccount.createMany({
        data: data.subAccountIds.map((subAccountId) => ({
          snapshotId: created.id,
          subAccountId,
        })),
      })

      return created
    })

    await logGLAudit({
      action: 'CREATE',
      entityType: 'ConsolidationSnapshot',
      entityId: snapshot.id,
      agencyId: context.agencyId,
      description: `Created consolidation snapshot v${snapshot.version} for period ${period.name}`,
    })

    revalidatePath(`/agency/${context.agencyId}/finance/gl/consolidation`)

    return { success: true, data: { id: snapshot.id } }
  } catch (error) {
    console.error('Error creating consolidation snapshot:', error)
    return { success: false, error: 'Failed to create consolidation snapshot' }
  }
}

export const executeConsolidation = async (
  snapshotId: string
): Promise<ActionResult<{ consolidatedAccounts: number; eliminationsApplied: number }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No agency context found' }
    }

    const hasPermission = await checkPermission(context.agencyId, 'finance.gl.consolidation.execute')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    // Get snapshot with related data
    const snapshot = await db.consolidationSnapshot.findFirst({
      where: {
        id: snapshotId,
        agencyId: context.agencyId,
        status: ConsolidationStatus.DRAFT,
      },
      include: {
        Period: true,
        SubAccounts: {
          include: { SubAccount: true },
        },
      },
    })

    if (!snapshot) {
      return { success: false, error: 'Snapshot not found or not in draft status' }
    }

    const subAccountIds = snapshot.SubAccounts.map((sa) => sa.subAccountId)

    const result = await db.$transaction(async (tx) => {
      // Step 1: Get all consolidation-enabled balances from subaccounts
      const subAccountBalances = await tx.accountBalance.findMany({
        where: {
          periodId: snapshot.periodId,
          Account: {
            subAccountId: { in: subAccountIds },
            isConsolidationEnabled: true,
          },
        },
        include: {
          Account: {
            include: {
              ConsolidationMappings: {
                where: { agencyId: context.agencyId },
                include: { GroupCOA: true },
              },
            },
          },
        },
      })

      // Step 2: Get ownership percentages
      const ownerships = await tx.subAccountOwnership.findMany({
        where: {
          agencyId: context.agencyId,
          subAccountId: { in: subAccountIds },
          effectiveFrom: { lte: snapshot.Period.endDate },
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: snapshot.Period.startDate } },
          ],
        },
      })

      const ownershipMap = new Map(ownerships.map((o) => [o.subAccountId, o]))

      // Step 3: Consolidate balances to group COA
      const consolidatedBalances: Map<string, {
        groupCOAId: string
        amount: number
        subAccountContributions: { subAccountId: string; amount: number }[]
      }> = new Map()

      for (const balance of subAccountBalances) {
        const mapping = balance.Account.ConsolidationMappings[0]
        if (!mapping) continue // Skip unmapped accounts

        const ownership = ownershipMap.get(balance.Account.subAccountId!)
        const ownershipPct = ownership?.ownershipPercentage ?? 100

        let consolidatedAmount = Number(balance.closingBalance)

        // Apply consolidation method
        if (snapshot.consolidationMethod === ConsolidationMethod.PROPORTIONAL) {
          consolidatedAmount = consolidatedAmount * (ownershipPct / 100)
        } else if (snapshot.consolidationMethod === ConsolidationMethod.EQUITY) {
          // Equity method: only include equity accounts at ownership %
          if (balance.Account.accountType !== 'EQUITY') continue
          consolidatedAmount = consolidatedAmount * (ownershipPct / 100)
        }

        const groupCOAId = mapping.groupCOAId
        const existing = consolidatedBalances.get(groupCOAId)

        if (existing) {
          existing.amount += consolidatedAmount
          existing.subAccountContributions.push({
            subAccountId: balance.Account.subAccountId!,
            amount: consolidatedAmount,
          })
        } else {
          consolidatedBalances.set(groupCOAId, {
            groupCOAId,
            amount: consolidatedAmount,
            subAccountContributions: [{
              subAccountId: balance.Account.subAccountId!,
              amount: consolidatedAmount,
            }],
          })
        }

        // Create worksheet line
        await tx.consolidationWorksheetLine.create({
          data: {
            snapshotId,
            subAccountId: balance.Account.subAccountId!,
            localAccountCode: balance.Account.code,
            groupCOAId,
            originalAmount: balance.closingBalance,
            ownershipPercent: ownershipPct,
            adjustedAmount: consolidatedAmount,
          },
        })
      }

      // Step 4: Apply intercompany eliminations if enabled
      let eliminationsApplied = 0

      if (snapshot.includeIntercompanyElim) {
        // Find intercompany transactions between included subaccounts
        const intercompanyLines = await tx.journalEntryLine.findMany({
          where: {
            isIntercompany: true,
            intercompanySubAccountId: { in: subAccountIds },
            JournalEntry: {
              subAccountId: { in: subAccountIds },
              periodId: snapshot.periodId,
              status: JournalEntryStatus.POSTED,
            },
          },
          include: {
            Account: true,
            JournalEntry: true,
          },
        })

        // Group intercompany transactions for elimination
        const eliminations: Map<string, {
          subAccount1Id: string
          subAccount2Id: string
          amount: number
          debitAccountCode: string
          creditAccountCode: string
        }> = new Map()

        for (const line of intercompanyLines) {
          const key = [
            line.JournalEntry.subAccountId,
            line.intercompanySubAccountId,
          ].sort().join('|')

          const existing = eliminations.get(key)
          const amount = line.localDebitAmount || line.localCreditAmount

          if (existing) {
            existing.amount += Number(amount)
          } else {
            eliminations.set(key, {
              subAccount1Id: line.JournalEntry.subAccountId!,
              subAccount2Id: line.intercompanySubAccountId!,
              amount: Number(amount),
              debitAccountCode: line.Account.code,
              creditAccountCode: line.Account.code,
            })
          }
        }

        // Create elimination entries
        for (const [_, elim] of eliminations) {
          await tx.intercompanyElimination.create({
            data: {
              snapshotId,
              subAccountId1: elim.subAccount1Id,
              subAccountId2: elim.subAccount2Id,
              eliminationAmount: elim.amount,
              debitAccountCode: elim.debitAccountCode,
              creditAccountCode: elim.creditAccountCode,
              status: 'PENDING',
              createdBy: context.userId,
            },
          })
          eliminationsApplied++
        }
      }

      // Step 5: Save consolidated balances
      for (const [groupCOAId, data] of consolidatedBalances) {
        await tx.consolidatedBalance.create({
          data: {
            snapshotId,
            groupCOAId,
            consolidatedAmount: data.amount,
          },
        })
      }

      // Step 6: Update snapshot status
      await tx.consolidationSnapshot.update({
        where: { id: snapshotId },
        data: {
          status: ConsolidationStatus.PENDING_REVIEW,
          executedAt: new Date(),
          executedBy: context.userId,
        },
      })

      return {
        consolidatedAccounts: consolidatedBalances.size,
        eliminationsApplied,
      }
    })

    await logGLAudit({
      action: 'CONSOLIDATE',
      entityType: 'ConsolidationSnapshot',
      entityId: snapshotId,
      agencyId: context.agencyId,
      description: `Executed consolidation: ${result.consolidatedAccounts} accounts, ${result.eliminationsApplied} eliminations`,
    })

    revalidatePath(`/agency/${context.agencyId}/finance/gl/consolidation`)

    return { success: true, data: result }
  } catch (error) {
    console.error('Error executing consolidation:', error)
    return { success: false, error: 'Failed to execute consolidation' }
  }
}

export const approveConsolidation = async (
  snapshotId: string,
  notes?: string
): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No agency context found' }
    }

    const hasPermission = await checkPermission(context.agencyId, 'finance.gl.consolidation.approve')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const snapshot = await db.consolidationSnapshot.findFirst({
      where: {
        id: snapshotId,
        agencyId: context.agencyId,
        status: ConsolidationStatus.PENDING_REVIEW,
      },
    })

    if (!snapshot) {
      return { success: false, error: 'Snapshot not found or not pending review' }
    }

    // Cannot approve own work
    if (snapshot.executedBy === context.userId) {
      return { success: false, error: 'Cannot approve your own consolidation' }
    }

    // Mark any previous approved snapshots as superseded
    await db.consolidationSnapshot.updateMany({
      where: {
        agencyId: context.agencyId,
        periodId: snapshot.periodId,
        status: ConsolidationStatus.APPROVED,
        id: { not: snapshotId },
      },
      data: { status: ConsolidationStatus.SUPERSEDED },
    })

    await db.consolidationSnapshot.update({
      where: { id: snapshotId },
      data: {
        status: ConsolidationStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: context.userId,
        approvalNotes: notes,
      },
    })

    await logGLAudit({
      action: 'APPROVE',
      entityType: 'ConsolidationSnapshot',
      entityId: snapshotId,
      agencyId: context.agencyId,
      description: `Approved consolidation snapshot v${snapshot.version}`,
    })

    revalidatePath(`/agency/${context.agencyId}/finance/gl/consolidation`)

    return { success: true }
  } catch (error) {
    console.error('Error approving consolidation:', error)
    return { success: false, error: 'Failed to approve consolidation' }
  }
}

export const rejectConsolidation = async (
  snapshotId: string,
  reason: string
): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No agency context found' }
    }

    const hasPermission = await checkPermission(context.agencyId, 'finance.gl.consolidation.approve')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const snapshot = await db.consolidationSnapshot.findFirst({
      where: {
        id: snapshotId,
        agencyId: context.agencyId,
        status: ConsolidationStatus.PENDING_REVIEW,
      },
    })

    if (!snapshot) {
      return { success: false, error: 'Snapshot not found or not pending review' }
    }

    await db.consolidationSnapshot.update({
      where: { id: snapshotId },
      data: {
        status: ConsolidationStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedBy: context.userId,
        rejectionReason: reason,
      },
    })

    await logGLAudit({
      action: 'REJECT',
      entityType: 'ConsolidationSnapshot',
      entityId: snapshotId,
      agencyId: context.agencyId,
      description: `Rejected consolidation snapshot v${snapshot.version}: ${reason}`,
    })

    revalidatePath(`/agency/${context.agencyId}/finance/gl/consolidation`)

    return { success: true }
  } catch (error) {
    console.error('Error rejecting consolidation:', error)
    return { success: false, error: 'Failed to reject consolidation' }
  }
}

export const rollbackConsolidation = async (
  snapshotId: string
): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No agency context found' }
    }

    const hasPermission = await checkPermission(context.agencyId, 'finance.gl.consolidation.rollback')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const snapshot = await db.consolidationSnapshot.findFirst({
      where: {
        id: snapshotId,
        agencyId: context.agencyId,
        status: { in: [ConsolidationStatus.PENDING_REVIEW, ConsolidationStatus.REJECTED] },
      },
    })

    if (!snapshot) {
      return { success: false, error: 'Snapshot not found or cannot be rolled back' }
    }

    await db.$transaction(async (tx) => {
      // Delete all related data
      await tx.consolidatedBalance.deleteMany({ where: { snapshotId } })
      await tx.consolidationWorksheetLine.deleteMany({ where: { snapshotId } })
      await tx.intercompanyElimination.deleteMany({ where: { snapshotId } })
      await tx.consolidationAdjustment.deleteMany({ where: { snapshotId } })

      // Reset snapshot to draft
      await tx.consolidationSnapshot.update({
        where: { id: snapshotId },
        data: {
          status: ConsolidationStatus.DRAFT,
          executedAt: null,
          executedBy: null,
          rejectedAt: null,
          rejectedBy: null,
          rejectionReason: null,
        },
      })
    })

    await logGLAudit({
      action: 'ROLLBACK',
      entityType: 'ConsolidationSnapshot',
      entityId: snapshotId,
      agencyId: context.agencyId,
      description: `Rolled back consolidation snapshot v${snapshot.version}`,
    })

    revalidatePath(`/agency/${context.agencyId}/finance/gl/consolidation`)

    return { success: true }
  } catch (error) {
    console.error('Error rolling back consolidation:', error)
    return { success: false, error: 'Failed to rollback consolidation' }
  }
}

// ========== Adjustment Operations ==========

export const addConsolidationAdjustment = async (
  input: ConsolidationAdjustmentInput
): Promise<ActionResult<{ id: string }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No agency context found' }
    }

    const hasPermission = await checkPermission(context.agencyId, 'finance.gl.consolidation.adjust')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const validated = consolidationAdjustmentSchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const data = validated.data

    const snapshot = await db.consolidationSnapshot.findFirst({
      where: {
        id: data.snapshotId,
        agencyId: context.agencyId,
        status: { in: [ConsolidationStatus.DRAFT, ConsolidationStatus.PENDING_REVIEW] },
      },
    })

    if (!snapshot) {
      return { success: false, error: 'Snapshot not found or cannot be adjusted' }
    }

    const adjustment = await db.consolidationAdjustment.create({
      data: {
        snapshotId: data.snapshotId,
        adjustmentType: data.adjustmentType,
        description: data.description,
        debitAccountCode: data.debitAccountCode,
        creditAccountCode: data.creditAccountCode,
        amount: data.amount,
        notes: data.notes,
        createdBy: context.userId,
      },
    })

    await logGLAudit({
      action: 'CREATE',
      entityType: 'ConsolidationAdjustment',
      entityId: adjustment.id,
      agencyId: context.agencyId,
      description: `Added consolidation adjustment: ${data.description}`,
    })

    return { success: true, data: { id: adjustment.id } }
  } catch (error) {
    console.error('Error adding consolidation adjustment:', error)
    return { success: false, error: 'Failed to add consolidation adjustment' }
  }
}

// ========== Ownership Management ==========

export const setSubAccountOwnership = async (
  input: SubAccountOwnershipInput
): Promise<ActionResult<{ id: string }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No agency context found' }
    }

    const hasPermission = await checkPermission(context.agencyId, 'finance.gl.consolidation.create')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const validated = subAccountOwnershipSchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const data = validated.data

    // Verify subaccount belongs to agency
    const subAccount = await db.subAccount.findFirst({
      where: {
        id: data.subAccountId,
        agencyId: context.agencyId,
      },
    })

    if (!subAccount) {
      return { success: false, error: 'SubAccount not found' }
    }

    // Close any existing open ownership record
    await db.subAccountOwnership.updateMany({
      where: {
        subAccountId: data.subAccountId,
        agencyId: context.agencyId,
        effectiveTo: null,
      },
      data: {
        effectiveTo: new Date(data.effectiveFrom.getTime() - 1),
      },
    })

    const ownership = await db.subAccountOwnership.create({
      data: {
        agencyId: context.agencyId,
        subAccountId: data.subAccountId,
        ownershipPercentage: data.ownershipPercentage,
        consolidationMethod: data.consolidationMethod,
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo,
        minorityInterestAccountCode: data.minorityInterestAccountCode,
        createdBy: context.userId,
      },
    })

    await logGLAudit({
      action: 'CREATE',
      entityType: 'SubAccountOwnership',
      entityId: ownership.id,
      agencyId: context.agencyId,
      description: `Set ownership for ${subAccount.name}: ${data.ownershipPercentage}%`,
    })

    return { success: true, data: { id: ownership.id } }
  } catch (error) {
    console.error('Error setting subaccount ownership:', error)
    return { success: false, error: 'Failed to set subaccount ownership' }
  }
}

// ========== Query Operations ==========

export const getConsolidationSnapshots = async (options?: {
  periodId?: string
  status?: ConsolidationStatus
}): Promise<ActionResult<any[]>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No agency context found' }
    }

    const hasPermission = await checkPermission(context.agencyId, 'finance.gl.consolidation.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const snapshots = await db.consolidationSnapshot.findMany({
      where: {
        agencyId: context.agencyId,
        ...(options?.periodId ? { periodId: options.periodId } : {}),
        ...(options?.status ? { status: options.status } : {}),
      },
      include: {
        Period: { select: { name: true, fiscalYear: true, fiscalPeriod: true } },
        SubAccounts: {
          include: { SubAccount: { select: { id: true, name: true } } },
        },
        _count: {
          select: {
            ConsolidatedBalances: true,
            WorksheetLines: true,
            Adjustments: true,
            Eliminations: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    })

    return { success: true, data: snapshots }
  } catch (error) {
    console.error('Error fetching consolidation snapshots:', error)
    return { success: false, error: 'Failed to fetch consolidation snapshots' }
  }
}

export const getConsolidationWorksheet = async (
  snapshotId: string
): Promise<ActionResult<any>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No agency context found' }
    }

    const hasPermission = await checkPermission(context.agencyId, 'finance.gl.consolidation.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const snapshot = await db.consolidationSnapshot.findFirst({
      where: {
        id: snapshotId,
        agencyId: context.agencyId,
      },
      include: {
        Period: true,
        SubAccounts: { include: { SubAccount: true } },
        WorksheetLines: {
          include: {
            SubAccount: { select: { id: true, name: true } },
            GroupCOA: { select: { id: true, code: true, name: true } },
          },
          orderBy: [{ GroupCOA: { code: 'asc' } }, { localAccountCode: 'asc' }],
        },
        ConsolidatedBalances: {
          include: {
            GroupCOA: { select: { code: true, name: true, accountType: true } },
          },
          orderBy: { GroupCOA: { code: 'asc' } },
        },
        Adjustments: {
          orderBy: { createdAt: 'asc' },
        },
        Eliminations: {
          include: {
            SubAccount1: { select: { name: true } },
            SubAccount2: { select: { name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!snapshot) {
      return { success: false, error: 'Snapshot not found' }
    }

    return { success: true, data: snapshot }
  } catch (error) {
    console.error('Error fetching consolidation worksheet:', error)
    return { success: false, error: 'Failed to fetch consolidation worksheet' }
  }
}

export const getConsolidatedBalances = async (
  snapshotId: string
): Promise<ActionResult<any[]>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No agency context found' }
    }

    const hasPermission = await checkPermission(context.agencyId, 'finance.gl.consolidation.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const balances = await db.consolidatedBalance.findMany({
      where: { snapshotId },
      include: {
        GroupCOA: {
          select: {
            id: true,
            code: true,
            name: true,
            accountType: true,
            category: true,
          },
        },
      },
      orderBy: { GroupCOA: { code: 'asc' } },
    })

    return { success: true, data: balances }
  } catch (error) {
    console.error('Error fetching consolidated balances:', error)
    return { success: false, error: 'Failed to fetch consolidated balances' }
  }
}

export const validateConsolidationMappings = async (): Promise<
  ActionResult<{ unmappedAccounts: any[]; invalidMappings: any[] }>
> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No agency context found' }
    }

    const hasPermission = await checkPermission(context.agencyId, 'finance.gl.consolidation.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    // Find all consolidation-enabled accounts without mappings
    const unmappedAccounts = await db.chartOfAccount.findMany({
      where: {
        SubAccount: { agencyId: context.agencyId },
        isConsolidationEnabled: true,
        ConsolidationMappings: { none: {} },
      },
      select: {
        id: true,
        code: true,
        name: true,
        accountType: true,
        SubAccount: { select: { name: true } },
      },
    })

    // Find invalid mappings (pointing to non-existent group COA)
    const invalidMappings = await db.consolidationMapping.findMany({
      where: {
        agencyId: context.agencyId,
        GroupCOA: null,
      },
      include: {
        LocalAccount: { select: { code: true, name: true } },
      },
    })

    return {
      success: true,
      data: { unmappedAccounts, invalidMappings },
    }
  } catch (error) {
    console.error('Error validating consolidation mappings:', error)
    return { success: false, error: 'Failed to validate consolidation mappings' }
  }
}
```

---

## 3. Posting Rules Server Actions

### 3.1 Core Posting Rules Actions

```typescript
// src/lib/finance/gl/actions/posting-rules.ts

'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { hasAgencyPermission, hasSubAccountPermission } from '@/lib/iam/authz/permissions'
import { logGLAudit } from './audit'
import { SourceModule, JournalEntryStatus, JournalEntryType, Prisma } from '@/generated/prisma/client'
import { z } from 'zod'

// ========== Types ==========

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

type PostingContext = {
  agencyId?: string
  subAccountId?: string
  userId: string
}

// ========== Validation Schemas ==========

const postingRuleSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  sourceModule: z.nativeEnum(SourceModule),
  conditions: z.record(z.any()).optional(),
  template: z.array(z.object({
    debitAccountCode: z.string(),
    creditAccountCode: z.string(),
    percentage: z.number().min(0).max(100).default(100),
    description: z.string().optional(),
  })).min(1),
  priority: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  autoPost: z.boolean().default(false),
})

const postingTemplateSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  template: z.array(z.object({
    lineNumber: z.number().int().min(1),
    debitAccountCode: z.string().optional(),
    creditAccountCode: z.string().optional(),
    percentage: z.number().min(0).max(100).default(100),
    description: z.string().optional(),
  })).min(2),
  isActive: z.boolean().default(true),
})

type PostingRuleInput = z.infer<typeof postingRuleSchema>
type PostingTemplateInput = z.infer<typeof postingTemplateSchema>

// ========== Helper Functions ==========

const getContext = async (): Promise<PostingContext | null> => {
  const session = await auth()
  if (!session?.user?.id) return null

  const dbSession = await db.session.findFirst({
    where: { userId: session.user.id },
    select: { activeAgencyId: true, activeSubAccountId: true },
  })

  return {
    userId: session.user.id,
    agencyId: dbSession?.activeAgencyId ?? undefined,
    subAccountId: dbSession?.activeSubAccountId ?? undefined,
  }
}

const checkPermission = async (
  context: PostingContext,
  permissionKey: string
): Promise<boolean> => {
  if (context.subAccountId) {
    return hasSubAccountPermission(context.subAccountId, permissionKey)
  }
  if (context.agencyId) {
    return hasAgencyPermission(context.agencyId, permissionKey)
  }
  return false
}

// ========== Posting Rule CRUD ==========

export const createPostingRule = async (
  input: PostingRuleInput
): Promise<ActionResult<{ id: string }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.posting.create')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const validated = postingRuleSchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const data = validated.data

    // Check for duplicate code
    const existing = await db.postingRule.findFirst({
      where: {
        code: data.code,
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId, subAccountId: null }),
      },
    })

    if (existing) {
      return { success: false, error: `Posting rule with code ${data.code} already exists` }
    }

    // Validate account codes in template
    const accountCodes = [
      ...data.template.map((t) => t.debitAccountCode),
      ...data.template.map((t) => t.creditAccountCode),
    ]

    const accounts = await db.chartOfAccount.findMany({
      where: {
        code: { in: accountCodes },
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId, subAccountId: null }),
      },
    })

    const foundCodes = new Set(accounts.map((a) => a.code))
    const missingCodes = accountCodes.filter((c) => !foundCodes.has(c))

    if (missingCodes.length > 0) {
      return { success: false, error: `Account codes not found: ${missingCodes.join(', ')}` }
    }

    const rule = await db.postingRule.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        sourceModule: data.sourceModule,
        conditions: data.conditions as Prisma.JsonObject,
        template: data.template as unknown as Prisma.JsonArray,
        priority: data.priority,
        isActive: data.isActive,
        autoPost: data.autoPost,
        createdBy: context.userId,
        agencyId: context.agencyId ?? null,
        subAccountId: context.subAccountId ?? null,
      },
    })

    await logGLAudit({
      action: 'CREATE',
      entityType: 'PostingRule',
      entityId: rule.id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Created posting rule: ${data.code} - ${data.name}`,
    })

    revalidatePath(`/agency/${context.agencyId}/finance/gl/settings/posting-rules`)

    return { success: true, data: { id: rule.id } }
  } catch (error) {
    console.error('Error creating posting rule:', error)
    return { success: false, error: 'Failed to create posting rule' }
  }
}

export const updatePostingRule = async (
  id: string,
  input: Partial<PostingRuleInput>
): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.posting.edit')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const rule = await db.postingRule.findFirst({
      where: {
        id,
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId }),
      },
    })

    if (!rule) {
      return { success: false, error: 'Posting rule not found' }
    }

    // If template is being updated, validate account codes
    if (input.template) {
      const accountCodes = [
        ...input.template.map((t) => t.debitAccountCode),
        ...input.template.map((t) => t.creditAccountCode),
      ]

      const accounts = await db.chartOfAccount.findMany({
        where: {
          code: { in: accountCodes },
          ...(context.subAccountId
            ? { subAccountId: context.subAccountId }
            : { agencyId: context.agencyId, subAccountId: null }),
        },
      })

      const foundCodes = new Set(accounts.map((a) => a.code))
      const missingCodes = accountCodes.filter((c) => !foundCodes.has(c))

      if (missingCodes.length > 0) {
        return { success: false, error: `Account codes not found: ${missingCodes.join(', ')}` }
      }
    }

    await db.postingRule.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        conditions: input.conditions as Prisma.JsonObject,
        template: input.template as unknown as Prisma.JsonArray,
        priority: input.priority,
        isActive: input.isActive,
        autoPost: input.autoPost,
        updatedBy: context.userId,
      },
    })

    await logGLAudit({
      action: 'UPDATE',
      entityType: 'PostingRule',
      entityId: id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Updated posting rule: ${rule.code}`,
    })

    return { success: true }
  } catch (error) {
    console.error('Error updating posting rule:', error)
    return { success: false, error: 'Failed to update posting rule' }
  }
}

export const deletePostingRule = async (
  id: string
): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.posting.delete')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const rule = await db.postingRule.findFirst({
      where: {
        id,
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId }),
      },
      include: {
        _count: { select: { JournalEntries: true } },
      },
    })

    if (!rule) {
      return { success: false, error: 'Posting rule not found' }
    }

    // Check if rule has been used
    if (rule._count.JournalEntries > 0) {
      return {
        success: false,
        error: `Cannot delete: Rule has been used in ${rule._count.JournalEntries} journal entries. Deactivate instead.`,
      }
    }

    await db.postingRule.delete({ where: { id } })

    await logGLAudit({
      action: 'DELETE',
      entityType: 'PostingRule',
      entityId: id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Deleted posting rule: ${rule.code}`,
    })

    return { success: true }
  } catch (error) {
    console.error('Error deleting posting rule:', error)
    return { success: false, error: 'Failed to delete posting rule' }
  }
}

export const togglePostingRuleStatus = async (
  id: string,
  isActive: boolean
): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.posting.edit')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const rule = await db.postingRule.findFirst({
      where: {
        id,
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId }),
      },
    })

    if (!rule) {
      return { success: false, error: 'Posting rule not found' }
    }

    await db.postingRule.update({
      where: { id },
      data: {
        isActive,
        ...(isActive
          ? { activatedAt: new Date(), activatedBy: context.userId }
          : { deactivatedAt: new Date(), deactivatedBy: context.userId }),
      },
    })

    await logGLAudit({
      action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
      entityType: 'PostingRule',
      entityId: id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `${isActive ? 'Activated' : 'Deactivated'} posting rule: ${rule.code}`,
    })

    return { success: true }
  } catch (error) {
    console.error('Error toggling posting rule status:', error)
    return { success: false, error: 'Failed to toggle posting rule status' }
  }
}

// ========== Posting Rule Execution ==========

export const executePostingRule = async (
  ruleId: string,
  sourceData: {
    sourceId: string
    sourceReference: string
    amount: number
    description: string
    transactionDate: Date
    periodId: string
    metadata?: Record<string, any>
  }
): Promise<ActionResult<{ journalEntryId: string }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.posting.execute')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const rule = await db.postingRule.findFirst({
      where: {
        id: ruleId,
        isActive: true,
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId }),
      },
    })

    if (!rule) {
      return { success: false, error: 'Posting rule not found or inactive' }
    }

    // Verify period is open
    const period = await db.financialPeriod.findFirst({
      where: {
        id: sourceData.periodId,
        status: 'OPEN',
      },
    })

    if (!period) {
      return { success: false, error: 'Financial period not found or not open' }
    }

    // Check conditions if any
    if (rule.conditions) {
      const conditions = rule.conditions as Record<string, any>
      
      if (conditions.minAmount && sourceData.amount < conditions.minAmount) {
        return { success: false, error: 'Amount below minimum threshold' }
      }
      if (conditions.maxAmount && sourceData.amount > conditions.maxAmount) {
        return { success: false, error: 'Amount above maximum threshold' }
      }
    }

    // Build journal entry lines from template
    const template = rule.template as {
      debitAccountCode: string
      creditAccountCode: string
      percentage: number
      description?: string
    }[]

    const lines: {
      lineNumber: number
      accountId: string
      debitAmount: number
      creditAmount: number
      description: string
    }[] = []

    let lineNumber = 1

    for (const templateLine of template) {
      const lineAmount = sourceData.amount * (templateLine.percentage / 100)
      const lineDescription = templateLine.description || sourceData.description

      // Debit line
      const debitAccount = await db.chartOfAccount.findFirst({
        where: {
          code: templateLine.debitAccountCode,
          ...(context.subAccountId
            ? { subAccountId: context.subAccountId }
            : { agencyId: context.agencyId, subAccountId: null }),
        },
      })

      if (!debitAccount) {
        return { success: false, error: `Debit account not found: ${templateLine.debitAccountCode}` }
      }

      lines.push({
        lineNumber: lineNumber++,
        accountId: debitAccount.id,
        debitAmount: lineAmount,
        creditAmount: 0,
        description: lineDescription,
      })

      // Credit line
      const creditAccount = await db.chartOfAccount.findFirst({
        where: {
          code: templateLine.creditAccountCode,
          ...(context.subAccountId
            ? { subAccountId: context.subAccountId }
            : { agencyId: context.agencyId, subAccountId: null }),
        },
      })

      if (!creditAccount) {
        return { success: false, error: `Credit account not found: ${templateLine.creditAccountCode}` }
      }

      lines.push({
        lineNumber: lineNumber++,
        accountId: creditAccount.id,
        debitAmount: 0,
        creditAmount: lineAmount,
        description: lineDescription,
      })
    }

    // Generate entry number
    const count = await db.journalEntry.count({
      where: {
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId, subAccountId: null }),
        createdAt: {
          gte: new Date(new Date().getFullYear(), 0, 1),
        },
      },
    })

    const entryNumber = `AUTO-${rule.code}-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`

    // Create journal entry
    const totalDebit = lines.reduce((sum, l) => sum + l.debitAmount, 0)
    const totalCredit = lines.reduce((sum, l) => sum + l.creditAmount, 0)

    const journalEntry = await db.journalEntry.create({
      data: {
        entryNumber,
        periodId: sourceData.periodId,
        entryDate: sourceData.transactionDate,
        entryType: JournalEntryType.NORMAL,
        sourceModule: rule.sourceModule,
        sourceId: sourceData.sourceId,
        sourceReference: sourceData.sourceReference,
        postingRuleId: rule.id,
        description: sourceData.description,
        totalDebit,
        totalCredit,
        status: rule.autoPost ? JournalEntryStatus.POSTED : JournalEntryStatus.DRAFT,
        createdBy: context.userId,
        agencyId: context.agencyId ?? null,
        subAccountId: context.subAccountId ?? null,
        ...(rule.autoPost && {
          postedAt: new Date(),
          postedBy: context.userId,
        }),
        Lines: {
          create: lines.map((line) => ({
            ...line,
            localDebitAmount: line.debitAmount,
            localCreditAmount: line.creditAmount,
          })),
        },
      },
    })

    await logGLAudit({
      action: 'POST',
      entityType: 'JournalEntry',
      entityId: journalEntry.id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Auto-created journal entry ${entryNumber} from posting rule ${rule.code}`,
    })

    return { success: true, data: { journalEntryId: journalEntry.id } }
  } catch (error) {
    console.error('Error executing posting rule:', error)
    return { success: false, error: 'Failed to execute posting rule' }
  }
}

// ========== Query Operations ==========

export const getPostingRules = async (options?: {
  sourceModule?: SourceModule
  isActive?: boolean
}): Promise<ActionResult<any[]>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.posting.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const rules = await db.postingRule.findMany({
      where: {
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId, subAccountId: null }),
        ...(options?.sourceModule ? { sourceModule: options.sourceModule } : {}),
        ...(options?.isActive !== undefined ? { isActive: options.isActive } : {}),
      },
      include: {
        _count: { select: { JournalEntries: true } },
      },
      orderBy: [{ sourceModule: 'asc' }, { priority: 'asc' }],
    })

    return { success: true, data: rules }
  } catch (error) {
    console.error('Error fetching posting rules:', error)
    return { success: false, error: 'Failed to fetch posting rules' }
  }
}

export const getPostingRuleById = async (
  id: string
): Promise<ActionResult<any>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.posting.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const rule = await db.postingRule.findFirst({
      where: {
        id,
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId }),
      },
      include: {
        JournalEntries: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            entryNumber: true,
            entryDate: true,
            totalDebit: true,
            status: true,
          },
        },
      },
    })

    if (!rule) {
      return { success: false, error: 'Posting rule not found' }
    }

    return { success: true, data: rule }
  } catch (error) {
    console.error('Error fetching posting rule:', error)
    return { success: false, error: 'Failed to fetch posting rule' }
  }
}

// ========== Posting Templates ==========

export const createPostingTemplate = async (
  input: PostingTemplateInput
): Promise<ActionResult<{ id: string }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.posting.create')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const validated = postingTemplateSchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const data = validated.data

    // Check for duplicate code
    const existing = await db.postingTemplate.findFirst({
      where: {
        code: data.code,
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId, subAccountId: null }),
      },
    })

    if (existing) {
      return { success: false, error: `Template with code ${data.code} already exists` }
    }

    const template = await db.postingTemplate.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        template: data.template as unknown as Prisma.JsonArray,
        isActive: data.isActive,
        createdBy: context.userId,
        agencyId: context.agencyId ?? null,
        subAccountId: context.subAccountId ?? null,
      },
    })

    return { success: true, data: { id: template.id } }
  } catch (error) {
    console.error('Error creating posting template:', error)
    return { success: false, error: 'Failed to create posting template' }
  }
}

export const getPostingTemplates = async (): Promise<ActionResult<any[]>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const templates = await db.postingTemplate.findMany({
      where: {
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId, subAccountId: null }),
        isActive: true,
      },
      orderBy: { name: 'asc' },
    })

    return { success: true, data: templates }
  } catch (error) {
    console.error('Error fetching posting templates:', error)
    return { success: false, error: 'Failed to fetch posting templates' }
  }
}
```

---

## 4. GL Configuration Server Actions

### 4.1 Configuration Management

```typescript
// src/lib/finance/gl/actions/configuration.ts

'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { hasAgencyPermission, hasSubAccountPermission } from '@/lib/iam/authz/permissions'
import {
  glConfigurationSchema,
  updateGLConfigurationSchema,
  type GLConfigurationInput,
  type UpdateGLConfigurationInput,
} from '@/lib/schemas/finance/gl/configuration'
import { logGLAudit } from './audit'
import { ConsolidationMethod } from '@/generated/prisma/client'

// ========== Types ==========

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

type ConfigContext = {
  agencyId?: string
  subAccountId?: string
  userId: string
}

// ========== Helper Functions ==========

const getContext = async (): Promise<ConfigContext | null> => {
  const session = await auth()
  if (!session?.user?.id) return null

  const dbSession = await db.session.findFirst({
    where: { userId: session.user.id },
    select: { activeAgencyId: true, activeSubAccountId: true },
  })

  return {
    userId: session.user.id,
    agencyId: dbSession?.activeAgencyId ?? undefined,
    subAccountId: dbSession?.activeSubAccountId ?? undefined,
  }
}

const checkPermission = async (
  context: ConfigContext,
  permissionKey: string
): Promise<boolean> => {
  if (context.subAccountId) {
    return hasSubAccountPermission(context.subAccountId, permissionKey)
  }
  if (context.agencyId) {
    return hasAgencyPermission(context.agencyId, permissionKey)
  }
  return false
}

// ========== Configuration CRUD ==========

export const getGLConfiguration = async (): Promise<ActionResult<any>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.settings.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    let config = await db.gLConfiguration.findFirst({
      where: context.subAccountId
        ? { subAccountId: context.subAccountId }
        : { agencyId: context.agencyId, subAccountId: null },
    })

    // If no config exists, return defaults
    if (!config) {
      config = {
        id: '',
        agencyId: context.agencyId ?? null,
        subAccountId: context.subAccountId ?? null,
        baseCurrency: 'USD',
        fiscalYearEnd: '12-31',
        fiscalYearStart: '01-01',
        useControlAccounts: true,
        requireApproval: true,
        autoPostingEnabled: false,
        allowFuturePeriodPost: false,
        allowClosedPeriodPost: false,
        consolidationMethod: ConsolidationMethod.FULL,
        eliminateIntercompany: true,
        autoCreatePeriods: true,
        periodLockDays: 5,
        accountCodeFormat: '####-####',
        accountCodeLength: 8,
        erpIntegrationEnabled: false,
        erpSystemType: null,
        erpApiUrl: null,
        erpApiKey: null,
        retainAuditDays: 2555,
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: null,
      } as any
    }

    return { success: true, data: config }
  } catch (error) {
    console.error('Error fetching GL configuration:', error)
    return { success: false, error: 'Failed to fetch GL configuration' }
  }
}

export const initializeGLConfiguration = async (
  input: GLConfigurationInput
): Promise<ActionResult<{ id: string }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.settings.edit')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const validated = glConfigurationSchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const data = validated.data

    // Check if config already exists
    const existing = await db.gLConfiguration.findFirst({
      where: context.subAccountId
        ? { subAccountId: context.subAccountId }
        : { agencyId: context.agencyId, subAccountId: null },
    })

    if (existing) {
      return { success: false, error: 'GL configuration already exists. Use update instead.' }
    }

    const config = await db.gLConfiguration.create({
      data: {
        ...data,
        agencyId: context.agencyId ?? null,
        subAccountId: context.subAccountId ?? null,
        updatedBy: context.userId,
      },
    })

    await logGLAudit({
      action: 'CREATE',
      entityType: 'GLConfiguration',
      entityId: config.id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: 'Initialized GL configuration',
    })

    revalidatePath(`/agency/${context.agencyId}/finance/gl/settings`)

    return { success: true, data: { id: config.id } }
  } catch (error) {
    console.error('Error initializing GL configuration:', error)
    return { success: false, error: 'Failed to initialize GL configuration' }
  }
}

export const updateGLConfiguration = async (
  input: UpdateGLConfigurationInput
): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.settings.edit')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const validated = updateGLConfigurationSchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const data = validated.data

    // Get existing config
    let config = await db.gLConfiguration.findFirst({
      where: context.subAccountId
        ? { subAccountId: context.subAccountId }
        : { agencyId: context.agencyId, subAccountId: null },
    })

    const previousValues = config ? { ...config } : null

    if (config) {
      // Update existing
      await db.gLConfiguration.update({
        where: { id: config.id },
        data: {
          ...data,
          updatedBy: context.userId,
        },
      })
    } else {
      // Create new with defaults merged
      config = await db.gLConfiguration.create({
        data: {
          baseCurrency: 'USD',
          fiscalYearEnd: '12-31',
          fiscalYearStart: '01-01',
          useControlAccounts: true,
          requireApproval: true,
          autoPostingEnabled: false,
          allowFuturePeriodPost: false,
          allowClosedPeriodPost: false,
          consolidationMethod: ConsolidationMethod.FULL,
          eliminateIntercompany: true,
          autoCreatePeriods: true,
          periodLockDays: 5,
          accountCodeFormat: '####-####',
          accountCodeLength: 8,
          retainAuditDays: 2555,
          ...data,
          agencyId: context.agencyId ?? null,
          subAccountId: context.subAccountId ?? null,
          updatedBy: context.userId,
        },
      })
    }

    await logGLAudit({
      action: 'UPDATE',
      entityType: 'GLConfiguration',
      entityId: config.id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      previousValues: previousValues as any,
      newValues: data as any,
      description: 'Updated GL configuration',
    })

    revalidatePath(`/agency/${context.agencyId}/finance/gl/settings`)

    return { success: true }
  } catch (error) {
    console.error('Error updating GL configuration:', error)
    return { success: false, error: 'Failed to update GL configuration' }
  }
}

// ========== Specific Setting Updates ==========

export const updateBaseCurrency = async (
  currencyCode: string
): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.settings.edit')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    // Validate currency code format
    if (!/^[A-Z]{3}$/.test(currencyCode)) {
      return { success: false, error: 'Invalid currency code format. Must be 3 uppercase letters.' }
    }

    // Check if any transactions exist (can't change base currency after transactions)
    const transactionCount = await db.journalEntry.count({
      where: {
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId, subAccountId: null }),
        status: 'POSTED',
      },
    })

    if (transactionCount > 0) {
      return {
        success: false,
        error: 'Cannot change base currency after transactions have been posted',
      }
    }

    await updateGLConfiguration({ baseCurrency: currencyCode })

    return { success: true }
  } catch (error) {
    console.error('Error updating base currency:', error)
    return { success: false, error: 'Failed to update base currency' }
  }
}

export const updateFiscalYear = async (
  fiscalYearStart: string,
  fiscalYearEnd: string
): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.settings.edit')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    // Validate date format (MM-DD)
    const dateRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
    if (!dateRegex.test(fiscalYearStart) || !dateRegex.test(fiscalYearEnd)) {
      return { success: false, error: 'Invalid date format. Use MM-DD format.' }
    }

    await updateGLConfiguration({ fiscalYearStart, fiscalYearEnd })

    return { success: true }
  } catch (error) {
    console.error('Error updating fiscal year:', error)
    return { success: false, error: 'Failed to update fiscal year' }
  }
}

export const updateApprovalSettings = async (input: {
  requireApproval: boolean
  autoPostingEnabled: boolean
  allowFuturePeriodPost: boolean
  allowClosedPeriodPost: boolean
}): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.settings.edit')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    await updateGLConfiguration(input)

    return { success: true }
  } catch (error) {
    console.error('Error updating approval settings:', error)
    return { success: false, error: 'Failed to update approval settings' }
  }
}

export const updateConsolidationSettings = async (input: {
  consolidationMethod: ConsolidationMethod
  eliminateIntercompany: boolean
}): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    // Only agency level can update consolidation settings
    if (context.subAccountId) {
      return { success: false, error: 'Consolidation settings can only be configured at agency level' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.settings.edit')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    await updateGLConfiguration(input)

    return { success: true }
  } catch (error) {
    console.error('Error updating consolidation settings:', error)
    return { success: false, error: 'Failed to update consolidation settings' }
  }
}

export const updateAccountCodeFormat = async (input: {
  accountCodeFormat: string
  accountCodeLength: number
}): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.settings.edit')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    // Validate format contains only valid characters
    if (!/^[#\-\.]+$/.test(input.accountCodeFormat)) {
      return {
        success: false,
        error: 'Invalid account code format. Use # for digits and - or . as separators.',
      }
    }

    // Validate length matches format
    const digitCount = (input.accountCodeFormat.match(/#/g) || []).length
    if (digitCount !== input.accountCodeLength) {
      return {
        success: false,
        error: `Account code length (${input.accountCodeLength}) must match format digit count (${digitCount})`,
      }
    }

    // Check if any accounts exist (can't change format after accounts created)
    const accountCount = await db.chartOfAccount.count({
      where: {
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId, subAccountId: null }),
      },
    })

    if (accountCount > 0) {
      return {
        success: false,
        error: 'Cannot change account code format after accounts have been created',
      }
    }

    await updateGLConfiguration(input)

    return { success: true }
  } catch (error) {
    console.error('Error updating account code format:', error)
    return { success: false, error: 'Failed to update account code format' }
  }
}

export const updateERPIntegration = async (input: {
  erpIntegrationEnabled: boolean
  erpSystemType?: string
  erpApiUrl?: string
  erpApiKey?: string
}): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.settings.edit')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    // If enabling, validate required fields
    if (input.erpIntegrationEnabled) {
      if (!input.erpSystemType) {
        return { success: false, error: 'ERP system type is required when enabling integration' }
      }
      if (!input.erpApiUrl) {
        return { success: false, error: 'ERP API URL is required when enabling integration' }
      }
    }

    await updateGLConfiguration(input)

    return { success: true }
  } catch (error) {
    console.error('Error updating ERP integration:', error)
    return { success: false, error: 'Failed to update ERP integration' }
  }
}

// ========== Configuration Status ==========

export const getGLSetupStatus = async (): Promise<
  ActionResult<{
    isConfigured: boolean
    hasAccounts: boolean
    hasPeriods: boolean
    hasSystemAccounts: boolean
    setupSteps: {
      step: string
      completed: boolean
      description: string
    }[]
  }>
> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const whereClause = context.subAccountId
      ? { subAccountId: context.subAccountId }
      : { agencyId: context.agencyId, subAccountId: null }

    const [config, accountCount, periodCount, systemAccountCount] = await Promise.all([
      db.gLConfiguration.findFirst({ where: whereClause }),
      db.chartOfAccount.count({ where: whereClause }),
      db.financialPeriod.count({ where: whereClause }),
      db.chartOfAccount.count({
        where: {
          ...whereClause,
          isSystemAccount: true,
        },
      }),
    ])

    const isConfigured = !!config
    const hasAccounts = accountCount > 0
    const hasPeriods = periodCount > 0
    const hasSystemAccounts = systemAccountCount >= 5 // Minimum system accounts

    const setupSteps = [
      {
        step: 'configuration',
        completed: isConfigured,
        description: 'Configure GL settings (base currency, fiscal year, etc.)',
      },
      {
        step: 'chart-of-accounts',
        completed: hasAccounts,
        description: 'Set up Chart of Accounts',
      },
      {
        step: 'system-accounts',
        completed: hasSystemAccounts,
        description: 'Create required system accounts',
      },
      {
        step: 'financial-periods',
        completed: hasPeriods,
        description: 'Create financial periods',
      },
    ]

    return {
      success: true,
      data: {
        isConfigured,
        hasAccounts,
        hasPeriods,
        hasSystemAccounts,
        setupSteps,
      },
    }
  } catch (error) {
    console.error('Error fetching GL setup status:', error)
    return { success: false, error: 'Failed to fetch GL setup status' }
  }
}
```

---

## 5. COA Templates & Setup Wizard

### 5.1 COA Template Server Actions

```typescript
// src/lib/finance/gl/actions/coa-templates.ts

'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { hasAgencyPermission, hasSubAccountPermission } from '@/lib/iam/authz/permissions'
import {
  coaTemplateSchema,
  type COATemplateInput,
} from '@/lib/schemas/finance/gl/coa-template'
import { logGLAudit } from './audit'
import { AccountType, NormalBalance } from '@/generated/prisma/client'

// ========== Types ==========

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

type TemplateContext = {
  agencyId?: string
  subAccountId?: string
  userId: string
}

type TemplateAccount = {
  code: string
  name: string
  type: AccountType
  normalBalance: NormalBalance
  description?: string
  isSystemAccount?: boolean
  parentCode?: string
  children?: TemplateAccount[]
}

// ========== Helper Functions ==========

const getContext = async (): Promise<TemplateContext | null> => {
  const session = await auth()
  if (!session?.user?.id) return null

  const dbSession = await db.session.findFirst({
    where: { userId: session.user.id },
    select: { activeAgencyId: true, activeSubAccountId: true },
  })

  return {
    userId: session.user.id,
    agencyId: dbSession?.activeAgencyId ?? undefined,
    subAccountId: dbSession?.activeSubAccountId ?? undefined,
  }
}

const checkPermission = async (
  context: TemplateContext,
  permissionKey: string
): Promise<boolean> => {
  if (context.subAccountId) {
    return hasSubAccountPermission(context.subAccountId, permissionKey)
  }
  if (context.agencyId) {
    return hasAgencyPermission(context.agencyId, permissionKey)
  }
  return false
}

// ========== Built-in Templates ==========

const STANDARD_COA_TEMPLATE: TemplateAccount[] = [
  // Assets (1000-1999)
  {
    code: '1000',
    name: 'Assets',
    type: 'ASSET',
    normalBalance: 'DEBIT',
    description: 'Total Assets',
    children: [
      {
        code: '1100',
        name: 'Current Assets',
        type: 'ASSET',
        normalBalance: 'DEBIT',
        children: [
          { code: '1110', name: 'Cash and Cash Equivalents', type: 'ASSET', normalBalance: 'DEBIT', isSystemAccount: true },
          { code: '1120', name: 'Accounts Receivable', type: 'ASSET', normalBalance: 'DEBIT', isSystemAccount: true },
          { code: '1130', name: 'Allowance for Doubtful Accounts', type: 'ASSET', normalBalance: 'CREDIT' },
          { code: '1140', name: 'Inventory', type: 'ASSET', normalBalance: 'DEBIT' },
          { code: '1150', name: 'Prepaid Expenses', type: 'ASSET', normalBalance: 'DEBIT' },
        ],
      },
      {
        code: '1500',
        name: 'Non-Current Assets',
        type: 'ASSET',
        normalBalance: 'DEBIT',
        children: [
          { code: '1510', name: 'Property, Plant & Equipment', type: 'ASSET', normalBalance: 'DEBIT' },
          { code: '1520', name: 'Accumulated Depreciation', type: 'ASSET', normalBalance: 'CREDIT' },
          { code: '1530', name: 'Intangible Assets', type: 'ASSET', normalBalance: 'DEBIT' },
          { code: '1540', name: 'Investments', type: 'ASSET', normalBalance: 'DEBIT' },
        ],
      },
    ],
  },
  // Liabilities (2000-2999)
  {
    code: '2000',
    name: 'Liabilities',
    type: 'LIABILITY',
    normalBalance: 'CREDIT',
    description: 'Total Liabilities',
    children: [
      {
        code: '2100',
        name: 'Current Liabilities',
        type: 'LIABILITY',
        normalBalance: 'CREDIT',
        children: [
          { code: '2110', name: 'Accounts Payable', type: 'LIABILITY', normalBalance: 'CREDIT', isSystemAccount: true },
          { code: '2120', name: 'Accrued Expenses', type: 'LIABILITY', normalBalance: 'CREDIT' },
          { code: '2130', name: 'Unearned Revenue', type: 'LIABILITY', normalBalance: 'CREDIT' },
          { code: '2140', name: 'Short-term Debt', type: 'LIABILITY', normalBalance: 'CREDIT' },
          { code: '2150', name: 'Taxes Payable', type: 'LIABILITY', normalBalance: 'CREDIT' },
        ],
      },
      {
        code: '2500',
        name: 'Non-Current Liabilities',
        type: 'LIABILITY',
        normalBalance: 'CREDIT',
        children: [
          { code: '2510', name: 'Long-term Debt', type: 'LIABILITY', normalBalance: 'CREDIT' },
          { code: '2520', name: 'Deferred Tax Liability', type: 'LIABILITY', normalBalance: 'CREDIT' },
        ],
      },
    ],
  },
  // Equity (3000-3999)
  {
    code: '3000',
    name: 'Equity',
    type: 'EQUITY',
    normalBalance: 'CREDIT',
    description: 'Total Equity',
    children: [
      { code: '3100', name: 'Common Stock', type: 'EQUITY', normalBalance: 'CREDIT' },
      { code: '3200', name: 'Retained Earnings', type: 'EQUITY', normalBalance: 'CREDIT', isSystemAccount: true },
      { code: '3300', name: 'Current Year Earnings', type: 'EQUITY', normalBalance: 'CREDIT', isSystemAccount: true },
      { code: '3400', name: 'Treasury Stock', type: 'EQUITY', normalBalance: 'DEBIT' },
    ],
  },
  // Revenue (4000-4999)
  {
    code: '4000',
    name: 'Revenue',
    type: 'REVENUE',
    normalBalance: 'CREDIT',
    description: 'Total Revenue',
    children: [
      { code: '4100', name: 'Sales Revenue', type: 'REVENUE', normalBalance: 'CREDIT' },
      { code: '4200', name: 'Service Revenue', type: 'REVENUE', normalBalance: 'CREDIT' },
      { code: '4300', name: 'Interest Income', type: 'REVENUE', normalBalance: 'CREDIT' },
      { code: '4400', name: 'Other Income', type: 'REVENUE', normalBalance: 'CREDIT' },
    ],
  },
  // Expenses (5000-5999)
  {
    code: '5000',
    name: 'Expenses',
    type: 'EXPENSE',
    normalBalance: 'DEBIT',
    description: 'Total Expenses',
    children: [
      { code: '5100', name: 'Cost of Goods Sold', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5200', name: 'Salaries & Wages', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5300', name: 'Rent Expense', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5400', name: 'Utilities Expense', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5500', name: 'Depreciation Expense', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5600', name: 'Interest Expense', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5700', name: 'Professional Fees', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5800', name: 'Marketing Expense', type: 'EXPENSE', normalBalance: 'DEBIT' },
      { code: '5900', name: 'Other Expenses', type: 'EXPENSE', normalBalance: 'DEBIT' },
    ],
  },
]

const SERVICE_BUSINESS_TEMPLATE: TemplateAccount[] = [
  // Similar structure optimized for service businesses
  // ... (abbreviated for documentation)
]

const AGENCY_TEMPLATE: TemplateAccount[] = [
  // Optimized for marketing/creative agencies
  // Includes specific accounts for client projects, retainers, etc.
  // ... (abbreviated for documentation)
]

// ========== Template Actions ==========

export const getAvailableTemplates = async (): Promise<
  ActionResult<{ id: string; name: string; description: string; accountCount: number }[]>
> => {
  try {
    const templates = [
      {
        id: 'standard',
        name: 'Standard Business COA',
        description: 'General-purpose chart of accounts suitable for most businesses',
        accountCount: 45,
      },
      {
        id: 'service-business',
        name: 'Service Business COA',
        description: 'Optimized for professional service companies',
        accountCount: 38,
      },
      {
        id: 'agency',
        name: 'Agency/Creative COA',
        description: 'Designed for marketing and creative agencies with project tracking',
        accountCount: 52,
      },
      {
        id: 'minimal',
        name: 'Minimal COA',
        description: 'Basic accounts for simple bookkeeping needs',
        accountCount: 20,
      },
    ]

    // Also fetch custom templates
    const context = await getContext()
    if (context) {
      const customTemplates = await db.cOATemplate.findMany({
        where: context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId },
        select: {
          id: true,
          name: true,
          description: true,
          accounts: true,
        },
      })

      customTemplates.forEach((t) => {
        templates.push({
          id: t.id,
          name: t.name,
          description: t.description ?? 'Custom template',
          accountCount: (t.accounts as any[])?.length ?? 0,
        })
      })
    }

    return { success: true, data: templates }
  } catch (error) {
    console.error('Error fetching templates:', error)
    return { success: false, error: 'Failed to fetch templates' }
  }
}

export const getTemplatePreview = async (
  templateId: string
): Promise<ActionResult<TemplateAccount[]>> => {
  try {
    // Built-in templates
    switch (templateId) {
      case 'standard':
        return { success: true, data: STANDARD_COA_TEMPLATE }
      case 'service-business':
        return { success: true, data: SERVICE_BUSINESS_TEMPLATE }
      case 'agency':
        return { success: true, data: AGENCY_TEMPLATE }
      case 'minimal':
        return { success: true, data: STANDARD_COA_TEMPLATE.slice(0, 3) } // Simplified
    }

    // Custom template
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const template = await db.cOATemplate.findUnique({
      where: { id: templateId },
    })

    if (!template) {
      return { success: false, error: 'Template not found' }
    }

    return { success: true, data: template.accounts as TemplateAccount[] }
  } catch (error) {
    console.error('Error fetching template preview:', error)
    return { success: false, error: 'Failed to fetch template preview' }
  }
}

export const applyTemplate = async (
  templateId: string,
  options?: {
    overwriteExisting?: boolean
    includeSystemAccounts?: boolean
  }
): Promise<ActionResult<{ accountsCreated: number }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.accounts.create')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    // Get template accounts
    const templateResult = await getTemplatePreview(templateId)
    if (!templateResult.success || !templateResult.data) {
      return { success: false, error: templateResult.error ?? 'Template not found' }
    }

    const whereClause = context.subAccountId
      ? { subAccountId: context.subAccountId }
      : { agencyId: context.agencyId, subAccountId: null }

    // Check for existing accounts
    if (!options?.overwriteExisting) {
      const existingCount = await db.chartOfAccount.count({ where: whereClause })
      if (existingCount > 0) {
        return {
          success: false,
          error: 'Accounts already exist. Use overwriteExisting option to replace.',
        }
      }
    }

    // Flatten template hierarchy
    const flattenAccounts = (
      accounts: TemplateAccount[],
      parentId?: string
    ): { account: TemplateAccount; parentCode?: string }[] => {
      const result: { account: TemplateAccount; parentCode?: string }[] = []
      for (const account of accounts) {
        result.push({ account, parentCode: parentId })
        if (account.children) {
          result.push(...flattenAccounts(account.children, account.code))
        }
      }
      return result
    }

    const flatAccounts = flattenAccounts(templateResult.data)
    let accountsCreated = 0

    await db.$transaction(async (tx) => {
      // Delete existing if overwriting
      if (options?.overwriteExisting) {
        await tx.chartOfAccount.deleteMany({ where: whereClause })
      }

      // Create parent accounts first
      const codeToId: Record<string, string> = {}

      for (const { account, parentCode } of flatAccounts) {
        // Skip system accounts if not requested
        if (account.isSystemAccount && !options?.includeSystemAccounts) {
          continue
        }

        const created = await tx.chartOfAccount.create({
          data: {
            accountCode: account.code,
            accountName: account.name,
            accountType: account.type as AccountType,
            normalBalance: account.normalBalance as NormalBalance,
            description: account.description,
            isSystemAccount: account.isSystemAccount ?? false,
            isActive: true,
            parentId: parentCode ? codeToId[parentCode] : null,
            agencyId: context.agencyId ?? null,
            subAccountId: context.subAccountId ?? null,
          },
        })

        codeToId[account.code] = created.id
        accountsCreated++
      }
    })

    await logGLAudit({
      action: 'CREATE',
      entityType: 'ChartOfAccount',
      entityId: templateId,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Applied COA template: ${templateId} (${accountsCreated} accounts)`,
    })

    revalidatePath(`/agency/${context.agencyId}/finance/gl/accounts`)

    return { success: true, data: { accountsCreated } }
  } catch (error) {
    console.error('Error applying template:', error)
    return { success: false, error: 'Failed to apply template' }
  }
}

export const saveAsTemplate = async (
  name: string,
  description?: string
): Promise<ActionResult<{ id: string }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.settings.edit')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const whereClause = context.subAccountId
      ? { subAccountId: context.subAccountId }
      : { agencyId: context.agencyId, subAccountId: null }

    // Get current accounts
    const accounts = await db.chartOfAccount.findMany({
      where: whereClause,
      select: {
        accountCode: true,
        accountName: true,
        accountType: true,
        normalBalance: true,
        description: true,
        isSystemAccount: true,
        parent: { select: { accountCode: true } },
      },
    })

    if (accounts.length === 0) {
      return { success: false, error: 'No accounts to save as template' }
    }

    // Convert to template format
    const templateAccounts = accounts.map((a) => ({
      code: a.accountCode,
      name: a.accountName,
      type: a.accountType,
      normalBalance: a.normalBalance,
      description: a.description,
      isSystemAccount: a.isSystemAccount,
      parentCode: a.parent?.accountCode,
    }))

    const template = await db.cOATemplate.create({
      data: {
        name,
        description,
        accounts: templateAccounts as any,
        industry: 'Custom',
        agencyId: context.agencyId,
        subAccountId: context.subAccountId,
        createdBy: context.userId,
      },
    })

    return { success: true, data: { id: template.id } }
  } catch (error) {
    console.error('Error saving template:', error)
    return { success: false, error: 'Failed to save template' }
  }
}

// ========== COA Import/Export ==========

export const exportCOA = async (
  format: 'json' | 'csv'
): Promise<ActionResult<string>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.accounts.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    const whereClause = context.subAccountId
      ? { subAccountId: context.subAccountId }
      : { agencyId: context.agencyId, subAccountId: null }

    const accounts = await db.chartOfAccount.findMany({
      where: whereClause,
      include: { parent: { select: { accountCode: true } } },
      orderBy: { accountCode: 'asc' },
    })

    if (format === 'csv') {
      const headers = [
        'Account Code',
        'Account Name',
        'Type',
        'Normal Balance',
        'Description',
        'Parent Code',
        'Is System Account',
        'Is Active',
      ]
      const rows = accounts.map((a) =>
        [
          a.accountCode,
          `"${a.accountName}"`,
          a.accountType,
          a.normalBalance,
          `"${a.description ?? ''}"`,
          a.parent?.accountCode ?? '',
          a.isSystemAccount ? 'Yes' : 'No',
          a.isActive ? 'Yes' : 'No',
        ].join(',')
      )

      return { success: true, data: [headers.join(','), ...rows].join('\n') }
    }

    // JSON format
    const jsonData = accounts.map((a) => ({
      code: a.accountCode,
      name: a.accountName,
      type: a.accountType,
      normalBalance: a.normalBalance,
      description: a.description,
      parentCode: a.parent?.accountCode,
      isSystemAccount: a.isSystemAccount,
      isActive: a.isActive,
    }))

    return { success: true, data: JSON.stringify(jsonData, null, 2) }
  } catch (error) {
    console.error('Error exporting COA:', error)
    return { success: false, error: 'Failed to export COA' }
  }
}

export const importCOA = async (
  data: string,
  format: 'json' | 'csv',
  options?: { overwriteExisting?: boolean }
): Promise<ActionResult<{ imported: number; skipped: number; errors: string[] }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.accounts.create')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    let accounts: {
      code: string
      name: string
      type: string
      normalBalance: string
      description?: string
      parentCode?: string
      isSystemAccount?: boolean
      isActive?: boolean
    }[] = []

    if (format === 'json') {
      try {
        accounts = JSON.parse(data)
      } catch {
        return { success: false, error: 'Invalid JSON format' }
      }
    } else {
      // Parse CSV
      const lines = data.split('\n').filter((l) => l.trim())
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, ''))

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].match(/(?:^|,)("(?:[^"]*(?:""[^"]*)*)"|[^,]*)/g)
        if (!values) continue

        const row: Record<string, string> = {}
        values.forEach((v, idx) => {
          row[headers[idx]] = v.replace(/^,?"?|"?$/g, '').replace(/""/g, '"')
        })

        accounts.push({
          code: row['accountcode'] ?? row['code'],
          name: row['accountname'] ?? row['name'],
          type: row['type']?.toUpperCase(),
          normalBalance: row['normalbalance']?.toUpperCase(),
          description: row['description'],
          parentCode: row['parentcode'],
          isSystemAccount: row['issystemaccount']?.toLowerCase() === 'yes',
          isActive: row['isactive']?.toLowerCase() !== 'no',
        })
      }
    }

    const whereClause = context.subAccountId
      ? { subAccountId: context.subAccountId }
      : { agencyId: context.agencyId, subAccountId: null }

    let imported = 0
    let skipped = 0
    const errors: string[] = []

    await db.$transaction(async (tx) => {
      // Get existing codes
      const existing = await tx.chartOfAccount.findMany({
        where: whereClause,
        select: { accountCode: true, id: true },
      })
      const existingCodes = new Map(existing.map((e) => [e.accountCode, e.id]))

      // First pass: create/update accounts without parent
      for (const account of accounts) {
        if (!account.code || !account.name || !account.type) {
          errors.push(`Skipped invalid account: ${account.code}`)
          skipped++
          continue
        }

        const existingId = existingCodes.get(account.code)

        if (existingId && !options?.overwriteExisting) {
          skipped++
          continue
        }

        try {
          if (existingId) {
            await tx.chartOfAccount.update({
              where: { id: existingId },
              data: {
                accountName: account.name,
                accountType: account.type as AccountType,
                normalBalance: account.normalBalance as NormalBalance,
                description: account.description,
                isSystemAccount: account.isSystemAccount ?? false,
                isActive: account.isActive ?? true,
              },
            })
          } else {
            const created = await tx.chartOfAccount.create({
              data: {
                accountCode: account.code,
                accountName: account.name,
                accountType: account.type as AccountType,
                normalBalance: account.normalBalance as NormalBalance,
                description: account.description,
                isSystemAccount: account.isSystemAccount ?? false,
                isActive: account.isActive ?? true,
                agencyId: context.agencyId ?? null,
                subAccountId: context.subAccountId ?? null,
              },
            })
            existingCodes.set(account.code, created.id)
          }
          imported++
        } catch (err: any) {
          errors.push(`Error importing ${account.code}: ${err.message}`)
        }
      }

      // Second pass: set parent relationships
      for (const account of accounts) {
        if (account.parentCode) {
          const childId = existingCodes.get(account.code)
          const parentId = existingCodes.get(account.parentCode)

          if (childId && parentId) {
            await tx.chartOfAccount.update({
              where: { id: childId },
              data: { parentId },
            })
          }
        }
      }
    })

    await logGLAudit({
      action: 'CREATE',
      entityType: 'ChartOfAccount',
      entityId: 'import',
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Imported COA: ${imported} accounts`,
    })

    revalidatePath(`/agency/${context.agencyId}/finance/gl/accounts`)

    return { success: true, data: { imported, skipped, errors } }
  } catch (error) {
    console.error('Error importing COA:', error)
    return { success: false, error: 'Failed to import COA' }
  }
}
```

### 5.2 Setup Wizard Server Actions

```typescript
// src/lib/finance/gl/actions/setup-wizard.ts

'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { hasAgencyPermission, hasSubAccountPermission } from '@/lib/iam/authz/permissions'
import { initializeGLConfiguration } from './configuration'
import { applyTemplate } from './coa-templates'
import { createFinancialPeriods } from './periods'
import { logGLAudit } from './audit'

// ========== Types ==========

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

type SetupWizardStep =
  | 'company-info'
  | 'configuration'
  | 'chart-of-accounts'
  | 'financial-periods'
  | 'review'

type WizardState = {
  currentStep: SetupWizardStep
  completedSteps: SetupWizardStep[]
  data: {
    companyInfo?: {
      name: string
      industry?: string
      baseCurrency: string
      fiscalYearStart: string
      fiscalYearEnd: string
    }
    configuration?: {
      useControlAccounts: boolean
      requireApproval: boolean
      autoPostingEnabled: boolean
    }
    coaTemplate?: string
    periodsConfig?: {
      startYear: number
      numberOfYears: number
      periodType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
    }
  }
}

// ========== Helper Functions ==========

const getContext = async () => {
  const session = await auth()
  if (!session?.user?.id) return null

  const dbSession = await db.session.findFirst({
    where: { userId: session.user.id },
    select: { activeAgencyId: true, activeSubAccountId: true },
  })

  return {
    userId: session.user.id,
    agencyId: dbSession?.activeAgencyId ?? undefined,
    subAccountId: dbSession?.activeSubAccountId ?? undefined,
  }
}

// ========== Setup Wizard Actions ==========

export const initializeWizard = async (): Promise<ActionResult<WizardState>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    // Check if already setup
    const whereClause = context.subAccountId
      ? { subAccountId: context.subAccountId }
      : { agencyId: context.agencyId, subAccountId: null }

    const existingConfig = await db.gLConfiguration.findFirst({ where: whereClause })

    if (existingConfig) {
      return {
        success: false,
        error: 'GL is already configured. Use settings to modify.',
      }
    }

    const initialState: WizardState = {
      currentStep: 'company-info',
      completedSteps: [],
      data: {},
    }

    return { success: true, data: initialState }
  } catch (error) {
    console.error('Error initializing wizard:', error)
    return { success: false, error: 'Failed to initialize setup wizard' }
  }
}

export const saveWizardStep = async (
  step: SetupWizardStep,
  data: any
): Promise<ActionResult<WizardState>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    // Validate step data based on step type
    let validatedData: any

    switch (step) {
      case 'company-info':
        if (!data.baseCurrency || !data.fiscalYearStart || !data.fiscalYearEnd) {
          return { success: false, error: 'Missing required company information' }
        }
        validatedData = {
          companyInfo: {
            name: data.name,
            industry: data.industry,
            baseCurrency: data.baseCurrency,
            fiscalYearStart: data.fiscalYearStart,
            fiscalYearEnd: data.fiscalYearEnd,
          },
        }
        break

      case 'configuration':
        validatedData = {
          configuration: {
            useControlAccounts: data.useControlAccounts ?? true,
            requireApproval: data.requireApproval ?? true,
            autoPostingEnabled: data.autoPostingEnabled ?? false,
          },
        }
        break

      case 'chart-of-accounts':
        if (!data.templateId) {
          return { success: false, error: 'Please select a chart of accounts template' }
        }
        validatedData = {
          coaTemplate: data.templateId,
        }
        break

      case 'financial-periods':
        if (!data.startYear || !data.numberOfYears) {
          return { success: false, error: 'Missing period configuration' }
        }
        validatedData = {
          periodsConfig: {
            startYear: data.startYear,
            numberOfYears: data.numberOfYears,
            periodType: data.periodType ?? 'MONTHLY',
          },
        }
        break

      default:
        return { success: false, error: 'Invalid wizard step' }
    }

    // Return updated state (in real app, this would be stored in session/cache)
    const updatedState: WizardState = {
      currentStep: getNextStep(step),
      completedSteps: [step],
      data: validatedData,
    }

    return { success: true, data: updatedState }
  } catch (error) {
    console.error('Error saving wizard step:', error)
    return { success: false, error: 'Failed to save wizard step' }
  }
}

const getNextStep = (currentStep: SetupWizardStep): SetupWizardStep => {
  const steps: SetupWizardStep[] = [
    'company-info',
    'configuration',
    'chart-of-accounts',
    'financial-periods',
    'review',
  ]
  const currentIndex = steps.indexOf(currentStep)
  return steps[Math.min(currentIndex + 1, steps.length - 1)]
}

export const completeSetup = async (
  wizardData: WizardState['data']
): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = context.subAccountId
      ? await hasSubAccountPermission(context.subAccountId, 'finance.gl.settings.edit')
      : await hasAgencyPermission(context.agencyId!, 'finance.gl.settings.edit')

    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    // Validate all required data is present
    if (!wizardData.companyInfo || !wizardData.coaTemplate || !wizardData.periodsConfig) {
      return { success: false, error: 'Incomplete setup data' }
    }

    // Execute setup in transaction
    await db.$transaction(async (tx) => {
      // 1. Create GL Configuration
      const configResult = await initializeGLConfiguration({
        baseCurrency: wizardData.companyInfo!.baseCurrency,
        fiscalYearStart: wizardData.companyInfo!.fiscalYearStart,
        fiscalYearEnd: wizardData.companyInfo!.fiscalYearEnd,
        useControlAccounts: wizardData.configuration?.useControlAccounts ?? true,
        requireApproval: wizardData.configuration?.requireApproval ?? true,
        autoPostingEnabled: wizardData.configuration?.autoPostingEnabled ?? false,
      })

      if (!configResult.success) {
        throw new Error(configResult.error)
      }

      // 2. Apply COA Template
      const templateResult = await applyTemplate(wizardData.coaTemplate!, {
        includeSystemAccounts: true,
      })

      if (!templateResult.success) {
        throw new Error(templateResult.error)
      }

      // 3. Create Financial Periods
      const periodsResult = await createFinancialPeriods({
        startYear: wizardData.periodsConfig!.startYear,
        numberOfYears: wizardData.periodsConfig!.numberOfYears,
        periodType: wizardData.periodsConfig!.periodType,
      })

      if (!periodsResult.success) {
        throw new Error(periodsResult.error)
      }
    })

    await logGLAudit({
      action: 'CREATE',
      entityType: 'GLConfiguration',
      entityId: 'setup-wizard',
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: 'Completed GL setup wizard',
    })

    revalidatePath(`/agency/${context.agencyId}/finance/gl`)

    return { success: true }
  } catch (error) {
    console.error('Error completing setup:', error)
    return { success: false, error: 'Failed to complete GL setup' }
  }
}
```

---

## 6. Settings UI Components

### 6.1 GL Settings Page

```tsx
// src/app/(main)/agency/[agencyId]/finance/gl/settings/page.tsx

import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { hasAgencyPermission } from '@/lib/iam/authz/permissions'
import { getGLConfiguration, getGLSetupStatus } from '@/lib/finance/gl/actions/configuration'
import { GLSettingsForm } from './_components/settings-form'
import { GLSetupWizard } from './_components/setup-wizard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Building, DollarSign, Calendar, Globe, Lock, Database } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

type Props = {
  params: Promise<{ agencyId: string }>
}

export default async function GLSettingsPage({ params }: Props) {
  const { agencyId } = await params

  const session = await auth()
  if (!session?.user?.id) {
    redirect('/sign-in')
  }

  const hasPermission = await hasAgencyPermission(agencyId, 'finance.gl.settings.view')
  if (!hasPermission) {
    notFound()
  }

  const canEdit = await hasAgencyPermission(agencyId, 'finance.gl.settings.edit')

  // Check setup status
  const setupStatus = await getGLSetupStatus()

  if (!setupStatus.success || !setupStatus.data?.isConfigured) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">GL Settings</h1>
        </div>
        <GLSetupWizard agencyId={agencyId} />
      </div>
    )
  }

  const configResult = await getGLConfiguration()
  const config = configResult.data

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">GL Settings</h1>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="fiscal" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Fiscal Year
          </TabsTrigger>
          <TabsTrigger value="currency" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Currency
          </TabsTrigger>
          <TabsTrigger value="posting" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Posting Rules
          </TabsTrigger>
          <TabsTrigger value="integration" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Integration
          </TabsTrigger>
        </TabsList>

        <Suspense fallback={<SettingsTabSkeleton />}>
          <TabsContent value="general" className="mt-6">
            <GeneralSettingsTab config={config} canEdit={canEdit} />
          </TabsContent>

          <TabsContent value="fiscal" className="mt-6">
            <FiscalYearSettingsTab config={config} canEdit={canEdit} />
          </TabsContent>

          <TabsContent value="currency" className="mt-6">
            <CurrencySettingsTab config={config} canEdit={canEdit} />
          </TabsContent>

          <TabsContent value="posting" className="mt-6">
            <PostingRulesSettingsTab config={config} canEdit={canEdit} />
          </TabsContent>

          <TabsContent value="integration" className="mt-6">
            <IntegrationSettingsTab config={config} canEdit={canEdit} />
          </TabsContent>
        </Suspense>
      </Tabs>
    </div>
  )
}

// ========== Tab Components ==========

function GeneralSettingsTab({ config, canEdit }: { config: any; canEdit: boolean }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Account Code Format</CardTitle>
          <CardDescription>Configure how account codes are structured</CardDescription>
        </CardHeader>
        <CardContent>
          <GLSettingsForm
            section="accountCode"
            initialData={{
              accountCodeFormat: config?.accountCodeFormat ?? '####-####',
              accountCodeLength: config?.accountCodeLength ?? 8,
            }}
            disabled={!canEdit}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Control Accounts</CardTitle>
          <CardDescription>Configure control account behavior</CardDescription>
        </CardHeader>
        <CardContent>
          <GLSettingsForm
            section="controlAccounts"
            initialData={{
              useControlAccounts: config?.useControlAccounts ?? true,
            }}
            disabled={!canEdit}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Audit Trail</CardTitle>
          <CardDescription>Configure audit log retention</CardDescription>
        </CardHeader>
        <CardContent>
          <GLSettingsForm
            section="audit"
            initialData={{
              retainAuditDays: config?.retainAuditDays ?? 2555,
            }}
            disabled={!canEdit}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function FiscalYearSettingsTab({ config, canEdit }: { config: any; canEdit: boolean }) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Fiscal Year Configuration</CardTitle>
          <CardDescription>Define your organization&apos;s fiscal year</CardDescription>
        </CardHeader>
        <CardContent>
          <GLSettingsForm
            section="fiscalYear"
            initialData={{
              fiscalYearStart: config?.fiscalYearStart ?? '01-01',
              fiscalYearEnd: config?.fiscalYearEnd ?? '12-31',
              autoCreatePeriods: config?.autoCreatePeriods ?? true,
              periodLockDays: config?.periodLockDays ?? 5,
            }}
            disabled={!canEdit}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function CurrencySettingsTab({ config, canEdit }: { config: any; canEdit: boolean }) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Base Currency</CardTitle>
          <CardDescription>Configure your base reporting currency</CardDescription>
        </CardHeader>
        <CardContent>
          <GLSettingsForm
            section="currency"
            initialData={{
              baseCurrency: config?.baseCurrency ?? 'USD',
            }}
            disabled={!canEdit}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consolidation Settings</CardTitle>
          <CardDescription>Configure multi-entity consolidation</CardDescription>
        </CardHeader>
        <CardContent>
          <GLSettingsForm
            section="consolidation"
            initialData={{
              consolidationMethod: config?.consolidationMethod ?? 'FULL',
              eliminateIntercompany: config?.eliminateIntercompany ?? true,
            }}
            disabled={!canEdit}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function PostingRulesSettingsTab({ config, canEdit }: { config: any; canEdit: boolean }) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Posting Controls</CardTitle>
          <CardDescription>Configure journal entry posting behavior</CardDescription>
        </CardHeader>
        <CardContent>
          <GLSettingsForm
            section="posting"
            initialData={{
              requireApproval: config?.requireApproval ?? true,
              autoPostingEnabled: config?.autoPostingEnabled ?? false,
              allowFuturePeriodPost: config?.allowFuturePeriodPost ?? false,
              allowClosedPeriodPost: config?.allowClosedPeriodPost ?? false,
            }}
            disabled={!canEdit}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function IntegrationSettingsTab({ config, canEdit }: { config: any; canEdit: boolean }) {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>ERP Integration</CardTitle>
          <CardDescription>Connect to external ERP systems</CardDescription>
        </CardHeader>
        <CardContent>
          <GLSettingsForm
            section="erp"
            initialData={{
              erpIntegrationEnabled: config?.erpIntegrationEnabled ?? false,
              erpSystemType: config?.erpSystemType ?? '',
              erpApiUrl: config?.erpApiUrl ?? '',
            }}
            disabled={!canEdit}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function SettingsTabSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 mt-6">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

### 6.2 GL Settings Form Component

```tsx
// src/app/(main)/agency/[agencyId]/finance/gl/settings/_components/settings-form.tsx

'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  updateGLConfiguration,
  updateBaseCurrency,
  updateFiscalYear,
  updateApprovalSettings,
  updateConsolidationSettings,
  updateAccountCodeFormat,
  updateERPIntegration,
} from '@/lib/finance/gl/actions/configuration'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

type SettingsSection =
  | 'accountCode'
  | 'controlAccounts'
  | 'audit'
  | 'fiscalYear'
  | 'currency'
  | 'consolidation'
  | 'posting'
  | 'erp'

type Props = {
  section: SettingsSection
  initialData: Record<string, any>
  disabled?: boolean
}

// ========== Schemas ==========

const accountCodeSchema = z.object({
  accountCodeFormat: z.string().min(1, 'Format is required'),
  accountCodeLength: z.number().min(4).max(16),
})

const controlAccountsSchema = z.object({
  useControlAccounts: z.boolean(),
})

const auditSchema = z.object({
  retainAuditDays: z.number().min(90).max(3650),
})

const fiscalYearSchema = z.object({
  fiscalYearStart: z.string().regex(/^\d{2}-\d{2}$/, 'Use MM-DD format'),
  fiscalYearEnd: z.string().regex(/^\d{2}-\d{2}$/, 'Use MM-DD format'),
  autoCreatePeriods: z.boolean(),
  periodLockDays: z.number().min(0).max(30),
})

const currencySchema = z.object({
  baseCurrency: z.string().length(3, 'Must be 3-letter currency code'),
})

const consolidationSchema = z.object({
  consolidationMethod: z.enum(['FULL', 'PROPORTIONAL', 'EQUITY']),
  eliminateIntercompany: z.boolean(),
})

const postingSchema = z.object({
  requireApproval: z.boolean(),
  autoPostingEnabled: z.boolean(),
  allowFuturePeriodPost: z.boolean(),
  allowClosedPeriodPost: z.boolean(),
})

const erpSchema = z.object({
  erpIntegrationEnabled: z.boolean(),
  erpSystemType: z.string().optional(),
  erpApiUrl: z.string().url().optional().or(z.literal('')),
})

const schemas: Record<SettingsSection, z.ZodSchema> = {
  accountCode: accountCodeSchema,
  controlAccounts: controlAccountsSchema,
  audit: auditSchema,
  fiscalYear: fiscalYearSchema,
  currency: currencySchema,
  consolidation: consolidationSchema,
  posting: postingSchema,
  erp: erpSchema,
}

// ========== Component ==========

export function GLSettingsForm({ section, initialData, disabled }: Props) {
  const [isPending, startTransition] = useTransition()

  const schema = schemas[section]

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: initialData,
  })

  const onSubmit = (data: any) => {
    startTransition(async () => {
      try {
        let result

        switch (section) {
          case 'accountCode':
            result = await updateAccountCodeFormat(data)
            break
          case 'fiscalYear':
            result = await updateFiscalYear(data.fiscalYearStart, data.fiscalYearEnd)
            if (result.success) {
              result = await updateGLConfiguration({
                autoCreatePeriods: data.autoCreatePeriods,
                periodLockDays: data.periodLockDays,
              })
            }
            break
          case 'currency':
            result = await updateBaseCurrency(data.baseCurrency)
            break
          case 'consolidation':
            result = await updateConsolidationSettings(data)
            break
          case 'posting':
            result = await updateApprovalSettings(data)
            break
          case 'erp':
            result = await updateERPIntegration(data)
            break
          default:
            result = await updateGLConfiguration(data)
        }

        if (result.success) {
          toast.success('Settings updated successfully')
        } else {
          toast.error(result.error ?? 'Failed to update settings')
        }
      } catch (error) {
        toast.error('An error occurred while updating settings')
      }
    })
  }

  // Render form based on section
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {section === 'accountCode' && <AccountCodeFields form={form} disabled={disabled} />}
        {section === 'controlAccounts' && <ControlAccountsFields form={form} disabled={disabled} />}
        {section === 'audit' && <AuditFields form={form} disabled={disabled} />}
        {section === 'fiscalYear' && <FiscalYearFields form={form} disabled={disabled} />}
        {section === 'currency' && <CurrencyFields form={form} disabled={disabled} />}
        {section === 'consolidation' && <ConsolidationFields form={form} disabled={disabled} />}
        {section === 'posting' && <PostingFields form={form} disabled={disabled} />}
        {section === 'erp' && <ERPFields form={form} disabled={disabled} />}

        <Button type="submit" disabled={disabled || isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </form>
    </Form>
  )
}

// ========== Field Components ==========

function AccountCodeFields({ form, disabled }: { form: any; disabled?: boolean }) {
  return (
    <>
      <FormField
        control={form.control}
        name="accountCodeFormat"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Account Code Format</FormLabel>
            <FormControl>
              <Input {...field} placeholder="####-####" disabled={disabled} />
            </FormControl>
            <FormDescription>
              Use # for digits, - or . as separators (e.g., ####-####)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="accountCodeLength"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Account Code Length</FormLabel>
            <FormControl>
              <Input
                type="number"
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value))}
                disabled={disabled}
              />
            </FormControl>
            <FormDescription>Number of digits (4-16)</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

function ControlAccountsFields({ form, disabled }: { form: any; disabled?: boolean }) {
  return (
    <FormField
      control={form.control}
      name="useControlAccounts"
      render={({ field }) => (
        <FormItem className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel className="text-base">Use Control Accounts</FormLabel>
            <FormDescription>
              Enable control accounts for AR, AP, and other subledgers
            </FormDescription>
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}

function AuditFields({ form, disabled }: { form: any; disabled?: boolean }) {
  return (
    <FormField
      control={form.control}
      name="retainAuditDays"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Audit Trail Retention (Days)</FormLabel>
          <FormControl>
            <Input
              type="number"
              {...field}
              onChange={(e) => field.onChange(parseInt(e.target.value))}
              disabled={disabled}
            />
          </FormControl>
          <FormDescription>
            Number of days to retain audit trail records (90-3650)
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function FiscalYearFields({ form, disabled }: { form: any; disabled?: boolean }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="fiscalYearStart"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fiscal Year Start</FormLabel>
              <FormControl>
                <Input {...field} placeholder="01-01" disabled={disabled} />
              </FormControl>
              <FormDescription>Format: MM-DD</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fiscalYearEnd"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fiscal Year End</FormLabel>
              <FormControl>
                <Input {...field} placeholder="12-31" disabled={disabled} />
              </FormControl>
              <FormDescription>Format: MM-DD</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="autoCreatePeriods"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Auto-Create Periods</FormLabel>
              <FormDescription>Automatically create periods for new fiscal years</FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="periodLockDays"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Period Lock (Days After Close)</FormLabel>
            <FormControl>
              <Input
                type="number"
                {...field}
                onChange={(e) => field.onChange(parseInt(e.target.value))}
                disabled={disabled}
              />
            </FormControl>
            <FormDescription>Days after month-end before period is locked</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  )
}

function CurrencyFields({ form, disabled }: { form: any; disabled?: boolean }) {
  const currencies = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'CHF', name: 'Swiss Franc' },
    { code: 'CNY', name: 'Chinese Yuan' },
    { code: 'SGD', name: 'Singapore Dollar' },
    { code: 'MYR', name: 'Malaysian Ringgit' },
  ]

  return (
    <FormField
      control={form.control}
      name="baseCurrency"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Base Currency</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={disabled}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {currencies.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code} - {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>
            This cannot be changed after transactions are posted
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function ConsolidationFields({ form, disabled }: { form: any; disabled?: boolean }) {
  return (
    <>
      <FormField
        control={form.control}
        name="consolidationMethod"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Consolidation Method</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={disabled}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="FULL">Full Consolidation</SelectItem>
                <SelectItem value="PROPORTIONAL">Proportional Consolidation</SelectItem>
                <SelectItem value="EQUITY">Equity Method</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="eliminateIntercompany"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Eliminate Intercompany</FormLabel>
              <FormDescription>
                Automatically eliminate intercompany transactions during consolidation
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </>
  )
}

function PostingFields({ form, disabled }: { form: any; disabled?: boolean }) {
  return (
    <>
      <FormField
        control={form.control}
        name="requireApproval"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Require Approval</FormLabel>
              <FormDescription>
                Journal entries require approval before posting
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="autoPostingEnabled"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Auto-Posting</FormLabel>
              <FormDescription>
                Automatically post approved entries
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="allowFuturePeriodPost"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Allow Future Period Posting</FormLabel>
              <FormDescription>
                Allow posting to periods that haven&apos;t started
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="allowClosedPeriodPost"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Allow Closed Period Posting</FormLabel>
              <FormDescription>
                Allow posting to closed periods (requires special permission)
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </>
  )
}

function ERPFields({ form, disabled }: { form: any; disabled?: boolean }) {
  const erpEnabled = form.watch('erpIntegrationEnabled')

  return (
    <>
      <FormField
        control={form.control}
        name="erpIntegrationEnabled"
        render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Enable ERP Integration</FormLabel>
              <FormDescription>
                Connect to external ERP systems for data sync
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            </FormControl>
          </FormItem>
        )}
      />
      {erpEnabled && (
        <>
          <FormField
            control={form.control}
            name="erpSystemType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ERP System</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ERP system" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="SAP">SAP</SelectItem>
                    <SelectItem value="ORACLE">Oracle</SelectItem>
                    <SelectItem value="NETSUITE">NetSuite</SelectItem>
                    <SelectItem value="DYNAMICS">Microsoft Dynamics</SelectItem>
                    <SelectItem value="QUICKBOOKS">QuickBooks</SelectItem>
                    <SelectItem value="XERO">Xero</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="erpApiUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API URL</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="https://api.erp-system.com" disabled={disabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </>
  )
}
```

### 6.3 Setup Wizard Component

```tsx
// src/app/(main)/agency/[agencyId]/finance/gl/settings/_components/setup-wizard.tsx

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Loader2, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react'
import { getAvailableTemplates, applyTemplate } from '@/lib/finance/gl/actions/coa-templates'
import { initializeGLConfiguration } from '@/lib/finance/gl/actions/configuration'
import { createFinancialPeriods } from '@/lib/finance/gl/actions/periods'

type Props = {
  agencyId: string
}

type WizardStep = 'company' | 'coa' | 'periods' | 'review'

const steps: { id: WizardStep; title: string; description: string }[] = [
  { id: 'company', title: 'Company Info', description: 'Configure basic settings' },
  { id: 'coa', title: 'Chart of Accounts', description: 'Select a template' },
  { id: 'periods', title: 'Financial Periods', description: 'Set up periods' },
  { id: 'review', title: 'Review & Finish', description: 'Confirm your settings' },
]

export function GLSetupWizard({ agencyId }: Props) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<WizardStep>('company')
  const [isPending, startTransition] = useTransition()
  const [wizardData, setWizardData] = useState<{
    baseCurrency: string
    fiscalYearStart: string
    fiscalYearEnd: string
    requireApproval: boolean
    coaTemplate: string
    startYear: number
    numberOfYears: number
  }>({
    baseCurrency: 'USD',
    fiscalYearStart: '01-01',
    fiscalYearEnd: '12-31',
    requireApproval: true,
    coaTemplate: 'standard',
    startYear: new Date().getFullYear(),
    numberOfYears: 2,
  })

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  const goNext = () => {
    const nextIndex = Math.min(currentStepIndex + 1, steps.length - 1)
    setCurrentStep(steps[nextIndex].id)
  }

  const goPrev = () => {
    const prevIndex = Math.max(currentStepIndex - 1, 0)
    setCurrentStep(steps[prevIndex].id)
  }

  const handleComplete = () => {
    startTransition(async () => {
      try {
        // 1. Initialize GL Configuration
        const configResult = await initializeGLConfiguration({
          baseCurrency: wizardData.baseCurrency,
          fiscalYearStart: wizardData.fiscalYearStart,
          fiscalYearEnd: wizardData.fiscalYearEnd,
          requireApproval: wizardData.requireApproval,
          useControlAccounts: true,
          autoPostingEnabled: false,
          allowFuturePeriodPost: false,
          allowClosedPeriodPost: false,
        })

        if (!configResult.success) {
          toast.error(configResult.error)
          return
        }

        // 2. Apply COA Template
        const templateResult = await applyTemplate(wizardData.coaTemplate, {
          includeSystemAccounts: true,
        })

        if (!templateResult.success) {
          toast.error(templateResult.error)
          return
        }

        // 3. Create Financial Periods
        const periodsResult = await createFinancialPeriods({
          startYear: wizardData.startYear,
          numberOfYears: wizardData.numberOfYears,
          periodType: 'MONTHLY',
        })

        if (!periodsResult.success) {
          toast.error(periodsResult.error)
          return
        }

        toast.success('GL setup completed successfully!')
        router.push(`/agency/${agencyId}/finance/gl`)
        router.refresh()
      } catch (error) {
        toast.error('Failed to complete GL setup')
      }
    })
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>GL Setup Wizard</CardTitle>
        <CardDescription>
          Complete these steps to set up your General Ledger
        </CardDescription>
        <Progress value={progress} className="mt-4" />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          {steps.map((step, idx) => (
            <span
              key={step.id}
              className={idx <= currentStepIndex ? 'text-primary font-medium' : ''}
            >
              {step.title}
            </span>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {currentStep === 'company' && (
          <CompanyStep
            data={wizardData}
            onUpdate={(data) => setWizardData((prev) => ({ ...prev, ...data }))}
          />
        )}
        {currentStep === 'coa' && (
          <COAStep
            data={wizardData}
            onUpdate={(data) => setWizardData((prev) => ({ ...prev, ...data }))}
          />
        )}
        {currentStep === 'periods' && (
          <PeriodsStep
            data={wizardData}
            onUpdate={(data) => setWizardData((prev) => ({ ...prev, ...data }))}
          />
        )}
        {currentStep === 'review' && <ReviewStep data={wizardData} />}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={currentStepIndex === 0 || isPending}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        {currentStep === 'review' ? (
          <Button onClick={handleComplete} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Complete Setup
              </>
            )}
          </Button>
        ) : (
          <Button onClick={goNext} disabled={isPending}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

// ========== Step Components ==========

function CompanyStep({
  data,
  onUpdate,
}: {
  data: any
  onUpdate: (data: any) => void
}) {
  const currencies = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'MYR', name: 'Malaysian Ringgit' },
    { code: 'SGD', name: 'Singapore Dollar' },
  ]

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Base Currency</label>
        <Select
          value={data.baseCurrency}
          onValueChange={(v) => onUpdate({ baseCurrency: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.code} - {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          This will be your primary reporting currency
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Fiscal Year Start</label>
          <Input
            value={data.fiscalYearStart}
            onChange={(e) => onUpdate({ fiscalYearStart: e.target.value })}
            placeholder="01-01"
          />
          <p className="text-sm text-muted-foreground">Format: MM-DD</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Fiscal Year End</label>
          <Input
            value={data.fiscalYearEnd}
            onChange={(e) => onUpdate({ fiscalYearEnd: e.target.value })}
            placeholder="12-31"
          />
          <p className="text-sm text-muted-foreground">Format: MM-DD</p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <label className="text-sm font-medium">Require Approval</label>
          <p className="text-sm text-muted-foreground">
            Journal entries require approval before posting
          </p>
        </div>
        <Switch
          checked={data.requireApproval}
          onCheckedChange={(v) => onUpdate({ requireApproval: v })}
        />
      </div>
    </div>
  )
}

function COAStep({
  data,
  onUpdate,
}: {
  data: any
  onUpdate: (data: any) => void
}) {
  const templates = [
    {
      id: 'standard',
      name: 'Standard Business',
      description: 'General-purpose chart of accounts',
      accounts: 45,
    },
    {
      id: 'service-business',
      name: 'Service Business',
      description: 'For professional service companies',
      accounts: 38,
    },
    {
      id: 'agency',
      name: 'Agency/Creative',
      description: 'For marketing and creative agencies',
      accounts: 52,
    },
    {
      id: 'minimal',
      name: 'Minimal',
      description: 'Basic accounts for simple needs',
      accounts: 20,
    },
  ]

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select a chart of accounts template to get started quickly
      </p>

      <RadioGroup
        value={data.coaTemplate}
        onValueChange={(v) => onUpdate({ coaTemplate: v })}
        className="grid gap-4"
      >
        {templates.map((t) => (
          <div key={t.id} className="flex items-center space-x-2">
            <RadioGroupItem value={t.id} id={t.id} />
            <label
              htmlFor={t.id}
              className="flex flex-1 cursor-pointer items-center justify-between rounded-lg border p-4 hover:bg-accent"
            >
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.description}</p>
              </div>
              <span className="text-sm text-muted-foreground">{t.accounts} accounts</span>
            </label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}

function PeriodsStep({
  data,
  onUpdate,
}: {
  data: any
  onUpdate: (data: any) => void
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Starting Year</label>
        <Input
          type="number"
          value={data.startYear}
          onChange={(e) => onUpdate({ startYear: parseInt(e.target.value) })}
          min={2020}
          max={2030}
        />
        <p className="text-sm text-muted-foreground">
          The first year to create financial periods for
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Number of Years</label>
        <Select
          value={data.numberOfYears.toString()}
          onValueChange={(v) => onUpdate({ numberOfYears: parseInt(v) })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 Year (12 periods)</SelectItem>
            <SelectItem value="2">2 Years (24 periods)</SelectItem>
            <SelectItem value="3">3 Years (36 periods)</SelectItem>
            <SelectItem value="5">5 Years (60 periods)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Monthly periods will be created for each year
        </p>
      </div>
    </div>
  )
}

function ReviewStep({ data }: { data: any }) {
  const templateNames: Record<string, string> = {
    standard: 'Standard Business',
    'service-business': 'Service Business',
    agency: 'Agency/Creative',
    minimal: 'Minimal',
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Please review your settings before completing the setup:
      </p>

      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Base Currency</span>
          <span className="font-medium">{data.baseCurrency}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Fiscal Year</span>
          <span className="font-medium">
            {data.fiscalYearStart} to {data.fiscalYearEnd}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Require Approval</span>
          <span className="font-medium">{data.requireApproval ? 'Yes' : 'No'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">COA Template</span>
          <span className="font-medium">{templateNames[data.coaTemplate]}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Periods</span>
          <span className="font-medium">
            {data.startYear} - {data.startYear + data.numberOfYears - 1} ({data.numberOfYears * 12}{' '}
            periods)
          </span>
        </div>
      </div>

      <div className="rounded-lg bg-muted p-4">
        <p className="text-sm">
          <strong>Note:</strong> After setup, you can add more accounts and periods, but some
          settings like base currency cannot be changed after transactions are posted.
        </p>
      </div>
    </div>
  )
}
```

---

## 7. Reports UI Components

### 7.1 Reports Dashboard Page

```tsx
// src/app/(main)/agency/[agencyId]/finance/gl/reports/page.tsx

import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { hasAgencyPermission } from '@/lib/iam/authz/permissions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  FileSpreadsheet,
  BarChart3,
  TrendingUp,
  PieChart,
  Scale,
  Calculator,
  ArrowRightLeft,
  FileText,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

type Props = {
  params: Promise<{ agencyId: string }>
}

type ReportCategory = {
  title: string
  description: string
  icon: React.ReactNode
  reports: {
    id: string
    name: string
    description: string
    href: string
    badge?: string
  }[]
}

export default async function GLReportsPage({ params }: Props) {
  const { agencyId } = await params

  const session = await auth()
  if (!session?.user?.id) {
    redirect('/sign-in')
  }

  const hasPermission = await hasAgencyPermission(agencyId, 'finance.gl.reports.view')
  if (!hasPermission) {
    notFound()
  }

  const reportCategories: ReportCategory[] = [
    {
      title: 'Financial Statements',
      description: 'Standard financial reporting',
      icon: <FileSpreadsheet className="h-5 w-5" />,
      reports: [
        {
          id: 'trial-balance',
          name: 'Trial Balance',
          description: 'Account balances for a period',
          href: `/agency/${agencyId}/finance/gl/reports/trial-balance`,
        },
        {
          id: 'balance-sheet',
          name: 'Balance Sheet',
          description: 'Assets, liabilities, and equity',
          href: `/agency/${agencyId}/finance/gl/reports/balance-sheet`,
        },
        {
          id: 'income-statement',
          name: 'Income Statement',
          description: 'Revenue and expenses',
          href: `/agency/${agencyId}/finance/gl/reports/income-statement`,
        },
        {
          id: 'cash-flow',
          name: 'Cash Flow Statement',
          description: 'Operating, investing, financing activities',
          href: `/agency/${agencyId}/finance/gl/reports/cash-flow`,
        },
      ],
    },
    {
      title: 'General Ledger Reports',
      description: 'Detailed GL analysis',
      icon: <FileText className="h-5 w-5" />,
      reports: [
        {
          id: 'general-ledger',
          name: 'General Ledger',
          description: 'All transactions by account',
          href: `/agency/${agencyId}/finance/gl/reports/general-ledger`,
        },
        {
          id: 'journal-register',
          name: 'Journal Register',
          description: 'Journal entry listing',
          href: `/agency/${agencyId}/finance/gl/reports/journal-register`,
        },
        {
          id: 'account-activity',
          name: 'Account Activity',
          description: 'Transaction details for specific accounts',
          href: `/agency/${agencyId}/finance/gl/reports/account-activity`,
        },
      ],
    },
    {
      title: 'Analysis Reports',
      description: 'Comparative and trend analysis',
      icon: <TrendingUp className="h-5 w-5" />,
      reports: [
        {
          id: 'comparative',
          name: 'Comparative Analysis',
          description: 'Period-over-period comparison',
          href: `/agency/${agencyId}/finance/gl/reports/comparative`,
        },
        {
          id: 'variance',
          name: 'Variance Report',
          description: 'Budget vs actual analysis',
          href: `/agency/${agencyId}/finance/gl/reports/variance`,
          badge: 'Coming Soon',
        },
        {
          id: 'trend',
          name: 'Trend Analysis',
          description: 'Historical trend visualization',
          href: `/agency/${agencyId}/finance/gl/reports/trend`,
        },
      ],
    },
    {
      title: 'Consolidation Reports',
      description: 'Multi-entity reporting',
      icon: <ArrowRightLeft className="h-5 w-5" />,
      reports: [
        {
          id: 'consolidated-tb',
          name: 'Consolidated Trial Balance',
          description: 'Combined trial balance',
          href: `/agency/${agencyId}/finance/gl/reports/consolidated-trial-balance`,
        },
        {
          id: 'intercompany',
          name: 'Intercompany Transactions',
          description: 'Entity-to-entity transactions',
          href: `/agency/${agencyId}/finance/gl/reports/intercompany`,
        },
        {
          id: 'elimination',
          name: 'Elimination Report',
          description: 'Intercompany elimination entries',
          href: `/agency/${agencyId}/finance/gl/reports/elimination`,
        },
      ],
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financial Reports</h1>
          <p className="text-muted-foreground">Generate and export financial reports</p>
        </div>
      </div>

      {/* Report Categories */}
      <Suspense fallback={<ReportsSkeleton />}>
        <div className="grid gap-6 md:grid-cols-2">
          {reportCategories.map((category) => (
            <Card key={category.title}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  {category.icon}
                  <CardTitle className="text-lg">{category.title}</CardTitle>
                </div>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {category.reports.map((report) => (
                    <Link
                      key={report.id}
                      href={report.badge ? '#' : report.href}
                      className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                        report.badge
                          ? 'cursor-not-allowed opacity-60'
                          : 'hover:bg-accent'
                      }`}
                    >
                      <div>
                        <p className="font-medium">{report.name}</p>
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                      </div>
                      {report.badge && (
                        <Badge variant="secondary">{report.badge}</Badge>
                      )}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Suspense>
    </div>
  )
}

function ReportsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
```

### 7.2 Trial Balance Report Page

```tsx
// src/app/(main)/agency/[agencyId]/finance/gl/reports/trial-balance/page.tsx

import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { hasAgencyPermission } from '@/lib/iam/authz/permissions'
import { getTrialBalance } from '@/lib/finance/gl/actions/reports'
import { getFinancialPeriods } from '@/lib/finance/gl/actions/periods'
import { TrialBalanceReport } from './_components/trial-balance-report'
import { ReportFilters } from '../_components/report-filters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

type Props = {
  params: Promise<{ agencyId: string }>
  searchParams: Promise<{ periodId?: string; asOfDate?: string }>
}

export default async function TrialBalancePage({ params, searchParams }: Props) {
  const { agencyId } = await params
  const { periodId, asOfDate } = await searchParams

  const session = await auth()
  if (!session?.user?.id) {
    redirect('/sign-in')
  }

  const hasPermission = await hasAgencyPermission(agencyId, 'finance.gl.reports.view')
  if (!hasPermission) {
    notFound()
  }

  // Get available periods
  const periodsResult = await getFinancialPeriods()
  const periods = periodsResult.data ?? []

  // Get trial balance data
  const reportResult = periodId
    ? await getTrialBalance({ periodId })
    : asOfDate
      ? await getTrialBalance({ asOfDate })
      : null

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/agency/${agencyId}/finance/gl/reports`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Trial Balance</h1>
          <p className="text-muted-foreground">
            Account balances showing debits and credits
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportFilters
            reportType="trial-balance"
            periods={periods}
            selectedPeriodId={periodId}
            selectedAsOfDate={asOfDate}
            basePath={`/agency/${agencyId}/finance/gl/reports/trial-balance`}
          />
        </CardContent>
      </Card>

      {/* Report */}
      <Suspense fallback={<ReportSkeleton />}>
        {reportResult?.success && reportResult.data ? (
          <TrialBalanceReport
            data={reportResult.data}
            agencyId={agencyId}
            periodId={periodId}
            asOfDate={asOfDate}
          />
        ) : reportResult && !reportResult.success ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                {reportResult.error ?? 'Failed to load report'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">
                Select a period or date to generate the report
              </p>
            </CardContent>
          </Card>
        )}
      </Suspense>
    </div>
  )
}

function ReportSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

### 7.3 Trial Balance Report Component

```tsx
// src/app/(main)/agency/[agencyId]/finance/gl/reports/trial-balance/_components/trial-balance-report.tsx

'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, FileText, Printer, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

type TrialBalanceData = {
  accounts: {
    accountCode: string
    accountName: string
    accountType: string
    debit: number
    credit: number
    balance: number
  }[]
  totals: {
    debit: number
    credit: number
  }
  metadata: {
    periodName?: string
    asOfDate?: string
    generatedAt: string
    currency: string
  }
}

type Props = {
  data: TrialBalanceData
  agencyId: string
  periodId?: string
  asOfDate?: string
}

export function TrialBalanceReport({ data, agencyId, periodId, asOfDate }: Props) {
  const [isPending, startTransition] = useTransition()
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'pdf' | null>(null)

  const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    setExportFormat(format)
    startTransition(async () => {
      try {
        const params = new URLSearchParams()
        params.set('format', format)
        if (periodId) params.set('periodId', periodId)
        if (asOfDate) params.set('asOfDate', asOfDate)

        const response = await fetch(
          `/api/finance/gl/reports/trial-balance/export?${params.toString()}`
        )

        if (!response.ok) {
          throw new Error('Export failed')
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `trial-balance-${periodId ?? asOfDate}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast.success(`Report exported as ${format.toUpperCase()}`)
      } catch (error) {
        toast.error('Failed to export report')
      } finally {
        setExportFormat(null)
      }
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const isBalanced = Math.abs(data.totals.debit - data.totals.credit) < 0.01

  return (
    <Card className="print:shadow-none print:border-none">
      <CardHeader className="flex flex-row items-center justify-between print:hidden">
        <div>
          <CardTitle>Trial Balance</CardTitle>
          <p className="text-sm text-muted-foreground">
            {data.metadata.periodName ?? `As of ${data.metadata.asOfDate}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isPending}>
                {isPending && exportFormat ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-2xl font-bold">Trial Balance</h1>
        <p className="text-muted-foreground">
          {data.metadata.periodName ?? `As of ${data.metadata.asOfDate}`}
        </p>
        <p className="text-sm text-muted-foreground">
          Generated: {new Date(data.metadata.generatedAt).toLocaleString()}
        </p>
      </div>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Account Code</TableHead>
              <TableHead>Account Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.accounts.map((account) => (
              <TableRow key={account.accountCode}>
                <TableCell className="font-mono">{account.accountCode}</TableCell>
                <TableCell>{account.accountName}</TableCell>
                <TableCell className="capitalize">
                  {account.accountType.toLowerCase().replace('_', ' ')}
                </TableCell>
                <TableCell className="text-right">
                  {account.debit > 0
                    ? formatCurrency(account.debit, data.metadata.currency)
                    : '-'}
                </TableCell>
                <TableCell className="text-right">
                  {account.credit > 0
                    ? formatCurrency(account.credit, data.metadata.currency)
                    : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="font-bold">
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell className="text-right">
                {formatCurrency(data.totals.debit, data.metadata.currency)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(data.totals.credit, data.metadata.currency)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>

        {/* Balance Check */}
        <div className={`mt-4 p-4 rounded-lg ${isBalanced ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
          <p className={`text-sm font-medium ${isBalanced ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
            {isBalanced ? (
              '✓ Trial balance is balanced (debits = credits)'
            ) : (
              `⚠ Trial balance is out of balance by ${formatCurrency(Math.abs(data.totals.debit - data.totals.credit), data.metadata.currency)}`
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 7.4 Report Filters Component

```tsx
// src/app/(main)/agency/[agencyId]/finance/gl/reports/_components/report-filters.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

type Period = {
  id: string
  name: string
  startDate: Date
  endDate: Date
  status: string
}

type Props = {
  reportType: string
  periods: Period[]
  selectedPeriodId?: string
  selectedAsOfDate?: string
  selectedFromDate?: string
  selectedToDate?: string
  basePath: string
}

export function ReportFilters({
  reportType,
  periods,
  selectedPeriodId,
  selectedAsOfDate,
  selectedFromDate,
  selectedToDate,
  basePath,
}: Props) {
  const router = useRouter()
  const [filterType, setFilterType] = useState<'period' | 'date' | 'range'>(
    selectedPeriodId ? 'period' : selectedFromDate ? 'range' : 'date'
  )
  const [periodId, setPeriodId] = useState(selectedPeriodId ?? '')
  const [asOfDate, setAsOfDate] = useState<Date | undefined>(
    selectedAsOfDate ? new Date(selectedAsOfDate) : undefined
  )
  const [fromDate, setFromDate] = useState<Date | undefined>(
    selectedFromDate ? new Date(selectedFromDate) : undefined
  )
  const [toDate, setToDate] = useState<Date | undefined>(
    selectedToDate ? new Date(selectedToDate) : undefined
  )

  const handleGenerate = () => {
    const params = new URLSearchParams()

    if (filterType === 'period' && periodId) {
      params.set('periodId', periodId)
    } else if (filterType === 'date' && asOfDate) {
      params.set('asOfDate', format(asOfDate, 'yyyy-MM-dd'))
    } else if (filterType === 'range' && fromDate && toDate) {
      params.set('fromDate', format(fromDate, 'yyyy-MM-dd'))
      params.set('toDate', format(toDate, 'yyyy-MM-dd'))
    }

    router.push(`${basePath}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
      {/* Filter Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Filter By</label>
        <Select
          value={filterType}
          onValueChange={(v) => setFilterType(v as 'period' | 'date' | 'range')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="period">Financial Period</SelectItem>
            <SelectItem value="date">As of Date</SelectItem>
            {(reportType === 'general-ledger' || reportType === 'journal-register') && (
              <SelectItem value="range">Date Range</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Period Selector */}
      {filterType === 'period' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Period</label>
          <Select value={periodId} onValueChange={setPeriodId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period.id} value={period.id}>
                  {period.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* As of Date Picker */}
      {filterType === 'date' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">As of Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[250px] justify-start text-left font-normal',
                  !asOfDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {asOfDate ? format(asOfDate, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={asOfDate}
                onSelect={setAsOfDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Date Range Picker */}
      {filterType === 'range' && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium">From Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-[180px] justify-start text-left font-normal',
                    !fromDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fromDate ? format(fromDate, 'PP') : 'Start'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={setFromDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">To Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-[180px] justify-start text-left font-normal',
                    !toDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {toDate ? format(toDate, 'PP') : 'End'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={setToDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </>
      )}

      {/* Generate Button */}
      <Button onClick={handleGenerate}>
        <Search className="h-4 w-4 mr-2" />
        Generate Report
      </Button>
    </div>
  )
}
```

### 7.5 Report Export API Route

```typescript
// src/app/api/finance/gl/reports/trial-balance/export/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { hasAgencyPermission } from '@/lib/iam/authz/permissions'
import { db } from '@/lib/db'
import { getTrialBalance } from '@/lib/finance/gl/actions/reports'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get session context
    const dbSession = await db.session.findFirst({
      where: { userId: session.user.id },
      select: { activeAgencyId: true },
    })

    if (!dbSession?.activeAgencyId) {
      return NextResponse.json({ error: 'No active agency' }, { status: 400 })
    }

    const hasPermission = await hasAgencyPermission(
      dbSession.activeAgencyId,
      'finance.gl.reports.export'
    )
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') ?? 'csv'
    const periodId = searchParams.get('periodId')
    const asOfDate = searchParams.get('asOfDate')

    // Get report data
    const reportResult = periodId
      ? await getTrialBalance({ periodId })
      : asOfDate
        ? await getTrialBalance({ asOfDate })
        : null

    if (!reportResult?.success || !reportResult.data) {
      return NextResponse.json(
        { error: reportResult?.error ?? 'Failed to generate report' },
        { status: 400 }
      )
    }

    const data = reportResult.data

    // Generate export based on format
    if (format === 'csv') {
      const headers = ['Account Code', 'Account Name', 'Type', 'Debit', 'Credit']
      const rows = data.accounts.map((a) =>
        [
          a.accountCode,
          `"${a.accountName}"`,
          a.accountType,
          a.debit.toFixed(2),
          a.credit.toFixed(2),
        ].join(',')
      )
      rows.push(['', 'TOTAL', '', data.totals.debit.toFixed(2), data.totals.credit.toFixed(2)].join(','))

      const csv = [headers.join(','), ...rows].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="trial-balance-${periodId ?? asOfDate}.csv"`,
        },
      })
    }

    if (format === 'xlsx') {
      // For Excel, we'd typically use a library like exceljs
      // Simplified JSON response for now
      return NextResponse.json(data, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="trial-balance-${periodId ?? asOfDate}.json"`,
        },
      })
    }

    if (format === 'pdf') {
      // For PDF, we'd typically use a library like pdfkit or puppeteer
      // Return error for now
      return NextResponse.json(
        { error: 'PDF export not yet implemented' },
        { status: 501 }
      )
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
```

---

## 8. Additional Forms

### 8.1 Reconciliation Form

```tsx
// src/components/forms/finance/gl/reconciliation-form.tsx

'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  createReconciliation,
  updateReconciliation,
  completeReconciliation,
} from '@/lib/finance/gl/actions/reconciliation'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Loader2, CalendarIcon, CheckCircle, AlertCircle } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

// ========== Schema ==========

const reconciliationFormSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  periodId: z.string().min(1, 'Period is required'),
  statementDate: z.date({ required_error: 'Statement date is required' }),
  statementBalance: z.number({ required_error: 'Statement balance is required' }),
  notes: z.string().optional(),
})

type ReconciliationFormValues = z.infer<typeof reconciliationFormSchema>

// ========== Types ==========

type Account = {
  id: string
  accountCode: string
  accountName: string
  currentBalance: number
}

type Period = {
  id: string
  name: string
  status: string
}

type Reconciliation = {
  id: string
  accountId: string
  periodId: string
  statementDate: Date
  statementBalance: number
  glBalance: number
  difference: number
  status: string
  notes?: string
}

type Props = {
  accounts: Account[]
  periods: Period[]
  existingReconciliation?: Reconciliation
  agencyId: string
  onSuccess?: () => void
}

// ========== Component ==========

export function ReconciliationForm({
  accounts,
  periods,
  existingReconciliation,
  agencyId,
  onSuccess,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(
    existingReconciliation
      ? accounts.find((a) => a.id === existingReconciliation.accountId) ?? null
      : null
  )

  const form = useForm<ReconciliationFormValues>({
    resolver: zodResolver(reconciliationFormSchema),
    defaultValues: existingReconciliation
      ? {
          accountId: existingReconciliation.accountId,
          periodId: existingReconciliation.periodId,
          statementDate: new Date(existingReconciliation.statementDate),
          statementBalance: existingReconciliation.statementBalance,
          notes: existingReconciliation.notes ?? '',
        }
      : {
          accountId: '',
          periodId: '',
          statementBalance: 0,
          notes: '',
        },
  })

  const watchAccountId = form.watch('accountId')
  const watchStatementBalance = form.watch('statementBalance')

  // Calculate difference
  const glBalance = selectedAccount?.currentBalance ?? 0
  const difference = watchStatementBalance - glBalance

  const onSubmit = (data: ReconciliationFormValues) => {
    startTransition(async () => {
      try {
        const result = existingReconciliation
          ? await updateReconciliation(existingReconciliation.id, {
              statementDate: data.statementDate.toISOString(),
              statementBalance: data.statementBalance,
              notes: data.notes,
            })
          : await createReconciliation({
              accountId: data.accountId,
              periodId: data.periodId,
              statementDate: data.statementDate.toISOString(),
              statementBalance: data.statementBalance,
              notes: data.notes,
            })

        if (result.success) {
          toast.success(
            existingReconciliation
              ? 'Reconciliation updated'
              : 'Reconciliation created'
          )
          router.refresh()
          onSuccess?.()
        } else {
          toast.error(result.error ?? 'Failed to save reconciliation')
        }
      } catch (error) {
        toast.error('An error occurred')
      }
    })
  }

  const handleComplete = () => {
    if (!existingReconciliation) return

    startTransition(async () => {
      try {
        const result = await completeReconciliation(existingReconciliation.id)

        if (result.success) {
          toast.success('Reconciliation completed')
          router.refresh()
          onSuccess?.()
        } else {
          toast.error(result.error ?? 'Failed to complete reconciliation')
        }
      } catch (error) {
        toast.error('An error occurred')
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {existingReconciliation ? 'Edit Reconciliation' : 'New Reconciliation'}
            </CardTitle>
            <CardDescription>
              Reconcile account balances with external statements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Account Selection */}
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                      setSelectedAccount(accounts.find((a) => a.id === value) ?? null)
                    }}
                    disabled={!!existingReconciliation}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account to reconcile" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.accountCode} - {account.accountName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Period Selection */}
            <FormField
              control={form.control}
              name="periodId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Period</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!!existingReconciliation}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {periods
                        .filter((p) => p.status !== 'CLOSED')
                        .map((period) => (
                          <SelectItem key={period.id} value={period.id}>
                            {period.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Statement Date */}
            <FormField
              control={form.control}
              name="statementDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Statement Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Statement Balance */}
            <FormField
              control={form.control}
              name="statementBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statement Balance</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    The balance shown on the external statement
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Balance Comparison */}
            {selectedAccount && (
              <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-muted">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">GL Balance</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(glBalance, 'USD')}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Statement Balance</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(watchStatementBalance, 'USD')}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Difference</p>
                  <p
                    className={cn(
                      'text-lg font-semibold',
                      Math.abs(difference) < 0.01
                        ? 'text-green-600'
                        : 'text-red-600'
                    )}
                  >
                    {formatCurrency(difference, 'USD')}
                  </p>
                </div>
              </div>
            )}

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Add reconciliation notes..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {existingReconciliation ? 'Update' : 'Create'}
              </Button>
              {existingReconciliation && Math.abs(difference) < 0.01 && (
                <Button
                  type="button"
                  variant="default"
                  onClick={handleComplete}
                  disabled={isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Complete
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
```

### 8.2 Period Management Form

```tsx
// src/components/forms/finance/gl/period-form.tsx

'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  createFinancialPeriod,
  updatePeriodStatus,
  closePeriod,
  reopenPeriod,
} from '@/lib/finance/gl/actions/periods'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Loader2, CalendarIcon, Lock, Unlock, Play, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

// ========== Schema ==========

const periodFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  periodNumber: z.number().min(1).max(12),
  fiscalYear: z.number().min(2020).max(2099),
  startDate: z.date({ required_error: 'Start date is required' }),
  endDate: z.date({ required_error: 'End date is required' }),
  periodType: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL']),
})

type PeriodFormValues = z.infer<typeof periodFormSchema>

// ========== Types ==========

type Period = {
  id: string
  name: string
  periodNumber: number
  fiscalYear: number
  startDate: Date
  endDate: Date
  status: 'OPEN' | 'CLOSED' | 'LOCKED' | 'FUTURE'
  periodType: string
}

type Props = {
  existingPeriod?: Period
  agencyId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

// ========== Component ==========

export function PeriodForm({
  existingPeriod,
  agencyId,
  open,
  onOpenChange,
  onSuccess,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<PeriodFormValues>({
    resolver: zodResolver(periodFormSchema),
    defaultValues: existingPeriod
      ? {
          name: existingPeriod.name,
          periodNumber: existingPeriod.periodNumber,
          fiscalYear: existingPeriod.fiscalYear,
          startDate: new Date(existingPeriod.startDate),
          endDate: new Date(existingPeriod.endDate),
          periodType: existingPeriod.periodType as 'MONTHLY' | 'QUARTERLY' | 'ANNUAL',
        }
      : {
          name: '',
          periodNumber: 1,
          fiscalYear: new Date().getFullYear(),
          periodType: 'MONTHLY',
        },
  })

  const onSubmit = (data: PeriodFormValues) => {
    startTransition(async () => {
      try {
        const result = await createFinancialPeriod({
          name: data.name,
          periodNumber: data.periodNumber,
          fiscalYear: data.fiscalYear,
          startDate: data.startDate.toISOString(),
          endDate: data.endDate.toISOString(),
          periodType: data.periodType,
        })

        if (result.success) {
          toast.success('Period created successfully')
          form.reset()
          onOpenChange(false)
          router.refresh()
          onSuccess?.()
        } else {
          toast.error(result.error ?? 'Failed to create period')
        }
      } catch (error) {
        toast.error('An error occurred')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {existingPeriod ? 'Edit Period' : 'Create Financial Period'}
          </DialogTitle>
          <DialogDescription>
            Define a new accounting period for your fiscal year
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Period Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Period Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="January 2025" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Fiscal Year */}
              <FormField
                control={form.control}
                name="fiscalYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fiscal Year</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Period Number */}
              <FormField
                control={form.control}
                name="periodNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period Number</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={12}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Period Type */}
            <FormField
              control={form.control}
              name="periodType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Period Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                      <SelectItem value="ANNUAL">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? format(field.value, 'PP') : 'Pick'}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Date */}
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? format(field.value, 'PP') : 'Pick'}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {existingPeriod ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ========== Period Status Actions Component ==========

export function PeriodStatusActions({
  period,
  onSuccess,
}: {
  period: Period
  onSuccess?: () => void
}) {
  const [isPending, startTransition] = useTransition()

  const handleClose = () => {
    startTransition(async () => {
      const result = await closePeriod(period.id)
      if (result.success) {
        toast.success('Period closed successfully')
        onSuccess?.()
      } else {
        toast.error(result.error ?? 'Failed to close period')
      }
    })
  }

  const handleReopen = () => {
    startTransition(async () => {
      const result = await reopenPeriod(period.id)
      if (result.success) {
        toast.success('Period reopened successfully')
        onSuccess?.()
      } else {
        toast.error(result.error ?? 'Failed to reopen period')
      }
    })
  }

  const handleStatusChange = (status: string) => {
    startTransition(async () => {
      const result = await updatePeriodStatus(period.id, status as any)
      if (result.success) {
        toast.success(`Period status updated to ${status}`)
        onSuccess?.()
      } else {
        toast.error(result.error ?? 'Failed to update status')
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={
          period.status === 'OPEN'
            ? 'default'
            : period.status === 'CLOSED'
              ? 'secondary'
              : period.status === 'LOCKED'
                ? 'destructive'
                : 'outline'
        }
      >
        {period.status}
      </Badge>

      {period.status === 'OPEN' && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={isPending}>
              <Lock className="h-4 w-4 mr-1" />
              Close
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Close Period?</AlertDialogTitle>
              <AlertDialogDescription>
                Closing this period will prevent new journal entries from being posted.
                This action can be reversed by reopening the period.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClose}>Close Period</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {period.status === 'CLOSED' && (
        <Button variant="outline" size="sm" onClick={handleReopen} disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Unlock className="h-4 w-4 mr-1" />
              Reopen
            </>
          )}
        </Button>
      )}

      {period.status === 'FUTURE' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleStatusChange('OPEN')}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Play className="h-4 w-4 mr-1" />
              Open
            </>
          )}
        </Button>
      )}
    </div>
  )
}
```

### 8.3 Posting Rules Form

```tsx
// src/components/forms/finance/gl/posting-rule-form.tsx

'use client'

import { useTransition } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  createPostingRule,
  updatePostingRule,
} from '@/lib/finance/gl/actions/posting-rules'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Loader2, Plus, Trash2 } from 'lucide-react'

// ========== Schema ==========

const lineSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  debitFormula: z.string().optional(),
  creditFormula: z.string().optional(),
  description: z.string().optional(),
})

const postingRuleFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  sourceType: z.string().min(1, 'Source type is required'),
  triggerEvent: z.string().min(1, 'Trigger event is required'),
  isActive: z.boolean().default(true),
  lines: z.array(lineSchema).min(2, 'At least 2 lines are required'),
})

type PostingRuleFormValues = z.infer<typeof postingRuleFormSchema>

// ========== Types ==========

type Account = {
  id: string
  accountCode: string
  accountName: string
}

type PostingRule = {
  id: string
  name: string
  description?: string
  sourceType: string
  triggerEvent: string
  isActive: boolean
  lines: {
    id: string
    accountId: string
    debitFormula?: string
    creditFormula?: string
    description?: string
  }[]
}

type Props = {
  accounts: Account[]
  existingRule?: PostingRule
  agencyId: string
  onSuccess?: () => void
}

// ========== Component ==========

export function PostingRuleForm({
  accounts,
  existingRule,
  agencyId,
  onSuccess,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<PostingRuleFormValues>({
    resolver: zodResolver(postingRuleFormSchema),
    defaultValues: existingRule
      ? {
          name: existingRule.name,
          description: existingRule.description ?? '',
          sourceType: existingRule.sourceType,
          triggerEvent: existingRule.triggerEvent,
          isActive: existingRule.isActive,
          lines: existingRule.lines.map((l) => ({
            accountId: l.accountId,
            debitFormula: l.debitFormula ?? '',
            creditFormula: l.creditFormula ?? '',
            description: l.description ?? '',
          })),
        }
      : {
          name: '',
          description: '',
          sourceType: '',
          triggerEvent: '',
          isActive: true,
          lines: [
            { accountId: '', debitFormula: '', creditFormula: '', description: '' },
            { accountId: '', debitFormula: '', creditFormula: '', description: '' },
          ],
        },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  })

  const onSubmit = (data: PostingRuleFormValues) => {
    startTransition(async () => {
      try {
        const result = existingRule
          ? await updatePostingRule(existingRule.id, data)
          : await createPostingRule(data)

        if (result.success) {
          toast.success(
            existingRule ? 'Posting rule updated' : 'Posting rule created'
          )
          router.refresh()
          onSuccess?.()
        } else {
          toast.error(result.error ?? 'Failed to save posting rule')
        }
      } catch (error) {
        toast.error('An error occurred')
      }
    })
  }

  const sourceTypes = [
    { value: 'INVOICE', label: 'Invoice' },
    { value: 'PAYMENT', label: 'Payment' },
    { value: 'EXPENSE', label: 'Expense' },
    { value: 'PAYROLL', label: 'Payroll' },
    { value: 'ASSET', label: 'Fixed Asset' },
    { value: 'MANUAL', label: 'Manual Entry' },
  ]

  const triggerEvents = [
    { value: 'ON_CREATE', label: 'On Create' },
    { value: 'ON_APPROVE', label: 'On Approve' },
    { value: 'ON_POST', label: 'On Post' },
    { value: 'ON_VOID', label: 'On Void' },
  ]

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {existingRule ? 'Edit Posting Rule' : 'Create Posting Rule'}
            </CardTitle>
            <CardDescription>
              Define automatic journal entry posting rules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rule Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Sales Invoice Posting" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>Enable this rule</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="sourceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sourceTypes.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="triggerEvent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trigger Event</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select trigger" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {triggerEvents.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Posting Lines */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Posting Lines</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      accountId: '',
                      debitFormula: '',
                      creditFormula: '',
                      description: '',
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Line
                </Button>
              </div>

              {fields.map((field, index) => (
                <Card key={field.id}>
                  <CardContent className="pt-4">
                    <div className="grid gap-4 md:grid-cols-4">
                      <FormField
                        control={form.control}
                        name={`lines.${index}.accountId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {accounts.map((a) => (
                                  <SelectItem key={a.id} value={a.id}>
                                    {a.accountCode} - {a.accountName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`lines.${index}.debitFormula`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Debit Formula</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="{amount}" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`lines.${index}.creditFormula`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Credit Formula</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="{amount}" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          disabled={fields.length <= 2}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {existingRule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
```

---

## 9. Testing Specifications

### 9.1 Unit Tests for Server Actions

```typescript
// src/lib/finance/gl/actions/__tests__/configuration.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getGLConfiguration,
  initializeGLConfiguration,
  updateGLConfiguration,
  updateBaseCurrency,
  getGLSetupStatus,
} from '../configuration'
import { db } from '@/lib/db'
import { auth } from '@/auth'

// Mock dependencies
vi.mock('@/lib/db', () => ({
  db: {
    gLConfiguration: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    session: {
      findFirst: vi.fn(),
    },
    chartOfAccount: {
      count: vi.fn(),
    },
    financialPeriod: {
      count: vi.fn(),
    },
    journalEntry: {
      count: vi.fn(),
    },
  },
}))

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/iam/authz/permissions', () => ({
  hasAgencyPermission: vi.fn().mockResolvedValue(true),
  hasSubAccountPermission: vi.fn().mockResolvedValue(true),
}))

describe('GL Configuration Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default auth mock
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    } as any)

    // Default session mock
    vi.mocked(db.session.findFirst).mockResolvedValue({
      activeAgencyId: 'agency-1',
      activeSubAccountId: null,
    } as any)
  })

  describe('getGLConfiguration', () => {
    it('should return existing configuration', async () => {
      const mockConfig = {
        id: 'config-1',
        baseCurrency: 'USD',
        fiscalYearStart: '01-01',
        fiscalYearEnd: '12-31',
      }

      vi.mocked(db.gLConfiguration.findFirst).mockResolvedValue(mockConfig as any)

      const result = await getGLConfiguration()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockConfig)
    })

    it('should return defaults when no configuration exists', async () => {
      vi.mocked(db.gLConfiguration.findFirst).mockResolvedValue(null)

      const result = await getGLConfiguration()

      expect(result.success).toBe(true)
      expect(result.data?.baseCurrency).toBe('USD')
      expect(result.data?.fiscalYearEnd).toBe('12-31')
    })

    it('should fail when not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const result = await getGLConfiguration()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized: No session found')
    })
  })

  describe('initializeGLConfiguration', () => {
    it('should create new configuration', async () => {
      vi.mocked(db.gLConfiguration.findFirst).mockResolvedValue(null)
      vi.mocked(db.gLConfiguration.create).mockResolvedValue({
        id: 'config-new',
      } as any)

      const result = await initializeGLConfiguration({
        baseCurrency: 'USD',
        fiscalYearStart: '01-01',
        fiscalYearEnd: '12-31',
        useControlAccounts: true,
        requireApproval: true,
        autoPostingEnabled: false,
        allowFuturePeriodPost: false,
        allowClosedPeriodPost: false,
      })

      expect(result.success).toBe(true)
      expect(result.data?.id).toBe('config-new')
    })

    it('should fail when configuration already exists', async () => {
      vi.mocked(db.gLConfiguration.findFirst).mockResolvedValue({
        id: 'existing',
      } as any)

      const result = await initializeGLConfiguration({
        baseCurrency: 'USD',
        fiscalYearStart: '01-01',
        fiscalYearEnd: '12-31',
        useControlAccounts: true,
        requireApproval: true,
        autoPostingEnabled: false,
        allowFuturePeriodPost: false,
        allowClosedPeriodPost: false,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('already exists')
    })
  })

  describe('updateBaseCurrency', () => {
    it('should update base currency when no transactions exist', async () => {
      vi.mocked(db.journalEntry.count).mockResolvedValue(0)

      const result = await updateBaseCurrency('EUR')

      expect(result.success).toBe(true)
    })

    it('should fail when transactions exist', async () => {
      vi.mocked(db.journalEntry.count).mockResolvedValue(5)

      const result = await updateBaseCurrency('EUR')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Cannot change base currency')
    })

    it('should fail with invalid currency code', async () => {
      const result = await updateBaseCurrency('USDD')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid currency code')
    })
  })

  describe('getGLSetupStatus', () => {
    it('should return complete setup status', async () => {
      vi.mocked(db.gLConfiguration.findFirst).mockResolvedValue({ id: 'c1' } as any)
      vi.mocked(db.chartOfAccount.count)
        .mockResolvedValueOnce(20) // total accounts
        .mockResolvedValueOnce(6) // system accounts
      vi.mocked(db.financialPeriod.count).mockResolvedValue(12)

      const result = await getGLSetupStatus()

      expect(result.success).toBe(true)
      expect(result.data?.isConfigured).toBe(true)
      expect(result.data?.hasAccounts).toBe(true)
      expect(result.data?.hasPeriods).toBe(true)
      expect(result.data?.hasSystemAccounts).toBe(true)
    })

    it('should return incomplete setup status', async () => {
      vi.mocked(db.gLConfiguration.findFirst).mockResolvedValue(null)
      vi.mocked(db.chartOfAccount.count).mockResolvedValue(0)
      vi.mocked(db.financialPeriod.count).mockResolvedValue(0)

      const result = await getGLSetupStatus()

      expect(result.success).toBe(true)
      expect(result.data?.isConfigured).toBe(false)
      expect(result.data?.hasAccounts).toBe(false)
    })
  })
})
```

### 9.2 Integration Tests

```typescript
// src/lib/finance/gl/actions/__tests__/integration.test.ts

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { db } from '@/lib/db'
import {
  initializeGLConfiguration,
  updateGLConfiguration,
} from '../configuration'
import { applyTemplate } from '../coa-templates'
import { createFinancialPeriods } from '../periods'
import {
  createJournalEntry,
  postJournalEntry,
} from '../journals'
import { getTrialBalance } from '../reports'

describe('GL Integration Tests', () => {
  const testAgencyId = 'test-agency-integration'

  beforeAll(async () => {
    // Create test agency
    await db.agency.create({
      data: {
        id: testAgencyId,
        name: 'Test Agency',
        companyEmail: 'test@test.com',
      },
    })
  })

  afterAll(async () => {
    // Cleanup test data
    await db.journalEntryLine.deleteMany({
      where: { journalEntry: { agencyId: testAgencyId } },
    })
    await db.journalEntry.deleteMany({ where: { agencyId: testAgencyId } })
    await db.accountBalance.deleteMany({ where: { account: { agencyId: testAgencyId } } })
    await db.chartOfAccount.deleteMany({ where: { agencyId: testAgencyId } })
    await db.financialPeriod.deleteMany({ where: { agencyId: testAgencyId } })
    await db.gLConfiguration.deleteMany({ where: { agencyId: testAgencyId } })
    await db.agency.delete({ where: { id: testAgencyId } })
  })

  describe('Full GL Workflow', () => {
    it('should complete full GL setup and posting workflow', async () => {
      // 1. Initialize configuration
      const configResult = await initializeGLConfiguration({
        baseCurrency: 'USD',
        fiscalYearStart: '01-01',
        fiscalYearEnd: '12-31',
        useControlAccounts: true,
        requireApproval: false,
        autoPostingEnabled: false,
        allowFuturePeriodPost: false,
        allowClosedPeriodPost: false,
      })
      expect(configResult.success).toBe(true)

      // 2. Apply COA template
      const templateResult = await applyTemplate('standard', {
        includeSystemAccounts: true,
      })
      expect(templateResult.success).toBe(true)
      expect(templateResult.data?.accountsCreated).toBeGreaterThan(0)

      // 3. Create financial periods
      const periodsResult = await createFinancialPeriods({
        startYear: 2025,
        numberOfYears: 1,
        periodType: 'MONTHLY',
      })
      expect(periodsResult.success).toBe(true)

      // 4. Get accounts for journal entry
      const cashAccount = await db.chartOfAccount.findFirst({
        where: { agencyId: testAgencyId, accountCode: '1110' },
      })
      const revenueAccount = await db.chartOfAccount.findFirst({
        where: { agencyId: testAgencyId, accountCode: '4100' },
      })
      const period = await db.financialPeriod.findFirst({
        where: { agencyId: testAgencyId, periodNumber: 1 },
      })

      expect(cashAccount).not.toBeNull()
      expect(revenueAccount).not.toBeNull()
      expect(period).not.toBeNull()

      // 5. Create journal entry
      const journalResult = await createJournalEntry({
        entryDate: '2025-01-15',
        periodId: period!.id,
        description: 'Test revenue entry',
        reference: 'TEST-001',
        lines: [
          { accountId: cashAccount!.id, debit: 1000, credit: 0 },
          { accountId: revenueAccount!.id, debit: 0, credit: 1000 },
        ],
      })
      expect(journalResult.success).toBe(true)

      // 6. Post journal entry
      const postResult = await postJournalEntry(journalResult.data!.id)
      expect(postResult.success).toBe(true)

      // 7. Verify trial balance
      const trialBalanceResult = await getTrialBalance({ periodId: period!.id })
      expect(trialBalanceResult.success).toBe(true)
      expect(trialBalanceResult.data?.totals.debit).toBe(trialBalanceResult.data?.totals.credit)

      // Verify account balances
      const cashBalance = trialBalanceResult.data?.accounts.find(
        (a) => a.accountCode === '1110'
      )
      expect(cashBalance?.debit).toBe(1000)

      const revenueBalance = trialBalanceResult.data?.accounts.find(
        (a) => a.accountCode === '4100'
      )
      expect(revenueBalance?.credit).toBe(1000)
    })
  })
})
```

### 9.3 E2E Tests

```typescript
// e2e/finance/gl-setup.spec.ts

import { test, expect } from '@playwright/test'

test.describe('GL Setup Wizard', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/sign-in')
    await page.fill('[name="email"]', 'admin@test.com')
    await page.fill('[name="password"]', 'testpassword')
    await page.click('button[type="submit"]')
    await page.waitForURL('/agency/**/dashboard')
  })

  test('should complete GL setup wizard', async ({ page }) => {
    // Navigate to GL settings
    await page.click('text=Finance')
    await page.click('text=General Ledger')
    await page.click('text=Settings')

    // Wizard should be displayed for new setup
    await expect(page.locator('text=GL Setup Wizard')).toBeVisible()

    // Step 1: Company Info
    await page.selectOption('[name="baseCurrency"]', 'USD')
    await page.fill('[name="fiscalYearStart"]', '01-01')
    await page.fill('[name="fiscalYearEnd"]', '12-31')
    await page.click('text=Next')

    // Step 2: COA Template
    await page.click('input[value="standard"]')
    await page.click('text=Next')

    // Step 3: Financial Periods
    await page.fill('[name="startYear"]', '2025')
    await page.selectOption('[name="numberOfYears"]', '2')
    await page.click('text=Next')

    // Step 4: Review & Complete
    await expect(page.locator('text=USD')).toBeVisible()
    await expect(page.locator('text=Standard Business')).toBeVisible()
    await page.click('text=Complete Setup')

    // Should redirect to GL dashboard
    await page.waitForURL('**/finance/gl')
    await expect(page.locator('text=GL Dashboard')).toBeVisible()
  })

  test('should create journal entry', async ({ page }) => {
    await page.goto('/agency/test-agency/finance/gl/journals/new')

    // Fill journal entry form
    await page.fill('[name="reference"]', 'JE-001')
    await page.fill('[name="description"]', 'Test journal entry')
    
    // Add lines
    await page.click('text=Add Line')
    await page.selectOption('[name="lines.0.accountId"]', { label: '1110 - Cash' })
    await page.fill('[name="lines.0.debit"]', '500')

    await page.click('text=Add Line')
    await page.selectOption('[name="lines.1.accountId"]', { label: '4100 - Revenue' })
    await page.fill('[name="lines.1.credit"]', '500')

    // Save
    await page.click('text=Save Entry')

    // Verify success
    await expect(page.locator('text=Journal entry created')).toBeVisible()
  })

  test('should generate trial balance report', async ({ page }) => {
    await page.goto('/agency/test-agency/finance/gl/reports/trial-balance')

    // Select period
    await page.selectOption('[name="periodId"]', { index: 1 })
    await page.click('text=Generate Report')

    // Verify report displayed
    await expect(page.locator('text=Trial Balance')).toBeVisible()
    await expect(page.locator('text=Account Code')).toBeVisible()
    
    // Verify balance check
    await expect(page.locator('text=Trial balance is balanced')).toBeVisible()

    // Test export
    await page.click('text=Export')
    await page.click('text=Export as CSV')

    // Verify download started
    const download = await page.waitForEvent('download')
    expect(download.suggestedFilename()).toContain('trial-balance')
  })
})
```

---

## 10. Implementation Checklist - Part 2

### Phase 1: Server Actions (Week 1)

- [ ] Create `/src/lib/finance/gl/actions/reconciliation.ts`
- [ ] Create `/src/lib/finance/gl/actions/consolidation.ts`
- [ ] Create `/src/lib/finance/gl/actions/posting-rules.ts`
- [ ] Create `/src/lib/finance/gl/actions/configuration.ts`
- [ ] Create `/src/lib/finance/gl/actions/coa-templates.ts`
- [ ] Create `/src/lib/finance/gl/actions/setup-wizard.ts`

### Phase 2: UI Components (Week 2)

- [ ] Create GL Settings page and form components
- [ ] Create Setup Wizard UI
- [ ] Create Reports Dashboard
- [ ] Create Trial Balance Report page
- [ ] Create Report Filters component
- [ ] Create Export API routes

### Phase 3: Additional Forms (Week 3)

- [ ] Create Reconciliation Form
- [ ] Create Period Management Form
- [ ] Create Posting Rules Form
- [ ] Integrate forms with pages

### Phase 4: Testing (Week 4)

- [ ] Write unit tests for server actions
- [ ] Write integration tests
- [ ] Write E2E tests with Playwright
- [ ] Perform manual QA testing

---

## Conclusion

This Part 2 document completes the FI-GL Module implementation plan by covering:

1. **Reconciliation Server Actions** - Full reconciliation workflow
2. **Consolidation Server Actions** - Multi-entity consolidation
3. **Posting Rules Server Actions** - Automated journal posting
4. **GL Configuration Server Actions** - Complete settings management
5. **COA Templates & Setup Wizard** - Quick-start configuration
6. **Settings UI Components** - Full settings interface
7. **Reports UI Components** - Report generation and export
8. **Additional Forms** - Reconciliation, Period, Posting Rules
9. **Testing Specifications** - Unit, integration, and E2E tests
10. **Implementation Checklist** - Phased delivery plan

Combined with Part 1, this provides a comprehensive implementation blueprint for the Enterprise FI-GL Module.
