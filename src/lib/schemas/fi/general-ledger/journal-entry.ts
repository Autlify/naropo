
import { z } from 'zod';

// Custom validator for double-entry balance
const validateDoubleEntry = (lines: JournalEntryLineInput[]) => {
  const totalDebit = lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0);
  
  // Allow small rounding difference (0.01)
  return Math.abs(totalDebit - totalCredit) < 0.01;
};

// Next Line Number Helper
export const nextLineNumber = (lines: JournalEntryLineInput[]): number => {
  if (lines.length === 0) return 1;
  return Math.max(...lines.map(line => line.lineNumber)) + 1;
}

/**
 * Journal Entry Line Schema
 * 
 * Currency handling:
 * - debitAmount/creditAmount: Transaction currency amounts (user input)
 * - debitAmountBase/creditAmountBase: Base currency amounts (auto-calculated)
 * - exchangeRate: Line-level override rate (optional, defaults to header rate)
 * 
 * Base currency amounts are calculated in server action:
 *   debitAmountBase = debitAmount * exchangeRate
 *   creditAmountBase = creditAmount * exchangeRate
 */
export const journalEntryLineSchema = z.object({
  lineNumber: z.number().int().min(1),
  accountId: z.string().uuid(),
  description: z.string().max(500).optional(),
  
  // Transaction currency amounts (user input)
  debitAmount: z.number().min(0).default(0),
  creditAmount: z.number().min(0).default(0),
  
  // Base currency amounts (optional - calculated in action if not provided)
  // Used when importing entries that already have base amounts calculated
  debitAmountBase: z.number().min(0).optional(),
  creditAmountBase: z.number().min(0).optional(),
  
  // Line-level exchange rate override (optional, uses header rate if not set)
  exchangeRate: z.number().positive().optional(),
  
  // Subledger linking
  subledgerType: z.enum([
    'NONE',
    'ACCOUNTS_RECEIVABLE',
    'ACCOUNTS_PAYABLE',
    'INVENTORY',
    'FIXED_ASSETS',
    'PAYROLL',
    'BANK',
  ]).default('NONE'),
  subledgerReference: z.string().max(100).optional(),
  
  // Tax information
  taxCode: z.string().max(20).optional(),
  taxAmount: z.number().optional(),
  
  // Dimensions for cost allocation/reporting
  dimension1: z.string().max(50).optional(), // Cost center
  dimension2: z.string().max(50).optional(), // Department
  dimension3: z.string().max(50).optional(), // Project
  dimension4: z.string().max(50).optional(), // Custom
  
  // Intercompany transaction linking
  isIntercompany: z.boolean().default(false),
  intercompanySubAccountId: z.string().uuid().optional(),
}).refine(
  (data) => data.debitAmount > 0 || data.creditAmount > 0,
  { message: 'Each line must have either a debit or credit amount' }
).refine(
  (data) => !(data.debitAmount > 0 && data.creditAmount > 0),
  { message: 'A line cannot have both debit and credit amounts' }
);

export const createJournalEntrySchema = z.object({
  periodId: z.string().uuid(),
  entryDate: z.coerce.date(),
  
  entryType: z.enum([
    'NORMAL',
    'OPENING',
    'CLOSING',
    'CARRY_FORWARD',
    'BROUGHT_FORWARD',
    'YEAR_END_CLOSING',
    'ADJUSTMENT',
    'REVERSAL',
    'CONSOLIDATION',
    'ELIMINATION',
  ]).default('NORMAL'),
  
  sourceModule: z.enum([
    'MANUAL',
    'INVOICE',
    'PAYMENT',
    'EXPENSE',
    'PAYROLL',
    'ASSET',
    'INVENTORY',
    'BANK',
    'ADJUSTMENT',
    'CONSOLIDATION',
    'INTERCOMPANY',
    'REVERSAL',
    'YEAR_END',
    'OPENING_BALANCE',
  ]).default('MANUAL'),
  
  sourceId: z.string().uuid().optional(),
  sourceReference: z.string().max(100).optional(),
  
  description: z.string().min(1, 'Description is required').max(1000),
  notes: z.string().max(2000).optional(),
  
  // Document/Transaction currency
  currencyCode: z.string().length(3).default('USD'),
  exchangeRate: z.number().positive().default(1),
  
  // Denormalized totals (optional - calculated in action if not provided)
  totalDebit: z.number().min(0).optional(),
  totalCredit: z.number().min(0).optional(),
  totalDebitBase: z.number().min(0).optional(),
  totalCreditBase: z.number().min(0).optional(),
  
  lines: z
    .array(journalEntryLineSchema)
    .min(2, 'At least 2 lines are required for double-entry')
    .max(100, 'Maximum 100 lines per entry'),
    
}).refine(
  (data) => validateDoubleEntry(data.lines),
  { message: 'Total debits must equal total credits (double-entry)' }
);

export const updateJournalEntrySchema = createJournalEntrySchema.extend({
  id: z.string().uuid(),
});

export const submitJournalEntrySchema = z.object({
  id: z.string().uuid(),
});

export const approveJournalEntrySchema = z.object({
  id: z.string().uuid(),
  notes: z.string().max(500).optional(),
});

export const rejectJournalEntrySchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1, 'Rejection reason is required').max(500),
});

export const postJournalEntrySchema = z.object({
  id: z.string().uuid(),
});

export const reverseJournalEntrySchema = z.object({
  id: z.string().uuid(),
  reversalDate: z.coerce.date(),
  reason: z.string().min(1, 'Reversal reason is required').max(500),
});

export const voidJournalEntrySchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1, 'Void reason is required').max(500),
});

// ============================================================
// Output/Response Types (match Prisma model structure)
// ============================================================

/**
 * Journal Entry Line Output (from DB)
 * Includes calculated base currency amounts
 */
export const journalEntryLineOutputSchema = z.object({
  id: z.string().uuid(),
  journalEntryId: z.string().uuid(),
  lineNumber: z.number().int(),
  accountId: z.string().uuid(),
  description: z.string().nullable(),
  
  // Transaction currency amounts
  debitAmount: z.number(),
  creditAmount: z.number(),
  
  // Base currency amounts (calculated: amount * exchangeRate)
  debitAmountBase: z.number(),
  creditAmountBase: z.number(),
  
  // Exchange rate used for this line
  exchangeRate: z.number().nullable(),
  
  // Subledger
  subledgerType: z.string(),
  subledgerReference: z.string().nullable(),
  
  // Tax
  taxCode: z.string().nullable(),
  taxAmount: z.number().nullable(),
  
  // Dimensions
  dimension1: z.string().nullable(),
  dimension2: z.string().nullable(),
  dimension3: z.string().nullable(),
  dimension4: z.string().nullable(),
  
  // Intercompany
  isIntercompany: z.boolean(),
  intercompanySubAccountId: z.string().nullable(),
  
  createdAt: z.date(),
});

/**
 * Journal Entry Output (from DB)
 * Complete entry with all calculated fields
 */
export const journalEntryOutputSchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string().nullable(),
  subAccountId: z.string().nullable(),
  entryNumber: z.string(),
  reference: z.string().nullable(),
  periodId: z.string().uuid(),
  entryDate: z.date(),
  entryType: z.string(),
  sourceModule: z.string(),
  sourceId: z.string().nullable(),
  sourceReference: z.string().nullable(),
  description: z.string(),
  notes: z.string().nullable(),
  
  // Currency
  currencyCode: z.string(),
  exchangeRate: z.number(),
  
  // Totals (denormalized)
  totalDebit: z.number(),
  totalCredit: z.number(),
  totalDebitBase: z.number(),
  totalCreditBase: z.number(),
  
  // Status
  status: z.string(),
  
  // Workflow timestamps
  submittedAt: z.date().nullable(),
  submittedBy: z.string().nullable(),
  approvedAt: z.date().nullable(),
  approvedBy: z.string().nullable(),
  rejectedAt: z.date().nullable(),
  rejectedBy: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  postedAt: z.date().nullable(),
  postedBy: z.string().nullable(),
  
  // Audit
  createdAt: z.date(),
  createdBy: z.string(),
  updatedAt: z.date(),
  updatedBy: z.string().nullable(),
  
  // Lines
  lines: z.array(journalEntryLineOutputSchema).optional(),
});

export type JournalEntryLineInput = z.infer<typeof journalEntryLineSchema>;
export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;
export type UpdateJournalEntryInput = Partial<z.infer<typeof updateJournalEntrySchema>>;
export type JournalEntryLineOutput = z.infer<typeof journalEntryLineOutputSchema>;
export type JournalEntryOutput = z.infer<typeof journalEntryOutputSchema>;