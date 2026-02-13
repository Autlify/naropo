import { FunnelTemplate } from './types'

export const thankyouBasicTemplate: FunnelTemplate = {
  id: 'thankyou-basic',
  name: 'Basic Thank You',
  description: 'Simple confirmation page with next steps',
  category: 'thankyou',
  thumbnail: '/assets/templates/thankyou-basic.png',
  elements: [
    {
      id: '__body',
      name: 'Body',
      type: '__body',
      styles: { backgroundColor: '#ffffff' },
      content: [
        {
          id: 'thankyou-section',
          name: 'Thank You Section',
          type: 'section',
          styles: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '40px 20px',
            textAlign: 'center',
          },
          content: [
            {
              id: 'thankyou-container',
              name: 'Container',
              type: 'container',
              styles: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                maxWidth: '600px',
                gap: '24px',
              },
              content: [
                {
                  id: 'thankyou-icon',
                  name: 'Success Icon',
                  type: 'text',
                  styles: {
                    fontSize: '80px',
                    marginBottom: '16px',
                  },
                  content: { innerText: '✓' },
                },
                {
                  id: 'thankyou-title',
                  name: 'Title',
                  type: 'text',
                  styles: {
                    fontSize: '42px',
                    fontWeight: 'bold',
                    color: '#0f172a',
                  },
                  content: { innerText: 'Thank You!' },
                },
                {
                  id: 'thankyou-message',
                  name: 'Message',
                  type: 'text',
                  styles: {
                    fontSize: '18px',
                    color: '#64748b',
                    lineHeight: '1.6',
                  },
                  content: { innerText: 'Your purchase was successful. We\'ve sent a confirmation email with all the details.' },
                },
                {
                  id: 'thankyou-cta',
                  name: 'CTA Button',
                  type: 'link',
                  styles: {
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    padding: '16px 32px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    marginTop: '16px',
                  },
                  content: { href: '#', innerText: 'Go to Dashboard' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

export const thankyouNextStepsTemplate: FunnelTemplate = {
  id: 'thankyou-nextsteps',
  name: 'Thank You with Next Steps',
  description: 'Confirmation page with guided next steps',
  category: 'thankyou',
  thumbnail: '/assets/templates/thankyou-nextsteps.png',
  elements: [
    {
      id: '__body',
      name: 'Body',
      type: '__body',
      styles: { backgroundColor: '#f8fafc' },
      content: [
        {
          id: 'thankyou-full-section',
          name: 'Thank You Section',
          type: 'section',
          styles: {
            padding: '80px 20px',
            minHeight: '100vh',
          },
          content: [
            {
              id: 'thankyou-content',
              name: 'Content Container',
              type: 'container',
              styles: {
                maxWidth: '800px',
                margin: '0 auto',
              },
              content: [
                {
                  id: 'thankyou-header-container',
                  name: 'Header',
                  type: 'container',
                  styles: {
                    textAlign: 'center',
                    marginBottom: '48px',
                  },
                  content: [
                    {
                      id: 'success-badge',
                      name: 'Success Badge',
                      type: 'container',
                      styles: {
                        display: 'inline-flex',
                        backgroundColor: '#dcfce7',
                        color: '#16a34a',
                        padding: '8px 16px',
                        borderRadius: '100px',
                        marginBottom: '24px',
                        fontWeight: '600',
                      },
                      content: [
                        {
                          id: 'badge-text',
                          name: 'Badge Text',
                          type: 'text',
                          styles: { fontSize: '14px' },
                          content: { innerText: '✓ Payment Successful' },
                        },
                      ],
                    },
                    {
                      id: 'main-title',
                      name: 'Title',
                      type: 'text',
                      styles: {
                        fontSize: '36px',
                        fontWeight: 'bold',
                        color: '#0f172a',
                        marginBottom: '16px',
                      },
                      content: { innerText: 'Welcome to the Team!' },
                    },
                    {
                      id: 'main-subtitle',
                      name: 'Subtitle',
                      type: 'text',
                      styles: {
                        fontSize: '18px',
                        color: '#64748b',
                      },
                      content: { innerText: 'Here\'s what to do next to get started' },
                    },
                  ],
                },
                {
                  id: 'steps-container',
                  name: 'Steps Container',
                  type: 'container',
                  styles: {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '24px',
                  },
                  content: [
                    {
                      id: 'step-1',
                      name: 'Step 1',
                      type: 'container',
                      styles: {
                        display: 'flex',
                        gap: '20px',
                        backgroundColor: '#ffffff',
                        padding: '24px',
                        borderRadius: '12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      },
                      content: [
                        {
                          id: 'step-1-number',
                          name: 'Number',
                          type: 'text',
                          styles: {
                            width: '40px',
                            height: '40px',
                            backgroundColor: '#3b82f6',
                            color: '#ffffff',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            flexShrink: '0',
                          },
                          content: { innerText: '1' },
                        },
                        {
                          id: 'step-1-content',
                          name: 'Content',
                          type: 'container',
                          styles: { flex: '1' },
                          content: [
                            {
                              id: 'step-1-title',
                              name: 'Title',
                              type: 'text',
                              styles: { fontSize: '18px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' },
                              content: { innerText: 'Check Your Email' },
                            },
                            {
                              id: 'step-1-desc',
                              name: 'Description',
                              type: 'text',
                              styles: { fontSize: '16px', color: '#64748b' },
                              content: { innerText: 'We\'ve sent you a welcome email with your login credentials.' },
                            },
                          ],
                        },
                      ],
                    },
                    {
                      id: 'step-2',
                      name: 'Step 2',
                      type: 'container',
                      styles: {
                        display: 'flex',
                        gap: '20px',
                        backgroundColor: '#ffffff',
                        padding: '24px',
                        borderRadius: '12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      },
                      content: [
                        {
                          id: 'step-2-number',
                          name: 'Number',
                          type: 'text',
                          styles: {
                            width: '40px',
                            height: '40px',
                            backgroundColor: '#3b82f6',
                            color: '#ffffff',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            flexShrink: '0',
                          },
                          content: { innerText: '2' },
                        },
                        {
                          id: 'step-2-content',
                          name: 'Content',
                          type: 'container',
                          styles: { flex: '1' },
                          content: [
                            {
                              id: 'step-2-title',
                              name: 'Title',
                              type: 'text',
                              styles: { fontSize: '18px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' },
                              content: { innerText: 'Complete Your Profile' },
                            },
                            {
                              id: 'step-2-desc',
                              name: 'Description',
                              type: 'text',
                              styles: { fontSize: '16px', color: '#64748b' },
                              content: { innerText: 'Add your information to personalize your experience.' },
                            },
                          ],
                        },
                      ],
                    },
                    {
                      id: 'step-3',
                      name: 'Step 3',
                      type: 'container',
                      styles: {
                        display: 'flex',
                        gap: '20px',
                        backgroundColor: '#ffffff',
                        padding: '24px',
                        borderRadius: '12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      },
                      content: [
                        {
                          id: 'step-3-number',
                          name: 'Number',
                          type: 'text',
                          styles: {
                            width: '40px',
                            height: '40px',
                            backgroundColor: '#3b82f6',
                            color: '#ffffff',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            flexShrink: '0',
                          },
                          content: { innerText: '3' },
                        },
                        {
                          id: 'step-3-content',
                          name: 'Content',
                          type: 'container',
                          styles: { flex: '1' },
                          content: [
                            {
                              id: 'step-3-title',
                              name: 'Title',
                              type: 'text',
                              styles: { fontSize: '18px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' },
                              content: { innerText: 'Start Creating' },
                            },
                            {
                              id: 'step-3-desc',
                              name: 'Description',
                              type: 'text',
                              styles: { fontSize: '16px', color: '#64748b' },
                              content: { innerText: 'Dive in and start building your first project.' },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  id: 'dashboard-cta',
                  name: 'Dashboard CTA',
                  type: 'container',
                  styles: {
                    textAlign: 'center',
                    marginTop: '48px',
                  },
                  content: [
                    {
                      id: 'dashboard-link',
                      name: 'Dashboard Link',
                      type: 'link',
                      styles: {
                        backgroundColor: '#0f172a',
                        color: '#ffffff',
                        padding: '18px 48px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        fontSize: '16px',
                        display: 'inline-block',
                      },
                      content: { href: '#', innerText: 'Go to Dashboard →' },
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

export const thankyouTemplates = [thankyouBasicTemplate, thankyouNextStepsTemplate]
