'use client'

import React from 'react'

interface PremiumBellProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumBell = ({ className, size = 24, animated = false }: PremiumBellProps) => {
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
        <linearGradient id={`bell-body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id={`bell-clapper-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#FCD34D" />
        </linearGradient>
        <filter id={`bell-glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      <g className={animated ? 'origin-top' : ''} style={animated ? { animation: 'swing 1s ease-in-out infinite', transformOrigin: 'top center' } : {}}>
        <path
          d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
          fill={`url(#bell-body-${id})`}
        />
        <path d="M6 8C6 6.4087 6.63214 4.88258 7.75736 3.75736C8.88258 2.63214 10.4087 2 12 2V17H3C3 17 6 15 6 8Z" fill="white" fillOpacity="0.2" />
      </g>
      <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke={`url(#bell-clapper-${id})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      
      {animated && (
        <circle cx="18" cy="5" r="3" fill="#EF4444">
          <animate attributeName="r" values="3;3.5;3" dur="1s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  )
}

export default PremiumBell
