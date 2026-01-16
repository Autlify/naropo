'use client'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Plan } from '@/generated/prisma/client'
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import React, { useState } from 'react'

type Props = {
  selectedPriceId: string | Plan
  requiresSetup?: boolean
}

const SubscriptionForm = ({ selectedPriceId, requiresSetup }: Props) => {
  const { toast } = useToast()
  const elements = useElements()
  const stripeHook = useStripe()
  const [priceError, setPriceError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedPriceId) {
      setPriceError('You need to select a plan to subscribe.')
      return
    }
    setPriceError('')

    if (!stripeHook || !elements) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Stripe has not loaded yet. Please try again.',
      })
      return
    }

    setIsProcessing(true)

    try {
      if (requiresSetup) {
        // Handle SetupIntent (for future payments without immediate charge)
        const { error } = await stripeHook.confirmSetup({
          elements,
          confirmParams: {
            return_url: `${process.env.NEXT_PUBLIC_URL}agency`,
          },
        })
        
        if (error) {
          throw new Error(error.message || 'Setup failed')
        }
      } else {
        // Handle PaymentIntent (standard subscription payment)
        const { error } = await stripeHook.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${process.env.NEXT_PUBLIC_URL}agency`,
          },
        })
        
        if (error) {
          throw new Error(error.message || 'Payment failed')
        }
      }

      toast({
        title: 'Payment successful',
        description: 'Your payment has been successfully processed.',
      })
    } catch (error) {
      console.error('Payment processing error:', error)
      toast({
        variant: 'destructive',
        title: 'Payment failed',
        description:
          error instanceof Error 
            ? error.message 
            : 'We couldn\'t process your payment. Please try a different card',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <small className="text-destructive">{priceError}</small>
      <PaymentElement />
      <Button
        disabled={!stripeHook || isProcessing}
        className="mt-4 w-full"
        type="submit"
      >
        {isProcessing ? 'Processing...' : 'Submit'}
      </Button>
    </form>
  )
}

export default SubscriptionForm
