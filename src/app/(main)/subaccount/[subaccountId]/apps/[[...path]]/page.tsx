import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { MeteringScope } from '@/generated/prisma/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { describeInstallState } from '@/lib/features/org/apps/install-state'
import { listAppsWithState, type AppWithState } from '@/lib/features/org/apps/service'
import { installAppSubAccountAction, uninstallAppSubAccountAction } from '@/lib/features/org/apps/actions'
import { getDeliveryDetail } from '@/lib/features/org/integrations/store'
import { requireSubAccountAccess } from '@/lib/features/iam/authz/require'
import { KEYS } from '@/lib/registry/keys/permissions'
import { WebhooksNav } from '@/components/features/core/apps/webhooks/nav'
import { WebhooksProvidersPanel } from '@/components/features/core/apps/webhooks/providers'
import { WebhooksConnectionsPanel } from '@/components/features/core/apps/webhooks/connections'
import { WebhooksApiKeysPanel } from '@/components/features/core/apps/webhooks/api-keys'
import { WebhooksSubscriptionsPanel } from '@/components/features/core/apps/webhooks'
import { WebhooksDeliveriesPanel } from '@/components/features/core/apps/webhooks/deliveries'
import { SupportNav } from '@/components/features/core/apps/support/nav'
import { SupportWizardPanel } from '@/components/features/core/apps/support/wizard'
import { SupportTicketsPanel } from '@/components/features/core/apps/support/tickets'
import ProviderDetailClient from '@/components/features/core/apps/provider-detail-client'

type Props = { params: Promise<{ subaccountId: string; path?: string[] }> }

// ============================================================================
// Apps Hub Menu (shows when path is empty)
// ============================================================================

const AppsHubMenu = ({ subaccountId, agencyId, apps }: {
  subaccountId: string
  agencyId: string
  apps: AppWithState[]
}) => {
  const core = apps.filter((a) => !!a.isCore)
  const addons = apps.filter((a) => !a.isCore)

  const webhooks = core.find((a) => a.key === 'webhooks')
  const webhooksMeta = describeInstallState(webhooks?.state ?? 'AVAILABLE')

  const support = core.find((a) => a.key === 'support')
  const supportMeta = describeInstallState(support?.state ?? 'AVAILABLE')

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Apps Hub</h1>
        <p className="text-sm text-muted-foreground">Manage installed modules and add-ons for this subaccount.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Support Center</CardTitle>
              <Badge variant={supportMeta.tone}>{supportMeta.label}</Badge>
            </div>
            <CardDescription>Guided troubleshooting, diagnostics, and support tickets.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button asChild disabled={(support?.state ?? 'AVAILABLE') !== 'INSTALLED'}>
              <Link href={`/subaccount/${subaccountId}/apps/support`}>Open</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/subaccount/${subaccountId}/apps/support/tickets`}>Tickets</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Webhooks</CardTitle>
              <Badge variant={webhooksMeta.tone}>{webhooksMeta.label}</Badge>
            </div>
            <CardDescription>Providers, connections, API keys, subscriptions, and deliveries.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button asChild disabled={(webhooks?.state ?? 'AVAILABLE') !== 'INSTALLED'}>
              <Link href={`/subaccount/${subaccountId}/apps/webhooks`}>Open</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/subaccount/${subaccountId}/apps/webhooks/api-keys`}>API Keys</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/subaccount/${subaccountId}/apps/webhooks/deliveries`}>Deliveries</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Add-ons</h2>
          <p className="text-sm text-muted-foreground">Install optional modules when they&apos;re included in your plan.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {addons.map((a) => {
            const meta = describeInstallState(a.state)
            return (
              <Card key={a.key}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>{a.label}</CardTitle>
                    <Badge variant={a.entitled ? meta.tone : 'outline'}>{a.entitled ? meta.label : 'Upgrade'}</Badge>
                  </div>
                  <CardDescription>{a.description ?? '—'}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button asChild disabled={a.state !== 'INSTALLED'}>
                    <Link href={`/subaccount/${subaccountId}/apps/${a.key}`}>Open</Link>
                  </Button>

                  {!a.entitled ? (
                    <Button variant="outline" asChild>
                      <Link href={`/agency/${agencyId}/billing?action=upgrade&app=${encodeURIComponent(a.key)}`}>
                        Upgrade
                      </Link>
                    </Button>
                  ) : a.canInstall ? (
                    <form action={installAppSubAccountAction}>
                      <input type="hidden" name="subAccountId" value={subaccountId} />
                      <input type="hidden" name="appKey" value={a.key} />
                      <Button type="submit">Install</Button>
                    </form>
                  ) : a.canUninstall ? (
                    <form action={uninstallAppSubAccountAction}>
                      <input type="hidden" name="subAccountId" value={subaccountId} />
                      <input type="hidden" name="appKey" value={a.key} />
                      <Button type="submit" variant="outline">
                        Uninstall
                      </Button>
                    </form>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Support Center Module Router
// ============================================================================

const SupportLayout = ({
  subaccountId,
  children,
}: {
  subaccountId: string
  children: React.ReactNode
}) => {
  const basePath = `/subaccount/${subaccountId}/apps/support`
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Support Center</h1>
        <p className="text-sm text-muted-foreground">Guided troubleshooting, diagnostics, and support tickets.</p>
      </div>
      <SupportNav basePath={basePath} />
      <div className="space-y-6">{children}</div>
    </div>
  )
}

const SupportRouter = ({
  subaccountId,
  segments,
}: {
  subaccountId: string
  segments: string[]
}) => {
  const [section] = segments

  // /apps/support → default wizard
  if (!section || section === '') {
    return (
      <SupportLayout subaccountId={subaccountId}>
        <SupportWizardPanel scope={{ type: 'SUBACCOUNT', subaccountId }} />
      </SupportLayout>
    )
  }

  let content: React.ReactNode
  switch (section) {
    case 'wizard':
      content = <SupportWizardPanel scope={{ type: 'SUBACCOUNT', subaccountId }} />
      break
    case 'tickets':
      content = <SupportTicketsPanel scope={{ type: 'SUBACCOUNT', subaccountId }} />
      break
    default:
      content = <SupportWizardPanel scope={{ type: 'SUBACCOUNT', subaccountId }} />
  }

  return <SupportLayout subaccountId={subaccountId}>{content}</SupportLayout>
}

// ============================================================================
// Webhooks Module Router
// ============================================================================

function WebhooksLayout({
  subaccountId,
  children
}: {
  subaccountId: string
  children: React.ReactNode
}) {
  const basePath = `/subaccount/${subaccountId}/apps/webhooks`
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Webhooks</h1>
        <p className="text-sm text-muted-foreground">Providers, connections, API keys, subscriptions, and deliveries.</p>
      </div>
      <WebhooksNav basePath={basePath} subaccountId={subaccountId} />
      <div className="space-y-6">{children}</div>
    </div>
  )
}

const WebhooksRouter = async ({
  subaccountId,
  agencyId,
  segments
}: {
  subaccountId: string
  agencyId: string
  segments: string[]
}) => {
  const [section, id] = segments

  // /apps/webhooks → redirect to providers
  if (!section || section === '') {
    redirect(`/subaccount/${subaccountId}/apps/webhooks/providers`)
  }

  let content: React.ReactNode

  switch (section) {
    case 'providers':
      content = id
        ? <ProviderDetailClient subAccountId={subaccountId} provider={id} />
        : <WebhooksProvidersPanel subAccountId={subaccountId} />
      break

    case 'connections':
      content = <WebhooksConnectionsPanel subAccountId={subaccountId} />
      break

    case 'api-keys':
      content = <WebhooksApiKeysPanel subAccountId={subaccountId} />
      break

    case 'subscriptions':
      content = <WebhooksSubscriptionsPanel subAccountId={subaccountId} />
      break

    case 'deliveries':
      if (id) {
        // Delivery detail view
        const detail = await getDeliveryDetail(id, { type: 'SUBACCOUNT', subAccountId: subaccountId })
        if (!detail) return notFound()
        content = <DeliveryDetailView subaccountId={subaccountId} detail={detail} />
      } else {
        content = <WebhooksDeliveriesPanel subAccountId={subaccountId} />
      }
      break

    default:
      // Unknown section - could be a provider key like /webhooks/github
      content = <ProviderDetailClient subAccountId={subaccountId} provider={section} />
  }

  return <WebhooksLayout subaccountId={subaccountId}>{content}</WebhooksLayout>
}

const DeliveryDetailView = ({
  subaccountId,
  detail
}: {
  subaccountId: string
  detail: { delivery: any; attempts?: any[] }
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery details</CardTitle>
        <CardDescription>
          Provider: <span className="font-medium">{detail.delivery.provider}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={detail.delivery.status === 'SUCCESS' ? 'default' : detail.delivery.status === 'FAILED' ? 'destructive' : 'secondary'}>
            {detail.delivery.status}
          </Badge>
          <div className="text-xs text-muted-foreground">
            Attempts: {detail.delivery.attemptCount ?? 0} • Created: {detail.delivery.createdAt ? new Date(detail.delivery.createdAt).toLocaleString() : '—'}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="text-sm font-medium">Subscription URL</div>
          <div className="text-sm text-muted-foreground break-all">{detail.delivery.subscriptionUrl}</div>
        </div>

        {detail.attempts?.length ? (
          <div className="space-y-2">
            <div className="text-sm font-medium">Attempts</div>
            <div className="divide-y rounded-xl border">
              {detail.attempts.map((a: any) => (
                <div key={a.id} className="p-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">{a.attemptedAt ? new Date(a.attemptedAt).toLocaleString() : '—'}</div>
                    <Badge variant={a.statusCode && a.statusCode < 400 ? 'default' : 'secondary'}>
                      {a.statusCode ?? '—'}
                    </Badge>
                  </div>
                  {a.error ? <div className="text-xs text-destructive break-all">{a.error}</div> : null}
                  {a.responseBody ? <div className="text-xs text-muted-foreground break-all">{a.responseBody}</div> : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/subaccount/${subaccountId}/apps/webhooks/deliveries`}>Back to Deliveries</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Integrations Redirect (legacy alias to webhooks)
// ============================================================================

const integrationsRedirect = (subaccountId: string, segments: string[]): never => {
  const [section] = segments

  // /apps/integrations → /apps/webhooks/providers
  if (!section || section === '') {
    redirect(`/subaccount/${subaccountId}/apps/webhooks/providers`)
  }

  // Map old integrations sections to webhooks
  const sectionMap: Record<string, string> = {
    'providers': 'providers',
    'connections': 'connections',
    'api-keys': 'api-keys',
    'webhooks': 'subscriptions',
    'deliveries': 'deliveries',
  }

  const mappedSection = sectionMap[section] || section
  const id = segments[1]
  redirect(`/subaccount/${subaccountId}/apps/webhooks/${mappedSection}${id ? `/${id}` : ''}`)
}

// ============================================================================
// App Not Installed / Upgrade Prompt
// ============================================================================

const AppAccessPrompt = ({
  subaccountId,
  agencyId,
  appKey,
  info,
}: {
  subaccountId: string
  agencyId: string
  appKey: string
  info?: { state: string; entitled: boolean; canInstall: boolean; label?: string }
}) => {
  const meta = describeInstallState((info?.state as any) ?? 'AVAILABLE')
  const entitled = info?.entitled ?? false
  const canInstall = info?.canInstall ?? false

  return (
    <div className="p-6">
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>App access</CardTitle>
          <CardDescription>
            <span className="font-medium">{info?.label ?? appKey}</span> — {entitled ? meta.label : 'Upgrade'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!entitled ? (
            <>
              <div className="text-sm text-muted-foreground">
                This module isn&apos;t included in your current plan. Upgrade your subscription to enable it.
              </div>
              <div className="flex gap-2">
                <Button asChild>
                  <Link href={`/agency/${agencyId}/billing?action=upgrade&app=${encodeURIComponent(appKey)}`}>Go to Billing</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/subaccount/${subaccountId}/apps`}>Back to Apps Hub</Link>
                </Button>
              </div>
            </>
          ) : info?.state !== 'INSTALLED' ? (
            <>
              <div className="text-sm text-muted-foreground">
                This module is available for install in this subaccount.
              </div>
              <div className="flex gap-2">
                {canInstall ? (
                  <form action={installAppSubAccountAction}>
                    <input type="hidden" name="subAccountId" value={subaccountId} />
                    <input type="hidden" name="appKey" value={appKey} />
                    <Button type="submit">Install</Button>
                  </form>
                ) : null}
                <Button variant="outline" asChild>
                  <Link href={`/subaccount/${subaccountId}/apps`}>Back to Apps Hub</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm text-muted-foreground">
                This module is installed, but there is no registered route yet.
              </div>
              <Button variant="outline" asChild>
                <Link href={`/subaccount/${subaccountId}/apps`}>Back to Apps Hub</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// Main Catch-All Router
// ============================================================================

export default async function SubAccountAppsCatchAllPage({ params }: Props) {
  const { subaccountId, path = [] } = await params

  // Validate access (needed for all routes including menu)
  const ctx = await requireSubAccountAccess({
    subAccountId: subaccountId,
    permissionKeys: [KEYS.org.apps.app.view],
    requireActiveAgencySubscription: true,
    redirectTo: `/subaccount/${subaccountId}/apps`,
  })

  // Load app state (needed for both menu and routing)
  const apps = await listAppsWithState({
    agencyId: ctx.agencyId,
    subAccountId: subaccountId,
    meteringScope: 'SUBACCOUNT' as MeteringScope,
  })

  // /apps with no path → show apps hub menu
  if (path.length === 0) {
    return <AppsHubMenu subaccountId={subaccountId} agencyId={ctx.agencyId} apps={apps} />
  }

  const [appKey, ...rest] = path
  const info = apps.find((a) => a.key === appKey)

  // Check entitlement and install state
  if (!info?.entitled || info.state !== 'INSTALLED') {
    // Special case: integrations and webhooks are core apps
    if (appKey === 'integrations' || appKey === 'webhooks') {
      // If not installed, still show the prompt
      if (info?.state !== 'INSTALLED') {
        return <AppAccessPrompt subaccountId={subaccountId} agencyId={ctx.agencyId} appKey={appKey} info={info as any} />
      }
    } else {
      return <AppAccessPrompt subaccountId={subaccountId} agencyId={ctx.agencyId} appKey={appKey} info={info as any} />
    }
  }

  // Route to app-specific module
  switch (appKey) {
    case 'support':
      return <SupportRouter subaccountId={subaccountId} segments={rest} />

    case 'webhooks':
      return <WebhooksRouter subaccountId={subaccountId} agencyId={ctx.agencyId} segments={rest} />

    case 'integrations':
      // Legacy: redirect integrations to webhooks
      integrationsRedirect(subaccountId, rest)

    // Future: Add more apps here
    // case 'fi-gl':
    //   return <FinanceGLRouter subaccountId={subaccountId} segments={rest} />

    default:
      // App is installed but no route registered
      return <AppAccessPrompt subaccountId={subaccountId} agencyId={ctx.agencyId} appKey={appKey} info={info as any} />
  }
}
