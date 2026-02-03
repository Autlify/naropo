'use client';

import { useState } from 'react';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, ArrowUpDown, FileText, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  submitJournalEntry,
  approveJournalEntry,
  rejectJournalEntry,
} from '@/lib/features/fi/general-ledger/actions/journal-entries';
import { formatDate } from '@/lib/features/fi/general-ledger/utils/helpers';
import type { JournalEntry, JournalEntryLine } from '@/types/finance';

type Props = {
  entries: JournalEntry[];
  agencyId: string;
};

const statusColors: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  DRAFT: 'secondary',
  PENDING_APPROVAL: 'outline',
  APPROVED: 'default',
  REJECTED: 'destructive',
};

const JournalEntriesTable = ({ entries, agencyId }: Props) => {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const columns: ColumnDef<JournalEntry>[] = [
    {
      accessorKey: 'entryNumber',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Entry #
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return <div className="font-mono">JE-{row.getValue('entryNumber')}</div>;
      },
    },
    {
      accessorKey: 'entryDate',
      header: 'Date',
      cell: ({ row }) => {
        return formatDate(new Date(row.getValue('entryDate')), 'short');
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => {
        return (
          <div className="max-w-md truncate">{row.getValue('description')}</div>
        );
      },
    },
    {
      accessorKey: 'entryType',
      header: 'Type',
      cell: ({ row }) => {
        const type = row.getValue('entryType') as string;
        return (
          <span className="text-sm text-muted-foreground">
            {type.replace(/_/g, ' ')}
          </span>
        );
      },
    },
    {
      id: 'amount',
      header: 'Amount',
      cell: ({ row }) => {
        const lines = row.original.Lines;
        const totalDebit = lines.reduce((sum: number, l: { debitAmount: number }) => sum + l.debitAmount, 0);
        return (
          <div className="font-mono">
            ${totalDebit.toFixed(2)}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge variant={statusColors[status] || 'outline'}>
            {status.replace(/_/g, ' ')}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const entry = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link
                  href={`/agency/${agencyId}/fi/general-ledger/journal-entries/${entry.id}`}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              
              {entry.status === 'DRAFT' && (
                <DropdownMenuItem
                  onClick={async () => {
                    const result = await submitJournalEntry(entry.id);
                    if (result.success) {
                      toast.success('Entry submitted for approval');
                      router.refresh();
                    } else {
                      toast.error(result.error ?? 'Failed to submit entry');
                    }
                  }}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Submit for Approval
                </DropdownMenuItem>
              )}

              {entry.status === 'PENDING_APPROVAL' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={async () => {
                      const result = await approveJournalEntry(entry.id);
                      if (result.success) {
                        toast.success('Entry approved and posted');
                        router.refresh();
                      } else {
                        toast.error(result.error ?? 'Failed to approve entry');
                      }
                    }}
                  >
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={async () => {
                      const reason = prompt('Reason for rejection:');
                      if (reason) {
                        const result = await rejectJournalEntry(entry.id, reason);
                        if (result.success) {
                          toast.success('Entry rejected');
                          router.refresh();
                        } else {
                          toast.error(result.error ?? 'Failed to reject entry');
                        }
                      }
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4 text-red-600" />
                    Reject
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: entries,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Filter by description..."
          value={(table.getColumn('description')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('description')?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
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
                  No journal entries found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export { JournalEntriesTable };