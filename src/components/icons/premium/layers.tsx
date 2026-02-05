'use client'

import React from 'react'

interface PremiumLayersProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumLayers = ({ className, size = 24, animated = false }: PremiumLayersProps) => {
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
        <linearGradient id={`layers-1-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id={`layers-2-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
        <linearGradient id={`layers-3-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DDD6FE" />
          <stop offset="100%" stopColor="#C4B5FD" />
        </linearGradient>
      </defs>
      
      <polygon points="12,2 22,7 12,12 2,7" fill={`url(#layers-1-${id})`}>
        {animated && <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite" />}
      </polygon>
      <polygon points="22,12 12,17 2,12" fill={`url(#layers-2-${id})`} stroke={`url(#layers-2-${id})`} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
        {animated && <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" begin="0.3s" repeatCount="indefinite" />}
      </polygon>
      <polygon points="22,17 12,22 2,17" fill={`url(#layers-3-${id})`} stroke={`url(#layers-3-${id})`} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
        {animated && <animate attributeName="opacity" values="1;0.7;1" dur="2s" begin="0.6s" repeatCount="indefinite" />}
      </polygon>
      
      <polygon points="12,2 12,12 2,7" fill="white" fillOpacity="0.2" />
    </svg>
  )
}

export default PremiumLayers
