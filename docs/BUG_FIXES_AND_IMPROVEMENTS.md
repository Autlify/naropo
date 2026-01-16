# Bug Fixes and Improvements

**Version:** 1.0  
**Last Updated:** 2026-01-14  
**System:** Autlify Agency SaaS Platform

---

## Completed Fixes

### 1. ✅ Billing Page Subscription Detection

**Issue**: Only checked `active` boolean field, ignoring `status` enum (TRIALING, ACTIVE, PAST_DUE)

**Files Modified**:
- `/src/app/(main)/agency/[agencyId]/billing/page.tsx`
- `/src/app/(main)/agency/[agencyId]/billing/_components/subscription-helper.tsx`

**Changes**:
```typescript
// BEFORE (incorrect):
planExists={agencySubscription?.Subscription?.active === true}

// AFTER (correct):
const isSubscriptionActive = 
  agencySubscription?.Subscription?.active === true &&
  (agencySubscription?.Subscription?.status === 'ACTIVE' || 
   agencySubscription?.Subscription?.status === 'TRIALING')

planExists={isSubscriptionActive}
```

**Features Added**:
- ✅ Subscription status badge (ACTIVE, TRIALING, PAST_DUE, etc.)
- ✅ Trial period display with days remaining
- ✅ Trial end date formatting
- ✅ Current period end date display
- ✅ Payment required alerts for PAST_DUE status
- ✅ Suspended account alerts for UNPAID status
- ✅ Status-specific color coding (green, blue, orange, red)

---

### 2. ✅ Settings Page Subscription Awareness

**Issue**: No subscription data displayed, no plan tier indicators

**Files Modified**:
- `/src/app/(main)/agency/[agencyId]/settings/page.tsx`

**Features Added**:
- ✅ Current plan badge with subscription status
- ✅ Trial period indicator (if active)
- ✅ Feature access cards showing:
  - Whitelabel (Agency plan only)
  - Unlimited Subaccounts (Unlimited/Agency plans)
  - Priority Support (Agency plan only)
- ✅ Lock icons for unavailable features
- ✅ Upgrade CTA for non-Agency plans
- ✅ Direct link to billing page for plan changes

**Example**:
```tsx
<Card>
  <CardHeader>
    <Crown /> Unlimited Plan
    <Badge>TRIALING</Badge>
    Trial active - Ends January 28
  </CardHeader>
  <CardContent>
    <FeatureCard>
      <Lock /> Whitelabel - Upgrade to Agency plan
    </FeatureCard>
    <FeatureCard>
      <CheckCircle /> Unlimited Subaccounts - Available
    </FeatureCard>
  </CardContent>
</Card>
```

---

### 3. ✅ Team Page Role Management

**Issue**: No role assignment UI, only displayed current roles

**Files Created**:
- `/src/components/forms/role-assignment-form.tsx`

**Files Modified**:
- `/src/app/(main)/agency/[agencyId]/team/columns.tsx`
- `/src/lib/queries.ts` (added `updateAgencyMemberRole`, `updateSubAccountMemberRole`)

**Features Added**:
- ✅ "Change Role" dropdown menu item
- ✅ Role assignment dialog with permission preview
- ✅ Current role display
- ✅ Available roles selector (filtered by scope)
- ✅ System role indicator badge
- ✅ Real-time permission list for selected role
- ✅ Role-specific color coding (AGENCY_OWNER=green, AGENCY_ADMIN=orange, etc.)
- ✅ Permission descriptions with icons
- ✅ Automatic page refresh after role update

**New Query Functions**:
```typescript
// Update agency member role
export const updateAgencyMemberRole = async (
  userId: string,
  agencyId: string,
  roleId: string
)

// Update subaccount member role
export const updateSubAccountMemberRole = async (
  userId: string,
  subAccountId: string,
  roleId: string
)
```

---

### 4. ✅ Documentation Created

**Files Created**:
- `/docs/CHECKOUT_FLOW.md` - Comprehensive checkout flow documentation with:
  - Architecture diagrams
  - Sequence flows
  - API route documentation
  - Webhook processing
  - State machine diagrams
  - Error handling scenarios
  - Trial logic explanation
  - Testing guide with test cards
  - Common issues and solutions

---

## Verified Working Features

### Phone Number Formatting ✅

**Status**: Already implemented correctly

**Implementation**:
```typescript
// Form schema includes phoneCode field
phoneCode: z.string().optional(),

// State management
const [phoneCode, setPhoneCode] = useState<string>('')

// PhoneCodeSelector component
<PhoneCodeSelector
  onValueChange={(value, phoneCodeData) => {
    setPhoneNumber(value)
    setPhoneCode(phoneCodeData || '')
    form.setValue('companyPhone', value)  // Just the number
    form.setValue('phoneCode', phoneCodeData || '')  // Country code
  }}
/>

// Submission formatting
const formattedPhone = data.phoneCode && data.companyPhone 
  ? `${data.phoneCode}${data.companyPhone}`  // +60122440788
  : data.companyPhone
```

**Testing Recommendation**:
- ✅ Form schema includes `phoneCode` field
- ✅ PhoneCodeSelector updates both `phoneCode` and `companyPhone`
- ✅ Submission combines both values
- ⚠️ **Needs testing**: Verify in production that both values are being captured

---

## Remaining Improvements

### 1. Payment History Enhancement

**Current State**: Uses `stripe.charges.list()`

**Recommendation**: Switch to `stripe.invoices.list()` for better subscription tracking

**Proposed Change**:
```typescript
// File: /app/(main)/agency/[agencyId]/billing/page.tsx

// CURRENT:
const charges = await stripe.charges.list({
  limit: 50,
  customer: agencySubscription?.customerId,
})

// PROPOSED:
const invoices = await stripe.invoices.list({
  limit: 50,
  customer: agencySubscription?.customerId,
})

const allInvoices = invoices.data.map((invoice) => ({
  description: invoice.description || `Invoice for ${invoice.subscription}`,
  id: invoice.id,
  date: new Date(invoice.created * 1000).toLocaleDateString('en-MY'),
  status: invoice.status, // 'draft', 'open', 'paid', 'uncollectible', 'void'
  amount: `RM ${(invoice.amount_paid / 100).toFixed(2)}`,
  pdf: invoice.invoice_pdf, // Link to PDF invoice
}))
```

**Benefits**:
- ✅ More accurate for subscription-based payments
- ✅ Includes trial period information
- ✅ Shows invoice numbers
- ✅ Provides PDF download links
- ✅ Better status tracking (draft, open, paid, uncollectible, void)

---

### 2. Error Boundaries

**Current State**: No error boundaries for async operations

**Recommendation**: Add error boundaries for subscription fetching

**Proposed Implementation**:
```tsx
// File: /app/(main)/agency/[agencyId]/billing/page.tsx

import { Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
      <h2 className="text-lg font-semibold text-red-900">
        Error Loading Billing Information
      </h2>
      <p className="text-sm text-red-700 mt-2">
        {error.message}
      </p>
      <Button onClick={() => window.location.reload()} className="mt-4">
        Retry
      </Button>
    </div>
  )
}

export default async function BillingPage({ params }: Props) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<LoadingPage />}>
        {/* Existing content */}
      </Suspense>
    </ErrorBoundary>
  )
}
```

---

### 3. Webhook Error Handling Improvements

**Current State**: Basic error logging in webhook handler

**Recommendation**: Add retry logic and dead letter queue

**Proposed Changes**:
```typescript
// File: /app/api/stripe/webhook/route.ts

import { queue } from '@/lib/queue' // Hypothetical queue system

try {
  await subscriptionCreated(subscription, customerId)
} catch (error) {
  console.error('🔴 Subscription creation failed:', error)
  
  // Log to error tracking service
  await logError({
    type: 'webhook_processing_error',
    event: 'subscription.created',
    subscriptionId: subscription.id,
    customerId,
    error: error.message,
    timestamp: new Date(),
  })
  
  // Add to retry queue
  await queue.add('process-subscription-webhook', {
    subscription,
    customerId,
    attempt: 1,
    maxAttempts: 3,
  })
  
  // Return 200 to acknowledge receipt (will retry manually)
  return new NextResponse('Queued for retry', { status: 200 })
}
```

---

### 4. Payment Method Validation

**Current State**: No validation before subscription creation

**Recommendation**: Verify payment method before creating subscription

**Proposed Implementation**:
```typescript
// File: /api/stripe/create-subscription/route.ts

// Verify payment method exists and is valid
if (paymentMethodId) {
  try {
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
    
    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      )
    }
    
    // Verify it's attached to the customer
    if (paymentMethod.customer !== customerId) {
      // Attach it
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      })
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Payment method validation failed' },
      { status: 400 }
    )
  }
}
```

---

### 5. Subscription Cancellation Flow

**Current State**: No UI for subscription cancellation

**Recommendation**: Add cancellation dialog and flow

**Proposed Component**:
```tsx
// File: /components/forms/cancel-subscription-form.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'

export default function CancelSubscriptionForm({ subscriptionId }: { subscriptionId: string }) {
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(true)
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleCancel = async () => {
    setIsLoading(true)
    
    const response = await fetch('/api/stripe/cancel-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptionId,
        cancelAtPeriodEnd,
        cancellationReason: reason,
      }),
    })

    if (response.ok) {
      toast({
        title: cancelAtPeriodEnd 
          ? 'Subscription will cancel at period end' 
          : 'Subscription canceled immediately',
      })
      router.refresh()
    }

    setIsLoading(false)
  }

  return (
    <div className="space-y-4">
      <RadioGroup 
        value={cancelAtPeriodEnd ? 'end' : 'now'} 
        onValueChange={(v) => setCancelAtPeriodEnd(v === 'end')}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="end" id="end" />
          <label htmlFor="end">Cancel at period end (retain access until then)</label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="now" id="now" />
          <label htmlFor="now">Cancel immediately (lose access now)</label>
        </div>
      </RadioGroup>

      <Textarea
        placeholder="Help us improve - why are you canceling?"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />

      <Button 
        variant="destructive" 
        onClick={handleCancel}
        disabled={isLoading}
      >
        {isLoading ? 'Canceling...' : 'Confirm Cancellation'}
      </Button>
    </div>
  )
}
```

**API Route Needed**:
```typescript
// File: /app/api/stripe/cancel-subscription/route.ts

import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { subscriptionId, cancelAtPeriodEnd, cancellationReason } = await req.json()

  try {
    // Cancel in Stripe
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: cancelAtPeriodEnd,
      cancellation_details: {
        comment: cancellationReason,
      },
    })

    if (!cancelAtPeriodEnd) {
      // Immediate cancellation
      await stripe.subscriptions.cancel(subscriptionId)
    }

    // Update database
    await db.subscription.update({
      where: { subscritiptionId: subscriptionId },
      data: {
        cancelAtPeriodEnd,
        ...((!cancelAtPeriodEnd) && {
          status: 'CANCELED',
          canceledAt: new Date(),
          active: false,
        }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Cancellation failed' },
      { status: 500 }
    )
  }
}
```

---

### 6. Trial Period Edge Cases

**Current Handling**: Basic trial support

**Recommended Improvements**:

#### Early Trial Conversion
```typescript
// Allow users to convert trial to paid early
export async function POST(req: Request) {
  const { subscriptionId } = await req.json()

  const subscription = await stripe.subscriptions.update(subscriptionId, {
    trial_end: 'now', // Immediately end trial
    proration_behavior: 'none', // Don't prorate
  })

  return NextResponse.json({ subscription })
}
```

#### Trial Extension
```typescript
// Extend trial for customer service reasons
export async function POST(req: Request) {
  const { subscriptionId, additionalDays } = await req.json()

  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const currentTrialEnd = subscription.trial_end || 0
  const newTrialEnd = currentTrialEnd + (additionalDays * 24 * 60 * 60)

  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    trial_end: newTrialEnd,
  })

  return NextResponse.json({ updatedSubscription })
}
```

---

## Testing Checklist

### Subscription Status Detection ✅
- [x] ACTIVE status shows green badge
- [x] TRIALING status shows blue badge with days remaining
- [x] PAST_DUE status shows orange alert with payment button
- [x] UNPAID status shows red alert with contact support
- [x] CANCELED status shows gray badge
- [x] Trial end date displays correctly
- [x] Current period end date displays correctly

### Settings Page Features ✅
- [x] Subscription badge displays correct plan name
- [x] Trial period shows in description
- [x] Feature access cards show correct states
- [x] Upgrade CTA appears for non-Agency plans
- [x] Link to billing page works

### Role Management ✅
- [x] "Change Role" button appears in team dropdown
- [x] Role assignment dialog opens
- [x] Current role displays correctly
- [x] Available roles populate from database
- [x] Permission list shows for selected role
- [x] Role update succeeds and refreshes page
- [x] Permission denied for non-admin users
- [x] AGENCY_OWNER cannot be changed

### Phone Number Capture 🔍
- [ ] **Needs Testing**: Verify phoneCode captured in production
- [ ] **Needs Testing**: Verify phone displays as +60122440788 format
- [ ] **Needs Testing**: Check Stripe customer has correct phone
- [ ] **Needs Testing**: Verify phone syncs to agency record

---

## Monitoring Recommendations

### 1. Add Logging for Phone Capture
```typescript
// In checkout-form.tsx submission
console.log('📞 Phone Debug:', {
  phoneCode: data.phoneCode,
  companyPhone: data.companyPhone,
  formatted: formattedPhone,
  timestamp: new Date().toISOString(),
})
```

### 2. Add Subscription Metrics
```typescript
// Track subscription creations
await db.metric.create({
  data: {
    type: 'subscription_created',
    subscriptionId: subscription.id,
    status: subscription.status,
    plan: subscription.items.data[0].plan.id,
    isTrialing: subscription.status === 'trialing',
    timestamp: new Date(),
  },
})
```

### 3. Add Error Tracking
```typescript
// Integrate with error tracking service (e.g., Sentry)
import * as Sentry from '@sentry/nextjs'

try {
  // ... operation
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      context: 'subscription_creation',
      customerId,
      agencyId,
    },
  })
}
```

---

## Security Considerations

### 1. Webhook Signature Verification ✅
Already implemented:
```typescript
const event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
```

### 2. Customer Ownership Validation ✅
Already implemented:
```typescript
if (agency.customerId !== customerId) {
  throw new Error('Agency does not belong to customer')
}
```

### 3. Permission Checks ✅
Already implemented:
```typescript
const canManageTeam = await hasPermission('agency.members.remove')
```

### 4. Additional Recommendations

#### Rate Limiting
```typescript
// Add to API routes
import rateLimit from '@/lib/rate-limit'

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
})

export async function POST(req: Request) {
  try {
    await limiter.check(req, 10) // 10 requests per minute
  } catch {
    return new NextResponse('Rate limit exceeded', { status: 429 })
  }
  
  // ... rest of handler
}
```

#### Input Sanitization
```typescript
// Sanitize user inputs
import sanitizeHtml from 'sanitize-html'

const cleanDescription = sanitizeHtml(rawDescription, {
  allowedTags: [],
  allowedAttributes: {},
})
```

---

## Performance Optimizations

### 1. Parallel Data Fetching
```typescript
// Current: Sequential fetches
const agency = await db.agency.findUnique(...)
const subscription = await db.subscription.findUnique(...)

// Optimized: Parallel fetches
const [agency, subscription] = await Promise.all([
  db.agency.findUnique(...),
  db.subscription.findUnique(...),
])
```

### 2. Query Optimization
```typescript
// Include related data in single query
const agencyWithSubscription = await db.agency.findUnique({
  where: { id: agencyId },
  include: {
    Subscription: true,
    SubAccount: true,
  },
})
```

### 3. Caching Strategy
```typescript
// Cache pricing cards and Stripe prices
import { unstable_cache } from 'next/cache'

const getPrices = unstable_cache(
  async () => {
    return await stripe.prices.list({
      product: process.env.NEXT_AUTLIFY_PRODUCT_ID,
      active: true,
    })
  },
  ['stripe-prices'],
  {
    revalidate: 3600, // 1 hour
    tags: ['pricing'],
  }
)
```

---

## Conclusion

### Completed ✅
1. **Billing Page**: Proper subscription status detection with visual indicators
2. **Settings Page**: Plan tier badges and feature access indicators
3. **Team Page**: Full role management UI with permission preview
4. **Documentation**: Comprehensive checkout flow documentation

### In Progress 🚧
1. **Testing**: Phone number capture verification in production
2. **Monitoring**: Add logging for critical operations

### Recommended 💡
1. **Payment History**: Switch from charges to invoices
2. **Error Handling**: Add error boundaries and retry logic
3. **Subscription Management**: Add cancellation flow
4. **Performance**: Implement caching and parallel queries
5. **Security**: Add rate limiting and input sanitization

All major features requested have been implemented successfully! 🎉
