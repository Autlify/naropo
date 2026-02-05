---
agent: agent
description: Create a new React component following Autlify conventions
---

# Component Creation

Create a new React component following Autlify standards.

## Pre-Creation Checklist

1. **Search for existing components** in `src/components/`:
   - Similar UI patterns
   - Reusable base components
   - Aceternity UI / Re UI components

2. **Check for existing utilities**:
   - `src/lib/utils.ts` - cn(), formatters, etc.
   - `src/hooks/` - existing custom hooks

## Component Standards

### File Location
```
src/components/[category]/[component-name].tsx
```

### Required Patterns

```typescript
'use client' // Only if using hooks/interactivity

import { cn } from '@/lib/utils'

interface ComponentNameProps {
  // Explicit prop types
  className?: string
}

export function ComponentName({ className, ...props }: ComponentNameProps) {
  return (
    <div className={cn('base-styles', className)} {...props}>
      {/* Content */}
    </div>
  )
}
```

### Styling Requirements
- ✅ Use Tailwind CSS
- ✅ Support dark mode (`dark:` variants)
- ✅ Use `cn()` for conditional classes
- ✅ Responsive design (mobile-first)
- ✅ Follow Aceternity UI / Re UI patterns

### Accessibility
- Proper ARIA attributes
- Keyboard navigation support
- Focus states visible

## Request Details

{{input}}
