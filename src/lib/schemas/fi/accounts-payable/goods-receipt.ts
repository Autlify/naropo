import { z } from 'zod';
import { currencyCodeSchema } from '@/lib/schemas/shared/payment';

/**
 * Goods Receipt Status Enum
 */
export const goodsReceiptStatusEnum = z.enum([
  'DRAFT',
  'POSTED',           // Posted to inventory
  'CANCELLED',
  'REVERSED',
]);

export type GoodsReceiptStatus = z.infer<typeof goodsReceiptStatusEnum>;

/**
 * Receipt Type Enum
 */
export const receiptTypeEnum = z.enum([
  'PURCHASE_ORDER',   // Receipt against PO
  'RETURN',           // Return to vendor
  'DIRECT',           // Direct receipt without PO
  'TRANSFER',         // Transfer between locations
  'ADJUSTMENT',       // Inventory adjustment
]);

export type ReceiptType = z.infer<typeof receiptTypeEnum>;

/**
 * Line Receipt Status Enum
 */
export const lineReceiptStatusEnum = z.enum([
  'PENDING',
  'RECEIVED',
  'PARTIALLY_RECEIVED',
  'REJECTED',
  'CANCELLED',
]);

export type LineReceiptStatus = z.infer<typeof lineReceiptStatusEnum>;

/**
 * Quality Status Enum
 */
export const qualityStatusEnum = z.enum([
  'NOT_INSPECTED',
  'PENDING_INSPECTION',
  'APPROVED',
  'REJECTED',
  'CONDITIONAL',
]);

export type QualityStatus = z.infer<typeof qualityStatusEnum>;

/**
 * Goods Receipt Line Schema
 */
export const goodsReceiptLineSchema = z.object({
  id: z.string().uuid(),
  goodsReceiptId: z.string().uuid(),
  lineNumber: z.number().int().min(1),

  // PO reference
  purchaseOrderId: z.string().uuid().optional(),
  purchaseOrderNumber: z.string().max(50).optional(),
  purchaseOrderLineId: z.string().uuid().optional(),
  poLineNumber: z.number().int().optional(),

  // Item details
  itemCode: z.string().max(50).optional(),
  itemId: z.string().uuid().optional(),
  description: z.string().max(500),

  // Quantities
  quantityOrdered: z.number().min(0).optional(), // Original PO quantity
  quantityExpected: z.number().min(0), // Expected on this delivery
  quantityReceived: z.number().min(0), // Actually received
  quantityRejected: z.number().min(0).default(0),
  quantityAccepted: z.number().min(0).optional(), // Received - Rejected
  unitOfMeasure: z.string().max(20).default('EA'),

  // Variance
  variance: z.number().optional(), // Received - Expected
  variancePercentage: z.number().optional(),
  varianceReason: z.string().max(255).optional(),

  // Valuation
  unitPrice: z.number().min(0),
  lineAmount: z.number(),
  currencyCode: currencyCodeSchema,

  // Location
  warehouseCode: z.string().max(20).optional(),
  locationCode: z.string().max(50).optional(),
  binLocation: z.string().max(50).optional(),

  // Lot/Serial tracking
  lotNumber: z.string().max(50).optional(),
  serialNumbers: z.array(z.string().max(50)).optional(),
  expiryDate: z.coerce.date().optional(),
  manufacturingDate: z.coerce.date().optional(),

  // Quality
  qualityStatus: qualityStatusEnum.default('NOT_INSPECTED'),
  inspectedAt: z.coerce.date().optional(),
  inspectedBy: z.string().uuid().optional(),
  qualityNotes: z.string().max(500).optional(),

  // Status
  status: lineReceiptStatusEnum.default('PENDING'),

  // GL coding (for accruals)
  glAccountId: z.string().uuid().optional(),
  costCenterId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),

  // Notes
  notes: z.string().max(500).optional(),

  // Audit
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type GoodsReceiptLine = z.infer<typeof goodsReceiptLineSchema>;

/**
 * Goods Receipt Schema
 * For 3-way matching: PO -> GR -> Invoice
 */
export const goodsReceiptSchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),

  // Identification
  grNumber: z.string().max(50),
  receiptType: receiptTypeEnum.default('PURCHASE_ORDER'),
  externalRef: z.string().max(100).optional(),

  // PO reference
  purchaseOrderId: z.string().uuid().optional(),
  purchaseOrderNumber: z.string().max(50).optional(),

  // Vendor
  vendorId: z.string().uuid(),
  vendorCode: z.string().max(20).optional(),
  vendorName: z.string().max(100).optional(),

  // Dates
  receiptDate: z.coerce.date(),
  postingDate: z.coerce.date().optional(),
  deliveryDate: z.coerce.date().optional(), // Actual delivery

  // Delivery details
  deliveryNoteNumber: z.string().max(50).optional(),
  carrierName: z.string().max(100).optional(),
  trackingNumber: z.string().max(100).optional(),
  vehicleNumber: z.string().max(50).optional(),
  driverName: z.string().max(100).optional(),

  // Location
  warehouseCode: z.string().max(20).optional(),
  receivingLocationCode: z.string().max(50).optional(),

  // Currency
  currencyCode: currencyCodeSchema,
  exchangeRate: z.number().positive().default(1),

  // Totals
  totalLines: z.number().int().min(0).default(0),
  totalQuantityExpected: z.number().default(0),
  totalQuantityReceived: z.number().default(0),
  totalQuantityRejected: z.number().default(0),
  totalAmount: z.number().default(0),
  totalAmountBase: z.number().optional(),

  // Variance summary
  hasVariance: z.boolean().default(false),
  varianceNotes: z.string().max(500).optional(),

  // Invoice matching
  invoiceId: z.string().uuid().optional(),
  invoiceNumber: z.string().max(50).optional(),
  isInvoiced: z.boolean().default(false),

  // Status
  status: goodsReceiptStatusEnum.default('DRAFT'),

  // Quality
  requiresInspection: z.boolean().default(false),
  inspectionComplete: z.boolean().default(false),
  overallQualityStatus: qualityStatusEnum.optional(),

  // GL posting
  journalEntryId: z.string().uuid().optional(),
  accrualJournalEntryId: z.string().uuid().optional(), // GR/IR accrual

  // Notes
  notes: z.string().max(2000).optional(),
  internalNotes: z.string().max(1000).optional(),

  // Attachments
  attachmentIds: z.array(z.string().uuid()).optional(),

  // Received by
  receivedBy: z.string().uuid().optional(),
  receivedByName: z.string().max(100).optional(),
  signatureFileId: z.string().uuid().optional(), // Digital signature

  // Audit
  createdAt: z.coerce.date().optional(),
  createdBy: z.string().uuid().optional(),
  updatedAt: z.coerce.date().optional(),
  updatedBy: z.string().uuid().optional(),
  postedAt: z.coerce.date().optional(),
  postedBy: z.string().uuid().optional(),
  cancelledAt: z.coerce.date().optional(),
  cancelledBy: z.string().uuid().optional(),
  cancellationReason: z.string().max(500).optional(),
  reversedAt: z.coerce.date().optional(),
  reversedBy: z.string().uuid().optional(),
  reversalReason: z.string().max(500).optional(),
});

export type GoodsReceipt = z.infer<typeof goodsReceiptSchema>;

/**
 * Create Goods Receipt Schema
 */
export const createGoodsReceiptSchema = goodsReceiptSchema.omit({
  id: true,
  totalLines: true,
  totalQuantityExpected: true,
  totalQuantityReceived: true,
  totalQuantityRejected: true,
  totalAmount: true,
  totalAmountBase: true,
  hasVariance: true,
  isInvoiced: true,
  inspectionComplete: true,
  journalEntryId: true,
  accrualJournalEntryId: true,
  createdAt: true,
  createdBy: true,
  updatedAt: true,
  updatedBy: true,
  postedAt: true,
  postedBy: true,
  cancelledAt: true,
  cancelledBy: true,
  cancellationReason: true,
  reversedAt: true,
  reversedBy: true,
  reversalReason: true,
});

export type CreateGoodsReceipt = z.infer<typeof createGoodsReceiptSchema>;

/**
 * Update Goods Receipt Schema
 */
export const updateGoodsReceiptSchema = createGoodsReceiptSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateGoodsReceipt = z.infer<typeof updateGoodsReceiptSchema>;

/**
 * Goods Receipt Output Schema
 */
export const goodsReceiptOutputSchema = goodsReceiptSchema.extend({
  lines: z.array(goodsReceiptLineSchema).optional(),
  purchaseOrder: z.object({
    poNumber: z.string(),
    orderDate: z.coerce.date(),
    totalAmount: z.number(),
  }).optional(),
});

export type GoodsReceiptOutput = z.infer<typeof goodsReceiptOutputSchema>;

/**
 * Create GR from PO Schema
 */
export const createGrFromPoSchema = z.object({
  purchaseOrderId: z.string().uuid(),
  receiptDate: z.coerce.date(),
  deliveryNoteNumber: z.string().max(50).optional(),
  warehouseCode: z.string().max(20).optional(),
  receivingLocationCode: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
  lines: z.array(z.object({
    poLineId: z.string().uuid(),
    quantityReceived: z.number().positive(),
    quantityRejected: z.number().min(0).default(0),
    lotNumber: z.string().max(50).optional(),
    serialNumbers: z.array(z.string().max(50)).optional(),
    binLocation: z.string().max(50).optional(),
    notes: z.string().max(255).optional(),
  })).min(1),
});

export type CreateGrFromPo = z.infer<typeof createGrFromPoSchema>;

/**
 * Post Goods Receipt Schema
 */
export const postGoodsReceiptSchema = z.object({
  id: z.string().uuid(),
  postingDate: z.coerce.date().optional(),
  createAccrual: z.boolean().default(true), // Create GR/IR accrual
});

export type PostGoodsReceipt = z.infer<typeof postGoodsReceiptSchema>;

/**
 * Reverse Goods Receipt Schema
 */
export const reverseGoodsReceiptSchema = z.object({
  id: z.string().uuid(),
  reversalDate: z.coerce.date().optional(),
  reason: z.string().min(1).max(500),
});

export type ReverseGoodsReceipt = z.infer<typeof reverseGoodsReceiptSchema>;

/**
 * Cancel Goods Receipt Schema
 */
export const cancelGoodsReceiptSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1).max(500),
});

export type CancelGoodsReceipt = z.infer<typeof cancelGoodsReceiptSchema>;

/**
 * Record Quality Inspection Schema
 */
export const recordQualityInspectionSchema = z.object({
  goodsReceiptId: z.string().uuid(),
  lineId: z.string().uuid().optional(), // If inspecting specific line
  qualityStatus: qualityStatusEnum,
  quantityApproved: z.number().min(0).optional(),
  quantityRejected: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
  defectCodes: z.array(z.string().max(20)).optional(),
  attachmentIds: z.array(z.string().uuid()).optional(),
});

export type RecordQualityInspection = z.infer<typeof recordQualityInspectionSchema>;

/**
 * Add GR Line Schema
 */
export const addGrLineSchema = goodsReceiptLineSchema.omit({
  id: true,
  goodsReceiptId: true,
  quantityAccepted: true,
  variance: true,
  variancePercentage: true,
  qualityStatus: true,
  inspectedAt: true,
  inspectedBy: true,
  status: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  goodsReceiptId: z.string().uuid(),
});

export type AddGrLine = z.infer<typeof addGrLineSchema>;

/**
 * Update GR Line Schema
 */
export const updateGrLineSchema = addGrLineSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateGrLine = z.infer<typeof updateGrLineSchema>;

/**
 * Goods Receipt Filter Schema
 */
export const goodsReceiptFilterSchema = z.object({
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
  purchaseOrderId: z.string().uuid().optional(),
  receiptType: receiptTypeEnum.optional(),
  status: goodsReceiptStatusEnum.optional(),
  receiptDateFrom: z.coerce.date().optional(),
  receiptDateTo: z.coerce.date().optional(),
  warehouseCode: z.string().max(20).optional(),
  isInvoiced: z.boolean().optional(),
  hasVariance: z.boolean().optional(),
  requiresInspection: z.boolean().optional(),
  inspectionComplete: z.boolean().optional(),
  search: z.string().max(100).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['receiptDate', 'grNumber', 'totalAmount', 'createdAt']).default('receiptDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type GoodsReceiptFilter = z.infer<typeof goodsReceiptFilterSchema>;

/**
 * GR Summary Schema
 */
export const goodsReceiptSummarySchema = z.object({
  period: z.object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  }),
  totalReceipts: z.number().int(),
  totalAmount: z.number(),
  byStatus: z.record(goodsReceiptStatusEnum, z.object({
    count: z.number().int(),
    amount: z.number(),
  })),
  pendingInspection: z.number().int(),
  withVariance: z.number().int(),
  uninvoiced: z.number().int(),
  uninvoicedAmount: z.number(),
});

export type GoodsReceiptSummary = z.infer<typeof goodsReceiptSummarySchema>;
