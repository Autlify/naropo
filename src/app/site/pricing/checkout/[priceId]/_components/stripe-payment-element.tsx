'use client'

import { useState } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  billingData: any
  onPaymentMethodCollected: (paymentMethodId: string) => void
}

export function StripePaymentElement({ billingData, onPaymentMethodCollected }: Props) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isValidated, setIsValidated] = useState(false)

  const handleValidateCard = async () => {
    if (!stripe || !elements) {
      setError('Stripe is not loaded yet. Please wait.')
      return
    }

    setIsValidating(true)
    setError(null)

    try {
      // Submit the elements first (required by Stripe)
      const { error: submitError } = await elements.submit()
      
      if (submitError) {
        setError(submitError.message || 'Failed to validate payment details')
        setIsValidated(false)
        return
      }

      // Create payment method without a customer or SetupIntent
      const { error: createError, paymentMethod } = await stripe.createPaymentMethod({
        elements,
      })

      if (createError) {
        setError(createError.message || 'Failed to validate payment method')
        setIsValidated(false)
        return
      }

      if (paymentMethod?.id) {
        console.log('💳 Payment method created:', paymentMethod.id)
        onPaymentMethodCollected(paymentMethod.id)
        setIsValidated(true)
        setError(null)
      }
    } catch (err) {
      console.error('Error collecting payment method:', err)
      setError('Failed to validate payment method')
      setIsValidated(false)
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 mb-4">
        <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
          Card Information
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Enter your card details securely</p>
      </div>
      <PaymentElement 
        options={{
          layout: 'tabs',
          defaultValues: {
            billingDetails: {
              name: billingData ? `${billingData.firstName} ${billingData.lastName}` : undefined,
              email: billingData?.agencyEmail,
              phone: billingData?.companyPhone ? `${billingData.phoneCode || ''}${billingData.companyPhone}` : undefined,
              address: {
                line1: billingData?.line1,
                line2: billingData?.line2,
                city: billingData?.city,
                state: billingData?.state,
                postal_code: billingData?.postalCode,
                country: billingData?.countryCode,
              },
            },
          },
        }}
      />
      
      <Button
        type="button"
        onClick={handleValidateCard}
        disabled={!stripe || isValidating || isValidated}
        className={cn(
          "w-full shadow-lg transition-all",
          isValidated
            ? "bg-green-500 hover:bg-green-600 text-white"
            : "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-blue-200 dark:shadow-blue-950/50"
        )}
      >
        {isValidating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Validating Card...
          </>
        ) : isValidated ? (
          <>
            ✓ Card Validated
          </>
        ) : (
          'Validate Card'
        )}
      </Button>

      {error && (
        <p className="text-sm text-destructive mt-2">{error}</p>
      )}
      {isValidated && (
        <p className="text-sm text-green-600 dark:text-green-400 mt-2">
          ✓ Payment method validated successfully
        </p>
      )}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Your payment information is securely processed by Stripe. We never store your card details.
      </p>
    </div>
  )
}
