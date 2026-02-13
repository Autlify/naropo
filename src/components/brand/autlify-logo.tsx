'use client'

import React from 'react'

interface AutlifyLogoProps {
  className?: string
  size?: number
  variant?: 'icon' | 'full' | 'compact'
  theme?: 'gradient' | 'light' | 'dark'
  animated?: boolean
}

/**
 * Autlify Premium Brand Logo
 * 
 * A sleek, modern logo with flowing lines forming an abstract "A"
 * Represents: Automation, Flow, Connectivity, Premium Quality
 */
const AutlifyLogo = ({ 
  className, 
  size = 40, 
  variant = 'icon',
  theme = 'gradient',
  animated = false 
}: AutlifyLogoProps) => {
  const id = React.useId()
  
  const fullWidth = variant === 'full' ? size * 4.5 : variant === 'compact' ? size * 1.5 : size
  const fullHeight = variant === 'compact' ? size * 1.6 : size

  const renderDefs = () => (
    <defs>
      {/* Primary gradient - deep blue to bright blue */}
      <linearGradient id={`logo-primary-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1E3A5F">
          {animated && <animate attributeName="stop-color" values="#1E3A5F;#2563EB;#1E3A5F" dur="4s" repeatCount="indefinite" />}
        </stop>
        <stop offset="50%" stopColor="#2563EB" />
        <stop offset="100%" stopColor="#3B82F6">
          {animated && <animate attributeName="stop-color" values="#3B82F6;#1E3A5F;#3B82F6" dur="4s" repeatCount="indefinite" />}
        </stop>
      </linearGradient>
      
      {/* Secondary gradient - cyan accent */}
      <linearGradient id={`logo-secondary-${id}`} x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0EA5E9" />
        <stop offset="100%" stopColor="#22D3EE" />
      </linearGradient>
      
      {/* Glow filter */}
      <filter id={`logo-glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
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
    <g filter={animated ? `url(#logo-glow-${id})` : undefined}>
      {/* Solid A shape - clean modern lettermark */}
      <path 
        d="M20 2 L36 38 L29 38 L25.5 29 L14.5 29 L11 38 L4 38 L20 2 Z M20 12 L16 25 L24 25 L20 12 Z"
        fill={`url(#logo-primary-${id})`}
        fillRule="evenodd"
      >
        {animated && (
          <animate attributeName="opacity" values="1;0.92;1" dur="3s" repeatCount="indefinite" />
        )}
      </path>
      
      {/* Subtle accent triangle below crossbar */}
      <path 
        d="M20 32 L23 38 L17 38 Z"
        fill={`url(#logo-secondary-${id})`}
        opacity="0.9"
      >
        {animated && (
          <animate attributeName="opacity" values="0.9;0.6;0.9" dur="2s" repeatCount="indefinite" />
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

export default AutlifyLogo
