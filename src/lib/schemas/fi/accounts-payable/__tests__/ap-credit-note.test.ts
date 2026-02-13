import { describe, expect, test } from 'bun:test'

import {
  apCreditNoteCreateSchema,
  apCreditNoteUpdateSchema,
  applyApCreditNoteSchema,
} from '../ap-credit-note'

describe('FI-AP apCreditNote schema', () => {
  const validUuid = '11111111-1111-4111-8111-111111111111'
  const vendorUuid = '22222222-2222-4222-8222-222222222222'

  test('accepts minimal AP credit note create input', () => {
    const parsed = apCreditNoteCreateSchema.parse({
      agencyId: validUuid,
      vendorId: vendorUuid,
      kind: 'CREDIT_NOTE',
      documentNumber: 'CN-2026-001',
      issueDate: '2026-02-01',
      currency: 'myr',
      totals: {
        netAmount: 500,
        taxAmount: 30,
        grossAmount: 530,
        currency: 'myr',
      },
      lines: [
        {
          lineNo: 1,
          description: 'Return of defective goods',
          quantity: 1,
          unitPrice: 500,
        },
      ],
    })

    expect(parsed.kind).toBe('CREDIT_NOTE')
    expect(parsed.vendorId).toBe(vendorUuid)
    expect(parsed.totals.currency).toBe('MYR')
  })

  test('accepts debit note kind', () => {
    const parsed = apCreditNoteCreateSchema.parse({
      agencyId: validUuid,
      vendorCode: 'VEND-001',
      kind: 'DEBIT_NOTE',
      documentNumber: 'DN-2026-001',
      issueDate: '2026-02-01',
      currency: 'USD',
      totals: {
        netAmount: 200,
        taxAmount: 0,
        grossAmount: 200,
        currency: 'USD',
      },
      lines: [
        {
          lineNo: 1,
          description: 'Short shipment charge',
          quantity: 1,
          unitPrice: 200,
        },
      ],
      reasonCode: 'SHORT_SHIPMENT',
      reasonDescription: 'Vendor shipped 10 units less than ordered',
    })

    expect(parsed.kind).toBe('DEBIT_NOTE')
    expect(parsed.vendorCode).toBe('VEND-001')
    expect(parsed.reasonCode).toBe('SHORT_SHIPMENT')
  })

  test('rejects missing vendor binding', () => {
    const result = apCreditNoteCreateSchema.safeParse({
      agencyId: validUuid,
      kind: 'CREDIT_NOTE',
      documentNumber: 'CN-1',
      issueDate: '2026-02-01',
      currency: 'MYR',
      totals: {
        netAmount: 100,
        taxAmount: 0,
        grossAmount: 100,
        currency: 'MYR',
      },
      lines: [{ lineNo: 1, description: 'Line', quantity: 1, unitPrice: 100 }],
    })

    expect(result.success).toBe(false)
  })

  test('rejects invalid kind (INVOICE)', () => {
    const result = apCreditNoteCreateSchema.safeParse({
      agencyId: validUuid,
      vendorId: vendorUuid,
      kind: 'INVOICE', // Invalid for credit note
      documentNumber: 'CN-1',
      issueDate: '2026-02-01',
      currency: 'MYR',
      totals: {
        netAmount: 100,
        taxAmount: 0,
        grossAmount: 100,
        currency: 'MYR',
      },
      lines: [{ lineNo: 1, description: 'Line', quantity: 1, unitPrice: 100 }],
    })

    expect(result.success).toBe(false)
  })

  test('update requires id and allows partial fields', () => {
    const parsed = apCreditNoteUpdateSchema.parse({
      id: validUuid,
      status: 'APPROVED',
      reasonDescription: 'Updated reason',
    })

    expect(parsed.id).toBe(validUuid)
    expect(parsed.status).toBe('APPROVED')
  })

  test('apply credit note requires applications', () => {
    const result = applyApCreditNoteSchema.safeParse({
      id: validUuid,
      applications: [],
    })

    expect(result.success).toBe(false)

    const parsed = applyApCreditNoteSchema.parse({
      id: validUuid,
      applications: [
        {
          invoiceNumber: 'INV-2026-001',
          appliedAmount: 500,
        },
      ],
    })

    expect(parsed.applications).toHaveLength(1)
  })

  test('accepts credit note with original invoice references', () => {
    const parsed = apCreditNoteCreateSchema.parse({
      agencyId: validUuid,
      vendorId: vendorUuid,
      kind: 'CREDIT_NOTE',
      documentNumber: 'CN-2026-002',
      issueDate: '2026-02-01',
      currency: 'MYR',
      totals: {
        netAmount: 1000,
        taxAmount: 60,
        grossAmount: 1060,
        currency: 'MYR',
      },
      lines: [
        {
          lineNo: 1,
          description: 'Return credit',
          quantity: 1,
          unitPrice: 1000,
        },
      ],
      originalInvoiceNumbers: ['INV-2026-001', 'INV-2026-002'],
      applications: [
        { invoiceNumber: 'INV-2026-001', appliedAmount: 600 },
        { invoiceNumber: 'INV-2026-002', appliedAmount: 460 },
      ],
    })

    expect(parsed.originalInvoiceNumbers).toHaveLength(2)
    expect(parsed.applications).toHaveLength(2)
  })
})
