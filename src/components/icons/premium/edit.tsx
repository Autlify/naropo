'use client'

import React from 'react'

interface PremiumEditProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumEdit = ({ className, size = 24, animated = false }: PremiumEditProps) => {
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
        <linearGradient id={`edit-pen-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`edit-tip-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#FBBF24" />
        </linearGradient>
      </defs>
      
      <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      
      <path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" fill={`url(#edit-pen-${id})`}>
        {animated && <animate attributeName="transform" values="translate(0,0);translate(-1,-1);translate(0,0)" dur="0.5s" repeatCount="indefinite" />}
      </path>
      
      <polygon points="9,12 8,16 12,15" fill={`url(#edit-tip-${id})`} />
      
      <path d="M18.5 2.5L21.5 5.5L20 7L17 4L18.5 2.5Z" fill="white" fillOpacity="0.3" />
    </svg>
  )
}

export default PremiumEdit
