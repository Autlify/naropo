'use client'

import * as React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import  {ClientSafeProvider}  from 'next-auth/react'

type Props = {
  providers: Record<string, ClientSafeProvider> | null
  disabled?: boolean
  onSignIn: (providerId: string) => void
  className?: string
}

type ProviderUI = {
  id: string
  label: string
  icon?: { src: string; invert?: boolean }
}

const PROVIDER_UI: Record<string, ProviderUI> = {
  keycloak: { id: 'keycloak', label: 'Keycloak', icon: { src: '/logos/keycloak.svg' } },
  zitadel: { id: 'zitadel', label: 'Zitadel', icon: { src: '/logos/zitadel.svg' } },
  'microsoft-entra-id': { id: 'microsoft-entra-id', label: 'Microsoft', icon: { src: '/logos/microsoft.svg' } },
  github: { id: 'github', label: 'GitHub', icon: { src: '/logos/github.svg', invert: true } },
}

const DEFAULT_ORDER = ['keycloak', 'zitadel', 'microsoft-entra-id', 'github']

function resolveProviderLabel(provider: ClientSafeProvider): ProviderUI {
  const ui = PROVIDER_UI[provider.id]
  if (ui) return ui
  return { id: provider.id, label: provider.name || provider.id }
}

export function OAuthProviderButtons({ providers, disabled, onSignIn, className }: Props) {
  const list = React.useMemo(() => {
    if (!providers) return []
    const ids = Object.keys(providers).filter((id) => id !== 'credentials')

    const ordered: string[] = []
    for (const id of DEFAULT_ORDER) if (ids.includes(id)) ordered.push(id)
    for (const id of ids) if (!ordered.includes(id)) ordered.push(id)

    return ordered.map((id) => providers[id]).filter(Boolean)
  }, [providers])

  if (!list.length) return null

  return (
    <div className={cn('space-y-2', className)}>
      {list.map((p) => {
        const ui = resolveProviderLabel(p)
        return (
          <Button
            key={p.id}
            type="button"
            variant="outline"
            className="h-11 w-full justify-start gap-3 rounded-xl px-3"
            disabled={!!disabled}
            onClick={() => onSignIn(p.id)}
          >
            {ui.icon ? (
              <span className="relative h-5 w-5">
                <Image
                  src={ui.icon.src}
                  alt={ui.label}
                  fill
                  sizes="20px"
                  className={cn('object-contain', ui.icon.invert && 'brightness-0 invert')}
                />
              </span>
            ) : (
              <span className="h-5 w-5 rounded bg-muted" />
            )}
            <span className="text-sm font-medium">Continue with {ui.label}</span>
          </Button>
        )
      })}
    </div>
  )
}
