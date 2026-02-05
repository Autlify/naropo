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
    PriceCalculationResult,
    PricingConfigKeyType,
    PricingCardData,
} from '@/types/billing'

// Re-export PricingCardData for consumers
export type { PricingCardData } from '@/types/billing'

// ============================================================================
// PRICING_CONFIG (Single Source of Truth)
// The sync-stripe script updates stripePriceId values here.
// All other price ID lookups should derive from this config.
// ============================================================================

const definePricingConfig = <T extends Record<string, Omit<PricingConfig, 'key'>>>(
    cfg: T
): { [K in keyof T]: T[K] & { key: K } } => {
    const out: any = {};
    for (const k of Object.keys(cfg)) out[k] = { ...cfg[k], key: k };
    return out;
}


export const PRICING_CONFIG = definePricingConfig({
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
        baseAmount: 7900,              // MYR 79.00 (matches constants.ts)
        currency: 'MYR',
        interval: 'month',
        billingScheme: 'flat',
        pricingUnit: 'none',
        tier: 1,
        trialDays: 14,
        stripePriceId: 'price_1SxAiXJglUPlULDQJDOmcB2C',
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
        baseAmount: 19900,             // MYR 199.00 (matches constants.ts)
        currency: 'MYR',
        interval: 'month',
        billingScheme: 'flat',
        pricingUnit: 'none',
        tier: 2,
        trialDays: 14,
        stripePriceId: 'price_1SxAiYJglUPlULDQvHsvpsmi',
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
        baseAmount: 39900,             // MYR 399.00 (matches constants.ts)
        currency: 'MYR',
        interval: 'month',
        billingScheme: 'flat',
        pricingUnit: 'none',
        tier: 3,
        trialDays: 14,
        stripePriceId: 'price_1SxAiYJglUPlULDQtxTI8UwM',
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

        // Pricing - tiered_graduated matches constants.ts Enterprise tiers
        baseAmount: 0,                 // No base - pure per-unit graduated pricing
        currency: 'MYR',
        interval: 'month',
        billingScheme: 'tiered_graduated',
        pricingUnit: 'subaccount',     // Per sub-account pricing (headcount)
        tier: 4,
        trialDays: 0,
        stripePriceId: 'price_1SxAiZJglUPlULDQge6pU88h',  // Tiered price
        // Graduated tiers from constants.ts: 14900/12900/10900 per unit
        tiers: [
            { upTo: 50, unitAmount: 14900 },        // 1-50: MYR 149/each
            { upTo: 100, unitAmount: 12900 },       // 51-100: MYR 129/each
            { upTo: 'inf', unitAmount: 10900 },     // 101+: MYR 109/each
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
    // ========== YEARLY PLANS (20% discount) ==========
    STARTER_YEARLY: {
        key: 'STARTER_YEARLY',
        type: 'plan',
        name: 'Starter',
        description: 'Perfect for trying out Autlify',
        productType: 'service',
        revenueRecognition: 'over_time_ratable',
        deferredRevenue: {
            createDeferredEntry: true,
            deferredRevenueAccount: '2400-DEFERRED-REV',
            revenueAccount: '4100-SUBSCRIPTION-REV',
            recognitionFrequency: 'monthly',
        },
        tax: { taxCategory: 'standard', stripeTaxCode: 'txcd_10103001' },
        accounting: {
            revenueAccountCode: '4100',
            deferredRevenueAccountCode: '2400',
            costCenter: 'SAAS',
            profitCenter: 'SUBSCRIPTIONS',
        },
        baseAmount: 79000,             // MYR 790/year (79 × 10 months = 20% off)
        currency: 'MYR',
        interval: 'year',
        billingScheme: 'flat',
        pricingUnit: 'none',
        tier: 1,
        trialDays: 14,
        stripePriceId: 'price_1SxAiaJglUPlULDQ9K3ngV94',
        featureOverrides: {
            'core.subaccounts': 3,
            'core.team_members': 2,
            'core.storage_gb': 5,
        },
    },

    BASIC_YEARLY: {
        key: 'BASIC_YEARLY',
        type: 'plan',
        name: 'Basic',
        description: 'For serious agency owners',
        productType: 'service',
        revenueRecognition: 'over_time_ratable',
        deferredRevenue: {
            createDeferredEntry: true,
            deferredRevenueAccount: '2400-DEFERRED-REV',
            revenueAccount: '4100-SUBSCRIPTION-REV',
            recognitionFrequency: 'monthly',
        },
        tax: { taxCategory: 'standard', stripeTaxCode: 'txcd_10103001' },
        accounting: {
            revenueAccountCode: '4100',
            deferredRevenueAccountCode: '2400',
            costCenter: 'SAAS',
            profitCenter: 'SUBSCRIPTIONS',
        },
        baseAmount: 199000,            // MYR 1990/year (199 × 10 months = 20% off)
        currency: 'MYR',
        interval: 'year',
        billingScheme: 'flat',
        pricingUnit: 'none',
        tier: 2,
        trialDays: 14,
        stripePriceId: 'price_1SxAibJglUPlULDQDZjEsjSk',
        featureOverrides: {
            'core.subaccounts': 10,
            'core.team_members': 10,
            'core.storage_gb': 25,
        },
    },

    ADVANCED_YEARLY: {
        key: 'ADVANCED_YEARLY',
        type: 'plan',
        name: 'Advanced',
        description: 'The ultimate agency kit',
        productType: 'service',
        revenueRecognition: 'over_time_ratable',
        deferredRevenue: {
            createDeferredEntry: true,
            deferredRevenueAccount: '2400-DEFERRED-REV',
            revenueAccount: '4100-SUBSCRIPTION-REV',
            recognitionFrequency: 'monthly',
        },
        tax: { taxCategory: 'standard', stripeTaxCode: 'txcd_10103001' },
        accounting: {
            revenueAccountCode: '4100',
            deferredRevenueAccountCode: '2400',
            costCenter: 'SAAS',
            profitCenter: 'SUBSCRIPTIONS',
        },
        baseAmount: 399000,            // MYR 3990/year (399 × 10 months = 20% off)
        currency: 'MYR',
        interval: 'year',
        billingScheme: 'flat',
        pricingUnit: 'none',
        tier: 3,
        trialDays: 14,
        stripePriceId: 'price_1SxAibJglUPlULDQOQAltSBS',
        featureOverrides: {
            'core.subaccounts': '∞',
            'core.team_members': '∞',
            'core.storage_gb': 100,
            'billing.rebilling': true,
            'billing.priority_support': true,
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
        baseAmount: 9900,              // MYR 99.00 flat (from constants.ts)
        currency: 'MYR',
        interval: 'month',
        billingScheme: 'flat',         // Flat rate - no per-unit
        pricingUnit: 'none',
        stripePriceId: 'price_1SxAicJglUPlULDQRy4FId25',
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
        baseAmount: 24900,             // MYR 249.00 flat (from constants.ts)
        currency: 'MYR',
        interval: 'month',
        billingScheme: 'flat',
        pricingUnit: 'subaccount',
        stripePriceId: 'price_1SxAidJglUPlULDQeQ6aNzAF',
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
        baseAmount: 12900,             // MYR 129.00 flat (from constants.ts)
        currency: 'MYR',
        interval: 'month',
        billingScheme: 'flat',
        pricingUnit: 'subaccount',
        stripePriceId: 'price_1SxAieJglUPlULDQ1tzfiQqh',
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
        baseAmount: 12900,             // MYR 129.00 flat (from constants.ts)
        currency: 'MYR',
        interval: 'month',
        billingScheme: 'flat',
        pricingUnit: 'subaccount',
        stripePriceId: 'price_1SxAifJglUPlULDQR0r8hQ0J',
        featureOverrides: {
            'fi.ap_access': true,
        },
    },

    FI_BL: {
        key: 'FI_BL',
        type: 'addon',
        name: 'Bank Ledgers',
        description: 'Bank account management and reconciliation',

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
        baseAmount: 11900,             // MYR 119.00 flat
        currency: 'MYR',
        interval: 'month',
        billingScheme: 'flat',
        pricingUnit: 'subaccount',
        stripePriceId: 'price_1SxAifJglUPlULDQXgIbxzf7',
        featureOverrides: {
            'fi.bl_access': true,
        },
    },
    FI_FS: {
        key: 'FI_FS',
        type: 'addon',
        name: 'Financial Statements',
        description: 'Advanced financial reporting and statements',

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
        baseAmount: 12900,             // MYR 129.00 flat
        currency: 'MYR',
        interval: 'month',
        billingScheme: 'flat',
        pricingUnit: 'subaccount',
        stripePriceId: 'price_1SxAigJglUPlULDQleXpx8Ac',
        featureOverrides: {
            'fi.fs_access': true,
        },
    },
    CO_CCA: {
        key: 'CO_CCA',
        type: 'addon',
        name: 'Cost Accounting',
        description: 'Cost center and profit center management',

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
            costCenter: 'COSTING',
            profitCenter: 'ADDONS',
        },

        // Pricing
        baseAmount: 12900,             // MYR 129.00 flat
        currency: 'MYR',
        interval: 'month',
        billingScheme: 'flat',
        pricingUnit: 'subaccount',
        stripePriceId: 'price_1SxAihJglUPlULDQftoxdK6t',
        featureOverrides: {
            'co.cca_access': true,
        },
    },
    CO_PCA: {
        key: 'CO_PCA',
        type: 'addon',
        name: 'Profit Center Accounting',
        description: 'Profit center tracking and analysis',

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
            costCenter: 'COSTING',
            profitCenter: 'ADDONS',
        },

        // Pricing
        baseAmount: 12900,             // MYR 129.00 flat
        currency: 'MYR',
        interval: 'month',
        billingScheme: 'flat',
        pricingUnit: 'subaccount',
        stripePriceId: 'price_1SxAihJglUPlULDQiijyjkbo',
        featureOverrides: {
            'co.pca_access': true,
        },
    },
    CO_PA: {
        key: 'CO_PA',
        type: 'addon',
        name: 'Profitability Analysis',
        description: 'Detailed profitability reporting and insights',

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
            costCenter: 'COSTING',
            profitCenter: 'ADDONS',
        },

        // Pricing
        baseAmount: 12900,             // MYR 129.00 flat
        currency: 'MYR',
        interval: 'month',
        billingScheme: 'flat',
        pricingUnit: 'subaccount',
        stripePriceId: 'price_1SxAiiJglUPlULDQMTKUghdO',
        featureOverrides: {
            'co.pa_access': true,
        },
    },
    CO_BUDGET: {
        key: 'CO_BUDGET',
        type: 'addon',
        name: 'Budgeting & Planning',
        description: 'Comprehensive budgeting and financial planning tools',

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
            costCenter: 'COSTING',
            profitCenter: 'ADDONS',
        },

        // Pricing
        baseAmount: 12900,             // MYR 129.00 flat
        currency: 'MYR',
        interval: 'month',
        billingScheme: 'flat',
        pricingUnit: 'subaccount',
        stripePriceId: 'price_1SxAijJglUPlULDQQsNguflG',
        featureOverrides: {
            'co.budget_access': true,
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
        baseAmount: 19900,             // MYR 199.00 flat (from constants.ts)
        currency: 'MYR',
        interval: 'month',
        billingScheme: 'flat',
        pricingUnit: 'subaccount',
        stripePriceId: 'price_1SxAikJglUPlULDQLO5jRqaL',
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

        // Product Classification - SERVICE (intangible)
        productType: 'service',
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
        stripePriceId: 'price_1SxAikJglUPlULDQh9eZmiVC',
        featureOverrides: {},
    },

    API_CREDITS: {
        key: 'API_CREDITS',
        type: 'addon',
        name: 'API Credits Pack',
        description: 'Pre-purchased API call credits',

        // Product Classification - SERVICE (intangible consumables per IFRS)
        productType: 'service',
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
        stripePriceId: 'price_1SxAilJglUPlULDQiNEHFYdB',
        featureOverrides: {},
    },

    DATA_MIGRATION: {
        key: 'DATA_MIGRATION',
        type: 'addon',
        name: 'Data Migration Service',
        description: 'Professional data migration from other platforms',

        // Product Classification - SERVICE (intangible)
        productType: 'service',
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

        // Pricing - Flat one-time fee (tiered pricing not supported for one_time)
        // Volume-based quotes handled separately, not via Stripe tiered pricing
        baseAmount: 99900,             // MYR 999.00 base
        currency: 'MYR',
        interval: 'one_time',
        billingScheme: 'flat',         // Changed from tiered_volume - Stripe doesn't support tiered one_time
        pricingUnit: 'none',
        stripePriceId: 'price_1SxAimJglUPlULDQkn6cXTqS',
        // Note: Volume tiers handled via custom quotes, not Stripe pricing
        // Tiers for reference (used in custom quote generation):
        // - Up to 1K contacts: MYR 999
        // - Up to 10K: MYR 2,499
        // - Up to 100K: MYR 4,999
        // - 100K+: MYR 9,999
        featureOverrides: {},
    },
} as const)

/**
 * Calculate price based on configuration
 * This is the ONLY function that calculates prices - all logic is config-driven
 */
export function calculatePrice(input: PriceCalculationInput): PriceCalculationResult {
    const priceKey = input.configKey as PricingConfigKeyType
    const config = PRICING_CONFIG[priceKey] as PricingConfig | undefined
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
 * Calculate total subscription cost for agency
 */
export function calculateSubscriptionTotal(
    planKey: PriceKey,
    addonKeys: AddonKey[],
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
    // PRICING_CONFIG is declared `as const`, so Object.values() can overly-narrow
    // productType to the literals present in the config (currently: "service").
    // Cast to PricingConfig[] to preserve the intended union and allow filtering.
    return (Object.values(PRICING_CONFIG) as PricingConfig[]).filter(
        (c) => c.productType === 'good'
    )
}

/**
 * Get all services (recurring products)
 */
export function getServices(): PricingConfig[] {
    return Object.values(PRICING_CONFIG).filter((c) => c.productType === 'service')
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

// ============================================================================
// Pricing Cards for UI (Single Source of Truth)
// ============================================================================

/** Plan features for UI display */
export const PLAN_FEATURES: Record<string, string[]> = {
    STARTER: [
        'Up to 3 Sub Accounts',
        'Basic analytics',
        'Email support',
        '1GB storage',
    ],
    BASIC: [
        'Up to 10 Sub Accounts',
        'Advanced analytics',
        'Priority email support',
        '10GB storage',
        'API access',
    ],
    ADVANCED: [
        'Up to 50 Sub Accounts',
        'Full analytics suite',
        '24/7 phone & email support',
        '100GB storage',
        'Full API access',
        'Custom integrations',
    ],
    ENTERPRISE: [
        'Unlimited Sub Accounts',
        'Enterprise analytics',
        'Dedicated support team',
        'Unlimited storage',
        'Full API access',
        'Custom integrations',
        'SLA guarantee',
        'White-label options',
    ],
}

// PricingCardData is imported from @/types/billing (SSoT)
// Re-export for backward compatibility with existing imports


/**
 * Get pricing cards for UI display
 * This is the SINGLE SOURCE OF TRUTH for pricing UI
 * @param interval - 'month' or 'year'
 */
export function getPricingCards(interval: 'month' | 'year' = 'month'): PricingCardData[] {
    // Filter plans by interval - yearly plans have _YEARLY suffix
    const plans = Object.values(PRICING_CONFIG).filter((config) => {
        if (config.type !== 'plan') return false
        if (interval === 'year') {
            return config.key.endsWith('_YEARLY')
        } else {
            // Monthly plans don't have _YEARLY suffix and aren't ENTERPRISE (tiered)
            return !config.key.endsWith('_YEARLY') && config.billingScheme !== 'tiered_graduated'
        }
    }).sort((a, b) => (a.baseAmount ?? 0) - (b.baseAmount ?? 0))

    // Add Enterprise for display (both monthly and yearly show it)
    const enterprise = PRICING_CONFIG.ENTERPRISE
    if (enterprise) {
        plans.push(enterprise)
    }

    return plans.map((config: PricingConfig) => {
        // Calculate savings for yearly plans
        let savings: string | undefined
        if (interval === 'year' && config.key.endsWith('_YEARLY')) {
            const monthlyKey = config.key.replace('_YEARLY', '')
            const monthlyConfig = Object.values(PRICING_CONFIG).find(c =>
                c.type === 'plan' &&
                c.key === monthlyKey &&
                !c.key.endsWith('_YEARLY')
            )
            if (monthlyConfig) {
                const monthlyTotal = monthlyConfig.baseAmount * 12
                const yearlySavings = monthlyTotal - config.baseAmount
                const monthlySavings = Math.round(yearlySavings / 12)
                savings = `Save ${formatAmount(monthlySavings, config.currency)} per month with annual billing`
            }
        }

        // Get features from base plan key (without _YEARLY suffix)
        const baseKey = config.key.replace('_YEARLY', '')

        return {
            key: config.key,
            title: config.name,
            description: config.description ?? '',
            price: formatAmount(config.baseAmount, config.currency),
            priceAmount: config.baseAmount,
            priceId: config.stripePriceId ?? '',
            interval,
            features: PLAN_FEATURES[baseKey] ?? [],
            highlight: baseKey === 'ADVANCED',
            trialEnabled: (config.trialDays ?? 0) > 0,
            trialDays: config.trialDays ?? 0,
            isTiered: config.billingScheme === 'tiered_graduated',
            savings,
        }
    })
}


/**
 * Get a pricing card by Stripe price ID
 * Useful for checkout pages that need to lookup plan details by priceId
 */
export function getPricingCardByPriceId(priceId: string): PricingCardData | undefined {
    const monthlyCards = getPricingCards('month')
    const yearlyCards = getPricingCards('year')

    // Check monthly first, then yearly
    return monthlyCards.find(card => card.priceId === priceId)
        ?? yearlyCards.find(card => card.priceId === priceId)
}


// ============================================================================
// Type Assertions
// ============================================================================

/** Pricing config key field type */
export type PriceKey = (typeof PRICING_CONFIG)[keyof typeof PRICING_CONFIG]['key'];
type PricingConfigMap = typeof PRICING_CONFIG
type PricingConfigKey = keyof PricingConfigMap

export type PlanKey = {
    [K in PricingConfigKey]: PricingConfigMap[K]['type'] extends 'plan'
    ? (K extends `${string}_${'YEARLY' | 'MONTHLY'}` ? never : K)
    : never
}[PricingConfigKey]


export type AddonKey = {
    [K in PricingConfigKey]: PricingConfigMap[K]['type'] extends 'addon'
    ? (K extends `${string}_${'YEARLY' | 'MONTHLY'}` ? never : K)
    : never
}[PricingConfigKey]

export type PricingConfigItem = (typeof PRICING_CONFIG)[PriceKey];


// Dynamic extraction of ID
export const PRICE_IDS: Record<PriceKey, string> = Object.fromEntries(
    Object.values(PRICING_CONFIG)
        .map((config) => [config.key as PriceKey, config.stripePriceId ?? ''])
) as Record<PriceKey, string>;

// ============================================================================
// Recent Edits
// ============================================================================
