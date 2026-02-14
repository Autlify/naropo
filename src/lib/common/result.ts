/**
 * Common result type for action functions
 * 
 * Centralizes the ActionResult pattern used across the codebase
 * to provide consistent error handling and type safety.
 * 
 * @example
 * ```typescript
 * async function createUser(data: UserInput): Promise<ActionResult<User>> {
 *   try {
 *     const user = await db.user.create({ data })
 *     return { success: true, data: user }
 *   } catch (error) {
 *     return { success: false, error: 'Failed to create user' }
 *   }
 * }
 * ```
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Type guard to check if an ActionResult is successful
 */
export function isActionSuccess<T>(result: ActionResult<T>): result is { success: true; data: T } {
  return result.success === true
}

/**
 * Type guard to check if an ActionResult is an error
 */
export function isActionError<T>(result: ActionResult<T>): result is { success: false; error: string } {
  return result.success === false
}

/**
 * Helper to create a successful action result
 */
export function successResult<T>(data: T): ActionResult<T> {
  return { success: true, data }
}

/**
 * Helper to create an error action result
 */
export function errorResult<T = void>(error: string): ActionResult<T> {
  return { success: false, error }
}
