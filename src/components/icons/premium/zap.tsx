'use client'

import React from 'react'

interface PremiumZapProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumZap = ({ className, size = 24, animated = false }: PremiumZapProps) => {
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
        <linearGradient id={`zap-gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id={`zap-shine-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <filter id={`zap-glow-${id}`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Glow effect */}
      {animated && (
        <path
          d="M13 2L4 14H11L10 22L19 10H12L13 2Z"
          fill={`url(#zap-gradient-${id})`}
          opacity="0.4"
          filter={`url(#zap-glow-${id})`}
        >
          <animate
            attributeName="opacity"
            values="0.4;0.8;0.4"
            dur="1s"
            repeatCount="indefinite"
          />
        </path>
      )}
      
      {/* Main lightning bolt */}
      <path
        d="M13 2L4 14H11L10 22L19 10H12L13 2Z"
        fill={`url(#zap-gradient-${id})`}
      />
      
      {/* Shine overlay */}
      <path
        d="M13 2L4 14H11L10 22L12 19V10H13L13 2Z"
        fill={`url(#zap-shine-${id})`}
      />
      
      {/* Sparkle effects */}
      <circle cx="8" cy="8" r="1" fill="#FEF3C7">
        {animated && (
          <animate
            attributeName="opacity"
            values="1;0.3;1"
            dur="1.5s"
            repeatCount="indefinite"
          />
        )}
      </circle>
      <circle cx="16" cy="16" r="0.75" fill="#FEF3C7">
        {animated && (
          <animate
            attributeName="opacity"
            values="0.3;1;0.3"
            dur="1.5s"
            repeatCount="indefinite"
          />
        )}
      </circle>
    </svg>
  )
}

export default PremiumZap
