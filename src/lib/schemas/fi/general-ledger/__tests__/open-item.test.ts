/**
 * FI-GL Open Item Schema Tests
 */

import { describe, test, expect } from 'bun:test'
import {
  createOpenItemSchema,
  updateOpenItemSchema,
  clearOpenItemsSchema,
  autoClearParametersSchema,
  partialClearSchema,
  getOpenItemsFilterSchema,
} from '../open-item'

describe('FI-GL open-item schema', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440001'
  const validUUID2 = '550e8400-e29b-41d4-a716-446655440002'

  describe('createOpenItemSchema', () => {
    test('accepts valid open item with vendor', () => {
      const result = createOpenItemSchema.safeParse({
        accountId: validUUID,
        documentNumber: 'INV-2026-0001',
        documentDate: '2026-01-15',
        dueDate: '2026-02-15',
        partnerType: 'VENDOR',
        vendorId: validUUID2,
        localAmount: 1000.0,
        documentAmount: 1000.0,
        text: 'Invoice for services',
      })
      expect(result.success).toBe(true)
    })

    test('accepts open item without partner', () => {
      const result = createOpenItemSchema.safeParse({
        accountId: validUUID,
        documentNumber: 'JE-2026-0001',
        documentDate: '2026-01-15',
        localAmount: 500.0,
        documentAmount: 500.0,
      })
      expect(result.success).toBe(true)
    })

    test('accepts customer open item', () => {
      const result = createOpenItemSchema.safeParse({
        accountId: validUUID,
        documentNumber: 'AR-2026-0001',
        documentDate: '2026-01-15',
        dueDate: '2026-02-15',
        partnerType: 'CUSTOMER',
        customerId: validUUID2,
        localAmount: 2500.0,
        documentAmount: 2500.0,
        reference: 'PO-12345',
      })
      expect(result.success).toBe(true)
    })

    test('rejects both customer and vendor', () => {
      const result = createOpenItemSchema.safeParse({
        accountId: validUUID,
        documentNumber: 'INV-2026-0001',
        documentDate: '2026-01-15',
        customerId: validUUID,
        vendorId: validUUID2,
        localAmount: 1000.0,
        documentAmount: 1000.0,
      })
      expect(result.success).toBe(false)
    })

    test('requires vendorId when partnerType is VENDOR', () => {
      const result = createOpenItemSchema.safeParse({
        accountId: validUUID,
        documentNumber: 'INV-2026-0001',
        documentDate: '2026-01-15',
        partnerType: 'VENDOR',
        // Missing vendorId
        localAmount: 1000.0,
        documentAmount: 1000.0,
      })
      expect(result.success).toBe(false)
    })

    test('requires customerId when partnerType is CUSTOMER', () => {
      const result = createOpenItemSchema.safeParse({
        accountId: validUUID,
        documentNumber: 'INV-2026-0001',
        documentDate: '2026-01-15',
        partnerType: 'CUSTOMER',
        // Missing customerId
        localAmount: 1000.0,
        documentAmount: 1000.0,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('updateOpenItemSchema', () => {
    test('allows updating reference field', () => {
      const result = updateOpenItemSchema.safeParse({
        id: validUUID,
        reference: 'Updated reference',
      })
      expect(result.success).toBe(true)
    })

    test('allows updating dueDate', () => {
      const result = updateOpenItemSchema.safeParse({
        id: validUUID,
        dueDate: '2026-03-15',
      })
      expect(result.success).toBe(true)
    })

    test('allows updating assignment and text', () => {
      const result = updateOpenItemSchema.safeParse({
        id: validUUID,
        assignment: 'DEPT-001',
        text: 'Updated text',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('clearOpenItemsSchema', () => {
    test('accepts valid clearing with balanced items', () => {
      const result = clearOpenItemsSchema.safeParse({
        items: [
          { openItemId: validUUID, clearAmount: 500.0 },
          { openItemId: validUUID2, clearAmount: -500.0 },
        ],
        clearingDocumentType: 'PAYMENT',
        clearingDate: '2026-02-01',
      })
      expect(result.success).toBe(true)
    })

    test('accepts clearing with document currency amounts', () => {
      const result = clearOpenItemsSchema.safeParse({
        items: [
          { openItemId: validUUID, clearAmount: 1000.0, clearAmountDocument: 950.0 },
          { openItemId: validUUID2, clearAmount: -1000.0, clearAmountDocument: -950.0 },
        ],
        clearingDocumentType: 'RECEIPT',
        clearingDocumentNumber: 'PAY-2026-0001',
        clearingDate: '2026-02-01',
        notes: 'Payment received',
      })
      expect(result.success).toBe(true)
    })

    test('rejects empty items array', () => {
      const result = clearOpenItemsSchema.safeParse({
        items: [],
        clearingDocumentType: 'PAYMENT',
        clearingDate: '2026-02-01',
      })
      expect(result.success).toBe(false)
    })

    test('rejects unbalanced clearing', () => {
      const result = clearOpenItemsSchema.safeParse({
        items: [
          { openItemId: validUUID, clearAmount: 500.0 },
          { openItemId: validUUID2, clearAmount: -300.0 },
        ],
        clearingDocumentType: 'PAYMENT',
        clearingDate: '2026-02-01',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('partialClearSchema', () => {
    test('accepts partial clearing', () => {
      const result = partialClearSchema.safeParse({
        openItemId: validUUID,
        localAmount: 500.0,
        clearedByType: 'PAYMENT',
        clearedByRef: 'PAY-2026-0001',
      })
      expect(result.success).toBe(true)
    })

    test('accepts with document amount and exchange difference', () => {
      const result = partialClearSchema.safeParse({
        openItemId: validUUID,
        localAmount: 500.0,
        documentAmount: 105.0,
        clearedByType: 'RECEIPT',
        clearedByRef: 'REC-2026-0001',
        exchangeDifference: 2.50,
        notes: 'Partial payment',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('autoClearParametersSchema', () => {
    test('accepts matching by document number', () => {
      const result = autoClearParametersSchema.safeParse({
        accountId: validUUID,
        matchBy: ['documentNumber'],
      })
      expect(result.success).toBe(true)
    })

    test('accepts matching by multiple criteria', () => {
      const result = autoClearParametersSchema.safeParse({
        accountId: validUUID,
        matchBy: ['reference', 'amount', 'dueDate'],
        amountTolerance: 0.05,
        dateTolerance: 3,
      })
      expect(result.success).toBe(true)
    })

    test('accepts dry run mode', () => {
      const result = autoClearParametersSchema.safeParse({
        vendorId: validUUID,
        matchBy: ['assignment'],
        dryRun: true,
        maxItems: 50,
      })
      expect(result.success).toBe(true)
    })

    test('rejects empty matchBy array', () => {
      const result = autoClearParametersSchema.safeParse({
        accountId: validUUID,
        matchBy: [],
      })
      expect(result.success).toBe(false)
    })
  })

  describe('getOpenItemsFilterSchema', () => {
    test('accepts account filter', () => {
      const result = getOpenItemsFilterSchema.safeParse({
        accountId: validUUID,
        status: 'OPEN',
      })
      expect(result.success).toBe(true)
    })

    test('accepts customer filter', () => {
      const result = getOpenItemsFilterSchema.safeParse({
        customerId: validUUID,
        partnerType: 'CUSTOMER',
        status: 'OPEN',
      })
      expect(result.success).toBe(true)
    })

    test('accepts date range filter', () => {
      const result = getOpenItemsFilterSchema.safeParse({
        accountId: validUUID,
        documentDateFrom: '2026-01-01',
        documentDateTo: '2026-01-31',
        dueDateFrom: '2026-02-01',
        dueDateTo: '2026-02-28',
      })
      expect(result.success).toBe(true)
    })

    test('accepts amount filter', () => {
      const result = getOpenItemsFilterSchema.safeParse({
        accountId: validUUID,
        minAmount: 100,
        maxAmount: 5000,
        includeZeroBalance: false,
      })
      expect(result.success).toBe(true)
    })

    test('accepts pagination and sorting', () => {
      const result = getOpenItemsFilterSchema.safeParse({
        accountId: validUUID,
        page: 2,
        pageSize: 50,
        sortBy: 'dueDate',
        sortOrder: 'asc',
      })
      expect(result.success).toBe(true)
    })
  })
})
