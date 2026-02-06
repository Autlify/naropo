'use client'

import { useState } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
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
  const [isReady, setIsReady] = useState(false)

  const handleValidateCard = async () => {
    if (!stripe) {
      setError('Stripe is not loaded yet. Please wait a moment and try again.')
      return
    }
    
    if (!elements) {
      setError('Payment form is not ready. Please wait a moment and try again.')
      return
    }

    setIsValidating(true)
    setError(null)

    try {
      // Use confirmSetup with redirect: 'if_required' (like the working billing flow)
      const { error: confirmError, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}${window.location.pathname}`,
        },
        redirect: 'if_required',
      })

      if (confirmError) {
        console.error('Stripe confirmSetup error:', confirmError)
        setError(confirmError.message || 'Failed to validate payment method. Please try again.')
        setIsValidated(false)
        return
      }

      if (setupIntent?.payment_method) {
        const paymentMethodId = typeof setupIntent.payment_method === 'string' 
          ? setupIntent.payment_method 
          : setupIntent.payment_method.id
        
        console.log('💳 Payment method confirmed:', paymentMethodId)
        
        onPaymentMethodCollected(paymentMethodId)
        setIsValidated(true)
        setError(null)
      } else {
        setError('Failed to get payment method from setup. Please try again.')
        setIsValidated(false)
      }
    } catch (err: any) {
      console.error('Error confirming setup:', err)
      setError(err?.message || 'An unexpected error occurred. Please try again.')
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
        onReady={() => setIsReady(true)}
        options={{
          layout: 'tabs',
          defaultValues: billingData ? {
            billingDetails: {
              name: `${billingData.firstName || ''} ${billingData.lastName || ''}`.trim() || undefined,
              email: billingData.agencyEmail || undefined,
              phone: billingData.companyPhone ? `${billingData.phoneCode || ''}${billingData.companyPhone}` : undefined,
              address: {
                line1: billingData.line1 || undefined,
                line2: billingData.line2 || undefined,
                city: billingData.city || undefined,
                state: billingData.state || undefined,
                postal_code: billingData.postalCode || undefined,
                country: billingData.countryCode || undefined,
              },
            },
          } : undefined,
        }}
        onChange={(event) => {
          if (event.complete) {
            onCardChange?.({
              brand: 'visa',
              last4: '',
              complete: event.complete,
            })
          }
        }}
      />
      
      <Button
        type="button"
        onClick={handleValidateCard}
        disabled={!stripe || !isReady || isValidating || isValidated}
        className={cn(
          "w-full h-12 font-bold transition-all duration-300",
          isValidated
            ? "bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-[0_8px_30px_rgba(34,197,94,0.3)] hover:shadow-[0_12px_40px_rgba(34,197,94,0.4)]"
            : "bg-brand-gradient hover:bg-brand-gradient-hover text-white border border-brand-border hover:scale-[1.01] active:scale-[0.99]"
        )}
      >
        {!isReady ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : isValidating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Validating Card...
          </>
        ) : isValidated ? (
          <>
            ✓ Card Validated
          </>
        ) : (
          'Add Card'
        )}
      </Button>

      {error && (
        <div className="bg-destructive/10 border border-destructive rounded-lg p-3">
          <p className="text-sm text-destructive font-medium">{error}</p>
        </div>
      )}
      {isValidated && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <p className="text-sm text-green-700 dark:text-green-400 font-medium">
            ✓ Payment method added successfully
          </p>
        </div>
      )}
      <p className="text-xs text-fg-tertiary">
        Your payment information is securely processed by Stripe. We never store your card details.
      </p>
    </div>
  )
}
