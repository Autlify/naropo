'use client'
import { useModal } from '@/providers/modal-provider'
import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
} from '../ui/dialog'
import { DialogTitle } from '@radix-ui/react-dialog'

type Props = {
  title: string
  subheading: string
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
  /** Optional callback when dialog open state changes (e.g., outside click, escape key) */
  onOpenChange?: (open: boolean) => void
}

const CustomModal = ({ children, defaultOpen, subheading, title, className, onOpenChange }: Props) => {
  const { isOpen, setClose } = useModal()
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setClose()
      onOpenChange?.(false)
    }
  }
  
  return (
    <Dialog
      open={isOpen || defaultOpen}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className={`md:max-h-[800px] md:h-fit h-screen bg-card ${className}`}>
        <DialogHeader className="pt-8 text-left">
          <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
          <DialogDescription>{subheading}</DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[calc(100vh-200px)] md:max-h-[650px] pr-2 overscroll-contain"
          style={{ scrollbarGutter: 'stable' }}
        >
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CustomModal
