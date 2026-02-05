'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Download, Trash2, AlertCircle } from 'lucide-react'
import { SegmentedTabs} from '@/components/ui/segmented-tabs' 
 
export function ButtonsSection() {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-fg-primary">Buttons</h2>
        <p className="text-fg-secondary">
          Button variations using semantic color tokens from the design system.
        </p>
      </div>

      <div className="space-y-8 p-6 rounded-lg border border-border bg-card">
        {/* Button Variants */}
        <div className="space-y-4">
          <p className="text-xs text-fg-tertiary uppercase tracking-wide font-semibold">Variants</p>
          <div className="flex flex-wrap gap-3">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </div>

        {/* Button Sizes */}
        <div className="space-y-4">
          <p className="text-xs text-fg-tertiary uppercase tracking-wide font-semibold">Sizes</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon"><Plus className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Buttons with Icons */}
        <div className="space-y-4">
          <p className="text-xs text-fg-tertiary uppercase tracking-wide font-semibold">With Icons</p>
          <div className="flex flex-wrap gap-3">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New
            </Button>
            <Button variant="secondary">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button variant="outline">
              <AlertCircle className="mr-2 h-4 w-4" />
              Warning
            </Button>
          </div>
        </div>

        {/* Button States */}
        <div className="space-y-4">
          <p className="text-xs text-fg-tertiary uppercase tracking-wide font-semibold">States</p>
          <div className="flex flex-wrap gap-3">
            <Button>Normal</Button>
            <Button disabled>Disabled</Button>
            <Button className="opacity-70">Loading...</Button>
          </div>
        </div>

        {/* Segmented Tabs as Button Group */}
        <div className="space-y-4">
          <p className="text-xs text-fg-tertiary uppercase tracking-wide font-semibold">Segmented Tabs</p>
          <SegmentedTabs
            tabs={[
              { label: 'Option 1', id: 'option1' },
              { label: 'Option 2', id: 'option2' },
              { label: 'Option 3', id: 'option3' },
            ]}
            defaultTab="option1"
          />
        </div>
      </div>
    </section>
  )
}
