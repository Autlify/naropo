'use client'

import React from 'react'

interface PremiumTrophyProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumTrophy = ({ className, size = 24, animated = false }: PremiumTrophyProps) => {
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
        <linearGradient id={`trophy-cup-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id={`trophy-base-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <filter id={`trophy-glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {animated && (
        <path
          d="M6 2H18V9C18 12.3137 15.3137 15 12 15C8.68629 15 6 12.3137 6 9V2Z"
          fill={`url(#trophy-cup-${id})`}
          opacity="0.4"
          filter={`url(#trophy-glow-${id})`}
        >
          <animate attributeName="opacity" values="0.4;0.7;0.4" dur="2s" repeatCount="indefinite" />
        </path>
      )}
      
      <path d="M6 2H18V9C18 12.3137 15.3137 15 12 15C8.68629 15 6 12.3137 6 9V2Z" fill={`url(#trophy-cup-${id})`} />
      
      <path d="M6 4H3C3 7 4.5 9 6 9V4Z" fill={`url(#trophy-cup-${id})`} />
      <path d="M18 4H21C21 7 19.5 9 18 9V4Z" fill={`url(#trophy-cup-${id})`} />
      
      <rect x="10" y="15" width="4" height="4" fill={`url(#trophy-base-${id})`} />
      <rect x="7" y="19" width="10" height="3" rx="1" fill={`url(#trophy-base-${id})`} />
      
      <path d="M12 6L12.5 8H14L13 9L13.5 11L12 10L10.5 11L11 9L10 8H11.5L12 6Z" fill="white" fillOpacity="0.5" />
      <path d="M6 2H12V9C12 9 6 9 6 2Z" fill="white" fillOpacity="0.15" />
    </svg>
  )
}

export default PremiumTrophy
