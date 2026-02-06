'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type ScopeProps = { agencyId?: string; subAccountId?: string }

export function WebhooksDeliveriesPanel(props: ScopeProps) {
  const qs = useMemo(() => {
    const p = new URLSearchParams()
    if (props.agencyId) p.set('agencyId', props.agencyId)
    if (props.subAccountId) p.set('subAccountId', props.subAccountId)
    return p.toString()
  }, [props.agencyId, props.subAccountId])

  const basePath = props.agencyId ? `/agency/${props.agencyId}` : `/subaccount/${props.subAccountId}`

  const [deliveries, setDeliveries] = useState<any[]>([])
  const [busy, setBusy] = useState(false)

  const reload = async () => {
    setBusy(true)
    try {
      const d = await fetch(`/api/features/core/webhooks/deliveries?${qs}`).then((r) => r.json())
      setDeliveries(d.deliveries || [])
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deliveries</CardTitle>
        <CardDescription>Recent webhook delivery attempts from provider events.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={reload} disabled={busy}>
            Refresh
          </Button>
          <div className="text-xs text-muted-foreground">Showing most recent deliveries.</div>
        </div>

        <div className="divide-y rounded-xl border">
          {deliveries.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">No deliveries yet.</div>
          ) : null}
          {deliveries.map((d) => (
            <div key={d.id} className="p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{d.subscription?.connection?.provider || 'Provider'}</div>
                <div className="text-xs text-muted-foreground">
                  {d.createdAt ? new Date(d.createdAt).toLocaleString() : '—'} • Attempts: {d.attemptCount ?? 0}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={d.status === 'SUCCESS' ? 'default' : d.status === 'FAILED' ? 'destructive' : 'secondary'}>
                  {d.status}
                </Badge>
                <Button asChild variant="outline" size="sm">
                  <Link href={`${basePath}/apps/webhooks/deliveries/${d.id}`}>Details</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
