'use client'

import React from 'react'

interface PremiumHomeProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumHome = ({ className, size = 24, animated = false }: PremiumHomeProps) => {
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
        <linearGradient id={`home-roof-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`home-body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
        <linearGradient id={`home-door-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <filter id={`home-glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {animated && (
        <path
          d="M3 10L12 3L21 10V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V10Z"
          fill={`url(#home-body-${id})`}
          opacity="0.3"
          filter={`url(#home-glow-${id})`}
        >
          <animate attributeName="opacity" values="0.3;0.5;0.3" dur="2s" repeatCount="indefinite" />
        </path>
      )}
      
      <path d="M12 3L21 10V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V10L12 3Z" fill={`url(#home-body-${id})`} />
      <path d="M12 3L21 10L12 10L3 10L12 3Z" fill={`url(#home-roof-${id})`} />
      <rect x="9" y="14" width="6" height="7" rx="0.5" fill={`url(#home-door-${id})`} />
      <circle cx="13.5" cy="17.5" r="0.5" fill="#92400E" />
      <path d="M3 10L12 3L12 10H3Z" fill="white" fillOpacity="0.2" />
    </svg>
  )
}

export default PremiumHome
