'use client'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { pricingCards } from '@/lib/constants'
import { useModal } from '@/providers/modal-provider'
import { Plan } from '@/generated/prisma/client'
import { StripeElementsOptions } from '@stripe/stripe-js'
import clsx from 'clsx'
import { useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { getStripe } from '@/lib/stripe/stripe-client'
import Loading from '@/components/global/loading'
import SubscriptionForm from '.'

type Props = {
  customerId: string
  planExists: boolean
  currentPriceId?: string
}

const SubscriptionFormWrapper = ({ customerId, planExists, currentPriceId }: Props) => {
  const { data, setClose } = useModal()
  const router = useRouter()
  const [selectedPriceId, setSelectedPriceId] = useState<Plan | ''>(
    data?.plans?.defaultPriceId || ''
  )
  const [subscription, setSubscription] = useState<{
    subscriptionId: string
    clientSecret?: string
    status?: string
    message?: string
    requiresSetup?: boolean
    trialEnd?: number
  }>({ subscriptionId: '' })

  const options: StripeElementsOptions = useMemo(
    () => ({
      clientSecret: subscription?.clientSecret,
      appearance: {
        theme: 'flat',
      },
    }),
    [subscription]
  )

  useEffect(() => {
    if (!selectedPriceId) return
    const createSecret = async () => {
      try {
        const subscriptionResponse = await fetch(
          '/api/stripe/create-subscription',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customerId,
              priceId: selectedPriceId,
            }),
          }
        )
        
        if (!subscriptionResponse.ok) {
          const errorData = await subscriptionResponse.json()
          throw new Error(errorData.error || 'Failed to create subscription')
        }

        const subscriptionResponseData = await subscriptionResponse.json()
        setSubscription(subscriptionResponseData)

        // Handle case where no payment is required (free trial, credits, etc.)
        if (subscriptionResponseData.message && planExists) {
          toast({
            title: 'Success',
            description: subscriptionResponseData.message,
          })
          setClose()
          router.refresh()
        } else if (planExists && subscriptionResponseData.clientSecret) {
          // Plan updated and requires payment
          toast({
            title: 'Success',
            description: 'Your plan has been successfully upgraded!',
          })
          setClose()
          router.refresh()
        }
      } catch (error) {
        console.error('Subscription creation error:', error)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error instanceof Error ? error.message : 'Could not create subscription',
        })
      }
    }
    createSecret()
  }, [data, selectedPriceId, customerId, planExists, setClose, router])

  const isCurrentPlan = (priceId: string) => currentPriceId === priceId

  return (
    <div className="border-none transition-all">
      <div className="flex flex-col gap-4">
        {data.plans?.plans.map((price) => {
          const isCurrent = isCurrentPlan(price.id)
          return (
            <Card
              onClick={() => setSelectedPriceId(price.id as Plan)}
              key={price.id}
              className={clsx('relative cursor-pointer transition-all', {
                'border-primary': selectedPriceId === price.id,
                'bg-muted/50': isCurrent,
              })}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span>RM {price.unit_amount ? price.unit_amount / 100 : '0'}</span>
                      {isCurrent && (
                        <span className="text-xs font-normal px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                          Current Plan
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground font-normal">
                      {price.nickname}
                    </p>
                    <p className="text-sm text-muted-foreground font-normal">
                      {
                        pricingCards.find((p) => p.priceId === price.id)
                          ?.description
                      }
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              {selectedPriceId === price.id && (
                <div className="w-2 h-2 bg-emerald-500 rounded-full absolute top-4 right-4" />
              )}
            </Card>
          )
        })}

        {options.clientSecret && !planExists && (
          <>
            <h1 className="text-xl">Payment Method</h1>
            <Elements
              stripe={getStripe()}
              options={options}
            >
              <SubscriptionForm 
                selectedPriceId={selectedPriceId}
                requiresSetup={subscription.requiresSetup}
              />
            </Elements>
          </>
        )}

        {!options.clientSecret && selectedPriceId && !subscription.message && (
          <div className="flex items-center justify-center w-full h-40">
            <Loading />
          </div>
        )}

        {subscription.message && (
          <div className="flex flex-col items-center justify-center w-full p-6 bg-emerald-50 dark:bg-emerald-950 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div className="text-emerald-600 dark:text-emerald-400 text-center">
              <p className="font-semibold">{subscription.message}</p>
              <p className="text-sm mt-2">Subscription ID: {subscription.subscriptionId}</p>
              {subscription.trialEnd && (
                <p className="text-sm mt-1">
                  Trial ends: {new Date(subscription.trialEnd * 1000).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SubscriptionFormWrapper
