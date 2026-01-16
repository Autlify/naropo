# Business Rules Audit - Complete Analysis

**Audit Date:** January 14, 2026  
**Scope:** Complete codebase review for business rule enforcement

---

## 🎯 Business Rules to Validate

1. ✅ **1 User = 1 Customer Account** (stored in `User.customerId`)
2. ✅ **1 User = 1/N Agency** (one user can own multiple agencies)
3. ✅ **1 Customer Account = 1/N Subscription** (one customer, many subscriptions)
4. ❌ **1 Subscription = 1 Agency** (each subscription maps to one agency) **VIOLATED**
5. ✅ **1 Agency = 1 Connect Account** (stored in `Agency.connectAccountId`)

---

## 📋 Detailed Findings

### ✅ Rule 1: 1 User = 1 Customer Account

**Schema Implementation:**
```prisma
model User {
  id         String  @id @default(uuid())
  email      String  @unique
  customerId String? @unique  // ✅ UNIQUE constraint enforces 1:1
}
```

**API Enforcement:**
- File: `/src/app/api/user/update-customer/route.ts`
- Creates/updates `User.customerId` via POST
- Authorization check: Users can only update their own `customerId`
- Database constraint: `@unique` prevents multiple users sharing same customer

**Flow Validation:**
1. User signs up → No `customerId` yet
2. During checkout → Creates Stripe customer → Stores in `User.customerId`
3. Subsequent checkouts → Reuses existing `customerId`

**Evidence:**
```typescript
// checkout-form.tsx lines 340-355
if (customerId) {
  finalCustomerId = customerId // Reuse existing
} else {
  // Create new customer only if none exists
  const customerRes = await fetch('/api/stripe/customer', ...)
  finalCustomerId = customerData.customerId
  
  // Store in User table
  await fetch('/api/user/update-customer', {
    body: JSON.stringify({ userId: user.id, customerId: finalCustomerId })
  })
}
```

**Status:** ✅ **CORRECTLY IMPLEMENTED**

---

### ✅ Rule 2: 1 User = 1/N Agency

**Schema Implementation:**
```prisma
model AgencyMembership {
  id       String  @id @default(uuid())
  userId   String
  agencyId String
  roleId   String
  isPrimary Boolean @default(false)
  
  @@unique([userId, agencyId]) // Prevents duplicate memberships
}
```

**Flow Validation:**
1. User can create unlimited agencies
2. Each agency gets `AgencyMembership` record
3. User becomes `AGENCY_OWNER` for agencies they create
4. First agency is marked as `isPrimary`

**Evidence:**
```typescript
// queries.ts lines 420-436
const existingAgencies = await db.agencyMembership.count({
  where: { userId: userData.id, isActive: true }
})

await db.agencyMembership.create({
  data: {
    userId: userData.id,
    agencyId: agencyId,
    roleId: role.id,
    isPrimary: existingAgencies === 0, // ✅ First agency is primary
    isActive: true,
  },
})
```

**Navigation Logic:**
- File: `/src/lib/iam/authz/resolver.ts`
- Auto-picks primary agency or most recent
- User can switch between multiple agencies

**Status:** ✅ **CORRECTLY IMPLEMENTED**

---

### ✅ Rule 3: 1 Customer Account = 1/N Subscription

**Schema Implementation:**
```prisma
model Subscription {
  id             String  @id @default(uuid())
  customerId     String
  agencyId       String? @unique  // ⚠️ This prevents multiple subscriptions
  
  @@index([customerId])  // Multiple subscriptions can share customerId
}
```

**Stripe Design:**
- One Stripe customer can have multiple subscriptions
- Schema supports via `customerId` index (not unique)
- However, `agencyId @unique` creates **CONFLICT** (see Rule 4)

**Current Implementation:**
```typescript
// create-subscription/route.ts lines 77-84
const agency = await db.agency.findFirst({
  where: { customerId },
  include: { Subscription: true },
})

const hasActiveSubscription =
  agency?.Subscription?.subscritiptionId &&
  agency.Subscription.active
```

**Problem:** Code assumes 1 customer = 1 agency, but schema allows 1 user = many agencies!

**Status:** ✅ **SCHEMA SUPPORTS IT** but ⚠️ **LOGIC BROKEN** (see Rule 4)

---

### ❌ Rule 4: 1 Subscription = 1 Agency **CRITICAL VIOLATION**

**Schema Declaration:**
```prisma
model Subscription {
  agencyId String? @unique  // ✅ Enforces 1:1 at database level
  Agency   Agency? @relation(fields: [agencyId], references: [id])
}

model Agency {
  Subscription Subscription?  // ✅ Optional 1:1 relationship
}
```

**Schema Status:** ✅ **CORRECT** - `@unique` enforces 1 subscription per agency

**Implementation VIOLATION:**

#### 🔴 Problem 1: Subscription Created BEFORE Agency

**Current Flow:**
```typescript
// checkout-form.tsx lines 420-436
// Step 2: Create subscription
const subscriptionRes = await fetch('/api/stripe/create-subscription', {
  body: JSON.stringify({
    customerId: finalCustomerId,
    priceId,
    // ... NO agencyId provided!
  })
})

// Step 3: Create agency (AFTER subscription)
await createAgencyAndRedirect(data, finalCustomerId, subscriptionData.subscriptionId)
```

**Result:** Subscription created without `agencyId` → Violates 1:1 rule!

#### 🔴 Problem 2: Webhook Tries to Link Non-Existent Agency

```typescript
// stripe-actions.ts lines 9-24
export const subscriptionCreated = async (
  subscription: Stripe.Subscription,
  customerId: string
) => {
  const agency = await db.agency.findFirst({
    where: { customerId },  // ❌ Agency doesn't exist yet during checkout!
  })
  
  if (!agency) {
    throw new Error('Could not find an agency to upsert the subscription')
    // ❌ This ALWAYS fails during new agency checkout
  }
}
```

**When Webhook Fires:**
1. User creates subscription at checkout
2. Stripe webhook `customer.subscription.created` fires
3. `subscriptionCreated()` searches for agency by `customerId`
4. **Agency doesn't exist yet** → Error thrown
5. Database record never created

**Evidence from User's Terminal:**
```
✅ Stripe customer created: cus_Tms5eDkGagWjgB
💳 Attaching payment method: pm_1SpIKQJglUPlULDQ4P8kq7xC
📝 Subscription created: {
  id: 'sub_1SpILEJglUPlULDQ5MeFJAFY',
  status: 'incomplete',  ← Subscription in Stripe
}
❌ ERROR: No database record created (webhook failed to find agency)
```

#### 🔴 Problem 3: Multiple Agencies with Same Customer

**Scenario:**
- User creates Agency A → customerId = `cus_123`
- User creates Agency B → wants to use same customerId
- Both agencies try to link to same subscription

**Current Logic:**
```typescript
// create-subscription/route.ts lines 77-78
const agency = await db.agency.findFirst({
  where: { customerId },  // ❌ Which agency if user has multiple?
})
```

**Result:** Ambiguity - which agency should own the subscription?

**Status:** ❌ **CRITICALLY VIOLATED** - Implementation completely breaks the rule

---

### ✅ Rule 5: 1 Agency = 1 Connect Account

**Schema Implementation:**
```prisma
model Agency {
  id               String  @id @default(uuid())
  connectAccountId String? @default("")
  // No unique constraint, but should be unique in practice
}
```

**Issue:** ⚠️ Missing `@unique` constraint on `connectAccountId`

**Current Usage:**
- Connect accounts created for payment processing
- Each agency should have own connect account
- No enforcement at database level

**Recommendation:** Add `@unique` constraint:
```prisma
model Agency {
  connectAccountId String? @unique
}
```

**Status:** ⚠️ **SCHEMA WEAK** but ✅ **INTENT CORRECT**

---

## 🔧 Required Fixes

### Priority 1: Fix Subscription → Agency Linking

**Problem:** Subscription created before agency exists

**Solution:** Reverse the order or use 2-phase creation

#### Option A: Create Agency First (Recommended)
```typescript
// checkout-form.tsx - NEW FLOW

async function processCheckout(data: CheckoutFormData) {
  // Step 1: Create/Get Customer
  let finalCustomerId = await getOrCreateCustomer(data)
  
  // Step 2: Create Agency FIRST (without subscription)
  const agencyId = uuid()
  await upsertAgency({
    id: agencyId,
    customerId: finalCustomerId,  // Link to customer
    name: data.agencyName,
    // ... other fields
  })
  
  // Step 3: Create AgencyMembership (user as owner)
  await createAgencyMembership(user.id, agencyId, 'AGENCY_OWNER')
  
  // Step 4: NOW create subscription with agencyId
  const subscriptionRes = await fetch('/api/stripe/create-subscription', {
    body: JSON.stringify({
      customerId: finalCustomerId,
      agencyId: agencyId,  // ✅ Link subscription to agency
      priceId,
      paymentMethodId,
      trialEnabled,
      trialPeriodDays,
    })
  })
  
  // Step 5: Redirect to agency (subscription linked via webhook)
  router.push(`/agency/${agencyId}`)
}
```

**Changes Required:**

1. **Update `create-subscription/route.ts`:**
```typescript
export async function POST(req: Request) {
  const { customerId, priceId, agencyId, ... } = await req.json()  // Add agencyId
  
  // Validate agency exists and belongs to customer
  const agency = await db.agency.findFirst({
    where: { id: agencyId, customerId }
  })
  
  if (!agency) {
    return NextResponse.json(
      { error: 'Agency not found or does not belong to customer' },
      { status: 404 }
    )
  }
  
  // Create subscription with metadata
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    metadata: {
      agencyId: agencyId  // ✅ Track which agency owns this
    },
    // ... rest of config
  })
  
  // NO database write here - webhook will handle it
}
```

2. **Update `stripe-actions.ts`:**
```typescript
export const subscriptionCreated = async (
  subscription: Stripe.Subscription,
  customerId: string
) => {
  // Get agencyId from metadata (set during creation)
  const agencyId = subscription.metadata.agencyId
  
  if (!agencyId) {
    console.error('❌ Subscription missing agencyId in metadata')
    return
  }
  
  const agency = await db.agency.findUnique({
    where: { id: agencyId }
  })
  
  if (!agency) {
    console.error('❌ Agency not found:', agencyId)
    return
  }
  
  // ✅ Now we can safely upsert
  await db.subscription.upsert({
    where: { agencyId: agency.id },
    create: {
      agencyId: agency.id,
      customerId,
      subscritiptionId: subscription.id,
      // ... other fields
    },
    update: { /* ... */ }
  })
}
```

3. **Update checkout-form.tsx:**
```typescript
// Move agency creation BEFORE subscription creation
const processCheckout = async (data: CheckoutFormData) => {
  // 1. Customer
  const finalCustomerId = await getOrCreateCustomer(data)
  
  // 2. Agency (NEW - moved before subscription)
  const agencyId = uuid()
  await createAgency({
    id: agencyId,
    customerId: finalCustomerId,
    ...data
  })
  
  // 3. Subscription (now has agencyId)
  await createSubscription({
    customerId: finalCustomerId,
    agencyId: agencyId,  // ✅ Link established
    priceId,
    ...
  })
  
  // 4. Redirect
  router.push(`/agency/${agencyId}`)
}
```

---

### Priority 2: Handle Multiple Agencies Per User

**Problem:** Code assumes 1 customer = 1 agency

**Solution:** Always pass `agencyId` when checking subscriptions

```typescript
// BEFORE (WRONG):
const agency = await db.agency.findFirst({
  where: { customerId }  // ❌ Ambiguous if user has multiple
})

// AFTER (CORRECT):
const agency = await db.agency.findUnique({
  where: { id: agencyId },  // ✅ Explicit agency reference
  include: { Subscription: true }
})

// Validate ownership
if (agency.customerId !== expectedCustomerId) {
  throw new Error('Unauthorized')
}
```

---

### Priority 3: Add Missing Constraints

**Update schema:**
```prisma
model Agency {
  connectAccountId String? @unique  // Add unique constraint
}
```

**Run migration:**
```bash
bunx prisma migrate dev --name add_connect_account_unique
```

---

## 📊 Summary Matrix

| Rule | Schema | API Logic | Webhook | Status | Priority |
|------|--------|-----------|---------|--------|----------|
| 1 User = 1 Customer | ✅ `@unique` | ✅ Enforced | N/A | ✅ PASS | - |
| 1 User = N Agency | ✅ Memberships | ✅ Correct | N/A | ✅ PASS | - |
| 1 Customer = N Subscription | ✅ Index | ⚠️ Assumes 1 | ⚠️ Assumes 1 | ⚠️ WEAK | P2 |
| 1 Subscription = 1 Agency | ✅ `@unique` | ❌ No link | ❌ Broken | ❌ FAIL | **P1** |
| 1 Agency = 1 Connect | ⚠️ Missing | ✅ Intent | N/A | ⚠️ WEAK | P3 |

---

## 🚨 Critical Path to Fix

1. **STOP** creating subscriptions before agencies
2. **ADD** `agencyId` parameter to `/api/stripe/create-subscription`
3. **MOVE** agency creation to happen BEFORE subscription in checkout flow
4. **UPDATE** webhook to read `subscription.metadata.agencyId`
5. **TEST** end-to-end flow with new user
6. **VERIFY** database records created in correct order

---

## ✅ Validation Checklist

After fixes, verify:

- [ ] New user checkout creates: User → Customer → Agency → Subscription
- [ ] `Subscription.agencyId` is populated (not null)
- [ ] Webhook successfully links subscription to correct agency
- [ ] User can create 2nd agency with same customer
- [ ] Each agency has its own subscription
- [ ] Subscription status updates reflect in agency UI
- [ ] Trial period logic works correctly
- [ ] No orphaned subscriptions in Stripe without database records

---

**Conclusion:** The schema is **mostly correct**, but the implementation violates Rule 4 by creating subscriptions before agencies exist. This causes webhook failures and prevents database records from being created.
