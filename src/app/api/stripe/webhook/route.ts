import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { subscriptionCreated } from '@/lib/stripe/stripe-actions'
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
  'setup_intent.succeeded',
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
          // Send email notification (implement later)
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

