'use client'

import React from 'react'

interface PremiumToolsProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumTools = ({ className, size = 24, animated = false }: PremiumToolsProps) => {
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
        <linearGradient id={`tools-wrench-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>
        <linearGradient id={`tools-screw-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      
      <path d="M14.7 6.3C14.5168 6.48693 14.4141 6.73825 14.4141 7C14.4141 7.26175 14.5168 7.51307 14.7 7.7L16.3 9.3C16.4869 9.48322 16.7383 9.58589 17 9.58589C17.2617 9.58589 17.5131 9.48322 17.7 9.3L21.47 5.53C21.9728 6.64934 22.1251 7.89629 21.9065 9.10477C21.6878 10.3133 21.1087 11.4258 20.2431 12.2914C19.3775 13.157 18.265 13.7361 17.0565 13.9548C15.848 14.1734 14.6011 14.0211 13.4818 13.5183L6.32 20.68C5.93556 21.0644 5.41593 21.2809 4.875 21.2809C4.33407 21.2809 3.81444 21.0644 3.43 20.68C3.04556 20.2956 2.82905 19.7759 2.82905 19.235C2.82905 18.6941 3.04556 18.1744 3.43 17.79L10.59 10.63C10.0872 9.51066 9.93494 8.26371 10.1536 7.05523C10.3723 5.84676 10.9513 4.73418 11.8169 3.86858C12.6825 3.00298 13.7951 2.42394 15.0036 2.20526C16.212 1.98658 17.459 2.13884 18.5783 2.64164L14.82 6.4L14.7 6.3Z" fill={`url(#tools-wrench-${id})`}>
        {animated && <animateTransform attributeName="transform" type="rotate" values="0 12 12;-10 12 12;0 12 12" dur="1s" repeatCount="indefinite" />}
      </path>
      
      <circle cx="4.875" cy="19.125" r="1.5" fill={`url(#tools-screw-${id})`} />
      
      <path d="M11.8169 3.86858C11.2 4.5 10.8 5.5 10.8 6.5L16 12L18.5783 2.64164C17.5 2 16 2 15 2.2C14 2.4 12.5 3.2 11.8169 3.86858Z" fill="white" fillOpacity="0.15" />
    </svg>
  )
}

export default PremiumTools
