'use client'

import React from 'react'

interface PremiumShareProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumShare = ({ className, size = 24, animated = false }: PremiumShareProps) => {
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
        <linearGradient id={`share-node-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`share-line-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
      </defs>
      
      <line x1="18" y1="5" x2="8.59" y2="11.23" stroke={`url(#share-line-${id})`} strokeWidth="2" strokeLinecap="round">
        {animated && <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="1s" repeatCount="indefinite" />}
      </line>
      <line x1="8.59" y1="15.77" x2="18" y2="22" stroke={`url(#share-line-${id})`} strokeWidth="2" strokeLinecap="round">
        {animated && <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="1s" begin="0.3s" repeatCount="indefinite" />}
      </line>
      
      <circle cx="18" cy="5" r="4" fill={`url(#share-node-${id})`} />
      <circle cx="6" cy="12" r="4" fill={`url(#share-node-${id})`} />
      <circle cx="18" cy="19" r="4" fill={`url(#share-node-${id})`} />
      
      <circle cx="17" cy="4" r="1.5" fill="white" fillOpacity="0.3" />
      <circle cx="5" cy="11" r="1.5" fill="white" fillOpacity="0.3" />
      <circle cx="17" cy="18" r="1.5" fill="white" fillOpacity="0.3" />
    </svg>
  )
}

export default PremiumShare
