# 🚀 Complete Implementation Guide - Multi-Tenancy SaaS Platform

**Last Updated**: 2 January 2026  
**Status**: Ready for Phase 1 Implementation  
**Grade**: B+ (85/100) → 93/100 (after full implementation)

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Database Schema Design](#database-schema-design)
4. [Context Switching & Session Management](#context-switching--session-management)
5. [Subscription Architecture](#subscription-architecture)
6. [Free Tech Stack ($0/month)](#free-tech-stack)
7. [Implementation Roadmap](#implementation-roadmap)
8. [Enterprise Gaps & Solutions](#enterprise-gaps--solutions)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Guide](#deployment-guide)

---

# Executive Summary

## Overall Assessment

After comprehensive review of the proposed architecture against current codebase and enterprise best practices (GitHub, Stripe, Auth0, Salesforce, AWS IAM), the foundation is **solid** but requires **17 critical enhancements** to reach enterprise-grade production readiness.

**Current Grade**: **B+ (85/100)** - Good foundation, needs production hardening  
**After Implementation**: **A (93/100)** - Enterprise-ready

## Scorecard

| Category | Current | Target | Priority |
|----------|---------|--------|----------|
| **Database Schema Design** | 90/100 | 95/100 | MUST |
| **Permission Model** | 85/100 | 95/100 | MUST |
| **Security & Isolation** | 80/100 | 95/100 | MUST |
| **Performance & Caching** | 75/100 | 90/100 | SHOULD |
| **Error Handling** | 60/100 | 95/100 | MUST |
| **Observability** | 55/100 | 90/100 | MUST |
| **Testing Strategy** | 50/100 | 90/100 | MUST |
| **UI/UX Design** | 70/100 | 85/100 | SHOULD |
| **Migration Safety** | 75/100 | 95/100 | MUST |
| **Compliance (PDPA)** | 65/100 | 90/100 | SHOULD |

## 🆓 Free Tech Stack (All MUST HAVE Features)

**Total Monthly Cost**: **$0** (until ~1,000 users)

| Feature | Tool | Free Tier | Cost |
|---------|------|-----------|------|
| Database | PostgreSQL | Unlimited | $0 |
| Audit Logging | PostgreSQL table | Unlimited | $0 |
| Error Tracking | Sentry | 5k events/month | $0 |
| Logging | Pino + Better Stack | 1GB/month | $0 |
| Monitoring | Better Stack | 3 monitors | $0 |
| Rate Limiting | Upstash Redis | 10k req/day | $0 |
| Caching | Upstash Redis | 10k req/day | $0 |
| Testing | Vitest + Playwright | Unlimited | $0 |
| Hosting | Vercel | 100GB bandwidth | $0 |
| CI/CD | GitHub Actions | 2k min/month | $0 |

## Key Decisions

### ✅ Database First Approach
- **Decision**: Implement database refactoring before observability stack
- **Rationale**: Test RBAC with existing UI, incremental changes, lower risk
- **Timeline**: 1-2 weeks

### ✅ Single Subscription Model
- **Decision**: ONE subscription per agency + MULTIPLE add-ons
- **Rationale**: Industry standard (GitHub, Stripe, Slack), simple billing
- **Current Schema**: Already correct (`agencyId @unique`)

### ✅ Two-Level Context System
- **Decision**: Support Agency-level AND SubAccount-level roles
- **Rationale**: Granular access control, user can have different roles per context
- **Implementation**: Session-based context switching

### ✅ Free Tech Stack Only
- **Decision**: All MUST HAVE features use $0/month tools
- **Rationale**: No upfront costs, scales with usage, production-ready free tiers
- **Upgrade Path**: Clear pricing when hitting limits (~1,000 users)

---

# Architecture Overview

## System Context

Your application supports **multi-agency, multi-subaccount SaaS** with:
- **Multiple Agencies** per user (different roles in each)
- **Multiple SubAccounts** per agency (different access levels)
- **Subscription-based entitlements** (3 tiers: Starter, Basic, Advanced)
- **Role-Based Access Control** (RBAC) with granular permissions
- **Context Switching** (user switches between agencies/subaccounts)

```
User (john@example.com)
├── Agency A (Owner)
│   ├── Subscription: Advanced Plan (RM399/mo)
│   ├── SubAccount A1 (Admin) → Full access
│   ├── SubAccount A2 (User)  → Limited access
│   └── SubAccount A3 (Guest) → Read-only
├── Agency B (Admin)
│   ├── Subscription: Basic Plan (RM149/mo)
│   ├── SubAccount B1 (Admin)
│   └── SubAccount B2 (User)
└── Agency C (User)
    ├── Subscription: Starter Plan (RM79/mo)
    └── SubAccount C1 (Guest)
```

## Core Entities

### 1. User
- Can belong to **multiple agencies** with different roles
- Can belong to **multiple subaccounts** with different roles
- Has **one active context** (current agency + optional subaccount)
- Session tracks active context for permission checking

### 2. Agency
- **Tenant root** - all data isolated by `agencyId`
- Has **ONE subscription** (Starter/Basic/Advanced)
- Has **MULTIPLE add-ons** (extra storage, features)
- Can have **multiple team members** (via AgencyMembership)
- Can create **multiple subaccounts** (quota-limited)

### 3. SubAccount
- **Belongs to ONE agency** (strict isolation)
- Can have **multiple team members** (via SubAccountMembership)
- Has **own resources** (funnels, contacts, pipelines)
- Inherits agency's subscription limits

### 4. Role
- Can be **SYSTEM** (predefined), **AGENCY** (agency-level), or **SUBACCOUNT** (subaccount-level)
- Has **multiple permissions** (via RolePermission)
- Supports **inheritance** (optional - future enhancement)

### 5. Permission
- **3-segment key**: `{resource}.{capability}.{action}`
- Examples: `agency.settings.update`, `funnel.content.create`
- Can be **wildcard** (future: `agency.*.*`)

### 6. Subscription
- **ONE per agency** (1:1 relationship)
- Maps to **Stripe subscription**
- Determines **feature entitlements** (via PlanFeature)
- Tracks **usage** (via UsageTracking)

## Permission Key Structure

All permissions follow consistent 3-segment format:

```typescript
// Format: {resource}.{capability}.{action}

// Agency-level permissions
'agency.settings.read'        // View agency settings
'agency.settings.update'      // Update agency settings
'agency.billing.read'         // View billing information
'agency.billing.update'       // Update billing information
'agency.members.invite'       // Invite team members
'agency.members.remove'       // Remove team members
'agency.delete'               // Delete entire agency

// SubAccount management (agency-level)
'subaccount.account.create'   // Create new subaccounts
'subaccount.account.read'     // View subaccounts list
'subaccount.account.update'   // Update subaccount settings
'subaccount.account.delete'   // Delete subaccounts

// SubAccount operations (subaccount-level)
'subaccount.settings.read'    // View THIS subaccount's settings
'subaccount.settings.update'  // Update THIS subaccount's settings
'subaccount.members.invite'   // Invite to THIS subaccount
'subaccount.members.remove'   // Remove from THIS subaccount

// Funnel permissions
'funnel.content.create'       // Create funnels
'funnel.content.read'         // View funnels
'funnel.content.update'       // Edit funnels
'funnel.content.delete'       // Delete funnels
'funnel.content.publish'      // Publish funnels to production

// Contact permissions
'contact.data.create'         // Create contacts
'contact.data.read'           // View contacts
'contact.data.update'         // Update contact information
'contact.data.delete'         // Delete contacts

// Pipeline permissions
'pipeline.data.create'        // Create pipelines
'pipeline.data.read'          // View pipelines
'pipeline.data.update'        // Update pipeline stages
'pipeline.data.delete'        // Delete pipelines
```

## Entitlement Key Structure

Entitlements track **numeric limits** and **boolean features**:

```typescript
// Numeric limits (checked against usage)
'agency.subaccount.count'     // Max subaccounts (3, 10, unlimited)
'agency.members.count'        // Max team members (2, 5, 50)
'media.storage.megabytes'     // Storage quota (1000, 5000, 50000)
'automation.active.count'     // Max active automations (5, 20, unlimited)
'pipeline.custom.count'       // Max custom pipelines (3, 10, unlimited)

// Boolean features (enabled/disabled)
'agency.whitelabel.enabled'   // Remove Plura branding (false, true, true)
'agency.api.enabled'          // API access (false, false, true)
'analytics.advanced.enabled'  // Advanced analytics (false, false, true)
'support.priority.enabled'    // Priority support (false, false, true)
```

## Data Isolation Strategy

### Agency-Level Isolation

All tenant data scoped by `agencyId`:

```typescript
// ✅ CORRECT: Agency isolation
const subaccounts = await db.subAccount.findMany({
  where: { agencyId: currentAgencyId }
})

// ❌ WRONG: Missing agency isolation
const subaccounts = await db.subAccount.findMany() // Leaks data!
```

### SubAccount-Level Isolation

Resources further scoped by `subAccountId`:

```typescript
// ✅ CORRECT: SubAccount isolation
const funnels = await db.funnel.findMany({
  where: { 
    subAccountId: currentSubAccountId,
    SubAccount: { agencyId: currentAgencyId } // Double-check!
  }
})

// ❌ WRONG: Missing subaccount check
const funnels = await db.funnel.findMany({
  where: { SubAccount: { agencyId: currentAgencyId } } // Too broad!
})
```

### Permission Isolation

Permissions checked **per-context**:

```typescript
// User in Agency A (Owner) → Full access
await hasPermission('agency.billing.update') // ✅ true

// User switches to Agency B (Admin) → Limited access
await switchAgency(agencyB.id)
await hasPermission('agency.billing.update') // ❌ false
```

---

# Database Schema Design

## Complete Schema (Phase 1)

### Core RBAC Models

```prisma
// Permission catalog
model Permission {
  id          String   @id @default(uuid())
  key         String   @unique // "agency.settings.update"
  name        String
  description String?  @db.Text
  category    String   // "agency", "subaccount", "billing"
  isSystem    Boolean  @default(true)
  createdAt   DateTime @default(now())
  
  Roles RolePermission[]
  
  @@index([category])
  @@index([isSystem])
}

// Role-Permission mapping
model RolePermission {
  id           String   @id @default(uuid())
  roleId       String
  permissionId String
  granted      Boolean  @default(true)
  createdAt    DateTime @default(now())
  
  Role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  Permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  
  @@unique([roleId, permissionId])
  @@index([roleId])
  @@index([permissionId])
}

// Roles (system + custom)
model Role {
  id           String   @id @default(uuid())
  name         String
  agencyId     String?  // null = system role
  subAccountId String?  // null = not subaccount-specific
  scope        RoleScope @default(AGENCY)
  isSystem     Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  Agency                Agency?               @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  SubAccount            SubAccount?           @relation(fields: [subAccountId], references: [id], onDelete: Cascade)
  Permissions           RolePermission[]
  AgencyMemberships     AgencyMembership[]
  SubAccountMemberships SubAccountMembership[]
  
  @@unique([agencyId, subAccountId, name])
  @@index([agencyId])
  @@index([subAccountId])
  @@index([scope])
  @@index([isSystem])
}

enum RoleScope {
  SYSTEM      // Global roles (predefined)
  AGENCY      // Agency-level roles
  SUBACCOUNT  // SubAccount-level roles
}

enum EntityType {
  INDIVIDUAL
  COMPANY
  NON_PROFIT
  GOVERNMENT

  @@map("Entity")
}

// Multi-agency membership
model AgencyMembership {
  id        String   @id @default(uuid())
  userId    String
  agencyId  String
  roleId    String
  isActive  Boolean  @default(true)
  isPrimary Boolean  @default(false) // User's default agency
  joinedAt  DateTime @default(now())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  User   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  Agency Agency @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  Role   Role   @relation(fields: [roleId], references: [id], onDelete: Restrict)
  
  @@unique([userId, agencyId])
  @@index([userId])
  @@index([agencyId])
  @@index([roleId])
  @@index([isActive])
}

// SubAccount membership
model SubAccountMembership {
  id           String   @id @default(uuid())
  userId       String
  subAccountId String
  roleId       String
  isActive     Boolean  @default(true)
  joinedAt     DateTime @default(now())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  User       User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  SubAccount SubAccount @relation(fields: [subAccountId], references: [id], onDelete: Cascade)
  Role       Role       @relation(fields: [roleId], references: [id], onDelete: Restrict)
  
  @@unique([userId, subAccountId])
  @@index([userId])
  @@index([subAccountId])
  @@index([roleId])
  @@index([isActive])
}
```

### Entitlement Models

```prisma
// Entitlement features
model EntitlementFeature {
  id          String   @id @default(uuid())
  key         String   @unique // "agency.subaccount.count"
  name        String
  description String?  @db.Text
  category    String
  valueType   String   // "NUMBER", "BOOLEAN"
  unit        String?  // "count", "megabytes", "enabled"
  createdAt   DateTime @default(now())
  
  PlanFeatures PlanFeature[]
  
  @@index([category])
  @@index([valueType])
}

// Plan feature limits
model PlanFeature {
  id         String   @id @default(uuid())
  planId     String   // Stripe price ID
  featureKey String   // References EntitlementFeature.key
  limit      String   // "3", "unlimited", "true", "false"
  overage    Boolean  @default(false)
  overageFee Decimal? @db.Decimal(10, 2)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  EntitlementFeature EntitlementFeature @relation(fields: [featureKey], references: [key], onDelete: Cascade)
  
  @@unique([planId, featureKey])
  @@index([planId])
  @@index([featureKey])
}

// Usage tracking
model UsageTracking {
  id           String   @id @default(uuid())
  agencyId     String
  featureKey   String
  currentUsage Int      @default(0)
  period       String   @default("monthly")
  periodStart  DateTime @default(now())
  periodEnd    DateTime?
  updatedAt    DateTime @updatedAt
  
  Agency Agency @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  
  @@unique([agencyId, featureKey, period])
  @@index([agencyId])
  @@index([featureKey])
  @@index([periodStart, periodEnd])
}

// Tax Profile (existing from current schema)
model TaxProfile {
  id                      String     @id @default(uuid())
  entityId                String
  entityType              EntityType @default(INDIVIDUAL)
  identificationNo        String
  identificationType      String
  taxIdentificationNo     String
  taxIdentificationType   String
  taxResidenceCountryCode String
  taxPayerName            String     @default("")
  createdAt               DateTime   @default(now())
  updatedAt               DateTime   @updatedAt
  
  Agency         Agency?         @relation(map: "FK_AGENCY_TAXPROFILE")
  SubAccount     SubAccount?     @relation(map: "FK_SUBACCOUNT_TAXPROFILE")
  TaxObligations TaxObligation[]
  
  @@unique([entityId, entityType])
}

// Tax Obligation (existing from current schema)
model TaxObligation {
  id                String    @id @default(uuid())
  taxProfileId      String
  taxCategory       String    @default("")
  taxCode           String?   @default("")
  taxRegistrationNo String
  taxExmptionNo     String?
  taxRate           Decimal   @default(0) @db.Decimal(5, 4)
  description       String
  jurisdiction      String?   @default("")
  taxAuthority      String?   @default("")
  effectiveFrom     DateTime  @default(now())
  effectiveTo       DateTime?
  isActive          Boolean   @default(true)
  dueDate           DateTime
  frequency         String
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  TaxProfile TaxProfile @relation(fields: [taxProfileId], references: [id], onDelete: Cascade)
  
  @@unique([taxProfileId, taxCategory, jurisdiction])
  @@index([taxProfileId])
  @@index([isActive])
  @@index([effectiveFrom, effectiveTo])
}
```

### Session Model (Enhanced)

```prisma
model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // Context switching
  activeAgencyId     String?
  activeSubAccountId String?
  
  // Security tracking
  deviceName   String?
  ipAddress    String?
  userAgent    String?  @db.Text
  lastActiveAt DateTime @default(now())
  revokedAt    DateTime?
  
  User User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([activeAgencyId])
  @@index([activeSubAccountId])
  @@index([sessionToken])
}
```

### Updated Core Models

```prisma
// User model (backward compatible)
model User {
  id            String   @id @default(uuid())
  name          String
  email         String   @unique
  emailVerified DateTime?
  password      String?
  avatarUrl     String?  @db.Text
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // DEPRECATED (kept for migration)
  role          Role     @default(SUBACCOUNT_USER)
  agencyId      String?
  Agency        Agency?  @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  
  // New relations
  AgencyMemberships     AgencyMembership[]
  SubAccountMemberships SubAccountMembership[]
  Permissions           Permissions[]
  Tickets               Ticket[]
  Notifications         Notification[]
  Accounts              Account[]
  Sessions              Session[]
  
  @@index([agencyId])
}

// Agency model
model Agency {
  id               String      @id @default(uuid())
  connectAccountId String?     @default("")
  customerId       String      @default("")
  entityType       EntityType  @default(INDIVIDUAL)
  identificationNo String?     @default("")
  taxProfileId     String?     @unique
  name             String
  agencyLogo       String      @db.Text
  companyEmail     String      @db.Text
  companyPhone     String
  whiteLabel       Boolean     @default(true)
  building         String?     @default("")
  houseNumber      String?     @default("")
  street           String
  city             String
  zipCode          String
  state            String
  country          String
  goal             Int         @default(5)
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
  
  // Existing relations
  TaxProfile       TaxProfile?              @relation(fields: [taxProfileId], references: [id], onDelete: SetNull)
  Users            User[]
  SubAccounts      SubAccount[]
  SidebarOptions   AgencySidebarOption[]
  Invitations      Invitation[]
  Notifications    Notification[]
  Subscription     Subscription?
  AddOns           AddOns[]
  
  // New relations
  Roles            Role[]
  Memberships      AgencyMembership[]
  UsageTracking    UsageTracking[]
  
  @@index([taxProfileId])
}

// SubAccount model
model SubAccount {
  id               String      @id @default(uuid())
  connectAccountId String?     @default("")
  taxProfileId     String?     @unique
  name             String
  subAccountLogo   String      @db.Text
  createdAt        DateTime    @default(now())
  updatedAt        DateTime    @updatedAt
  companyEmail     String      @db.Text
  companyPhone     String
  goal             Int         @default(5)
  building         String?     @default("")
  houseNumber      String?     @default("")
  street           String
  city             String
  zipCode          String
  state            String
  country          String
  agencyId         String
  
  // Existing relations
  Agency           Agency                      @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  TaxProfile       TaxProfile?                 @relation(fields: [taxProfileId], references: [id], map: "FK_SUBACCOUNT_TAXPROFILE")
  SidebarOptions   SubAccountSidebarOption[]
  Permissions      Permissions[]
  Funnels          Funnel[]
  Media            Media[]
  Contacts         Contact[]
  Triggers         Trigger[]
  Automations      Automation[]
  Pipelines        Pipeline[]
  Tags             Tag[]
  Notifications    Notification[]
  
  // New relations
  Roles            Role[]
  Memberships      SubAccountMembership[]
  
  @@index([agencyId])
  @@index([taxProfileId])
}

// Subscription model (enhanced)
model Subscription {
  id                   String   @id @default(uuid())
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  plan                 Plan?
  price                String?
  active               Boolean  @default(false)
  priceId              String
  customerId           String
  currentPeriodEndDate DateTime
  subscritiptionId     String   @unique
  
  // Enhanced fields
  status               SubscriptionStatus @default(ACTIVE)
  cancelAtPeriodEnd    Boolean  @default(false)
  canceledAt           DateTime?
  trialEnd             DateTime?
  
  agencyId String @unique
  Agency   Agency @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  
  @@index([customerId])
  @@index([status])
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  TRIALING
  INCOMPLETE
  UNPAID
}
```

## System Roles (Predefined)

### Agency-Level Roles

```typescript
const AGENCY_ROLES = [
  {
    name: 'AGENCY_OWNER',
    scope: 'AGENCY',
    permissions: [
      // Full access to everything
      'agency.settings.read',
      'agency.settings.update',
      'agency.billing.read',
      'agency.billing.update',
      'agency.members.invite',
      'agency.members.remove',
      'agency.delete',
      'subaccount.account.create',
      'subaccount.account.read',
      'subaccount.account.update',
      'subaccount.account.delete',
      'funnel.content.create',
      'funnel.content.read',
      'funnel.content.update',
      'funnel.content.delete',
      'funnel.content.publish',
    ]
  },
  {
    name: 'AGENCY_ADMIN',
    scope: 'AGENCY',
    permissions: [
      // Limited access
      'agency.settings.read',
      'agency.members.invite',
      'subaccount.account.create',
      'subaccount.account.read',
      'subaccount.account.update',
      'funnel.content.create',
      'funnel.content.read',
      'funnel.content.update',
      'funnel.content.publish',
    ]
  },
  {
    name: 'AGENCY_USER',
    scope: 'AGENCY',
    permissions: [
      // Read-only
      'agency.settings.read',
      'subaccount.account.read',
      'funnel.content.read',
    ]
  },
]
```

### SubAccount-Level Roles

```typescript
const SUBACCOUNT_ROLES = [
  {
    name: 'SUBACCOUNT_ADMIN',
    scope: 'SUBACCOUNT',
    permissions: [
      // Full access within subaccount
      'subaccount.settings.read',
      'subaccount.settings.update',
      'subaccount.members.invite',
      'subaccount.members.remove',
      'funnel.content.create',
      'funnel.content.read',
      'funnel.content.update',
      'funnel.content.delete',
      'funnel.content.publish',
      'contact.data.create',
      'contact.data.read',
      'contact.data.update',
      'contact.data.delete',
      'pipeline.data.create',
      'pipeline.data.read',
      'pipeline.data.update',
      'pipeline.data.delete',
    ]
  },
  {
    name: 'SUBACCOUNT_USER',
    scope: 'SUBACCOUNT',
    permissions: [
      // Can edit but not delete
      'subaccount.settings.read',
      'funnel.content.create',
      'funnel.content.read',
      'funnel.content.update',
      'funnel.content.publish',
      'contact.data.create',
      'contact.data.read',
      'contact.data.update',
      'pipeline.data.create',
      'pipeline.data.read',
      'pipeline.data.update',
    ]
  },
  {
    name: 'SUBACCOUNT_GUEST',
    scope: 'SUBACCOUNT',
    permissions: [
      // Read-only
      'funnel.content.read',
      'contact.data.read',
      'pipeline.data.read',
    ]
  },
]
```

## Plan Features (Subscription Entitlements)

### Starter Plan (RM79/month)

```typescript
{
  planId: 'price_1Sl04VJglUPlULDQJs15RmOh',
  features: {
    'agency.subaccount.count': '3',
    'agency.members.count': '2',
    'media.storage.megabytes': '1000',
    'automation.active.count': '5',
    'pipeline.custom.count': '3',
    'agency.whitelabel.enabled': 'false',
    'agency.api.enabled': 'false',
    'analytics.advanced.enabled': 'false',
    'support.priority.enabled': 'false',
  }
}
```

### Basic Plan (RM149/month)

```typescript
{
  planId: 'price_1Sl04WJglUPlULDQSNX0WkgB',
  features: {
    'agency.subaccount.count': '10',
    'agency.members.count': '5',
    'media.storage.megabytes': '5000',
    'automation.active.count': '20',
    'pipeline.custom.count': '10',
    'agency.whitelabel.enabled': 'true',
    'agency.api.enabled': 'false',
    'analytics.advanced.enabled': 'false',
    'support.priority.enabled': 'false',
  }
}
```

### Advanced Plan (RM399/month)

```typescript
{
  planId: 'price_1Sl04WJglUPlULDQPnsAPcJe',
  features: {
    'agency.subaccount.count': 'unlimited',
    'agency.members.count': '50',
    'media.storage.megabytes': '50000',
    'automation.active.count': 'unlimited',
    'pipeline.custom.count': 'unlimited',
    'agency.whitelabel.enabled': 'true',
    'agency.api.enabled': 'true',
    'analytics.advanced.enabled': 'true',
    'support.priority.enabled': 'true',
  }
}
```

---

# Context Switching & Session Management

## Overview

Users can switch between **multiple contexts**:
1. **Agency Context** - Different agencies with different roles
2. **SubAccount Context** - Different subaccounts within current agency

## Session-Based Context Tracking

### How It Works

```typescript
// When user logs in
Session {
  userId: "user-123",
  activeAgencyId: "agency-a",  // Primary agency
  activeSubAccountId: null      // No subaccount selected
}

// When user switches to Agency B
await switchAgency("agency-b")
Session {
  userId: "user-123",
  activeAgencyId: "agency-b",   // Changed!
  activeSubAccountId: null      // Cleared!
}

// When user switches to SubAccount B1
await switchSubAccount("subaccount-b1")
Session {
  userId: "user-123",
  activeAgencyId: "agency-b",
  activeSubAccountId: "subaccount-b1"  // Set!
}

// When user clears subaccount (agency-wide view)
await switchSubAccount(null)
Session {
  userId: "user-123",
  activeAgencyId: "agency-b",
  activeSubAccountId: null      // Cleared!
}
```

## Context Switching Functions

### Get Current Context

```typescript
// src/lib/rbac.ts

export async function getCurrentContext() {
  const session = await auth()
  
  if (!session?.user?.id) {
    return { userId: null, agencyId: null, subAccountId: null }
  }
  
  // Get session with active context
  const dbSession = await db.session.findUnique({
    where: { sessionToken: session.sessionToken },
    select: { 
      userId: true, 
      activeAgencyId: true, 
      activeSubAccountId: true 
    }
  })
  
  return {
    userId: session.user.id,
    agencyId: dbSession?.activeAgencyId || null,
    subAccountId: dbSession?.activeSubAccountId || null
  }
}
```

### Switch Agency

```typescript
export async function switchAgency(agencyId: string): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authenticated')
  
  // 1. Verify user has access
  const membership = await db.agencyMembership.findUnique({
    where: {
      userId_agencyId: {
        userId: session.user.id,
        agencyId
      }
    }
  })
  
  if (!membership || !membership.isActive) {
    throw new Error('Access denied to this agency')
  }
  
  // 2. Update session
  await db.session.update({
    where: { sessionToken: session.sessionToken },
    data: {
      activeAgencyId: agencyId,
      activeSubAccountId: null, // ← Always clear subaccount!
      lastActiveAt: new Date()
    }
  })
}
```

### Switch SubAccount

```typescript
export async function switchSubAccount(subAccountId: string | null): Promise<void> {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Not authenticated')
  
  const context = await getCurrentContext()
  if (!context.agencyId) throw new Error('No active agency')
  
  // If clearing subaccount context
  if (subAccountId === null) {
    await db.session.update({
      where: { sessionToken: session.sessionToken },
      data: {
        activeSubAccountId: null,
        lastActiveAt: new Date()
      }
    })
    return
  }
  
  // Verify user has access to this subaccount
  const membership = await db.subAccountMembership.findUnique({
    where: {
      userId_subAccountId: {
        userId: session.user.id,
        subAccountId
      }
    }
  })
  
  // Verify subaccount belongs to current agency
  const subAccount = await db.subAccount.findUnique({
    where: { id: subAccountId },
    select: { agencyId: true }
  })
  
  if (!subAccount || subAccount.agencyId !== context.agencyId) {
    throw new Error('SubAccount not found in current agency')
  }
  
  if (!membership || !membership.isActive) {
    throw new Error('Access denied to this subaccount')
  }
  
  // Update session
  await db.session.update({
    where: { sessionToken: session.sessionToken },
    data: {
      activeSubAccountId: subAccountId,
      lastActiveAt: new Date()
    }
  })
}
```

### Get User's Agencies

```typescript
export async function getUserAgencies(userId: string) {
  const memberships = await db.agencyMembership.findMany({
    where: { userId, isActive: true },
    include: {
      Agency: {
        select: {
          id: true,
          name: true,
          agencyLogo: true
        }
      },
      Role: {
        select: {
          name: true
        }
      }
    },
    orderBy: [
      { isPrimary: 'desc' },
      { joinedAt: 'asc' }
    ]
  })
  
  return memberships.map(m => ({
    agencyId: m.Agency.id,
    agencyName: m.Agency.name,
    agencyLogo: m.Agency.agencyLogo,
    role: m.Role.name,
    isPrimary: m.isPrimary
  }))
}
```

### Get User's SubAccounts

```typescript
export async function getUserSubAccounts(userId: string, agencyId: string) {
  const memberships = await db.subAccountMembership.findMany({
    where: { 
      userId, 
      isActive: true,
      SubAccount: { agencyId }
    },
    include: {
      SubAccount: {
        select: {
          id: true,
          name: true,
          subAccountLogo: true
        }
      },
      Role: {
        select: {
          name: true
        }
      }
    },
    orderBy: { joinedAt: 'asc' }
  })
  
  return memberships.map(m => ({
    subAccountId: m.SubAccount.id,
    subAccountName: m.SubAccount.name,
    subAccountLogo: m.SubAccount.subAccountLogo,
    role: m.Role.name
  }))
}
```

## Context-Aware Permission Checking

### Agency-Level Permissions

```typescript
export const getUserPermissionsInAgency = cache(async (
  userId: string,
  agencyId: string
): Promise<Set<string>> => {
  const membership = await db.agencyMembership.findUnique({
    where: { userId_agencyId: { userId, agencyId } },
    include: {
      Role: {
        include: {
          Permissions: {
            where: { granted: true },
            include: { Permission: true }
          }
        }
      }
    }
  })
  
  if (!membership) return new Set()
  
  const permissions = membership.Role.Permissions.map(
    rp => rp.Permission.key
  )
  
  return new Set(permissions)
})
```

### SubAccount-Level Permissions

```typescript
export const getUserPermissionsInSubAccount = cache(async (
  userId: string,
  subAccountId: string
): Promise<Set<string>> => {
  const membership = await db.subAccountMembership.findUnique({
    where: { userId_subAccountId: { userId, subAccountId } },
    include: {
      Role: {
        include: {
          Permissions: {
            where: { granted: true },
            include: { Permission: true }
          }
        }
      }
    }
  })
  
  if (!membership) return new Set()
  
  const permissions = membership.Role.Permissions.map(
    rp => rp.Permission.key
  )
  
  return new Set(permissions)
})
```

### Unified Permission Check (With Fallback)

```typescript
export async function hasPermission(permission: string): Promise<boolean> {
  const context = await getCurrentContext()
  if (!context.userId) return false
  
  // If in subaccount context, check subaccount permissions first
  if (context.subAccountId) {
    const subAccountPerms = await getUserPermissionsInSubAccount(
      context.userId,
      context.subAccountId
    )
    
    if (subAccountPerms.has(permission)) return true
  }
  
  // Fallback to agency permissions
  if (context.agencyId) {
    const agencyPerms = await getUserPermissionsInAgency(
      context.userId,
      context.agencyId
    )
    
    return agencyPerms.has(permission)
  }
  
  return false
}

export async function requirePermission(permission: string): Promise<void> {
  const allowed = await hasPermission(permission)
  
  if (!allowed) {
    throw new Error(`Missing permission: ${permission}`)
  }
}
```

## UI Component: Context Switcher

```typescript
// src/components/global/agency-subaccount-switcher.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronsUpDown, Building2, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { switchAgency, switchSubAccount } from '@/lib/rbac'

type ContextSwitcherProps = {
  currentAgencyId: string | null
  currentSubAccountId: string | null
  agencies: Array<{
    agencyId: string
    agencyName: string
    role: string
    isPrimary: boolean
  }>
  subAccounts: Array<{
    subAccountId: string
    subAccountName: string
    role: string
  }>
}

export function ContextSwitcher({
  currentAgencyId,
  currentSubAccountId,
  agencies,
  subAccounts,
}: ContextSwitcherProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const currentAgency = agencies.find(a => a.agencyId === currentAgencyId)
  const currentSubAccount = subAccounts.find(s => s.subAccountId === currentSubAccountId)
  
  const handleSwitchAgency = async (agencyId: string) => {
    try {
      setLoading(true)
      await switchAgency(agencyId)
      router.refresh()
      setOpen(false)
    } catch (error) {
      console.error('Failed to switch agency:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSwitchSubAccount = async (subAccountId: string | null) => {
    try {
      setLoading(true)
      await switchSubAccount(subAccountId)
      router.refresh()
      setOpen(false)
    } catch (error) {
      console.error('Failed to switch subaccount:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-[300px] justify-between"
          disabled={loading}
        >
          <div className="flex items-center gap-2">
            {currentSubAccount ? (
              <>
                <Folder className="h-4 w-4" />
                <span className="truncate">{currentSubAccount.subAccountName}</span>
              </>
            ) : currentAgency ? (
              <>
                <Building2 className="h-4 w-4" />
                <span className="truncate">{currentAgency.agencyName}</span>
              </>
            ) : (
              <span>Select context...</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            
            <CommandGroup heading="Agencies">
              {agencies.map((agency) => (
                <CommandItem
                  key={agency.agencyId}
                  onSelect={() => handleSwitchAgency(agency.agencyId)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      currentAgencyId === agency.agencyId && !currentSubAccountId
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <Building2 className="mr-2 h-4 w-4" />
                  <div className="flex-1">
                    <div className="font-medium">{agency.agencyName}</div>
                    <div className="text-xs text-muted-foreground">{agency.role}</div>
                  </div>
                  {agency.isPrimary && (
                    <span className="ml-2 rounded bg-primary/10 px-2 py-0.5 text-xs">
                      Primary
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            
            {currentAgencyId && subAccounts.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="SubAccounts">
                  <CommandItem onSelect={() => handleSwitchSubAccount(null)}>
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        !currentSubAccountId ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <Building2 className="mr-2 h-4 w-4" />
                    <div className="font-medium">All SubAccounts</div>
                  </CommandItem>
                  
                  {subAccounts.map((subAccount) => (
                    <CommandItem
                      key={subAccount.subAccountId}
                      onSelect={() => handleSwitchSubAccount(subAccount.subAccountId)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          currentSubAccountId === subAccount.subAccountId
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <Folder className="mr-2 h-4 w-4" />
                      <div className="flex-1">
                        <div className="font-medium">{subAccount.subAccountName}</div>
                        <div className="text-xs text-muted-foreground">{subAccount.role}</div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
```

## Usage in Layout

```typescript
// src/app/(main)/layout.tsx

import { getCurrentContext, getUserAgencies, getUserSubAccounts } from '@/lib/rbac'
import { ContextSwitcher } from '@/components/global/agency-subaccount-switcher'

export default async function MainLayout({ children }) {
  const context = await getCurrentContext()
  
  if (!context.userId) {
    redirect('/sign-in')
  }
  
  const agencies = await getUserAgencies(context.userId)
  const subAccounts = context.agencyId 
    ? await getUserSubAccounts(context.userId, context.agencyId)
    : []
  
  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r">
        <div className="p-4">
          <ContextSwitcher
            currentAgencyId={context.agencyId}
            currentSubAccountId={context.subAccountId}
            agencies={agencies}
            subAccounts={subAccounts}
          />
        </div>
      </aside>
      <main className="flex-1">{children}</main>
    </div>
  )
}
```

## Usage in Pages

### Context-Aware Page

```typescript
// src/app/(main)/agency/settings/page.tsx

import { requirePermission, getCurrentContext } from '@/lib/rbac'

export default async function AgencySettingsPage() {
  const context = await getCurrentContext()
  
  if (!context.agencyId) {
    redirect('/select-agency')
  }
  
  // Check permission in current agency context
  await requirePermission('agency.settings.update')
  
  return <AgencySettings />
}
```

### Auto-Switch on Direct Navigation

```typescript
// src/app/(main)/subaccount/[subAccountId]/funnels/page.tsx

import { requirePermission, getCurrentContext, switchSubAccount } from '@/lib/rbac'

export default async function FunnelsPage({ params }) {
  const { subAccountId } = await params
  const context = await getCurrentContext()
  
  // Auto-switch if not already active
  if (context.subAccountId !== subAccountId) {
    await switchSubAccount(subAccountId)
  }
  
  // Check permission in current subaccount context
  await requirePermission('funnel.content.read')
  
  const funnels = await db.funnel.findMany({
    where: { subAccountId }
  })
  
  return <FunnelsView funnels={funnels} />
}
```

---

# Subscription Architecture

## Design Decision: Single Subscription + Multiple Add-Ons

**Current Schema**: ✅ Already correct!

```prisma
model Agency {
  Subscription Subscription? // 1:1 relationship
  AddOns       AddOns[]      // 1:many relationship
}

model Subscription {
  agencyId String @unique  // Enforces 1:1
  Agency   Agency @relation(fields: [agencyId], references: [id])
}
```

## Why Single Subscription?

**Industry Standard** (GitHub, Stripe, Slack, Vercel, Notion):
- ONE base plan (tiers: Starter/Basic/Advanced)
- MULTIPLE add-ons (extra features/limits)

**Benefits**:
- ✅ Simple billing logic (one subscription to check)
- ✅ Clear entitlement hierarchy (base + add-ons)
- ✅ Easy UI ("You're on the Basic plan")
- ✅ No conflicting limits
- ✅ Matches user mental model

## Entitlement Calculation

```typescript
// src/lib/entitlements.ts

export async function getAgencyLimits(agencyId: string) {
  // 1. Get base subscription
  const subscription = await db.subscription.findUnique({
    where: { agencyId }
  })
  
  if (!subscription || !subscription.active) {
    return FREE_TIER_LIMITS
  }
  
  // 2. Get base plan limits
  const baseLimits = await db.planFeature.findMany({
    where: { planId: subscription.priceId }
  })
  
  const limits = new Map<string, string>()
  baseLimits.forEach(f => limits.set(f.featureKey, f.limit))
  
  // 3. Get active add-ons
  const addOns = await db.addOns.findMany({
    where: { agencyId, active: true }
  })
  
  // 4. Apply add-on enhancements
  for (const addOn of addOns) {
    const addOnFeatures = await db.planFeature.findMany({
      where: { planId: addOn.priceId }
    })
    
    for (const feature of addOnFeatures) {
      const current = limits.get(feature.featureKey)
      const addOnLimit = feature.limit
      
      // If unlimited, set to unlimited
      if (addOnLimit === 'unlimited') {
        limits.set(feature.featureKey, 'unlimited')
        continue
      }
      
      // If current is unlimited, keep it
      if (current === 'unlimited') continue
      
      // Add numeric limits
      if (current && !isNaN(Number(current)) && !isNaN(Number(addOnLimit))) {
        const newLimit = Number(current) + Number(addOnLimit)
        limits.set(feature.featureKey, String(newLimit))
      }
      
      // For boolean features, enable if add-on enables it
      if (addOnLimit === 'true') {
        limits.set(feature.featureKey, 'true')
      }
    }
  }
  
  return Object.fromEntries(limits)
}
```

## Usage Tracking

```typescript
export async function checkEntitlementLimit(
  featureKey: string,
  agencyId: string
): Promise<{ allowed: boolean; current: number; limit: number | 'unlimited' }> {
  // Get agency's limits
  const limits = await getAgencyLimits(agencyId)
  const limitValue = limits[featureKey]
  
  if (!limitValue) {
    return { allowed: false, current: 0, limit: 0 }
  }
  
  // Check if unlimited
  if (limitValue === 'unlimited') {
    return { allowed: true, current: 0, limit: 'unlimited' }
  }
  
  // Get current usage
  const usage = await db.usageTracking.findUnique({
    where: {
      agencyId_featureKey_period: {
        agencyId,
        featureKey,
        period: 'monthly'
      }
    }
  })
  
  const current = usage?.currentUsage || 0
  const limit = parseInt(limitValue)
  
  return {
    allowed: current < limit,
    current,
    limit
  }
}

export async function incrementUsage(
  featureKey: string,
  agencyId: string,
  amount: number = 1
): Promise<void> {
  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  await db.usageTracking.upsert({
    where: {
      agencyId_featureKey_period: {
        agencyId,
        featureKey,
        period: 'monthly'
      }
    },
    update: {
      currentUsage: { increment: amount },
      updatedAt: now
    },
    create: {
      agencyId,
      featureKey,
      currentUsage: amount,
      period: 'monthly',
      periodStart,
      periodEnd
    }
  })
}
```

## Example: SubAccount Creation with Quota

```typescript
// src/app/api/subaccount/create/route.ts

import { checkEntitlementLimit, incrementUsage } from '@/lib/entitlements'
import { requirePermission, getCurrentContext } from '@/lib/rbac'

export async function POST(req: NextRequest) {
  const context = await getCurrentContext()
  
  if (!context.agencyId) {
    return NextResponse.json({ error: 'No active agency' }, { status: 400 })
  }
  
  // Check permission
  await requirePermission('subaccount.account.create')
  
  // Check quota
  const limit = await checkEntitlementLimit('agency.subaccount.count', context.agencyId)
  
  if (!limit.allowed) {
    return NextResponse.json({
      error: `SubAccount limit reached: ${limit.current}/${limit.limit}. Please upgrade your plan.`
    }, { status: 403 })
  }
  
  // Create subaccount
  const data = await req.json()
  const subAccount = await db.subAccount.create({
    data: {
      ...data,
      agencyId: context.agencyId
    }
  })
  
  // Track usage
  await incrementUsage('agency.subaccount.count', context.agencyId)
  
  return NextResponse.json(subAccount)
}
```

---

# Free Tech Stack ($0/month)

## Complete Stack

| Feature | Tool | Free Tier | Upgrade At | Cost After |
|---------|------|-----------|------------|------------|
| Database | PostgreSQL (Docker) | Unlimited | - | $0 |
| Hosting | Vercel | 100GB bandwidth | 100GB/mo | $20/mo |
| Auth | NextAuth.js | Unlimited | - | $0 |
| Error Tracking | Sentry | 5k events/mo | 5k events | $26/mo |
| Logging | Pino + Better Stack | 1GB logs/mo | 1GB | $15/mo |
| Monitoring | Better Stack | 3 monitors | 3 monitors | $15/mo |
| Caching | Upstash Redis | 10k req/day | 10k req | $10/mo |
| Rate Limiting | Upstash Redis | 10k req/day | 10k req | $10/mo |
| Testing | Vitest + Playwright | Unlimited | - | $0 |
| CI/CD | GitHub Actions | 2k min/mo | 2k min | $0 |

**Total**: $0/month → ~$100/month at scale (~1,000 users)

## Quick Setup

### Development (5 minutes)

```bash
# 1. PostgreSQL (Docker)
docker run -d \
  --name plura-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=plura \
  -p 5432:5432 \
  postgres:16-alpine

# 2. Environment
cat > .env.local << EOF
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/plura"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"
EOF

# 3. Install & Run
bun install
bunx prisma migrate dev
bun run scripts/seed-rbac-system.ts
bun dev
```

### Production (15 minutes)

```bash
# 1. Sign up free tiers (no credit card):
# - Sentry: https://sentry.io/signup/
# - Better Stack: https://betterstack.com/logs
# - Upstash: https://upstash.com/

# 2. Environment
cat > .env.production << EOF
DATABASE_URL="postgresql://..."
SENTRY_DSN="https://...@sentry.io/..."
LOGTAIL_SOURCE_TOKEN="..."
UPSTASH_REDIS_URL="https://..."
UPSTASH_REDIS_TOKEN="..."
EOF

# 3. Deploy to Vercel
vercel --prod
```

## Implementation Examples

### Audit Logging ($0 - PostgreSQL)

```typescript
// src/lib/audit.ts

export async function logAudit({
  userId,
  action,
  resourceType,
  resourceId,
  previousValue,
  newValue,
  req
}: AuditInput) {
  const ipAddress = req?.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = req?.headers.get('user-agent') || 'unknown'
  
  await db.auditLog.create({
    data: {
      userId,
      action,
      resourceType,
      resourceId,
      previousValue: previousValue ? JSON.stringify(previousValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null,
      ipAddress,
      userAgent,
    }
  })
}

// Usage
await logAudit({
  userId: session.user.id,
  action: 'ROLE_CHANGED',
  resourceType: 'USER',
  resourceId: targetUser.id,
  previousValue: { role: 'AGENCY_USER' },
  newValue: { role: 'AGENCY_ADMIN' },
  req
})
```

### Error Tracking ($0 - Sentry 5k events/mo)

```bash
bun add @sentry/nextjs
bunx @sentry/wizard@latest -i nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
})
```

### Logging ($0 - Better Stack 1GB/mo)

```bash
bun add pino pino-pretty @logtail/pino
```

```typescript
// src/lib/logger.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
})

// Usage
logger.info({ userId, agencyId }, 'User switched agency')
logger.error({ err, userId }, 'Failed to update role')
```

### Rate Limiting ($0 - Upstash 10k req/day)

```bash
bun add @upstash/ratelimit @upstash/redis
```

```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

export const userRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '10 s'),
})

// Usage in API route
const { success } = await userRateLimit.limit(userId)
if (!success) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
}
```

### Testing ($0 - Vitest + Playwright)

```bash
bun add -D vitest @vitest/ui playwright @playwright/test
```

```typescript
// tests/unit/rbac.test.ts
import { describe, it, expect } from 'vitest'
import { hasPermission } from '@/lib/rbac'

describe('RBAC', () => {
  it('should grant permission for agency owner', async () => {
    const result = await hasPermission('agency.settings.update')
    expect(result).toBe(true)
  })
})
```

```typescript
// tests/e2e/context-switching.spec.ts
import { test, expect } from '@playwright/test'

test('User can switch agencies', async ({ page }) => {
  await page.goto('/sign-in')
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')
  
  // Switch agency
  await page.click('[role="combobox"]')
  await page.click('text=Agency B')
  
  // Verify context changed
  await expect(page.locator('text=Agency B')).toBeVisible()
})
```

---


# Implementation Roadmap

## Phase 1: Database Refactoring & Core RBAC

**Priority**: CRITICAL - Must complete first

### Why Database First?

✅ **Benefits**:
- Test with existing UI pages
- Incremental changes (one page at a time)
- Rollback safety (isolated changes)
- Lower risk (no noise from new error tracking)
- Clear milestones (each page = visible progress)

### Step 1.1: Database Migration

```bash
# Create migration
bunx prisma migrate dev --name add_rbac_multi_agency_entitlements
```

See complete schema in [Database Schema Design](#database-schema-design) section above.

### Step 1.2: Seed System Data

```bash
bun run scripts/seed-rbac-system.ts
```

Creates:
- 40+ permissions (agency, subaccount, funnel, contact, pipeline)
- 6 system roles (3 agency + 3 subaccount)
- 7 entitlement features
- 15 plan features (3 plans × 5 features)

### Step 1.3: Migrate Existing Users

```bash
bun run scripts/migrate-existing-users.ts
```

Migrates `User.role `User.agencyId` → `AgencyMembership`

### Step 1.4: Create RBAC Utilities

Create:
- `src/lib/rbac.ts` - Permission checking
- `src/lib/entitlements.ts` - Quota management
- `src/components/global/agency-subaccount-switcher.tsx` - Context switcher UI

### Step 1.5: Update Pages (One by One)

**Start with one page** (e.g., agency settings):

```typescript
// Before
const session = await auth()
if (session.user.role !== 'AGENCY_OWNER') {
  return <Unauthorized />
}

// After
imp```

See complete schema in [Database Schema Design](#database-sn('agency.settings.update')
```

**Test thoroughly**, then move to next page.

### Step 1.6: Testing Checklist

- [ ] Agency-level permissions work
- [ ] SubAccount-level permissions wor- 6 system roles (3 agency + 3 subaccount)
- 7 entitlement featu-switch on direct navigation
- [ ] Usage tracking increments correctly
- [ ] Quota limits enforced
- [ ] Multi-agency access works (different roles)
- [ ] Session security (deviceName, ipAddress tracked)

---

## Phase 2: Observability Stack

**Priority**: HIGH - Start after Phase 1 is fully tested!

### Step 2.1: Audit Logging

```bash
# Add AuditLog model to schema
bunx prisma migrate dev --name add
### Step 1.5: Update Pages (One by One)

**Start with one page** (e.g., agenn
```

### Step 2.2: Error Tracking (Sentry)

```bash
bun add @sentry/nextjs
bunx @sentry/wizard@latest -i nextjs

# Sign up: https://sentry.io/signup/ (free tier, no credit card)
# Add to .env: SENTRY_DSN=...
```

### Step 2.3: Logging (Better Stack)

```bash
bun add pino pino-pretty @logtail/pino

# Sign up: https://betterstack.com/logs (free tier, no credit card)
# Add to .env: LOGTAIL_SOURCE_TOKEN=...
```

### Step 2.4: Rate Limiting (Upstash)

```bash
bun add @upstash/ratelimit @upstash/redis

# Sign up: https://upstash.com/ (free tier, no credit card)
# Add to .env: UPSTASH_REDIS_URL=... UPSTASH_REDIS_TOKEN=...
```

### Step 2.5: Testing (Vitest + Playwright)

```bash
bun add -D vitest @vitest/ui @vitest/coverage-v8 playwright @playwright/test

# Create vitest.config.ts, playwright.config.ts
# Write tests (see Free Tech Stack section)
```

---

## Phase 3: Production Deployment

**Priority**: MEDIUM - Deploy when ready

### St### Step 1.5: Update Pages (One bOption A: Supabase** (Free tier)
```bash
# https://supabase.com/
# Free: 500MB database, 2GB bandwidth
# Update .env.production: DATABASE_URL=postgresql://
# Sign up: https://sRailway** (Free $5 credit/month)
```bash
railway login
railway init
railway add po```

### Step 2.3: Logging (```

### Step 3.2: Hosting (Vercel)

```bash
# Push to GitHub
git push origin main

# Import to Vercel
# https://vercel.com/new
# Connect repo, add env vars, deploy!

# Free tier: 100GB bandwidth, auto SSL, edge functions
```

### Step 3.3: Environment Variables

```bash
# Production .env (Vercel dashboard)
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-app.vercel.app
SENTRY_DSN=https://...@sentry.io/...
LOGTAIL_SOURCE_TOKEN=...
UPSTASH_REDIS_URL=https://...
UPSTASH_REDIS_TOKEN=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_SECRET_KEY=...
```

### Step 3.4: Run M```

---

## Phase 3: Productl dashboard or CLI
bunx prisma migrate deploy
bun run scripts/seed-rbac-system.ts
```

### Step 3.5: Monitoring Setup

1. **Sentry**: View errors at https://sentry.io
2. **Better Stack**: View logs at https://betterstack.com
3. **Vercel Analytics**: Builtin (free)

---

## Implementation Priority & Checkpoints

| Priority | Phase | Tasks | Checkpoint |
|----------|-------|-------|------------|
| CRITICAL | Phase 1 | Database, RBAC, Context Switching | ✅ Working RBAC system |
| HIGH | Phase 2 | Observability, Testing | ✅ Production monitoring |
| MEDIUM | Phase 3 | Deployment, Documentation | ✅ Live production app |

---

## Testing Strategy

### Uni
#Tests (Vitest)

```bash
bun test
```

**Coverage Target**: 80%

**Test Files**:
- `tests/unit/rbac.test.ts` - Permission checking
- `tests/unit/entitlements.test.ts` - Quota limits
- `tests/unit/context-switching.test.ts` - Session management

### E2E Tests (Playwright)

```bash
bun test:e2e
```

**Critical Flows**:
- Multi-agency signup & role assignment
- Context switching (agency → subaccount)
- Permission checks per context
- Quota enforcement (create subaccounts until limit)
- Subs
1. **Sentry**: View errors aal Testing Checklist

**Agency-Level**:
- [ ] Create agency → User becomes AGENCY_OWNER
- [ ] Invite member as AGENCY_ADMIN → Can create subaccounts
- [ ] Invite member as AGENCY_USER → Can only view
- [ ] Switch to different agency → Permissions change
- [ ] Delete agency → All data cleaned up

**SubAccount-Level**:
- [ ] Create subaccount → Quota enforced
- [ ] Assign user as SUBACCOUNT_ADMIN → Full access
- [ ] Assign user as SUBACCOUNT_USER → Limited access
- [ ] Assign user as SUBACCOUNT_GUESbun teitch between subaccounts → Context updates

**Subscription**:
- [ ] Starter plan → 3 subaccounts limit works
- [ ] Upgrade to Basic → 10 subaccounts available
- [ ] Upgrade to Advanced → Unlimited subaccounts
- [ ] Add storage add-on → Limit increases
- [ ] Downgrade → Existing resources preserved but new creation blocked

**Security**:
- [ ] User cannot access other agency's data
- [ ] User cannot access subaccount without membership
- [ ] Session revocation works
- [ ] Audit logs created for all critical actions
- [ ] Ra- [ ] Invite member as# Rollback Strategy

### If Phase 1 Fails

```bash
# Revert migration
bunx prisma migrate resolve --rolled-back 20260102_add_rbac_multi_agency_entitlements

# Drop new tables
bunx prisma db execute --sql "
  DROP TABLE IF EXISTS \"UsageTracking\" CASCADE;
  DROP TABLE IF EXISTS \"PlanFeature\" CASCADE;
  DROP TABLE IF EXISTS \"EntitlementFeature\" CASCADE;
  DROP TABLE IF EXISTS \"AgencyMembership\" CASCADE;
  DROP TABLE IF EXISTS \"SubAccountMembership\" CASCADE;
  DROP TABLE IF EXISTS \"RolePermission\" CASCADE;
  DROP TABLE IF EXISTS \"Role\" CASCADE;
  DROP TABLE IF EXISTS \"Permission\" CASCADE;
"

# Push clean schema
bunx prisma db push
```

Old code continues to work (`User.role`, `User.agencyId` still exist).

---

## Success Metrics

### Phase 1 Completion Checklist
- ✅ All database tables created
- ✅ System roles & permissions seeded
- ✅ Existing users migrated
- ✅ All critical pages updated with new RBAC
- ✅ Context switcher working
- ✅ Unit tests passing (80% coverage)

### Phase 2 Completion Checklist
- ✅ Audit logs capturing all actions
- ✅ Errors tracked in Sentry
- ✅ Logs searchable in Better Stack
- ✅ Rate limiting active
- ✅ E2E tests passing

### Phase 3 Completion Checklist
- ✅ Deployed to production (Vercel)
- ✅ Database migrated
- ✅ Monitoring dashboards active
- ✅ Documentation complete
- ✅ System fully operational

---

## Support & Maintenance

### Free Tier Monitoring

**Daily Checks**:
- Sentry error count (<5k/month)
- Better Stack log volume (<1GB/month)
- Upstash request count (<10k/day)
- Vercel bandwidth (<100GB/month)

**When to Upgrade**:
| Service | Free Limit | Usage Alert | Upgrade Cost |
|---------|-----------|-------------|--------------|
| Sentry | 5k errors/mo | 80% (4k) | $26/mo |
| Better Stack | 1GB logs/mo | 80% (800MB) | $15/mo |
| Upstash | 10k req/day | 80% (8k) | $10/mo |
| Vercel | 100GB/mo | 80% (80GB) | $20/mo |

**Total at scale**: ~$100/month

### Backup Strategy

```bash
# Daily PostgreSQL backups (automated)
# Vercel: Built-in backups
# Railway: pg_dump automated

# Manual backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### Security Updates

```bash
# Regular dependency updates
bun update
bunx prisma generate

# Regular security audit
bun audit
```

---

## Next Steps

**Ready to start?**

1. ✅ Review this guide thoroughly
2. ✅ Set up development environment (5 min)
3. ✅ Create database migration
4. ✅ Seed system data
5. ✅ Update one page as test
6. ✅ Repeat for all pages
7. ✅ Add observability stack
8. ✅ Deploy to production

**Questions or issues?** Refer back to specific sections in this guide.

---

**END OF MASTER IMPLEMENTATION GUIDE**
