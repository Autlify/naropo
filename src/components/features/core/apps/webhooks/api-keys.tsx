'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui-2/button'
import { ButtonGroup } from "@/components/ui-2/button-group"
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter, 
  DialogHeader,
  DialogTitle,
} from "@/components/ui-2/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui-2/card'
import { Input } from '@/components/ui-2/input'
import { Label } from '@/components/ui-2/label'
import { Badge } from '@/components/ui-2/badge'
import { FaCopy, FaEye, FaTrash } from 'react-icons/fa6'
import { Plus, Loader2 } from 'lucide-react'
import { DataTable } from '@/components/global/data-table'
import { ColumnDef } from '@tanstack/react-table'

type ScopeProps = { agencyId?: string; subAccountId?: string }

type ApiKeyRow = {
  id: string
  name: string
  keyPrefix: string
  keyType: string
  secretHash: string
  revokedAt: string | null
  createdAt: string
}

/** Mask a string showing first 4 and last 4 characters */
function maskSecret(value: string | null | undefined, showFull = false): string {
  if (!value) return '—'
  if (showFull) return value
  if (value.length <= 12) return '••••••••'
  return `${value.slice(0, 4)}••••••••${value.slice(-4)}`
}

export function WebhooksApiKeysPanel(props: ScopeProps) {
  const router = useRouter()
  const qs = useMemo(() => {
    const p = new URLSearchParams()
    if (props.agencyId) p.set('agencyId', props.agencyId)
    if (props.subAccountId) p.set('subAccountId', props.subAccountId)
    return p.toString()
  }, [props.agencyId, props.subAccountId])

  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>([])
  const [busy, setBusy] = useState(false)

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [keyName, setKeyName] = useState('')
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewingKey, setViewingKey] = useState<{ id: string; name: string; secret: string } | null>(null)
  const [createdSecret, setCreatedSecret] = useState<string | null>(null)

  const reload = async () => {
    const k = await fetch(`/api/features/core/webhooks/api-keys?${qs}`).then((r) => r.json())
    setApiKeys(k.apiKeys || [])
  }

  useEffect(() => {
    void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs])

  const createKey = async () => {
    if (!keyName.trim()) return
    setBusy(true)
    try {
      const res = await fetch(`/api/features/core/webhooks/api-keys?${qs}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: keyName.trim() }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        setCreatedSecret(json.apiKey?.apiKey || null)
        setKeyName('')
        setCreateModalOpen(false)
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

  const viewKey = async (id: string, name: string) => {
    setBusy(true)
    try {
      const res = await fetch(`/api/features/core/webhooks/api-keys/${id}?${qs}`)
      const json = await res.json().catch(() => ({}))
      if (res.ok) {
        await reload()
        const apiKey = json.apiKey?.apiKey || json.apiKey?.secretHash || null
        if (apiKey) {
          setViewingKey({ id, name, secret: apiKey })
          setViewModalOpen(true)
        } else {
          alert('Failed to retrieve API key value. It can only be viewed once at creation.')
        }
      } else {
        alert(json.error || 'Failed to retrieve API key')
      }
    } finally {
      setBusy(false)
    }
  }

  const columns: ColumnDef<ApiKeyRow>[] = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'keyPrefix', header: 'Key Prefix' },
    { accessorKey: 'keyType', header: 'Type' },
    {
      accessorKey: 'secretHash',
      header: 'Secret',
      cell: ({ getValue }) => (
        <code className="text-xs text-muted-foreground">{maskSecret(getValue() as string)}</code>
      ),
    },
    {
      accessorKey: 'revokedAt',
      header: 'Status',
      cell: ({ getValue }) => (
        <Badge variant={getValue() ? 'secondary' : 'default'}>
          {getValue() ? 'Revoked' : 'Active'}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ getValue }) => {
        const date = getValue() as string
        return date ? new Date(date).toLocaleDateString() : '—'
      },
    },
    {
      accessorKey: 'id',
      header: 'Actions',
      enableHiding: false,
      cell: ({ row }) => {
        const id = row.getValue('id') as string
        const name = row.getValue('name') as string
        const revokedAt = row.getValue('revokedAt') as string | null
        const secretHash = row.getValue('secretHash') as string
        return (
          <ButtonGroup>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => viewKey(id, name)}
              disabled={busy}
              title="View key"
            >
              <FaEye className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyKey(secretHash)}
              title="Copy hash"
            >
              <FaCopy className="h-3 w-3" />
            </Button>
            {!revokedAt && (
              <Button
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => revokeKey(id)}
                title="Revoke key"
                className="text-destructive hover:text-destructive"
              >
                <FaTrash className="h-3 w-3" />
              </Button>
            )}
          </ButtonGroup>
        )
      },
    },
  ]

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Server-to-server API keys. The secret is shown once. Store it in your environment variables.
            </CardDescription>
          </div>
          <Button onClick={() => setCreateModalOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Create Key
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Newly created secret banner */}
          {createdSecret && (
            <div className="rounded-xl border border-brand-bg/30 bg-brand-bg/5 p-4">
              <div className="text-sm font-medium text-brand-bg">New API Key Created (copy now)</div>
              <div className="mt-2 flex items-center gap-3">
                <code className="flex-1 text-xs break-all bg-muted p-2 rounded">{createdSecret}</code>
                <Button variant="outline" size="sm" onClick={() => copyKey(createdSecret)}>
                  <FaCopy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setCreatedSecret(null)}>
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {/* Data Table - show only active keys */}
          <DataTable 
            key={apiKeys.map(k => k.id).join('-')}
            columns={columns}
            data={apiKeys.filter(k => !k.revokedAt)}
            searchColumn="name"
            searchPlaceholder="Search keys..."
            showPagination={apiKeys.length > 10}
          />
        </CardContent>
      </Card>

      {/* Create Key Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Give your API key a descriptive name to identify it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="keyName">Key Name</Label>
              <Input
                id="keyName"
                placeholder="e.g., Production Server, CI/CD Pipeline"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && keyName.trim()) {
                    createKey()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createKey} disabled={busy || !keyName.trim()}>
              {busy && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Create Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Key Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>API Key Details</DialogTitle>
            <DialogDescription>
              {viewingKey?.name || 'API Key'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Secret Key</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs break-all bg-muted p-3 rounded border">
                  {viewingKey?.secret || '—'}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => viewingKey?.secret && copyKey(viewingKey.secret)}
                >
                  <FaCopy className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Store this securely. You won't be able to view the full key again.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
