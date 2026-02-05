'use client'

import React from 'react'

interface PremiumFileTextProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumFileText = ({ className, size = 24, animated = false }: PremiumFileTextProps) => {
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
        <linearGradient id={`filetext-body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        <linearGradient id={`filetext-fold-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
        <linearGradient id={`filetext-text-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
      </defs>
      
      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" fill={`url(#filetext-body-${id})`} />
      <path d="M14 2V8H20" fill={`url(#filetext-fold-${id})`} />
      <path d="M14 2L20 8H14V2Z" fill={`url(#filetext-fold-${id})`} />
      
      <line x1="8" y1="13" x2="16" y2="13" stroke={`url(#filetext-text-${id})`} strokeWidth="1.5" strokeLinecap="round">
        {animated && <animate attributeName="x2" values="16;14;16" dur="2s" repeatCount="indefinite" />}
      </line>
      <line x1="8" y1="17" x2="14" y2="17" stroke={`url(#filetext-text-${id})`} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
      <line x1="8" y1="10" x2="10" y2="10" stroke={`url(#filetext-text-${id})`} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />
      
      <path d="M4 4C4 3.46957 4.21071 2.96086 4.58579 2.58579C4.96086 2.21071 5.46957 2 6 2H12L4 11V4Z" fill="white" fillOpacity="0.3" />
    </svg>
  )
}

export default PremiumFileText
