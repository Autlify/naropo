'use client'

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui-2/card'
import { Button } from '@/components/ui-2/button'
import { Badge } from '@/components/ui-2/badge'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui-2/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui-2/radio-group'
import { Toggle } from '@/components/ui/toggle'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Check, X, Circle, Loader2, CreditCard, Calendar } from 'lucide-react'

import type {
  BillingScope,
  Plan,
  CurrentPlan,
  TrialExpiryCardProps,
  TrialTimeRemaining,
  CancelSubscriptionDialogProps,
  UpdatePlanDialogProps,
  SubscriptionManagementProps,
} from '@/types/billing'
import { getPricingCards, getPricingCardByPriceId, type PricingCardData } from '@/lib/registry/plans/pricing-config'
import {
  getSubscriptionData,
  updateSubscriptionPlan,
  syncSubscriptionStatus,
  type SubscriptionData,
} from '@/lib/stripe/actions/subscription'
import { cn } from '@/lib/utils'

// ============================================================================
// Constants
// ============================================================================

const EASING = [0.4, 0, 0.2, 1] as const

// ============================================================================
// Helper Functions
// ============================================================================

const calculateTimeRemaining = (endDate: Date | string | number): TrialTimeRemaining => {
  try {
    let end: Date
    if (typeof endDate === 'string') {
      end = new Date(endDate)
    } else if (typeof endDate === 'number') {
      end = new Date(endDate)
    } else if (endDate instanceof Date) {
      end = endDate
    } else {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    }

    if (isNaN(end.getTime())) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    }

    const now = new Date()
    const diff = end.getTime() - now.getTime()

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    }

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
    }
  } catch {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  }
}

const mapPricingCardToPlan = (card: PricingCardData): Plan => ({
  id: card.priceId,
  title: card.title,
  description: card.description,
  currency: 'RM',
  monthlyPrice: String(card.priceAmount / 100),
  yearlyPrice: String(card.priceAmount / 100),
  buttonText: 'Select Plan',
  features: card.features.map((f: string) => ({ name: f, icon: 'check', iconColor: 'text-green-500' })),
})

// ============================================================================
// TrialTimeUnit Component
// ============================================================================

const TrialTimeUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="text-2xl font-bold tabular-nums sm:text-3xl">
      {String(value).padStart(2, '0')}
    </div>
    <div className="text-muted-foreground text-xs">{label}</div>
  </div>
)

// ============================================================================
// TrialExpiryCard Component
// ============================================================================

const TrialExpiryCard = ({
  trialEndDate,
  daysRemaining: propDaysRemaining,
  onUpgrade, 
  cancelTrial,
  className,
  title = 'Trial Period',
  description,
  upgradeButtonText = 'Upgrade Now',
  features = ['Unlimited projects', 'Priority support', 'Advanced analytics', 'Custom integrations'],
}: TrialExpiryCardProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<TrialTimeRemaining>(() => {
    if (trialEndDate) return calculateTimeRemaining(trialEndDate)
    return { days: propDaysRemaining || 0, hours: 0, minutes: 0, seconds: 0 }
  })

  useEffect(() => {
    if (!trialEndDate) return
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(trialEndDate))
    }, 1000)
    return () => clearInterval(interval)
  }, [trialEndDate])

  const daysRemaining = propDaysRemaining ?? timeRemaining.days

  const handleUpgrade = async () => {
    if (onUpgrade) {
      setIsLoading(true)
      try {
        await onUpgrade()
      } finally {
        setIsLoading(false)
      }
    }
  }
 


  const getStatusBadge = () => {
    if (daysRemaining <= 0) return <Badge variant="destructive">Expired</Badge>
    if (daysRemaining <= 2) return <Badge variant="destructive">Expiring Soon</Badge>
    if (daysRemaining <= 6) return <Badge variant="secondary">Active</Badge>
    return <Badge variant="default">Active</Badge>
  }

  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          {getStatusBadge()}
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6">
        {trialEndDate && daysRemaining > 0 && (
          <div className="bg-muted/30 rounded-lg border p-4" role="status" aria-live="polite" aria-atomic="true">
            <div className="flex items-center justify-center gap-2 sm:gap-4">
              <TrialTimeUnit value={timeRemaining.days} label="Days" />
              <span className="text-muted-foreground">:</span>
              <TrialTimeUnit value={timeRemaining.hours} label="Hours" />
              <span className="text-muted-foreground">:</span>
              <TrialTimeUnit value={timeRemaining.minutes} label="Min" />
              <span className="text-muted-foreground">:</span>
              <TrialTimeUnit value={timeRemaining.seconds} label="Sec" />
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Included with upgrade</h3>
          <div className="space-y-2">
            {features.slice(0, 4).map((feature, index) => (
              <div key={index} className="text-muted-foreground flex items-center gap-2 text-sm">
                <Check className="text-primary h-4 w-4" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {onUpgrade && (
          <Button onClick={handleUpgrade} disabled={isLoading} className="w-full" size="lg">
            {isLoading ? 'Processing...' : upgradeButtonText}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// UpdatePlanDialog Component
// ============================================================================

const UpdatePlanDialog = ({
  currentPlan,
  plans,
  onPlanChange,
  className,
  title,
  triggerText,
}: UpdatePlanDialogProps) => {
  // Defensive normalization: avoid runtime crashes if a call-site accidentally
  // passes a non-array structure.
  const normalizedPlans: Plan[] = Array.isArray(plans)
    ? plans
    : plans && typeof plans === 'object'
      ? (Object.values(plans as Record<string, Plan>).filter(Boolean) as Plan[])
      : []

  const [isYearly, setIsYearly] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | undefined>(undefined)
  const [isOpen, setIsOpen] = useState(false)

  const getCurrentPrice = useCallback(
    (plan: Plan) => (isYearly ? `${plan.yearlyPrice}` : `${plan.monthlyPrice}`),
    [isYearly]
  )

  const handlePlanChange = useCallback((planId: string) => {
    setSelectedPlan((prev) => (prev === planId ? undefined : planId))
  }, [])

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open)
    if (!open) setSelectedPlan(undefined)
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>{triggerText || 'Update Plan'}</Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          'text-foreground flex max-h-[95vh] flex-col gap-3 sm:max-h-[90vh] sm:gap-4',
          'w-[calc(100vw-2rem)] max-w-2xl sm:w-full',
          'p-4 sm:p-6',
          className
        )}
      >
        <DialogHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pb-0">
          <DialogTitle className="text-lg font-semibold sm:text-xl">{title || 'Upgrade Plan'}</DialogTitle>
          <div className="flex items-center gap-1.5 text-sm sm:gap-2">
            <Toggle
              size="sm"
              pressed={!isYearly}
              onPressedChange={(pressed) => setIsYearly(!pressed)}
              className="h-9 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm"
            >
              Monthly
            </Toggle>
            <Toggle
              size="sm"
              pressed={isYearly}
              onPressedChange={(pressed) => setIsYearly(pressed)}
              className="h-9 px-3 text-xs sm:h-10 sm:px-4 sm:text-sm"
            >
              Yearly
            </Toggle>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto -mx-4 px-4 sm:-mx-6 sm:px-6">
          {normalizedPlans.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-center">
              <p className="text-muted-foreground text-sm">No plans available</p>
            </div>
          ) : (
            <RadioGroup value={selectedPlan} onValueChange={handlePlanChange}>
              <div className="space-y-2.5 pb-2 sm:space-y-3">
                {normalizedPlans.map((plan, index) => (
                  <motion.div
                    key={plan.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      layout: { duration: 0.3, ease: EASING },
                      opacity: { delay: index * 0.05, duration: 0.3, ease: EASING },
                      y: { delay: index * 0.05, duration: 0.3, ease: EASING },
                    }}
                    onClick={() => handlePlanChange(plan.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handlePlanChange(plan.id)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedPlan === plan.id}
                    className={cn(
                      'relative cursor-pointer overflow-hidden rounded-lg border transition-all duration-200 sm:rounded-xl',
                      'focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                      selectedPlan === plan.id
                        ? 'border-primary from-muted/60 to-muted/30 bg-gradient-to-br shadow-sm'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <motion.div layout="position" className="p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2 sm:gap-3">
                        <div className="flex min-w-0 flex-1 gap-2 sm:gap-3">
                          <RadioGroupItem
                            value={plan.id}
                            id={plan.id}
                            className="pointer-events-none mt-0.5 flex-shrink-0 sm:mt-1"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <Label
                                htmlFor={plan.id}
                                className="cursor-pointer text-sm leading-tight font-semibold sm:text-base sm:font-medium"
                              >
                                {plan.title}
                              </Label>
                              {plan.badge && (
                                <Badge variant="secondary" className="h-5 px-1.5 py-0 text-[10px] sm:text-xs">
                                  {plan.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground mt-1 text-[11px] leading-relaxed sm:text-xs">
                              {plan.description}
                            </p>
                            {plan.features.length > 0 && (
                              <div className="pt-2 sm:pt-3">
                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                  {plan.features.map((feature, fi) => (
                                    <div
                                      key={fi}
                                      className="bg-muted/20 border-border/30 flex items-center gap-1.5 rounded-md border px-2 py-1 sm:rounded-lg"
                                    >
                                      <div className="bg-primary h-1 w-1 rounded-full sm:h-1.5 sm:w-1.5" />
                                      <span className="text-muted-foreground text-[10px] whitespace-nowrap sm:text-xs">
                                        {feature.name}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="min-w-[60px] flex-shrink-0 text-right sm:min-w-[80px]">
                          <div className="text-base font-bold sm:text-xl sm:font-semibold">
                            {parseFloat(getCurrentPrice(plan)) >= 0
                              ? `${plan.currency}${getCurrentPrice(plan)}`
                              : getCurrentPrice(plan)}
                          </div>
                          <div className="text-muted-foreground mt-0.5 text-[10px] sm:text-xs">
                            /{isYearly ? 'year' : 'month'}
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    <AnimatePresence initial={false}>
                      {selectedPlan === plan.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{
                            height: 'auto',
                            opacity: 1,
                            transition: {
                              height: { duration: 0.3, ease: EASING },
                              opacity: { duration: 0.25, delay: 0.05, ease: EASING },
                            },
                          }}
                          exit={{
                            height: 0,
                            opacity: 0,
                            transition: {
                              height: { duration: 0.25, ease: EASING },
                              opacity: { duration: 0.15, ease: EASING },
                            },
                          }}
                          className="overflow-hidden"
                        >
                          <motion.div
                            initial={{ y: -8 }}
                            animate={{ y: 0, transition: { duration: 0.25, delay: 0.05, ease: EASING } }}
                            exit={{ y: -8 }}
                            className="px-3 pb-3 sm:px-4 sm:pb-4"
                          >
                            <Button
                              className="h-10 w-full text-sm font-medium sm:h-11 sm:text-base"
                              disabled={selectedPlan === currentPlan.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                onPlanChange(plan.id)
                                handleOpenChange(false)
                              }}
                            >
                              {selectedPlan === currentPlan.id ? 'Current Plan' : 'Upgrade'}
                            </Button>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </RadioGroup>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// CancelSubscriptionDialog Component
// ============================================================================

const CancelSubscriptionDialog = ({
  title,
  description,
  plan,
  triggerButtonText,
  leftPanelImageUrl,
  warningTitle,
  warningText,
  keepButtonText,
  continueButtonText,
  finalTitle,
  finalSubtitle,
  finalWarningText,
  goBackButtonText,
  confirmButtonText,
  onCancel,
  onKeepSubscription,
  onDialogClose,
  className,
}: CancelSubscriptionDialogProps) => {
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleContinueCancellation = () => {
    setShowConfirmation(true)
    setError(null)
  }

  const handleConfirmCancellation = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await onCancel(plan.id)
      handleDialogClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeepSubscription = async () => {
    try {
      setIsLoading(true)
      setError(null)
      if (onKeepSubscription) await onKeepSubscription(plan.id)
      handleDialogClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to keep subscription')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDialogClose = () => {
    setIsOpen(false)
    setShowConfirmation(false)
    setError(null)
    setIsLoading(false)
    onDialogClose?.()
  }

  const handleGoBack = () => {
    setShowConfirmation(false)
    setError(null)
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return
      if (event.key === 'Escape') {
        event.preventDefault()
        handleDialogClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (open) setIsOpen(true)
        else handleDialogClose()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">{triggerButtonText || 'Cancel Subscription'}</Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          'text-foreground flex w-[95%] flex-col overflow-hidden p-0 sm:max-w-[1000px] md:w-[100%] md:flex-row',
          leftPanelImageUrl ? '' : 'sm:max-w-[500px]',
          className
        )}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogClose
          className="ring-offset-background focus:ring-ring absolute top-4 right-4 z-10 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none"
          onClick={handleDialogClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>

        {leftPanelImageUrl && (
          <div className="relative hidden min-h-[500px] w-full overflow-hidden md:block md:w-1/2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={leftPanelImageUrl}
              alt="Cancel Subscription"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="via-background/30 to-background/90 absolute inset-0 hidden bg-gradient-to-r from-transparent dark:block" />
            <div className="from-background/80 to-background/20 absolute inset-0 hidden bg-gradient-to-t via-transparent dark:block" />
          </div>
        )}

        <div className={cn('flex flex-col gap-4 px-4 py-6', leftPanelImageUrl ? 'w-full md:w-1/2' : 'w-full')}>
          <div className="flex flex-col gap-2 text-center md:text-left">
            <h2 className="text-xl font-semibold md:text-2xl">{title}</h2>
            <p className="text-muted-foreground text-xs md:text-sm">{description}</p>
            {error && (
              <div className="bg-destructive/10 border-destructive/20 rounded-md border p-3">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}
          </div>

          {!showConfirmation && (
            <div className="bg-muted/50 flex flex-col gap-4 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-lg font-semibold">{plan.title} Plan</span>
                  <span className="text-muted-foreground text-sm">Current subscription</span>
                </div>
                <Badge variant="secondary">
                  {parseFloat(String(plan.monthlyPrice)) >= 0
                    ? `${plan.currency}${plan.monthlyPrice}/monthly`
                    : `${plan.monthlyPrice}/monthly`}
                </Badge>
              </div>
              <div className="flex flex-col gap-2">
                {plan.features.slice(0, 4).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Circle className="fill-primary text-primary h-2 w-2" />
                    <span className="text-muted-foreground text-sm">{feature.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!showConfirmation && (warningTitle || warningText) && (
            <div className="bg-muted/30 border-border rounded-lg border p-4">
              {warningTitle && <h3 className="text-foreground mb-2 font-semibold">{warningTitle}</h3>}
              {warningText && <p className="text-muted-foreground text-sm">{warningText}</p>}
            </div>
          )}

          {!showConfirmation ? (
            <div className="mt-auto flex flex-col gap-3 sm:flex-row">
              <Button className="flex-1" onClick={handleKeepSubscription} disabled={isLoading}>
                {isLoading ? 'Processing...' : keepButtonText || 'Keep My Subscription'}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleContinueCancellation}
                disabled={isLoading}
              >
                {continueButtonText || 'Continue Cancellation'}
              </Button>
            </div>
          ) : (
            <div className="mt-auto flex flex-col gap-4">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <h3 className="text-foreground mb-2 font-semibold">{finalTitle || 'Final Confirmation'}</h3>
                <p className="text-muted-foreground mb-2 text-sm">
                  {finalSubtitle || 'Are you sure you want to cancel your subscription?'}
                </p>
                <p className="text-destructive text-sm">
                  {finalWarningText || "This action cannot be undone and you'll lose access to all premium features."}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" className="flex-1" onClick={handleGoBack} disabled={isLoading}>
                  {goBackButtonText || 'Go Back'}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleConfirmCancellation}
                  disabled={isLoading}
                >
                  {isLoading ? 'Cancelling...' : confirmButtonText || 'Yes, Cancel Subscription'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// SubscriptionManagement Component
// ============================================================================

const SubscriptionManagement = ({ className, currentPlan, cancelSubscription, updatePlan }: SubscriptionManagementProps) => {
  return (
    <div className={cn('w-full text-left', className)}>
      <Card className="shadow-lg">
        <CardHeader className="px-4 pb-4 sm:px-6 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:gap-3 sm:text-xl">
            <div className="bg-primary/10 ring-primary/20 rounded-lg p-1.5 ring-1 sm:p-2">
              <CreditCard className="text-primary h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            Current Subscription
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Manage your billing and subscription settings
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-4 sm:space-y-8 sm:px-6">
          <div className="from-muted/30 via-muted/20 to-muted/30 border-border/50 relative overflow-hidden rounded-xl border bg-gradient-to-r p-3 sm:p-4">
            <div className="relative">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                <div className="w-full">
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold sm:text-xl">{currentPlan.plan.title} Plan</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant={currentPlan.status === 'active' ? 'default' : 'outline'}
                        className="bg-primary/90 hover:bg-primary border-0 text-xs font-medium shadow-sm sm:text-sm"
                      >
                        {currentPlan.type === 'monthly'
                          ? `${currentPlan.plan.currency}${currentPlan.plan.monthlyPrice}/month`
                          : currentPlan.type === 'yearly'
                            ? `${currentPlan.plan.yearlyPrice}/year`
                            : `${currentPlan.price}`}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-border/60 bg-background/50 text-xs shadow-sm backdrop-blur-sm sm:text-sm"
                      >
                        {currentPlan.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-xs sm:text-sm">{currentPlan.plan.description}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="via-border my-4 bg-gradient-to-r from-transparent to-transparent sm:my-6" />

          <div className="space-y-3 sm:space-y-4">
            <h4 className="flex items-center gap-2 text-base font-medium sm:text-lg">
              <div className="bg-muted ring-border/50 rounded-md p-1 ring-1 sm:p-1.5">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              </div>
              Billing Information
            </h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6">
              <div className="group from-muted to-background/10 border-border/30 hover:border-border/60 rounded-lg border bg-gradient-to-b p-2.5 transition-all duration-200 sm:p-3">
                <span className="text-muted-foreground mb-1 block text-xs sm:text-sm">Next billing date</span>
                <div className="group-hover:text-primary text-sm font-medium transition-colors duration-200 sm:text-base">
                  {currentPlan.nextBillingDate}
                </div>
              </div>
              <div className="group from-muted to-background/10 border-border/30 hover:border-border/60 rounded-lg border bg-gradient-to-b p-2.5 transition-all duration-200 sm:p-3">
                <span className="text-muted-foreground mb-1 block text-xs sm:text-sm">Payment method</span>
                <div className="group-hover:text-primary text-sm font-medium transition-colors duration-200 sm:text-base">
                  {currentPlan.paymentMethod}
                </div>
              </div>
            </div>
          </div>

          <Separator className="via-border my-4 bg-gradient-to-r from-transparent to-transparent sm:my-6" />

          <div className="flex flex-col gap-3 sm:flex-row">
            <UpdatePlanDialog className="shadow-lg transition-all duration-200 hover:shadow-xl" {...updatePlan} />
            <CancelSubscriptionDialog
              className="shadow-lg transition-all duration-200 hover:shadow-xl"
              {...cancelSubscription}
            />
          </div>

          <div className="pt-4 sm:pt-6">
            <h4 className="mb-3 text-base font-medium sm:mb-4 sm:text-lg">Current Plan Features</h4>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {currentPlan.plan.features.map((feature, index) => (
                <div
                  key={index}
                  className="group border-border/80 hover:border-primary/30 hover:bg-primary/5 flex items-center gap-2 rounded-lg border p-2 transition-all duration-200"
                >
                  <div className="bg-primary group-hover:bg-primary h-1 w-1 flex-shrink-0 rounded-full transition-all duration-200 group-hover:scale-125 sm:h-1.5 sm:w-1.5" />
                  <span className="text-muted-foreground group-hover:text-foreground text-xs transition-colors duration-200 sm:text-sm">
                    {feature.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================================
// SubscriptionClient - Main Component
// ============================================================================

interface SubscriptionClientProps {
  scope: BillingScope
  scopeId: string
}

const SubscriptionClient = ({ scope, scopeId }: SubscriptionClientProps) => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<SubscriptionData | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // Get subscription data first
      const result = await getSubscriptionData(scopeId)

      // If we have a subscription, sync with Stripe to update DB
      if (result.success && result.data?.subscriptionId) {
        await syncSubscriptionStatus(scopeId, result.data.subscriptionId)
        // Fetch fresh data after sync
        const freshResult = await getSubscriptionData(scopeId)
        if (freshResult.success && freshResult.data) {
          setData(freshResult.data)
          return
        }
      }

      // Use original result if no subscription or sync failed
      if (result.success && result.data) {
        setData(result.data)
      }
    } finally {
      setLoading(false)
    }
  }, [scopeId])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Find current plan from pricing-config SSoT
  const pricingCard = data?.priceId ? getPricingCardByPriceId(data.priceId) : undefined
  const plan: Plan = pricingCard
    ? mapPricingCardToPlan(pricingCard)
    : {
      id: 'free',
      title: 'Free',
      description: 'No active subscription',
      currency: 'RM',
      monthlyPrice: '0',
      yearlyPrice: '0',
      buttonText: 'Subscribe',
      features: [],
    }

  const isTrialing = data?.state === 'TRIALING'
  const isActive = data?.state === 'ACTIVE'

  const currentPlan: CurrentPlan = {
    plan,
    type: 'monthly',
    price: pricingCard?.price || 'RM 0',
    nextBillingDate: data?.currentPeriodEndDate
      ? new Date(data.currentPeriodEndDate).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      : 'Not set',
    paymentMethod: data?.defaultPaymentMethod || 'Not set',
    status: isActive ? 'active' : isTrialing ? 'active' : data?.state === 'CANCELLED' ? 'cancelled' : data?.state === 'PAST_DUE' ? 'past_due' : 'inactive',
  }

  const allPlans = getPricingCards('month').map(mapPricingCardToPlan)

  const handlePlanChange = async (planId: string) => {
    if (data?.subscriptionId) {
      await updateSubscriptionPlan('', data.subscriptionId, 'update', planId)
      loadData()
    } else {
      window.location.href = `/${scope}/${scopeId}/billing/checkout?plan=${planId}`
    }
  }

  const handleCancelSubscription = async () => {
    if (data?.subscriptionId) {
      await updateSubscriptionPlan('', data.subscriptionId, 'cancel')
      loadData()
    }
  }

  return (
    <div className="space-y-6">
      {isTrialing && data?.currentPeriodEndDate ? (
        <TrialExpiryCard
          trialEndDate={new Date(data.currentPeriodEndDate)}
          onUpgrade={() => { window.location.href = `/${scope}/${scopeId}/billing/checkout` }}
          features={plan.features.map((f) => f.name)}
          cancelTrial={{
            title: 'Cancel Trial',
            description: 'Are you sure you want to cancel your trial?',
            plan,
            triggerButtonText: 'Cancel Trial',
            leftPanelImageUrl: '/assets/preview.png',
            warningTitle: 'You will lose access to premium features',
            warningText: 'If you cancel your trial, you will lose access to all agency, subaccount, and features immediately.',
            onCancel: handleCancelSubscription,
            onKeepSubscription: async () => {},
          }}

        />
      ) : (
        <SubscriptionManagement
          currentPlan={currentPlan}
          updatePlan={{
            currentPlan: plan,
            plans: allPlans,
            triggerText: 'Update Plan',
            onPlanChange: handlePlanChange,
          }}
          cancelSubscription={{
            title: 'Cancel Subscription',
            description: 'Are you sure you want to cancel your subscription?',
            plan,
            leftPanelImageUrl: '/assets/preview.png',
            warningTitle: 'You will lose access to premium features',
            warningText:
              'If you cancel your subscription, you will lose access to all premium features at the end of your billing period.',
            onCancel: handleCancelSubscription,
            onKeepSubscription: async () => { },
          }}
        />
      )}
    </div>
  )
}

export { SubscriptionClient, SubscriptionManagement, UpdatePlanDialog, CancelSubscriptionDialog, TrialExpiryCard }
export default SubscriptionClient
