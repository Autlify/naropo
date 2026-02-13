'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Copy, Power, Rocket, Settings, Globe } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/use-toast'
import type { FunnelsForSubAccount } from '@/lib/types'
import { deactivateFunnel, duplicateFunnel, setFunnelPublished } from '@/lib/features/crm/funnels/actions'

export function FunnelRowActions({ funnel }: { funnel: FunnelsForSubAccount }) {
  const router = useRouter()
  const [busy, setBusy] = React.useState(false)

  const scheme = process.env.NEXT_PUBLIC_SCHEME ?? 'https://'
  const domain = process.env.NEXT_PUBLIC_DOMAIN ?? ''
  const liveUrl = funnel.subDomainName && domain ? `${scheme}${funnel.subDomainName}.${domain}` : null

  const run = async (fn: () => Promise<any>, success: { title: string; description?: string }) => {
    try {
      setBusy(true)
      await fn()
      toast({ open: true, title: success.title, description: success.description })
      router.refresh()
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong'
      toast({ open: true, variant: 'destructive', title: 'Action failed', description: message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={busy} aria-label="Open funnel actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>

        <DropdownMenuItem asChild>
          <Link href={`/subaccount/${funnel.subAccountId}/funnels/${funnel.id}`} className="flex items-center gap-2">
            <Settings className="h-4 w-4" /> Manage
          </Link>
        </DropdownMenuItem>

        {liveUrl && funnel.published ? (
          <DropdownMenuItem asChild>
            <a href={liveUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2">
              <Globe className="h-4 w-4" /> Open live
            </a>
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() =>
            run(
              () =>
                setFunnelPublished({
                  subAccountId: funnel.subAccountId,
                  funnelId: funnel.id,
                  published: !funnel.published,
                }),
              {
                title: funnel.published ? 'Funnel unpublished' : 'Funnel published',
              }
            )
          }
          className="flex items-center gap-2"
          disabled={busy}
        >
          <Rocket className="h-4 w-4" /> {funnel.published ? 'Unpublish' : 'Publish'}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            run(
              () => duplicateFunnel({ subAccountId: funnel.subAccountId, funnelId: funnel.id }),
              { title: 'Funnel duplicated' }
            )
          }
          className="flex items-center gap-2"
          disabled={busy}
        >
          <Copy className="h-4 w-4" /> Duplicate
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            if (!confirm('Deactivate this funnel? This will unpublish and remove its subdomain.')) return
            return run(
              () => deactivateFunnel({ subAccountId: funnel.subAccountId, funnelId: funnel.id }),
              { title: 'Funnel deactivated' }
            )
          }}
          className="flex items-center gap-2 text-destructive focus:text-destructive"
          disabled={busy}
        >
          <Power className="h-4 w-4" /> Deactivate
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
