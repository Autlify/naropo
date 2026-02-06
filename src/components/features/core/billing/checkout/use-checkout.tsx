'use client'

import { useState, useCallback, ReactNode } from 'react'
import type {
  CheckoutItem,
  CheckoutContext,
  User,
  CheckoutResult,
  CustomerData,
  PaymentMethod,
  AddonCardData,
} from '@/types/billing'
import { CheckoutForm } from './checkout-form'

/**
 * Hook configuration for useUnifiedCheckout
 */
interface CheckoutProps {
  /** User information */
  user: User
  /** Checkout context (agency, customer, etc.) */
  context: CheckoutContext
  /** Existing customer data for pre-fill */
  existingCustomer?: CustomerData | null
  /** Existing payment methods */
  existingPaymentMethods?: PaymentMethod[]
  /** Available addons for upsell */
  availableAddons?: AddonCardData[]
  /** Callback when checkout completes successfully */
  onComplete?: (result: CheckoutResult) => void
  /** Custom success redirect URL */
  successUrl?: string
  /** Custom cancel redirect URL */
  cancelUrl?: string
}

/**
 * Hook return type
 */
interface UseCheckoutProps {
  /** Whether the checkout modal is open */
  isOpen: boolean
  /** Current checkout item (if modal is open) */
  currentItem: CheckoutItem | null
  /** Open the checkout modal with a specific item */
  openCheckout: (item: CheckoutItem) => void
  /** Close the checkout modal */
  closeCheckout: () => void
  /** The CheckoutModal component to render */
  CheckoutModal: ReactNode
}

/**
 * useCheckout - Hook for managing modal-based checkout
 * 
 * @description Provides a convenient way to trigger checkout modals for
 * plans, addons, or credits without managing modal state manually.
 * 
 * @example
 * const { openCheckout, CheckoutModal } = useCheckout({
 *   user: { id: 'user_1', email: 'user@example.com', name: 'John', firstName: 'John', lastName: 'Doe' },
 *   context: { agencyId: 'agency_1', customerId: 'cus_xxxx', isNewSubscription: false },
 *   existingPaymentMethods: paymentMethods,
 *   onComplete: (result) => {
 *     console.log('Checkout completed:', result)
 *     // Refresh data, show success message, etc.
 *   },
 * })
 * 
 * // Trigger checkout for an addon
 * const handleAddAddon = (addon: AddonCardData) => {
 *   openCheckout({
 *     key: addon.key,
 *     type: 'addon',
 *     title: addon.title,
 *     description: addon.description,
 *     price: addon.price,
 *     priceAmount: addon.priceAmount,
 *     priceId: addon.priceId,
 *     interval: addon.interval,
 *     features: addon.features,
 *   })
 * }
 * 
 * // Render the modal somewhere in your component
 * return (
 *   <div>
 *     <button onClick={() => handleAddAddon(myAddon)}>Add Addon</button>
 *     {CheckoutModal}
 *   </div>
 * )
 */
export function useCheckout(config: CheckoutProps): UseCheckoutProps {
  const [isOpen, setIsOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<CheckoutItem | null>(null)

  const openCheckout = useCallback((item: CheckoutItem) => {
    setCurrentItem(item)
    setIsOpen(true)
  }, [])

  const closeCheckout = useCallback(() => {
    setIsOpen(false)
    // Delay clearing item to allow for close animation
    setTimeout(() => setCurrentItem(null), 300)
  }, [])

  const handleComplete = useCallback(
    (result: CheckoutResult) => {
      config.onComplete?.(result)
      closeCheckout()
    },
    [config, closeCheckout]
  )

  const CheckoutModal = isOpen && currentItem ? (
    <CheckoutForm
      mode="modal"
      item={currentItem}
      user={config.user}
      context={config.context}
      existingCustomer={config.existingCustomer}
      existingPaymentMethods={config.existingPaymentMethods}
      availableAddons={config.availableAddons}
      onComplete={handleComplete}
      onCancel={closeCheckout}
      successUrl={config.successUrl}
      cancelUrl={config.cancelUrl}
    />
  ) : null

  return {
    isOpen,
    currentItem,
    openCheckout,
    closeCheckout,
    CheckoutModal,
  }
}

/**
 * CheckoutModalWrapper - Standalone modal wrapper component
 * 
 * @description For cases where you want to control the modal state externally
 * rather than using the hook.
 * 
 * @example
 * const [checkoutItem, setCheckoutItem] = useState<CheckoutItem | null>(null)
 * 
 * return (
 *   <>
 *     <button onClick={() => setCheckoutItem(myItem)}>Buy Now</button>
 *     
 *     {checkoutItem && (
 *       <CheckoutModalWrapper
 *         item={checkoutItem}
 *         user={user}
 *         context={context}
 *         onComplete={(result) => {
 *           console.log('Done:', result)
 *           setCheckoutItem(null)
 *         }}
 *         onCancel={() => setCheckoutItem(null)}
 *       />
 *     )}
 *   </>
 * )
 */
interface CheckoutModalWrapperProps {
  /** Item to checkout */
  item: CheckoutItem
  /** User information */
  user: User
  /** Checkout context */
  context: CheckoutContext
  /** Existing customer data */
  existingCustomer?: CustomerData | null
  /** Existing payment methods */
  existingPaymentMethods?: PaymentMethod[]
  /** Available addons for upsell */
  availableAddons?: AddonCardData[]
  /** Callback on completion */
  onComplete?: (result: CheckoutResult) => void
  /** Callback on cancel */
  onCancel?: () => void
  /** Success redirect URL */
  successUrl?: string
  /** Cancel redirect URL */
  cancelUrl?: string
}

export function CheckoutModalWrapper({
  item,
  user,
  context,
  existingCustomer,
  existingPaymentMethods = [],
  availableAddons = [],
  onComplete,
  onCancel,
  successUrl,
  cancelUrl,
}: CheckoutModalWrapperProps) {
  return (
    <CheckoutForm
      mode="modal"
      item={item}
      user={user}
      context={context}
      existingCustomer={existingCustomer}
      existingPaymentMethods={existingPaymentMethods}
      availableAddons={availableAddons}
      onComplete={onComplete}
      onCancel={onCancel}
      successUrl={successUrl}
      cancelUrl={cancelUrl}
    />
  )
}

export default useCheckout
