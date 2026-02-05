'use client'

import React from 'react'

interface PremiumMessagesProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumMessages = ({ className, size = 24, animated = false }: PremiumMessagesProps) => {
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
        <linearGradient id={`msgs-1-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`msgs-2-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      
      <path d="M21 11C21 11.88 20.82 12.72 20.5 13.5C20.02 14.76 19.23 15.85 18.21 16.68C17.19 17.51 15.99 18.04 14.71 18.23C14.48 18.27 14.25 18.29 14.01 18.3L10 22V18C8.34315 18 7.34315 18 6.17157 16.8284C5 15.6569 5 14 5 12V11C5 8.87 5.86 6.84 7.37 5.34C8.88 3.83 10.91 2.96 13.04 3C15.16 3.03 17.18 3.95 18.65 5.49C20.12 7.03 20.96 9.07 20.01 11.01" fill={`url(#msgs-1-${id})`}>
        {animated && <animate attributeName="opacity" values="1;0.8;1" dur="2s" repeatCount="indefinite" />}
      </path>
      
      <path d="M3 15C3 14.12 3.18 13.28 3.5 12.5C3.98 11.24 4.77 10.15 5.79 9.32C6.81 8.49 8.01 7.96 9.29 7.77C9.52 7.73 9.75 7.71 9.99 7.7L14 4V8C15.6569 8 16.6569 8 17.8284 9.17157C19 10.3431 19 12 19 14V15C19 17.13 18.14 19.16 16.63 20.66C15.12 22.17 13.09 23.04 10.96 23C8.84 22.97 6.82 22.05 5.35 20.51C3.88 18.97 3.04 16.93 3.99 14.99" fill={`url(#msgs-2-${id})`} transform="translate(-0.5, 1) scale(0.7)" opacity="0.7" />
      
      <circle cx="10" cy="11" r="1" fill="white" fillOpacity="0.7">
        {animated && <animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.5s" repeatCount="indefinite" />}
      </circle>
      <circle cx="13" cy="11" r="1" fill="white" fillOpacity="0.7">
        {animated && <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.5s" repeatCount="indefinite" />}
      </circle>
      <circle cx="16" cy="11" r="1" fill="white" fillOpacity="0.7">
        {animated && <animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.5s" begin="0.2s" repeatCount="indefinite" />}
      </circle>
      
      <path d="M5 11C5 8.87 5.86 6.84 7.37 5.34L13 11H5Z" fill="white" fillOpacity="0.15" />
    </svg>
  )
}

export default PremiumMessages
