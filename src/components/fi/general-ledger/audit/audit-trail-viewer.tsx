'use client';

import { useState, useTransition, useCallback } from 'react';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  type SortingState,
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ArrowUpDown,
  Search,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Calendar,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import type { AuditAction } from '@/generated/prisma/client';
import { searchAuditTrail, type AuditTrailEntry } from '@/lib/features/fi/general-ledger/actions/audit';
import { cn } from '@/lib/utils';

type Props = {
  agencyId: string;
  entityTypes: string[];
  initialData?: { items: AuditTrailEntry[]; total: number };
};

const actionColors: Record<AuditAction, string> = {
  CREATE: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  UPDATE: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  DELETE: 'bg-red-500/10 text-red-500 border-red-500/20',
  SUBMIT: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  APPROVE: 'bg-green-500/10 text-green-500 border-green-500/20',
  REJECT: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  POST: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  REVERSE: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  VOID: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  CLOSE: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  LOCK: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
  CONSOLIDATE: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  ELIMINATE: 'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20',
};

const ACTIONS: AuditAction[] = [
  'CREATE', 'UPDATE', 'DELETE', 'SUBMIT', 'APPROVE', 'REJECT',
  'POST', 'REVERSE', 'VOID', 'CLOSE', 'LOCK', 'CONSOLIDATE', 'ELIMINATE',
];

const AuditTrailViewer = ({ agencyId, entityTypes, initialData }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData?.items ?? []);
  const [total, setTotal] = useState(initialData?.total ?? 0);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedEntry, setSelectedEntry] = useState<AuditTrailEntry | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState<string>('');
  const [action, setAction] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const fetchData = useCallback(() => {
    startTransition(async () => {
      const result = await searchAuditTrail({
        agencyId,
        search: search || undefined,
        entityType: entityType || undefined,
        action: action as AuditAction || undefined,
        page,
        pageSize,
      });
      if (result.success && result.data) {
        setData(result.data.items);
        setTotal(result.data.total);
      }
    });
  }, [agencyId, search, entityType, action, page]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const columns: ColumnDef<AuditTrailEntry>[] = [
    {
      accessorKey: 'timestamp',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3"
        >
          <Calendar className="mr-2 h-4 w-4" />
          Time
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const timestamp = new Date(row.getValue('timestamp'));
        return (
          <div className="space-y-0.5">
            <div className="text-sm font-medium">
              {format(timestamp, 'MMM d, yyyy')}
            </div>
            <div className="text-xs text-muted-foreground">
              {format(timestamp, 'HH:mm:ss')}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const actionValue = row.getValue('action') as AuditAction;
        return (
          <Badge variant="outline" className={cn('font-medium', actionColors[actionValue])}>
            {actionValue}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'entityType',
      header: 'Entity',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="font-medium">{row.getValue('entityType')}</div>
          <div className="font-mono text-xs text-muted-foreground truncate max-w-32">
            {row.original.entityId.slice(0, 8)}...
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'userName',
      header: 'User',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="font-medium">{row.original.userName || 'Unknown'}</div>
          <div className="text-xs text-muted-foreground truncate max-w-40">
            {row.original.userEmail}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'reason',
      header: 'Notes',
      cell: ({ row }) => {
        const reason = row.original.reason;
        if (!reason) return <span className="text-muted-foreground">—</span>;
        return <div className="max-w-48 truncate text-sm">{reason}</div>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedEntry(row.original)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, email, user, or notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 bg-background"
              />
            </div>

            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger className="w-44 bg-background">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Entity type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All entities</SelectItem>
                {entityTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="w-36 bg-background">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All actions</SelectItem>
                {ACTIONS.map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleSearch} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-2">Search</span>
            </Button>

            <Button variant="outline" size="icon" onClick={fetchData} disabled={isPending}>
              <RefreshCw className={cn('h-4 w-4', isPending && 'animate-spin')} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="border-border/50">
        <div className="rounded-md">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="bg-muted/50">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => setSelectedEntry(row.original)}
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
                  <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                    No audit records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/30">
          <div className="text-sm text-muted-foreground">
            {total > 0 ? (
              <>Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}</>
            ) : (
              'No results'
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isPending}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium px-2">
              {page} / {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isPending}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedEntry && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <Badge variant="outline" className={cn('font-medium', actionColors[selectedEntry.action])}>
                    {selectedEntry.action}
                  </Badge>
                  {selectedEntry.entityType}
                </SheetTitle>
                <SheetDescription>
                  {formatDistanceToNow(new Date(selectedEntry.timestamp), { addSuffix: true })}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Entity ID</div>
                    <div className="font-mono text-sm break-all bg-muted/50 p-2 rounded">
                      {selectedEntry.entityId}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Timestamp</div>
                    <div className="text-sm">
                      {format(new Date(selectedEntry.timestamp), 'PPpp')}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">User</div>
                    <div className="text-sm">{selectedEntry.userName || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground">{selectedEntry.userEmail}</div>
                  </div>
                  {selectedEntry.ipAddress && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">IP Address</div>
                      <div className="font-mono text-sm">{selectedEntry.ipAddress}</div>
                    </div>
                  )}
                </div>

                {selectedEntry.reason && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Reason / Notes</div>
                    <div className="bg-muted/50 p-3 rounded text-sm">{selectedEntry.reason}</div>
                  </div>
                )}

                <Separator />

                {selectedEntry.previousValues && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2">Previous Values</div>
                    <ScrollArea className="h-40 rounded border bg-zinc-950">
                      <pre className="p-3 text-xs text-zinc-100">
                        {JSON.stringify(selectedEntry.previousValues, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                )}

                {selectedEntry.newValues && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2">New Values</div>
                    <ScrollArea className="h-40 rounded border bg-zinc-950">
                      <pre className="p-3 text-xs text-zinc-100">
                        {JSON.stringify(selectedEntry.newValues, null, 2)}
                      </pre>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export { AuditTrailViewer };