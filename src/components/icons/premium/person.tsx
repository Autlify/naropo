'use client'

import React from 'react'

interface PremiumPersonProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumPerson = ({ className, size = 24, animated = false }: PremiumPersonProps) => {
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
        <linearGradient id={`person-head-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`person-body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
        <filter id={`person-glow-${id}`}>
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      <circle cx="12" cy="7" r="5" fill={`url(#person-head-${id})`} filter={`url(#person-glow-${id})`}>
        {animated && <animate attributeName="r" values="5;5.3;5" dur="2s" repeatCount="indefinite" />}
      </circle>
      
      <path d="M20 21C20 17.134 16.4183 14 12 14C7.58172 14 4 17.134 4 21" stroke={`url(#person-body-${id})`} strokeWidth="3" strokeLinecap="round" fill="none" />
      
      <circle cx="10" cy="6" r="1.5" fill="white" fillOpacity="0.3" />
    </svg>
  )
}

export default PremiumPerson
