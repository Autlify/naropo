import Image from 'next/image'
import Link from 'next/link'
import Stripe from 'stripe'
import clsx from 'clsx'
import { Check, ArrowRight, Sparkles, Zap, Shield, Users } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { pricingCards } from '@/lib/constants'
import { stripe } from '@/lib/stripe'

export default async function Home() {
  let prices: Stripe.ApiList<Stripe.Price> = { data: [], has_more: false, object: 'list', url: '' }

  // Only fetch prices if product ID is configured
  if (process.env.NEXT_AUTLIFY_PRODUCT_ID) {
    prices = await stripe.prices.list({
      product: process.env.NEXT_AUTLIFY_PRODUCT_ID,
      active: true,
    })
  }

  return (
    <div className="relative overflow-hidden">
      {/* Premium Background with Blue/Cyan Gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-400/30 to-cyan-400/30 blur-3xl dark:from-blue-500/20 dark:to-cyan-500/20" />
        <div className="absolute bottom-[-200px] right-[-200px] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-400/20 blur-3xl dark:from-cyan-500/15 dark:to-blue-500/15" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:80px_80px] opacity-[0.15] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_60%,transparent_100%)]" />
      </div>

      {/* Hero Section */}
           <section className="h-full w-full md:pt-44 mt-[-70px] relative flex items-center justify-center flex-col ">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          {/* <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm transition-all hover:bg-primary/10 hover:border-primary/30" role="status" aria-label="Product announcement">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Run your agency in one place</span>
            <span className="h-1 w-1 rounded-full bg-primary/60" aria-hidden="true" />
            <span>Multi-tenant by design</span>
          </div> */}

          {/* Headline */}
          <h1 className="mt-6 font-bold tracking-tight text-4xl sm:text-5xl lg:text-6xl">
            A modern operating
            <br className="hidden sm:block" />
            system for{' '}
            <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent dark:from-blue-600 dark:via-cyan-400 dark:to-blue-400 animate-gradient bg-[length:200%_auto]">
              agencies
            </span>
          </h1>

          {/* Description */}
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted-foreground">
            Autlify helps you manage multiple agencies, subaccounts, and services with a consistent
            permission model—then scale into modules like ERP, payouts, and marketplace services.
          </p>

          {/* CTA Buttons */}
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/site/pricing"
              className="group inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-8 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:shadow-blue-500/20 dark:hover:shadow-blue-500/30"
              aria-label="View pricing plans"
            >
              View pricing
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
            <Link
              href="/agency"
              className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-xl border-2 border-border bg-background/60 px-8 text-base font-semibold text-foreground backdrop-blur-sm transition-all hover:bg-background/80 hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Go to application"
            >
              Go to app
            </Link>
          </div>
        </div>

        {/* Preview Image */}
        <div className="relative mt-10 sm:mt-12 lg:mt-14">
          <Image
            src={'/assets/preview.png'} 
            alt="banner image"
            height={1200}
            width={1200}
            className="rounded-tl-2xl rounded-tr-2xl border-2 border-muted"
          />
          <div className="bottom-0 top-[50%] bg-gradient-to-t from-background to-transparent left-0 right-0 absolute z-10"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Zap, title: 'Lightning Fast', description: 'Built for performance with optimized code and caching' },
            { icon: Shield, title: 'Enterprise Security', description: 'Bank-level encryption and compliance with SOC 2' },
            { icon: Users, title: 'Multi-Tenant', description: 'Manage unlimited agencies and subaccounts with ease' }
          ].map((feature, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-background/80 to-background/40 p-8 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-blue-500/5"
              role="article"
              aria-labelledby={`feature-${index}-title`}
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/20" aria-hidden="true">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 id={`feature-${index}-title`} className="mt-6 text-xl font-semibold tracking-tight">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20" aria-labelledby="pricing-heading">
        <div className="flex flex-col items-center text-center">
          <h2 id="pricing-heading" className="text-3xl sm:text-4xl font-bold tracking-tight">
            Pricing that scales with you
          </h2>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
            Start small, upgrade as you add agencies, subaccounts, and modules.
          </p>
        </div>

        <Separator className="my-12" />

        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {prices.data.map((price) => {
            const cardInfo = pricingCards.find((c) => c.title === price.nickname)
            const isPopular = price.nickname === 'Advanced'
            const amount = price.unit_amount != null ? Math.round(price.unit_amount / 100) : 0
            const interval = price.recurring?.interval || 'month'

            return (
              <Card
                key={price.id}
                className={clsx(
                  'group relative flex flex-col justify-between backdrop-blur-sm transition-all duration-300',
                  'hover:-translate-y-1 hover:shadow-2xl',
                  isPopular
                    ? 'border-2 border-primary/40 shadow-xl shadow-blue-500/20 bg-gradient-to-br from-background/95 to-primary/5 dark:shadow-blue-500/10'
                    : 'border border-border/50 bg-gradient-to-br from-background/80 to-background/40 hover:border-primary/30'
                )}
                role="article"
                aria-label={`${price.nickname} pricing plan`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-1 text-xs font-semibold text-white shadow-lg" role="status">
                      <Sparkles className="h-3 w-3" aria-hidden="true" />
                      Most Popular
                    </span>
                  </div>
                )}

                <CardHeader className="px-6 pt-6 pb-5">
                  <CardTitle className="text-xl font-bold">{price.nickname}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mt-2">
                    {cardInfo?.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-6 py-5 space-y-6">
                  <div className="flex items-baseline gap-2">
                    <span className={clsx(
                      "text-4xl font-bold tracking-tight",
                      isPopular && "bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-400"
                    )}>
                      RM {amount}
                    </span>
                    <span className="text-sm text-muted-foreground font-medium">/{interval}</span>
                  </div>

                  <Separator className={clsx(
                    isPopular ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20" : ""
                  )} />

                  <ul className="space-y-3" role="list" aria-label="Plan features">
                    {cardInfo?.features?.slice(0, 5).map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500" aria-hidden="true">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm text-foreground leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="px-6 pb-6 pt-4">
                  <Link
                    href={`/site/pricing/checkout/${price.id}`}
                    className={clsx(
                      'w-full text-center rounded-xl font-semibold text-sm transition-all duration-200',
                      'h-12 inline-flex items-center justify-center',
                      'focus:outline-none focus:ring-2 focus:ring-offset-2',
                      isPopular
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 focus:ring-blue-500'
                        : 'bg-secondary hover:bg-secondary/80 text-foreground border-2 border-border hover:border-primary/50 focus:ring-primary'
                    )}
                    aria-label={`Get started with ${price.nickname} plan`}
                  >
                    Get started
                  </Link>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        <div className="mt-14 flex justify-center">
          <Link
            href="/site/pricing"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-primary hover:gap-3 transition-all focus:outline-none focus:underline"
            aria-label="View detailed pricing comparison"
          >
            Compare plans in detail
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  )
}
