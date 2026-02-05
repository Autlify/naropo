'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type Props = {
  basePath: string
}

const ITEMS = [
  { key: 'wizard', label: 'Wizard', href: 'wizard' },
  { key: 'tickets', label: 'Tickets', href: 'tickets' },
] as const

export function SupportNav({ basePath }: Props) {
  const pathname = usePathname()
  return (
    <div className="flex flex-wrap gap-2">
      {ITEMS.map((it) => {
        const full = `${basePath}/${it.href}`
        const active = pathname === full || pathname.startsWith(full + '/')
        return (
          <Button
            key={it.key}
            asChild
            variant={active ? 'default' : 'outline'}
            size="sm"
            className={cn('rounded-xl')}
          >
            <Link href={full}>{it.label}</Link>
          </Button>
        )
      })}
    </div>
  )
}
