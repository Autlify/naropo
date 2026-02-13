import { z } from 'zod'

export const AppInstallStateSchema = z.enum(['INSTALLED', 'AVAILABLE', 'EXPIRED', 'DISABLED'])

export const AppCatalogItemSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  isCore: z.boolean().optional(),
  requiredFeatureKeys: z.array(z.string()).optional(),
})

export const AppSummarySchema = AppCatalogItemSchema.extend({
  state: AppInstallStateSchema,
  installedAt: z.string().datetime().nullable().optional(),
  // entitlement flags (license gate)
  entitled: z.boolean().optional(),
  canInstall: z.boolean().optional(),
  canUninstall: z.boolean().optional(),
})

export const AppsListResponseSchema = z.object({
  apps: z.array(AppSummarySchema),
})

export const InstallAppRequestSchema = z.object({
  // Optional when using /apps/[appKey]/install
  appKey: z.string().min(1).optional(),
})

export const InstallAppResponseSchema = z.object({
  appKey: z.string().min(1),
  status: AppInstallStateSchema,
})
