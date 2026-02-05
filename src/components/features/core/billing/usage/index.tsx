"use client";

/**
 * Usage Section - Self-contained Client Component
 *
 * All usage management UI with data fetching via API routes:
 * - UsageSummaryCard: Period selection, stats, and summary
 * - DetailedUsageTable: Resource usage with progress bars
 * - UsageEventsTable: Event log with filtering
 * - AllocationCard: Cost allocation rules (future accounting)
 *
 * Used internally by Autlify and exportable as part of Billing SDK.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useDebounce } from "use-debounce";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BillingScope, UsageRow, UsageEventRow, SummaryResponse, EventsResponse, UsageResource, UsageClientProps, UsageDetailsTableProps, AllocationCardProps } from "@/types/billing";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const toCsv = (rows: Record<string, unknown>[]): string => {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    const needs = /[\n\r,\"]/g.test(s);
    const out = s.replace(/\"/g, '""');
    return needs ? `"${out}"` : out;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
};

const downloadText = (filename: string, text: string): void => {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num);
};

// ============================================================================
// DETAILED USAGE TABLE
// ============================================================================

const UsageDetailedTable = ({
  className,
  title = "Detailed Usage",
  description,
  resources,
}: UsageDetailsTableProps) => {
  const getPercentageBar = (percentage: number) => {
    let bgColor = "bg-emerald-500";
    if (percentage >= 90) bgColor = "bg-destructive";
    else if (percentage >= 75) bgColor = "bg-orange-500";

    return (
      <div className="flex min-w-[120px] items-center gap-2">
        <div className="bg-secondary h-2 flex-1 rounded-full">
          <div
            className={cn("h-2 rounded-full transition-all", bgColor)}
            style={{ width: `${Math.max(0, Math.min(percentage, 100))}%` }}
          />
        </div>
        <span className="w-10 text-right text-xs font-medium tabular-nums">
          {Math.round(percentage)}%
        </span>
      </div>
    );
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableCaption className="sr-only">Detailed usage of resources</TableCaption>
            <TableHeader>
              <TableRow className="from-muted/30 via-muted/20 to-muted/30 border-border/50 relative overflow-hidden border-b bg-gradient-to-b hover:bg-gradient-to-b">
                <TableHead className="w-[180px]">Resource</TableHead>
                <TableHead className="text-right">Used</TableHead>
                <TableHead className="text-right">Limit</TableHead>
                <TableHead className="min-w-[160px] text-right">Usage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground h-24 text-center">
                    No resources found
                  </TableCell>
                </TableRow>
              ) : (
                resources.map((resource, index) => {
                  const percentage =
                    resource.percentage ??
                    (resource.limit > 0 ? (resource.used / resource.limit) * 100 : 0);
                  const unit = resource.unit ? ` ${resource.unit}` : "";

                  return (
                    <TableRow key={resource.name || index}>
                      <TableCell className="font-medium">{resource.name}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(resource.used)}
                        {unit}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-right tabular-nums">
                        {formatNumber(resource.limit)}
                        {unit}
                      </TableCell>
                      <TableCell className="text-right">{getPercentageBar(percentage)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// ALLOCATION CARD
// ============================================================================

const AllocationCard = ({ className }: AllocationCardProps) => {
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Cost Allocation</h2>
            <Badge variant="secondary" className="text-xs">
              Add‑On (Future Accounting)
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Define how usage, credits, and invoices are split across departments / cost centers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" disabled>
            Export rules
          </Button>
          <Button disabled>Create rule</Button>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="rounded-lg border bg-muted/30 p-4 text-sm">
        This module is scaffolded for the 9th billing item (Split Bill / Recharges / Cost allocation).
        Once the accounting module is available, wire this page to: (1) dimensions/cost centers, (2)
        allocation rules, (3) downstream postings.
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Basis</th>
              <th className="py-2 pr-4">Target</th>
              <th className="py-2 pr-4">Split</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <tr>
              <td className="py-3 pr-4">Example: Support recharges</td>
              <td className="py-3 pr-4 text-muted-foreground">Usage events</td>
              <td className="py-3 pr-4 text-muted-foreground">Cost Center</td>
              <td className="py-3 pr-4 text-muted-foreground">60/40</td>
              <td className="py-3">
                <Badge variant="outline">Draft</Badge>
              </td>
            </tr>
            <tr>
              <td colSpan={5} className="py-6 text-center text-muted-foreground">
                No allocation rules configured yet.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
};

// ============================================================================
// LOADING SKELETON
// ============================================================================

const LoadingSkeleton = () => {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
        </div>
      </Card>
      <Card className="p-6">
        <Skeleton className="h-48 w-full" />
      </Card>
    </div>
  );
};

// ============================================================================
// MAIN USAGE SECTION
// ============================================================================

export const UsageClient = ({
  scope,
  scopeId,
  showAllocation = true,
  defaultPeriod = "MONTHLY",
  className,
}: UsageClientProps) => {
  // Derive agencyId/subAccountId from scope
  const agencyId = scope === "agency" ? scopeId : undefined;
  const subAccountId = scope === "subAccount" ? scopeId : undefined;
  const apiScope = scope === "subAccount" ? "SUBACCOUNT" : "AGENCY";

  const [period, setPeriod] = useState<"MONTHLY" | "WEEKLY" | "DAILY" | "YEARLY">(defaultPeriod);
  const [periodsBack, setPeriodsBack] = useState<"0" | "1" | "2">("0");
  const [query, setQuery] = useState("");
  const [featureFilter, setFeatureFilter] = useState<string>("__ALL__");
  const [debouncedQuery] = useDebounce(query, 250);

  const [loading, setLoading] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [events, setEvents] = useState<UsageEventRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const features = useMemo(() => {
    const keys = (summary?.rows ?? []).map((r) => r.featureKey);
    return Array.from(new Set(keys)).sort();
  }, [summary?.rows]);

  const filteredRows = useMemo(() => {
    const rows = summary?.rows ?? [];
    const q = debouncedQuery.trim().toLowerCase();
    return rows
      .filter((r) => (featureFilter === "__ALL__" ? true : r.featureKey === featureFilter))
      .filter((r) => (q ? r.featureKey.toLowerCase().includes(q) : true));
  }, [summary?.rows, debouncedQuery, featureFilter]);

  const filteredEvents = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return events
      .filter((e) => (featureFilter === "__ALL__" ? true : e.featureKey === featureFilter))
      .filter((e) =>
        q ? (e.actionKey ?? "").toLowerCase().includes(q) || e.featureKey.toLowerCase().includes(q) : true
      );
  }, [events, debouncedQuery, featureFilter]);

  const refresh = async () => {
    if (!scopeId) return;
    
    setError(null);
    setLoading(true);
    setLoadingEvents(true);
    
    try {
      const url = new URL("/api/features/core/billing/usage/summary", window.location.origin);
      url.searchParams.set("agencyId", agencyId ?? scopeId);
      if (subAccountId) url.searchParams.set("subAccountId", subAccountId);
      url.searchParams.set("scope", apiScope);
      url.searchParams.set("period", period);
      url.searchParams.set("periodsBack", periodsBack);

      const res = await fetch(url.toString(), {
        headers: {
          [subAccountId ? "x-autlify-subaccount" : "x-autlify-agency"]:
            subAccountId ?? agencyId ?? scopeId,
        },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load usage summary");
      setSummary(data);
      setLoading(false);

      const evUrl = new URL("/api/features/core/billing/usage/events", window.location.origin);
      evUrl.searchParams.set("agencyId", agencyId ?? scopeId);
      if (subAccountId) evUrl.searchParams.set("subAccountId", subAccountId);
      evUrl.searchParams.set("scope", apiScope);
      evUrl.searchParams.set("period", period);
      evUrl.searchParams.set("periodsBack", periodsBack);

      const evRes = await fetch(evUrl.toString(), {
        headers: {
          [subAccountId ? "x-autlify-subaccount" : "x-autlify-agency"]:
            subAccountId ?? agencyId ?? scopeId,
        },
        cache: "no-store",
      });
      const evData: EventsResponse = await evRes.json();
      if (!evRes.ok || !evData?.ok) throw new Error((evData as { error?: string })?.error || "Failed to load usage events");
      setEvents(evData.events);
      setLoadingEvents(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeId, period, periodsBack]);

  const windowLabel = useMemo(() => {
    if (!summary?.window) return "";
    const s = new Date(summary.window.periodStart).toLocaleDateString();
    const e = new Date(summary.window.periodEnd).toLocaleDateString();
    return `${s} → ${e}`;
  }, [summary?.window]);

  // No scope ID provided
  if (!scopeId) {
    return (
      <Card className={cn("p-6 text-center", className)}>
        <p className="text-muted-foreground">No context available.</p>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Usage Summary Card */}
      <Card className="p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Usage</h2>
              <Badge variant="secondary" className="font-mono text-xs">
                {apiScope}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Track feature consumption, overages, and events for the selected billing window.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex gap-2">
              <Select value={period} onValueChange={(v: "MONTHLY" | "WEEKLY" | "DAILY" | "YEARLY") => setPeriod(v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>

              <Select value={periodsBack} onValueChange={(v: "0" | "1" | "2") => setPeriodsBack(v)}>
                <SelectTrigger className="w-[170px]">
                  <SelectValue placeholder="Window" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Current window</SelectItem>
                  <SelectItem value="1">Previous window</SelectItem>
                  <SelectItem value="2">2 windows back</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" onClick={refresh} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-lg border bg-card/50 p-3">
            <div className="text-xs text-muted-foreground">Billing window</div>
            <div className="mt-1 font-medium">
              {loading ? <Skeleton className="h-5 w-[180px]" /> : windowLabel}
            </div>
          </div>
          <div className="rounded-lg border bg-card/50 p-3">
            <div className="text-xs text-muted-foreground">Tracked features</div>
            <div className="mt-1 font-medium">
              {loading ? <Skeleton className="h-5 w-[90px]" /> : String(features.length)}
            </div>
          </div>
          <div className="rounded-lg border bg-card/50 p-3">
            <div className="text-xs text-muted-foreground">Events</div>
            <div className="mt-1 font-medium">
              {loadingEvents ? <Skeleton className="h-5 w-[90px]" /> : String(events.length)}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search feature or action…"
            className="md:col-span-2"
          />
          <Select value={featureFilter} onValueChange={setFeatureFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by feature" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__ALL__">All features</SelectItem>
              {features.map((k) => (
                <SelectItem key={k} value={k}>
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Export Buttons */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            className="gap-2"
            disabled={loading || filteredRows.length === 0}
            onClick={() => {
              const csv = toCsv(
                filteredRows.map((r) => ({
                  featureKey: r.featureKey,
                  currentUsage: r.currentUsage,
                  maxAllowed: r.isUnlimited ? "UNLIMITED" : r.maxAllowed ?? "",
                  period: r.period,
                }))
              );
              downloadText(`usage-summary-${period}-${periodsBack}.csv`, csv);
            }}
          >
            <Download className="h-4 w-4" />
            Export summary
          </Button>
          <Button
            variant="secondary"
            className="gap-2"
            disabled={loadingEvents || filteredEvents.length === 0}
            onClick={() => {
              const csv = toCsv(
                filteredEvents.map((e) => ({
                  createdAt: e.createdAt,
                  featureKey: e.featureKey,
                  quantity: e.quantity,
                  actionKey: e.actionKey ?? "",
                  idempotencyKey: e.idempotencyKey,
                }))
              );
              downloadText(`usage-events-${period}-${periodsBack}.csv`, csv);
            }}
          >
            <Download className="h-4 w-4" />
            Export events
          </Button>
        </div>
      </Card>

      {/* Detailed Usage Table */}
      <UsageDetailedTable
        title="Feature usage summary"
        description="Detailed breakdown of feature usage"
        resources={filteredRows.map((r) => ({
          name: r.featureKey || "Unnamed feature",
          used: r.currentUsage ? Number(r.currentUsage) : 0,
          limit: r.isUnlimited ? 0 : r.maxAllowed ? Number(r.maxAllowed) : 0,
          unit: "units",
        }))}
      />

      {/* Usage Events Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Usage events</h3>
          <Badge variant="outline" className={cn("font-mono text-xs", loadingEvents && "opacity-60")}>
            {loadingEvents ? "Loading…" : `${filteredEvents.length} rows`}
          </Badge>
        </div>

        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Feature</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Idempotency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingEvents
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-[140px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-[220px]" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="ml-auto h-5 w-[80px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-[160px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-[260px]" />
                      </TableCell>
                    </TableRow>
                  ))
                : filteredEvents.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(e.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{e.featureKey}</TableCell>
                      <TableCell className="text-right font-medium">{e.quantity}</TableCell>
                      <TableCell>
                        {e.actionKey ?? <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {e.idempotencyKey}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Cost Allocation Card */}
      {showAllocation && <AllocationCard />}
    </div>
  );
};

// Default export
export default UsageClient;

// Re-export types
export type { BillingScope, UsageResource, UsageClientProps, UsageDetailsTableProps, AllocationCardProps };
