/**
 * API utilities for common patterns in API route handlers.
 * 
 * This module provides reusable utilities to reduce code duplication
 * across API routes:
 * - Error handling wrapper
 * - Request validation helpers
 * - Authentication middleware
 * - Membership guards
 * - Billing parameter parsing
 */

export { withErrorHandler } from './error-handler';
export { validateRequest } from './validation';
export { requireAuth, getSession } from './auth-middleware';
export { guardMembership, hasMembership, type MembershipScope } from './membership-guard';
export { parseBillingParams, validateBillingParams, type BillingParams, type MeteringScope, type UsagePeriod } from './billing-params';
