'use client'

import React from 'react'

interface PremiumReceiptProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumReceipt = ({ className, size = 24, animated = false }: PremiumReceiptProps) => {
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
        <linearGradient id={`receipt-body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        <linearGradient id={`receipt-text-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id={`receipt-highlight-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      
      <path d="M4 2L6 4L8 2L10 4L12 2L14 4L16 2L18 4L20 2V22L18 20L16 22L14 20L12 22L10 20L8 22L6 20L4 22V2Z" fill={`url(#receipt-body-${id})`} />
      
      <rect x="7" y="7" width="10" height="1.5" rx="0.75" fill={`url(#receipt-text-${id})`}>
        {animated && <animate attributeName="width" values="10;8;10" dur="2s" repeatCount="indefinite" />}
      </rect>
      <rect x="7" y="10" width="7" height="1.5" rx="0.75" fill={`url(#receipt-text-${id})`} fillOpacity="0.5" />
      <rect x="7" y="13" width="8" height="1.5" rx="0.75" fill={`url(#receipt-text-${id})`} fillOpacity="0.5" />
      
      <rect x="7" y="16" width="10" height="2" rx="1" fill={`url(#receipt-highlight-${id})`} />
      
      <path d="M4 2L6 4L8 2L10 4L12 2V8H4V2Z" fill="white" fillOpacity="0.3" />
    </svg>
  )
}

export default PremiumReceipt
