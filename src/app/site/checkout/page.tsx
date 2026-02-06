import { notFound, redirect } from 'next/navigation'
import { getPricingCardByPriceId, getAddonCards } from '@/lib/registry/plans/pricing-config'
import { CheckoutForm } from '@/components/forms/checkout-form'
import { auth } from '@/auth'
import { getUser } from '@/lib/queries'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

type Props = {
    searchParams: Promise<{ priceId: string, interval?: 'month' | 'year' }>
}

export default async function CheckoutPage({ searchParams }: Props) {
    const { priceId, interval } = await searchParams
    const session = await auth()
    const priceDetails = getPricingCardByPriceId(priceId)
    const user = await getUser(session?.user?.id || '')
    
    // Get all available addons for upsell during checkout
    const availableAddons = getAddonCards()

    if (!priceDetails) {
        notFound()
    }

    if (!session?.user || !user) {
        redirect('/sign-in?callbackUrl=' + encodeURIComponent(`/site/checkout?priceId=${priceId}`))
    }
 

    // Fetch existing customer data and payment methods if customerId exists
    let existingCustomer: Stripe.Customer | null = null
    let existingPaymentMethods: Stripe.PaymentMethod[] = []

    if (user.customerId) {
        try {
            existingCustomer = await stripe.customers.retrieve(user.customerId) as Stripe.Customer
            
            // Only fetch payment methods if customer exists and is not deleted
            if (!existingCustomer.deleted) {
                const paymentMethods = await stripe.paymentMethods.list({
                    customer: user.customerId,
                    type: 'card',
                })
                existingPaymentMethods = paymentMethods.data
            }
        } catch (error) {
            console.error('Error fetching customer data:', error)
            // Continue without pre-fill data if customer fetch fails
        }
    }

    // Convert Stripe objects to plain objects for Client Component
    const customerData = existingCustomer && !existingCustomer.deleted ? {
        id: existingCustomer.id,
        email: existingCustomer.email ?? null,
        name: existingCustomer.name ?? null,
        phone: existingCustomer.phone ?? null,
        address: existingCustomer.address ? {
            line1: existingCustomer.address.line1 ?? null,
            line2: existingCustomer.address.line2 ?? null,
            city: existingCustomer.address.city ?? null,
            state: existingCustomer.address.state ?? null,
            postal_code: existingCustomer.address.postal_code ?? null,
            country: existingCustomer.address.country ?? null,
        } : null,
        metadata: existingCustomer.metadata as Record<string, string>,
        default_payment_method: existingCustomer.invoice_settings.default_payment_method ?? null,
    } : null

    const paymentMethodsData = existingPaymentMethods.map(pm => ({
        id: pm.id,
        card: pm.card ? {
            cardholder_name: pm.card_present?.cardholder_name || null,
            brand: pm.card.brand,
            last4: pm.card.last4,
            exp_month: pm.card.exp_month,
            exp_year: pm.card.exp_year,
            isDefault: pm.id === customerData?.default_payment_method ? true : false
        } : null,
    }))

    // Map PricingCardData to the shape expected by CheckoutForm
    const planConfig = {
        title: priceDetails.title,
        price: priceDetails.price,
        duration: priceDetails.interval === 'month' ? 'Monthly' : 'Yearly',
        features: priceDetails.features,
        trialEnabled: priceDetails.trialEnabled,
        trialPeriodDays: priceDetails.trialDays,
    }

    return (
        <div className="w-full min-h-screen justify-center">
            <CheckoutForm 
                priceId={priceId}
                planConfig={planConfig}
                agencyEmail={session?.user.email!}
                user={{
                    id: user.id,
                    email: user.email,
                    name: user.name || '',
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    trialEligible: user.trialEligible,
                }}
                existingCustomer={customerData}
                existingPaymentMethods={paymentMethodsData}
                availableAddons={availableAddons}
            />
     </div>
    )
}

// import { auth } from '@/auth'
// import { hasAgencyPermission, hasSubAccountPermission } from '@/lib/features/iam/authz/permissions'
// import { parseSavedContext } from '@/lib/features/iam/authz/resolver'
// import { cookies } from 'next/headers'
// import { notFound, redirect } from 'next/navigation'
// import { PRICING_CONFIG, getPricingCardByPriceId, getAddonCards } from '@/lib/registry/plans/pricing-config'
// import { CheckoutForm } from '@/components/features/core/billing/checkout/checkout-form'
// import { getUser, getAgencyDetails } from '@/lib/queries'
// import { stripe } from '@/lib/stripe'
// import type Stripe from 'stripe'
// import type { CheckoutItem, CheckoutType, CheckoutContext, CustomerData, PaymentMethod, User, AddonCardData } from '@/types/billing'

// export const metadata = {
//   title: 'Checkout',
// }

// /**
//  * Unified Checkout Page - Supports multiple checkout scenarios
//  *
//  * @url /site/checkout
//  *
//  * URL Parameters:
//  * @param source - Where the checkout was initiated from
//  *   - 'site' = New subscription from pricing page (user-level)
//  *   - 'agency' = Agency billing (addons, credits, plan changes)
//  *   - 'subaccount' = SubAccount billing (future)
//  *
//  * @param type - Type of purchase
//  *   - 'plan' = Subscription plan (default)
//  *   - 'addon' = Add-on purchase
//  *   - 'credits' = Credit top-up
//  *
//  * @param priceId - Stripe price ID (required for plan/addon)
//  * @param pricingKey - Key from PRICING_CONFIG (alternative to priceId)
//  * @param agencyId - Agency ID (required for agency/subaccount source)
//  * @param subAccountId - SubAccount ID (required for subaccount source)
//  * @param addonKey - Add-on key from PRICING_CONFIG (for addon type)
//  * @param interval - Billing interval: 'month' | 'year' (default: 'month')
//  * @param credits - Number of credits (for credits type)
//  * @param quantity - Quantity (default: 1, used for enterprise/seat-based plans)
//  *
//  * @example Site Plan Purchase (Monthly)
//  * /site/checkout?source=site&priceId=price_xxx&interval=month
//  *
//  * @example Site Plan Purchase (Yearly)
//  * /site/checkout?source=site&pricingKey=STARTER&interval=year
//  *
//  * @example Enterprise Plan with Quantity
//  * /site/checkout?source=site&pricingKey=ENTERPRISE&interval=year&quantity=50
//  *
//  * @example Agency Add-on
//  * /site/checkout?source=agency&agencyId=ag_123&type=addon&pricingKey=ADDON_FI_GL
//  *
//  * @example Agency Credits
//  * /site/checkout?source=agency&agencyId=ag_123&type=credits&credits=100
//  */
// type Props = {
//   searchParams: Promise<{
//     // Source & Scope
//     source?: 'site' | 'agency' | 'subaccount'
//     agencyId?: string
//     subAccountId?: string
//     // Purchase Type
//     type?: 'plan' | 'addon' | 'credits'
//     // Item Identification
//     priceId?: string
//     pricingKey?: string
//     addonKey?: string
//     // Billing Interval
//     interval?: 'month' | 'year'
//     // Quantity & Amount
//     credits?: string
//     quantity?: string
//     // Optional
//     coupon?: string
//   }>
// }

// const CheckoutPage = async ({ searchParams }: Props) => {
//   const params = await searchParams
//   const {
//     source = 'site',
//     agencyId,
//     subAccountId,
//     type = 'plan',
//     priceId,
//     pricingKey,
//     addonKey,
//     interval: billingInterval = 'month',
//     credits,
//     quantity = '1',
//     coupon,
//   } = params

//   const session = await auth()

//   // Redirect to sign-in if not authenticated
//   if (!session?.user?.id) {
//     const callbackUrl = new URL('/site/checkout', 'http://localhost')
//     Object.entries(params).forEach(([key, value]) => {
//       if (value) callbackUrl.searchParams.set(key, value as string)
//     })
//     redirect(`/site/sign-in?callbackUrl=${encodeURIComponent(callbackUrl.pathname + callbackUrl.search)}`)
//   }

//   const cookieStore = await cookies()
//   const contextCookie = cookieStore.get('autlify.context-token')?.value
//   const savedContext = contextCookie ? parseSavedContext(contextCookie) : null

//   // Extract IDs from context if not provided in URL
//   const contextAgencyId = savedContext?.kind === 'agency' ? savedContext.agencyId : null
//   const effectiveAgencyId = agencyId || contextAgencyId
//   const effectiveSubAccountId = subAccountId

//   // Permission check for agency/subaccount sources
//   let hasPermission = false
//   try {
//     switch (source) {
//       case 'site':
//         // Site-level checkout is always allowed for authenticated users
//         hasPermission = true
//         break
//       case 'agency':
//         if (effectiveAgencyId) {
//           hasPermission =
//             (await hasAgencyPermission(effectiveAgencyId, 'core.billing.account.view')) ||
//             (await hasAgencyPermission(effectiveAgencyId, 'core.billing.account.manage'))
//         }
//         break
//       case 'subaccount':
//         if (effectiveSubAccountId) {
//           hasPermission =
//             (await hasSubAccountPermission(effectiveSubAccountId, 'core.billing.account.view')) ||
//             (await hasSubAccountPermission(effectiveSubAccountId, 'core.billing.account.manage'))
//         }
//         break
//     }
//   } catch (error) {
//     console.error('Permission check failed:', error)
//     hasPermission = false
//   }

//   // Permission denied for agency/subaccount sources
//   if (source !== 'site' && !hasPermission) {
//     redirect('/unauthorized')
//   }

//   // Fetch user data
//   const user = await getUser(session.user.id)
//   if (!user) {
//     redirect('/site/sign-in')
//   }

//   // Resolve pricing configuration from URL params
//   const resolvePricingConfig = () => {
//     // Try pricingKey first (direct key lookup)
//     if (pricingKey && pricingKey in PRICING_CONFIG) {
//       return { key: pricingKey, config: PRICING_CONFIG[pricingKey as keyof typeof PRICING_CONFIG] }
//     }
//     // Try addonKey
//     if (addonKey && addonKey in PRICING_CONFIG) {
//       return { key: addonKey, config: PRICING_CONFIG[addonKey as keyof typeof PRICING_CONFIG] }
//     }
//     // Try priceId (search through configs)
//     if (priceId) {
//       for (const [key, cfg] of Object.entries(PRICING_CONFIG)) {
//         if (cfg.stripePriceId === priceId) {
//           return { key, config: cfg }
//         }
//       }
//       // Also check yearly price IDs (for configs that have them)
//       for (const [key, cfg] of Object.entries(PRICING_CONFIG)) {
//         if ('stripeYearlyPriceId' in cfg && cfg.stripeYearlyPriceId === priceId) {
//           return { key, config: cfg }
//         }
//       }
//     }
//     return null
//   }

//   const resolved = resolvePricingConfig()

//   // Validate we have a valid item to checkout
//   if (!resolved && type !== 'credits') {
//     notFound()
//   }

//   // Fetch existing customer data and payment methods
//   let existingCustomer: Stripe.Customer | null = null
//   let existingPaymentMethods: Stripe.PaymentMethod[] = []
//   let existingCustomerId: string | undefined

//   // For agency source, use agency's customerId
//   if (source === 'agency' && effectiveAgencyId) {
//     const agency = await getAgencyDetails(effectiveAgencyId)
//     existingCustomerId = agency?.customerId || undefined
//   } else {
//     // For site source, use user's customerId
//     existingCustomerId = user.customerId || undefined
//   }

//   if (existingCustomerId) {
//     try {
//       existingCustomer = (await stripe.customers.retrieve(existingCustomerId)) as Stripe.Customer

//       // Only fetch payment methods if customer exists and is not deleted
//       if (!existingCustomer.deleted) {
//         const paymentMethods = await stripe.paymentMethods.list({
//           customer: existingCustomerId,
//           type: 'card',
//         })
//         existingPaymentMethods = paymentMethods.data
//       }
//     } catch (error) {
//       console.error('Error fetching customer data:', error)
//       // Continue without pre-fill data if customer fetch fails
//     }
//   }

//   // Convert Stripe objects to plain objects for Client Component
//   const customerData: CustomerData | null =
//     existingCustomer && !existingCustomer.deleted
//       ? {
//           id: existingCustomer.id,
//           email: existingCustomer.email ?? null,
//           name: existingCustomer.name ?? null,
//           phone: existingCustomer.phone ?? null,
//           address: existingCustomer.address
//             ? {
//                 line1: existingCustomer.address.line1 ?? null,
//                 line2: existingCustomer.address.line2 ?? null,
//                 city: existingCustomer.address.city ?? null,
//                 state: existingCustomer.address.state ?? null,
//                 postal_code: existingCustomer.address.postal_code ?? null,
//                 country: existingCustomer.address.country ?? null,
//               }
//             : null,
//           metadata: existingCustomer.metadata as Record<string, string>,
//         }
//       : null

//   const defaultPaymentMethodId =
//     existingCustomer && !existingCustomer.deleted
//       ? (existingCustomer.invoice_settings.default_payment_method as string | null)
//       : null

//   const paymentMethodsData: PaymentMethod[] = existingPaymentMethods.map((pm) => ({
//     id: pm.id,
//     card: pm.card
//       ? {
//           cardholder_name: pm.billing_details?.name || null,
//           brand: pm.card.brand,
//           last4: pm.card.last4,
//           exp_month: pm.card.exp_month,
//           exp_year: pm.card.exp_year,
//           isDefault: pm.id === defaultPaymentMethodId,
//         }
//       : null,
//   }))

//   // Get available addons for upsell during plan checkout
//   const availableAddons = getAddonCards()

//   // Build CheckoutItem based on type and resolved config
//   const qty = parseInt(quantity, 10) || 1
//   const config = resolved?.config

//   const buildCheckoutItem = (): CheckoutItem => {
//     // Credits checkout
//     if (type === 'credits') {
//       const creditAmount = parseInt(credits || '100', 10)
//       return {
//         key: `credits-${creditAmount}`,
//         type: 'credits',
//         title: `${creditAmount} Credits`,
//         description: 'Top-up credits for your account',
//         price: `RM ${(creditAmount * 0.1).toFixed(2)}`,
//         priceAmount: creditAmount * 10, // 10 sen per credit
//         priceId: '', // Credits use a different checkout flow
//         quantity: creditAmount,
//         interval: 'one_time',
//       }
//     }

//     // Must have config for plan/addon
//     if (!config || !resolved) {
//       throw new Error('Invalid pricing configuration')
//     }

//     const isYearly = billingInterval === 'year'
//     const hasYearlyPrice = 'stripeYearlyPriceId' in config
//     const hasYearlyAmount = 'yearlyAmount' in config
//     const effectivePriceId = isYearly && hasYearlyPrice ? (config as any).stripeYearlyPriceId : config.stripePriceId
//     const effectivePriceAmount = isYearly && hasYearlyAmount ? (config as any).yearlyAmount : config.baseAmount

//     // Addon checkout
//     if (type === 'addon') {
//       return {
//         key: resolved.key,
//         type: 'addon',
//         title: config.name,
//         description: config.description,
//         price: `RM ${(effectivePriceAmount / 100).toFixed(2)}`,
//         priceAmount: effectivePriceAmount,
//         priceId: effectivePriceId,
//         quantity: qty,
//         interval: billingInterval,
//       }
//     }

//     // Plan (subscription) checkout
//     return {
//       key: resolved.key,
//       type: 'plan',
//       title: config.name,
//       description: config.description,
//       price: `RM ${(effectivePriceAmount / 100).toFixed(2)}`,
//       priceAmount: effectivePriceAmount,
//       priceId: effectivePriceId,
//       quantity: qty,
//       interval: billingInterval,
//       features: 'features' in config && Array.isArray((config as any).features) ? (config as any).features : [],
//       trial:
//         'trialDays' in config && config.trialDays && config.trialDays > 0
//           ? {
//               enabled: true,
//               days: config.trialDays,
//             }
//           : undefined,
//     }
//   }

//   const checkoutItem = buildCheckoutItem()

//   // Build checkout context
//   const checkoutContext: CheckoutContext = {
//     agencyId: effectiveAgencyId || undefined,
//     customerId: existingCustomerId || undefined,
//     isNewSubscription: source === 'site' && type === 'plan' && !effectiveAgencyId,
//   }

//   // Build user data
//   const userData: User = {
//     id: user.id,
//     email: user.email,
//     name: user.name || '',
//     firstName: user.firstName || '',
//     lastName: user.lastName || '',
//     trialEligible: user.trialEligible,
//   }

//   // Determine back URL based on source
//   const getBackUrl = () => {
//     switch (source) {
//       case 'agency':
//         return effectiveAgencyId ? `/agency/${effectiveAgencyId}/billing` : '/site/pricing'
//       case 'subaccount':
//         return effectiveSubAccountId ? `/subaccount/${effectiveSubAccountId}/billing` : '/site/pricing'
//       default:
//         return '/site/pricing'
//     }
//   }

//   return (
//     <div className="w-full min-h-screen">
//       <CheckoutForm
//         mode="page"
//         item={checkoutItem}
//         user={userData}
//         context={checkoutContext}
//         existingCustomer={customerData}
//         existingPaymentMethods={paymentMethodsData}
//         availableAddons={type === 'plan' ? availableAddons : []}
//         backUrl={getBackUrl()}
//         successUrl={
//           effectiveAgencyId ? `/agency/${effectiveAgencyId}?checkout=success` : '/site?checkout=success'
//         }
//       />
//     </div>
//   )
// }

// export default CheckoutPage
