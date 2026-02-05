'use client'

import React from 'react'

interface PremiumGitBranchProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumGitBranch = ({ className, size = 24, animated = false }: PremiumGitBranchProps) => {
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
        <linearGradient id={`git-main-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <linearGradient id={`git-branch-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        <linearGradient id={`git-line-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      
      <line x1="6" y1="3" x2="6" y2="15" stroke={`url(#git-line-${id})`} strokeWidth="2.5" strokeLinecap="round">
        {animated && <animate attributeName="stroke-dasharray" values="0,20;20,0" dur="1.5s" repeatCount="indefinite" />}
      </line>
      <path d="M18 9C18 10.5 17 12 15 13C13 14 9 15 6 15" stroke={`url(#git-line-${id})`} strokeWidth="2" strokeLinecap="round" fill="none">
        {animated && <animate attributeName="stroke-dasharray" values="0,30;30,0" dur="1.5s" begin="0.3s" repeatCount="indefinite" />}
      </path>
      
      <circle cx="6" cy="18" r="3" fill={`url(#git-main-${id})`} />
      <circle cx="18" cy="6" r="3" fill={`url(#git-branch-${id})`} />
      
      <circle cx="5" cy="17" r="1" fill="white" fillOpacity="0.4" />
      <circle cx="17" cy="5" r="1" fill="white" fillOpacity="0.4" />
    </svg>
  )
}

export default PremiumGitBranch
