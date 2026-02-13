import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { creditTopUpCreated } from '@/lib/stripe/stripe-actions'
import { syncStripeSubscriptionToDb } from '@/lib/stripe/billing/subscription-sync'
import { db } from '@/lib/db'

const stripeWebhookEvents = new Set([
  'product.created',
  'product.updated',
  'price.created',
  'price.updated',
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.trial_will_end',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'setup_intent.succeeded',
  // Connect events
  'account.application.authorized',
  'account.application.deauthorized',
  // 'checkout.session.completed',
])

export async function POST(req: NextRequest) {
  let stripeEvent: Stripe.Event
  const body = await req.text()
  const headersList = await headers()
  const sig = headersList.get('Stripe-Signature')
  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET_LIVE ?? process.env.STRIPE_WEBHOOK_SECRET
  try {
    if (!sig || !webhookSecret) {
      console.log(
        '🔴 Error Stripe webhook secret or the signature does not exist.'
      )
      return
    }
    stripeEvent = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (error: any) {
    console.log(`🔴 Error ${error.message}`)
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 })
  }


  // Idempotency guard (top-app standard): ensure each Stripe event is processed once
  let webhookRecordId: string | null = null
  try {
    const created = await db.webhookEvent.create({
      data: {
        provider: 'stripe',
        eventId: stripeEvent.id,
        eventType: stripeEvent.type,
        status: 'RECEIVED',
        payload: JSON.stringify(stripeEvent.data?.object ?? "{}"),
      },
      select: { id: true },
    })
    webhookRecordId = created.id
  } catch (err: any) {
    // Duplicate event (already processed/received)
    if (err?.code === 'P2002') {
      return NextResponse.json(
        { webhookActionReceived: true, deduped: true },
        { status: 200 }
      )
    }
    throw err
  }

  try {
    if (stripeWebhookEvents.has(stripeEvent.type)) {
      switch (stripeEvent.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = stripeEvent.data.object as Stripe.Subscription

          if (
            subscription.metadata.connectAccountPayments ||
            subscription.metadata.connectAccountSubscriptions
          ) {
            console.log('SKIPPED FROM WEBHOOK 💳 because subscription was from a connected account', subscription.id)
            break
          }

          await syncStripeSubscriptionToDb({
            subscription,
            customerId: subscription.customer as string,
          })

          console.log(`✅ Subscription synced (status: ${subscription.status}) 💳`, {
            id: subscription.id,
            status: subscription.status,
            trialEnd: subscription.trial_end,
          })
          break
        }

        case 'setup_intent.succeeded': {
          const setupIntent = stripeEvent.data.object as Stripe.SetupIntent
          console.log('✅ SetupIntent succeeded 💳', {
            id: setupIntent.id,
            customer: setupIntent.customer,
            paymentMethod: setupIntent.payment_method,
          })
          // SetupIntent success means payment method is attached
          // Subscription will be updated automatically by Stripe
          break
        }

        case 'customer.subscription.trial_will_end': {
          const subscription = stripeEvent.data.object as Stripe.Subscription
          console.log('⏰ Trial ending soon', {
            subscriptionId: subscription.id,
            trialEnd: subscription.trial_end,
          })
          // TODO: Send email notification to user about trial ending
          break
        }

        case 'customer.subscription.deleted': {
          const subscription = stripeEvent.data.object as Stripe.Subscription

          if (
            subscription.metadata.connectAccountPayments ||
            subscription.metadata.connectAccountSubscriptions
          ) {
            console.log('SKIPPED FROM WEBHOOK 💳 because subscription was from a connected account', subscription.id)
            break
          }

          await syncStripeSubscriptionToDb({
            subscription,
            customerId: subscription.customer as string,
          })

          console.log('🚫 Subscription deleted (synced)', {
            subscriptionId: subscription.id,
            agencyId: subscription.metadata?.agencyId,
            status: subscription.status,
          })
          break
        }

        case 'invoice.payment_failed': {
          const invoice = stripeEvent.data.object as Stripe.Invoice
          const customerId = invoice.customer as string
          const subscription = invoice.parent?.subscription_details?.subscription as Stripe.Subscription

          // If this invoice is related to a subscription, prefer syncing from Stripe
          // so our SubscriptionItem/BillingState/EntitlementSnapshot stay canonical.
          if (!stripeEvent.account && invoice.parent?.subscription_details?.subscription) {
            const subscriptionId =
              typeof subscription === 'string'
                ? subscription
                : subscription.id
            const sub = await stripe.subscriptions.retrieve(subscriptionId, {
              expand: ['items.data.price'],
            })
            await syncStripeSubscriptionToDb({
              subscription: sub,
              customerId,
            })

            console.log('⚠️ Synced subscription after invoice.payment_failed', {
              subscriptionId,
              status: sub.status,
              invoiceId: invoice.id,
            })
            break
          }

          console.log('❌ Invoice payment failed', {
            invoiceId: invoice.id,
            customerId,
            amount: invoice.amount_due,
            attemptCount: invoice.attempt_count,
          })

          // Find agency by customerId and track dunning status
          const agency = await db.agency.findFirst({
            where: { customerId },
            include: { Subscription: true },
          })

          if (agency?.Subscription) {
            // Update subscription status to PAST_DUE
            await db.subscription.update({
              where: { agencyId: agency.id },
              data: {
                status: 'PAST_DUE',
              },
            })

            // TODO: Log dunning event (for tracking failed payment attempts)
            // TODO: Send email notification about failed payment
            console.log('⚠️ Subscription marked as PAST_DUE for agency:', agency.id, 'attempt:', invoice.attempt_count)
          }
          break
        }

        case 'invoice.payment_succeeded': {
          const invoice = stripeEvent.data.object as Stripe.Invoice
          const customerId = invoice.customer as string
          const subscription = invoice.parent?.subscription_details?.subscription as Stripe.Subscription

          // Ignore Connect invoices in the platform webhook
          if (stripeEvent.account) {
            console.log('SKIPPED invoice.payment_succeeded (connect event)', {
              invoiceId: invoice.id,
              account: stripeEvent.account,
            })
            break
          }

          // Subscription invoice: sync canonical state (handles dunning recovery)
          if (invoice.parent?.subscription_details?.subscription) {
            const subscriptionId =
              typeof subscription === 'string'
                ? subscription
                : subscription.id
            const sub = await stripe.subscriptions.retrieve(subscriptionId, {
              expand: ['items.data.price'],
            })
            await syncStripeSubscriptionToDb({
              subscription: sub,
              customerId,
            })

            console.log('✅ Synced subscription after invoice.payment_succeeded', {
              subscriptionId,
              status: sub.status,
              invoiceId: invoice.id,
              billing_reason: invoice.billing_reason,
            })
            break
          }

          // Non-subscription invoices (eg, one-off payments) can be handled separately.
          console.log('✅ Invoice payment succeeded (non-subscription)', {
            invoiceId: invoice.id,
            customerId,
            amount_paid: invoice.amount_paid,
          })
          break
        }

        case 'checkout.session.completed': {
          const session = stripeEvent.data.object as Stripe.Checkout.Session
          // Handle checkout session completion

          // Subscription checkout: sync canonical state (some Stripe setups rely on this)
          if (
            !stripeEvent.account &&
            session.mode === 'subscription' &&
            session.subscription &&
            session.customer
          ) {
            const subscriptionId =
              typeof session.subscription === 'string'
                ? session.subscription
                : session.subscription.id
            const sub = await stripe.subscriptions.retrieve(subscriptionId, {
              expand: ['items.data.price'],
            })
            await syncStripeSubscriptionToDb({
              subscription: sub,
              customerId: session.customer as string,
            })

            console.log('✅ Checkout Session completed (subscription synced) 💳', {
              id: session.id,
              subscriptionId,
              customer: session.customer,
              status: sub.status,
            })
            break
          }

          // Credits checkout (one-off payment)
          if (session.mode === 'payment' && session.payment_status === 'paid') {
            const md = session.metadata || {}
            const isCredits =
              md.checkoutType === 'credits' ||
              md.type === 'credit_purchase' ||
              (typeof md.checkoutTypes === 'string' &&
                md.checkoutTypes.split(',').map((s) => s.trim()).includes('credits'))

            if (!isCredits) {
              console.log('⏭️  Skipped checkout.session.completed (non-credits)', {
                id: session.id,
                mode: session.mode,
                payment_status: session.payment_status,
                metadata: md,
              })
              break
            }

            if (!session.customer) {
              console.log('⏭️  Skipped credit top-up (missing customer)', {
                id: session.id,
              })
              break
            }

            await creditTopUpCreated(session, session.customer as string)
            console.log('✅ Checkout Session completed and paid (credits) 💳', {
              id: session.id,
              customer: session.customer,
              payment_intent: session.payment_intent,
              metadata: md,
            })
          }
          break
        }

        case 'account.application.authorized': {
          const application = stripeEvent.data.object as Stripe.Application
          console.log('✅ Connect account authorized', {
            applicationId: application.id,
            name: application.name,
          })
          // Note: The actual connectAccountId is saved via OAuth callback in launchpad
          break
        }

        case 'account.application.deauthorized': {
          const application = stripeEvent.data.object as Stripe.Application
          // The account ID comes from the event's account field, not the application object
          const accountId = stripeEvent.account
          console.log('🚫 Connect account deauthorized', {
            applicationId: application.id,
            accountId,
          })
          
          // Clear connectAccountId from both Agency and SubAccount
          // This handles cases where access is revoked
          if (accountId) {
            await db.agency.updateMany({
              where: { connectAccountId: accountId },
              data: { connectAccountId: '' },
            })
            await db.subAccount.updateMany({
              where: { connectAccountId: accountId },
              data: { connectAccountId: '' },
            })
            console.log('✅ Cleared deauthorized connectAccountId:', accountId)
          }
          break
        }

        default:
          console.log('👉 Unhandled event type:', stripeEvent.type)
      }
    }
  } catch (error: any) {
    console.log(error)
    if (webhookRecordId) {
      await db.webhookEvent.update({
        where: { id: webhookRecordId },
        data: {
          status: 'FAILED',
          processedAt: new Date(),
          error: error?.message ?? String(error),
        },
      })
    }
    return new NextResponse('🔴 Webhook Error', { status: 400 })
  }

  if (webhookRecordId) {
    await db.webhookEvent.update({
      where: { id: webhookRecordId },
      data: { status: 'PROCESSED', processedAt: new Date() },
    })
  }

  return NextResponse.json(
    {
      webhookActionReceived: true,
    },
    {
      status: 200,
    }
  )
}

