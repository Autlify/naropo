import { describe, expect, test } from 'bun:test'

import {
  arReceiptCreateSchema,
  arReceiptUpdateSchema,
  depositArReceiptSchema,
  bounceArReceiptSchema,
  applyArReceiptSchema,
} from '../ar-receipt'

describe('FI-AR arReceipt schema', () => {
  const validUuid = '11111111-1111-4111-8111-111111111111'
  const customerUuid = '22222222-2222-4222-8222-222222222222'

  test('accepts minimal AR receipt create input', () => {
    const parsed = arReceiptCreateSchema.parse({
      agencyId: validUuid,
      customerId: customerUuid,
      receiptDate: '2026-02-01',
      paymentMethod: 'BANK_TRANSFER',
      amount: 1500.00,
      currencyCode: 'myr',
    })

    expect(parsed.agencyId).toBe(validUuid)
    expect(parsed.customerId).toBe(customerUuid)
    expect(parsed.currencyCode).toBe('MYR')
    expect(parsed.amount).toBe(1500.00)
    expect(parsed.status).toBe('DRAFT')
  })

  test('accepts full AR receipt with allocations', () => {
    const parsed = arReceiptCreateSchema.parse({
      agencyId: validUuid,
      customerId: customerUuid,
      receiptDate: '2026-02-01',
      paymentMethod: 'CHECK',
      amount: 2000.00,
      currencyCode: 'USD',
      exchangeRate: 4.5,
      checkNumber: 'CHK-123456',
      checkDate: '2026-01-30',
      reference: 'Customer payment ref: PAY-001',
      allocations: [
        {
          openItemId: '33333333-3333-4333-8333-333333333333',
          allocatedAmount: 1500.00,
          invoiceNumber: 'INV-2026-001',
          earlyPaymentDiscount: 30.00,
        },
        {
          openItemId: '44444444-4444-4444-8444-444444444444',
          allocatedAmount: 500.00,
          invoiceNumber: 'INV-2026-002',
        },
      ],
      bank: {
        bankName: 'Maybank',
        transactionReference: 'TXN-987654',
      },
      notes: 'Monthly customer payment',
    })

    expect(parsed.allocations).toHaveLength(2)
    expect(parsed.checkNumber).toBe('CHK-123456')
    expect(parsed.bank?.bankName).toBe('Maybank')
  })

  test('accepts cash payment', () => {
    const parsed = arReceiptCreateSchema.parse({
      agencyId: validUuid,
      customerId: customerUuid,
      receiptDate: '2026-02-01',
      paymentMethod: 'CASH',
      amount: 500.00,
      reference: 'Walk-in payment',
    })

    expect(parsed.paymentMethod).toBe('CASH')
  })

  test('accepts credit card payment', () => {
    const parsed = arReceiptCreateSchema.parse({
      agencyId: validUuid,
      customerId: customerUuid,
      receiptDate: '2026-02-01',
      paymentMethod: 'CREDIT_CARD',
      amount: 750.00,
      bank: {
        transactionReference: 'CC-AUTH-123456',
      },
    })

    expect(parsed.paymentMethod).toBe('CREDIT_CARD')
  })

  test('rejects when allocations do not match receipt amount', () => {
    const result = arReceiptCreateSchema.safeParse({
      agencyId: validUuid,
      customerId: customerUuid,
      receiptDate: '2026-02-01',
      paymentMethod: 'WIRE',
      amount: 1000.00,
      allocations: [
        { allocatedAmount: 500.00, invoiceNumber: 'INV-1' },
        { allocatedAmount: 300.00, invoiceNumber: 'INV-2' },
      ],
      // Missing 200.00 - no unapplied amount set
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const allocationError = result.error.issues.find(i => i.path.includes('allocations'))
      expect(allocationError).toBeDefined()
    }
  })

  test('rejects invalid payment method', () => {
    const result = arReceiptCreateSchema.safeParse({
      agencyId: validUuid,
      customerId: customerUuid,
      receiptDate: '2026-02-01',
      paymentMethod: 'CRYPTO', // Invalid
      amount: 1000.00,
    })

    expect(result.success).toBe(false)
  })

  test('update requires id and allows partial fields', () => {
    const parsed = arReceiptUpdateSchema.parse({
      id: validUuid,
      status: 'APPROVED',
      reference: 'Updated reference',
    })

    expect(parsed.id).toBe(validUuid)
    expect(parsed.status).toBe('APPROVED')
  })

  test('deposit requires bank account and date', () => {
    const result = depositArReceiptSchema.safeParse({
      id: validUuid,
      // Missing bankAccountId and depositDate
    })

    expect(result.success).toBe(false)

    const parsed = depositArReceiptSchema.parse({
      id: validUuid,
      bankAccountId: '55555555-5555-4555-8555-555555555555',
      depositDate: '2026-02-02',
      depositReference: 'DEP-12345',
    })

    expect(parsed.bankAccountId).toBe('55555555-5555-4555-8555-555555555555')
  })

  test('bounce requires reason and date', () => {
    const result = bounceArReceiptSchema.safeParse({
      id: validUuid,
      bounceDate: '2026-02-05',
      // reason missing
    })

    expect(result.success).toBe(false)

    const parsed = bounceArReceiptSchema.parse({
      id: validUuid,
      reason: 'Insufficient funds',
      bounceDate: '2026-02-05',
    })

    expect(parsed.reason).toBe('Insufficient funds')
  })

  test('apply requires allocations', () => {
    const result = applyArReceiptSchema.safeParse({
      id: validUuid,
      allocations: [],
    })

    expect(result.success).toBe(false)

    const parsed = applyArReceiptSchema.parse({
      id: validUuid,
      allocations: [
        {
          invoiceNumber: 'INV-2026-003',
          allocatedAmount: 500,
        },
      ],
    })

    expect(parsed.allocations).toHaveLength(1)
  })

  test('accepts receipt with early payment discount', () => {
    const parsed = arReceiptCreateSchema.parse({
      agencyId: validUuid,
      customerId: customerUuid,
      receiptDate: '2026-02-01',
      paymentMethod: 'WIRE',
      amount: 980.00, // Paying 980 for 1000 invoice (2% discount)
      earlyPaymentDiscountTotal: 20.00,
      allocations: [
        {
          invoiceNumber: 'INV-2026-010',
          allocatedAmount: 980.00,
          earlyPaymentDiscount: 20.00,
        },
      ],
    })

    expect(parsed.earlyPaymentDiscountTotal).toBe(20.00)
    expect(parsed.allocations?.[0].earlyPaymentDiscount).toBe(20.00)
  })
})
