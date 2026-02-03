'use client'

import React, { createContext, useContext, useCallback, useEffect, useState, useMemo, ReactNode } from 'react'
import {
  SidebarPreferences,
  SidebarState,
  SidebarActions,
  NavModule,
  ScopeContext,
  ScopeType,
  DEFAULT_SIDEBAR_PREFERENCES,
  DEFAULT_SIDEBAR_STATE,
} from './types'

// ============================================================================
// Context Types
// ============================================================================

interface SidebarContextValue {
  /** Current scope (agency or subaccount) */
  scope: ScopeContext
  preferences: SidebarPreferences
  state: SidebarState
  actions: SidebarActions
  modules: NavModule[]
  setModules: (modules: NavModule[]) => void
  updatePreferences: (updates: Partial<SidebarPreferences>) => void
  resetPreferences: () => void
}

// ============================================================================
// Context
// ============================================================================

export const SidebarContext = createContext<SidebarContextValue | null>(null)

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEY_PREFERENCES = 'autlify:sidebar:preferences'
const STORAGE_KEY_STATE = 'autlify:sidebar:state'

// ============================================================================
// Provider Props
// ============================================================================

interface SidebarProviderProps {
  children: ReactNode
  /** Agency or Subaccount ID */
  id: string
  /** Scope type */
  type: ScopeType
  /** Initial preferences (overrides defaults) */
  initialPreferences?: Partial<SidebarPreferences>
  /** Initial modules */
  initialModules?: NavModule[]
  /** Disable persistence */
  disablePersistence?: boolean
  /** Storage key prefix (for multi-instance) */
  storagePrefix?: string
}

// ============================================================================
// Provider
// ============================================================================

export function SidebarProvider({
  children,
  id,
  type,
  initialPreferences,
  initialModules = [],
  disablePersistence = false,
  storagePrefix = '',
}: SidebarProviderProps) {
  // Compute scope context
  const scope: ScopeContext = useMemo(() => ({
    id,
    type,
    basePath: type === 'agency' ? `/agency/${id}` : `/subaccount/${id}`,
  }), [id, type])
  // Hydration guard
  const [isHydrated, setIsHydrated] = useState(false)

  // Get storage keys with prefix
  const prefKey = storagePrefix ? `${storagePrefix}:${STORAGE_KEY_PREFERENCES}` : STORAGE_KEY_PREFERENCES
  const stateKey = storagePrefix ? `${storagePrefix}:${STORAGE_KEY_STATE}` : STORAGE_KEY_STATE

  // Load preferences from storage
  const loadPreferences = useCallback((): SidebarPreferences => {
    if (typeof window === 'undefined' || disablePersistence) {
      return { ...DEFAULT_SIDEBAR_PREFERENCES, ...initialPreferences }
    }
    try {
      const stored = localStorage.getItem(prefKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        return { ...DEFAULT_SIDEBAR_PREFERENCES, ...parsed, ...initialPreferences }
      }
    } catch {
      // Ignore parse errors
    }
    return { ...DEFAULT_SIDEBAR_PREFERENCES, ...initialPreferences }
  }, [prefKey, disablePersistence, initialPreferences])

  // Load state from storage
  const loadState = useCallback((): SidebarState => {
    if (typeof window === 'undefined' || disablePersistence) {
      return DEFAULT_SIDEBAR_STATE
    }
    try {
      const stored = localStorage.getItem(stateKey)
      if (stored) {
        const parsed = JSON.parse(stored)
        return { ...DEFAULT_SIDEBAR_STATE, ...parsed }
      }
    } catch {
      // Ignore parse errors
    }
    return DEFAULT_SIDEBAR_STATE
  }, [stateKey, disablePersistence])

  // State
  const [preferences, setPreferences] = useState<SidebarPreferences>(loadPreferences)
  const [state, setState] = useState<SidebarState>(loadState)
  const [modules, setModules] = useState<NavModule[]>(initialModules)

  // Hydration effect
  useEffect(() => {
    setPreferences(loadPreferences())
    setState(loadState())
    setIsHydrated(true)
  }, [loadPreferences, loadState])

  // Persist preferences
  useEffect(() => {
    if (!isHydrated || disablePersistence || !preferences.autoSave) return
    try {
      localStorage.setItem(prefKey, JSON.stringify(preferences))
    } catch {
      // Ignore storage errors
    }
  }, [preferences, isHydrated, disablePersistence, prefKey])

  // Persist state (partial - only sections and collapse states)
  useEffect(() => {
    if (!isHydrated || disablePersistence) return
    try {
      const persistedState = {
        primaryCollapsed: state.primaryCollapsed,
        secondaryCollapsed: state.secondaryCollapsed,
        collapsedSections: state.collapsedSections,
      }
      localStorage.setItem(stateKey, JSON.stringify(persistedState))
    } catch {
      // Ignore storage errors
    }
  }, [state.primaryCollapsed, state.secondaryCollapsed, state.collapsedSections, isHydrated, disablePersistence, stateKey])

  // Actions
  const actions: SidebarActions = useMemo(() => ({
    setPrimaryCollapsed: (collapsed: boolean) => {
      setState(prev => ({ ...prev, primaryCollapsed: collapsed }))
    },
    togglePrimary: () => {
      setState(prev => ({ ...prev, primaryCollapsed: !prev.primaryCollapsed }))
    },
    setSecondaryCollapsed: (collapsed: boolean) => {
      setState(prev => ({ ...prev, secondaryCollapsed: collapsed }))
    },
    toggleSecondary: () => {
      setState(prev => ({ ...prev, secondaryCollapsed: !prev.secondaryCollapsed }))
    },
    setActiveModule: (moduleId: string | null) => {
      setState(prev => ({ ...prev, activeModule: moduleId }))
    },
    setHoveredModule: (moduleId: string | null) => {
      setState(prev => ({ ...prev, hoveredModule: moduleId }))
    },
    setFlyoutVisible: (visible: boolean) => {
      setState(prev => ({ ...prev, flyoutVisible: visible }))
    },
    setMobileOpen: (open: boolean) => {
      setState(prev => ({ ...prev, mobileOpen: open }))
    },
    toggleSection: (sectionId: string) => {
      setState(prev => ({
        ...prev,
        collapsedSections: prev.collapsedSections.includes(sectionId)
          ? prev.collapsedSections.filter(id => id !== sectionId)
          : [...prev.collapsedSections, sectionId],
      }))
    },
    resetState: () => {
      setState(DEFAULT_SIDEBAR_STATE)
    },
  }), [])

  // Update preferences
  const updatePreferences = useCallback((updates: Partial<SidebarPreferences>) => {
    setPreferences(prev => {
      const next = { ...prev }
      // Deep merge for nested objects
      for (const [key, value] of Object.entries(updates)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          (next as any)[key] = { ...(prev as any)[key], ...value }
        } else {
          (next as any)[key] = value
        }
      }
      return next
    })
  }, [])

  // Reset preferences
  const resetPreferences = useCallback(() => {
    setPreferences({ ...DEFAULT_SIDEBAR_PREFERENCES, ...initialPreferences })
  }, [initialPreferences])

  // Context value
  const value = useMemo<SidebarContextValue>(() => ({
    scope,
    preferences,
    state,
    actions,
    modules,
    setModules,
    updatePreferences,
    resetPreferences,
  }), [scope, preferences, state, actions, modules, updatePreferences, resetPreferences])

  // Prevent hydration mismatch
  if (!isHydrated) {
    return (
      <SidebarContext.Provider value={{
        scope,
        preferences: { ...DEFAULT_SIDEBAR_PREFERENCES, ...initialPreferences },
        state: DEFAULT_SIDEBAR_STATE,
        actions,
        modules: initialModules,
        setModules,
        updatePreferences,
        resetPreferences,
      }}>
        {children}
      </SidebarContext.Provider>
    )
  }

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  )
}

// ============================================================================
// Hook
// ============================================================================

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

// ============================================================================
// Selector Hooks (for performance)
// ============================================================================

export function useSidebarPreferences() {
  const { preferences, updatePreferences, resetPreferences } = useSidebar()
  return { preferences, updatePreferences, resetPreferences }
}

export function useSidebarState() {
  const { state, actions } = useSidebar()
  return { state, actions }
}

export function useSidebarModules() {
  const { modules, setModules, state } = useSidebar()
  return { modules, setModules, activeModule: state.activeModule }
}

export function useIsSidebarCollapsed() {
  const { state, preferences } = useSidebar()
  return {
    primaryCollapsed: state.primaryCollapsed,
    secondaryCollapsed: state.secondaryCollapsed,
    canCollapsePrimary: preferences.primary.behavior !== 'fixed',
    canCollapseSecondary: preferences.secondary.behavior !== 'fixed',
  }
}

export function useScope() {
  const { scope } = useSidebar()
  return scope
}

export function useBasePath() {
  const { scope } = useSidebar()
  return scope.basePath
}
