'use client'

import React from 'react'

interface PremiumAwardProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumAward = ({ className, size = 24, animated = false }: PremiumAwardProps) => {
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
        <linearGradient id={`award-medal-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id={`award-ribbon1-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id={`award-ribbon2-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <filter id={`award-glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {animated && (
        <circle cx="12" cy="8" r="7" fill={`url(#award-medal-${id})`} opacity="0.3" filter={`url(#award-glow-${id})`}>
          <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      
      <path d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88" fill={`url(#award-ribbon1-${id})`} />
      <path d="M12 20L7 23L8.21 13.89L12 15V20Z" fill={`url(#award-ribbon2-${id})`} />
      
      <circle cx="12" cy="8" r="7" fill={`url(#award-medal-${id})`} />
      
      <path d="M12 4L13 6.5H15.5L13.75 8L14.5 10.5L12 9L9.5 10.5L10.25 8L8.5 6.5H11L12 4Z" fill="white" fillOpacity="0.6" />
      
      <ellipse cx="9" cy="5.5" rx="2" ry="1.5" fill="white" fillOpacity="0.25" />
    </svg>
  )
}

export default PremiumAward
