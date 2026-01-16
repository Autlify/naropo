import { notFound, redirect } from 'next/navigation'
import { pricingCards } from '@/lib/constants'
import { CheckoutForm } from './_components/checkout-form'
import { auth } from '@/auth'
import { getUser } from '@/lib/queries'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

type Props = {
    params: Promise<{ priceId: string }>
}

export default async function CheckoutPage({ params }: Props) {
    const { priceId } = await params
    const session = await auth()
    const priceDetails = pricingCards.find((card) => card.priceId === priceId)
    const user = await getUser(session?.user.id!)

    if (!priceDetails) {
        notFound()
    }

    if (!session?.user || !user) {
        redirect('/sign-in?callbackUrl=' + encodeURIComponent(`/site/pricing/checkout/${priceId}`))
    }
 

    // Fetch existing customer data and payment methods if customerId exists
    let existingCustomer: Stripe.Customer | null = null
    let existingPaymentMethods: Stripe.PaymentMethod[] = []

    if (user.customerId) {
        try {
            existingCustomer = await stripe.customers.retrieve(user.customerId) as Stripe.Customer
            
            // Only fetch payment methods if customer exists and is not deleted
            if (!existingCustomer.deleted) {
                const paymentMethods = await stripe.paymentMethods.list({
                    customer: user.customerId,
                    type: 'card',
                })
                existingPaymentMethods = paymentMethods.data
            }
        } catch (error) {
            console.error('Error fetching customer data:', error)
            // Continue without pre-fill data if customer fetch fails
        }
    }

    // Convert Stripe objects to plain objects for Client Component
    const customerData = existingCustomer && !existingCustomer.deleted ? {
        id: existingCustomer.id,
        email: existingCustomer.email ?? null,
        name: existingCustomer.name ?? null,
        phone: existingCustomer.phone ?? null,
        address: existingCustomer.address ? {
            line1: existingCustomer.address.line1 ?? null,
            line2: existingCustomer.address.line2 ?? null,
            city: existingCustomer.address.city ?? null,
            state: existingCustomer.address.state ?? null,
            postal_code: existingCustomer.address.postal_code ?? null,
            country: existingCustomer.address.country ?? null,
        } : null,
        metadata: existingCustomer.metadata as Record<string, string>,
    } : null

    const paymentMethodsData = existingPaymentMethods.map(pm => ({
        id: pm.id,
        card: pm.card ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            exp_month: pm.card.exp_month,
            exp_year: pm.card.exp_year,
        } : null,
    }))

    return (
        <div className="w-full min-h-screen justify-center">
            <CheckoutForm 
                priceId={priceId}
                planConfig={priceDetails}
                agencyEmail={session?.user.email!}
                user={{
                    id: user.id,
                    email: user.email,
                    name: user.name || '',
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    trialEligible: user.trialEligibled,
                }}
                existingCustomer={customerData}
                existingPaymentMethods={paymentMethodsData}
            />
     </div>
    )
}
