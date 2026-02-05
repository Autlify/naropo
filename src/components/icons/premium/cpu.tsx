'use client'

import React from 'react'

interface PremiumCpuProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumCpu = ({ className, size = 24, animated = false }: PremiumCpuProps) => {
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
        <linearGradient id={`cpu-body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id={`cpu-core-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id={`cpu-pins-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
      </defs>
      
      <rect x="5" y="5" width="14" height="14" rx="2" fill={`url(#cpu-body-${id})`} />
      <rect x="8" y="8" width="8" height="8" rx="1" fill={`url(#cpu-core-${id})`}>
        {animated && <animate attributeName="opacity" values="1;0.6;1" dur="1.5s" repeatCount="indefinite" />}
      </rect>
      
      <line x1="9" y1="2" x2="9" y2="5" stroke={`url(#cpu-pins-${id})`} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="2" x2="12" y2="5" stroke={`url(#cpu-pins-${id})`} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="15" y1="2" x2="15" y2="5" stroke={`url(#cpu-pins-${id})`} strokeWidth="1.5" strokeLinecap="round" />
      
      <line x1="9" y1="19" x2="9" y2="22" stroke={`url(#cpu-pins-${id})`} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="19" x2="12" y2="22" stroke={`url(#cpu-pins-${id})`} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="15" y1="19" x2="15" y2="22" stroke={`url(#cpu-pins-${id})`} strokeWidth="1.5" strokeLinecap="round" />
      
      <line x1="2" y1="9" x2="5" y2="9" stroke={`url(#cpu-pins-${id})`} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="2" y1="12" x2="5" y2="12" stroke={`url(#cpu-pins-${id})`} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="2" y1="15" x2="5" y2="15" stroke={`url(#cpu-pins-${id})`} strokeWidth="1.5" strokeLinecap="round" />
      
      <line x1="19" y1="9" x2="22" y2="9" stroke={`url(#cpu-pins-${id})`} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="19" y1="12" x2="22" y2="12" stroke={`url(#cpu-pins-${id})`} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="19" y1="15" x2="22" y2="15" stroke={`url(#cpu-pins-${id})`} strokeWidth="1.5" strokeLinecap="round" />
      
      <rect x="5" y="5" width="7" height="7" rx="1" fill="white" fillOpacity="0.1" />
    </svg>
  )
}

export default PremiumCpu
