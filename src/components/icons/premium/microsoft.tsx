'use client'

import React from 'react'

interface PremiumMicrosoftProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumMicrosoft = ({ className, size = 24, animated = false }: PremiumMicrosoftProps) => {
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
        <linearGradient id={`ms-red-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F87171" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
        <linearGradient id={`ms-green-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
        <linearGradient id={`ms-blue-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`ms-yellow-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      
      <rect x="3" y="3" width="8" height="8" rx="1" fill={`url(#ms-red-${id})`}>
        {animated && <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite" />}
      </rect>
      <rect x="13" y="3" width="8" height="8" rx="1" fill={`url(#ms-green-${id})`}>
        {animated && <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" begin="0.25s" repeatCount="indefinite" />}
      </rect>
      <rect x="3" y="13" width="8" height="8" rx="1" fill={`url(#ms-blue-${id})`}>
        {animated && <animate attributeName="opacity" values="1;0.7;1" dur="2s" begin="0.5s" repeatCount="indefinite" />}
      </rect>
      <rect x="13" y="13" width="8" height="8" rx="1" fill={`url(#ms-yellow-${id})`}>
        {animated && <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" begin="0.75s" repeatCount="indefinite" />}
      </rect>
      
      <rect x="3" y="3" width="4" height="4" rx="0.5" fill="white" fillOpacity="0.2" />
      <rect x="13" y="3" width="4" height="4" rx="0.5" fill="white" fillOpacity="0.2" />
      <rect x="3" y="13" width="4" height="4" rx="0.5" fill="white" fillOpacity="0.2" />
      <rect x="13" y="13" width="4" height="4" rx="0.5" fill="white" fillOpacity="0.2" />
    </svg>
  )
}

export default PremiumMicrosoft
