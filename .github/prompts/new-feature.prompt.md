---
agent: agent
description: Create a new feature following Autlify conventions with proper folder structure and code reuse
---

# New Feature Implementation

You are implementing a new feature for the Autlify platform. Follow these steps STRICTLY:

## Pre-Implementation Checklist (MANDATORY)

1. **Search Codebase First** - Before creating ANY new file:
   - Use `semantic_search` or `grep_search` to find existing similar functionality
   - Check `src/lib/` for existing utilities
   - Check `src/components/` for similar components
   - Check `src/hooks/` for reusable hooks

2. **Check Registry** - Review `src/lib/registry/` for:
   - Existing feature keys, permissions, entitlements
   - Add new KEYS following pattern: `${module}.Submodule.${Feature}.${Action}`

3. **Folder Structure Compliance**:
   - API routes: `src/app/api/[module]/[resource]/route.ts`
   - Components: `src/components/[category]/[component-name].tsx`
   - Libraries: `src/lib/[module]/[functionality].ts`
   - Types: `src/types/[module].ts`
   - Hooks: `src/hooks/use-[functionality].ts`

## Implementation Requirements

- [ ] TypeScript with full type safety
- [ ] Permission key defined and enforced
- [ ] Entitlement check where applicable
- [ ] Error handling with meaningful feedback
- [ ] Dark mode support (mandatory)
- [ ] Responsive design
- [ ] Input validation and sanitization

## Code Quality Principles

- ✅ Code quality over speed
- 🔒 Security over usability
- 🔧 Maintainability over clever tricks
- ♿ Accessibility over flashy design
- 📚 Documentation over brevity

## Request Details

{{input}}
