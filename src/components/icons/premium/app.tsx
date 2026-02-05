'use client'

import React from 'react'

interface PremiumAppProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumApp = ({ className, size = 24, animated = false }: PremiumAppProps) => {
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
        <linearGradient id={`app-1-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <linearGradient id={`app-2-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`app-3-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id={`app-4-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      
      <rect x="3" y="3" width="8" height="8" rx="2" fill={`url(#app-1-${id})`}>
        {animated && <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite" />}
      </rect>
      <rect x="13" y="3" width="8" height="8" rx="2" fill={`url(#app-2-${id})`}>
        {animated && <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" begin="0.3s" repeatCount="indefinite" />}
      </rect>
      <rect x="3" y="13" width="8" height="8" rx="2" fill={`url(#app-3-${id})`}>
        {animated && <animate attributeName="opacity" values="1;0.7;1" dur="2s" begin="0.6s" repeatCount="indefinite" />}
      </rect>
      <rect x="13" y="13" width="8" height="8" rx="2" fill={`url(#app-4-${id})`}>
        {animated && <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" begin="0.9s" repeatCount="indefinite" />}
      </rect>
      
      <rect x="3" y="3" width="4" height="4" rx="1" fill="white" fillOpacity="0.2" />
      <rect x="13" y="3" width="4" height="4" rx="1" fill="white" fillOpacity="0.2" />
      <rect x="3" y="13" width="4" height="4" rx="1" fill="white" fillOpacity="0.2" />
      <rect x="13" y="13" width="4" height="4" rx="1" fill="white" fillOpacity="0.2" />
    </svg>
  )
}

export default PremiumApp
