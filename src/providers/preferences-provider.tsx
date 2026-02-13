'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import {
  type Preferences,
  type Accessibility,
  type Display,
  type Animation,
  type Theme,
  type DisplayDensity,
  type AnimationLevel,
  type IconSize,
  type FontScale,
  type BorderRadius,
  type AccentColor,
  PREFERENCES,
  DENSITY_MULTIPLIER,
  FONT_SCALE,
  ICON_SIZE_PX,
  ANIMATION_DURATION,
  BORDER_RADIUS,
  ACCENT_COLORS,
} from '@/types/preferences'

// ============================================================================
// Storage Key
// ============================================================================

const STORAGE_KEY = 'autlify.preferences_token'

// ============================================================================
// Context Type
// ============================================================================

interface PreferencesContext {
  /** Current preferences */
  preferences: Preferences
  /** Whether preferences have loaded from storage */
  isLoaded: boolean
  /** Update entire preferences */
  updatePreferences: (updates: DeepPartial<Preferences>) => void
  /** Update accessibility settings */
  updateAccessibility: (updates: Partial<Accessibility>) => void
  /** Update display settings */
  updateDisplay: (updates: Partial<Display>) => void
  /** Update animation settings */
  updateAnimation: (updates: Partial<Animation>) => void
  /** Update theme settings */
  updateTheme: (updates: Partial<Theme>) => void
  /** Reset to defaults */
  resetPreferences: () => void
  /** Save current preferences to storage */
  savePreferences: () => void
  // Computed values for easy access
  densityMultiplier: number
  animationDuration: number
  iconSizePx: number
  effectiveReducedMotion: boolean
}

/** Deep partial type */
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// ============================================================================
// Context
// ============================================================================

const PreferencesContext = createContext<PreferencesContext | null>(null)

// ============================================================================
// CSS Variable Applier
// ============================================================================

function applyCSSVariables(preferences: Preferences, reducedMotion: boolean) {
  if (typeof document === 'undefined') return

  const root = document.documentElement

  // Density
  const densityMult = DENSITY_MULTIPLIER[preferences.display.density]
  root.style.setProperty('--app-density', String(densityMult))
  root.style.setProperty('--app-spacing-unit', `${4 * densityMult}px`)
  root.style.setProperty('--app-gap-sm', `${4 * densityMult}px`)
  root.style.setProperty('--app-gap-md', `${8 * densityMult}px`)
  root.style.setProperty('--app-gap-lg', `${16 * densityMult}px`)
  root.style.setProperty('--app-padding-sm', `${8 * densityMult}px`)
  root.style.setProperty('--app-padding-md', `${16 * densityMult}px`)
  root.style.setProperty('--app-padding-lg', `${24 * densityMult}px`)

  // Font scale
  root.style.setProperty('--app-font-size', FONT_SCALE[preferences.display.fontScale])

  // Icon size
  const iconPx = ICON_SIZE_PX[preferences.display.iconSize]
  root.style.setProperty('--app-icon-size', `${iconPx}px`)
  root.style.setProperty('--app-icon-size-sm', `${iconPx * 0.75}px`)
  root.style.setProperty('--app-icon-size-lg', `${iconPx * 1.5}px`)

  // Animation
  const effectiveLevel = reducedMotion ? 'none' : preferences.animation.level
  const baseDuration = ANIMATION_DURATION[effectiveLevel]
  const duration = baseDuration * preferences.animation.durationMultiplier
  root.style.setProperty('--app-animation-duration', `${duration}ms`)
  root.style.setProperty('--app-animation-duration-fast', `${duration * 0.5}ms`)
  root.style.setProperty('--app-animation-duration-slow', `${duration * 2}ms`)
  root.style.setProperty('--app-transition-timing', effectiveLevel === 'playful' 
    ? 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' 
    : 'cubic-bezier(0.4, 0, 0.2, 1)')

  // Border radius
  root.style.setProperty('--app-radius', BORDER_RADIUS[preferences.theme.borderRadius])
  root.style.setProperty('--app-radius-sm', 
    preferences.theme.borderRadius === 'none' ? '0px' : 
    preferences.theme.borderRadius === 'full' ? '9999px' :
    `calc(${BORDER_RADIUS[preferences.theme.borderRadius]} * 0.5)`)
  root.style.setProperty('--app-radius-lg', 
    preferences.theme.borderRadius === 'none' ? '0px' : 
    preferences.theme.borderRadius === 'full' ? '9999px' :
    `calc(${BORDER_RADIUS[preferences.theme.borderRadius]} * 1.5)`)

  // Accent color (only if not default)
  if (preferences.theme.accentColor !== 'default') {
    const { h, s, l } = ACCENT_COLORS[preferences.theme.accentColor]
    root.style.setProperty('--app-accent-h', String(h))
    root.style.setProperty('--app-accent-s', `${s}%`)
    root.style.setProperty('--app-accent-l', `${l}%`)
    root.style.setProperty('--app-accent', `hsl(${h}, ${s}%, ${l}%)`)
  } else {
    root.style.removeProperty('--app-accent-h')
    root.style.removeProperty('--app-accent-s')
    root.style.removeProperty('--app-accent-l')
    root.style.removeProperty('--app-accent')
  }

  // Accessibility
  root.style.setProperty('--app-min-touch-target', `${preferences.accessibility.minTouchTarget}px`)
  
  // High contrast mode
  if (preferences.accessibility.highContrast) {
    root.setAttribute('data-high-contrast', 'true')
  } else {
    root.removeAttribute('data-high-contrast')
  }

  // Focus indicators
  if (preferences.accessibility.focusIndicators) {
    root.setAttribute('data-focus-visible', 'true')
  } else {
    root.removeAttribute('data-focus-visible')
  }

  // Density class for Tailwind utilities
  root.setAttribute('data-density', preferences.display.density)
  
  // Animation level class
  root.setAttribute('data-animation', effectiveLevel)
}

// ============================================================================
// Provider
// ============================================================================

interface PreferencesProvider {
  children: React.ReactNode
  /** Initial preferences (for SSR) */
  initialPreferences?: Partial<Preferences>
}

export function PreferencesProvider({ 
  children, 
  initialPreferences 
}: PreferencesProvider) {
  // State
  const [preferences, setPreferences] = useState<Preferences>(() => ({
    ...PREFERENCES,
    ...initialPreferences,
  }))
  const [isLoaded, setIsLoaded] = useState(false)
  const [systemReducedMotion, setSystemReducedMotion] = useState(false)

  // Load from storage
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check system reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setSystemReducedMotion(motionQuery.matches)
    
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setSystemReducedMotion(e.matches)
    }
    motionQuery.addEventListener('change', handleMotionChange)

    // Load preferences
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as DeepPartial<Preferences>
        setPreferences(prev => {
          const merged: Preferences = {
              version: parsed.version ?? prev.version,
              accessibility: parsed.accessibility
                  ? { ...prev.accessibility, ...parsed.accessibility }
                  : prev.accessibility,

              display: parsed.display
                  ? { ...prev.display, ...parsed.display }
                  : prev.display,
              animation: parsed.animation
                  ? { ...prev.animation, ...parsed.animation }
                  : prev.animation,
              theme: parsed.theme
                  ? { ...prev.theme, ...parsed.theme }
                  : prev.theme,
              autoSave: parsed.autoSave ?? prev.autoSave,
              notifications: parsed.notifications
                  ? { ...prev.notifications, ...parsed.notifications }
                  : prev.notifications,
              privacy: parsed.privacy
                  ? { ...prev.privacy, ...parsed.privacy }
                  : prev.privacy,
          }
          return merged
        })
      }
    } catch {
      // Ignore parse errors
    }

    setIsLoaded(true)

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange)
    }
  }, [])

  // Compute effective reduced motion
  const effectiveReducedMotion = useMemo(() => (
    systemReducedMotion || preferences.accessibility.reducedMotion
  ), [systemReducedMotion, preferences.accessibility.reducedMotion])

  // Apply CSS variables when preferences change
  useEffect(() => {
    if (!isLoaded) return
    applyCSSVariables(preferences, effectiveReducedMotion)
  }, [preferences, effectiveReducedMotion, isLoaded])

  // Auto-save
  useEffect(() => {
    if (!isLoaded || !preferences.autoSave) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    } catch {
      // Ignore storage errors
    }
  }, [preferences, isLoaded])

  // Update functions
  const updatePreferences = useCallback((updates: DeepPartial<Preferences>) => {
    setPreferences(prev => {
      const merged: Preferences = {
        version: updates.version ?? prev.version,
        accessibility: updates.accessibility 
          ? { ...prev.accessibility, ...updates.accessibility }
          : prev.accessibility,
        display: updates.display
          ? { ...prev.display, ...updates.display }
          : prev.display,
        animation: updates.animation
          ? { ...prev.animation, ...updates.animation }
          : prev.animation,
        theme: updates.theme
          ? { ...prev.theme, ...updates.theme }
          : prev.theme,
        autoSave: updates.autoSave ?? prev.autoSave,
        notifications: updates.notifications
          ? { ...prev.notifications, ...updates.notifications }
          : prev.notifications,
        privacy: updates.privacy
          ? { ...prev.privacy, ...updates.privacy }
          : prev.privacy,
      }
      return merged
    })
  }, [])

  const updateAccessibility = useCallback((updates: Partial<Accessibility>) => {
    setPreferences(prev => ({
      ...prev,
      accessibility: { ...prev.accessibility, ...updates },
    }))
  }, [])

  const updateDisplay = useCallback((updates: Partial<Display>) => {
    setPreferences(prev => ({
      ...prev,
      display: { ...prev.display, ...updates },
    }))
  }, [])

  const updateAnimation = useCallback((updates: Partial<Animation>) => {
    setPreferences(prev => ({
      ...prev,
      animation: { ...prev.animation, ...updates },
    }))
  }, [])

  const updateTheme = useCallback((updates: Partial<Theme>) => {
    setPreferences(prev => ({
      ...prev,
      theme: { ...prev.theme, ...updates },
    }))
  }, [])

  const resetPreferences = useCallback(() => {
    setPreferences(PREFERENCES)
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const savePreferences = useCallback(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    }
  }, [preferences])

  // Computed values
  const densityMultiplier = DENSITY_MULTIPLIER[preferences.display.density]
  const animationDuration = effectiveReducedMotion 
    ? 0 
    : ANIMATION_DURATION[preferences.animation.level] * preferences.animation.durationMultiplier
  const iconSizePx = ICON_SIZE_PX[preferences.display.iconSize]

  // Context value
  const value = useMemo<PreferencesContext>(() => ({
    preferences,
    isLoaded,
    updatePreferences,
    updateAccessibility,
    updateDisplay,
    updateAnimation,
    updateTheme,
    resetPreferences,
    savePreferences,
    densityMultiplier,
    animationDuration,
    iconSizePx,
    effectiveReducedMotion,
  }), [
    preferences,
    isLoaded,
    updatePreferences,
    updateAccessibility,
    updateDisplay,
    updateAnimation,
    updateTheme,
    resetPreferences,
    savePreferences,
    densityMultiplier,
    animationDuration,
    iconSizePx,
    effectiveReducedMotion,
  ])

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  )
}

// ============================================================================
// Hooks
// ============================================================================

/** Main hook to access app preferences */
export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider')
  }
  return context
}

/** Convenience hook for accessibility preferences */
export function useAccessibility() {
  const { preferences, updateAccessibility, effectiveReducedMotion } = usePreferences()
  return {
    ...preferences.accessibility,
    effectiveReducedMotion,
    update: updateAccessibility,
  }
}

/** Convenience hook for display preferences */
export function useDisplay() {
  const { preferences, updateDisplay, densityMultiplier, iconSizePx } = usePreferences()
  return {
    ...preferences.display,
    densityMultiplier,
    iconSizePx,
    update: updateDisplay,
  }
}

/** Convenience hook for animation preferences */
export function useAnimation() {
  const { preferences, updateAnimation, animationDuration, effectiveReducedMotion } = usePreferences()
  return {
    ...preferences.animation,
    effectiveLevel: effectiveReducedMotion ? 'none' as const : preferences.animation.level,
    duration: animationDuration,
    update: updateAnimation,
  }
}

/** Convenience hook for theme preferences */
export function useThemePreferences() {
  const { preferences, updateTheme } = usePreferences()
  return {
    ...preferences.theme,
    update: updateTheme,
  }
}

// ============================================================================
// Utilities
// ============================================================================

/** Get density classes for components */
export function getDensityClasses(density: DisplayDensity): {
  padding: string
  gap: string
  text: string
} {
  switch (density) {
    case 'compact':
      return { padding: 'p-1.5', gap: 'gap-1', text: 'text-xs' }
    case 'comfortable':
      return { padding: 'p-3', gap: 'gap-3', text: 'text-base' }
    default:
      return { padding: 'p-2', gap: 'gap-2', text: 'text-sm' }
  }
}

/** Get icon size classes */
export function getIconClasses(size: IconSize): string {
  switch (size) {
    case 'sm':
      return 'h-4 w-4'
    case 'lg':
      return 'h-6 w-6'
    default:
      return 'h-5 w-5'
  }
}
