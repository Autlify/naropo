'use client'

import React from 'react'

interface PremiumFlagProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumFlag = ({ className, size = 24, animated = false }: PremiumFlagProps) => {
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
        <linearGradient id={`flag-body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F87171" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
        <linearGradient id={`flag-pole-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
      </defs>
      
      <line x1="4" y1="22" x2="4" y2="2" stroke={`url(#flag-pole-${id})`} strokeWidth="2.5" strokeLinecap="round" />
      
      <path d="M4 15C4 15 5 14 8 14C11 14 13 16 16 16C19 16 20 15 20 15V4C20 4 19 5 16 5C13 5 11 3 8 3C5 3 4 4 4 4V15Z" fill={`url(#flag-body-${id})`}>
        {animated && (
          <animate attributeName="d" 
            values="M4 15C4 15 5 14 8 14C11 14 13 16 16 16C19 16 20 15 20 15V4C20 4 19 5 16 5C13 5 11 3 8 3C5 3 4 4 4 4V15Z;
                    M4 15C4 15 6 14 9 14C12 14 14 16 17 16C20 16 21 15 21 15V4C20 4 19 5 16 5C13 5 11 3 8 3C5 3 4 4 4 4V15Z;
                    M4 15C4 15 5 14 8 14C11 14 13 16 16 16C19 16 20 15 20 15V4C20 4 19 5 16 5C13 5 11 3 8 3C5 3 4 4 4 4V15Z"
            dur="2s" repeatCount="indefinite" />
        )}
      </path>
      
      <path d="M4 4C4 4 5 3 8 3C11 3 11 5 14 5L4 10V4Z" fill="white" fillOpacity="0.2" />
    </svg>
  )
}

export default PremiumFlag
