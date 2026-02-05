'use client'

import React from 'react'

interface PremiumCompassProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumCompass = ({ className, size = 24, animated = false }: PremiumCompassProps) => {
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
        <linearGradient id={`compass-ring-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
        <linearGradient id={`compass-north-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
        <linearGradient id={`compass-south-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
      </defs>
      
      <circle cx="12" cy="12" r="10" fill="none" stroke={`url(#compass-ring-${id})`} strokeWidth="2" />
      <circle cx="12" cy="12" r="8" fill="#1E293B" />
      
      <g style={animated ? { animation: 'spin 4s linear infinite', transformOrigin: 'center' } : {}}>
        <polygon points="12,4 10,12 12,10 14,12" fill={`url(#compass-north-${id})`} />
        <polygon points="12,20 14,12 12,14 10,12" fill={`url(#compass-south-${id})`} />
      </g>
      
      <circle cx="12" cy="12" r="2" fill="#475569" />
      <circle cx="12" cy="12" r="1" fill="#94A3B8" />
      
      <text x="12" y="4" textAnchor="middle" fill="#94A3B8" fontSize="3" fontWeight="bold">N</text>
      <text x="12" y="22" textAnchor="middle" fill="#64748B" fontSize="3">S</text>
      <text x="21" y="13" textAnchor="middle" fill="#64748B" fontSize="3">E</text>
      <text x="3" y="13" textAnchor="middle" fill="#64748B" fontSize="3">W</text>
    </svg>
  )
}

export default PremiumCompass
