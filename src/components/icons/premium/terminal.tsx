'use client'

import React from 'react'

interface PremiumTerminalProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumTerminal = ({ className, size = 24, animated = false }: PremiumTerminalProps) => {
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
        <linearGradient id={`term-bg-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id={`term-prompt-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id={`term-text-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
      </defs>
      
      <rect x="2" y="3" width="20" height="18" rx="2" fill={`url(#term-bg-${id})`} />
      
      <circle cx="5.5" cy="6" r="1" fill="#EF4444" />
      <circle cx="8.5" cy="6" r="1" fill="#FBBF24" />
      <circle cx="11.5" cy="6" r="1" fill="#10B981" />
      
      <path d="M6 12L9 15L6 18" stroke={`url(#term-prompt-${id})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {animated && <animate attributeName="stroke-opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite" />}
      </path>
      <line x1="12" y1="18" x2="18" y2="18" stroke={`url(#term-text-${id})`} strokeWidth="2" strokeLinecap="round">
        {animated && <animate attributeName="x2" values="18;14;18" dur="1s" repeatCount="indefinite" />}
      </line>
    </svg>
  )
}

export default PremiumTerminal
