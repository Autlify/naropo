'use client'

import React from 'react'

interface PremiumSendProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumSend = ({ className, size = 24, animated = false }: PremiumSendProps) => {
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
        <linearGradient id={`send-body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`send-trail-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
      </defs>
      
      <path d="M22 2L11 13" stroke={`url(#send-trail-${id})`} strokeWidth="2" strokeLinecap="round">
        {animated && <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="0.8s" repeatCount="indefinite" />}
      </path>
      
      <polygon points="22,2 15,22 11,13 2,9" fill={`url(#send-body-${id})`}>
        {animated && <animate attributeName="transform" values="translate(0,0);translate(1,-1);translate(0,0)" dur="0.5s" repeatCount="indefinite" />}
      </polygon>
      
      <polygon points="22,2 2,9 11,13" fill="white" fillOpacity="0.2" />
    </svg>
  )
}

export default PremiumSend
