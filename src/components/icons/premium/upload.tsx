'use client'

import React from 'react'

interface PremiumUploadProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumUpload = ({ className, size = 24, animated = false }: PremiumUploadProps) => {
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
        <linearGradient id={`upload-cloud-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`upload-arrow-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
      </defs>
      
      <path d="M16 16L12 12L8 16" stroke={`url(#upload-arrow-${id})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {animated && <animate attributeName="transform" values="translate(0,0);translate(0,-2);translate(0,0)" dur="1s" repeatCount="indefinite" />}
      </path>
      <path d="M12 12V21" stroke={`url(#upload-arrow-${id})`} strokeWidth="2.5" strokeLinecap="round" fill="none">
        {animated && <animate attributeName="transform" values="translate(0,0);translate(0,-2);translate(0,0)" dur="1s" repeatCount="indefinite" />}
      </path>
      
      <path d="M20.39 18.39C21.3653 17.8583 22.1358 17.0169 22.5798 15.9986C23.0239 14.9804 23.1162 13.8432 22.8422 12.7667C22.5682 11.6901 21.9434 10.7355 21.0666 10.0534C20.1899 9.37138 19.1108 9.00073 18 9H16.74C16.4373 7.82924 15.8731 6.74233 15.0899 5.82099C14.3067 4.89965 13.3248 4.16785 12.2181 3.68061C11.1113 3.19336 9.90851 2.96336 8.70008 3.00788C7.49164 3.0524 6.30903 3.37009 5.24114 3.93766C4.17325 4.50523 3.24787 5.30747 2.53458 6.28357C1.82129 7.25967 1.33865 8.38522 1.12294 9.57538C0.90723 10.7655 0.964065 11.9905 1.28917 13.1552C1.61428 14.3199 2.19909 15.3949 2.99997 16.3" stroke={`url(#upload-cloud-${id})`} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export default PremiumUpload
