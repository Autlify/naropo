'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut, useSession } from 'next-auth/react'
import { LogOut, User } from 'lucide-react'
import { PremiumSignout, PremiumSignin, PremiumSettings, PremiumTerms, PremiumHelp, PremiumUsers } from '@/components/icons/premium'
import { Button } from '@/components/ui-2/button'
import { cn } from '@/lib/utils'

export function UserButton({className}: {className?: string}) {
  const { data: session } = useSession()

  if (!session?.user) {
    return null
  }

  const initials = session.user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={cn(className, "relative h-10 w-10 rounded-full border-2 p-0  p-0 focus:border-primary")}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.user.image || ''} alt={session.user.name || ''} />
            <AvatarFallback><span className="text-xs ">{initials}</span></AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 z-150" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{session.user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {session.user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-default hover:bg-transparent">
          <PremiumSignin animated className="mr-2 h-4 w-4" />
          <span>Signed in as {session.user.name}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/** More Menu Item for User based on industry best practices, other than Signout */}
        <DropdownMenuItem className="cursor-pointer">
          <PremiumUsers animated className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <PremiumSettings animated className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <PremiumTerms animated className="mr-2 h-4 w-4" />
          <span>Terms & Privacy</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          <PremiumHelp animated className="mr-2 h-4 w-4" />
          <span>Help</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onSelect={() => signOut({ callbackUrl: '/agency/sign-in' })}
        >
          <PremiumSignout animated className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
