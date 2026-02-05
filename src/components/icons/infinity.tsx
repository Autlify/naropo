import React from 'react'

interface InfinityProps {
  className?: string
  size?: number
}

const Infinity = ({ className, size = 24 }: InfinityProps) => {
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
        d="M18.178 8C19.545 8 20.823 8.42 21.828 9.235C23.39 10.5 23.39 13.5 21.828 14.765C20.823 15.58 19.545 16 18.178 16C16.811 16 15.533 15.58 14.528 14.765L12 12L14.528 9.235C15.533 8.42 16.811 8 18.178 8Z"
        className="fill-[#C8CDD8] transition-all"
      />
      <path
        d="M5.822 8C4.455 8 3.177 8.42 2.172 9.235C0.61 10.5 0.61 13.5 2.172 14.765C3.177 15.58 4.455 16 5.822 16C7.189 16 8.467 15.58 9.472 14.765L12 12L9.472 9.235C8.467 8.42 7.189 8 5.822 8Z"
        className="fill-[#70799A] transition-all"
      />
    </svg>
  )
}

export default Infinity
