
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FiscalPeriod } from '@/types/finance'

type Props = {
  reportType: string
  periods: FiscalPeriod[]
  selectedPeriodId?: string
  selectedAsOfDate?: string
  selectedFromDate?: string
  selectedToDate?: string
  basePath: string
}

 const ReportFilters =  ({
  reportType,
  periods,
  selectedPeriodId,
  selectedAsOfDate,
  selectedFromDate,
  selectedToDate,
  basePath,
}: Props) => {
  const router = useRouter()
  const [filterType, setFilterType] = useState<'period' | 'date' | 'range'>(
    selectedPeriodId ? 'period' : selectedFromDate ? 'range' : 'date'
  )
  const [periodId, setPeriodId] = useState(selectedPeriodId ?? '')
  const [asOfDate, setAsOfDate] = useState<Date | undefined>(
    selectedAsOfDate ? new Date(selectedAsOfDate) : undefined
  )
  const [fromDate, setFromDate] = useState<Date | undefined>(
    selectedFromDate ? new Date(selectedFromDate) : undefined
  )
  const [toDate, setToDate] = useState<Date | undefined>(
    selectedToDate ? new Date(selectedToDate) : undefined
  )

  const handleGenerate = () => {
    const params = new URLSearchParams()

    if (filterType === 'period' && periodId) {
      params.set('periodId', periodId)
    } else if (filterType === 'date' && asOfDate) {
      params.set('asOfDate', format(asOfDate, 'yyyy-MM-dd'))
    } else if (filterType === 'range' && fromDate && toDate) {
      params.set('fromDate', format(fromDate, 'yyyy-MM-dd'))
      params.set('toDate', format(toDate, 'yyyy-MM-dd'))
    }

    router.push(`${basePath}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
      {/* Filter Type */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Filter By</label>
        <Select
          value={filterType}
          onValueChange={(v) => setFilterType(v as 'period' | 'date' | 'range')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="period">Financial Period</SelectItem>
            <SelectItem value="date">As of Date</SelectItem>
            {(reportType === 'general-ledger' || reportType === 'journal-register') && (
              <SelectItem value="range">Date Range</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Period Selector */}
      {filterType === 'period' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Period</label>
          <Select value={periodId} onValueChange={setPeriodId}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period.id} value={period.id}>
                  {period.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* As of Date Picker */}
      {filterType === 'date' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">As of Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[250px] justify-start text-left font-normal',
                  !asOfDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {asOfDate ? format(asOfDate, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={asOfDate}
                onSelect={setAsOfDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Date Range Picker */}
      {filterType === 'range' && (
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium">From Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-[180px] justify-start text-left font-normal',
                    !fromDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fromDate ? format(fromDate, 'PP') : 'Start'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={setFromDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">To Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-[180px] justify-start text-left font-normal',
                    !toDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {toDate ? format(toDate, 'PP') : 'End'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={toDate}
                  onSelect={setToDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </>
      )}

      {/* Generate Button */}
      <Button onClick={handleGenerate}>
        <Search className="h-4 w-4 mr-2" />
        Generate Report
      </Button>
    </div>
  )
}
export { ReportFilters }
