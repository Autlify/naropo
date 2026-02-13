/**
 * FI-BL Bank Account Schema Tests
 */

import { describe, test, expect } from 'bun:test'
import {
  blBankAccountSchema,
  createBlBankAccountSchema,
  updateBlBankAccountSchema,
  blBankAccountFilterSchema,
  activateBankAccountSchema,
  closeBankAccountSchema,
  connectBankAccountSchema,
  syncBankAccountSchema,
  bankAccountTypeEnum,
  bankAccountStatusEnum,
  bankConnectionTypeEnum,
  paymentFileFormatEnum,
} from '../bank-account'

describe('FI-BL Bank Account schema', () => {
  // Valid UUIDs following RFC 4122 (version 4)
  const validAgencyId = '550e8400-e29b-41d4-a716-446655440001'
  const validGlAccountId = '550e8400-e29b-41d4-a716-446655440002'
  const validSubAccountId = '550e8400-e29b-41d4-a716-446655440003'

  // Helper to create valid bank account data
  const createValidBankAccount = (overrides = {}) => ({
    agencyId: validAgencyId,
    accountCode: 'BANK001',
    accountName: 'Main Operating Account',
    accountNumber: '1234567890',
    bankName: 'Test Bank',
    bankCountry: 'US',
    glAccountId: validGlAccountId,
    currencyCode: 'USD',
    accountHolderName: 'Test Company Inc',
    ...overrides,
  })

  describe('bankAccountTypeEnum', () => {
    test('accepts valid account types', () => {
      const validTypes = [
        'OPERATING', 'SAVINGS', 'MONEY_MARKET', 'PAYROLL',
        'TAX', 'ESCROW', 'PETTY_CASH', 'MERCHANT',
        'INVESTMENT', 'FOREIGN', 'VIRTUAL', 'CREDIT_LINE',
      ]
      validTypes.forEach((type) => {
        const result = bankAccountTypeEnum.safeParse(type)
        expect(result.success).toBe(true)
      })
    })

    test('rejects invalid account type', () => {
      const result = bankAccountTypeEnum.safeParse('INVALID_TYPE')
      expect(result.success).toBe(false)
    })
  })

  describe('bankAccountStatusEnum', () => {
    test('accepts valid statuses', () => {
      const validStatuses = [
        'ACTIVE', 'INACTIVE', 'FROZEN', 'CLOSED',
        'PENDING_ACTIVATION', 'PENDING_CLOSURE',
      ]
      validStatuses.forEach((status) => {
        const result = bankAccountStatusEnum.safeParse(status)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('bankConnectionTypeEnum', () => {
    test('accepts valid connection types', () => {
      const validTypes = [
        'MANUAL', 'FILE_IMPORT', 'OPEN_BANKING', 'PLAID',
        'YODLEE', 'STRIPE', 'DIRECT_API', 'SWIFT', 'BACS', 'ACH', 'SEPA',
      ]
      validTypes.forEach((type) => {
        const result = bankConnectionTypeEnum.safeParse(type)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('paymentFileFormatEnum', () => {
    test('accepts valid payment formats', () => {
      const validFormats = [
        'ISO20022_PAIN', 'BAI2', 'NACHA', 'MT940', 'MT942',
        'CAMT053', 'CAMT054', 'OFX', 'QIF', 'CSV',
        'BACS', 'SEPA_SCT', 'SEPA_SDD',
      ]
      validFormats.forEach((format) => {
        const result = paymentFileFormatEnum.safeParse(format)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('createBlBankAccountSchema', () => {
    test('accepts valid minimal bank account', () => {
      const result = createBlBankAccountSchema.safeParse(createValidBankAccount())
      expect(result.success).toBe(true)
    })

    test('accepts valid bank account with IBAN', () => {
      const result = createBlBankAccountSchema.safeParse(
        createValidBankAccount({
          iban: 'GB82WEST12345698765432',
          swiftBic: 'WESTGB2L',
        })
      )
      expect(result.success).toBe(true)
    })

    test('rejects invalid IBAN format', () => {
      const result = createBlBankAccountSchema.safeParse(
        createValidBankAccount({
          iban: 'invalid-iban',
        })
      )
      expect(result.success).toBe(false)
    })

    test('accepts bank account with full details', () => {
      const result = createBlBankAccountSchema.safeParse(
        createValidBankAccount({
          subAccountId: validSubAccountId,
          description: 'Main operating account for daily transactions',
          accountType: 'OPERATING',
          iban: 'DE89370400440532013000',
          swiftBic: 'COBADEFFXXX',
          bankCode: '37040044',
          branchCode: '001',
          branchName: 'Main Branch',
          overdraftLimit: 50000,
          dailyPaymentLimit: 100000,
          singlePaymentLimit: 25000,
          connectionType: 'OPEN_BANKING',
          autoSync: true,
          syncIntervalMinutes: 60,
          defaultPaymentFormat: 'ISO20022_PAIN',
          requiresDualApproval: true,
          reconciliationFrequency: 'DAILY',
          toleranceAmount: 0.01,
          isDefault: true,
          isPrimaryOperating: true,
        })
      )
      expect(result.success).toBe(true)
    })

    test('rejects missing required fields', () => {
      const result = createBlBankAccountSchema.safeParse({
        agencyId: validAgencyId,
        // Missing accountCode, accountName, etc.
      })
      expect(result.success).toBe(false)
    })

    test('rejects invalid currency code', () => {
      const result = createBlBankAccountSchema.safeParse(
        createValidBankAccount({
          currencyCode: 'INVALID',
        })
      )
      expect(result.success).toBe(false)
    })

    test('accepts all valid account types', () => {
      const types = [
        'OPERATING', 'SAVINGS', 'MONEY_MARKET', 'PAYROLL',
        'FOREIGN', 'ESCROW', 'PETTY_CASH',
      ]
      types.forEach((accountType) => {
        const result = createBlBankAccountSchema.safeParse(
          createValidBankAccount({ accountType })
        )
        expect(result.success).toBe(true)
      })
    })
  })

  describe('updateBlBankAccountSchema', () => {
    test('accepts partial update with id', () => {
      const result = updateBlBankAccountSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440010',
        accountName: 'Updated Account Name',
      })
      expect(result.success).toBe(true)
    })

    test('rejects update without id', () => {
      const result = updateBlBankAccountSchema.safeParse({
        accountName: 'Updated Account Name',
      })
      expect(result.success).toBe(false)
    })

    test('accepts update of limits', () => {
      const result = updateBlBankAccountSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440010',
        overdraftLimit: 75000,
        dailyPaymentLimit: 150000,
        singlePaymentLimit: 50000,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('activateBankAccountSchema', () => {
    test('accepts valid activation', () => {
      const result = activateBankAccountSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440010',
        activationDate: new Date(),
        notes: 'Account verified and activated',
      })
      expect(result.success).toBe(true)
    })

    test('accepts activation without optional fields', () => {
      const result = activateBankAccountSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440010',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('closeBankAccountSchema', () => {
    test('accepts valid closure with zero balance confirmation', () => {
      const result = closeBankAccountSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440010',
        closureDate: new Date(),
        reason: 'Consolidating accounts',
        confirmZeroBalance: true,
      })
      expect(result.success).toBe(true)
    })

    test('rejects closure without zero balance confirmation', () => {
      const result = closeBankAccountSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440010',
        closureDate: new Date(),
        reason: 'Consolidating accounts',
        confirmZeroBalance: false,
      })
      expect(result.success).toBe(false)
    })

    test('accepts closure with transfer target', () => {
      const result = closeBankAccountSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440010',
        closureDate: new Date(),
        reason: 'Moving to new bank',
        confirmZeroBalance: true,
        transferRemainingTo: '550e8400-e29b-41d4-a716-446655440011',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('connectBankAccountSchema', () => {
    test('accepts valid connection setup', () => {
      const result = connectBankAccountSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440010',
        connectionType: 'OPEN_BANKING',
        autoSync: true,
        syncIntervalMinutes: 60,
        importHistoricalDays: 90,
      })
      expect(result.success).toBe(true)
    })

    test('rejects sync interval less than 15 minutes', () => {
      const result = connectBankAccountSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440010',
        connectionType: 'PLAID',
        syncIntervalMinutes: 5,
      })
      expect(result.success).toBe(false)
    })

    test('accepts connection with credentials', () => {
      const result = connectBankAccountSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440010',
        connectionType: 'DIRECT_API',
        connectionCredentials: {
          apiKey: 'test-api-key',
          clientId: 'test-client-id',
        },
        autoSync: false,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('syncBankAccountSchema', () => {
    test('accepts valid sync request', () => {
      const result = syncBankAccountSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440010',
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-01-31'),
        importTransactions: true,
        updateBalances: true,
      })
      expect(result.success).toBe(true)
    })

    test('accepts sync without date range', () => {
      const result = syncBankAccountSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440010',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('blBankAccountFilterSchema', () => {
    test('accepts valid filter with agency', () => {
      const result = blBankAccountFilterSchema.safeParse({
        agencyId: validAgencyId,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.pageSize).toBe(20)
      }
    })

    test('accepts filter with all options', () => {
      const result = blBankAccountFilterSchema.safeParse({
        agencyId: validAgencyId,
        subAccountId: validSubAccountId,
        accountCode: 'BANK001',
        accountType: 'OPERATING',
        status: 'ACTIVE',
        currencyCode: 'USD',
        connectionType: 'OPEN_BANKING',
        isDefault: true,
        isPrimaryOperating: false,
        hasUnreconciledItems: true,
        search: 'operating',
        page: 2,
        pageSize: 50,
      })
      expect(result.success).toBe(true)
    })

    test('rejects page size over 100', () => {
      const result = blBankAccountFilterSchema.safeParse({
        agencyId: validAgencyId,
        pageSize: 150,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('blBankAccountSchema (full schema)', () => {
    test('accepts complete bank account', () => {
      const result = blBankAccountSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440010',
        agencyId: validAgencyId,
        accountCode: 'BANK001',
        accountName: 'Main Operating Account',
        accountNumber: '1234567890',
        bankName: 'Test Bank',
        bankCountry: 'US',
        glAccountId: validGlAccountId,
        currencyCode: 'USD',
        accountHolderName: 'Test Company Inc',
        accountType: 'OPERATING',
        status: 'ACTIVE',
        currentBalance: 150000,
        availableBalance: 145000,
        unclearedBalance: 5000,
        balanceAsOfDate: new Date(),
        connectionType: 'MANUAL',
        isDefault: true,
        createdAt: new Date(),
      })
      expect(result.success).toBe(true)
    })
  })
})
