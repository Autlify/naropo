import React from 'react'

type Props = {
  children: React.ReactNode
}

const BlurPage = ({ children }: Props) => {
  return (
    <div
      className="absolute inset-0 z-[11] mx-auto h-screen overflow-y-auto overflow-x-hidden surface-translucent px-4 pb-8 pt-28 sm:px-6 lg:px-8"
      id="blur-page"
    >
      {children}
    </div>
  )
}

export default BlurPage
