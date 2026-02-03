'use client'

import React from 'react'
import { Accessibility } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { AccessibilityPanel } from './accessibility-panel'
import { cn } from '@/lib/utils'

interface AccessibilityTriggerProps {
  className?: string
  /** Button size */
  size?: 'sm' | 'default' | 'lg' | 'icon'
  /** Button variant */
  variant?: 'ghost' | 'outline' | 'secondary' | 'default'
}

/**
 * A trigger button that opens the AccessibilityPanel in a slide-out sheet.
 * Safe to use anywhere - works with or without SidebarProvider.
 */
export function AccessibilityTrigger({
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
        <SheetTitle className="sr-only">Accessibility Settings</SheetTitle>
        <AccessibilityPanel
          className="border-0 rounded-none shadow-none"
          showMobile={true}
          showKeyboard={true}
        />
      </SheetContent>
    </Sheet>
  )
}

export default AccessibilityTrigger
