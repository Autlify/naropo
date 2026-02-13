import { type Column } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui-2/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui-2/dropdown-menu"
import { useState } from 'react'

interface DataTableColumnHeaderProps<TData, TValue>
    extends React.HTMLAttributes<HTMLDivElement> {
    column: Column<TData, TValue>
    title: string
}

// Transform into dynamic rendering and reusable column header with sorting and visibility options
export const DataTableColumnHeader = <TData, TValue>({
    column,
    title,
    className,
    ...props
}: DataTableColumnHeaderProps<TData, TValue>) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const isSorted = column.getIsSorted()
    if (!column.getCanSort()) {
        return <div className={cn(className)}>{title}</div>
    }

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {!column.getCanSort() && (
                <span>{title}</span>
            )}
            {column.getCanSort() && (
                <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="data-[state=open]:bg-accent -ml-3 h-8"
                        >  <span>{title}</span>
                            {column.getIsSorted() === "desc" ? (
                                <ArrowDown />
                            ) : column.getIsSorted() === "asc" ? (
                                <ArrowUp />
                            ) : (
                                <ChevronsUpDown />
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                            <ArrowUp />
                            Asc
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                            <ArrowDown />
                            Desc
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
                            <EyeOff />
                            Hide
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    )
}   
