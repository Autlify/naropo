'use client'

import React from 'react'

interface PremiumLogoPlaceholderProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumLogoPlaceholder = ({ className, size = 24, animated = false }: PremiumLogoPlaceholderProps) => {
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
        <linearGradient id={`logo-bg-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id={`logo-icon-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
      </defs>
      
      <rect x="2" y="2" width="20" height="20" rx="4" fill={`url(#logo-bg-${id})`} />
      
      <path d="M8 8H16V10H8V8Z" fill={`url(#logo-icon-${id})`}>
        {animated && <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />}
      </path>
      <path d="M8 11H14V13H8V11Z" fill={`url(#logo-icon-${id})`} fillOpacity="0.7" />
      <path d="M8 14H12V16H8V14Z" fill={`url(#logo-icon-${id})`} fillOpacity="0.5" />
      
      <rect x="2" y="2" width="10" height="8" rx="2" fill="white" fillOpacity="0.1" />
    </svg>
  )
}

export default PremiumLogoPlaceholder
