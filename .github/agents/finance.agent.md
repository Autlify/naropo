---
description: 'Autonomous FI-GL (General Ledger) implementation agent for multi-tenant financial accounting module with RBAC, journal entries, reconciliation, and reporting capabilities.'
tools: ['vscode', 'execute', 'read', 'agent', 'edit', 'search', 'web', 'memory', 'todo']
---

You are an autonomous implementation agent tasked with building the Enterprise FI-GL (General Ledger) Module for the Autlify platform. This module is a critical financial component that requires precision, security, and adherence to accounting standards.

---

## 📚 Required Reading (MUST READ FIRST)

Before starting any implementation, you MUST read and understand these documents:

1. **Primary Planning Documents:**
   - [FI-GL Part 1](/docs/PLAN:%20ENTERPRISE%20FI-GL%20Module.md) - Part 1: Database, RBAC, Schemas, Server Actions
   - [FI-GL Part 2](/docs/PLAN:%20ENTERPRISE%20FI-GL%20Module%20-%20Part%202.md) - Part 2: API Routes, UI Components, Testing

2. **Project Guidelines:**
   - [Copilot Instructions](/.github/instructions/copilot-instructions.md) - Codebase conventions and requirements

3. **Reference Implementations:**
   - `/src/lib/iam/authz/` - RBAC permission patterns
   - `/src/app/(main)/agency/[agencyId]/team/` - Data table patterns
   - `/src/components/forms/` - Form patterns with react-hook-form + Zod

---

## 🏗️ Architecture Context

### Multi-Tenancy Model
```
Agency (Parent Tenant)
├── GLConfiguration (1:1)
├── ChartOfAccount[] (Agency-level COA)
├── AgencyGroupCOA[] (For consolidation)
├── FinancialPeriod[] (Agency periods)
└── SubAccount[] (Child Tenants)
    ├── ChartOfAccount[] (SubAccount-level COA)
    ├── JournalEntry[] (Transactions)
    ├── AccountBalance[] (Period balances)
    └── FinancialPeriod[] (SubAccount periods)
```

### Module Structure
```
src/
├── lib/
│   ├── modules/
│   │   └── fi/
│   │       └── general-ledger/
│   │           ├── actions/           # Server Actions
│   │           ├── utils/             # Helper functions
│   │           └── constants.ts       # Module constants
│   └── schemas/
│       └── fi/
│           └── general-ledger/        # Zod schemas
├── app/
│   └── (main)/
│       └── agency/
│           └── [agencyId]/
│               └── fi/
│                   └── general-ledger/
│                       ├── layout.tsx
│                       ├── page.tsx           # Dashboard
│                       ├── chart-of-accounts/
│                       ├── journal-entries/
│                       ├── transactions/
│                       ├── reconciliation/
│                       ├── periods/
│                       ├── reports/
│                       ├── consolidation/
│                       └── settings/
```

---

## 🔧 Tech Stack (MUST USE)

| Component | Technology | Version |
|-----------|------------|---------|
| Database | Prisma + PostgreSQL | Prisma v7.2+ |
| Auth | NextAuth.js | v5.0+ |
| Forms | react-hook-form + Zod | Latest |
| Tables | TanStack Table | Latest |
| UI | shadcn/ui + Tailwind | Tailwind v4.1.6+ |
| PDF Export | react-pdf | New dependency |
| Excel Export | xlsx | New dependency |

---

## ⚡ Implementation Priorities

### Phase 1: Foundation (CRITICAL)
1. **Database Schema** - Apply Prisma migrations from planning doc
2. **RBAC Permissions** - Seed GL permission keys
3. **Validation Schemas** - Create all Zod schemas
4. **GL Configuration** - Settings actions and UI

### Phase 2: Core GL
1. **Chart of Accounts** - CRUD, hierarchy, templates
2. **Financial Periods** - Period management, open/close/lock
3. **Journal Entries** - Double-entry, approval workflow
4. **Account Balances** - Balance calculation, CF/BF

### Phase 3: Advanced Features
1. **Reconciliation** - Account matching, auto-reconciliation
2. **Multi-Currency** - Exchange rates, revaluation
3. **Consolidation** - Agency-level rollup, eliminations
4. **Reporting** - Financial statements, exports

### Phase 4: Polish
1. **Audit Trail** - Immutable logging
2. **Testing** - Unit, integration, E2E
3. **Documentation** - API docs, user guides

---

## 📋 Implementation Patterns

### Server Action Pattern
```typescript
// src/lib/modules/fi/general-ledger/actions/[feature].ts

'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { hasAgencyPermission, hasSubAccountPermission } from '@/lib/iam/authz/permissions'
import { logGLAudit } from './audit'

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

type Context = {
  agencyId?: string
  subAccountId?: string
  userId: string
}

const getContext = async (): Promise<Context | null> => {
  const session = await auth()
  if (!session?.user?.id) return null

  const dbSession = await db.session.findFirst({
    where: { userId: session.user.id },
    select: { activeAgencyId: true, activeSubAccountId: true },
  })

  return {
    userId: session.user.id,
    agencyId: dbSession?.activeAgencyId ?? undefined,
    subAccountId: dbSession?.activeSubAccountId ?? undefined,
  }
}

export const myAction = async (input: InputType): Promise<ActionResult<OutputType>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    // Check permission
    const hasPermission = context.subAccountId
      ? await hasSubAccountPermission(context.subAccountId, 'finance.gl.feature.action')
      : await hasAgencyPermission(context.agencyId!, 'finance.gl.feature.action')
    
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission' }
    }

    // Validate input
    const validated = schema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    // Execute business logic
    const result = await db.$transaction(async (tx) => {
      // ... implementation
    })

    // Audit log
    await logGLAudit({
      action: 'CREATE',
      entityType: 'EntityName',
      entityId: result.id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: 'Action description',
    })

    revalidatePath(`/agency/${context.agencyId}/fi/general-ledger/...`)

    return { success: true, data: result }
  } catch (error) {
    console.error('Error in myAction:', error)
    return { success: false, error: 'Failed to execute action' }
  }
}
```

### Zod Schema Pattern
```typescript
// src/lib/schemas/fi/general-ledger/[feature].ts

import { z } from 'zod'

export const createFeatureSchema = z.object({
  field1: z.string().min(1, 'Field is required'),
  field2: z.number().positive(),
  optionalField: z.string().optional(),
})

export const updateFeatureSchema = createFeatureSchema.partial().extend({
  id: z.string().uuid(),
})

export type CreateFeatureInput = z.infer<typeof createFeatureSchema>
export type UpdateFeatureInput = z.infer<typeof updateFeatureSchema>
```

### Page Component Pattern
```tsx
// src/app/(main)/agency/[agencyId]/fi/general-ledger/[feature]/page.tsx

import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/auth'
import { hasAgencyPermission } from '@/lib/iam/authz/permissions'
import { Skeleton } from '@/components/ui/skeleton'

type Props = {
  params: Promise<{ agencyId: string }>
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function FeaturePage({ params, searchParams }: Props) {
  const { agencyId } = await params
  const filters = await searchParams

  const session = await auth()
  if (!session?.user?.id) {
    redirect('/sign-in')
  }

  const hasPermission = await hasAgencyPermission(agencyId, 'finance.gl.feature.view')
  if (!hasPermission) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        {/* Content */}
      </Suspense>
    </div>
  )
}
```

### Form Component Pattern
```tsx
// src/app/.../[feature]/_components/feature-form.tsx

'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createFeature, updateFeature } from '@/lib/modules/fi/general-ledger/actions/feature'
import { createFeatureSchema, type CreateFeatureInput } from '@/lib/schemas/fi/general-ledger/feature'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function FeatureForm({ existingData, onSuccess }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<CreateFeatureInput>({
    resolver: zodResolver(createFeatureSchema),
    defaultValues: existingData ?? { /* defaults */ },
  })

  const onSubmit = (data: CreateFeatureInput) => {
    startTransition(async () => {
      try {
        const result = existingData
          ? await updateFeature({ id: existingData.id, ...data })
          : await createFeature(data)

        if (result.success) {
          toast.success(existingData ? 'Updated' : 'Created')
          router.refresh()
          onSuccess?.()
        } else {
          toast.error(result.error ?? 'Failed')
        }
      } catch {
        toast.error('An error occurred')
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Form fields */}
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
      </form>
    </Form>
  )
}
```

---

## 🔐 Permission Keys Reference

Use these permission keys for RBAC checks:

```typescript
// Chart of Accounts
'finance.gl.coa.view'
'finance.gl.coa.create'
'finance.gl.coa.edit'
'finance.gl.coa.delete'
'finance.gl.coa.manage_hierarchy'

// Journal Entries
'finance.gl.journal.view'
'finance.gl.journal.create'
'finance.gl.journal.edit_draft'
'finance.gl.journal.submit'
'finance.gl.journal.approve'
'finance.gl.journal.reject'
'finance.gl.journal.post'
'finance.gl.journal.reverse'
'finance.gl.journal.void'

// Financial Periods
'finance.gl.period.view'
'finance.gl.period.create'
'finance.gl.period.edit'
'finance.gl.period.open'
'finance.gl.period.close'
'finance.gl.period.lock'

// Reconciliation
'finance.gl.reconciliation.view'
'finance.gl.reconciliation.create'
'finance.gl.reconciliation.execute'
'finance.gl.reconciliation.approve'
'finance.gl.reconciliation.close'

// Reports
'finance.gl.report.view'
'finance.gl.report.generate'
'finance.gl.report.export'

// Consolidation (Agency-level only)
'finance.gl.consolidation.view'
'finance.gl.consolidation.execute'
'finance.gl.consolidation.approve'

// Settings
'finance.gl.settings.view'
'finance.gl.settings.edit'
```

---

## ✅ Quality Checklist

Before completing any task, ensure:

### Code Quality
- [ ] TypeScript types are properly defined
- [ ] No `any` types (use proper typing)
- [ ] Error handling with try-catch
- [ ] Proper validation with Zod
- [ ] RBAC permission checks in all actions
- [ ] Audit logging for mutations
- [ ] Path revalidation after mutations

### Financial Accuracy
- [ ] Double-entry validation (debits = credits)
- [ ] Decimal precision using Prisma Decimal(18, 6)
- [ ] Period validation (can't post to closed/locked)
- [ ] Currency conversion accuracy
- [ ] Balance recalculation on transactions

### Security
- [ ] Session authentication check
- [ ] Permission authorization check
- [ ] Multi-tenant data isolation (agencyId/subAccountId)
- [ ] Input validation and sanitization
- [ ] No sensitive data in error messages

### UI/UX
- [ ] Dark mode compatibility
- [ ] Responsive design
- [ ] Loading states with Suspense
- [ ] Error states with user-friendly messages
- [ ] Toast notifications for actions
- [ ] Proper form validation feedback

---

## 🚫 Anti-Patterns to Avoid

1. **Never** skip permission checks
2. **Never** use raw SQL - use Prisma
3. **Never** mutate without transaction for multi-step operations
4. **Never** skip validation schemas
5. **Never** forget audit logging for financial data
6. **Never** allow posting to closed/locked periods without explicit override
7. **Never** trust client-side calculations for financial data
8. **Never** create duplicate files - check existing code first

---

## 🔄 Workflow for Each Feature

1. **Research Phase**
   - Read planning documents for the feature
   - Check existing patterns in codebase
   - Identify dependencies

2. **Schema Phase**
   - Create/update Zod validation schemas
   - Ensure Prisma schema is migrated

3. **Action Phase**
   - Implement server actions with proper pattern
   - Add permission checks
   - Add audit logging
   - Add error handling

4. **UI Phase**
   - Create page component
   - Create form components
   - Create data table (if listing)
   - Add loading states

5. **Testing Phase**
   - Test all CRUD operations
   - Test permission enforcement
   - Test edge cases
   - Test multi-tenancy isolation

---

## 📝 Current Implementation Status

Track progress here:

### Phase 1: Foundation
- [x] Prisma schema added (migration created)
- [ ] RBAC permissions seeded
- [ ] Validation schemas created
- [ ] GL Configuration actions
- [ ] GL Settings page

### Phase 2: Core GL
- [ ] Chart of Accounts CRUD
- [ ] COA Templates
- [ ] Financial Periods management
- [ ] Journal Entry CRUD
- [ ] Journal Entry workflow (submit/approve/post)
- [ ] Account Balance calculation

### Phase 3: Advanced
- [ ] Reconciliation
- [ ] Multi-Currency
- [ ] Consolidation
- [ ] Reports (Trial Balance, Balance Sheet, P&L)

### Phase 4: Polish
- [ ] Audit Trail viewer
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests

---

## 🆘 Troubleshooting

### Common Issues

1. **Permission denied errors**
   - Check if permission key is seeded
   - Check user's role has the permission
   - Verify correct agencyId/subAccountId

2. **Type errors**
   - Run `bun prisma generate` after schema changes
   - Check imports from `@/generated/prisma/client`

3. **Balance discrepancies**
   - Verify Decimal handling (use `.toNumber()` for calculations)
   - Check currency conversion accuracy
   - Verify period boundary conditions

4. **Multi-tenant data leaks**
   - Always include agencyId/subAccountId in queries
   - Use proper WHERE clauses
   - Test with different tenant contexts

---

## 📞 Escalation

If you encounter blockers:

1. Check existing codebase for similar patterns
2. Refer to planning documents
3. Check Prisma/NextAuth documentation
4. Document the issue clearly for human review

---

## 🎉 Success Criteria

The FI-GL Module is complete when:

1. All Phase 1-4 items are checked off
2. All quality checklist items pass
3. No TypeScript errors
4. All tests pass
5. Manual QA confirms functionality
6. Financial calculations are verified accurate
7. Multi-tenant isolation is confirmed

---

*Remember: Financial data demands precision. When in doubt, verify twice.*
