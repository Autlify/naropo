'use client'

import React from 'react'

interface PremiumIncomeStatementProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumIncomeStatement = ({ className, size = 24, animated = false }: PremiumIncomeStatementProps) => {
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
        <linearGradient id={`is-revenue-${id}`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
        <linearGradient id={`is-expense-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F87171" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
        <linearGradient id={`is-profit-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      
      <rect x="4" y="4" width="5" height="12" rx="1" fill={`url(#is-revenue-${id})`}>
        {animated && <animate attributeName="height" values="12;14;12" dur="2s" repeatCount="indefinite" />}
      </rect>
      <text x="5.5" y="19" fontSize="3" fill="#10B981" fontWeight="bold">R</text>
      
      <rect x="10" y="8" width="5" height="8" rx="1" fill={`url(#is-expense-${id})`}>
        {animated && <animate attributeName="height" values="8;10;8" dur="2s" begin="0.3s" repeatCount="indefinite" />}
        {animated && <animate attributeName="y" values="8;6;8" dur="2s" begin="0.3s" repeatCount="indefinite" />}
      </rect>
      <text x="11.5" y="19" fontSize="3" fill="#EF4444" fontWeight="bold">E</text>
      
      <rect x="16" y="12" width="5" height="4" rx="1" fill={`url(#is-profit-${id})`}>
        {animated && <animate attributeName="height" values="4;6;4" dur="2s" begin="0.6s" repeatCount="indefinite" />}
        {animated && <animate attributeName="y" values="12;10;12" dur="2s" begin="0.6s" repeatCount="indefinite" />}
      </rect>
      <text x="17.5" y="19" fontSize="3" fill="#F59E0B" fontWeight="bold">P</text>
      
      <line x1="3" y1="16" x2="22" y2="16" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="2,2" />
    </svg>
  )
}

export default PremiumIncomeStatement
