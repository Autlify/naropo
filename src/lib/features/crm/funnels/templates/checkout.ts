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

export const checkoutTwoStepTemplate: FunnelTemplate = {
  id: 'checkout-two-step',
  name: 'Two-Step Checkout',
  description: 'Modern stepper layout with order summary and payment form',
  category: 'checkout',
  thumbnail: '/assets/templates/checkout-two-step.png',
  elements: [
    {
      id: '__body',
      name: 'Body',
      type: '__body',
      styles: { backgroundColor: '#060912' },
      content: [
        {
          id: 'checkout-2step-section',
          name: 'Checkout Section',
          type: 'section',
          styles: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            minHeight: '100vh',
            padding: '72px 20px',
          },
          content: [
            {
              id: 'checkout-2step-container',
              name: 'Container',
              type: 'container',
              styles: {
                width: '100%',
                maxWidth: '1040px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              },
              content: [
                {
                  id: 'checkout-2step-header',
                  name: 'Header',
                  type: 'container',
                  styles: {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    alignItems: 'flex-start',
                  },
                  content: [
                    {
                      id: 'checkout-2step-title',
                      name: 'Title',
                      type: 'text',
                      styles: {
                        fontSize: '34px',
                        fontWeight: '700',
                        color: '#ffffff',
                        letterSpacing: '-0.02em',
                        lineHeight: '1.15',
                      },
                      content: { innerText: 'Checkout' },
                    },
                    {
                      id: 'checkout-2step-subtitle',
                      name: 'Subtitle',
                      type: 'text',
                      styles: {
                        fontSize: '16px',
                        color: '#94a3b8',
                        maxWidth: '640px',
                      },
                      content: { innerText: 'Complete your order in seconds. Your payment is processed securely.' },
                    },
                  ],
                },
                {
                  id: 'checkout-2step-card',
                  name: 'Card',
                  type: 'container',
                  styles: {
                    display: 'flex',
                    width: '100%',
                    borderRadius: '18px',
                    overflow: 'hidden',
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
                    backdropFilter: 'blur(16px)',
                  },
                  content: [
                    {
                      id: 'checkout-2step-2col',
                      name: '2 Column',
                      type: '2Col',
                      styles: {
                        display: 'flex',
                        width: '100%',
                      },
                      content: [
                        {
                          id: 'checkout-2step-summary',
                          name: 'Order Summary',
                          type: 'container',
                          styles: {
                            flex: '1',
                            padding: '28px',
                            backgroundColor: 'rgba(255,255,255,0.04)',
                          },
                          content: [
                            {
                              id: 'checkout-2step-summary-title',
                              name: 'Summary Title',
                              type: 'text',
                              styles: {
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#e2e8f0',
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                marginBottom: '18px',
                              },
                              content: { innerText: 'Order summary' },
                            },
                            {
                              id: 'checkout-2step-summary-card',
                              name: 'Summary Card',
                              type: 'container',
                              styles: {
                                padding: '18px',
                                borderRadius: '14px',
                                backgroundColor: 'rgba(0,0,0,0.25)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                              },
                              content: [
                                {
                                  id: 'checkout-2step-product',
                                  name: 'Product',
                                  type: 'text',
                                  styles: {
                                    fontSize: '18px',
                                    fontWeight: '700',
                                    color: '#ffffff',
                                  },
                                  content: { innerText: 'Premium Plan' },
                                },
                                {
                                  id: 'checkout-2step-price',
                                  name: 'Price',
                                  type: 'text',
                                  styles: {
                                    fontSize: '28px',
                                    fontWeight: '800',
                                    color: '#60a5fa',
                                    letterSpacing: '-0.02em',
                                  },
                                  content: { innerText: '$99 / month' },
                                },
                                {
                                  id: 'checkout-2step-summary-note',
                                  name: 'Note',
                                  type: 'text',
                                  styles: { fontSize: '14px', color: '#94a3b8' },
                                  content: { innerText: 'Cancel anytime. No hidden fees.' },
                                },
                              ],
                            },
                            {
                              id: 'checkout-2step-summary-trust',
                              name: 'Trust',
                              type: 'container',
                              styles: {
                                marginTop: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                              },
                              content: [
                                {
                                  id: 'checkout-2step-trust-1',
                                  name: 'Trust 1',
                                  type: 'text',
                                  styles: { fontSize: '13px', color: '#cbd5e1' },
                                  content: { innerText: '🔒 PCI-compliant payment processing' },
                                },
                                {
                                  id: 'checkout-2step-trust-2',
                                  name: 'Trust 2',
                                  type: 'text',
                                  styles: { fontSize: '13px', color: '#cbd5e1' },
                                  content: { innerText: '✓ 14-day money-back guarantee' },
                                },
                              ],
                            },
                          ],
                        },
                        {
                          id: 'checkout-2step-payment',
                          name: 'Payment',
                          type: 'container',
                          styles: {
                            flex: '1',
                            padding: '28px',
                            backgroundColor: 'rgba(255,255,255,0.02)',
                          },
                          content: [
                            {
                              id: 'checkout-2step-stepper',
                              name: 'Stepper',
                              type: 'container',
                              styles: {
                                display: 'flex',
                                gap: '10px',
                                alignItems: 'center',
                                marginBottom: '18px',
                              },
                              content: [
                                {
                                  id: 'checkout-2step-step-1',
                                  name: 'Step 1',
                                  type: 'text',
                                  styles: { fontSize: '13px', color: '#e2e8f0', fontWeight: '600' },
                                  content: { innerText: '1. Details' },
                                },
                                {
                                  id: 'checkout-2step-step-sep',
                                  name: 'Separator',
                                  type: 'text',
                                  styles: { fontSize: '13px', color: '#475569' },
                                  content: { innerText: '→' },
                                },
                                {
                                  id: 'checkout-2step-step-2',
                                  name: 'Step 2',
                                  type: 'text',
                                  styles: { fontSize: '13px', color: '#94a3b8', fontWeight: '600' },
                                  content: { innerText: '2. Payment' },
                                },
                              ],
                            },
                            {
                              id: 'checkout-2step-payment-title',
                              name: 'Payment Title',
                              type: 'text',
                              styles: {
                                fontSize: '22px',
                                fontWeight: '700',
                                color: '#ffffff',
                                marginBottom: '10px',
                                letterSpacing: '-0.01em',
                              },
                              content: { innerText: 'Payment details' },
                            },
                            {
                              id: 'checkout-2step-payment-subtitle',
                              name: 'Payment Subtitle',
                              type: 'text',
                              styles: { fontSize: '14px', color: '#94a3b8', marginBottom: '18px' },
                              content: { innerText: 'Use any major card. You can update payment methods later.' },
                            },
                            {
                              id: 'checkout-2step-payment-form',
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
    },
  ],
}

export const checkoutTemplates = [checkoutSimpleTemplate, checkoutPremiumTemplate, checkoutTwoStepTemplate]
