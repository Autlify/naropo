import { describe, expect, test } from 'bun:test'

import {
  arInvoiceCreateSchema,
  arInvoiceUpdateSchema,
  sendArInvoiceSchema,
  openDisputeSchema,
  writeOffArInvoiceSchema,
} from '../ar-invoice'

describe('FI-AR arInvoice schema', () => {
  const validUuid = '11111111-1111-4111-8111-111111111111'
  const customerUuid = '22222222-2222-4222-8222-222222222222'

  test('accepts minimal AR invoice create input', () => {
    const parsed = arInvoiceCreateSchema.parse({
      agencyId: validUuid,
      customerId: customerUuid,
      kind: 'INVOICE',
      documentNumber: 'INV-2026-0001',
      issueDate: '2026-02-01',
      dueDate: '2026-03-01',
      currency: 'myr',
      totals: {
        netAmount: 1000,
        taxAmount: 60,
        grossAmount: 1060,
        currency: 'myr',
      },
      lines: [
        {
          lineNo: 1,
          description: 'Consulting services',
          quantity: 10,
          unitPrice: 100,
        },
      ],
    })

    expect(parsed.currency).toBe('MYR')
    expect(parsed.totals.currency).toBe('MYR')
    expect(parsed.customerId).toBe(customerUuid)
    expect(parsed.status).toBe('DRAFT')
  })

  test('accepts AR invoice with customer reference', () => {
    const parsed = arInvoiceCreateSchema.parse({
      agencyId: validUuid,
      customerCode: 'CUST-001',
      kind: 'INVOICE',
      documentNumber: 'INV-2026-0002',
      issueDate: '2026-02-01',
      dueDate: '2026-03-01',
      currency: 'USD',
      totals: {
        netAmount: 5000,
        taxAmount: 0,
        grossAmount: 5000,
        currency: 'USD',
      },
      lines: [
        {
          lineNo: 1,
          description: 'Software license',
          quantity: 1,
          unitPrice: 5000,
        },
      ],
      customerReference: 'PO-2026-1234',
      customerPurchaseOrder: 'PO-2026-1234',
      paymentTermDays: 45,
      earlyPaymentDiscountPercent: 2,
      earlyPaymentDiscountDays: 10,
    })

    expect(parsed.customerCode).toBe('CUST-001')
    expect(parsed.customerReference).toBe('PO-2026-1234')
    expect(parsed.paymentTermDays).toBe(45)
    expect(parsed.earlyPaymentDiscountPercent).toBe(2)
  })

  test('accepts AR invoice with e-invoice settings', () => {
    const parsed = arInvoiceCreateSchema.parse({
      agencyId: validUuid,
      customerId: customerUuid,
      kind: 'INVOICE',
      documentNumber: 'INV-2026-0003',
      issueDate: '2026-02-01',
      currency: 'MYR',
      totals: {
        netAmount: 2000,
        taxAmount: 120,
        grossAmount: 2120,
        currency: 'MYR',
      },
      lines: [
        {
          lineNo: 1,
          description: 'Product A',
          quantity: 20,
          unitPrice: 100,
        },
      ],
      deliveryMethod: 'EINVOICE',
      eInvoiceFormat: 'MYINVOIS',
      postingTemplateKey: 'AR_INVOICE_STANDARD',
    })

    expect(parsed.deliveryMethod).toBe('EINVOICE')
    expect(parsed.eInvoiceFormat).toBe('MYINVOIS')
  })

  test('accepts AR invoice with dunning settings', () => {
    const parsed = arInvoiceCreateSchema.parse({
      agencyId: validUuid,
      customerId: customerUuid,
      kind: 'INVOICE',
      documentNumber: 'INV-2026-0004',
      issueDate: '2026-02-01',
      currency: 'MYR',
      totals: {
        netAmount: 500,
        taxAmount: 30,
        grossAmount: 530,
        currency: 'MYR',
      },
      lines: [
        {
          lineNo: 1,
          description: 'Service fee',
          quantity: 1,
          unitPrice: 500,
        },
      ],
      dunning: {
        level: 0,
        dunningBlocked: false,
        noticeCount: 0,
      },
    })

    expect(parsed.dunning?.level).toBe(0)
    expect(parsed.dunning?.dunningBlocked).toBe(false)
  })

  test('rejects missing customer binding', () => {
    const result = arInvoiceCreateSchema.safeParse({
      agencyId: validUuid,
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

  test('update requires id and allows partial fields', () => {
    const parsed = arInvoiceUpdateSchema.parse({
      id: '33333333-3333-4333-8333-333333333333',
      status: 'SENT',
      inDispute: true,
      disputeReason: 'Customer disputes quantity',
    })

    expect(parsed.id).toBe('33333333-3333-4333-8333-333333333333')
    expect(parsed.status).toBe('SENT')
    expect(parsed.inDispute).toBe(true)
  })

  test('send requires id and accepts delivery options', () => {
    const parsed = sendArInvoiceSchema.parse({
      id: validUuid,
      method: 'EMAIL',
      recipientEmail: 'customer@example.com',
      notes: 'Sent via automated system',
    })

    expect(parsed.method).toBe('EMAIL')
    expect(parsed.recipientEmail).toBe('customer@example.com')
  })

  test('open dispute requires reason', () => {
    const result = openDisputeSchema.safeParse({
      id: validUuid,
      // reason missing
    })

    expect(result.success).toBe(false)

    const parsed = openDisputeSchema.parse({
      id: validUuid,
      reason: 'Customer claims goods not received',
    })

    expect(parsed.reason).toBe('Customer claims goods not received')
  })

  test('write-off requires amount and reason', () => {
    const result = writeOffArInvoiceSchema.safeParse({
      id: validUuid,
      amount: 100,
      // reason missing
    })

    expect(result.success).toBe(false)

    const parsed = writeOffArInvoiceSchema.parse({
      id: validUuid,
      amount: 100,
      reason: 'Customer bankruptcy - uncollectible',
    })

    expect(parsed.amount).toBe(100)
    expect(parsed.reason).toBe('Customer bankruptcy - uncollectible')
  })
})
