import React from 'react'

interface AwardProps {
  className?: string
  size?: number
}

const Award = ({ className, size = 24 }: AwardProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="12" cy="8" r="6" className="fill-[#C8CDD8] transition-all" />
      <path
        d="M8.5 13.5L7 22L12 19L17 22L15.5 13.5"
        className="fill-[#70799A] transition-all"
      />
      <circle cx="12" cy="8" r="3" className="fill-[#70799A] transition-all" />
    </svg>
  )
}

export default Award
