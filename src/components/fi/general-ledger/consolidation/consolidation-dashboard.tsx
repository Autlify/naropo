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
import { Input } from '@/components/ui/input';
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Plus,
  MoreHorizontal,
  Eye,
  CheckCircle,
  Play,
  Layers,
  Loader2,
  FileSpreadsheet,
  Building2,
  ArrowRight,
  Link2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  createConsolidationSnapshot,
  finalizeConsolidation,
  detectIntercompanyTransactions,
} from '@/lib/features/fi/general-ledger/actions/consolidation';
import { cn } from '@/lib/utils';
import type { FiscalPeriod, ConsolidationSnapshot, ConsolidationFormValues } from '@/types/finance';

type Props = {
  snapshots: ConsolidationSnapshot[];
  periods: FiscalPeriod[];
  agencyId: string;
  canManage: boolean;
};

const statusColors: Record<string, string> = {
  DRAFT: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  COMPLETED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  APPROVED: 'bg-green-500/10 text-green-600 border-green-500/20',
};

const METHODS = [
  { value: 'FULL', label: 'Full Consolidation (100%)' },
  { value: 'PROPORTIONAL', label: 'Proportional Consolidation' },
  { value: 'EQUITY', label: 'Equity Method' },
];

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  periodId: z.string().min(1, 'Period is required'),
  consolidationMethod: z.enum(['FULL', 'PROPORTIONAL', 'EQUITY']),
});

export function ConsolidationDashboard({ snapshots, periods, agencyId, canManage }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<ConsolidationSnapshot | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const form = useForm<ConsolidationFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      periodId: '',
      consolidationMethod: 'FULL',
    },
  });

  const openCreateSheet = () => {
    form.reset({
      name: `Consolidation ${format(new Date(), 'MMM yyyy')}`,
      description: '',
      periodId: '',
      consolidationMethod: 'FULL',
    });
    setSheetOpen(true);
  };

  const onSubmit = (values: ConsolidationFormValues) => {
    startTransition(async () => {
      const result = await createConsolidationSnapshot({
        name: values.name,
        description: values.description,
        periodId: values.periodId,
        consolidationMethod: values.consolidationMethod,
        subAccountIds: [], // Will be populated by server action from agency context
      });

      if (result.success) {
        toast.success('Consolidation snapshot created');
        setSheetOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? 'Failed to create snapshot');
      }
    });
  };

  const handleFinalize = (snapshot: ConsolidationSnapshot) => {
    setSelectedSnapshot(snapshot);
    setConfirmDialogOpen(true);
  };

  const confirmFinalize = () => {
    if (!selectedSnapshot) return;
    startTransition(async () => {
      const result = await finalizeConsolidation(selectedSnapshot.id);
      if (result.success) {
        toast.success('Consolidation finalized');
        setConfirmDialogOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? 'Failed to finalize');
      }
    });
  };

  const handleDetectIC = (snapshot: ConsolidationSnapshot) => {
    startTransition(async () => {
      const result = await detectIntercompanyTransactions(snapshot.id);
      if (result.success) {
        toast.success(`Detected ${result.data?.detected ?? 0} intercompany transactions`);
        router.refresh();
      } else {
        toast.error(result.error ?? 'Failed to detect IC transactions');
      }
    });
  };

  const columns: ColumnDef<ConsolidationSnapshot>[] = [
    {
      accessorKey: 'snapshotNumber',
      header: 'Snapshot',
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <div className="font-mono font-medium">{row.original.snapshotNumber}</div>
          <div className="text-xs text-muted-foreground">{row.original.name}</div>
        </div>
      ),
    },
    {
      accessorKey: 'Period',
      header: 'Period',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.Period.name}</Badge>
      ),
    },
    {
      accessorKey: 'consolidationMethod',
      header: 'Method',
      cell: ({ row }) => (
        <span className="text-sm">{row.original.consolidationMethod}</span>
      ),
    },
    {
      id: 'counts',
      header: 'Details',
      cell: ({ row }) => (
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>{row.original._count.WorksheetLines} lines</span>
          <span>{row.original._count.Adjustments} adj</span>
          <span>{row.original._count.Eliminations} elim</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant="outline" className={cn('font-medium', statusColors[row.original.status])}>
          {row.original.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.createdAt), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const snap = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push(`/agency/${agencyId}/fi/general-ledger/consolidation/${snap.id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDetectIC(snap)} disabled={snap.status === 'APPROVED'}>
                <Link2 className="mr-2 h-4 w-4" />
                Detect IC Transactions
              </DropdownMenuItem>
              {canManage && snap.status !== 'APPROVED' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleFinalize(snap)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Finalize
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
    data: snapshots,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Snapshots</CardTitle>
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{snapshots.length}</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {snapshots.filter(s => s.status === 'APPROVED').length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Play className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {snapshots.filter(s => s.status === 'IN_PROGRESS' || s.status === 'DRAFT').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Periods</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{periods.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Snapshots Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Consolidation Snapshots
              </CardTitle>
              <CardDescription>
                Multi-entity financial consolidation with eliminations
              </CardDescription>
            </div>
            {canManage && (
              <Button onClick={openCreateSheet}>
                <Plus className="mr-2 h-4 w-4" />
                New Consolidation
              </Button>
            )}
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
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
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
                    No consolidation snapshots yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>New Consolidation</SheetTitle>
            <SheetDescription>
              Create a consolidation snapshot to combine entity financials
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Q4 2025 Consolidation" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="periodId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {periods.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consolidationMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consolidation Method</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {METHODS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How to combine subsidiary financials
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Optional notes..." rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SheetFooter className="pt-4">
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Consolidation
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Finalize Confirmation */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalize Consolidation</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedSnapshot && `Finalizing "${selectedSnapshot.name}" will lock all adjustments and eliminations. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmFinalize} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Finalize
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
