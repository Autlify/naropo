'use client'

import React from 'react'

interface PremiumMailProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumMail = ({ className, size = 24, animated = false }: PremiumMailProps) => {
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
        <linearGradient id={`mail-body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <linearGradient id={`mail-flap-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBCFE8" />
          <stop offset="100%" stopColor="#F9A8D4" />
        </linearGradient>
      </defs>
      
      <rect x="2" y="4" width="20" height="16" rx="2" fill={`url(#mail-body-${id})`} />
      <path d="M2 6L12 13L22 6" stroke={`url(#mail-flap-${id})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {animated && <animate attributeName="stroke-opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />}
      </path>
      <path d="M2 6L12 13L22 6V8L12 15L2 8V6Z" fill={`url(#mail-flap-${id})`} />
      <rect x="2" y="4" width="10" height="6" rx="1" fill="white" fillOpacity="0.2" />
    </svg>
  )
}

export default PremiumMail
