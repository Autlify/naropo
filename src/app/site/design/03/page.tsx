'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CreditCard,
  DollarSign,
  Bell,
  BarChart3,
  Settings,
  Check,
  ArrowRight,
  Sparkles,
  RefreshCw,
  X,
  ChevronDown,
  ExternalLink,
  Sun,
  Moon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

/**
 * Design Sample 03: Interactive Billing Components
 * 
 * Inspired by Billing SDK showcase - interactive pricing tables,
 * subscription management UI, and payment components
 */

// Pricing Plan Card
function PricingPlanCard({ 
  name, 
  price, 
  description, 
  features, 
  popular = false,
  selected = false,
  onSelect
}: { 
  name: string
  price: string
  description: string
  features: string[]
  popular?: boolean
  selected?: boolean
  onSelect?: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-4 rounded-xl border transition-all",
        selected 
          ? "border-primary bg-primary/5" 
          : "border-border/50 hover:border-border bg-transparent",
        popular && !selected && "border-yellow-500/30 bg-yellow-500/5"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors",
            selected ? "border-primary bg-primary" : "border-muted-foreground"
          )}>
            {selected && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{name}</span>
              {popular && (
                <Badge className="text-[10px] bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                  Most popular
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xl font-bold text-foreground">{price}</span>
          <span className="text-sm text-muted-foreground">/month</span>
        </div>
      </div>
      {selected && (
        <div className="mt-4 pl-7 flex flex-wrap gap-2">
          {features.map((feature) => (
            <span key={feature} className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              {feature}
            </span>
          ))}
        </div>
      )}
    </button>
  )
}

// Subscription Banner
function SubscriptionBanner() {
  return (
    <Card className="bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 border-purple-500/30 overflow-hidden">
      <CardContent className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <Bell className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">New plan available!</h3>
            <p className="text-sm text-muted-foreground">
              Upgrade to Enterprise for unlimited features and priority support.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">Dismiss</Button>
          <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Usage Meter
function UsageMeter({ 
  label, 
  used, 
  total, 
  unit = '' 
}: { 
  label: string
  used: number
  total: number
  unit?: string
}) {
  const percentage = Math.round((used / total) * 100)
  const isWarning = percentage > 80
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground font-medium">{label}</span>
        <span className={cn(
          "text-muted-foreground",
          isWarning && "text-yellow-500"
        )}>
          {used.toLocaleString()}{unit} / {total.toLocaleString()}{unit}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all",
            isWarning 
              ? "bg-gradient-to-r from-yellow-500 to-orange-500" 
              : "bg-gradient-to-r from-blue-500 to-cyan-500"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Invoice Row
function InvoiceRow({ 
  date, 
  amount, 
  status, 
  id 
}: { 
  date: string
  amount: string
  status: 'paid' | 'pending' | 'failed'
  id: string
}) {
  const statusStyles = {
    paid: "bg-green-500/20 text-green-400 border-green-500/30",
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
  }
  
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{id}</p>
          <p className="text-xs text-muted-foreground">{date}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Badge className={cn("text-xs", statusStyles[status])}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
        <span className="text-sm font-medium text-foreground">{amount}</span>
        <Button variant="ghost" size="sm">
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Plan Update Component
function PlanUpdateCard() {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-muted/30 to-transparent">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Plan Updates</CardTitle>
          <Badge variant="secondary">Coming Soon</Badge>
        </div>
        <CardDescription>
          New features and improvements for your subscription
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">API Usage Insights</p>
            <p className="text-xs text-muted-foreground">Detailed analytics for your API consumption</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <RefreshCw className="h-4 w-4 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Auto-scaling</p>
            <p className="text-xs text-muted-foreground">Automatically adjust resources based on usage</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Cancellation Flow
function CancellationFlow() {
  const [step, setStep] = useState(0)
  
  return (
    <Card className="border-border/50 bg-gradient-to-br from-muted/30 to-transparent">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <X className="h-5 w-5 text-red-400" />
          <CardTitle className="text-base">Cancellation Flow</CardTitle>
        </div>
        <CardDescription>
          Graceful subscription cancellation with retention offers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Steps */}
        <div className="flex items-center gap-2">
          {['Reason', 'Offer', 'Confirm'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                i <= step 
                  ? "bg-primary text-white" 
                  : "bg-muted text-muted-foreground"
              )}>
                {i + 1}
              </div>
              <span className={cn(
                "text-xs",
                i <= step ? "text-foreground" : "text-muted-foreground"
              )}>
                {label}
              </span>
              {i < 2 && <div className="w-8 h-px bg-border/50" />}
            </div>
          ))}
        </div>
        
        {/* Step Content */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Why are you cancelling?</p>
              <div className="space-y-2">
                {['Too expensive', 'Missing features', 'Not using it enough'].map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setStep(1)}
                    className="w-full p-3 text-left text-sm rounded-lg border border-border/50 hover:border-border transition-colors"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-3 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <p className="text-sm font-medium text-foreground">Special offer: 50% off for 3 months</p>
              <p className="text-xs text-muted-foreground">Stay with us and save $150</p>
              <div className="flex gap-2 justify-center">
                <Button size="sm" onClick={() => setStep(0)}>Accept Offer</Button>
                <Button size="sm" variant="ghost" onClick={() => setStep(2)}>Continue</Button>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-3 text-center">
              <p className="text-sm font-medium text-foreground">Are you sure?</p>
              <p className="text-xs text-muted-foreground">Your subscription will end on Feb 28, 2026</p>
              <div className="flex gap-2 justify-center">
                <Button size="sm" variant="outline" onClick={() => setStep(0)}>Keep Subscription</Button>
                <Button size="sm" variant="destructive">Cancel</Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function DesignSample03() {
  const [selectedPlan, setSelectedPlan] = useState('pro')
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly')
  
  const plans = [
    { key: 'starter', name: 'Starter', price: '$0', description: 'For developers testing locally.', features: ['Presence', 'Comments', 'Notifications'] },
    { key: 'pro', name: 'Pro', price: '$20', description: 'For companies adding collaboration.', features: ['Presence', 'Comments', 'Notifications', 'Text Editor', 'Sync Datastore'], popular: true },
    { key: 'enterprise', name: 'Enterprise', price: 'Custom', description: 'For organizations that need more.', features: ['Presence', 'Comments', 'Notifications', 'Priority Support'] },
  ]

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Billing SDK</h1>
              <p className="text-sm text-muted-foreground">Interactive billing components</p>
            </div>
          </div>
          <Badge className="bg-muted border-border/50">
            <span className="mr-2">✦</span> Components
          </Badge>
        </div>
        
        <Separator className="bg-border/50" />
        
        {/* Component Showcase Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Pricing */}
          <div className="space-y-6">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Explore Interactive Billing Components
            </h2>
            
            {/* Upgrade Plan Card */}
            <Card className="border-border/50 bg-gradient-to-br from-muted/30 to-transparent">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Upgrade Plan</CardTitle>
                  <Tabs value={billingInterval} onValueChange={(v) => setBillingInterval(v as 'monthly' | 'yearly')}>
                    <TabsList className="h-8">
                      <TabsTrigger value="monthly" className="text-xs h-6 px-3">Monthly</TabsTrigger>
                      <TabsTrigger value="yearly" className="text-xs h-6 px-3">Yearly</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {plans.map((plan) => (
                  <PricingPlanCard
                    key={plan.key}
                    name={plan.name}
                    price={plan.price}
                    description={plan.description}
                    features={plan.features}
                    popular={plan.popular}
                    selected={selectedPlan === plan.key}
                    onSelect={() => setSelectedPlan(plan.key)}
                  />
                ))}
              </CardContent>
            </Card>
            
            {/* Navigation Sidebar Preview */}
            <Card className="border-border/50 bg-gradient-to-br from-muted/30 to-transparent">
              <CardContent className="p-4 space-y-2">
                {[
                  { icon: DollarSign, label: 'Pricing', active: false },
                  { icon: Settings, label: 'Subscription Management', active: false },
                  { icon: Bell, label: 'Banner Notifications', active: false },
                  { icon: BarChart3, label: 'Usage Meters', active: false },
                  { icon: Sparkles, label: 'Plan Updates', active: true },
                  { icon: X, label: 'Cancellation Flow', active: false },
                ].map((item) => (
                  <button
                    key={item.label}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                      item.active 
                        ? "bg-primary/10 text-primary border-l-2 border-primary" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </button>
                ))}
                <Separator className="my-2" />
                <Button className="w-full" variant="outline">
                  View Component
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - Other Components */}
          <div className="space-y-6">
            {/* Theme Toggle */}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                <Sun className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                <Moon className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Banner */}
            <SubscriptionBanner />
            
            {/* Usage Meters */}
            <Card className="border-border/50 bg-gradient-to-br from-muted/30 to-transparent">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Usage Meters</CardTitle>
                <CardDescription>Current billing period usage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <UsageMeter label="API Requests" used={8432} total={10000} />
                <UsageMeter label="Storage" used={4.2} total={5} unit="GB" />
                <UsageMeter label="Team Members" used={12} total={15} />
              </CardContent>
            </Card>
            
            {/* Plan Updates & Cancellation */}
            <div className="grid sm:grid-cols-2 gap-4">
              <PlanUpdateCard />
              <CancellationFlow />
            </div>
          </div>
        </div>
        
        {/* Quick Integration Banner */}
        <Card className="bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10 border-green-500/30">
          <CardContent className="p-6 text-center">
            <Badge className="mb-3 bg-green-500/20 text-green-400 border-green-500/30">
              <Sparkles className="h-3 w-3 mr-2" />
              Quick Integration
            </Badge>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Get your billing system running in minutes
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              Drop-in React components that handle subscriptions, usage metering, and more.
            </p>
            <Button className="bg-gradient-to-r from-green-600 to-emerald-600">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
