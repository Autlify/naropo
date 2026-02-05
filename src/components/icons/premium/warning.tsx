'use client'

import React from 'react'

interface PremiumWarningProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumWarning = ({ className, size = 24, animated = false }: PremiumWarningProps) => {
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
        <linearGradient id={`warning-body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <filter id={`warning-glow-${id}`}>
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      <path d="M10.29 3.86L1.82 18C1.64 18.3 1.55 18.64 1.55 19C1.55 19.36 1.64 19.7 1.82 20C2 20.3 2.26 20.56 2.56 20.72C2.87 20.89 3.21 20.97 3.56 20.97H20.49C20.84 20.97 21.18 20.89 21.49 20.72C21.79 20.56 22.05 20.3 22.23 20C22.41 19.7 22.5 19.36 22.5 19C22.5 18.64 22.41 18.3 22.23 18L13.76 3.86C13.57 3.56 13.31 3.32 13 3.16C12.69 3 12.35 2.92 12 2.92C11.65 2.92 11.31 3 11 3.16C10.69 3.32 10.43 3.56 10.29 3.86Z" fill={`url(#warning-body-${id})`} filter={`url(#warning-glow-${id})`}>
        {animated && <animate attributeName="opacity" values="1;0.8;1" dur="1s" repeatCount="indefinite" />}
      </path>
      
      <line x1="12" y1="9" x2="12" y2="13" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.5" fill="#92400E" />
      
      <path d="M12 2.92L3.56 17H12V2.92Z" fill="white" fillOpacity="0.2" />
    </svg>
  )
}

export default PremiumWarning
