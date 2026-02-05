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

export const starterKits = [ecommerceStarterKit, saasStarterKit, leadGenStarterKit]
