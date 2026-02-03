'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, FileText } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/features/fi/general-ledger/utils/helpers';
import type { OpenItem, OpenItemsTableProps } from '@/types/finance';

const statusColors: Record<string, string> = {
  OPEN: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  CLEARED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  PARTIALLY_CLEARED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
};

const OpenItemsTable = ({
  items,
  baseUrl,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  showAccount = true,
  showPartner = false,
  showStatus = true,
  emptyMessage = 'No open items found',
}: OpenItemsTableProps) => {
  const toggleItem = (id: string) => {
    if (!onSelectionChange) return;
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    onSelectionChange(newSelected);
  };

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (selectedIds.size === items.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(items.map(item => item.id)));
    }
  };

  const getPartnerName = (item: OpenItem) => {
    if (item.Customer) return item.Customer.name;
    if (item.Vendor) return item.Vendor.name;
    return '-';
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mb-4 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {selectable && (
            <TableHead className="w-12">
              <Checkbox
                checked={selectedIds.size === items.length && items.length > 0}
                onCheckedChange={toggleAll}
              />
            </TableHead>
          )}
          <TableHead>Reference</TableHead>
          {showAccount && <TableHead>Account</TableHead>}
          {showPartner && <TableHead>Partner</TableHead>}
          <TableHead>Date</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Source</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Remaining</TableHead>
          {showStatus && <TableHead>Status</TableHead>}
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const amount = Number(item.localAmount) || 0;
          const remaining = Number(item.localRemainingAmount) || 0;
          const isSelected = selectedIds.has(item.id);

          return (
            <TableRow
              key={item.id}
              className={isSelected ? 'bg-muted/50' : ''}
            >
              {selectable && (
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleItem(item.id)}
                  />
                </TableCell>
              )}
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span>{item.sourceReference || item.documentNumber || '-'}</span>
                  {item.reference && (
                    <span className="text-xs text-muted-foreground">{item.reference}</span>
                  )}
                </div>
              </TableCell>
              {showAccount && (
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-mono text-sm">{item.Account?.code || item.accountId.slice(0, 8)}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-32">
                      {item.Account?.name}
                    </span>
                  </div>
                </TableCell>
              )}
              {showPartner && (
                <TableCell>
                  <div className="flex flex-col">
                    <span>{getPartnerName(item)}</span>
                    {item.partnerType && (
                      <Badge variant="outline" className="w-fit text-xs">
                        {item.partnerType}
                      </Badge>
                    )}
                  </div>
                </TableCell>
              )}
              <TableCell>
                {new Date(item.documentDate).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {item.dueDate
                  ? new Date(item.dueDate).toLocaleDateString()
                  : '-'}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{item.sourceModule || 'MANUAL'}</Badge>
              </TableCell>
              <TableCell className={`text-right font-mono ${amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(amount)}
              </TableCell>
              <TableCell className={`text-right font-mono ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(remaining)}
              </TableCell>
              {showStatus && (
                <TableCell>
                  <Badge className={statusColors[item.status] || statusColors.OPEN}>
                    {item.status?.replace('_', ' ')}
                  </Badge>
                </TableCell>
              )}
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`${baseUrl}/${item.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </DropdownMenuItem>
                    {item.sourceModule && item.sourceReference && (
                      <DropdownMenuItem asChild>
                        <Link href={`${baseUrl}/source/${item.sourceModule}/${item.sourceReference}`}>
                          <FileText className="mr-2 h-4 w-4" />
                          View Source Document
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export { OpenItemsTable };