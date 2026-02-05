'use client'

import React from 'react'

interface AutlifyLogoModernProps {
  className?: string
  size?: number
  variant?: 'icon' | 'full' | 'compact'
  theme?: 'gradient' | 'light' | 'dark'
  animated?: boolean
}

/**
 * Autlify Modern Logo - Alternative Design
 * 
 * A flowing, dynamic logo with sleek curves and premium feel.
 * Features elegant letterform with speed lines representing efficiency.
 */
const AutlifyLogoModern = ({ 
  className, 
  size = 40, 
  variant = 'icon',
  theme = 'gradient',
  animated = false 
}: AutlifyLogoModernProps) => {
  const id = React.useId()

  const fullWidth = variant === 'full' ? size * 4.5 : variant === 'compact' ? size * 1.5 : size
  const fullHeight = variant === 'compact' ? size * 1.6 : size

  const renderDefs = () => (
    <defs>
      {/* Primary gradient - rich blue */}
      <linearGradient id={`modern-primary-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563EB">
          {animated && <animate attributeName="stop-color" values="#2563EB;#3B82F6;#2563EB" dur="3s" repeatCount="indefinite" />}
        </stop>
        <stop offset="100%" stopColor="#3B82F6">
          {animated && <animate attributeName="stop-color" values="#3B82F6;#60A5FA;#3B82F6" dur="3s" repeatCount="indefinite" />}
        </stop>
      </linearGradient>
      
      {/* Accent gradient - cyan */}
      <linearGradient id={`modern-accent-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0EA5E9" />
        <stop offset="100%" stopColor="#38BDF8" />
      </linearGradient>
      
      {/* Glow effect */}
      <filter id={`modern-glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  )

  const getTextColor = () => {
    if (theme === 'dark') return '#F8FAFC'
    if (theme === 'light') return '#0F172A'
    return '#F8FAFC'
  }

  const renderIcon = () => (
    <g filter={animated ? `url(#modern-glow-${id})` : undefined}>
      {/* Speed lines - dynamic motion effect */}
      <g opacity="0.85">
        <path 
          d="M2 20 L10 20"
          stroke={`url(#modern-accent-${id})`}
          strokeWidth="3"
          strokeLinecap="round"
        >
          {animated && (
            <animate attributeName="opacity" values="0.85;0.4;0.85" dur="1.2s" repeatCount="indefinite" />
          )}
        </path>
        <path 
          d="M0 26 L8 26"
          stroke={`url(#modern-accent-${id})`}
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          {animated && (
            <animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.2s" begin="0.15s" repeatCount="indefinite" />
          )}
        </path>
        <path 
          d="M3 32 L9 32"
          stroke={`url(#modern-accent-${id})`}
          strokeWidth="2"
          strokeLinecap="round"
        >
          {animated && (
            <animate attributeName="opacity" values="0.6;0.25;0.6" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
          )}
        </path>
      </g>
      
      {/* Main solid A shape - bold and clean */}
      <path 
        d="M22 4 L38 36 L31 36 L27.5 28 L16.5 28 L13 36 L6 36 L22 4 Z M22 14 L18 24 L26 24 L22 14 Z"
        fill={`url(#modern-primary-${id})`}
        fillRule="evenodd"
      >
        {animated && (
          <animate attributeName="opacity" values="1;0.92;1" dur="3s" repeatCount="indefinite" />
        )}
      </path>
    </g>
  )

  if (variant === 'icon') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {renderDefs()}
        {renderIcon()}
      </svg>
    )
  }

  if (variant === 'full') {
    return (
      <svg
        width={fullWidth}
        height={fullHeight}
        viewBox="0 0 180 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {renderDefs()}
        {renderIcon()}
        
        <text 
          x="50" 
          y="28" 
          fontSize="22" 
          fontWeight="600" 
          fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
          fill={getTextColor()}
          letterSpacing="-0.02em"
        >
          Autlify
        </text>
      </svg>
    )
  }

  // Compact variant
  return (
    <svg
      width={fullWidth}
      height={fullHeight}
      viewBox="0 0 60 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {renderDefs()}
      <g transform="translate(10, 0)">
        {renderIcon()}
      </g>
      
      <text 
        x="30" 
        y="56" 
        fontSize="11" 
        fontWeight="600" 
        fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
        fill={getTextColor()}
        textAnchor="middle"
        letterSpacing="-0.02em"
      >
        Autlify
      </text>
    </svg>
  )
}

export default AutlifyLogoModern
