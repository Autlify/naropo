import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { pricingCards } from '@/lib/constants'
import { stripe } from '@/lib/stripe'
import clsx from 'clsx'
import { Check, Sparkles, ChevronRight, Lock } from 'lucide-react'
import Link from 'next/link'
import Stripe from 'stripe'
import { getAuthUserDetails } from '@/lib/queries'
import { Separator } from '@/components/ui/separator'

const Pricing: React.FC = async () => {
  let prices: Stripe.ApiList<Stripe.Price> = {
    data: [],
    has_more: false,
    object: 'list',
    url: '',
  }

  if (process.env.NEXT_AUTLIFY_PRODUCT_ID) {
    prices = await stripe.prices.list({
      product: process.env.NEXT_AUTLIFY_PRODUCT_ID,
      active: true,
    })
  }

  const userDetails = await getAuthUserDetails()

  return (
    <section className="min-h-screen relative overflow-hidden">
      {/* Premium Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-400/30 to-cyan-400/30 blur-3xl dark:from-blue-500/20 dark:to-cyan-500/20" />
        <div className="absolute bottom-[-200px] right-[-200px] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-400/20 blur-3xl dark:from-cyan-500/15 dark:to-blue-500/15" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:80px_80px] opacity-[0.15] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_60%,transparent_100%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-20 sm:pb-24">
        {/* Breadcrumb */}
        <nav className="mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground">
            <li><Link href="/" className="hover:text-foreground transition-colors">Home</Link></li>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <li className="text-foreground font-medium">Pricing</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="text-center mb-16 sm:mb-20">
          {/* Badge */}
          {/* <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm mb-6" role="status">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>All plans include 14-day free trial</span>
          </div> */}
          
          <h1 className="font-bold tracking-tight text-4xl sm:text-5xl lg:text-6xl leading-[1.1]">
            Simple, Transparent
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-cyan-400 dark:to-blue-400">
              Pricing
            </span>
          </h1>
          
          <p className="mx-auto mt-6 max-w-3xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Choose the right plan for your agency. All plans include a 14-day free trial.
            <br className="hidden sm:block" />
            No credit card required to get started.
          </p>
        </div>

        <Separator className="mb-16 sm:mb-20" />

        {/* Pricing Cards */}
        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 mx-auto max-w-6xl">
          {prices.data.map((price) => {
            const cardInfo = pricingCards.find((c) => c.title === price.nickname)
            const isPopular = price.nickname === 'Advanced'

            const amount =
              price.unit_amount != null ? Math.round(price.unit_amount / 100) : 0
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
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-1.5 text-xs font-semibold text-white shadow-lg" role="status">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                      Most Popular
                    </span>
                  </div>
                )}

                <CardHeader className="px-6 pt-8 pb-6">
                  <CardTitle className="text-2xl font-bold">
                    {price.nickname}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mt-3 leading-relaxed">
                    {cardInfo?.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-6 py-6 space-y-6">
                  {/* Price */}
                  <div className="flex items-baseline gap-2">
                    <span className={clsx(
                      'text-5xl font-bold tracking-tight',
                      isPopular && 'bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-cyan-400'
                    )}>
                      RM {amount}
                    </span>
                    <span className="text-base text-muted-foreground font-medium">/{interval}</span>
                  </div>

                  <Separator className={clsx(
                    isPopular ? 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30' : ''
                  )} />

                  {/* Features */}
                  <ul className="space-y-3" role="list" aria-label="Plan features">
                    {cardInfo?.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500" aria-hidden="true">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm text-foreground leading-relaxed">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Trial Badge */}
                  {userDetails?.trialEligibled && cardInfo?.trialEnabled && (
                    <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-cyan-500/10 px-4 py-3 text-center" role="status">
                      <p className="text-sm font-medium text-primary flex items-center justify-center gap-2">
                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                        14-day free trial included
                      </p>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="px-6 pb-8 pt-4">
                  <Link
                    href={`/site/pricing/checkout/${price.id}`}
                    className={clsx(
                      'w-full text-center rounded-xl font-semibold text-base transition-all duration-200',
                      'h-12 inline-flex items-center justify-center gap-2',
                      'focus:outline-none focus:ring-2 focus:ring-offset-2',
                      isPopular
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 focus:ring-blue-500'
                        : 'bg-secondary hover:bg-secondary/80 text-foreground border-2 border-border hover:border-primary/50 focus:ring-primary'
                    )}
                    aria-label={`Get started with ${price.nickname} plan`}
                  >
                    Get Started
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* Enterprise Section */}
        <div className="mt-20 sm:mt-24 mx-auto max-w-4xl">
          <div className="rounded-3xl border border-border/50 bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm p-8 sm:p-12 text-center shadow-lg" role="complementary" aria-label="Enterprise plan information">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/20 mb-6" aria-hidden="true">
              <Lock className="h-8 w-8" />
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
              Need a custom plan?
            </h2>
            
            <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
              Looking for enterprise features, custom integrations, or dedicated support?
              Our team is here to help you build the perfect solution.
            </p>

            <Link
              href="/agency/sign-up"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Contact sales team"
            >
              Contact Sales
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-8">
              <Lock className="h-4 w-4" aria-hidden="true" />
              <span>Secure payment powered by Stripe</span>
            </div>
          </div>
        </div>

        {/* FAQ Teaser */}
        <div className="mt-20 sm:mt-24 text-center">
          <p className="text-sm text-muted-foreground">
            Have questions?{' '}
            <Link
              href="#faq"
              className="text-primary hover:underline font-semibold focus:outline-none focus:underline"
            >
              View our FAQ
            </Link>
            {' '}or{' '}
            <Link
              href="/contact"
              className="text-primary hover:underline font-semibold focus:outline-none focus:underline"
            >
              contact support
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default Pricing
