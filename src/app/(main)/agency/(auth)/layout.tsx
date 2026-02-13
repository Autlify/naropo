import React from 'react'
import { SidebarProvider } from '@/components/ui/sidebar'

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <div className="h-full flex items-center justify-center">{children}</div>
    </>
  )
}

export default AuthLayout
