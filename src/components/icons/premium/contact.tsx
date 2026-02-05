'use client'

import React from 'react'

interface PremiumContactProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumContact = ({ className, size = 24, animated = false }: PremiumContactProps) => {
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
        <linearGradient id={`contact-card-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`contact-avatar-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
      </defs>
      
      <rect x="2" y="4" width="20" height="16" rx="2" fill={`url(#contact-card-${id})`} />
      
      <circle cx="8" cy="10" r="3" fill={`url(#contact-avatar-${id})`}>
        {animated && <animate attributeName="r" values="3;3.2;3" dur="2s" repeatCount="indefinite" />}
      </circle>
      <path d="M4 16C4 14.5 5.5 13 8 13C10.5 13 12 14.5 12 16" stroke={`url(#contact-avatar-${id})`} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      
      <rect x="14" y="9" width="6" height="1.5" rx="0.75" fill="white" fillOpacity="0.7" />
      <rect x="14" y="12" width="4" height="1.5" rx="0.75" fill="white" fillOpacity="0.5" />
      <rect x="14" y="15" width="5" height="1.5" rx="0.75" fill="white" fillOpacity="0.5" />
      
      <rect x="2" y="4" width="10" height="5" rx="1" fill="white" fillOpacity="0.15" />
    </svg>
  )
}

export default PremiumContact
