import React from 'react'

const Roles = () => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Badge/ID card representing roles */}
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
        className="fill-[#C8CDD8] text-xl transition-all"
      />
      {/* Badge ribbon */}
      <path
        d="M3 6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6V8H3V6Z"
        className="fill-[#70799A] text-xl transition-all"
      />
      {/* Person icon on badge */}
      <circle
        cx="9"
        cy="13"
        r="2"
        className="fill-[#70799A] text-xl transition-all"
      />
      <path
        d="M6 18C6 16.3431 7.34315 15 9 15C10.6569 15 12 16.3431 12 18V20H6V18Z"
        className="fill-[#70799A] text-xl transition-all"
      />
      {/* Lines representing role info */}
      <rect
        x="14"
        y="12"
        width="4"
        height="2"
        rx="1"
        className="fill-[#70799A] text-xl transition-all"
      />
      <rect
        x="14"
        y="16"
        width="3"
        height="2"
        rx="1"
        className="fill-[#70799A] text-xl transition-all"
      />
    </svg>
  )
}

export default Roles
