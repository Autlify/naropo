import React from 'react'

interface ZapProps {
  className?: string
  size?: number
}

const Zap = ({ className, size = 24 }: ZapProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M13 2L4 14H11L10 22L19 10H12L13 2Z"
        className="fill-[#C8CDD8] transition-all"
      />
      <path
        d="M13 2L12 10H19L10 22L11 14H4L13 2Z"
        className="fill-[#70799A] transition-all"
        fillOpacity="0.6"
      />
    </svg>
  )
}

export default Zap
