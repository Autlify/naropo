'use client'

import React from 'react'

interface PremiumRocketProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumRocket = ({ className, size = 24, animated = false }: PremiumRocketProps) => {
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
        <linearGradient id={`rocket-body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="50%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
        <linearGradient id={`rocket-accent-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F87171" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
        <linearGradient id={`rocket-flame-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="50%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
        <linearGradient id={`rocket-window-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <filter id={`rocket-glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Rocket body */}
      <path
        d="M12 2C12 2 5 9 5 15C5 17.5 7 19 9 19L9 22H15L15 19C17 19 19 17.5 19 15C19 9 12 2 12 2Z"
        fill={`url(#rocket-body-${id})`}
      />
      
      {/* Fins */}
      <path
        d="M5 15C5 15 3 16 3 18L6 18C5.5 17 5 16 5 15Z"
        fill={`url(#rocket-accent-${id})`}
      />
      <path
        d="M19 15C19 15 21 16 21 18L18 18C18.5 17 19 16 19 15Z"
        fill={`url(#rocket-accent-${id})`}
      />
      
      {/* Window */}
      <circle cx="12" cy="10" r="3" fill={`url(#rocket-window-${id})`} />
      <circle cx="11" cy="9" r="1" fill="white" fillOpacity="0.6" />
      
      {/* Flame */}
      <path
        d="M10 22C10 22 10 24 12 24C14 24 14 22 14 22"
        fill={`url(#rocket-flame-${id})`}
      >
        {animated && (
          <animate
            attributeName="d"
            values="M10 22C10 22 10 24 12 24C14 24 14 22 14 22;M10 22C10 22 9 25 12 26C15 25 14 22 14 22;M10 22C10 22 10 24 12 24C14 24 14 22 14 22"
            dur="0.5s"
            repeatCount="indefinite"
          />
        )}
      </path>
      <path
        d="M11 22C11 22 11 23.5 12 23.5C13 23.5 13 22 13 22"
        fill="#FEF3C7"
      >
        {animated && (
          <animate
            attributeName="d"
            values="M11 22C11 22 11 23.5 12 23.5C13 23.5 13 22 13 22;M11 22C11 22 10.5 24 12 24.5C13.5 24 13 22 13 22;M11 22C11 22 11 23.5 12 23.5C13 23.5 13 22 13 22"
            dur="0.5s"
            repeatCount="indefinite"
          />
        )}
      </path>
      
      {/* Shine on body */}
      <path
        d="M12 2C12 2 8 6 6.5 11C6.5 11 8 9 12 9V2Z"
        fill="white"
        fillOpacity="0.3"
      />
    </svg>
  )
}

export default PremiumRocket
