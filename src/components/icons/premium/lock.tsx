'use client'

import React from 'react'

interface PremiumLockProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumLock = ({ className, size = 24, animated = false }: PremiumLockProps) => {
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
        <linearGradient id={`lock-body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FF8C00" />
        </linearGradient>
        <linearGradient id={`lock-shackle-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
        <linearGradient id={`lock-shine-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <filter id={`lock-glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Shackle */}
      <path
        d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11"
        stroke={`url(#lock-shackle-${id})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      
      {/* Glow effect */}
      {animated && (
        <rect
          x="5"
          y="10"
          width="14"
          height="12"
          rx="2"
          fill={`url(#lock-body-${id})`}
          opacity="0.4"
          filter={`url(#lock-glow-${id})`}
        >
          <animate
            attributeName="opacity"
            values="0.4;0.7;0.4"
            dur="2s"
            repeatCount="indefinite"
          />
        </rect>
      )}
      
      {/* Lock body */}
      <rect
        x="5"
        y="10"
        width="14"
        height="12"
        rx="2"
        fill={`url(#lock-body-${id})`}
      />
      
      {/* Shine overlay */}
      <rect
        x="5"
        y="10"
        width="7"
        height="12"
        rx="2"
        fill={`url(#lock-shine-${id})`}
      />
      
      {/* Keyhole */}
      <circle cx="12" cy="15" r="1.5" fill="#92400E" />
      <path
        d="M11 15.5L11.5 19H12.5L13 15.5"
        fill="#92400E"
      />
    </svg>
  )
}

export default PremiumLock
