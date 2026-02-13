'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Globe, Power, Rocket } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { deactivateFunnel, setFunnelPublished } from '@/lib/features/crm/funnels/actions'

type Props = {
  subAccountId: string
  funnelId: string
  published: boolean
  subDomainName: string | null
}

export function FunnelHeaderActions(props: Props) {
  const router = useRouter()
  const [busy, setBusy] = React.useState(false)

  const scheme = process.env.NEXT_PUBLIC_SCHEME ?? 'https://'
  const domain = process.env.NEXT_PUBLIC_DOMAIN ?? ''
  const liveUrl = props.subDomainName && domain ? `${scheme}${props.subDomainName}.${domain}` : null

  const run = async (fn: () => Promise<any>, ok: { title: string; description?: string }) => {
    try {
      setBusy(true)
      await fn()
      toast({ open: true, title: ok.title, description: ok.description })
      router.refresh()
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong'
      toast({ open: true, variant: 'destructive', title: 'Action failed', description: message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={props.published ? 'default' : 'secondary'}>
        {props.published ? `Live${props.subDomainName ? ` · ${props.subDomainName}` : ''}` : 'Draft'}
      </Badge>

      {liveUrl && props.published ? (
        <Button asChild variant="secondary" size="sm" disabled={busy} className="gap-2">
          <a href={liveUrl} target="_blank" rel="noreferrer">
            <Globe className="h-4 w-4" /> Open live
          </a>
        </Button>
      ) : null}

      <Button
        type="button"
        size="sm"
        disabled={busy}
        className="gap-2"
        onClick={() =>
          run(
            () =>
              setFunnelPublished({
                subAccountId: props.subAccountId,
                funnelId: props.funnelId,
                published: !props.published,
              }),
            { title: props.published ? 'Unpublished' : 'Published' }
          )
        }
      >
        <Rocket className="h-4 w-4" /> {props.published ? 'Unpublish' : 'Publish'}
      </Button>

      <Button
        type="button"
        size="sm"
        variant="destructive"
        disabled={busy}
        className="gap-2"
        onClick={() => {
          if (!confirm('Deactivate this funnel? This will unpublish and remove its subdomain.')) return
          return run(
            () => deactivateFunnel({ subAccountId: props.subAccountId, funnelId: props.funnelId }),
            { title: 'Deactivated' }
          )
        }}
      >
        <Power className="h-4 w-4" /> Deactivate
      </Button>

      <Button asChild variant="ghost" size="sm" disabled={busy}>
        <Link href={`/subaccount/${props.subAccountId}/funnels`}>Back</Link>
      </Button>
    </div>
  )
}
