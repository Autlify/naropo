'use client'

import React from 'react'

interface PremiumMapPinProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumMapPin = ({ className, size = 24, animated = false }: PremiumMapPinProps) => {
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
        <linearGradient id={`pin-body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F87171" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
        <linearGradient id={`pin-inner-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCA5A5" />
          <stop offset="100%" stopColor="#F87171" />
        </linearGradient>
        <filter id={`pin-shadow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {animated && (
        <ellipse cx="12" cy="21" rx="4" ry="1" fill="#000" fillOpacity="0.2">
          <animate attributeName="rx" values="4;3;4" dur="1s" repeatCount="indefinite" />
        </ellipse>
      )}
      
      <path
        d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z"
        fill={`url(#pin-body-${id})`}
      >
        {animated && <animate attributeName="transform" values="translate(0,0);translate(0,-2);translate(0,0)" dur="1s" repeatCount="indefinite" />}
      </path>
      
      <circle cx="12" cy="10" r="4" fill={`url(#pin-inner-${id})`} />
      <circle cx="12" cy="10" r="2" fill="white" />
      
      <path d="M3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1V10C12 10 3 10 3 10Z" fill="white" fillOpacity="0.15" />
    </svg>
  )
}

export default PremiumMapPin
