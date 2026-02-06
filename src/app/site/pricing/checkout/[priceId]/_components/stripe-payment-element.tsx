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
  onCardChange?: (data: { brand: string; last4: string; complete: boolean }) => void
}

export function StripePaymentElement({ billingData, onPaymentMethodCollected, onCardChange }: Props) {
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
        
        // Update card preview with actual data from payment method
        if (paymentMethod.card) {
          onCardChange?.({
            brand: paymentMethod.card.brand || 'visa',
            last4: paymentMethod.card.last4 || '',
            complete: true,
          })
        }
        
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
    <div className="space-y-5">
      <div className="border-l-4 border-accent-base pl-5 mb-5">
        <h3 className="text-xl font-black text-brand-gradient tracking-tight">
          Card Information
        </h3>
        <p className="text-sm text-fg-secondary mt-1">Enter your card details securely</p>
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
        onChange={(event) => {
          // Update card preview when user types
          if (event.value.type === 'card' && event.complete) {
            onCardChange?.({
              brand: 'visa', // Stripe doesn't expose this in onChange, will get it after validation
              last4: '',
              complete: event.complete,
            })
          }
        }}
      />
      
      <Button
        type="button"
        onClick={handleValidateCard}
        disabled={!stripe || isValidating || isValidated}
        className={cn(
          "w-full h-12 font-bold transition-all duration-300",
          isValidated
            ? "bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-[0_8px_30px_rgba(34,197,94,0.3)] hover:shadow-[0_12px_40px_rgba(34,197,94,0.4)]"
            : "bg-brand-gradient hover:bg-brand-gradient-hover text-white border border-brand-border hover:scale-[1.01] active:scale-[0.99]"
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
        <div className="bg-destructive/10 border border-destructive rounded-lg p-3">
          <p className="text-sm text-destructive font-medium">{error}</p>
        </div>
      )}
      {isValidated && (
        <div className="bg-[hsl(var(--success-bg))] border border-[hsl(var(--success-border))] rounded-lg p-3">
          <p className="text-sm text-[hsl(var(--success-text))] font-medium">
            ✓ Payment method validated successfully
          </p>
        </div>
      )}
      <p className="text-xs text-fg-tertiary">
        Your payment information is securely processed by Stripe. We never store your card details.
      </p>
    </div>
  )
}