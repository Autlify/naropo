#!/usr/bin/env bun
/**
 * Cleanup Test Subscriptions
 * 
 * Removes test subscriptions from both Stripe and database
 */

import { db } from '../src/lib/db'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
})

const TEST_USER_EMAIL = 'zayn_tan@icloud.com'

async function main() {
  console.log('🧹 Cleaning up test subscriptions...\n')

  // Find user's agencies
  const user = await db.user.findUnique({
    where: { email: TEST_USER_EMAIL },
    include: {
      AgencyMemberships: {
        include: {
          Agency: {
            include: {
              Subscription: true,
            },
          },
        },
      },
    },
  })

  if (!user) {
    console.log('❌ User not found')
    return
  }

  for (const membership of user.AgencyMemberships) {
    const agency = membership.Agency
    
    if (agency.Subscription) {
      console.log(`🔍 Found subscription for agency: ${agency.name}`)
      console.log(`   Stripe ID: ${agency.Subscription.subscritiptionId}`)
      
      // Cancel in Stripe
      try {
        await stripe.subscriptions.cancel(agency.Subscription.subscritiptionId)
        console.log(`   ✅ Canceled in Stripe`)
      } catch (error) {
        console.log(`   ⚠️  Failed to cancel in Stripe (might already be deleted)`)
      }

      // Delete from database
      await db.subscription.delete({
        where: { id: agency.Subscription.id },
      })
      console.log(`   ✅ Deleted from database`)
    }

    // Detach payment methods from customer
    if (agency.customerId) {
      try {
        const paymentMethods = await stripe.paymentMethods.list({
          customer: agency.customerId,
          type: 'card',
        })
        
        for (const pm of paymentMethods.data) {
          await stripe.paymentMethods.detach(pm.id)
          console.log(`   ✅ Detached payment method: ${pm.id}`)
        }
      } catch (error) {
        console.log(`   ⚠️  Failed to detach payment methods (might already be deleted)`)
      }
    }
    
    console.log('')
  }

  console.log('✅ Cleanup complete!\n')
}

main()
  .catch((error) => {
    console.error('❌ Cleanup failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
