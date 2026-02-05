'use client'

import React from 'react'

interface PremiumCreditCardProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumCreditCard = ({ className, size = 24, animated = false }: PremiumCreditCardProps) => {
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
        <linearGradient id={`card-body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
        <linearGradient id={`card-stripe-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#4338CA" />
        </linearGradient>
        <linearGradient id={`card-chip-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      
      <rect x="1" y="4" width="22" height="16" rx="2.5" fill={`url(#card-body-${id})`}>
        {animated && <animate attributeName="opacity" values="1;0.85;1" dur="2s" repeatCount="indefinite" />}
      </rect>
      <rect x="1" y="8" width="22" height="3" fill={`url(#card-stripe-${id})`} />
      <rect x="4" y="13" width="5" height="3.5" rx="0.5" fill={`url(#card-chip-${id})`} />
      <line x1="4.5" y1="14" x2="8.5" y2="14" stroke="#92400E" strokeWidth="0.5" />
      <line x1="4.5" y1="15" x2="8.5" y2="15" stroke="#92400E" strokeWidth="0.5" />
      <line x1="6.5" y1="13.5" x2="6.5" y2="16" stroke="#92400E" strokeWidth="0.5" />
      <rect x="12" y="14" width="8" height="1.5" rx="0.75" fill="white" fillOpacity="0.3" />
      <rect x="1" y="4" width="11" height="4" rx="1" fill="white" fillOpacity="0.15" />
    </svg>
  )
}

export default PremiumCreditCard
