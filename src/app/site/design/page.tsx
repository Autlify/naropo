import React from 'react'
import { Metadata } from 'next'
import { DesignShowcase } from './_components/design-showcase'

export const metadata: Metadata = {
  title: 'Design System Showcase | Autlify',
  description: 'Visual showcase of all UI components and design system tokens for accessibility and theming diagnostics',
}

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-12 px-4 space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-fg-primary">Design System Showcase</h1>
          <p className="text-lg text-fg-secondary max-w-3xl">
            This page displays all UI components using only semantic design tokens from <code className="px-2 py-1 bg-muted rounded text-sm font-mono">globals.css</code>.
            No hardcoded colors are used to ensure proper theming and accessibility.
          </p>
          <div className="flex items-center gap-2 text-sm text-fg-tertiary">
            <span className="inline-block w-3 h-3 rounded-full bg-success-500" />
            <span>All components use semantic tokens: <code className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs">bg-background</code>, <code className="px-1.5 py-0.5 bg-muted rounded font-mono text-xs">text-fg-primary</code>, etc.</span>
          </div>
        </div>

        {/* Main Showcase */}
        <DesignShowcase />
      </div>
    </div>
  )
}
