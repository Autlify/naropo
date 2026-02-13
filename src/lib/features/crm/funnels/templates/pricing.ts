import { FunnelTemplate } from './types'

export const pricingTiersTemplate: FunnelTemplate = {
  id: 'pricing-tiers',
  name: 'Pricing Tiers',
  description: 'Three-tier pricing page with comparison',
  category: 'pricing',
  thumbnail: '/assets/templates/pricing-tiers.png',
  elements: [
    {
      id: '__body',
      name: 'Body',
      type: '__body',
      styles: { backgroundColor: '#ffffff' },
      content: [
        {
          id: 'pricing-section',
          name: 'Pricing Section',
          type: 'section',
          styles: {
            padding: '80px 20px',
            minHeight: '100vh',
          },
          content: [
            {
              id: 'pricing-container',
              name: 'Container',
              type: 'container',
              styles: {
                maxWidth: '1200px',
                margin: '0 auto',
              },
              content: [
                {
                  id: 'pricing-header',
                  name: 'Header',
                  type: 'container',
                  styles: {
                    textAlign: 'center',
                    marginBottom: '64px',
                  },
                  content: [
                    {
                      id: 'pricing-title',
                      name: 'Title',
                      type: 'text',
                      styles: {
                        fontSize: '42px',
                        fontWeight: 'bold',
                        color: '#0f172a',
                        marginBottom: '16px',
                      },
                      content: { innerText: 'Simple, Transparent Pricing' },
                    },
                    {
                      id: 'pricing-subtitle',
                      name: 'Subtitle',
                      type: 'text',
                      styles: {
                        fontSize: '18px',
                        color: '#64748b',
                      },
                      content: { innerText: 'Choose the plan that works best for you' },
                    },
                  ],
                },
                {
                  id: 'pricing-grid',
                  name: '3 Column',
                  type: '3Col',
                  styles: {
                    display: 'flex',
                    gap: '24px',
                    alignItems: 'stretch',
                  },
                  content: [
                    {
                      id: 'tier-basic',
                      name: 'Basic Tier',
                      type: 'container',
                      styles: {
                        flex: '1',
                        backgroundColor: '#f8fafc',
                        borderRadius: '16px',
                        padding: '32px',
                        display: 'flex',
                        flexDirection: 'column',
                      },
                      content: [
                        {
                          id: 'basic-name',
                          name: 'Name',
                          type: 'text',
                          styles: { fontSize: '20px', fontWeight: '600', color: '#64748b', marginBottom: '16px' },
                          content: { innerText: 'Basic' },
                        },
                        {
                          id: 'basic-price',
                          name: 'Price',
                          type: 'text',
                          styles: { fontSize: '48px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' },
                          content: { innerText: '$9' },
                        },
                        {
                          id: 'basic-period',
                          name: 'Period',
                          type: 'text',
                          styles: { fontSize: '16px', color: '#64748b', marginBottom: '24px' },
                          content: { innerText: 'per month' },
                        },
                        {
                          id: 'basic-features',
                          name: 'Features',
                          type: 'container',
                          styles: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', flex: '1' },
                          content: [
                            { id: 'basic-f1', name: 'Feature', type: 'text', styles: { fontSize: '15px', color: '#475569' }, content: { innerText: '✓ 3 projects' } },
                            { id: 'basic-f2', name: 'Feature', type: 'text', styles: { fontSize: '15px', color: '#475569' }, content: { innerText: '✓ Basic analytics' } },
                            { id: 'basic-f3', name: 'Feature', type: 'text', styles: { fontSize: '15px', color: '#475569' }, content: { innerText: '✓ Email support' } },
                          ],
                        },
                        {
                          id: 'basic-cta',
                          name: 'CTA',
                          type: 'link',
                          styles: {
                            backgroundColor: '#e2e8f0',
                            color: '#0f172a',
                            padding: '14px 24px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            textDecoration: 'none',
                            textAlign: 'center',
                          },
                          content: { href: '#', innerText: 'Get Started' },
                        },
                      ],
                    },
                    {
                      id: 'tier-pro',
                      name: 'Pro Tier',
                      type: 'container',
                      styles: {
                        flex: '1',
                        backgroundColor: '#0f172a',
                        borderRadius: '16px',
                        padding: '32px',
                        display: 'flex',
                        flexDirection: 'column',
                        transform: 'scale(1.05)',
                      },
                      content: [
                        {
                          id: 'pro-badge',
                          name: 'Badge',
                          type: 'text',
                          styles: { fontSize: '12px', fontWeight: '600', color: '#3b82f6', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' },
                          content: { innerText: 'Most Popular' },
                        },
                        {
                          id: 'pro-name',
                          name: 'Name',
                          type: 'text',
                          styles: { fontSize: '20px', fontWeight: '600', color: '#94a3b8', marginBottom: '16px' },
                          content: { innerText: 'Professional' },
                        },
                        {
                          id: 'pro-price',
                          name: 'Price',
                          type: 'text',
                          styles: { fontSize: '48px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' },
                          content: { innerText: '$29' },
                        },
                        {
                          id: 'pro-period',
                          name: 'Period',
                          type: 'text',
                          styles: { fontSize: '16px', color: '#94a3b8', marginBottom: '24px' },
                          content: { innerText: 'per month' },
                        },
                        {
                          id: 'pro-features',
                          name: 'Features',
                          type: 'container',
                          styles: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', flex: '1' },
                          content: [
                            { id: 'pro-f1', name: 'Feature', type: 'text', styles: { fontSize: '15px', color: '#cbd5e1' }, content: { innerText: '✓ Unlimited projects' } },
                            { id: 'pro-f2', name: 'Feature', type: 'text', styles: { fontSize: '15px', color: '#cbd5e1' }, content: { innerText: '✓ Advanced analytics' } },
                            { id: 'pro-f3', name: 'Feature', type: 'text', styles: { fontSize: '15px', color: '#cbd5e1' }, content: { innerText: '✓ Priority support' } },
                            { id: 'pro-f4', name: 'Feature', type: 'text', styles: { fontSize: '15px', color: '#cbd5e1' }, content: { innerText: '✓ Custom domain' } },
                          ],
                        },
                        {
                          id: 'pro-cta',
                          name: 'CTA',
                          type: 'link',
                          styles: {
                            backgroundColor: '#3b82f6',
                            color: '#ffffff',
                            padding: '14px 24px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            textDecoration: 'none',
                            textAlign: 'center',
                          },
                          content: { href: '#', innerText: 'Get Started' },
                        },
                      ],
                    },
                    {
                      id: 'tier-enterprise',
                      name: 'Enterprise Tier',
                      type: 'container',
                      styles: {
                        flex: '1',
                        backgroundColor: '#f8fafc',
                        borderRadius: '16px',
                        padding: '32px',
                        display: 'flex',
                        flexDirection: 'column',
                      },
                      content: [
                        {
                          id: 'enterprise-name',
                          name: 'Name',
                          type: 'text',
                          styles: { fontSize: '20px', fontWeight: '600', color: '#64748b', marginBottom: '16px' },
                          content: { innerText: 'Enterprise' },
                        },
                        {
                          id: 'enterprise-price',
                          name: 'Price',
                          type: 'text',
                          styles: { fontSize: '48px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' },
                          content: { innerText: '$99' },
                        },
                        {
                          id: 'enterprise-period',
                          name: 'Period',
                          type: 'text',
                          styles: { fontSize: '16px', color: '#64748b', marginBottom: '24px' },
                          content: { innerText: 'per month' },
                        },
                        {
                          id: 'enterprise-features',
                          name: 'Features',
                          type: 'container',
                          styles: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', flex: '1' },
                          content: [
                            { id: 'ent-f1', name: 'Feature', type: 'text', styles: { fontSize: '15px', color: '#475569' }, content: { innerText: '✓ Everything in Pro' } },
                            { id: 'ent-f2', name: 'Feature', type: 'text', styles: { fontSize: '15px', color: '#475569' }, content: { innerText: '✓ SSO & SAML' } },
                            { id: 'ent-f3', name: 'Feature', type: 'text', styles: { fontSize: '15px', color: '#475569' }, content: { innerText: '✓ Dedicated support' } },
                            { id: 'ent-f4', name: 'Feature', type: 'text', styles: { fontSize: '15px', color: '#475569' }, content: { innerText: '✓ SLA guarantee' } },
                          ],
                        },
                        {
                          id: 'enterprise-cta',
                          name: 'CTA',
                          type: 'link',
                          styles: {
                            backgroundColor: '#e2e8f0',
                            color: '#0f172a',
                            padding: '14px 24px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            textDecoration: 'none',
                            textAlign: 'center',
                          },
                          content: { href: '#', innerText: 'Contact Sales' },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

export const pricingTemplates = [pricingTiersTemplate]
