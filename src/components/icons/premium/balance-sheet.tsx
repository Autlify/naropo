'use client'

import React from 'react'

interface PremiumBalanceSheetProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumBalanceSheet = ({ className, size = 24, animated = false }: PremiumBalanceSheetProps) => {
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
        <linearGradient id={`bs-left-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id={`bs-right-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F87171" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
        <linearGradient id={`bs-base-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
      </defs>
      
      <path d="M12 4L4 20H20L12 4Z" fill="none" stroke={`url(#bs-base-${id})`} strokeWidth="2" strokeLinejoin="round" />
      
      <rect x="2" y="18" width="20" height="3" rx="1" fill={`url(#bs-base-${id})`} />
      
      <rect x="5" y="12" width="5" height="6" rx="1" fill={`url(#bs-left-${id})`}>
        {animated && <animate attributeName="height" values="6;7;6" dur="1.5s" repeatCount="indefinite" />}
        {animated && <animate attributeName="y" values="12;11;12" dur="1.5s" repeatCount="indefinite" />}
      </rect>
      <text x="6" y="16" fontSize="3" fill="white" fontWeight="bold">A</text>
      
      <rect x="14" y="12" width="5" height="6" rx="1" fill={`url(#bs-right-${id})`}>
        {animated && <animate attributeName="height" values="6;7;6" dur="1.5s" begin="0.3s" repeatCount="indefinite" />}
        {animated && <animate attributeName="y" values="12;11;12" dur="1.5s" begin="0.3s" repeatCount="indefinite" />}
      </rect>
      <text x="15" y="16" fontSize="3" fill="white" fontWeight="bold">L+E</text>
      
      <line x1="12" y1="8" x2="12" y2="18" stroke={`url(#bs-base-${id})`} strokeWidth="1.5" />
      
      <text x="10.5" y="7" fontSize="3" fill="#64748B" fontWeight="bold">=</text>
    </svg>
  )
}

export default PremiumBalanceSheet
