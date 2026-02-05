'use client'

import React from 'react'

interface PremiumShieldProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumShield = ({ className, size = 24, animated = false }: PremiumShieldProps) => {
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
        <linearGradient id={`shield-gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id={`shield-shine-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`check-gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <filter id={`shield-glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Glow effect */}
      {animated && (
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M3 6.66228C3 5.37099 3.82629 4.22457 5.05132 3.81623L11.0513 1.81623C11.6671 1.61096 12.3329 1.61096 12.9487 1.81623L18.9487 3.81623C20.1737 4.22457 21 5.37099 21 6.66228V12C21 17.502 15.4398 20.8417 13.0601 22.0192C12.3875 22.3519 11.6125 22.3519 10.9399 22.0192C8.56019 20.8417 3 17.502 3 12V6.66228Z"
          fill={`url(#shield-gradient-${id})`}
          opacity="0.3"
          filter={`url(#shield-glow-${id})`}
        >
          <animate
            attributeName="opacity"
            values="0.3;0.5;0.3"
            dur="2s"
            repeatCount="indefinite"
          />
        </path>
      )}
      
      {/* Main shield */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3 6.66228C3 5.37099 3.82629 4.22457 5.05132 3.81623L11.0513 1.81623C11.6671 1.61096 12.3329 1.61096 12.9487 1.81623L18.9487 3.81623C20.1737 4.22457 21 5.37099 21 6.66228V12C21 17.502 15.4398 20.8417 13.0601 22.0192C12.3875 22.3519 11.6125 22.3519 10.9399 22.0192C8.56019 20.8417 3 17.502 3 12V6.66228Z"
        fill={`url(#shield-gradient-${id})`}
      />
      
      {/* Shine overlay */}
      <path
        d="M3 6.66228C3 5.37099 3.82629 4.22457 5.05132 3.81623L11.0513 1.81623C11.3326 1.72247 11.6663 1.68 12 1.68V22.27C11.6619 22.2687 11.3238 22.1856 10.9399 22.0192C8.56019 20.8417 3 17.502 3 12V6.66228Z"
        fill={`url(#shield-shine-${id})`}
      />
      
      {/* Checkmark */}
      <path
        d="M16 9L10.5 14.5L8 12"
        stroke={`url(#check-gradient-${id})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

export default PremiumShield
