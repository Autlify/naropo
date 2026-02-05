'use client'

import React from 'react'

interface PremiumPolicyProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumPolicy = ({ className, size = 24, animated = false }: PremiumPolicyProps) => {
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
        <linearGradient id={`policy-shield-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`policy-doc-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        <filter id={`policy-glow-${id}`}>
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      <path d="M12 22S20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" fill={`url(#policy-shield-${id})`} filter={`url(#policy-glow-${id})`}>
        {animated && <animate attributeName="opacity" values="1;0.8;1" dur="2s" repeatCount="indefinite" />}
      </path>
      
      <rect x="8" y="8" width="8" height="1.5" rx="0.75" fill="white" fillOpacity="0.9" />
      <rect x="8" y="11" width="6" height="1.5" rx="0.75" fill="white" fillOpacity="0.7" />
      <rect x="8" y="14" width="4" height="1.5" rx="0.75" fill="white" fillOpacity="0.5" />
      
      <path d="M4 5L12 2L20 5V8L12 11L4 8V5Z" fill="white" fillOpacity="0.2" />
    </svg>
  )
}

export default PremiumPolicy
