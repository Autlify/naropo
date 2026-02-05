/**
 * App-Wide Preferences Type Definitions
 * Global UI preferences that affect the entire application
 * 
 * @namespace Autlify.Types.AppPreferences
 */

// ============================================================================
// Core Types
// ============================================================================

/** Display density affects spacing and sizing throughout the app */
export type DisplayDensity = 'compact' | 'normal' | 'comfortable'

/** Animation level for all transitions */
export type AnimationLevel = 'none' | 'subtle' | 'smooth' | 'playful'

/** Icon size preset */
export type IconSize = 'sm' | 'md' | 'lg'

/** Font scale */
export type FontScale = 'xs' | 'sm' | 'base' | 'lg' | 'xl'

/** Border radius preset */
export type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'full'

/** Accent color preset */
export type AccentColor = 'default' | 'blue' | 'green' | 'purple' | 'orange' | 'pink'

// ============================================================================
// Configuration Types
// ============================================================================

export interface Accessibility {
  /** Reduce motion for animations (respects prefers-reduced-motion) */
  reducedMotion: boolean
  /** High contrast mode for better visibility */
  highContrast: boolean
  /** Enhanced focus indicators for keyboard navigation */
  focusIndicators: boolean
  /** Screen reader announcements for navigation changes */
  announceNavigation: boolean
  /** Enable keyboard shortcuts */
  keyboardShortcuts: boolean
  /** Minimum touch target size in pixels */
  minTouchTarget: number
}

export interface Display {
  /** UI density - affects spacing and component sizing */
  density: DisplayDensity
  /** Base font scale */
  fontScale: FontScale
  /** Icon size throughout the app */
  iconSize: IconSize
  /** Show tooltips on hover */
  showTooltips: boolean
  /** Show descriptions in lists and cards */
  showDescriptions: boolean
}

export interface Animation {
  /** Animation intensity level */
  level: AnimationLevel
  /** Custom duration multiplier (0.5 = faster, 2 = slower) */
  durationMultiplier: number
}

export interface Theme {
  /** Accent color for highlights and interactive elements */
  accentColor: AccentColor
  /** Border radius preset */
  borderRadius: BorderRadius
  /** Use system dark/light mode */
  useSystemTheme: boolean
}

export interface Notifications {
    /** PWA or WebApp related notifications */
    enableNotifications: boolean
    /** Marketing emails subscription */
    marketingEmails: boolean
    /** Email notifications for important updates */
    emailNotifications: boolean
    /** Notification sound on new alerts */
    soundAlerts: boolean
    /** Daily summary of notifications */
    dailySummary: boolean
}

export interface Privacy {
    /** Data sharing with third parties */
    dataSharing: boolean
    /** Personalized ads */
    personalizedAds: boolean
    /** Activity tracking */
    activityTracking: boolean
}


// ============================================================================
// Main Preferences Type
// ============================================================================

export interface Preferences {
  /** Version for migration */
  version: number
  /** Accessibility settings */
  accessibility: Accessibility
  /** Display settings */
  display: Display
  /** Animation settings */
  animation: Animation
  /** Theme customization */
  theme: Theme
  /** Auto-save preferences changes */
  autoSave: boolean
  /** Notification settings */
  notifications: Notifications
  /** Privacy settings */
  privacy: Privacy
}

// ============================================================================
// Default Values
// ============================================================================

export const ACCESSIBILITY: Accessibility = {
  reducedMotion: false, // Will be auto-detected from system preference
  highContrast: false,
  focusIndicators: true,
  announceNavigation: true,
  keyboardShortcuts: true,
  minTouchTarget: 44,
}

export const DISPLAY: Display = {
  density: 'normal',
  fontScale: 'base',
  iconSize: 'md',
  showTooltips: true,
  showDescriptions: false,
}

export const ANIMATION: Animation = {
  level: 'smooth',
  durationMultiplier: 1,
}

export const THEME: Theme = {
  accentColor: 'default',
  borderRadius: 'md',
  useSystemTheme: true,
}

export const NOTIFICATIONS: Notifications = {
    enableNotifications: true,
    marketingEmails: false,
    emailNotifications: true,
    soundAlerts: true,
    dailySummary: false,
}

export const PRIVACY: Privacy = {
    dataSharing: false,
    personalizedAds: false,
    activityTracking: false,
}

export const PREFERENCES: Preferences = {
  version: 1,
  accessibility: ACCESSIBILITY,
  display: DISPLAY,
  animation: ANIMATION,
  theme: THEME,
  autoSave: true,
  notifications: NOTIFICATIONS,
  privacy: PRIVACY,
}

// ============================================================================
// CSS Variable Mappings
// ============================================================================

/** Density to spacing multiplier */
export const DENSITY_MULTIPLIER: Record<DisplayDensity, number> = {
  compact: 0.75,
  normal: 1,
  comfortable: 1.25,
}

/** Density to gap class */
export const DENSITY_GAP: Record<DisplayDensity, string> = {
  compact: 'gap-1',
  normal: 'gap-2',
  comfortable: 'gap-3',
}

/** Density to padding class */
export const DENSITY_PADDING: Record<DisplayDensity, string> = {
  compact: 'p-2',
  normal: 'p-4',
  comfortable: 'p-6',
}

/** Font scale to size */
export const FONT_SCALE: Record<FontScale, string> = {
  xs: '14px',
  sm: '15px',
  base: '16px',
  lg: '18px',
  xl: '20px',
}

/** Icon size to pixels */
export const ICON_SIZE_PX: Record<IconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
}

/** Animation level to duration */
export const ANIMATION_DURATION: Record<AnimationLevel, number> = {
  none: 0,
  subtle: 100,
  smooth: 200,
  playful: 300,
}

/** Border radius to size */
export const BORDER_RADIUS: Record<BorderRadius, string> = {
  none: '0px',
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  full: '9999px',
}

/** Accent color to HSL values */
export const ACCENT_COLORS: Record<AccentColor, { h: number; s: number; l: number }> = {
  default: { h: 210, s: 40, l: 98 }, // Use theme default
  blue: { h: 217, s: 91, l: 60 },
  green: { h: 142, s: 71, l: 45 },
  purple: { h: 262, s: 83, l: 58 },
  orange: { h: 24, s: 95, l: 53 },
  pink: { h: 330, s: 81, l: 60 },
}

// ============================================================================
// Utility Types & Functions
// ============================================================================

/** Deep partial type for nested updates */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/** Merge two AppPreferences objects deeply */
export function mergePreferences(
  base: Preferences,
  updates: DeepPartial<Preferences>
): Preferences {
  const result: any = { ...base }

  for (const key in updates) {
    if (updates[key as keyof DeepPartial<Preferences>] !== undefined) {
      if (typeof updates[key as keyof DeepPartial<Preferences>] === 'object' && !Array.isArray(updates[key as keyof DeepPartial<Preferences>]) && updates[key as keyof DeepPartial<Preferences>] !== null) {
        result[key] = mergePreferences(base[key as keyof Preferences] as any, updates[key as keyof DeepPartial<Preferences>] as any)
      } else {
        result[key] = updates[key as keyof DeepPartial<Preferences>]
      }
    }
  }

  return result as Preferences
}
// What's the purpose of mergePreferences and DeppPartial do ?
// A: The purpose of DeepPartial is to create a type that allows for partial updates of nested objects within the AppPreferences type. It makes all properties optional and recursively applies this to nested objects. The mergePreferences function uses this DeepPartial type to merge a base AppPreferences object with an updates object, allowing for deep merging of nested properties. This is useful for updating user preferences without needing to provide the entire preferences object, enabling more flexible and granular updates.