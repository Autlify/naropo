'use client'

import React from 'react'

interface PremiumSupportProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumSupport = ({ className, size = 24, animated = false }: PremiumSupportProps) => {
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
        <linearGradient id={`support-head-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id={`support-ear-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
        <linearGradient id={`support-mic-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      
      <path d="M3 18V12C3 9.61305 3.94821 7.32387 5.63604 5.63604C7.32387 3.94821 9.61305 3 12 3C14.3869 3 16.6761 3.94821 18.364 5.63604C20.0518 7.32387 21 9.61305 21 12V18" stroke={`url(#support-head-${id})`} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      
      <rect x="1" y="14" width="5" height="6" rx="2" fill={`url(#support-ear-${id})`}>
        {animated && <animate attributeName="height" values="6;7;6" dur="1s" repeatCount="indefinite" />}
      </rect>
      <rect x="18" y="14" width="5" height="6" rx="2" fill={`url(#support-ear-${id})`}>
        {animated && <animate attributeName="height" values="6;7;6" dur="1s" begin="0.5s" repeatCount="indefinite" />}
      </rect>
      
      <path d="M18 20C18 20 17 22 12 22C10 22 8.5 21.5 8 21" stroke={`url(#support-head-${id})`} strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="8" cy="21" r="2" fill={`url(#support-mic-${id})`}>
        {animated && <animate attributeName="r" values="2;2.3;2" dur="1.5s" repeatCount="indefinite" />}
      </circle>
      
      <rect x="1" y="14" width="2.5" height="3" rx="1" fill="white" fillOpacity="0.3" />
      <rect x="18" y="14" width="2.5" height="3" rx="1" fill="white" fillOpacity="0.3" />
    </svg>
  )
}

export default PremiumSupport
