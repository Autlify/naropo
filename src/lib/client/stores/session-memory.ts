/**
 * Session Memory Store
 * 
 * Client-side Zustand store for caching session data (permissions, entitlements).
 * Reduces server roundtrips by loading once on login and updating via SSE events.
 * 
 * Data flow:
 * 1. Login → Server loads full context → Sends to client
 * 2. Client stores in Zustand + IndexedDB (persistence)
 * 3. CRUD events → SSE pushes hash changes → Client refetches if stale
 * 
 * @example
 * ```tsx
 * 'use client'
 * 
 * import { useSessionMemory } from '@/lib/client/stores/session-memory'
 * 
 * function MyComponent() {
 *   const { permissions, hasPermission, isLoaded } = useSessionMemory()
 *   
 *   if (!isLoaded) return <Spinner />
 *   if (!hasPermission('fi.gl.balances.read')) return <NoAccess />
 *   
 *   return <BalancesView />
 * }
 * ```
 */

'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SessionContext {
  userId: string
  scope: 'AGENCY' | 'SUBACCOUNT'
  agencyId: string
  subAccountId: string | null
  roleId: string | null
  roleName: string | null
  isOwner: boolean
  isAdmin: boolean
}

export interface SessionMemoryState {
  // Context
  context: SessionContext | null
  
  // Permissions
  permissions: string[]
  permissionHash: string | null
  
  // Entitlements
  enabledFeatures: string[]
  unlimitedFeatures: string[]
  entitlementHash: string | null
  
  // Plan info
  planId: string | null
  planName: string | null
  
  // State
  isLoaded: boolean
  loadedAt: number | null
  expiresAt: number | null
}

export interface SessionMemoryActions {
  // Load full session from server
  loadSession: (session: {
    context: SessionContext
    permissions: string[]
    permissionHash: string
    enabledFeatures: string[]
    unlimitedFeatures: string[]
    entitlementHash: string
    planId: string | null
    planName: string | null
    expiresAt: number
  }) => void
  
  // Update hashes (from SSE event) - triggers refetch if changed
  updateHashes: (hashes: {
    permissionHash: string
    entitlementHash: string
  }) => { permissionsChanged: boolean; entitlementsChanged: boolean }
  
  // Partial updates (from SSE)
  updatePermissions: (permissions: string[], hash: string) => void
  updateEntitlements: (features: string[], unlimitedFeatures: string[], hash: string) => void
  
  // Clear session (logout)
  clearSession: () => void
  
  // Permission check (cached, instant)
  hasPermission: (key: string) => boolean
  hasAnyPermission: (keys: string[]) => boolean
  hasAllPermissions: (keys: string[]) => boolean
  
  // Feature check (cached, instant)
  hasFeature: (featureKey: string) => boolean
  isFeatureUnlimited: (featureKey: string) => boolean
  
  // Staleness check
  isStale: () => boolean
}

export type SessionMemoryStore = SessionMemoryState & SessionMemoryActions

// ─────────────────────────────────────────────────────────────────────────────
// Initial State
// ─────────────────────────────────────────────────────────────────────────────

const initialState: SessionMemoryState = {
  context: null,
  permissions: [],
  permissionHash: null,
  enabledFeatures: [],
  unlimitedFeatures: [],
  entitlementHash: null,
  planId: null,
  planName: null,
  isLoaded: false,
  loadedAt: null,
  expiresAt: null,
}

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useSessionMemory = create<SessionMemoryStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      loadSession: (session) => {
        set({
          context: session.context,
          permissions: session.permissions,
          permissionHash: session.permissionHash,
          enabledFeatures: session.enabledFeatures,
          unlimitedFeatures: session.unlimitedFeatures,
          entitlementHash: session.entitlementHash,
          planId: session.planId,
          planName: session.planName,
          isLoaded: true,
          loadedAt: Date.now(),
          expiresAt: session.expiresAt,
        })
      },

      updateHashes: (hashes) => {
        const state = get()
        const permissionsChanged = state.permissionHash !== hashes.permissionHash
        const entitlementsChanged = state.entitlementHash !== hashes.entitlementHash
        return { permissionsChanged, entitlementsChanged }
      },

      updatePermissions: (permissions, hash) => {
        set({
          permissions,
          permissionHash: hash,
          loadedAt: Date.now(),
        })
      },

      updateEntitlements: (features, unlimitedFeatures, hash) => {
        set({
          enabledFeatures: features,
          unlimitedFeatures,
          entitlementHash: hash,
          loadedAt: Date.now(),
        })
      },

      clearSession: () => {
        set(initialState)
      },

      hasPermission: (key) => {
        const { permissions } = get()
        // Check for wildcard or exact match
        return permissions.includes('*') || permissions.includes(key)
      },

      hasAnyPermission: (keys) => {
        const { permissions } = get()
        if (permissions.includes('*')) return true
        return keys.some((key) => permissions.includes(key))
      },

      hasAllPermissions: (keys) => {
        const { permissions } = get()
        if (permissions.includes('*')) return true
        return keys.every((key) => permissions.includes(key))
      },

      hasFeature: (featureKey) => {
        const { enabledFeatures } = get()
        return enabledFeatures.includes(featureKey)
      },

      isFeatureUnlimited: (featureKey) => {
        const { unlimitedFeatures } = get()
        return unlimitedFeatures.includes(featureKey)
      },

      isStale: () => {
        const { loadedAt, expiresAt } = get()
        if (!loadedAt || !expiresAt) return true
        return Date.now() > expiresAt
      },
    }),
    {
      name: 'autlify-session',
      storage: createJSONStorage(() => {
        // Use localStorage with IndexedDB fallback
        if (typeof window === 'undefined') {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          }
        }
        return localStorage
      }),
      // Only persist essential data
      partialize: (state) => ({
        context: state.context,
        permissions: state.permissions,
        permissionHash: state.permissionHash,
        enabledFeatures: state.enabledFeatures,
        unlimitedFeatures: state.unlimitedFeatures,
        entitlementHash: state.entitlementHash,
        planId: state.planId,
        planName: state.planName,
        loadedAt: state.loadedAt,
        expiresAt: state.expiresAt,
      }),
    }
  )
)

// ─────────────────────────────────────────────────────────────────────────────
// Selector Hooks (for optimized re-renders)
// ─────────────────────────────────────────────────────────────────────────────

export const usePermissions = () => useSessionMemory((s) => s.permissions)
export const useEnabledFeatures = () => useSessionMemory((s) => s.enabledFeatures)
export const useSessionContext = () => useSessionMemory((s) => s.context)
export const useIsSessionLoaded = () => useSessionMemory((s) => s.isLoaded)
export const usePlanInfo = () => useSessionMemory((s) => ({ planId: s.planId, planName: s.planName }))

/**
 * Hook to check a single permission
 */
export const useHasPermission = (key: string) => {
  return useSessionMemory((s) => s.permissions.includes('*') || s.permissions.includes(key))
}

/**
 * Hook to check if any of the permissions exist
 */
export const useHasAnyPermission = (keys: string[]) => {
  return useSessionMemory((s) => {
    if (s.permissions.includes('*')) return true
    return keys.some((key) => s.permissions.includes(key))
  })
}

/**
 * Hook to check feature availability
 */
export const useHasFeature = (featureKey: string) => {
  return useSessionMemory((s) => s.enabledFeatures.includes(featureKey))
}
