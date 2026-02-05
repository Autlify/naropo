'use client'

import React from 'react'

interface PremiumUsersProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumUsers = ({ className, size = 24, animated = false }: PremiumUsersProps) => {
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
        <linearGradient id={`users-1-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`users-2-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
      </defs>
      
      <circle cx="9" cy="7" r="4" fill={`url(#users-1-${id})`}>
        {animated && <animate attributeName="r" values="4;4.3;4" dur="2s" repeatCount="indefinite" />}
      </circle>
      <path d="M3 21V19C3 16.7909 4.79086 15 7 15H11C13.2091 15 15 16.7909 15 19V21" fill={`url(#users-1-${id})`} />
      
      <circle cx="16" cy="7" r="3" fill={`url(#users-2-${id})`}>
        {animated && <animate attributeName="r" values="3;3.2;3" dur="2s" begin="0.5s" repeatCount="indefinite" />}
      </circle>
      <path d="M17 15C18.306 15 19.4175 15.8348 20.1573 17C20.691 17.8348 21 18.8744 21 20V21H17" fill={`url(#users-2-${id})`} />
      
      <circle cx="7.5" cy="5.5" r="1" fill="white" fillOpacity="0.4" />
    </svg>
  )
}

export default PremiumUsers
