'use client'

import React from 'react'

interface PremiumDownloadProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumDownload = ({ className, size = 24, animated = false }: PremiumDownloadProps) => {
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
        <linearGradient id={`download-cloud-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`download-arrow-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      
      <path d="M8 17L12 21L16 17" stroke={`url(#download-arrow-${id})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {animated && <animate attributeName="transform" values="translate(0,0);translate(0,2);translate(0,0)" dur="1s" repeatCount="indefinite" />}
      </path>
      <path d="M12 12V21" stroke={`url(#download-arrow-${id})`} strokeWidth="2.5" strokeLinecap="round" fill="none">
        {animated && <animate attributeName="transform" values="translate(0,0);translate(0,2);translate(0,0)" dur="1s" repeatCount="indefinite" />}
      </path>
      
      <path d="M20.88 18.09C21.7169 17.4786 22.3093 16.5952 22.5534 15.5914C22.7976 14.5875 22.6774 13.5291 22.2148 12.607C21.7522 11.6848 20.9768 10.9573 20.0271 10.5546C19.0773 10.1518 18.0166 10.1009 17.032 10.411C16.7052 9.13913 16.0269 7.98732 15.0782 7.09212C14.1295 6.19692 12.9495 5.59509 11.6739 5.3564C10.3984 5.11771 9.08209 5.25271 7.88229 5.74595C6.6825 6.23919 5.65131 7.07022 4.91301 8.13717C4.17471 9.20413 3.76093 10.4607 3.72025 11.7584C3.67957 13.0561 4.01371 14.3369 4.68367 15.4487C5.35362 16.5606 6.3317 17.4541 7.50089 18.0209C8.67008 18.5878 9.98131 18.8042 11.28 18.645" stroke={`url(#download-cloud-${id})`} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export default PremiumDownload
