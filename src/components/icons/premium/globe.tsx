'use client'

import React from 'react'

interface PremiumGlobeProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumGlobe = ({ className, size = 24, animated = false }: PremiumGlobeProps) => {
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
        <linearGradient id={`globe-ocean-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`globe-land-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      
      <circle cx="12" cy="12" r="10" fill={`url(#globe-ocean-${id})`}>
        {animated && <animate attributeName="opacity" values="1;0.85;1" dur="3s" repeatCount="indefinite" />}
      </circle>
      
      <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.3" />
      <ellipse cx="12" cy="12" rx="4" ry="10" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.3" />
      <line x1="2" y1="12" x2="22" y2="12" stroke="white" strokeWidth="0.5" strokeOpacity="0.3" />
      
      <path d="M7 6C8 7 10 8 12 8C14 8 16 7 17 6" fill={`url(#globe-land-${id})`} />
      <path d="M5 12C6 11 8 10 9 11C10 12 11 14 13 14C15 14 16 12 17 11C18 10 19 11 19 12" fill={`url(#globe-land-${id})`} />
      <path d="M8 17C9 16 11 16 12 17C13 18 14 17 15 17" fill={`url(#globe-land-${id})`} />
      
      <ellipse cx="8" cy="7" rx="3" ry="2" fill="white" fillOpacity="0.2" />
    </svg>
  )
}

export default PremiumGlobe
