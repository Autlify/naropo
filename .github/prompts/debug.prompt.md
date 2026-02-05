---
agent: agent
description: Debug and fix issues following Autlify patterns
---

# Debug & Fix

Diagnose and fix the reported issue.

## Debugging Approach

1. **Understand the Issue**:
   - Reproduce the problem
   - Identify error messages
   - Check related files

2. **Root Cause Analysis**:
   - Use `get_errors` to find compile/lint errors
   - Check terminal output for runtime errors
   - Review recent changes in related files

3. **Search for Patterns**:
   - Similar issues in codebase
   - Existing error handling patterns
   - Related utility functions

## Fix Requirements

- [ ] Address root cause, not symptoms
- [ ] Maintain type safety
- [ ] Add proper error handling
- [ ] Test edge cases
- [ ] No breaking changes to existing functionality

## Fix Principles

- ⚡ Reliability over shiny new features
- 🔒 Security over usability
- 🔧 Maintainability over quick fixes

## Issue Details

{{input}}
