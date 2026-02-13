/**
 * API utilities for common patterns in API route handlers.
 * 
 * This module provides reusable utilities to reduce code duplication
 * across API routes:
 * - Error handling wrapper
 * - Request validation helpers
 */

export { withErrorHandler } from './error-handler';
export { validateRequest } from './validation';
