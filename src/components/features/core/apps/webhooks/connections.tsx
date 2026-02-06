'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type ScopeProps = { agencyId?: string; subAccountId?: string }

export function WebhooksConnectionsPanel(props: ScopeProps) {
  const qs = useMemo(() => {
    const p = new URLSearchParams()
    if (props.agencyId) p.set('agencyId', props.agencyId)
    if (props.subAccountId) p.set('subAccountId', props.subAccountId)
    return p.toString()
  }, [props.agencyId, props.subAccountId])

  const basePath = props.agencyId ? `/agency/${props.agencyId}` : `/subaccount/${props.subAccountId}`

  const [connections, setConnections] = useState<any[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)

  const reload = async () => {
    const c = await fetch(`/api/features/core/webhooks/connections?${qs}`).then((r) => r.json())
    setConnections(c.connections || [])
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs])

  const disconnect = async (id: string) => {
    if (!confirm('Disconnect this connection?')) return
    setBusyId(id)
    try {
      await fetch(`/api/features/core/webhooks/connections/${id}?${qs}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'DISCONNECTED', credentials: null }),
      })
      await reload()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connections</CardTitle>
        <CardDescription>View current connections (owned vs inherited).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {connections.length === 0 ? (
          <div className="text-sm text-muted-foreground">No connections yet.</div>
        ) : null}

        <div className="divide-y rounded-xl border">
          {connections.map((c) => (
            <div key={c.id} className="p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{c.provider}</div>
                <div className="text-xs text-muted-foreground">
                  {c.isInherited ? 'Inherited' : 'Owned'} • {c.updatedAt ? new Date(c.updatedAt).toLocaleString() : '—'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={c.status === 'CONNECTED' ? 'default' : 'secondary'}>{c.status}</Badge>
                <Button asChild variant="outline" size="sm">
                  <Link href={`${basePath}/apps/webhooks/providers/${c.provider}`}>Manage</Link>
                </Button>
                {!c.isInherited ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busyId === c.id}
                    onClick={() => disconnect(c.id)}
                  >
                    Disconnect
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
