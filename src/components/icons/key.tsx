import React from 'react'

interface KeyProps {
  className?: string
  size?: number
}

const Key = ({ className, size = 24 }: KeyProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="8" cy="15" r="5" className="fill-[#C8CDD8] transition-all" />
      <circle cx="8" cy="15" r="2" className="fill-[#70799A] transition-all" />
      <path
        d="M12 11L21 2"
        stroke="#C8CDD8"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M12 11L21 2"
        stroke="#70799A"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M18 5L21 5L21 8"
        stroke="#70799A"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

export default Key
