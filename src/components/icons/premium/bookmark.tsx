'use client'

import React from 'react'

interface PremiumBookmarkProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumBookmark = ({ className, size = 24, animated = false }: PremiumBookmarkProps) => {
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
        <linearGradient id={`bookmark-body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <filter id={`bookmark-glow-${id}`}>
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      <path d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z" fill={`url(#bookmark-body-${id})`} filter={`url(#bookmark-glow-${id})`}>
        {animated && <animate attributeName="transform" values="scale(1);scale(1.05);scale(1)" dur="2s" repeatCount="indefinite" />}
      </path>
      
      <path d="M5 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579L5 10V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H5Z" fill="white" fillOpacity="0.3" />
    </svg>
  )
}

export default PremiumBookmark
