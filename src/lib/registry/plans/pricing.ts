import type { PricingEnginePlan } from '@/types/pricing';

export const PRICING_PLANS: PricingEnginePlan[] = [
    {
        product: {
            kind: 'subscription',
            fulfillment: 'access',
        },
        pricingModel: 'recurring',
        features: {
            // Feature-gated + limited examples
            seats: {
                entitled: true,
                usageLimit: { quantity: 10, unit: 'seat', window: { window: 'lifetime' } },
            },
            sso: { entitled: true },
            api_calls: {
                entitled: true,
                meter: 'api_calls',
                usageLimit: {
                    quantity: 100_000,
                    unit: 'request',
                    window: { window: 'per_interval', interval: 'monthly' },
                    overageAllowed: true,
                },
            },
        },
        components: [
            {
                component: 'recurring',
                billingScheme: 'tiered',
                tiersMode: 'graduated',
                tiers: [
                    { upTo: 10, unitAmountMinor: 1000 }, // $10.00 for first 10 units
                    { upTo: 50, unitAmountMinor: 800 },  // $8.00 for next 40 units
                    { unitAmountMinor: 500 },             // $5.00 for any additional units
                ],
                interval: 'monthly',
            },
        ],
        accounting: {
            obligations: [
                {
                    code: 'SUBSCRIPTION_ACCESS',
                    fulfillment: 'access',
                    revenueRecognition: {
                        timing: 'over_time',
                        pattern: 'straight_line',
                        servicePeriodDays: 30,
                    },
                },
            ],
            refundPolicy: {
                refundable: false,
                windowDays: 0,
            },
            cancellationPolicy: {
                cancellable: true,
                effective: 'end_of_period',
            },
            contractTerm: {
                minimumInterval: 'monthly',
                minimumIntervalCount: 1,
            },
        },
        stripe: {
            productId: 'prod_ABC123',
            priceId: 'price_XYZ789',
        },
    },
]