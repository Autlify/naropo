'use client'

import * as React from 'react'

import SubscriptionClient from '@/components/features/core/billing/subscription'
import PaymentClient from '@/components/features/core/billing/payments'
import PromotionalClient from '@/components/features/core/billing/promotional'
import UsageClient from '@/components/features/core/billing/usage'
import AddonClient from '@/components/features/core/billing/addons'
import { isBillingSection, type BillingSection } from '@/lib/features/org/billing/sections'
import type { BillingScope } from '@/types/billing'

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Section Renderer
// ============================================================================

/**
 * Renders the appropriate billing section based on URL segment.
 * Used by route: /billing/[section]
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
  }

  return null
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * Central billing client with URL-based section routing.
 *
 * - When no section is provided, defaults to subscription overview.
 * - Server routes should validate sections and fail-closed (notFound) for invalid sections.
 */
const BillingClient = ({ scope, scopeId, section, className }: BillingClientProps) => {
  const validSection: BillingSection = section && isBillingSection(section) ? section : 'subscription'

  return (
    <div className={className}>
      <BillingSectionRenderer scope={scope} scopeId={scopeId} section={validSection} />
    </div>
  )
}

export { BillingClient }
export default BillingClient
