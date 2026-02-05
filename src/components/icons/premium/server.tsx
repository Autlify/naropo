'use client'

import React from 'react'

interface PremiumServerProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumServer = ({ className, size = 24, animated = false }: PremiumServerProps) => {
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
        <linearGradient id={`server-body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id={`server-front-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
      </defs>
      
      <rect x="2" y="2" width="20" height="8" rx="2" fill={`url(#server-body-${id})`} />
      <rect x="2" y="2" width="20" height="8" rx="2" fill={`url(#server-front-${id})`} />
      <circle cx="6" cy="6" r="1.5" fill="#10B981">
        {animated && <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />}
      </circle>
      <line x1="10" y1="6" x2="18" y2="6" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
      
      <rect x="2" y="14" width="20" height="8" rx="2" fill={`url(#server-body-${id})`} />
      <rect x="2" y="14" width="20" height="8" rx="2" fill={`url(#server-front-${id})`} />
      <circle cx="6" cy="18" r="1.5" fill="#10B981">
        {animated && <animate attributeName="opacity" values="0.3;1;0.3" dur="1s" repeatCount="indefinite" />}
      </circle>
      <line x1="10" y1="18" x2="18" y2="18" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
      
      <rect x="2" y="2" width="10" height="4" rx="1" fill="white" fillOpacity="0.15" />
      <rect x="2" y="14" width="10" height="4" rx="1" fill="white" fillOpacity="0.15" />
    </svg>
  )
}

export default PremiumServer
