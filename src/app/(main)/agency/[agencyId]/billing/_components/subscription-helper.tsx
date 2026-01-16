'use client'
import SubscriptionFormWrapper from '@/components/forms/subscription-form/subscription-form-wrapper'
import CustomModal from '@/components/global/custom-modal'
import { PricesList } from '@/lib/types'
import { useModal } from '@/providers/modal-provider'
import { useSearchParams } from 'next/navigation'
import React, { useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { SubscriptionStatus } from '@/generated/prisma/enums'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarDays, CreditCard, AlertCircle } from 'lucide-react'

type Props = {
  prices: PricesList['data']
  customerId: string
  planExists: boolean
  subscriptionStatus?: SubscriptionStatus | null
  trialEndDate?: Date | null
  currentPeriodEndDate?: Date | null
  planTitle?: string
  currentPriceId?: string | null
}

const getStatusConfig = (status?: SubscriptionStatus | null) => {
  switch (status) {
    case 'ACTIVE':
      return {
        variant: 'default' as const,
        label: 'Active',
        color: 'bg-emerald-500',
      }
    case 'TRIALING':
      return {
        variant: 'secondary' as const,
        label: 'Trial',
        color: 'bg-blue-500',
      }
    case 'PAST_DUE':
      return {
        variant: 'destructive' as const,
        label: 'Past Due',
        color: 'bg-orange-600',
      }
    case 'CANCELED':
      return {
        variant: 'outline' as const,
        label: 'Canceled',
        color: 'bg-gray-500',
      }
    case 'INCOMPLETE':
      return {
        variant: 'outline' as const,
        label: 'Incomplete',
        color: 'bg-yellow-500',
      }
    case 'UNPAID':
      return {
        variant: 'destructive' as const,
        label: 'Unpaid',
        color: 'bg-red-600',
      }
    default:
      return {
        variant: 'outline' as const,
        label: 'No Plan',
        color: 'bg-gray-400',
      }
  }
}

const formatDate = (date?: Date | null) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const getTrialDaysRemaining = (trialEndDate?: Date | null) => {
  if (!trialEndDate) return 0
  
  const now = new Date()
  const trialEnd = new Date(trialEndDate)
  const diffTime = trialEnd.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays > 0 ? diffDays : 0
}

const SubscriptionHelper = ({
  customerId,
  planExists,
  prices,
  subscriptionStatus,
  trialEndDate,
  currentPeriodEndDate,
  planTitle,
  currentPriceId,
}: Props) => {
  const { setOpen } = useModal()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan')
  const statusConfig = getStatusConfig(subscriptionStatus)
  const isTrialing = subscriptionStatus === 'TRIALING'
  const trialDaysRemaining = getTrialDaysRemaining(trialEndDate)

  useEffect(() => {
    if (plan)
      setOpen(
        <CustomModal
          title="Manage Your Plan"
          subheading="You can change your plan at any time from the billings settings"
        >
          <SubscriptionFormWrapper
            planExists={planExists}
            customerId={customerId}
            currentPriceId={currentPriceId || undefined}
          />
        </CustomModal>,
        async () => ({
          plans: {
            defaultPriceId: plan ? plan : '',
            plans: prices,
          },
        })
      )
  }, [plan, currentPriceId])

  // Don't render subscription status card if no subscription
  if (!planExists || !subscriptionStatus) {
    return null
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl">Subscription Status</CardTitle>
            <CardDescription>
              {planTitle || 'Your current plan'} - {statusConfig.label}
            </CardDescription>
          </div>
          <Badge variant={statusConfig.variant} className="h-8 px-4 text-sm">
            <div className={`w-2 h-2 rounded-full ${statusConfig.color} mr-2`} />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Trial Information */}
          {isTrialing && trialEndDate && (
            <div className="flex items-start gap-3 p-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900">
              <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-blue-900 dark:text-blue-100">
                  Trial Period
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {trialDaysRemaining > 0 ? (
                    <>
                      <span className="font-medium">{trialDaysRemaining} days</span> remaining
                    </>
                  ) : (
                    'Trial ending today'
                  )}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                  Ends on {formatDate(trialEndDate)}
                </p>
              </div>
            </div>
          )}

          {/* Current Period End */}
          {currentPeriodEndDate && !isTrialing && (
            <div className="flex items-start gap-3 p-4 rounded-lg border">
              <CreditCard className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Next Billing Date</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatDate(currentPeriodEndDate)}
                </p>
              </div>
            </div>
          )}

          {/* Past Due Alert */}
          {subscriptionStatus === 'PAST_DUE' && (
            <div className="flex items-start gap-3 p-4 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-900 md:col-span-2">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-orange-900 dark:text-orange-100">
                  Payment Required
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  Your payment is past due. Please update your payment method to continue using our services.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300"
                  onClick={() => {
                    // TODO: Implement payment method update
                    window.location.href = `/agency/${customerId}/billing?updatePayment=true`
                  }}
                >
                  Update Payment Method
                </Button>
              </div>
            </div>
          )}

          {/* Unpaid Alert */}
          {subscriptionStatus === 'UNPAID' && (
            <div className="flex items-start gap-3 p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-900 md:col-span-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-900 dark:text-red-100">
                  Subscription Suspended
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Your subscription has been suspended due to non-payment. Please contact support or update your payment method.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    window.location.href = `mailto:support@autlify.com?subject=Unpaid Subscription - ${customerId}`
                  }}
                >
                  Contact Support
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default SubscriptionHelper
