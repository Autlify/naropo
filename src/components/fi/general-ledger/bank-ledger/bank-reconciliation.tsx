'use client'

import * as React from 'react'
import { format } from 'date-fns'
import {
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  RefreshCw,
  Search,
  Undo2,
  Wallet
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  BankAccountSummary,
  BankTransaction,
  getBankTransactions,
  listBankAccounts,
  reconcileTransactions,
  unreconciledTransactions
} from '@/lib/features/fi/general-ledger/actions/bank-ledger'

// ========== Component ==========

const BankReconciliation = () => {
  const [accounts, setAccounts] = React.useState<BankAccountSummary[]>([])
  const [selectedAccount, setSelectedAccount] = React.useState<BankAccountSummary | null>(null)
  const [transactions, setTransactions] = React.useState<BankTransaction[]>([])
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoadingTxns, setIsLoadingTxns] = React.useState(false)
  const [isReconciling, setIsReconciling] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [filter, setFilter] = React.useState<'all' | 'reconciled' | 'unreconciled'>('all')
  const [page, setPage] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const pageSize = 50

  // Load bank accounts on mount
  React.useEffect(() => {
    const loadAccounts = async () => {
      setIsLoading(true)
      const result = await listBankAccounts()
      if (result.success && result.data) {
        setAccounts(result.data)
        if (result.data.length > 0) {
          setSelectedAccount(result.data[0])
        }
      } else {
        toast.error(result.error || 'Failed to load bank accounts')
      }
      setIsLoading(false)
    }
    loadAccounts()
  }, [])

  // Load transactions when account changes
  React.useEffect(() => {
    if (!selectedAccount) return

    const loadTransactions = async () => {
      setIsLoadingTxns(true)
      setSelectedIds(new Set())

      const result = await getBankTransactions(selectedAccount.id, {
        reconciledOnly: filter === 'all' ? undefined : filter === 'reconciled',
        page,
        pageSize
      })

      if (result.success && result.data) {
        setTransactions(result.data.transactions)
        setTotal(result.data.total)
      } else {
        toast.error(result.error || 'Failed to load transactions')
      }
      setIsLoadingTxns(false)
    }
    loadTransactions()
  }, [selectedAccount, filter, page])

  // Filter transactions by search
  const filteredTransactions = React.useMemo(() => {
    if (!search.trim()) return transactions
    const lower = search.toLowerCase()
    return transactions.filter(
      (t) =>
        t.entryNumber.toLowerCase().includes(lower) ||
        t.description.toLowerCase().includes(lower)
    )
  }, [transactions, search])

  // Select/deselect all
  const handleSelectAll = React.useCallback(() => {
    if (selectedIds.size === filteredTransactions.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredTransactions.map((t) => t.journalEntryId)))
    }
  }, [filteredTransactions, selectedIds])

  // Toggle single selection
  const handleToggle = React.useCallback((journalEntryId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(journalEntryId)) {
        next.delete(journalEntryId)
      } else {
        next.add(journalEntryId)
      }
      return next
    })
  }, [])

  // Reconcile selected
  const handleReconcile = async () => {
    if (!selectedAccount || selectedIds.size === 0) return

    setIsReconciling(true)
    const result = await reconcileTransactions(
      selectedAccount.id,
      Array.from(selectedIds),
      new Date()
    )

    if (result.success) {
      toast.success(`${result.data?.reconciled ?? 0} transaction(s) marked as reconciled`)
      // Reload transactions
      setSelectedIds(new Set())
      const refresh = await getBankTransactions(selectedAccount.id, {
        reconciledOnly: filter === 'all' ? undefined : filter === 'reconciled',
        page,
        pageSize
      })
      if (refresh.success && refresh.data) {
        setTransactions(refresh.data.transactions)
        setTotal(refresh.data.total)
      }
      // Reload accounts for updated balances
      const accountsResult = await listBankAccounts()
      if (accountsResult.success && accountsResult.data) {
        setAccounts(accountsResult.data)
        const updated = accountsResult.data.find((a) => a.id === selectedAccount.id)
        if (updated) setSelectedAccount(updated)
      }
    } else {
      toast.error(result.error || 'Failed to reconcile')
    }
    setIsReconciling(false)
  }

  // Unreconcile selected
  const handleUnreconcile = async () => {
    if (!selectedAccount || selectedIds.size === 0) return

    setIsReconciling(true)
    const result = await unreconciledTransactions(selectedAccount.id, Array.from(selectedIds))

    if (result.success) {
      toast.success(`${result.data?.unreconciledCount ?? 0} transaction(s) marked as unreconciled`)
      // Reload
      setSelectedIds(new Set())
      const refresh = await getBankTransactions(selectedAccount.id, {
        reconciledOnly: filter === 'all' ? undefined : filter === 'reconciled',
        page,
        pageSize
      })
      if (refresh.success && refresh.data) {
        setTransactions(refresh.data.transactions)
        setTotal(refresh.data.total)
      }
    } else {
      toast.error(result.error || 'Failed to unreconcile')
    }
    setIsReconciling(false)
  }

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Building2 className="text-muted-foreground mb-4 size-12" />
          <h3 className="text-lg font-semibold">No Bank Accounts</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            No bank accounts found. Add a Chart of Account with Control Account Type = Bank.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Account Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Account Selector */}
        <Card className={cn(selectedAccount && 'border-primary')}>
          <CardHeader className="pb-2">
            <CardDescription>Selected Account</CardDescription>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto justify-start p-0 text-left">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Wallet className="size-4" />
                    {selectedAccount?.name ?? 'Select account'}
                    <ChevronDown className="text-muted-foreground size-4" />
                  </CardTitle>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {accounts.map((account) => (
                  <DropdownMenuItem
                    key={account.id}
                    onClick={() => {
                      setSelectedAccount(account)
                      setPage(1)
                    }}
                    className="flex flex-col items-start"
                  >
                    <span className="font-medium">{account.name}</span>
                    <span className="text-muted-foreground text-xs">{account.code}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {selectedAccount?.code} • {selectedAccount?.currency}
            </p>
          </CardContent>
        </Card>

        {/* Current Balance */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Balance</CardDescription>
            <CardTitle className="text-2xl">
              {selectedAccount
                ? formatCurrency(selectedAccount.currentBalance, selectedAccount.currency)
                : '—'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Per GL closing balance</p>
          </CardContent>
        </Card>

        {/* Reconciliation Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Unreconciled Items</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              {selectedAccount?.unreconciledCount ?? 0}
              {selectedAccount && selectedAccount.unreconciledCount === 0 ? (
                <CheckCircle2 className="size-5 text-green-500" />
              ) : (
                <CircleDot className="size-5 text-amber-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              {selectedAccount && selectedAccount.unreconciledCount > 0
                ? 'Items pending reconciliation'
                : 'All items reconciled'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>
                Mark transactions as reconciled to match your bank statement
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleReconcile}
                disabled={selectedIds.size === 0 || isReconciling}
              >
                <Check className="mr-1 size-4" />
                Reconcile ({selectedIds.size})
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleUnreconcile}
                disabled={selectedIds.size === 0 || isReconciling}
              >
                <Undo2 className="mr-1 size-4" />
                Unreconcile
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                placeholder="Search by entry number or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shrink-0">
                  <RefreshCw className="mr-2 size-4" />
                  {filter === 'all'
                    ? 'All Transactions'
                    : filter === 'reconciled'
                      ? 'Reconciled'
                      : 'Unreconciled'}
                  <ChevronDown className="ml-2 size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setFilter('all')
                    setPage(1)
                  }}
                >
                  All Transactions
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setFilter('reconciled')
                    setPage(1)
                  }}
                >
                  Reconciled Only
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setFilter('unreconciled')
                    setPage(1)
                  }}
                >
                  Unreconciled Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        filteredTransactions.length > 0 &&
                        selectedIds.size === filteredTransactions.length
                      }
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Entry #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Credit</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingTxns ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(7)].map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <p className="text-muted-foreground">No transactions found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((txn) => (
                    <TableRow
                      key={txn.id}
                      className={cn(selectedIds.has(txn.journalEntryId) && 'bg-muted/50')}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(txn.journalEntryId)}
                          onCheckedChange={() => handleToggle(txn.journalEntryId)}
                          aria-label={`Select ${txn.entryNumber}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{txn.entryNumber}</TableCell>
                      <TableCell>{format(new Date(txn.entryDate), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="max-w-[300px] truncate">{txn.description}</TableCell>
                      <TableCell className="text-right font-mono">
                        {txn.debitAmount > 0
                          ? formatCurrency(txn.debitAmount, selectedAccount?.currency)
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {txn.creditAmount > 0
                          ? formatCurrency(txn.creditAmount, selectedAccount?.currency)
                          : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        {txn.isReconciled ? (
                          <Badge variant="default" className="bg-green-600">
                            <Check className="mr-1 size-3" />
                            Reconciled
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {total > pageSize && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * pageSize >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export { BankReconciliation };