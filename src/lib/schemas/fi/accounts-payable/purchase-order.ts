import { z } from 'zod';
import { currencyCodeSchema } from '@/lib/schemas/shared/payment';

/**
 * Purchase Order Status Enum
 */
export const purchaseOrderStatusEnum = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'SENT',              // Sent to vendor
  'ACKNOWLEDGED',      // Vendor acknowledged
  'PARTIALLY_RECEIVED', // Some items received
  'FULLY_RECEIVED',    // All items received
  'INVOICED',          // Invoice received
  'CLOSED',
  'CANCELLED',
  'ON_HOLD',
]);

export type PurchaseOrderStatus = z.infer<typeof purchaseOrderStatusEnum>;

/**
 * Purchase Order Type Enum
 */
export const purchaseOrderTypeEnum = z.enum([
  'STANDARD',          // Standard PO
  'BLANKET',           // Blanket/Framework PO
  'CONTRACT',          // Contract-based PO
  'DROPSHIP',          // Dropship PO
  'CONSIGNMENT',       // Consignment PO
]);

export type PurchaseOrderType = z.infer<typeof purchaseOrderTypeEnum>;

/**
 * Purchase Order Line Status Enum
 */
export const poLineStatusEnum = z.enum([
  'OPEN',
  'PARTIALLY_RECEIVED',
  'FULLY_RECEIVED',
  'INVOICED',
  'CLOSED',
  'CANCELLED',
]);

export type PoLineStatus = z.infer<typeof poLineStatusEnum>;

/**
 * Purchase Order Line Schema
 */
export const purchaseOrderLineSchema = z.object({
  id: z.string().uuid(),
  purchaseOrderId: z.string().uuid(),
  lineNumber: z.number().int().min(1),

  // Item details
  itemCode: z.string().max(50).optional(),
  itemId: z.string().uuid().optional(),
  description: z.string().max(500),

  // Quantities
  quantity: z.number().positive(),
  unitOfMeasure: z.string().max(20).default('EA'),
  quantityReceived: z.number().min(0).default(0),
  quantityInvoiced: z.number().min(0).default(0),
  quantityOutstanding: z.number().min(0).optional(),

  // Pricing
  unitPrice: z.number().min(0),
  discount: z.number().min(0).max(100).default(0),
  lineAmount: z.number(),
  taxCode: z.string().max(20).optional(),
  taxAmount: z.number().default(0),
  lineTotalAmount: z.number(),

  // Delivery
  requestedDeliveryDate: z.coerce.date().optional(),
  promisedDeliveryDate: z.coerce.date().optional(),
  deliveryAddress: z.string().max(500).optional(),

  // GL coding
  glAccountId: z.string().uuid().optional(),
  costCenterId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),

  // Status
  status: poLineStatusEnum.default('OPEN'),
  isClosed: z.boolean().default(false),

  // Notes
  notes: z.string().max(500).optional(),
  
  // Audit
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type PurchaseOrderLine = z.infer<typeof purchaseOrderLineSchema>;

/**
 * Purchase Order Schema
 */
export const purchaseOrderSchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),

  // Identification
  poNumber: z.string().max(50),
  poType: purchaseOrderTypeEnum.default('STANDARD'),
  externalRef: z.string().max(100).optional(),
  requisitionNumber: z.string().max(50).optional(),

  // Vendor
  vendorId: z.string().uuid(),
  vendorCode: z.string().max(20).optional(),
  vendorName: z.string().max(100).optional(),

  // Dates
  orderDate: z.coerce.date(),
  requestedDeliveryDate: z.coerce.date().optional(),
  promisedDeliveryDate: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional(), // For blanket POs

  // Currency
  currencyCode: currencyCodeSchema,
  exchangeRate: z.number().positive().default(1),

  // Totals
  subtotal: z.number().default(0),
  discountAmount: z.number().default(0),
  taxAmount: z.number().default(0),
  shippingAmount: z.number().default(0),
  totalAmount: z.number().default(0),
  totalAmountBase: z.number().optional(),

  // For blanket POs
  releaseLimit: z.number().optional(),
  releasedAmount: z.number().default(0),
  remainingAmount: z.number().optional(),

  // Delivery
  deliveryTerms: z.string().max(100).optional(), // Incoterms
  shippingMethod: z.string().max(100).optional(),
  deliveryAddressLine1: z.string().max(100).optional(),
  deliveryAddressLine2: z.string().max(100).optional(),
  deliveryCity: z.string().max(50).optional(),
  deliveryState: z.string().max(50).optional(),
  deliveryPostalCode: z.string().max(20).optional(),
  deliveryCountry: z.string().length(2).optional(),

  // Payment terms
  paymentTermsCode: z.string().max(20).optional(),
  paymentTermsDays: z.number().int().min(0).optional(),

  // Status
  status: purchaseOrderStatusEnum.default('DRAFT'),
  receivedPercentage: z.number().min(0).max(100).default(0),
  invoicedPercentage: z.number().min(0).max(100).default(0),

  // Approval workflow
  approvalWorkflowId: z.string().uuid().optional(),
  approvalStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  submittedAt: z.coerce.date().optional(),
  submittedBy: z.string().uuid().optional(),
  approvedAt: z.coerce.date().optional(),
  approvedBy: z.string().uuid().optional(),
  rejectedAt: z.coerce.date().optional(),
  rejectedBy: z.string().uuid().optional(),
  rejectionReason: z.string().max(500).optional(),

  // Vendor communication
  sentToVendorAt: z.coerce.date().optional(),
  vendorAcknowledgedAt: z.coerce.date().optional(),
  vendorContactEmail: z.string().email().optional(),

  // Notes
  notes: z.string().max(2000).optional(),
  internalNotes: z.string().max(1000).optional(),

  // Attachments
  attachmentIds: z.array(z.string().uuid()).optional(),

  // Audit
  createdAt: z.coerce.date().optional(),
  createdBy: z.string().uuid().optional(),
  updatedAt: z.coerce.date().optional(),
  updatedBy: z.string().uuid().optional(),
  closedAt: z.coerce.date().optional(),
  closedBy: z.string().uuid().optional(),
  cancelledAt: z.coerce.date().optional(),
  cancelledBy: z.string().uuid().optional(),
  cancellationReason: z.string().max(500).optional(),
});

export type PurchaseOrder = z.infer<typeof purchaseOrderSchema>;

/**
 * Create Purchase Order Schema
 */
export const createPurchaseOrderSchema = purchaseOrderSchema.omit({
  id: true,
  subtotal: true,
  discountAmount: true,
  taxAmount: true,
  totalAmount: true,
  totalAmountBase: true,
  releasedAmount: true,
  remainingAmount: true,
  receivedPercentage: true,
  invoicedPercentage: true,
  approvalStatus: true,
  submittedAt: true,
  submittedBy: true,
  approvedAt: true,
  approvedBy: true,
  rejectedAt: true,
  rejectedBy: true,
  rejectionReason: true,
  sentToVendorAt: true,
  vendorAcknowledgedAt: true,
  createdAt: true,
  createdBy: true,
  updatedAt: true,
  updatedBy: true,
  closedAt: true,
  closedBy: true,
  cancelledAt: true,
  cancelledBy: true,
  cancellationReason: true,
});

export type CreatePurchaseOrder = z.infer<typeof createPurchaseOrderSchema>;

/**
 * Update Purchase Order Schema
 */
export const updatePurchaseOrderSchema = createPurchaseOrderSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdatePurchaseOrder = z.infer<typeof updatePurchaseOrderSchema>;

/**
 * Purchase Order Output Schema
 */
export const purchaseOrderOutputSchema = purchaseOrderSchema.extend({
  lines: z.array(purchaseOrderLineSchema).optional(),
  goodsReceiptsCount: z.number().int().optional(),
  invoicesCount: z.number().int().optional(),
});

export type PurchaseOrderOutput = z.infer<typeof purchaseOrderOutputSchema>;

/**
 * Submit PO for Approval Schema
 */
export const submitPoForApprovalSchema = z.object({
  id: z.string().uuid(),
  notes: z.string().max(500).optional(),
});

export type SubmitPoForApproval = z.infer<typeof submitPoForApprovalSchema>;

/**
 * Approve PO Schema
 */
export const approvePoSchema = z.object({
  id: z.string().uuid(),
  comments: z.string().max(500).optional(),
});

export type ApprovePo = z.infer<typeof approvePoSchema>;

/**
 * Reject PO Schema
 */
export const rejectPoSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1).max(500),
});

export type RejectPo = z.infer<typeof rejectPoSchema>;

/**
 * Send PO to Vendor Schema
 */
export const sendPoToVendorSchema = z.object({
  id: z.string().uuid(),
  emailTo: z.string().email().optional(),
  emailCc: z.array(z.string().email()).optional(),
  emailSubject: z.string().max(200).optional(),
  emailBody: z.string().max(2000).optional(),
  attachPdf: z.boolean().default(true),
});

export type SendPoToVendor = z.infer<typeof sendPoToVendorSchema>;

/**
 * Close PO Schema
 */
export const closePoSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().max(500).optional(),
  forceClose: z.boolean().default(false), // Close even with outstanding items
});

export type ClosePo = z.infer<typeof closePoSchema>;

/**
 * Cancel PO Schema
 */
export const cancelPoSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1).max(500),
  notifyVendor: z.boolean().default(true),
});

export type CancelPo = z.infer<typeof cancelPoSchema>;

/**
 * Purchase Order Filter Schema
 */
export const purchaseOrderFilterSchema = z.object({
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),
  vendorId: z.string().uuid().optional(),
  poType: purchaseOrderTypeEnum.optional(),
  status: purchaseOrderStatusEnum.optional(),
  orderDateFrom: z.coerce.date().optional(),
  orderDateTo: z.coerce.date().optional(),
  amountMin: z.number().optional(),
  amountMax: z.number().optional(),
  hasOutstandingReceipts: z.boolean().optional(),
  hasOutstandingInvoices: z.boolean().optional(),
  search: z.string().max(100).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['orderDate', 'poNumber', 'totalAmount', 'createdAt']).default('orderDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PurchaseOrderFilter = z.infer<typeof purchaseOrderFilterSchema>;

/**
 * Add PO Line Schema
 */
export const addPoLineSchema = purchaseOrderLineSchema.omit({
  id: true,
  purchaseOrderId: true,
  quantityReceived: true,
  quantityInvoiced: true,
  quantityOutstanding: true,
  status: true,
  isClosed: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  purchaseOrderId: z.string().uuid(),
});

export type AddPoLine = z.infer<typeof addPoLineSchema>;

/**
 * Update PO Line Schema
 */
export const updatePoLineSchema = addPoLineSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdatePoLine = z.infer<typeof updatePoLineSchema>;
