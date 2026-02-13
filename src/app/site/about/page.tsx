import Link from 'next/link'
import { ArrowRight, Target, Heart, Zap } from 'lucide-react'

/**
 * About Page - Linear-inspired Design
 * 
 * Company mission, vision, and team introduction
 */

export default function AboutPage() {
  const values = [
    {
      icon: Target,
      title: "Relentless focus",
      description: "We believe in doing fewer things better. Every feature is carefully considered and refined."
    },
    {
      icon: Zap,
      title: "Move fast",
      description: "Speed is a feature. We ship quickly, iterate constantly, and maintain momentum."
    },
    {
      icon: Heart,
      title: "Craft matters",
      description: "Quality isn't negotiable. We sweat the details and take pride in our work."
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
              Building the tools for
              <br />
              modern agencies
            </span>
          </h1>

          <div className="h-6" aria-hidden="true" />

          <p className="text-lg md:text-xl text-fg-secondary max-w-2xl mx-auto leading-[1.6]">
            Autlify was created to solve a simple problem: existing project management
            tools are bloated, slow, and get in the way of actual work.
          </p>
        </div>
      </section>

      <div className="h-32 md:h-48" aria-hidden="true" />

      {/* Mission Section */}
      <section className="relative">
        <div className="mx-auto max-w-[800px] px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-fg-primary mb-6">Our mission</h2>
          <div className="space-y-6 text-lg leading-[1.6] text-fg-secondary">
            <p>
              We're building the tool we wished existed when we were running agencies ourselves.
              One that's fast, beautiful, and gets out of your way.
            </p>
            <p>
              Autlify is designed around three core principles: speed, simplicity, and quality.
              We believe software should feel effortless to use, not like another chore on your list.
            </p>
            <p>
              Every day, teams waste hours fighting with their tools instead of building great products.
              We're here to change that.
            </p>
          </div>
        </div>
      </section>

      <div className="h-32 md:h-48" aria-hidden="true" />

      {/* Values Section */}
      <section className="relative">
        <div className="mx-auto max-w-[1024px] px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-fg-primary mb-12 text-center">What we believe</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {values.map((value, index) => (
              <div
                key={index}
                className="group relative flex flex-col items-center text-center gap-5 rounded-xl border border-line-secondary bg-bg-secondary p-8 shadow-[var(--color-shadow-sm)] transition-all hover:border-accent-tint hover:bg-bg-tertiary hover:shadow-[var(--color-shadow-md)]"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-accent-base/[0.03] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />

                <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-accent-tint text-accent-base ring-1 ring-inset ring-accent-base/20">
                  <value.icon className="h-6 w-6" strokeWidth={2.5} />
                </div>

                <div className="relative">
                  <h3 className="text-xl font-semibold text-fg-primary mb-3">
                    {value.title}
                  </h3>
                  <p className="text-sm leading-[1.5] text-fg-tertiary">
                    {value.description}
                  </p>
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
              Join us on this journey
            </span>
          </h2>

          <div className="h-6" aria-hidden="true" />

          <p className="text-lg leading-[1.6] text-fg-secondary">
            We're just getting started. See what we're building.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/agency/sign-up"
              className="group relative inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[image:var(--color-button-primary-bg-gradient)] px-8 font-medium text-button-primary-text shadow-[0_1px_0_0_hsl(var(--line-primary)),0_0_20px_-8px_hsl(var(--accent-base))] transition-all hover:bg-[image:var(--color-button-primary-bg-gradient-hover)] hover:shadow-[0_1px_0_0_hsl(var(--line-primary)),0_0_28px_-4px_hsl(var(--accent-base))] active:scale-[0.98]"
            >
              Get started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/site/features"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-button-secondary-bg border border-line-tertiary px-6 font-medium text-button-secondary-text shadow-sm transition-all hover:bg-button-secondary-bg-hover hover:border-accent-tint active:scale-[0.98]"
            >
              Explore features
            </Link>
          </div>
        </div>
      </section>

      <div className="h-40 md:h-56" aria-hidden="true" />
    </div>
  )
}
