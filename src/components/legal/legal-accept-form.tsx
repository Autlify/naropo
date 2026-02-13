'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { LegalScope } from '@/lib/core/legal/documents'
import { LEGAL_DOCUMENTS } from '@/lib/core/legal/documents'

export function LegalAcceptForm({ scope }: { scope: LegalScope }) {
  const router = useRouter()
  const sp = useSearchParams()
  const nextUrl = sp.get('next') || '/'

  const required = useMemo(() => {
    return LEGAL_DOCUMENTS.filter((d) => d.scope === 'baseline' || (scope === 'billing' && d.scope === 'billing'))
  }, [scope])

  const [checked, setChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/legal/accept', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scope }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to record acceptance')
      }

      router.push(nextUrl)
      router.refresh()
    } catch (e: any) {
      setError(e?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="space-y-2">
          <h2 className="text-base font-semibold">Review and accept</h2>
          <p className="text-sm text-muted-foreground">
            To continue, please review the following legal documents.
          </p>
        </div>

        <ul className="mt-4 space-y-2 text-sm">
          {required.map((d) => (
            <li key={d.slug} className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">{d.title}</span>
              <Link href={`/legal/${d.slug}`} target="_blank" className="text-foreground/80 underline underline-offset-2 hover:text-foreground">
                Open
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex items-start gap-3">
          <Checkbox id="accept" checked={checked} onCheckedChange={(v) => setChecked(v === true)} className="mt-0.5" />
          <Label htmlFor="accept" className="text-xs leading-relaxed text-muted-foreground font-normal">
            I have read and agree to the documents listed above.
          </Label>
        </div>
      </div>

      <Button onClick={onSubmit} disabled={!checked || loading} className="w-full h-11 rounded-xl">
        {loading ? 'Saving…' : 'Accept and continue'}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        You can revisit these documents anytime from the Legal section.
      </p>
    </div>
  )
}
