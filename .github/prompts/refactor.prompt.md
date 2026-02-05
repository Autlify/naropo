---
agent: agent
description: Review current codebase thoroughly, to understand it fully before refactoring code to eliminate duplication and improve maintainability following Autlify conventions over clever tricks.
model: Claude Opus 4.5 (copilot)
tools: ['vscode', 'execute', 'read', 'agent', 'edit', 'search', 'web', 'memory', 'todo']
---

# Code Refactoring
Review current codebase thoroughly, to understand it fully before refactoring code to eliminate duplication and improve maintainability following Autlify conventions over clever tricks.

## Refactoring Goals

1. **Identify Duplication**:
   - Search codebase for similar patterns
   - Find copy-pasted logic across files
   - Locate redundant utilities/helpers

2. **Consolidate**:
   - Extract shared logic to `src/lib/`
   - Create reusable components in `src/components/`
   - Centralize types in `src/types/`

3. **Proper Placement**:
   - Move misplaced files to correct folders
   - Follow naming conventions
   - Update imports accordingly

## Refactoring Principles

- 🔧 Maintainability over clever tricks
- 🔄 Flexibility over simplicity
- 📈 Scalability over cost-cutting
- 🔌 Compatibility over innovation

## Analysis Steps

1. Read the target code thoroughly
2. Search for similar patterns in codebase
3. Identify extraction opportunities
4. Plan changes with minimal disruption
5. Update all affected imports

## Code to Refactor

{{input}}

FI-GL: After reviewing thoroughly the codebase, refactor the pages under `src/app/(main)/agency/[agencyId]/fi/general-ledger/*`, components under `src/components/features/fi/general-ledger/*`, actions under `src/lib/features/fi/general-ledger/actions/*` and based on industry best practices, IFRS standards, and Autlify conventions, consolidate pages, components, and/or actions that are overlapping or opportunities for consolidate e.g., `open-items` and `reconciliation` pages if they should be merged, or if the `bank-ledger` related should be move outside of `general-ledger` since it's not part of GL. After that, leverage `[[...catchAll]]` routing to create dynamic pages for `general-ledger` pages like how the `billing` is doing it under `src/app/(main)/agency/[agencyId]/billing/[[...catchAll]]/page.tsx`. Ensure all refactored code adheres to Autlify coding standards, including TypeScript type safety, error handling, permission checks, responsive design, future-proofing for scalability to extend it to `subaccount` easily without the needs of having so many pages in `general-ledger` client with `[[...catchAll]]` routing, and maintainability.