'use client'

import React from 'react'

interface PremiumSunProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumSun = ({ className, size = 24, animated = false }: PremiumSunProps) => {
  const id = React.useId()
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={animated ? { animation: 'spin 20s linear infinite' } : {}}
    >
      <defs>
        <linearGradient id={`sun-core-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
        <linearGradient id={`sun-rays-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#FCD34D" />
        </linearGradient>
        <filter id={`sun-glow-${id}`}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      <circle cx="12" cy="12" r="5" fill={`url(#sun-core-${id})`} filter={`url(#sun-glow-${id})`}>
        {animated && <animate attributeName="r" values="5;5.5;5" dur="2s" repeatCount="indefinite" />}
      </circle>
      
      <line x1="12" y1="1" x2="12" y2="4" stroke={`url(#sun-rays-${id})`} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="12" y1="20" x2="12" y2="23" stroke={`url(#sun-rays-${id})`} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" stroke={`url(#sun-rays-${id})`} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" stroke={`url(#sun-rays-${id})`} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="1" y1="12" x2="4" y2="12" stroke={`url(#sun-rays-${id})`} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="20" y1="12" x2="23" y2="12" stroke={`url(#sun-rays-${id})`} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" stroke={`url(#sun-rays-${id})`} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" stroke={`url(#sun-rays-${id})`} strokeWidth="2.5" strokeLinecap="round" />
      
      <circle cx="10" cy="10" r="2" fill="white" fillOpacity="0.3" />
    </svg>
  )
}

export default PremiumSun
