import { z } from 'zod';
import { currencyCodeSchema } from '@/lib/schemas/shared/payment';

/**
 * Delivery Note Status Enum
 */
export const deliveryNoteStatusEnum = z.enum([
  'DRAFT',
  'CONFIRMED',         // Confirmed for shipping
  'PICKING',           // Items being picked
  'PACKED',            // Items packed
  'SHIPPED',           // Shipped
  'IN_TRANSIT',        // In transit
  'DELIVERED',         // Delivered to customer
  'PARTIALLY_DELIVERED', // Partial delivery
  'CANCELLED',
  'RETURNED',
]);

export type DeliveryNoteStatus = z.infer<typeof deliveryNoteStatusEnum>;

/**
 * Delivery Type Enum
 */
export const deliveryTypeEnum = z.enum([
  'FULL_SHIPMENT',     // Full order shipment
  'PARTIAL_SHIPMENT',  // Partial shipment
  'BACKORDER',         // Backorder shipment
  'SAMPLE',            // Sample shipment
  'REPLACEMENT',       // Replacement shipment
  'RETURN',            // Return delivery
]);

export type DeliveryType = z.infer<typeof deliveryTypeEnum>;

/**
 * Proof of Delivery Status Enum
 */
export const podStatusEnum = z.enum([
  'NOT_REQUIRED',
  'PENDING',
  'RECEIVED',
  'DISPUTED',
]);

export type PodStatus = z.infer<typeof podStatusEnum>;

/**
 * Delivery Line Status Enum
 */
export const deliveryLineStatusEnum = z.enum([
  'PENDING',
  'PICKING',
  'PICKED',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
]);

export type DeliveryLineStatus = z.infer<typeof deliveryLineStatusEnum>;

/**
 * Delivery Note Line Schema
 */
export const deliveryNoteLineSchema = z.object({
  id: z.string().uuid(),
  deliveryNoteId: z.string().uuid(),
  lineNumber: z.number().int().min(1),

  // SO reference
  salesOrderId: z.string().uuid().optional(),
  salesOrderNumber: z.string().max(50).optional(),
  salesOrderLineId: z.string().uuid().optional(),
  soLineNumber: z.number().int().optional(),

  // Item details
  itemCode: z.string().max(50).optional(),
  itemId: z.string().uuid().optional(),
  description: z.string().max(500),

  // Quantities
  quantityOrdered: z.number().min(0).optional(),
  quantityShipped: z.number().min(0),
  quantityDelivered: z.number().min(0).default(0),
  quantityReturned: z.number().min(0).default(0),
  unitOfMeasure: z.string().max(20).default('EA'),

  // Weight/Dimensions
  weightKg: z.number().min(0).optional(),
  lengthCm: z.number().min(0).optional(),
  widthCm: z.number().min(0).optional(),
  heightCm: z.number().min(0).optional(),

  // Valuation (for customs, etc.)
  unitValue: z.number().min(0).optional(),
  lineValue: z.number().optional(),
  currencyCode: currencyCodeSchema.optional(),

  // Lot/Serial
  lotNumber: z.string().max(50).optional(),
  serialNumbers: z.array(z.string().max(50)).optional(),
  expiryDate: z.coerce.date().optional(),

  // Warehouse
  warehouseCode: z.string().max(20).optional(),
  locationCode: z.string().max(50).optional(),
  binLocation: z.string().max(50).optional(),

  // Picking/Packing
  pickedAt: z.coerce.date().optional(),
  pickedBy: z.string().uuid().optional(),
  packedAt: z.coerce.date().optional(),
  packedBy: z.string().uuid().optional(),
  packageNumber: z.string().max(50).optional(),

  // Status
  status: deliveryLineStatusEnum.default('PENDING'),

  // Delivery confirmation
  deliveredQuantity: z.number().min(0).default(0),
  deliveredAt: z.coerce.date().optional(),
  deliveryNotes: z.string().max(255).optional(),

  // GL coding
  cogsAccountId: z.string().uuid().optional(),
  inventoryAccountId: z.string().uuid().optional(),

  // Notes
  notes: z.string().max(500).optional(),

  // Audit
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export type DeliveryNoteLine = z.infer<typeof deliveryNoteLineSchema>;

/**
 * Package Schema
 * Grouping of items in packages
 */
export const packageSchema = z.object({
  id: z.string().uuid(),
  deliveryNoteId: z.string().uuid(),
  packageNumber: z.string().max(50),
  packageType: z.enum(['BOX', 'PALLET', 'CRATE', 'ENVELOPE', 'TUBE', 'OTHER']).default('BOX'),

  // Dimensions
  lengthCm: z.number().min(0).optional(),
  widthCm: z.number().min(0).optional(),
  heightCm: z.number().min(0).optional(),
  grossWeightKg: z.number().min(0).optional(),
  netWeightKg: z.number().min(0).optional(),

  // Tracking
  trackingNumber: z.string().max(100).optional(),
  carrierCode: z.string().max(20).optional(),

  // Contents
  lineIds: z.array(z.string().uuid()).optional(),
  contentDescription: z.string().max(255).optional(),
  itemCount: z.number().int().min(0).optional(),

  // Special handling
  fragile: z.boolean().default(false),
  hazardous: z.boolean().default(false),
  temperatureControlled: z.boolean().default(false),

  // Insurance
  declaredValue: z.number().min(0).optional(),
  insured: z.boolean().default(false),

  // Audit
  packedAt: z.coerce.date().optional(),
  packedBy: z.string().uuid().optional(),
});

export type Package = z.infer<typeof packageSchema>;

/**
 * Delivery Note Schema
 */
export const deliveryNoteSchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),

  // Identification
  dnNumber: z.string().max(50), // Delivery note number
  deliveryType: deliveryTypeEnum.default('FULL_SHIPMENT'),
  externalRef: z.string().max(100).optional(),

  // SO reference
  salesOrderId: z.string().uuid().optional(),
  salesOrderNumber: z.string().max(50).optional(),

  // Customer
  customerId: z.string().uuid(),
  customerCode: z.string().max(20).optional(),
  customerName: z.string().max(100).optional(),

  // Contact
  contactName: z.string().max(100).optional(),
  contactPhone: z.string().max(20).optional(),
  contactEmail: z.string().email().optional(),

  // Dates
  deliveryDate: z.coerce.date(), // Planned/requested delivery date
  shipDate: z.coerce.date().optional(), // Actual ship date
  actualDeliveryDate: z.coerce.date().optional(),

  // Ship from
  shipFromWarehouse: z.string().max(20).optional(),
  shipFromAddressLine1: z.string().max(100).optional(),
  shipFromAddressLine2: z.string().max(100).optional(),
  shipFromCity: z.string().max(50).optional(),
  shipFromState: z.string().max(50).optional(),
  shipFromPostalCode: z.string().max(20).optional(),
  shipFromCountry: z.string().length(2).optional(),

  // Ship to
  shipToName: z.string().max(100),
  shipToAddressLine1: z.string().max(100),
  shipToAddressLine2: z.string().max(100).optional(),
  shipToCity: z.string().max(50),
  shipToState: z.string().max(50).optional(),
  shipToPostalCode: z.string().max(20),
  shipToCountry: z.string().length(2),

  // Shipping details
  shippingMethod: z.string().max(100).optional(),
  carrierCode: z.string().max(20).optional(),
  carrierName: z.string().max(100).optional(),
  trackingNumber: z.string().max(100).optional(),
  trackingUrl: z.string().url().optional(),
  serviceLevel: z.string().max(50).optional(), // Express, Standard, etc.
  shippingTerms: z.string().max(100).optional(), // Incoterms

  // Weight & Packages
  totalPackages: z.number().int().min(0).default(0),
  totalWeightKg: z.number().min(0).optional(),
  totalVolumeCbm: z.number().min(0).optional(),

  // Value (for customs/insurance)
  totalValue: z.number().min(0).optional(),
  currencyCode: currencyCodeSchema.optional(),
  insuranceValue: z.number().min(0).optional(),

  // Customs
  customsDeclarationNumber: z.string().max(50).optional(),
  exportLicense: z.string().max(50).optional(),
  harmonizedCode: z.string().max(20).optional(),
  countryOfOrigin: z.string().length(2).optional(),

  // Status
  status: deliveryNoteStatusEnum.default('DRAFT'),

  // Invoice matching
  invoiceId: z.string().uuid().optional(),
  invoiceNumber: z.string().max(50).optional(),
  isInvoiced: z.boolean().default(false),

  // Proof of Delivery
  podStatus: podStatusEnum.default('PENDING'),
  podReceivedAt: z.coerce.date().optional(),
  podReceiverName: z.string().max(100).optional(),
  podReceiverSignature: z.string().uuid().optional(), // Signature file
  podNotes: z.string().max(500).optional(),
  podAttachmentIds: z.array(z.string().uuid()).optional(),

  // Special handling
  specialInstructions: z.string().max(1000).optional(),
  fragileItems: z.boolean().default(false),
  hazardousGoods: z.boolean().default(false),
  temperatureControlled: z.boolean().default(false),
  temperatureRequirements: z.string().max(100).optional(),

  // GL posting
  journalEntryId: z.string().uuid().optional(),
  cogsPosted: z.boolean().default(false),

  // Notes
  notes: z.string().max(2000).optional(),
  internalNotes: z.string().max(1000).optional(),
  driverNotes: z.string().max(500).optional(),

  // Attachments
  attachmentIds: z.array(z.string().uuid()).optional(),

  // Audit
  createdAt: z.coerce.date().optional(),
  createdBy: z.string().uuid().optional(),
  updatedAt: z.coerce.date().optional(),
  updatedBy: z.string().uuid().optional(),
  confirmedAt: z.coerce.date().optional(),
  confirmedBy: z.string().uuid().optional(),
  shippedAt: z.coerce.date().optional(),
  shippedBy: z.string().uuid().optional(),
  deliveredAt: z.coerce.date().optional(),
  cancelledAt: z.coerce.date().optional(),
  cancelledBy: z.string().uuid().optional(),
  cancellationReason: z.string().max(500).optional(),
});

export type DeliveryNote = z.infer<typeof deliveryNoteSchema>;

/**
 * Create Delivery Note Schema
 */
export const createDeliveryNoteSchema = deliveryNoteSchema.omit({
  id: true,
  totalPackages: true,
  isInvoiced: true,
  podStatus: true,
  podReceivedAt: true,
  podReceiverName: true,
  podReceiverSignature: true,
  journalEntryId: true,
  cogsPosted: true,
  createdAt: true,
  createdBy: true,
  updatedAt: true,
  updatedBy: true,
  confirmedAt: true,
  confirmedBy: true,
  shippedAt: true,
  shippedBy: true,
  deliveredAt: true,
  cancelledAt: true,
  cancelledBy: true,
  cancellationReason: true,
});

export type CreateDeliveryNote = z.infer<typeof createDeliveryNoteSchema>;

/**
 * Update Delivery Note Schema
 */
export const updateDeliveryNoteSchema = createDeliveryNoteSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateDeliveryNote = z.infer<typeof updateDeliveryNoteSchema>;

/**
 * Delivery Note Output Schema
 */
export const deliveryNoteOutputSchema = deliveryNoteSchema.extend({
  lines: z.array(deliveryNoteLineSchema).optional(),
  packages: z.array(packageSchema).optional(),
  salesOrder: z.object({
    soNumber: z.string(),
    orderDate: z.coerce.date(),
    totalAmount: z.number(),
  }).optional(),
});

export type DeliveryNoteOutput = z.infer<typeof deliveryNoteOutputSchema>;

/**
 * Create DN from SO Schema
 */
export const createDnFromSoSchema = z.object({
  salesOrderId: z.string().uuid(),
  deliveryDate: z.coerce.date(),
  shipFromWarehouse: z.string().max(20).optional(),
  shippingMethod: z.string().max(100).optional(),
  carrierCode: z.string().max(20).optional(),
  specialInstructions: z.string().max(1000).optional(),
  lines: z.array(z.object({
    soLineId: z.string().uuid(),
    quantityToShip: z.number().positive(),
    lotNumber: z.string().max(50).optional(),
    serialNumbers: z.array(z.string().max(50)).optional(),
    warehouseCode: z.string().max(20).optional(),
    binLocation: z.string().max(50).optional(),
    notes: z.string().max(255).optional(),
  })).min(1),
});

export type CreateDnFromSo = z.infer<typeof createDnFromSoSchema>;

/**
 * Confirm Delivery Note Schema
 */
export const confirmDeliveryNoteSchema = z.object({
  id: z.string().uuid(),
  notes: z.string().max(500).optional(),
});

export type ConfirmDeliveryNote = z.infer<typeof confirmDeliveryNoteSchema>;

/**
 * Ship Delivery Note Schema
 */
export const shipDeliveryNoteSchema = z.object({
  id: z.string().uuid(),
  shipDate: z.coerce.date().optional(),
  trackingNumber: z.string().max(100).optional(),
  carrierCode: z.string().max(20).optional(),
  carrierName: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
});

export type ShipDeliveryNote = z.infer<typeof shipDeliveryNoteSchema>;

/**
 * Confirm Delivery Schema
 */
export const confirmDeliverySchema = z.object({
  id: z.string().uuid(),
  actualDeliveryDate: z.coerce.date(),
  receiverName: z.string().max(100).optional(),
  signatureFileId: z.string().uuid().optional(),
  deliveryNotes: z.string().max(500).optional(),
  lines: z.array(z.object({
    lineId: z.string().uuid(),
    quantityDelivered: z.number().min(0),
    quantityReturned: z.number().min(0).default(0),
    notes: z.string().max(255).optional(),
  })).optional(), // If partial delivery
});

export type ConfirmDelivery = z.infer<typeof confirmDeliverySchema>;

/**
 * Record POD Schema
 */
export const recordPodSchema = z.object({
  id: z.string().uuid(),
  receiverName: z.string().min(1).max(100),
  signatureFileId: z.string().uuid().optional(),
  podDate: z.coerce.date(),
  notes: z.string().max(500).optional(),
  attachmentIds: z.array(z.string().uuid()).optional(),
});

export type RecordPod = z.infer<typeof recordPodSchema>;

/**
 * Cancel Delivery Note Schema
 */
export const cancelDeliveryNoteSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1).max(500),
  reopenSoLines: z.boolean().default(true), // Reopen SO lines for re-shipping
});

export type CancelDeliveryNote = z.infer<typeof cancelDeliveryNoteSchema>;

/**
 * Add DN Line Schema
 */
export const addDnLineSchema = deliveryNoteLineSchema.omit({
  id: true,
  deliveryNoteId: true,
  quantityDelivered: true,
  quantityReturned: true,
  pickedAt: true,
  pickedBy: true,
  packedAt: true,
  packedBy: true,
  status: true,
  deliveredQuantity: true,
  deliveredAt: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  deliveryNoteId: z.string().uuid(),
});

export type AddDnLine = z.infer<typeof addDnLineSchema>;

/**
 * Update DN Line Schema
 */
export const updateDnLineSchema = addDnLineSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateDnLine = z.infer<typeof updateDnLineSchema>;

/**
 * Delivery Note Filter Schema
 */
export const deliveryNoteFilterSchema = z.object({
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  salesOrderId: z.string().uuid().optional(),
  deliveryType: deliveryTypeEnum.optional(),
  status: deliveryNoteStatusEnum.optional(),
  deliveryDateFrom: z.coerce.date().optional(),
  deliveryDateTo: z.coerce.date().optional(),
  shipFromWarehouse: z.string().max(20).optional(),
  carrierCode: z.string().max(20).optional(),
  isInvoiced: z.boolean().optional(),
  podStatus: podStatusEnum.optional(),
  search: z.string().max(100).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['deliveryDate', 'dnNumber', 'createdAt', 'status']).default('deliveryDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type DeliveryNoteFilter = z.infer<typeof deliveryNoteFilterSchema>;

/**
 * Delivery Summary Schema
 */
export const deliverySummarySchema = z.object({
  period: z.object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  }),
  totalDeliveries: z.number().int(),
  byStatus: z.record(deliveryNoteStatusEnum, z.object({
    count: z.number().int(),
  })),
  onTimeDeliveryRate: z.number().min(0).max(100).optional(),
  averageDeliveryDays: z.number().optional(),
  pendingPod: z.number().int(),
  uninvoiced: z.number().int(),
});

export type DeliverySummary = z.infer<typeof deliverySummarySchema>;
