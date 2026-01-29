'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { SavedBankCardsGallery } from '@/components/ui/bank-card'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { setDefaultPaymentMethod, removePaymentMethod, getReplaceCardUrl, createSetupIntent } from '../actions'
import { Loader2, CreditCard, Plus } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

type BankCard = {
  id: string
  cardNumber: string
  cardholderName: string
  expiryMonth: string
  expiryYear: string
  variant: 'default' | 'premium' | 'platinum' | 'black'
  isDefault?: boolean
  brand?: string
}

type Props = {
  agencyId: string
  cards: BankCard[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Add Card Form (inside Stripe Elements)
// ─────────────────────────────────────────────────────────────────────────────
function AddCardForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const { error } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}${window.location.pathname}`,
        },
        redirect: 'if_required',
      })

      if (error) {
        setErrorMessage(error.message || 'An error occurred')
      } else {
        onSuccess()
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      {errorMessage && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-md p-3">
          {errorMessage}
        </div>
      )}

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Add Card
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Client Component
// ─────────────────────────────────────────────────────────────────────────────
export function PaymentMethodsClient({ agencyId, cards }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = React.useState(false)
  const [cardToRemove, setCardToRemove] = React.useState<string | null>(null)
  
  // Add card modal state
  const [showAddCardModal, setShowAddCardModal] = React.useState(false)
  const [clientSecret, setClientSecret] = React.useState<string | null>(null)
  const [isCreatingSetupIntent, setIsCreatingSetupIntent] = React.useState(false)

  const handleAddCard = async () => {
    setIsCreatingSetupIntent(true)
    try {
      const result = await createSetupIntent(agencyId)
      if (result.success) {
        setClientSecret(result.data.clientSecret)
        setShowAddCardModal(true)
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to initialize card setup',
        variant: 'destructive',
      })
    } finally {
      setIsCreatingSetupIntent(false)
    }
  }

  const handleAddCardSuccess = () => {
    setShowAddCardModal(false)
    setClientSecret(null)
    toast({
      title: 'Card added',
      description: 'Your payment method has been added successfully.',
    })
    router.refresh()
  }

  const handleAddCardClose = () => {
    setShowAddCardModal(false)
    setClientSecret(null)
  }

  const handleSetDefault = async (cardId: string) => {
    setIsLoading(true)
    try {
      const result = await setDefaultPaymentMethod(agencyId, cardId)
      
      if (result.success) {
        toast({
          title: 'Default card updated',
          description: 'Your default payment method has been updated successfully.',
        })
        router.refresh()
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveCard = async (cardId: string) => {
    setCardToRemove(cardId)
  }

  const confirmRemoveCard = async () => {
    if (!cardToRemove) return

    setIsLoading(true)
    try {
      const result = await removePaymentMethod(agencyId, cardToRemove)
      
      if (result.success) {
        toast({
          title: 'Card removed',
          description: 'Your payment method has been removed successfully.',
        })
        router.refresh()
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setCardToRemove(null)
    }
  }

  const handleReplaceCard = async (cardId: string) => {
    const result = await getReplaceCardUrl()
    if (result.success) {
      router.push(result.data)
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    }
  }

  const stripeOptions = clientSecret
    ? {
        clientSecret,
        appearance: {
          theme: 'night' as const,
          variables: {
            colorPrimary: '#6366f1',
            colorBackground: '#1f2937',
            colorText: '#f9fafb',
            borderRadius: '8px',
          },
        },
      }
    : null

  return (
    <>
      <SavedBankCardsGallery
        cards={cards}
        compact={false}
        onAddCard={handleAddCard}
        onSetDefault={handleSetDefault}
        onRemoveCard={handleRemoveCard}
        onReplaceCard={handleReplaceCard}
      />

      {/* Add Card Modal */}
      <Dialog open={showAddCardModal} onOpenChange={handleAddCardClose}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Add Payment Method
            </DialogTitle>
            <DialogDescription>
              Enter your card details below. Your card will be securely saved for future payments.
            </DialogDescription>
          </DialogHeader>
          
          {clientSecret && stripeOptions && (
            <Elements stripe={stripePromise} options={stripeOptions}>
              <AddCardForm onSuccess={handleAddCardSuccess} onCancel={handleAddCardClose} />
            </Elements>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={cardToRemove !== null} onOpenChange={(open) => !open && setCardToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove payment method?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the card from your account. If this is your default payment method, 
              you'll need to set a new default before the next billing cycle.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveCard}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? 'Removing...' : 'Remove Card'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
