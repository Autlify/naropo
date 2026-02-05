'use client'

import React from 'react'

interface PremiumFingerprintProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumFingerprint = ({ className, size = 24, animated = false }: PremiumFingerprintProps) => {
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
        <linearGradient id={`fp-outer-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`fp-mid-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id={`fp-inner-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <filter id={`fp-glow-${id}`}>
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      <path d="M2 12C2 6.477 6.477 2 12 2C14.5 2 16.8 2.9 18.6 4.4" stroke={`url(#fp-outer-${id})`} strokeWidth="2" strokeLinecap="round" fill="none" filter={`url(#fp-glow-${id})`}>
        {animated && <animate attributeName="stroke-dasharray" values="0,60;60,0" dur="2s" repeatCount="indefinite" />}
      </path>
      <path d="M22 12C22 17.523 17.523 22 12 22C9.5 22 7.2 21.1 5.4 19.6" stroke={`url(#fp-outer-${id})`} strokeWidth="2" strokeLinecap="round" fill="none">
        {animated && <animate attributeName="stroke-dasharray" values="0,60;60,0" dur="2s" begin="0.3s" repeatCount="indefinite" />}
      </path>
      
      <path d="M6 12C6 8.686 8.686 6 12 6C13.5 6 14.9 6.5 16 7.4" stroke={`url(#fp-mid-${id})`} strokeWidth="2" strokeLinecap="round" fill="none">
        {animated && <animate attributeName="stroke-dasharray" values="0,40;40,0" dur="1.5s" begin="0.2s" repeatCount="indefinite" />}
      </path>
      <path d="M18 12C18 15.314 15.314 18 12 18C10.5 18 9.1 17.5 8 16.6" stroke={`url(#fp-mid-${id})`} strokeWidth="2" strokeLinecap="round" fill="none">
        {animated && <animate attributeName="stroke-dasharray" values="0,40;40,0" dur="1.5s" begin="0.5s" repeatCount="indefinite" />}
      </path>
      
      <path d="M12 10V14" stroke={`url(#fp-inner-${id})`} strokeWidth="2.5" strokeLinecap="round">
        {animated && <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite" />}
      </path>
    </svg>
  )
}

export default PremiumFingerprint
