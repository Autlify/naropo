'use client'

import React from 'react'

interface PremiumStarProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumStar = ({ className, size = 24, animated = false }: PremiumStarProps) => {
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
        <linearGradient id={`star-gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="50%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
        <linearGradient id={`star-face-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id={`star-shine-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <filter id={`star-glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Glow effect */}
      {animated && (
        <path
          d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z"
          fill={`url(#star-gradient-${id})`}
          opacity="0.4"
          filter={`url(#star-glow-${id})`}
        >
          <animate
            attributeName="opacity"
            values="0.4;0.7;0.4"
            dur="2s"
            repeatCount="indefinite"
          />
        </path>
      )}
      
      {/* Left half of star */}
      <path
        d="M12 2L9.91 8.26L3 9.27L8 14.14L6.82 21.02L12 17.77V2Z"
        fill={`url(#star-gradient-${id})`}
      />
      
      {/* Right half of star (darker) */}
      <path
        d="M12 2V17.77L17.18 21.02L16 14.14L21 9.27L14.09 8.26L12 2Z"
        fill={`url(#star-face-${id})`}
      />
      
      {/* Shine overlay */}
      <path
        d="M12 2L9.91 8.26L3 9.27L8 14.14L12 12V2Z"
        fill={`url(#star-shine-${id})`}
      />
      
      {/* Center highlight */}
      <circle cx="12" cy="12" r="2" fill="#FEF3C7" fillOpacity="0.6" />
    </svg>
  )
}

export default PremiumStar
