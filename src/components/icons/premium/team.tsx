'use client'

import React from 'react'

interface PremiumTeamProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumTeam = ({ className, size = 24, animated = false }: PremiumTeamProps) => {
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
        <linearGradient id={`team-primary-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id={`team-secondary-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
        <linearGradient id={`team-tertiary-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A7F3D0" />
          <stop offset="100%" stopColor="#6EE7B7" />
        </linearGradient>
        <filter id={`team-glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Center person (main) */}
      <circle cx="12" cy="7" r="3.5" fill={`url(#team-primary-${id})`} />
      <path
        d="M12 12C8.13401 12 5 15.134 5 19V21H19V19C19 15.134 15.866 12 12 12Z"
        fill={`url(#team-primary-${id})`}
      />
      
      {/* Left person */}
      <circle cx="4.5" cy="9" r="2.5" fill={`url(#team-secondary-${id})`}>
        {animated && (
          <animate
            attributeName="opacity"
            values="1;0.7;1"
            dur="2s"
            repeatCount="indefinite"
          />
        )}
      </circle>
      <path
        d="M4.5 13C2.29086 13 0.5 14.7909 0.5 17V19H8.5V17C8.5 14.7909 6.70914 13 4.5 13Z"
        fill={`url(#team-secondary-${id})`}
      >
        {animated && (
          <animate
            attributeName="opacity"
            values="1;0.7;1"
            dur="2s"
            repeatCount="indefinite"
          />
        )}
      </path>
      
      {/* Right person */}
      <circle cx="19.5" cy="9" r="2.5" fill={`url(#team-tertiary-${id})`}>
        {animated && (
          <animate
            attributeName="opacity"
            values="1;0.7;1"
            dur="2s"
            begin="0.5s"
            repeatCount="indefinite"
          />
        )}
      </circle>
      <path
        d="M19.5 13C17.2909 13 15.5 14.7909 15.5 17V19H23.5V17C23.5 14.7909 21.7091 13 19.5 13Z"
        fill={`url(#team-tertiary-${id})`}
      >
        {animated && (
          <animate
            attributeName="opacity"
            values="1;0.7;1"
            dur="2s"
            begin="0.5s"
            repeatCount="indefinite"
          />
        )}
      </path>
      
      {/* Shine on center person */}
      <circle cx="10.5" cy="5.5" r="1" fill="white" fillOpacity="0.4" />
    </svg>
  )
}

export default PremiumTeam
