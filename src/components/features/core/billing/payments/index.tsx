"use client";

/**
 * Payments Section - Self-contained Client Component
 *
 * All payment management UI with data fetching via server actions:
 * - PaymentMethodsCard: Payment method management with Stripe Elements
 * - InvoiceListCard: Invoice history with view/download/share actions
 *
 * Used internally by Autlify and exportable as part of Billing SDK.
 */

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { SavedBankCardsGallery } from "@/components/ui/bank-card";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { getAgencyDetails } from "@/lib/queries";
import { getCustomer } from "@/lib/stripe/actions/customer";
import {
    createSetupIntent,
    detachPaymentMethod,
    listPaymentMethods,
    replacePaymentMethod,
    setDefaultPaymentMethod,
} from "@/lib/stripe/actions/payment-method";
import { listDunningInvoices, listInvoices } from "@/lib/stripe/actions/subscription";
import { cn } from "@/lib/utils";
import type { BankCard, BillingScope, DunningInvoice, Invoice, PaymentClientProps } from "@/types/billing";
import {
    Elements,
    PaymentElement,
    useElements,
    useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
    AlertTriangle,
    CreditCard,
    Download,
    ExternalLink,
    Eye,
    FileText,
    Loader2,
    Plus,
    RefreshCw,
    Share2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const mapStripeStatus = (status: string | null): Invoice["status"] => {
    switch (status) {
        case "paid":
            return "paid";
        case "open":
        case "draft":
            return "pending";
        default:
            return "failed";
    }
}

const mapBrandToVariant = (brand: string | undefined): BankCard["variant"] => {
    switch (brand?.toLowerCase()) {
        case "visa":
        case "mastercard":
            return "default";
        case "amex":
            return "premium";
        case "discover":
            return "platinum";
        default:
            return "default";
    }
}

// ============================================================================
// ADD CARD FORM (Stripe Elements)
// ============================================================================

const AddCardForm = ({
    onSuccess,
    onCancel,
}: {
    onSuccess: () => void;
    onCancel: () => void;
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const { error } = await stripe.confirmSetup({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}${window.location.pathname}`,
                },
                redirect: "if_required",
            });

            if (error) {
                setErrorMessage(error.message || "An error occurred");
            } else {
                onSuccess();
            }
        } catch {
            setErrorMessage("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />

            {errorMessage && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {errorMessage}
                </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={!stripe || isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                        </>
                    ) : (
                        <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Add Card
                        </>
                    )}
                </Button>
            </DialogFooter>
        </form>
    );
}

// ============================================================================
// REPLACE CARD FORM (Stripe Elements)
// ============================================================================

const ReplaceCardForm = ({
    onSuccess,
    onCancel,
}: {
    onSuccess: (paymentMethodId: string) => void;
    onCancel: () => void;
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const { error, setupIntent } = await stripe.confirmSetup({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}${window.location.pathname}`,
                },
                redirect: "if_required",
            });

            if (error) {
                setErrorMessage(error.message || "An error occurred");
            } else if (setupIntent?.payment_method) {
                // Pass the new payment method ID to parent
                onSuccess(setupIntent.payment_method as string);
            } else {
                setErrorMessage("Failed to get payment method from setup");
            }
        } catch {
            setErrorMessage("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <PaymentElement />

            {errorMessage && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {errorMessage}
                </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={!stripe || isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Replacing...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Replace Card
                        </>
                    )}
                </Button>
            </DialogFooter>
        </form>
    );
}

// ============================================================================
// PAYMENT METHODS CARD
// ============================================================================

const PaymentMethodsCard = ({
    agencyId,
    cards,
    onRefresh,
    className,
}: {
    agencyId: string;
    cards: BankCard[];
    onRefresh: () => void;
    className?: string;
}) => {
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [cardToRemove, setCardToRemove] = useState<string | null>(null);

    // Add card modal state
    const [showAddCardModal, setShowAddCardModal] = useState(false);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [, setIsCreatingSetupIntent] = useState(false);

    // Replace card modal state
    const [showReplaceCardModal, setShowReplaceCardModal] = useState(false);
    const [replaceClientSecret, setReplaceClientSecret] = useState<string | null>(null);
    const [cardToReplace, setCardToReplace] = useState<string | null>(null);

    const handleAddCard = async () => {
        setIsCreatingSetupIntent(true);
        try {
            const result = await createSetupIntent(agencyId);
            if (result.success) {
                setClientSecret(result.data.clientSecret);
                setShowAddCardModal(true);
            } else {
                toast({
                    title: "Error",
                    description: result.error,
                    variant: "destructive",
                });
            }
        } catch {
            toast({
                title: "Error",
                description: "Failed to initialize card setup",
                variant: "destructive",
            });
        } finally {
            setIsCreatingSetupIntent(false);
        }
    };

    const handleAddCardSuccess = () => {
        setShowAddCardModal(false);
        setClientSecret(null);
        toast({
            title: "Card added",
            description: "Your payment method has been added successfully.",
        });
        onRefresh();
    };

    const handleAddCardClose = () => {
        setShowAddCardModal(false);
        setClientSecret(null);
    };

    const handleSetDefault = async (cardId: string) => {
        setIsLoading(true);
        try {
            const result = await setDefaultPaymentMethod(agencyId, undefined, cardId);

            if (result.success) {
                toast({
                    title: "Default card updated",
                    description:
                        "Your default payment method has been updated successfully.",
                });
                onRefresh();
            } else {
                toast({
                    title: "Error",
                    description: result.error,
                    variant: "destructive",
                });
            }
        } catch {
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveCard = async (cardId: string) => {
        setCardToRemove(cardId);
    };

    const confirmRemoveCard = async () => {
        if (!cardToRemove) return;

        setIsLoading(true);
        try {
            const result = await detachPaymentMethod(agencyId, undefined, cardToRemove);

            if (result.success) {
                toast({
                    title: "Card removed",
                    description: "Your payment method has been removed successfully.",
                });
                onRefresh();
            } else {
                toast({
                    title: "Error",
                    description: result.error,
                    variant: "destructive",
                });
            }
        } catch {
            toast({
                title: "Error",
                description: "An unexpected error occurred",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
            setCardToRemove(null);
        }
    };

    const handleReplaceCard = async (cardId: string) => {
        // Store the card to replace
        setCardToReplace(cardId);
        setIsCreatingSetupIntent(true);

        try {
            // Create SetupIntent to collect new card
            const result = await createSetupIntent(agencyId);
            if (result.success) {
                setReplaceClientSecret(result.data.clientSecret);
                setShowReplaceCardModal(true);
            } else {
                toast({
                    title: "Error",
                    description: result.error,
                    variant: "destructive",
                });
            }
        } catch {
            toast({
                title: "Error",
                description: "Failed to initialize card replacement",
                variant: "destructive",
            });
        } finally {
            setIsCreatingSetupIntent(false);
        }
    };

    const handleReplaceCardSuccess = async (newPaymentMethodId: string) => {
        if (!cardToReplace || !newPaymentMethodId) {
            toast({
                title: "Error",
                description: "Missing card information",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            const result = await replacePaymentMethod(agencyId, undefined, cardToReplace, newPaymentMethodId);
            if (result.success) {
                toast({
                    title: "Card replaced",
                    description: "Your payment method has been replaced successfully.",
                });
                onRefresh();
            } else {
                toast({
                    title: "Error",
                    description: result.error,
                    variant: "destructive",
                });
            }
        } catch {
            toast({
                title: "Error",
                description: "An unexpected error occurred while replacing card",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
            setShowReplaceCardModal(false);
            setReplaceClientSecret(null);
            setCardToReplace(null);
        }
    };

    const handleReplaceCardClose = () => {
        setShowReplaceCardModal(false);
        setReplaceClientSecret(null);
        setCardToReplace(null);
    };

    const stripeOptions = clientSecret
        ? {
            clientSecret,
            appearance: {
                theme: "night" as const,
                variables: {
                    colorPrimary: "#6366f1",
                    colorBackground: "#1f2937",
                    colorText: "#f9fafb",
                    borderRadius: "8px",
                },
            },
        }
        : null;

    return (
        <div className={cn("space-y-4", className)}>
            <Card className="shadow-lg">
                <CardHeader className="px-4 pb-4 sm:px-6 sm:pb-6">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg sm:gap-3 sm:text-xl">
                            <div className="rounded-lg bg-primary/10 p-1.5 ring-1 ring-primary/20 sm:p-2">
                                <CreditCard className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
                            </div>
                            Payment Methods
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={handleAddCard} className="gap-1.5">
                            <Plus className="h-4 w-4" />
                            Add New Card
                        </Button>
                    </div>
                    <CardDescription className="text-sm sm:text-base">
                        Manage your saved payment methods for billing
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                    <SavedBankCardsGallery
                        cards={cards}
                        compact={false}
                        onSetDefault={handleSetDefault}
                        onRemoveCard={handleRemoveCard}
                        onReplaceCard={handleReplaceCard}
                    />
                </CardContent>
            </Card>

            {/* Add Card Modal */}
            <Dialog open={showAddCardModal} onOpenChange={handleAddCardClose}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Add Payment Method
                        </DialogTitle>
                        <DialogDescription>
                            Enter your card details below. Your card will be securely saved
                            for future payments.
                        </DialogDescription>
                    </DialogHeader>

                    {clientSecret && stripeOptions && (
                        <Elements stripe={stripePromise} options={stripeOptions}>
                            <AddCardForm
                                onSuccess={handleAddCardSuccess}
                                onCancel={handleAddCardClose}
                            />
                        </Elements>
                    )}
                </DialogContent>
            </Dialog>

            {/* Replace Card Modal */}
            <Dialog open={showReplaceCardModal} onOpenChange={handleReplaceCardClose}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <RefreshCw className="h-5 w-5" />
                            Replace Payment Method
                        </DialogTitle>
                        <DialogDescription>
                            Enter your new card details. The old card will be removed automatically.
                        </DialogDescription>
                    </DialogHeader>

                    {replaceClientSecret && (
                        <Elements
                            stripe={stripePromise}
                            options={{
                                clientSecret: replaceClientSecret,
                                appearance: {
                                    theme: "night" as const,
                                    variables: {
                                        colorPrimary: "#6366f1",
                                        colorBackground: "#1f2937",
                                        colorText: "#f9fafb",
                                        borderRadius: "8px",
                                    },
                                },
                            }}
                        >
                            <ReplaceCardForm
                                onSuccess={handleReplaceCardSuccess}
                                onCancel={handleReplaceCardClose}
                            />
                        </Elements>
                    )}
                </DialogContent>
            </Dialog>

            {/* Remove Card Confirmation */}
            <AlertDialog
                open={cardToRemove !== null}
                onOpenChange={(open) => !open && setCardToRemove(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove payment method?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the card from your account. If this is your
                            default payment method, you&apos;ll need to set a new default before
                            the next billing cycle.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmRemoveCard}
                            disabled={isLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isLoading ? "Removing..." : "Remove Card"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// ============================================================================
// INVOICE LIST CARD
// ============================================================================

const InvoiceListCard = ({
    invoices,
    className,
}: {
    invoices: Invoice[];
    className?: string;
}) => {
    const { toast } = useToast();

    const getStatusColor = (status: Invoice["status"]) => {
        switch (status) {
            case "paid":
                return "bg-green-500/10 text-green-500 border-green-500/20";
            case "pending":
                return "bg-orange-500/10 text-orange-500 border-orange-500/20";
            case "failed":
                return "bg-destructive/10 text-destructive border-destructive/20";
        }
    };

    const handleShare = async (invoice: Invoice) => {
        if (navigator.share && invoice.viewUrl) {
            try {
                await navigator.share({
                    title: `Invoice ${invoice.description}`,
                    text: `Invoice for ${invoice.amount} - ${invoice.date}`,
                    url: invoice.viewUrl,
                });
            } catch {
                // User cancelled or share failed silently
            }
        } else if (invoice.viewUrl) {
            // Fallback: copy to clipboard
            await navigator.clipboard.writeText(invoice.viewUrl);
            toast({
                title: "Link copied",
                description: "Invoice link copied to clipboard",
            });
        }
    };

    return (
        <Card className={cn("shadow-lg", className)}>
            <CardHeader className="px-4 pb-3 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="rounded-lg bg-primary/10 p-1.5 ring-1 ring-primary/20">
                        <FileText className="h-4 w-4 text-primary" />
                    </div>
                    Invoice History
                </CardTitle>
                <CardDescription className="text-sm">
                    View and download your past invoices
                </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pt-0 sm:px-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="py-2 text-center text-muted-foreground"
                                >
                                    No invoices found
                                </TableCell>
                            </TableRow>
                        ) : (
                            invoices.map((invoice) => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="py-2 font-medium">{invoice.date}</TableCell>
                                    <TableCell className="py-2">{invoice.description}</TableCell>
                                    <TableCell className="py-2">
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                getStatusColor(invoice.status),
                                                "backdrop-blur-sm"
                                            )}
                                        >
                                            {invoice.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-2 text-right font-medium">
                                        {invoice.amount}
                                    </TableCell>
                                    <TableCell className="py-2 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {invoice.viewUrl && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => window.open(invoice.viewUrl, "_blank")}
                                                    className="transition-all duration-200 hover:bg-primary/10"
                                                    title="View Invoice"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {invoice.downloadUrl && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        window.open(invoice.downloadUrl, "_blank")
                                                    }
                                                    className="transition-all duration-200 hover:bg-primary/10"
                                                    title="Download PDF"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {invoice.viewUrl && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleShare(invoice)}
                                                    className="transition-all duration-200 hover:bg-primary/10"
                                                    title="Share Invoice"
                                                >
                                                    <Share2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// DUNNING CARD
// ============================================================================

const DunningCard = ({
    dunningInvoices,
    className,
}: {
    dunningInvoices: DunningInvoice[];
    className?: string;
}) => {
    const openCount = dunningInvoices.filter((inv) => inv.status === "open").length;
    const uncollectibleCount = dunningInvoices.filter((inv) => inv.status === "uncollectible").length;

    return (
        <Card className={cn("shadow-lg", className)}>
            <CardHeader className="px-4 pb-3 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="rounded-lg bg-orange-500/10 p-1.5 ring-1 ring-orange-500/20">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </div>
                    Dunning
                </CardTitle>
                <CardDescription className="text-sm">
                    Monitor payment failures, overdue invoices, and recovery actions
                </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pt-0 sm:px-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3 mb-4">
                    <div className="rounded-lg border bg-card/50 p-3">
                        <div className="text-xs text-muted-foreground">Open invoices</div>
                        <div className="mt-1 text-2xl font-semibold">{openCount}</div>
                    </div>
                    <div className="rounded-lg border bg-card/50 p-3">
                        <div className="text-xs text-muted-foreground">Uncollectible</div>
                        <div className="mt-1 text-2xl font-semibold">{uncollectibleCount}</div>
                    </div>
                    <div className="rounded-lg border bg-card/50 p-3">
                        <div className="text-xs text-muted-foreground">Total flagged</div>
                        <div className="mt-1 text-2xl font-semibold">{dunningInvoices.length}</div>
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Invoice</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Due</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {dunningInvoices.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="py-4 text-center text-muted-foreground"
                                >
                                    No overdue invoices found
                                </TableCell>
                            </TableRow>
                        ) : (
                            dunningInvoices.map((inv) => (
                                <TableRow key={inv.id}>
                                    <TableCell className="py-2 text-muted-foreground">{inv.date}</TableCell>
                                    <TableCell className="py-2 font-mono text-xs">{inv.number}</TableCell>
                                    <TableCell className="py-2">
                                        <Badge
                                            variant={inv.status === "open" ? "secondary" : "outline"}
                                            className="backdrop-blur-sm"
                                        >
                                            {inv.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-2 text-muted-foreground">
                                        {inv.dueDate ?? "—"}
                                    </TableCell>
                                    <TableCell className="py-2 text-right font-medium">
                                        {inv.amount} {inv.currency}
                                    </TableCell>
                                    <TableCell className="py-2 text-right">
                                        {inv.hostedUrl ? (
                                            <Button
                                                asChild
                                                variant="outline"
                                                size="sm"
                                            >
                                                <a href={inv.hostedUrl} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="mr-2 h-4 w-4" />
                                                    Open
                                                </a>
                                            </Button>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

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
                    <div className="flex gap-4">
                        <Skeleton className="h-32 w-48" />
                        <Skeleton className="h-32 w-48" />
                    </div>
                </div>
            </Card>
            <Card className="p-6">
                <div className="space-y-4">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </Card>
        </div>
    );
}

// ============================================================================
// MAIN PAYMENTS SECTION
// ============================================================================

export const PaymentClient = ({
    scope,
    scopeId,
    customerId: initialCustomerId,
    name: initialName,
    showPaymentMethods = true,
    showInvoices = true,
    showDunning = false,
    className,
}: PaymentClientProps) => {
    const [loading, setLoading] = useState(true);
    const [cards, setCards] = useState<BankCard[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [dunningInvoices, setDunningInvoices] = useState<DunningInvoice[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [customerId, setCustomerId] = useState<string | undefined>(initialCustomerId ?? undefined);
    const [name, setName] = useState<string | undefined>(initialName ?? undefined);

    // Fetch data on mount
    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch customerId from agency if not provided
            let cid = customerId;
            let customerName = name;

            if (!cid && scope === 'agency') {
                const agency = await getAgencyDetails(scopeId);
                if (agency?.customerId) {
                    cid = agency.customerId;
                    customerName = agency.name || undefined;
                    setCustomerId(cid);
                    setName(customerName);
                }
            }

            if (!cid) {
                setLoading(false);
                return;
            }
            // Fetch customer for default payment method
            const customer = await getCustomer(cid);
            const defaultPmId =
                customer?.invoice_settings?.default_payment_method as string | null;

            // Fetch payment methods
            const pmResult = await listPaymentMethods(undefined, undefined, cid);
            if (pmResult.success) {
                const mappedCards: BankCard[] = pmResult.data.map((pm) => ({
                    id: pm.id,
                    cardNumber: `•••• •••• •••• ${pm.card?.last4 || "----"}`,
                    cardholderName: pm.billing_details?.name || customerName || "Cardholder",
                    expiryMonth: String(pm.card?.exp_month || "--").padStart(2, "0"),
                    expiryYear: String(pm.card?.exp_year || "----"),
                    variant: mapBrandToVariant(pm.card?.brand),
                    isDefault: pm.id === defaultPmId,
                    brand: pm.card?.brand?.toUpperCase(),
                }));
                setCards(mappedCards);
            }

            // Fetch invoices
            const invResult = await listInvoices(cid, 25);
            if (invResult.success) {
                const mappedInvoices: Invoice[] = invResult.data.map((inv) => {
                    const amount = (inv.amount_paid ?? inv.amount_due ?? 0) / 100;
                    const currency = inv.currency?.toUpperCase() ?? "USD";

                    return {
                        id: inv.id,
                        date: inv.created
                            ? new Date(inv.created * 1000).toLocaleDateString()
                            : "—",
                        description:
                            inv.number ?? inv.lines.data[0]?.description ?? "Invoice",
                        amount: `${amount.toFixed(2)} ${currency}`,
                        status: mapStripeStatus(inv.status ?? null),
                        viewUrl: inv.hosted_invoice_url ?? undefined,
                        downloadUrl: inv.invoice_pdf ?? undefined,
                    };
                });
                setInvoices(mappedInvoices);
            }

            // Fetch dunning invoices (open + uncollectible)
            if (showDunning) {
                const dunningResult = await listDunningInvoices(cid, 25);
                if (dunningResult.success) {
                    const mappedDunning: DunningInvoice[] = dunningResult.data.map((inv) => ({
                        id: inv.id,
                        number: inv.number ?? inv.id,
                        status: inv.status as 'open' | 'uncollectible',
                        date: inv.created ? new Date(inv.created * 1000).toLocaleDateString() : "—",
                        dueDate: inv.due_date ? new Date(inv.due_date * 1000).toLocaleDateString() : null,
                        amount: ((inv.amount_due ?? 0) / 100).toFixed(2),
                        currency: inv.currency?.toUpperCase() ?? "USD",
                        hostedUrl: inv.hosted_invoice_url ?? null,
                    }));
                    setDunningInvoices(mappedDunning);
                }
            }
        } catch (e) {
            console.error("Failed to fetch payment data:", e);
            setError("Failed to load payment information");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scopeId]);

    // Subaccount not supported message
    if (scope !== "agency") {
        return (
            <Card className="p-6">
                <h2 className="text-lg font-semibold">Payments</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Payment management for subaccounts is not enabled yet.
                </p>
            </Card>
        );
    }

    // Loading state
    if (loading) {
        return <LoadingSkeleton />;
    }

    // Error state
    if (error) {
        return (
            <Card className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-destructive">Error</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                    </div>
                    <Button variant="outline" onClick={fetchData}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry
                    </Button>
                </div>
            </Card>
        );
    }

    return (
        <div className={cn("space-y-4", className)}>
            {/* Header with customer info */}
            {/* <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                    {customerId ? (
                        <>
                            Customer ID: <span className="font-mono">{customerId}</span>
                        </>
                    ) : (
                        <Badge variant="outline">No Stripe customer linked</Badge>
                    )}
                </div>
                <Button
                    asChild
                    variant="outline"
                    size="sm"
                >
                    <a
                        href="https://dashboard.stripe.com"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View in Stripe
                    </a>
                </Button>
            </div> */}

            {/* Payment Methods */}
            {showPaymentMethods && (
                <PaymentMethodsCard
                    agencyId={scopeId}
                    cards={cards}
                    onRefresh={fetchData}
                />
            )}

            {/* Invoices */}
            {showInvoices && <InvoiceListCard invoices={invoices} />}

            {/* Dunning */}
            {showDunning && <DunningCard dunningInvoices={dunningInvoices} />}
        </div>
    );
}

// Default export
export default PaymentClient;

// Re-export types
export type { BankCard, BillingScope, DunningInvoice, Invoice, PaymentClientProps };

