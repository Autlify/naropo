import React from 'react'

interface AnalyticsProps {
  className?: string
  size?: number
}

const Analytics = ({ className, size = 24 }: AnalyticsProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background bars */}
      <rect x="3" y="12" width="4" height="9" rx="1" className="fill-[#C8CDD8] transition-all" />
      <rect x="10" y="8" width="4" height="13" rx="1" className="fill-[#C8CDD8] transition-all" />
      <rect x="17" y="3" width="4" height="18" rx="1" className="fill-[#C8CDD8] transition-all" />
      {/* Overlay for depth */}
      <rect x="5" y="12" width="2" height="9" rx="0.5" className="fill-[#70799A] transition-all" />
      <rect x="12" y="8" width="2" height="13" rx="0.5" className="fill-[#70799A] transition-all" />
      <rect x="19" y="3" width="2" height="18" rx="0.5" className="fill-[#70799A] transition-all" />
    </svg>
  )
}

export default Analytics
