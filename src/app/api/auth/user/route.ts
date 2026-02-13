import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/core/cache';
import { auth } from '@/auth';

/**
 * GET /api/auth/user
 * 
 * Returns the current authenticated user with full details.
 * Use this from client components instead of importing server-only cache.
 * 
 * @example Client component usage:
 * ```ts
 * const res = await fetch('/api/auth/user')
 * const { user } = await res.json()
 * ```
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');
    const session = await auth();
    if (!session || !userId || session.user?.id !== userId) return NextResponse.json({ user: null }, { status: 400 });

    try {

        const user = await getCurrentUser({ withFullUser: true, redirectIfNotFound: false });
        if (!user) return NextResponse.json({ user: null }, { status: 404 });
        return NextResponse.json({ user });

    } catch (error) {
        
        return NextResponse.json({ user: null }, { status: 500 });

    }    
}
