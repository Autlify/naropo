import { db } from '@/lib/db'
import { stripe } from '@/lib/stripe'
import { auth } from '@/auth'
import { hasSubAccountPermission } from '@/lib/features/iam/authz/permissions'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export async function POST(req: Request) {
  const bodySchema = z.object({
    // Preferred: server derives account + prices from funnelId (SSoT)
    funnelId: z.string().min(1).optional(),
    // Back-compat: old client sends these
    subaccountId: z.string().min(1).optional(),
    subAccountConnectAccId: z.string().min(1).optional(),
    prices: z
      .array(
        z.object({
          recurring: z.boolean().optional().default(false),
          // old key name was productId but it actually stores Stripe *price* id
          productId: z.string().min(1).optional(),
          priceId: z.string().min(1).optional(),
        })
      )
      .optional(),
  })

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { funnelId } = parsed.data

  const origin = req.headers.get('origin')
  // Resolve funnel + connected account (SSoT)
  const funnel = funnelId
    ? await db.funnel.findUnique({
        where: { id: funnelId },
        include: { SubAccount: true },
      })
    : null

  // Back-compat fallback (less secure; will be deprecated)
  const fallbackSubaccountId = parsed.data.subaccountId
  const subaccount = !funnel && fallbackSubaccountId
    ? await db.subAccount.findUnique({ where: { id: fallbackSubaccountId } })
    : null

  if (!funnel && !subaccount) {
    return NextResponse.json({ error: 'Funnel or subaccount not found' }, { status: 404 })
  }

  // Only allow draft funnels when the requester is authenticated AND has subaccount access.
  if (funnel && !funnel.published) {
    const session = await auth()
    const ok =
      !!session?.user?.id &&
      (await hasSubAccountPermission(funnel.subAccountId, 'crm.funnels.content.read'))
    if (!ok) {
      // Fail-closed (public cannot generate draft checkout sessions)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  const connectAccountId =
    funnel?.SubAccount?.connectAccountId || subaccount?.connectAccountId || null
  if (!connectAccountId) {
    return NextResponse.json(
      { error: 'Stripe Connect account is not connected for this subaccount' },
      { status: 400 }
    )
  }

  const rawPrices =
    funnel?.liveProducts && funnel.liveProducts !== '[]'
      ? (() => {
          try {
            return JSON.parse(funnel.liveProducts || '[]')
          } catch {
            return []
          }
        })()
      : (parsed.data.prices ?? [])

  const prices = (Array.isArray(rawPrices) ? rawPrices : [])
    .map((p: any) => ({
      recurring: !!p?.recurring,
      priceId: String(p?.priceId || p?.productId || '').trim(),
    }))
    .filter((p: any) => !!p.priceId)

  if (!prices.length) {
    return NextResponse.json(
      { error: 'No products configured for this funnel' },
      { status: 400 }
    )
  }

  const subscriptionPriceExists = prices.some((price: any) => price.recurring)

  // Fees: use server-side env vars; fall back to legacy NEXT_PUBLIC names for compatibility.
  const subscriptionPercent = Number(
    process.env.STRIPE_PLATFORM_SUBSCRIPTION_PERCENT ??
      process.env.NEXT_PUBLIC_PLATFORM_SUBSCRIPTION_PERCENT ??
      0
  )
  const onetimeFee = Number(
    process.env.STRIPE_PLATFORM_ONETIME_FEE ?? process.env.NEXT_PUBLIC_PLATFORM_ONETIME_FEE ?? 0
  )

  if (!Number.isFinite(subscriptionPercent) || !Number.isFinite(onetimeFee)) {
    return NextResponse.json({ error: 'Platform fees not configured' }, { status: 500 })
  }

  try {
    const session = await stripe.checkout.sessions.create(
      {
        line_items: prices.map((price: any) => ({
          price: price.priceId,
          quantity: 1,
        })),

        ...(subscriptionPriceExists && {
          subscription_data: {
            metadata: {
              connectAccountSubscriptions: 'true',
              kind: 'funnel_checkout',
              ...(funnel?.id ? { funnelId: funnel.id } : {}),
              ...(funnel?.subAccountId ? { subAccountId: funnel.subAccountId } : {}),
            },
            application_fee_percent: subscriptionPercent,
          },
        }),

        ...(!subscriptionPriceExists && {
          payment_intent_data: {
            metadata: {
              connectAccountPayments: 'true',
              kind: 'funnel_checkout',
              ...(funnel?.id ? { funnelId: funnel.id } : {}),
              ...(funnel?.subAccountId ? { subAccountId: funnel.subAccountId } : {}),
            },
            application_fee_amount: Math.round(onetimeFee * 100),
          },
        }),

        mode: subscriptionPriceExists ? 'subscription' : 'payment',
        ui_mode: 'embedded',
        redirect_on_completion: 'never',
      },
      { stripeAccount: connectAccountId }
    )

    return NextResponse.json(
      {
        clientSecret: session.client_secret,
        connectAccountId,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    )
  } catch (error) {
    console.log('🔴 Error', error)
    //@ts-ignore
    return NextResponse.json({ error: error.message })
  }
}

export async function OPTIONS(request: Request) {
  const allowedOrigin = request.headers.get('origin')
  const response = new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version',
      'Access-Control-Max-Age': '86400',
    },
  })

  return response
}
