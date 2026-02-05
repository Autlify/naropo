'use client'

import React from 'react'

interface PremiumMoonProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumMoon = ({ className, size = 24, animated = false }: PremiumMoonProps) => {
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
        <linearGradient id={`moon-body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id={`moon-glow-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
        <filter id={`moon-glow-${id}`}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      <path d="M21 12.79C20.8427 14.4922 20.2039 16.1144 19.1583 17.4668C18.1127 18.8192 16.7035 19.8458 15.0957 20.4265C13.4879 21.0073 11.7481 21.1181 10.0795 20.7461C8.41083 20.3741 6.88376 19.5345 5.67425 18.325C4.46473 17.1155 3.62512 15.5884 3.25314 13.9198C2.88116 12.2512 2.99191 10.5114 3.57268 8.90359C4.15345 7.29581 5.18007 5.88665 6.53249 4.84104C7.88491 3.79543 9.50711 3.15663 11.2093 2.99936C10.2134 4.34094 9.73387 6.00814 9.86336 7.6857C9.99286 9.36327 10.7225 10.9367 11.9217 12.1359C13.1209 13.3351 14.6943 14.0647 16.3719 14.1942C18.0494 14.3237 19.7166 13.8442 21.0582 12.8483" fill={`url(#moon-body-${id})`} filter={`url(#moon-glow-${id})`}>
        {animated && <animate attributeName="opacity" values="1;0.8;1" dur="3s" repeatCount="indefinite" />}
      </path>
      
      <circle cx="8" cy="8" r="1" fill={`url(#moon-glow-grad-${id})`}>
        {animated && <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />}
      </circle>
      <circle cx="18" cy="5" r="0.8" fill={`url(#moon-glow-grad-${id})`}>
        {animated && <animate attributeName="opacity" values="1;0.3;1" dur="2.5s" repeatCount="indefinite" />}
      </circle>
      <circle cx="20" cy="10" r="0.6" fill={`url(#moon-glow-grad-${id})`}>
        {animated && <animate attributeName="opacity" values="0.5;1;0.5" dur="1.8s" repeatCount="indefinite" />}
      </circle>
      
      <path d="M11 3C9 4 8 6 8 8C8 9 9 11 11 12L11.2 3Z" fill="white" fillOpacity="0.15" />
    </svg>
  )
}

export default PremiumMoon
