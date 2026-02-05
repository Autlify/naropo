---
agent: agent
description: Review the provided code to ensure it adheres to Autlify coding standards, best practices and functioning as intended. Identify any issues and execute necessary fixes.
model: GPT-5.2-Codex (copilot)
tools: ['vscode', 'execute', 'read', 'agent', 'edit', 'search', 'web', 'memory', 'todo']
---

# Code Review Checklist

Review the following code against Autlify project standards:

## Review Criteria
### 1. Code Reuse & Structure
- [ ] No duplicate utilities (check `src/lib/utils.ts`, `src/lib/helpers/`)
- [ ] No redundant components (check `src/components/`)
- [ ] Proper folder placement per conventions
- [ ] Types in `src/types/[module].ts`, not scattered

### 2. Security
- [ ] User inputs validated and sanitized
- [ ] Permission checks enforced
- [ ] Entitlement gating where required
- [ ] No exposed secrets or credentials

### 3. TypeScript
- [ ] Full type safety, no `any` unless justified
- [ ] Proper interface/type definitions
- [ ] Correct use of generics

### 4. UI/UX (if applicable)
- [ ] Dark mode support
- [ ] Responsive design
- [ ] Accessibility (ARIA, keyboard navigation)
- [ ] Consistent with Aceternity UI / Re UI patterns

### 5. Error Handling
- [ ] Graceful error handling
- [ ] Meaningful error messages
- [ ] Proper try/catch blocks

### 6. Performance
- [ ] No unnecessary re-renders
- [ ] Proper memoization where needed
- [ ] Efficient queries/operations


## Code to Review

{{input}}

Preferences Feature: Review, Diagnose, and Fix the implementation of the various preference settings under `src/providers/preferences-provider.tsx`, `src/types/preferences.ts`, `src/components/sidebar-01/sidebar-context.tsx`, `src/components/panels/*.tsx`, `src/app/globals.css` and related code in `components`, `pages` etc.. Ensure that all preference settings such as `accessibility`, `displayDensity`, `animationLevel`, `iconSize`, `fontScale`, `borderRadius`, and `accentColor` functionality of every single items indicated in `types/preferences` are fully implemented and make sure it is fully functional, preserved current theming design as default preset/reset. Ensure that the preference settings are properly saved, loaded, and applied across the application according to Autlify coding standards, including TypeScript type safety, error handling, permission checks, responsive design, and maintainability. Identify any issues in the current implementation and execute necessary fixes to align with best practices. 