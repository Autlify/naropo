import { StarterKit } from './types'

export const ecommerceStarterKit: StarterKit = {
  id: 'ecommerce-kit',
  name: 'E-commerce Starter Kit',
  description: 'Complete funnel for selling products online',
  thumbnail: '/assets/templates/kit-ecommerce.png',
  pages: [
    {
      name: 'Product Landing',
      pathName: 'landing',
      templateId: 'landing-hero',
    },
    {
      name: 'Checkout',
      pathName: 'checkout',
      templateId: 'checkout-premium',
    },
    {
      name: 'Thank You',
      pathName: 'thank-you',
      templateId: 'thankyou-nextsteps',
    },
  ],
}

export const saasStarterKit: StarterKit = {
  id: 'saas-kit',
  name: 'SaaS Starter Kit',
  description: 'Complete funnel for SaaS products with pricing',
  thumbnail: '/assets/templates/kit-saas.png',
  pages: [
    {
      name: 'Landing Page',
      pathName: 'landing',
      templateId: 'landing-hero',
    },
    {
      name: 'Pricing',
      pathName: 'pricing',
      templateId: 'pricing-tiers',
    },
    {
      name: 'Checkout',
      pathName: 'checkout',
      templateId: 'checkout-simple',
    },
    {
      name: 'Thank You',
      pathName: 'thank-you',
      templateId: 'thankyou-basic',
    },
  ],
}

export const leadGenStarterKit: StarterKit = {
  id: 'leadgen-kit',
  name: 'Lead Generation Kit',
  description: 'Simple funnel for collecting leads',
  thumbnail: '/assets/templates/kit-leadgen.png',
  pages: [
    {
      name: 'Landing Page',
      pathName: 'landing',
      templateId: 'landing-minimal',
    },
    {
      name: 'Thank You',
      pathName: 'thank-you',
      templateId: 'thankyou-basic',
    },
  ],
}

/**
 * Additional starter kits
 *
 * These kits intentionally reuse existing page templates to reduce drift:
 * - Faster onboarding for users
 * - Fewer templates to maintain
 * - Consistent rendering across editor updates
 */
export const webinarStarterKit: StarterKit = {
  id: 'webinar-kit',
  name: 'Webinar Registration Kit',
  description: 'Landing + checkout + confirmation for live events',
  thumbnail: '/assets/templates/kit-webinar.png',
  pages: [
    {
      name: 'Event Landing',
      pathName: 'landing',
      templateId: 'landing-hero',
    },
    {
      name: 'Registration Checkout',
      pathName: 'checkout',
      templateId: 'checkout-simple',
    },
    {
      name: 'You\'re In',
      pathName: 'thank-you',
      templateId: 'thankyou-nextsteps',
    },
  ],
}

export const consultingStarterKit: StarterKit = {
  id: 'consulting-kit',
  name: 'Service / Consulting Kit',
  description: 'Minimal landing + checkout for service packages',
  thumbnail: '/assets/templates/kit-consulting.png',
  pages: [
    {
      name: 'Service Landing',
      pathName: 'landing',
      templateId: 'landing-minimal',
    },
    {
      name: 'Checkout',
      pathName: 'checkout',
      templateId: 'checkout-premium',
    },
    {
      name: 'Next Steps',
      pathName: 'thank-you',
      templateId: 'thankyou-nextsteps',
    },
  ],
}

export const saasProStarterKit: StarterKit = {
  id: 'saas-pro-kit',
  name: 'SaaS Pro Kit',
  description: 'Landing + pricing + premium checkout + onboarding confirmation',
  thumbnail: '/assets/templates/kit-saas-pro.png',
  pages: [
    {
      name: 'Landing Page',
      pathName: 'landing',
      templateId: 'landing-hero',
    },
    {
      name: 'Pricing',
      pathName: 'pricing',
      templateId: 'pricing-tiers',
    },
    {
      name: 'Checkout',
      pathName: 'checkout',
      templateId: 'checkout-premium',
    },
    {
      name: 'Welcome',
      pathName: 'thank-you',
      templateId: 'thankyou-nextsteps',
    },
  ],
}

export const starterKits = [
  ecommerceStarterKit,
  saasStarterKit,
  saasProStarterKit,
  leadGenStarterKit,
  webinarStarterKit,
  consultingStarterKit,
]
