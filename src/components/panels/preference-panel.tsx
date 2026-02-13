'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useSidebarPreferences } from '@/components/sidebar/context'
import {
  type SidebarLayout,
  type PrimaryBehavior,
  type SecondaryBehavior,
  type SidebarWidth,
  type AnimationLevel,
  SIDEBAR_PRESETS,
} from '@/types/sidebar'
import {
  LayoutTemplate,
  PanelLeft,
  PanelLeftClose,
  SidebarClose,
  SidebarOpen,
  MousePointer2,
  Timer,
  Zap,
  RotateCcw,
  Check,
  Sparkles,
  Lock,
} from 'lucide-react'

// ============================================================================
// Preset Card
// ============================================================================

interface PresetCardProps {
  preset: typeof SIDEBAR_PRESETS[0]
  isActive: boolean
  onSelect: () => void
}

function PresetCard({ preset, isActive, onSelect }: PresetCardProps) {
  return (
    <button
      onClick={onSelect}
      disabled={preset.isPremium}
      className={cn(
        'relative flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent',
        isActive && 'border-primary bg-primary/5',
        preset.isPremium && 'opacity-60 cursor-not-allowed',
      )}
    >
      <div className="flex items-center gap-2">
        <span className="font-medium">{preset.name}</span>
        {isActive && <Check className="h-4 w-4 text-primary" />}
        {preset.isPremium && (
          <Badge variant="secondary" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{preset.description}</p>
    </button>
  )
}

// ============================================================================
// Option Row
// ============================================================================

interface OptionRowProps {
  label: string
  description?: string
  children: React.ReactNode
  disabled?: boolean
  premium?: boolean
}

function OptionRow({ label, description, children, disabled, premium }: OptionRowProps) {
  return (
    <div className={cn(
      'flex items-center justify-between gap-4 py-3',
      disabled && 'opacity-50 pointer-events-none',
    )}>
      <div className="space-y-0.5">
        <Label className="flex items-center gap-2">
          {label}
          {premium && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              <Lock className="h-2.5 w-2.5 mr-0.5" />
              Pro
            </Badge>
          )}
        </Label>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </div>
  )
}

// ============================================================================
// Preference Panel Component
// ============================================================================

interface PreferencePanelProps {
  className?: string
  /** Show presets section */
  showPresets?: boolean
  /** Show reset button */
  showReset?: boolean
  /** Premium features enabled */
  isPremium?: boolean
}

export function PreferencePanel({
  className,
  showPresets = true,
  showReset = true,
  isPremium = false,
}: PreferencePanelProps) {
  const { preferences, updatePreferences, resetPreferences } = useSidebarPreferences()

  // Update nested preference
  const updatePrimary = (updates: Partial<typeof preferences.primary>) => {
    updatePreferences({ primary: { ...preferences.primary, ...updates } })
  }

  const updateSecondary = (updates: Partial<typeof preferences.secondary>) => {
    updatePreferences({ secondary: { ...preferences.secondary, ...updates } })
  }

  const updateFlyout = (updates: Partial<typeof preferences.flyout>) => {
    updatePreferences({ flyout: { ...preferences.flyout, ...updates } })
  }

  // Apply preset
  const applyPreset = (presetId: string) => {
    const preset = SIDEBAR_PRESETS.find(p => p.id === presetId)
    if (preset && (!preset.isPremium || isPremium)) {
      updatePreferences(preset.preferences)
    }
  }

  return (
    <Card className={cn('w-full max-w-2xl', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Sidebar Preferences</CardTitle>
            <CardDescription>
              Customize how the sidebar looks and behaves
            </CardDescription>
          </div>
          {showReset && (
            <Button variant="outline" size="sm" onClick={resetPreferences}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="presets" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* Presets Tab */}
          <TabsContent value="presets" className="space-y-4 pt-4">
            {showPresets && (
              <div className="grid grid-cols-2 gap-3">
                {SIDEBAR_PRESETS.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    isActive={preferences.id === preset.id}
                    onSelect={() => applyPreset(preset.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Layout Tab */}
          <TabsContent value="layout" className="space-y-4 pt-4">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Sidebar Layout</h4>
              <p className="text-xs text-muted-foreground">
                Choose between single or double sidebar layout
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => updatePreferences({ layout: 'single' })}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-lg border p-4 transition-all hover:bg-accent',
                  preferences.layout === 'single' && 'border-primary bg-primary/5',
                )}
              >
                <PanelLeft className="h-8 w-8" />
                <span className="text-sm font-medium">Single</span>
                <span className="text-xs text-muted-foreground text-center">
                  Combined icon rail with dropdown
                </span>
              </button>

              <button
                onClick={() => updatePreferences({ layout: 'double' })}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-lg border p-4 transition-all hover:bg-accent',
                  preferences.layout === 'double' && 'border-primary bg-primary/5',
                )}
              >
                <div className="flex gap-1">
                  <PanelLeft className="h-6 w-6" />
                  <PanelLeft className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">Double</span>
                <span className="text-xs text-muted-foreground text-center">
                  Separate icon rail + nav panel
                </span>
              </button>
            </div>

            <Separator />

            {/* Width Settings */}
            <OptionRow label="Primary Sidebar Width" description="Width of the icon rail">
              <Select
                value={preferences.primary.width}
                onValueChange={(v) => updatePrimary({ width: v as SidebarWidth })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="wide">Wide</SelectItem>
                </SelectContent>
              </Select>
            </OptionRow>

            {preferences.layout === 'double' && (
              <OptionRow label="Secondary Sidebar Width" description="Width of the navigation panel">
                <Select
                  value={preferences.secondary.width}
                  onValueChange={(v) => updateSecondary({ width: v as SidebarWidth })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="wide">Wide</SelectItem>
                  </SelectContent>
                </Select>
              </OptionRow>
            )}

            <OptionRow label="Icon Size" description="Size of module icons">
              <Select
                value={preferences.primary.iconSize}
                onValueChange={(v) => updatePrimary({ iconSize: v as 'sm' | 'md' | 'lg' })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="md">Medium</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                </SelectContent>
              </Select>
            </OptionRow>

            <OptionRow label="Item Density" description="Spacing between navigation items">
              <Select
                value={preferences.secondary.density}
                onValueChange={(v) => updateSecondary({ density: v as 'compact' | 'normal' | 'comfortable' })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                </SelectContent>
              </Select>
            </OptionRow>
          </TabsContent>

          {/* Behavior Tab */}
          <TabsContent value="behavior" className="space-y-4 pt-4">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Primary Sidebar Behavior</h4>
              <p className="text-xs text-muted-foreground">
                How the icon rail responds to interactions
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'fixed', label: 'Fixed', desc: 'Always visible, not collapsible', icon: SidebarOpen },
                { value: 'collapsible', label: 'Collapsible', desc: 'Can collapse with flyout on hover', icon: SidebarClose },
                { value: 'manual', label: 'Manual', desc: 'Collapse without flyout', icon: PanelLeftClose },
                { value: 'auto', label: 'Auto-Hide', desc: 'Hide automatically, hover to reveal', icon: MousePointer2 },
              ].map(({ value, label, desc, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => updatePrimary({ behavior: value as PrimaryBehavior })}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-3 text-left transition-all hover:bg-accent',
                    preferences.primary.behavior === value && 'border-primary bg-primary/5',
                  )}
                >
                  <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-sm font-medium">{label}</span>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {preferences.layout === 'double' && (
              <>
                <Separator />

                <div className="space-y-1">
                  <h4 className="text-sm font-medium">Secondary Sidebar Behavior</h4>
                  <p className="text-xs text-muted-foreground">
                    How the navigation panel responds
                  </p>
                </div>

                <OptionRow label="Behavior Mode">
                  <Select
                    value={preferences.secondary.behavior}
                    onValueChange={(v) => updateSecondary({ behavior: v as SecondaryBehavior })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed (Always visible)</SelectItem>
                      <SelectItem value="follow">Follow Primary</SelectItem>
                      <SelectItem value="optimized">Optimized (Keep panel)</SelectItem>
                      <SelectItem value="collapsible">Collapsible</SelectItem>
                      <SelectItem value="independent">Independent</SelectItem>
                      <SelectItem value="overlay">Overlay</SelectItem>
                      <SelectItem value="hidden">Hidden by default</SelectItem>
                    </SelectContent>
                  </Select>
                </OptionRow>
              </>
            )}

            <Separator />

            {/* Flyout Settings */}
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Flyout Menu</h4>
              <p className="text-xs text-muted-foreground">
                Submenu that appears when hovering collapsed sidebar
              </p>
            </div>

            <OptionRow label="Enable Flyout" description="Show submenu on hover when collapsed">
              <Switch
                checked={preferences.flyout.enabled}
                onCheckedChange={(enabled) => updateFlyout({ enabled })}
              />
            </OptionRow>

            {preferences.flyout.enabled && (
              <>
                <OptionRow label="Hover Delay" description="Milliseconds before flyout appears">
                  <Select
                    value={String(preferences.flyout.hoverDelay)}
                    onValueChange={(v) => updateFlyout({ hoverDelay: parseInt(v) })}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Instant</SelectItem>
                      <SelectItem value="100">100ms</SelectItem>
                      <SelectItem value="150">150ms</SelectItem>
                      <SelectItem value="200">200ms</SelectItem>
                      <SelectItem value="300">300ms</SelectItem>
                    </SelectContent>
                  </Select>
                </OptionRow>

                <OptionRow label="Show Nested Items" description="Display child items in flyout">
                  <Switch
                    checked={preferences.flyout.showNestedItems}
                    onCheckedChange={(showNestedItems) => updateFlyout({ showNestedItems })}
                  />
                </OptionRow>
              </>
            )}
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-4 pt-4">
            {/* Display Options */}
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Display Options</h4>
            </div>

            <OptionRow label="Show Tooltips" description="Display tooltips on hover">
              <Switch
                checked={preferences.primary.showTooltips}
                onCheckedChange={(showTooltips) => updatePrimary({ showTooltips })}
              />
            </OptionRow>

            <OptionRow label="Show Module Labels" description="Display labels under icons">
              <Switch
                checked={preferences.primary.showLabels}
                onCheckedChange={(showLabels) => updatePrimary({ showLabels })}
              />
            </OptionRow>

            <OptionRow label="Show Item Icons" description="Display icons next to nav items">
              <Switch
                checked={preferences.secondary.showItemIcons}
                onCheckedChange={(showItemIcons) => updateSecondary({ showItemIcons })}
              />
            </OptionRow>

            <OptionRow label="Show Descriptions" description="Display item descriptions">
              <Switch
                checked={preferences.secondary.showDescriptions}
                onCheckedChange={(showDescriptions) => updateSecondary({ showDescriptions })}
              />
            </OptionRow>

            <OptionRow label="Collapsible Sections" description="Allow section collapse">
              <Switch
                checked={preferences.secondary.collapsibleSections}
                onCheckedChange={(collapsibleSections) => updateSecondary({ collapsibleSections })}
              />
            </OptionRow>

            <Separator />

            {/* Active Indicator */}
            <OptionRow label="Active Indicator" description="How to highlight active module">
              <Select
                value={preferences.primary.activeIndicator}
                onValueChange={(v) => updatePrimary({ activeIndicator: v as 'bar' | 'background' | 'dot' | 'none' })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="background">Background</SelectItem>
                  <SelectItem value="dot">Dot</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </OptionRow>

            {/* Animation */}
            <OptionRow label="Animation" description="Transition effects intensity">
              <Select
                value={preferences.animation}
                onValueChange={(v) => updatePreferences({ animation: v as AnimationLevel })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="subtle">Subtle</SelectItem>
                  <SelectItem value="smooth">Smooth</SelectItem>
                  <SelectItem value="playful">Playful</SelectItem>
                </SelectContent>
              </Select>
            </OptionRow>

            <Separator />

            {/* Persistence */}
            <OptionRow label="Auto-Save Preferences" description="Remember your settings">
              <Switch
                checked={preferences.autoSave}
                onCheckedChange={(autoSave) => updatePreferences({ autoSave })}
              />
            </OptionRow>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default PreferencePanel
