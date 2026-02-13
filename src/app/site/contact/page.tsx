import { Mail, MessageSquare, Github, Twitter } from 'lucide-react'

/**
 * Contact Page - Linear-inspired Design
 * 
 * Contact information and support channels
 */

export default function ContactPage() {
  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help from our support team",
      action: "support@autlify.com",
      href: "mailto:support@autlify.com"
    },
    {
      icon: MessageSquare,
      title: "Live Chat",
      description: "Chat with us in real-time",
      action: "Start a conversation",
      href: "#"
    },
    {
      icon: Github,
      title: "GitHub Discussions",
      description: "Community Q&A and feature requests",
      action: "Join the discussion",
      href: "#"
    },
    {
      icon: Twitter,
      title: "Twitter",
      description: "Follow us for updates",
      action: "@autlify",
      href: "#"
    }
  ]

  return (
    <div className="w-full min-h-screen relative overflow-hidden bg-bg-primary text-fg-primary">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--line-quaternary))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--line-quaternary))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40" aria-hidden="true" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,hsl(var(--accent-base))_0%,transparent_60%)] opacity-[0.08] blur-3xl" aria-hidden="true" />

      {/* Hero Section */}
      <section className="relative px-4 pt-16 sm:pt-28">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="h-12 md:h-16" aria-hidden="true" />

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold max-w-4xl mx-auto leading-[1.1] tracking-[-0.022em]">
            <span className="bg-gradient-to-b from-fg-primary via-fg-primary to-fg-secondary bg-clip-text text-transparent">
              Get in touch
            </span>
          </h1>

          <div className="h-6" aria-hidden="true" />

          <p className="text-lg md:text-xl text-fg-secondary max-w-2xl mx-auto leading-[1.6]">
            Have questions? We're here to help. Choose your preferred way to reach out.
          </p>
        </div>
      </section>

      <div className="h-20 md:h-28" aria-hidden="true" />

      {/* Contact Methods */}
      <section className="relative">
        <div className="mx-auto max-w-[1024px] px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2">
            {contactMethods.map((method, index) => (
              <a
                key={index}
                href={method.href}
                className="group relative flex items-start gap-5 rounded-xl border border-line-secondary bg-bg-secondary p-6 shadow-[var(--color-shadow-sm)] transition-all hover:border-accent-tint hover:bg-bg-tertiary hover:shadow-[var(--color-shadow-md)] hover:-translate-y-0.5"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent-base/[0.03] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />

                <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-accent-tint text-accent-base ring-1 ring-inset ring-accent-base/20">
                  <method.icon className="h-5 w-5" strokeWidth={2.5} />
                </div>

                <div className="relative flex-1">
                  <h3 className="text-lg font-semibold text-fg-primary mb-1">
                    {method.title}
                  </h3>
                  <p className="text-sm text-fg-tertiary mb-3">
                    {method.description}
                  </p>
                  <p className="text-sm font-medium text-accent-base group-hover:text-accent-hover transition-colors">
                    {method.action} →
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="h-32 md:h-48" aria-hidden="true" />

      {/* FAQ Section */}
      <section className="relative">
        <div className="mx-auto max-w-[800px] px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-fg-primary mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-fg-primary mb-2">
                What's your response time?
              </h3>
              <p className="text-fg-secondary leading-[1.6]">
                We typically respond to support emails within 24 hours on business days.
                Premium plan customers receive priority support with faster response times.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-fg-primary mb-2">
                Do you offer phone support?
              </h3>
              <p className="text-fg-secondary leading-[1.6]">
                Phone support is available for Enterprise plan customers. Contact your
                account manager for details.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-fg-primary mb-2">
                Can I schedule a demo?
              </h3>
              <p className="text-fg-secondary leading-[1.6]">
                Absolutely! Email us at support@autlify.com to schedule a personalized demo
                with our team.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="h-40 md:h-56" aria-hidden="true" />
    </div>
  )
}
