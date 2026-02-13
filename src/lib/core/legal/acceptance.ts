import 'server-only'

import { db } from '@/lib/db'
import { BASELINE_DOC_SLUGS, BILLING_DOC_SLUGS, type LegalScope } from '@/lib/core/legal/documents'

// Bump this when you materially update the legal docs.
export const LEGAL_ACCEPTANCE_VERSION = '2026-02-09'

type LegalAcceptanceMeta = {
  ipAddress?: string
  userAgent?: string
}

const BASELINE_TERMS_FIELDS = (now: Date) => ({
  agreedToThirdPartyServices: true,
  thirdPartyServicesAgreedAt: now,
  consentToCookies: true,
  cookiesConsentAt: now,
  agreedToServiceTerms: true,
  serviceTermsAgreedAt: now,
  agreedToPrivacy: true,
  privacyAgreedAt: now,
  agreedToDataProcessing: true,
  dataProcessingAgreedAt: now,
  // Keep legacy combined flag aligned for compatibility.
  agreedToTermsConditions: true,
  termsConditionsAgreedAt: now,
})

const BILLING_TERMS_FIELDS = (now: Date) => ({
  agreedToRefundPolicy: true,
  refundPolicyAgreedAt: now,
  agreedToRetentionPolicy: true,
  andRetentionPolicyAgreedAt: now,
})

const BASELINE_ACCEPTANCE_DOCS = [...BASELINE_DOC_SLUGS]
const BILLING_ACCEPTANCE_DOCS = [...BASELINE_DOC_SLUGS, ...BILLING_DOC_SLUGS]

export async function upsertBaselineTermsAcceptance(userId: string) {
  const now = new Date()
  const baselineFields = BASELINE_TERMS_FIELDS(now)
  return db.termsAgreement.upsert({
    where: { userId },
    create: {
      userId,
      ...baselineFields,
    },
    update: baselineFields,
  })
}

export async function upsertBillingTermsAcceptance(userId: string) {
  const now = new Date()
  // Billing implies baseline too. Keep this in a single upsert to reduce DB roundtrips.
  const mergedFields = {
    ...BASELINE_TERMS_FIELDS(now),
    ...BILLING_TERMS_FIELDS(now),
  }

  return db.termsAgreement.upsert({
    where: { userId },
    create: {
      userId,
      ...mergedFields,
    },
    update: mergedFields,
  })
}

export async function recordLegalAcceptance(
  userId: string,
  scope: LegalScope,
  meta: LegalAcceptanceMeta = {}
) {
  const documents = scope === 'billing' ? BILLING_ACCEPTANCE_DOCS : BASELINE_ACCEPTANCE_DOCS

  return db.legalAcceptance.create({
    data: {
      userId,
      scope,
      version: LEGAL_ACCEPTANCE_VERSION,
      documents,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    },
  })
}
