'use client'

import React from 'react'

interface PremiumTuneProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumTune = ({ className, size = 24, animated = false }: PremiumTuneProps) => {
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
        <linearGradient id={`tune-line-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
        <linearGradient id={`tune-knob1-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`tune-knob2-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id={`tune-knob3-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      
      <line x1="4" y1="6" x2="20" y2="6" stroke={`url(#tune-line-${id})`} strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="12" x2="20" y2="12" stroke={`url(#tune-line-${id})`} strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="18" x2="20" y2="18" stroke={`url(#tune-line-${id})`} strokeWidth="2" strokeLinecap="round" />
      
      <circle cx="15" cy="6" r="3" fill={`url(#tune-knob1-${id})`}>
        {animated && <animate attributeName="cx" values="15;17;15" dur="2s" repeatCount="indefinite" />}
      </circle>
      <circle cx="8" cy="12" r="3" fill={`url(#tune-knob2-${id})`}>
        {animated && <animate attributeName="cx" values="8;6;8" dur="2s" begin="0.3s" repeatCount="indefinite" />}
      </circle>
      <circle cx="12" cy="18" r="3" fill={`url(#tune-knob3-${id})`}>
        {animated && <animate attributeName="cx" values="12;14;12" dur="2s" begin="0.6s" repeatCount="indefinite" />}
      </circle>
      
      <circle cx="14" cy="5" r="1" fill="white" fillOpacity="0.4" />
      <circle cx="7" cy="11" r="1" fill="white" fillOpacity="0.4" />
      <circle cx="11" cy="17" r="1" fill="white" fillOpacity="0.4" />
    </svg>
  )
}

export default PremiumTune
