import { describe, expect, test } from 'bun:test'

import {
  CustomerAccountCreateSchema,
  CustomerAccountUpdateSchema,
} from '../customer-account'

describe('CustomerAccount schema', () => {
  const validUuid = '11111111-1111-4111-8111-111111111111'

  test('accepts minimal create input (canonical fields)', () => {
    const parsed = CustomerAccountCreateSchema.parse({
      agencyId: validUuid,
      code: 'CUST-001',
      name: 'Acme Corporation',
      currency: 'myr',
      paymentTermDays: 30,
    })

    expect(parsed.agencyId).toBe(validUuid)
    expect(parsed.code).toBe('CUST-001')
    expect(parsed.name).toBe('Acme Corporation')
    expect(parsed.currency).toBe('MYR')
    expect(parsed.subLedgerType).toBe('ACCOUNTS_RECEIVABLE')
    expect(parsed.paymentTermDays).toBe(30)
    expect(parsed.dunningEnabled).toBe(true)
    expect(parsed.dunningLevel).toBe(0)
  })

  test('supports legacy aliases (customerCode/customerName/taxNumber)', () => {
    const parsed = CustomerAccountCreateSchema.parse({
      agencyId: validUuid,
      customerCode: 'LEG-9',
      customerName: 'Legacy Customer',
      taxNumber: 'TX-123',
      paymentTermsDays: 45,
    })

    expect(parsed.code).toBe('LEG-9')
    expect(parsed.name).toBe('Legacy Customer')
    expect(parsed.taxId).toBe('TX-123')
    expect(parsed.paymentTermDays).toBe(45)
  })

  test('supports legacy bank casing (bankIBAN)', () => {
    const parsed = CustomerAccountCreateSchema.parse({
      agencyId: validUuid,
      code: 'CUST-IBAN',
      name: 'Iban Customer',
      bankIBAN: 'DE89370400440532013000',
    })

    expect(parsed.bankIban).toBe('DE89370400440532013000')
  })

  test('allows SubLedger linkage by id or code', () => {
    const byId = CustomerAccountCreateSchema.parse({
      agencyId: validUuid,
      code: 'C-1',
      name: 'Customer 1',
      subLedgerId: '22222222-2222-4222-8222-222222222222',
    })

    expect(byId.subLedgerId).toBe('22222222-2222-4222-8222-222222222222')

    const byCode = CustomerAccountCreateSchema.parse({
      agencyId: validUuid,
      code: 'C-2',
      name: 'Customer 2',
      subLedgerCode: 'AR_MAIN',
    })

    expect(byCode.subLedgerCode).toBe('AR_MAIN')
  })

  test('rejects invalid currency', () => {
    const result = CustomerAccountCreateSchema.safeParse({
      agencyId: validUuid,
      code: 'C-3',
      name: 'Customer 3',
      currency: 'USDT',
    })

    expect(result.success).toBe(false)
  })

  test('accepts invoice automation config (auto-send, matching, e-invoice)', () => {
    const parsed = CustomerAccountCreateSchema.parse({
      agencyId: validUuid,
      code: 'C-AUTO',
      name: 'Auto Customer',
      statementEmail: 'statements@customer.test',
      dunningEmail: 'accounts@customer.test',
      creditHold: true,
      creditHoldReason: 'Credit limit exceeded',
      defaultRevenueAccountId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      defaultReceivableAccountId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      defaultTaxAccountId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      defaultArPostingTemplateKey: 'AR_INVOICE_STANDARD',
      invoiceAutomation: {
        autoSendEnabled: true,
        autoSendMethod: 'BOTH',
        autoMatchEnabled: true,
        matchKeys: ['INVOICE_NUMBER', 'AMOUNT'],
        amountTolerance: 0.5,
        dateToleranceDays: 3,
        eInvoice: {
          enabled: true,
          format: 'PEPPOL_BIS_3',
          participantId: '0088:987654321',
          schemeId: '0088',
        },
        autoApplyPayments: true,
      },
    })

    expect(parsed.invoiceAutomation?.autoSendEnabled).toBe(true)
    expect(parsed.invoiceAutomation?.autoMatchEnabled).toBe(true)
    expect(parsed.invoiceAutomation?.eInvoice?.format).toBe('PEPPOL_BIS_3')
    expect(parsed.defaultRevenueAccountId).toBe('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
  })

  test('accepts dunning settings', () => {
    const parsed = CustomerAccountCreateSchema.parse({
      agencyId: validUuid,
      code: 'C-DUNNING',
      name: 'Dunning Customer',
      dunningEnabled: false,
      dunningLevel: 2,
      lastDunningDate: '2026-01-15',
    })

    expect(parsed.dunningEnabled).toBe(false)
    expect(parsed.dunningLevel).toBe(2)
  })

  test('update requires id and allows partial fields', () => {
    const parsed = CustomerAccountUpdateSchema.parse({
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Renamed Customer',
      creditHold: true,
      isActive: false,
    })

    expect(parsed.id).toBe('33333333-3333-4333-8333-333333333333')
    expect(parsed.name).toBe('Renamed Customer')
    expect(parsed.creditHold).toBe(true)
    expect(parsed.isActive).toBe(false)
  })

  test('accepts address fields', () => {
    const parsed = CustomerAccountCreateSchema.parse({
      agencyId: validUuid,
      code: 'C-ADDR',
      name: 'Customer with Address',
      address: {
        line1: '123 Main St',
        line2: 'Suite 100',
        city: 'Kuala Lumpur',
        state: 'Kuala Lumpur',
        stateCode: '14',
        postalCode: '55200',
        country: 'Malaysia',
        countryCode: 'MY',
      },
      billingAddress: {
        line1: '456 Billing St',
        city: 'Petaling Jaya',
        state: 'Selangor',
        stateCode: '10',
        postalCode: '47301',
        country: 'Malaysia',
        countryCode: 'MY',
      },
    })

    expect(parsed.address?.line1).toBe('123 Main St')
    expect(parsed.billingAddress?.city).toBe('Petaling Jaya')
  })
})
