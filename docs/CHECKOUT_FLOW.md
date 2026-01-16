# Checkout Flow Documentation

**Version:** 1.0  
**Last Updated:** 2026-01-14  
**System:** Autlify Agency SaaS Platform

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Flow Sequence](#flow-sequence)
4. [Components](#components)
5. [API Routes](#api-routes)
6. [Webhook Processing](#webhook-processing)
7. [Database Models](#database-models)
8. [State Management](#state-management)
9. [Error Handling](#error-handling)
10. [Trial Logic](#trial-logic)
11. [Payment Scenarios](#payment-scenarios)
12. [Testing Guide](#testing-guide)

---

## Overview

The checkout flow handles the complete process of converting a visitor into a paying customer with an active agency subscription. The system creates three core entities in sequence:

1. **Stripe Customer** - Payment profile
2. **Agency** - Business entity with pre-generated UUID
3. **Subscription** - Payment plan with metadata linking to agency

### Key Features

- ✅ Multi-step wizard (4 steps)
- ✅ Trial period support (14 days default)
- ✅ Phone number international formatting
- ✅ Address autocomplete
- ✅ Coupon/discount support
- ✅ Payment method tokenization
- ✅ Webhook-driven subscription creation
- ✅ Agency-first architecture (prevents orphaned subscriptions)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CHECKOUT FLOW                            │
└─────────────────────────────────────────────────────────────────┘

USER FLOW:
┌──────┐    ┌──────────┐    ┌─────────┐    ┌───────────┐    ┌─────────┐
│ Site │ -> │ Pricing  │ -> │ Select  │ -> │  Checkout │ -> │ Agency  │
│ Page │    │   Page   │    │  Plan   │    │   Wizard  │    │Dashboard│
└──────┘    └──────────┘    └─────────┘    └───────────┘    └─────────┘
                                                  │
                                                  v
                                            4-Step Process
                                            ├── 1. Billing Info
                                            ├── 2. Agency Details
                                            ├── 3. Payment Method
                                            └── 4. Review & Submit

BACKEND FLOW:
┌──────────────────────────────────────────────────────────────────┐
│                    ENTITY CREATION SEQUENCE                      │
└──────────────────────────────────────────────────────────────────┘

Step 1: Create Stripe Customer
┌─────────────────────────┐
│  POST /api/stripe/      │
│      customer           │
│                         │
│  - Email                │
│  - Name                 │
│  - Phone (+60...)       │
│  - Address              │
│  - metadata.userId      │
└───────────┬─────────────┘
            │
            v
  ┌─────────────────┐
  │ Stripe Customer │
  │  cus_xxxxx      │
  └────────┬────────┘
           │
           v
Step 2: Link to User
┌─────────────────────────┐
│  POST /api/user/        │
│    update-customer      │
│                         │
│  User.customerId =      │
│    "cus_xxxxx"          │
└───────────┬─────────────┘
            │
            v
Step 3: Create Agency (UUID Pre-generated)
┌─────────────────────────┐
│  upsertAgency()         │
│                         │
│  Agency.id = uuid()     │ <- Generated BEFORE subscription
│  Agency.customerId =    │
│    "cus_xxxxx"          │
└───────────┬─────────────┘
            │
            v
  ┌─────────────────┐
  │ Agency          │
  │  uuid-xxxxx     │
  └────────┬────────┘
           │
           v
Step 4: Create Subscription
┌─────────────────────────┐
│  POST /api/stripe/      │
│   create-subscription   │
│                         │
│  - customerId           │
│  - priceId              │
│  - agencyId (metadata)  │ <- Links to existing agency
│  - trial_period_days    │
└───────────┬─────────────┘
            │
            v
  ┌─────────────────┐
  │ Stripe          │
  │ Subscription    │
  │  sub_xxxxx      │
  │                 │
  │ metadata:       │
  │   agencyId: ... │
  └────────┬────────┘
           │
           v
Step 5: Webhook Processing
┌─────────────────────────┐
│  Stripe Webhook         │
│  subscription.created   │
│                         │
│  - Reads agencyId from  │
│    metadata             │
│  - Validates agency     │
│    belongs to customer  │
│  - Creates DB record    │
└───────────┬─────────────┘
            │
            v
  ┌─────────────────┐
  │ DB Subscription │
  │                 │
  │ agencyId (FK)   │
  │ active: true    │
  │ status: ACTIVE  │
  │   or TRIALING   │
  └────────┬────────┘
           │
           v
Step 6: Redirect to Agency
┌─────────────────────────┐
│  router.push(           │
│    /agency/{agencyId}   │
│  )                      │
└─────────────────────────┘
```

---

## Flow Sequence

### Detailed Step-by-Step Process

#### Phase 1: User Selection (Public Site)

```
1. User visits /site/pricing
2. Selects a plan (Starter/Unlimited/Agency)
3. Clicks "Get Started" or "Upgrade"
4. Redirects to /site/pricing/checkout/{priceId}
```

#### Phase 2: Checkout Wizard (4 Steps)

**Step 1: Billing Details**
```typescript
// Form Fields:
- First Name
- Last Name
- Company Email
- Phone (with country code selector: +60)
- Address Line 1
- Address Line 2 (optional)
- City
- State/Province
- Postal Code
- Country
```

**Step 2: Agency Details**
```typescript
// Form Fields:
- Agency Name (business name)
- Company Name (legal name)
- TIN/Tax Number (optional)
```

**Step 3: Payment Method**
```typescript
// Stripe Elements Integration:
- Card Number
- Expiry Date
- CVC
- Postal Code

// Payment Method Creation:
const { paymentMethod } = await stripe.createPaymentMethod({
  type: 'card',
  card: cardElement,
  billing_details: { ... }
})
```

**Step 4: Review & Accept Terms**
```typescript
// Displays:
- Selected Plan Summary
- Billing Information
- Payment Method (last 4 digits)
- Trial Information (if applicable)
- Terms of Service checkbox
```

#### Phase 3: Backend Processing

**3.1 Customer Creation**
```typescript
// File: /api/stripe/customer/route.ts
POST /api/stripe/customer

Request Body:
{
  email: "user@example.com",
  name: "John Doe",
  phone: "+60122440788",  // Formatted with country code
  individual_name: "John Doe",
  business_name: "Acme Corp",
  address: {
    line1: "123 Main St",
    city: "Kuala Lumpur",
    state: "Kuala Lumpur",
    postal_code: "55200",
    country: "Malaysia"
  },
  shipping: { ... },
  metadata: {
    userId: "uuid-...",
    agencyName: "Acme",
    companyName: "Acme Corp",
    tinNumber: "",
    source: "checkout"
  }
}

Response:
{
  customerId: "cus_xxxxx",
  customer: { ... }
}
```

**3.2 Link Customer to User**
```typescript
// File: /api/user/update-customer/route.ts
POST /api/user/update-customer

Request Body:
{
  userId: "uuid-...",
  customerId: "cus_xxxxx"
}

Database Update:
UPDATE User 
SET customerId = "cus_xxxxx" 
WHERE id = "uuid-..."
```

**3.3 Agency Creation**
```typescript
// File: /lib/queries.ts - upsertAgency()
// PRE-GENERATE UUID BEFORE SUBSCRIPTION

const agencyId = uuid()  // Generate NOW, before subscription

const agency = await db.agency.create({
  data: {
    id: agencyId,  // Use pre-generated UUID
    customerId: "cus_xxxxx",
    name: "Acme",
    companyEmail: "user@example.com",
    companyPhone: "+60122440788",
    agencyLogo: "/assets/plura-logo.svg",
    line1: "123 Main St",
    city: "Kuala Lumpur",
    state: "Kuala Lumpur",
    postalCode: "55200",
    countryCode: "MY",
    goal: 5
  }
})
```

**3.4 Subscription Creation**
```typescript
// File: /api/stripe/create-subscription/route.ts
POST /api/stripe/create-subscription

Request Body:
{
  customerId: "cus_xxxxx",
  agencyId: "uuid-...",  // From step 3.3
  priceId: "price_...",
  paymentMethodId: "pm_...",
  trialEnabled: true,
  trialPeriodDays: 14,
  coupon: "SAVE20" (optional)
}

Stripe API Call:
const subscription = await stripe.subscriptions.create({
  customer: "cus_xxxxx",
  items: [{ price: "price_..." }],
  payment_behavior: 'default_incomplete',
  trial_period_days: 14,
  metadata: {
    agencyId: "uuid-..."  // CRITICAL: Links subscription to agency
  },
  default_payment_method: "pm_...",
  expand: ['latest_invoice.payment_intent']
})

Response Scenarios:

1. Trial Subscription:
{
  subscriptionId: "sub_xxxxx",
  status: "trialing",
  trialEnd: 1769575814,
  message: "Trial started - free until 2026-01-28"
}

2. Immediate Payment (No Trial):
{
  subscriptionId: "sub_xxxxx",
  clientSecret: "pi_xxxxx_secret_...",
  status: "incomplete",
  requiresPayment: true
}
```

**3.5 Webhook Processing**
```typescript
// File: /api/stripe/webhook/route.ts
POST /api/stripe/webhook

Event: customer.subscription.created
Event: customer.subscription.updated

Handler Flow:
1. Verify webhook signature
2. Extract subscription object
3. Read agencyId from metadata
4. Validate agency exists
5. Validate agency.customerId matches subscription.customer
6. Upsert subscription record:

await db.subscription.upsert({
  where: { agencyId: "uuid-..." },
  create: {
    agencyId: "uuid-...",
    customerId: "cus_xxxxx",
    subscritiptionId: "sub_xxxxx",
    priceId: "price_...",
    active: true,  // true for both 'active' and 'trialing'
    status: "TRIALING" | "ACTIVE",
    currentPeriodEndDate: new Date(...),
    trialEndedAt: new Date(...),  // If trialing
    plan: "STARTER" | "UNLIMITED" | "AGENCY"
  },
  update: { ... }
})
```

**3.6 Redirect**
```typescript
// File: checkout-form.tsx
router.push(`/agency/${agencyId}`)
```

---

## Components

### Frontend Components

#### 1. CheckoutForm Component
**Location:** `/app/site/pricing/checkout/[priceId]/_components/checkout-form.tsx`

**Props:**
```typescript
interface CheckoutFormProps {
  priceId: string
  planConfig: {
    name: string
    priceMonthly: number
    trialEnabled: boolean
    trialPeriodDays: number
  }
}
```

**State Management:**
```typescript
const [step, setStep] = useState(1)
const [billingData, setBillingData] = useState<BillingData | null>(null)
const [agencyData, setAgencyData] = useState<AgencyData | null>(null)
const [paymentMethodId, setPaymentMethodId] = useState<string>('')
const [isTrialAccepted, setIsTrialAccepted] = useState(false)
const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
```

**Key Methods:**
```typescript
// Phone formatting with country code
const formattedPhone = data.phoneCode && data.companyPhone 
  ? `${data.phoneCode}${data.companyPhone}` 
  : data.companyPhone

// Customer creation
const customerRes = await fetch('/api/stripe/customer', {
  method: 'POST',
  body: JSON.stringify({
    email: data.email,
    phone: formattedPhone,  // +60122440788
    // ... other fields
  })
})

// Agency creation (UUID pre-generated)
const agencyId = uuid()  // IMPORTANT: Before subscription

await upsertAgency({
  id: agencyId,
  customerId: finalCustomerId,
  // ... other fields
})

// Subscription creation (with agencyId)
const subscriptionRes = await fetch('/api/stripe/create-subscription', {
  method: 'POST',
  body: JSON.stringify({
    customerId: finalCustomerId,
    agencyId: agencyId,  // Link to existing agency
    priceId,
    paymentMethodId,
    trialEnabled,
    trialPeriodDays
  })
})
```

#### 2. PhoneCodeSelector Component
**Location:** `/_components/phone-code-selector.tsx`

**Features:**
- Country flag display
- International dialing codes
- Searchable country list
- Sets both `phoneCode` (+60) and `companyPhone` (122440788) separately

```typescript
<PhoneCodeSelector
  selectedPhoneCode={phoneCode}
  setPhoneCode={(code) => {
    setPhoneCode(code || '')
    form.setValue('phoneCode', code || '')
  }}
  phoneNumber={phoneNumber}
  onValueChange={(value, phoneCodeData) => {
    setPhoneNumber(value)
    setPhoneCode(phoneCodeData || '')
    form.setValue('companyPhone', value)  // Just the number
    form.setValue('phoneCode', phoneCodeData || '')  // Country code
  }}
/>
```

---

## API Routes

### 1. Create Customer
**Endpoint:** `POST /api/stripe/customer`

**Request:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+60122440788",
  "address": {
    "line1": "123 Main St",
    "city": "Kuala Lumpur",
    "state": "Kuala Lumpur",
    "postal_code": "55200",
    "country": "Malaysia"
  },
  "metadata": {
    "userId": "uuid-xxx",
    "agencyName": "Acme",
    "source": "checkout"
  }
}
```

**Response:**
```json
{
  "customerId": "cus_xxxxx",
  "customer": {
    "id": "cus_xxxxx",
    "email": "user@example.com",
    "phone": "+60122440788",
    "metadata": { ... }
  }
}
```

**Error Handling:**
```typescript
// Customer already exists
if (error.code === 'resource_already_exists') {
  const customers = await stripe.customers.list({ email })
  return { customerId: customers.data[0].id }
}
```

---

### 2. Update User Customer
**Endpoint:** `POST /api/user/update-customer`

**Request:**
```json
{
  "userId": "uuid-xxx",
  "customerId": "cus_xxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid-xxx",
    "customerId": "cus_xxxxx"
  }
}
```

---

### 3. Create Subscription
**Endpoint:** `POST /api/stripe/create-subscription`

**Request:**
```json
{
  "customerId": "cus_xxxxx",
  "agencyId": "uuid-xxx",
  "priceId": "price_xxx",
  "paymentMethodId": "pm_xxx",
  "trialEnabled": true,
  "trialPeriodDays": 14,
  "coupon": "SAVE20"
}
```

**Response (Trial):**
```json
{
  "subscriptionId": "sub_xxxxx",
  "status": "trialing",
  "trialEnd": 1769575814,
  "message": "Trial started - free until 2026-01-28"
}
```

**Response (Immediate Payment):**
```json
{
  "subscriptionId": "sub_xxxxx",
  "clientSecret": "pi_xxxxx_secret_xxx",
  "status": "incomplete",
  "requiresPayment": true
}
```

**Logic:**
```typescript
// Trial-enabled plans
if (trialEnabled && trialPeriodDays) {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: trialPeriodDays,
    metadata: { agencyId },
    expand: ['latest_invoice.payment_intent']
  })
  
  // Check if SetupIntent required
  if (subscription.pending_setup_intent) {
    const setupIntent = await stripe.setupIntents.retrieve(
      subscription.pending_setup_intent as string,
      { expand: ['payment_method'] }
    )
    
    return {
      subscriptionId: subscription.id,
      clientSecret: setupIntent.client_secret,
      requiresSetup: true,
      trialEnd: subscription.trial_end
    }
  }
  
  return {
    subscriptionId: subscription.id,
    status: subscription.status,
    trialEnd: subscription.trial_end
  }
}

// Non-trial plans (immediate payment)
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: priceId }],
  payment_behavior: 'error_if_incomplete',
  default_payment_method: paymentMethodId,
  metadata: { agencyId }
})
```

---

## Webhook Processing

### Event Types
**File:** `/api/stripe/webhook/route.ts`

```typescript
const stripeWebhookEvents = new Set([
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.trial_will_end',
  'setup_intent.succeeded',
  'invoice.payment_succeeded',
  'invoice.payment_failed'
])
```

### Handler: subscription.created / subscription.updated

```typescript
case 'customer.subscription.created':
case 'customer.subscription.updated': {
  const subscription = event.data.object as Stripe.Subscription
  
  // Skip connected account subscriptions
  if (subscription.metadata.connectAccountPayments) {
    console.log('SKIPPED: Connected account subscription')
    break
  }
  
  // Handle active or trialing subscriptions
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    await subscriptionCreated(
      subscription,
      subscription.customer as string
    )
    
    console.log(`✅ Subscription ${subscription.status}`, {
      id: subscription.id,
      status: subscription.status,
      trialEnd: subscription.trial_end
    })
  }
  
  break
}
```

### subscriptionCreated Function
**File:** `/lib/stripe/stripe-actions.ts`

```typescript
export const subscriptionCreated = async (
  subscription: Stripe.Subscription,
  customerId: string
) => {
  // 1. Extract agencyId from metadata
  const agencyId = subscription.metadata?.agencyId
  
  if (!agencyId) {
    throw new Error('Subscription metadata missing agencyId')
  }
  
  // 2. Fetch agency
  const agency = await db.agency.findUnique({
    where: { id: agencyId },
    include: {
      SubAccount: true,
      Subscription: true
    }
  })
  
  if (!agency) {
    throw new Error(`Agency ${agencyId} not found`)
  }
  
  // 3. Validate ownership
  if (agency.customerId !== customerId) {
    throw new Error(
      `Agency ${agencyId} does not belong to customer ${customerId}`
    )
  }
  
  // 4. Determine subscription status
  const isTrialing = subscription.status === 'trialing'
  const isActive = subscription.status === 'active' || isTrialing
  const trialEndedAt = isTrialing && subscription.trial_end 
    ? new Date(subscription.trial_end * 1000) 
    : null
  
  // 5. Prepare subscription data
  const data = {
    active: isActive,
    agencyId: agency.id,
    customerId,
    status: subscription.status.toUpperCase() as SubscriptionStatus,
    trialEndedAt,
    currentPeriodEndDate: new Date(
      subscription.items.data[0].current_period_end * 1000
    ),
    priceId: subscription.items.data[0].plan.id,
    subscritiptionId: subscription.id,
    plan: subscription.items.data[0].plan.id as Plan
  }
  
  // 6. Upsert subscription
  const result = await db.subscription.upsert({
    where: { agencyId: agency.id },
    create: data,
    update: data
  })
  
  console.log(`🟢 Created/Updated Subscription`, {
    subscriptionId: result.subscritiptionId,
    status: result.status,
    active: result.active
  })
  
  return result
}
```

---

## Database Models

### Subscription Model
**File:** `prisma/schema.prisma`

```prisma
model Subscription {
  id                   String              @id @default(uuid())
  createdAt            DateTime            @default(now())
  updatedAt            DateTime            @updatedAt
  plan                 Plan?
  price                String?
  active               Boolean             @default(false)
  
  priceId              String
  customerId           String
  currentPeriodEndDate DateTime
  subscritiptionId     String              @unique
  status               SubscriptionStatus  @default(INCOMPLETE)
  cancelAtPeriodEnd    Boolean             @default(false)
  canceledAt           DateTime?
  trialEndedAt         DateTime?
  
  agencyId             String?             @unique
  Agency               Agency?             @relation(fields: [agencyId], references: [id])
  
  @@index([customerId])
}

enum Plan {
  price_1SpLvIJglUPlULDQhOsiNiRZ // Starter
  price_1SpLvIJglUPlULDQHKBzrCcg // Unlimited
  price_1SpLvIJglUPlULDQpgC6mNt0 // Agency
}

enum SubscriptionStatus {
  INCOMPLETE
  INCOMPLETE_EXPIRED
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELED
  UNPAID
  PAUSED
}
```

### Relationship Rules

1. **User ↔ Customer**: 1:1 (User.customerId @unique)
2. **Customer ↔ Subscriptions**: 1:Many (One customer, multiple subscriptions possible)
3. **Agency ↔ Subscription**: 1:1 (Subscription.agencyId @unique)

---

## State Management

### Subscription States

```
┌────────────────────────────────────────────────────────┐
│             SUBSCRIPTION STATE MACHINE                 │
└────────────────────────────────────────────────────────┘

INCOMPLETE
    │
    ├─> (Payment Method Added) ─> TRIALING (if trial)
    │                              │
    └─> (Payment Succeeds) ───────┴─> ACTIVE
                                        │
                        ┌───────────────┴──────────────┐
                        │                              │
                    (Trial Ends)                  (Payment Fails)
                        │                              │
                        v                              v
                    ACTIVE                         PAST_DUE
                        │                              │
                        │                    (Payment Succeeds)
                        │                              │
                        │                              v
                        │                          ACTIVE
                        │
                    (Canceled)
                        │
                        v
        ┌───────────────┴──────────────┐
        │                              │
   (Immediate)                   (End of Period)
        │                              │
        v                              v
    CANCELED                        ACTIVE
                                    (cancelAtPeriodEnd: true)
                                        │
                                        v
                                    CANCELED
```

### Active Subscription Check

```typescript
// Both ACTIVE and TRIALING are considered active
const isSubscriptionActive = (subscription: Subscription) => {
  return subscription.active === true &&
         (subscription.status === 'ACTIVE' || subscription.status === 'TRIALING')
}

// Check trial status
const isInTrial = (subscription: Subscription) => {
  return subscription.status === 'TRIALING' &&
         subscription.trialEndedAt &&
         new Date(subscription.trialEndedAt) > new Date()
}

// Get days remaining in trial
const getTrialDaysRemaining = (subscription: Subscription) => {
  if (!subscription.trialEndedAt) return 0
  
  const now = new Date()
  const trialEnd = new Date(subscription.trialEndedAt)
  const diffTime = trialEnd.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays > 0 ? diffDays : 0
}
```

---

## Error Handling

### Customer Creation Errors

```typescript
try {
  const customer = await stripe.customers.create({ ... })
} catch (error) {
  if (error.code === 'resource_already_exists') {
    // Retrieve existing customer
    const customers = await stripe.customers.list({ email })
    return { customerId: customers.data[0].id }
  }
  
  if (error.code === 'invalid_request_error') {
    return NextResponse.json(
      { error: 'Invalid customer data' },
      { status: 400 }
    )
  }
  
  throw error
}
```

### Subscription Creation Errors

```typescript
try {
  const subscription = await stripe.subscriptions.create({ ... })
} catch (error) {
  if (error.code === 'resource_missing') {
    return NextResponse.json(
      { error: 'Customer or price not found' },
      { status: 404 }
    )
  }
  
  if (error.code === 'card_declined') {
    return NextResponse.json(
      { error: 'Payment method declined' },
      { status: 402 }
    )
  }
  
  throw error
}
```

### Webhook Errors

```typescript
try {
  const event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
} catch (error) {
  console.log(`🔴 Webhook signature verification failed`)
  return new NextResponse(
    `Webhook Error: ${error.message}`,
    { status: 400 }
  )
}

// Agency validation errors
if (!agencyId) {
  console.error('🔴 No agencyId in subscription metadata')
  throw new Error('Subscription metadata missing agencyId')
}

if (agency.customerId !== customerId) {
  console.error('🔴 Agency ownership mismatch')
  throw new Error(`Agency does not belong to customer`)
}
```

---

## Trial Logic

### Trial Configuration
**File:** `/lib/constants.ts`

```typescript
export const pricingCards = [
  {
    title: 'Starter',
    priceId: 'price_1SpLvIJglUPlULDQhOsiNiRZ',
    price: 'RM 0',
    trialEnabled: true,
    trialPeriodDays: 14,
    description: 'Perfect for getting started',
    features: [...]
  },
  {
    title: 'Unlimited',
    priceId: 'price_1SpLvIJglUPlULDQHKBzrCcg',
    price: 'RM 199',
    trialEnabled: true,
    trialPeriodDays: 14,
    description: 'For growing agencies',
    features: [...]
  },
  {
    title: 'Agency',
    priceId: 'price_1SpLvIJglUPlULDQpgC6mNt0',
    price: 'RM 399',
    trialEnabled: false,  // No trial for enterprise
    trialPeriodDays: 0,
    description: 'For established agencies',
    features: [...]
  }
]
```

### Trial Flow

```typescript
// 1. User accepts trial terms
const [isTrialAccepted, setIsTrialAccepted] = useState(false)

// 2. Subscription created with trial
if (trialEnabled && isTrialAccepted) {
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: 14,
    metadata: { agencyId }
  })
  
  // 3. SetupIntent may be required for payment method
  if (subscription.pending_setup_intent) {
    const setupIntent = await stripe.setupIntents.retrieve(
      subscription.pending_setup_intent
    )
    
    // User confirms payment method
    const { error } = await stripe.confirmSetup({
      setupIntent: setupIntent.client_secret,
      elements,
      confirmParams: { return_url: window.location.href }
    })
  }
  
  // 4. Subscription starts in TRIALING status
  // 5. After trial ends, first payment is automatically charged
}
```

### Trial End Webhook

```typescript
case 'customer.subscription.trial_will_end': {
  const subscription = event.data.object as Stripe.Subscription
  
  console.log('⏰ Trial ending soon', {
    subscriptionId: subscription.id,
    trialEnd: subscription.trial_end,
    daysRemaining: Math.ceil(
      (subscription.trial_end! * 1000 - Date.now()) / (1000 * 60 * 60 * 24)
    )
  })
  
  // TODO: Send email notification to customer
  // - Remind about trial ending
  // - Confirm payment method is set up
  // - Provide support contact
  
  break
}
```

---

## Payment Scenarios

### Scenario 1: Free Trial Subscription

```
User Flow:
1. Select "Starter" plan
2. Enter billing details
3. Accept trial terms
4. Add payment method
5. Complete checkout

Backend:
1. Customer created: cus_xxxxx
2. Agency created: agency-uuid
3. Subscription created with trial_period_days: 14
4. Status: TRIALING
5. Payment method attached but not charged
6. User redirected to dashboard

After 14 Days:
1. Stripe automatically charges payment method
2. Subscription status changes: TRIALING → ACTIVE
3. Webhook updates database
4. User receives invoice email
```

### Scenario 2: Immediate Payment (No Trial)

```
User Flow:
1. Select "Agency" plan (no trial)
2. Enter billing details
3. Add payment method
4. Complete checkout

Backend:
1. Customer created: cus_xxxxx
2. Agency created: agency-uuid
3. Subscription created WITHOUT trial
4. Payment immediately charged
5. If payment succeeds:
   - Status: ACTIVE
   - User redirected to dashboard
6. If payment fails:
   - Status: INCOMPLETE
   - User shown error
   - Retry payment
```

### Scenario 3: Upgrade from Trial to Paid

```
User Action:
- Clicks "Upgrade Plan" in billing page
- Selects higher tier plan

Backend:
1. Cancel current subscription (or update items)
2. Create new subscription with new priceId
3. Proration calculated automatically
4. If upgrading mid-trial:
   - New subscription starts immediately
   - Old trial ends
   - No charge until trial would have ended
5. If upgrading after trial:
   - Immediate charge for difference
   - New period starts
```

---

## Testing Guide

### Manual Testing Checklist

#### Happy Path - Trial Subscription
```
□ 1. Navigate to /site/pricing
□ 2. Select "Starter" plan (14-day trial)
□ 3. Complete Step 1: Billing Details
     - Enter phone with country code: +60 122440788
     - Verify phone formatted correctly
□ 4. Complete Step 2: Agency Details
□ 5. Complete Step 3: Payment Method
     - Use test card: 4242 4242 4242 4242
     - Exp: 12/34, CVC: 123
□ 6. Complete Step 4: Review & Accept
□ 7. Verify redirect to /agency/{agencyId}
□ 8. Check database:
     - User.customerId set
     - Agency created with UUID
     - Subscription.status = TRIALING
     - Subscription.agencyId matches
□ 9. Check Stripe Dashboard:
     - Customer exists
     - Subscription in trial
     - Payment method attached
```

#### Test Cards (Stripe Test Mode)
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Require Authentication: 4000 0025 0000 3155
Insufficient Funds: 4000 0000 0000 9995
```

#### Webhook Testing
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger events
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_succeeded
```

### Automated Testing

#### Unit Tests
```typescript
// tests/checkout/phone-formatting.test.ts
describe('Phone Formatting', () => {
  it('should format phone with country code', () => {
    const phoneCode = '+60'
    const phoneNumber = '122440788'
    const formatted = `${phoneCode}${phoneNumber}`
    
    expect(formatted).toBe('+60122440788')
  })
  
  it('should handle missing country code', () => {
    const phoneCode = ''
    const phoneNumber = '122440788'
    const formatted = phoneCode && phoneNumber 
      ? `${phoneCode}${phoneNumber}` 
      : phoneNumber
    
    expect(formatted).toBe('122440788')
  })
})
```

#### Integration Tests
```typescript
// tests/checkout/subscription-flow.test.ts
describe('Subscription Creation Flow', () => {
  it('should create agency before subscription', async () => {
    const agencyId = uuid()
    
    // Create agency
    const agency = await createAgency({ id: agencyId, ... })
    expect(agency.id).toBe(agencyId)
    
    // Create subscription with agencyId
    const subscription = await createSubscription({
      agencyId,
      customerId: 'cus_test'
    })
    
    expect(subscription.metadata.agencyId).toBe(agencyId)
  })
  
  it('should handle webhook correctly', async () => {
    const agencyId = 'test-agency-uuid'
    const subscription = {
      id: 'sub_test',
      customer: 'cus_test',
      status: 'trialing',
      metadata: { agencyId }
    }
    
    await subscriptionCreated(subscription, 'cus_test')
    
    const dbSubscription = await db.subscription.findUnique({
      where: { agencyId }
    })
    
    expect(dbSubscription).toBeDefined()
    expect(dbSubscription?.status).toBe('TRIALING')
    expect(dbSubscription?.active).toBe(true)
  })
})
```

---

## Common Issues & Solutions

### Issue 1: Phone Number Not Formatted
**Problem:** Phone saved as `122440788` instead of `+60122440788`

**Solution:**
```typescript
// ✅ Correct - Combine phoneCode + phoneNumber
const formattedPhone = data.phoneCode && data.companyPhone 
  ? `${data.phoneCode}${data.companyPhone}` 
  : data.companyPhone

// ❌ Wrong - Using phoneNumber alone
phone: data.companyPhone  // Missing country code
```

### Issue 2: Subscription Created Before Agency
**Problem:** Webhook fails because agency doesn't exist yet

**Solution:**
```typescript
// ✅ Correct Order
const agencyId = uuid()  // 1. Generate UUID
await createAgency({ id: agencyId })  // 2. Create agency
await createSubscription({ metadata: { agencyId } })  // 3. Create subscription

// ❌ Wrong Order
await createSubscription()  // Agency doesn't exist!
await createAgency()  // Too late
```

### Issue 3: Webhook Missing agencyId
**Problem:** `subscription.metadata.agencyId` is undefined

**Solution:**
```typescript
// ✅ Always include agencyId in metadata
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: priceId }],
  metadata: {
    agencyId: 'uuid-xxx'  // REQUIRED
  }
})
```

### Issue 4: Trial Not Starting
**Problem:** User charged immediately despite trial being enabled

**Solution:**
```typescript
// ✅ Correct - Include trial_period_days
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: priceId }],
  trial_period_days: 14,  // REQUIRED for trial
  metadata: { agencyId }
})

// ❌ Wrong - Missing trial_period_days
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: priceId }],
  // No trial configured
})
```

---

## Conclusion

This checkout flow is designed to be:

- **Reliable**: Agency created before subscription prevents orphaned subscriptions
- **Secure**: Webhook signature verification and customer ownership validation
- **Scalable**: Metadata-based linking allows multiple subscriptions per customer
- **Flexible**: Supports both trial and immediate payment scenarios
- **Debuggable**: Comprehensive logging at each step

For questions or issues, contact the development team or refer to:
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Prisma Documentation](https://www.prisma.io/docs)
