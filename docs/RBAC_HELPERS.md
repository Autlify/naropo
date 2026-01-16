# RBAC Helper Functions - Clean & Simplified

## Overview

Refactored RBAC functions to follow the `verificationToken` pattern for cleaner, more reusable code.

## Design Principles

### 1. Session-Based Context (Server-Side Truth)

- **Session stores**: `activeAgencyId` and `activeSubAccountId`
- **URL params**: For routing only (agencyId, subaccountId)
- **Permission checks**: Always use session context, not URL params
- **Why?** Security, consistency, and convenience

### 2. Helper Functions Pattern

All RBAC functions follow a simple, consistent pattern:
- Single responsibility
- Clear naming
- Minimal parameters
- Type-safe returns

## Core Helper Functions

### 1. `getCurrentContext()`

**Purpose**: Get current user's active agency/subaccount from session

**Returns**:
```typescript
{
  userId: string
  activeAgencyId: string | null
  activeSubAccountId: string | null
} | null
```

**Usage**:
```typescript
const context = await getCurrentContext()
if (!context) return // Not authenticated
```

---

### 2. `getRolesByScope(scope, systemOnly?)`

**Purpose**: Get all roles filtered by scope (AGENCY or SUBACCOUNT)

**Parameters**:
- `scope`: `'AGENCY' | 'SUBACCOUNT'`
- `systemOnly`: `boolean` (default: false) - Only return system roles

**Returns**: Array of roles with permissions

**Usage**:
```typescript
// Get all system agency roles
const agencyRoles = await getRolesByScope('AGENCY', true)

// Get all subaccount roles (including custom)
const subaccountRoles = await getRolesByScope('SUBACCOUNT')
```

---

### 3. `getMemberships(scope, contextId)`

**Purpose**: Get all memberships for a specific agency or subaccount

**Parameters**:
- `scope`: `'AGENCY' | 'SUBACCOUNT'`
- `contextId`: Agency ID or SubAccount ID

**Returns**: Array of memberships with user info and roles

**Usage**:
```typescript
// Get all members of an agency
const agencyMembers = await getMemberships('AGENCY', agencyId)

// Get all members of a subaccount
const subaccountMembers = await getMemberships('SUBACCOUNT', subaccountId)
```

---

### 4. `getUserMemberships(userId)`

**Purpose**: Get ALL memberships for a user (both agency and subaccount)

**Returns**:
```typescript
{
  id: string
  email: string
  name: string
  avatarUrl: string | null
  AgencyMemberships: Array<{
    Agency: { id, name, agencyLogo }
    Role: { name, Permissions: [...] }
    isPrimary: boolean
  }>
  SubAccountMemberships: Array<{
    SubAccount: { id, name, subAccountLogo, agencyId }
    Role: { name, Permissions: [...] }
  }>
}
```

**Usage**:
```typescript
const memberships = await getUserMemberships(userId)

// Check if user belongs to any agency
if (memberships.AgencyMemberships.length === 0) {
  return redirect('/create-agency')
}

// Get primary agency
const primaryAgency = memberships.AgencyMemberships.find(m => m.isPrimary)
```

**Migration Note**:
- Old: `getUserPermissions(userId)`
- New: `getUserMemberships(userId)`
- The old function is now an alias for backward compatibility

---

### 5. `upsertRole(scope, roleName, permissionKeys, isSystem?)`

**Purpose**: Create or update a role with specific permissions

**Parameters**:
- `scope`: `'AGENCY' | 'SUBACCOUNT'`
- `roleName`: Role name (e.g., 'SALES_MANAGER')
- `permissionKeys`: Array of permission keys (e.g., `['contact.create', 'pipeline.read']`)
- `isSystem`: `boolean` (default: false) - Mark as system role

**Returns**: Created/updated role

**Usage**:
```typescript
// Create custom agency role
await upsertRole('AGENCY', 'SALES_MANAGER', [
  'contact.create',
  'contact.read',
  'contact.update',
  'pipeline.read',
  'pipeline.update'
])

// Create custom subaccount role
await upsertRole('SUBACCOUNT', 'CONTENT_EDITOR', [
  'funnel.content.read',
  'funnel.content.edit',
  'funnel.page.create'
])
```

---

### 6. `getRolePermissions(roleId, plan?)`

**Purpose**: Get all permissions for a role, optionally filtered by subscription plan

**Parameters**:
- `roleId`: Role ID
- `plan`: Optional subscription plan (e.g., 'BASIC', 'ADVANCED')

**Returns**: Array of Permission objects

**Usage**:
```typescript
const permissions = await getRolePermissions(roleId)

// TODO: Filter by plan
const permissions = await getRolePermissions(roleId, 'BASIC')
```

**TODO**: Implement plan-based permission filtering when subscription entitlement logic is ready.

---

### 7. `hasPermission(permissionKey)`

**Purpose**: Check if current user has a specific permission in their active context

**How it works**:
1. Gets current session context (`activeAgencyId`, `activeSubAccountId`)
2. If in subaccount context → checks SubAccountMembership permissions first
3. Falls back to AgencyMembership permissions
4. Returns `true` if permission found, `false` otherwise

**Usage**:
```typescript
// Check before allowing action
const canEdit = await hasPermission('funnel.content.edit')
if (!canEdit) {
  return { error: 'Access denied' }
}

// In page component
export default async function FunnelsPage() {
  if (!await hasPermission('funnel.content.read')) {
    return <Unauthorized />
  }
  
  // ... render page
}
```

---

## Context Switching: Session vs URL Params

### ❌ Don't: Use URL params for permission checks

```typescript
// BAD: URL params can be manipulated
async function deleteFunnel(funnelId: string, agencyId: string) {
  // User can pass any agencyId!
  const hasPermission = await checkPermission(userId, agencyId, 'funnel.delete')
}
```

### ✅ Do: Use session context for permission checks

```typescript
// GOOD: Session is server-controlled
async function deleteFunnel(funnelId: string) {
  // Session determines active context
  const hasPermission = await hasPermission('funnel.delete')
  if (!hasPermission) throw new Error('Access denied')
}
```

### URL Params are for Routing Only

```typescript
// URL: /agency/[agencyId]/settings
// - agencyId is for routing and data fetching
// - Permission checks use session.activeAgencyId

export default async function SettingsPage({ params }) {
  const { agencyId } = await params
  
  // Verify user has access to this agency
  const context = await getCurrentContext()
  if (context.activeAgencyId !== agencyId) {
    // User is trying to access different agency
    // Redirect or update session
  }
  
  // Permission check uses session context
  const canEdit = await hasPermission('agency.settings.update')
}
```

---

## Migration Guide

### Old Pattern → New Pattern

#### 1. Getting User Permissions

```typescript
// OLD
const permissions = await getUserPermissions(userId)

// NEW (same function, better name)
const memberships = await getUserMemberships(userId)
```

#### 2. Getting Agency Members

```typescript
// OLD
const members = await db.agencyMembership.findMany({
  where: { agencyId, isActive: true },
  include: { User: true, Role: true }
})

// NEW
const members = await getMemberships('AGENCY', agencyId)
```

#### 3. Getting Subaccount Members

```typescript
// OLD
const members = await db.subAccountMembership.findMany({
  where: { subAccountId, isActive: true },
  include: { User: true, Role: true }
})

// NEW
const members = await getMemberships('SUBACCOUNT', subaccountId)
```

#### 4. Creating Custom Roles

```typescript
// OLD - Manual process
const role = await db.role.create({
  data: { name: 'SALES_MANAGER', scope: 'AGENCY' }
})
const permissions = await db.permission.findMany({
  where: { key: { in: ['contact.create', 'contact.read'] } }
})
await db.rolePermission.createMany({
  data: permissions.map(p => ({ roleId: role.id, permissionId: p.id }))
})

// NEW - Single function
await upsertRole('AGENCY', 'SALES_MANAGER', [
  'contact.create',
  'contact.read'
])
```

---

## Common Use Cases

### 1. Loading Page Context

```typescript
export default async function AgencyPage({ params }) {
  const { agencyId } = await params
  const context = await getCurrentContext()
  
  // Verify user is in correct context
  if (context.activeAgencyId !== agencyId) {
    // Update session or redirect
  }
  
  // Check permissions
  const canManage = await hasPermission('agency.settings.update')
  
  return <AgencyDashboard canManage={canManage} />
}
```

### 2. User Settings Page with Role Selection

```typescript
export default async function UserDetailsPage({ params }) {
  const { agencyId } = await params
  
  // Get available roles for this context
  const roles = await getRolesByScope('AGENCY')
  
  // Get user's current membership
  const memberships = await getUserMemberships(userId)
  const currentRole = memberships.AgencyMemberships.find(
    m => m.Agency.id === agencyId
  )?.Role
  
  return (
    <UserDetailsForm 
      roles={roles} 
      currentRole={currentRole} 
    />
  )
}
```

### 3. Team Management

```typescript
export default async function TeamPage({ params }) {
  const { agencyId } = await params
  
  // Get all team members
  const members = await getMemberships('AGENCY', agencyId)
  
  // Get available roles for assignment
  const roles = await getRolesByScope('AGENCY')
  
  return <TeamManagement members={members} roles={roles} />
}
```

---

## Benefits of This Approach

### ✅ Cleaner Code
- Single-purpose functions
- Consistent naming
- Less boilerplate

### ✅ More Secure
- Session-based permission checks
- Server-controlled context
- URL params can't bypass security

### ✅ More Flexible
- Easy to add custom roles
- Works with any scope (AGENCY/SUBACCOUNT)
- Plan-based filtering ready (TODO)

### ✅ Better DX
- Auto-complete support
- Type-safe returns
- Clear function names

---

## Next Steps (TODO)

1. **Plan-Based Permission Filtering**
   - Filter permissions based on subscription plan
   - `getRolePermissions(roleId, plan)` implementation
   - Example: BASIC plan can't access advanced features

2. **Context Switcher UI Component**
   - Dropdown to switch between agencies
   - Dropdown to switch between subaccounts
   - Update session on switch

3. **Audit Logging**
   - Log permission changes
   - Log role assignments
   - Log context switches

4. **Permission Inheritance**
   - Parent roles inherit child permissions?
   - Agency-level permissions inherit to subaccounts?
   - Consider use cases
