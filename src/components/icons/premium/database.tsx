'use client'

import React from 'react'

interface PremiumDatabaseProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumDatabase = ({ className, size = 24, animated = false }: PremiumDatabaseProps) => {
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
        <linearGradient id={`db-top-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>
        <linearGradient id={`db-body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#0891B2" />
        </linearGradient>
      </defs>
      
      <ellipse cx="12" cy="5" rx="9" ry="3" fill={`url(#db-top-${id})`}>
        {animated && <animate attributeName="ry" values="3;3.3;3" dur="2s" repeatCount="indefinite" />}
      </ellipse>
      <path d="M3 5V12C3 13.6569 7.02944 15 12 15C16.9706 15 21 13.6569 21 12V5C21 6.65685 16.9706 8 12 8C7.02944 8 3 6.65685 3 5Z" fill={`url(#db-body-${id})`} />
      <path d="M3 12V19C3 20.6569 7.02944 22 12 22C16.9706 22 21 20.6569 21 19V12C21 13.6569 16.9706 15 12 15C7.02944 15 3 13.6569 3 12Z" fill={`url(#db-body-${id})`} />
      
      <ellipse cx="8" cy="5" rx="2" ry="0.8" fill="white" fillOpacity="0.3" />
      <path d="M3 5C3 6.65685 7.02944 8 12 8V5H3Z" fill="white" fillOpacity="0.15" />
    </svg>
  )
}

export default PremiumDatabase
