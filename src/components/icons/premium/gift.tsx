'use client'

import React from 'react'

interface PremiumGiftProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumGift = ({ className, size = 24, animated = false }: PremiumGiftProps) => {
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
        <linearGradient id={`gift-box-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <linearGradient id={`gift-lid-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DB2777" />
          <stop offset="100%" stopColor="#BE185D" />
        </linearGradient>
        <linearGradient id={`gift-ribbon-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      
      <rect x="3" y="8" width="18" height="4" rx="1" fill={`url(#gift-lid-${id})`} />
      <rect x="4" y="12" width="16" height="10" rx="1" fill={`url(#gift-box-${id})`}>
        {animated && <animate attributeName="opacity" values="1;0.85;1" dur="2s" repeatCount="indefinite" />}
      </rect>
      
      <rect x="10.5" y="8" width="3" height="14" fill={`url(#gift-ribbon-${id})`} />
      <rect x="3" y="9" width="18" height="2" fill={`url(#gift-ribbon-${id})`} />
      
      <path d="M12 8C12 8 9 8 7 6C5 4 6.5 2 8 2C9.5 2 12 5 12 8Z" fill={`url(#gift-ribbon-${id})`} />
      <path d="M12 8C12 8 15 8 17 6C19 4 17.5 2 16 2C14.5 2 12 5 12 8Z" fill={`url(#gift-ribbon-${id})`} />
      
      <rect x="3" y="8" width="9" height="4" rx="0.5" fill="white" fillOpacity="0.2" />
    </svg>
  )
}

export default PremiumGift
