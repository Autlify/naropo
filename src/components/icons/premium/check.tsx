'use client'

import React from 'react'

interface PremiumCheckProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumCheck = ({ className, size = 24, animated = false }: PremiumCheckProps) => {
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
        <linearGradient id={`check-bg-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id={`check-mark-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#ECFDF5" />
        </linearGradient>
        <filter id={`check-glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {animated && (
        <circle cx="12" cy="12" r="10" fill={`url(#check-bg-${id})`} opacity="0.3" filter={`url(#check-glow-${id})`}>
          <animate attributeName="r" values="10;11;10" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}
      
      <circle cx="12" cy="12" r="10" fill={`url(#check-bg-${id})`} />
      
      <path
        d="M16 9L10.5 14.5L8 12"
        stroke={`url(#check-mark-${id})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      <ellipse cx="8" cy="8" rx="3" ry="2" fill="white" fillOpacity="0.2" />
    </svg>
  )
}

export default PremiumCheck
