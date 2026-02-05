'use client'

import React from 'react'

interface PremiumContractProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumContract = ({ className, size = 24, animated = false }: PremiumContractProps) => {
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
        <linearGradient id={`contract-doc-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        <linearGradient id={`contract-text-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id={`contract-sig-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id={`contract-seal-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      
      <rect x="4" y="2" width="16" height="20" rx="2" fill={`url(#contract-doc-${id})`} />
      
      <rect x="7" y="5" width="10" height="1.5" rx="0.75" fill={`url(#contract-text-${id})`} />
      <rect x="7" y="8" width="8" height="1.5" rx="0.75" fill={`url(#contract-text-${id})`} fillOpacity="0.5" />
      <rect x="7" y="11" width="6" height="1.5" rx="0.75" fill={`url(#contract-text-${id})`} fillOpacity="0.5" />
      
      <path d="M8 17C8.5 16 9.5 16.5 10 17C10.5 17.5 11 16.5 12 17C13 17.5 13.5 16.5 14 17" stroke={`url(#contract-sig-${id})`} strokeWidth="1.5" strokeLinecap="round" fill="none">
        {animated && <animate attributeName="stroke-dasharray" values="0,30;30,0" dur="1.5s" repeatCount="indefinite" />}
      </path>
      
      <circle cx="17" cy="17" r="3.5" fill={`url(#contract-seal-${id})`}>
        {animated && <animate attributeName="r" values="3.5;4;3.5" dur="2s" repeatCount="indefinite" />}
      </circle>
      <circle cx="17" cy="17" r="2" fill="none" stroke="#92400E" strokeWidth="0.5" />
      
      <rect x="4" y="2" width="8" height="6" rx="1" fill="white" fillOpacity="0.3" />
    </svg>
  )
}

export default PremiumContract
