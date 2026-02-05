'use client'

import React from 'react'

interface PremiumChipProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumChip = ({ className, size = 24, animated = false }: PremiumChipProps) => {
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
        <linearGradient id={`chip-body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <linearGradient id={`chip-core-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`chip-pins-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
      </defs>
      
      <rect x="5" y="5" width="14" height="14" rx="2" fill={`url(#chip-body-${id})`} />
      <rect x="8" y="8" width="8" height="8" rx="1" fill={`url(#chip-core-${id})`}>
        {animated && <animate attributeName="opacity" values="1;0.7;1" dur="1.5s" repeatCount="indefinite" />}
      </rect>
      
      <rect x="9" y="2" width="2" height="3" rx="0.5" fill={`url(#chip-pins-${id})`} />
      <rect x="13" y="2" width="2" height="3" rx="0.5" fill={`url(#chip-pins-${id})`} />
      <rect x="9" y="19" width="2" height="3" rx="0.5" fill={`url(#chip-pins-${id})`} />
      <rect x="13" y="19" width="2" height="3" rx="0.5" fill={`url(#chip-pins-${id})`} />
      <rect x="2" y="9" width="3" height="2" rx="0.5" fill={`url(#chip-pins-${id})`} />
      <rect x="2" y="13" width="3" height="2" rx="0.5" fill={`url(#chip-pins-${id})`} />
      <rect x="19" y="9" width="3" height="2" rx="0.5" fill={`url(#chip-pins-${id})`} />
      <rect x="19" y="13" width="3" height="2" rx="0.5" fill={`url(#chip-pins-${id})`} />
      
      <rect x="8" y="8" width="4" height="4" rx="0.5" fill="white" fillOpacity="0.2" />
    </svg>
  )
}

export default PremiumChip
