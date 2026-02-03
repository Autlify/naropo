import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { MeteringScope } from '@/generated/prisma/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { describeInstallState } from '@/lib/features/core/apps/install-state'
import { listAppsWithState, type AppWithState } from '@/lib/features/core/apps/service'
import { installAppAgencyAction, uninstallAppAgencyAction } from '@/lib/features/core/apps/actions'
import { getDeliveryDetail } from '@/lib/features/core/integrations/store'
import { WebhooksNav } from '@/components/apps-hub/webhooks/nav'
import { WebhooksProvidersPanel } from '@/components/apps-hub/webhooks/providers'
import { WebhooksConnectionsPanel } from '@/components/apps-hub/webhooks/connections'
import { WebhooksApiKeysPanel } from '@/components/apps-hub/webhooks/api-keys'
import { WebhooksSubscriptionsPanel } from '@/components/apps-hub/webhooks'
import { WebhooksDeliveriesPanel } from '@/components/apps-hub/webhooks/deliveries'
import { SupportNav } from '@/components/apps-hub/support/nav'
import { SupportWizardPanel } from '@/components/apps-hub/support/wizard'
import { SupportTicketsPanel } from '@/components/apps-hub/support/tickets'
import ProviderDetailClient from '@/components/apps-hub/provider-detail-client'

type Props = { params: Promise<{ agencyId: string; path?: string[] }> }

// ============================================================================
// Apps Hub Menu (shows when path is empty)
// ============================================================================

function AppsHubMenu({ agencyId, apps }: { agencyId: string; apps: AppWithState[] }) {
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
        <p className="text-sm text-muted-foreground">Manage installed modules and add-ons for this agency.</p>
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
              <Link href={`/agency/${agencyId}/apps/support`}>Open</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/agency/${agencyId}/apps/support/tickets`}>Tickets</Link>
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
              <Link href={`/agency/${agencyId}/apps/webhooks`}>Open</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/agency/${agencyId}/apps/webhooks/api-keys`}>API Keys</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/agency/${agencyId}/apps/webhooks/deliveries`}>Deliveries</Link>
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
                    <Link href={`/agency/${agencyId}/apps/${a.key}`}>Open</Link>
                  </Button>

                  {!a.entitled ? (
                    <Button variant="outline" asChild>
                      <Link href={`/agency/${agencyId}/billing?action=upgrade&app=${encodeURIComponent(a.key)}`}>
                        Upgrade
                      </Link>
                    </Button>
                  ) : a.canInstall ? (
                    <form action={installAppAgencyAction}>
                      <input type="hidden" name="agencyId" value={agencyId} />
                      <input type="hidden" name="appKey" value={a.key} />
                      <Button type="submit">Install</Button>
                    </form>
                  ) : a.canUninstall ? (
                    <form action={uninstallAppAgencyAction}>
                      <input type="hidden" name="agencyId" value={agencyId} />
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

function SupportLayout({
  agencyId,
  children,
}: {
  agencyId: string
  children: React.ReactNode
}) {
  const basePath = `/agency/${agencyId}/apps/support`
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Support Center</h1>
        <p className="text-sm text-muted-foreground">
          Guided troubleshooting, diagnostics, and support tickets.
        </p>
      </div>
      <SupportNav basePath={basePath} />
      <div className="space-y-6">{children}</div>
    </div>
  )
}

function SupportRouter({
  agencyId,
  segments,
}: {
  agencyId: string
  segments: string[]
}) {
  const [section] = segments
  // /apps/support → default wizard
  if (!section || section === '') {
    return (
      <SupportLayout agencyId={agencyId}>
        <SupportWizardPanel scope={{ type: 'AGENCY', agencyId }} />
      </SupportLayout>
    )
  }

  let content: React.ReactNode
  switch (section) {
    case 'wizard':
      content = <SupportWizardPanel scope={{ type: 'AGENCY', agencyId }} />
      break
    case 'tickets':
      content = <SupportTicketsPanel scope={{ type: 'AGENCY', agencyId }} />
      break
    default:
      // Unknown support section → wizard
      content = <SupportWizardPanel scope={{ type: 'AGENCY', agencyId }} />
  }

  return <SupportLayout agencyId={agencyId}>{content}</SupportLayout>
}

// ============================================================================
// Webhooks Module Router
// ============================================================================

function WebhooksLayout({
    agencyId,
    children
}: {
    agencyId: string
    children: React.ReactNode
}) {
    const basePath = `/agency/${agencyId}/apps/webhooks`
    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-semibold">Webhooks</h1>
                <p className="text-sm text-muted-foreground">Providers, connections, API keys, subscriptions, and deliveries.</p>
            </div>
            <WebhooksNav basePath={basePath} />
            <div className="space-y-6">{children}</div>
        </div>
    )
}

async function WebhooksRouter({
    agencyId,
    segments
}: {
    agencyId: string
    segments: string[]
}) {
    const [section, id] = segments

    // /apps/webhooks → redirect to providers
    if (!section || section === '') {
        redirect(`/agency/${agencyId}/apps/webhooks/providers`)
    }

    let content: React.ReactNode
    switch (section) {
        case 'providers':
            content = id
                ? <ProviderDetailClient agencyId={agencyId} provider={id} />
                : <WebhooksProvidersPanel agencyId={agencyId} />
            break

        case 'connections':
            content = <WebhooksConnectionsPanel agencyId={agencyId} />
            break

        case 'api-keys':
            content = <WebhooksApiKeysPanel agencyId={agencyId} />
            break

        case 'subscriptions':
            content = <WebhooksSubscriptionsPanel agencyId={agencyId} />
            break

        case 'deliveries':
            if (id) {
                // Delivery detail view
                const detail = await getDeliveryDetail(id, { type: 'AGENCY', agencyId })
                if (!detail) return notFound()
                content = <DeliveryDetailView agencyId={agencyId} detail={detail} />
            } else {
                content = <WebhooksDeliveriesPanel agencyId={agencyId} />
            }
            break

        default:
            // Unknown section - could be a provider key like /webhooks/github
            content = <ProviderDetailClient agencyId={agencyId} provider={section} />
    }

    return <WebhooksLayout agencyId={agencyId}>{content}</WebhooksLayout>
}

function DeliveryDetailView({
    agencyId,
    detail
}: {
    agencyId: string
    detail: { delivery: any; attempts?: any[] }
}) {
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
                        <Link href={`/agency/${agencyId}/apps/webhooks/deliveries`}>Back to Deliveries</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

// ============================================================================
// Integrations Redirect (legacy alias to webhooks)
// ============================================================================

function integrationsRedirect(agencyId: string, segments: string[]): never {
    const [section] = segments

    // /apps/integrations → /apps/webhooks/providers
    if (!section || section === '') {
        redirect(`/agency/${agencyId}/apps/webhooks/providers`)
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
    redirect(`/agency/${agencyId}/apps/webhooks/${mappedSection}${id ? `/${id}` : ''}`)
}

// ============================================================================
// App Not Installed / Upgrade Prompt
// ============================================================================

function AppAccessPrompt({
    agencyId,
    appKey,
    info,
}: {
    agencyId: string
    appKey: string
    info?: { state: string; entitled: boolean; canInstall: boolean; label?: string }
}) {
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
                                    <Link href={`/agency/${agencyId}/apps`}>Back to Apps Hub</Link>
                                </Button>
                            </div>
                        </>
                    ) : info?.state !== 'INSTALLED' ? (
                        <>
                            <div className="text-sm text-muted-foreground">
                                This module is available for install in this agency.
                            </div>
                            <div className="flex gap-2">
                                {canInstall ? (
                                    <form action={installAppAgencyAction}>
                                        <input type="hidden" name="agencyId" value={agencyId} />
                                        <input type="hidden" name="appKey" value={appKey} />
                                        <Button type="submit">Install</Button>
                                    </form>
                                ) : null}
                                <Button variant="outline" asChild>
                                    <Link href={`/agency/${agencyId}/apps`}>Back to Apps Hub</Link>
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-sm text-muted-foreground">
                                This module is installed, but there is no registered route yet.
                            </div>
                            <Button variant="outline" asChild>
                                <Link href={`/agency/${agencyId}/apps`}>Back to Apps Hub</Link>
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

export default async function AgencyAppsCatchAllPage({ params }: Props) {
    const { agencyId, path = [] } = await params

    // Load app state (needed for both menu and routing)
    const apps = await listAppsWithState({
        agencyId,
        subAccountId: null,
        meteringScope: 'AGENCY' as MeteringScope,
    })

    // /apps with no path → show apps hub menu
    if (path.length === 0) {
        return <AppsHubMenu agencyId={agencyId} apps={apps} />
    }

    const [appKey, ...rest] = path
    const info = apps.find((a) => a.key === appKey)

    // Check entitlement and install state
    if (!info?.entitled || info.state !== 'INSTALLED') {
        // Special case: integrations and webhooks are core apps
        if (appKey === 'integrations' || appKey === 'webhooks') {
            // If not installed, still show the prompt
            if (info?.state !== 'INSTALLED') {
                return <AppAccessPrompt agencyId={agencyId} appKey={appKey} info={info as any} />
            }
        } else {
            return <AppAccessPrompt agencyId={agencyId} appKey={appKey} info={info as any} />
        }
    }

    // Route to app-specific module
    switch (appKey) {
        case 'support':
            return <SupportRouter agencyId={agencyId} segments={rest} />

        case 'webhooks':
            return <WebhooksRouter agencyId={agencyId} segments={rest} />

        case 'integrations':
            // Legacy: redirect integrations to webhooks
            integrationsRedirect(agencyId, rest)

        // Future: Add more apps here
        // case 'fi-gl':
        //   return <FinanceGLRouter agencyId={agencyId} segments={rest} />

        default:
            // App is installed but no route registered
            return <AppAccessPrompt agencyId={agencyId} appKey={appKey} info={info as any} />
    }
}
