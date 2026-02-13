import { z } from 'zod';
import { currencyCodeSchema } from '@/lib/schemas/shared/payment';

/**
 * Bank Account Type Enum
 * Different types of bank accounts
 */
export const bankAccountTypeEnum = z.enum([
  'OPERATING',        // Main operating/checking account
  'SAVINGS',          // Savings account
  'MONEY_MARKET',     // Money market account
  'PAYROLL',          // Dedicated payroll account
  'TAX',              // Tax payment account
  'ESCROW',           // Escrow/trust account
  'PETTY_CASH',       // Petty cash account
  'MERCHANT',         // Merchant services account
  'INVESTMENT',       // Short-term investment account
  'FOREIGN',          // Foreign currency account
  'VIRTUAL',          // Virtual/digital account
  'CREDIT_LINE',      // Credit line/overdraft facility
]);

export type BankAccountType = z.infer<typeof bankAccountTypeEnum>;

/**
 * Bank Account Status Enum
 */
export const bankAccountStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'FROZEN',
  'CLOSED',
  'PENDING_ACTIVATION',
  'PENDING_CLOSURE',
]);

export type BankAccountStatus = z.infer<typeof bankAccountStatusEnum>;

/**
 * Bank Connection Type Enum
 * How the account connects to banking systems
 */
export const bankConnectionTypeEnum = z.enum([
  'MANUAL',           // Manual entry only
  'FILE_IMPORT',      // Statement file import
  'OPEN_BANKING',     // Open Banking API
  'PLAID',            // Plaid connection
  'YODLEE',           // Yodlee connection
  'STRIPE',           // Stripe Treasury
  'DIRECT_API',       // Direct bank API
  'SWIFT',            // SWIFT network
  'BACS',             // UK BACS
  'ACH',              // US ACH
  'SEPA',             // EU SEPA
]);

export type BankConnectionType = z.infer<typeof bankConnectionTypeEnum>;

/**
 * Payment File Format Enum
 * Supported payment file formats for exports
 */
export const paymentFileFormatEnum = z.enum([
  'ISO20022_PAIN',    // ISO 20022 pain.001
  'BAI2',             // BAI2 format
  'NACHA',            // NACHA/ACH format
  'MT940',            // SWIFT MT940
  'MT942',            // SWIFT MT942
  'CAMT053',          // ISO 20022 camt.053
  'CAMT054',          // ISO 20022 camt.054
  'OFX',              // Open Financial Exchange
  'QIF',              // Quicken Interchange Format
  'CSV',              // Custom CSV
  'BACS',             // BACS format
  'SEPA_SCT',         // SEPA Credit Transfer
  'SEPA_SDD',         // SEPA Direct Debit
]);

export type PaymentFileFormat = z.infer<typeof paymentFileFormatEnum>;

/**
 * Bank Details Embedded Schema
 * Core bank identification details
 */
export const bankDetailsSchema = z.object({
  bankName: z.string().min(1).max(100),
  bankCode: z.string().max(20).optional(), // Local bank code
  branchCode: z.string().max(20).optional(),
  branchName: z.string().max(100).optional(),
  swiftBic: z.string().min(8).max(11).optional(), // SWIFT/BIC code
  routingNumber: z.string().max(20).optional(), // US routing/ABA
  sortCode: z.string().max(8).optional(), // UK sort code
  blz: z.string().max(8).optional(), // German BLZ
  bsb: z.string().max(6).optional(), // Australian BSB

  // Address
  bankAddressLine1: z.string().max(100).optional(),
  bankAddressLine2: z.string().max(100).optional(),
  bankCity: z.string().max(50).optional(),
  bankState: z.string().max(50).optional(),
  bankPostalCode: z.string().max(20).optional(),
  bankCountry: z.string().length(2), // ISO 3166-1 alpha-2
});

export type BankDetails = z.infer<typeof bankDetailsSchema>;

/**
 * Bank Account Schema
 * Main bank account entity for the Bank Ledger module
 */
export const blBankAccountSchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),

  // Identification
  accountCode: z.string().min(1).max(20), // Internal code
  accountName: z.string().min(1).max(100),
  description: z.string().max(500).optional(),

  // Account details
  accountNumber: z.string().min(1).max(50),
  accountNumberMasked: z.string().max(50).optional(), // ***1234
  iban: z.string().max(34).optional().refine(
    val => !val || /^[A-Z]{2}[0-9]{2}[A-Z0-9]{1,30}$/.test(val),
    { message: 'Invalid IBAN format' }
  ),

  // Bank reference
  ...bankDetailsSchema.shape,

  // Account type and status
  accountType: bankAccountTypeEnum.default('OPERATING'),
  status: bankAccountStatusEnum.default('ACTIVE'),
  currencyCode: currencyCodeSchema,

  // GL Integration
  glAccountId: z.string().uuid(), // Link to GL account
  glAccountCode: z.string().max(20).optional(),

  // Balances (cached, updated on sync)
  currentBalance: z.number().default(0),
  availableBalance: z.number().default(0),
  unclearedBalance: z.number().default(0),
  balanceAsOfDate: z.coerce.date().optional(),

  // Limits
  overdraftLimit: z.number().min(0).optional(),
  dailyPaymentLimit: z.number().min(0).optional(),
  singlePaymentLimit: z.number().min(0).optional(),

  // Connection settings
  connectionType: bankConnectionTypeEnum.default('MANUAL'),
  connectionId: z.string().max(100).optional(), // External connection reference
  connectionStatus: z.enum(['CONNECTED', 'DISCONNECTED', 'ERROR', 'PENDING']).optional(),
  lastSyncAt: z.coerce.date().optional(),
  autoSync: z.boolean().default(false),
  syncIntervalMinutes: z.number().int().min(15).optional(),

  // Payment settings
  defaultPaymentFormat: paymentFileFormatEnum.optional(),
  supportsOutgoingPayments: z.boolean().default(true),
  supportsIncomingPayments: z.boolean().default(true),
  requiresDualApproval: z.boolean().default(false),

  // Account holder
  accountHolderName: z.string().min(1).max(100),
  accountHolderType: z.enum(['BUSINESS', 'INDIVIDUAL']).default('BUSINESS'),

  // Contacts
  relationshipManagerName: z.string().max(100).optional(),
  relationshipManagerEmail: z.string().email().optional(),
  relationshipManagerPhone: z.string().max(20).optional(),

  // Statement settings
  statementDay: z.number().int().min(1).max(31).optional(),
  statementFormat: paymentFileFormatEnum.optional(),
  autoImportStatements: z.boolean().default(false),

  // Reconciliation settings
  reconciliationFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'ON_DEMAND']).default('MONTHLY'),
  lastReconciledDate: z.coerce.date().optional(),
  lastReconciledBalance: z.number().optional(),
  toleranceAmount: z.number().min(0).default(0.01),

  // Metadata
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
  isDefault: z.boolean().default(false),
  isPrimaryOperating: z.boolean().default(false),

  // Audit
  createdAt: z.coerce.date().optional(),
  createdBy: z.string().uuid().optional(),
  updatedAt: z.coerce.date().optional(),
  updatedBy: z.string().uuid().optional(),
  closedAt: z.coerce.date().optional(),
  closedBy: z.string().uuid().optional(),
});

export type BlBankAccount = z.infer<typeof blBankAccountSchema>;

/**
 * Create Bank Account Schema
 */
export const createBlBankAccountSchema = blBankAccountSchema.omit({
  id: true,
  accountNumberMasked: true,
  currentBalance: true,
  availableBalance: true,
  unclearedBalance: true,
  balanceAsOfDate: true,
  connectionStatus: true,
  lastSyncAt: true,
  lastReconciledDate: true,
  lastReconciledBalance: true,
  createdAt: true,
  createdBy: true,
  updatedAt: true,
  updatedBy: true,
  closedAt: true,
  closedBy: true,
});

export type CreateBlBankAccount = z.infer<typeof createBlBankAccountSchema>;

/**
 * Update Bank Account Schema
 */
export const updateBlBankAccountSchema = createBlBankAccountSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateBlBankAccount = z.infer<typeof updateBlBankAccountSchema>;

/**
 * Bank Account Output Schema
 */
export const blBankAccountOutputSchema = blBankAccountSchema.extend({
  // Additional computed fields for output
  pendingTransactionCount: z.number().int().min(0).optional(),
  unreconciledTransactionCount: z.number().int().min(0).optional(),
  daysUntilReconciliationDue: z.number().int().optional(),
});

export type BlBankAccountOutput = z.infer<typeof blBankAccountOutputSchema>;

/**
 * Activate Bank Account Schema
 */
export const activateBankAccountSchema = z.object({
  id: z.string().uuid(),
  activationDate: z.coerce.date().optional(),
  notes: z.string().max(500).optional(),
});

export type ActivateBankAccount = z.infer<typeof activateBankAccountSchema>;

/**
 * Close Bank Account Schema
 */
export const closeBankAccountSchema = z.object({
  id: z.string().uuid(),
  closureDate: z.coerce.date(),
  reason: z.string().max(500),
  confirmZeroBalance: z.boolean().refine(val => val === true, {
    message: 'Must confirm zero balance before closure',
  }),
  transferRemainingTo: z.string().uuid().optional(), // Account to transfer any remaining funds
});

export type CloseBankAccount = z.infer<typeof closeBankAccountSchema>;

/**
 * Connect Bank Account Schema
 */
export const connectBankAccountSchema = z.object({
  id: z.string().uuid(),
  connectionType: bankConnectionTypeEnum,
  connectionCredentials: z.record(z.string(), z.string()).optional(),
  autoSync: z.boolean().default(false),
  syncIntervalMinutes: z.number().int().min(15).default(60),
  importHistoricalDays: z.number().int().min(0).max(365).default(90),
});

export type ConnectBankAccount = z.infer<typeof connectBankAccountSchema>;

/**
 * Sync Bank Account Schema
 */
export const syncBankAccountSchema = z.object({
  id: z.string().uuid(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  importTransactions: z.boolean().default(true),
  updateBalances: z.boolean().default(true),
});

export type SyncBankAccount = z.infer<typeof syncBankAccountSchema>;

/**
 * Bank Account Filter Schema
 */
export const blBankAccountFilterSchema = z.object({
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),
  accountCode: z.string().max(20).optional(),
  accountType: bankAccountTypeEnum.optional(),
  status: bankAccountStatusEnum.optional(),
  currencyCode: currencyCodeSchema.optional(),
  connectionType: bankConnectionTypeEnum.optional(),
  isDefault: z.boolean().optional(),
  isPrimaryOperating: z.boolean().optional(),
  hasUnreconciledItems: z.boolean().optional(),
  search: z.string().max(100).optional(), // Search account name/code/number
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type BlBankAccountFilter = z.infer<typeof blBankAccountFilterSchema>;

/**
 * Bank Account Balance Summary Schema
 */
export const bankAccountBalanceSummarySchema = z.object({
  accountId: z.string().uuid(),
  accountCode: z.string(),
  accountName: z.string(),
  currencyCode: z.string().length(3),
  currentBalance: z.number(),
  availableBalance: z.number(),
  unclearedBalance: z.number(),
  overdraftUsed: z.number().optional(),
  balanceAsOfDate: z.coerce.date(),
});

export type BankAccountBalanceSummary = z.infer<typeof bankAccountBalanceSummarySchema>;

/**
 * All Accounts Balance Summary Schema
 */
export const allBankAccountsBalanceSummarySchema = z.object({
  asOfDate: z.coerce.date(),
  totalsByEntryCurrency: z.array(z.object({
    currencyCode: z.string().length(3),
    totalCurrent: z.number(),
    totalAvailable: z.number(),
    accountCount: z.number().int(),
  })),
  accounts: z.array(bankAccountBalanceSummarySchema),
});

export type AllBankAccountsBalanceSummary = z.infer<typeof allBankAccountsBalanceSummarySchema>;
