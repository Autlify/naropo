'use client'

import React from 'react'

interface PremiumHelpProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumHelp = ({ className, size = 24, animated = false }: PremiumHelpProps) => {
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
        <linearGradient id={`help-bg-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <filter id={`help-glow-${id}`}>
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      <circle cx="12" cy="12" r="10" fill={`url(#help-bg-${id})`} filter={`url(#help-glow-${id})`}>
        {animated && <animate attributeName="r" values="10;10.5;10" dur="2s" repeatCount="indefinite" />}
      </circle>
      
      <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15848 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="12" cy="17" r="1.5" fill="white">
        {animated && <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />}
      </circle>
      
      <path d="M12 2C10 2 8 3 6.5 4.5L12 12V2Z" fill="white" fillOpacity="0.15" />
    </svg>
  )
}

export default PremiumHelp
