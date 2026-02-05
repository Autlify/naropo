'use client'

import React from 'react'

interface PremiumTaxProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumTax = ({ className, size = 24, animated = false }: PremiumTaxProps) => {
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
        <linearGradient id={`tax-doc-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        <linearGradient id={`tax-percent-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id={`tax-stamp-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
      </defs>
      
      <rect x="4" y="2" width="16" height="20" rx="2" fill={`url(#tax-doc-${id})`} />
      
      <rect x="7" y="5" width="10" height="1.5" rx="0.75" fill="#64748B" />
      <rect x="7" y="8" width="7" height="1.5" rx="0.75" fill="#64748B" fillOpacity="0.5" />
      
      <circle cx="9" cy="14" r="1.5" fill={`url(#tax-percent-${id})`} />
      <circle cx="15" cy="18" r="1.5" fill={`url(#tax-percent-${id})`} />
      <line x1="16" y1="12" x2="8" y2="20" stroke={`url(#tax-percent-${id})`} strokeWidth="2" strokeLinecap="round">
        {animated && <animate attributeName="stroke-dasharray" values="0,15;15,0" dur="1s" repeatCount="indefinite" />}
      </line>
      
      <circle cx="18" cy="6" r="3" fill={`url(#tax-stamp-${id})`}>
        {animated && <animate attributeName="r" values="3;3.3;3" dur="1.5s" repeatCount="indefinite" />}
      </circle>
      <text x="16.5" y="7.5" fontSize="4" fill="white" fontWeight="bold">$</text>
      
      <rect x="4" y="2" width="8" height="5" rx="1" fill="white" fillOpacity="0.3" />
    </svg>
  )
}

export default PremiumTax
