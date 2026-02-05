import React from 'react'

interface CrownProps {
  className?: string
  size?: number
}

const Crown = ({ className, size = 24 }: CrownProps) => {
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
        d="M4 15L2 6L7 10L12 4L17 10L22 6L20 15H4Z"
        className="fill-[#C8CDD8] transition-all"
      />
      <path
        d="M12 4L17 10L22 6L20 15H12V4Z"
        className="fill-[#70799A] transition-all"
      />
      <path
        d="M4 17H20V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V17Z"
        className="fill-[#70799A] transition-all"
      />
    </svg>
  )
}

export default Crown
