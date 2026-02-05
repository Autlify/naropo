'use client'

import React from 'react'

interface PremiumHeadphoneProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumHeadphone = ({ className, size = 24, animated = false }: PremiumHeadphoneProps) => {
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
        <linearGradient id={`hp-band-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id={`hp-ear-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id={`hp-cushion-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      
      <path d="M3 18V12C3 9.61305 3.94821 7.32387 5.63604 5.63604C7.32387 3.94821 9.61305 3 12 3C14.3869 3 16.6761 3.94821 18.364 5.63604C20.0518 7.32387 21 9.61305 21 12V18" stroke={`url(#hp-band-${id})`} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      
      <rect x="1" y="14" width="5" height="7" rx="2" fill={`url(#hp-ear-${id})`}>
        {animated && <animate attributeName="height" values="7;8;7" dur="1s" repeatCount="indefinite" />}
      </rect>
      <rect x="18" y="14" width="5" height="7" rx="2" fill={`url(#hp-ear-${id})`}>
        {animated && <animate attributeName="height" values="7;8;7" dur="1s" begin="0.5s" repeatCount="indefinite" />}
      </rect>
      
      <rect x="2" y="15" width="3" height="5" rx="1" fill={`url(#hp-cushion-${id})`} />
      <rect x="19" y="15" width="3" height="5" rx="1" fill={`url(#hp-cushion-${id})`} />
      
      <rect x="1" y="14" width="2.5" height="3.5" rx="1" fill="white" fillOpacity="0.2" />
      <rect x="18" y="14" width="2.5" height="3.5" rx="1" fill="white" fillOpacity="0.2" />
    </svg>
  )
}

export default PremiumHeadphone
