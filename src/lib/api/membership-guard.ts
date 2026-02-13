import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export type MembershipScope = 'AGENCY' | 'SUBACCOUNT';

/**
 * Guards that a user has active membership in the specified agency or subaccount.
 * Throws a Response error if user is not a member.
 * 
 * @param userId - The user ID to check
 * @param scope - Whether to check agency or subaccount membership
 * @param agencyId - Required for AGENCY scope
 * @param subAccountId - Required for SUBACCOUNT scope
 * @throws Response with 403 status if user is not a member
 * @throws Response with 400 status if required IDs are missing
 * 
 * @example
 * await guardMembership(session.user.id, 'AGENCY', agencyId);
 * // Continues only if user is active member of agency
 */
export async function guardMembership(
  userId: string,
  scope: MembershipScope,
  agencyId?: string,
  subAccountId?: string
): Promise<void> {
  if (scope === 'SUBACCOUNT') {
    if (!subAccountId) {
      throw NextResponse.json(
        { error: 'subAccountId is required for SUBACCOUNT scope' },
        { status: 400 }
      );
    }
    
    const membership = await db.subAccountMembership.findFirst({
      where: { userId, subAccountId, isActive: true },
      select: { id: true },
    });
    
    if (!membership) {
      throw NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
  } else {
    if (!agencyId) {
      throw NextResponse.json(
        { error: 'agencyId is required for AGENCY scope' },
        { status: 400 }
      );
    }
    
    const membership = await db.agencyMembership.findFirst({
      where: { userId, agencyId, isActive: true },
      select: { id: true },
    });
    
    if (!membership) {
      throw NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
  }
}

/**
 * Checks if a user has membership without throwing an error.
 * 
 * @returns true if user is a member, false otherwise
 */
export async function hasMembership(
  userId: string,
  scope: MembershipScope,
  agencyId?: string,
  subAccountId?: string
): Promise<boolean> {
  if (scope === 'SUBACCOUNT' && subAccountId) {
    const membership = await db.subAccountMembership.findFirst({
      where: { userId, subAccountId, isActive: true },
      select: { id: true },
    });
    return !!membership;
  }
  
  if (scope === 'AGENCY' && agencyId) {
    const membership = await db.agencyMembership.findFirst({
      where: { userId, agencyId, isActive: true },
      select: { id: true },
    });
    return !!membership;
  }
  
  return false;
}
