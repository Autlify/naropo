'use client'

import React from 'react'

interface PremiumTrashProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumTrash = ({ className, size = 24, animated = false }: PremiumTrashProps) => {
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
        <linearGradient id={`trash-body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F87171" />
          <stop offset="100%" stopColor="#EF4444" />
        </linearGradient>
        <linearGradient id={`trash-lid-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCA5A5" />
          <stop offset="100%" stopColor="#F87171" />
        </linearGradient>
      </defs>
      
      <path d="M3 6H21" stroke={`url(#trash-lid-${id})`} strokeWidth="2.5" strokeLinecap="round">
        {animated && <animate attributeName="transform" values="translate(0,0);translate(0,-1);translate(0,0)" dur="0.5s" repeatCount="indefinite" />}
      </path>
      <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6" stroke={`url(#trash-lid-${id})`} strokeWidth="2" strokeLinecap="round" fill="none">
        {animated && <animate attributeName="transform" values="translate(0,0);translate(0,-1);translate(0,0)" dur="0.5s" repeatCount="indefinite" />}
      </path>
      
      <path d="M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6" fill={`url(#trash-body-${id})`} />
      
      <line x1="10" y1="11" x2="10" y2="17" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="11" x2="14" y2="17" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" />
      
      <path d="M5 6H11V12L5 14V6Z" fill="white" fillOpacity="0.15" />
    </svg>
  )
}

export default PremiumTrash
