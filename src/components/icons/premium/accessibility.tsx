'use client'

import React from 'react'

interface PremiumAccessibilityProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumAccessibility = ({ className, size = 24, animated = false }: PremiumAccessibilityProps) => {
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
        <linearGradient id={`access-body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`access-accent-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
        <filter id={`access-glow-${id}`}>
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      <circle cx="12" cy="12" r="10" stroke={`url(#access-body-${id})`} strokeWidth="2" fill="none" filter={`url(#access-glow-${id})`}>
        {animated && <animate attributeName="r" values="10;10.5;10" dur="2s" repeatCount="indefinite" />}
      </circle>
      
      <circle cx="12" cy="7" r="2" fill={`url(#access-body-${id})`} />
      
      <path d="M12 10V14" stroke={`url(#access-body-${id})`} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M8 11H16" stroke={`url(#access-accent-${id})`} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M10 14L8 19" stroke={`url(#access-body-${id})`} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 14L16 19" stroke={`url(#access-body-${id})`} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

export default PremiumAccessibility
