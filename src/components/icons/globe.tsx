import React from 'react'

interface GlobeProps {
  className?: string
  size?: number
}

const Globe = ({ className, size = 24 }: GlobeProps) => {
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
      <path
        d="M12 2C12 2 16 6 16 12C16 18 12 22 12 22"
        stroke="#70799A"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M12 2C12 2 8 6 8 12C8 18 12 22 12 22"
        stroke="#70799A"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M2.5 9H21.5"
        stroke="#70799A"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M2.5 15H21.5"
        stroke="#70799A"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default Globe
