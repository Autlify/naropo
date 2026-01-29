'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { PlusCircle, RefreshCw, CreditCard, Zap } from 'lucide-react'

type Entitlement = {
  key: string
  title?: string
  creditEnabled?: boolean
  creditExpires?: boolean
  period?: string
  scope?: string
}

type BalanceRow = {
  featureKey: string
  balance: string
  expiresAt: string | null
}

export function CreditsClient(props: { agencyId: string; subAccountId?: string | null }) {
  const agencyId = props.agencyId
  const subAccountId = props.subAccountId ?? null
  const scope = subAccountId ? 'SUBACCOUNT' : 'AGENCY'

  const [loading, setLoading] = useState(true)
  const [balances, setBalances] = useState<BalanceRow[]>([])
  const [entitlements, setEntitlements] = useState<Record<string, any>>({})

  const [open, setOpen] = useState(false)
  const [featureKey, setFeatureKey] = useState<string>('')
  const [credits, setCredits] = useState<string>('100')
  const [topupMethod, setTopupMethod] = useState<'manual' | 'stripe'>('stripe')
  const [submitting, setSubmitting] = useState(false)

  const creditEnabledFeatures = useMemo(() => {
    const rows: Entitlement[] = Object.values(entitlements || {})
    return rows
      .filter((e) => e?.creditEnabled)
      .map((e) => ({ key: e.key, label: e.title ? `${e.title} (${e.key})` : e.key }))
      .sort((a, b) => a.key.localeCompare(b.key))
  }, [entitlements])

  const refresh = async () => {
    setLoading(true)
    try {
      const entUrl = new URL('/api/features/core/billing/entitlements/current', window.location.origin)
      entUrl.searchParams.set('agencyId', agencyId)
      if (subAccountId) entUrl.searchParams.set('subAccountId', subAccountId)
      const entRes = await fetch(entUrl.toString(), { cache: 'no-store' })
      const entData = await entRes.json()
      if (!entRes.ok) throw new Error(entData?.error || 'Failed to load entitlements')
      setEntitlements(entData?.entitlements ?? {})

      const balUrl = new URL('/api/features/core/billing/credits/balance', window.location.origin)
      balUrl.searchParams.set('agencyId', agencyId)
      if (subAccountId) balUrl.searchParams.set('subAccountId', subAccountId)
      balUrl.searchParams.set('scope', scope)
      const balRes = await fetch(balUrl.toString(), { cache: 'no-store' })
      const balData = await balRes.json()
      if (!balRes.ok || !balData?.ok) throw new Error(balData?.reason || 'Failed to load balances')
      setBalances(balData.balances ?? [])
    } catch (e: any) {
      toast.error(e?.message ?? 'Failed to load credits')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agencyId, subAccountId])

  useEffect(() => {
    if (!featureKey && creditEnabledFeatures.length) setFeatureKey(creditEnabledFeatures[0].key)
  }, [featureKey, creditEnabledFeatures])

  const onTopup = async () => {
    try {
      setSubmitting(true)
      const c = Math.max(1, Math.floor(Number(credits) || 0))
      if (!featureKey || c <= 0) {
        toast.error('Please select a feature and enter credits')
        return
      }

      if (topupMethod === 'stripe') {
        // Stripe checkout for paid credits
        const res = await fetch('/api/stripe/credits/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agencyId,
            subAccountId,
            featureKey,
            credits: c,
          }),
        })
        const data = await res.json()
        if (!res.ok || !data?.ok) throw new Error(data?.error || 'Failed to create checkout')

        // Redirect to Stripe checkout
        if (data.url) {
          window.location.href = data.url
        }
        return
      }

      // Manual/internal top-up (admin only)
      const res = await fetch('/api/features/core/billing/credits/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agencyId,
          subAccountId,
          scope,
          featureKey,
          credits: c,
          idempotencyKey: `ui-topup:${agencyId}:${subAccountId ?? 'null'}:${featureKey}:${Date.now()}`,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Top-up failed')

      toast.success('Credits added')
      setOpen(false)
      await refresh()
    } catch (e: any) {
      toast.error(e?.message ?? 'Top-up failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Credits & Top‑Up</h2>
              <Badge variant="secondary" className="font-mono text-xs">{scope}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Credit balances are used for internal overages and add-ons (per feature). This page is ready for Stripe-paid top-ups.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={refresh}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Top‑up credits
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Top‑up credits</DialogTitle>
                  <DialogDescription>
                    Purchase credits to use for features and add-ons.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Top-up Method</Label>
                    <RadioGroup value={topupMethod} onValueChange={(v) => setTopupMethod(v as 'manual' | 'stripe')} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="stripe" id="stripe" />
                        <Label htmlFor="stripe" className="flex items-center gap-2 cursor-pointer">
                          <CreditCard className="h-4 w-4" />
                          Pay with Card
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="manual" id="manual" />
                        <Label htmlFor="manual" className="flex items-center gap-2 cursor-pointer">
                          <Zap className="h-4 w-4" />
                          Manual (Admin)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>Feature</Label>
                    <Select value={featureKey} onValueChange={setFeatureKey}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select feature" />
                      </SelectTrigger>
                      <SelectContent>
                        {creditEnabledFeatures.map((f) => (
                          <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Credits</Label>
                    <Input value={credits} onChange={(e) => setCredits(e.target.value)} inputMode="numeric" />
                    {topupMethod === 'stripe' && (
                      <p className="text-xs text-muted-foreground">
                        Price: ${(Math.max(1, Number(credits) || 0) * 0.01).toFixed(2)} USD ($0.01 per credit, min $1.00)
                      </p>
                    )}
                    {topupMethod === 'manual' && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Manual top-up is for admin use only. No payment will be charged.
                      </p>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
                  <Button onClick={onTopup} disabled={submitting}>
                    {submitting ? 'Processing...' : topupMethod === 'stripe' ? 'Pay & Add Credits' : 'Add Credits'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Period</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-[240px]" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-[120px] ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[160px]" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                    </TableRow>
                  ))
                : balances.map((b) => {
                    const ent = entitlements?.[b.featureKey]
                    return (
                      <TableRow key={b.featureKey}>
                        <TableCell className="font-mono text-xs">{b.featureKey}</TableCell>
                        <TableCell className="text-right font-medium">{b.balance}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {b.expiresAt ? new Date(b.expiresAt).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{ent?.period ?? '—'}</TableCell>
                      </TableRow>
                    )
                  })}
              {!loading && balances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    No credit balances yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
