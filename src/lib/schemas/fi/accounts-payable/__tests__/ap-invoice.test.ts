import { describe, expect, test } from 'bun:test'

import {
  apInvoiceCreateSchema,
  apInvoiceUpdateSchema,
} from '../ap-invoice'

describe('FI-AP apInvoice schema (3-way ready)', () => {
  test('accepts minimal AP invoice create input (2-way/none)', () => {
    const parsed = apInvoiceCreateSchema.parse({
      agencyId: '11111111-1111-4111-8111-111111111111',
      vendorCode: 'VEND-001',
      kind: 'INVOICE',
      documentNumber: 'INV-2026-0001',
      issueDate: '2026-02-01',
      dueDate: '2026-03-01',
      currency: 'myr',
      totals: {
        netAmount: 100,
        taxAmount: 6,
        grossAmount: 106,
        currency: 'myr',
      },
      lines: [
        {
          lineNo: 1,
          description: 'Cloud hosting',
          quantity: 1,
          unitPrice: 100,
        },
      ],
      receivedAt: '2026-02-01',
      receivedBy: 'user_1',
      approvedAt: '2026-02-02',
      approvedBy: 'approver_1',
    })

    expect(parsed.currency).toBe('MYR')
    expect(parsed.totals.currency).toBe('MYR')
    expect(parsed.vendorCode).toBe('VEND-001')
    expect(parsed.approvedBy).toBe('approver_1')
  })

  test('rejects missing vendor binding', () => {
    const result = apInvoiceCreateSchema.safeParse({
      agencyId: '11111111-1111-4111-8111-111111111111',
      kind: 'INVOICE',
      documentNumber: 'INV-1',
      issueDate: '2026-02-01',
      currency: 'MYR',
      totals: {
        netAmount: 10,
        taxAmount: 0,
        grossAmount: 10,
        currency: 'MYR',
      },
      lines: [{ lineNo: 1, description: 'Line', quantity: 1, unitPrice: 10 }],
    })

    expect(result.success).toBe(false)
  })

  test('3-way matching policy requires line reference points', () => {
    const result = apInvoiceCreateSchema.safeParse({
      agencyId: '11111111-1111-4111-8111-111111111111',
      vendorCode: 'VEND-001',
      kind: 'INVOICE',
      documentNumber: 'INV-3WAY-1',
      issueDate: '2026-02-01',
      currency: 'MYR',
      matchPolicy: 'THREE_WAY',
      totals: {
        netAmount: 10,
        taxAmount: 0,
        grossAmount: 10,
        currency: 'MYR',
      },
      lines: [{ lineNo: 1, description: 'Line', quantity: 1, unitPrice: 10 }],
    })

    expect(result.success).toBe(false)
  })

  test('update requires id and allows partial fields', () => {
    const parsed = apInvoiceUpdateSchema.parse({
      id: '33333333-3333-4333-8333-333333333333',
      status: 'APPROVED',
    })

    expect(parsed.id).toBe('33333333-3333-4333-8333-333333333333')
    expect(parsed.status).toBe('APPROVED')
  })
})
