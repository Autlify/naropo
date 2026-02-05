'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { scopeQuery, type SupportScope } from './types'

type Ticket = {
  id: string
  createdAt: string
  status: string
  category: string
  title: string
  description: string | null
}

async function safeJson(res: Response) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

function toneForStatus(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'OPEN':
      return 'default'
    case 'IN_PROGRESS':
      return 'secondary'
    case 'RESOLVED':
    case 'CLOSED':
      return 'outline'
    default:
      return 'outline'
  }
}

export function SupportTicketsPanel({ scope }: { scope: SupportScope }) {
  const base = '/api/features/core/support'
  const qp = useMemo(() => scopeQuery(scope), [scope])

  // Build proper headers for scope context
  const scopeHeaders = useMemo((): HeadersInit => {
    if (scope.type === 'AGENCY') {
      return { 'x-autlify-agency': scope.agencyId }
    }
    return { 'x-autlify-subaccount': scope.subaccountId }
  }, [scope])

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setError(null)
    setLoading(true)
    try {
      const r = await fetch(`${base}/tickets?${qp}`, { headers: scopeHeaders, cache: 'no-store' })
      if (!r.ok) {
        const j = await safeJson(r)
        throw new Error(j?.error || `Request failed (${r.status})`)
      }
      const j = await safeJson(r)
      setTickets((j?.tickets || []) as Ticket[])
    } catch (e: any) {
      setError(e?.message || 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qp])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>Tickets</CardTitle>
              <CardDescription>All tickets for this scope. Newest first.</CardDescription>
            </div>
            <Button variant="outline" className="rounded-xl" onClick={load} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? <div className="text-sm text-muted-foreground">{error}</div> : null}

          {tickets.length === 0 && !loading ? (
            <div className="text-sm text-muted-foreground">No tickets yet.</div>
          ) : null}

          {tickets.map((t) => (
            <div key={t.id} className="rounded-xl border p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{t.title}</div>
                <div className="flex items-center gap-2">
                  <Badge variant={toneForStatus(t.status)}>{t.status}</Badge>
                  <Badge variant="outline">{t.category}</Badge>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(t.createdAt).toLocaleString()}
              </div>
              {t.description ? (
                <>
                  <Separator />
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">{t.description}</div>
                </>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
