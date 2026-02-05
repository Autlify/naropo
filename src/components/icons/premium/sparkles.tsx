'use client'

import React from 'react'

interface PremiumSparklesProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumSparkles = ({ className, size = 24, animated = false }: PremiumSparklesProps) => {
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
        <linearGradient id={`sparkle-main-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id={`sparkle-accent-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
        <filter id={`sparkle-glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Main sparkle with glow */}
      {animated && (
        <path
          d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
          fill={`url(#sparkle-main-${id})`}
          opacity="0.4"
          filter={`url(#sparkle-glow-${id})`}
        >
          <animate
            attributeName="opacity"
            values="0.4;0.7;0.4"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </path>
      )}
      
      {/* Main sparkle */}
      <path
        d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z"
        fill={`url(#sparkle-main-${id})`}
      />
      
      {/* Center highlight */}
      <circle cx="12" cy="12" r="1.5" fill="white" fillOpacity="0.6" />
      
      {/* Small sparkle top right */}
      <path
        d="M19 2L19.8 4.2L22 5L19.8 5.8L19 8L18.2 5.8L16 5L18.2 4.2L19 2Z"
        fill={`url(#sparkle-accent-${id})`}
      >
        {animated && (
          <animate
            attributeName="opacity"
            values="1;0.4;1"
            dur="2s"
            repeatCount="indefinite"
          />
        )}
      </path>
      
      {/* Small sparkle bottom left */}
      <path
        d="M5 16L5.6 17.4L7 18L5.6 18.6L5 20L4.4 18.6L3 18L4.4 17.4L5 16Z"
        fill={`url(#sparkle-accent-${id})`}
      >
        {animated && (
          <animate
            attributeName="opacity"
            values="0.4;1;0.4"
            dur="2s"
            begin="0.5s"
            repeatCount="indefinite"
          />
        )}
      </path>
    </svg>
  )
}

export default PremiumSparkles
