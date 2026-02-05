'use client'

import React from 'react'

interface PremiumNotificationProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumNotification = ({ className, size = 24, animated = false }: PremiumNotificationProps) => {
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
        <linearGradient id={`notif-bell-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        <linearGradient id={`notif-dot-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F87171" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
        <filter id={`notif-glow-${id}`}>
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" fill={`url(#notif-bell-${id})`} filter={`url(#notif-glow-${id})`}>
        {animated && (
          <animateTransform attributeName="transform" type="rotate" values="-5 12 2;5 12 2;-5 12 2" dur="0.5s" repeatCount="indefinite" />
        )}
      </path>
      <path d="M13.73 21C13.5542 21.3031 13.3018 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke={`url(#notif-bell-${id})`} strokeWidth="2" strokeLinecap="round" fill="none" />
      
      <circle cx="18" cy="5" r="4" fill={`url(#notif-dot-${id})`}>
        {animated && <animate attributeName="r" values="4;4.5;4" dur="1s" repeatCount="indefinite" />}
      </circle>
      
      <path d="M6 8C6 6.4087 6.63214 4.88258 7.75736 3.75736C8.88258 2.63214 10.4087 2 12 2V10H6V8Z" fill="white" fillOpacity="0.2" />
    </svg>
  )
}

export default PremiumNotification
