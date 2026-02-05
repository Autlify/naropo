'use client'

import React from 'react'

interface PremiumGeneralLedgerProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumGeneralLedger = ({ className, size = 24, animated = false }: PremiumGeneralLedgerProps) => {
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
        <linearGradient id={`gl-book-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E40AF" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
        <linearGradient id={`gl-pages-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        <linearGradient id={`gl-gold-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <filter id={`gl-glow-${id}`}>
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      <rect x="3" y="2" width="18" height="20" rx="2" fill={`url(#gl-book-${id})`} filter={`url(#gl-glow-${id})`} />
      <rect x="5" y="4" width="14" height="16" rx="1" fill={`url(#gl-pages-${id})`} />
      
      <line x1="12" y1="4" x2="12" y2="20" stroke="#CBD5E1" strokeWidth="1" />
      
      <text x="7" y="9" fontSize="4" fill="#1E40AF" fontWeight="bold">DR</text>
      <text x="14" y="9" fontSize="4" fill="#1E40AF" fontWeight="bold">CR</text>
      
      <rect x="7" y="11" width="3" height="1" rx="0.5" fill="#64748B">
        {animated && <animate attributeName="width" values="3;4;3" dur="1.5s" repeatCount="indefinite" />}
      </rect>
      <rect x="14" y="11" width="3" height="1" rx="0.5" fill="#64748B" />
      <rect x="7" y="14" width="2" height="1" rx="0.5" fill="#64748B" fillOpacity="0.6" />
      <rect x="14" y="14" width="4" height="1" rx="0.5" fill="#64748B" fillOpacity="0.6" />
      <rect x="7" y="17" width="4" height="1" rx="0.5" fill="#64748B" fillOpacity="0.4" />
      <rect x="14" y="17" width="2" height="1" rx="0.5" fill="#64748B" fillOpacity="0.4" />
      
      <rect x="3" y="2" width="3" height="20" rx="1" fill={`url(#gl-gold-${id})`} fillOpacity="0.3" />
    </svg>
  )
}

export default PremiumGeneralLedger
