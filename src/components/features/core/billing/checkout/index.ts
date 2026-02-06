/**
 * Unified Checkout Components
 * 
 * @description Provides a unified checkout experience for plans, addons, and credits.
 * Can be used as a full page or as a modal dialog.
 * 
 * @example
 * // As a page
 * <UnifiedCheckoutForm
 *   mode="page"
 *   item={{
 *     key: 'BASIC',
 *     type: 'plan',
 *     title: 'Basic Plan',
 *     description: 'Perfect for small teams',
 *     price: 'RM 79.00',
 *     priceAmount: 7900,
 *     priceId: 'price_xxxx',
 *     interval: 'month',
 *     features: ['10 team members', '5GB storage'],
 *     trial: { enabled: true, days: 14 },
 *   }}
 *   user={{ id: 'user_1', email: 'user@example.com', name: 'John Doe', firstName: 'John', lastName: 'Doe' }}
 *   context={{ isNewSubscription: true }}
 * />
 * 
 * @example
 * // As a modal
 * <UnifiedCheckoutForm
 *   mode="modal"
 *   item={{
 *     key: 'FI_GL',
 *     type: 'addon',
 *     title: 'General Ledger',
 *     description: 'Financial accounting module',
 *     price: 'RM 99.00',
 *     priceAmount: 9900,
 *     priceId: 'price_xxxx',
 *     interval: 'month',
 *   }}
 *   user={{ id: 'user_1', email: 'user@example.com', name: 'John', firstName: 'John', lastName: 'Doe' }}
 *   context={{ agencyId: 'agency_1', customerId: 'cus_xxxx', isNewSubscription: false }}
 *   existingPaymentMethods={paymentMethods}
 *   onComplete={(result) => console.log('Checkout complete:', result)}
 *   onCancel={() => setModalOpen(false)}
 * />
 * 
 * @example
 * // Using the hook
 * const { openCheckout, CheckoutModal } = useUnifiedCheckout({
 *   user,
 *   context: { agencyId, customerId, isNewSubscription: false },
 *   existingPaymentMethods,
 * })
 * 
 * // Later...
 * openCheckout({
 *   type: 'credits',
 *   key: 'API_CREDITS',
 *   title: '100 API Credits',
 *   price: 'RM 10.00',
 *   priceAmount: 1000,
 *   priceId: 'price_xxxx',
 *   interval: 'one_time',
 *   quantity: 100,
 * })
 * 
 * return <>{CheckoutModal}</>
 */

export { CheckoutForm as UnifiedCheckoutForm, default } from './checkout-form'
export { useCheckout as useUnifiedCheckout, CheckoutModalWrapper } from './use-checkout'

// Re-export types from billing types for convenience
export type {
  CheckoutType,
  CheckoutMode,
  CheckoutItem,
  CheckoutContext,
  User as CheckoutUser,
  CheckoutResult,
  CheckoutStep,
  CheckoutProps as UnifiedCheckoutProps,
  CustomerData as ExistingCustomerData,
  PaymentMethod as ExistingPaymentMethod,
} from '@/types/billing'
