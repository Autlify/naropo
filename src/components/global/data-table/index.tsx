"use client"

import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    VisibilityState,
} from "@tanstack/react-table"
import { Input } from "@/components/ui-2/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui-2/table"
import { Button } from "@/components/ui-2/button"
import { useState } from 'react'
import { DataTablePagination } from './pagination'
import { DataTableViewOptions } from './options'
import { cn } from '@/lib/utils'
import { DataTableColumnHeader } from '@/components/global/data-table/columns'

type Variant = {
    pagination?: 'basic' | 'advanced'

}

interface DataTableProps<TData, TValue> {
    className?: string
    variant?: Variant
    /** Column definitions */
    columns: ColumnDef<TData, TValue>[]
    /** Table data */
    data: TData[]
    /** Column key to use for search/filter (e.g., "email", "name") */
    searchColumn?: string
    /** Placeholder text for search input */
    searchPlaceholder?: string
    /** Show search input */
    showSearch?: boolean
    /** Show column visibility toggle */
    showColumnToggle?: boolean
    /** Show pagination controls */
    showPagination?: boolean
    /** Initial page size */
    pageSize?: number
    /** Enable row selection */
    enableRowSelection?: boolean
    /** Callback when row selection changes */
    onRowSelectionChange?: (selectedRows: TData[]) => void
}

const DataTable = <TData, TValue>({
    className,
    variant,
    columns,
    data,
    searchColumn,
    searchPlaceholder,
    showSearch = true,
    showColumnToggle = true,
    showPagination = true,
    pageSize = 10,
    enableRowSelection = false,
    onRowSelectionChange,
}: DataTableProps<TData, TValue>) => {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = useState({})
    const [globalFilter, setGlobalFilter] = useState("")

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: (updater) => {
            setRowSelection(updater)
            if (onRowSelectionChange) {
                const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater
                const selectedRows = Object.keys(newSelection)
                    .filter(key => newSelection[key as keyof typeof newSelection])
                    .map(key => data[parseInt(key)])
                onRowSelectionChange(selectedRows)
            }
        },
        onGlobalFilterChange: setGlobalFilter,
        enableRowSelection,
        initialState: {
            pagination: { pageSize },
        },
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter,
        },
    })

    // Determine which column to filter
    const filterColumn = searchColumn ? table.getColumn(searchColumn) : null
    const placeholder = searchPlaceholder || (searchColumn ? `Filter ${searchColumn}...` : 'Search...')

    return (
        <div className={cn("space-y-4 shadow-lg bg-gradient-to-br from-muted/20 to-transparent border-border/50", className)}>
            {/* Toolbar */}
            {(showSearch || showColumnToggle) && (
                <div className="flex items-center justify-between gap-4">
                    {showSearch && (
                        <Input
                            placeholder={placeholder}
                            value={filterColumn
                                ? (filterColumn.getFilterValue() as string) ?? ""
                                : globalFilter
                            }
                            onChange={(event) => {
                                if (filterColumn) {
                                    filterColumn.setFilterValue(event.target.value)
                                } else {
                                    setGlobalFilter(event.target.value)
                                }
                            }}
                            className="max-w-sm"
                        />
                    )}
                    {showColumnToggle && (
                        <DataTableViewOptions table={table} />
                    )}
                </div>
            )}

            {/* Table */}

            <div className="overflow-hidden rounded-md rounded-lg border border-border/50 bg-gradient-to-br from-muted/10 to-transparent">
                <Table>
                    <TableHeader className="bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="border-b border-border/50 hover:bg-transparent">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="text-muted-foreground font-medium">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className="py-2 text-muted-foreground"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {variant?.pagination === 'basic' && showPagination && (
                <>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Next
                    </Button>
                </>
            )}
            {variant?.pagination === 'advanced' && showPagination && (
                <DataTablePagination table={table} />
            )}
        </div>
    )
}

DataTable.displayName = "DataTable"

export { 
    DataTable,
    type DataTableProps,
    DataTablePagination,
    DataTableViewOptions,
    DataTableColumnHeader
 }

 