'use client'

import React from 'react'

interface PremiumTermsProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumTerms = ({ className, size = 24, animated = false }: PremiumTermsProps) => {
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
        <linearGradient id={`terms-doc-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        <linearGradient id={`terms-text-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id={`terms-check-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      
      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" fill={`url(#terms-doc-${id})`} />
      <path d="M14 2V8H20" fill="#CBD5E1" />
      <path d="M14 2L20 8H14V2Z" fill="#CBD5E1" />
      
      <rect x="8" y="10" width="8" height="1.5" rx="0.75" fill={`url(#terms-text-${id})`} />
      <rect x="8" y="13" width="6" height="1.5" rx="0.75" fill={`url(#terms-text-${id})`} fillOpacity="0.6" />
      
      <circle cx="17" cy="17" r="5" fill={`url(#terms-check-${id})`}>
        {animated && <animate attributeName="r" values="5;5.3;5" dur="1.5s" repeatCount="indefinite" />}
      </circle>
      <path d="M15 17L16.5 18.5L19 15.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      
      <path d="M4 4C4 3.46957 4.21071 2.96086 4.58579 2.58579C4.96086 2.21071 5.46957 2 6 2H12L4 11V4Z" fill="white" fillOpacity="0.3" />
    </svg>
  )
}

export default PremiumTerms
