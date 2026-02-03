/**
 * @abstraction Configuration-Driven Pricing Architecture
 * @description Flexible pricing configuration that allows changing billing behavior
 * (flat, per-unit, tiered, graduated) without code refactoring.
 * 
 * Includes product classification (Good vs Service) for:
 * - Revenue recognition (ASC 606 / IFRS 15)
 * - Tax classification (different VAT/GST rates)
 * - Accounting journal entries
 * - Deferred revenue handling
 * 
 * @namespace Autlify.Lib.Registry.Plans.PricingConfig
 * @module PRICING
 * @author Autlify Team
 * @created 2026-02-03
 * 
 * @usage
 * 1. Define pricing config in PRICING_CONFIG
 * 2. Use calculatePrice() to compute prices
 * 3. Change behavior by updating config, not code
 * 4. Use productType and revenueRecognition for accounting
 */

// ============================================================================
// Imports from Centralized Type Files
// ============================================================================

import type {
    RevenueRecognitionEntry,
    RevenueRecognitionSchedule
} from '@/types/finance'

import type {
    PricingConfig,
    PriceCalculationInput,
    PriceBreakdownItem,
    PriceCalculationResult, PricingConfigKeyType
} from '@/types/billing'

// ============================================================================
// Pricing Configuration (Single Source of Truth)
// ============================================================================

export const PRICING_CONFIG: Record<string, PricingConfig> = {
    // ========== PLANS (Services - Revenue recognized over time) ==========
    STARTER: {
        key: 'STARTER',
        type: 'plan',
        name: 'Starter',
        description: 'Perfect for trying out Autlify',

        // Product Classification
        productType: 'service',
        revenueRecognition: 'over_time_ratable',
        deferredRevenue: {
            createDeferredEntry: true,
            deferredRevenueAccount: '2400-DEFERRED-REV',
            revenueAccount: '4100-SUBSCRIPTION-REV',
            recognitionFrequency: 'monthly',
        },
        tax: {
            taxCategory: 'standard',
            stripeTaxCode: 'txcd_10103001', // SaaS - business use
        },
        accounting: {
            revenueAccountCode: '4100',
            deferredRevenueAccountCode: '2400',
            costCenter: 'SAAS',
            profitCenter: 'SUBSCRIPTIONS',
        },

        // Pricing
        baseAmount: 9900,              // MYR 99.00
        currency: 'MYR',
        interval: 'month',
        billingScheme: 'flat',
        pricingUnit: 'none',
        tier: 1,
        trialDays: 14,
        stripePriceId: 'price_1SpVOXJglUPlULDQt9Ejhunb',
        featureOverrides: {
            'core.subaccounts': 3,
            'core.team_members': 2,
            'core.storage_gb': 5,
        },
    },

    BASIC: {
        key: 'BASIC',
        type: 'plan',
        name: 'Basic',
        description: 'For serious agency owners',

        // Product Classification
        productType: 'service',
        revenueRecognition: 'over_time_ratable',
        deferredRevenue: {
            createDeferredEntry: true,
            deferredRevenueAccount: '2400-DEFERRED-REV',
            revenueAccount: '4100-SUBSCRIPTION-REV',
            recognitionFrequency: 'monthly',
        },
        tax: {
            taxCategory: 'standard',
            stripeTaxCode: 'txcd_10103001',
        },
        accounting: {
            revenueAccountCode: '4100',
            deferredRevenueAccountCode: '2400',
            costCenter: 'SAAS',
            profitCenter: 'SUBSCRIPTIONS',
        },

        // Pricing
        baseAmount: 19900,             // MYR 199.00
        currency: 'MYR',
        interval: 'month',
        billingScheme: 'flat',
        pricingUnit: 'none',
        tier: 2,
        trialDays: 14,
        stripePriceId: 'price_1SpVOYJglUPlULDQhsRkA5YV',
        featureOverrides: {
            'core.subaccounts': 10,
            'core.team_members': 10,
            'core.storage_gb': 25,
        },
    },

    ADVANCED: {
        key: 'ADVANCED',
        type: 'plan',
        name: 'Advanced',
        description: 'The ultimate agency kit',

        // Product Classification
        productType: 'service',
        revenueRecognition: 'over_time_ratable',
        deferredRevenue: {
            createDeferredEntry: true,
            deferredRevenueAccount: '2400-DEFERRED-REV',
            revenueAccount: '4100-SUBSCRIPTION-REV',
            recognitionFrequency: 'monthly',
        },
        tax: {
            taxCategory: 'standard',
            stripeTaxCode: 'txcd_10103001',
        },
        accounting: {
            revenueAccountCode: '4100',
            deferredRevenueAccountCode: '2400',
            costCenter: 'SAAS',
            profitCenter: 'SUBSCRIPTIONS',
        },

        // Pricing
        baseAmount: 54900,             // MYR 549.00
        currency: 'MYR',
        interval: 'month',
        billingScheme: 'flat',
        pricingUnit: 'none',
        tier: 3,
        trialDays: 0,
        stripePriceId: 'price_1SpVOZJglUPlULDQoFq3iPES',
        featureOverrides: {
            'core.subaccounts': '∞',
            'core.team_members': '∞',
            'core.storage_gb': 100,
            'billing.rebilling': true,
            'billing.priority_support': true,
        },
    },

    ENTERPRISE: {
        key: 'ENTERPRISE',
        type: 'plan',
        name: 'Enterprise',
        description: 'Custom pricing for large agencies',

        // Product Classification
        productType: 'service',
        revenueRecognition: 'over_time_ratable',
        deferredRevenue: {
            createDeferredEntry: true,
            deferredRevenueAccount: '2400-DEFERRED-REV',
            revenueAccount: '4100-SUBSCRIPTION-REV',
            recognitionFrequency: 'monthly',
        },
        tax: {
            taxCategory: 'standard',
            stripeTaxCode: 'txcd_10103001',
        },
        accounting: {
            revenueAccountCode: '4100',
            deferredRevenueAccountCode: '2400',
            costCenter: 'SAAS',
            profitCenter: 'ENTERPRISE',
        },

        // Pricing
        baseAmount: 99900,             // MYR 999.00 base
        currency: 'MYR',
        interval: 'month',
        billingScheme: 'tiered_graduated',
        pricingUnit: 'subaccount',
        tier: 4,
        trialDays: 0,
        // Graduated tiers: base includes 20, then per-unit pricing
        tiers: [
            { upTo: 20, flatAmount: 99900 },        // First 20: MYR 999 flat
            { upTo: 50, unitAmount: 2500 },         // 21-50: MYR 25/each
            { upTo: 100, unitAmount: 2000 },        // 51-100: MYR 20/each
            { upTo: 250, unitAmount: 1500 },        // 101-250: MYR 15/each
            { upTo: 'inf', unitAmount: 1000 },      // 251+: MYR 10/each
        ],
        featureOverrides: {
            'core.subaccounts': '∞',
            'core.team_members': '∞',
            'core.storage_gb': '∞',
            'billing.rebilling': true,
            'billing.priority_support': true,
            'fi.gl_access': true,
        },
    },

    // ========== ADD-ONS (Services - Revenue recognized over time) ==========
    PRIORITY_SUPPORT: {
        key: 'PRIORITY_SUPPORT',
        type: 'addon',
        name: 'Priority Support',
        description: '24/7 priority support with dedicated SLA',

        // Product Classification
        productType: 'service',
        revenueRecognition: 'over_time_ratable',
        deferredRevenue: {
            createDeferredEntry: true,
            deferredRevenueAccount: '2400-DEFERRED-REV',
            revenueAccount: '4200-SUPPORT-REV',
            recognitionFrequency: 'monthly',
        },
        tax: {
            taxCategory: 'standard',
            stripeTaxCode: 'txcd_10103001',
        },
        accounting: {
            revenueAccountCode: '4200',
            deferredRevenueAccountCode: '2400',
            costCenter: 'SUPPORT',
            profitCenter: 'SERVICES',
        },

        // Pricing
        baseAmount: 14900,             // MYR 149.00 flat
        currency: 'MYR',
        interval: 'month',
        billingScheme: 'flat',         // Flat rate - no per-unit
        pricingUnit: 'none',
        stripePriceId: 'price_1SpVObJglUPlULDQRfhLJNEo',
        featureOverrides: {
            'billing.priority_support': true,
        },
    },

    FI_GL: {
        key: 'FI_GL',
        type: 'addon',
        name: 'General Ledger',
        description: 'Full financial accounting module',

        // Product Classification
        productType: 'service',
        revenueRecognition: 'over_time_ratable',
        deferredRevenue: {
            createDeferredEntry: true,
            deferredRevenueAccount: '2400-DEFERRED-REV',
            revenueAccount: '4300-ADDON-REV',
            recognitionFrequency: 'monthly',
        },
        tax: {
            taxCategory: 'standard',
            stripeTaxCode: 'txcd_10103001',
        },
        accounting: {
            revenueAccountCode: '4300',
            deferredRevenueAccountCode: '2400',
            costCenter: 'FINANCE',
            profitCenter: 'ADDONS',
        },

        // Pricing
        baseAmount: 4900,              // MYR 49.00 base
        currency: 'MYR',
        interval: 'month',
        billingScheme: 'base_plus_overage',
        pricingUnit: 'subaccount',
        overage: {
            includedUnits: 5,            // 5 SubAccounts included in base
            unitAmount: 1000,            // MYR 10.00 per additional SubAccount
            maxUnits: 100,               // Cap at 100 for this tier
        },
        stripePriceId: 'price_fi_gl_base',
        featureOverrides: {
            'fi.gl_access': true,
            'fi.gl_accounts': '∞',
            'fi.gl_journals': '∞',
        },
    },

    FI_AR: {
        key: 'FI_AR',
        type: 'addon',
        name: 'Accounts Receivable',
        description: 'Customer invoicing and AR management',

        // Product Classification
        productType: 'service',
        revenueRecognition: 'over_time_ratable',
        deferredRevenue: {
            createDeferredEntry: true,
            deferredRevenueAccount: '2400-DEFERRED-REV',
            revenueAccount: '4300-ADDON-REV',
            recognitionFrequency: 'monthly',
        },
        tax: {
            taxCategory: 'standard',
            stripeTaxCode: 'txcd_10103001',
        },
        accounting: {
            revenueAccountCode: '4300',
            deferredRevenueAccountCode: '2400',
            costCenter: 'FINANCE',
            profitCenter: 'ADDONS',
        },

        // Pricing
        baseAmount: 7900,              // MYR 79.00 base
        currency: 'MYR',
        interval: 'month',
        billingScheme: 'base_plus_overage',
        pricingUnit: 'subaccount',
        overage: {
            includedUnits: 3,
            unitAmount: 1500,            // MYR 15.00 per additional
        },
        featureOverrides: {
            'fi.ar_access': true,
        },
    },

    FI_AP: {
        key: 'FI_AP',
        type: 'addon',
        name: 'Accounts Payable',
        description: 'Vendor management and AP processing',

        // Product Classification
        productType: 'service',
        revenueRecognition: 'over_time_ratable',
        deferredRevenue: {
            createDeferredEntry: true,
            deferredRevenueAccount: '2400-DEFERRED-REV',
            revenueAccount: '4300-ADDON-REV',
            recognitionFrequency: 'monthly',
        },
        tax: {
            taxCategory: 'standard',
            stripeTaxCode: 'txcd_10103001',
        },
        accounting: {
            revenueAccountCode: '4300',
            deferredRevenueAccountCode: '2400',
            costCenter: 'FINANCE',
            profitCenter: 'ADDONS',
        },

        // Pricing
        baseAmount: 7900,              // MYR 79.00 base
        currency: 'MYR',
        interval: 'month',
        billingScheme: 'base_plus_overage',
        pricingUnit: 'subaccount',
        overage: {
            includedUnits: 3,
            unitAmount: 1500,            // MYR 15.00 per additional
        },
        featureOverrides: {
            'fi.ap_access': true,
        },
    },

    WHITE_LABEL: {
        key: 'WHITE_LABEL',
        type: 'addon',
        name: 'White Label',
        description: 'Custom branding and subdomain',

        // Product Classification
        productType: 'service',
        revenueRecognition: 'over_time_ratable',
        deferredRevenue: {
            createDeferredEntry: true,
            deferredRevenueAccount: '2400-DEFERRED-REV',
            revenueAccount: '4300-ADDON-REV',
            recognitionFrequency: 'monthly',
        },
        tax: {
            taxCategory: 'standard',
            stripeTaxCode: 'txcd_10103001',
        },
        accounting: {
            revenueAccountCode: '4300',
            deferredRevenueAccountCode: '2400',
            costCenter: 'BRANDING',
            profitCenter: 'ADDONS',
        },

        // Pricing
        baseAmount: 29900,             // MYR 299.00 base
        currency: 'MYR',
        interval: 'month',
        billingScheme: 'base_plus_overage',
        pricingUnit: 'subaccount',
        overage: {
            includedUnits: 3,            // 3 branded SubAccounts included
            unitAmount: 2500,            // MYR 25.00 per additional
        },
        featureOverrides: {
            'branding.white_label': true,
        },
    },

    // ========== GOODS (One-time - Revenue recognized immediately) ==========
    SETUP_FEE: {
        key: 'SETUP_FEE',
        type: 'addon',
        name: 'Setup & Onboarding',
        description: 'One-time setup and configuration assistance',

        // Product Classification - GOOD (recognized immediately)
        productType: 'good',
        revenueRecognition: 'point_in_time',
        deferredRevenue: {
            createDeferredEntry: false, // No deferral for goods
        },
        tax: {
            taxCategory: 'standard',
            stripeTaxCode: 'txcd_10103000', // Professional services
        },
        accounting: {
            revenueAccountCode: '4400',
            costCenter: 'ONBOARDING',
            profitCenter: 'SERVICES',
        },

        // Pricing
        baseAmount: 49900,             // MYR 499.00 one-time
        currency: 'MYR',
        interval: 'one_time',
        billingScheme: 'flat',
        pricingUnit: 'none',
        featureOverrides: {},
    },

    API_CREDITS: {
        key: 'API_CREDITS',
        type: 'addon',
        name: 'API Credits Pack',
        description: 'Pre-purchased API call credits',

        // Product Classification - GOOD (prepaid credits)
        productType: 'good',
        revenueRecognition: 'over_time_usage', // Recognized as credits are consumed
        deferredRevenue: {
            createDeferredEntry: true,
            deferredRevenueAccount: '2410-PREPAID-CREDITS',
            revenueAccount: '4500-USAGE-REV',
            recognitionFrequency: 'daily', // Recognize as used
        },
        tax: {
            taxCategory: 'standard',
            stripeTaxCode: 'txcd_10103001',
        },
        accounting: {
            revenueAccountCode: '4500',
            deferredRevenueAccountCode: '2410',
            costCenter: 'API',
            profitCenter: 'USAGE',
        },

        // Pricing
        baseAmount: 9900,              // MYR 99.00 per 10,000 credits
        currency: 'MYR',
        interval: 'one_time',
        billingScheme: 'per_unit',
        pricingUnit: 'api_call',
        featureOverrides: {},
    },

    DATA_MIGRATION: {
        key: 'DATA_MIGRATION',
        type: 'addon',
        name: 'Data Migration Service',
        description: 'Professional data migration from other platforms',

        // Product Classification - GOOD (milestone-based)
        productType: 'good',
        revenueRecognition: 'milestone', // Recognized upon migration completion
        deferredRevenue: {
            createDeferredEntry: true,
            deferredRevenueAccount: '2420-DEFERRED-SERVICES',
            revenueAccount: '4400-PROF-SERVICES',
        },
        tax: {
            taxCategory: 'standard',
            stripeTaxCode: 'txcd_10103000',
        },
        accounting: {
            revenueAccountCode: '4400',
            deferredRevenueAccountCode: '2420',
            costCenter: 'MIGRATION',
            profitCenter: 'SERVICES',
        },

        // Pricing
        baseAmount: 99900,             // MYR 999.00 base
        currency: 'MYR',
        interval: 'one_time',
        billingScheme: 'tiered_volume',
        pricingUnit: 'contact',
        tiers: [
            { upTo: 1000, flatAmount: 99900 },      // Up to 1K contacts: MYR 999
            { upTo: 10000, flatAmount: 249900 },    // Up to 10K: MYR 2,499
            { upTo: 100000, flatAmount: 499900 },   // Up to 100K: MYR 4,999
            { upTo: 'inf', flatAmount: 999900 },    // 100K+: MYR 9,999
        ],
        featureOverrides: {},
    },
}

// ============================================================================
// Price Calculation Engine (Config-Driven, No Hardcoding)
// ============================================================================

/**
 * Calculate price based on configuration
 * This is the ONLY function that calculates prices - all logic is config-driven
 */
export function calculatePrice(input: PriceCalculationInput): PriceCalculationResult {
    const config = PRICING_CONFIG[input.configKey]
    if (!config) {
        throw new Error(`Unknown pricing config: ${input.configKey}`)
    }

    const quantity = input.quantity ?? 0
    const breakdown: PriceBreakdownItem[] = []
    let baseAmount = 0
    let overageAmount = 0

    switch (config.billingScheme) {
        case 'flat':
            // Simple flat rate
            baseAmount = config.baseAmount
            breakdown.push({
                description: config.name,
                quantity: 1,
                unitAmount: config.baseAmount,
                amount: config.baseAmount,
            })
            break

        case 'per_unit':
            // Price × quantity
            baseAmount = config.baseAmount * quantity
            breakdown.push({
                description: `${config.name} × ${quantity}`,
                quantity,
                unitAmount: config.baseAmount,
                amount: baseAmount,
            })
            break

        case 'tiered_volume':
            // Volume-based: use the tier that matches final quantity
            if (config.tiers) {
                const applicableTier = config.tiers.find(
                    (t) => t.upTo === 'inf' || quantity <= t.upTo
                )
                if (applicableTier) {
                    if (applicableTier.flatAmount !== undefined) {
                        baseAmount = applicableTier.flatAmount
                    } else if (applicableTier.unitAmount !== undefined) {
                        baseAmount = applicableTier.unitAmount * quantity
                    }
                    breakdown.push({
                        description: `${config.name} (Volume tier)`,
                        quantity,
                        unitAmount: applicableTier.unitAmount ?? applicableTier.flatAmount ?? 0,
                        amount: baseAmount,
                    })
                }
            }
            break

        case 'tiered_graduated':
            // Graduated: sum each tier's contribution
            if (config.tiers) {
                let remaining = quantity
                let prevCeiling = 0

                for (const tier of config.tiers) {
                    if (remaining <= 0) break

                    const tierCeiling = tier.upTo === 'inf' ? Infinity : tier.upTo
                    const tierSize = tierCeiling - prevCeiling
                    const unitsInTier = Math.min(remaining, tierSize)

                    let tierAmount = 0
                    if (tier.flatAmount !== undefined && prevCeiling === 0) {
                        // First tier with flat amount
                        tierAmount = tier.flatAmount
                        breakdown.push({
                            description: `${config.name} base (up to ${tier.upTo})`,
                            quantity: unitsInTier,
                            unitAmount: tier.flatAmount,
                            amount: tierAmount,
                        })
                    } else if (tier.unitAmount !== undefined) {
                        tierAmount = tier.unitAmount * unitsInTier
                        breakdown.push({
                            description: `${config.name} (${prevCeiling + 1}-${tier.upTo === 'inf' ? '∞' : tier.upTo})`,
                            quantity: unitsInTier,
                            unitAmount: tier.unitAmount,
                            amount: tierAmount,
                        })
                    }

                    baseAmount += tierAmount
                    remaining -= unitsInTier
                    prevCeiling = tierCeiling === Infinity ? prevCeiling : tierCeiling
                }
            }
            break

        case 'base_plus_overage':
            // Base fee + per-unit overage beyond included
            baseAmount = config.baseAmount
            breakdown.push({
                description: `${config.name} (base, includes ${config.overage?.includedUnits ?? 0} ${config.pricingUnit}s)`,
                quantity: 1,
                unitAmount: config.baseAmount,
                amount: config.baseAmount,
            })

            if (config.overage) {
                const billableQuantity = Math.min(
                    quantity,
                    config.overage.maxUnits ?? Infinity
                )
                const overageUnits = Math.max(0, billableQuantity - config.overage.includedUnits)

                if (overageUnits > 0) {
                    overageAmount = overageUnits * config.overage.unitAmount
                    breakdown.push({
                        description: `Additional ${config.pricingUnit}s (${overageUnits} × ${formatAmount(config.overage.unitAmount, config.currency)})`,
                        quantity: overageUnits,
                        unitAmount: config.overage.unitAmount,
                        amount: overageAmount,
                    })
                }
            }
            break
    }

    const totalAmount = baseAmount + overageAmount

    return {
        totalAmount,
        baseAmount,
        overageAmount,
        quantity,
        breakdown,
        displayPrice: formatAmount(totalAmount, config.currency),
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format amount for display (cents to currency string)
 */
export function formatAmount(amountInCents: number, currency: string): string {
    const amount = amountInCents / 100
    return new Intl.NumberFormat('en-MY', {
        style: 'currency',
        currency,
    }).format(amount)
}

/**
 * Get all plans sorted by tier
 */
export function getPlans(): PricingConfig[] {
    return Object.values(PRICING_CONFIG)
        .filter((c) => c.type === 'plan')
        .sort((a, b) => (a.tier ?? 0) - (b.tier ?? 0))
}

/**
 * Get all add-ons
 */
export function getAddons(): PricingConfig[] {
    return Object.values(PRICING_CONFIG)
        .filter((c) => c.type === 'addon')
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}

/**
 * Get config by Stripe price ID
 */
export function getConfigByPriceId(priceId: string): PricingConfig | undefined {
    return Object.values(PRICING_CONFIG).find(
        (c) => c.stripePriceId === priceId || c.stripeTieredPriceId === priceId
    )
}

/**
 * Calculate total subscription cost for agency
 */
export function calculateSubscriptionTotal(
    planKey: string,
    addonKeys: string[],
    quantities: Record<string, number> = {}
): {
    planCost: PriceCalculationResult
    addonCosts: Record<string, PriceCalculationResult>
    totalMonthly: number
    displayTotal: string
} {
    const planCost = calculatePrice({
        configKey: planKey,
        quantity: quantities[PRICING_CONFIG[planKey]?.pricingUnit ?? 'none'] ?? 0,
    })

    const addonCosts: Record<string, PriceCalculationResult> = {}
    for (const addonKey of addonKeys) {
        const config = PRICING_CONFIG[addonKey]
        if (config) {
            addonCosts[addonKey] = calculatePrice({
                configKey: addonKey,
                quantity: quantities[config.pricingUnit] ?? 0,
            })
        }
    }

    const totalMonthly =
        planCost.totalAmount +
        Object.values(addonCosts).reduce((sum, c) => sum + c.totalAmount, 0)

    return {
        planCost,
        addonCosts,
        totalMonthly,
        displayTotal: formatAmount(totalMonthly, PRICING_CONFIG[planKey]?.currency ?? 'MYR'),
    }
}

// ============================================================================
// Stripe Sync Helpers
// ============================================================================

/**
 * Generate Stripe price creation params from config
 * Use this to sync Stripe prices with config
 */
export function toStripeCreatePriceParams(config: PricingConfig): object {
    const baseParams = {
        currency: config.currency.toLowerCase(),
        product_data: {
            name: config.name,
            metadata: { configKey: config.key },
        },
        metadata: { configKey: config.key },
    }

    if (config.interval !== 'one_time') {
        Object.assign(baseParams, {
            recurring: { interval: config.interval },
        })
    }

    switch (config.billingScheme) {
        case 'flat':
        case 'per_unit':
            return {
                ...baseParams,
                unit_amount: config.baseAmount,
            }

        case 'tiered_volume':
        case 'tiered_graduated':
            return {
                ...baseParams,
                billing_scheme: 'tiered',
                tiers_mode: config.billingScheme === 'tiered_volume' ? 'volume' : 'graduated',
                tiers: config.tiers?.map((t) => ({
                    up_to: t.upTo === 'inf' ? 'inf' : t.upTo,
                    ...(t.flatAmount !== undefined && { flat_amount: t.flatAmount }),
                    ...(t.unitAmount !== undefined && { unit_amount: t.unitAmount }),
                })),
            }

        case 'base_plus_overage':
            // For base_plus_overage, create a tiered price in Stripe
            return {
                ...baseParams,
                billing_scheme: 'tiered',
                tiers_mode: 'graduated',
                tiers: [
                    { up_to: config.overage?.includedUnits ?? 1, flat_amount: config.baseAmount },
                    { up_to: 'inf', unit_amount: config.overage?.unitAmount ?? 0 },
                ],
            }

        default:
            // Default to per_unit pricing for any unhandled billing scheme
            return {
                ...baseParams,
                unit_amount: config.baseAmount,
            }
    }
}

// ============================================================================
// Type-safe Config Access
// ============================================================================

/**
 * Type-safe config getter
 */
export function getPricingConfig<K extends PricingConfigKeyType>(key: K): PricingConfig {
    const config = PRICING_CONFIG[key]
    if (!config) throw new Error(`Unknown config key: ${key}`)
    return config
}

// ============================================================================
// Revenue Recognition Helpers
// ============================================================================

/**
 * Generate revenue recognition schedule for a pricing config
 * @description Generates journal entries for deferred revenue recognition
 */
export function generateRevenueSchedule(
    config: PricingConfig,
    purchaseAmount: number,
    purchaseDate: Date,
    periods: number = 1 // Number of billing periods (1 for monthly, 12 for annual)
): RevenueRecognitionSchedule {
    const entries: RevenueRecognitionEntry[] = []
    const deferredAccount = config.deferredRevenue?.deferredRevenueAccount ?? '2400-DEFERRED'
    const revenueAccount = config.deferredRevenue?.revenueAccount ?? '4100-REVENUE'

    switch (config.revenueRecognition) {
        case 'point_in_time':
            // Recognize immediately - no deferral
            entries.push({
                date: purchaseDate,
                debit: {
                    account: '1200-AR',
                    amount: purchaseAmount,
                    description: `${config.name} - Point in time recognition`,
                },
                credit: {
                    account: revenueAccount,
                    amount: purchaseAmount,
                    description: `Revenue: ${config.name}`,
                },
            })
            return {
                purchaseDate,
                totalAmount: purchaseAmount,
                deferredAmount: 0,
                recognizedAmount: purchaseAmount,
                entries,
            }

        case 'over_time_ratable':
            // Recognize evenly over periods
            const amountPerPeriod = Math.round(purchaseAmount / periods)
            let remaining = purchaseAmount

            // Initial entry: Debit AR, Credit Deferred Revenue
            entries.push({
                date: purchaseDate,
                debit: {
                    account: '1200-AR',
                    amount: purchaseAmount,
                    description: `${config.name} - Initial billing`,
                },
                credit: {
                    account: deferredAccount,
                    amount: purchaseAmount,
                    description: `Deferred: ${config.name}`,
                },
            })

            // Recognition entries for each period
            for (let i = 0; i < periods; i++) {
                const recognitionDate = new Date(purchaseDate)
                recognitionDate.setMonth(recognitionDate.getMonth() + i)

                const amount = i === periods - 1 ? remaining : amountPerPeriod
                remaining -= amount

                entries.push({
                    date: recognitionDate,
                    debit: {
                        account: deferredAccount,
                        amount,
                        description: `Recognize: ${config.name} (${i + 1}/${periods})`,
                    },
                    credit: {
                        account: revenueAccount,
                        amount,
                        description: `Revenue: ${config.name} (${i + 1}/${periods})`,
                    },
                })
            }

            return {
                purchaseDate,
                totalAmount: purchaseAmount,
                deferredAmount: purchaseAmount - amountPerPeriod,
                recognizedAmount: amountPerPeriod,
                entries,
            }

        case 'over_time_usage':
            // Initial booking to deferred, recognized as consumed
            entries.push({
                date: purchaseDate,
                debit: {
                    account: '1200-AR',
                    amount: purchaseAmount,
                    description: `${config.name} - Prepaid credits`,
                },
                credit: {
                    account: deferredAccount,
                    amount: purchaseAmount,
                    description: `Deferred: ${config.name} credits`,
                },
            })
            // Usage entries generated separately as consumption occurs
            return {
                purchaseDate,
                totalAmount: purchaseAmount,
                deferredAmount: purchaseAmount,
                recognizedAmount: 0,
                entries,
            }

        case 'milestone':
            // Book to deferred, recognize upon milestone completion
            entries.push({
                date: purchaseDate,
                debit: {
                    account: '1200-AR',
                    amount: purchaseAmount,
                    description: `${config.name} - Milestone-based`,
                },
                credit: {
                    account: deferredAccount,
                    amount: purchaseAmount,
                    description: `Deferred: ${config.name}`,
                },
            })
            return {
                purchaseDate,
                totalAmount: purchaseAmount,
                deferredAmount: purchaseAmount,
                recognizedAmount: 0,
                entries,
            }

        default:
            return {
                purchaseDate,
                totalAmount: purchaseAmount,
                deferredAmount: 0,
                recognizedAmount: purchaseAmount,
                entries: [],
            }
    }
}

/**
 * Get all goods (one-time products)
 */
export function getGoods(): PricingConfig[] {
    return Object.values(PRICING_CONFIG)
        .filter((c) => c.productType === 'good')
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}

/**
 * Get all services (recurring products)
 */
export function getServices(): PricingConfig[] {
    return Object.values(PRICING_CONFIG)
        .filter((c) => c.productType === 'service')
        .sort((a, b) => (a.tier ?? a.sortOrder ?? 0) - (b.tier ?? b.sortOrder ?? 0))
}

/**
 * Check if product requires deferred revenue handling
 */
export function requiresDeferredRevenue(config: PricingConfig): boolean {
    return (
        config.revenueRecognition !== 'point_in_time' &&
        (config.deferredRevenue?.createDeferredEntry ?? false)
    )
}

/**
 * Get GL account codes for a product
 */
export function getAccountCodes(config: PricingConfig): {
    revenue: string
    deferred: string | null
    cogs: string | null
} {
    return {
        revenue: config.accounting?.revenueAccountCode ?? '4100',
        deferred: requiresDeferredRevenue(config)
            ? config.accounting?.deferredRevenueAccountCode ?? '2400'
            : null,
        cogs: config.productType === 'good'
            ? config.accounting?.cogsAccountCode ?? null
            : null,
    }
}
