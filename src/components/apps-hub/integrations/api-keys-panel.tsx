'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Copy, Trash2 } from 'lucide-react'

type ScopeProps = { agencyId?: string; subAccountId?: string }

export function IntegrationsApiKeysPanel(props: ScopeProps) {
  const qs = useMemo(() => {
    const p = new URLSearchParams()
    if (props.agencyId) p.set('agencyId', props.agencyId)
    if (props.subAccountId) p.set('subAccountId', props.subAccountId)
    return p.toString()
  }, [props.agencyId, props.subAccountId])

  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [keyName, setKeyName] = useState('')
  const [createdSecret, setCreatedSecret] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)


  const reload = async () => {
    const k = await fetch(`/api/features/core/webhooks/api-keys?${qs}`).then((r) => r.json())
    setApiKeys(k.apiKeys || [])
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs])

  const createKey = async () => {
    setBusy(true)
    try {
      const res = await fetch(`/api/features/core/webhooks/api-keys?${qs}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: keyName || 'Default' }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        setCreatedSecret(json.apiKey?.apiKey || null)
        setKeyName('')
        await reload()
      } else {
        alert(json.error || 'Failed to create key')
      }
    } finally {
      setBusy(false)
    }
  }

  const copyKey = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Copied to clipboard')
    } catch {
      alert('Failed to copy to clipboard')
    }
  }

  const revokeKey = async (id: string) => {
    if (!confirm('Revoke this key?')) return
    setBusy(true)
    try {
      const res = await fetch(`/api/features/core/webhooks/api-keys/${id}?${qs}`, { method: 'DELETE' })
      if (res.ok) await reload()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Keys</CardTitle>
        <CardDescription>
          Server-to-server API keys. The secret is shown once. Store it in your environment variables.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {createdSecret ? (
          <div className="rounded-xl border p-3">
            <div className="text-sm font-medium">New API Key (copy now)</div>
            <div className="mt-2 flex flex-col gap-2">
              <code className="text-xs break-all">{createdSecret}</code>
              <Button variant="outline" size="sm" onClick={() => setCreatedSecret(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input placeholder="Key name" value={keyName} onChange={(e) => setKeyName(e.target.value)} />
          <Button onClick={createKey} disabled={busy}>
            Create key
          </Button>
        </div>

        <div className="divide-y rounded-xl border">
          {apiKeys.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">No API keys yet.</div>
          ) : null}
          {apiKeys.map((k) => (
            <div key={k.id} className="p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{k.name}</div>
                <div className="text-xs text-muted-foreground">
                  {k.keyPrefix ? `Prefix: ${k.keyPrefix}` : '—'} • {k.revokedAt ? 'Revoked' : 'Active'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={k.revokedAt ? 'secondary' : 'default'}>{k.revokedAt ? 'REVOKED' : 'ACTIVE'}</Badge>
                {!k.revokedAt ? (
                  <Button variant="outline" size="sm" disabled={busy} onClick={() => revokeKey(k.id)}>
                    Revoke
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
