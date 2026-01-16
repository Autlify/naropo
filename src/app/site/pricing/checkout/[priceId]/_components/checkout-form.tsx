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
import { Loader2, Check, ChevronLeft, Tag, MoreVertical, Trash2 } from 'lucide-react'
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
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

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
      brand: string
      last4: string
      exp_month: number
      exp_year: number
    } | null
  }[]
}

type Step = 'billing' | 'payment' | 'review' | 'processing'

const steps: { id: Step; label: string; description: string }[] = [
  { id: 'billing', label: 'Billing', description: 'Billing information' },
  { id: 'payment', label: 'Payment', description: 'Payment method' },
  { id: 'review', label: 'Review', description: 'Review & Confirm' },
  { id: 'processing', label: 'Processing', description: 'Creating your agency' },
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
        if (existingCustomer.address.line1) form.setValue('line1', existingCustomer.address.line1)
        if (existingCustomer.address.line2) form.setValue('line2', existingCustomer.address.line2 || '')
        if (existingCustomer.address.city) {
          form.setValue('city', existingCustomer.address.city)
          setCity(existingCustomer.address.city)
        }
        if (existingCustomer.address.state) {
          form.setValue('state', existingCustomer.address.state)
          setStateCode(existingCustomer.address.state)
        }
        if (existingCustomer.address.postal_code) form.setValue('postalCode', existingCustomer.address.postal_code)
        if (existingCustomer.address.country) {
          form.setValue('country', existingCustomer.address.country)
          setCountryCode(existingCustomer.address.country)
        }
      }

      // Pre-fill user details from metadata
      if (metadata.agencyName) form.setValue('agencyName', metadata.agencyName)
      if (metadata.companyName) form.setValue('companyName', metadata.companyName)
      if (metadata.tinNumber) form.setValue('tinNumber', metadata.tinNumber)

      // Pre-fill phone
      if (existingCustomer.phone) {
        // Extract phone code and number
        const phoneMatch = existingCustomer.phone.match(/^(\+\d+)(.*)$/)
        if (phoneMatch) {
          setPhoneCode(phoneMatch[1])
          form.setValue('phoneCode', phoneMatch[1])
          setPhoneNumber(phoneMatch[2].trim())
          form.setValue('companyPhone', phoneMatch[2].trim())
        } else {
          setPhoneNumber(existingCustomer.phone)
          form.setValue('companyPhone', existingCustomer.phone)
        }
      }

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
      processing: [],
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
      setCurrentStep('processing')
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
            }),
          })

          if (!customerResponse.ok) {
            const error = await customerResponse.json()
            throw new Error(error.error || 'Failed to create customer')
          }

          const customerData: { customerId: string } = await customerResponse.json()
          finalCustomerId = customerData.customerId
          setCustomerId(finalCustomerId)
          console.log('\u2705 New customer created:', finalCustomerId)

          // Update user with customerId
          await fetch('/api/user/update-customer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, customerId: finalCustomerId }),
          })
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
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process checkout',
        variant: 'destructive',
      })
      setCurrentStep('review')
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Background (premium: blobs + subtle grid mask) */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-300/20 to-purple-300/20 blur-3xl dark:from-blue-600/10 dark:to-purple-600/10" />
        <div className="absolute bottom-[-180px] right-[-180px] h-[520px] w-[520px] rounded-full bg-gradient-to-br from-cyan-300/15 to-pink-300/15 blur-3xl dark:from-cyan-600/10 dark:to-pink-600/10" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.22] [mask-image:radial-gradient(ellipse_55%_45%_at_50%_0%,#000_55%,transparent_78%)]" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-background to-purple-50/20 dark:from-slate-900/50 dark:via-background dark:to-purple-950/30" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12 relative z-10">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              Complete Your Subscription
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Home / Pricing / <span className="text-foreground">Checkout</span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/site/pricing')}
            className="hover:bg-blue-50 dark:hover:bg-blue-950/50"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Pricing
          </Button>
        </div>
        <Separator className="my-6" />

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left Column - Header + Form */}
          <div className="lg:col-span-2 space-y-4 w-full">


            {/* Step Indicator */}
            <div className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm rounded-2xl p-5 sm:p-6 shadow-sm border border-border/60">
              {/* Progress Lines Background */}
              <div className="absolute top-[calc(1.5rem+24px)] left-[8%] right-[8%] flex items-center z-0">
                {steps.slice(0, -1).map((step, index) => (
                  <div key={`line-${index}`} className={`h-1 bg-gray-200 dark:bg-slate-700 rounded-full ${index === 0 ? 'flex-1' : 'flex-1'}`}>
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
                        className="flex flex-col items-center group cursor-pointer disabled:cursor-not-allowed transition-all hover:scale-105"
                      >
                        <div
                          className={`
                        w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mb-2 transition-all duration-300 shadow-md bg-white dark:bg-slate-900
                        ${isCompleted
                              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-200 dark:shadow-blue-900/50'
                              : isCurrent
                                ? 'bg-gradient-to-br from-blue-400 to-cyan-400 text-white shadow-blue-300 dark:shadow-blue-800/50 scale-110'
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 shadow-none'
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
                            isCurrent ? 'text-blue-600 dark:text-blue-400' : isCompleted ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                          )}>
                            {step.label}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block mt-0.5">
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
            <Card className="border border-border/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-sm">
              <CardContent className="pt-5 pb-6 px-5 sm:px-6">
                <form>
                  {/* Billing Information */}
                  {currentStep === 'billing' && (
                    <div className="space-y-6">
                      <div className="border-l-4 border-blue-500 dark:border-blue-400 pl-4">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent mb-1">
                          Account
                        </h2>
                        {/* <p className="text-sm text-gray-600 dark:text-gray-400">
                          Your contact information
                        </p> */}
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


                      <div className="border-l-4 border-blue-500 dark:border-blue-400 pl-4">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent mb-1">
                          Billing
                        </h2>
                        {/* <p className="text-sm text-gray-600 dark:text-gray-400">
                          Billing address and tax information
                        </p> */}
                      </div>


                      <div className="space-y-5 mt-2">
                        <div className="grid md:grid-cols-2 gap-5">
                          <div>
                            <Label htmlFor="companyName" className="mb-2 block">Company Name <span className="text-xs text-muted-foreground ml-1">(Optional)</span></Label>
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
                            <Label htmlFor="tinNumber" className="mb-2 block">Tax ID <span className="text-xs text-muted-foreground ml-1">(Optional)</span></Label>
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
                      <div className="border-l-4 border-blue-500 dark:border-blue-400 pl-4">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent mb-2">
                          Payment Method
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                          {existingPaymentMethods.length > 0
                            ? 'Choose a payment method or add a new card'
                            : 'Securely add your payment information'
                          }
                        </p>
                      </div>

                      {/* Existing Payment Methods */}
                      {existingPaymentMethods.length > 0 && (
                        <div className="space-y-3">
                          <Label className="text-base font-semibold">Your Saved Cards</Label>
                          <div className="grid gap-3">
                            {existingPaymentMethods.map((pm) => {
                              const isSelected = useExistingPayment && selectedPaymentMethodId === pm.id
                              const brandColor = pm.card?.brand === 'visa' ? 'from-blue-600 to-blue-700' : pm.card?.brand === 'mastercard' ? 'from-orange-600 to-red-600' : 'from-gray-600 to-gray-700'

                              return (
                                <div
                                  key={pm.id}
                                  onClick={() => {
                                    setUseExistingPayment(true)
                                    setSelectedPaymentMethodId(pm.id)
                                  }}
                                  className={cn(
                                    "relative group cursor-pointer transition-all rounded-xl overflow-hidden",
                                    isSelected ? "ring-2 ring-blue-500 shadow-lg" : "hover:shadow-md"
                                  )}
                                >
                                  <div className={cn(
                                    "bg-gradient-to-br p-4",
                                    brandColor
                                  )}>
                                    <div className="flex items-start justify-between mb-8">
                                      <div className="flex items-center gap-2">
                                        <div className={cn(
                                          "w-5 h-5 rounded-full border-2 flex items-center justify-center bg-white/20 backdrop-blur-sm",
                                          isSelected ? "border-white" : "border-white/60"
                                        )}>
                                          {isSelected && (
                                            <div className="w-3 h-3 rounded-full bg-white" />
                                          )}
                                        </div>
                                        <span className="text-xs font-medium text-white/80 uppercase tracking-wider">
                                          Card Number
                                        </span>
                                      </div>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-white hover:bg-white/20"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            <MoreVertical className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                          <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation()
                                            // TODO: Implement set as default
                                            toast({ title: 'Set as default - Coming soon' })
                                          }}>
                                            <Check className="mr-2 h-4 w-4" />
                                            Set as Default
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation()
                                            // TODO: Implement delete card
                                            toast({ title: 'Delete card - Coming soon', variant: 'destructive' })
                                          }}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Card
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                    <div className="space-y-4">
                                      <div className="flex items-center justify-between">
                                        <span className="text-2xl font-bold text-white tracking-widest">
                                          •••• •••• •••• {pm.card?.last4}
                                        </span>
                                      </div>
                                      <div className="flex items-end justify-between">
                                        <div>
                                          <p className="text-xs text-white/60 uppercase tracking-wider mb-1">Card Holder</p>
                                          <p className="text-sm font-semibold text-white capitalize">
                                            {user.name || 'Cardholder'}
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-xs text-white/60 uppercase tracking-wider mb-1">Valid Thru</p>
                                          <p className="text-sm font-semibold text-white">
                                            {String(pm.card?.exp_month).padStart(2, '0')}/{String(pm.card?.exp_year).slice(-2)}
                                          </p>
                                        </div>
                                        <div className="bg-white/20 backdrop-blur-sm rounded px-3 py-1">
                                          <span className="text-xs font-bold text-white uppercase">
                                            {pm.card?.brand}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t border-gray-200 dark:border-gray-700" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                              <span className="bg-white dark:bg-slate-900 px-2 text-muted-foreground">
                                Or add new card
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* New Payment Method Option - Only show if user has existing cards */}
                      {existingPaymentMethods.length > 0 && (
                        <div
                          onClick={() => setUseExistingPayment(false)}
                          className={cn(
                            "p-4 border-2 rounded-lg cursor-pointer transition-all",
                            !useExistingPayment
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                              !useExistingPayment
                                ? "border-blue-500"
                                : "border-gray-300 dark:border-gray-600"
                            )}>
                              {!useExistingPayment && (
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                              )}
                            </div>
                            <span className="font-medium">Add a new card</span>
                          </div>
                        </div>
                      )}

                      {/* Stripe Elements for New Card */}
                      {!useExistingPayment && !savedPaymentMethodId && (
                        <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-slate-800/50">
                          <Elements
                            stripe={stripePromise}
                            options={{
                              mode: 'setup',
                              currency: 'usd',
                              paymentMethodCreation: 'manual',
                              appearance: {
                                theme: typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'stripe',
                                variables: {
                                  colorPrimary: '#3b82f6',
                                  colorBackground: typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#0f172a' : '#ffffff',
                                  colorText: typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? '#f1f5f9' : '#0f172a',
                                  colorDanger: '#ef4444',
                                  fontFamily: 'system-ui, sans-serif',
                                  borderRadius: '0.5rem',
                                },
                              },
                            }}
                          >
                            <StripePaymentElement
                              billingData={savedBillingData}
                              onPaymentMethodCollected={(paymentMethodId) => {
                                setSavedPaymentMethodId(paymentMethodId)
                                console.log('💳 Payment method collected:', paymentMethodId)
                              }}
                            />
                          </Elements>
                        </div>
                      )}

                      {/* Show success message if payment method already validated */}
                      {!useExistingPayment && savedPaymentMethodId && (
                        <div className="mt-4 p-4 border-2 border-green-500 dark:border-green-600 rounded-lg bg-green-50 dark:bg-green-950/20">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-green-900 dark:text-green-100">
                                Payment Method Validated
                              </p>
                              <p className="text-sm text-green-700 dark:text-green-300">
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
                              className="border-green-600 dark:border-green-500 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30"
                            >
                              Change Card
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Review Step */}
                  {currentStep === 'review' && (
                    <div className="space-y-6">
                      <div className="border-l-4 border-blue-500 dark:border-blue-400 pl-4">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent mb-2">
                          Review & Confirm
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
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
                          <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-2">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                                <p className="font-medium">
                                  {savedBillingData?.firstName} {savedBillingData?.lastName}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                                <p className="font-medium">{savedBillingData?.agencyEmail}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                                <p className="font-medium">{savedBillingData?.phoneCode} {savedBillingData?.companyPhone}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Tenant Name</p>
                                <p className="font-medium">{savedBillingData?.agencyName}</p>
                              </div>
                            </div>
                            {savedBillingData?.companyName && (
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Company</p>
                                <p className="font-medium">{savedBillingData.companyName}</p>
                              </div>
                            )}
                            <Separator className="my-2" />
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
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
                          <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4">
                            {useExistingPayment && selectedPaymentMethodId ? (
                              <div>
                                {(() => {
                                  const pm = existingPaymentMethods.find(m => m.id === selectedPaymentMethodId)
                                  return pm ? (
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                          {pm.card?.brand?.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <div>
                                        <p className="font-medium capitalize">
                                          {pm.card?.brand} •••• {pm.card?.last4}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
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
                              <p className="text-amber-600 dark:text-amber-400">No payment method selected</p>
                            )}
                          </div>
                        </div>

                        {/* Subscription Summary */}
                        <div>
                          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            <Check className="h-5 w-5 text-green-500" />
                            Subscription
                          </h3>
                          <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-semibold text-lg">{planConfig.title}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {planConfig.duration === 'month' ? 'Monthly' : 'Yearly'} subscription
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-xl">{planConfig.price}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">per {planConfig.duration}</p>
                              </div>
                            </div>

                            <Separator />

                            <div className="flex justify-between items-center">
                              <p className="font-semibold">Total Due Today</p>
                              <p className="font-bold text-xl text-blue-600 dark:text-blue-400">
                                {isTrialAccepted ? 'RM 0.00' : `$${planConfig.price}`}
                              </p>
                            </div>

                            {isTrialAccepted ? (
                              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 mt-3">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                  💡 Your {planConfig.trialPeriodDays}-day free trial starts today. You'll be charged RM {planConfig.price} after your trial ends on the same day each {planConfig.duration}.
                                  You can cancel anytime from your account settings.
                                </p>
                              </div>
                            ) : (
                              <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 mt-3">
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                  💡 Your subscription will automatically renew on the same day each {planConfig.duration}.
                                  You can cancel anytime from your account settings.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Confirm & Pay Button */}
                      <div className="flex gap-4 mt-6 pt-4 border-t border-blue-100 dark:border-blue-900/50">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={prevStep}
                          className="border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Back to Payment
                        </Button>
                        <Button
                          type="button"
                          className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg h-11"
                          onClick={processCheckout}
                          disabled={isLoading || (!useExistingPayment && !savedPaymentMethodId) || (useExistingPayment && !selectedPaymentMethodId)}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Processing Payment...
                            </>
                          ) : (
                            <>
                              🔒 Confirm & Pay {isTrialAccepted ? 'RM 0.00' : `$${planConfig.price}`}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Processing Step */}
                  {currentStep === 'processing' && (
                    <div className="space-y-6 py-12 text-center">
                      <div className="flex justify-center">
                        <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold mb-2">Processing Your Subscription</h2>
                        <p className="text-gray-600 dark:text-gray-400">
                          Please wait while we set up your account...
                        </p>
                      </div>
                      <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                        <p>✓ Verifying payment method</p>
                        <p>✓ Creating your subscription</p>
                        <p>✓ Setting up your agency</p>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  {currentStep !== 'processing' && currentStep !== 'review' && (
                    <div className="flex gap-3 mt-6 pt-4 border-t border-blue-100 dark:border-blue-900/50">
                      {currentStepIndex > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={prevStep}
                          className="border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:border-blue-300 dark:hover:border-blue-700 h-10"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Back
                        </Button>
                      )}
                      <Button
                        type="button"
                        className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-200 dark:shadow-blue-950/50 hover:shadow-xl hover:shadow-blue-300 dark:hover:shadow-blue-900/50 transition-all h-11"
                        onClick={nextStep}
                        disabled={isLoading || (currentStep === 'payment' && !useExistingPayment && !savedPaymentMethodId) || (currentStep === 'payment' && useExistingPayment && !selectedPaymentMethodId)}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : currentStep === 'billing' ? (
                          'Continue to Payment →'
                        ) : currentStep === 'payment' ? (
                          'Continue to Review →'
                        ) : (
                          'Continue →'
                        )}
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-6 border border-border/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm shadow-sm">
              <CardHeader className="bg-blue-50/50 dark:bg-slate-800/40 border-b border-border/60">
                <CardTitle className="text-blue-900 dark:text-blue-50">Order Summary</CardTitle>
                <CardDescription className="text-blue-700 dark:text-blue-200">Review your subscription details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {/* Plan Details */}
                <div className="bg-background dark:bg-slate-800/40 dark:border dark:border-blue-900/30 rounded-xl p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-blue-900 dark:text-blue-50">{planConfig.title} Plan</h3>
                      <p className="text-sm text-blue-600 dark:text-blue-200">Monthly subscription</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-900 dark:text-blue-50 text-lg">
                        {planConfig.price}
                        <span className="text-xs text-blue-600 dark:text-blue-200 ml-1">/ {planConfig.duration}</span>
                      </div>
                    </div>
                  </div>

                  {isTrialAccepted && (
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-md">
                      <span className='text-lg mr-2'>🎁</span> {planConfig.trialPeriodDays}-day free trial included
                    </div>
                  )}
                </div>

                <Separator className="dark:bg-blue-900/30" />

                {/* Features */}
                <div>
                  <h4 className="font-semibold mb-2 text-sm text-blue-900 dark:text-blue-50">What's included:</h4>
                  <ul className="space-y-1.5">
                    {planConfig.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className="bg-blue-100 dark:bg-blue-900/40 rounded-full p-0.5 mt-0.5">
                          <Check className="h-3 w-3 text-blue-600 dark:text-blue-200 flex-shrink-0" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-200">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator className="bg-blue-100 dark:bg-blue-900/50" />

                {/* Coupon Code */}
                <div>
                  <Label htmlFor="coupon" className="text-sm font-semibold mb-2 block text-blue-900 dark:text-blue-50">
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
                        className="border-blue-200 dark:border-blue-800 focus:border-blue-400 dark:focus:border-blue-600 focus:ring-blue-400 dark:focus:ring-blue-600"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={applyCoupon}
                        disabled={!couponCode.trim() || couponLoading}
                        className="border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:border-blue-300 dark:hover:border-blue-700 text-blue-600 dark:text-blue-300"
                      >
                        {couponLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Tag className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="bg-green-100 dark:bg-green-900/50 rounded-full p-1">
                          <Tag className="h-3.5 w-3.5 text-green-600 dark:text-green-300" />
                        </div>
                        <span className="text-sm font-semibold text-green-700 dark:text-green-200">
                          {appliedCoupon.id}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeCoupon}
                        className="h-7 text-xs text-green-700 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900/50"
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>

                <Separator className="bg-blue-100 dark:bg-blue-900/30" />

                {/* Price Breakdown */}
                <div className="space-y-3 bg-gray-50 dark:bg-slate-800/40 rounded-lg p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Subtotal</span>
                    <span className="font-medium text-gray-900 dark:text-gray-50">RM {subtotal.toFixed(2)}</span>
                  </div>

                  {appliedCoupon && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600 dark:text-green-300 font-medium">Discount ({appliedCoupon.percent_off || ''}%)</span>
                      <span className="text-green-600 dark:text-green-300 font-semibold">- RM {discount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-md font-bold pt-1">
                    <span className="text-blue-900 dark:text-blue-50">Total</span>
                    <span className="font-medium text-gray-900 dark:text-gray-50">RM {total.toFixed(2)}</span>
                  </div>

                  <Separator className="bg-blue-100 dark:bg-blue-900/30" />

                  {isTrialAccepted && (
                    <div className="flex justify-between text-lg font-bold pt-1">
                      <span className="text-blue-600 dark:text-blue-300">Pay Now</span>
                      <span className="text-blue-600 dark:text-blue-300">RM 0.00</span>
                    </div>

                  )}

                  {isTrialAccepted && (
                    <p className="text-xs text-gray-500 dark:text-gray-300 bg-blue-50 dark:bg-blue-950/20 rounded p-2 border border-blue-100 dark:border-blue-900/30">
                      💡 You'll be charged RM {total.toFixed(2)} after your {planConfig.trialPeriodDays}
                      -day trial ends
                    </p>
                  )}
                </div>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-300 pt-4 border-t border-blue-100 dark:border-blue-900/30 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-slate-800/20 dark:to-slate-800/20 -mx-6 px-6 pb-6 -mb-6 rounded-b-lg">
                  <svg
                    className="h-5 w-5 text-blue-600 dark:text-blue-300"
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
  )
}
