'use client'

import React from 'react'

interface PremiumTargetProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumTarget = ({ className, size = 24, animated = false }: PremiumTargetProps) => {
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
        <linearGradient id={`target-outer-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F87171" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
        <linearGradient id={`target-mid-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FECACA" />
          <stop offset="100%" stopColor="#FCA5A5" />
        </linearGradient>
        <linearGradient id={`target-inner-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
      </defs>
      
      <circle cx="12" cy="12" r="10" fill={`url(#target-outer-${id})`} />
      <circle cx="12" cy="12" r="7" fill={`url(#target-mid-${id})`} />
      <circle cx="12" cy="12" r="4" fill={`url(#target-inner-${id})`}>
        {animated && <animate attributeName="r" values="4;4.5;4" dur="1s" repeatCount="indefinite" />}
      </circle>
      <circle cx="12" cy="12" r="1.5" fill="white" />
      
      <ellipse cx="8" cy="7" rx="3" ry="2" fill="white" fillOpacity="0.2" />
    </svg>
  )
}

export default PremiumTarget
