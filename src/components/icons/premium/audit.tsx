'use client'

import React from 'react'

interface PremiumAuditProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumAudit = ({ className, size = 24, animated = false }: PremiumAuditProps) => {
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
        <linearGradient id={`audit-doc-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        <linearGradient id={`audit-mag-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`audit-check-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      
      <rect x="3" y="2" width="14" height="18" rx="2" fill={`url(#audit-doc-${id})`} />
      
      <rect x="5" y="5" width="8" height="1.5" rx="0.75" fill="#64748B" />
      <rect x="5" y="8" width="6" height="1.5" rx="0.75" fill="#64748B" fillOpacity="0.5" />
      <rect x="5" y="11" width="7" height="1.5" rx="0.75" fill="#64748B" fillOpacity="0.5" />
      
      <circle cx="17" cy="15" r="5" fill="none" stroke={`url(#audit-mag-${id})`} strokeWidth="2">
        {animated && <animate attributeName="r" values="5;5.5;5" dur="1.5s" repeatCount="indefinite" />}
      </circle>
      <line x1="21" y1="19" x2="23" y2="21" stroke={`url(#audit-mag-${id})`} strokeWidth="2.5" strokeLinecap="round" />
      
      <circle cx="17" cy="15" r="3" fill="white" fillOpacity="0.8" />
      <path d="M15.5 15L16.5 16L18.5 14" stroke={`url(#audit-check-${id})`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {animated && <animate attributeName="stroke-dasharray" values="0,10;10,0" dur="0.8s" repeatCount="indefinite" />}
      </path>
      
      <rect x="3" y="2" width="7" height="6" rx="1" fill="white" fillOpacity="0.3" />
    </svg>
  )
}

export default PremiumAudit
