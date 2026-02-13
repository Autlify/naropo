/**
 * GL Error Types
 * Typed errors with user-friendly messages
 * 
 * @namespace Autlify.Lib.Features.FI.GL.Core.Errors
 */

/** Error codes for GL operations */
export const GL_ERROR_CODES = {
  // Auth/Permission errors
  UNAUTHORIZED: 'GL_UNAUTHORIZED',
  NO_SESSION: 'GL_NO_SESSION',
  NO_CONTEXT: 'GL_NO_CONTEXT',
  PERMISSION_DENIED: 'GL_PERMISSION_DENIED',
  AGENCY_ONLY: 'GL_AGENCY_ONLY',
  
  // Validation errors
  VALIDATION_FAILED: 'GL_VALIDATION_FAILED',
  INVALID_DOUBLE_ENTRY: 'GL_INVALID_DOUBLE_ENTRY',
  DUPLICATE_CODE: 'GL_DUPLICATE_CODE',
  
  // Business rule errors
  PERIOD_CLOSED: 'GL_PERIOD_CLOSED',
  PERIOD_LOCKED: 'GL_PERIOD_LOCKED',
  ACCOUNT_HAS_CHILDREN: 'GL_ACCOUNT_HAS_CHILDREN',
  ACCOUNT_HAS_TRANSACTIONS: 'GL_ACCOUNT_HAS_TRANSACTIONS',
  MAX_HIERARCHY_DEPTH: 'GL_MAX_HIERARCHY_DEPTH',
  PERIOD_OVERLAP: 'GL_PERIOD_OVERLAP',
  
  // Not found errors
  NOT_FOUND: 'GL_NOT_FOUND',
  ACCOUNT_NOT_FOUND: 'GL_ACCOUNT_NOT_FOUND',
  JOURNAL_NOT_FOUND: 'GL_JOURNAL_NOT_FOUND',
  PERIOD_NOT_FOUND: 'GL_PERIOD_NOT_FOUND',
  
  // System errors
  DATABASE_ERROR: 'GL_DATABASE_ERROR',
  UNKNOWN_ERROR: 'GL_UNKNOWN_ERROR',
} as const

export type GLErrorCode = typeof GL_ERROR_CODES[keyof typeof GL_ERROR_CODES]

/** Base GL error class */
export class GLError extends Error {
  readonly code: GLErrorCode
  readonly userMessage: string
  readonly details?: Record<string, unknown>

  constructor(
    code: GLErrorCode,
    userMessage: string,
    technicalMessage?: string,
    details?: Record<string, unknown>
  ) {
    super(technicalMessage || userMessage)
    this.name = 'GLError'
    this.code = code
    this.userMessage = userMessage
    this.details = details
  }

  /** Convert to ActionResult format */
  toResult<T>(): { success: false; error: string; code: GLErrorCode } {
    return {
      success: false,
      error: this.userMessage,
      code: this.code,
    }
  }
}

/** Unauthorized error */
export class GLUnauthorizedError extends GLError {
  constructor(message = 'You are not authorized to perform this action') {
    super(GL_ERROR_CODES.UNAUTHORIZED, message)
    this.name = 'GLUnauthorizedError'
  }
}

/** Permission denied error */
export class GLPermissionError extends GLError {
  constructor(permission: string) {
    super(
      GL_ERROR_CODES.PERMISSION_DENIED,
      `You don't have permission to perform this action`,
      `Missing permission: ${permission}`,
      { permission }
    )
    this.name = 'GLPermissionError'
  }
}

/** Agency-only feature error */
export class GLAgencyOnlyError extends GLError {
  constructor(feature: string) {
    super(
      GL_ERROR_CODES.AGENCY_ONLY,
      `${feature} is only available at Agency level`,
      `Attempted to access agency-only feature: ${feature}`,
      { feature }
    )
    this.name = 'GLAgencyOnlyError'
  }
}

/** Validation error */
export class GLValidationError extends GLError {
  constructor(message: string, field?: string) {
    super(
      GL_ERROR_CODES.VALIDATION_FAILED,
      message,
      undefined,
      field ? { field } : undefined
    )
    this.name = 'GLValidationError'
  }
}

/** Double-entry validation error */
export class GLDoubleEntryError extends GLError {
  constructor(debits: number, credits: number) {
    super(
      GL_ERROR_CODES.INVALID_DOUBLE_ENTRY,
      'Debits and credits must balance',
      `Imbalance: debits=${debits}, credits=${credits}`,
      { debits, credits }
    )
    this.name = 'GLDoubleEntryError'
  }
}

/** Period closed error */
export class GLPeriodClosedError extends GLError {
  constructor(periodName?: string) {
    super(
      GL_ERROR_CODES.PERIOD_CLOSED,
      `Cannot modify entries in ${periodName || 'closed'} period`,
      undefined,
      { periodName }
    )
    this.name = 'GLPeriodClosedError'
  }
}

/** Period locked error */
export class GLPeriodLockedError extends GLError {
  constructor(periodName?: string) {
    super(
      GL_ERROR_CODES.PERIOD_LOCKED,
      `Period ${periodName || ''} is locked and cannot be modified`,
      undefined,
      { periodName }
    )
    this.name = 'GLPeriodLockedError'
  }
}

/** Not found error */
export class GLNotFoundError extends GLError {
  constructor(entity: string, id?: string) {
    super(
      GL_ERROR_CODES.NOT_FOUND,
      `${entity} not found`,
      `${entity} with ID ${id} not found`,
      { entity, id }
    )
    this.name = 'GLNotFoundError'
  }
}

/** Standard action result type */
export type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string; code?: GLErrorCode }

/** Success result helper */
export const successResult = <T>(data: T): ActionResult<T> => ({
  success: true,
  data,
})

/** Error result helper */
export const errorResult = <T>(
  error: string | GLError,
  code?: GLErrorCode
): ActionResult<T> => {
  if (error instanceof GLError) {
    return error.toResult()
  }
  return {
    success: false,
    error: typeof error === 'string' ? error : 'An error occurred',
    code,
  }
}

/** Wrap async action with error handling */
export const withGLErrorHandling = async <T>(
  action: () => Promise<T>,
  fallbackMessage = 'An error occurred'
): Promise<ActionResult<T>> => {
  try {
    const data = await action()
    return successResult(data)
  } catch (error) {
    if (error instanceof GLError) {
      return error.toResult()
    }
    console.error('GL Action Error:', error)
    return errorResult(
      error instanceof Error ? error.message : fallbackMessage,
      GL_ERROR_CODES.UNKNOWN_ERROR
    )
  }
}
