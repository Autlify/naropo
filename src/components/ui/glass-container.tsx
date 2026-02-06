'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface GlassContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Inner container props */
  innerClassName?: string
  /** Whether to show the noise overlay effect */
  showNoise?: boolean
  /** Border radius for outer container */
  outerRadius?: number
  /** Border radius for inner container */
  innerRadius?: number
  /** Padding between outer and inner */
  padding?: number
}

/**
 * GlassContainer - Premium frosted glass effect container
 * 
 * @example
 * ```tsx
 * <GlassContainer>
 *   <p>Your content here</p>
 * </GlassContainer>
 * 
 * // With custom styling
 * <GlassContainer 
 *   className="max-w-md" 
 *   innerClassName="p-6"
 *   outerRadius={24}
 * >
 *   <h2>Glass Card</h2>
 * </GlassContainer>
 * ```
 */
export function GlassContainer({
  children,
  className,
  innerClassName,
  showNoise = true,
  outerRadius = 18,
  innerRadius = 10,
  padding = 8,
  style,
  ...props
}: GlassContainerProps) {
  return (
    <>
      {/* SVG Noise Filter - renders once, hidden */}
      <NoiseFilter />
      
      <div
        className={cn('glass-outer', className)}
        style={{
          borderRadius: outerRadius,
          padding,
          ...style,
        }}
        {...props}
      >
        <div
          className={cn('glass-inner', innerClassName)}
          style={{ borderRadius: innerRadius }}
          data-noise={showNoise}
        >
          {children}
        </div>
      </div>
    </>
  )
}

/**
 * NoiseFilter - SVG filter for grain/noise texture effect
 * Automatically included with GlassContainer, but can be used standalone
 */
export function NoiseFilter() {
  return (
    <svg
      aria-hidden="true"
      style={{
        position: 'absolute',
        width: 0,
        height: 0,
        overflow: 'hidden',
      }}
    >
      <filter id="noiseFilter">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.8"
          numOctaves="4"
          stitchTiles="stitch"
        />
      </filter>
    </svg>
  )
}

/**
 * GlassCard - Preset glass container styled as a card
 */
export function GlassCard({
  children,
  className,
  innerClassName,
  ...props
}: GlassContainerProps) {
  return (
    <GlassContainer
      className={cn('w-full', className)}
      innerClassName={cn('p-6', innerClassName)}
      {...props}
    >
      {children}
    </GlassContainer>
  )
}

/**
 * GlassPanel - Preset glass container for larger panels/sections
 */
export function GlassPanel({
  children,
  className,
  innerClassName,
  ...props
}: GlassContainerProps) {
  return (
    <GlassContainer
      outerRadius={24}
      innerRadius={16}
      padding={10}
      className={cn('w-full', className)}
      innerClassName={cn('p-8', innerClassName)}
      {...props}
    >
      {children}
    </GlassContainer>
  )
}

export default GlassContainer
