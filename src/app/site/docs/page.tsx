import DocsLayout from '@/components/site/docs/docs-layout'
import Link from 'next/link'
import { Zap, Shield, Lock, Code2, ArrowRight } from 'lucide-react'

/**
 * Documentation Home - Linear-inspired Design
 * 
 * Main entry point for documentation with overview and quick links
 */

export default function DocsPage() {
  // Table of contents for right sidebar
  const tableOfContents = [
    { title: "What is Autlify?", id: "what-is-autlify", level: 2 },
    { title: "Key Features", id: "key-features", level: 2 },
    { title: "Quick Start", id: "quick-start", level: 2 },
    { title: "Popular Guides", id: "popular-guides", level: 2 },
  ]
  const features = [
    {
      icon: Zap,
      title: "Fast & Intuitive",
      description: "Built for speed with keyboard-first navigation and instant search."
    },
    {
      icon: Shield,
      title: "Enterprise-Ready",
      description: "Role-based access control, audit logs, and SOC 2 compliance."
    },
    {
      icon: Lock,
      title: "Secure by Default",
      description: "End-to-end encryption and advanced security features built-in."
    },
    {
      icon: Code2,
      title: "Developer-Friendly",
      description: "Comprehensive API, webhooks, and integrations with your favorite tools."
    }
  ]

  const popularGuides = [
    { title: "Quick Start Guide", href: "/site/docs/getting-started/quick-start", time: "5 min" },
    { title: "Billing SDK Components", href: "/site/docs/billing-sdk", time: "8 min" },
    { title: "Creating Your First Project", href: "/site/docs/guides/first-project", time: "10 min" },
    { title: "Setting Up Team Permissions", href: "/site/docs/concepts/teams", time: "8 min" },
    { title: "API Authentication", href: "/site/docs/api/authentication", time: "12 min" },
  ]

  return (
    <DocsLayout tableOfContents={tableOfContents}>
      {/* Introduction */}
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <h1 id="introduction" className="text-4xl font-semibold tracking-tight text-fg-primary mb-4">
          Introduction
        </h1>
        <p className="text-lg text-fg-secondary leading-relaxed mb-8">
          Welcome to the Autlify documentation. Learn how to build better workflows,
          manage projects efficiently, and collaborate with your team.
        </p>

        {/* What is Autlify */}
        <h2 id="what-is-autlify" className="text-2xl font-semibold text-fg-primary mt-12 mb-4">
          What is Autlify?
        </h2>
        <p className="text-fg-secondary leading-relaxed mb-6">
          Autlify is a modern project management platform designed for high-performing teams.
          Built with speed and simplicity in mind, it helps you track work, manage workflows,
          and collaborate seamlessly—all in one place.
        </p>

        {/* Key Features */}
        <h2 id="key-features" className="text-2xl font-semibold text-fg-primary mt-12 mb-6">
          Key Features
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 not-prose mb-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-lg border border-line-secondary bg-bg-secondary p-5 hover:border-accent-tint transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-tint text-accent-base mb-3">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-fg-primary mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-fg-tertiary leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Quick Start */}
        <h2 id="quick-start" className="text-2xl font-semibold text-fg-primary mt-12 mb-4">
          Quick Start
        </h2>
        <p className="text-fg-secondary leading-relaxed mb-6">
          Get started with Autlify in just a few minutes. Follow our quick start guide
          to create your first project and invite your team.
        </p>
        <div className="not-prose rounded-lg border border-line-secondary bg-bg-secondary p-6 mb-12">
          <ol className="space-y-4">
            <li className="flex gap-4">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent-tint text-xs font-semibold text-accent-base">
                1
              </span>
              <div>
                <div className="font-medium text-fg-primary mb-1">Create an account</div>
                <div className="text-sm text-fg-tertiary">
                  Sign up for free at{' '}
                  <Link href="/site/pricing" className="text-accent-base hover:text-accent-hover">
                    autlify.com
                  </Link>
                </div>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent-tint text-xs font-semibold text-accent-base">
                2
              </span>
              <div>
                <div className="font-medium text-fg-primary mb-1">Create your first project</div>
                <div className="text-sm text-fg-tertiary">
                  Use a template or start from scratch
                </div>
              </div>
            </li>
            <li className="flex gap-4">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent-tint text-xs font-semibold text-accent-base">
                3
              </span>
              <div>
                <div className="font-medium text-fg-primary mb-1">Invite your team</div>
                <div className="text-sm text-fg-tertiary">
                  Collaborate with teammates and set permissions
                </div>
              </div>
            </li>
          </ol>
        </div>

        {/* Popular Guides */}
        <h2 id="popular-guides" className="text-2xl font-semibold text-fg-primary mt-12 mb-4">
          Popular Guides
        </h2>
        <div className="not-prose space-y-3 mb-12">
          {popularGuides.map((guide, index) => (
            <Link
              key={index}
              href={guide.href}
              className="flex items-center justify-between rounded-lg border border-line-secondary bg-bg-secondary p-4 hover:border-accent-tint hover:bg-bg-tertiary transition-all group"
            >
              <span className="text-sm font-medium text-fg-secondary group-hover:text-fg-primary">
                {guide.title}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-fg-tertiary">{guide.time}</span>
                <ArrowRight className="h-4 w-4 text-fg-tertiary group-hover:text-accent-base transition-all group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>

        {/* Help Section */}
        <div className="not-prose mt-16 rounded-xl border border-line-secondary bg-gradient-to-br from-accent-base/5 via-bg-secondary to-bg-secondary p-8 text-center">
          <h3 className="text-xl font-semibold text-fg-primary mb-2">
            Need help?
          </h3>
          <p className="text-fg-secondary mb-6">
            Can't find what you're looking for? We're here to help.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/site/contact"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[image:var(--color-button-primary-bg-gradient)] px-6 text-sm font-medium text-button-primary-text shadow-sm transition-all hover:bg-[image:var(--color-button-primary-bg-gradient-hover)] active:scale-[0.98]"
            >
              Contact Support
            </Link>
            <Link
              href="https://github.com/autlify/autlify"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line-tertiary bg-button-secondary-bg px-6 text-sm font-medium text-button-secondary-text transition-all hover:bg-button-secondary-bg-hover hover:border-accent-tint active:scale-[0.98]"
            >
              GitHub Discussions
            </Link>
          </div>
        </div>
      </div>
    </DocsLayout>
  )
}
