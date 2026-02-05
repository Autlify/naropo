'use client'

import React from 'react'

interface PremiumAnalyticsProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumAnalytics = ({ className, size = 24, animated = false }: PremiumAnalyticsProps) => {
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
        <linearGradient id={`bar1-gradient-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
        <linearGradient id={`bar2-gradient-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id={`bar3-gradient-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
        <filter id={`bar-glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Bar 1 */}
      <rect 
        x="3" 
        y="12" 
        width="5" 
        height="9" 
        rx="1.5" 
        fill={`url(#bar1-gradient-${id})`}
      >
        {animated && (
          <animate
            attributeName="height"
            values="9;11;9"
            dur="1.5s"
            repeatCount="indefinite"
          />
        )}
      </rect>
      
      {/* Bar 2 */}
      <rect 
        x="9.5" 
        y="7" 
        width="5" 
        height="14" 
        rx="1.5" 
        fill={`url(#bar2-gradient-${id})`}
      >
        {animated && (
          <animate
            attributeName="height"
            values="14;12;14"
            dur="1.5s"
            begin="0.3s"
            repeatCount="indefinite"
          />
        )}
      </rect>
      
      {/* Bar 3 */}
      <rect 
        x="16" 
        y="3" 
        width="5" 
        height="18" 
        rx="1.5" 
        fill={`url(#bar3-gradient-${id})`}
      >
        {animated && (
          <animate
            attributeName="height"
            values="18;16;18"
            dur="1.5s"
            begin="0.6s"
            repeatCount="indefinite"
          />
        )}
      </rect>
      
      {/* Shine overlays */}
      <rect x="3" y="12" width="2" height="9" rx="1" fill="white" fillOpacity="0.3" />
      <rect x="9.5" y="7" width="2" height="14" rx="1" fill="white" fillOpacity="0.3" />
      <rect x="16" y="3" width="2" height="18" rx="1" fill="white" fillOpacity="0.3" />
    </svg>
  )
}

export default PremiumAnalytics
