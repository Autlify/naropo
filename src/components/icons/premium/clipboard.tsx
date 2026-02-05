'use client'

import React from 'react'

interface PremiumClipboardProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumClipboard = ({ className, size = 24, animated = false }: PremiumClipboardProps) => {
  const id = React.useId()
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={`clip-board-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id={`clip-paper-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        <linearGradient id={`clip-clip-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
        <linearGradient id={`clip-check-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      
      <rect x="4" y="4" width="16" height="18" rx="2" fill={`url(#clip-board-${id})`} />
      <rect x="6" y="8" width="12" height="12" rx="1" fill={`url(#clip-paper-${id})`} />
      
      <rect x="8" y="2" width="8" height="4" rx="1" fill={`url(#clip-clip-${id})`} />
      <rect x="10" y="3" width="4" height="2" rx="0.5" fill="#475569" />
      
      <path d="M9 14L11 16L15 12" stroke={`url(#clip-check-${id})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {animated && <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="1s" repeatCount="indefinite" />}
      </path>
      
      <rect x="4" y="4" width="8" height="6" rx="1" fill="white" fillOpacity="0.1" />
    </svg>
  )
}

export default PremiumClipboard
