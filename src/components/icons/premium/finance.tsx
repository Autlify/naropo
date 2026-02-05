'use client'

import React from 'react'

interface PremiumFinanceProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumFinance = ({ className, size = 24, animated = false }: PremiumFinanceProps) => {
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
        <linearGradient id={`finance-up-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id={`finance-line-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
        <filter id={`finance-glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      <rect x="2" y="4" width="20" height="16" rx="2" fill="#1E293B" />
      
      {animated && (
        <path d="M4 16L8 12L12 14L20 6" stroke={`url(#finance-up-${id})`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" filter={`url(#finance-glow-${id})`} opacity="0.4">
          <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2s" repeatCount="indefinite" />
        </path>
      )}
      
      <path d="M4 16L8 12L12 14L20 6" stroke={`url(#finance-line-${id})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M4 16L8 12L12 14L20 6V16H4Z" fill={`url(#finance-up-${id})`} fillOpacity="0.2" />
      
      <polygon points="20,6 17,6 20,9" fill={`url(#finance-up-${id})`} />
      
      <circle cx="4" cy="16" r="2" fill={`url(#finance-up-${id})`} />
      <circle cx="8" cy="12" r="2" fill={`url(#finance-up-${id})`} />
      <circle cx="12" cy="14" r="2" fill={`url(#finance-up-${id})`} />
      <circle cx="20" cy="6" r="2" fill={`url(#finance-up-${id})`}>
        {animated && <animate attributeName="r" values="2;2.5;2" dur="1s" repeatCount="indefinite" />}
      </circle>
    </svg>
  )
}

export default PremiumFinance
