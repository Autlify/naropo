'use client'

import * as React from 'react'

import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoonIcon, SunIcon, SparkleIcon } from 'lucide-react'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const theme = resolvedTheme

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="shadow-none"
        >
          <SunIcon className={`h-[1.2rem] w-[1.2rem] transition-all  ${theme === 'light' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`} />
          <MoonIcon className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${theme === 'dark' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`} />
          <SparkleIcon className={`absolute h-[1.2rem] w-[1.2rem] transition-all  ${theme === 'premium' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`} />

          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="shadow-none">
        <DropdownMenuItem onClick={() => setTheme('light')} className="focus:bg-muted/50 focus:text-foreground cursor-pointer shadow-none">
          Light
        </DropdownMenuItem>
        {/* <DropdownMenuItem onClick={() => setTheme('dark')} className="focus:bg-muted/50 focus:text-foreground cursor-pointer shadow-none">
          Dark
        </DropdownMenuItem> */}
        <DropdownMenuItem onClick={() => setTheme('premium')} className="focus:bg-muted/50 focus:text-foreground cursor-pointer shadow-none">
          Premium
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


const ModeButton = ({className}: {className?: string} ) => {
  const { resolvedTheme, setTheme } = useTheme()
  const theme = resolvedTheme
  const [mounted, setMounted] = React.useState(false)

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-1">
        <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
        <div className="h-8 w-8 rounded-md bg-muted animate-pulse" />
      </div>
    );
  }


  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(className,"relative transition-colors")}
      onClick={() => {
        if (theme === 'light') {
          setTheme('premium')
        } else if (theme === 'premium') {
          setTheme('light')
        } else {
          setTheme('light')
        }
      }}
    >
      <SunIcon className={`h-[1.2rem] w-[1.2rem] transition-all ${theme === 'light' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`} />
      <MoonIcon className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${theme === 'premium' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`} />
      {/* <SparkleIcon className={`absolute h-[1.2rem] w-[1.2rem] transition-all  ${theme === 'premium' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`} /> */}

      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

ModeButton.displayName = 'ModeButton'

export { ModeButton }