
'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, FileText, Printer, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/features/fi/general-ledger/utils/helpers'

type TrialBalanceData = {
  accounts: {
    accountCode: string
    accountName: string
    accountType: string
    debit: number
    credit: number
    balance: number
  }[]
  totals: {
    debit: number
    credit: number
  }
  metadata: {
    periodName?: string
    asOfDate?: string
    generatedAt: string
    currency: string
  }
}

type Props = {
  data: TrialBalanceData
  agencyId: string
  periodId?: string
  asOfDate?: string
}

export function TrialBalanceReport({ data, agencyId, periodId, asOfDate }: Props) {
  const [isPending, startTransition] = useTransition()
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'pdf' | null>(null)

  const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
    setExportFormat(format)
    startTransition(async () => {
      try {
        const params = new URLSearchParams()
        params.set('format', format)
        if (periodId) params.set('periodId', periodId)
        if (asOfDate) params.set('asOfDate', asOfDate)

        const response = await fetch(
          `/api/fi/general-ledger/reports/trial-balance/export?${params.toString()}`
        )

        if (!response.ok) {
          throw new Error('Export failed')
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `trial-balance-${periodId ?? asOfDate}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast.success(`Report exported as ${format.toUpperCase()}`)
      } catch (error) {
        toast.error('Failed to export report')
      } finally {
        setExportFormat(null)
      }
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const isBalanced = Math.abs(data.totals.debit - data.totals.credit) < 0.01

  return (
    <Card className="print:shadow-none print:border-none">
      <CardHeader className="flex flex-row items-center justify-between print:hidden">
        <div>
          <CardTitle>Trial Balance</CardTitle>
          <p className="text-sm text-muted-foreground">
            {data.metadata?.periodName ?? `As of ${data.metadata?.asOfDate}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isPending}>
                {isPending && exportFormat ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className="h-4 w-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('xlsx')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="h-4 w-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-2xl font-bold">Trial Balance</h1>
        <p className="text-muted-foreground">
          {data.metadata?.periodName ?? `As of ${data.metadata?.asOfDate}`}
        </p>
        <p className="text-sm text-muted-foreground">
          Generated: {new Date(data.metadata?.generatedAt).toLocaleString()}
        </p>
      </div>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Account Code</TableHead>
              <TableHead>Account Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.accounts.map((account) => (
              <TableRow key={account.accountCode}>
                <TableCell className="font-mono">{account.accountCode}</TableCell>
                <TableCell>{account.accountName}</TableCell>
                <TableCell className="capitalize">
                  {account.accountType.toLowerCase().replace('_', ' ')}
                </TableCell>
                <TableCell className="text-right">
                  {account.debit > 0
                    ? formatCurrency(account.debit, data.metadata?.currency)
                    : '-'}
                </TableCell>
                <TableCell className="text-right">
                  {account.credit > 0
                    ? formatCurrency(account.credit, data.metadata?.currency)
                    : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="font-bold">
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell className="text-right">
                {formatCurrency(data.totals.debit, data.metadata?.currency)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(data.totals.credit, data.metadata?.currency)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>

        {/* Balance Check */}
        <div className={`mt-4 p-4 rounded-lg ${isBalanced ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'}`}>
          <p className={`text-sm font-medium ${isBalanced ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
            {isBalanced ? (
              '✓ Trial balance is balanced (debits = credits)'
            ) : (
              `⚠ Trial balance is out of balance by ${formatCurrency(Math.abs(data.totals.debit - data.totals.credit), data.metadata?.currency)}`
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 