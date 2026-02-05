import { FunnelTemplate } from './types'

export const checkoutSimpleTemplate: FunnelTemplate = {
  id: 'checkout-simple',
  name: 'Simple Checkout',
  description: 'Clean checkout page with payment form',
  category: 'checkout',
  thumbnail: '/assets/templates/checkout-simple.png',
  elements: [
    {
      id: '__body',
      name: 'Body',
      type: '__body',
      styles: { backgroundColor: '#f8fafc' },
      content: [
        {
          id: 'checkout-section',
          name: 'Checkout Section',
          type: 'section',
          styles: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            minHeight: '100vh',
            padding: '60px 20px',
          },
          content: [
            {
              id: 'checkout-container',
              name: 'Container',
              type: 'container',
              styles: {
                display: 'flex',
                flexDirection: 'column',
                maxWidth: '500px',
                width: '100%',
                gap: '32px',
              },
              content: [
                {
                  id: 'checkout-header',
                  name: 'Header',
                  type: 'container',
                  styles: {
                    textAlign: 'center',
                  },
                  content: [
                    {
                      id: 'checkout-title',
                      name: 'Title',
                      type: 'text',
                      styles: {
                        fontSize: '32px',
                        fontWeight: 'bold',
                        color: '#0f172a',
                        marginBottom: '8px',
                      },
                      content: { innerText: 'Complete Your Purchase' },
                    },
                    {
                      id: 'checkout-subtitle',
                      name: 'Subtitle',
                      type: 'text',
                      styles: {
                        fontSize: '16px',
                        color: '#64748b',
                      },
                      content: { innerText: 'Secure checkout powered by Stripe' },
                    },
                  ],
                },
                {
                  id: 'checkout-form-container',
                  name: 'Form Container',
                  type: 'container',
                  styles: {
                    backgroundColor: '#ffffff',
                    padding: '32px',
                    borderRadius: '16px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  },
                  content: [
                    {
                      id: 'payment-form',
                      name: 'Payment Form',
                      type: 'paymentForm',
                      styles: {},
                      content: [],
                    },
                  ],
                },
                {
                  id: 'checkout-trust',
                  name: 'Trust Badges',
                  type: 'container',
                  styles: {
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '24px',
                    marginTop: '16px',
                  },
                  content: [
                    {
                      id: 'trust-text-1',
                      name: 'Secure',
                      type: 'text',
                      styles: { fontSize: '14px', color: '#64748b' },
                      content: { innerText: '🔒 Secure Payment' },
                    },
                    {
                      id: 'trust-text-2',
                      name: 'Guarantee',
                      type: 'text',
                      styles: { fontSize: '14px', color: '#64748b' },
                      content: { innerText: '✓ Money-back Guarantee' },
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

export const checkoutPremiumTemplate: FunnelTemplate = {
  id: 'checkout-premium',
  name: 'Premium Checkout',
  description: 'Two-column checkout with product showcase',
  category: 'checkout',
  thumbnail: '/assets/templates/checkout-premium.png',
  elements: [
    {
      id: '__body',
      name: 'Body',
      type: '__body',
      styles: { backgroundColor: '#ffffff' },
      content: [
        {
          id: 'checkout-premium-section',
          name: 'Checkout Section',
          type: 'section',
          styles: {
            display: 'flex',
            minHeight: '100vh',
          },
          content: [
            {
              id: 'checkout-2col',
              name: '2 Column Layout',
              type: '2Col',
              styles: {
                display: 'flex',
                width: '100%',
                minHeight: '100vh',
              },
              content: [
                {
                  id: 'product-side',
                  name: 'Product Side',
                  type: 'container',
                  styles: {
                    flex: '1',
                    backgroundColor: '#0f172a',
                    padding: '60px 40px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  },
                  content: [
                    {
                      id: 'product-content',
                      name: 'Product Content',
                      type: 'container',
                      styles: {
                        maxWidth: '400px',
                        margin: '0 auto',
                      },
                      content: [
                        {
                          id: 'product-title',
                          name: 'Title',
                          type: 'text',
                          styles: {
                            fontSize: '36px',
                            fontWeight: 'bold',
                            color: '#ffffff',
                            marginBottom: '16px',
                          },
                          content: { innerText: 'Premium Plan' },
                        },
                        {
                          id: 'product-price',
                          name: 'Price',
                          type: 'text',
                          styles: {
                            fontSize: '48px',
                            fontWeight: 'bold',
                            color: '#3b82f6',
                            marginBottom: '24px',
                          },
                          content: { innerText: '$99/month' },
                        },
                        {
                          id: 'product-features',
                          name: 'Features Container',
                          type: 'container',
                          styles: {
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                          },
                          content: [
                            {
                              id: 'feature-item-1',
                              name: 'Feature 1',
                              type: 'text',
                              styles: { fontSize: '16px', color: '#94a3b8' },
                              content: { innerText: '✓ Unlimited projects' },
                            },
                            {
                              id: 'feature-item-2',
                              name: 'Feature 2',
                              type: 'text',
                              styles: { fontSize: '16px', color: '#94a3b8' },
                              content: { innerText: '✓ Priority support' },
                            },
                            {
                              id: 'feature-item-3',
                              name: 'Feature 3',
                              type: 'text',
                              styles: { fontSize: '16px', color: '#94a3b8' },
                              content: { innerText: '✓ Advanced analytics' },
                            },
                            {
                              id: 'feature-item-4',
                              name: 'Feature 4',
                              type: 'text',
                              styles: { fontSize: '16px', color: '#94a3b8' },
                              content: { innerText: '✓ Custom integrations' },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  id: 'payment-side',
                  name: 'Payment Side',
                  type: 'container',
                  styles: {
                    flex: '1',
                    backgroundColor: '#ffffff',
                    padding: '60px 40px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  },
                  content: [
                    {
                      id: 'payment-content',
                      name: 'Payment Content',
                      type: 'container',
                      styles: {
                        maxWidth: '400px',
                        margin: '0 auto',
                        width: '100%',
                      },
                      content: [
                        {
                          id: 'payment-header',
                          name: 'Header',
                          type: 'text',
                          styles: {
                            fontSize: '24px',
                            fontWeight: 'bold',
                            color: '#0f172a',
                            marginBottom: '32px',
                          },
                          content: { innerText: 'Payment Details' },
                        },
                        {
                          id: 'payment-form-premium',
                          name: 'Payment Form',
                          type: 'paymentForm',
                          styles: {},
                          content: [],
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

export const checkoutTemplates = [checkoutSimpleTemplate, checkoutPremiumTemplate]
