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
  equalWidth?: boolean
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
      equalWidth = false,
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(defaultTab || tabs[0]?.id)
    const activeTab = controlledValue ?? internalValue
    const [isDragging, setIsDragging] = useState(false)
    const [dragVelocity, setDragVelocity] = useState(0)
    const [glassPosition, setGlassPosition] = useState({ x: 0, width: 0 })
    const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
    const labelRefs = useRef<Map<string, HTMLSpanElement>>(new Map())
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
        fontSize: 'text-[13px]',
        cornerRadius: 16,
        gap: 'gap-0.5',
      },
      default: {
        containerHeight: 'h-12',
        containerPadding: 4,
        glassHeight: 40,
        glassTop: 4,
        buttonPadding: 'px-5 py-2',
        fontSize: 'text-[13px]',
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
      width: isDragging ? glassWidth! + 12 : glassWidth!,
      borderWidth: 0.5,
      borderRadius: 100,
      opacity: 1,
      blur: 15,
      brightness: 70,
      displace: 10,
      backgroundOpacity: 0.02,
      saturation: 1.3,
      distortionScale: -220,
      redOffset: 3,
      greenOffset: 0,
      blueOffset: -3,
      xChannel: 'R' as const,
      yChannel: 'G' as const,
      mixBlendMode: 'normal' as const,
      style: {
        pointerEvents: 'none',
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

      // Track glass position for per-character highlight
      const currentX = glassX.get()
      const currentWidth = glassWidth || 80
      setGlassPosition({ x: currentX, width: currentWidth })
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

    // Helper to calculate character highlight based on glass position
    const getCharacterColors = (tabId: string, label: string): string[] => {
      const isActive = activeTab === tabId
      const tabPos = tabPositions.get(tabId)
      const labelEl = labelRefs.current.get(tabId)

      // If active and not dragging, all characters are blue
      if (isActive && !isDragging) {
        return label.split('').map(() => 'rgb(251, 191, 36)')
      }

      // If not dragging, all characters are dim white
      if (!isDragging) {
        return label.split('').map(() => 'rgba(255, 255, 255, 0.6)')
      }

      // During drag, calculate per-character overlap
      if (!tabPos || !labelEl || !innerRef.current) {
        return label.split('').map(() => 'rgba(255, 255, 255, 0.6)')
      }

      const containerRect = innerRef.current.getBoundingClientRect()
      const labelRect = labelEl.getBoundingClientRect()
      const labelStartX = labelRect.left - containerRect.left
      const charWidth = labelRect.width / label.length

      const glassLeft = glassPosition.x
      const glassRight = glassPosition.x + glassPosition.width

      return label.split('').map((_, charIndex) => {
        const charStartX = labelStartX + charIndex * charWidth
        const charEndX = charStartX + charWidth

        // Check if character overlaps with glass
        const overlap = charStartX < glassRight && charEndX > glassLeft

        // Apple style: text stays white, glass displacement creates the effect
        return overlap ? 'rgb(251, 191, 36)' : 'rgba(255, 255, 255, 0.6)'
      })
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

            {/* Selected Tab Background - Dark gradient with border (Idle state) */}
            {!isDragging && (
              <motion.div
                style={{
                  x: glassX,
                  width: glassWidth || 80,
                  height: config.glassHeight,
                }}
                className={cn(
                  'absolute rounded-[20px] pointer-events-none z-10',
                  'bg-gradient-to-b from-zinc-700 to-zinc-800',
                  'border border-zinc-600/50',
                  'shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_-1px_2px_rgba(0,0,0,0.4)]',
                )}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}

            {/* Glass Surface - Only during dragging */}
            {isDragging && (
              <motion.div
                style={{
                  x: glassX,
                  width: glassWidth || 80,
                  height: config.glassHeight,
                  scaleX: scaleX,
                  scaleY: scaleY,
                }}
                className={cn(
                  'absolute rounded-full pointer-events-none z-10',
                  'origin-center will-change-transform',
                )}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ 
                  opacity: 1,
                  scale: 1.15,
                  y: -5,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 28,
                }}
              >
                <GlassSurface {...glassStyle}> 
                </GlassSurface>
              </motion.div>
            )}

            {/* Tab buttons - text layer */}
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              const characterColors = getCharacterColors(tab.id, tab.label)

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
                    'cursor-pointer color transition-all duration-200 ease-out',
                    'select-none z-[150]',
                    config.buttonPadding,
                    'flex-1 min-w-0'
                  )}
                  aria-selected={isActive}
                  role="tab"
                >
                  {tab.icon && (
                    <motion.span
                      animate={{
                        color: !isDragging && isActive
                          ? 'rgb(251, 191, 36)' // amber-400 for selected (matching Apple)
                          : 'rgba(255, 255, 255, 0.6)',
                      }}
                      transition={{ duration: 0.12 }}
                      className={cn('flex items-center justify-center', config.fontSize)}
                    >
                      {tab.icon}
                    </motion.span>
                  )}
                  <span
                    ref={(el) => {
                      if (el) {
                        labelRefs.current.set(tab.id, el)
                      } else {
                        labelRefs.current.delete(tab.id)
                      }
                    }}
                    className={cn(
                      'text-center leading-tight whitespace-nowrap font-medium',
                      config.fontSize,
                    )}
                  >
                    {tab.label.split('').map((char, charIndex) => {
                      // Calculate gradient color for active state (blue -> white -> blue)
                      const totalChars = tab.label.length
                      const position = totalChars > 1 ? charIndex / (totalChars - 1) : 0.5
                      // Sine curve for smooth blue-white-blue transition
                      const whiteness = Math.sin(position * Math.PI)
                      const r = Math.round(96 + (255 - 96) * whiteness * 0.4)
                      const g = Math.round(165 + (255 - 165) * whiteness * 0.4)
                      const b = 250
                      const gradientColor = `rgb(${r}, ${g}, ${b})`

                      return (
                        <span
                          key={charIndex}
                          style={{
                            color: characterColors[charIndex],
                            transition: 'color 0.12s ease-out',
                          }}
                        >
                          {char}
                        </span>
                      )
                    })}
                  </span>
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
              className="absolute z-[200] cursor-grab active:cursor-grabbing rounded-full touch-pan-y"
            />
          </div>
        </div>
      </div>
    )
  }
)

SegmentedControl.displayName = 'SegmentedControl'

