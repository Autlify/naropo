'use client'

import React from 'react'

interface PremiumCheckCircleProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumCheckCircle = ({ className, size = 24, animated = false }: PremiumCheckCircleProps) => {
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
        <linearGradient id={`checkcircle-bg-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <filter id={`checkcircle-glow-${id}`}>
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      <circle cx="12" cy="12" r="10" fill={`url(#checkcircle-bg-${id})`} filter={`url(#checkcircle-glow-${id})`}>
        {animated && <animate attributeName="r" values="10;10.5;10" dur="2s" repeatCount="indefinite" />}
      </circle>
      
      <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {animated && <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="0.8s" repeatCount="1" />}
      </path>
      
      <path d="M12 2C10 2 8 3 6.5 4.5L12 12V2Z" fill="white" fillOpacity="0.2" />
    </svg>
  )
}

export default PremiumCheckCircle
