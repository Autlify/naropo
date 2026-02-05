'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

type ScopeProps = { agencyId?: string; subAccountId?: string }

export function WebhooksSubscriptionsPanel(props: ScopeProps) {
  const qs = useMemo(() => {
    const p = new URLSearchParams()
    if (props.agencyId) p.set('agencyId', props.agencyId)
    if (props.subAccountId) p.set('subAccountId', props.subAccountId)
    return p.toString()
  }, [props.agencyId, props.subAccountId])

  const basePath = props.agencyId ? `/agency/${props.agencyId}` : `/subaccount/${props.subAccountId}`

  const [connections, setConnections] = useState<any[]>([])
  const [subs, setSubs] = useState<Record<string, any[]>>({})
  const [busy, setBusy] = useState(false)

  const reload = async () => {
    setBusy(true)
    try {
      const c = await fetch(`/api/features/core/webhooks/connections?${qs}`).then((r) => r.json())
      const list = (c.connections || []).filter((x: any) => x.status === 'CONNECTED')
      setConnections(list)

      const entries: Record<string, any[]> = {}
      await Promise.all(
        list.map(async (conn: any) => {
          const s = await fetch(
            `/api/features/core/webhooks/subscriptions?${qs}&connectionId=${conn.id}`
          ).then((r) => r.json())
          entries[conn.id] = s.subscriptions || []
        })
      )
      setSubs(entries)
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs])

  const toggle = async (subscriptionId: string, isActive: boolean) => {
    setBusy(true)
    try {
      await fetch(`/api/features/core/webhooks/subscriptions/${subscriptionId}?${qs}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })
      await reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhooks</CardTitle>
        <CardDescription>Manage webhook subscriptions (connect per provider).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={reload} disabled={busy}>
            Refresh
          </Button>
          <div className="text-xs text-muted-foreground">Subscriptions are configured per provider connection.</div>
        </div>

        {connections.length === 0 ? (
          <div className="text-sm text-muted-foreground">No connected providers with webhooks yet.</div>
        ) : null}

        {connections.map((c) => {
          const list = subs[c.id] || []
          return (
            <div key={c.id} className="rounded-xl border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{c.provider}</div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`${basePath}/apps/webhooks/providers/${c.provider}`}>Manage provider</Link>
                </Button>
              </div>
              <Separator />
              {list.length === 0 ? (
                <div className="text-sm text-muted-foreground">No subscriptions yet.</div>
              ) : (
                <div className="space-y-2">
                  {list.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm truncate">{s.url}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {(s.events || []).join(', ') || '—'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={s.isActive ? 'default' : 'secondary'}>{s.isActive ? 'ACTIVE' : 'PAUSED'}</Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => toggle(s.id, !s.isActive)}
                        >
                          {s.isActive ? 'Pause' : 'Resume'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
