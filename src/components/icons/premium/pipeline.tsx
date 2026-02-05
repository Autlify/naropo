'use client'

import React from 'react'

interface PremiumPipelineProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumPipeline = ({ className, size = 24, animated = false }: PremiumPipelineProps) => {
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
        <linearGradient id={`pipe-1-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`pipe-2-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id={`pipe-3-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id={`pipe-line-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
      </defs>
      
      <line x1="7" y1="7" x2="17" y2="7" stroke={`url(#pipe-line-${id})`} strokeWidth="2" strokeLinecap="round">
        {animated && <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="1s" repeatCount="indefinite" />}
      </line>
      <line x1="7" y1="12" x2="17" y2="12" stroke={`url(#pipe-line-${id})`} strokeWidth="2" strokeLinecap="round">
        {animated && <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="1s" begin="0.2s" repeatCount="indefinite" />}
      </line>
      <line x1="7" y1="17" x2="17" y2="17" stroke={`url(#pipe-line-${id})`} strokeWidth="2" strokeLinecap="round">
        {animated && <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="1s" begin="0.4s" repeatCount="indefinite" />}
      </line>
      
      <circle cx="4" cy="7" r="3" fill={`url(#pipe-1-${id})`} />
      <circle cx="4" cy="12" r="3" fill={`url(#pipe-2-${id})`} />
      <circle cx="4" cy="17" r="3" fill={`url(#pipe-3-${id})`} />
      
      <circle cx="20" cy="7" r="3" fill={`url(#pipe-1-${id})`} />
      <circle cx="20" cy="12" r="3" fill={`url(#pipe-2-${id})`} />
      <circle cx="20" cy="17" r="3" fill={`url(#pipe-3-${id})`} />
      
      <circle cx="3" cy="6" r="1" fill="white" fillOpacity="0.4" />
      <circle cx="3" cy="11" r="1" fill="white" fillOpacity="0.4" />
      <circle cx="3" cy="16" r="1" fill="white" fillOpacity="0.4" />
    </svg>
  )
}

export default PremiumPipeline
