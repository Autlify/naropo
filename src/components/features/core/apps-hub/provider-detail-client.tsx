'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

type ScopeProps = { agencyId?: string; subAccountId?: string; provider: string }

export default function ProviderDetailClient(props: ScopeProps) {
  const qs = useMemo(() => {
    const p = new URLSearchParams()
    if (props.agencyId) p.set('agencyId', props.agencyId)
    if (props.subAccountId) p.set('subAccountId', props.subAccountId)
    return p.toString()
  }, [props.agencyId, props.subAccountId])

  const [connections, setConnections] = useState<any[]>([])
  const [connection, setConnection] = useState<any | null>(null)
  const [subs, setSubs] = useState<any[]>([])
  const [subUrl, setSubUrl] = useState('')
  const [subEvents, setSubEvents] = useState('') // comma
  const [subSecret, setSubSecret] = useState('')
  const [busy, setBusy] = useState(false)

  const basePath = props.agencyId ? `/agency/${props.agencyId}` : `/subaccount/${props.subAccountId}`
  const isOAuthSupported = ['github', 'slack'].includes(props.provider)

  const reload = async () => {
    const c = await fetch(`/api/features/core/webhooks/connections?${qs}`).then((r) => r.json())
    setConnections(c.connections || [])
    const conn = (c.connections || []).find((x: any) => x.provider === props.provider && !x.isInherited) ||
      (c.connections || []).find((x: any) => x.provider === props.provider)
    setConnection(conn || null)

    if (conn?.id) {
      const s = await fetch(`/api/features/core/webhooks/subscriptions?${qs}&connectionId=${conn.id}`).then((r) => r.json())
      setSubs(s.subscriptions || [])
    } else {
      setSubs([])
    }
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs, props.provider])

  const connectUrl = useMemo(() => {
    const back = encodeURIComponent(`${basePath}/apps/webhooks/providers/${props.provider}`)
    return `/api/features/core/webhooks/providers/${props.provider}/oauth?${qs}&back=${back}`
  }, [basePath, props.provider, qs])

  const createConnectionIfMissing = async () => {
    if (connection?.id && !connection?.isInherited) return
    setBusy(true)
    try {
      const res = await fetch(`/api/features/core/webhooks/connections?${qs}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ provider: props.provider }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        alert(j.error || 'Failed to create connection')
      }
      await reload()
    } finally {
      setBusy(false)
    }
  }

  const disconnect = async () => {
    if (!connection?.id) return
    if (!confirm('Disconnect this provider?')) return
    setBusy(true)
    try {
      await fetch(`/api/features/core/webhooks/connections/${connection.id}?${qs}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'DISCONNECTED', credentials: null }),
      })
      await reload()
    } finally {
      setBusy(false)
    }
  }

  const createSubscription = async () => {
    if (!connection?.id) return
    setBusy(true)
    try {
      const events = subEvents.split(',').map((s) => s.trim()).filter(Boolean)
      const res = await fetch(`/api/features/core/webhooks/subscriptions?${qs}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          connectionId: connection.id,
          url: subUrl,
          events,
          secret: subSecret || undefined,
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) alert(j.error || 'Failed to create subscription')
      setSubUrl('')
      setSubEvents('')
      setSubSecret('')
      await reload()
    } finally {
      setBusy(false)
    }
  }

  const toggleSub = async (id: string, isActive: boolean) => {
    setBusy(true)
    try {
      await fetch(`/api/features/core/webhooks/subscriptions/${id}?${qs}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })
      await reload()
    } finally {
      setBusy(false)
    }
  }

  const deleteSub = async (id: string) => {
    if (!confirm('Delete this subscription?')) return
    setBusy(true)
    try {
      await fetch(`/api/features/core/webhooks/subscriptions/${id}?${qs}`, { method: 'DELETE' })
      await reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Connection</CardTitle>
          <CardDescription>Manage provider connection and credentials.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground">
              Status: <Badge variant={connection?.status === 'CONNECTED' ? 'default' : 'secondary'}>{connection?.status || 'DISCONNECTED'}</Badge>
              {connection?.isInherited ? <Badge variant="outline" className="ml-2">Inherited</Badge> : null}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`${basePath}/apps`}>Back</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={createConnectionIfMissing} disabled={busy}>
                Ensure Connection
              </Button>
              <Button variant="outline" size="sm" asChild disabled={busy || !isOAuthSupported}>
                <a href={connectUrl}>OAuth Connect</a>
              </Button>
              <Button variant="destructive" size="sm" onClick={disconnect} disabled={busy || !connection?.id || !!connection?.isInherited}>
                Disconnect
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Inbound webhook URL: <code className="break-all">{`${typeof window !== 'undefined' ? window.location.origin : ''}/api/features/core/webhooks/providers/${props.provider}/ingest/${connection?.id || '{connectionId}'}`}</code>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Subscriptions</CardTitle>
          <CardDescription>
            Fan-out provider events to your endpoints. Secret is stored as SHA-256(secret) and used as signing key.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!connection?.id ? (
            <div className="text-sm text-muted-foreground">Create a connection first.</div>
          ) : (
            <>
              <div className="grid gap-2 md:grid-cols-3">
                <Input placeholder="https://example.com/webhook" value={subUrl} onChange={(e) => setSubUrl(e.target.value)} disabled={busy} />
                <Input placeholder="events (comma-separated)" value={subEvents} onChange={(e) => setSubEvents(e.target.value)} disabled={busy} />
                <Input placeholder="secret (optional)" value={subSecret} onChange={(e) => setSubSecret(e.target.value)} disabled={busy} />
              </div>
              <Button onClick={createSubscription} disabled={busy || !subUrl || !subEvents}>
                Add Subscription
              </Button>

              <Separator />

              <div className="space-y-2">
                {subs.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No subscriptions yet.</div>
                ) : (
                  subs.map((s) => (
                    <div key={s.id} className="border rounded-xl p-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{s.url}</div>
                          <div className="text-xs text-muted-foreground truncate">Events: {(s.events || []).join(', ')}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={s.isActive ? 'default' : 'secondary'}>{s.isActive ? 'ACTIVE' : 'PAUSED'}</Badge>
                          <Button variant="outline" size="sm" onClick={() => toggleSub(s.id, !s.isActive)} disabled={busy}>
                            {s.isActive ? 'Pause' : 'Resume'}
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteSub(s.id)} disabled={busy}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
