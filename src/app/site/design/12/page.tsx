'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'motion/react'
import { useState, useEffect } from 'react'

/**
 * Design Sample 12: Executive Overview Dashboard
 * 
 * Brand color: Violet/Purple theme
 * Blur reveal and scale transitions + mouse follower
 * Premium minimal icons
 */

// Mouse follower glow component
function MouseFollowerGlow() {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 100, damping: 30 })
  const springY = useSpring(mouseY, { stiffness: 100, damping: 30 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  return (
    <motion.div
      className="fixed w-72 h-72 rounded-full pointer-events-none z-0 opacity-20"
      style={{
        x: springX,
        y: springY,
        translateX: '-50%',
        translateY: '-50%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, transparent 70%)'
      }}
    />
  )
}

// Refined custom icons
const CubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const SparkleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const WindowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 9h18M9 21V9" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const BriefcaseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const TargetIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const ArrowIcon = ({ direction = 'right' }: { direction?: 'up' | 'down' | 'left' | 'right' }) => {
  const paths: Record<string, string> = {
    up: 'M12 19V5m0 0l-7 7m7-7l7 7',
    down: 'M12 5v14m0 0l7-7m-7 7l-7-7',
    left: 'M19 12H5m0 0l7 7m-7-7l7-7',
    right: 'M5 12h14m0 0l-7-7m7 7l-7 7'
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path d={paths[direction]} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Blur reveal animation component
function BlurReveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(10px)', y: 10 }}
      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Metric tile with scale animation
function MetricTile({ 
  icon: Icon, 
  label, 
  value, 
  subtext,
  index
}: { 
  icon: React.ComponentType
  label: string
  value: string
  subtext: string
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotate: -2 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ 
        delay: 0.1 + index * 0.08, 
        duration: 0.5, 
        ease: [0.34, 1.56, 0.64, 1] 
      }}
      whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(139, 92, 246, 0.2)', transition: { duration: 0.2 } }}
      className="group"
    >
      <Card className="bg-violet-950/30 border-violet-500/20 hover:border-violet-500/40 hover:bg-violet-950/50 transition-all backdrop-blur-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <motion.div 
              className="p-2 rounded-lg bg-violet-500/20 text-violet-400 group-hover:text-violet-300 transition-colors"
              whileHover={{ rotate: 15, scale: 1.1 }}
            >
              <Icon />
            </motion.div>
            <span className="text-sm text-violet-300/70">{label}</span>
          </div>
          <p className="text-2xl font-semibold text-violet-100">{value}</p>
          <p className="text-xs text-violet-400/60 mt-1">{subtext}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Project row with slide animation
function ProjectRow({ 
  name, 
  status, 
  progress, 
  deadline,
  team,
  index
}: { 
  name: string
  status: 'on-track' | 'at-risk' | 'completed'
  progress: number
  deadline: string
  team: string[]
  index: number
}) {
  const statusConfig = {
    'on-track': { label: 'On Track', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    'at-risk': { label: 'At Risk', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    'completed': { label: 'Completed', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' }
  }

  const { label, color } = statusConfig[status]

  return (
    <motion.div
      className="flex items-center gap-4 py-4 px-4 hover:bg-violet-500/10 rounded-lg transition-colors cursor-pointer group"
      initial={{ opacity: 0, x: -30, filter: 'blur(5px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
      whileHover={{ x: 6, boxShadow: '0 0 20px rgba(139, 92, 246, 0.1)' }}
    >
      <motion.div 
        className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 group-hover:text-violet-300 transition-colors"
        whileHover={{ scale: 1.15, rotate: 10 }}
      >
        <CubeIcon />
      </motion.div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-violet-100 group-hover:text-white transition-colors truncate">{name}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-24 h-1 bg-violet-950 rounded-full overflow-hidden">
            <motion.div 
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
            />
          </div>
          <span className="text-xs text-violet-400/60">{progress}%</span>
        </div>
      </div>

      <Badge className={cn("text-xs border", color)}>{label}</Badge>

      <div className="flex items-center gap-1 text-xs text-violet-400/60">
        <ClockIcon />
        <span>{deadline}</span>
      </div>

      <div className="flex -space-x-2">
        {team.slice(0, 3).map((member, i) => (
          <motion.div
            key={i}
            className="w-7 h-7 rounded-full bg-violet-800 border-2 border-violet-950 flex items-center justify-center text-[10px] text-violet-200 font-medium"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + index * 0.1 + i * 0.05 }}
            whileHover={{ scale: 1.15, zIndex: 10 }}
          >
            {member}
          </motion.div>
        ))}
        {team.length > 3 && (
          <div className="w-7 h-7 rounded-full bg-violet-900 border-2 border-violet-950 flex items-center justify-center text-[10px] text-violet-400">
            +{team.length - 3}
          </div>
        )}
      </div>

      <motion.div 
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        whileHover={{ x: 3 }}
      >
        <ArrowIcon direction="right" />
      </motion.div>
    </motion.div>
  )
}

// Goal card with progress ring
function GoalCard({ 
  title, 
  current, 
  target, 
  unit,
  index
}: { 
  title: string
  current: number
  target: number
  unit: string
  index: number
}) {
  const percentage = Math.round((current / target) * 100)
  const circumference = 2 * Math.PI * 36

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.4 + index * 0.15, duration: 0.5 }}
      whileHover={{ y: -5, boxShadow: '0 10px 40px rgba(139, 92, 246, 0.15)', transition: { duration: 0.2 } }}
    >
      <Card className="bg-violet-950/30 border-violet-500/20 backdrop-blur-sm">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-violet-950"
              />
              <motion.circle
                cx="40"
                cy="40"
                r="36"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="6"
                strokeLinecap="round"
                initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference - (circumference * percentage) / 100 }}
                transition={{ delay: 0.6 + index * 0.15, duration: 1, ease: 'easeOut' }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#d946ef" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-violet-200">{percentage}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-violet-100">{title}</p>
            <p className="text-xs text-violet-400/60 mt-1">
              {current.toLocaleString()} / {target.toLocaleString()} {unit}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Timeline event
function TimelineEvent({ 
  time, 
  title, 
  type,
  index
}: { 
  time: string
  title: string
  type: 'meeting' | 'deadline' | 'milestone'
  index: number
}) {
  const icons = {
    meeting: CalendarIcon,
    deadline: ClockIcon,
    milestone: TargetIcon
  }
  const Icon = icons[type]

  return (
    <motion.div
      className="flex items-center gap-3 py-2 group cursor-pointer"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 + index * 0.08, duration: 0.4 }}
      whileHover={{ x: -6, backgroundColor: 'rgba(139, 92, 246, 0.05)' }}
    >
      <span className="text-xs text-violet-500/60 w-14">{time}</span>
      <motion.div 
        className="w-2 h-2 rounded-full bg-violet-500"
        whileHover={{ scale: 2, backgroundColor: '#c4b5fd' }}
      />
      <div className="p-1.5 rounded bg-violet-500/20 text-violet-400 group-hover:text-violet-300 transition-colors">
        <Icon />
      </div>
      <span className="text-sm text-violet-300/80 group-hover:text-violet-200 transition-colors flex-1">{title}</span>
    </motion.div>
  )
}

export default function DesignSample12() {
  const projects = [
    { name: 'Enterprise Platform Redesign', status: 'on-track' as const, progress: 72, deadline: 'Mar 15', team: ['JD', 'SK', 'ML', 'AP'] },
    { name: 'Mobile App 3.0 Release', status: 'at-risk' as const, progress: 45, deadline: 'Feb 28', team: ['TW', 'RK'] },
    { name: 'API Gateway Migration', status: 'completed' as const, progress: 100, deadline: 'Feb 1', team: ['AS', 'NC', 'BM'] },
    { name: 'Analytics Dashboard V2', status: 'on-track' as const, progress: 58, deadline: 'Apr 1', team: ['DP', 'EL', 'JH', 'MV', 'SR'] },
  ]

  const events = [
    { time: '09:00', title: 'Executive Sync', type: 'meeting' as const },
    { time: '11:30', title: 'Q1 Report Due', type: 'deadline' as const },
    { time: '14:00', title: 'Product Review', type: 'meeting' as const },
    { time: '16:00', title: 'Sprint Closure', type: 'milestone' as const },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Mouse follower glow */}
      <MouseFollowerGlow />
      
      {/* Subtle violet gradient - like 01 with brand color */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/20 via-background to-fuchsia-950/10 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-violet-500/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <BlurReveal className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <motion.div 
                className="w-10 h-10 rounded-lg bg-zinc-800/80 flex items-center justify-center text-zinc-400"
                whileHover={{ scale: 1.1, rotate: 10 }}
              >
                <BriefcaseIcon />
              </motion.div>
              <h1 className="text-2xl font-semibold text-zinc-100">Executive Overview</h1>
            </div>
            <p className="text-sm text-zinc-500">Strategic insights for leadership</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-violet-500/30 text-violet-400 hover:text-violet-200 hover:bg-violet-500/10 hover:shadow-[0_0_15px_rgba(139,92,246,0.2)]">
              <CalendarIcon />
              <span className="ml-2">This Week</span>
            </Button>
            <motion.div whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(139, 92, 246, 0.3)' }} whileTap={{ scale: 0.98 }}>
              <Button className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500">
                <SparkleIcon />
                <span className="ml-2">Generate Report</span>
              </Button>
            </motion.div>
          </div>
        </BlurReveal>

        <Separator className="bg-violet-500/20 mb-8" />

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricTile icon={TargetIcon} label="Revenue" value="$2.4M" subtext="+18% from last quarter" index={0} />
          <MetricTile icon={WindowIcon} label="Active Projects" value="12" subtext="3 completing this month" index={1} />
          <MetricTile icon={CubeIcon} label="Team Members" value="48" subtext="4 new hires pending" index={2} />
          <MetricTile icon={SparkleIcon} label="Satisfaction" value="94%" subtext="Based on 2.4k responses" index={3} />
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Projects */}
          <div className="lg:col-span-2">
            <BlurReveal delay={0.2}>
              <Card className="bg-zinc-900/30 border-zinc-800/50 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-violet-200 flex items-center gap-2">
                      <CubeIcon />
                      Active Projects
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="text-xs text-violet-400/60 hover:text-violet-300">
                      View All
                      <ArrowIcon direction="right" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-2">
                  {projects.map((project, i) => (
                    <ProjectRow key={project.name} {...project} index={i} />
                  ))}
                </CardContent>
              </Card>
            </BlurReveal>

            {/* Goals */}
            <div className="grid sm:grid-cols-3 gap-4 mt-6">
              <GoalCard title="Q1 Revenue Target" current={2400000} target={3000000} unit="USD" index={0} />
              <GoalCard title="Customer Acquisition" current={842} target={1000} unit="users" index={1} />
              <GoalCard title="NPS Score" current={72} target={80} unit="points" index={2} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Today's Schedule */}
            <BlurReveal delay={0.3}>
              <Card className="bg-violet-950/30 border-violet-500/20 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-violet-200 flex items-center gap-2">
                    <CalendarIcon />
                    Today&apos;s Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {events.map((event, i) => (
                    <TimelineEvent key={event.title} {...event} index={i} />
                  ))}
                </CardContent>
              </Card>
            </BlurReveal>

            {/* Quick Actions */}
            <BlurReveal delay={0.4}>
              <Card className="bg-violet-950/30 border-violet-500/20 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-violet-200">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { label: 'Schedule Meeting', icon: CalendarIcon },
                    { label: 'View Reports', icon: WindowIcon },
                    { label: 'Team Directory', icon: BriefcaseIcon },
                  ].map((action, i) => (
                    <motion.button
                      key={action.label}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-violet-400/80 hover:text-violet-200 hover:bg-violet-500/10 transition-colors group"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      whileHover={{ x: 6, boxShadow: '0 0 15px rgba(139, 92, 246, 0.1)' }}
                    >
                      <action.icon />
                      <span className="flex-1 text-left">{action.label}</span>
                      <ArrowIcon direction="right" />
                    </motion.button>
                  ))}
                </CardContent>
              </Card>
            </BlurReveal>
          </div>
        </div>
      </div>
    </div>
  )
}
