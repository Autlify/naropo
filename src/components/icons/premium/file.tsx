'use client'

import React from 'react'

interface PremiumFileProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumFile = ({ className, size = 24, animated = false }: PremiumFileProps) => {
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
        <linearGradient id={`file-body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
        <linearGradient id={`file-fold-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
        <linearGradient id={`file-accent-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      
      <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" fill={`url(#file-body-${id})`} />
      <path d="M14 2V8H20L14 2Z" fill={`url(#file-fold-${id})`} />
      
      <rect x="8" y="12" width="8" height="1.5" rx="0.75" fill={`url(#file-accent-${id})`}>
        {animated && <animate attributeName="width" values="8;6;8" dur="2s" repeatCount="indefinite" />}
      </rect>
      <rect x="8" y="15" width="6" height="1.5" rx="0.75" fill={`url(#file-accent-${id})`} fillOpacity="0.5" />
      <rect x="8" y="18" width="4" height="1.5" rx="0.75" fill={`url(#file-accent-${id})`} fillOpacity="0.3" />
      
      <path d="M4 4C4 3.46957 4.21071 2.96086 4.58579 2.58579C4.96086 2.21071 5.46957 2 6 2H14L4 12V4Z" fill="white" fillOpacity="0.2" />
    </svg>
  )
}

export default PremiumFile
