'use client'

import React from 'react'

interface PremiumInvoiceProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumInvoice = ({ className, size = 24, animated = false }: PremiumInvoiceProps) => {
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
        <linearGradient id={`inv-doc-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        <linearGradient id={`inv-header-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id={`inv-total-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      
      <rect x="4" y="2" width="16" height="20" rx="2" fill={`url(#inv-doc-${id})`} />
      
      <rect x="4" y="2" width="16" height="5" rx="2" fill={`url(#inv-header-${id})`} />
      <text x="8" y="5.5" fontSize="3" fill="white" fontWeight="bold">INVOICE</text>
      
      <rect x="7" y="9" width="5" height="1" rx="0.5" fill="#64748B" />
      <rect x="14" y="9" width="3" height="1" rx="0.5" fill="#64748B" />
      
      <rect x="7" y="11.5" width="4" height="1" rx="0.5" fill="#94A3B8" />
      <rect x="14" y="11.5" width="3" height="1" rx="0.5" fill="#94A3B8" />
      
      <rect x="7" y="14" width="3" height="1" rx="0.5" fill="#94A3B8" />
      <rect x="14" y="14" width="3" height="1" rx="0.5" fill="#94A3B8" />
      
      <line x1="7" y1="17" x2="17" y2="17" stroke="#CBD5E1" strokeWidth="1" />
      
      <rect x="12" y="18" width="5" height="2" rx="0.5" fill={`url(#inv-total-${id})`}>
        {animated && <animate attributeName="opacity" values="1;0.7;1" dur="1.5s" repeatCount="indefinite" />}
      </rect>
    </svg>
  )
}

export default PremiumInvoice
