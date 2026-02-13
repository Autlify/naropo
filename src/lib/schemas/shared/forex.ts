import { z } from 'zod';
import { currencyCodeSchema } from './payment';

/**
 * Exchange Rate Source Enum
 * Identifies where exchange rates are obtained from
 */
export const exchangeRateSourceEnum = z.enum([
  'MANUAL',           // User-entered rate
  'ECB',              // European Central Bank
  'FEDRESERVE',       // Federal Reserve
  'REUTERS',          // Reuters/Refinitiv
  'BLOOMBERG',        // Bloomberg
  'OANDA',            // OANDA API
  'OPENEXCHANGE',     // OpenExchangeRates API
  'BANK',             // Bank-provided rate
  'CONTRACT',         // Contractual/agreed rate
  'AVERAGE',          // Period average
  'SPOT',             // Spot rate
  'FORWARD',          // Forward rate
]);

export type ExchangeRateSource = z.infer<typeof exchangeRateSourceEnum>;

/**
 * Exchange Rate Type Enum
 * Different rate types for different purposes
 */
export const exchangeRateTypeEnum = z.enum([
  'SPOT',             // Current market rate
  'AVERAGE',          // Average rate over period
  'CLOSING',          // End-of-day/period rate
  'HISTORICAL',       // Rate at transaction date
  'BUDGET',           // Budgeted rate
  'CONTRACT',         // Contractually agreed rate
  'REVALUATION',      // Rate for revaluation
]);

export type ExchangeRateType = z.infer<typeof exchangeRateTypeEnum>;

/**
 * FX Revaluation Method Enum
 * Methods for calculating unrealized forex gains/losses
 */
export const fxRevaluationMethodEnum = z.enum([
  'BALANCE_SHEET',    // Revalue balance sheet items only
  'OPEN_ITEM',        // Revalue open items individually
  'AVERAGE_RATE',     // Use average rate for period
  'CLOSING_RATE',     // Use period-end closing rate
]);

export type FxRevaluationMethod = z.infer<typeof fxRevaluationMethodEnum>;

/**
 * FX Gain/Loss Status Enum
 */
export const fxGainLossStatusEnum = z.enum([
  'UNREALIZED',       // Not yet realized (revaluation)
  'REALIZED',         // Realized on settlement
  'REVERSED',         // Reversed on period close
]);

export type FxGainLossStatus = z.infer<typeof fxGainLossStatusEnum>;

/**
 * Exchange Rate Schema
 * Stores exchange rates between currency pairs
 */
export const exchangeRateSchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),

  // Currency pair
  fromCurrency: currencyCodeSchema,
  toCurrency: currencyCodeSchema,

  // Rate details
  rate: z.number()
    .positive('Rate must be positive')
    .refine(val => val > 0.0000001 && val < 100000000, {
      message: 'Rate must be within reasonable bounds',
    }),
  inverseRate: z.number().positive().optional(), // Auto-calculated: 1/rate

  // Validity
  effectiveDate: z.coerce.date(),
  expirationDate: z.coerce.date().optional(),

  // Source and type
  rateType: exchangeRateTypeEnum.default('SPOT'),
  source: exchangeRateSourceEnum.default('MANUAL'),
  sourceRef: z.string().max(100).optional(), // External reference

  // Spread/markup
  spreadPercent: z.number().min(0).max(100).optional(),
  buyRate: z.number().positive().optional(), // Rate for buying base currency
  sellRate: z.number().positive().optional(), // Rate for selling base currency

  // Metadata
  isActive: z.boolean().default(true),
  createdAt: z.coerce.date().optional(),
  createdBy: z.string().uuid().optional(),
  updatedAt: z.coerce.date().optional(),
  updatedBy: z.string().uuid().optional(),
});

export type ExchangeRate = z.infer<typeof exchangeRateSchema>;

/**
 * Exchange Rate Create Schema
 */
export const createExchangeRateSchema = exchangeRateSchema.omit({
  id: true,
  inverseRate: true,
  createdAt: true,
  createdBy: true,
  updatedAt: true,
  updatedBy: true,
});

/**
 * Exchange Rate Update Schema
 */
export const updateExchangeRateSchema = createExchangeRateSchema.partial().extend({
  id: z.string().uuid(),
});

/**
 * Currency Amount with Exchange Schema
 * Used in transactions with multi-currency support
 */
export const currencyAmountSchema = z.object({
  // Transaction currency
  currencyCode: currencyCodeSchema,
  amount: z.number(), // Amount in transaction currency

  // Base/functional currency
  baseCurrencyCode: currencyCodeSchema.optional(),
  amountBase: z.number().optional(), // Amount in base currency

  // Exchange rate details
  exchangeRate: z.number().positive().optional(),
  exchangeRateDate: z.coerce.date().optional(),
  exchangeRateType: exchangeRateTypeEnum.optional(),
  exchangeRateId: z.string().uuid().optional(), // Link to rate table
});

export type CurrencyAmount = z.infer<typeof currencyAmountSchema>;

/**
 * FX Revaluation Entry Schema
 * Records forex revaluation adjustments
 */
export const fxRevaluationEntrySchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),

  // Revaluation batch reference
  revaluationBatchId: z.string().uuid().optional(),

  // What's being revalued
  accountId: z.string().uuid().optional(),
  openItemId: z.string().uuid().optional(),
  documentType: z.string().max(50).optional(),
  documentId: z.string().uuid().optional(),

  // Currency
  currencyCode: currencyCodeSchema,
  baseCurrencyCode: currencyCodeSchema,

  // Original values
  originalAmount: z.number(),
  originalAmountBase: z.number(),
  originalRate: z.number().positive(),

  // Revaluation values
  revaluationDate: z.coerce.date(),
  revaluationRate: z.number().positive(),
  revaluatedAmountBase: z.number(),

  // Gain/Loss
  gainLossAmount: z.number(), // Can be negative (loss)
  gainLossStatus: fxGainLossStatusEnum.default('UNREALIZED'),

  // GL posting reference
  journalEntryId: z.string().uuid().optional(),

  // Metadata
  createdAt: z.coerce.date().optional(),
  createdBy: z.string().uuid().optional(),
  reversedAt: z.coerce.date().optional(),
  reversedBy: z.string().uuid().optional(),
});

export type FxRevaluationEntry = z.infer<typeof fxRevaluationEntrySchema>;

/**
 * FX Revaluation Batch Schema
 * Groups revaluation entries by period/run
 */
export const fxRevaluationBatchSchema = z.object({
  id: z.string().uuid(),
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),

  // Batch details
  batchNumber: z.string().max(50),
  description: z.string().max(255).optional(),

  // Period & method
  revaluationDate: z.coerce.date(),
  periodId: z.string().uuid().optional(),
  method: fxRevaluationMethodEnum.default('CLOSING_RATE'),

  // Scope
  currencyCodes: z.array(currencyCodeSchema).optional(), // Which currencies to revalue
  accountIds: z.array(z.string().uuid()).optional(), // Which accounts (empty = all)

  // Totals
  totalGainAmount: z.number().default(0),
  totalLossAmount: z.number().default(0),
  netGainLossAmount: z.number().default(0),
  entryCount: z.number().int().min(0).default(0),

  // Status
  status: z.enum(['DRAFT', 'POSTED', 'REVERSED']).default('DRAFT'),

  // GL posting
  journalEntryId: z.string().uuid().optional(),
  gainAccountId: z.string().uuid().optional(), // FX gain account
  lossAccountId: z.string().uuid().optional(), // FX loss account

  // Metadata
  createdAt: z.coerce.date().optional(),
  createdBy: z.string().uuid().optional(),
  postedAt: z.coerce.date().optional(),
  postedBy: z.string().uuid().optional(),
  reversedAt: z.coerce.date().optional(),
  reversedBy: z.string().uuid().optional(),
});

export type FxRevaluationBatch = z.infer<typeof fxRevaluationBatchSchema>;

/**
 * Create FX Revaluation Batch Schema
 */
export const createFxRevaluationBatchSchema = fxRevaluationBatchSchema.omit({
  id: true,
  totalGainAmount: true,
  totalLossAmount: true,
  netGainLossAmount: true,
  entryCount: true,
  journalEntryId: true,
  createdAt: true,
  createdBy: true,
  postedAt: true,
  postedBy: true,
  reversedAt: true,
  reversedBy: true,
});

/**
 * FX Revaluation Run Action Schema
 */
export const runFxRevaluationSchema = z.object({
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),
  revaluationDate: z.coerce.date(),
  method: fxRevaluationMethodEnum.default('CLOSING_RATE'),
  currencyCodes: z.array(currencyCodeSchema).optional(),
  accountIds: z.array(z.string().uuid()).optional(),
  preview: z.boolean().default(true), // Preview before posting
  description: z.string().max(255).optional(),
});

export type RunFxRevaluation = z.infer<typeof runFxRevaluationSchema>;

/**
 * Exchange Difference Schema
 * Records realized exchange differences on settlement
 */
export const exchangeDifferenceSchema = z.object({
  originalAmount: z.number(),
  originalRate: z.number().positive(),
  originalAmountBase: z.number(),
  settlementAmount: z.number(),
  settlementRate: z.number().positive(),
  settlementAmountBase: z.number(),
  exchangeDifference: z.number(), // Can be negative (loss)
  currencyCode: currencyCodeSchema,
  baseCurrencyCode: currencyCodeSchema,
});

export type ExchangeDifference = z.infer<typeof exchangeDifferenceSchema>;

/**
 * Currency Conversion Request Schema
 * For real-time currency conversion
 */
export const currencyConversionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  fromCurrency: currencyCodeSchema,
  toCurrency: currencyCodeSchema,
  date: z.coerce.date().optional(), // Historical rate date
  rateType: exchangeRateTypeEnum.optional(),
});

export type CurrencyConversion = z.infer<typeof currencyConversionSchema>;

/**
 * Exchange Rate Filter Schema
 */
export const exchangeRateFilterSchema = z.object({
  agencyId: z.string().uuid(),
  subAccountId: z.string().uuid().optional(),
  fromCurrency: currencyCodeSchema.optional(),
  toCurrency: currencyCodeSchema.optional(),
  effectiveDateFrom: z.coerce.date().optional(),
  effectiveDateTo: z.coerce.date().optional(),
  rateType: exchangeRateTypeEnum.optional(),
  source: exchangeRateSourceEnum.optional(),
  isActive: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type ExchangeRateFilter = z.infer<typeof exchangeRateFilterSchema>;
