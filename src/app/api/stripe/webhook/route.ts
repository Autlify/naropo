import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { creditTopUpCreated, subscriptionCreated } from '@/lib/stripe/stripe-actions'
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

  try {
    if (stripeWebhookEvents.has(stripeEvent.type)) {
      switch (stripeEvent.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = stripeEvent.data.object as Stripe.Subscription

          // Skip if from connected account
          if (
            subscription.metadata.connectAccountPayments ||
            subscription.metadata.connectAccountSubscriptions
          ) {
            console.log(
              'SKIPPED FROM WEBHOOK 💳 because subscription was from a connected account',
              subscription.id
            )
            break
          }

          // Handle both 'active' and 'trialing' status
          if (subscription.status === 'active' || subscription.status === 'trialing') {
            await subscriptionCreated(
              subscription,
              subscription.customer as string
            )
            console.log(`✅ Subscription ${subscription.status.toUpperCase()} 💳`, {
              id: subscription.id,
              status: subscription.status,
              trialEnd: subscription.trial_end,
            })
          } else {
            console.log(
              `⏭️  Skipped subscription (status: ${subscription.status})`,
              subscription.id
            )
          }
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
          const agencyId = subscription.metadata?.agencyId

          console.log('🚫 Subscription deleted', {
            subscriptionId: subscription.id,
            agencyId,
            status: subscription.status,
          })

          if (agencyId) {
            // Update subscription status in database
            await db.subscription.update({
              where: { agencyId },
              data: {
                active: false,
                status: 'CANCELED',
                cancelAtPeriodEnd: false, // Clear since it's now actually cancelled
              },
            })
            console.log('✅ Database subscription marked as cancelled for agency:', agencyId)
          }
          break
        }

        case 'invoice.payment_failed': {
          const invoice = stripeEvent.data.object as Stripe.Invoice
          const customerId = invoice.customer as string

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

        case 'checkout.session.completed': {
          const session = stripeEvent.data.object as Stripe.Checkout.Session
          // Handle checkout session completion (implement later)
          if (session.mode === 'payment' && session.payment_status === 'paid') {
            await creditTopUpCreated(
              session,
              session.customer as string
            )
            console.log('✅ Checkout Session completed and paid 💳', {
              id: session.id,
              customer: session.customer,
              payment_intent: session.payment_intent,
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
  } catch (error) {
    console.log(error)
    return new NextResponse('🔴 Webhook Error', { status: 400 })
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

