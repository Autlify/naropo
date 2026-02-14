/**
 * UI Component Type Definitions
 * 
 * Centralized type definitions for UI components across the application.
 * This file consolidates types previously scattered across component files.
 */

/**
 * Scope type for navigation and context
 */
export type ScopeType = 'agency' | 'subaccount'

/**
 * Hierarchy levels define the depth of navigation:
 * - 1: Show only current tier items
 * - 2: Show current tier + one level deeper
 * - 3: Show current tier + two levels deeper (max depth)
 */
export type HierarchyLevel = 1 | 2 | 3

/**
 * Starting point for navigation hierarchy:
 * - 'module': Start from module level, can have levels 1|2|3
 * - 'submodule': Start from submodule level, can have levels 2|3 only
 * - 'feature': Start from feature level, can only have level 1 (last tier)
 */
export type HierarchyKind = 'module' | 'submodule' | 'feature'

/**
 * Display variant for the navigation:
 * - 'navbar': Horizontal tabs with overflow dropdown (default)
 * - 'dropdown': Single button that opens a dropdown menu with all items
 */
export type NavVariant = 'navbar' | 'dropdown'

/**
 * Navigation item structure
 */
export interface NavItem {
  key: string
  label: string
  href: string
  icon?: React.ReactNode
  children?: NavItem[]
  /** Permission key to check (optional) */
  permissionKey?: string
}

/**
 * Level validation rules:
 * - module: can have 1 (module→module), 2 (module→submodule), 3 (module→feature)
 * - submodule: can have 2 (submodule→submodule) or 3 (submodule→feature) only
 * - feature: can only have 1 (it's the last tier, cannot go deeper)
 */
export const ALLOWED_LEVELS: Record<HierarchyKind, readonly HierarchyLevel[]> = {
  module: [1, 2, 3],     // module can show 1, 2, or 3 levels
  submodule: [2, 3],     // submodule can show 2 or 3 levels only
  feature: [1],          // feature can only show 1 level (it's the last tier)
} as const

/**
 * Breadcrumb item for navigation
 */
export interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}

/**
 * Component variant types
 */
export type ComponentVariant = 'default' | 'outline' | 'ghost' | 'link' | 'destructive' | 'secondary'

/**
 * Component size types
 */
export type ComponentSize = 'sm' | 'md' | 'lg' | 'xl'

/**
 * Badge variant types
 */
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'
