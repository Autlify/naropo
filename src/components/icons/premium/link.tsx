'use client'

import React from 'react'

interface PremiumLinkProps {
  className?: string
  size?: number
  animated?: boolean
}

const PremiumLink = ({ className, size = 24, animated = false }: PremiumLinkProps) => {
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
        <linearGradient id={`link-1-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id={`link-2-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      
      <path d="M10 13C10.4295 13.5741 10.9774 14.0492 11.6066 14.3929C12.2357 14.7367 12.9315 14.9411 13.6467 14.9923C14.3618 15.0435 15.0796 14.9404 15.7513 14.6898C16.4231 14.4392 17.0331 14.047 17.54 13.54L20.54 10.54C21.4508 9.59699 21.9548 8.33397 21.9434 7.02299C21.932 5.71201 21.4061 4.45795 20.4791 3.5309C19.5521 2.60385 18.298 2.07802 16.987 2.0666C15.676 2.05518 14.413 2.55921 13.47 3.47L11.75 5.18" stroke={`url(#link-1-${id})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {animated && <animate attributeName="stroke-dasharray" values="0,100;50,50;0,100" dur="2s" repeatCount="indefinite" />}
      </path>
      <path d="M14 11C13.5705 10.4259 13.0226 9.95078 12.3935 9.60703C11.7643 9.26327 11.0685 9.05885 10.3534 9.00763C9.63821 8.95641 8.92041 9.05963 8.24866 9.3102C7.5769 9.56077 6.96689 9.95296 6.46 10.46L3.46 13.46C2.54921 14.403 2.04519 15.666 2.0566 16.977C2.06802 18.288 2.59385 19.542 3.52091 20.4691C4.44796 21.3962 5.70201 21.922 7.01299 21.9334C8.32398 21.9448 9.58699 21.4408 10.53 20.53L12.24 18.82" stroke={`url(#link-2-${id})`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {animated && <animate attributeName="stroke-dasharray" values="50,50;0,100;50,50" dur="2s" repeatCount="indefinite" />}
      </path>
    </svg>
  )
}

export default PremiumLink
