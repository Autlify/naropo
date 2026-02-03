'use client'

import { ReactNode } from 'react'
import { SidebarProvider, useSidebar } from './sidebar-context'
import { cn } from '@/lib/utils'

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
        isCollapsed ? 'md:pl-[80px]' : 'md:pl-[300px]'
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
