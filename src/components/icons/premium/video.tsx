'use client'

import React from 'react'

interface PremiumVideoProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumVideo = ({ className, size = 24, animated = false }: PremiumVideoProps) => {
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
        <linearGradient id={`video-body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id={`video-lens-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`video-rec-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F87171" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
      </defs>
      
      <rect x="2" y="6" width="13" height="12" rx="2" fill={`url(#video-body-${id})`} />
      
      <polygon points="22,6 22,18 15,14 15,10" fill={`url(#video-lens-${id})`} />
      
      <circle cx="6" cy="8" r="2" fill={`url(#video-rec-${id})`}>
        {animated && <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />}
      </circle>
      
      <rect x="2" y="6" width="6" height="5" rx="1" fill="white" fillOpacity="0.15" />
    </svg>
  )
}

export default PremiumVideo
