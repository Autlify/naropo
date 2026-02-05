'use client'

import React from 'react'

interface PremiumMicProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumMic = ({ className, size = 24, animated = false }: PremiumMicProps) => {
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
        <linearGradient id={`mic-body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id={`mic-grill-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
        <linearGradient id={`mic-wave-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      
      <rect x="9" y="1" width="6" height="11" rx="3" fill={`url(#mic-body-${id})`} />
      <rect x="9" y="1" width="6" height="5" rx="3" fill={`url(#mic-grill-${id})`} />
      
      <path d="M19 10V12C19 13.8565 18.2625 15.637 16.9497 16.9497C15.637 18.2625 13.8565 19 12 19C10.1435 19 8.36301 18.2625 7.05025 16.9497C5.7375 15.637 5 13.8565 5 12V10" stroke={`url(#mic-wave-${id})`} strokeWidth="2" strokeLinecap="round" fill="none">
        {animated && <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />}
      </path>
      
      <line x1="12" y1="19" x2="12" y2="23" stroke={`url(#mic-body-${id})`} strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="23" x2="16" y2="23" stroke={`url(#mic-body-${id})`} strokeWidth="2" strokeLinecap="round" />
      
      <rect x="9" y="1" width="3" height="5" rx="1" fill="white" fillOpacity="0.2" />
    </svg>
  )
}

export default PremiumMic
