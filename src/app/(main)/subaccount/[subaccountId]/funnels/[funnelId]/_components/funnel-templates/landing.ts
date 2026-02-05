import { FunnelTemplate } from './types'

export const landingHeroTemplate: FunnelTemplate = {
  id: 'landing-hero',
  name: 'Hero Landing Page',
  description: 'Clean hero section with features and CTA',
  category: 'landing',
  thumbnail: '/assets/templates/landing-hero.png',
  elements: [
    {
      id: '__body',
      name: 'Body',
      type: '__body',
      styles: { backgroundColor: '#ffffff' },
      content: [
        {
          id: 'hero-section',
          name: 'Hero Section',
          type: 'section',
          styles: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 20px',
            minHeight: '500px',
            backgroundColor: '#0f172a',
          },
          content: [
            {
              id: 'hero-container',
              name: 'Container',
              type: 'container',
              styles: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                maxWidth: '800px',
                gap: '24px',
                textAlign: 'center',
              },
              content: [
                {
                  id: 'hero-headline',
                  name: 'Headline',
                  type: 'text',
                  styles: {
                    fontSize: '48px',
                    fontWeight: 'bold',
                    color: '#ffffff',
                    lineHeight: '1.2',
                  },
                  content: { innerText: 'Build Something Amazing Today' },
                },
                {
                  id: 'hero-subheadline',
                  name: 'Subheadline',
                  type: 'text',
                  styles: {
                    fontSize: '20px',
                    color: '#94a3b8',
                    maxWidth: '600px',
                  },
                  content: { innerText: 'Launch your product with a beautiful landing page that converts visitors into customers.' },
                },
                {
                  id: 'hero-cta-container',
                  name: 'CTA Container',
                  type: 'container',
                  styles: {
                    display: 'flex',
                    gap: '16px',
                    marginTop: '16px',
                  },
                  content: [
                    {
                      id: 'hero-cta-primary',
                      name: 'Primary CTA',
                      type: 'link',
                      styles: {
                        backgroundColor: '#3b82f6',
                        color: '#ffffff',
                        padding: '16px 32px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        textDecoration: 'none',
                      },
                      content: { href: '#', innerText: 'Get Started Free' },
                    },
                    {
                      id: 'hero-cta-secondary',
                      name: 'Secondary CTA',
                      type: 'link',
                      styles: {
                        backgroundColor: 'transparent',
                        color: '#ffffff',
                        padding: '16px 32px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        border: '2px solid #475569',
                      },
                      content: { href: '#', innerText: 'Learn More' },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'features-section',
          name: 'Features Section',
          type: 'section',
          styles: {
            padding: '80px 20px',
            backgroundColor: '#ffffff',
          },
          content: [
            {
              id: 'features-container',
              name: 'Container',
              type: 'container',
              styles: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                maxWidth: '1200px',
                margin: '0 auto',
              },
              content: [
                {
                  id: 'features-title',
                  name: 'Title',
                  type: 'text',
                  styles: {
                    fontSize: '36px',
                    fontWeight: 'bold',
                    color: '#0f172a',
                    marginBottom: '48px',
                  },
                  content: { innerText: 'Everything You Need' },
                },
                {
                  id: 'features-grid',
                  name: '3 Column',
                  type: '3Col',
                  styles: {
                    display: 'flex',
                    gap: '32px',
                    width: '100%',
                  },
                  content: [
                    {
                      id: 'feature-1',
                      name: 'Feature 1',
                      type: 'container',
                      styles: {
                        flex: '1',
                        padding: '24px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '12px',
                        textAlign: 'center',
                      },
                      content: [
                        {
                          id: 'feature-1-title',
                          name: 'Title',
                          type: 'text',
                          styles: { fontSize: '20px', fontWeight: '600', color: '#0f172a', marginBottom: '12px' },
                          content: { innerText: 'Fast Performance' },
                        },
                        {
                          id: 'feature-1-desc',
                          name: 'Description',
                          type: 'text',
                          styles: { fontSize: '16px', color: '#64748b' },
                          content: { innerText: 'Optimized for speed and efficiency to deliver the best experience.' },
                        },
                      ],
                    },
                    {
                      id: 'feature-2',
                      name: 'Feature 2',
                      type: 'container',
                      styles: {
                        flex: '1',
                        padding: '24px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '12px',
                        textAlign: 'center',
                      },
                      content: [
                        {
                          id: 'feature-2-title',
                          name: 'Title',
                          type: 'text',
                          styles: { fontSize: '20px', fontWeight: '600', color: '#0f172a', marginBottom: '12px' },
                          content: { innerText: 'Easy to Use' },
                        },
                        {
                          id: 'feature-2-desc',
                          name: 'Description',
                          type: 'text',
                          styles: { fontSize: '16px', color: '#64748b' },
                          content: { innerText: 'Intuitive interface that anyone can master in minutes.' },
                        },
                      ],
                    },
                    {
                      id: 'feature-3',
                      name: 'Feature 3',
                      type: 'container',
                      styles: {
                        flex: '1',
                        padding: '24px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '12px',
                        textAlign: 'center',
                      },
                      content: [
                        {
                          id: 'feature-3-title',
                          name: 'Title',
                          type: 'text',
                          styles: { fontSize: '20px', fontWeight: '600', color: '#0f172a', marginBottom: '12px' },
                          content: { innerText: '24/7 Support' },
                        },
                        {
                          id: 'feature-3-desc',
                          name: 'Description',
                          type: 'text',
                          styles: { fontSize: '16px', color: '#64748b' },
                          content: { innerText: 'Our team is always here to help you succeed.' },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'cta-section',
          name: 'CTA Section',
          type: 'section',
          styles: {
            padding: '80px 20px',
            backgroundColor: '#3b82f6',
            textAlign: 'center',
          },
          content: [
            {
              id: 'cta-container',
              name: 'Container',
              type: 'container',
              styles: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '24px',
              },
              content: [
                {
                  id: 'cta-title',
                  name: 'Title',
                  type: 'text',
                  styles: { fontSize: '36px', fontWeight: 'bold', color: '#ffffff' },
                  content: { innerText: 'Ready to Get Started?' },
                },
                {
                  id: 'cta-subtitle',
                  name: 'Subtitle',
                  type: 'text',
                  styles: { fontSize: '18px', color: '#e0f2fe' },
                  content: { innerText: 'Join thousands of satisfied customers today.' },
                },
                {
                  id: 'cta-button',
                  name: 'CTA Button',
                  type: 'link',
                  styles: {
                    backgroundColor: '#ffffff',
                    color: '#3b82f6',
                    padding: '16px 48px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    fontSize: '18px',
                  },
                  content: { href: '#', innerText: 'Start Free Trial' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

export const landingMinimalTemplate: FunnelTemplate = {
  id: 'landing-minimal',
  name: 'Minimal Landing',
  description: 'Clean and minimal landing page with focus on conversion',
  category: 'landing',
  thumbnail: '/assets/templates/landing-minimal.png',
  elements: [
    {
      id: '__body',
      name: 'Body',
      type: '__body',
      styles: { backgroundColor: '#ffffff' },
      content: [
        {
          id: 'minimal-hero',
          name: 'Hero Section',
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
              id: 'minimal-container',
              name: 'Container',
              type: 'container',
              styles: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                maxWidth: '640px',
                gap: '32px',
              },
              content: [
                {
                  id: 'minimal-headline',
                  name: 'Headline',
                  type: 'text',
                  styles: {
                    fontSize: '56px',
                    fontWeight: 'bold',
                    color: '#0f172a',
                    lineHeight: '1.1',
                  },
                  content: { innerText: 'Simple. Powerful. Effective.' },
                },
                {
                  id: 'minimal-subheadline',
                  name: 'Subheadline',
                  type: 'text',
                  styles: {
                    fontSize: '20px',
                    color: '#64748b',
                    lineHeight: '1.6',
                  },
                  content: { innerText: 'Everything you need to grow your business, nothing you don\'t.' },
                },
                {
                  id: 'minimal-cta',
                  name: 'CTA',
                  type: 'link',
                  styles: {
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    padding: '18px 48px',
                    borderRadius: '100px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    fontSize: '16px',
                  },
                  content: { href: '#', innerText: 'Get Started →' },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

export const landingTemplates = [landingHeroTemplate, landingMinimalTemplate]
