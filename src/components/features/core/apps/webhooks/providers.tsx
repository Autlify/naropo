'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type ScopeProps = { agencyId?: string; subAccountId?: string }

type Provider = {
  id: string
  name: string
  category?: string
  description?: string
  oauthSupported?: boolean
  webhookSupported?: boolean
}

export function WebhooksProvidersPanel(props: ScopeProps) {
  const qs = useMemo(() => {
    const p = new URLSearchParams()
    if (props.agencyId) p.set('agencyId', props.agencyId)
    if (props.subAccountId) p.set('subAccountId', props.subAccountId)
    return p.toString()
  }, [props.agencyId, props.subAccountId])

  const basePath = props.agencyId ? `/agency/${props.agencyId}` : `/subaccount/${props.subAccountId}`

  const [providers, setProviders] = useState<Provider[]>([])
  const [connections, setConnections] = useState<any[]>([])

  const reload = async () => {
    const [p, c] = await Promise.all([
      fetch('/api/features/core/webhooks/providers').then((r) => r.json()),
      fetch(`/api/features/core/webhooks/connections?${qs}`).then((r) => r.json()),
    ])
    setProviders(p.providers || [])
    setConnections(c.connections || [])
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs])

  const statusFor = (providerKey: string) => {
    const conn = connections.find((c) => c.provider === providerKey && !c.isInherited)
    const inherited = connections.find((c) => c.provider === providerKey && c.isInherited)
    return { conn, inherited }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Providers</CardTitle>
        <CardDescription>Connect providers and manage credentials per context.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {providers.map((p) => {
          const s = statusFor(p.id)
          const state = s.conn?.status || (s.inherited ? `INHERITED:${s.inherited.status}` : 'DISCONNECTED')
          return (
            <div key={p.id} className="border rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{p.name}</div>
                  <div className="text-sm text-muted-foreground truncate">{p.description || p.id}</div>
                </div>
                <Badge variant={state.startsWith('CONNECTED') ? 'default' : 'secondary'}>{state}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`${basePath}/apps/webhooks/providers/${p.id}`}>Manage</Link>
                </Button>
                {p.webhookSupported ? <Badge variant="outline">Webhooks</Badge> : null}
                {p.oauthSupported ? <Badge variant="outline">OAuth</Badge> : <Badge variant="outline">Webhook</Badge>}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
