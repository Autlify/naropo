
import { z } from 'zod';

//  id String @id @default(uuid())

//   // Multi-tenant scope (can be Agency or SubAccount level)
//   agencyId     String?
//   subAccountId String?
//   Agency       Agency?     @relation(fields: [agencyId], references: [id], onDelete: Cascade)
//   SubAccount   SubAccount? @relation(fields: [subAccountId], references: [id], onDelete: Cascade)

//   // Period identification
//   name         String // "January 2026", "Q1 FY2026"
//   shortName    String? // "Jan-26", "Q1-26"
//   periodType   PeriodType
//   fiscalYear   Int
//   fiscalPeriod Int // 1-12 for months, 1-4 for quarters

//   // Date range
//   startDate DateTime
//   endDate   DateTime

//   // Status workflow
//   status PeriodStatus @default(FUTURE)

//   // Workflow metadata
//   openedAt DateTime?
//   openedBy String?
//   closedAt DateTime?
//   closedBy String?
//   lockedAt DateTime?
//   lockedBy String?

//   // Balance snapshots (JSON for efficiency)
//   openingBalances Json?
//   closingBalances Json?

//   // Year-end
//   isYearEnd          Boolean   @default(false)
//   yearEndProcessedAt DateTime?
//   yearEndProcessedBy String?

//   // Notes
//   notes String? @db.Text

//   // Audit
//   createdAt DateTime @default(now())
//   createdBy String
//   updatedAt DateTime @updatedAt
//   updatedBy String?

export const financialPeriodSchema = z.object({
  name: z.string().min(1).max(100),
  shortName: z.string().max(20).optional(),
  periodType: z.enum([
    'MONTH',
    'QUARTER',
    'HALF_YEAR',
    'YEAR',
    'CUSTOM',
  ]),
  fiscalYear: z.number().int().min(2000).max(2100),
  fiscalPeriod: z.number().int().min(1).max(12),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
//   status PeriodStatus @default(FUTURE)
  status: z.enum(['FUTURE', 'OPEN', 'CLOSED', 'LOCKED']).default('FUTURE'),
  openedAt: z.date().optional(),
  openedBy: z.string().optional(),
  closedAt: z.date().optional(),
  closedBy: z.string().optional(),
  lockedAt: z.date().optional(),
  lockedBy: z.string().optional(),

  openingBalances: z.any().optional(), //
  closingBalances: z.any().optional(), //

  yearEndProcessedAt : z.date().optional(), //
  yearEndProcessedBy: z.string().optional(),

  isYearEnd: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
})



export const createPeriodSchema = z.object({
  name: z.string().min(1).max(100),
  shortName: z.string().max(20).optional(),
  
  periodType: z.enum([
    'MONTH',
    'QUARTER',
    'HALF_YEAR',
    'YEAR',
    'CUSTOM',
  ]),
  
  fiscalYear: z.number().int().min(2000).max(2100),
  fiscalPeriod: z.number().int().min(1).max(12),
  
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  
  isYearEnd: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
}).refine(
  (data) => data.endDate > data.startDate,
  { message: 'End date must be after start date' }
);

export const updatePeriodSchema = createPeriodSchema.extend({
  id: z.string().uuid(),
});

export const openPeriodSchema = z.object({
  id: z.string().uuid(),
});

export const closePeriodSchema = z.object({
  id: z.string().uuid(),
  notes: z.string().max(500).optional(),
});

export const lockPeriodSchema = z.object({
  id: z.string().uuid(),
  notes: z.string().max(500).optional(),
});

export const yearEndProcessingSchema = z.object({
  periodId: z.string().uuid(),
  retainedEarningsAccountId: z.string().uuid(),
  createBroughtForward: z.boolean().default(true),
  notes: z.string().max(1000).optional(),
});


export type UpdatePeriodInput = Partial<z.infer<typeof updatePeriodSchema>>;
export type CreatePeriodInput = z.infer<typeof createPeriodSchema>;
export type YearEndProcessingInput = z.infer<typeof yearEndProcessingSchema>;