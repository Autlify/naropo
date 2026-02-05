'use client'

import React from 'react'

interface PremiumPowerProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumPower = ({ className, size = 24, animated = false }: PremiumPowerProps) => {
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
        <linearGradient id={`power-ring-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id={`power-line-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
        <filter id={`power-glow-${id}`}>
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      <path d="M18.36 6.64C19.6184 7.89879 20.4753 9.50244 20.8223 11.2482C21.1693 12.994 20.9916 14.8034 20.3107 16.4478C19.6299 18.0921 18.4754 19.4976 17.0011 20.4864C15.5268 21.4752 13.7989 22.0005 12.0311 22C10.2634 21.9995 8.53588 21.4733 7.06213 20.4836C5.58839 19.4939 4.43466 18.0876 3.75479 16.4429C3.07492 14.7981 2.89828 12.9886 3.24628 11.243C3.59428 9.49747 4.45204 7.8943 5.71101 6.63599" stroke={`url(#power-ring-${id})`} strokeWidth="2.5" strokeLinecap="round" fill="none" filter={`url(#power-glow-${id})`}>
        {animated && <animate attributeName="stroke-dasharray" values="0,100;100,0" dur="2s" repeatCount="indefinite" />}
      </path>
      
      <line x1="12" y1="2" x2="12" y2="12" stroke={`url(#power-line-${id})`} strokeWidth="3" strokeLinecap="round">
        {animated && <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite" />}
      </line>
    </svg>
  )
}

export default PremiumPower
