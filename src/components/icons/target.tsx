import React from 'react'

interface TargetProps {
  className?: string
  size?: number
}

const Target = ({ className, size = 24 }: TargetProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="12" cy="12" r="10" className="fill-[#C8CDD8] transition-all" />
      <circle cx="12" cy="12" r="7" className="fill-[#70799A] transition-all" fillOpacity="0.5" />
      <circle cx="12" cy="12" r="4" className="fill-[#C8CDD8] transition-all" />
      <circle cx="12" cy="12" r="1.5" className="fill-[#70799A] transition-all" />
    </svg>
  )
}

export default Target
