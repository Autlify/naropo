'use client'

import React from 'react'

interface PremiumKeyProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumKey = ({ className, size = 24, animated = false }: PremiumKeyProps) => {
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
        <linearGradient id={`key-body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id={`key-ring-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#FCD34D" />
        </linearGradient>
        <filter id={`key-glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {animated && (
        <circle cx="8" cy="8" r="6" fill={`url(#key-ring-${id})`} opacity="0.3" filter={`url(#key-glow-${id})`}>
          <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      
      <circle cx="8" cy="8" r="6" fill={`url(#key-ring-${id})`} />
      <circle cx="8" cy="8" r="3" fill="#D97706" />
      
      <rect x="12" y="6" width="10" height="4" rx="1" fill={`url(#key-body-${id})`} />
      <rect x="18" y="10" width="2" height="3" rx="0.5" fill={`url(#key-body-${id})`} />
      <rect x="14" y="10" width="2" height="2" rx="0.5" fill={`url(#key-body-${id})`} />
      
      <ellipse cx="6" cy="6" rx="1.5" ry="1" fill="white" fillOpacity="0.4" />
      <rect x="12" y="6" width="5" height="2" rx="0.5" fill="white" fillOpacity="0.2" />
    </svg>
  )
}

export default PremiumKey
