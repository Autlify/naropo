'use client'
import { ProgressCircle } from '@tremor/react'
import React from 'react'

type Props = {
  value: number
  description: React.ReactNode
}

const CircleProgress = ({ description, value = 0 }: Props) => {
  const safeValue = Number.isFinite(value) && value > 0 ? value : 0
  return (
    <div className="flex gap-4 items-center">
      <ProgressCircle
        showAnimation={true}
        value={safeValue}
        radius={70}
        strokeWidth={20}
      >
        {safeValue !== 0 ? `${safeValue}%` : '0%'}
      </ProgressCircle>
      <div>
        <b>Closing Rate</b>
        <div className="text-muted-foreground">{description}</div>
      </div>
    </div>
  )
}

export default CircleProgress
