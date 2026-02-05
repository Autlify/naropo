import React from 'react'

interface DiamondProps {
  className?: string
  size?: number
}

const Diamond = ({ className, size = 24 }: DiamondProps) => {
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
        d="M6 3H18L22 9L12 21L2 9L6 3Z"
        className="fill-[#C8CDD8] transition-all"
      />
      <path
        d="M12 3L12 21L22 9L18 3H12Z"
        className="fill-[#70799A] transition-all"
      />
      <path
        d="M2 9H22L12 21L2 9Z"
        className="fill-[#70799A] transition-all"
        fillOpacity="0.3"
      />
      <path
        d="M6 3L9 9H15L18 3"
        stroke="#70799A"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

export default Diamond
