import { describe, expect, test } from 'bun:test'

import {
  apPaymentCreateSchema,
  apPaymentUpdateSchema,
  approveApPaymentSchema,
  rejectApPaymentSchema,
  voidApPaymentSchema,
} from '../ap-payment'

describe('FI-AP apPayment schema', () => {
  const validUuid = '11111111-1111-4111-8111-111111111111'
  const vendorUuid = '22222222-2222-4222-8222-222222222222'

  test('accepts minimal AP payment create input', () => {
    const parsed = apPaymentCreateSchema.parse({
      agencyId: validUuid,
      vendorId: vendorUuid,
      paymentDate: '2026-02-01',
      paymentMethod: 'WIRE',
      amount: 1500.00,
      currency: 'myr',
    })

    expect(parsed.agencyId).toBe(validUuid)
    expect(parsed.vendorId).toBe(vendorUuid)
    expect(parsed.currencyCode).toBe('MYR')
    expect(parsed.amount).toBe(1500.00)
    expect(parsed.status).toBe('DRAFT')
  })

  test('accepts full AP payment with allocations', () => {
    const parsed = apPaymentCreateSchema.parse({
      agencyId: validUuid,
      vendorId: vendorUuid,
      paymentDate: '2026-02-01',
      paymentMethod: 'ACH',
      amount: 2000.00,
      currencyCode: 'USD',
      exchangeRate: 4.5,
      allocations: [
        {
          openItemId: '33333333-3333-4333-8333-333333333333',
          allocatedAmount: 1500.00,
          invoiceNumber: 'INV-2026-001',
        },
        {
          openItemId: '44444444-4444-4444-8444-444444444444',
          allocatedAmount: 500.00,
          invoiceNumber: 'INV-2026-002',
        },
      ],
      bank: {
        bankAccountId: '55555555-5555-4555-8555-555555555555',
        bankName: 'CIMB Bank',
        transactionReference: 'TXN-123456',
      },
      notes: 'Monthly vendor payment',
    })

    expect(parsed.allocations).toHaveLength(2)
    expect(parsed.bank?.bankName).toBe('CIMB Bank')
  })

  test('rejects when allocations do not match payment amount', () => {
    const result = apPaymentCreateSchema.safeParse({
      agencyId: validUuid,
      vendorId: vendorUuid,
      paymentDate: '2026-02-01',
      paymentMethod: 'WIRE',
      amount: 1000.00,
      allocations: [
        { allocatedAmount: 500.00, invoiceNumber: 'INV-1' },
        { allocatedAmount: 300.00, invoiceNumber: 'INV-2' },
      ],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      const allocationError = result.error.issues.find(i => i.path.includes('allocations'))
      expect(allocationError).toBeDefined()
    }
  })

  test('rejects invalid payment method', () => {
    const result = apPaymentCreateSchema.safeParse({
      agencyId: validUuid,
      vendorId: vendorUuid,
      paymentDate: '2026-02-01',
      paymentMethod: 'BITCOIN',
      amount: 1000.00,
    })

    expect(result.success).toBe(false)
  })

  test('update requires id and allows partial fields', () => {
    const parsed = apPaymentUpdateSchema.parse({
      id: validUuid,
      status: 'APPROVED',
      reference: 'Updated reference',
    })

    expect(parsed.id).toBe(validUuid)
    expect(parsed.status).toBe('APPROVED')
  })

  test('approve requires id and allows optional notes', () => {
    const parsed = approveApPaymentSchema.parse({
      id: validUuid,
      notes: 'Approved by finance manager',
    })

    expect(parsed.id).toBe(validUuid)
    expect(parsed.notes).toBe('Approved by finance manager')
  })

  test('reject requires id and reason', () => {
    const result = rejectApPaymentSchema.safeParse({
      id: validUuid,
      // reason missing
    })

    expect(result.success).toBe(false)

    const parsed = rejectApPaymentSchema.parse({
      id: validUuid,
      reason: 'Insufficient documentation',
    })

    expect(parsed.reason).toBe('Insufficient documentation')
  })

  test('void requires id and reason', () => {
    const parsed = voidApPaymentSchema.parse({
      id: validUuid,
      reason: 'Duplicate payment detected',
    })

    expect(parsed.reason).toBe('Duplicate payment detected')
  })
})
