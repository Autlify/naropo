'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { pricingCards } from '@/lib/constants'

interface SubscriptionClientProps {
  agencyId: string
  currentPriceId?: string | null
  subscriptionId?: string | null
  status?: string | null
}

export function SubscriptionClient({
  agencyId,
  currentPriceId,
  subscriptionId,
  status,
}: SubscriptionClientProps) {
  const router = useRouter()
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [selectedPriceId, setSelectedPriceId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const currentPlan = pricingCards.find((p) => p.priceId === currentPriceId)
  const availablePlans = pricingCards.filter((p) => p.priceId && p.priceId !== currentPriceId)

  const handleChangePlan = async () => {
    if (!selectedPriceId || !subscriptionId) return
    
    setIsLoading(true)
    try {
      const res = await fetch('/api/stripe/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          agencyId,
          subscriptionId,
          newPriceId: selectedPriceId,
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update subscription')
      }
      
      toast.success('Subscription updated successfully')
      setIsUpgradeOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update subscription')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!subscriptionId) return
    
    setIsLoading(true)
    try {
      const res = await fetch('/api/stripe/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          agencyId,
          subscriptionId,
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }
      
      toast.success('Subscription will be cancelled at period end')
      setIsCancelOpen(false)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel subscription')
    } finally {
      setIsLoading(false)
    }
  }

  const canModify = status === 'ACTIVE' || status === 'TRIALING'

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Change Plan Dialog */}
      <Dialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
        <DialogTrigger asChild>
          <Button variant="default" disabled={!canModify || !subscriptionId}>
            Change plan
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Subscription Plan</DialogTitle>
            <DialogDescription>
              Select a new plan. Changes will be prorated automatically.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <label className="text-sm text-muted-foreground">Current plan</label>
              <p className="font-medium">{currentPlan?.title ?? 'No plan'}</p>
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground">New plan</label>
              <Select value={selectedPriceId} onValueChange={setSelectedPriceId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlans.map((plan) => (
                    <SelectItem key={plan.priceId} value={plan.priceId!}>
                      {plan.title} - ${plan.price}/mo
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpgradeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePlan} disabled={!selectedPriceId || isLoading}>
              {isLoading ? 'Updating...' : 'Confirm Change'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" disabled={!canModify || !subscriptionId}>
            Cancel subscription
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Your subscription will remain active until the end of the current billing period. 
              No refund will be issued for the remaining period.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="rounded-lg border bg-amber-500/10 p-4 text-sm">
              <p className="font-medium text-amber-700 dark:text-amber-400">
                What happens when you cancel:
              </p>
              <ul className="mt-2 space-y-1 text-amber-600 dark:text-amber-300">
                <li>• Access continues until period end</li>
                <li>• No prorated refund</li>
                <li>• You can reactivate anytime</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelOpen(false)}>
              Keep subscription
            </Button>
            <Button variant="destructive" onClick={handleCancelSubscription} disabled={isLoading}>
              {isLoading ? 'Cancelling...' : 'Confirm cancellation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
