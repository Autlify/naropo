#!/usr/bin/env bun
/**
 * Complete Reset - Stripe Test Data & Database
 * 
 * This script:
 * 1. Deletes all test subscriptions
 * 2. Deletes test agencies 
 * 3. Resets database
 */

import { db } from '../src/lib/db'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
})

const TEST_USER_ID = '2a006265-f410-4c43-b4b7-d0c8525350c7'

async function main() {
  console.log('🔥 COMPLETE RESET - Stripe & Database\n')
  console.log('⚠️  This will delete ALL test data!\n')

  // Step 1: Get user's test agencies
  const user = await db.user.findUnique({
    where: { id: TEST_USER_ID },
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

  console.log(`Found ${user.AgencyMemberships.length} agency membership(s)\n`)

  // Step 2: Clean up each agency
  for (const membership of user.AgencyMemberships) {
    const agency = membership.Agency
    console.log(`🧹 Cleaning agency: ${agency.name}`)

    // Cancel subscription in Stripe
    if (agency.Subscription) {
      try {
        await stripe.subscriptions.cancel(agency.Subscription.subscritiptionId)
        console.log(`   ✅ Canceled subscription: ${agency.Subscription.subscritiptionId}`)
      } catch (error) {
        console.log(`   ⚠️  Subscription already canceled/deleted`)
      }
    }

    // Detach payment methods
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
        console.log(`   ⚠️  Payment methods already detached`)
      }

      // Delete Stripe customer
      try {
        await stripe.customers.del(agency.customerId)
        console.log(`   ✅ Deleted Stripe customer: ${agency.customerId}`)
      } catch (error) {
        console.log(`   ⚠️  Customer already deleted`)
      }
    }

    // Delete agency from database (cascade deletes subscription, memberships, etc.)
    try {
      await db.agency.delete({
        where: { id: agency.id },
      })
      console.log(`   ✅ Deleted agency from database`)
    } catch (error) {
      console.log(`   ⚠️  Failed to delete agency:`, error)
    }

    console.log('')
  }

  console.log('✅ Complete reset finished!\n')
  console.log('📋 Next steps:')
  console.log('   1. Run: bun run test:subscription')
  console.log('   2. Test webhook processing')
  console.log('   3. Advance test clock to verify payment\n')
}

main()
  .catch((error) => {
    console.error('❌ Reset failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
