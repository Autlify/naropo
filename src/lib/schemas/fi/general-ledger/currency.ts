
import { z } from 'zod';

export const createCurrencySchema = z.object({
  code: z.string().length(3).toUpperCase(),
  name: z.string().min(1).max(100),
  symbol: z.string().min(1).max(5),
  decimalPlaces: z.number().int().min(0).max(18).default(2),
  isActive: z.boolean().default(true),
});

export const createExchangeRateSchema = z.object({
  fromCurrencyCode: z.string().length(3),
  toCurrencyCode: z.string().length(3),
  rate: z.number().positive(),
  effectiveDate: z.coerce.date(),
  expiryDate: z.coerce.date().optional(),
  rateType: z.enum(['SPOT', 'AVERAGE', 'BUDGET']).default('SPOT'),
  source: z.string().max(100).optional(),
}).refine(
  (data) => data.fromCurrencyCode !== data.toCurrencyCode,
  { message: 'From and To currencies must be different' }
);

export const currencyRevaluationSchema = z.object({
  periodId: z.string().uuid(),
  currencyCode: z.string().length(3),
  revaluationDate: z.coerce.date(),
  exchangeRate: z.number().positive(),
  gainLossAccountId: z.string().uuid(),
  notes: z.string().max(500).optional(),
});

export const convertAmountSchema = z.object({
  amount: z.number(),
  fromCurrencyCode: z.string().length(3),
  toCurrencyCode: z.string().length(3),
  effectiveDate: z.coerce.date().optional(),
  rateType: z.enum(['SPOT', 'AVERAGE', 'BUDGET']).default('SPOT'),
});

export const updateCurrencySchema = createCurrencySchema.partial();

export type CreateCurrencyInput = z.infer<typeof createCurrencySchema>;
export type UpdateCurrencyInput = z.infer<typeof updateCurrencySchema>;
export type CreateExchangeRateInput = z.infer<typeof createExchangeRateSchema>;
export type CurrencyRevaluationInput = z.infer<typeof currencyRevaluationSchema>;
export type ConvertAmountInput = z.infer<typeof convertAmountSchema>;