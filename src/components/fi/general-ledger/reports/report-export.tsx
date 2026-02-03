'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, FileText, Printer, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { ReportExportButtonProps, ReportPrintHeaderProps, ReportHeaderProps, ReportExportFormat } from '@/types/finance'

// ============================================================================
// Types
// ============================================================================


// ============================================================================
// Report Export Button
// ============================================================================

const ReportExportButton = ({
  exportEndpoint,
  reportName,
  params = {},
  showPrint = true,
  disabled = false,
}: ReportExportButtonProps) => {
  const [isPending, startTransition] = useTransition()
  const [exportFormat, setExportFormat] = useState<ReportExportFormat | null>(null)

  const handleExport = (format: ReportExportFormat) => {
    setExportFormat(format)
    startTransition(async () => {
      try {
        const queryParams = new URLSearchParams()
        queryParams.set('format', format)
        
        Object.entries(params).forEach(([key, value]) => {
          if (value) queryParams.set(key, value)
        })

        const response = await fetch(`${exportEndpoint}?${queryParams.toString()}`)

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Export failed' }))
          throw new Error(error.error || 'Export failed')
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        // Generate filename with date
        const date = new Date().toISOString().split('T')[0]
        a.download = `${reportName.toLowerCase().replace(/\s+/g, '-')}-${date}.${format}`
        
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast.success(`Report exported as ${format.toUpperCase()}`)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to export report')
      } finally {
        setExportFormat(null)
      }
    })
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex gap-2 print:hidden">
      {showPrint && (
        <Button variant="outline" size="sm" onClick={handlePrint} disabled={disabled}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={disabled || isPending}>
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
  )
}

// ============================================================================
// Report Header with Export
// ============================================================================

const ReportHeader = ({
  title,
  subtitle,
  exportEndpoint,
  reportName,
  params,
}: ReportHeaderProps) => {
  return (
    <div className="flex flex-row items-center justify-between print:hidden">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <ReportExportButton
        exportEndpoint={exportEndpoint}
        reportName={reportName}
        params={params}
      />
    </div>
  )
}

// ============================================================================
// Report Print Header
// ============================================================================


const ReportPrintHeader = ({ title, subtitle, generatedAt }: ReportPrintHeaderProps) => {
  const formattedDate = generatedAt 
    ? new Date(generatedAt).toLocaleString() 
    : new Date().toLocaleString()

  return (
    <div className="hidden print:block text-center mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
      <p className="text-sm text-muted-foreground">
        Generated: {formattedDate}
      </p>
    </div>
  )
}

export { ReportExportButton, ReportHeader, ReportPrintHeader }
export type { ReportExportButtonProps, ReportHeaderProps, ReportPrintHeaderProps }
