"use client";

import React, { useState } from "react";
import {
    SubscriptionCard,
    InvoiceList,
    UsageDisplay,
    TrialBanner,
    PlanSelectorDialog,
    CancelSubscriptionDialog,
    PaymentMethodsList,
    CreditBalanceCard,
    CreditHistory,
    DunningAlerts,
} from "@autlify/billing-sdk";
import type { PlanOption } from "@autlify/billing-sdk";
import { Button } from "@/components/ui/button";

// Local types for showcase data
interface SubscriptionPlan {
    name: string;
    price: string;
    billingCycle: string;
    description: string;
    status: "active" | "inactive" | "trialing" | "past_due" | "cancelled";
    features: string[];
}

interface BillingInfo {
    nextBillingDate: string;
    paymentMethod: string;
}

interface Invoice {
    id: string;
    date: string;
    amount: string;
    status: "paid" | "pending" | "failed" | "void";
    description: string;
    downloadUrl?: string;
}

interface UsageMetric {
    name: string;
    current: number;
    limit: number;
    unit: string;
    unlimited?: boolean;
}

interface PaymentMethodCard {
    id: string;
    cardNumber: string;
    cardholderName: string;
    expiryMonth: string;
    expiryYear: string;
    brand: string;
    variant: string;
    isDefault: boolean;
}

interface CreditBalance {
    total: number;
    used: number;
    remaining: number;
    expiresAt?: Date;
    currency: string;
}

interface CreditTransaction {
    id: string;
    amount: number;
    type: "PURCHASE" | "DEDUCTION" | "REFUND" | "BONUS" | "EXPIRY";
    description: string;
    createdAt: Date;
    expiresAt?: Date;
}

interface DunningStrike {
    id: string;
    agencyId: string;
    level: number;
    createdAt: Date;
    failedPayments: Array<{
        id: string;
        invoiceId: string;
        attemptedAt: Date;
        amount: number;
        currency: string;
        failureReason: string;
        nextRetryAt?: Date;
        attemptsRemaining: number;
    }>;
}

export function BillingSDKSection() {
    // State for controlling dialogs
    const [planDialogOpen, setPlanDialogOpen] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    // Sample data
    const plan: SubscriptionPlan = {
        name: "Professional Plan",
        price: "$49",
        billingCycle: "month",
        description: "Perfect for growing teams and businesses",
        status: "active",
        features: [
            "Unlimited Sub Accounts",
            "Advanced Analytics",
            "Priority Support",
            "Custom Integrations",
            "Team Collaboration",
            "API Access",
        ],
    };

    const billingInfo: BillingInfo = {
        nextBillingDate: "February 27, 2026",
        paymentMethod: "•••• •••• •••• 4242",
    };

    const invoices: Invoice[] = [
        {
            id: "inv_001",
            date: "2026-01-01",
            amount: "$49.00",
            status: "paid",
            description: "Professional Plan - January 2026",
            downloadUrl: "/invoices/inv_001.pdf",
        },
        {
            id: "inv_002",
            date: "2025-12-01",
            amount: "$49.00",
            status: "paid",
            description: "Professional Plan - December 2025",
            downloadUrl: "/invoices/inv_002.pdf",
        },
        {
            id: "inv_003",
            date: "2025-11-01",
            amount: "$49.00",
            status: "paid",
            description: "Professional Plan - November 2025",
            downloadUrl: "/invoices/inv_003.pdf",
        },
    ];

    const usageMetrics: UsageMetric[] = [
        {
            name: "Sub Accounts",
            current: 6,
            limit: 8,
            unit: "accounts",
            unlimited: true,
        },
        {
            name: "Team Members",
            current: 12,
            limit: 50,
            unit: "members",
            unlimited: false,
        },
        {
            name: "API Calls",
            current: 45230,
            limit: 100000,
            unit: "calls",
            unlimited: false,
        },
        {
            name: "Storage Used",
            current: 23.5,
            limit: 100,
            unit: "GB",
            unlimited: false,
        },
    ];

    const plans: PlanOption[] = [
        {
            id: "starter",
            name: "Starter",
            description: "For individuals and small projects",
            monthlyPrice: "19",
            yearlyPrice: "190",
            currency: "$",
            features: [
                "5 Sub Accounts",
                "Basic Analytics",
                "Email Support",
                "1GB Storage",
            ],
        },
        {
            id: "professional",
            name: "Professional",
            description: "Perfect for growing teams",
            monthlyPrice: "49",
            yearlyPrice: "490",
            currency: "$",
            popular: true,
            features: [
                "Unlimited Sub Accounts",
                "Advanced Analytics",
                "Priority Support",
                "10GB Storage",
                "Custom Integrations",
            ],
        },
        {
            id: "enterprise",
            name: "Enterprise",
            description: "For large organizations",
            monthlyPrice: "199",
            yearlyPrice: "1990",
            currency: "$",
            features: [
                "Everything in Professional",
                "Dedicated Support",
                "Unlimited Storage",
                "SLA Guarantee",
                "Custom Features",
            ],
        },
    ];

    const paymentMethods: PaymentMethodCard[] = [
        {
            id: "pm_1",
            cardNumber: "4242 4242 4242 4242",
            cardholderName: "John Doe",
            expiryMonth: "12",
            expiryYear: "2028",
            brand: "Visa",
            variant: "premium",
            isDefault: true,
        },
        {
            id: "pm_2",
            cardNumber: "•••• •••• •••• 5555",
            cardholderName: "John Doe",
            expiryMonth: "08",
            expiryYear: "2027",
            brand: "Mastercard",
            variant: "default",
            isDefault: false,
        },
    ];

    const creditBalance: CreditBalance = {
        total: 10000,
        used: 3500,
        remaining: 6500,
        expiresAt: new Date("2026-12-31"),
        currency: "USD",
    };

    const creditTransactions: CreditTransaction[] = [
        {
            id: "ct_1",
            amount: 5000,
            type: "PURCHASE",
            description: "Credit purchase - 5,000 credits",
            createdAt: new Date("2026-01-15"),
            expiresAt: new Date("2026-12-31"),
        },
        {
            id: "ct_2",
            amount: 1500,
            type: "DEDUCTION",
            description: "API usage - January 2026",
            createdAt: new Date("2026-01-20"),
        },
        {
            id: "ct_3",
            amount: 2000,
            type: "DEDUCTION",
            description: "Storage usage - January 2026",
            createdAt: new Date("2026-01-22"),
        },
        {
            id: "ct_4",
            amount: 1000,
            type: "BONUS",
            description: "Referral bonus",
            createdAt: new Date("2026-01-25"),
            expiresAt: new Date("2026-12-31"),
        },
    ];

    const dunningStrikes: DunningStrike[] = [
        {
            id: "ds_1",
            agencyId: "agency_1",
            level: 1,
            createdAt: new Date("2026-01-25"),
            failedPayments: [
                {
                    id: "fp_1",
                    invoiceId: "inv_failed_1",
                    attemptedAt: new Date("2026-01-25"),
                    amount: 49.00,
                    currency: "USD",
                    failureReason: "Insufficient funds",
                    nextRetryAt: new Date("2026-01-28"),
                    attemptsRemaining: 2,
                },
            ],
        },
    ];

    // Convert local dunningStrikes to SDK's expected alerts format
    const dunningAlerts = dunningStrikes.flatMap(strike => 
        strike.failedPayments.map(fp => ({
            id: fp.id,
            level: strike.level as 1 | 2 | 3,
            message: fp.failureReason,
            invoiceId: fp.invoiceId,
            amount: fp.amount,
            currency: fp.currency,
            dueDate: fp.nextRetryAt,
        }))
    );

    return (
        <section className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold mb-2">Billing SDK</h2>
                <p className="text-muted-foreground">
                    Comprehensive billing and subscription management components
                </p>
            </div>

            <div className="space-y-8">

                {/* Trial Banner */}
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Trial Banner</h3>
                    <TrialBanner
                        trialEndDate={new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)}
                        onUpgrade={async () => {
                            console.log("Upgrade clicked");
                            await new Promise(resolve => setTimeout(resolve, 500));
                            alert("Redirecting to upgrade page...");
                            setPlanDialogOpen(true);
                        }}
                    />
                </div>

                {/* Dunning Alerts */}
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Dunning Alerts</h3>
                    <DunningAlerts
                        alerts={dunningAlerts}
                        onRetryPayment={async (invoiceId: string) => {
                            console.log("Retry payment:", invoiceId);
                            // Simulate payment retry API call
                            await new Promise(resolve => setTimeout(resolve, 1500));
                            alert(`Payment retry successful for invoice: ${invoiceId}`);
                        }}
                    />
                </div>

                {/* Subscription Card with Integrated Dialogs */}
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Subscription Management</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                        Complete subscription management with integrated plan selection and cancellation dialogs
                    </p>
                    <SubscriptionCard
                        plan={plan}
                        billingInfo={billingInfo}
                        onChangePlan={() => setPlanDialogOpen(true)}
                        onCancelSubscription={() => setCancelDialogOpen(true)}
                    />

                    {/* Hidden dialogs controlled by SubscriptionCard buttons */}
                    <div className="hidden">
                        <PlanSelectorDialog
                            open={planDialogOpen}
                            onOpenChange={setPlanDialogOpen}
                            currentPlanId="professional"
                            plans={plans}
                            onSelectPlan={async (planId: string, billingCycle: "monthly" | "yearly") => {
                                console.log("Selected plan:", planId, billingCycle);
                                await new Promise(resolve => setTimeout(resolve, 1000));
                                alert(`Plan changed to ${planId} (${billingCycle})`);
                                setPlanDialogOpen(false);
                            }}
                        />
                        {cancelDialogOpen && (
                            <CancelSubscriptionDialog
                                plan={{
                                    id: plans[1].id,
                                    title: plans[1].name,
                                    description: plans[1].description,
                                    currency: plans[1].currency,
                                    monthlyPrice: plans[1].monthlyPrice,
                                    yearlyPrice: plans[1].yearlyPrice,
                                    buttonText: "Select Plan",
                                    features: plans[1].features.map((f: string) => ({
                                        name: f,
                                        icon: "check",
                                        iconColor: "text-green-500"
                                    }))
                                }}
                                title="We're sorry to see you go..."
                                description={`Before you cancel, we hope you'll consider upgrading to a ${plans[1].description} plan again.`}
                                leftPanelImageUrl="https://framerusercontent.com/images/GWE8vop9hubsuh3uWWn0vyuxEg.webp"
                                warningTitle="You will lose access to your account"
                                warningText="If you cancel your subscription, you will lose access to your account and all your data will be deleted."
                                keepButtonText={`Keep My ${plans[1].name} Plan`}
                                continueButtonText="Continue with Cancellation"
                                finalTitle="Final Step - Confirm Cancellation"
                                finalSubtitle="This action will immediately cancel your subscription"
                                finalWarningText="You'll lose access to all Pro features and your data will be permanently deleted after 30 days."
                                goBackButtonText="Wait, Go Back"
                                confirmButtonText="Yes, Cancel My Subscription"
                                triggerButtonText="Cancel Subscription"
                                onCancel={async () => {
                                    console.log("Subscription cancelled");
                                    await new Promise(resolve => setTimeout(resolve, 1000));
                                    alert("Subscription has been cancelled");
                                    setCancelDialogOpen(false);
                                }}
                                onDialogClose={() => setCancelDialogOpen(false)}
                            />
                        )}
                    </div>
                </div>

                {/* Plan Selector Dialog */}
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Plan Selector Dialog</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                        Interactive dialog for changing subscription plans with monthly/yearly billing toggle
                    </p>
                    <PlanSelectorDialog
                        currentPlanId="professional"
                        plans={plans}
                        onSelectPlan={async (planId: string, billingCycle: "monthly" | "yearly") => {
                            console.log("Selected plan:", planId, billingCycle);
                            // Simulate API call
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            alert(`Plan changed to ${planId} (${billingCycle})`);
                        }}
                        trigger={
                            <Button>
                                Choose Your Plan
                            </Button>
                        }
                    />
                </div>

                {/* Cancel Subscription Dialog */}
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Cancel Subscription Dialog</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                        Multi-step cancellation flow with feedback collection
                    </p>
                    <CancelSubscriptionDialog
                        plan={{
                            id: plans[1].id,
                            title: plans[1].name,
                            description: plans[1].description,
                            currency: plans[1].currency,
                            monthlyPrice: plans[1].monthlyPrice,
                            yearlyPrice: plans[1].yearlyPrice,
                            buttonText: "Select Plan",
                            features: plans[1].features.map((f: string) => ({
                                name: f,
                                icon: "check",
                                iconColor: "text-green-500"
                            }))
                        }}
                        title="Cancel Your Professional Plan"
                        description="We're sorry to see you go. Please let us know if there's anything we can do to improve."
                        triggerButtonText="Cancel Subscription"
                        onCancel={async () => {
                            console.log("Subscription cancelled");
                            // Simulate API call
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            alert("Subscription has been cancelled");
                        }}
                    />
                </div>

                {/* Payment Methods */}
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Payment Methods</h3>
                    <PaymentMethodsList
                        paymentMethods={paymentMethods.map(pm => ({
                            id: pm.id,
                            last4: pm.cardNumber.slice(-4),
                            brand: pm.brand,
                            expiryMonth: parseInt(pm.expiryMonth),
                            expiryYear: parseInt(pm.expiryYear),
                            cardholderName: pm.cardholderName,
                            isDefault: pm.isDefault,
                        }))}
                        onSetDefault={async (cardId: string) => {
                            console.log("Set default:", cardId);
                            await new Promise(resolve => setTimeout(resolve, 500));
                            alert(`Card ${cardId} set as default payment method`);
                        }}
                        onRemoveCard={async (cardId: string) => {
                            console.log("Remove card:", cardId);
                            if (confirm("Are you sure you want to remove this payment method?")) {
                                await new Promise(resolve => setTimeout(resolve, 500));
                                alert(`Card ${cardId} removed successfully`);
                            }
                        }}
                        onAddCard={async (methodId: string) => {
                            console.log("Add card:", methodId);
                            alert("Payment method added successfully!");
                        }}
                    />
                </div>

                {/* Credit Balance */}
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Credit Balance Card</h3>
                    <CreditBalanceCard
                        balance={creditBalance}
                        onPurchaseCredits={async () => {
                            console.log("Purchase credits clicked");
                            const amount = prompt("How many credits would you like to purchase?", "5000");
                            if (amount) {
                                await new Promise(resolve => setTimeout(resolve, 1000));
                                alert(`Successfully purchased ${amount} credits!`);
                            }
                        }}
                    />
                </div>

                {/* Credit History */}
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Credit History</h3>
                    <CreditHistory transactions={creditTransactions} />
                </div>

                {/* Usage Display */}
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Usage Metrics</h3>
                    <UsageDisplay metrics={usageMetrics} />
                </div>

                {/* Invoice List */}
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Invoice History</h3>
                    <InvoiceList invoices={invoices} />
                </div>
            </div>
        </section>
    );
}
