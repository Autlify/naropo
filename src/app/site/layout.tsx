'use client'

import Navigation from '@/components/site/navigation'
import { SiteHeader } from '@/components/site/navbar'
import { SiteFooter } from '@/components/site/footer'
import React from 'react'
import { usePathname } from 'next/navigation'

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  const hideNavigation = pathname?.includes('/checkout')

  return (
    <main className="h-full">
      {/* {!hideNavigation && <Navigation />} */}
      {!hideNavigation && <SiteHeader />}
      {children}
      {!hideNavigation && <SiteFooter />}
    </main>
  )
}

export default Layout
