import { z } from 'zod';

// ============================================================
// Enums (mirror Prisma enums)
// ============================================================

export const partnerTypeEnum = z.enum([
  'CUSTOMER',
  'VENDOR',
  'EMPLOYEE',
  'BANK',
  'OTHER',
]);

export const openItemStatusEnum = z.enum([
  'OPEN',
  'PARTIALLY_CLEARED',
  'CLEARED',
]);

export const clearingDocumentTypeEnum = z.enum([
  'PAYMENT',
  'RECEIPT',
  'CREDIT_NOTE',
  'DEBIT_NOTE',
  'CLEARING',
  'ADJUSTMENT',
]);

// ============================================================
// Open Item Schemas
// ============================================================

/**
 * Create Open Item Schema
 * Used when manually creating an open item (e.g., from invoice import)
 * Normally, open items are auto-created when posting to control accounts
 */
export const createOpenItemSchema = z.object({
  // Account context
  accountId: z.string().uuid('Invalid account ID'),
  
  // Document identification
  documentNumber: z.string().min(1, 'Document number is required').max(50),
  documentDate: z.coerce.date(),
  dueDate: z.coerce.date().optional(),
  
  // Classification
  itemType: z.string().max(20).default('INVOICE'),
  
  // Partner information
  partnerType: partnerTypeEnum.optional(),
  customerId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
  
  // Matching fields  
  reference: z.string().max(100).optional(),
  assignment: z.string().max(50).optional(), // Assignment field for matching
  text: z.string().max(255).optional(), // Line text for matching
  
  // Base/Local currency amounts (company currency)
  localCurrencyCode: z.string().length(3).default('MYR'),
  localAmount: z.number(), // Positive = debit, Negative = credit
  localRemainingAmount: z.number().optional(), // Defaults to localAmount
  
  // Document currency amounts (transaction currency)
  documentCurrencyCode: z.string().length(3).default('MYR'),
  documentAmount: z.number(), // Positive = debit, Negative = credit
  documentRemainingAmount: z.number().optional(), // Defaults to documentAmount
  
  // Exchange rate at posting
  exchangeRate: z.number().positive().default(1),
  
  // Source document linking
  sourceModule: z.string().max(50).optional(),
  sourceId: z.string().uuid().optional(),
  sourceReference: z.string().max(100).optional(),
  
  // Journal entry linking
  journalEntryId: z.string().uuid().optional(),
  journalLineId: z.string().uuid().optional(),
  
}).refine(
  (data) => !(data.customerId && data.vendorId),
  { message: 'Cannot have both customer and vendor on same open item' }
).refine(
  (data) => {
    if (data.partnerType === 'CUSTOMER' && !data.customerId) {
      return false;
    }
    return true;
  },
  { message: 'Customer ID required when partner type is CUSTOMER' }
).refine(
  (data) => {
    if (data.partnerType === 'VENDOR' && !data.vendorId) {
      return false;
    }
    return true;
  },
  { message: 'Vendor ID required when partner type is VENDOR' }
);

/**
 * Update Open Item Schema
 * Limited fields can be updated (matching fields mainly)
 */
export const updateOpenItemSchema = z.object({
  id: z.string().uuid(),
  reference: z.string().max(100).optional(),
  assignment: z.string().max(50).optional(),
  text: z.string().max(255).optional(),
  dueDate: z.coerce.date().optional(),
});

// ============================================================
// Open Item Filtering/Query Schemas
// ============================================================

export const getOpenItemsFilterSchema = z.object({
  // Scope filters
  accountId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
  partnerType: partnerTypeEnum.optional(),
  
  // Status filter
  status: openItemStatusEnum.optional(),
  statusIn: z.array(openItemStatusEnum).optional(),
  
  // Date filters
  documentDateFrom: z.coerce.date().optional(),
  documentDateTo: z.coerce.date().optional(),
  dueDateFrom: z.coerce.date().optional(),
  dueDateTo: z.coerce.date().optional(),
  
  // Amount filters
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  includeZeroBalance: z.boolean().default(false),
  
  // Search  
  search: z.string().optional(), // Search document number, reference, assignment, text
  
  // Pagination
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
  
  // Sorting
  sortBy: z.enum([
    'documentDate',
    'dueDate',
    'documentNumber',
    'localAmount',
    'localRemainingAmount',
    'createdAt',
  ]).default('documentDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================
// Clearing/Allocation Schemas
// ============================================================

/**
 * Clear Open Items Schema
 * Used for manual and automatic clearing
 */
export const clearOpenItemsSchema = z.object({
  // Items to clear (must net to zero or within tolerance)
  items: z.array(z.object({
    openItemId: z.string().uuid(),
    clearAmount: z.number(), // Amount to clear from this item
    clearAmountDocument: z.number().optional(), // Document currency amount
  })).min(1, 'At least one item required for clearing'),
  
  // Clearing document info
  clearingDocumentType: clearingDocumentTypeEnum,
  clearingDocumentNumber: z.string().max(50).optional(),
  clearingDate: z.coerce.date(),
  
  // Exchange rate for FX difference calculation
  clearingExchangeRate: z.number().positive().optional(),
  
  // Notes
  notes: z.string().max(500).optional(),
  
  // Whether to auto-post exchange difference
  postExchangeDifference: z.boolean().default(true),
}).refine(
  (data) => {
    // Validate that items can actually be cleared
    const total = data.items.reduce((sum, item) => sum + item.clearAmount, 0);
    return Math.abs(total) < 0.01; // Must net to zero within tolerance
  },
  { message: 'Clearing items must net to zero' }
);

/**
 * Partial Clear Open Item Schema
 * Used when clearing part of an open item
 */
export const partialClearSchema = z.object({
  openItemId: z.string().uuid(),
  
  // Amount to allocate (in local currency)
  localAmount: z.number(),
  
  // Amount to allocate (in document currency, optional)
  documentAmount: z.number().optional(),
  
  // What is clearing this item
  clearedById: z.string().uuid().optional(), // Another open item, payment, etc.
  clearedByType: clearingDocumentTypeEnum,
  clearedByRef: z.string().max(100), // Document reference
  
  // Exchange difference (auto-calculated or provided)
  exchangeDifference: z.number().optional(),
  
  notes: z.string().max(500).optional(),
});

/**
 * Auto-Clear Parameters Schema
 * Parameters for automatic clearing algorithm
 */
export const autoClearParametersSchema = z.object({
  // Scope
  accountId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
  
  // Matching criteria
  matchBy: z.array(z.enum([
    'documentNumber',
    'reference',
    'assignment',
    'amount',
    'dueDate',
  ])).min(1, 'At least one matching criterion required'),
  
  // Tolerance
  amountTolerance: z.number().min(0).default(0.01), // Allow small differences
  dateTolerance: z.number().int().min(0).default(0), // Days tolerance for date matching
  
  // Clearing date
  clearingDate: z.coerce.date().optional(), // Defaults to today
  
  // Options
  dryRun: z.boolean().default(false), // Preview without actually clearing
  maxItems: z.number().int().min(1).max(1000).default(100), // Limit items processed
});

/**
 * Reverse Clearing Schema
 * Used to undo a clearing operation
 */
export const reverseClearingSchema = z.object({
  clearingDocumentId: z.string().uuid().optional(),
  clearingDocumentNumber: z.string().optional(),
  
  reason: z.string().min(1, 'Reason is required').max(500),
}).refine(
  (data) => data.clearingDocumentId || data.clearingDocumentNumber,
  { message: 'Either clearing document ID or number is required' }
);

// ============================================================
// Output/Response Schemas
// ============================================================

/**
 * Open Item Allocation Output
 */
export const openItemAllocationOutputSchema = z.object({
  id: z.string().uuid(),
  openItemId: z.string().uuid(),
  
  clearedById: z.string().nullable(),
  clearedByType: z.string(),
  clearedByRef: z.string(),
  
  localAmount: z.number(),
  documentAmount: z.number().nullable(),
  exchangeDifference: z.number(),
  
  clearedAt: z.date(),
  clearedBy: z.string(),
  
  notes: z.string().nullable(),
});

/**
 * Open Item Output (from DB)
 */
export const openItemOutputSchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string().nullable(),
  subAccountId: z.string().nullable(),
  accountId: z.string().uuid(),
  
  // Document info
  documentNumber: z.string(),
  documentDate: z.date(),
  dueDate: z.date().nullable(),
  itemType: z.string(),
  
  // Partner
  partnerType: z.string().nullable(),
  customerId: z.string().nullable(),
  vendorId: z.string().nullable(),
  
  // Matching fields
  reference: z.string().nullable(),
  assignment: z.string().nullable(),
  text: z.string().nullable(),
  
  // Local currency
  localCurrencyCode: z.string(),
  localAmount: z.number(),
  localRemainingAmount: z.number(),
  
  // Document currency
  documentCurrencyCode: z.string(),
  documentAmount: z.number(),
  documentRemainingAmount: z.number(),
  
  exchangeRate: z.number(),
  
  // Status
  status: z.string(),
  clearingDate: z.date().nullable(),
  clearingDocumentId: z.string().nullable(),
  
  // Source
  sourceModule: z.string().nullable(),
  sourceId: z.string().nullable(),
  sourceReference: z.string().nullable(),
  journalEntryId: z.string().nullable(),
  journalLineId: z.string().nullable(),
  
  // Audit
  createdAt: z.date(),
  createdBy: z.string(),
  enteredAt: z.date().nullable(),
  postedAt: z.date().nullable(),
  clearedAt: z.date().nullable(),
  clearedBy: z.string().nullable(),
  
  // Relations (optional, when included)
  Allocations: z.array(openItemAllocationOutputSchema).optional(),
  Account: z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
  }).optional(),
  Customer: z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
  }).nullable().optional(),
  Vendor: z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
  }).nullable().optional(),
});

/**
 * Clearing Result Output
 */
export const clearingResultOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  
  // Items that were cleared
  clearedItems: z.array(z.object({
    openItemId: z.string().uuid(),
    documentNumber: z.string(),
    previousStatus: z.string(),
    newStatus: z.string(),
    amountCleared: z.number(),
    remainingAmount: z.number(),
  })),
  
  // Any exchange differences posted
  exchangeDifferences: z.array(z.object({
    openItemId: z.string().uuid(),
    difference: z.number(),
    journalEntryId: z.string().uuid().optional(),
  })).optional(),
  
  // Clearing document created
  clearingDocumentNumber: z.string().optional(),
  clearingDocumentId: z.string().uuid().optional(),
});

/**
 * Auto-Clear Result Output
 */
export const autoClearResultOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  
  // Statistics
  itemsProcessed: z.number(),
  itemsCleared: z.number(),
  errors: z.array(z.object({
    openItemId: z.string().uuid(),
    documentNumber: z.string(),
    error: z.string(),
  })),
  
  // If dry run, show what would be cleared
  proposedClearings: z.array(z.object({
    items: z.array(z.object({
      openItemId: z.string().uuid(),
      documentNumber: z.string(),
      amount: z.number(),
    })),
    matchedBy: z.array(z.string()),
    netAmount: z.number(),
  })).optional(),
  
  // Actual clearings (if not dry run)
  clearings: z.array(z.object({
    clearingDocumentNumber: z.string(),
    itemsCleared: z.number(),
    totalAmount: z.number(),
  })).optional(),
});

// ============================================================
// Type Exports
// ============================================================

export type PartnerType = z.infer<typeof partnerTypeEnum>;
export type OpenItemStatus = z.infer<typeof openItemStatusEnum>;
export type ClearingDocumentType = z.infer<typeof clearingDocumentTypeEnum>;

export type CreateOpenItemInput = z.infer<typeof createOpenItemSchema>;
export type UpdateOpenItemInput = z.infer<typeof updateOpenItemSchema>;
export type GetOpenItemsFilter = z.infer<typeof getOpenItemsFilterSchema>;
export type ClearOpenItemsInput = z.infer<typeof clearOpenItemsSchema>;
export type PartialClearInput = z.infer<typeof partialClearSchema>;
export type AutoClearParameters = z.infer<typeof autoClearParametersSchema>;
export type ReverseClearingInput = z.infer<typeof reverseClearingSchema>;

export type OpenItemAllocationOutput = z.infer<typeof openItemAllocationOutputSchema>;
export type OpenItemOutput = z.infer<typeof openItemOutputSchema>;
export type ClearingResultOutput = z.infer<typeof clearingResultOutputSchema>;
export type AutoClearResultOutput = z.infer<typeof autoClearResultOutputSchema>;
