import { getPricingCards } from "@/lib/registry/plans/pricing-config";
import Link from "next/link";
import React from "react";
import { PricingSection } from "./_components/pricing-section";
import { auth } from '@/auth'
import { db } from '@/lib/db'

const Pricing: React.FC = async () => {
  // Get pricing cards from SSoT (pricing-config.ts)
  const monthlyCards = getPricingCards('month')
  const yearlyCards = getPricingCards('year')

  const session = await auth()
  const userId = session?.user?.id

  const user = userId
    ? await db.user.findUnique({
        where: { id: userId },
        select: {
          trialEligible: true,
          AgencyMemberships: {
            where: { isActive: true },
            select: {
              isPrimary: true,
              Agency: { select: { id: true, name: true } },
            },
            orderBy: [{ isPrimary: 'desc' }, { joinedAt: 'asc' }],
          },
        },
      })
    : null

  const agencies = user?.AgencyMemberships?.map((m) => ({
    id: m.Agency.id,
    name: m.Agency.name,
    isPrimary: m.isPrimary,
  }))

  return (
    <div className="w-full min-h-screen relative overflow-hidden">
      {/* Header Section */}
      <section className="relative px-4 pt-16">
        <div className="container mx-auto max-w-4xl text-center">
          {/* Top Spacing */}
          <div className="h-12 md:h-16" aria-hidden="true" />

          <h1 className="bg-gradient-to-b from-neutral-header to-neutral-fg-tertiary bg-clip-text text-transparent text-4xl md:text-5xl lg:text-6xl font-semibold max-w-4xl mx-auto text-center relative leading-[1.1] tracking-[-0.022em] pb-2">
            Pricing Plans
          </h1>
          <div className="h-6" aria-hidden="true" />
          <p className="text-md md:text-lg text-content-secondary max-w-3xl mx-auto leading-[1.6]">
            Choose the plan that best fits your needs and start enhancing your
            productivity today.
          </p>
        </div>
      </section>

      {/* Pricing Cards Section */}
      <section
        className="relative mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8 pb-24 sm:pb-40"
        aria-labelledby="pricing-heading"
      >
        <PricingSection
          monthlyCards={monthlyCards}
          yearlyCards={yearlyCards}
          user={user ? { trialEligible: user.trialEligible ?? false, agencies } : null}
        />
  

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
      </section>
      <section className="relative mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center pb-16">
        <p className="text-base text-content-secondary">
          Have questions?{" "}
          <Link
            href="#faq"
            className="text-brand-bg hover:text-brand-bg-hover font-medium transition-colors focus:outline-none focus:underline underline-offset-4"
          >
            View our FAQ
          </Link>
          {" "}or{" "}
          <Link
            href="/contact"
            className="text-brand-bg hover:text-brand-bg-hover font-medium transition-colors focus:outline-none focus:underline underline-offset-4"
          >
            contact support
          </Link>
        </p>
      </section>
    </div>
  );
};

export default Pricing;
