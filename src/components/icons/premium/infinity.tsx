'use client'

import React from 'react'

interface PremiumInfinityProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumInfinity = ({ className, size = 24, animated = false }: PremiumInfinityProps) => {
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
        <linearGradient id={`infinity-left-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#DB2777" />
        </linearGradient>
        <linearGradient id={`infinity-right-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <filter id={`infinity-glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Glow effect */}
      {animated && (
        <>
          <path
            d="M18.5 8C20 8 21.5 8.5 22.5 9.5C24 11 24 13 22.5 14.5C21.5 15.5 20 16 18.5 16C17 16 15.5 15.5 14.5 14.5L12 12L14.5 9.5C15.5 8.5 17 8 18.5 8Z"
            fill={`url(#infinity-right-${id})`}
            opacity="0.3"
            filter={`url(#infinity-glow-${id})`}
          >
            <animate
              attributeName="opacity"
              values="0.3;0.6;0.3"
              dur="2s"
              repeatCount="indefinite"
            />
          </path>
          <path
            d="M5.5 8C4 8 2.5 8.5 1.5 9.5C0 11 0 13 1.5 14.5C2.5 15.5 4 16 5.5 16C7 16 8.5 15.5 9.5 14.5L12 12L9.5 9.5C8.5 8.5 7 8 5.5 8Z"
            fill={`url(#infinity-left-${id})`}
            opacity="0.3"
            filter={`url(#infinity-glow-${id})`}
          >
            <animate
              attributeName="opacity"
              values="0.3;0.6;0.3"
              dur="2s"
              begin="0.5s"
              repeatCount="indefinite"
            />
          </path>
        </>
      )}
      
      {/* Right loop */}
      <path
        d="M18.5 8C20 8 21.5 8.5 22.5 9.5C24 11 24 13 22.5 14.5C21.5 15.5 20 16 18.5 16C17 16 15.5 15.5 14.5 14.5L12 12L14.5 9.5C15.5 8.5 17 8 18.5 8Z"
        fill={`url(#infinity-right-${id})`}
      />
      
      {/* Left loop */}
      <path
        d="M5.5 8C4 8 2.5 8.5 1.5 9.5C0 11 0 13 1.5 14.5C2.5 15.5 4 16 5.5 16C7 16 8.5 15.5 9.5 14.5L12 12L9.5 9.5C8.5 8.5 7 8 5.5 8Z"
        fill={`url(#infinity-left-${id})`}
      />
      
      {/* Shine overlays */}
      <ellipse cx="5" cy="10.5" rx="1.5" ry="1" fill="white" fillOpacity="0.4" />
      <ellipse cx="19" cy="10.5" rx="1.5" ry="1" fill="white" fillOpacity="0.3" />
    </svg>
  )
}

export default PremiumInfinity
