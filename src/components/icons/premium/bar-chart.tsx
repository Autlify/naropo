'use client'

import React from 'react'

interface PremiumBarChartProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumBarChart = ({ className, size = 24, animated = false }: PremiumBarChartProps) => {
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
        <linearGradient id={`bar1-${id}`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
        <linearGradient id={`bar2-${id}`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
        <linearGradient id={`bar3-${id}`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
      </defs>
      
      <rect x="4" y="12" width="4" height="9" rx="1" fill={`url(#bar1-${id})`}>
        {animated && <animate attributeName="height" values="9;11;9" dur="1.5s" repeatCount="indefinite" />}
        {animated && <animate attributeName="y" values="12;10;12" dur="1.5s" repeatCount="indefinite" />}
      </rect>
      <rect x="10" y="6" width="4" height="15" rx="1" fill={`url(#bar2-${id})`}>
        {animated && <animate attributeName="height" values="15;17;15" dur="1.5s" begin="0.2s" repeatCount="indefinite" />}
        {animated && <animate attributeName="y" values="6;4;6" dur="1.5s" begin="0.2s" repeatCount="indefinite" />}
      </rect>
      <rect x="16" y="3" width="4" height="18" rx="1" fill={`url(#bar3-${id})`}>
        {animated && <animate attributeName="height" values="18;20;18" dur="1.5s" begin="0.4s" repeatCount="indefinite" />}
        {animated && <animate attributeName="y" values="3;1;3" dur="1.5s" begin="0.4s" repeatCount="indefinite" />}
      </rect>
      
      <rect x="4" y="12" width="2" height="4.5" rx="0.5" fill="white" fillOpacity="0.3" />
      <rect x="10" y="6" width="2" height="7.5" rx="0.5" fill="white" fillOpacity="0.3" />
      <rect x="16" y="3" width="2" height="9" rx="0.5" fill="white" fillOpacity="0.3" />
    </svg>
  )
}

export default PremiumBarChart
