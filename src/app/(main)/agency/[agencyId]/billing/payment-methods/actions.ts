'use server'

import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

type ActionResult<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Create a SetupIntent for adding a new payment method
 */
export async function createSetupIntent(
  agencyId: string
): Promise<ActionResult<{ clientSecret: string; customerId: string }>> {
  try {
    // Get customer ID
    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      select: { customerId: true },
    })

    if (!agency?.customerId) {
      return { success: false, error: 'No customer found for this agency' }
    }

    // Create SetupIntent for collecting payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: agency.customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        agencyId,
        source: 'billing-settings',
      },
    })

    if (!setupIntent.client_secret) {
      return { success: false, error: 'Failed to create setup intent' }
    }

    return { 
      success: true, 
      data: { 
        clientSecret: setupIntent.client_secret,
        customerId: agency.customerId,
      } 
    }
  } catch (error) {
    console.error('Error creating setup intent:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create setup intent' 
    }
  }
}

/**
 * Set a payment method as the default for a customer
 */
export async function setDefaultPaymentMethod(
  agencyId: string,
  paymentMethodId: string
): Promise<ActionResult> {
  try {
    // Get customer ID
    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      select: { customerId: true },
    })

    if (!agency?.customerId) {
      return { success: false, error: 'No customer found for this agency' }
    }

    // Update default payment method in Stripe
    await stripe.customers.update(agency.customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })

    revalidatePath(`/agency/${agencyId}/billing/payment-methods`)
    return { success: true, data: undefined }
  } catch (error) {
    console.error('Error setting default payment method:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to set default payment method' 
    }
  }
}

/**
 * Detach a payment method from a customer
 */
export async function removePaymentMethod(
  agencyId: string,
  paymentMethodId: string
): Promise<ActionResult> {
  try {
    // Get customer ID
    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      select: { customerId: true },
    })

    if (!agency?.customerId) {
      return { success: false, error: 'No customer found for this agency' }
    }

    // Detach payment method from customer
    await stripe.paymentMethods.detach(paymentMethodId)

    revalidatePath(`/agency/${agencyId}/billing/payment-methods`)
    return { success: true, data: undefined }
  } catch (error) {
    console.error('Error removing payment method:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to remove payment method' 
    }
  }
}

/**
 * Replace a payment method (navigate to checkout)
 * Returns the URL to redirect to
 */
export async function getReplaceCardUrl(): Promise<ActionResult<string>> {
  try {
    // For now, just return the pricing page URL
    // In the future, you might want to create a Stripe setup session
    return { 
      success: true, 
      data: '/site/pricing' 
    }
  } catch (error) {
    console.error('Error getting replace card URL:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get replacement URL' 
    }
  }
}
