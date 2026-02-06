import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Zap, Shield, Users } from 'lucide-react'
import { SparklesCore } from '@/components/ui/sparkles'
import { BorderTrail } from '@/components/ui/border-trail'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

/**
 * Linear-inspired Home Page
 * 
 * Design Philosophy:
 * - Deep backgrounds with visual depth layers (bg-level-0, bg-level-1)
 * - Refined text hierarchy (fg-primary, fg-secondary, fg-tertiary)
 * - Whisper-quiet borders (line-primary, line-secondary)
 * - Strategic brand blue accent with gradients
 * - Typography with Linear's exact weights (300-680)
 * - Sophisticated shadows and subtle animations
 */

export default function Home() {
  return (
    <div className="min-w-full min-h-svh relative overflow-hidden bg-bg-primary text-fg-primary">

      {/* Premium: Subtle grid overlay for depth */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--line-quaternary))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--line-quaternary))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40" aria-hidden="true" />

      {/* Premium: Blue gradient spotlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,hsl(var(--accent-base))_0%,transparent_60%)] opacity-[0.08] blur-3xl" aria-hidden="true" />

      {/* Hero Section - Linear Mirror */}
      <section className="relative px-4 pt-16 sm:pt-28">
        <div className="container mx-auto relative mb-20 md:mb-32">

          {/* Top Spacing - Linear's generous padding */}
          <div className="h-20 md:h-28" aria-hidden="true" />

          <div className="flex flex-col items-start">

            {/* Hero Headline - Linear Typography */}
            <h1 className="max-w-6xl font-semibold leading-[1.1] tracking-[-0.022em]">
              <span className="block text-4xl md:text-5xl lg:text-6xl text-fg-primary">
                Autlify is a{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-accent-base via-accent-base to-accent-hover bg-clip-text text-transparent">
                    purpose-built tool
                  </span>
                  {/* Premium: Subtle glow effect */}
                  <span className="absolute inset-0 bg-gradient-to-r from-accent-base to-accent-hover blur-xl opacity-20" aria-hidden="true"></span>
                </span>
                {' '}for planning and building agencies
              </span>
            </h1>

            {/* Spacing - Linear's rhythm */}
            <div className="h-6" aria-hidden="true" />

            {/* Hero Description - Linear's text hierarchy */}
            <p className="max-w-2xl text-lg leading-[1.6] text-fg-secondary md:text-xl">
              Meet the system for modern agency development.{' '}
              <span className="text-fg-primary">
                Streamline clients, projects, and product roadmaps.
              </span>
            </p>

            {/* CTA Section - Linear buttons */}
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/agency/sign-up"
                className="btn-primary group relative inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[image:var(--color-button-primary-bg-gradient)] px-6 font-medium text-button-primary-text shadow-[0_1px_0_0_hsl(var(--line-primary)),0_0_20px_-8px_hsl(var(--accent-base))] transition-all hover:bg-[image:var(--color-button-primary-bg-gradient-hover)] hover:shadow-[0_1px_0_0_hsl(var(--line-primary)),0_0_24px_-6px_hsl(var(--accent-base))] active:scale-[0.98]"
              >
                Start building
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/pricing"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-button-secondary-bg border border-quaternary px-6 font-medium text-button-secondary-text shadow-sm transition-all hover:bg-button-secondary-bg-hover hover:border-accent-tint active:scale-[0.98]"
              >
                View pricing
              </Link>
            </div>
          </div>

          {/* Spacing before image */}
          <div className="h-20 md:h-28" aria-hidden="true" />
        </div>

        {/* Hero Image Section - Linear's refined presentation */}
        <div className="relative mx-auto max-w-[1400px] px-6 lg:px-8">
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border bg-gradient-to-b from-bg-level-1 to-bg-level-2 shadow-[var(--color-shadow-xl)]">
            {/* Premium: Blue rim glow */}
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-accent-base/20" aria-hidden="true"></div>

            {/* Actual app screenshot */}
            <Image
              src={'/assets/preview.png'}
              alt="banner image"
              height={1200}
              width={1200}
              className="w-full h-full object-cover object-top"
            />

            {/* 50% gradient overlay from bg to transparent */}
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-bg-primary to-transparent z-10"></div>

            {/* Premium mask gradient for high-end look */}
            <div
              className="absolute inset-0 z-10 pointer-events-none"
              style={{
                maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 40%, transparent 100%)',
                WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 40%, transparent 100%)'
              }}
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/40 via-transparent to-bg-primary"></div>
            </div>
          </div>
        </div>
      </section>
      {/* Spacer */}
      <div className="h-32 md:h-40" aria-hidden="true" />

      {/* Spacer */}
      <div className="h-32 md:h-40" aria-hidden="true" />

      {/* Customers/Social Proof Section - Linear style */}
      <section className="relative">
        <div className="mx-auto max-w-[1024px] px-6 lg:px-8">
          <p className="text-center text-xs font-medium uppercase tracking-[0.08em] text-fg-tertiary">
            <span className="hidden md:inline">Powering the world's best product teams. </span>
            From next-gen startups to established enterprises.
          </p>

          <div className="h-10" aria-hidden="true" />

          {/* Customer Logos Grid - Linear's refined cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {['OpenAI', 'Cash App', 'Scale', 'Ramp', 'Vercel', 'Coinbase'].map((company, i) => (
              <div
                key={i}
                className="group flex h-16 items-center justify-center rounded-lg border border-line-secondary bg-bg-secondary shadow-[var(--color-shadow-sm)] transition-all hover:border-accent-tint hover:bg-bg-tertiary hover:shadow-[var(--color-shadow-md)]"
              >
                <span className="text-xs font-medium text-fg-tertiary group-hover:text-fg-secondary transition-colors">
                  {company}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Spacer */}
      <div className="h-32 md:h-48" aria-hidden="true" />

      {/* Features Section - Linear's card design */}
      <section className="relative">
        <div className="mx-auto max-w-[1024px] px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-20">

            {/* Left: Feature Headline */}
            <div>
              <h2 className="text-4xl font-semibold leading-[1.1] tracking-[-0.022em] text-fg-primary md:text-5xl">
                Made for modern<br />product teams
              </h2>
              <div className="h-6" aria-hidden="true" />
              <p className="text-lg leading-[1.6] text-fg-secondary">
                Autlify is shaped by the practices and principles that distinguish world-class agency teams from the rest: relentless focus, fast execution, and a commitment to the quality of craft.
              </p>
            </div>

            {/* Right: Feature Cards - Linear style */}
            <div className="space-y-3">
              {[
                {
                  icon: Zap,
                  title: 'Purpose-built for agency development',
                  desc: 'Consolidate specs, milestones, tasks, and other documentation in one centralized location.',
                },
                {
                  icon: Shield,
                  title: 'Designed to move fast',
                  desc: 'Create tasks in seconds, discuss issues in context, and breeze through your work.',
                },
                {
                  icon: Users,
                  title: 'Crafted to perfection',
                  desc: 'Beautiful, minimal, and thoughtfully designed with care and precision.',
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="group relative flex gap-4 rounded-lg border border-line-secondary bg-bg-secondary p-5 shadow-[var(--color-shadow-sm)] transition-all hover:border-accent-tint hover:bg-bg-tertiary hover:shadow-[var(--color-shadow-md)] hover:-translate-y-px"
                >
                  {/* Premium: Subtle blue gradient on hover */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-accent-base/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true"></div>

                  {/* Icon */}
                  <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-accent-tint text-accent-base ring-1 ring-inset ring-accent-base/20 group-hover:ring-accent-base/40 transition-all">
                    <feature.icon className="h-4 w-4" strokeWidth={2.5} />
                  </div>

                  {/* Content */}
                  <div className="relative flex-1">
                    <h3 className="text-sm font-medium text-fg-primary group-hover:text-accent-hover transition-colors">
                      {feature.title}
                    </h3>
                    <div className="h-1.5" aria-hidden="true" />
                    <p className="text-sm leading-[1.5] text-fg-tertiary">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Spacer */}
      <div className="h-32 md:h-48" aria-hidden="true" />


      {/* Secondary Feature Section - Linear showcase */}
      <section className="relative items-center justify-center px-4 pt-16 sm:pt-28">
 

        <div className="mx-auto max-w-[1024px] px-6 lg:px-8">
          <div className="text-center">
            <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.08em] text-accent-base">
              <span className="inline-block h-px w-8 bg-gradient-to-r from-transparent to-accent-base"></span>
              Issue tracking
              <span className="inline-block h-px w-8 bg-gradient-to-l from-transparent to-accent-base"></span>
            </p>
            <div className="h-4" aria-hidden="true" />
            <h2 className="text-4xl font-semibold leading-[1.1] tracking-[-0.022em] md:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-b from-fg-primary via-fg-primary to-fg-secondary bg-clip-text text-transparent">
                Issue tracking<br />you'll enjoy using
              </span>
            </h2>
            <div className="h-6" aria-hidden="true" />
            <p className="mx-auto max-w-2xl text-lg leading-[1.6] text-fg-secondary">
              Optimized for speed and efficiency. Create tasks in seconds, discuss issues in context, and breeze through your work in views tailored to you and your team.
            </p>
          </div>

          <div className="h-20 md:h-28" aria-hidden="true" />

          <div className="grid gap-4 md:grid-cols-2">
            {[
              'Manage projects end-to-end',
              'Project updates',
              'Ideate and specify',
              'AI-assisted development'
            ].map((label, i) => (
              <div
                key={i}
                className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-line-secondary bg-bg-level-1 shadow-[var(--color-shadow-sm)] transition-all hover:border-accent-tint hover:shadow-[var(--color-shadow-md)]"
              >
                {/* Premium: Blue accent gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent-base/[0.03] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true"></div>

                <div className="relative flex h-full items-end p-6 bg-[image:var(--color-bg-tertiary-gradient)]">
                  <span className="text-sm font-medium text-fg-secondary group-hover:text-accent-hover transition-colors">
                    {label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* Spacer */}
      <div className="h-32 md:h-48" aria-hidden="true" />

      {/* CTA Section - Linear's final push */}
      <section className="relative">
        {/* Premium: Bottom blue gradient spotlight */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,hsl(var(--accent-base))_0%,transparent_70%)] opacity-[0.06] blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
          <h2 className="text-4xl font-semibold leading-[1.1] tracking-[-0.022em] md:text-5xl">
            <span className="bg-gradient-to-b from-fg-primary to-fg-secondary bg-clip-text text-transparent">
              Get started today
            </span>
          </h2>
          <div className="h-6" aria-hidden="true" />
          <p className="text-lg leading-[1.6] text-fg-secondary">
            Join thousands of teams building better products with our platform.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/agency/sign-up"
              className="group relative inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[image:var(--color-button-primary-bg-gradient)] px-8 font-medium text-button-primary-text shadow-[0_1px_0_0_hsl(var(--line-primary)),0_0_20px_-8px_hsl(var(--accent-base))] transition-all hover:bg-[image:var(--color-button-primary-bg-gradient-hover)] hover:shadow-[0_1px_0_0_hsl(var(--line-primary)),0_0_28px_-4px_hsl(var(--accent-base))] active:scale-[0.98]"
            >
              Start building
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom Spacer */}
      <div className="h-40 md:h-56" aria-hidden="true" />
    </div>
  )
}



{
  /**
   * Old Home Page
   */
}
// import Image from 'next/image'
// import Link from 'next/link'
// import Stripe from 'stripe'
// import clsx from 'clsx'
// import { Check, ArrowRight, Sparkles, Zap, Shield, Users } from 'lucide-react'

// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from '@/components/ui/card'
// import { Separator } from '@/components/ui/separator'
// import { pricingCards } from '@/lib/constants'
// import { stripe } from '@/lib/stripe'

// export default async function Home() {
//   let prices: Stripe.ApiList<Stripe.Price> = { data: [], has_more: false, object: 'list', url: '' }

//   // Only fetch prices if product ID is configured
//   if (process.env.NEXT_AUTLIFY_PRODUCT_ID) {
//     prices = await stripe.prices.list({
//       product: process.env.NEXT_AUTLIFY_PRODUCT_ID,
//       active: true,
//     })
//   }

//   return (
//     <div className="w-full min-h-screen relative overflow-hidden bg-background">
//       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.06),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(120,119,198,0.1),transparent_50%)]" aria-hidden="true" />
//       <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.015)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_85%)]" aria-hidden="true" />

//       {/* Hero Section */}


//       <section className="relative px-4 pt-16 sm:pt-28">
//         {/* Preview Image Container */}
//         <div className="container mx-auto relative mb-20 md:mb-32">
//           {/* Top border gradient line */}
//           <div className="absolute top-0 left-0 z-10 h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-700 to-transparent from-10% via-30% to-90%"></div>

//           <div className="bg-gradient-to-r from-primary to-secondary-foreground text-transparent bg-clip-text relative">
//             <h1 className="text-9xl font-bold text-center md:text-[300px]">
//               Autlify
//             </h1>
//           </div>
//           <div className="flex justify-center items-center relative md:mt-[-70px] w-full mx-auto mt-4 md:mt-0">
//             <Image
//               src={'/assets/preview.png'}
//               alt="banner image"
//               height={1200}
//               width={1200}
//               className="rounded-tl-2xl rounded-tr-2xl border-2 border-muted border-muted"
//             />
//             <div className="bottom-0 top-[50%] bg-gradient-to-t from-background via background to-transparent left-0 right-0 absolute z-10"></div>
//           </div>

//           {/* Bottom gradient fade - enhanced */}
//         </div>
//       </section>

//       {/**Hero Section - Version 1.0.0 */}
//       {/* <section className="relative flex items-center justify-center flex-col pt-32 md:pt-40 pb-16 md:pb-24 px-4">
//         <div className="bg-gradient-to-r from-primary to-secondary-foreground text-transparent bg-clip-text relative mb-8 md:mb-12">
//           <h1 className="text-7xl sm:text-8xl md:text-9xl lg:text-[200px] xl:text-[280px] font-bold text-center leading-none">
//             Autlify
//           </h1>
//         </div>

//         <div className="relative w-full max-w-7xl mx-auto mt-4 md:mt-0">
//           <div className="absolute top-0 left-0 z-10 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-700 to-transparent from-10% via-30% to-90%"></div>

//           <div className="relative rounded-xl md:rounded-2xl overflow-hidden border border-neutral-800 p-2">
//             <div className="h-full w-full overflow-hidden rounded-lg border border-neutral-800 bg-neutral-950">
//               <Image
//                 src={'/assets/preview.png'}
//                 alt="banner image"
//                 height={1200}
//                 width={1200}
//                 className="w-full h-auto object-cover"
//                 priority
//               />
//             </div>
//           </div>

//           <div className="absolute inset-x-0 -bottom-0 h-2/4 bg-gradient-to-t from-black to-transparent" aria-hidden="true"></div>
//         </div>
//       </section> */}


//       {/* Features Section */}
//       {/* <section className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 mt-16 md:mt-24 mb-20 md:mb-32"> */}
//         <section className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 mt-16 md:mt-24 mb-20 md:mb-32">
//         <div className="container mx-auto grid gap-8 md:grid-cols-3">
//           {[
//             { icon: Zap, title: 'Lightning Fast', description: 'Built for performance with optimized code and caching' },
//             { icon: Shield, title: 'Enterprise Security', description: 'Bank-level encryption and compliance with SOC 2' },
//             { icon: Users, title: 'Multi-Tenant', description: 'Manage unlimited agencies and subaccounts with ease' }
//           ].map((feature, index) => (
//             <Card key={index} className="border-2 border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md transition-shadow duration-200">
//               <CardHeader className="pb-0">
//                 <feature.icon className="h-10 w-10 text-primary mb-4" />
//                 <CardTitle className="text-lg font-semibold mb-2">{feature.title}</CardTitle>
//               </CardHeader>
//               <CardContent>
//                 <CardDescription className="text-neutral-700 dark:text-neutral-300">
//                   {feature.description}
//                 </CardDescription>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       </section>
//     </div>
//   )
// }
