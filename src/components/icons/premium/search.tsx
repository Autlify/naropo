'use client'

import React from 'react'

interface PremiumSearchProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumSearch = ({ className, size = 24, animated = false }: PremiumSearchProps) => {
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
        <linearGradient id={`search-glass-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id={`search-handle-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
        <linearGradient id={`search-lens-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      
      <circle cx="11" cy="11" r="8" fill={`url(#search-glass-${id})`}>
        {animated && <animate attributeName="r" values="8;8.3;8" dur="1.5s" repeatCount="indefinite" />}
      </circle>
      <circle cx="11" cy="11" r="5" fill={`url(#search-lens-${id})`} />
      <line x1="16.5" y1="16.5" x2="21" y2="21" stroke={`url(#search-handle-${id})`} strokeWidth="3" strokeLinecap="round" />
      
      <ellipse cx="9" cy="9" rx="2" ry="1.5" fill="white" fillOpacity="0.4" />
    </svg>
  )
}

export default PremiumSearch
