'use client'

/**
 * GL Provider
 * Client-side context for General Ledger state management
 * 
 * @namespace Autlify.Lib.Features.FI.GL.Core.Provider
 */

import React, { 
  createContext, 
  useContext, 
  useState, 
  useCallback,
  useMemo,
  type ReactNode 
} from 'react'
import type { 
  FinancialPeriod, 
  ChartOfAccount, 
  GLConfiguration 
} from '@/generated/prisma/client'
import type { GLContextType } from './context'

/** Period option for selectors */
export interface PeriodOption {
  id: string
  name: string
  startDate: Date
  endDate: Date
  status: string
}

// Import AccountOption from types to avoid duplicate export
import type { AccountOption } from './types'

/** GL Context state */
interface GLState {
  // Context type (agency or subaccount)
  contextType: GLContextType | null
  
  // Selected period for operations
  selectedPeriodId: string | null
  selectedPeriod: PeriodOption | null
  
  // Cached data
  periods: PeriodOption[]
  accounts: AccountOption[]
  configuration: GLConfiguration | null
  
  // Loading states
  isLoading: boolean
  isInitialized: boolean
}

/** GL Context actions */
interface GLActions {
  // Period selection
  setSelectedPeriod: (periodId: string | null) => void
  
  // Cache management
  setPeriods: (periods: PeriodOption[]) => void
  setAccounts: (accounts: AccountOption[]) => void
  setConfiguration: (config: GLConfiguration | null) => void
  
  // Initialization
  initialize: (data: Partial<GLState>) => void
  setLoading: (loading: boolean) => void
  
  // Refresh
  refreshAccounts: () => Promise<void>
  refreshPeriods: () => Promise<void>
}

/** Full GL context value */
interface GLContextValue extends GLState, GLActions {}

/** Initial state */
const initialState: GLState = {
  contextType: null,
  selectedPeriodId: null,
  selectedPeriod: null,
  periods: [],
  accounts: [],
  configuration: null,
  isLoading: false,
  isInitialized: false,
}

/** Create context */
const GLContext = createContext<GLContextValue | null>(null)

/** Provider props */
interface GLProviderProps {
  children: ReactNode
  contextType?: GLContextType
  initialPeriodId?: string
  initialPeriods?: PeriodOption[]
  initialAccounts?: AccountOption[]
  initialConfiguration?: GLConfiguration | null
}

/**
 * GL Provider Component
 * Provides GL state and actions to child components
 */
export function GLProvider({
  children,
  contextType = 'AGENCY',
  initialPeriodId,
  initialPeriods = [],
  initialAccounts = [],
  initialConfiguration = null,
}: GLProviderProps) {
  const [state, setState] = useState<GLState>(() => ({
    ...initialState,
    contextType,
    selectedPeriodId: initialPeriodId ?? null,
    selectedPeriod: initialPeriods.find(p => p.id === initialPeriodId) ?? null,
    periods: initialPeriods,
    accounts: initialAccounts,
    configuration: initialConfiguration,
    isInitialized: true,
  }))

  // Actions
  const setSelectedPeriod = useCallback((periodId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedPeriodId: periodId,
      selectedPeriod: periodId 
        ? prev.periods.find(p => p.id === periodId) ?? null 
        : null,
    }))
  }, [])

  const setPeriods = useCallback((periods: PeriodOption[]) => {
    setState(prev => ({
      ...prev,
      periods,
      // Update selected period if it exists in new list
      selectedPeriod: prev.selectedPeriodId 
        ? periods.find(p => p.id === prev.selectedPeriodId) ?? null 
        : null,
    }))
  }, [])

  const setAccounts = useCallback((accounts: AccountOption[]) => {
    setState(prev => ({ ...prev, accounts }))
  }, [])

  const setConfiguration = useCallback((configuration: GLConfiguration | null) => {
    setState(prev => ({ ...prev, configuration }))
  }, [])

  const initialize = useCallback((data: Partial<GLState>) => {
    setState(prev => ({ ...prev, ...data, isInitialized: true }))
  }, [])

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }))
  }, [])

  // Refresh functions (to be implemented with actual API calls)
  const refreshAccounts = useCallback(async () => {
    // Will be implemented with actual fetch
    console.log('Refreshing accounts...')
  }, [])

  const refreshPeriods = useCallback(async () => {
    // Will be implemented with actual fetch
    console.log('Refreshing periods...')
  }, [])

  // Memoize context value
  const value = useMemo<GLContextValue>(() => ({
    ...state,
    setSelectedPeriod,
    setPeriods,
    setAccounts,
    setConfiguration,
    initialize,
    setLoading,
    refreshAccounts,
    refreshPeriods,
  }), [
    state, 
    setSelectedPeriod, 
    setPeriods, 
    setAccounts, 
    setConfiguration,
    initialize,
    setLoading,
    refreshAccounts,
    refreshPeriods,
  ])

  return (
    <GLContext.Provider value={value}>
      {children}
    </GLContext.Provider>
  )
}

/**
 * Hook to access GL context
 * @throws Error if used outside GLProvider
 */
export function useGLContext(): GLContextValue {
  const context = useContext(GLContext)
  if (!context) {
    throw new Error('useGLContext must be used within a GLProvider')
  }
  return context
}

/**
 * Hook for selected period
 */
export function useSelectedPeriod() {
  const { selectedPeriod, selectedPeriodId, setSelectedPeriod, periods } = useGLContext()
  return { selectedPeriod, selectedPeriodId, setSelectedPeriod, periods }
}

/**
 * Hook for accounts
 */
export function useAccounts() {
  const { accounts, setAccounts, refreshAccounts, isLoading } = useGLContext()
  return { accounts, setAccounts, refreshAccounts, isLoading }
}

/**
 * Hook for GL configuration
 */
export function useGLConfiguration() {
  const { configuration, setConfiguration } = useGLContext()
  return { configuration, setConfiguration }
}

/**
 * Hook to check if in agency context
 */
export function useIsAgencyContext() {
  const { contextType } = useGLContext()
  return contextType === 'AGENCY'
}

/**
 * Optional GL context hook (doesn't throw if outside provider)
 */
export function useOptionalGLContext(): GLContextValue | null {
  return useContext(GLContext)
}
