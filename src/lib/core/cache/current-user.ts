import { auth } from '@/auth';
import { db } from '@/lib/db';
import { CurrentUser } from 'next-auth';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { memoryCache, invalidateByContains } from '@/lib/core/cache/memory-cache';


// ─────────────────────────────────────────────────────────────────────────────
// Cross-Request Memory Cache (60s TTL)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Memory-cached user lookup (60 second TTL across requests)
 * This dramatically reduces DB queries for frequently accessed users
 */
const fetchUserFromDb = memoryCache(
    'user-details',
    async (userId: string) => {
        return db.user.findUnique({
            where: { id: userId },
            include: {
                AgencyMemberships: {
                    where: { isActive: true },
                    include: {
                        Agency: {
                            include: {
                                SidebarOption: true,
                                Subscription: true,
                                SubAccount: {
                                    include: {
                                        SidebarOption: true,
                                    },
                                },
                            },
                        },
                        Role: true,
                    },
                    orderBy: [{ isPrimary: 'desc' }, { joinedAt: 'asc' }],
                },
                SubAccountMemberships: {
                    where: { isActive: true },
                    include: {
                        SubAccount: {
                            include: {
                                SidebarOption: true,
                            },
                        },
                        Role: true,
                    },
                },
            },
        })
    },
    { ttlMs: 60_000 } // 60 second cache
);

/**
 * Type matching getCurrentUser({ withFullUser: true }) return shape
 * This allows getCurrentUser({ withFullUser: true }) to be a drop-in replacement
 */
export type CachedUser = Awaited<ReturnType<typeof fetchUserFromDb>>;

// ─────────────────────────────────────────────────────────────────────────────
// Request-Scoped Cache (React cache)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Request-scoped wrapper that deduplicates within single request
 * AND uses cross-request memory cache underneath
 */
const getCachedUser = cache(async (userId: string) => {
    return fetchUserFromDb(userId);
});

/**
 * Invalidate user cache when data changes (call after user updates)
 */
export function invalidateUserCache(userId: string) {
    invalidateByContains('user-details', userId);
}

// Function overloads for different use cases
async function getCurrentUser(options: {
    withFullUser: true;
    redirectIfNotFound: true;
}): Promise<NonNullable<CachedUser>>;

async function getCurrentUser(options: {
    withFullUser: true;
    redirectIfNotFound?: false;
}): Promise<CachedUser>;

async function getCurrentUser(options: {
    withFullUser?: false;
    redirectIfNotFound: true;
}): Promise<CurrentUser>;

async function getCurrentUser(options?: {
    withFullUser?: false;
    redirectIfNotFound?: false;
}): Promise<CurrentUser | null>;

// Main implementation
async function getCurrentUser(options: {
    withFullUser?: boolean;
    redirectIfNotFound?: boolean;
} = {}): Promise<CurrentUser | CachedUser | null> {
    const { withFullUser = false, redirectIfNotFound = false } = options;

    try {
        // Get current session using our fixed SessionManager
        const session = await auth();

        if (!session || !session.user.id) {
            if (redirectIfNotFound) {
                redirect('/tenant/sign-in');
            }
            return null;
        }

        if (withFullUser) {
            const fullUser = await getCachedUser(session.user.id);
            if (!fullUser && redirectIfNotFound) {
                redirect('/tenant/sign-in');
            }
            return fullUser;
        }

        // Return basic user info from session
        const currentUser: CurrentUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.name,
            scopeId: '', // Scope ID is not available in basic session
            avatarUrl: session.user.image || null,
            emailVerified: session.user.emailVerified,
            role: undefined // Role is not available in basic session,

        };

        return currentUser;
    } catch (error) {
        console.error('[getCurrentUser]: Error fetching current user:', error);

        if (redirectIfNotFound) {
            redirect('/tenant/sign-in');
        }

        return null;
    }
}

// Export the main function
export { getCurrentUser };

// Additional utility functions
export async function requireUser(): Promise<CurrentUser> {
    const user = await getCurrentUser({ redirectIfNotFound: true });
    return user as CurrentUser;
}

export async function requireFullUser(): Promise<NonNullable<CachedUser>> {
    const user = await getCurrentUser({ withFullUser: true, redirectIfNotFound: true });
    return user as NonNullable<CachedUser>;
}

export async function getOptionalUser(): Promise<CurrentUser | null> {
    return await getCurrentUser({ redirectIfNotFound: false });
}

export async function getOptionalFullUser(): Promise<CachedUser> {
    return await getCurrentUser({ withFullUser: true, redirectIfNotFound: false });
}


