'use client'

import React from 'react'

interface PremiumSignoutProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumSignout = ({ className, size = 24, animated = false }: PremiumSignoutProps) => {
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
        <linearGradient id={`signout-door-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id={`signout-arrow-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F87171" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
      </defs>
      
      <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke={`url(#signout-door-${id})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      
      <path d="M16 17L21 12L16 7" stroke={`url(#signout-arrow-${id})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {animated && <animate attributeName="transform" values="translate(0,0);translate(2,0);translate(0,0)" dur="1s" repeatCount="indefinite" />}
      </path>
      <line x1="9" y1="12" x2="21" y2="12" stroke={`url(#signout-arrow-${id})`} strokeWidth="2.5" strokeLinecap="round">
        {animated && <animate attributeName="x2" values="21;23;21" dur="1s" repeatCount="indefinite" />}
      </line>
    </svg>
  )
}

export default PremiumSignout
