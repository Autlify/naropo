'use client'

import React from 'react'

interface PremiumCalendarProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumCalendar = ({ className, size = 24, animated = false }: PremiumCalendarProps) => {
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
        <linearGradient id={`cal-body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F87171" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
        <linearGradient id={`cal-page-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FECACA" />
          <stop offset="100%" stopColor="#FCA5A5" />
        </linearGradient>
      </defs>
      
      <rect x="3" y="4" width="18" height="18" rx="2" fill={`url(#cal-body-${id})`} />
      <rect x="3" y="10" width="18" height="12" rx="1" fill={`url(#cal-page-${id})`} />
      <line x1="8" y1="2" x2="8" y2="6" stroke={`url(#cal-body-${id})`} strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="2" x2="16" y2="6" stroke={`url(#cal-body-${id})`} strokeWidth="2" strokeLinecap="round" />
      
      <rect x="6" y="13" width="3" height="2" rx="0.5" fill="#EF4444" fillOpacity="0.3" />
      <rect x="10.5" y="13" width="3" height="2" rx="0.5" fill="#EF4444" fillOpacity="0.3" />
      <rect x="15" y="13" width="3" height="2" rx="0.5" fill="#EF4444" fillOpacity="0.3" />
      <rect x="6" y="17" width="3" height="2" rx="0.5" fill="#EF4444" fillOpacity="0.3" />
      <rect x="10.5" y="17" width="3" height="2" rx="0.5" fill="#EF4444">
        {animated && <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite" />}
      </rect>
      <rect x="15" y="17" width="3" height="2" rx="0.5" fill="#EF4444" fillOpacity="0.3" />
      
      <rect x="3" y="4" width="9" height="6" rx="1" fill="white" fillOpacity="0.2" />
    </svg>
  )
}

export default PremiumCalendar
