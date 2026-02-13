import React from 'react'

const Policy = () => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Document background */}
      <path
        d="M6 2C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2H6Z"
        className="fill-[#C8CDD8] text-xl transition-all"
      />
      {/* Document fold */}
      <path
        d="M14 2V6C14 7.10457 14.8954 8 16 8H20L14 2Z"
        className="fill-[#70799A] text-xl transition-all"
      />
      {/* Shield on document - representing policy */}
      <path
        d="M12 10C12 10 8 11.5 8 14V16.5C8 18.5 10 20 12 21C14 20 16 18.5 16 16.5V14C16 11.5 12 10 12 10Z"
        className="fill-[#70799A] text-xl transition-all"
      />
      {/* Checkmark on shield */}
      <path
        d="M10 15L11.5 16.5L14 14"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default Policy
