/**
 * Billing Sections (SSoT)
 *
 * - Keep this list as the single source of truth for valid billing sections.
 * - Server routes SHOULD fail-closed (notFound) when section is invalid.
 * - Client code may still default to 'subscription' when the section is omitted.
 */

export const BILLING_SECTIONS = [
  'subscription',
  'payment-methods',
  'usage',
  'credits',
  'promotional',
  'addons',
] as const

export type BillingSection = (typeof BILLING_SECTIONS)[number]

export function isBillingSection(section: string): section is BillingSection {
  return (BILLING_SECTIONS as readonly string[]).includes(section)
}
