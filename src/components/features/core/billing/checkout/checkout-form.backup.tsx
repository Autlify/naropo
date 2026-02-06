'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { v4 as uuid } from 'uuid'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { City, Country, State } from 'country-state-city'
import { Check, ChevronLeft, CreditCard, Loader2, Plus, Tag, X, Coins, Package, Zap } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { MultiStepLoader } from '@/components/ui/multi-step-loader'
import { SavedBankCardsGallery } from '@/components/ui/bank-card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  CitySelector,
  CountrySelector,
  PhoneCodeSelector,
  PostalCodeInput,
  StateSelector,
} from '@/components/global/location'
import { cn } from '@/lib/utils'
import { checkoutFormSchema, type CheckoutFormData } from '@/lib/schemas/checkout'
import type {
  CheckoutProps,
  CheckoutStep,
  CheckoutType,
  CheckoutItem,
  AddonCardData,
  CheckoutResult,
} from '@/types/billing'
import { getActiveCheckoutSteps } from '@/types/billing'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// ============================================================================
// CHECKOUT STEP INDICATORS
// ============================================================================

interface StepIndicatorProps {
  steps: { id: CheckoutStep; label: string; description: string }[]
  currentStep: CheckoutStep
  completedSteps: Set<CheckoutStep>
  onStepClick: (step: CheckoutStep) => void
}

function StepIndicator({ steps, currentStep, completedSteps, onStepClick }: StepIndicatorProps) {
  const currentStepIndex = steps.findIndex((s) => s.id === currentStep)

  return (
    <div className="relative bg-card backdrop-blur-sm rounded-2xl p-2 sm:p-4 shadow-[0_8px_30px_hsl(var(--shadow-lg))] border border-border">
      {/* Progress Lines */}
      <div className="absolute top-[calc(1.5rem+16px)] left-[8%] right-[8%] flex items-center z-0">
        {steps.slice(0, -1).map((step, index) => (
          <div key={`line-${index}`} className="h-1 bg-border rounded-full flex-1">
            <div
              className={cn(
                'h-1 rounded-full transition-all duration-500',
                completedSteps.has(step.id) ? 'bg-gradient-to-r from-blue-500 to-blue-600 w-full' : 'w-0'
              )}
            />
          </div>
        ))}
      </div>

      {/* Step Circles */}
      <div className="flex justify-between relative z-10">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id)
          const isCurrent = currentStep === step.id
          const isAccessible = index <= currentStepIndex || isCompleted

          return (
            <div key={step.id} className="flex flex-col items-center">
              <button
                onClick={() => isAccessible && onStepClick(step.id)}
                disabled={!isAccessible}
                className="flex flex-col items-center group cursor-pointer disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
              >
                <div
                  className={cn(
                    'w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-1 transition-all duration-500 bg-card',
                    isCompleted
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_8px_20px_rgba(59,130,246,0.3)]'
                      : isCurrent
                        ? 'bg-gradient-to-br from-primary via-blue-500 to-cyan-500 text-white shadow-[0_10px_30px_rgba(59,130,246,0.4)] scale-110'
                        : 'bg-gradient-to-br from-muted to-muted-foreground/10 text-muted-foreground shadow-sm'
                  )}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : <span className="text-base font-semibold">{index + 1}</span>}
                </div>
                <div className="text-center">
                  <div
                    className={cn(
                      'text-sm font-medium transition-colors',
                      isCurrent ? 'text-blue-600' : isCompleted ? 'text-blue-500' : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </div>
                  <div className="text-xs text-muted-foreground hidden sm:block mt-0.5">{step.description}</div>
                </div>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// CHECKOUT TYPE HEADER
// ============================================================================

function CheckoutHeader({ type, item }: { type: CheckoutType; item: CheckoutItem }) {
  const config = {
    plan: { icon: Package, title: 'Complete Your Subscription', gradient: 'from-blue-500 to-purple-500' },
    addon: { icon: Zap, title: 'Add Enhancement', gradient: 'from-green-500 to-emerald-500' },
    credits: { icon: Coins, title: 'Purchase Credits', gradient: 'from-amber-500 to-orange-500' },
  }

  const { title, gradient } = config[type]

  return (
    <div className="flex items-center gap-3">
      <div className={cn('p-3 rounded-xl bg-gradient-to-br', gradient)}>
        {type === 'plan' && <Package className="h-6 w-6 text-white" />}
        {type === 'addon' && <Zap className="h-6 w-6 text-white" />}
        {type === 'credits' && <Coins className="h-6 w-6 text-white" />}
      </div>
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-brand-gradient">{title}</h1>
        <p className="text-sm text-fg-tertiary mt-1">{item.title}</p>
      </div>
    </div>
  )
}

// ============================================================================
// ORDER SUMMARY SIDEBAR
// ============================================================================

interface OrderSummaryProps {
  item: CheckoutItem
  selectedAddons: AddonCardData[]
  coupon: { id: string; percent_off?: number; amount_off?: number } | null
  isTrialAccepted: boolean
}

function OrderSummary({ item, selectedAddons, coupon, isTrialAccepted }: OrderSummaryProps) {
  const basePrice = item.priceAmount / 100
  const addonTotal = selectedAddons.reduce((sum, addon) => sum + addon.priceAmount / 100, 0)
  const subtotal = basePrice + addonTotal
  const discount = coupon
    ? coupon.percent_off
      ? (subtotal * coupon.percent_off) / 100
      : (coupon.amount_off || 0) / 100
    : 0
  const total = subtotal - discount

  return (
    <Card className="border-0 bg-card/95 backdrop-blur-xl rounded-2xl overflow-hidden relative">
      <CardHeader className="relative bg-gradient-to-br from-accent-base/8 via-accent-base/5 to-transparent border-b border-line-secondary pb-5">
        <CardTitle className="text-2xl font-black text-brand-gradient tracking-tight">Order Summary</CardTitle>
        <CardDescription className="text-fg-tertiary font-medium mt-1.5">Review your purchase</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {/* Main Item */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-fg-primary">{item.title}</h3>
              <p className="text-sm text-fg-secondary">
                {item.interval === 'one_time' ? 'One-time purchase' : `${item.interval}ly subscription`}
              </p>
            </div>
            <div className="text-right">
              <div className="font-bold text-fg-primary text-lg">{item.price}</div>
              {item.interval !== 'one_time' && (
                <span className="text-xs text-fg-secondary">/ {item.interval}</span>
              )}
            </div>
          </div>
        </div>

        {/* Trial Badge */}
        {isTrialAccepted && item.trial?.enabled && (
          <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 text-white px-4 py-3 rounded-xl text-sm font-bold">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎁</span>
              <span>{item.trial.days}-day free trial included</span>
            </div>
          </div>
        )}

        {/* Selected Addons */}
        {selectedAddons.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-bold mb-3 text-sm uppercase tracking-wider text-fg-primary">Add-ons</h4>
              <div className="space-y-2">
                {selectedAddons.map((addon) => (
                  <div key={addon.key} className="flex justify-between text-sm">
                    <span className="text-fg-secondary">{addon.title}</span>
                    <span className="font-medium">{addon.price}/mo</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Features */}
        {item.features && item.features.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-fg-primary">What's included</h4>
              <ul className="space-y-3">
                {item.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <div className="flex-shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/10 border border-primary/30 mt-0.5">
                      <Check className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-fg-secondary font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        <Separator />

        {/* Price Breakdown */}
        <div className="space-y-3 bg-muted/50 rounded-lg p-4 border border-border">
          <div className="flex justify-between text-sm">
            <span className="text-fg-tertiary">Subtotal</span>
            <span className="font-medium text-fg-primary">RM {subtotal.toFixed(2)}</span>
          </div>

          {coupon && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600 font-medium">Discount ({coupon.percent_off || ''}%)</span>
              <span className="text-green-600 font-semibold">- RM {discount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-md font-bold pt-1">
            <span className="text-fg-primary">Total</span>
            <span className="font-medium text-fg-primary">RM {total.toFixed(2)}</span>
          </div>

          {isTrialAccepted && item.trial?.enabled && (
            <>
              <Separator />
              <div className="flex justify-between text-lg font-bold pt-1">
                <span className="text-primary">Pay Now</span>
                <span className="text-primary">RM 0.00</span>
              </div>
              <p className="text-xs text-fg-secondary bg-primary/5 rounded-lg p-3 border border-primary/20 font-medium">
                💡 You'll be charged RM {total.toFixed(2)} after your {item.trial.days}-day trial ends
              </p>
            </>
          )}
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4 border-t border-border">
          <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span>Secure payment powered by Stripe</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MAIN UNIFIED CHECKOUT FORM
// ============================================================================

export const CheckoutForm = ({
  mode,
  item,
  additionalItems = [],
  availableAddons = [],
  user,
  context,
  existingCustomer,
  existingPaymentMethods = [],
  onComplete,
  onCancel,
  successUrl,
  cancelUrl,
  showBackButton = true,
  backUrl = '/site/pricing',
  className,
}: CheckoutProps) => {
  const router = useRouter()
  const { toast } = useToast()

  // Determine active steps based on checkout type and context
  const activeSteps = useMemo(() => {
    const hasExistingPayment = existingPaymentMethods.length > 0
    return getActiveCheckoutSteps(item.type, context, hasExistingPayment)
  }, [item.type, context, existingPaymentMethods.length])

  const steps = activeSteps.map((s) => ({ id: s.id, label: s.label, description: s.description }))

  // Form state
  const [currentStep, setCurrentStep] = useState<CheckoutStep>(steps[0]?.id || 'payment')
  const [completedSteps, setCompletedSteps] = useState<Set<CheckoutStep>>(new Set())
  const [isTrialAccepted, setIsTrialAccepted] = useState<boolean>(false)
  const [customerId, setCustomerId] = useState<string | null>(context.customerId || existingCustomer?.id || null)
  const [selectedAddonKeys, setSelectedAddonKeys] = useState<string[]>([])
  const [showLoader, setShowLoader] = useState(false)

  // Billing data
  const [savedBillingData, setSavedBillingData] = useState<CheckoutFormData | null>(null)

  // Payment state
  const [useExistingPayment, setUseExistingPayment] = useState<boolean>(existingPaymentMethods.length > 0)
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(
    existingPaymentMethods.length > 0 ? existingPaymentMethods[0].id : null
  )
  const [savedPaymentMethodId, setSavedPaymentMethodId] = useState<string | null>(null)
  const [cardModalOpen, setCardModalOpen] = useState(false)

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [couponLoading, setCouponLoading] = useState(false)

  // Location state for billing form
  const [countryCode, setCountryCode] = useState<string>('')
  const [stateCode, setStateCode] = useState<string>('')
  const [city, setCity] = useState<string>('')
  const [phoneNumber, setPhoneNumber] = useState<string>('')

  // Form setup
  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      userEmail: user.email || '',
      agencyName: '',
      agencyEmail: user.email || '',
      companyPhone: '',
      phoneCode: '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      stateCode: '',
      country: '',
      countryCode: '',
    },
  })

  const isLoading = form.formState.isSubmitting
  const currentStepIndex = steps.findIndex((s) => s.id === currentStep)

  // Selected addons for display
  const selectedAddons = useMemo(() => {
    return availableAddons.filter((addon) => selectedAddonKeys.includes(addon.key))
  }, [availableAddons, selectedAddonKeys])

  // Loading states for different checkout types
  const loadingStates = useMemo(() => {
    switch (item.type) {
      case 'plan':
        return [
          { text: 'Verifying payment method' },
          { text: 'Creating your subscription' },
          { text: 'Setting up your agency' },
          { text: 'Finalizing your account' },
        ]
      case 'addon':
        return [
          { text: 'Verifying payment method' },
          { text: 'Adding enhancement to subscription' },
          { text: 'Updating your plan' },
        ]
      case 'credits':
        return [
          { text: 'Processing payment' },
          { text: 'Adding credits to your account' },
        ]
      default:
        return [{ text: 'Processing...' }]
    }
  }, [item.type])

  // Pre-fill form with existing customer data
  useEffect(() => {
    if (existingCustomer) {
      const metadata = existingCustomer.metadata || {}

      if (existingCustomer.address) {
        const country = Country.getAllCountries().find((c) => c.name === existingCustomer.address?.country)
        const state = State.getStatesOfCountry(country?.isoCode || '').find(
          (s) => s.name === existingCustomer.address?.state
        )

        form.setValue('line1', existingCustomer.address.line1 || '')
        form.setValue('line2', existingCustomer.address.line2 || '')
        setCountryCode(country?.isoCode || '')
        form.setValue('country', country?.name || existingCustomer.address.country || '')
        form.setValue('countryCode', country?.isoCode || '')
        setStateCode(state?.isoCode || '')
        form.setValue('state', state?.name || existingCustomer.address.state || '')
        form.setValue('stateCode', state?.isoCode || '')
        form.setValue('city', existingCustomer.address.city || '')
        setCity(existingCustomer.address.city || '')
        form.setValue('postalCode', existingCustomer.address.postal_code || '')
      }

      if (metadata.agencyName) form.setValue('agencyName', metadata.agencyName)
      if (metadata.companyName) form.setValue('companyName', metadata.companyName)
      if (metadata.tinNumber) form.setValue('tinNumber', metadata.tinNumber)
    }
  }, [existingCustomer, form])

  // Check trial acceptance
  useEffect(() => {
    if (item.trial?.enabled && user.trialEligible) {
      setIsTrialAccepted(true)
    }
  }, [item.trial, user.trialEligible])

  // Step validation
  const validateStep = async (step: CheckoutStep): Promise<boolean> => {
    if (step === 'billing') {
      const fieldsToValidate = [
        'firstName', 'lastName', 'userEmail',
        'agencyName', 'agencyEmail', 'phoneCode', 'companyPhone',
        'line1', 'city', 'state', 'postalCode', 'country',
      ] as const
      return form.trigger(fieldsToValidate as any)
    }
    return true
  }

  const nextStep = async () => {
    const isValid = await validateStep(currentStep)
    if (!isValid) {
      const errorFields = Object.keys(form.formState.errors)
      toast({
        title: 'Validation Error',
        description: errorFields.length > 0
          ? `Please check: ${errorFields.join(', ')}`
          : 'Please fill in all required fields.',
        variant: 'destructive',
      })
      return
    }

    setCompletedSteps((prev) => new Set(prev).add(currentStep))

    if (currentStep === 'billing') {
      setSavedBillingData(form.getValues())
    }

    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id)
    }
  }

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id)
    }
  }

  const goToStep = (step: CheckoutStep) => {
    const stepIndex = steps.findIndex((s) => s.id === step)
    if (stepIndex <= currentStepIndex || completedSteps.has(step)) {
      setCurrentStep(step)
    }
  }

  // Process checkout based on type
  const processCheckout = async () => {
    try {
      setShowLoader(true)
      const result: CheckoutResult = { success: false, type: item.type }

      switch (item.type) {
        case 'plan':
          await processPlanCheckout(result)
          break
        case 'addon':
          await processAddonCheckout(result)
          break
        case 'credits':
          await processCreditsCheckout(result)
          break
      }

      if (result.success) {
        onComplete?.(result)
        if (successUrl) {
          router.push(successUrl)
        } else if (result.agencyId) {
          router.push(`/agency/${result.agencyId}`)
        }
      }
    } catch (error) {
      console.error('Checkout error:', error)
      setShowLoader(false)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process checkout',
        variant: 'destructive',
      })
    }
  }

  const processPlanCheckout = async (result: CheckoutResult) => {
    const data = savedBillingData || form.getValues()
    const formattedPhone = data.phoneCode && data.companyPhone
      ? `${data.phoneCode}${data.companyPhone}`
      : data.companyPhone

    // Step 1: Get or create customer
    let finalCustomerId: string
    if (customerId) {
      finalCustomerId = customerId
    } else {
      const customerRes = await fetch('/api/stripe/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.userEmail,
          name: data.companyName || `${data.firstName} ${data.lastName}`,
          phone: formattedPhone,
          address: {
            line1: data.line1,
            line2: data.line2 || '',
            city: data.city,
            state: data.state,
            postal_code: data.postalCode,
            country: data.country,
          },
          metadata: {
            userId: user.id,
            agencyName: data.agencyName,
            companyName: data.companyName || '',
          },
          userId: user.id,
        }),
      })

      if (!customerRes.ok) throw new Error('Failed to create customer')
      const { customerId: newCustomerId } = await customerRes.json()
      finalCustomerId = newCustomerId
      setCustomerId(finalCustomerId)
    }

    // Step 2: Create agency
    const { upsertAgency } = await import('@/lib/queries')
    const agencyId = uuid()

    await upsertAgency({
      id: agencyId,
      customerId: finalCustomerId,
      name: data.agencyName,
      companyEmail: data.userEmail,
      companyPhone: formattedPhone,
      whiteLabel: false,
      line1: data.line1,
      line2: data.line2 || '',
      city: data.city,
      postalCode: data.postalCode,
      state: data.state,
      country: data.country,
      agencyLogo: '',
      connectAccountId: '',
      taxIdentityId: null,
      goal: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Step 3: Create subscription
    const subscriptionRes = await fetch('/api/stripe/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: finalCustomerId,
        agencyId,
        priceId: item.priceId,
        country: data.country,
        coupon: appliedCoupon?.id,
        paymentMethodId: savedPaymentMethodId || selectedPaymentMethodId,
        trialEnabled: isTrialAccepted && item.trial?.enabled,
        trialPeriodDays: isTrialAccepted ? item.trial?.days : undefined,
      }),
    })

    if (!subscriptionRes.ok) throw new Error('Failed to create subscription')
    const { subscriptionId } = await subscriptionRes.json()

    // Step 4: Add selected addons
    for (const addonKey of selectedAddonKeys) {
      const addon = availableAddons.find((a) => a.key === addonKey)
      if (!addon) continue

      await fetch('/api/stripe/addon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          agencyId,
          addonKey: addon.key,
          priceId: addon.priceId,
        }),
      })
    }

    result.success = true
    result.subscriptionId = subscriptionId
    result.agencyId = agencyId

    toast({ title: 'Success!', description: 'Your subscription has been created.' })
  }

  const processAddonCheckout = async (result: CheckoutResult) => {
    if (!context.agencyId) throw new Error('Agency ID required for addon checkout')

    const addonRes = await fetch('/api/stripe/addon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add',
        agencyId: context.agencyId,
        addonKey: item.key,
        priceId: item.priceId,
      }),
    })

    if (!addonRes.ok) throw new Error('Failed to add addon')

    result.success = true
    result.agencyId = context.agencyId

    toast({ title: 'Success!', description: `${item.title} has been added to your subscription.` })
  }

  const processCreditsCheckout = async (result: CheckoutResult) => {
    if (!context.agencyId) throw new Error('Agency ID required for credits checkout')

    const checkoutRes = await fetch('/api/stripe/credits/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agencyId: context.agencyId,
        featureKey: item.key,
        credits: item.quantity || 1,
        priceId: item.priceId,
      }),
    })

    if (!checkoutRes.ok) throw new Error('Failed to create checkout session')

    const { url, sessionId } = await checkoutRes.json()
    result.success = true
    result.sessionId = sessionId

    // Redirect to Stripe checkout for credits
    if (url) {
      window.location.href = url
    }
  }

  // Coupon handling
  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    try {
      const response = await fetch('/api/stripe/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode }),
      })

      if (!response.ok) throw new Error('Invalid coupon code')

      const { coupon } = await response.json()
      setAppliedCoupon(coupon)
      toast({ title: 'Coupon Applied!', description: `Discount applied successfully.` })
    } catch {
      toast({ title: 'Invalid Coupon', description: 'The coupon code is not valid.', variant: 'destructive' })
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
  }

  // Check if payment is ready
  const hasValidPayment = useExistingPayment ? !!selectedPaymentMethodId : !!savedPaymentMethodId

  // Render content based on mode
  const content = (
    <div className={cn('min-h-screen relative overflow-hidden bg-bg-primary text-fg-primary', mode === 'modal' && 'min-h-0', className)}>
      {/* Background (page mode only) */}
      {mode === 'page' && (
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-300/25 to-purple-300/25 blur-3xl" />
          <div className="absolute bottom-[-180px] right-[-180px] h-[520px] w-[520px] rounded-full bg-gradient-to-br from-cyan-300/20 to-pink-300/20 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.15]" />
        </div>
      )}

      <div className={cn('mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 relative z-10', mode === 'page' ? 'max-w-6xl' : 'max-w-4xl py-6')}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <CheckoutHeader type={item.type} item={item} />
          {mode === 'page' && showBackButton && (
            <Button variant="ghost" size="sm" onClick={() => router.push(backUrl || cancelUrl || '/site/pricing')}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          {mode === 'modal' && (
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <Separator className="my-6" />

        {/* Main Content */}
        <div className={cn('grid gap-6', mode === 'page' ? 'lg:grid-cols-3' : '')}>
          {/* Form Column */}
          <div className={cn('space-y-4', mode === 'page' ? 'lg:col-span-2' : '')}>
            {/* Step Indicator */}
            {steps.length > 1 && (
              <StepIndicator
                steps={steps}
                currentStep={currentStep}
                completedSteps={completedSteps}
                onStepClick={goToStep}
              />
            )}

            {/* Form Card */}
            <Card className="border-0 card rounded-2xl">
              <CardContent className="pt-6 pb-7 px-6 sm:px-7">
                <form>
                  {/* Billing Step */}
                  {currentStep === 'billing' && (
                    <BillingStepContent
                      form={form}
                      isLoading={isLoading}
                      countryCode={countryCode}
                      setCountryCode={setCountryCode}
                      stateCode={stateCode}
                      setStateCode={setStateCode}
                      city={city}
                      setCity={setCity}
                      phoneNumber={phoneNumber}
                      setPhoneNumber={setPhoneNumber}
                    />
                  )}

                  {/* Payment Step */}
                  {currentStep === 'payment' && (
                    <PaymentStepContent
                      existingPaymentMethods={existingPaymentMethods}
                      useExistingPayment={useExistingPayment}
                      setUseExistingPayment={setUseExistingPayment}
                      selectedPaymentMethodId={selectedPaymentMethodId}
                      setSelectedPaymentMethodId={setSelectedPaymentMethodId}
                      savedPaymentMethodId={savedPaymentMethodId}
                      setSavedPaymentMethodId={setSavedPaymentMethodId}
                      cardModalOpen={cardModalOpen}
                      setCardModalOpen={setCardModalOpen}
                      savedBillingData={savedBillingData}
                      toast={toast}
                    />
                  )}

                  {/* Review Step */}
                  {currentStep === 'review' && (
                    <ReviewStepContent
                      item={item}
                      savedBillingData={savedBillingData}
                      existingPaymentMethods={existingPaymentMethods}
                      useExistingPayment={useExistingPayment}
                      selectedPaymentMethodId={selectedPaymentMethodId}
                      savedPaymentMethodId={savedPaymentMethodId}
                      availableAddons={availableAddons}
                      selectedAddonKeys={selectedAddonKeys}
                      setSelectedAddonKeys={setSelectedAddonKeys}
                      isTrialAccepted={isTrialAccepted}
                      context={context}
                    />
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex gap-3 mt-7 pt-5 border-t border-border">
                    {currentStepIndex > 0 && (
                      <Button type="button" variant="outline" onClick={prevStep}>
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back
                      </Button>
                    )}
                    {currentStep !== 'review' ? (
                      <Button
                        type="button"
                        className="btn-brand-gradient h-11"
                        onClick={nextStep}
                        disabled={isLoading || (currentStep === 'payment' && !hasValidPayment)}
                      >
                        Continue →
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        className="btn-brand-gradient shadow-lg h-11 flex-1"
                        onClick={processCheckout}
                        disabled={showLoader || !hasValidPayment}
                      >
                        🔒 Confirm & Pay {isTrialAccepted && item.trial?.enabled ? 'RM 0.00' : item.price}
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary (page mode only) */}
          {mode === 'page' && (
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-6">
                <OrderSummary
                  item={item}
                  selectedAddons={selectedAddons}
                  coupon={appliedCoupon}
                  isTrialAccepted={isTrialAccepted}
                />

                {/* Coupon Input */}
                <Card className="mt-4 border-0 bg-card/95 rounded-2xl">
                  <CardContent className="pt-4 pb-4">
                    <Label className="text-sm font-bold mb-3 block text-fg-primary uppercase tracking-wider">
                      Promo Code
                    </Label>
                    {!appliedCoupon ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          disabled={couponLoading}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={applyCoupon}
                          disabled={!couponCode.trim() || couponLoading}
                        >
                          {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-bold text-green-700">{appliedCoupon.id}</span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={removeCoupon} className="text-xs">
                          Remove
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Multi-Step Loader */}
      <MultiStepLoader loadingStates={loadingStates} loading={showLoader} duration={2000} loop={false} />
    </div>
  )

  // Return based on mode
  if (mode === 'modal') {
    return (
      <Dialog open onOpenChange={(open) => !open && onCancel?.()}>
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Checkout</DialogTitle>
        </DialogHeader>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
          {content}
        </DialogContent>
      </Dialog>
    )
  }

  return content
}

// ============================================================================
// STEP CONTENT COMPONENTS (Extracted for cleanliness)
// ============================================================================

interface BillingStepContentProps {
  form: ReturnType<typeof useForm<CheckoutFormData>>
  isLoading: boolean
  countryCode: string
  setCountryCode: (code: string) => void
  stateCode: string
  setStateCode: (code: string) => void
  city: string
  setCity: (city: string) => void
  phoneNumber: string
  setPhoneNumber: (phone: string) => void
}

function BillingStepContent({
  form,
  isLoading,
  countryCode,
  setCountryCode,
  stateCode,
  setStateCode,
  city,
  setCity,
  phoneNumber,
  setPhoneNumber,
}: BillingStepContentProps) {
  return (
    <div className="space-y-6">
      <div className="border-l-4 border-primary pl-5">
        <h2 className="text-2xl font-black text-brand-gradient mb-1 tracking-tight">Account</h2>
        <p className="text-sm text-muted-foreground">Your contact information</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <Label className="mb-2 block">Full Name *</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input {...form.register('firstName')} placeholder="First" className="h-10" />
            <Input {...form.register('lastName')} placeholder="Last" className="h-10" />
          </div>
        </div>
        <div>
          <Label htmlFor="agencyEmail" className="mb-2 block">Email Address *</Label>
          <Input id="agencyEmail" type="email" readOnly {...form.register('agencyEmail')} className="h-10" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <Label htmlFor="agencyName" className="mb-2 block">Tenant Name *</Label>
          <Input id="agencyName" {...form.register('agencyName')} placeholder="My Tenant" className="h-10" />
        </div>
        <div>
          <Label htmlFor="companyPhone" className="mb-2 block">Phone Number *</Label>
          <PhoneCodeSelector
            value={phoneNumber}
            onValueChange={(value, phoneCodeData) => {
              setPhoneNumber(value)
              form.setValue('companyPhone', value)
              form.setValue('phoneCode', phoneCodeData || '')
            }}
            countryCode={countryCode}
            onCountryCodeChange={(code, countryData) => {
              setCountryCode(code)
              form.setValue('phoneCode', countryData?.phonecode || '')
              form.setValue('country', countryData?.name || '', { shouldValidate: true })
              form.setValue('countryCode', code)
            }}
            placeholder="Enter phone number"
            disabled={isLoading}
            styleVariant="plain"
          />
        </div>
      </div>

      <Separator className="my-6" />

      <div className="border-l-4 border-primary pl-5">
        <h2 className="text-2xl font-black text-brand-gradient mb-1 tracking-tight">Billing</h2>
        <p className="text-sm text-fg-tertiary">Billing address and tax information</p>
      </div>

      <div className="space-y-5 mt-2">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <Label htmlFor="companyName" className="mb-2 block">Company Name (Optional)</Label>
            <Input id="companyName" {...form.register('companyName')} placeholder="My Company Ltd." className="h-10" />
          </div>
          <div>
            <Label htmlFor="tinNumber" className="mb-2 block">Tax ID (Optional)</Label>
            <Input id="tinNumber" {...form.register('tinNumber')} placeholder="123-45-6789" className="h-10" />
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Address *</Label>
          <div className="grid md:grid-cols-4 gap-2">
            <Input {...form.register('line2')} placeholder="Apt/Suite (Optional)" className="h-10" />
            <Input className="md:col-span-2 h-10" {...form.register('line1')} placeholder="Street Address" />
            <PostalCodeInput
              value={form.watch('postalCode')}
              onValueChange={(value: string) => form.setValue('postalCode', value)}
              placeholder="Postal Code"
              countryCode={countryCode}
              styleVariant="plain"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <div>
            <Label className="mb-2 block">Country *</Label>
            <CountrySelector
              value={countryCode}
              onValueChange={(code, countryData) => {
                setCountryCode(code)
                setStateCode('')
                form.setValue('country', countryData?.name || '')
                form.setValue('countryCode', code)
                form.setValue('state', '')
                form.setValue('stateCode', '')
                form.setValue('city', '')
              }}
              placeholder="Select country"
              disabled={isLoading}
              styleVariant="plain"
            />
          </div>
          <div>
            <Label className="mb-2 block">State/Province *</Label>
            <StateSelector
              countryCode={countryCode}
              value={stateCode}
              onValueChange={(isoCode: string, stateData: any) => {
                setStateCode(isoCode)
                form.setValue('state', stateData.name)
                form.setValue('stateCode', isoCode)
              }}
              placeholder="Select state"
              disabled={isLoading}
              styleVariant="plain"
            />
          </div>
          <div>
            <Label className="mb-2 block">City *</Label>
            <CitySelector
              countryCode={countryCode}
              stateCode={stateCode}
              value={city}
              onValueChange={(cityName: string, cityData: any) => {
                setCity(cityData.name)
                form.setValue('city', cityData.name)
              }}
              placeholder="Select city"
              disabled={isLoading}
              styleVariant="plain"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

interface PaymentStepContentProps {
  existingPaymentMethods: { id: string; card: { brand: string; last4: string; exp_month: number; exp_year: number; cardholder_name: string | null; isDefault: boolean } | null }[]
  useExistingPayment: boolean
  setUseExistingPayment: (use: boolean) => void
  selectedPaymentMethodId: string | null
  setSelectedPaymentMethodId: (id: string | null) => void
  savedPaymentMethodId: string | null
  setSavedPaymentMethodId: (id: string | null) => void
  cardModalOpen: boolean
  setCardModalOpen: (open: boolean) => void
  savedBillingData: CheckoutFormData | null
  toast: any
}

function PaymentStepContent({
  existingPaymentMethods,
  useExistingPayment,
  setUseExistingPayment,
  selectedPaymentMethodId,
  setSelectedPaymentMethodId,
  savedPaymentMethodId,
  setSavedPaymentMethodId,
  cardModalOpen,
  setCardModalOpen,
  savedBillingData,
  toast,
}: PaymentStepContentProps) {
  return (
    <div className="space-y-6">
      <div className="border-l-4 border-primary pl-5">
        <h2 className="text-2xl font-black text-brand-gradient mb-2 tracking-tight">Payment Method</h2>
        <p className="text-fg-tertiary">
          {existingPaymentMethods.length > 0 ? 'Choose a payment method or add a new card' : 'Securely add your payment information'}
        </p>
      </div>

      {/* Existing Payment Methods */}
      {existingPaymentMethods.length > 0 && (
        <div className="space-y-4">
          <SavedBankCardsGallery
            compact
            cards={existingPaymentMethods.map((pm) => ({
              id: pm.id,
              cardNumber: `**** **** **** ${pm.card?.last4}`,
              cardholderName: pm.card?.cardholder_name || 'N/A',
              expiryMonth: String(pm.card?.exp_month).padStart(2, '0'),
              expiryYear: String(pm.card?.exp_year),
              brand: pm.card?.brand,
              variant: pm.card?.brand === 'visa' ? 'default' : pm.card?.brand === 'mastercard' ? 'premium' : 'default',
              isDefault: pm.card?.isDefault,
            }))}
            selectedCardId={useExistingPayment && selectedPaymentMethodId ? selectedPaymentMethodId : undefined}
            onCardSelect={(cardId) => {
              setUseExistingPayment(true)
              setSelectedPaymentMethodId(cardId)
            }}
            onAddCard={() => setCardModalOpen(true)}
            onSetDefault={() => toast({ title: 'Coming Soon', description: 'This feature will be available soon.' })}
            onReplaceCard={() => setCardModalOpen(true)}
            onRemoveCard={() => toast({ title: 'Coming Soon', description: 'This feature will be available soon.', variant: 'destructive' })}
            className="mb-4"
          />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {useExistingPayment ? 'Or add new card' : 'Adding new card'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Add New Card Option */}
      {!useExistingPayment && !savedPaymentMethodId && (
        <div
          onClick={() => setCardModalOpen(true)}
          className="p-6 border-2 border-dashed border-primary/30 rounded-xl cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
        >
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-fg-primary">Add New Payment Method</p>
              <p className="text-sm text-fg-tertiary mt-1">Click to securely add your card details</p>
            </div>
          </div>
        </div>
      )}

      {/* Success state for validated payment */}
      {!useExistingPayment && savedPaymentMethodId && (
        <div className="relative rounded-2xl p-[1.5px] bg-gradient-to-br from-green-400/60 via-green-300/40 to-green-400/60 overflow-hidden shadow-lg">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 p-5">
            <div className="relative z-10 flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-lg">
                <Check className="h-7 w-7 text-white" strokeWidth={3} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg text-green-900">Payment Method Validated</p>
                <p className="text-sm text-green-700 mt-0.5">Your new card has been validated</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSavedPaymentMethodId(null)}
                className="flex-shrink-0"
              >
                Change Card
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Card Modal - would include Stripe Elements in real implementation */}
      {cardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setCardModalOpen(false)}>
          <div className="relative bg-card rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-fg-primary">Add New Card</h2>
                <p className="text-sm text-fg-tertiary mt-1">Your payment information is securely processed by Stripe</p>
              </div>
              <button onClick={() => setCardModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Stripe Elements would go here */}
            <div className="bg-muted/50 rounded-xl p-6 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Stripe Payment Elements would be integrated here for secure card collection
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <Button type="button" variant="outline" onClick={() => setCardModalOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                type="button"
                className="btn-brand-gradient flex-1"
                onClick={() => {
                  // Simulate card validation
                  setSavedPaymentMethodId('pm_simulated_' + Date.now())
                  setUseExistingPayment(false)
                  setCardModalOpen(false)
                  toast({ title: 'Card Added', description: 'Your payment method is ready to use.' })
                }}
              >
                Add Card
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface ReviewStepContentProps {
  item: CheckoutItem
  savedBillingData: CheckoutFormData | null
  existingPaymentMethods: { id: string; card: { brand: string; last4: string; exp_month: number; exp_year: number } | null }[]
  useExistingPayment: boolean
  selectedPaymentMethodId: string | null
  savedPaymentMethodId: string | null
  availableAddons: AddonCardData[]
  selectedAddonKeys: string[]
  setSelectedAddonKeys: (keys: string[]) => void
  isTrialAccepted: boolean
  context: { isNewSubscription: boolean }
}

function ReviewStepContent({
  item,
  savedBillingData,
  existingPaymentMethods,
  useExistingPayment,
  selectedPaymentMethodId,
  savedPaymentMethodId,
  availableAddons,
  selectedAddonKeys,
  setSelectedAddonKeys,
  isTrialAccepted,
  context,
}: ReviewStepContentProps) {
  return (
    <div className="space-y-6">
      <div className="border-l-4 border-primary pl-5">
        <h2 className="text-2xl font-black text-brand-gradient mb-2 tracking-tight">Review & Confirm</h2>
        <p className="text-fg-tertiary">Please review your information before confirming</p>
      </div>

      {/* Billing Summary (if new subscription) */}
      {context.isNewSubscription && savedBillingData && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            Billing Information
          </h3>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{savedBillingData.firstName} {savedBillingData.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{savedBillingData.agencyEmail}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tenant Name</p>
                <p className="font-medium">{savedBillingData.agencyName}</p>
              </div>
            </div>
            <Separator className="my-2" />
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-medium">
                {savedBillingData.line1}{savedBillingData.line2 && `, ${savedBillingData.line2}`}
              </p>
              <p className="font-medium">
                {savedBillingData.city}, {savedBillingData.state} {savedBillingData.postalCode}
              </p>
              <p className="font-medium">{savedBillingData.country}</p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Summary */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Check className="h-5 w-5 text-green-500" />
          Payment Method
        </h3>
        <div className="bg-muted/50 rounded-lg p-4">
          {useExistingPayment && selectedPaymentMethodId ? (
            <div>
              {(() => {
                const pm = existingPaymentMethods.find((m) => m.id === selectedPaymentMethodId)
                return pm ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">{pm.card?.brand?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-medium capitalize">{pm.card?.brand} •••• {pm.card?.last4}</p>
                      <p className="text-sm text-muted-foreground">Expires {pm.card?.exp_month}/{pm.card?.exp_year}</p>
                    </div>
                  </div>
                ) : null
              })()}
            </div>
          ) : savedPaymentMethodId ? (
            <p className="font-medium">New card ending in ••••</p>
          ) : (
            <p className="text-amber-600">No payment method selected</p>
          )}
        </div>
      </div>

      {/* Add-ons Upsell (for plan checkout) */}
      {item.type === 'plan' && availableAddons.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Plus className="h-5 w-5 text-brand-bg" />
            Enhance Your Plan (Optional)
          </h3>
          <div className="space-y-2">
            {availableAddons.slice(0, 4).map((addon) => {
              const isSelected = selectedAddonKeys.includes(addon.key)
              const hasRequirement = addon.requires && !selectedAddonKeys.includes(addon.requires)

              return (
                <div
                  key={addon.key}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer',
                    isSelected
                      ? 'border-brand-bg bg-brand-bg/5'
                      : 'border-border hover:border-brand-bg/50 bg-muted/30',
                    hasRequirement && 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={() => {
                    if (hasRequirement) return
                    setSelectedAddonKeys(
                      isSelected
                        ? selectedAddonKeys.filter((k) => k !== addon.key)
                        : [...selectedAddonKeys, addon.key]
                    )
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                        isSelected ? 'border-brand-bg bg-brand-bg' : 'border-muted-foreground'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{addon.title}</p>
                      <p className="text-xs text-muted-foreground">{addon.description}</p>
                      {hasRequirement && <p className="text-xs text-amber-600">Requires {addon.requires}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{addon.price}</p>
                    <p className="text-xs text-muted-foreground">/month</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Subscription Summary */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Check className="h-5 w-5 text-green-500" />
          {item.type === 'plan' ? 'Subscription' : item.type === 'addon' ? 'Enhancement' : 'Purchase'}
        </h3>
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-lg">{item.title}</p>
              <p className="text-sm text-muted-foreground">
                {item.interval === 'one_time' ? 'One-time purchase' : `${item.interval === 'month' ? 'Monthly' : 'Yearly'} subscription`}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-xl">{item.price}</p>
              {item.interval !== 'one_time' && <p className="text-sm text-muted-foreground">per {item.interval}</p>}
            </div>
          </div>

          {isTrialAccepted && item.trial?.enabled && (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                💡 Your {item.trial.days}-day free trial starts today. You'll be charged {item.price} after your trial ends.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CheckoutForm
