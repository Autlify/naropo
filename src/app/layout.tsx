import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/providers/theme-provider'
import { AuthProvider } from '@/providers/auth-provider'
import { PreferencesProvider } from '@/providers/preferences-provider'
import ModalProvider from '@/providers/modal-provider'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as SonnarToaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SidebarProvider } from '@/components/sidebar-01/sidebar-context'

const font = DM_Sans({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Autlify',
  description: 'The ultimate agency kit',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <body className={`${font.className } min-w-screen min-h-screen`}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            themes={['light', 'premium']}
            defaultTheme="premium"
            enableSystem={false}
            disableTransitionOnChange
          >
            <PreferencesProvider>
              <TooltipProvider delayDuration={0} skipDelayDuration={0} disableHoverableContent>
                <ModalProvider>
                  <SidebarProvider>
                    {children}
                    <Toaster />
                    <SonnarToaster position="bottom-left" />
                  </SidebarProvider>
                </ModalProvider>
              </TooltipProvider>
            </PreferencesProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
