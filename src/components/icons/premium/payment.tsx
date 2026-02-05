'use client'

import React from 'react'

interface PremiumPaymentProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumPayment = ({ className, size = 24, animated = false }: PremiumPaymentProps) => {
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
        <linearGradient id={`pay-bg-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id={`pay-coin-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
      </defs>
      
      <rect x="2" y="5" width="20" height="14" rx="2" fill={`url(#pay-bg-${id})`} />
      
      <circle cx="12" cy="12" r="5" fill={`url(#pay-coin-${id})`}>
        {animated && <animate attributeName="r" values="5;5.3;5" dur="1.5s" repeatCount="indefinite" />}
      </circle>
      <text x="12" y="15" textAnchor="middle" fill="#92400E" fontSize="8" fontWeight="bold">$</text>
      
      <rect x="2" y="5" width="10" height="7" rx="1" fill="white" fillOpacity="0.15" />
    </svg>
  )
}

export default PremiumPayment
