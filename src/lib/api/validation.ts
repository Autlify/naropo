import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Validates request body against a Zod schema and returns typed data or error response.
 * 
 * @param req - The request object
 * @param schema - Zod schema to validate against
 * @returns Object with either parsed data or error response
 * 
 * @example
 * const result = await validateRequest(req, CreateSchema);
 * if ('error' in result) return result.error;
 * const data = result.data; // Typed!
 */
export async function validateRequest<T extends z.ZodTypeAny>(
  req: Request,
  schema: T
): Promise<
  | { data: z.infer<T>; error?: never }
  | { error: Response; data?: never }
> {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    
    if (!parsed.success) {
      return {
        error: NextResponse.json(
          { error: 'Invalid payload', details: parsed.error.issues },
          { status: 400 }
        ),
      };
    }
    
    return { data: parsed.data };
  } catch (e) {
    return {
      error: NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      ),
    };
  }
}
