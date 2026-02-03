'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { scopeQuery, type SupportScope } from './types'

type Category = 'BILLING' | 'WEBHOOKS' | 'ACCESS' | 'BUG' | 'OTHER'

const CATEGORY_LABELS: Record<Category, string> = {
  BILLING: 'Billing / Subscription',
  WEBHOOKS: 'Webhooks / Deliveries',
  ACCESS: 'Access / Permissions',
  BUG: 'Bug / UI issue',
  OTHER: 'Other',
}

async function safeJson(res: Response) {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export function SupportWizardPanel({ scope }: { scope: SupportScope }) {
  const base = '/api/features/core/support'
  const qp = useMemo(() => scopeQuery(scope), [scope])

  const [category, setCategory] = useState<Category>('BILLING')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [diagnostics, setDiagnostics] = useState<any>(null)
  const [diagLoading, setDiagLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const canRunBilling = category === 'BILLING'
  const canRunWebhooks = category === 'WEBHOOKS'

  const runDiagnostics = async () => {
    setNotice(null)
    setDiagLoading(true)
    try {
      const parts: any = {}
      if (canRunBilling) {
        const r = await fetch(`${base}/diagnostics/billing?${qp}`, { cache: 'no-store' })
        parts.billing = await safeJson(r)
      }
      if (canRunWebhooks) {
        const r = await fetch(`${base}/diagnostics/webhooks?${qp}`, { cache: 'no-store' })
        parts.webhooks = await safeJson(r)
      }
      // Lightweight context (always helpful)
      parts.client = {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        time: new Date().toISOString(),
      }
      setDiagnostics(parts)
    } catch (e: any) {
      setNotice(e?.message || 'Failed to run diagnostics')
    } finally {
      setDiagLoading(false)
    }
  }

  const submit = async () => {
    setNotice(null)
    setSubmitLoading(true)
    try {
      const payload = {
        category,
        title: title || `${CATEGORY_LABELS[category]} issue`,
        description,
        diagnostics,
      }
      const r = await fetch(`${base}/tickets?${qp}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!r.ok) {
        const j = await safeJson(r)
        throw new Error(j?.error || `Request failed (${r.status})`)
      }
      setTitle('')
      setDescription('')
      setNotice('Ticket created. You can view it in Tickets.')
    } catch (e: any) {
      setNotice(e?.message || 'Failed to create ticket')
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Guided Troubleshooting</CardTitle>
          <CardDescription>
            Capture the essentials quickly. If you run diagnostics, the snapshot will be attached to the ticket.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-sm font-medium">Category</div>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                    <SelectItem key={k} value={k}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Title</div>
              <Input
                className="rounded-xl"
                placeholder="Short summary"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Details</div>
            <Textarea
              className="min-h-[140px] rounded-xl"
              placeholder="What were you doing? What did you expect? What happened instead?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Separator />

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={runDiagnostics}
              disabled={diagLoading}
            >
              {diagLoading ? 'Running diagnostics…' : 'Run diagnostics'}
            </Button>

            {(canRunBilling || canRunWebhooks) ? (
              <Badge variant="secondary">
                Includes: {canRunBilling ? 'billing' : null}
                {canRunBilling && canRunWebhooks ? ', ' : null}
                {canRunWebhooks ? 'webhooks' : null}
              </Badge>
            ) : (
              <Badge variant="outline">No automated diagnostics for this category</Badge>
            )}

            <div className="flex-1" />

            <Button
              type="button"
              className="rounded-xl"
              onClick={submit}
              disabled={submitLoading || !description.trim()}
            >
              {submitLoading ? 'Submitting…' : 'Create ticket'}
            </Button>
          </div>

          {notice ? <div className="text-sm text-muted-foreground">{notice}</div> : null}

          {diagnostics ? (
            <div className="rounded-xl border p-4">
              <div className="text-sm font-medium mb-2">Diagnostics snapshot</div>
              <pre className="text-xs overflow-auto max-h-[260px] whitespace-pre-wrap">
                {JSON.stringify(diagnostics, null, 2)}
              </pre>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick tips</CardTitle>
          <CardDescription>These reduce back-and-forth for 90% of cases.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <div>• Billing issues: confirm plan status and whether the feature is entitled (Add-on vs base).</div>
          <div>• Webhooks: check Deliveries for recent failures and retry from Deliveries detail.</div>
          <div>• Access: verify your role has the required permission keys and that the gate is enabled by entitlement.</div>
        </CardContent>
      </Card>
    </div>
  )
}
