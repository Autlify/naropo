'use client'

import * as React from 'react'

import SubscriptionClient from '@/components/features/core/billing/subscription'
import PaymentClient from '@/components/features/core/billing/payments'
import PromotionalClient from '@/components/features/core/billing/promotional'
import UsageClient from '@/components/features/core/billing/usage'
import AddonClient from '@/components/features/core/billing/addons'
import type { BillingScope } from '@/types/billing'

// ============================================================================
// Types
// ============================================================================

type BillingSection = 'subscription' | 'payment-methods' | 'usage' | 'credits' | 'promotional' | 'addons' 

interface BillingClientProps {
  /** Scope type */
  scope: BillingScope
  /** Agency or SubAccount ID */
  scopeId: string
  /** Target section to render (from URL segment) */
  section?: string
  /** Additional CSS classes */
  className?: string
}

const VALID_SECTIONS: BillingSection[] = ['subscription', 'payment-methods', 'usage', 'credits', 'promotional', 'addons']

// ============================================================================
// Section Renderer
// ============================================================================

/**
 * Renders the appropriate billing section based on URL segment.
 * Used by catch-all route: /billing/[section]
 */
const BillingSectionRenderer = ({
  scope,
  scopeId,
  section,
}: {
  scope: BillingScope
  scopeId: string
  section: BillingSection
}) => {
  switch (section) {
    case 'subscription':
      return <SubscriptionClient scope={scope} scopeId={scopeId} />
    case 'payment-methods':
      return <PaymentClient scope={scope} scopeId={scopeId} showInvoices={true} showDunning={true} />  
    case 'usage':
      return <UsageClient scope={scope} scopeId={scopeId} />
    case 'credits':
    case 'promotional':
      return <PromotionalClient scope={scope} scopeId={scopeId} showCredits={true} showCoupons={true} />
    case 'addons':
      return <AddonClient scope={scope} scopeId={scopeId} />
    default:
      return <SubscriptionClient scope={scope} scopeId={scopeId} />
  }
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Central billing client with URL-based section routing.
 * 
 * Renders the appropriate section based on the `section` prop from catch-all route.
 * When no section is provided, defaults to subscription overview.
 * 
 * @example
 * // Catch-all route usage:
 * <BillingClient scope="agency" scopeId={agencyId} section="subscription" />
 * 
 * // Default (subscription overview):
 * <BillingClient scope="agency" scopeId={agencyId} />
 */
const BillingClient = ({
  scope,
  scopeId,
  section,
  className,
}: BillingClientProps) => {
  // Validate section and default to subscription
  const validSection = section && VALID_SECTIONS.includes(section as BillingSection)
    ? (section as BillingSection)
    : 'subscription'
  
  return (
    <div className={className}>
      <BillingSectionRenderer scope={scope} scopeId={scopeId} section={validSection} />
    </div>
  )
}

export { BillingClient }
export default BillingClient
