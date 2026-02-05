import React from 'react'

interface TeamProps {
  className?: string
  size?: number
}

const Team = ({ className, size = 24 }: TeamProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Center person */}
      <circle cx="12" cy="7" r="3" className="fill-[#C8CDD8] transition-all" />
      <path
        d="M12 12C8.68629 12 6 14.6863 6 18V20H18V18C18 14.6863 15.3137 12 12 12Z"
        className="fill-[#C8CDD8] transition-all"
      />
      {/* Left person */}
      <circle cx="5" cy="9" r="2" className="fill-[#70799A] transition-all" />
      <path
        d="M5 13C3.34315 13 2 14.3431 2 16V18H8V16C8 14.3431 6.65685 13 5 13Z"
        className="fill-[#70799A] transition-all"
      />
      {/* Right person */}
      <circle cx="19" cy="9" r="2" className="fill-[#70799A] transition-all" />
      <path
        d="M19 13C17.3431 13 16 14.3431 16 16V18H22V16C22 14.3431 20.6569 13 19 13Z"
        className="fill-[#70799A] transition-all"
      />
    </svg>
  )
}

export default Team
