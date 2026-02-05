'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { cn } from '@/lib/utils'

// ============================================================================
// Storage Key
// ============================================================================

const STORAGE_KEY = 'sidebar-collapsed'

// ============================================================================
// Simple Sidebar Context
// ============================================================================

type SidebarContextType = {
  isCollapsed: boolean
  setCollapsed: (value: boolean) => void
  toggle: () => void
  title: string
  setTitle: (title: string) => void
}

const SimpleSidebarContext = createContext<SidebarContextType | undefined>(undefined)

// ============================================================================
// Provider
// ============================================================================

export function SidebarProvider({ children, defaultCollapsed = false }: { children: ReactNode; defaultCollapsed?: boolean }) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [title, setTitleState] = useState('')

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      setIsCollapsed(stored === 'true')
    }
  }, [])

  const setCollapsed = useCallback((value: boolean) => {
    setIsCollapsed(value)
    localStorage.setItem(STORAGE_KEY, String(value))
  }, [])

  const toggle = useCallback(() => {
    setIsCollapsed(prev => {
      const next = !prev
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }, [])

  const setTitle = useCallback((newTitle: string) => {
    setTitleState(newTitle)
  }, [])

  return (
    <SimpleSidebarContext.Provider value={{ isCollapsed, setCollapsed, toggle, title, setTitle }}>
      {children}
    </SimpleSidebarContext.Provider>
  )
}

// ============================================================================
// Hook
// ============================================================================

export function useSidebar() {
  const context = useContext(SimpleSidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

// ============================================================================
// Layout Wrapper Component
// ============================================================================

type LayoutWrapperProps = {
  children: ReactNode
  sidebar: ReactNode
  infobar: ReactNode
  allyPanel?: ReactNode
}

function LayoutContent({ children, sidebar, infobar, allyPanel }: LayoutWrapperProps) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="h-screen overflow-hidden">
      {sidebar}
      <div className={cn(
        'transition-all duration-300',
        isCollapsed ? 'md:pl-[96px]' : 'md:pl-[300px]'
      )}>
        {infobar}
        <div className="relative">
          {children}
        </div>
        {allyPanel}
      </div>
    </div>
  )
}

export function LayoutWrapper({ children, sidebar, infobar, allyPanel }: LayoutWrapperProps) {
  return (
    <SidebarProvider>
      <LayoutContent sidebar={sidebar} infobar={infobar} allyPanel={allyPanel}>
        {children}
      </LayoutContent>
    </SidebarProvider>
  )
}
