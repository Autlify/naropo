'use client'

/**
 * Tax Codes Manager
 * - CRUD, default code, activation toggle
 * - Stored via FI-TAX connector settings (server actions)
 */

import { useMemo, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import {
  applyTaxTemplate,
  deleteTaxCode,
  setDefaultTaxCode,
  setTaxCodeActive,
  upsertTaxCode,
} from '@/lib/features/fi/general-ledger/actions/tax-settings'
import {
  taxCodeSchema,
  taxTypeEnum,
  TAX_TEMPLATES,
  type TaxTemplateKey,
} from '@/lib/schemas/fi/general-ledger/tax'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MoreHorizontal, Pencil, Plus, Star, Trash2, Wand2 } from 'lucide-react'

import type { TaxType } from '@/lib/schemas/fi/general-ledger/tax'

// Use the schema *input* type for react-hook-form values (pre-parse),
// which matches what `zodResolver` expects when the schema applies defaults.
type TaxCodeFormValues = z.input<typeof taxCodeSchema>

interface TaxCodeRow {
  code: string
  name: string
  description?: string
  rate: number
  type: TaxType
  accountId?: string | null
  isDefault?: boolean
  isActive?: boolean
}

interface Account {
  id: string
  code: string
  name: string
}

interface Props {
  agencyId: string
  canEdit: boolean
  taxCodes: TaxCodeRow[]
  accounts: Account[]
}

const TYPE_BADGE: Record<TaxType, string> = {
  INPUT: 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200',
  OUTPUT: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  WITHHOLDING: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  EXEMPT: 'bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-200',
}

const templateKeys = Object.keys(TAX_TEMPLATES) as TaxTemplateKey[]

export function TaxCodesTable({ agencyId, canEdit, taxCodes, accounts }: Props) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<TaxCodeRow | null>(null)
  const [deleteCode, setDeleteCode] = useState<string | null>(null)
  const [template, setTemplate] = useState<TaxTemplateKey>('NONE')

  const accountLabel = useMemo(() => {
    const map = new Map(accounts.map((a) => [a.id, `${a.code} — ${a.name}`]))
    return (id?: string | null) => (id ? map.get(id) ?? id : 'Unassigned')
  }, [accounts])

  const form = useForm<TaxCodeFormValues>({
    resolver: zodResolver(taxCodeSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      rate: 0,
      type: taxTypeEnum.enum.OUTPUT,
      accountId: null,
      reverseChargeAccountId: null,
      isDefault: false,
      isActive: true,
    },
  })

  const openCreate = () => {
    setEditing(null)
    form.reset({
      code: '',
      name: '',
      description: '',
      rate: 0,
      type: taxTypeEnum.enum.OUTPUT,
      accountId: null,
      reverseChargeAccountId: null,
      isDefault: false,
      isActive: true,
    })
    setOpen(true)
  }

  const openEdit = (row: TaxCodeRow) => {
    setEditing(row)
    form.reset({
      code: row.code,
      name: row.name,
      description: row.description ?? '',
      rate: row.rate,
      type: row.type,
      accountId: row.accountId ?? null,
      reverseChargeAccountId: null,
      isDefault: !!row.isDefault,
      isActive: row.isActive !== false,
    })
    setOpen(true)
  }

  const save = (values: TaxCodeFormValues) => {
    if (!canEdit) return
    startTransition(async () => {
      // Parse to schema *output* so defaults are applied (e.g. isDefault/isActive become required booleans).
      const parsed = taxCodeSchema.safeParse(values)
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? 'Invalid tax code')
        return
      }

      const res = await upsertTaxCode(agencyId, parsed.data)
      if (!res.success) {
        toast.error(res.error ?? 'Failed to save tax code')
        return
      }
      toast.success(editing ? 'Tax code updated' : 'Tax code created')
      setOpen(false)
      setEditing(null)
    })
  }

  const setDefault = (code: string) => {
    if (!canEdit) return
    startTransition(async () => {
      const res = await setDefaultTaxCode(agencyId, code)
      if (!res.success) {
        toast.error(res.error ?? 'Failed to set default')
        return
      }
      toast.success(`${code} set as default`)
    })
  }

  const toggleActive = (code: string, active: boolean) => {
    if (!canEdit) return
    startTransition(async () => {
      const res = await setTaxCodeActive(agencyId, code, active)
      if (!res.success) {
        toast.error(res.error ?? 'Failed to update status')
        return
      }
      toast.success(active ? `${code} activated` : `${code} deactivated`)
    })
  }

  const confirmDelete = () => {
    if (!deleteCode || !canEdit) return
    startTransition(async () => {
      const res = await deleteTaxCode(agencyId, deleteCode)
      if (!res.success) {
        toast.error(res.error ?? 'Failed to delete')
        return
      }
      toast.success('Tax code deleted')
      setDeleteCode(null)
    })
  }

  const applyTemplate = () => {
    if (!canEdit) return
    startTransition(async () => {
      const res = await applyTaxTemplate(agencyId, template)
      if (!res.success) {
        toast.error(res.error ?? 'Failed to apply template')
        return
      }
      toast.success(`Applied template: ${TAX_TEMPLATES[template].name}`)
    })
  }

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold tracking-tight">Tax codes</div>
          <div className="text-sm text-muted-foreground">
            Codes are used by AR/AP (invoices, bills) and GL postings to classify and report tax.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Select value={template} onValueChange={(v) => setTemplate(v as TaxTemplateKey)} disabled={!canEdit || isPending}>
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue placeholder="Template" />
              </SelectTrigger>
              <SelectContent>
                {templateKeys.map((k) => (
                  <SelectItem key={k} value={k}>
                    {TAX_TEMPLATES[k].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="secondary" className="h-9" disabled={!canEdit || isPending} onClick={applyTemplate}>
              <Wand2 className="mr-2 h-4 w-4" />
              Apply
            </Button>
          </div>

          <Button className="h-9" onClick={openCreate} disabled={!canEdit || isPending}>
            <Plus className="mr-2 h-4 w-4" />
            New code
          </Button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-[140px]">Type</TableHead>
              <TableHead className="w-[120px] text-right">Rate</TableHead>
              <TableHead>Account</TableHead>
              <TableHead className="w-[120px] text-center">Default</TableHead>
              <TableHead className="w-[110px] text-center">Active</TableHead>
              <TableHead className="w-[64px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taxCodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                  No tax codes configured yet.
                </TableCell>
              </TableRow>
            ) : (
              taxCodes.map((c) => (
                <TableRow key={c.code} className={isPending ? 'opacity-50' : ''}>
                  <TableCell>
                    <span className="font-mono text-xs font-semibold tracking-wide">{c.code}</span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="font-medium">{c.name}</div>
                      {c.description ? (
                        <div className="text-xs text-muted-foreground line-clamp-1">{c.description}</div>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={TYPE_BADGE[c.type]}>
                      {c.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{Number(c.rate).toFixed(2)}%</TableCell>
                  <TableCell className="text-sm">{accountLabel(c.accountId)}</TableCell>
                  <TableCell className="text-center">
                    {c.isDefault ? <Star className="mx-auto h-4 w-4 fill-yellow-400 text-yellow-400" /> : null}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={c.isActive !== false}
                      disabled={!canEdit || isPending}
                      onCheckedChange={(v) => toggleActive(c.code, v)}
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isPending}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(c)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {!c.isDefault ? (
                          <DropdownMenuItem onClick={() => setDefault(c.code)}>
                            <Star className="mr-2 h-4 w-4" />
                            Set default
                          </DropdownMenuItem>
                        ) : null}
                        {canEdit ? (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteCode(c.code)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null) }}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.code}` : 'New tax code'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(save)} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <div className="text-xs font-medium text-muted-foreground">Code</div>
                <Input
                  {...form.register('code')}
                  placeholder="SR, ZR, EX..."
                  disabled={!!editing || !canEdit || isPending}
                  className="mt-1"
                />
                {form.formState.errors.code ? (
                  <p className="mt-1 text-xs text-destructive">{String(form.formState.errors.code.message)}</p>
                ) : null}
              </div>

              <div>
                <div className="text-xs font-medium text-muted-foreground">Type</div>
                <Select
                  value={form.watch('type')}
                  onValueChange={(v) => form.setValue('type', v as TaxType, { shouldValidate: true })}
                  disabled={!canEdit || isPending}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {taxTypeEnum.options.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground">Name</div>
              <Input {...form.register('name')} placeholder="Standard rated" disabled={!canEdit || isPending} className="mt-1" />
              {form.formState.errors.name ? (
                <p className="mt-1 text-xs text-destructive">{String(form.formState.errors.name.message)}</p>
              ) : null}
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground">Description</div>
              <Textarea {...form.register('description')} placeholder="Optional" disabled={!canEdit || isPending} className="mt-1" />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <div className="text-xs font-medium text-muted-foreground">Rate (%)</div>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register('rate', { valueAsNumber: true })}
                  disabled={!canEdit || isPending}
                  className="mt-1"
                />
                {form.formState.errors.rate ? (
                  <p className="mt-1 text-xs text-destructive">{String(form.formState.errors.rate.message)}</p>
                ) : null}
              </div>

              <div>
                <div className="text-xs font-medium text-muted-foreground">Posting account</div>
                <Select
                  value={form.watch('accountId') ?? ''}
                  onValueChange={(v) => form.setValue('accountId', v ? v : null, { shouldValidate: true })}
                  disabled={!canEdit || isPending}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.code} — {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
              <div>
                <div className="text-sm font-medium">Default</div>
                <div className="text-xs text-muted-foreground">
                  The default code can be auto-applied when enabled.
                </div>
              </div>
              <Switch
                checked={form.watch('isDefault')}
                onCheckedChange={(v) => form.setValue('isDefault', v)}
                disabled={!canEdit || isPending}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
              <div>
                <div className="text-sm font-medium">Active</div>
                <div className="text-xs text-muted-foreground">Inactive codes remain for history but won't be suggested.</div>
              </div>
              <Switch
                checked={form.watch('isActive') !== false}
                onCheckedChange={(v) => form.setValue('isActive', v)}
                disabled={!canEdit || isPending}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={!canEdit || isPending}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteCode} onOpenChange={(v) => !v && setDeleteCode(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tax code</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the code from your configuration. Existing documents that referenced it are not modified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
