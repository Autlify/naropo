'use client';

import { useState, useTransition } from 'react';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Play,
  Pause,
  ArrowUpDown,
  Zap,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  createPostingRule,
  updatePostingRule,
  deletePostingRule,
  togglePostingRuleStatus,
} from '@/lib/features/fi/general-ledger/actions/posting-rules';
import { cn } from '@/lib/utils';
import type { PostingRuleSourceModule, AmountType, PostingRule, GenLedgerAccount, PostingRuleFormValues } from '@/types/finance';

const SOURCE_MODULES: { value: PostingRuleSourceModule; label: string }[] = [
  { value: 'MANUAL', label: 'Manual Entry' },
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'EXPENSE', label: 'Expense' },
  { value: 'PAYROLL', label: 'Payroll' },
  { value: 'BANK', label: 'Bank' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
  { value: 'YEAR_END', label: 'Year End' },
  { value: 'ASSET', label: 'Asset' },
  { value: 'INVENTORY', label: 'Inventory' },
  { value: 'CONSOLIDATION', label: 'Consolidation' },
  { value: 'INTERCOMPANY', label: 'Intercompany' },
  { value: 'REVERSAL', label: 'Reversal' },
  { value: 'OPENING_BALANCE', label: 'Opening Balance' },
] as const;

const CATEGORIES = [
  { value: 'CUSTOM', label: 'Custom' },
  { value: 'FOREX', label: 'Forex' },
  { value: 'ROUNDING', label: 'Rounding' },
  { value: 'DISCREPANCY', label: 'Discrepancy' },
  { value: 'TAX', label: 'Tax' },
  { value: 'CLEARING', label: 'Clearing' },
  { value: 'ALLOCATION', label: 'Allocation' },
] as const;

const AMOUNT_TYPES: { value: AmountType; label: string }[] = [
  { value: 'FULL', label: 'Full Amount' },
  { value: 'PERCENTAGE', label: 'Percentage' },
  { value: 'FIXED', label: 'Fixed Amount' },
] as const;
 

type Props = {
  rules: PostingRule[];
  accounts: Partial<GenLedgerAccount[]>;
  agencyId: string;
  canManage: boolean;
};
 

const formSchema = z.object({
  code: z.string().min(1, 'Code is required').max(20),
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  category: z.enum(['CUSTOM', 'FOREX', 'ROUNDING', 'DISCREPANCY', 'TAX', 'CLEARING', 'ALLOCATION']),
  sourceModule: z.string().min(1, 'Source module is required'),
  debitAccountId: z.string().min(1, 'Debit account is required'),
  creditAccountId: z.string().min(1, 'Credit account is required'),
  amountType: z.enum(['FULL', 'PERCENTAGE', 'FIXED']),
  percentage: z.number().min(0).max(100).optional(),
  fixedAmount: z.number().min(0).optional(),
  priority: z.number().int().min(0).max(999),
  isActive: z.boolean(),
  autoPost: z.boolean(),
});

const PostingRulesTable = ({ rules, accounts, agencyId, canManage }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PostingRule | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<PostingRule | null>(null);

  const form = useForm<PostingRuleFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      code: '',
      name: '',
      description: '',
      category: 'CUSTOM',
      sourceModule: '' as PostingRuleFormValues['sourceModule'],
      debitAccountId: '',
      creditAccountId: '',
      amountType: 'FULL',
      percentage: undefined,
      fixedAmount: undefined,
      priority: 100,
      isActive: true,
      autoPost: false,
    },
  });

  const openCreateSheet = () => {
    setEditingRule(null);
    form.reset({
      code: '',
      name: '',
      description: '',
      category: 'CUSTOM',
      sourceModule: '' as PostingRuleFormValues['sourceModule'],
      debitAccountId: '',
      creditAccountId: '',
      amountType: 'FULL',
      percentage: undefined,
      fixedAmount: undefined,
      priority: 100,
      isActive: true,
      autoPost: false,
    });
    setSheetOpen(true);
  };

  const openEditSheet = (rule: PostingRule) => {
    setEditingRule(rule);
    form.reset({
      code: rule.code,
      name: rule.name,
      description: rule.description ?? '',
      category: rule.category as PostingRuleFormValues['category'],
      sourceModule: rule.sourceModule as PostingRuleFormValues['sourceModule'],
      debitAccountId: rule.DebitAccount?.id,
      creditAccountId: rule.CreditAccount?.id,
      amountType: rule.amountType as 'FULL' | 'PERCENTAGE' | 'FIXED',
      percentage: rule.percentage ?? undefined,
      fixedAmount: rule.fixedAmount ?? undefined,
      priority: rule.priority,
      isActive: rule.isActive,
      autoPost: rule.autoPost,
    });
    setSheetOpen(true);
  };

  const onSubmit = (values: PostingRuleFormValues) => {
    startTransition(async () => {
      const data = {
        code: values.code,
        name: values.name,
        description: values.description || undefined,
        category: values.category,
        sourceModule: values.sourceModule as any,
        debitAccountId: values.debitAccountId,
        creditAccountId: values.creditAccountId,
        amountType: values.amountType,
        percentage: values.amountType === 'PERCENTAGE' ? values.percentage : undefined,
        fixedAmount: values.amountType === 'FIXED' ? values.fixedAmount : undefined,
        priority: values.priority,
        isActive: values.isActive,
        autoPost: values.autoPost,
      };

      const result = editingRule
        ? await updatePostingRule({ id: editingRule.id, ...data })
        : await createPostingRule(data);

      if (result.success) {
        toast.success(editingRule ? 'Rule updated' : 'Rule created');
        setSheetOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? 'Failed to save rule');
      }
    });
  };

  const handleToggleStatus = (rule: PostingRule) => {
    startTransition(async () => {
      const result = await togglePostingRuleStatus(rule.id, !rule.isActive);
      if (result.success) {
        toast.success(`Rule ${rule.isActive ? 'deactivated' : 'activated'}`);
        router.refresh();
      } else {
        toast.error(result.error ?? 'Failed to update status');
      }
    });
  };

  const handleDelete = () => {
    if (!ruleToDelete) return;
    startTransition(async () => {
      const result = await deletePostingRule(ruleToDelete.id);
      if (result.success) {
        toast.success('Rule deleted');
        setDeleteDialogOpen(false);
        setRuleToDelete(null);
        router.refresh();
      } else {
        toast.error(result.error ?? 'Failed to delete rule');
      }
    });
  };

  const columns: ColumnDef<PostingRule>[] = [
    {
      accessorKey: 'code',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="-ml-3"
        >
          Code
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-mono font-medium">{row.original.code}</div>,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="space-y-0.5 max-w-xs">
          <div className="font-medium truncate">{row.original.name}</div>
          {row.original.description && (
            <div className="text-xs text-muted-foreground truncate">{row.original.description}</div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'sourceModule',
      header: 'Trigger',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.sourceModule.replace(/_/g, ' ')}</Badge>
      ),
    },
    {
      id: 'accounts',
      header: 'Accounts',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 text-sm">
          <span className="font-mono text-muted-foreground">{row.original.DebitAccount?.code}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono text-muted-foreground">{row.original.CreditAccount?.code}</span>
        </div>
      ),
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.priority}</span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge
          variant={row.original.isActive ? 'default' : 'secondary'}
          className={cn(
            row.original.isActive && 'bg-green-500/10 text-green-600 border-green-500/20'
          )}
        >
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const rule = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canManage && (
                <>
                  <DropdownMenuItem onClick={() => openEditSheet(rule)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleToggleStatus(rule)}>
                    {rule.isActive ? (
                      <>
                        <Pause className="mr-2 h-4 w-4" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => {
                      setRuleToDelete(rule);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const filteredRules = rules.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const table = useReactTable({
    data: filteredRules,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  const amountType = form.watch('amountType');

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Posting Rules
              </CardTitle>
              <CardDescription>
                Automate journal entries based on triggers
              </CardDescription>
            </div>
            {canManage && (
              <Button onClick={openCreateSheet}>
                <Plus className="mr-2 h-4 w-4" />
                New Rule
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
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
                      No posting rules configured.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingRule ? 'Edit Posting Rule' : 'New Posting Rule'}</SheetTitle>
            <SheetDescription>
              Configure automated journal entries
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="FOREX_GAIN" disabled={!!editingRule} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Forex Gain Recognition" />
                    </FormControl>
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
                      <Textarea {...field} placeholder="Optional description..." rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sourceModule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trigger Source</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SOURCE_MODULES.map((m) => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="debitAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Debit Account</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts.map((a) => (
                            <SelectItem key={a?.id!} value={a?.id!}>
                              {a?.code} - {a?.name}
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
                  name="creditAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credit Account</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts.map((a) => (
                            <SelectItem key={a?.id!} value={a?.id!}>
                              {a?.code} - {a?.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="amountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Calculation</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AMOUNT_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {amountType === 'PERCENTAGE' && (
                <FormField
                  control={form.control}
                  name="percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Percentage (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {amountType === 'FIXED' && (
                <FormField
                  control={form.control}
                  name="fixedAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fixed Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div>
                        <FormLabel className="font-normal">Active</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="autoPost"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div>
                        <FormLabel className="font-normal">Auto-post</FormLabel>
                        <FormDescription className="text-xs">Skip approval</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <SheetFooter className="pt-4">
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Posting Rule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{ruleToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


export { PostingRulesTable };
export type { PostingRule, PostingRuleFormValues };