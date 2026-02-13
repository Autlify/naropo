'use client'
import { ModeButton } from '@/components/global/mode-toggle'
import { UserButton } from '@/components/global/user-button'
import { useSidebar } from '@/components/sidebar/sidebar-context'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { NotificationWithUser } from '@/lib/types'
import { Bell } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useMemo, useState } from 'react'
import { TbLayoutSidebarLeftExpand } from 'react-icons/tb'
import { twMerge } from 'tailwind-merge'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'


type Props = {
  notifications: NotificationWithUser | []
  canFilterBySubAccount?: boolean
  className?: string
  subAccountId?: string
}

const InfoBar = ({ notifications, subAccountId, className, canFilterBySubAccount }: Props) => {
  const [allNotifications, setAllNotifications] = useState(notifications)
  const [showA11y, setShowA11y] = useState(false)
  const [showAll, setShowAll] = useState(true)
  const { isCollapsed, toggle, title } = useSidebar()
  const pathname = usePathname()

  const breadcrumbs = useMemo(() => {
    const LABELS: Record<string, string> = {
      dashboard: 'Dashboard',
      launchpad: 'Launchpad',
      apps: 'Apps',
      billing: 'Billing',
      subscription: 'Subscription',
      'payment-methods': 'Payment Methods',
      usage: 'Usage',
      credits: 'Credits',
      'credits-discounts': 'Credits & Discounts',
      settings: 'Settings',
      team: 'Team',
      finance: 'Finance',
      fi: 'Finance',
      'general-ledger': 'General Ledger',
    }

    const toTitle = (s: string) => {
      const key = decodeURIComponent(s)
      if (LABELS[key]) return LABELS[key]
      return key
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (m) => m.toUpperCase())
    }

    const segments = pathname.split('?')[0].split('/').filter(Boolean)
    if (segments.length === 0) {
      return [] as { label: string; href?: string; current?: boolean }[]
    }

    // Handle scoped routes: /agency/:id/... or /subaccount/:id/...
    let baseHref = ''
    const items: { label: string; href?: string; current?: boolean }[] = []

    if ((segments[0] === 'agency' || segments[0] === 'subaccount') && segments[1]) {
      baseHref = `/${segments[0]}/${segments[1]}`
      items.push({
        label: segments[0] === 'agency' ? 'Agency' : 'Subaccount',
        href: baseHref,
      })

      const rest = segments.slice(2)
      if (rest.length === 0) {
        const pageTitle = title?.split('|')[0]?.trim() || 'Dashboard'
        items.push({ label: pageTitle, current: true })
        return items
      }

      let acc = baseHref
      for (let i = 0; i < rest.length; i++) {
        const seg = rest[i]
        acc += `/${seg}`
        const isLast = i === rest.length - 1
        items.push({
          label: toTitle(seg),
          href: isLast ? undefined : acc,
          current: isLast,
        })
      }
      // Remove consecutive duplicates (e.g., Billing > Billing)
      return items.filter((item, idx, arr) => idx === 0 || item.label !== arr[idx - 1]?.label)
    }

    // Fallback: non-scoped routes
    let acc = ''
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]
      acc += `/${seg}`
      const isLast = i === segments.length - 1
      items.push({
        label: toTitle(seg),
        href: isLast ? undefined : acc,
        current: isLast,
      })
    }
    return items.filter((item, idx, arr) => idx === 0 || item.label !== arr[idx - 1]?.label)
  }, [pathname, title])

  const handleClick = () => {
    if (!showAll) {
      setAllNotifications(notifications)
    } else {
      if (notifications?.length !== 0) {
        setAllNotifications(
          notifications?.filter((item) => item.subAccountId === subAccountId) ??
          []
        )
      }
    }
    setShowAll((prev) => !prev)
  }

  return (
    <>

      <div
        className={twMerge(
          'fixed z-[20] left-0 right-0 top-0 py-4 pr-4 bg-background/80 backdrop-blur-md flex gap-4 items-center border-b-[1px] transition-all duration-300',
          isCollapsed ? 'md:left-[80px]' : 'md:left-[280px]',
          className
        )}
      >
        <Button variant="ghost" size="icon" onClick={toggle} className='bg-transparent hover:bg-muted/50 hidden md:flex'>
          <TbLayoutSidebarLeftExpand className={twMerge(isCollapsed ? '' : 'rotate-180', 'bg-transparent w-6 h-6')} />
        </Button>

        {breadcrumbs.length > 0 && (
          <Breadcrumb className="hidden md:block">
            <BreadcrumbList>
              {breadcrumbs.map((item, idx) => (
                <React.Fragment key={`${item.label}-${idx}`}>
                  <BreadcrumbItem>
                    {item.current || !item.href ? (
                      <BreadcrumbPage className="max-w-[240px] truncate">
                        {item.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={item.href} className="max-w-[200px] truncate">
                          {item.label}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {idx < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}

        <div className="flex items-center gap-2 ml-auto">

          <UserButton />

          <Sheet>
            <SheetTrigger>
              <div className="rounded-full w-9 h-9 bg-primary flex items-center justify-center text-white">
                <Bell size={17} />
              </div>
            </SheetTrigger>
            <SheetContent className="mt-4 mr-4 pr-4 overflow-scroll">
              <SheetHeader className="text-left">
                <SheetTitle>Notifications</SheetTitle>
                <SheetDescription>
                  {canFilterBySubAccount && (
                    <span className="text-sm text-muted-foreground">
                      Filter notifications by subaccount
                    </span>
                  )}
                </SheetDescription>
              </SheetHeader>
              {canFilterBySubAccount && (
                <Card className="flex items-center justify-between p-4 mt-4">
                  Current Subaccount
                  <Switch onCheckedChange={handleClick} />
                </Card>
              )}
              {allNotifications?.map((notification) => (
                <div
                  key={notification.id}
                  className="flex flex-col gap-y-2 mb-2 overflow-x-scroll text-ellipsis"
                >
                  <div className="flex gap-2">
                    <Avatar>
                      <AvatarImage
                        src={notification.User.avatarUrl || ''}
                        alt="Profile Picture"
                      />
                      <AvatarFallback className="bg-primary">
                        {notification.User.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p>
                        <span className="font-bold">
                          {notification.notification.split('|')[0]}
                        </span>
                        <span className="text-muted-foreground">
                          {notification.notification.split('|')[1]}
                        </span>
                        <span className="font-bold">
                          {notification.notification.split('|')[2]}
                        </span>
                      </p>
                      <small className="text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                </div>
              ))}
              {allNotifications?.length === 0 && (
                <div
                  className="flex items-center justify-center text-muted-foreground mb-4"
                >
                  You have no notifications
                </div>
              )}
            </SheetContent>
          </Sheet>

          <ModeButton />
          
        </div>
      </div>
    </>
  )
}

export default InfoBar
