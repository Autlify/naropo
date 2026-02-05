'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, useMotionValue, useSpring, useTransform, PanInfo, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import LiquidGlass from 'liquid-glass-react'
import GlassSurface, { type GlassSurfaceProps } from '@/components/ui/glass-surface'

export interface SegmentedControl {
  id: string
  label: string
  icon?: React.ReactNode
}

export interface SegmentedControlProps {
  tabs: SegmentedControl[]
  defaultTab?: string
  value?: string
  onValueChange?: (tabId: string) => void
  className?: string
  size?: 'default' | 'sm' | 'lg'
  variant?: 'glass' | 'mercury' | 'frosted'
}

export const SegmentedControl = React.forwardRef<HTMLDivElement, SegmentedControlProps>(
  (
    {
      tabs,
      defaultTab,
      value: controlledValue,
      onValueChange,
      className,
      size = 'default',
      variant = 'mercury',
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(defaultTab || tabs[0]?.id)
    const activeTab = controlledValue ?? internalValue
    const [isDragging, setIsDragging] = useState(false)
    const [dragVelocity, setDragVelocity] = useState(0)
    const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
    const containerRef = useRef<HTMLDivElement | null>(null)
    const innerRef = useRef<HTMLDivElement | null>(null)

    // Motion values for smooth spring physics
    const rawX = useMotionValue(0)
    const glassX = useSpring(rawX, {
      stiffness: 600,
      damping: 40,
      mass: 0.5,
    })

    // Stretch and squash based on velocity
    const scaleX = useTransform(glassX, (x) => {
      const velocity = Math.abs(dragVelocity)
      return 1 + Math.min(velocity * 0.0003, 0.15)
    })
    const scaleY = useTransform(scaleX, (sx) => 1 / Math.sqrt(sx))

    const [glassWidth, setGlassWidth] = useState(0)
    const [tabPositions, setTabPositions] = useState<Map<string, { x: number; width: number }>>(new Map())

    const sizeConfig = {
      sm: {
        containerHeight: 'h-10',
        containerPadding: 4,
        glassHeight: 32,
        glassTop: 4,
        buttonPadding: 'px-4 py-1.5',
        fontSize: 'text-sm',
        cornerRadius: 16,
        gap: 'gap-0.5',
      },
      default: {
        containerHeight: 'h-12',
        containerPadding: 4,
        glassHeight: 40,
        glassTop: 4,
        buttonPadding: 'px-5 py-2',
        fontSize: 'text-sm',
        cornerRadius: 20,
        gap: 'gap-1',
      },
      lg: {
        containerHeight: 'h-14',
        containerPadding: 6,
        glassHeight: 44,
        glassTop: 5,
        buttonPadding: 'px-6 py-2.5',
        fontSize: 'text-base',
        cornerRadius: 22,
        gap: 'gap-1',
      },
    }

    const config = sizeConfig[size]

    const glassStyle = {
      height: isDragging ? config.glassHeight + 10 : config.glassHeight,
      width: isDragging ? glassWidth! + 18 : glassWidth!,
      borderRadius: config.cornerRadius,
      opacity: isDragging ? 0 : 1,
      blur: isDragging ? 10 : 0,
      brightness: isDragging ? 50 : 0,
      displace: isDragging ? 5 : 0,
      backgroundOpacity: isDragging ? 0 : 0,
      saturation: isDragging ? 1.15 : 0,
      distortionScale: isDragging ? 20 : 0,
      redOffset: 0,
      greenOffset: 0,
      blueOffset: 0,
      xChannel: 'R' as const,
      yChannel: 'G' as const,
      mixBlendMode: 'difference' as const,
      style: {
        pointerEvents: 'none',
        color: isDragging ? 'rgba(255, 255, 255, 0)' : 'rgba(255, 255, 255, 1)',
      } as React.CSSProperties,
    }

    // Calculate tab positions
    const updateTabPositions = useCallback(() => {
      const containerEl = innerRef.current
      if (!containerEl) return

      const containerRect = containerEl.getBoundingClientRect()
      const positions = new Map<string, { x: number; width: number }>()

      tabs.forEach((tab) => {
        const buttonEl = tabRefs.current.get(tab.id)
        if (buttonEl) {
          const buttonRect = buttonEl.getBoundingClientRect()
          positions.set(tab.id, {
            x: buttonRect.left - containerRect.left,
            width: buttonRect.width,
          })
        }
      })

      setTabPositions(positions)
    }, [tabs])

    // Update glass position to active tab
    const updateGlassPosition = useCallback((tabId: string) => {
      const pos = tabPositions.get(tabId)
      if (pos) {
        rawX.set(pos.x)
        setGlassWidth(pos.width)
      }
    }, [tabPositions, rawX])

    useEffect(() => {
      updateTabPositions()
    }, [tabs, updateTabPositions])

    useEffect(() => {
      if (tabPositions.size > 0) {
        updateGlassPosition(activeTab)
      }
    }, [activeTab, tabPositions, updateGlassPosition])

    // Handle resize
    useEffect(() => {
      const handleResize = () => {
        updateTabPositions()
      }
      window.addEventListener('resize', handleResize)
      const timer = setTimeout(handleResize, 50)
      return () => {
        window.removeEventListener('resize', handleResize)
        clearTimeout(timer)
      }
    }, [updateTabPositions])

    const handleTabClick = (tabId: string) => {
      if (isDragging) return
      if (controlledValue === undefined) {
        setInternalValue(tabId)
      }
      onValueChange?.(tabId)
    }

    const findClosestTab = (currentX: number): string => {
      let closestTab = tabs[0].id
      let closestDistance = Infinity

      tabPositions.forEach((pos, tabId) => {
        const distance = Math.abs(currentX - pos.x)
        if (distance < closestDistance) {
          closestDistance = distance
          closestTab = tabId
        }
      })

      return closestTab
    }

    const handleDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setDragVelocity(info.velocity.x)
    }

    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false)
      setDragVelocity(0)

      const currentX = glassX.get()
      const closestTab = findClosestTab(currentX)

      if (controlledValue === undefined) {
        setInternalValue(closestTab)
      }
      onValueChange?.(closestTab)
    }

    // Calculate drag constraints
    const getDragConstraints = () => {
      const firstPos = tabPositions.get(tabs[0]?.id)
      const lastPos = tabPositions.get(tabs[tabs.length - 1]?.id)

      if (firstPos && lastPos && tabPositions.size === tabs.length) {
        return { left: firstPos.x, right: lastPos.x }
      }
      // Return false to allow free dragging until positions are calculated
      return false
    }

    const constraints = getDragConstraints()

    return (
      <div
        ref={ref}
        className={cn('inline-flex relative overflow-visible', className)}
      >

        <div
          ref={containerRef}
          className={cn(
            'relative flex items-center rounded-full overflow-visible',
            config.containerHeight,
            // Apple-style frosted glass container
            'bg-white/[0.08] dark:bg-white/[0.06]',
            'backdrop-blur-2xl backdrop-saturate-[1.8]',
            'border border-white/[0.15] dark:border-white/[0.1]',
            // Subtle inner shadow for depth
            'shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_-1px_1px_rgba(0,0,0,0.05)]',
            // Outer shadow for elevation
            'shadow-lg shadow-black/10 dark:shadow-black/20'
          )}
          style={{ padding: config.containerPadding }}
        >

          {/* Inner track with subtle gradient */}
          <div
            ref={innerRef}
            className={cn(
              'relative flex items-center w-full h-full overflow-visible',
              config.gap
            )}
          >

            {/* Mercury Droplet Visual - Behind labels */}
            <motion.div
              style={{
                x: glassX,
                width: glassWidth || 80,
                height: config.glassHeight,
                scaleX: isDragging ? scaleX : 1,
                scaleY: isDragging ? scaleY : 1,
                transform: 'translateX(-50%) translateY(-50%)',
                zIndex: 100,
              }}
              className={cn(
                'absolute rounded-full pointer-events-none',
                'origin-center will-change-transform',
                'z-10'
              )}
              animate={{
                scale: isDragging ? 1.15 : 1,
                y: isDragging ? -4 : 0,
              }}
              transition={{
                scale: { type: 'spring', stiffness: 600, damping: 25 },
                y: { type: 'spring', stiffness: 600, damping: 25 },
              }}
            >
              {/* LiquidGlass for proper displacement effect */}
              <GlassSurface {...glassStyle} >
                <div className="w-full h-full rounded-full" />
              </GlassSurface>
              {/* Inner content for glass thickness feel */}

              {/* Ripple effect on drag start */}
              <AnimatePresence>
                {isDragging && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 rounded-full bg-white/30 pointer-events-none"
                  />
                )}
              </AnimatePresence>
            </motion.div>

            {/* Tab buttons - text layer */}
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  ref={(el) => {
                    if (el) {
                      tabRefs.current.set(tab.id, el)
                    } else {
                      tabRefs.current.delete(tab.id)
                    }
                  }}
                  onClick={() => handleTabClick(tab.id)}
                  className={cn(
                    'relative rounded-full flex justify-center items-center gap-2',
                    'cursor-pointer transition-all duration-200 ease-out',
                    'select-none z-10',
                    config.buttonPadding
                  )}
                  aria-selected={isActive}
                  role="tab"
                >
                  {tab.icon && (
                    <motion.span
                      animate={{
                        color: isDragging ? 'rgba(255,255,255,1)' : isActive ? 'rgb(255,255,255,1)' : 'rgba(255, 255, 255, 0.85)',
                      }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center justify-center"
                    >
                      {tab.icon}
                    </motion.span>
                  )}
                  <motion.span
                    animate={{
                      color: isDragging ? 'rgba(255,255,255,1)' : isActive ? 'rgb(255,255,255,1)' : 'rgba(255, 255, 255, 0.85)',
                    }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      'text-center leading-tight whitespace-nowrap font-medium transition-colors',
                      config.fontSize
                    )}
                  >
                    {tab.label}
                  </motion.span>
                </button>
              )
            })}

            {/* Invisible Drag Handle - captures drag events on top */}
            <motion.div
              drag="x"
              dragConstraints={constraints || undefined}
              dragElastic={0.8}
              dragMomentum={true}
              dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
              onDragStart={() => setIsDragging(true)}
              onDrag={handleDrag}
              onDragEnd={handleDragEnd}
              style={{
                x: glassX,
                width: glassWidth || 80,
                height: config.glassHeight,
              }}
              className="absolute z-20 cursor-grab active:cursor-grabbing rounded-full touch-pan-y"
            />
          </div>
        </div>
      </div>
    )
  }
)

SegmentedControl.displayName = 'SegmentedControl'

