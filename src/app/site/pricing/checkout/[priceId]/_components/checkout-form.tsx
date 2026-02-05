'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Check, ChevronLeft, Tag, MoreVertical, Trash2, CreditCard, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { StripePaymentElement } from './stripe-payment-element'
import { v4 as uuid } from 'uuid'
import {
  CountrySelector,
  StateSelector,
  CitySelector,
  PostalCodeInput,
  PhoneCodeSelector,
} from '@/components/global/location'
import { MultiStepLoader } from '@/components/ui/multi-step-loader'
import { Country, State, City } from 'country-state-city'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { SavedBankCardsGallery, InteractiveBankCard } from '@/components/ui/bank-card'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const checkoutFormSchema = z.object({
  // User Details
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  userEmail: z.string().email('Invalid email address'),

  // Agency Details
  agencyName: z.string().min(2, 'D.B.A. is required for your agency'),
  agencyEmail: z.string().email('Invalid email address'),
  companyPhone: z.string().min(1, 'Phone number is required'),
  phoneCode: z.string().optional(),


  // Billing Address 
  companyName: z.string().optional(),
  tinNumber: z.string().optional(),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(2, 'Country is required'),
  countryCode: z.string().optional(),
  stateCode: z.string().optional(),
})

type CheckoutFormData = z.infer<typeof checkoutFormSchema>

type Props = {
  priceId: string
  planConfig: {
    title: string
    price: string
    duration: string
    features: string[]
    trialEnabled: boolean
    trialPeriodDays: number
  }
  user: {
    id: string
    email: string
    name: string
    firstName: string
    lastName: string
    trialEligible: boolean
  }
  agencyEmail: string
  existingCustomer: {
    id: string
    email: string | null
    name: string | null
    phone: string | null
    address: {
      line1: string | null
      line2: string | null
      city: string | null
      state: string | null
      postal_code: string | null
      country: string | null
    } | null
    metadata: Record<string, string>
  } | null
  existingPaymentMethods: {
    id: string
    card: {
      cardholder_name: string | null
      brand: string
      last4: string
      exp_month: number
      exp_year: number
      isDefault: boolean
    } | null
  }[]
}

type Step = 'billing' | 'payment' | 'review'

const steps: { id: Step; label: string; description: string }[] = [
  { id: 'billing', label: 'Billing', description: 'Billing information' },
  { id: 'payment', label: 'Payment', description: 'Payment method' },
  { id: 'review', label: 'Review', description: 'Review & Confirm' },
]

export function CheckoutForm({ priceId, planConfig, user, agencyEmail, existingCustomer, existingPaymentMethods }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isTrialAccepted, setIsTrialAccepted] = useState<boolean>(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [customerId, setCustomerId] = useState<string | null>(existingCustomer?.id || null)
  const [currentStep, setCurrentStep] = useState<Step>('billing')
  const [completedSteps, setCompletedSteps] = useState<Set<Step>>(new Set())

  // Stateful data storage for navigation
  const [savedBillingData, setSavedBillingData] = useState<CheckoutFormData | null>(null)
  const [savedPaymentMethodId, setSavedPaymentMethodId] = useState<string | null>(null)
  const [useExistingPayment, setUseExistingPayment] = useState<boolean>(existingPaymentMethods.length > 0)
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(
    existingPaymentMethods.length > 0 ? existingPaymentMethods[0].id : null
  )

  // Card modal state
  const [cardModalOpen, setCardModalOpen] = useState(false)
  const [cardModalMode, setCardModalMode] = useState<'add' | 'replace'>('add')
  const [cardPreview, setCardPreview] = useState({
    brand: 'visa' as string,
    last4: '',
    complete: false,
    isFlipped: false,
  })
  const [cardToReplace, setCardToReplace] = useState<string | null>(null)

  // Multi-step loader state
  const [showLoader, setShowLoader] = useState(false)
  const loadingStates = [
    { text: 'Verifying payment method' },
    { text: 'Creating your subscription' },
    { text: 'Setting up your agency' },
    { text: 'Finalizing your account' },
  ]

  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [couponLoading, setCouponLoading] = useState(false)

  // Location state
  const [countryCode, setCountryCode] = useState<string>('')
  const [stateCode, setStateCode] = useState<string>('')
  const [city, setCity] = useState<string>('')
  const [phoneCode, setPhoneCode] = useState<string>('')
  const [phoneNumber, setPhoneNumber] = useState<string>('')

  const countries = Country.getAllCountries()
  const states = countryCode ? State.getStatesOfCountry(countryCode) : []
  const cities = countryCode && stateCode ? City.getCitiesOfState(countryCode, stateCode) : []

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

  // Pre-fill form with existing customer data
  useEffect(() => {
    if (existingCustomer) {
      console.log('🔄 Pre-filling form with existing customer data:', existingCustomer.id)
      // Parse metadata for additional fields
      const metadata = existingCustomer.metadata || {}

      // Pre-fill billing address
      if (existingCustomer.address) {
        const country = Country.getAllCountries().find(c => c.name === existingCustomer.address?.country)
        const state = State.getStatesOfCountry(country?.isoCode).find(s => s.name === existingCustomer.address?.state)
        const city = City.getCitiesOfState(state?.countryCode || '', state?.isoCode || '').find(c => c.name === existingCustomer.address?.city)
        const countryCodeLength = country ? country.isoCode.length + 1 : 0
        // Matches if existing phone starts with country phone code eg., +60 for Malaysia
        const phoneMatch = existingCustomer.phone ? existingCustomer.phone.match(/^(\+\d+)(.*)$/) : null // Matches +code and rest of number Eg., +1 5551234567
        // Match '+' & country isocode at start of stripe phone number
        const phoneCodeMatch = existingCustomer.phone && country ? existingCustomer.phone.match(new RegExp(`^(\\+${country.phonecode})(.*)$`)) : null
        const phoneCodeFromMatch = phoneCodeMatch ? phoneCodeMatch[1] : null
        const phoneNumberFromMatch = phoneCodeMatch ? phoneCodeMatch[2].toString().trim() : null


        form.setValue('line1', existingCustomer.address.line1 || '')
        form.setValue('line2', existingCustomer.address.line2 || '')
        setCountryCode(country ? country.isoCode : '')
        form.setValue('country', country ? country.name : existingCustomer.address.country || '')
        form.setValue('countryCode', country ? country.isoCode : '')
        setStateCode(state ? state.isoCode : '')
        form.setValue('state', state ? state.name : existingCustomer.address.state || '')
        form.setValue('stateCode', state ? state.isoCode : '')
        setCity(city ? city.name : '')
        form.setValue('city', city ? city.name : existingCustomer.address.city || '')
        form.setValue('postalCode', existingCustomer.address.postal_code || '')
        setPhoneCode(phoneCodeFromMatch || '')
        form.setValue('phoneCode', phoneCodeFromMatch || '')
        setPhoneNumber(phoneNumberFromMatch || existingCustomer.phone || '')
        form.setValue('companyPhone', phoneNumberFromMatch || existingCustomer.phone || '')



        console.log('🏙️ Pre-filled address:', {
          line1: existingCustomer.address.line1 || '',
          line2: existingCustomer.address.line2 || '',
          country: country ? country.name : existingCustomer.address.country || '',
          countryCode: country ? country.isoCode : '',
          state: state ? state.name : existingCustomer.address.state || '',
          stateCode: state ? state.isoCode : '',
          city: city ? city.name : existingCustomer.address.city || '',
          postalCode: existingCustomer.address.postal_code || '',
          phoneCode: phoneCodeFromMatch || '',
          companyPhone: phoneNumberFromMatch || `${existingCustomer.phone} (stripe)` || '',
        })
      }

      // Pre-fill user details from metadata
      if (metadata.agencyName) form.setValue('agencyName', metadata.agencyName)
      if (metadata.companyName) form.setValue('companyName', metadata.companyName)
      if (metadata.tinNumber) form.setValue('tinNumber', metadata.tinNumber)

      // Pre-fill phone
      // if (existingCustomer.phone) {
      //   // Extract phone code and number
      //   const phoneMatch = existingCustomer.phone.match(/^(\+\d+)(.*)$/) // Matches +code and rest of number Eg., +1 5551234567
      //   if (phoneMatch) {
      //     setPhoneCode(phoneMatch[1]) // 1st capture group is phone code Eg., +1, +44, +60, etc.
      //     form.setValue('phoneCode', phoneMatch[1]) // Set phone code in form Eg., +1, +44, +60, etc.
      //     setPhoneNumber(phoneMatch[2].trim()) // 2nd capture group is the rest of the number
      //     form.setValue('companyPhone', phoneMatch[2].trim()) // Set phone number in form
      //   } else {
      //     setPhoneNumber(existingCustomer.phone) // Fallback to full phone if parsing fails
      //     form.setValue('companyPhone', existingCustomer.phone) // Set full phone number in form
      //   }
      // }

      console.log('✅ Form pre-filled successfully')
    }
  }, [existingCustomer, form])

  // Check trial acceptance if plan has trial and user is eligible
  useEffect(() => {
    if (planConfig.trialEnabled && user.trialEligible) {
      setIsTrialAccepted(true)
    } else {
      setIsTrialAccepted(false)
    }
  }, [planConfig, user])


  const currentStepIndex = steps.findIndex((s) => s.id === currentStep)

  const validateStep = async (step: Step): Promise<boolean> => {
    const fieldsMap: Record<Step, (keyof CheckoutFormData)[]> = {
      billing: [
        'firstName', 'lastName', 'userEmail',
        'agencyName',
        'agencyEmail',
        'phoneCode',
        'companyPhone',
        'line1',
        'line2',
        'city',
        'state',
        'postalCode',
        'country',
      ],
      payment: [],
      review: [],
    }

    const fields = fieldsMap[step]
    const isValid = await form.trigger(fields as any)
    return isValid
  }

  const nextStep = async () => {
    const isValid = await validateStep(currentStep)
    if (!isValid) {
      // Get all errors for better debugging
      const errors = form.formState.errors
      const errorFields = Object.keys(errors)

      console.log('Validation failed for fields:', errorFields, errors)

      toast({
        title: 'Validation Error',
        description: errorFields.length > 0
          ? `Please check: ${errorFields.join(', ')}`
          : 'Please fill in all required fields correctly.',
        variant: 'destructive',
      })
      return
    }

    setCompletedSteps((prev) => new Set(prev).add(currentStep))

    // Save billing data when leaving billing step
    if (currentStep === 'billing') {
      const billingData = form.getValues()
      setSavedBillingData(billingData)
    }

    // Move to next step (no API calls until 'review' confirmation)
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

  const goToStep = async (step: Step) => {
    const stepIndex = steps.findIndex((s) => s.id === step)
    if (stepIndex < currentStepIndex || completedSteps.has(step)) {
      setCurrentStep(step)
    }
  }

  const setupPaymentIntent = async (billingData?: CheckoutFormData) => {
    try {
      const data = billingData || savedBillingData
      if (!data) {
        console.error('⚠️ No billing data available')
        return
      }

      // If using existing payment method, skip setup
      if (useExistingPayment && selectedPaymentMethodId) {
        console.log('\ud83d\udcb3 Using existing payment method:', selectedPaymentMethodId)
        return
      }

      // Create a temporary SetupIntent for collecting new payment method
      console.log('\ud83d\udcb3 Creating SetupIntent for new payment method')
      const setupIntentRes = await fetch('/api/stripe/create-setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId,
        }),
      })

      if (!setupIntentRes.ok) {
        throw new Error('Failed to create payment setup')
      }

      const { clientSecret: secret } = await setupIntentRes.json()
      setClientSecret(secret)
      console.log('\u2705 SetupIntent created successfully')
    } catch (error) {
      console.error('Setup payment error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to setup payment',
        variant: 'destructive',
      })
    }
  }

  const processCheckout = async () => {
    let agencyId = ''  // Declare at function scope
    try {
      setShowLoader(true)
      const data = savedBillingData || form.getValues()

      // Format phone number with country code
      const formattedPhone = data.phoneCode && data.companyPhone
        ? `${data.phoneCode}${data.companyPhone}`
        : data.companyPhone

      console.log('📞 Phone formatting:', {
        phoneCode: data.phoneCode,
        companyPhone: data.companyPhone,
        formattedPhone
      })

      // Step 1: Ensure we have a customer ID
      let finalCustomerId: string

      if (customerId) {
        finalCustomerId = customerId
      } else {
        console.log('\ud83d\udd0d Checking for existing customer:', data.userEmail)
        const existingCustomerResponse = await fetch(`/api/stripe/customer?email=${encodeURIComponent(data.userEmail)}`)

        if (!existingCustomerResponse.ok) {
          throw new Error('Failed to check existing customer')
        }

        const existingData = await existingCustomerResponse.json()

        if (existingData.exists && existingData.customer) {
          console.log('\u2705 Found existing customer, reusing:', existingData.customer.id)
          finalCustomerId = existingData.customer.id
          setCustomerId(finalCustomerId)
        } else {
          console.log('\ud83d\udcdd Creating new customer')
          const customerResponse = await fetch('/api/stripe/customer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: data.userEmail,
              name: data.companyName || `${data.firstName} ${data.lastName}`,
              phone: formattedPhone,
              individual_name: `${data.firstName} ${data.lastName}`,
              business_name: data.companyName || '',
              address: {
                line1: data.line1,
                line2: data.line2 || '',
                city: data.city,
                state: data.state,
                postal_code: data.postalCode,
                country: data.country,
              },
              shipping: {
                address: {
                  city: data.city,
                  country: data.country,
                  line1: data.line1,
                  line2: data.line2 || undefined,
                  postal_code: data.postalCode,
                  state: data.state,
                },
                name: data.companyName || `${data.firstName} ${data.lastName}`,
              },
              metadata: {
                userId: user.id,
                agencyName: data.agencyName,
                companyName: data.companyName || '',
                tinNumber: data.tinNumber || '',
                source: 'checkout',
              },
              userId: user.id, // Inline user customerId update (replaces /api/user/update-customer)
            }),
          })

          if (!customerResponse.ok) {
            const error = await customerResponse.json()
            throw new Error(error.error || 'Failed to create customer')
          }

          const customerData: { customerId: string; userUpdated?: boolean } = await customerResponse.json()
          finalCustomerId = customerData.customerId
          setCustomerId(finalCustomerId)
          console.log('\u2705 New customer created:', finalCustomerId, 'userUpdated:', customerData.userUpdated)
        }
      }

      // Step 2: Create the agency FIRST (before subscription)
      console.log('📝 Creating agency...')
      const { upsertAgency } = await import('@/lib/queries')
      agencyId = uuid()

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
      console.log('✅ Agency created:', agencyId)

      // Step 3: Create subscription with payment method
      console.log('💰 Creating subscription')
      const subscriptionRes = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: finalCustomerId,
          agencyId: agencyId,
          priceId,
          country: data.country,
          coupon: appliedCoupon?.id,
          paymentMethodId: savedPaymentMethodId || selectedPaymentMethodId,
          trialEnabled: planConfig.trialEnabled && isTrialAccepted,
          trialPeriodDays: planConfig.trialEnabled && isTrialAccepted ? planConfig.trialPeriodDays : undefined,
        }),
      })

      if (!subscriptionRes.ok) {
        throw new Error('Failed to create subscription')
      }

      const subscriptionData = await subscriptionRes.json()
      console.log('✅ Subscription created:', subscriptionData.subscriptionId)

      // Step 4: Redirect to agency
      toast({
        title: 'Success!',
        description: 'Your agency has been created successfully.',
      })
      router.push(`/agency/${agencyId}`)
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



  const applyCoupon = async () => {
    if (!couponCode.trim()) return

    setCouponLoading(true)
    try {
      const response = await fetch('/api/stripe/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode }),
      })

      if (!response.ok) {
        throw new Error('Invalid coupon code')
      }

      const { coupon } = await response.json()
      setAppliedCoupon(coupon)
      toast({
        title: 'Coupon Applied!',
        description: `${coupon.percent_off || coupon.amount_off}% discount applied`,
      })
    } catch (error) {
      toast({
        title: 'Invalid Coupon',
        description: 'The coupon code you entered is not valid.',
        variant: 'destructive',
      })
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
  }

  // Calculate pricing
  const basePrice = parseFloat(planConfig.price.replace(/[^0-9.]/g, ''))
  const discount = appliedCoupon
    ? appliedCoupon.percent_off
      ? (basePrice * appliedCoupon.percent_off) / 100
      : appliedCoupon.amount_off / 100
    : 0
  const subtotal = basePrice
  const total = basePrice - discount

  return (
    <div className="min-h-screen relative overflow-hidden bg-bg-primary text-fg-primary">
      {/* Background (premium: blobs + subtle grid mask) */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-300/25 to-purple-300/25 blur-3xl" />
        <div className="absolute bottom-[-180px] right-[-180px] h-[520px] w-[520px] rounded-full bg-gradient-to-br from-cyan-300/20 to-pink-300/20 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.15] [mask-image:radial-gradient(ellipse_55%_45%_at_50%_0%,#000_55%,transparent_78%)]" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-background to-purple-50/30" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12 relative z-10">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-brand-gradient pb-1">
              Complete Your Subscription
            </h1>
            <p className="text-sm text-fg-tertiary mt-3 font-medium">
              Home / Pricing / <span className="text-fg-primary font-semibold">Checkout</span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/site/pricing')}
            className="hover:bg-accent transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Pricing
          </Button>
        </div>
        <Separator className="my-8 bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left Column - Header + Form */}
          <div className="lg:col-span-2 space-y-4 w-full">


            {/* Step Indicator */}
            <div className="relative bg-card backdrop-blur-sm rounded-2xl p-2 sm:p-4 shadow-[0_8px_30px_hsl(var(--shadow-lg))] border border-border">
              {/* Progress Lines Background */}
              <div className="absolute top-[calc(1.5rem+16px)] left-[8%] right-[8%] flex items-center z-0">
                {steps.slice(0, -1).map((step, index) => (
                  <div key={`line-${index}`} className={`h-1 bg-border rounded-full ${index === 0 ? 'flex-1' : 'flex-1'}`}>
                    <div
                      className={`h-1 rounded-full transition-all duration-500 ${completedSteps.has(step.id) ? 'bg-gradient-to-r from-blue-500 to-blue-600 w-full' : 'w-0'
                        }`}
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
                        onClick={() => isAccessible && goToStep(step.id)}
                        disabled={!isAccessible}
                        className="flex flex-col items-center group cursor-pointer disabled:cursor-not-allowed transition-all duration-300 hover:scale-105"
                      >
                        <div
                          className={`
                         w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-1 transition-all duration-500 bg-card
                        ${isCompleted
                              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-[0_8px_20px_rgba(59,130,246,0.3)]'
                              : isCurrent
                                ? 'bg-gradient-to-br from-primary via-blue-500 to-cyan-500 text-white shadow-[0_10px_30px_rgba(59,130,246,0.4)] scale-110'
                                : 'bg-gradient-to-br from-muted to-muted-foreground/10 text-muted-foreground shadow-sm'
                            }
                      `}
                        >
                          {isCompleted ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <span className="text-base font-semibold">{index + 1}</span>
                          )}
                        </div>
                        <div className="text-center">
                          <div className={cn(
                            'text-sm font-medium transition-colors',
                            isCurrent ? 'text-blue-600' : isCompleted ? 'text-blue-500' : 'text-muted-foreground'
                          )}>
                            {step.label}
                          </div>
                          <div className="text-xs text-muted-foreground hidden sm:block mt-0.5">
                            {step.description}
                          </div>
                        </div>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Main Form */}
            <div className="group relative rounded-2xl p-[1.5px] bg-gradient-to-br from-border/70 via-border/50 to-border/70 transition-all duration-500 shadow-sm">
              <Card className="border-0  card rounded-2xl">
                <CardContent className="pt-6 pb-7 px-6 sm:px-7">
                  <form>
                    {/* Billing Information */}
                    {currentStep === 'billing' && (
                      <div className="space-y-6">
                        <div className="border-l-4 border-primary pl-5">
                          <h2 className="text-2xl font-black text-brand-gradient mb-1 tracking-tight">
                            Account
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Your contact information
                          </p>
                        </div>


                        <div className="grid md:grid-cols-2 gap-5">
                          <div>
                            <Label className="mb-2 block">Full Name *</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                id="firstName"
                                type="text"
                                {...form.register('firstName')}
                                placeholder="First"
                                className="h-10"
                              />
                              <Input
                                id="lastName"
                                type="text"
                                {...form.register('lastName')}
                                placeholder="Last"
                                className="h-10"
                              />
                            </div>
                            {(form.formState.errors.firstName || form.formState.errors.lastName) && (
                              <p className="text-sm text-destructive mt-1">
                                {form.formState.errors.firstName?.message || form.formState.errors.lastName?.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="agencyEmail" className="mb-2 block">Email Address *</Label>
                            <Input
                              id="agencyEmail"
                              type="email"
                              readOnly
                              {...form.register('agencyEmail')}
                              placeholder="john@example.com"
                              className="h-10"
                            />
                            {form.formState.errors.agencyEmail && (
                              <p className="text-sm text-destructive mt-1">
                                {form.formState.errors.agencyEmail.message}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-5">
                          <div>
                            <Label htmlFor="agencyName" className="mb-2 block">
                              Tenant Name *
                            </Label>
                            <Input
                              id="agencyName"
                              {...form.register('agencyName')}
                              placeholder="My Tenant"
                              className="h-10"
                            />
                            {form.formState.errors.agencyName && (
                              <p className="text-sm text-destructive mt-1">
                                {form.formState.errors.agencyName.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="companyPhone" className="mb-2 block">Phone Number*</Label>
                            <PhoneCodeSelector
                              value={phoneNumber}
                              onValueChange={(value, phoneCodeData) => {
                                setPhoneNumber(value)
                                setPhoneCode(phoneCodeData || '')
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

                            {form.formState.errors.companyPhone && (
                              <p className="text-sm text-destructive mt-1">
                                {form.formState.errors.companyPhone.message}
                              </p>
                            )}
                          </div>
                        </div>

                        <Separator className="my-6" />


                        <div className="border-l-4 border-primary pl-5">
                          <h2 className="text-2xl font-black text-brand-gradient mb-1 tracking-tight">
                            Billing
                          </h2>
                          <p className="text-sm text-fg-tertiary">
                            Billing address and tax information
                          </p>
                        </div>


                        <div className="space-y-5 mt-2">
                          <div className="grid md:grid-cols-2 gap-5">
                            <div>
                              <Label htmlFor="companyName" className="mb-2 block">Company Name <span className="text-xs text-fg-tertiary ml-1 font-normal">(Optional)</span></Label>
                              <Input
                                id="companyName"
                                {...form.register('companyName')}
                                placeholder="My Company Ltd."
                                className="h-10"
                              />
                              {form.formState.errors.companyName && (
                                <p className="text-sm text-destructive mt-1">
                                  {form.formState.errors.companyName.message}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label htmlFor="tinNumber" className="mb-2 block">Tax ID <span className="text-xs text-fg-tertiary ml-1 font-normal">(Optional)</span></Label>
                              <Input
                                id="tinNumber"
                                {...form.register('tinNumber')}
                                placeholder="123-45-6789"
                                className="h-10"
                              />
                              {form.formState.errors.tinNumber && (
                                <p className="text-sm text-destructive mt-1">
                                  {form.formState.errors.tinNumber.message}
                                </p>
                              )}
                            </div>


                          </div>

                          {/* Address */}
                          <div>
                            <Label className="mb-2 block">Address *</Label>
                            <div className="grid md:grid-cols-4 gap-2">
                              <Input
                                id="line2"
                                {...form.register('line2')}
                                placeholder="Apt/Suite (Optional)"
                                className="h-10"
                              />
                              <Input
                                id="line1"
                                className="md:col-span-2 h-10"
                                {...form.register('line1')}
                                placeholder="Street Address"
                              />
                              <PostalCodeInput
                                value={form.watch('postalCode')}
                                onValueChange={(value: string) => form.setValue('postalCode', value)}
                                placeholder="Postal Code"
                                countryCode={countryCode}
                                styleVariant="plain"
                              />
                            </div>
                            {(form.formState.errors.line1 || form.formState.errors.postalCode) && (
                              <p className="text-sm text-destructive mt-1">
                                {form.formState.errors.line1?.message || form.formState.errors.postalCode?.message}
                              </p>
                            )}
                          </div>

                          {/* Country, State, City */}
                          <div className="grid md:grid-cols-3 gap-5">

                            <div>
                              <Label htmlFor="country" className="mb-2 block">Country *</Label>
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
                              {form.formState.errors.country && (
                                <p className="text-sm text-destructive mt-1">
                                  {form.formState.errors.country.message}
                                </p>
                              )}
                            </div>


                            <div>
                              <Label htmlFor="state" className="mb-2 block">State/Province *</Label>
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
                              {form.formState.errors.state && (
                                <p className="text-sm text-destructive mt-1">
                                  {form.formState.errors.state.message}
                                </p>
                              )}
                            </div>

                            <div>
                              <Label htmlFor="city" className="mb-2 block">City *</Label>
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
                              {form.formState.errors.city && (
                                <p className="text-sm text-destructive mt-1">
                                  {form.formState.errors.city.message}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="grid md:grid-cols-1 gap-6">
                          </div>
                        </div>

                      </div>
                    )}

                    {/* Payment Step */}
                    {currentStep === 'payment' && (
                      <div className="space-y-6">
                        <div className="border-l-4 border-primary pl-5">
                          <h2 className="text-2xl font-black text-brand-gradient mb-2 tracking-tight">
                            Payment Method
                          </h2>
                          <p className="text-fg-tertiary">
                            {existingPaymentMethods.length > 0
                              ? 'Choose a payment method or add a new card'
                              : 'Securely add your payment information'
                            }
                          </p>
                        </div>

                        {/* Existing Payment Methods */}
                        {existingPaymentMethods.length > 0 && (
                          <div className="space-y-4">
                            {/* <Label className="text-base font-bold text-neutral-900 dark:text-neutral-100">Your Saved Cards</Label> */}

                            <SavedBankCardsGallery
                              compact={true}
                              cards={existingPaymentMethods.map((pm) => ({
                                id: pm.id,
                                cardNumber: `**** **** **** ${pm.card?.last4}`,
                                cardholderName: pm.card?.cardholder_name || 'N/A',
                                expiryMonth: String(pm.card?.exp_month).padStart(2, '0'),
                                expiryYear: String(pm.card?.exp_year),
                                brand: pm.card?.brand,
                                variant:
                                  pm.card?.brand === 'visa' ? 'default' :
                                    pm.card?.brand === 'mastercard' ? 'premium' :
                                      pm.card?.brand === 'amex' ? 'platinum' :
                                        'default',
                                isDefault: pm.card?.isDefault, // TODO: Implement default card logic from Stripe metadata
                              }))}
                              selectedCardId={useExistingPayment && selectedPaymentMethodId ? selectedPaymentMethodId : undefined}
                              onCardSelect={(cardId) => {
                                setUseExistingPayment(true)
                                setSelectedPaymentMethodId(cardId)
                              }}
                              onAddCard={() => {
                                setCardModalMode('add')
                                setCardModalOpen(true)
                              }}
                              onSetDefault={(cardId) => {
                                // TODO: Implement set as default via Stripe API
                                toast({
                                  title: 'Set as Default',
                                  description: 'This feature will be available soon.',
                                })
                              }}
                              onReplaceCard={(cardId) => {
                                setCardToReplace(cardId)
                                setCardModalMode('replace')
                                setCardModalOpen(true)
                              }}
                              onRemoveCard={async (cardId) => {
                                // TODO: Implement remove card via Stripe API
                                toast({
                                  title: 'Remove Card',
                                  description: 'Are you sure? This feature will be available soon.',
                                  variant: 'destructive',
                                })
                              }}
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

                        {/* Stripe Elements for New Card - Now in Modal */}
                        {!useExistingPayment && !savedPaymentMethodId && (
                          <div className="mt-4">
                            <div
                              onClick={() => {
                                setCardModalMode('add')
                                setCardModalOpen(true)
                              }}
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
                          </div>
                        )}

                        {/* Card Addition/Update Modal */}
                        {cardModalOpen && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setCardModalOpen(false)}>
                            <div
                              className="relative bg-card rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Modal Header */}
                              <div className="flex items-start justify-between mb-6">
                                <div>
                                  <h2 className="text-2xl font-bold text-fg-primary">
                                    {cardModalMode === 'add' ? 'Add New Card' : 'Replace Card'}
                                  </h2>
                                  <p className="text-sm text-fg-tertiary mt-1">
                                    Your payment information is securely processed by Stripe
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setCardModalOpen(false)}
                                  className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <X className="h-6 w-6" />
                                </button>
                              </div>

                              {/* Visual Card Preview */}
                              {/* <div className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                  <h3 className="text-sm font-semibold text-fg-secondary">
                                    Card Preview
                                  </h3>
                                  {cardPreview.complete && (
                                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                      <Check className="h-3 w-3" />
                                      Validated
                                    </span>
                                  )}
                                </div>
                                <div className="w-full max-w-sm mx-auto" style={{ aspectRatio: '1.586' }}>
                                  <InteractiveBankCard
                                    cardNumber={cardPreview.last4 ? `•••• •••• •••• ${cardPreview.last4}` : '•••• •••• •••• ••••'}
                                    cardholderName=""
                                    expiryMonth=""
                                    expiryYear=""
                                    cvv=""
                                    brand={cardPreview.brand}
                                    isMasked={true}
                                    isFlipped={cardPreview.isFlipped}
                                    variant="default"
                                    showInputs={false}
                                    showInputValidationErrors={false}
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground text-center mt-2">
                                  Card details will appear after validation for security
                                </p>
                              </div> */}

                              {/* Stripe Elements */}
                              <div className="relative rounded-2xl p-[1.5px] bg-gradient-to-br from-border/60 via-border/40 to-border/60 overflow-hidden shadow-md">
                                <div className="relative overflow-hidden rounded-2xl bg-card p-6">
                                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" />
                                  <div className="absolute inset-0 bg-[radial-gradient(600px_circle_at_50%_0%,rgba(59,130,246,0.03),transparent_60%)]" />

                                  <div className="relative z-10">
                                    <Elements
                                      stripe={stripePromise}
                                      options={{
                                        mode: 'setup',
                                        currency: 'myr',
                                        paymentMethodCreation: 'manual',
                                        appearance: {
                                          variables: {
                                            colorSuccess: 'var(--success-text)',
                                            colorPrimary: 'var(--primary)',
                                            colorBackground: 'linear-gradient(to_br, var(--bg-muted/30), var(--bg-muted/20), var(--bg-muted/10))',
                                            colorText: 'var(--fg-primary)',
                                            colorDanger: 'var(--warning-text)',
                                            fontFamily: 'system-ui, sans-serif',
                                            borderRadius: '0.75rem',
                                            spacingUnit: '4px',
                                          },

                                        },
                                      }}
                                    >
                                      <StripePaymentElement
                                        billingData={savedBillingData}
                                        onPaymentMethodCollected={(paymentMethodId) => {
                                          setSavedPaymentMethodId(paymentMethodId)
                                          setCardModalOpen(false)
                                          if (cardModalMode === 'replace' && cardToReplace) {
                                            // TODO: Implement replace logic - detach old, attach new
                                            toast({
                                              title: 'Card Replaced',
                                              description: 'Your payment method has been updated.',
                                            })
                                          } else {
                                            setUseExistingPayment(false)
                                            toast({
                                              title: 'Card Added',
                                              description: 'Your new payment method is ready to use.',
                                            })
                                          }
                                        }}
                                        onCardChange={(data) => {
                                          setCardPreview({
                                            brand: data.brand,
                                            last4: data.last4,
                                            complete: data.complete,
                                            isFlipped: false,
                                          })
                                        }}
                                      />
                                    </Elements>
                                  </div>
                                </div>
                              </div>

                              {/* Modal Footer */}
                              <div className="mt-6 flex gap-3">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setCardModalOpen(false)}
                                  className="flex-1"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Show success message if payment method already validated */}
                        {!useExistingPayment && savedPaymentMethodId && (
                          <div className="mt-4 relative rounded-2xl p-[1.5px] bg-gradient-to-br from-green-400/60 via-green-300/40 to-green-400/60 overflow-hidden shadow-lg">
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 p-5">
                              {/* Subtle top glow */}
                              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-300/60 to-transparent" />
                              {/* Success glow */}
                              <div className="absolute inset-0 bg-[radial-gradient(400px_circle_at_50%_0%,rgba(34,197,94,0.08),transparent_60%)]" />

                              <div className="relative z-10 flex items-center gap-4">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-lg shadow-green-500/20">
                                  <Check className="h-7 w-7 text-white" strokeWidth={3} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-lg text-green-900">
                                    Payment Method Validated
                                  </p>
                                  <p className="text-sm text-green-700 mt-0.5">
                                    Your new card has been successfully validated and is ready to use
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSavedPaymentMethodId(null)
                                    console.log('🔄 Resetting payment method')
                                  }}
                                  className="flex-shrink-0 bg-gradient-to-br from-green-600 via-emerald-500 to-emerald-500 text-white transition-colors"
                                >
                                  Change Card
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Review Step */}
                    {currentStep === 'review' && (
                      <div className="space-y-6">
                        <div className="border-l-4 border-primary pl-5">
                          <h2 className="text-2xl font-black text-brand-gradient mb-2 tracking-tight">
                            Review & Confirm
                          </h2>
                          <p className="text-fg-tertiary">
                            Please review your information before confirming your subscription
                          </p>
                        </div>

                        {/* Billing Information Summary */}
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                              <Check className="h-5 w-5 text-green-500" />
                              Billing Information
                            </h3>
                            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Name</p>
                                  <p className="font-medium">
                                    {savedBillingData?.firstName} {savedBillingData?.lastName}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Email</p>
                                  <p className="font-medium">{savedBillingData?.agencyEmail}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Phone</p>
                                  <p className="font-medium">{savedBillingData?.phoneCode} {savedBillingData?.companyPhone}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Tenant Name</p>
                                  <p className="font-medium">{savedBillingData?.agencyName}</p>
                                </div>
                              </div>
                              {savedBillingData?.companyName && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Company</p>
                                  <p className="font-medium">{savedBillingData.companyName}</p>
                                </div>
                              )}
                              <Separator className="my-2" />
                              <div>
                                <p className="text-sm text-muted-foreground">Address</p>
                                <p className="font-medium">
                                  {savedBillingData?.line1}
                                  {savedBillingData?.line2 && `, ${savedBillingData.line2}`}
                                </p>
                                <p className="font-medium">
                                  {savedBillingData?.city}, {savedBillingData?.state} {savedBillingData?.postalCode}
                                </p>
                                <p className="font-medium">{savedBillingData?.country}</p>
                              </div>
                            </div>
                          </div>

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
                                    const pm = existingPaymentMethods.find(m => m.id === selectedPaymentMethodId)
                                    return pm ? (
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                          <span className="text-blue-600 font-semibold">
                                            {pm.card?.brand?.charAt(0).toUpperCase()}
                                          </span>
                                        </div>
                                        <div>
                                          <p className="font-medium capitalize">
                                            {pm.card?.brand} •••• {pm.card?.last4}
                                          </p>
                                          <p className="text-sm text-muted-foreground">
                                            Expires {pm.card?.exp_month}/{pm.card?.exp_year}
                                          </p>
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

                          {/* Subscription Summary */}
                          <div>
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                              <Check className="h-5 w-5 text-green-500" />
                              Subscription
                            </h3>
                            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold text-lg">{planConfig.title}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {planConfig.duration === 'month' ? 'Monthly' : 'Yearly'} subscription
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-xl">{planConfig.price}</p>
                                  <p className="text-sm text-muted-foreground">per {planConfig.duration}</p>
                                </div>
                              </div>

                              <Separator />

                              <div className="flex justify-between items-center">
                                <p className="font-semibold">Total Due Today</p>
                                <p className="font-bold text-xl text-blue-600">
                                  {isTrialAccepted ? 'RM 0.00' : `$${planConfig.price}`}
                                </p>
                              </div>

                              {isTrialAccepted ? (
                                <div className="bg-blue-50 rounded-lg p-3 mt-3">
                                  <p className="text-sm text-blue-700">
                                    💡 Your {planConfig.trialPeriodDays}-day free trial starts today. You'll be charged RM {planConfig.price} after your trial ends on the same day each {planConfig.duration}.
                                    You can cancel anytime from your account settings.
                                  </p>
                                </div>
                              ) : (
                                <div className="bg-blue-50 rounded-lg p-3 mt-3">
                                  <p className="text-sm text-blue-700">
                                    💡 Your subscription will automatically renew on the same day each {planConfig.duration}.
                                    You can cancel anytime from your account settings.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Confirm & Pay Button */}
                        <div className="flex gap-3 mt-7 pt-5 border-t border-border">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={prevStep}
                            className="border-border hover:bg-muted/50 h-11 transition-all duration-300"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Back
                          </Button>
                          <Button
                            type="button"
                            className="btn-brand-gradient shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] h-11"
                            onClick={processCheckout}
                            disabled={showLoader || (!useExistingPayment && !savedPaymentMethodId) || (useExistingPayment && !selectedPaymentMethodId)}
                          >
                            🔒 Confirm & Pay {isTrialAccepted ? 'RM 0.00' : `$${planConfig.price}`}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Navigation Buttons */}
                    {currentStep !== 'review' && (
                      <div className="flex gap-3 mt-7 pt-5 border-t border-border">
                        {currentStepIndex > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={prevStep}
                            className="border-border hover:bg-muted/50 h-11 transition-all duration-300"
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Back
                          </Button>
                        )}
                        <Button
                          type="button"
                          className="btn-brand-gradient h-11"
                          onClick={nextStep}
                          disabled={isLoading || (currentStep === 'payment' && !useExistingPayment && !savedPaymentMethodId) || (currentStep === 'payment' && useExistingPayment && !selectedPaymentMethodId)}
                        >
                          {currentStep === 'billing' ? 'Continue to Payment →' : 'Continue to Review →'}
                        </Button>
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 rounded-2xl p-[2px] bg-gradient-to-br from-border/50 via-border/30 to-border/50 shadow-md transition-all duration-500 hover:shadow-lg">
              <Card className="border-0 bg-card/95 backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(0,0,0,0.03)] rounded-2xl overflow-hidden relative">
                {/* Premium glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-muted/5 via-transparent to-muted/5 pointer-events-none" />
                <CardHeader className="relative bg-gradient-to-br from-accent-base/8 via-accent-base/5 to-transparent border-b border-line-secondary pb-5">
                  <CardTitle className="text-2xl font-black text-brand-gradient tracking-tight">Order Summary</CardTitle>
                  <CardDescription className="text-fg-tertiary font-medium mt-1.5">Review your subscription details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6 relative">
                  {/* Plan Details */}
                  <div className="relative bg-card backdrop-blur-sm border border-border rounded-xl p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:border-border">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-fg-primary">{planConfig.title} Plan</h3>
                        <p className="text-sm text-fg-secondary">Monthly subscription</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-fg-primary text-lg">
                          {planConfig.price}
                          <span className="text-xs text-fg-secondary ml-1">/ {planConfig.duration}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isTrialAccepted && (
                    <div className="relative overflow-hidden bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 text-white px-4 py-3 rounded-xl text-sm font-bold shadow-[0_4px_20px_rgba(59,130,246,0.4)] group">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      <div className="relative flex items-center gap-2">
                        <span className='text-xl'>🎁</span>
                        <span className="tracking-wide">{planConfig.trialPeriodDays}-day free trial included</span>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Features */}
                  <div>
                    <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-fg-primary">What's included</h4>
                    <ul className="space-y-3">
                      {planConfig.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm group">
                          <div className="flex-shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/10 border border-primary/30 mt-0.5 transition-all duration-300 group-hover:scale-110 group-hover:shadow-sm group-hover:shadow-primary/20">
                            <Check className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
                          </div>
                          <span className="text-fg-secondary leading-relaxed font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Separator className="bg-blue-100" />

                  {/* Coupon Code */}
                  <div>
                    <Label htmlFor="coupon" className="text-sm font-bold mb-3 block text-fg-primary uppercase tracking-wider">
                      Promo Code
                    </Label>
                    {!appliedCoupon ? (
                      <div className="flex gap-2">
                        <Input
                          id="coupon"
                          placeholder="Enter code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          disabled={couponLoading}
                          className="focus:ring-primary/30"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={applyCoupon}
                          disabled={!couponCode.trim() || couponLoading}
                          className="hover:bg-accent"
                        >
                          {couponLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Tag className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 border border-success/30 rounded-xl px-4 py-3.5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-success/50">
                        <div className="flex items-center gap-2.5">
                          <div className="bg-gradient-to-br from-green-100 to-emerald-100 rounded-full p-1.5 shadow-sm">
                            <Tag className="h-3.5 w-3.5 text-green-600" />
                          </div>
                          <span className="text-sm font-bold text-green-700 tracking-wide">
                            {appliedCoupon.id}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeCoupon}
                          className="h-8 text-xs font-semibold text-success-foreground hover:bg-success/10 transition-all duration-300 hover:scale-105"
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>

                  <Separator className="bg-blue-100" />

                  {/* Price Breakdown */}
                  <div className="space-y-3 bg-muted/50 rounded-lg p-4 border border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-fg-tertiary">Subtotal</span>
                      <span className="font-medium text-fg-primary">RM {subtotal.toFixed(2)}</span>
                    </div>

                    {appliedCoupon && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600 font-medium">Discount ({appliedCoupon.percent_off || ''}%)</span>
                        <span className="text-green-600 font-semibold">- RM {discount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-md font-bold pt-1">
                      <span className="text-fg-primary">Total</span>
                      <span className="font-medium text-fg-primary">RM {total.toFixed(2)}</span>
                    </div>

                    <Separator className="bg-border" />

                    {isTrialAccepted && (
                      <div className="flex justify-between text-lg font-bold pt-1">
                        <span className="text-primary">Pay Now</span>
                        <span className="text-primary">RM 0.00</span>
                      </div>

                    )}

                    {isTrialAccepted && (
                      <p className="text-xs text-fg-secondary bg-primary/5 rounded-lg p-3 border border-primary/20 font-medium">
                        💡 You'll be charged RM {total.toFixed(2)} after your {planConfig.trialPeriodDays}
                        -day trial ends
                      </p>
                    )}
                  </div>

                  {/* Security Badge */}
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4 border-t border-border bg-muted/30 -mx-6 px-6 pb-6 -mb-6 rounded-b-lg">
                    <svg
                      className="h-5 w-5 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
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
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Step Loader */}
      <MultiStepLoader loadingStates={loadingStates} loading={showLoader} duration={2000} loop={false} />
    </div>
  )
}
