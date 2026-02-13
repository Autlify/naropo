import { NextResponse } from 'next/server';

/**
 * Wraps an API route handler with standardized error handling.
 * Catches and processes errors, returning appropriate HTTP responses.
 * 
 * @param handler - The API route handler function
 * @returns A wrapped handler with error handling
 * 
 * @example
 * export const GET = withErrorHandler(async (req) => {
 *   const data = await fetchData();
 *   return NextResponse.json({ data });
 * });
 */
export function withErrorHandler<T extends any[]>(
  handler: (req: Request, ...args: T) => Promise<Response>
) {
  return async (req: Request, ...args: T): Promise<Response> => {
    try {
      return await handler(req, ...args);
    } catch (e: any) {
      // If error is already a Response, return it as-is
      if (e instanceof Response) return e;
      
      // Log the error for debugging
      console.error(e);
      
      // Return standardized error response
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
