import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { makeStripeIdempotencyKey } from '@/lib/stripe/idempotency';

export type CustomerScope = 
  | { level: 'user'; userId: string }
  | { level: 'agency'; agencyId: string }
  | { level: 'subAccount'; agencyId: string; subAccountId: string };

/**
 * Gets or creates a Stripe customer for any scope (user, agency, or subaccount).
 * Handles all the logic for customer creation and database updates.
 * 
 * @param scope - The billing scope (user, agency, or subAccount)
 * @param userId - The user ID (used for metadata and user-level billing)
 * @param email - Optional email for customer creation
 * @param name - Optional name for customer creation
 * @returns Stripe customer ID
 * 
 * @example
 * // For agency-level billing
 * const customerId = await getOrCreateStripeCustomer(
 *   { level: 'agency', agencyId: 'agency_123' },
 *   session.user.id,
 *   session.user.email,
 *   session.user.name
 * );
 */
export async function getOrCreateStripeCustomer(
  scope: CustomerScope,
  userId: string,
  email?: string,
  name?: string
): Promise<string> {
  // Agency or SubAccount billing is tied to Agency.customerId
  if (scope.level === 'agency' || scope.level === 'subAccount') {
    const agencyId = scope.agencyId;
    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      select: { customerId: true, name: true, companyEmail: true },
    });

    if (agency?.customerId) {
      return agency.customerId;
    }

    if (!agency) {
      throw new Error(`Agency not found: ${agencyId}`);
    }

    const idem = makeStripeIdempotencyKey('customer_create', ['agency', agencyId]);

    const customer = await stripe.customers.create(
      {
        email: email || agency.companyEmail || undefined,
        name: name || agency.name,
        metadata: {
          userId,
          scopeLevel: scope.level,
          agencyId,
          ...(scope.level === 'subAccount' ? { subAccountId: scope.subAccountId } : {}),
        },
      },
      { idempotencyKey: idem }
    );

    await db.agency.update({
      where: { id: agencyId },
      data: { customerId: customer.id },
    });

    return customer.id;
  }

  // User-level billing
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { customerId: true, email: true, name: true },
  });

  if (user?.customerId) {
    return user.customerId;
  }

  if (!user) {
    throw new Error(`User not found: ${userId}`);
  }

  const idem = makeStripeIdempotencyKey('customer_create', ['user', userId]);
  const customer = await stripe.customers.create(
    {
      email: email ?? user.email ?? undefined,
      name: name ?? user.name ?? undefined,
      metadata: {
        userId,
        scopeLevel: 'user',
      },
    },
    { idempotencyKey: idem }
  );

  await db.user.update({
    where: { id: userId },
    data: { customerId: customer.id },
  });

  return customer.id;
}

/**
 * Helper to build scope metadata for Stripe objects.
 * 
 * @param userId - The user ID
 * @param scope - The billing scope
 * @returns Metadata object for Stripe
 */
export function buildScopeMetadata(
  userId: string,
  scope: CustomerScope
): Record<string, string> {
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
