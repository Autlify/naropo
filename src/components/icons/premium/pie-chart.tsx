'use client'

import React from 'react'

interface PremiumPieChartProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumPieChart = ({ className, size = 24, animated = false }: PremiumPieChartProps) => {
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
        <linearGradient id={`pie-1-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`pie-2-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id={`pie-3-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      
      <path d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22V12V2Z" fill={`url(#pie-1-${id})`}>
        {animated && <animate attributeName="opacity" values="1;0.8;1" dur="2s" repeatCount="indefinite" />}
      </path>
      <path d="M12 2C6.47715 2 2 6.47715 2 12H12V2Z" fill={`url(#pie-2-${id})`}>
        {animated && <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" begin="0.3s" repeatCount="indefinite" />}
      </path>
      <path d="M2 12C2 17.5228 6.47715 22 12 22V12H2Z" fill={`url(#pie-3-${id})`}>
        {animated && <animate attributeName="opacity" values="1;0.8;1" dur="2s" begin="0.6s" repeatCount="indefinite" />}
      </path>
      
      <circle cx="12" cy="12" r="4" fill="white" fillOpacity="0.15" />
      <ellipse cx="15" cy="7" rx="2" ry="1.5" fill="white" fillOpacity="0.25" />
    </svg>
  )
}

export default PremiumPieChart
