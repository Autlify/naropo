import { describe, expect, test } from 'bun:test'

import {
  VendorAccountCreateSchema,
  VendorAccountUpdateSchema,
} from '../vendor-account'

describe('VendorAccount schema', () => {
  test('accepts minimal create input (canonical fields)', () => {
    const parsed = VendorAccountCreateSchema.parse({
      agencyId: '11111111-1111-4111-8111-111111111111',
      code: 'VEND-001',
      name: 'Acme Supplies',
      currency: 'myr',
      paymentTermDays: 15,
    })

    expect(parsed.agencyId).toBe('11111111-1111-4111-8111-111111111111')
    expect(parsed.code).toBe('VEND-001')
    expect(parsed.name).toBe('Acme Supplies')
    // normalized + defaulted
    expect(parsed.currency).toBe('MYR')
    expect(parsed.subLedgerType).toBe('ACCOUNTS_PAYABLE')
    expect(parsed.paymentTermDays).toBe(15)
  })

  test('supports legacy aliases (vendorCode/vendorName/taxNumber/paymentTermsDays)', () => {
    const parsed = VendorAccountCreateSchema.parse({
      agencyId: '11111111-1111-4111-8111-111111111111',
      vendorCode: 'LEG-9',
      vendorName: 'Legacy Vendor',
      taxNumber: 'TX-123',
      paymentTermsDays: 30,
    })

    expect(parsed.code).toBe('LEG-9')
    expect(parsed.name).toBe('Legacy Vendor')
    expect(parsed.taxId).toBe('TX-123')
    expect(parsed.paymentTermDays).toBe(30)
  })

  test('supports legacy bank casing (bankIBAN)', () => {
    const parsed = VendorAccountCreateSchema.parse({
      agencyId: '11111111-1111-4111-8111-111111111111',
      code: 'VEND-IBAN',
      name: 'Iban Vendor',
      bankIBAN: 'DE89370400440532013000',
    })

    expect(parsed.bankIban).toBe('DE89370400440532013000')
  })

  test('allows SubLedger linkage by id or code', () => {
    const byId = VendorAccountCreateSchema.parse({
      agencyId: '11111111-1111-4111-8111-111111111111',
      code: 'V-1',
      name: 'Vendor 1',
      subLedgerId: '22222222-2222-4222-8222-222222222222',
    })

    expect(byId.subLedgerId).toBe('22222222-2222-4222-8222-222222222222')

    const byCode = VendorAccountCreateSchema.parse({
      agencyId: '11111111-1111-4111-8111-111111111111',
      code: 'V-2',
      name: 'Vendor 2',
      subLedgerCode: 'AP_MAIN',
    })

    expect(byCode.subLedgerCode).toBe('AP_MAIN')
  })

  test('rejects invalid currency', () => {
    const result = VendorAccountCreateSchema.safeParse({
      agencyId: '11111111-1111-4111-8111-111111111111',
      code: 'V-3',
      name: 'Vendor 3',
      currency: 'USDT',
    })

    expect(result.success).toBe(false)
  })

  test('accepts invoice automation config (auto-post, matching, e-invoice)', () => {
    const parsed = VendorAccountCreateSchema.parse({
      agencyId: '11111111-1111-4111-8111-111111111111',
      code: 'V-AUTO',
      name: 'Auto Vendor',
      invoiceEmail: 'ap@vendor.test',
      remittanceEmail: 'remit@vendor.test',
      paymentHold: true,
      paymentHoldReason: 'Missing banking confirmation',
      defaultExpenseAccountId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      defaultLiabilityAccountId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      defaultTaxAccountId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      defaultApPostingTemplateKey: 'AP_INVOICE_STANDARD',
      invoiceAutomation: {
        autoPostEnabled: true,
        autoPostTemplateKey: 'AP_INVOICE_STANDARD',
        autoMatchEnabled: true,
        matchKeys: ['INVOICE_NUMBER', 'AMOUNT'],
        amountTolerance: 0.5,
        dateToleranceDays: 3,
        eInvoice: {
          enabled: true,
          format: 'PEPPOL_BIS_3',
          participantId: '0088:123456789',
          schemeId: '0088',
        },
      },
    })

    expect(parsed.invoiceAutomation?.autoPostEnabled).toBe(true)
    expect(parsed.invoiceAutomation?.autoMatchEnabled).toBe(true)
    expect(parsed.invoiceAutomation?.matchKeys).toEqual(['INVOICE_NUMBER', 'AMOUNT'])
    expect(parsed.invoiceAutomation?.eInvoice?.format).toBe('PEPPOL_BIS_3')
    expect(parsed.defaultExpenseAccountId).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
    expect(parsed.defaultApPostingTemplateKey).toBe('AP_INVOICE_STANDARD')
  })

  test('rejects unsupported e-invoice format', () => {
    const result = VendorAccountCreateSchema.safeParse({
      agencyId: '11111111-1111-4111-8111-111111111111',
      code: 'V-EINV',
      name: 'EInv Vendor',
      invoiceAutomation: {
        eInvoice: {
          enabled: true,
          format: 'INVALID_FORMAT' as any,
        },
      },
    })

    expect(result.success).toBe(false)
  })

  test('update requires id and allows partial fields', () => {
    const parsed = VendorAccountUpdateSchema.parse({
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Renamed Vendor',
      isActive: false,
    })

    expect(parsed.id).toBe('33333333-3333-4333-8333-333333333333')
    expect(parsed.name).toBe('Renamed Vendor')
    expect(parsed.isActive).toBe(false)
  })
})
