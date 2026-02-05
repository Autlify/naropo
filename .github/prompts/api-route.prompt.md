---
agent: agent
description: Create a new API route following Autlify conventions
---

# API Route Creation

Create a new API route following Autlify standards.

## Pre-Creation Checklist

1. **Check for existing routes** in `src/app/api/` that might already handle this
2. **Check Registry** at `src/lib/registry/` for:
   - Permission keys for the action
   - Feature keys for entitlement gating

## Route Standards

### File Location
```
src/app/api/[module]/[resource]/route.ts
```

### Required Patterns

```typescript
// 1. Auth check
const session = await auth()
if (!session?.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// 2. Permission check (use existing helpers)
// Check src/lib/rbac/ for available helpers

// 3. Input validation (use zod)
const result = schema.safeParse(body)
if (!result.success) {
  return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
}

// 4. Try/catch with proper error handling
try {
  // Business logic
} catch (error) {
  console.error('[API_NAME]:', error)
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
```

### Response Format
- Success: `{ data: ... }` with appropriate status
- Error: `{ error: 'message' }` with appropriate status

## Request Details

{{input}}
