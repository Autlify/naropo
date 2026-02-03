'use client'

import React, { useContext } from 'react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import type { MobileBehavior } from '@/components/sidebar-01/types'
import {
  Accessibility,
  Eye,
  EyeOff,
  Focus,
  Keyboard,
  Monitor,
  Moon,
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
} from 'lucide-react'
import { Sheet, SheetTrigger, SheetContent, SheetTitle } from '../ui/sheet'

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

// Safe hook that works outside of SidebarProvider
function useSafePreferences() {
  const context = useContext(SidebarContext)

  // Local state for standalone mode
  const [localAccessibility, setLocalAccessibility] = React.useState(defaultAccessibility)
  const [localMobile, setLocalMobile] = React.useState(defaultMobile)

  if (context) {
    // Use context when available
    return {
      preferences: context.preferences,
      updatePreferences: context.updatePreferences,
      isStandalone: false,
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
    isStandalone: true,
  }
}

// ============================================================================
// Option Row
// ============================================================================

interface OptionRowProps {
  label: string
  description?: string
  children: React.ReactNode
  icon?: React.ReactNode
}

function OptionRow({ label, description, children, icon }: OptionRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 text-muted-foreground">
            {icon}
          </div>
        )}
        <div className="space-y-0.5">
          <Label>{label}</Label>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

// ============================================================================
// Section Header
// ============================================================================

interface SectionHeaderProps {
  icon: React.ReactNode
  title: string
  description?: string
}

function SectionHeader({ icon, title, description }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 pb-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-medium">{title}</h4>
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
        className="w-full sm:max-w-lg overflow-y-auto p-0"
      >
        <SheetTitle className="sr-only">Accessibility Panel</SheetTitle>
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
}

/** Inner panel content - used by AccessibilityTrigger */
function AccessibilityPanelContent({
  className,
  showMobile = true,
  showKeyboard = true,
  onChange,
}: AccessibilityPanelContentProps) {
  const { preferences, updatePreferences } = useSafePreferences()
  const { accessibility, mobile } = preferences

  // Update accessibility setting
  const updateAccessibility = (updates: Partial<typeof accessibility>) => {
    const newAccessibility = { ...accessibility, ...updates }
    updatePreferences({ accessibility: newAccessibility })
    onChange?.(newAccessibility)
  }

  // Update mobile setting
  const updateMobile = (updates: Partial<typeof mobile>) => {
    updatePreferences({ mobile: { ...mobile, ...updates } })
  }

  // Check if user has system preferences
  const [systemPrefs, setSystemPrefs] = React.useState({
    prefersReducedMotion: false,
    prefersHighContrast: false,
    prefersDarkMode: false,
  })

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setSystemPrefs({
        prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        prefersHighContrast: window.matchMedia('(prefers-contrast: more)').matches,
        prefersDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      })
    }
  }, [])

  return (
    <Card className={cn('w-full max-w-2xl', className)}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Accessibility className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Accessibility Settings</CardTitle>
            <CardDescription>
              Make the interface work better for you
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* System Detection Alert */}
        {(systemPrefs.prefersReducedMotion || systemPrefs.prefersHighContrast) && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>System preferences detected</AlertTitle>
            <AlertDescription className="text-xs">
              {systemPrefs.prefersReducedMotion && 'Reduced motion is enabled. '}
              {systemPrefs.prefersHighContrast && 'High contrast mode is enabled.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Motion & Animation */}
        <div className="space-y-3">
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
        </div>

        <Separator />

        {/* Visual */}
        <div className="space-y-3">
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
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="32">32px</SelectItem>
                <SelectItem value="44">44px (WCAG)</SelectItem>
                <SelectItem value="48">48px</SelectItem>
                <SelectItem value="56">56px</SelectItem>
              </SelectContent>
            </Select>
          </OptionRow>
        </div>

        <Separator />

        {/* Audio & Announcements */}
        <div className="space-y-3">
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
        </div>

        {/* Keyboard */}
        {showKeyboard && (
          <>
            <Separator />

            <div className="space-y-3">
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
                <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                  <p className="font-medium mb-2">Available Shortcuts</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Toggle sidebar</span>
                      <kbd className="px-1.5 py-0.5 bg-background rounded border text-[10px]">⌘ B</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Search</span>
                      <kbd className="px-1.5 py-0.5 bg-background rounded border text-[10px]">⌘ K</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Navigate up</span>
                      <kbd className="px-1.5 py-0.5 bg-background rounded border text-[10px]">↑</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Navigate down</span>
                      <kbd className="px-1.5 py-0.5 bg-background rounded border text-[10px]">↓</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Expand section</span>
                      <kbd className="px-1.5 py-0.5 bg-background rounded border text-[10px]">→</kbd>
                    </div>
                    <div className="flex justify-between">
                      <span>Collapse section</span>
                      <kbd className="px-1.5 py-0.5 bg-background rounded border text-[10px]">←</kbd>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Mobile */}
        {showMobile && (
          <>
            <Separator />

            <div className="space-y-3">
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
                  <SelectTrigger className="w-32">
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
            </div>
          </>
        )}

        {/* WCAG Compliance Info */}
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium text-sm">WCAG 2.1 AA Compliance</p>
              <p className="text-xs text-muted-foreground mt-1">
                This sidebar meets WCAG 2.1 Level AA accessibility guidelines including
                keyboard navigation, focus management, and screen reader support.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/** Standalone panel component for direct rendering */
export function AccessibilityPanel(props: AccessibilityPanelContentProps) {
  return <AccessibilityPanelContent {...props} />
}

export default AccessibilityPanel

export { AccessibilityTrigger }