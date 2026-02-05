'use client'

import React, { useContext, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { SidebarContext } from '@/components/sidebar-01/context'
import type { MobileBehavior } from '@/types/sidebar'
import {
  Accessibility,
  Eye,
  Focus,
  Keyboard,
  MousePointer2,
  RotateCcw,
  Smartphone,
  Speaker,
  Sun,
  Vibrate,
  Move,
  Hand,
  AlertCircle,
  CheckCircle2,
  Save,
  Loader2,
} from 'lucide-react'
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetHeader, SheetFooter } from '../ui/sheet'
import { toast } from 'sonner'

// ============================================================================
// Default preferences for standalone usage (outside SidebarProvider)
// ============================================================================

const defaultAccessibility = {
  reducedMotion: false,
  highContrast: false,
  focusIndicators: true,
  announceNavigation: true,
  keyboardShortcuts: true,
  minTouchTarget: 44,
}

const defaultMobile = {
  behavior: 'drawer' as MobileBehavior,
  showMenuButton: true,
  swipeToOpen: true,
  backdropBlur: true,
  autoCloseOnNavigate: true,
  breakpoint: 768,
}

// Storage key for persisting preferences
const STORAGE_KEY = 'autlify:accessibility:preferences'

// Safe hook that works outside of SidebarProvider
function useSafePreferences() {
  const context = useContext(SidebarContext)

  // Local state for standalone mode with persistence
  const [localAccessibility, setLocalAccessibility] = React.useState(defaultAccessibility)
  const [localMobile, setLocalMobile] = React.useState(defaultMobile)
  const [isLoaded, setIsLoaded] = React.useState(false)

  // Load from localStorage on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.accessibility) setLocalAccessibility(prev => ({ ...prev, ...parsed.accessibility }))
          if (parsed.mobile) setLocalMobile(prev => ({ ...prev, ...parsed.mobile }))
        }
      } catch {
        // Ignore parse errors
      }
      setIsLoaded(true)
    }
  }, [])

  if (context) {
    // Use context when available
    return {
      preferences: context.preferences,
      updatePreferences: context.updatePreferences,
      resetPreferences: context.resetPreferences,
      isStandalone: false,
      isLoaded: true,
    }
  }

  // Standalone mode - use local state with type-safe updates
  return {
    preferences: {
      accessibility: localAccessibility,
      mobile: localMobile,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updatePreferences: (updates: any) => {
      if (updates.accessibility) {
        setLocalAccessibility(prev => ({ ...prev, ...updates.accessibility }))
      }
      if (updates.mobile) {
        setLocalMobile(prev => ({ ...prev, ...updates.mobile }))
      }
    },
    resetPreferences: () => {
      setLocalAccessibility(defaultAccessibility)
      setLocalMobile(defaultMobile)
    },
    isStandalone: true,
    isLoaded,
  }
}

// ============================================================================
// Option Row - Improved spacing
// ============================================================================

interface OptionRowProps {
  label: string
  description?: string
  children: React.ReactNode
  icon?: React.ReactNode
}

function OptionRow({ label, description, children, icon }: OptionRowProps) {
  return (
    <div className="flex items-center justify-between gap-6 py-3 px-1">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {icon && (
          <div className="mt-0.5 shrink-0 text-muted-foreground">
            {icon}
          </div>
        )}
        <div className="space-y-1 min-w-0">
          <Label className="text-sm font-medium leading-none">{label}</Label>
          {description && (
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      <div className="shrink-0">
        {children}
      </div>
    </div>
  )
}

// ============================================================================
// Section Header - Improved visual hierarchy
// ============================================================================

interface SectionHeaderProps {
  icon: React.ReactNode
  title: string
  description?: string
}

function SectionHeader({ icon, title, description }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <h4 className="text-sm font-semibold">{title}</h4>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  )
}

// ===========================================================================
// Accessibility Trigger
// ===========================================================================

interface AccessibilityTriggerProps {
  className?: string
  /** Button size */
  size?: 'sm' | 'default' | 'lg' | 'icon'
  /** Button variant */
  variant?: 'ghost' | 'outline' | 'secondary' | 'default'
}

function AccessibilityTrigger({
  className,
  size = 'icon',
  variant = 'ghost',
}: AccessibilityTriggerProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn('h-9 w-9', className)}
          aria-label="Accessibility settings"
        >
          <Accessibility className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetTitle className="sr-only">Accessibility Settings</SheetTitle>
        <AccessibilityPanelContent />
      </SheetContent>
    </Sheet>
  )
}

// ============================================================================
// Accessibility Panel Component
// ============================================================================

interface AccessibilityPanelContentProps {
  className?: string
  /** Show mobile settings */
  showMobile?: boolean
  /** Show keyboard shortcuts section */
  showKeyboard?: boolean
  /** Callback when settings change */
  onChange?: (settings: typeof defaultAccessibility) => void
  /** Callback when settings are saved */
  onSave?: () => void
}

/** Inner panel content - used by AccessibilityTrigger */
function AccessibilityPanelContent({
  className,
  showMobile = true,
  showKeyboard = true,
  onChange,
  onSave,
}: AccessibilityPanelContentProps) {
  const { preferences, updatePreferences, resetPreferences, isStandalone, isLoaded } = useSafePreferences()
  const { accessibility, mobile } = preferences
  const [isSaving, setIsSaving] = React.useState(false)
  const [hasChanges, setHasChanges] = React.useState(false)

  // Track initial values for change detection
  const initialRef = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (isLoaded && initialRef.current === null) {
      initialRef.current = JSON.stringify({ accessibility, mobile })
    }
  }, [isLoaded, accessibility, mobile])

  // Detect changes
  React.useEffect(() => {
    if (initialRef.current) {
      const current = JSON.stringify({ accessibility, mobile })
      setHasChanges(current !== initialRef.current)
    }
  }, [accessibility, mobile])

  // Update accessibility setting
  const updateAccessibility = useCallback((updates: Partial<typeof accessibility>) => {
    const newAccessibility = { ...accessibility, ...updates }
    updatePreferences({ accessibility: newAccessibility })
    onChange?.(newAccessibility)
  }, [accessibility, updatePreferences, onChange])

  // Update mobile setting
  const updateMobile = useCallback((updates: Partial<typeof mobile>) => {
    updatePreferences({ mobile: { ...mobile, ...updates } })
  }, [mobile, updatePreferences])

  // Save preferences
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    try {
      // Persist to localStorage for standalone mode
      if (isStandalone) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ accessibility, mobile }))
      }
      // Update initial ref to reset change detection
      initialRef.current = JSON.stringify({ accessibility, mobile })
      setHasChanges(false)
      toast.success('Accessibility preferences saved')
      onSave?.()
    } catch {
      toast.error('Failed to save preferences')
    } finally {
      setIsSaving(false)
    }
  }, [accessibility, mobile, isStandalone, onSave])

  // Reset preferences
  const handleReset = useCallback(() => {
    resetPreferences()
    initialRef.current = JSON.stringify(defaultAccessibility)
    setHasChanges(true)
    toast.info('Preferences reset to defaults')
  }, [resetPreferences])

  // Check if user has system preferences
  const systemPrefs = useMemo(() => {
    if (typeof window === 'undefined') {
      return { prefersReducedMotion: false, prefersHighContrast: false }
    }
    return {
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      prefersHighContrast: window.matchMedia('(prefers-contrast: more)').matches,
    }
  }, [])

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <SheetHeader className="shrink-0 border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Accessibility className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight">Accessibility Settings</h2>
            <p className="text-sm text-muted-foreground">
              Make the interface work better for you
            </p>
          </div>
        </div>
      </SheetHeader>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="space-y-6 px-6 py-5">
          {/* System Detection Alert */}
          {(systemPrefs.prefersReducedMotion || systemPrefs.prefersHighContrast) && (
            <Alert className="border-blue-500/20 bg-blue-500/5">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <AlertTitle className="text-sm">System preferences detected</AlertTitle>
              <AlertDescription className="text-xs">
                {systemPrefs.prefersReducedMotion && 'Reduced motion is enabled. '}
                {systemPrefs.prefersHighContrast && 'High contrast mode is enabled.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Motion & Animation */}
          <section className="space-y-1">
            <SectionHeader
              icon={<Move className="h-4 w-4" />}
              title="Motion & Animation"
              description="Control movement and transitions"
            />
            <OptionRow
              label="Reduce Motion"
              description="Minimize animations and transitions"
              icon={<Vibrate className="h-4 w-4" />}
            >
              <Switch
                checked={accessibility.reducedMotion}
                onCheckedChange={(reducedMotion) => updateAccessibility({ reducedMotion })}
                aria-label="Toggle reduced motion"
              />
            </OptionRow>
          </section>

          <Separator />

          {/* Visual */}
          <section className="space-y-1">
            <SectionHeader
              icon={<Eye className="h-4 w-4" />}
              title="Visual"
              description="Visibility and contrast options"
            />

            <OptionRow
              label="High Contrast"
              description="Increase color contrast for better visibility"
              icon={<Sun className="h-4 w-4" />}
            >
              <Switch
                checked={accessibility.highContrast}
                onCheckedChange={(highContrast) => updateAccessibility({ highContrast })}
                aria-label="Toggle high contrast"
              />
            </OptionRow>

            <OptionRow
              label="Enhanced Focus Indicators"
              description="Show clearer focus outlines for keyboard navigation"
              icon={<Focus className="h-4 w-4" />}
            >
              <Switch
                checked={accessibility.focusIndicators}
                onCheckedChange={(focusIndicators) => updateAccessibility({ focusIndicators })}
                aria-label="Toggle enhanced focus indicators"
              />
            </OptionRow>

            <OptionRow
              label="Minimum Touch Target"
              description="Minimum size for interactive elements (pixels)"
              icon={<Hand className="h-4 w-4" />}
            >
              <Select
                value={String(accessibility.minTouchTarget)}
                onValueChange={(v) => updateAccessibility({ minTouchTarget: parseInt(v) })}
              >
                <SelectTrigger className="w-[90px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="32">32px</SelectItem>
                  <SelectItem value="44">44px</SelectItem>
                  <SelectItem value="48">48px</SelectItem>
                  <SelectItem value="56">56px</SelectItem>
                </SelectContent>
              </Select>
            </OptionRow>
          </section>

          <Separator />

          {/* Audio & Announcements */}
          <section className="space-y-1">
            <SectionHeader
              icon={<Speaker className="h-4 w-4" />}
              title="Screen Reader Support"
              description="Announcements for assistive technology"
            />

            <OptionRow
              label="Announce Navigation"
              description="Announce page and section changes to screen readers"
              icon={<Speaker className="h-4 w-4" />}
            >
              <Switch
                checked={accessibility.announceNavigation}
                onCheckedChange={(announceNavigation) => updateAccessibility({ announceNavigation })}
                aria-label="Toggle navigation announcements"
              />
            </OptionRow>
          </section>

          {/* Keyboard */}
          {showKeyboard && (
            <>
              <Separator />

              <section className="space-y-1">
                <SectionHeader
                  icon={<Keyboard className="h-4 w-4" />}
                  title="Keyboard Navigation"
                  description="Shortcuts and keyboard controls"
                />

                <OptionRow
                  label="Enable Keyboard Shortcuts"
                  description="Use keyboard shortcuts for quick navigation"
                  icon={<Keyboard className="h-4 w-4" />}
                >
                  <Switch
                    checked={accessibility.keyboardShortcuts}
                    onCheckedChange={(keyboardShortcuts) => updateAccessibility({ keyboardShortcuts })}
                    aria-label="Toggle keyboard shortcuts"
                  />
                </OptionRow>

                {accessibility.keyboardShortcuts && (
                  <div className="mt-3 rounded-lg border bg-muted/30 p-4">
                    <p className="mb-3 text-sm font-medium">Available Shortcuts</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Toggle sidebar</span>
                        <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">⌘ B</kbd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Search</span>
                        <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">⌘ K</kbd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Navigate up</span>
                        <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">↑</kbd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Navigate down</span>
                        <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">↓</kbd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Expand section</span>
                        <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">→</kbd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Collapse section</span>
                        <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">←</kbd>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}

          {/* Mobile */}
          {showMobile && (
            <>
              <Separator />

              <section className="space-y-1">
                <SectionHeader
                  icon={<Smartphone className="h-4 w-4" />}
                  title="Mobile Accessibility"
                  description="Settings for touch devices"
                />

                <OptionRow
                  label="Mobile Sidebar Style"
                  description="How sidebar appears on mobile"
                  icon={<Smartphone className="h-4 w-4" />}
                >
                  <Select
                    value={mobile.behavior}
                    onValueChange={(v) => updateMobile({ behavior: v as MobileBehavior })}
                  >
                    <SelectTrigger className="w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="drawer">Drawer</SelectItem>
                      <SelectItem value="overlay">Overlay</SelectItem>
                      <SelectItem value="bottom-sheet">Bottom Sheet</SelectItem>
                      <SelectItem value="hidden">Hidden</SelectItem>
                    </SelectContent>
                  </Select>
                </OptionRow>

                <OptionRow
                  label="Swipe to Open"
                  description="Enable swipe gesture to open sidebar"
                  icon={<Hand className="h-4 w-4" />}
                >
                  <Switch
                    checked={mobile.swipeToOpen}
                    onCheckedChange={(swipeToOpen) => updateMobile({ swipeToOpen })}
                    aria-label="Toggle swipe to open"
                  />
                </OptionRow>

                <OptionRow
                  label="Auto-Close on Navigate"
                  description="Close sidebar after selecting an item"
                  icon={<MousePointer2 className="h-4 w-4" />}
                >
                  <Switch
                    checked={mobile.autoCloseOnNavigate}
                    onCheckedChange={(autoCloseOnNavigate) => updateMobile({ autoCloseOnNavigate })}
                    aria-label="Toggle auto-close on navigate"
                  />
                </OptionRow>
              </section>
            </>
          )}

          {/* WCAG Compliance Info */}
          <div className="mt-2 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              <div>
                <p className="text-sm font-medium">WCAG 2.1 AA Compliance</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  This sidebar meets WCAG 2.1 Level AA accessibility guidelines including
                  keyboard navigation, focus management, and screen reader support.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer with Save/Reset */}
      <SheetFooter className="shrink-0 border-t px-6 py-4">
        <div className="flex w-full items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-xs text-muted-foreground">Unsaved changes</span>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </div>
      </SheetFooter>
    </div>
  )
}

/** Standalone panel component for direct rendering */
export function AccessibilityPanel(props: AccessibilityPanelContentProps) {
  return <AccessibilityPanelContent {...props} />
}

export default AccessibilityPanel

export { AccessibilityTrigger }