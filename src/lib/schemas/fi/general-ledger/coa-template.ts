/**
 * COA Template Schemas
 * FI-GL Module - Chart of Accounts template validation
 */

import { z } from 'zod'

// ========== Template Account Schema ==========

export const templateAccountSchema = z.object({
  code: z.string().min(1, 'Account code is required').max(20),
  name: z.string().min(1, 'Account name is required').max(100),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  normalBalance: z.enum(['DEBIT', 'CREDIT']),
  description: z.string().optional(),
  isSystemAccount: z.boolean().default(false),
  parentCode: z.string().optional(),
  children: z.lazy((): z.ZodType<any> => z.array(templateAccountSchema)).optional(),
})

export type TemplateAccount = z.infer<typeof templateAccountSchema>

// ========== COA Template Schema ==========

export const coaTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(100),
  description: z.string().max(500).optional(),
  industry: z.enum([
    'GENERAL',
    'TECHNOLOGY',
    'RETAIL',
    'MANUFACTURING',
    'HEALTHCARE',
    'FINANCIAL_SERVICES',
    'PROFESSIONAL_SERVICES',
    'REAL_ESTATE',
    'HOSPITALITY',
    'NONPROFIT',
    'EDUCATION',
    'GOVERNMENT',
    'AGENCY',
    'OTHER',
  ]).default('GENERAL'),
  region: z.string().default('US'),
  accountingStandard: z.enum(['GAAP', 'IFRS', 'OTHER']).default('GAAP'),
  accounts: z.array(templateAccountSchema).min(1, 'At least one account is required'),
})

export const createCOATemplateSchema = coaTemplateSchema.extend({
  isDefault: z.boolean().default(false),
})

export const updateCOATemplateSchema = coaTemplateSchema.partial().extend({
  id: z.uuid(),
})

export type COATemplateInput = z.infer<typeof coaTemplateSchema>
export type CreateCOATemplateInput = z.infer<typeof createCOATemplateSchema>
export type UpdateCOATemplateInput = z.infer<typeof updateCOATemplateSchema>

// ========== Template Application Options ==========

export const applyTemplateOptionsSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  overwriteExisting: z.boolean().default(false),
  includeSystemAccounts: z.boolean().default(true),
  customPrefix: z.string().optional(),
  skipAccountCodes: z.array(z.string()).optional(),
})

export type ApplyTemplateOptions = z.infer<typeof applyTemplateOptionsSchema>

// ========== Import/Export Schemas ==========

export const importCOASchema = z.object({
  format: z.enum(['json', 'csv']),
  data: z.string().min(1, 'Data is required'),
  overwriteExisting: z.boolean().default(false),
})

export const exportCOASchema = z.object({
  format: z.enum(['json', 'csv']),
  includeInactive: z.boolean().default(false),
  includeSystemAccounts: z.boolean().default(true),
})

export type ImportCOAInput = z.infer<typeof importCOASchema>
export type ExportCOAInput = z.infer<typeof exportCOASchema>

// ========== Template Preview Schema ==========

export const templatePreviewSchema = z.object({
  templateId: z.string().min(1),
  showHierarchy: z.boolean().default(true),
  filterByType: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']).optional(),
})

export type TemplatePreviewOptions = z.infer<typeof templatePreviewSchema>

// ========== Built-in Template IDs ==========

export const BUILT_IN_TEMPLATES = {
  STANDARD: 'standard',
  SERVICE_BUSINESS: 'service-business',
  AGENCY: 'agency',
  MINIMAL: 'minimal',
  MANUFACTURING: 'manufacturing',
  RETAIL: 'retail',
  NONPROFIT: 'nonprofit',
} as const

export type BuiltInTemplateId = (typeof BUILT_IN_TEMPLATES)[keyof typeof BUILT_IN_TEMPLATES]

// ========== Template Metadata Schema ==========

export const templateMetadataSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  industry: z.string(),
  region: z.string(),
  accountingStandard: z.string(),
  accountCount: z.number(),
  isBuiltIn: z.boolean(),
  isDefault: z.boolean(),
  version: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
})

export type TemplateMetadata = z.infer<typeof templateMetadataSchema>
