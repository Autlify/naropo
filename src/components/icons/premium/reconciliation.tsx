'use client'

import React from 'react'

interface PremiumReconciliationProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumReconciliation = ({ className, size = 24, animated = false }: PremiumReconciliationProps) => {
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
        <linearGradient id={`rec-left-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`rec-right-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id={`rec-match-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      
      <rect x="2" y="4" width="8" height="16" rx="2" fill={`url(#rec-left-${id})`} />
      <rect x="14" y="4" width="8" height="16" rx="2" fill={`url(#rec-right-${id})`} />
      
      <rect x="4" y="6" width="4" height="1" rx="0.5" fill="white" fillOpacity="0.8" />
      <rect x="4" y="9" width="3" height="1" rx="0.5" fill="white" fillOpacity="0.6" />
      <rect x="4" y="12" width="4" height="1" rx="0.5" fill="white" fillOpacity="0.6" />
      <rect x="4" y="15" width="3" height="1" rx="0.5" fill="white" fillOpacity="0.4" />
      
      <rect x="16" y="6" width="4" height="1" rx="0.5" fill="white" fillOpacity="0.8" />
      <rect x="16" y="9" width="3" height="1" rx="0.5" fill="white" fillOpacity="0.6" />
      <rect x="16" y="12" width="4" height="1" rx="0.5" fill="white" fillOpacity="0.6" />
      <rect x="16" y="15" width="3" height="1" rx="0.5" fill="white" fillOpacity="0.4" />
      
      <path d="M10 9.5H14" stroke={`url(#rec-match-${id})`} strokeWidth="2" strokeLinecap="round">
        {animated && <animate attributeName="stroke-dasharray" values="0,10;10,0" dur="0.8s" repeatCount="indefinite" />}
      </path>
      <path d="M10 12.5H14" stroke={`url(#rec-match-${id})`} strokeWidth="2" strokeLinecap="round">
        {animated && <animate attributeName="stroke-dasharray" values="0,10;10,0" dur="0.8s" begin="0.2s" repeatCount="indefinite" />}
      </path>
      
      <circle cx="12" cy="11" r="3" fill="white" stroke={`url(#rec-match-${id})`} strokeWidth="1.5">
        {animated && <animate attributeName="r" values="3;3.3;3" dur="1.5s" repeatCount="indefinite" />}
      </circle>
      <path d="M10.5 11L11.5 12L13.5 10" stroke={`url(#rec-match-${id})`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export default PremiumReconciliation
