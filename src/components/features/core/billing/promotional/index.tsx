"use client";

/**
 * Promotional Section - Self-contained Client Component
 *
 * All promotional management UI with data fetching via API routes:
 * - CreditsCard: Credit balances and top-up (Stripe checkout or manual)
 * - CouponCard: Coupon code validation via Stripe
 *
 * Used internally by Autlify and exportable as part of Billing SDK.
 */

import React, { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
    PlusCircle,
    RefreshCw,
    CreditCard,
    Zap,
    Ticket,
    Calendar,
    Coins,
    Plus,
    TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BillingScope, CreditsCardProps, PromotionalClientProps, Coupon, CouponCardProps, Entitlement, CreditsBalanceRow, CreditBalance, CreditBalanceCardProps } from "@/types/billing";
import { Progress } from "@radix-ui/react-progress";

// ============================================================================
// CREDITS CARD - Credit Balances & Top-Up
// ============================================================================

const CreditBalanceCard = ({
  balance,
  onPurchaseCredits,
  className,
}: CreditBalanceCardProps) => {
  const usagePercentage = (balance.used / balance.total) * 100
  const remainingPercentage = 100 - usagePercentage

  return (
    <div className={cn("rounded-lg border border-border/50 bg-surface-secondary p-6", className)}>
      <Card className="overflow-hidden shadow-lg">
        <CardHeader className="px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg sm:gap-3 sm:text-xl">
              <div className="bg-primary/10 ring-primary/20 rounded-lg p-1.5 ring-1 sm:p-2">
                <Coins className="text-primary h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              Credit Balance
            </CardTitle>
            {onPurchaseCredits && (
              <Button
                size="sm"
                onClick={onPurchaseCredits}
                className="shadow-lg transition-all duration-200 hover:shadow-xl"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add Credits
              </Button>
            )}
          </div>
          <CardDescription className="text-sm sm:text-base">
            Track your credit usage and balance
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-4 sm:px-6">
          {/* Progress Bar Section */}
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums sm:text-4xl">
                {balance.remaining.toLocaleString()}
              </span>
              <span className="text-muted-foreground text-base sm:text-lg">
                / {balance.total.toLocaleString()}
              </span>
              <span className="text-muted-foreground ml-auto text-sm">
                {balance.currency}
              </span>
            </div>

            <Progress value={remainingPercentage} className="h-2" />

            <div className="flex items-center justify-between text-sm">
              <div className="text-muted-foreground flex items-center gap-1.5">
                <TrendingDown className="h-4 w-4" />
                <span>{balance.used.toLocaleString()} used</span>
              </div>
              {balance.expiresAt && (
                <div className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Expires {new Date(balance.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="bg-muted/30 grid grid-cols-3 divide-x rounded-lg border">
            <div className="p-4 text-center">
              <div className="text-primary text-xl font-bold sm:text-2xl">
                {balance.total.toLocaleString()}
              </div>
              <div className="text-muted-foreground mt-1 text-xs">Total</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-xl font-bold text-orange-600 sm:text-2xl">
                {balance.used.toLocaleString()}
              </div>
              <div className="text-muted-foreground mt-1 text-xs">Used</div>
            </div>
            <div className="p-4 text-center">
              <div className="text-xl font-bold text-green-600 sm:text-2xl">
                {balance.remaining.toLocaleString()}
              </div>
              <div className="text-muted-foreground mt-1 text-xs">Remaining</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


const CreditsCard = ({
    agencyId,
    subAccountId,
    className,
}: CreditsCardProps) => {
    const scope = subAccountId ? "SUBACCOUNT" : "AGENCY";

    const [loading, setLoading] = useState(true);
    const [balances, setBalances] = useState<CreditsBalanceRow[]>([]);
    const [entitlements, setEntitlements] = useState<Record<string, Entitlement>>({});

    const [open, setOpen] = useState(false);
    const [featureKey, setFeatureKey] = useState<string>("");
    const [credits, setCredits] = useState<string>("100");
    const [topupMethod, setTopupMethod] = useState<"manual" | "stripe">("stripe");
    const [submitting, setSubmitting] = useState(false);

    // Get credit-enabled features for the dropdown
    const creditEnabledFeatures = useMemo(() => {
        const rows: Entitlement[] = Object.values(entitlements || {});
        return rows
            .filter((e) => e?.creditEnabled)
            .map((e) => ({
                key: e.key,
                label: e.title ? `${e.title} (${e.key})` : e.key,
            }))
            .sort((a, b) => a.key.localeCompare(b.key));
    }, [entitlements]);

    // Refresh credit balances and entitlements
    const refresh = async () => {
        setLoading(true);
        try {
            // Fetch entitlements
            const entUrl = new URL(
                "/api/features/core/billing/entitlements/current",
                window.location.origin
            );
            entUrl.searchParams.set("agencyId", agencyId);
            if (subAccountId) entUrl.searchParams.set("subAccountId", subAccountId);

            const entRes = await fetch(entUrl.toString(), {
                headers: {
                    [subAccountId ? "x-autlify-subaccount" : "x-autlify-agency"]:
                        subAccountId ?? agencyId,
                },
                cache: "no-store",
            });
            const entData = await entRes.json();
            if (!entRes.ok)
                throw new Error(entData?.error || "Failed to load entitlements");
            setEntitlements(entData?.entitlements ?? {});

            // Fetch balances
            const balUrl = new URL(
                "/api/features/core/billing/credits/balance",
                window.location.origin
            );
            balUrl.searchParams.set("agencyId", agencyId);
            if (subAccountId) balUrl.searchParams.set("subAccountId", subAccountId);
            balUrl.searchParams.set("scope", scope);

            const balRes = await fetch(balUrl.toString(), {
                headers: {
                    [subAccountId ? "x-autlify-subaccount" : "x-autlify-agency"]:
                        subAccountId ?? agencyId,
                },
                cache: "no-store",
            });
            const balData = await balRes.json();
            if (!balRes.ok || !balData?.ok)
                throw new Error(balData?.reason || "Failed to load balances");
            setBalances(balData.balances ?? []);
        } catch (e: unknown) {
            const error = e as Error;
            toast.error(error?.message ?? "Failed to load credits");
        } finally {
            setLoading(false);
        }
    };

    // Load on mount and when IDs change
    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [agencyId, subAccountId]);

    // Set default feature when features load
    useEffect(() => {
        if (!featureKey && creditEnabledFeatures.length) {
            setFeatureKey(creditEnabledFeatures[0].key);
        }
    }, [featureKey, creditEnabledFeatures]);

    // Handle top-up submission
    const onTopup = async () => {
        try {
            setSubmitting(true);
            const c = Math.max(1, Math.floor(Number(credits) || 0));
            if (!featureKey || c <= 0) {
                toast.error("Please select a feature and enter credits");
                return;
            }

            if (topupMethod === "stripe") {
                // Stripe checkout for paid credits
                const res = await fetch("/api/stripe/credits/checkout", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        [subAccountId ? "x-autlify-subaccount" : "x-autlify-agency"]:
                            subAccountId ?? agencyId,
                    },
                    body: JSON.stringify({
                        agencyId,
                        subAccountId,
                        featureKey,
                        credits: c,
                    }),
                });
                const data = await res.json();
                if (!res.ok || !data?.ok)
                    throw new Error(data?.error || "Failed to create checkout");

                // Redirect to Stripe checkout
                if (data.url) {
                    window.location.href = data.url;
                }
                return;
            }

            // Manual/internal top-up (admin only)
            const res = await fetch("/api/features/core/billing/credits/topup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    [subAccountId ? "x-autlify-subaccount" : "x-autlify-agency"]:
                        subAccountId ?? agencyId,
                },
                body: JSON.stringify({
                    agencyId,
                    subAccountId,
                    scope,
                    featureKey,
                    credits: c,
                    idempotencyKey: `ui-topup:${agencyId}:${subAccountId ?? "null"}:${featureKey}:${Date.now()}`,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data?.ok)
                throw new Error(data?.error || "Top-up failed");

            toast.success("Credits added");
            setOpen(false);
            await refresh();
        } catch (e: unknown) {
            const error = e as Error;
            toast.error(error?.message ?? "Top-up failed");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card className={cn("p-6", className)}>
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold">Credits & Top‑Up</h2>
                        <Badge variant="secondary" className="font-mono text-xs">
                            {scope}
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Credit balances are used for internal overages and add-ons (per
                        feature). This page is ready for Stripe-paid top-ups.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" className="gap-2" onClick={refresh}>
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </Button>

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <PlusCircle className="h-4 w-4" />
                                Top‑up credits
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Top‑up credits</DialogTitle>
                                <DialogDescription>
                                    Purchase credits to use for features and add-ons.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                {/* Top-up Method Selection */}
                                <div className="space-y-2">
                                    <Label>Top-up Method</Label>
                                    <RadioGroup
                                        value={topupMethod}
                                        onValueChange={(v) =>
                                            setTopupMethod(v as "manual" | "stripe")
                                        }
                                        className="flex gap-4"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="stripe" id="stripe" />
                                            <Label
                                                htmlFor="stripe"
                                                className="flex cursor-pointer items-center gap-2"
                                            >
                                                <CreditCard className="h-4 w-4" />
                                                Pay with Card
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="manual" id="manual" />
                                            <Label
                                                htmlFor="manual"
                                                className="flex cursor-pointer items-center gap-2"
                                            >
                                                <Zap className="h-4 w-4" />
                                                Manual (Admin)
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                {/* Feature Selection */}
                                <div className="space-y-2">
                                    <Label>Feature</Label>
                                    <Select value={featureKey} onValueChange={setFeatureKey}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select feature" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {creditEnabledFeatures.map((f) => (
                                                <SelectItem key={f.key} value={f.key}>
                                                    {f.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Credits Amount */}
                                <div className="space-y-2">
                                    <Label>Credits</Label>
                                    <Input
                                        value={credits}
                                        onChange={(e) => setCredits(e.target.value)}
                                        inputMode="numeric"
                                    />
                                    {topupMethod === "stripe" && (
                                        <p className="text-xs text-muted-foreground">
                                            Price: $
                                            {(Math.max(1, Number(credits) || 0) * 0.01).toFixed(2)} USD
                                            ($0.01 per credit, min $1.00)
                                        </p>
                                    )}
                                    {topupMethod === "manual" && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400">
                                            Manual top-up is for admin use only. No payment will be
                                            charged.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                    disabled={submitting}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={onTopup} disabled={submitting}>
                                    {submitting
                                        ? "Processing..."
                                        : topupMethod === "stripe"
                                            ? "Pay & Add Credits"
                                            : "Add Credits"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Separator className="my-4" />

            {/* Balances Table */}
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Feature</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                            <TableHead>Expires</TableHead>
                            <TableHead>Period</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading
                            ? Array.from({ length: 6 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell>
                                        <Skeleton className="h-5 w-[240px]" />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Skeleton className="ml-auto h-5 w-[120px]" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-5 w-[160px]" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-5 w-[120px]" />
                                    </TableCell>
                                </TableRow>
                            ))
                            : balances.map((b) => {
                                const ent = entitlements?.[b.featureKey];
                                return (
                                    <TableRow key={b.featureKey}>
                                        <TableCell className="font-mono text-xs">
                                            {b.featureKey}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {b.balance}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {b.expiresAt
                                                ? new Date(b.expiresAt).toLocaleDateString()
                                                : "—"}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {ent?.period ?? "—"}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        {!loading && balances.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="text-center text-sm text-muted-foreground"
                                >
                                    No credit balances yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </Card>
    );
};

// ============================================================================
// COUPON CARD - Coupon Validation
// ============================================================================



const CouponCard = ({ className }: CouponCardProps) => {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [coupon, setCoupon] = useState<Coupon | null>(null);

    // Validate coupon code via Stripe
    const validate = async () => {
        try {
            setLoading(true);
            setCoupon(null);
            const res = await fetch("/api/stripe/validate-coupon", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: code.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Invalid coupon");
            setCoupon(data.coupon);
            toast.success("Coupon valid");
        } catch (e: unknown) {
            const error = e as Error;
            toast.error(error?.message ?? "Failed to validate");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className={cn("p-6", className)}>
            <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold">Coupons</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
                Validate a coupon code (Stripe). Apply the code during subscription
                checkout.
            </p>

            <Separator className="my-4" />

            {/* Coupon Input */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter coupon code…"
                />
                <Button onClick={validate} disabled={loading || !code.trim()}>
                    {loading ? "Validating…" : "Validate"}
                </Button>
            </div>

            {/* Coupon Details */}
            {coupon && (
                <div className="mt-4 rounded-lg border bg-card/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="font-medium">{coupon.id}</div>
                            <div className="mt-1 text-sm text-muted-foreground">
                                {coupon.percent_off != null
                                    ? `${coupon.percent_off}% off`
                                    : coupon.amount_off != null
                                        ? `${coupon.amount_off} ${coupon.currency?.toUpperCase()} off`
                                        : "—"}
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">
                                Duration: {coupon.duration}
                                {coupon.duration_in_months
                                    ? ` (${coupon.duration_in_months} months)`
                                    : ""}
                            </div>
                        </div>
                        <Badge>Valid</Badge>
                    </div>
                </div>
            )}
        </Card>
    );
};

// ============================================================================
// MAIN PROMOTIONAL SECTION
// ============================================================================

export const PromotionalClient = ({
    scope,
    scopeId,
    showCredits = true,
    showCoupons = true,
    className,
}: PromotionalClientProps) => {
    // Derive agencyId/subAccountId from scope
    const agencyId = scope === "agency" ? scopeId : undefined;
    const subAccountId = scope === "subAccount" ? scopeId : undefined;
    const hasValidAgency = Boolean(agencyId);

    return (
        <div className={cn("space-y-6", className)}>
            {/* Credits Section */}
            {showCredits && hasValidAgency && (
                <CreditsCard agencyId={agencyId!} subAccountId={subAccountId} />
            )}

            {/* Coupons Section */}
            {showCoupons && <CouponCard />}

            {/* Empty State */}
            {!showCredits && !showCoupons && (
                <Card className="p-6 text-center">
                    <p className="text-muted-foreground">
                        No promotional features enabled.
                    </p>
                </Card>
            )}
        </div>
    );
};

// Default export
export default PromotionalClient;

// Re-export individual components for granular usage
export { CreditsCard, CouponCard };

// Re-export types
export type { BillingScope, PromotionalClientProps, CreditsCardProps, CouponCardProps, Entitlement, Coupon, CreditsBalanceRow };
