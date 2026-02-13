import Link from 'next/link'
import { 
  Zap, 
  Shield, 
  Users, 
  LineChart, 
  Workflow, 
  Sparkles,
  ArrowRight,
  Check,
  GitBranch,
  Rocket,
  Target,
  Layers
} from 'lucide-react'

/**
 * Features Page - Linear-inspired Design
 * 
 * Showcases Autlify's key features with refined visual hierarchy,
 * semantic tokens, and premium interactions
 */

export default function FeaturesPage() {
  const features = [
    {
      icon: Zap,
      category: "PRODUCTIVITY",
      title: "Lightning-fast workflows",
      description: "Create tasks in seconds, navigate with keyboard shortcuts, and breeze through your work with an interface optimized for speed.",
      highlights: [
        "Keyboard-first navigation",
        "Quick actions everywhere",
        "Instant search across projects",
        "Smart command palette"
      ]
    },
    {
      icon: GitBranch,
      category: "COLLABORATION",
      title: "Built for teams",
      description: "Real-time collaboration that keeps everyone in sync. Discuss issues in context, share updates seamlessly, and maintain team alignment.",
      highlights: [
        "Real-time updates",
        "In-context discussions",
        "Team notifications",
        "Activity timeline"
      ]
    },
    {
      icon: LineChart,
      category: "INSIGHTS",
      title: "Data-driven decisions",
      description: "Gain visibility into team performance with comprehensive analytics. Track progress, identify bottlenecks, and optimize workflows.",
      highlights: [
        "Custom dashboards",
        "Performance metrics",
        "Progress tracking",
        "Burndown charts"
      ]
    },
    {
      icon: Shield,
      category: "SECURITY",
      title: "Enterprise-grade security",
      description: "Your data is protected with bank-level encryption, SOC 2 compliance, and granular permission controls.",
      highlights: [
        "End-to-end encryption",
        "SOC 2 certified",
        "Role-based access",
        "Audit logs"
      ]
    },
    {
      icon: Layers,
      category: "CUSTOMIZATION",
      title: "Tailored to your workflow",
      description: "Customize views, fields, and workflows to match exactly how your team works. No forced methodologies.",
      highlights: [
        "Custom fields",
        "Flexible views",
        "Workflow automation",
        "Template library"
      ]
    },
    {
      icon: Rocket,
      category: "INTEGRATIONS",
      title: "Connects with your stack",
      description: "Seamless integrations with the tools you already use. Keep your workflow unified across platforms.",
      highlights: [
        "GitHub sync",
        "Slack notifications",
        "API access",
        "Webhooks"
      ]
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

          <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-accent-base">
            <Sparkles className="h-3.5 w-3.5" />
            FEATURES
          </p>

          <div className="h-4" aria-hidden="true" />

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold max-w-4xl mx-auto leading-[1.1] tracking-[-0.022em]">
            <span className="bg-gradient-to-b from-fg-primary via-fg-primary to-fg-secondary bg-clip-text text-transparent">
              Everything you need to
              <br />
              build better products
            </span>
          </h1>

          <div className="h-6" aria-hidden="true" />

          <p className="text-lg md:text-xl text-fg-secondary max-w-2xl mx-auto leading-[1.6]">
            Autlify combines powerful project management with an intuitive interface.
            Built for teams that move fast and ship quality.
          </p>
        </div>
      </section>

      <div className="h-20 md:h-28" aria-hidden="true" />

      {/* Features Grid */}
      <section className="relative">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative flex flex-col gap-5 rounded-xl border border-line-secondary bg-bg-secondary p-6 shadow-[var(--color-shadow-sm)] transition-all hover:border-accent-tint hover:bg-bg-tertiary hover:shadow-[var(--color-shadow-md)] hover:-translate-y-0.5"
              >
                {/* Subtle gradient on hover */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent-base/[0.03] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />

                {/* Icon */}
                <div className="relative flex h-11 w-11 items-center justify-center rounded-lg bg-accent-tint text-accent-base ring-1 ring-inset ring-accent-base/20 group-hover:ring-accent-base/40 transition-all">
                  <feature.icon className="h-5 w-5" strokeWidth={2.5} />
                </div>

                {/* Content */}
                <div className="relative flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-accent-base mb-2">
                    {feature.category}
                  </p>
                  <h3 className="text-lg font-semibold text-fg-primary group-hover:text-accent-hover transition-colors mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-[1.5] text-fg-tertiary mb-5">
                    {feature.description}
                  </p>

                  {/* Feature highlights */}
                  <ul className="space-y-2">
                    {feature.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-fg-secondary">
                        <Check className="h-3.5 w-3.5 text-accent-base flex-shrink-0" strokeWidth={2.5} />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-32 md:h-48" aria-hidden="true" />

      {/* CTA Section */}
      <section className="relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,hsl(var(--accent-base))_0%,transparent_70%)] opacity-[0.06] blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
          <h2 className="text-4xl font-semibold leading-[1.1] tracking-[-0.022em] md:text-5xl">
            <span className="bg-gradient-to-b from-fg-primary to-fg-secondary bg-clip-text text-transparent">
              Ready to transform your workflow?
            </span>
          </h2>

          <div className="h-6" aria-hidden="true" />

          <p className="text-lg leading-[1.6] text-fg-secondary">
            Join thousands of teams building better products with Autlify.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/agency/sign-up"
              className="group relative inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[image:var(--color-button-primary-bg-gradient)] px-8 font-medium text-button-primary-text shadow-[0_1px_0_0_hsl(var(--line-primary)),0_0_20px_-8px_hsl(var(--accent-base))] transition-all hover:bg-[image:var(--color-button-primary-bg-gradient-hover)] hover:shadow-[0_1px_0_0_hsl(var(--line-primary)),0_0_28px_-4px_hsl(var(--accent-base))] active:scale-[0.98]"
            >
              Start building
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/pricing"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-button-secondary-bg border border-line-tertiary px-6 font-medium text-button-secondary-text shadow-sm transition-all hover:bg-button-secondary-bg-hover hover:border-accent-tint active:scale-[0.98]"
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>

      <div className="h-40 md:h-56" aria-hidden="true" />
    </div>
  )
}
