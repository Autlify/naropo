'use client'

import React from 'react'

interface PremiumCrownProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumCrown = ({ className, size = 24, animated = false }: PremiumCrownProps) => {
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
        <linearGradient id={`crown-gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FF8C00" />
        </linearGradient>
        <linearGradient id={`crown-shine-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <filter id={`crown-glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Glow effect */}
      {animated && (
        <path
          d="M4 15L2 6L7 10L12 4L17 10L22 6L20 15H4Z"
          fill={`url(#crown-gradient-${id})`}
          opacity="0.3"
          filter={`url(#crown-glow-${id})`}
        >
          <animate
            attributeName="opacity"
            values="0.3;0.6;0.3"
            dur="2s"
            repeatCount="indefinite"
          />
        </path>
      )}
      
      {/* Main crown body */}
      <path
        d="M4 15L2 6L7 10L12 4L17 10L22 6L20 15H4Z"
        fill={`url(#crown-gradient-${id})`}
      />
      
      {/* Shine overlay */}
      <path
        d="M4 15L2 6L7 10L12 4L12 15H4Z"
        fill={`url(#crown-shine-${id})`}
      />
      
      {/* Jewels */}
      <circle cx="12" cy="7" r="1.5" fill="#E74C3C" />
      <circle cx="7" cy="11" r="1" fill="#3498DB" />
      <circle cx="17" cy="11" r="1" fill="#2ECC71" />
      
      {/* Base band */}
      <path
        d="M4 17H20V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V17Z"
        fill={`url(#crown-gradient-${id})`}
      />
      <rect x="4" y="17" width="16" height="1" fill={`url(#crown-shine-${id})`} />
    </svg>
  )
}

export default PremiumCrown
