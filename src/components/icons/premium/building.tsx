'use client'

import React from 'react'

interface PremiumBuildingProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumBuilding = ({ className, size = 24, animated = false }: PremiumBuildingProps) => {
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
        <linearGradient id={`building-body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id={`building-front-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
        <linearGradient id={`building-window-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      
      <rect x="4" y="4" width="16" height="18" rx="1" fill={`url(#building-body-${id})`} />
      <rect x="4" y="4" width="8" height="18" rx="1" fill={`url(#building-front-${id})`} />
      
      <rect x="7" y="7" width="2.5" height="2.5" rx="0.5" fill={`url(#building-window-${id})`}>
        {animated && <animate attributeName="opacity" values="1;0.5;1" dur="3s" repeatCount="indefinite" />}
      </rect>
      <rect x="11" y="7" width="2.5" height="2.5" rx="0.5" fill={`url(#building-window-${id})`}>
        {animated && <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" begin="0.5s" repeatCount="indefinite" />}
      </rect>
      <rect x="14.5" y="7" width="2.5" height="2.5" rx="0.5" fill={`url(#building-window-${id})`}>
        {animated && <animate attributeName="opacity" values="1;0.5;1" dur="3s" begin="1s" repeatCount="indefinite" />}
      </rect>
      
      <rect x="7" y="11.5" width="2.5" height="2.5" rx="0.5" fill={`url(#building-window-${id})`} />
      <rect x="11" y="11.5" width="2.5" height="2.5" rx="0.5" fill={`url(#building-window-${id})`} />
      <rect x="14.5" y="11.5" width="2.5" height="2.5" rx="0.5" fill={`url(#building-window-${id})`} />
      
      <rect x="10" y="17" width="4" height="5" rx="0.5" fill="#475569" />
      
      <rect x="4" y="4" width="4" height="9" rx="0.5" fill="white" fillOpacity="0.1" />
    </svg>
  )
}

export default PremiumBuilding
