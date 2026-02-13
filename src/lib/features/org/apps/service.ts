import 'server-only'

import crypto from 'crypto'

import { Prisma } from '@/generated/prisma/client'
import type { MeteringScope } from '@/generated/prisma/client'
import { db } from '@/lib/db'
import { resolveEffectiveEntitlements } from '@/lib/features/org/billing/entitlements/resolve'
import { APPS_CATALOG, type AppCatalogItem } from './catalog'
import { type AppInstallState } from './install-state'

export type AppInstallationRecord = {
  appKey: string
  status: AppInstallState
  installedAt: string | null
  updatedAt: string | null
}

export type AppWithState = AppCatalogItem & {
  state: AppInstallState
  installedAt: string | null
  /**
   * Whether the current tenant plan includes the app’s required feature keys.
   * For core apps, this is always true.
   */
  entitled: boolean
  /**
   * Whether the app can be installed right now (entitled + not core + not already installed).
   */
  canInstall: boolean
  /**
   * Whether the app can be uninstalled (currently: non-core only).
   */
  canUninstall: boolean
}

export class AppServiceError extends Error {
  status: number
  code: 'UNKNOWN_APP' | 'NOT_ENTITLED' | 'org.APP' | 'MIGRATION_MISSING'
  constructor(args: { status: number; code: AppServiceError['code']; message: string }) {
    super(args.message)
    this.name = 'AppServiceError'
    this.status = args.status
    this.code = args.code
  }
}

const getCatalogItem = (appKey: string): AppCatalogItem | null => {
  return APPS_CATALOG.find((a) => a.key === appKey) ?? null
}

function safeDefault(appKey: string): AppInstallState {
  // Core modules default to installed even before migrations.
  if (appKey === 'integrations' || appKey === 'webhooks') return 'INSTALLED'
  return 'AVAILABLE'
}

async function readInstallations(scope: { agencyId: string; subAccountId?: string | null }) {
  // Table may not exist until migration is applied; callers must handle errors.
  if (scope.subAccountId) {
    return (await db.$queryRaw(
      Prisma.sql`SELECT "appKey","status","installedAt","updatedAt"
                FROM "AppInstallation"
                WHERE "agencyId" = ${scope.agencyId} AND "subAccountId" = ${scope.subAccountId}`
    )) as any[]
  }
  return (await db.$queryRaw(
    Prisma.sql`SELECT "appKey","status","installedAt","updatedAt"
              FROM "AppInstallation"
              WHERE "agencyId" = ${scope.agencyId} AND "subAccountId" IS NULL`
  )) as any[]
}

async function resolveEntitlementInstalled(args: {
  item: AppCatalogItem
  agencyId: string
  subAccountId?: string | null
  scope: MeteringScope
}) {
  const req = args.item.requiredFeatureKeys ?? []
  if (req.length === 0) return true

  const ent = await resolveEffectiveEntitlements({
    agencyId: args.agencyId,
    subAccountId: args.subAccountId ?? null,
    scope: args.scope,
    planId: null,
    now: null,
  })

  const entValues = Object.values(ent)
  if (!ent || entValues.length === 0) return false
  const enabled = new Set(entValues.filter((e) => e.isEnabled).map((e) => e.featureKey))

  // Require at least one known key and one enabled key
  const hasAnyKnownKey = req.some((k) => entValues.some((e) => e.featureKey === k))
  if (!hasAnyKnownKey) return false

  return req.some((k) => enabled.has(k))
}

const meteringScopeFromIds = (args: { subAccountId?: string | null }): MeteringScope => {
  return args.subAccountId ? ('SUBACCOUNT' as MeteringScope) : ('AGENCY' as MeteringScope)
}

/**
 * List app catalog with computed state + entitlement flags.
 * This is the canonical server helper for Apps Hub UI and /api/features/core/apps.
 */
export async function listAppsWithState(args: {
  agencyId: string
  subAccountId?: string | null
  meteringScope: MeteringScope
}): Promise<AppWithState[]> {
  const catalog = APPS_CATALOG
  let installsByKey = new Map<string, any>()

  try {
    const rows = await readInstallations({ agencyId: args.agencyId, subAccountId: args.subAccountId ?? null })
    installsByKey = new Map(rows.map((r: any) => [String(r.appKey), r]))
  } catch {
    // migration not applied; ignore
    installsByKey = new Map()
  }

  const apps: AppWithState[] = []
  for (const item of catalog) {
    const row = installsByKey.get(item.key)

    // Core apps: always installed + entitled.
    if (item.isCore) {
      apps.push({
        ...item,
        state: 'INSTALLED',
        installedAt: row?.installedAt ?? null,
        entitled: true,
        canInstall: false,
        canUninstall: false,
      })
      continue
    }

    // Entitlement gating
    let entitled = false
    try {
      entitled = await resolveEntitlementInstalled({
        item,
        agencyId: args.agencyId,
        subAccountId: args.subAccountId ?? null,
        scope: args.meteringScope,
      })
    } catch {
      entitled = false
    }

    // State resolution
    let state: AppInstallState = row?.status ?? safeDefault(item.key)

    // If the plan doesn't include the app, keep it AVAILABLE even if installed record exists.
    if (!entitled) {
      state = 'AVAILABLE'
    } else {
      // Entitled:
      // - If no row yet, treat as AVAILABLE (installable)
      // - If row exists, respect status
      if (!row) state = 'AVAILABLE'
    }

    apps.push({
      ...item,
      state,
      installedAt: row?.installedAt ?? null,
      entitled,
      canInstall: entitled && state !== 'INSTALLED',
      canUninstall: state === 'INSTALLED',
    })
  }

  return apps
}

export async function installApp(args: {
  appKey: string
  agencyId: string
  subAccountId?: string | null
}) {
  const item = getCatalogItem(args.appKey)
  if (!item) {
    throw new AppServiceError({ status: 404, code: 'UNKNOWN_APP', message: `Unknown appKey: ${args.appKey}` })
  }

  // Core modules are always installed; no-op.
  if (item.isCore) {
    return { appKey: args.appKey, status: 'INSTALLED' as const }
  }

  await ensureTableExistsOrThrow()

  // Enforce entitlements (license gate). If not entitled, installing is not allowed.
  const entitled = await resolveEntitlementInstalled({
    item,
    agencyId: args.agencyId,
    subAccountId: args.subAccountId ?? null,
    scope: meteringScopeFromIds({ subAccountId: args.subAccountId ?? null }),
  })
  if (!entitled) {
    throw new AppServiceError({ status: 402, code: 'NOT_ENTITLED', message: 'App is not included in current plan entitlements' })
  }

  const id = crypto.randomUUID()
  const now = new Date()
  const status: AppInstallState = 'INSTALLED'
  const scopeWhere =
    args.subAccountId
      ? Prisma.sql`"subAccountId" = ${args.subAccountId}`
      : Prisma.sql`"subAccountId" IS NULL`

  // Create row if missing (partial unique indexes enforce dedupe)
  await db.$executeRaw(
    Prisma.sql`INSERT INTO "AppInstallation" ("id","appKey","agencyId","subAccountId","status","installedAt","createdAt","updatedAt")
              VALUES (${id}, ${args.appKey}, ${args.agencyId}, ${args.subAccountId ?? null}, ${status}, ${now}, ${now}, ${now})
              ON CONFLICT DO NOTHING`
  )

  // Ensure installed state
  await db.$executeRaw(
    Prisma.sql`UPDATE "AppInstallation"
              SET "status" = ${status},
                  "installedAt" = COALESCE("installedAt", ${now}),
                  "uninstalledAt" = NULL,
                  "updatedAt" = ${now}
              WHERE "agencyId" = ${args.agencyId}
                AND "appKey" = ${args.appKey}
                AND ${scopeWhere}`
  )

  return { appKey: args.appKey, status: 'INSTALLED' as const }
}

export async function uninstallApp(args: {
  appKey: string
  agencyId: string
  subAccountId?: string | null
}) {
  const item = getCatalogItem(args.appKey)
  if (!item) {
    throw new AppServiceError({ status: 404, code: 'UNKNOWN_APP', message: `Unknown appKey: ${args.appKey}` })
  }

  // Core apps cannot be uninstalled.
  if (item.isCore) {
    throw new AppServiceError({ status: 400, code: 'org.APP', message: 'Core apps cannot be uninstalled' })
  }

  await ensureTableExistsOrThrow()

  const now = new Date()
  const scopeWhere =
    args.subAccountId
      ? Prisma.sql`"subAccountId" = ${args.subAccountId}`
      : Prisma.sql`"subAccountId" IS NULL`

  await db.$executeRaw(
    Prisma.sql`UPDATE "AppInstallation"
              SET "status" = 'AVAILABLE',
                  "uninstalledAt" = ${now},
                  "updatedAt" = ${now}
              WHERE "agencyId" = ${args.agencyId}
                AND "appKey" = ${args.appKey}
                AND ${scopeWhere}`
  )

  return { appKey: args.appKey, status: 'AVAILABLE' as const }
}

async function ensureTableExistsOrThrow() {
  // Postgres check — returns null if missing.
  const rows = (await db.$queryRaw(
    Prisma.sql`SELECT to_regclass('public."AppInstallation"') AS "reg"`
  )) as any[]
  const reg = rows?.[0]?.reg ?? rows?.[0]?.Reg ?? rows?.[0]?.REG ?? null
  if (!reg) {
    throw new AppServiceError({
      status: 500,
      code: 'MIGRATION_MISSING',
      message: 'AppInstallation table is not present. Apply migrations (prisma migrate) first.',
    })
  }
}
