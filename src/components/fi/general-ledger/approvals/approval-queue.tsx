'use client';

import { useState, useTransition } from 'react';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  FileText,
  User,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import { approveJournalEntry, rejectJournalEntry } from '@/lib/features/fi/general-ledger/actions/journal-entries';
import { cn } from '@/lib/utils';
import type { JournalEntryLine, PendingEntry } from '@/types/finance';

type Props = {
  entries: PendingEntry[];
  agencyId: string;
};

const ApprovalQueue = ({ entries, agencyId }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedEntry, setSelectedEntry] = useState<PendingEntry | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = (entry: PendingEntry) => {
    setProcessingId(entry.id);
    startTransition(async () => {
      const result = await approveJournalEntry(entry.id);
      if (result.success) {
        toast.success(`Entry ${entry.entryNumber} approved and posted`);
        setSelectedEntry(null);
        router.refresh();
      } else {
        toast.error(result.error ?? 'Failed to approve');
      }
      setProcessingId(null);
    });
  };

  const handleReject = () => {
    if (!selectedEntry || !rejectReason.trim()) return;
    setProcessingId(selectedEntry.id);
    startTransition(async () => {
      const result = await rejectJournalEntry(selectedEntry.id, rejectReason);
      if (result.success) {
        toast.success(`Entry ${selectedEntry.entryNumber} rejected`);
        setSelectedEntry(null);
        setRejectDialogOpen(false);
        setRejectReason('');
        router.refresh();
      } else {
        toast.error(result.error ?? 'Failed to reject');
      }
      setProcessingId(null);
    });
  };

  const calculateTotal = (lines: JournalEntryLine[]) =>
    lines.reduce((sum, l) => sum + (l.debitAmount || 0), 0);

  const columns: ColumnDef<PendingEntry>[] = [
    {
      accessorKey: 'entryNumber',
      header: 'Entry',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="font-mono font-medium">JE-{row.original.entryNumber}</div>
          <div className="text-xs text-muted-foreground">{row.original.Period.name}</div>
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <div className="max-w-xs truncate">{row.original.description}</div>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <div className="font-mono font-medium tabular-nums">
          ${calculateTotal(row.original.Lines).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
      ),
    },
    {
      id: 'submitter',
      header: 'Submitted By',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-sm">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            {row.original.submitter?.name || 'Unknown'}
          </div>
          {row.original.submittedAt && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(row.original.submittedAt), { addSuffix: true })}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const entry = row.original;
        const processing = processingId === entry.id;
        return (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedEntry(entry)}
              disabled={processing}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-green-600 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950"
              onClick={() => handleApprove(entry)}
              disabled={isPending}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
              onClick={() => {
                setSelectedEntry(entry);
                setRejectDialogOpen(true);
              }}
              disabled={isPending}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: entries,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (entries.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-muted p-4 mb-4">
            <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-1">All caught up!</h3>
          <p className="text-sm text-muted-foreground">No pending approvals at this time.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Journal Entries
              </CardTitle>
              <CardDescription>
                {entries.length} pending approval{entries.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-3">
              {entries.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
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
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer transition-colors"
                  onClick={() => setSelectedEntry(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} onClick={(e) => e.stopPropagation()}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={!!selectedEntry && !rejectDialogOpen} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selectedEntry && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">JE-{selectedEntry.entryNumber}</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                    Pending Approval
                  </Badge>
                </SheetTitle>
                <SheetDescription className="text-left">
                  {selectedEntry.description}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Period</div>
                    <div>{selectedEntry.Period.name}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Entry Date</div>
                    <div>{format(new Date(selectedEntry.entryDate), 'MMM d, yyyy')}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Type</div>
                    <div>{selectedEntry.entryType.replace(/_/g, ' ')}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Submitted By</div>
                    <div>{selectedEntry.submitter?.name || selectedEntry.submitter?.email}</div>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="text-sm font-medium mb-3">Line Items</div>
                  <ScrollArea className="h-64 rounded border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Account</TableHead>
                          <TableHead className="text-right">Debit</TableHead>
                          <TableHead className="text-right">Credit</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedEntry.Lines.map((line) => (
                          <TableRow key={line?.id}>
                            <TableCell>
                              <div className="font-mono text-sm">{line.Account?.code}</div>
                              <div className="text-xs text-muted-foreground">{line.Account?.name}</div>
                            </TableCell>
                            <TableCell className="text-right font-mono tabular-nums">
                              {line.debitAmount > 0 ? `$${line.debitAmount.toLocaleString()}` : '—'}
                            </TableCell>
                            <TableCell className="text-right font-mono tabular-nums">
                              {line.creditAmount > 0 ? `$${line.creditAmount.toLocaleString()}` : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/30 font-medium">
                          <TableCell>Total</TableCell>
                          <TableCell className="text-right font-mono">
                            ${calculateTotal(selectedEntry.Lines).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            ${selectedEntry.Lines.reduce((s, l) => s + (l.creditAmount || 0), 0).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </div>

              <SheetFooter className="mt-6 gap-2">
                <Button
                  variant="outline"
                  className="flex-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={() => setRejectDialogOpen(true)}
                  disabled={isPending}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(selectedEntry)}
                  disabled={isPending}
                >
                  {processingId === selectedEntry.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Approve & Post
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Journal Entry</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedEntry && `Rejecting entry JE-${selectedEntry.entryNumber}. This action will return the entry to draft status.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Rejection Reason</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectReason('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleReject}
              disabled={!rejectReason.trim() || isPending}
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Reject Entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export { ApprovalQueue };