'use client'

import React from 'react'

interface PremiumChartOfAccountsProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumChartOfAccounts = ({ className, size = 24, animated = false }: PremiumChartOfAccountsProps) => {
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
        <linearGradient id={`coa-tree-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`coa-asset-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id={`coa-liability-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F87171" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
        <linearGradient id={`coa-equity-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      
      <path d="M6 5V19" stroke={`url(#coa-tree-${id})`} strokeWidth="2" strokeLinecap="round">
        {animated && <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="1s" repeatCount="indefinite" />}
      </path>
      <path d="M6 7H11" stroke={`url(#coa-tree-${id})`} strokeWidth="2" strokeLinecap="round" />
      <path d="M6 12H11" stroke={`url(#coa-tree-${id})`} strokeWidth="2" strokeLinecap="round" />
      <path d="M6 17H11" stroke={`url(#coa-tree-${id})`} strokeWidth="2" strokeLinecap="round" />
      
      <rect x="13" y="4" width="8" height="4" rx="1" fill={`url(#coa-asset-${id})`}>
        {animated && <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite" />}
      </rect>
      <text x="14.5" y="7" fontSize="3" fill="white" fontWeight="bold">AST</text>
      
      <rect x="13" y="10" width="8" height="4" rx="1" fill={`url(#coa-liability-${id})`}>
        {animated && <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" begin="0.3s" repeatCount="indefinite" />}
      </rect>
      <text x="14.5" y="13" fontSize="3" fill="white" fontWeight="bold">LIA</text>
      
      <rect x="13" y="16" width="8" height="4" rx="1" fill={`url(#coa-equity-${id})`}>
        {animated && <animate attributeName="opacity" values="1;0.7;1" dur="2s" begin="0.6s" repeatCount="indefinite" />}
      </rect>
      <text x="14.5" y="19" fontSize="3" fill="white" fontWeight="bold">EQT</text>
      
      <circle cx="4" cy="5" r="2" fill={`url(#coa-tree-${id})`} />
    </svg>
  )
}

export default PremiumChartOfAccounts
