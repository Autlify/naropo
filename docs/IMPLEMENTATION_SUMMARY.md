# Implementation Summary - Role Management & Permissions

## What Was Done

### 1. ✅ Used Existing IAM Structure
**Files**: `/src/lib/iam/authz/`
- `permissions.ts` - Permission checking functions
- `require.ts` - Auth guards with redirect/throw options  
- `resolver.ts` - Context resolution for agency/subaccount

**No new redundant files created** - Extended existing structure.

### 2. ✅ Enhanced Role Management with Permission Checks

**File Modified**: `/src/lib/queries.ts`

#### `getRolesByScope()` - Now context-aware
```typescript
// BEFORE: Only returned system roles or all roles by scope
getRolesByScope(scope, systemOnly)

// AFTER: Returns system roles + context-specific roles
getRolesByScope(scope, contextId, systemOnly)
// - System roles: Always included
// - Custom roles: Filtered by agencyId/subAccountId
```

#### `updateAgencyMemberRole()` - Now permission-checked
```typescript
// Checks: agency.members.manage permission
// Validates: Role belongs to agency (system or agency-scoped)
// Throws: Error if permission denied or invalid role
```

### 3. ✅ Updated Team Page Role Assignment

**File Modified**: `/src/app/(main)/agency/[agencyId]/team/columns.tsx`

Changes:
- Pass `agencyId` to `getRolesByScope()` for context filtering
- Permission check via existing `hasPermission('agency.members.remove')`
- Uses IAM structure - no duplication

**File Modified**: `/src/components/forms/role-assignment-form.tsx`
- Uses `updateAgencyMemberRole()` from `queries.ts`
- Error handling displays permission denied messages

## IAM Structure Usage Guide

### For Permission Checks (Simple)
```typescript
import { hasPermission, hasAgencyPermission } from '@/lib/iam/authz/permissions'

// Global permission
const canCreate = await hasPermission('funnel.content.create')

// Agency-scoped permission  
const canManage = await hasAgencyPermission(agencyId, 'agency.members.manage')
```

### For Page Guards (With Redirect)
```typescript
import { requireAgencyAccess } from '@/lib/iam/authz/require'

// In Server Component
const ctx = await requireAgencyAccess({
  agencyId,
  permissionKey: 'agency.settings.read',
  onFail: 'redirect', // or 'throw' or 'notFound'
  redirectTo: '/agency/unauthorized'
})

// ctx contains: { userId, agencyId, roleId, permissionKeys[] }
```

### For Context Resolution
```typescript
import { resolveCurrentAgencyContext } from '@/lib/iam/authz/resolver'

// Get user's role and permissions for agency
const ctx = await resolveCurrentAgencyContext({
  agencyId,
  permissionKey: 'agency.account.read'
})

if (!ctx) {
  // User doesn't have access
}

// Use ctx.permissionKeys for in-context checks
```

## Subscription Issue Investigation

### Problem
- Subscription not created in DB despite webhook received
- Agency can still access dashboard

### Root Cause Analysis

#### Check 1: Agency Table Has subscriptionId?
```sql
-- NO - Subscription is separate table with agencyId FK
SELECT * FROM "Agency" LIMIT 3;
```

The Agency table does **NOT** store `subscriptionId`. The relationship is:
```
Subscription.agencyId -> Agency.id (1:1 unique)
```

#### Check 2: Why Dashboard Access Without Subscription?

**File**: `/src/app/(main)/agency/page.tsx`
```typescript
// Line 29-31
const hasAgencyAccess = await hasPermission('agency.account.read')
```

**Current behavior**: 
- ✅ Permission check works (user has role with permission)
- ❌ No subscription validation on dashboard access
- Result: Users can access dashboard even without active subscription

#### Check 3: Webhook Not Fired Locally

**Reason**: Local development doesn't receive Stripe webhooks unless:
1. Using Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
2. Using ngrok/similar tunneling service
3. Manual webhook trigger from Stripe Dashboard

### Solutions Required

#### 1. Enable Local Webhook Testing
```bash
# Terminal 1: Start dev server
bun run dev

# Terminal 2: Forward webhooks (requires Stripe CLI)
stripe listen --forward-to http://localhost:3000/api/stripe/webhook

# Terminal 3: Trigger test events
stripe trigger customer.subscription.created
```

#### 2. Add Subscription Guard to Dashboard Pages

**Option A**: Use resolver with subscription check
```typescript
// In resolver.ts - already handles subscription status
const isInactiveSubscription = (s) => {
  if (!s.active) return true
  if (['CANCELED', 'UNPAID', 'PAST_DUE'].includes(s.status)) return true
  if (s.currentPeriodEndDate <= now) return true
  return false
}
```

**Option B**: Add explicit guard in pages
```typescript
import { requireAgencyAccess } from '@/lib/iam/authz/require'

const ctx = await requireAgencyAccess({ agencyId })

// Check subscription
const agency = await db.agency.findUnique({
  where: { id: agencyId },
  include: { Subscription: true }
})

const hasActiveSub = agency?.Subscription?.active && 
  ['ACTIVE', 'TRIALING'].includes(agency.Subscription.status)

if (!hasActiveSub) {
  redirect(`/agency/${agencyId}/billing`)
}
```

#### 3. Debug Current Subscription State
```typescript
// Add to webhook handler for debugging
console.log('🔍 Subscription Debug:', {
  subscriptionId: subscription.id,
  customerId: subscription.customer,
  status: subscription.status,
  agencyId: subscription.metadata?.agencyId,
  dbRecord: await db.subscription.findUnique({
    where: { subscritiptionId: subscription.id }
  })
})
```

## Permission Definitions Needed

Based on role management requirements, add these to seed script:

```typescript
// Role management permissions
{ 
  key: 'agency.role.create', 
  name: 'Create Custom Roles', 
  description: 'Can create custom roles for the agency' 
},
{ 
  key: 'agency.role.update', 
  name: 'Edit Custom Roles', 
  description: 'Can modify custom role permissions' 
},
{ 
  key: 'agency.role.delete', 
  name: 'Delete Custom Roles', 
  description: 'Can delete custom roles (if not in use)' 
},
{ 
  key: 'agency.members.manage', 
  name: 'Manage Team Members', 
  description: 'Can assign/change member roles' 
},
```

Assign to roles:
- **AGENCY_OWNER**: All role permissions
- **AGENCY_ADMIN**: role.update, members.manage
- **AGENCY_USER**: None (read-only)

## Next Steps

### Immediate Actions Required

1. **Test Webhook Locally**
   ```bash
   stripe listen --forward-to http://localhost:3000/api/stripe/webhook
   stripe trigger customer.subscription.created
   ```

2. **Add Permission Seeds**
   ```bash
   bun run scripts/seed-rbac-system.ts
   ```

3. **Add Subscription Guards to Critical Pages**
   - Settings page
   - Team page  
   - Billing page (already has some checks)
   - Subaccount creation

4. **Verify Role Assignment Works**
   - Test changing user role
   - Verify permission check triggers
   - Confirm custom roles filter by context

### Testing Checklist

- [ ] Stripe webhook fires locally
- [ ] Subscription created in DB
- [ ] Dashboard redirects if no subscription
- [ ] Role assignment requires permission
- [ ] Role list shows system + agency roles only
- [ ] Cannot assign roles from other agencies
- [ ] Permission denied shows proper error

## Files Changed

✅ `/src/lib/iam/authz/permissions.ts` - Reverted redundant additions
✅ `/src/lib/queries.ts` - Enhanced with permission checks
✅ `/src/app/(main)/agency/[agencyId]/team/columns.tsx` - Context-aware role loading
✅ `/src/components/forms/role-assignment-form.tsx` - Uses existing IAM

❌ Deleted: `/src/lib/actions/role-actions.ts` - Redundant
❌ Deleted: `/src/lib/guards/page-guard.ts` - Use IAM require.ts instead
