'use client'

import React from 'react'

interface PremiumSuccessProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumSuccess = ({ className, size = 24, animated = false }: PremiumSuccessProps) => {
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
        <linearGradient id={`success-bg-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id={`success-ring-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
        <filter id={`success-glow-${id}`}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      <circle cx="12" cy="12" r="10" fill={`url(#success-bg-${id})`} filter={`url(#success-glow-${id})`}>
        {animated && <animate attributeName="r" values="10;10.8;10" dur="1.5s" repeatCount="indefinite" />}
      </circle>
      
      <path d="M8 12L11 15L16 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {animated && <animate attributeName="stroke-dasharray" values="0,30;30,0" dur="0.6s" fill="freeze" />}
      </path>
      
      <circle cx="12" cy="12" r="11.5" stroke={`url(#success-ring-${id})`} strokeWidth="1" fill="none" opacity="0.5">
        {animated && <animate attributeName="r" values="11.5;13;11.5" dur="2s" repeatCount="indefinite" />}
        {animated && <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />}
      </circle>
      
      <path d="M12 2C10 2 8 3 6.5 4.5L12 12V2Z" fill="white" fillOpacity="0.2" />
    </svg>
  )
}

export default PremiumSuccess
