'use client'

import React from 'react'

interface PremiumRefreshProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumRefresh = ({ className, size = 24, animated = false }: PremiumRefreshProps) => {
  const id = React.useId()
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={animated ? { animation: 'spin 2s linear infinite' } : {}}
    >
      <defs>
        <linearGradient id={`refresh-1-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`refresh-2-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
      </defs>
      
      <path d="M1 4V10H7" stroke={`url(#refresh-1-${id})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M23 20V14H17" stroke={`url(#refresh-2-${id})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      
      <path d="M20.49 9C19.9828 7.56678 19.1209 6.2854 17.9845 5.27542C16.8482 4.26543 15.4745 3.55976 13.9917 3.22426C12.5089 2.88875 10.9652 2.93434 9.50481 3.35677C8.04437 3.77921 6.71475 4.5645 5.64 5.64L1 10" stroke={`url(#refresh-1-${id})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M23 14L18.36 18.36C17.2853 19.4355 15.9556 20.2208 14.4952 20.6432C13.0348 21.0657 11.4911 21.1113 10.0083 20.7757C8.52547 20.4402 7.1518 19.7346 6.01547 18.7246C4.87913 17.7146 4.01717 16.4332 3.51 15" stroke={`url(#refresh-2-${id})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  )
}

export default PremiumRefresh
