'use client'

import React from 'react'

interface PremiumDiamondProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumDiamond = ({ className, size = 24, animated = false }: PremiumDiamondProps) => {
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
        <linearGradient id={`diamond-gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#67E8F9" />
          <stop offset="50%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id={`diamond-face-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#0891B2" />
        </linearGradient>
        <linearGradient id={`diamond-shine-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <filter id={`diamond-glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Glow effect */}
      {animated && (
        <path
          d="M6 3H18L22 9L12 21L2 9L6 3Z"
          fill={`url(#diamond-gradient-${id})`}
          opacity="0.3"
          filter={`url(#diamond-glow-${id})`}
        >
          <animate
            attributeName="opacity"
            values="0.3;0.6;0.3"
            dur="2s"
            repeatCount="indefinite"
          />
        </path>
      )}
      
      {/* Top facet */}
      <path
        d="M6 3H18L22 9H2L6 3Z"
        fill={`url(#diamond-gradient-${id})`}
      />
      
      {/* Left face */}
      <path
        d="M2 9L12 21L12 9H2Z"
        fill={`url(#diamond-gradient-${id})`}
      />
      
      {/* Right face */}
      <path
        d="M22 9L12 21L12 9H22Z"
        fill={`url(#diamond-face-${id})`}
      />
      
      {/* Internal facet lines */}
      <path
        d="M9 3L9 9L2 9"
        stroke="white"
        strokeOpacity="0.3"
        strokeWidth="0.5"
        fill="none"
      />
      <path
        d="M15 3L15 9L22 9"
        stroke="white"
        strokeOpacity="0.2"
        strokeWidth="0.5"
        fill="none"
      />
      <path
        d="M9 9L12 21L15 9"
        stroke="white"
        strokeOpacity="0.25"
        strokeWidth="0.5"
        fill="none"
      />
      
      {/* Shine overlay */}
      <path
        d="M6 3H12L9 9H2L6 3Z"
        fill={`url(#diamond-shine-${id})`}
      />
      
      {/* Sparkle */}
      <circle cx="9" cy="6" r="0.75" fill="white" fillOpacity="0.8">
        {animated && (
          <animate
            attributeName="opacity"
            values="0.8;0.3;0.8"
            dur="1.5s"
            repeatCount="indefinite"
          />
        )}
      </circle>
    </svg>
  )
}

export default PremiumDiamond
