import { z } from 'zod';
import { currencyCodeSchema } from '@/lib/schemas/shared/payment';

/**
 * Sales Order Status Enum
 */
export const salesOrderStatusEnum = z.enum([
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'CONFIRMED',         // Confirmed with customer
  'PROCESSING',        // Being processed
  'PARTIALLY_SHIPPED', // Some items shipped
  'FULLY_SHIPPED',     // All items shipped
  'PARTIALLY_INVOICED',
  'FULLY_INVOICED',
  'COMPLETED',
  'CANCELLED',
  'ON_HOLD',
]);

export type SalesOrderStatus = z.infer<typeof salesOrderStatusEnum>;

/**
 * Sales Order Type Enum
 */
export const salesOrderTypeEnum = z.enum([
  'STANDARD',          // Standard sales order
  'QUOTE',             // Quotation
  'BLANKET',           // Blanket/Framework order
  'SUBSCRIPTION',      // Subscription order
  'RETURNS',           // Return order (RMA)
  'SERVICE',           // Service order
]);

export type SalesOrderType = z.infer<typeof salesOrderTypeEnum>;

/**
 * SO Line Status Enum
 */
export const soLineStatusEnum = z.enum([
  'OPEN',
  'PARTIALLY_SHIPPED',
  'FULLY_SHIPPED',
  'INVOICED',
  'CLOSED',
  'CANCELLED',
  'BACKORDERED',
]);

export type SoLineStatus = z.infer<typeof soLineStatusEnum>;

/**
 * Sales Order Line Schema
 */
export const salesOrderLineSchema = z.object({
  id: z.string().uuid(),
  salesOrderId: z.string().uuid(),
  lineNumber: z.number().int().min(1),

  // Item details
  itemCode: z.string().max(50).optional(),
  itemId: z.string().uuid().optional(),
  description: z.string().max(500),

  // Quantities
  quantity: z.number().positive(),
  unitOfMeasure: z.string().max(20).default('EA'),
  quantityShipped: z.number().min(0).default(0),
  quantityInvoiced: z.number().min(0).default(0),
  quantityBackordered: z.number().min(0).default(0),
  quantityOutstanding: z.number().min(0).optional(),

  // Pricing
  unitPrice: z.number().min(0),
  discount: z.number().min(0).max(100).default(0),
  discountAmount: z.number().default(0),
  lineAmount: z.number(),
  taxCode: z.string().max(20).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  taxAmount: z.number().default(0),
  lineTotalAmount: z.number(),

  // Delivery
  requestedShipDate: z.coerce.date().optional(),
  promisedShipDate: z.coerce.date().optional(),
  actualShipDate: z.coerce.date().optional(),

  // Warehouse
  warehouseCode: z.string().max(20).optional(),
  locationCode: z.string().max(50).optional(),

  // GL coding
  revenueAccountId: z.string().uuid().optional(),
  costCenterId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),

  // Status
  status: soLineStatusEnum.default('OPEN'),
  isClosed: z.boolean().default(false),

  // Notes
  notes: z.string().max(500).optional(),

  // Audit
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type SalesOrderLine = z.infer<typeof salesOrderLineSchema>;

/**
 * Sales Order Schema
 */
export const salesOrderSchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),

  // Identification
  soNumber: z.string().max(50),
  orderType: salesOrderTypeEnum.default('STANDARD'),
  externalRef: z.string().max(100).optional(),
  customerPO: z.string().max(50).optional(), // Customer PO number
  quoteNumber: z.string().max(50).optional(), // Original quote

  // Customer
  customerId: z.string().uuid(),
  customerCode: z.string().max(20).optional(),
  customerName: z.string().max(100).optional(),

  // Contact
  contactName: z.string().max(100).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(20).optional(),

  // Dates
  orderDate: z.coerce.date(),
  requestedShipDate: z.coerce.date().optional(),
  promisedShipDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(), // For quotes

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

  // Shipping
  shippingMethod: z.string().max(100).optional(),
  shippingTerms: z.string().max(100).optional(), // Incoterms
  carrierCode: z.string().max(20).optional(),
  trackingNumber: z.string().max(100).optional(),
  shipFromWarehouse: z.string().max(20).optional(),

  // Shipping address
  shipToName: z.string().max(100).optional(),
  shipToAddressLine1: z.string().max(100).optional(),
  shipToAddressLine2: z.string().max(100).optional(),
  shipToCity: z.string().max(50).optional(),
  shipToState: z.string().max(50).optional(),
  shipToPostalCode: z.string().max(20).optional(),
  shipToCountry: z.string().length(2).optional(),

  // Billing address
  billToName: z.string().max(100).optional(),
  billToAddressLine1: z.string().max(100).optional(),
  billToAddressLine2: z.string().max(100).optional(),
  billToCity: z.string().max(50).optional(),
  billToState: z.string().max(50).optional(),
  billToPostalCode: z.string().max(20).optional(),
  billToCountry: z.string().length(2).optional(),

  // Payment
  paymentTermsCode: z.string().max(20).optional(),
  paymentTermsDays: z.number().int().min(0).optional(),
  paymentMethodCode: z.string().max(20).optional(),

  // Status & Progress
  status: salesOrderStatusEnum.default('DRAFT'),
  shippedPercentage: z.number().min(0).max(100).default(0),
  invoicedPercentage: z.number().min(0).max(100).default(0),

  // Approval
  approvalWorkflowId: z.string().uuid().optional(),
  submittedAt: z.coerce.date().optional(),
  submittedBy: z.string().uuid().optional(),
  approvedAt: z.coerce.date().optional(),
  approvedBy: z.string().uuid().optional(),
  rejectedAt: z.coerce.date().optional(),
  rejectedBy: z.string().uuid().optional(),
  rejectionReason: z.string().max(500).optional(),

  // Customer confirmation
  confirmedAt: z.coerce.date().optional(),
  confirmedBy: z.string().uuid().optional(),
  customerConfirmationRef: z.string().max(100).optional(),

  // Notes
  notes: z.string().max(2000).optional(),
  internalNotes: z.string().max(1000).optional(),
  customerNotes: z.string().max(1000).optional(), // Notes for customer

  // Attachments
  attachmentIds: z.array(z.string().uuid()).optional(),

  // Sales rep
  salesRepId: z.string().uuid().optional(),
  salesRepName: z.string().max(100).optional(),
  commissionRate: z.number().min(0).max(100).optional(),

  // Audit
  createdAt: z.coerce.date().optional(),
  createdBy: z.string().uuid().optional(),
  updatedAt: z.coerce.date().optional(),
  updatedBy: z.string().uuid().optional(),
  completedAt: z.coerce.date().optional(),
  completedBy: z.string().uuid().optional(),
  cancelledAt: z.coerce.date().optional(),
  cancelledBy: z.string().uuid().optional(),
  cancellationReason: z.string().max(500).optional(),
});

export type SalesOrder = z.infer<typeof salesOrderSchema>;

/**
 * Create Sales Order Schema
 */
export const createSalesOrderSchema = salesOrderSchema.omit({
  id: true,
  subtotal: true,
  discountAmount: true,
  taxAmount: true,
  totalAmount: true,
  totalAmountBase: true,
  shippedPercentage: true,
  invoicedPercentage: true,
  submittedAt: true,
  submittedBy: true,
  approvedAt: true,
  approvedBy: true,
  rejectedAt: true,
  rejectedBy: true,
  rejectionReason: true,
  confirmedAt: true,
  confirmedBy: true,
  createdAt: true,
  createdBy: true,
  updatedAt: true,
  updatedBy: true,
  completedAt: true,
  completedBy: true,
  cancelledAt: true,
  cancelledBy: true,
  cancellationReason: true,
});

export type CreateSalesOrder = z.infer<typeof createSalesOrderSchema>;

/**
 * Update Sales Order Schema
 */
export const updateSalesOrderSchema = createSalesOrderSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateSalesOrder = z.infer<typeof updateSalesOrderSchema>;

/**
 * Sales Order Output Schema
 */
export const salesOrderOutputSchema = salesOrderSchema.extend({
  lines: z.array(salesOrderLineSchema).optional(),
  deliveryNotesCount: z.number().int().optional(),
  invoicesCount: z.number().int().optional(),
});

export type SalesOrderOutput = z.infer<typeof salesOrderOutputSchema>;

/**
 * Submit SO for Approval Schema
 */
export const submitSoForApprovalSchema = z.object({
  id: z.string().uuid(),
  notes: z.string().max(500).optional(),
});

export type SubmitSoForApproval = z.infer<typeof submitSoForApprovalSchema>;

/**
 * Approve SO Schema
 */
export const approveSoSchema = z.object({
  id: z.string().uuid(),
  comments: z.string().max(500).optional(),
});

export type ApproveSo = z.infer<typeof approveSoSchema>;

/**
 * Reject SO Schema
 */
export const rejectSoSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1).max(500),
});

export type RejectSo = z.infer<typeof rejectSoSchema>;

/**
 * Confirm SO Schema
 */
export const confirmSoSchema = z.object({
  id: z.string().uuid(),
  customerConfirmationRef: z.string().max(100).optional(),
  confirmedShipDate: z.coerce.date().optional(),
  notes: z.string().max(500).optional(),
});

export type ConfirmSo = z.infer<typeof confirmSoSchema>;

/**
 * Convert Quote to SO Schema
 */
export const convertQuoteToSoSchema = z.object({
  quoteId: z.string().uuid(),
  customerPO: z.string().max(50).optional(),
  orderDate: z.coerce.date().optional(),
  adjustPrices: z.boolean().default(false), // Re-price items
});

export type ConvertQuoteToSo = z.infer<typeof convertQuoteToSoSchema>;

/**
 * Cancel SO Schema
 */
export const cancelSoSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1).max(500),
  notifyCustomer: z.boolean().default(true),
});

export type CancelSo = z.infer<typeof cancelSoSchema>;

/**
 * Close SO Schema
 */
export const closeSoSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().max(500).optional(),
  forceClose: z.boolean().default(false),
});

export type CloseSo = z.infer<typeof closeSoSchema>;

/**
 * Add SO Line Schema
 */
export const addSoLineSchema = salesOrderLineSchema.omit({
  id: true,
  salesOrderId: true,
  quantityShipped: true,
  quantityInvoiced: true,
  quantityBackordered: true,
  quantityOutstanding: true,
  actualShipDate: true,
  status: true,
  isClosed: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  salesOrderId: z.string().uuid(),
});

export type AddSoLine = z.infer<typeof addSoLineSchema>;

/**
 * Update SO Line Schema
 */
export const updateSoLineSchema = addSoLineSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateSoLine = z.infer<typeof updateSoLineSchema>;

/**
 * Sales Order Filter Schema
 */
export const salesOrderFilterSchema = z.object({
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  orderType: salesOrderTypeEnum.optional(),
  status: salesOrderStatusEnum.optional(),
  orderDateFrom: z.coerce.date().optional(),
  orderDateTo: z.coerce.date().optional(),
  amountMin: z.number().optional(),
  amountMax: z.number().optional(),
  salesRepId: z.string().uuid().optional(),
  hasUnshippedItems: z.boolean().optional(),
  hasUninvoicedItems: z.boolean().optional(),
  search: z.string().max(100).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['orderDate', 'soNumber', 'totalAmount', 'createdAt']).default('orderDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type SalesOrderFilter = z.infer<typeof salesOrderFilterSchema>;
