'use server'

import { db } from '@/lib/db'
import { getCurrentContext } from '@/lib/queries'
import { resolveEffectiveEntitlements, inferScopeFromIds } from '@/lib/features/org/billing/entitlements/resolve'
import type { MeteringScope } from '@/generated/prisma/client'

export type FeatureFlagState = {
  featureKey: string
  name: string
  displayName?: string | null
  description?: string | null
  category: string
  icon?: string | null
  helpText?: string | null
  
  // State
  isAvailableInPlan: boolean   // Is feature in current plan?
  isEnabledByAdmin: boolean     // Has admin enabled it?
  isEnabledByUser: boolean      // Has user enabled it?
  isToggleable: boolean         // Can user toggle it?
  effectiveEnabled: boolean     // Final computed state
  
  // Limits (if applicable)
  hasLimits: boolean
  currentUsage?: number
  maxLimit?: number | null
  isUnlimited?: boolean
  displayOrder: number
}

/**
 * Get all feature flags for current user context
 */
export async function getFeatureFlags(): Promise<FeatureFlagState[]> {
  const context = await getCurrentContext()
  if (!context) return []
  
  const { userId, activeAgencyId, activeSubAccountId } = context
  if (!activeAgencyId) return []
  
  const scope = inferScopeFromIds(activeSubAccountId)
  
  // Get effective entitlements from plan + overrides
  const entitlements = await resolveEffectiveEntitlements({
    agencyId: activeAgencyId,
    subAccountId: activeSubAccountId,
    scope,
  })
  
  // Get full feature metadata from database
  const featureKeys = Object.keys(entitlements)
  const features = await db.entitlementFeature.findMany({
    where: { key: { in: featureKeys } },
  })
  const featureMap = new Map(features.map(f => [f.key, f]))
  
  // Get user preferences
  const userPreferences = await db.featurePreference.findMany({
    where: {
      userId,
      scope,
      agencyId: activeAgencyId,
      subAccountId: activeSubAccountId ?? '',
    },
  })
  
  const prefMap = new Map(
    userPreferences.map(p => [p.featureKey, p.isEnabled])
  )
  
  // Transform to FeatureFlagState
  const flags: FeatureFlagState[] = []
  
  for (const [key, ent] of Object.entries(entitlements)) {
    const feature = featureMap.get(key)
    if (!feature) continue
    
    const userEnabled = prefMap.get(key) ?? feature.defaultEnabled
    
    flags.push({
      featureKey: key,
      name: ent.name,
      displayName: feature.displayName,
      description: ent.description,
      category: ent.category,
      icon: feature.icon,
      helpText: feature.helpText,
      
      isAvailableInPlan: true, // If it's in entitlements, it's in plan
      isEnabledByAdmin: ent.isEnabled,
      isEnabledByUser: userEnabled,
      isToggleable: feature.isToggleable,
      
      // Final state: plan enabled AND admin enabled AND user enabled
      effectiveEnabled: ent.isEnabled && userEnabled,
      
      hasLimits: ent.maxInt !== null || ent.maxDec !== null,
      maxLimit: ent.maxInt,
      isUnlimited: ent.isUnlimited,
      displayOrder: feature.displayOrder,
    })
  }
  
  return flags.sort((a, b) => a.displayOrder - b.displayOrder)
}

/**
 * Check if a specific feature is enabled
 */
export async function isFeatureEnabled(featureKey: string): Promise<boolean> {
  const flags = await getFeatureFlags()
  const flag = flags.find(f => f.featureKey === featureKey)
  return flag?.effectiveEnabled ?? false
}

/**
 * Toggle a feature for current user
 */
export async function toggleUserFeature(
  featureKey: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const context = await getCurrentContext()
    if (!context) {
      return { success: false, error: 'Not authenticated' }
    }
    
    const { userId, activeAgencyId, activeSubAccountId } = context
    if (!activeAgencyId) {
      return { success: false, error: 'No active agency' }
    }
    
    const scope = inferScopeFromIds(activeSubAccountId)
    
    // Check if feature is toggleable
    const feature = await db.entitlementFeature.findUnique({
      where: { key: featureKey },
    })
    
    if (!feature) {
      return { success: false, error: 'Feature not found' }
    }
    
    if (!feature.isToggleable) {
      return { success: false, error: 'Feature cannot be toggled by users' }
    }
    
    // Check if feature is enabled by admin/plan
    const entitlements = await resolveEffectiveEntitlements({
      agencyId: activeAgencyId,
      subAccountId: activeSubAccountId,
      scope,
    })
    
    const ent = entitlements[featureKey]
    if (!ent || !ent.isEnabled) {
      return { success: false, error: 'Feature not available in current plan' }
    }
    
    // Upsert user preference
    await db.featurePreference.upsert({
      where: {
        userId_scope_agencyId_subAccountId_featureKey: {
          userId,
          scope,
          agencyId: activeAgencyId,
          subAccountId: activeSubAccountId ?? '',
          featureKey,
        },
      },
      update: { isEnabled: enabled },
      create: {
        userId,
        scope,
        agencyId: activeAgencyId,
        subAccountId: activeSubAccountId ?? '',
        featureKey,
        isEnabled: enabled,
      },
    })
    
    return { success: true }
  } catch (error) {
    console.error('Error toggling feature:', error)
    return { success: false, error: 'Failed to toggle feature' }
  }
}

/**
 * Get feature flags grouped by category
 */
export async function getFeatureFlagsByCategory(): Promise<Record<string, FeatureFlagState[]>> {
  const flags = await getFeatureFlags()
  
  return flags.reduce((acc, flag) => {
    if (!acc[flag.category]) {
      acc[flag.category] = []
    }
    acc[flag.category].push(flag)
    return acc
  }, {} as Record<string, FeatureFlagState[]>)
}
