'use client'

import * as React from 'react'
import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { 
  Check, 
  Loader2, 
  RefreshCw, 
  Link2, 
  Unlink2,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { OpenItem } from '@/types/finance'
import { OpenItemsTable } from '@/components/features/fi/general-ledger/open-items'
import { formatCurrency } from '@/lib/features/fi/general-ledger/utils/helpers'
import {
  clearOpenItems,
  reverseClearing,
  getOpenItems,
} from '@/lib/features/fi/general-ledger/actions/open-items'
import type { ReconciliationPanelProps, ReconciliationTriggerProps, ClearingFormProps } from '@/types/finance'

// ============================================================================
// Clearing Form
// ============================================================================

const ClearingForm = ({
  selectedItems,
  currency,
  onClear,
  onCancel,
  isPending,
}: ClearingFormProps) => {
  const [clearingDate, setClearingDate] = useState(new Date().toISOString().split('T')[0])
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')

  const totalDebit = selectedItems.reduce(
    (sum, item) => sum + (item.localRemainingAmount > 0 ? item.localRemainingAmount : 0), 
    0
  )
  const totalCredit = selectedItems.reduce(
    (sum, item) => sum + (item.localRemainingAmount < 0 ? Math.abs(item.localRemainingAmount) : 0), 
    0
  )
  const difference = totalDebit - totalCredit

  const isBalanced = Math.abs(difference) < 0.01

  return (
    <div className="space-y-6">
      <Alert variant={isBalanced ? 'default' : 'destructive'}>
        {isBalanced ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          <AlertCircle className="h-4 w-4" />
        )}
        <AlertTitle>{isBalanced ? 'Balanced' : 'Unbalanced'}</AlertTitle>
        <AlertDescription>
          {isBalanced ? (
            `Selected items are balanced and can be cleared.`
          ) : (
            `Difference: ${formatCurrency(difference, currency)}. Items must balance to be cleared.`
          )}
        </AlertDescription>
      </Alert>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="text-sm text-muted-foreground">Total Debit</div>
          <div className="text-lg font-semibold text-green-600 dark:text-green-400">
            {formatCurrency(totalDebit, currency)}
          </div>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="text-sm text-muted-foreground">Total Credit</div>
          <div className="text-lg font-semibold text-red-600 dark:text-red-400">
            {formatCurrency(totalCredit, currency)}
          </div>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="text-sm text-muted-foreground">Difference</div>
          <div className={`text-lg font-semibold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(Math.abs(difference), currency)}
          </div>
        </div>
      </div>

      {/* Selected Items */}
      <div>
        <Label className="text-sm font-medium">Selected Items ({selectedItems.length})</Label>
        <div className="mt-2 max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
          {selectedItems.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="font-mono">{item.documentNumber}</span>
              <span className={item.localRemainingAmount > 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(item.localRemainingAmount, currency)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Clearing Details */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="clearingDate">Clearing Date *</Label>
          <Input
            id="clearingDate"
            type="date"
            value={clearingDate}
            onChange={(e) => setClearingDate(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="reference">Clearing Reference</Label>
          <Input
            id="reference"
            placeholder="Auto-generated if empty"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Optional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 resize-none"
            rows={2}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button
          onClick={() => onClear(new Date(clearingDate), reference, notes)}
          disabled={!isBalanced || isPending}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Clear Items
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// Reconciliation Panel
// ============================================================================

const ReconciliationPanel = ({
  accountId,
  accountCode,
  accountName,
  openItems,
  baseUrl,
  currency = 'USD',
  onReconciliationComplete,
}: ReconciliationPanelProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showClearingForm, setShowClearingForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'open' | 'cleared'>('open')

  const selectedItems = openItems.filter((item) => selectedIds.has(item.id))

  const filteredItems = openItems.filter((item) => {
    if (filter === 'open') return item.status === 'OPEN' || item.status === 'PARTIALLY_CLEARED'
    if (filter === 'cleared') return item.status === 'CLEARED'
    return true
  })

  const handleClear = (clearingDate: Date, reference: string, notes: string) => {
    startTransition(async () => {
      try {
        // Build items with amounts
        const items = selectedItems.map(item => ({
          openItemId: item.id,
          clearAmount: item.localRemainingAmount,
          clearAmountDocument: item.documentRemainingAmount,
        }))

        const result = await clearOpenItems({
          items,
          clearingDocumentType: 'CLEARING',
          clearingDate,
          clearingDocumentNumber: reference || undefined,
          notes: notes || undefined,
          postExchangeDifference: true,
        })

        if (result.success) {
          toast.success(`Cleared ${selectedIds.size} items`)
          setSelectedIds(new Set())
          setShowClearingForm(false)
          router.refresh()
          onReconciliationComplete?.()
        } else {
          toast.error(result.error ?? 'Failed to clear items')
        }
      } catch {
        toast.error('An error occurred')
      }
    })
  }

  const handleUnclear = (clearingRef: string) => {
    startTransition(async () => {
      try {
        const result = await reverseClearing({ 
          clearingDocumentNumber: clearingRef,
          reason: 'Manual unclear',
        })

        if (result.success) {
          toast.success('Item uncleared')
          router.refresh()
        } else {
          toast.error(result.error ?? 'Failed to unclear item')
        }
      } catch {
        toast.error('An error occurred')
      }
    })
  }

  // Summary stats
  const totalOpen = openItems.filter((i) => i.status === 'OPEN').length
  const totalCleared = openItems.filter((i) => i.status === 'CLEARED').length
  const openBalance = openItems
    .filter((i) => i.status === 'OPEN')
    .reduce((sum, i) => sum + i.localRemainingAmount, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Reconciliation
            </CardTitle>
            <CardDescription>
              {accountCode} - {accountName}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.refresh()}
            disabled={isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
            <div className="text-sm text-amber-700 dark:text-amber-300">Open Items</div>
            <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">{totalOpen}</div>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <div className="text-sm text-green-700 dark:text-green-300">Cleared Items</div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{totalCleared}</div>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="text-sm text-blue-700 dark:text-blue-300">Open Balance</div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {formatCurrency(openBalance, currency)}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="open">Open Only</SelectItem>
                <SelectItem value="cleared">Cleared Only</SelectItem>
              </SelectContent>
            </Select>

            {selectedIds.size > 0 && (
              <Badge variant="secondary">
                {selectedIds.size} selected
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear Selection
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowClearingForm(true)}
                  disabled={selectedIds.size < 2}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Clear Selected ({selectedIds.size})
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Items Table */}
        <OpenItemsTable
          items={filteredItems}
          baseUrl={baseUrl}
          selectable={filter !== 'cleared'}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          showAccount={false}
          showPartner={true}
          showStatus={true}
          emptyMessage={filter === 'open' ? 'No open items to reconcile' : 'No items found'}
        />

        {/* Help Message */}
        {filter === 'open' && filteredItems.length > 0 && selectedIds.size === 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>How to Reconcile</AlertTitle>
            <AlertDescription>
              Select 2 or more items that offset each other (debits and credits that sum to zero),
              then click &quot;Clear Selected&quot; to reconcile them.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      {/* Clearing Form Sheet */}
      <Sheet open={showClearingForm} onOpenChange={setShowClearingForm}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Clear Open Items</SheetTitle>
            <SheetDescription>
              Review and confirm clearing of selected items
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <ClearingForm
              selectedItems={selectedItems}
              currency={currency}
              onClear={handleClear}
              onCancel={() => setShowClearingForm(false)}
              isPending={isPending}
            />
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  )
}

// ============================================================================
// Reconciliation Trigger (Sheet wrapper for quick access)
// ============================================================================

const ReconciliationTrigger = ({
  accountId,
  accountCode,
  accountName,
  trigger,
  onComplete,
}: ReconciliationTriggerProps) => {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<OpenItem[]>([])
  const [loading, setLoading] = useState(false)

  const loadItems = useCallback(async () => {
    if (!open) return
    setLoading(true)
    try {
      const result = await getOpenItems({ 
        accountId,
        includeZeroBalance: false,
        page: 1,
        pageSize: 500,
        sortBy: 'documentDate',
        sortOrder: 'desc',
      })
      if (result.success && result.data) {
        setItems(result.data.items as unknown as OpenItem[])
      }
    } catch {
      toast.error('Failed to load items')
    } finally {
      setLoading(false)
    }
  }, [accountId, open])

  React.useEffect(() => {
    loadItems()
  }, [loadItems])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Link2 className="h-4 w-4 mr-2" />
            Reconcile
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Account Reconciliation</SheetTitle>
          <SheetDescription>
            {accountCode} - {accountName}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <ReconciliationPanel
              accountId={accountId}
              accountCode={accountCode}
              accountName={accountName}
              openItems={items}
              baseUrl={`/agency/fi/general-ledger/open-items`}
              onReconciliationComplete={() => {
                loadItems()
                onComplete?.()
              }}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export { ReconciliationPanel, ReconciliationTrigger, ClearingForm }
export type { ReconciliationPanelProps, ReconciliationTriggerProps, ClearingFormProps }