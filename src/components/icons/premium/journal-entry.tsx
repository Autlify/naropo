'use client'

import React from 'react'

interface PremiumJournalEntryProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumJournalEntry = ({ className, size = 24, animated = false }: PremiumJournalEntryProps) => {
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
        <linearGradient id={`je-book-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id={`je-page-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>
        <linearGradient id={`je-pen-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      
      <rect x="4" y="2" width="16" height="20" rx="2" fill={`url(#je-book-${id})`} />
      <rect x="6" y="4" width="12" height="16" rx="1" fill={`url(#je-page-${id})`} />
      
      <line x1="8" y1="8" x2="16" y2="8" stroke="#94A3B8" strokeWidth="1" />
      <line x1="8" y1="11" x2="16" y2="11" stroke="#94A3B8" strokeWidth="1" />
      <line x1="8" y1="14" x2="16" y2="14" stroke="#94A3B8" strokeWidth="1" />
      <line x1="8" y1="17" x2="16" y2="17" stroke="#94A3B8" strokeWidth="1" />
      
      <path d="M20 7L18 9L16 7L17.5 5.5C17.7 5.3 18 5.3 18.2 5.5L20 7Z" fill={`url(#je-pen-${id})`}>
        {animated && <animateTransform attributeName="transform" type="rotate" values="0 18 7;5 18 7;0 18 7" dur="0.5s" repeatCount="indefinite" />}
      </path>
      
      <rect x="4" y="2" width="4" height="10" rx="1" fill="white" fillOpacity="0.15" />
    </svg>
  )
}

export default PremiumJournalEntry
