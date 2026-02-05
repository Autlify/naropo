'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  allTemplates,
  starterKits,
  templateCategories,
  getTemplatesByCategory,
  FunnelTemplate,
  StarterKit,
  TemplateCategory,
} from '../../app/(main)/subaccount/[subaccountId]/funnels/[funnelId]/_components/funnel-templates'
import { FileText, LayoutTemplate, Layers, Check, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TemplatePickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectBlank: () => void
  onSelectTemplate: (templateId: string) => void
  onSelectStarterKit: (kit: StarterKit) => void
}

export const TemplatePickerModal = ({
  isOpen,
  onClose,
  onSelectBlank,
  onSelectTemplate,
  onSelectStarterKit,
}: TemplatePickerModalProps) => {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [selectedKit, setSelectedKit] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'blank' | 'templates' | 'kits'>('blank')

  const filteredTemplates =
    selectedCategory === 'all'
      ? allTemplates
      : getTemplatesByCategory(selectedCategory)

  const handleConfirm = () => {
    if (activeTab === 'blank') {
      onSelectBlank()
    } else if (activeTab === 'templates' && selectedTemplate) {
      onSelectTemplate(selectedTemplate)
    } else if (activeTab === 'kits' && selectedKit) {
      const kit = starterKits.find((k) => k.id === selectedKit)
      if (kit) onSelectStarterKit(kit)
    }
    onClose()
  }

  const canConfirm =
    activeTab === 'blank' ||
    (activeTab === 'templates' && selectedTemplate) ||
    (activeTab === 'kits' && selectedKit)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-xl">Create New Funnel Page</DialogTitle>
          <DialogDescription>
            Start from scratch or choose a template to get started quickly
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="mx-6 mt-4 h-11 grid grid-cols-3 w-fit">
            <TabsTrigger value="blank" className="gap-2 px-4">
              <FileText className="h-4 w-4" />
              Blank
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2 px-4">
              <LayoutTemplate className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="kits" className="gap-2 px-4">
              <Package className="h-4 w-4" />
              Starter Kits
            </TabsTrigger>
          </TabsList>

          <TabsContent value="blank" className="flex-1 px-6 py-4">
            <Card
              className={cn(
                'cursor-pointer transition-all hover:border-primary/50',
                activeTab === 'blank' && 'border-primary ring-1 ring-primary'
              )}
              onClick={() => setActiveTab('blank')}
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Blank Page</CardTitle>
                    <CardDescription>
                      Start with an empty canvas and build from scratch
                    </CardDescription>
                  </div>
                  <div className="ml-auto">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="flex-1 flex flex-col overflow-hidden px-6 py-4">
            {/* Category Filter */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <Button
                size="sm"
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('all')}
              >
                All
              </Button>
              {templateCategories.map((cat) => (
                <Button
                  key={cat.value}
                  size="sm"
                  variant={selectedCategory === cat.value ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(cat.value)}
                >
                  {cat.label}
                </Button>
              ))}
            </div>

            {/* Template Grid */}
            <ScrollArea className="flex-1">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pr-4">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isSelected={selectedTemplate === template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="kits" className="flex-1 flex flex-col overflow-hidden px-6 py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Starter kits create multiple pre-designed pages at once for a complete funnel
            </p>
            <ScrollArea className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                {starterKits.map((kit) => (
                  <StarterKitCard
                    key={kit.id}
                    kit={kit}
                    isSelected={selectedKit === kit.id}
                    onClick={() => setSelectedKit(kit.id)}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-muted/30">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm}>
            {activeTab === 'kits' ? 'Create Funnel Pages' : 'Create Page'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const TemplateCard = ({
  template,
  isSelected,
  onClick,
}: {
  template: FunnelTemplate
  isSelected: boolean
  onClick: () => void
}) => {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:border-primary/50 overflow-hidden mt-2 ml-2',
        isSelected && 'border-primary ring-1 ring-primary'
      )}
      onClick={onClick}
    >
      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
        <TemplatePreview template={template} />
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
      </div>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-sm">{template.name}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {template.description}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {template.category}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

// Mini preview component that shows template structure
function TemplatePreview({ template }: { template: FunnelTemplate }) {
  const { category, id } = template
  
  // Landing page previews
  if (category === 'landing') {
    if (id === 'landing-hero') {
      return (
        <div className="w-full h-full flex flex-col">
          {/* Hero section */}
          <div className="flex-[2] bg-slate-800 flex flex-col items-center justify-center p-3">
            <div className="w-16 h-2 bg-white/90 rounded mb-1.5" />
            <div className="w-12 h-1 bg-white/50 rounded mb-2" />
            <div className="flex gap-1">
              <div className="w-6 h-2 bg-blue-500 rounded" />
              <div className="w-6 h-2 bg-slate-600 rounded" />
            </div>
          </div>
          {/* Features section */}
          <div className="flex-1 bg-white flex items-center justify-center gap-2 p-2">
            <div className="w-6 h-6 bg-slate-100 rounded" />
            <div className="w-6 h-6 bg-slate-100 rounded" />
            <div className="w-6 h-6 bg-slate-100 rounded" />
          </div>
          {/* CTA section */}
          <div className="h-6 bg-blue-500 flex items-center justify-center">
            <div className="w-8 h-1.5 bg-white rounded" />
          </div>
        </div>
      )
    }
    // Minimal landing
    return (
      <div className="w-full h-full bg-white flex flex-col items-center justify-center p-4">
        <div className="w-20 h-2.5 bg-slate-800 rounded mb-2" />
        <div className="w-14 h-1 bg-slate-400 rounded mb-3" />
        <div className="w-10 h-2.5 bg-slate-800 rounded-full" />
      </div>
    )
  }
  
  // Checkout page previews
  if (category === 'checkout') {
    if (id === 'checkout-premium') {
      return (
        <div className="w-full h-full flex">
          {/* Product side */}
          <div className="flex-1 bg-slate-800 flex flex-col items-center justify-center p-2">
            <div className="w-10 h-1.5 bg-white rounded mb-1" />
            <div className="w-8 h-2 bg-blue-500 rounded mb-2" />
            <div className="space-y-1">
              <div className="w-12 h-0.5 bg-slate-600 rounded" />
              <div className="w-12 h-0.5 bg-slate-600 rounded" />
              <div className="w-12 h-0.5 bg-slate-600 rounded" />
            </div>
          </div>
          {/* Payment side */}
          <div className="flex-1 bg-white flex flex-col items-center justify-center p-2">
            <div className="w-10 h-1 bg-slate-800 rounded mb-2" />
            <div className="w-12 h-6 border border-slate-200 rounded mb-2" />
            <div className="w-10 h-2 bg-blue-500 rounded" />
          </div>
        </div>
      )
    }
    // Simple checkout
    return (
      <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center p-3">
        <div className="w-14 h-1.5 bg-slate-800 rounded mb-1" />
        <div className="w-10 h-1 bg-slate-400 rounded mb-2" />
        <div className="w-16 h-10 bg-white rounded-lg shadow-sm mb-2 flex items-center justify-center">
          <div className="w-10 h-5 border border-slate-200 rounded" />
        </div>
        <div className="flex gap-2 mt-1">
          <div className="w-4 h-1 bg-slate-400 rounded" />
          <div className="w-4 h-1 bg-slate-400 rounded" />
        </div>
      </div>
    )
  }
  
  // Thank you page previews
  if (category === 'thankyou') {
    if (id === 'thankyou-nextsteps') {
      return (
        <div className="w-full h-full bg-slate-100 flex flex-col p-3">
          <div className="text-center mb-2">
            <div className="w-6 h-1.5 bg-green-500 rounded mx-auto mb-1" />
            <div className="w-12 h-1.5 bg-slate-800 rounded mx-auto" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex gap-1 items-center bg-white rounded p-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <div className="w-10 h-1 bg-slate-300 rounded" />
            </div>
            <div className="flex gap-1 items-center bg-white rounded p-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <div className="w-10 h-1 bg-slate-300 rounded" />
            </div>
            <div className="flex gap-1 items-center bg-white rounded p-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <div className="w-10 h-1 bg-slate-300 rounded" />
            </div>
          </div>
        </div>
      )
    }
    // Basic thank you
    return (
      <div className="w-full h-full bg-white flex flex-col items-center justify-center p-4">
        <div className="w-6 h-6 rounded-full border-2 border-green-500 flex items-center justify-center mb-2">
          <Check className="w-3 h-3 text-green-500" />
        </div>
        <div className="w-10 h-2 bg-slate-800 rounded mb-1" />
        <div className="w-14 h-1 bg-slate-400 rounded mb-2" />
        <div className="w-8 h-2 bg-blue-500 rounded" />
      </div>
    )
  }
  
  // Pricing page preview
  if (category === 'pricing') {
    return (
      <div className="w-full h-full bg-white flex flex-col p-3">
        <div className="text-center mb-2">
          <div className="w-14 h-1.5 bg-slate-800 rounded mx-auto" />
        </div>
        <div className="flex-1 flex gap-1 items-stretch">
          <div className="flex-1 bg-slate-100 rounded p-1 flex flex-col items-center">
            <div className="w-4 h-1 bg-slate-400 rounded mb-1" />
            <div className="w-5 h-1.5 bg-slate-800 rounded mb-1" />
            <div className="flex-1" />
            <div className="w-6 h-1.5 bg-slate-300 rounded" />
          </div>
          <div className="flex-1 bg-slate-800 rounded p-1 flex flex-col items-center scale-105">
            <div className="w-4 h-0.5 bg-blue-500 rounded mb-0.5" />
            <div className="w-4 h-1 bg-slate-400 rounded mb-1" />
            <div className="w-5 h-1.5 bg-white rounded mb-1" />
            <div className="flex-1" />
            <div className="w-6 h-1.5 bg-blue-500 rounded" />
          </div>
          <div className="flex-1 bg-slate-100 rounded p-1 flex flex-col items-center">
            <div className="w-4 h-1 bg-slate-400 rounded mb-1" />
            <div className="w-5 h-1.5 bg-slate-800 rounded mb-1" />
            <div className="flex-1" />
            <div className="w-6 h-1.5 bg-slate-300 rounded" />
          </div>
        </div>
      </div>
    )
  }
  
  // Fallback
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <Layers className="h-8 w-8 text-muted-foreground/50" />
    </div>
  )
}

const StarterKitCard = ({
  kit,
  isSelected,
  onClick,
}: {
  kit: StarterKit
  isSelected: boolean
  onClick: () => void
}) => {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:border-primary/50 mt-2 ml-2',
        isSelected && 'border-primary ring-1 ring-primary'
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{kit.name}</CardTitle>
              {isSelected && <Check className="h-5 w-5 text-primary shrink-0" />}
            </div>
            <CardDescription className="text-sm">{kit.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          {kit.pages.map((page, idx) => (
            <Badge key={idx} variant="outline" className="text-xs">
              {page.name}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
