/**
 * GL Audit Trail Actions
 * FI-GL Module - Audit logging functionality
 */

'use server';

import { db } from '@/lib/db';
import { auth } from '@/auth';
import type { AuditAction } from '@/generated/prisma/client';

type AuditLogInput = {
  action: AuditAction;
  entityType: string;
  entityId: string;
  agencyId?: string;
  subAccountId?: string;
  description: string;
  previousValues?: any;
  newValues?: any;
  reason?: string;
};

/**
 * Log GL audit trail entry
 */
export async function logGLAudit(input: AuditLogInput): Promise<void> {
  try {
    const session = await auth();
    if (!session?.user?.id) return;

    // Get user details
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true },
    });

    if (!user) return;

    // Get session metadata
    const dbSession = await db.session.findFirst({
      where: { userId: session.user.id },
      select: { ipAddress: true, userAgent: true, id: true },
    });

    await db.gLAuditTrail.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        agencyId: input.agencyId,
        subAccountId: input.subAccountId,
        userId: user.id,
        userEmail: user.email,
        userName: user.name,
        previousValues: input.previousValues || null,
        newValues: input.newValues || null,
        reason: input.reason,
        ipAddress: dbSession?.ipAddress || null,
        userAgent: dbSession?.userAgent || null,
        sessionId: dbSession?.id || null,
      },
    });
  } catch (error) {
    // Don't throw - audit logging should never break the main flow
    console.error('Failed to log GL audit trail:', error);
  }
}

/**
 * Get audit trail for an entity
 */
export async function getEntityAuditTrail(
  entityType: string,
  entityId: string
): Promise<any[]> {
  try {
    const session = await auth();
    if (!session?.user?.id) return [];

    const auditTrail = await db.gLAuditTrail.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 100,
    });

    return auditTrail;
  } catch (error) {
    console.error('Failed to get audit trail:', error);
    return [];
  }
}

export type AuditSearchFilters = {
  agencyId?: string;
  subAccountId?: string;
  entityType?: string;
  action?: AuditAction;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type AuditTrailEntry = {
  id: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  timestamp: Date;
  previousValues: any;
  newValues: any;
  reason: string | null;
  ipAddress: string | null;
};

/**
 * Search audit trail with filters
 */
export async function searchAuditTrail(
  filters: AuditSearchFilters
): Promise<{ success: boolean; data?: { items: AuditTrailEntry[]; total: number }; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const { page = 1, pageSize = 50, startDate, endDate, entityType, action, userId, search, agencyId, subAccountId } = filters;

    const where: any = {};

    if (agencyId) where.agencyId = agencyId;
    if (subAccountId) where.subAccountId = subAccountId;
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;
    if (userId) where.userId = userId;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    if (search) {
      where.OR = [
        { entityId: { contains: search, mode: 'insensitive' } },
        { userEmail: { contains: search, mode: 'insensitive' } },
        { userName: { contains: search, mode: 'insensitive' } },
        { reason: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      db.gLAuditTrail.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          entityType: true,
          entityId: true,
          action: true,
          userId: true,
          userEmail: true,
          userName: true,
          timestamp: true,
          previousValues: true,
          newValues: true,
          reason: true,
          ipAddress: true,
        },
      }),
      db.gLAuditTrail.count({ where }),
    ]);

    return { success: true, data: { items: items as AuditTrailEntry[], total } };
  } catch (error) {
    console.error('Failed to search audit trail:', error);
    return { success: false, error: 'Failed to search audit trail' };
  }
}

/**
 * Get distinct entity types for filter dropdown
 */
export async function getAuditEntityTypes(agencyId: string): Promise<string[]> {
  try {
    const session = await auth();
    if (!session?.user?.id) return [];

    const result = await db.gLAuditTrail.findMany({
      where: { agencyId },
      select: { entityType: true },
      distinct: ['entityType'],
    });

    return result.map((r) => r.entityType);
  } catch {
    return [];
  }
}
