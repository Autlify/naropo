'use client'

import React from 'react'

interface PremiumImageProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumImage = ({ className, size = 24, animated = false }: PremiumImageProps) => {
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
        <linearGradient id={`image-frame-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id={`image-sky-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`image-sun-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
        <linearGradient id={`image-mountain-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      
      <rect x="3" y="3" width="18" height="18" rx="2" fill={`url(#image-sky-${id})`} />
      <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke={`url(#image-frame-${id})`} strokeWidth="2" />
      
      <circle cx="8.5" cy="8.5" r="2.5" fill={`url(#image-sun-${id})`}>
        {animated && <animate attributeName="r" values="2.5;3;2.5" dur="2s" repeatCount="indefinite" />}
      </circle>
      
      <path d="M21 15L16 10L5 21H19C20.1046 21 21 20.1046 21 19V15Z" fill={`url(#image-mountain-${id})`} />
      <path d="M3 17V19C3 20.1046 3.89543 21 5 21H8L12 15L9 12L3 17Z" fill="#059669" />
      
      <rect x="3" y="3" width="9" height="6" rx="1" fill="white" fillOpacity="0.15" />
    </svg>
  )
}

export default PremiumImage
