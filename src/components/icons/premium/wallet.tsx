'use client'

import React from 'react'

interface PremiumWalletProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumWallet = ({ className, size = 24, animated = false }: PremiumWalletProps) => {
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
        <linearGradient id={`wallet-body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id={`wallet-flap-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
        <linearGradient id={`wallet-coin-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      
      <rect x="2" y="6" width="20" height="14" rx="2" fill={`url(#wallet-body-${id})`} />
      <path d="M2 8C2 6.89543 2.89543 6 4 6H20C21.1046 6 22 6.89543 22 8V10H2V8Z" fill={`url(#wallet-flap-${id})`} />
      <rect x="16" y="12" width="6" height="4" rx="1" fill={`url(#wallet-flap-${id})`} />
      <circle cx="18" cy="14" r="1.5" fill={`url(#wallet-coin-${id})`}>
        {animated && <animate attributeName="r" values="1.5;2;1.5" dur="1s" repeatCount="indefinite" />}
      </circle>
      <rect x="2" y="6" width="10" height="4" rx="1" fill="white" fillOpacity="0.2" />
    </svg>
  )
}

export default PremiumWallet
