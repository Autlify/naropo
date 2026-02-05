'use client'

import React from 'react'

interface PremiumAgreementProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumAgreement = ({ className, size = 24, animated = false }: PremiumAgreementProps) => {
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
        <linearGradient id={`agree-hand1-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`agree-hand2-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <filter id={`agree-glow-${id}`}>
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      <path d="M2.5 13L6 9.5L9 12L11 10L12 12" stroke={`url(#agree-hand1-${id})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" filter={`url(#agree-glow-${id})`}>
        {animated && <animate attributeName="stroke-dasharray" values="0,40;40,0" dur="1s" repeatCount="indefinite" />}
      </path>
      
      <path d="M21.5 11L18 14.5L15 12L13 14L12 12" stroke={`url(#agree-hand2-${id})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" filter={`url(#agree-glow-${id})`}>
        {animated && <animate attributeName="stroke-dasharray" values="40,0;0,40" dur="1s" repeatCount="indefinite" />}
      </path>
      
      <circle cx="12" cy="12" r="3" fill="white" stroke={`url(#agree-hand1-${id})`} strokeWidth="2">
        {animated && <animate attributeName="r" values="3;3.5;3" dur="1.5s" repeatCount="indefinite" />}
      </circle>
      
      <path d="M10.5 12L11.5 13L13.5 11" stroke={`url(#agree-hand2-${id})`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export default PremiumAgreement
