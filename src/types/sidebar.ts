/**
 * Sidebar Type Definitions
 * Configurable sidebar system with icon rail + dynamic nav panel
 */

// ============================================================================
// Scope Types
// ============================================================================

/** Scope type - agency or subaccount */
export type ScopeType = 'agency' | 'subaccount'

/** Scope context - identifies the current agency/subaccount */
export interface ScopeContext {
  /** The ID of the agency or subaccount */
  id: string
  /** Whether this is an agency or subaccount */
  type: ScopeType
  /** Computed base path for navigation */
  basePath: string
}

// ============================================================================
// Layout Types
// ============================================================================

/** Single combines icon rail + nav panel; Double separates them */
export type SidebarLayout = 'single' | 'double'

/** Primary sidebar (icon rail) behavior */
export type PrimaryBehavior = 
  | 'fixed'        // Always visible, not collapsible
  | 'collapsible'  // Can collapse, shows flyout on hover
  | 'manual'       // Can collapse, no flyout (click to expand)
  | 'auto'         // Auto-hide, hover edge to reveal

/** Secondary sidebar (nav panel) behavior */
export type SecondaryBehavior =
  | 'fixed'        // Always visible alongside primary
  | 'optimized'    // Collapse primary, keep secondary visible
  | 'collapsible'  // Both can collapse, flyout on hover
  | 'follow'       // Follows primary collapse state
  | 'independent'  // Independent collapse controls
  | 'hidden'       // Start hidden, toggle to show
  | 'overlay'      // Overlays content when expanded

/** Sidebar width presets */
export type SidebarWidth = 'compact' | 'normal' | 'wide'

/** Sidebar position */
export type SidebarPosition = 'left' | 'right'

/** Animation intensity */
export type AnimationLevel = 'none' | 'subtle' | 'smooth' | 'playful'

/** Mobile behavior */
export type MobileBehavior = 
  | 'drawer'       // Slide-in drawer
  | 'overlay'      // Full overlay
  | 'bottom-sheet' // Bottom sheet modal
  | 'hidden'       // Hide on mobile

// ============================================================================
// Configuration Types
// ============================================================================

export interface PrimarySidebarConfig {
  behavior: PrimaryBehavior
  width: SidebarWidth
  position: SidebarPosition
  showTooltips: boolean
  iconSize: 'sm' | 'md' | 'lg'
  /** Show module labels below icons when expanded */
  showLabels: boolean
  /** Highlight active module */
  activeIndicator: 'bar' | 'background' | 'dot' | 'none'
}

export interface SecondarySidebarConfig {
  behavior: SecondaryBehavior
  width: SidebarWidth
  /** Show section headers */
  showHeaders: boolean
  /** Show item descriptions */
  showDescriptions: boolean
  /** Collapsible sections */
  collapsibleSections: boolean
  /** Remember collapsed sections */
  persistSectionState: boolean
  /** Show item icons */
  showItemIcons: boolean
  /** Density of items */
  density: 'compact' | 'normal' | 'comfortable'
}

export interface FlyoutConfig {
  /** Enable flyout on hover */
  enabled: boolean
  /** Delay before showing flyout (ms) */
  hoverDelay: number
  /** Delay before hiding flyout (ms) */
  hideDelay: number
  /** Flyout width */
  width: SidebarWidth
  /** Show nested items in flyout */
  showNestedItems: boolean
  /** Offset from trigger */
  offset: number
}

export interface AccessibilityConfig {
  /** Reduce motion for animations */
  reducedMotion: boolean
  /** High contrast mode */
  highContrast: boolean
  /** Enhanced focus indicators */
  focusIndicators: boolean
  /** Announce navigation changes */
  announceNavigation: boolean
  /** Keyboard shortcuts enabled */
  keyboardShortcuts: boolean
  /** Minimum touch target size (px) */
  minTouchTarget: number
}

export interface MobileConfig {
  behavior: MobileBehavior
  /** Show hamburger menu button */
  showMenuButton: boolean
  /** Swipe to open */
  swipeToOpen: boolean
  /** Backdrop blur */
  backdropBlur: boolean
  /** Auto-close on navigation */
  autoCloseOnNavigate: boolean
}

// ============================================================================
// Main Preferences Type
// ============================================================================

export interface SidebarPreferences {
  /** Unique ID for persistence */
  id: string
  /** Display name */
  name: string
  /** Layout mode */
  layout: SidebarLayout
  /** Primary sidebar configuration */
  primary: PrimarySidebarConfig
  /** Secondary sidebar configuration */
  secondary: SecondarySidebarConfig
  /** Flyout menu configuration */
  flyout: FlyoutConfig
  /** Accessibility settings */
  accessibility: AccessibilityConfig
  /** Mobile-specific settings */
  mobile: MobileConfig
  /** Animation level */
  animation: AnimationLevel
  /** Auto-save preferences */
  autoSave: boolean
  /** Theme (null = use global) */
  theme: string | null
}

// ============================================================================
// State Types
// ============================================================================

export interface SidebarState {
  /** Is primary collapsed */
  primaryCollapsed: boolean
  /** Is secondary collapsed */
  secondaryCollapsed: boolean
  /** Currently active module ID */
  activeModule: string | null
  /** Currently hovered module ID (for flyout) */
  hoveredModule: string | null
  /** Is flyout visible */
  flyoutVisible: boolean
  /** Is mobile drawer open */
  mobileOpen: boolean
  /** Collapsed section IDs */
  collapsedSections: string[]
}

export interface SidebarActions {
  setPrimaryCollapsed: (collapsed: boolean) => void
  togglePrimary: () => void
  setSecondaryCollapsed: (collapsed: boolean) => void
  toggleSecondary: () => void
  setActiveModule: (moduleId: string | null) => void
  setHoveredModule: (moduleId: string | null) => void
  setFlyoutVisible: (visible: boolean) => void
  setMobileOpen: (open: boolean) => void
  toggleSection: (sectionId: string) => void
  resetState: () => void
}

// ============================================================================
// Navigation Types
// ============================================================================

export interface NavModule {
  id: string
  name: string
  icon: string
  href?: string
  /** Is this a grouping module (has children) */
  isGroup: boolean
  /** Badge text/count */
  badge?: string | number
  /** Badge variant */
  badgeVariant?: 'default' | 'destructive' | 'success' | 'warning'
  /** Children navigation items */
  items?: NavItem[]
  /** Required permission */
  permission?: string
  /** Is premium feature */
  isPremium?: boolean
  /** Sort order */
  order: number
}

export interface NavItem {
  id: string
  name: string
  description?: string
  icon?: string
  href: string
  /** Badge text/count */
  badge?: string | number
  /** Is external link */
  external?: boolean
  /** Required permission */
  permission?: string
  /** Is premium feature */
  isPremium?: boolean
  /** Keyboard shortcut */
  shortcut?: string[]
  /** Disabled state */
  disabled?: boolean
}

export interface NavSection {
  id: string
  title?: string
  items: NavItem[]
  /** Is section collapsible */
  collapsible: boolean
  /** Default collapsed state */
  defaultCollapsed: boolean
}

// ============================================================================
// Preset Types
// ============================================================================

export interface SidebarPreset {
  id: string
  name: string
  description: string
  preview?: string
  preferences: Partial<SidebarPreferences>
  /** Is this a system preset (non-editable) */
  isSystem: boolean
  /** Is this a premium preset */
  isPremium: boolean
}

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_PRIMARY_CONFIG: PrimarySidebarConfig = {
  behavior: 'collapsible',
  width: 'compact',
  position: 'left',
  showTooltips: true,
  iconSize: 'md',
  showLabels: false,
  activeIndicator: 'bar',
}

export const DEFAULT_SECONDARY_CONFIG: SecondarySidebarConfig = {
  behavior: 'follow',
  width: 'normal',
  showHeaders: true,
  showDescriptions: false,
  collapsibleSections: true,
  persistSectionState: true,
  showItemIcons: true,
  density: 'normal',
}

export const DEFAULT_FLYOUT_CONFIG: FlyoutConfig = {
  enabled: true,
  hoverDelay: 150,
  hideDelay: 300,
  width: 'normal',
  showNestedItems: true,
  offset: 4,
}

export const DEFAULT_ACCESSIBILITY_CONFIG: AccessibilityConfig = {
  reducedMotion: false,
  highContrast: false,
  focusIndicators: true,
  announceNavigation: true,
  keyboardShortcuts: true,
  minTouchTarget: 44,
}

export const DEFAULT_MOBILE_CONFIG: MobileConfig = {
  behavior: 'drawer',
  showMenuButton: true,
  swipeToOpen: true,
  backdropBlur: true,
  autoCloseOnNavigate: true,
}

export const DEFAULT_SIDEBAR_PREFERENCES: SidebarPreferences = {
  id: 'default',
  name: 'Default',
  layout: 'double',
  primary: DEFAULT_PRIMARY_CONFIG,
  secondary: DEFAULT_SECONDARY_CONFIG,
  flyout: DEFAULT_FLYOUT_CONFIG,
  accessibility: DEFAULT_ACCESSIBILITY_CONFIG,
  mobile: DEFAULT_MOBILE_CONFIG,
  animation: 'smooth',
  autoSave: true,
  theme: null,
}

export const DEFAULT_SIDEBAR_STATE: SidebarState = {
  primaryCollapsed: false,
  secondaryCollapsed: false,
  activeModule: null,
  hoveredModule: null,
  flyoutVisible: false,
  mobileOpen: false,
  collapsedSections: [],
}

// ============================================================================
// System Presets
// ============================================================================

export const SIDEBAR_PRESETS: SidebarPreset[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Icon rail with collapsible flyout menu',
    isSystem: true,
    isPremium: false,
    preferences: {
      layout: 'double',
      primary: { ...DEFAULT_PRIMARY_CONFIG, behavior: 'collapsible' },
    },
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Minimal sidebar, icon rail only',
    isSystem: true,
    isPremium: false,
    preferences: {
      layout: 'single',
      primary: { ...DEFAULT_PRIMARY_CONFIG, behavior: 'fixed', width: 'compact' },
    },
  },
  {
    id: 'expanded',
    name: 'Always Expanded',
    description: 'Full sidebar always visible',
    isSystem: true,
    isPremium: false,
    preferences: {
      layout: 'double',
      primary: { ...DEFAULT_PRIMARY_CONFIG, behavior: 'fixed' },
      secondary: { ...DEFAULT_SECONDARY_CONFIG, behavior: 'fixed' },
    },
  },
  {
    id: 'auto-hide',
    name: 'Auto-Hide',
    description: 'Sidebar hides automatically, hover edge to reveal',
    isSystem: true,
    isPremium: false,
    preferences: {
      layout: 'double',
      primary: { ...DEFAULT_PRIMARY_CONFIG, behavior: 'auto' },
      secondary: { ...DEFAULT_SECONDARY_CONFIG, behavior: 'overlay' },
    },
  },
  {
    id: 'focus-mode',
    name: 'Focus Mode',
    description: 'Minimal distractions, hidden by default',
    isSystem: true,
    isPremium: true,
    preferences: {
      layout: 'single',
      primary: { ...DEFAULT_PRIMARY_CONFIG, behavior: 'auto', width: 'compact' },
      secondary: { ...DEFAULT_SECONDARY_CONFIG, behavior: 'hidden' },
    },
  },
]
