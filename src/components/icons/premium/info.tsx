'use client'

import React from 'react'

interface PremiumInfoProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumInfo = ({ className, size = 24, animated = false }: PremiumInfoProps) => {
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
        <linearGradient id={`info-circle-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <filter id={`info-glow-${id}`}>
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      <circle cx="12" cy="12" r="10" fill={`url(#info-circle-${id})`} filter={`url(#info-glow-${id})`}>
        {animated && <animate attributeName="r" values="10;10.5;10" dur="2s" repeatCount="indefinite" />}
      </circle>
      
      <line x1="12" y1="16" x2="12" y2="12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="12" cy="8" r="1.5" fill="white" />
      
      <path d="M12 2C10 2 8 3 6.5 4.5L12 12V2Z" fill="white" fillOpacity="0.15" />
    </svg>
  )
}

export default PremiumInfo
