import React from 'react'

const Member = () => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Badge/card background */}
      <rect
        x="4"
        y="3"
        width="16"
        height="18"
        rx="2"
        className="fill-[#C8CDD8] text-xl transition-all"
      />
      {/* Person avatar */}
      <circle
        cx="12"
        cy="9"
        r="3"
        className="fill-[#70799A] text-xl transition-all"
      />
      {/* Person body */}
      <path
        d="M7 18C7 15.2386 9.23858 13 12 13C14.7614 13 17 15.2386 17 18V21H7V18Z"
        className="fill-[#70799A] text-xl transition-all"
      />
    </svg>
  )
}

export default Member
