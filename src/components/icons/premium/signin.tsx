'use client'

import React from 'react'

interface PremiumSigninProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumSignin = ({ className, size = 24, animated = false }: PremiumSigninProps) => {
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
        <linearGradient id={`signin-door-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`signin-arrow-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      
      <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H15" stroke={`url(#signin-door-${id})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      
      <path d="M10 17L15 12L10 7" stroke={`url(#signin-arrow-${id})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {animated && <animate attributeName="transform" values="translate(0,0);translate(2,0);translate(0,0)" dur="1s" repeatCount="indefinite" />}
      </path>
      <line x1="3" y1="12" x2="15" y2="12" stroke={`url(#signin-arrow-${id})`} strokeWidth="2.5" strokeLinecap="round">
        {animated && <animate attributeName="x2" values="15;17;15" dur="1s" repeatCount="indefinite" />}
      </line>
    </svg>
  )
}

export default PremiumSignin
