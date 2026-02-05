'use client'

import React from 'react'

interface PremiumListTreeProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumListTree = ({ className, size = 24, animated = false }: PremiumListTreeProps) => {
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
        <linearGradient id={`tree-line-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
        <linearGradient id={`tree-node1-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`tree-node2-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id={`tree-node3-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      
      <path d="M6 4V20" stroke={`url(#tree-line-${id})`} strokeWidth="2" strokeLinecap="round">
        {animated && <animate attributeName="stroke-dasharray" values="0,30;30,0" dur="1.5s" repeatCount="indefinite" />}
      </path>
      <path d="M6 8H14" stroke={`url(#tree-line-${id})`} strokeWidth="2" strokeLinecap="round" />
      <path d="M6 14H12" stroke={`url(#tree-line-${id})`} strokeWidth="2" strokeLinecap="round" />
      <path d="M6 20H16" stroke={`url(#tree-line-${id})`} strokeWidth="2" strokeLinecap="round" />
      
      <circle cx="17" cy="8" r="3" fill={`url(#tree-node1-${id})`} />
      <circle cx="15" cy="14" r="3" fill={`url(#tree-node2-${id})`} />
      <circle cx="19" cy="20" r="3" fill={`url(#tree-node3-${id})`} />
      
      <circle cx="16" cy="7" r="1" fill="white" fillOpacity="0.4" />
      <circle cx="14" cy="13" r="1" fill="white" fillOpacity="0.4" />
      <circle cx="18" cy="19" r="1" fill="white" fillOpacity="0.4" />
    </svg>
  )
}

export default PremiumListTree
