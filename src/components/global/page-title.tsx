'use client'

import { useEffect } from 'react'
import { useSidebar } from '@/components/sidebar/sidebar-context'

interface PageTitleProps {
  title: string
  description?: string
}

/**
 * Sets the page title in the InfoBar via sidebar context.
 * Place this component in your page/layout to set the title.
 * Title is automatically cleared on unmount.
 * 
 * @example
 * <PageTitle title="Billing" description="Manage subscriptions and payments" />
 */
export function PageTitle({ title, description }: PageTitleProps) {
  const { setTitle } = useSidebar()

  useEffect(() => {
    // Format: "Title | Description" or just "Title"
    const fullTitle = description ? `${title}|${description}` : title
    setTitle(fullTitle)

    return () => {
      setTitle('')
    }
  }, [title, description, setTitle])

  return null
}

export default PageTitle
