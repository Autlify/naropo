'use client'

import { Navbar } from '@/components/site/navbar'
import { Footer } from '@/components/site/footer'
import React from 'react'
import { usePathname } from 'next/navigation'

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname()
  const hideNavigation =
    pathname.includes('/checkout') ||
    pathname.includes('/docs') || 
    pathname.includes('/0') ||
    pathname.includes('/1')


  return ( 
      <main className={'flex flex-col'}>
        {/* {!hideNavigation && <Navigation />} */}
        {!hideNavigation && <Navbar />}
        {children}
        {!hideNavigation && <Footer />}
      </main> 
  )
}

export default Layout
