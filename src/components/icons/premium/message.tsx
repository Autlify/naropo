'use client'

import React from 'react'

interface PremiumMessageProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumMessage = ({ className, size = 24, animated = false }: PremiumMessageProps) => {
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
        <linearGradient id={`msg-body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`msg-dots-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#BFDBFE" />
          <stop offset="100%" stopColor="#93C5FD" />
        </linearGradient>
      </defs>
      
      <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" fill={`url(#msg-body-${id})`} />
      
      <circle cx="8" cy="10" r="1.5" fill={`url(#msg-dots-${id})`}>
        {animated && <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />}
      </circle>
      <circle cx="12" cy="10" r="1.5" fill={`url(#msg-dots-${id})`}>
        {animated && <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" begin="0.2s" repeatCount="indefinite" />}
      </circle>
      <circle cx="16" cy="10" r="1.5" fill={`url(#msg-dots-${id})`}>
        {animated && <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" begin="0.4s" repeatCount="indefinite" />}
      </circle>
      
      <path d="M3 5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V8H3V5Z" fill="white" fillOpacity="0.15" />
    </svg>
  )
}

export default PremiumMessage
