import React from 'react'

const Permissions = () => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Key base */}
      <path
        d="M21 8C21 10.7614 18.7614 13 16 13C15.2922 13 14.6185 12.8514 14.0062 12.5831L11.7071 14.8822L11 14.1751L10.2929 14.8822L9 13.5893L7.70711 14.8822L6.29289 13.4679L4.70711 15.0536L3 13.3465L7.41694 8.92956C7.14858 8.31748 7 7.64305 7 6.93421C7 4.17278 9.23858 1.93421 12 1.93421C14.7614 1.93421 17 4.17278 17 6.93421"
        className="fill-[#C8CDD8] text-xl transition-all"
      />
      {/* Key head with check */}
      <circle
        cx="16"
        cy="8"
        r="5"
        className="fill-[#70799A] text-xl transition-all"
      />
      {/* Checkmark */}
      <path
        d="M14 8L15.5 9.5L18.5 6.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Key teeth */}
      <path
        d="M7 15L5 17L3 19V22H6L8 20L10 18"
        className="fill-[#70799A] text-xl transition-all"
      />
      <rect
        x="4"
        y="19"
        width="2"
        height="2"
        className="fill-[#C8CDD8] text-xl transition-all"
      />
    </svg>
  )
}

export default Permissions
