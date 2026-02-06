import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PRICING_CONFIG } from '@/lib/registry/plans/pricing-config';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { hasAgencyPermission, hasSubAccountPermission } from '@/lib/features/iam/authz/permissions';
import { applyTopUpCreditsFromCheckout } from '@/lib/features/core/billing/credits/grant';
import type { MeteringScope } from '@/generated/prisma/client';

// ============================================================================
// Types & Validation
// ============================================================================

type CheckoutIntent = 'CHECKOUT' | 'PORTAL' | 'SETUP';

type CheckoutType = 'subscription' | 'addon' | 'credits' | 'one_time';

type CheckoutItemInput = {
  pricingKey?: keyof typeof PRICING_CONFIG;
  priceId?: string;
  type?: CheckoutType;
  quantity?: number;
  credits?: number;
  featureKey?: string;
  name?: string;
  description?: string;
  unitAmountCents?: number;
};

type CheckoutScope = 
  | { level: 'user'; userId: string }
  | { level: 'agency'; agencyId: string }
  | { level: 'subAccount'; agencyId: string; subAccountId: string };

type CheckoutRequestBody = {
  intent: CheckoutIntent;
  items: CheckoutItemInput[];
  scope?: CheckoutScope;
  uiMode?: 'embedded' | 'hosted';
  returnPath?: string;
  successPath?: string;
  cancelPath?: string;
  couponCode?: string;
  billingAddress?: {
    email?: string;
    name?: string;
    line1?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  metadata?: Record<string, string>;
};

type ResolvedItem = {
  type: CheckoutType;
  priceId: string;
  pricingKey?: string;
  name: string;
  description?: string;
  quantity: number;
  unitAmountCents: number;
  interval?: 'day' | 'week' | 'month' | 'year';
  intervalCount?: number;
  credits?: number;
  featureKey?: string;
};

// ============================================================================
// Helper Functions
// ============================================================================

function getOrigin(req: Request): string {
  const u = new URL(req.url);
  return u.origin;
}

function resolvePricingConfig(key: keyof typeof PRICING_CONFIG) {
  const cfg = PRICING_CONFIG[key];
  if (!cfg) throw new Error(`Unknown pricingKey: ${String(key)}`);
  return cfg;
}

function resolveItemType(cfg: typeof PRICING_CONFIG[keyof typeof PRICING_CONFIG]): CheckoutType {
  const configType = cfg.type as string;
  switch (configType) {
    case 'plan': return 'subscription';
    case 'addon': return 'addon';
    case 'credits': return 'credits';
    case 'one_time': return 'one_time';
    default: return cfg.interval === 'one_time' ? 'one_time' : 'subscription';
  }
}

function resolveItems(inputs: CheckoutItemInput[]): ResolvedItem[] {
  return inputs.map((input) => {
    // Resolve from pricing config
    if (input.pricingKey) {
      const cfg = resolvePricingConfig(input.pricingKey);
      const configType = cfg.type as string;
      return {
        type: input.type || resolveItemType(cfg),
        priceId: cfg.stripePriceId || '',
        pricingKey: input.pricingKey,
        name: cfg.name,
        description: cfg.description,
        quantity: input.quantity ?? 1,
        unitAmountCents: cfg.baseAmount,
        interval: cfg.interval === 'one_time' ? undefined : cfg.interval as 'day' | 'week' | 'month' | 'year',
        intervalCount: 1,
        credits: input.credits ?? (configType === 'credits' ? (cfg as any).credits : undefined),
        featureKey: input.featureKey ?? (cfg as any).featureKey,
      };
    }

    // Resolve from raw inputs (credits topup, custom items)
    if (input.type === 'credits') {
      return {
        type: 'credits',
        priceId: input.priceId || '',
        name: input.name || `${input.credits} Credits`,
        description: input.description || 'Credit top-up',
        quantity: input.quantity ?? 1,
        unitAmountCents: input.unitAmountCents ?? (input.credits ?? 0) * 10, // Default: 10 cents/credit
        credits: input.credits,
        featureKey: input.featureKey || 'core.credits',
      };
    }

    // Fallback
    return {
      type: input.type || 'one_time',
      priceId: input.priceId || '',
      name: input.name || 'Item',
      description: input.description,
      quantity: input.quantity ?? 1,
      unitAmountCents: input.unitAmountCents ?? 0,
    };
  });
}

function inferStripeMode(items: ResolvedItem[]): 'subscription' | 'payment' {
  const hasRecurring = items.some(
    (item) => item.type === 'subscription' || item.type === 'addon'
  );
  return hasRecurring ? 'subscription' : 'payment';
}

async function checkPermissions(scope: CheckoutScope): Promise<boolean> {
  try {
    switch (scope.level) {
      case 'user':
        // User-level checkout is always allowed for authenticated users
        return true;

      case 'agency':
        return (
          (await hasAgencyPermission(scope.agencyId, 'core.billing.account.view')) ||
          (await hasAgencyPermission(scope.agencyId, 'core.billing.account.manage'))
        );

      case 'subAccount':
        return (
          (await hasSubAccountPermission(scope.subAccountId, 'core.billing.account.view')) ||
          (await hasSubAccountPermission(scope.subAccountId, 'core.billing.account.manage'))
        );

      default:
        return false;
    }
  } catch {
    return false;
  }
}

async function getOrCreateStripeCustomer(
  userId: string,
  scope: CheckoutScope,
  email?: string,
  name?: string
): Promise<string> {
  let existingCustomerId: string | null = null;

  // Check for existing customer based on scope
  if (scope.level === 'agency') {
    const agency = await db.agency.findUnique({
      where: { id: scope.agencyId },
      select: { customerId: true },
    });
    existingCustomerId = agency?.customerId || null;
  } else if (scope.level === 'subAccount') {
    const subAccount = await db.subAccount.findUnique({
      where: { id: scope.subAccountId },
      select: { connectAccountId: true },
    });
    existingCustomerId = subAccount?.connectAccountId || null;
  } else {
    // User-level
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });
    // For user-level, we'll create a new customer or use email to look up
    if (user?.email) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      existingCustomerId = customers.data[0]?.id || null;
    }
  }

  if (existingCustomerId) {
    return existingCustomerId;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email: email,
    name: name,
    metadata: {
      userId,
      scopeLevel: scope.level,
      agencyId: scope.level === 'agency' || scope.level === 'subAccount' ? scope.agencyId : '',
      subAccountId: scope.level === 'subAccount' ? scope.subAccountId : '',
    },
  });

  // Update the entity with the new customer ID
  if (scope.level === 'agency') {
    await db.agency.update({
      where: { id: scope.agencyId },
      data: { customerId: customer.id },
    });
  }

  return customer.id;
}

function buildScopeMetadata(userId: string, scope: CheckoutScope): Record<string, string> {
  const base = {
    userId,
    scopeLevel: scope.level,
    platform: 'autlify',
  };

  switch (scope.level) {
    case 'agency':
      return { ...base, agencyId: scope.agencyId };
    case 'subAccount':
      return { ...base, agencyId: scope.agencyId, subAccountId: scope.subAccountId };
    default:
      return base;
  }
}

async function handleCreditsCheckout(
  items: ResolvedItem[],
  scope: CheckoutScope,
  userId: string,
  customerId: string,
  origin: string,
  body: CheckoutRequestBody
): Promise<Response> {
  const creditItems = items.filter((item) => item.type === 'credits');
  if (creditItems.length === 0) {
    return NextResponse.json({ error: 'NO_CREDIT_ITEMS' }, { status: 400 });
  }

  const totalCredits = creditItems.reduce((sum, item) => sum + (item.credits ?? 0) * item.quantity, 0);
  const totalAmountCents = creditItems.reduce((sum, item) => sum + item.unitAmountCents * item.quantity, 0);
  const featureKey = creditItems[0].featureKey || 'core.credits';

  const metadata = {
    ...buildScopeMetadata(userId, scope),
    checkoutType: 'credits',
    credits: String(totalCredits),
    featureKey,
    ...body.metadata,
  };

  const uiMode = body.uiMode ?? 'embedded';
  if (uiMode === 'embedded') {
    const returnUrl = `${origin}${body.returnPath ?? '/billing/credits/success'}?session_id={CHECKOUT_SESSION_ID}`;
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      mode: 'payment',
      customer: customerId,
      line_items: [{
        price_data: {
          currency: 'myr',
          product_data: {
            name: `${totalCredits} Credits`,
            description: 'Credit top-up for your account',
          },
          unit_amount: totalAmountCents,
        },
        quantity: 1,
      }],
      return_url: returnUrl,
      metadata,
    });

    return NextResponse.json({ clientSecret: session.client_secret, type: 'credits' });
  }

  // Hosted mode
  const successUrl = `${origin}${body.successPath ?? '/billing/credits/success'}?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}${body.cancelPath ?? '/billing'}`;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer: customerId,
    line_items: [{
      price_data: {
        currency: 'myr',
        product_data: {
          name: `${totalCredits} Credits`,
          description: 'Credit top-up for your account',
        },
        unit_amount: totalAmountCents,
      },
      quantity: 1,
    }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  });

  return NextResponse.json({ url: session.url, type: 'credits' });
}

// ============================================================================
// Main Route Handler
// ============================================================================

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = (await req.json()) as CheckoutRequestBody;

    // Validate request
    if (!body?.intent) {
      return NextResponse.json({ error: 'BAD_REQUEST', message: 'Missing intent' }, { status: 400 });
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: 'NO_ITEMS', message: 'No items provided' }, { status: 400 });
    }

    const origin = getOrigin(req);
    const userId = session.user.id;

    // Resolve scope from body or headers
    const scope: CheckoutScope = body.scope ?? { level: 'user', userId };
    const agencyIdHeader = req.headers.get('x-autlify-agency-id');
    const subAccountIdHeader = req.headers.get('x-autlify-subaccount-id');

    if (!body.scope && agencyIdHeader) {
      if (subAccountIdHeader) {
        Object.assign(scope, { level: 'subAccount', agencyId: agencyIdHeader, subAccountId: subAccountIdHeader });
      } else {
        Object.assign(scope, { level: 'agency', agencyId: agencyIdHeader });
      }
    }

    // Permission check
    const hasPermission = await checkPermissions(scope);
    if (!hasPermission) {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Insufficient permissions' }, { status: 403 });
    }

    // Handle Portal flow
    if (body.intent === 'PORTAL') {
      const customerId = req.headers.get('x-autlify-stripe-customer-id');
      if (!customerId) {
        return NextResponse.json({ error: 'MISSING_CUSTOMER' }, { status: 400 });
      }

      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${origin}${body.returnPath ?? '/billing'}`,
      });

      return NextResponse.json({ url: portal.url });
    }

    // Handle Setup Intent (for adding payment methods without checkout)
    if (body.intent === 'SETUP') {
      const customerId = await getOrCreateStripeCustomer(
        userId,
        scope,
        body.billingAddress?.email || session.user.email || undefined,
        body.billingAddress?.name || session.user.name || undefined
      );

      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        metadata: buildScopeMetadata(userId, scope),
      });

      return NextResponse.json({ clientSecret: setupIntent.client_secret, customerId });
    }

    // CHECKOUT flow
    const resolvedItems = resolveItems(body.items);

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      userId,
      scope,
      body.billingAddress?.email || session.user.email || undefined,
      body.billingAddress?.name || session.user.name || undefined
    );

    // Handle credits-only checkout separately
    const onlyCredits = resolvedItems.every((item) => item.type === 'credits');
    if (onlyCredits) {
      return handleCreditsCheckout(resolvedItems, scope, userId, customerId, origin, body);
    }

    // Build checkout metadata
    const checkoutTypes = [...new Set(resolvedItems.map((item) => item.type))];
    const metadata = {
      ...buildScopeMetadata(userId, scope),
      checkoutTypes: checkoutTypes.join(','),
      items: JSON.stringify(resolvedItems.map(({ priceId, pricingKey, type, quantity, credits }) => ({
        priceId, pricingKey, type, quantity, credits,
      }))),
      ...body.metadata,
    };

    // Build line items for Stripe
    const stripeMode = inferStripeMode(resolvedItems);
    const lineItems = resolvedItems.map((item) => {
      // Items with Stripe Price ID
      if (item.priceId) {
        return {
          price: item.priceId,
          quantity: item.quantity,
        };
      }

      // Dynamic pricing (credits, custom items)
      return {
        price_data: {
          currency: 'myr',
          product_data: {
            name: item.name,
            description: item.description,
          },
          unit_amount: item.unitAmountCents,
          ...(item.interval && {
            recurring: {
              interval: item.interval,
              interval_count: item.intervalCount || 1,
            },
          }),
        },
        quantity: item.quantity,
      };
    });

    const uiMode = body.uiMode ?? 'embedded';

    if (uiMode === 'embedded') {
      const returnUrl = `${origin}${body.returnPath ?? '/checkout/success'}?session_id={CHECKOUT_SESSION_ID}`;
      
      const checkoutSession = await stripe.checkout.sessions.create({
        ui_mode: 'embedded',
        mode: stripeMode,
        customer: customerId,
        line_items: lineItems,
        return_url: returnUrl,
        metadata,
        ...(body.couponCode && {
          discounts: [{ coupon: body.couponCode }],
        }),
        ...(stripeMode === 'subscription' && {
          subscription_data: {
            metadata: {
              ...metadata,
              agencyId: scope.level === 'agency' || scope.level === 'subAccount' ? scope.agencyId : '',
            },
          },
        }),
      });

      return NextResponse.json({
        clientSecret: checkoutSession.client_secret,
        type: stripeMode,
        sessionId: checkoutSession.id,
      });
    }

    // Hosted mode
    const successUrl = `${origin}${body.successPath ?? '/checkout/success'}?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}${body.cancelPath ?? '/site/pricing'}`;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: stripeMode,
      customer: customerId,
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      ...(body.couponCode && {
        discounts: [{ coupon: body.couponCode }],
      }),
      ...(stripeMode === 'subscription' && {
        subscription_data: {
          metadata: {
            ...metadata,
            agencyId: scope.level === 'agency' || scope.level === 'subAccount' ? scope.agencyId : '',
          },
        },
      }),
    });

    return NextResponse.json({
      url: checkoutSession.url,
      type: stripeMode,
      sessionId: checkoutSession.id,
    });

  } catch (e: any) {
    console.error('Checkout error:', e);
    return NextResponse.json(
      { error: e?.message ?? 'CHECKOUT_FAILED' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET Handler - Retrieve checkout session status
// ============================================================================

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const url = new URL(req.url);
    const sessionId = url.searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'MISSING_SESSION_ID' }, { status: 400 });
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'subscription', 'payment_intent'],
    });

    return NextResponse.json({
      status: checkoutSession.status,
      paymentStatus: checkoutSession.payment_status,
      customerEmail: checkoutSession.customer_details?.email,
      amountTotal: checkoutSession.amount_total,
      currency: checkoutSession.currency,
      metadata: checkoutSession.metadata,
      lineItems: checkoutSession.line_items?.data.map((item) => ({
        name: item.description,
        quantity: item.quantity,
        amount: item.amount_total,
      })),
    });
  } catch (e: any) {
    console.error('Checkout session retrieval error:', e);
    return NextResponse.json({ error: e?.message ?? 'RETRIEVAL_FAILED' }, { status: 500 });
  }
}
