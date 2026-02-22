import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { makeStripeIdempotencyKey } from '@/lib/stripe/idempotency';

/**
 * Gets an agency with its Stripe-related data.
 * Commonly used pattern across Stripe API routes.
 * 
 * @param agencyId - The agency ID
 * @returns Agency with Subscription and customerId, or null if not found
 */
export async function getAgencyWithStripeData(agencyId: string) {
  return db.agency.findUnique({
    where: { id: agencyId },
    include: { Subscription: true },
  });
}

/**
 * Gets or creates a Stripe customer for an agency.
 * If the agency doesn't have a customerId, creates one and updates the agency.
 * 
 * @param agency - Agency object with id, customerId, name, and companyEmail
 * @returns Stripe customer ID
 */
export async function getOrCreateAgencyStripeCustomer(agency: {
  id: string;
  customerId: string | null;
  name: string;
  companyEmail: string | null;
}): Promise<string> {
  if (agency.customerId) {
    return agency.customerId;
  }

  const idem = makeStripeIdempotencyKey('customer_create', ['agency', agency.id]);
  const customer = await stripe.customers.create(
    {
      email: agency.companyEmail || undefined,
      name: agency.name,
      metadata: { agencyId: agency.id },
    },
    { idempotencyKey: idem }
  );

  await db.agency.update({
    where: { id: agency.id },
    data: { customerId: customer.id },
  });

  return customer.id;
}
