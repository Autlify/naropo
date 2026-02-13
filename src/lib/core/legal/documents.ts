export type LegalScope = 'baseline' | 'billing'

export const LEGAL_DOCUMENTS = [
  {
    slug: 'terms-of-service',
    title: 'Terms of Service',
    scope: 'baseline' as const,
    file: 'terms-of-service.md',
  },
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    scope: 'baseline' as const,
    file: 'privacy-policy.md',
  },
  {
    slug: 'data-processing-agreement',
    title: 'Data Processing Agreement',
    scope: 'baseline' as const,
    file: 'data-processing-agreement.md',
  },
  {
    slug: 'cookie-policy',
    title: 'Cookie Policy',
    scope: 'baseline' as const,
    file: 'cookie-policy.md',
  },
  {
    slug: 'third-party-services',
    title: 'Third-Party Services Policy',
    scope: 'baseline' as const,
    file: 'third-party-services.md',
  },
  {
    slug: 'refund-policy',
    title: 'Refund Policy',
    scope: 'billing' as const,
    file: 'refund-policy.md',
  },
  {
    slug: 'retention-policy',
    title: 'Data Retention Policy',
    scope: 'billing' as const,
    file: 'retention-policy.md',
  },
] as const

export type LegalDoc = typeof LEGAL_DOCUMENTS[number]
export type LegalDocSlug = LegalDoc['slug']

const LEGAL_DOC_BY_SLUG = new Map<LegalDocSlug, LegalDoc>()
const LEGAL_DOC_SLUG_SET = new Set<LegalDocSlug>()
const BASELINE_DOC_SLUGS_INTERNAL: LegalDocSlug[] = []
const BILLING_DOC_SLUGS_INTERNAL: LegalDocSlug[] = []

for (const doc of LEGAL_DOCUMENTS as readonly LegalDoc[]) {
  LEGAL_DOC_BY_SLUG.set(doc.slug, doc)
  LEGAL_DOC_SLUG_SET.add(doc.slug)
  if (doc.scope === 'baseline') {
    BASELINE_DOC_SLUGS_INTERNAL.push(doc.slug)
  } else {
    BILLING_DOC_SLUGS_INTERNAL.push(doc.slug)
  }
}

export const BASELINE_DOC_SLUGS = BASELINE_DOC_SLUGS_INTERNAL
export const BILLING_DOC_SLUGS = BILLING_DOC_SLUGS_INTERNAL

export function isLegalDocSlug(input: string): input is LegalDocSlug {
  return LEGAL_DOC_SLUG_SET.has(input as LegalDocSlug)
}

export function getLegalDoc(slug: LegalDocSlug): LegalDoc {
  const doc = LEGAL_DOC_BY_SLUG.get(slug)
  if (!doc) throw new Error(`Unknown legal doc: ${slug}`)
  return doc
}
