'use client'

import React from 'react'

interface PremiumBudgetProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumBudget = ({ className, size = 24, animated = false }: PremiumBudgetProps) => {
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
        <linearGradient id={`budget-circle-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id={`budget-used-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id={`budget-center-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
      </defs>
      
      <circle cx="12" cy="12" r="10" fill="none" stroke={`url(#budget-circle-${id})`} strokeWidth="3" />
      
      <circle cx="12" cy="12" r="10" fill="none" stroke={`url(#budget-used-${id})`} strokeWidth="3" strokeDasharray="47 63" strokeDashoffset="15" strokeLinecap="round">
        {animated && <animate attributeName="stroke-dasharray" values="47 63;52 58;47 63" dur="2s" repeatCount="indefinite" />}
      </circle>
      
      <circle cx="12" cy="12" r="6" fill={`url(#budget-center-${id})`} />
      
      <text x="9" y="14" fontSize="6" fill="#475569" fontWeight="bold">75</text>
      <text x="15" y="14" fontSize="3" fill="#64748B">%</text>
      
      <circle cx="12" cy="12" r="3" fill="white" fillOpacity="0.3" />
    </svg>
  )
}

export default PremiumBudget
