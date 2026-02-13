'use client'

import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Loader2, Info } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { getFeatureFlagsByCategory } from '@/lib/features/org/preference/toggle'
import type { FeatureFlagState } from '@/lib/features/org/preference/toggle'

export function FeatureToggles() {
  const [flags, setFlags] = useState<Record<string, FeatureFlagState[]>>({})
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadFlags()
  }, [])

  async function loadFlags() {
    try {
      const data = await getFeatureFlagsByCategory()
      setFlags(data)
    } catch (error) {
      console.error('Error loading flags:', error)
      toast({
        title: 'Error',
        description: 'Failed to load feature flags',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle(featureKey: string, enabled: boolean) {
    setToggling(featureKey)
    
    try {
      const response = await fetch('/api/features/experimental', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureKey, enabled }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to toggle feature')
      }
      
      // Reload flags to reflect changes
      await loadFlags()
      
      toast({
        title: 'Success',
        description: `Feature ${enabled ? 'enabled' : 'disabled'} successfully`,
      })
    } catch (error) {
      console.error('Error toggling feature:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to toggle feature',
        variant: 'destructive',
      })
    } finally {
      setToggling(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const categories = Object.keys(flags).sort()

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">No toggleable features available in your current plan.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-lg capitalize">{category}</CardTitle>
            <CardDescription>
              Manage {category} features for your workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {flags[category].map((flag, index) => (
              <div key={flag.featureKey}>
                {index > 0 && <Separator className="my-4" />}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={flag.featureKey}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {flag.displayName || flag.name}
                      </Label>
                      {!flag.isAvailableInPlan && (
                        <Badge variant="outline" className="text-xs">
                          Not in plan
                        </Badge>
                      )}
                      {!flag.isEnabledByAdmin && flag.isAvailableInPlan && (
                        <Badge variant="outline" className="text-xs">
                          Disabled by admin
                        </Badge>
                      )}
                    </div>
                    
                    {flag.description && (
                      <p className="text-sm text-muted-foreground">
                        {flag.description}
                      </p>
                    )}
                    
                    {flag.helpText && (
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>{flag.helpText}</span>
                      </div>
                    )}
                    
                    {flag.hasLimits && (
                      <p className="text-xs text-muted-foreground">
                        Limit: {flag.isUnlimited ? 'Unlimited' : flag.maxLimit?.toLocaleString()}
                        {flag.currentUsage !== undefined && ` (${flag.currentUsage.toLocaleString()} used)`}
                      </p>
                    )}
                  </div>
                  
                  <Switch
                    id={flag.featureKey}
                    checked={flag.effectiveEnabled}
                    disabled={
                      !flag.isToggleable ||
                      !flag.isAvailableInPlan ||
                      !flag.isEnabledByAdmin ||
                      toggling === flag.featureKey
                    }
                    onCheckedChange={(checked) => handleToggle(flag.featureKey, checked)}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
