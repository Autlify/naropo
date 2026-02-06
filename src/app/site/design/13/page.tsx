'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence, useMotionValue, useSpring } from 'motion/react'
import { useState, useEffect } from 'react'

/**
 * Design Sample 13: Workspace Hub
 * 
 * Using semantic bg-background like 01
 * Flip, morph, and elastic animations + mouse follower
 * Refined custom icons
 */

// Mouse follower glow component
function MouseFollowerGlow() {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 130, damping: 22 })
  const springY = useSpring(mouseY, { stiffness: 130, damping: 22 })

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
      className="fixed w-80 h-80 rounded-full pointer-events-none z-0 opacity-25"
      style={{
        x: springX,
        y: springY,
        translateX: '-50%',
        translateY: '-50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)'
      }}
    />
  )
}

// Elegant custom icons
const HexagonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path d="M12 2l9 5v10l-9 5-9-5V7l9-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
)

const DiamondIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path d="M12 2L2 12l10 10 10-10L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
)

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
)

const OctagonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86L7.86 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
)

const SquareStackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <rect x="8" y="8" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const FlameIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path d="M12 22c-4.97 0-9-4.03-9-9 0-3.53 2.04-6.58 5-8.05 0 0-.5 3.55 2 5.05 0-3 1.5-6 5-8 .5 2 2 4 2 7-1 0-2 1-2 2.5s1 2.5 2 2.5c2.21 0 4-2.02 4-4.5 0-.27-.02-.54-.05-.8C20.95 11.87 21 14.42 21 15c0 4.97-4.03 7-9 7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
)

const BookmarkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
)

const InboxIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path d="M22 12h-6l-2 3h-4l-2-3H2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Flip card component
function FlipCard({ 
  front, 
  back,
  className
}: { 
  front: React.ReactNode
  back: React.ReactNode
  className?: string
}) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <motion.div
      className={cn("relative preserve-3d cursor-pointer", className)}
      onClick={() => setIsFlipped(!isFlipped)}
      animate={{ rotateY: isFlipped ? 180 : 0 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="backface-hidden" style={{ backfaceVisibility: 'hidden' }}>
        {front}
      </div>
      <div 
        className="absolute inset-0 backface-hidden" 
        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
      >
        {back}
      </div>
    </motion.div>
  )
}

// Workspace card with morph animation
function WorkspaceCard({ 
  name, 
  icon: Icon, 
  color, 
  members, 
  tasks,
  index
}: { 
  name: string
  icon: React.ComponentType
  color: string
  members: number
  tasks: number
  index: number
}) {
  const [isHovered, setIsHovered] = useState(false)

  const colorMap: Record<string, { bg: string; border: string; glow: string }> = {
    emerald: { bg: 'from-emerald-500/10 to-emerald-600/5', border: 'border-emerald-500/20 hover:border-emerald-500/40', glow: 'shadow-emerald-500/10' },
    teal: { bg: 'from-teal-500/10 to-teal-600/5', border: 'border-teal-500/20 hover:border-teal-500/40', glow: 'shadow-teal-500/10' },
    green: { bg: 'from-green-500/10 to-green-600/5', border: 'border-green-500/20 hover:border-green-500/40', glow: 'shadow-green-500/10' },
    lime: { bg: 'from-lime-500/10 to-lime-600/5', border: 'border-lime-500/20 hover:border-lime-500/40', glow: 'shadow-lime-500/10' },
  }

  const colors = colorMap[color] || colorMap.emerald

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      transition={{ 
        delay: 0.1 + index * 0.1, 
        duration: 0.6, 
        ease: [0.34, 1.56, 0.64, 1]
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -6, boxShadow: '0 15px 40px rgba(16, 185, 129, 0.15)' }}
    >
      <Card className={cn(
        "bg-gradient-to-br border transition-all hover:shadow-lg cursor-pointer overflow-hidden",
        colors.bg, colors.border, `hover:${colors.glow}`
      )}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <motion.div 
              className="p-3 rounded-xl bg-slate-900/50 text-emerald-400"
              animate={{ 
                rotate: isHovered ? 10 : 0,
                scale: isHovered ? 1.1 : 1
              }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <Icon />
            </motion.div>
            <motion.div
              animate={{ 
                rotate: isHovered ? 45 : 0,
                scale: isHovered ? 1.2 : 1
              }}
              className="text-slate-500"
            >
              <DiamondIcon />
            </motion.div>
          </div>

          <h3 className="font-semibold text-zinc-100 mb-2">{name}</h3>
          
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <motion.div 
                className="flex -space-x-1"
                animate={{ x: isHovered ? 4 : 0 }}
              >
                {[...Array(Math.min(members, 3))].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-5 h-5 rounded-full bg-slate-700 border border-slate-900"
                  />
                ))}
              </motion.div>
              <span className="ml-1">{members}</span>
            </span>
            <span>{tasks} tasks</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Task item with elastic animation
function TaskItem({ 
  title, 
  status, 
  priority,
  index
}: { 
  title: string
  status: 'todo' | 'in-progress' | 'done'
  priority: 'high' | 'medium' | 'low'
  index: number
}) {
  const [isChecked, setIsChecked] = useState(status === 'done')

  const priorityColors = {
    high: 'bg-gradient-to-r from-orange-500 to-amber-500',
    medium: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    low: 'bg-gradient-to-r from-slate-500 to-slate-400',
  }

  return (
    <motion.div
      className="flex items-center gap-3 py-3 group cursor-pointer"
      initial={{ opacity: 0, x: -20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ 
        delay: 0.3 + index * 0.06, 
        duration: 0.4,
        ease: [0.34, 1.56, 0.64, 1]
      }}
      whileHover={{ x: 4 }}
    >
      <motion.button
        onClick={() => setIsChecked(!isChecked)}
        className={cn(
          "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors",
          isChecked 
            ? "bg-emerald-500 border-emerald-500" 
            : "border-slate-600 hover:border-emerald-500"
        )}
        whileTap={{ scale: 0.8 }}
        animate={{ rotate: isChecked ? [0, 10, -10, 0] : 0 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence>
          {isChecked && (
            <motion.svg
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              viewBox="0 0 24 24"
              className="h-3 w-3 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>

      <div className={cn("w-1 h-5 rounded-full", priorityColors[priority])} />
      
      <span className={cn(
        "flex-1 text-sm transition-colors",
        isChecked ? "text-zinc-500 line-through" : "text-zinc-200 group-hover:text-emerald-400"
      )}>
        {title}
      </span>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
          <circle cx="5" cy="12" r="1" />
        </svg>
      </motion.div>
    </motion.div>
  )
}

// Quick stat with bounce animation
function QuickStat({ 
  icon: Icon, 
  label, 
  value,
  index
}: { 
  icon: React.ComponentType
  label: string
  value: string
  index: number
}) {
  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: 0.2 + index * 0.1, 
        duration: 0.5,
        ease: [0.34, 1.56, 0.64, 1]
      }}
      whileHover={{ scale: 1.05, x: 4 }}
    >
      <motion.div 
        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400"
        whileHover={{ scale: 1.15, rotate: 15 }}
        transition={{ type: 'spring', stiffness: 400 }}
      >
        <Icon />
      </motion.div>
      <div>
        <p className="text-xl font-bold text-zinc-100">{value}</p>
        <p className="text-xs text-zinc-500">{label}</p>
      </div>
    </motion.div>
  )
}

// Activity feed
function ActivityFeed() {
  const activities = [
    { user: 'Alex', action: 'completed', target: 'API Integration', time: '2m' },
    { user: 'Sarah', action: 'created', target: 'Design System v2', time: '15m' },
    { user: 'Mike', action: 'commented on', target: 'Sprint Planning', time: '1h' },
  ]

  return (
    <div className="space-y-3">
      {activities.map((activity, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-3 py-2 group cursor-pointer"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
          whileHover={{ x: -6, backgroundColor: 'rgba(16, 185, 129, 0.05)' }}
        >
          <motion.div 
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-emerald-400"
            whileHover={{ scale: 1.15, boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)' }}
          >
            {activity.user.charAt(0)}
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground truncate">
              <span className="text-foreground font-medium">{activity.user}</span>
              {' '}{activity.action}{' '}
              <span className="text-emerald-400">{activity.target}</span>
            </p>
          </div>
          <span className="text-xs text-muted-foreground">{activity.time}</span>
        </motion.div>
      ))}
    </div>
  )
}

// Collapsible section
function CollapsibleSection({ 
  title, 
  children,
  defaultOpen = true
}: { 
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="uppercase tracking-wider text-xs font-medium">{title}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDownIcon />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function DesignSample13() {
  const workspaces = [
    { name: 'Engineering', icon: HexagonIcon, color: 'emerald', members: 8, tasks: 24 },
    { name: 'Design', icon: DiamondIcon, color: 'teal', members: 4, tasks: 12 },
    { name: 'Marketing', icon: FlameIcon, color: 'green', members: 6, tasks: 18 },
    { name: 'Operations', icon: ShieldIcon, color: 'lime', members: 5, tasks: 15 },
  ]

  const tasks = [
    { title: 'Review API documentation changes', status: 'todo' as const, priority: 'high' as const },
    { title: 'Update design system components', status: 'in-progress' as const, priority: 'medium' as const },
    { title: 'Prepare Q1 report presentation', status: 'todo' as const, priority: 'high' as const },
    { title: 'Fix authentication edge cases', status: 'done' as const, priority: 'medium' as const },
    { title: 'Schedule team sync meeting', status: 'todo' as const, priority: 'low' as const },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Mouse follower glow */}
      <MouseFollowerGlow />
      
      {/* Subtle gradient overlay like 01 */}
      <div className="fixed inset-0 bg-gradient-to-b from-muted/15 to-transparent pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.header 
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4">
            <motion.div 
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"
              whileHover={{ scale: 1.15, rotate: 15, boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)' }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <OctagonIcon />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">Workspace Hub</h1>
              <p className="text-sm text-zinc-500">Unified collaboration center</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Tabs defaultValue="all">
              <TabsList className="bg-slate-900/50 border border-slate-800/50">
                <TabsTrigger value="all" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">All</TabsTrigger>
                <TabsTrigger value="starred" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">Starred</TabsTrigger>
                <TabsTrigger value="recent" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">Recent</TabsTrigger>
              </TabsList>
            </Tabs>
            <motion.div whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(16, 185, 129, 0.3)' }} whileTap={{ scale: 0.98 }}>
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500">
                <SquareStackIcon />
                <span className="ml-2">New Workspace</span>
              </Button>
            </motion.div>
          </div>
        </motion.header>

        {/* Quick Stats */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 p-6 rounded-2xl bg-muted/20 border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <QuickStat icon={SquareStackIcon} label="Workspaces" value="12" index={0} />
          <QuickStat icon={HexagonIcon} label="Active Projects" value="28" index={1} />
          <QuickStat icon={FlameIcon} label="In Progress" value="47" index={2} />
          <QuickStat icon={ShieldIcon} label="Completed" value="156" index={3} />
        </motion.div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Workspaces */}
          <div className="lg:col-span-2">
            <CollapsibleSection title="Your Workspaces">
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                {workspaces.map((workspace, i) => (
                  <WorkspaceCard key={workspace.name} {...workspace} index={i} />
                ))}
              </div>
            </CollapsibleSection>

            <Separator className="my-6 bg-border" />

            {/* Tasks */}
            <CollapsibleSection title="Today's Tasks">
                <Card className="mt-4 bg-muted/20 border-border">
                <CardContent className="p-4">
                  {tasks.map((task, i) => (
                    <TaskItem key={task.title} {...task} index={i} />
                  ))}
                </CardContent>
              </Card>
            </CollapsibleSection>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Bookmarks */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-slate-900/30 border-slate-800/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                    <BookmarkIcon />
                    Pinned
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {['Sprint Planning Board', 'Design Guidelines', 'API Documentation'].map((item, i) => (
                    <motion.button
                      key={item}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-emerald-500/10 transition-colors group flex items-center gap-2"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      whileHover={{ x: 6, boxShadow: '0 0 15px rgba(16, 185, 129, 0.1)' }}
                    >
                      <motion.div
                        whileHover={{ rotate: 15, scale: 1.1 }}
                        className="text-emerald-500"
                      >
                        <DiamondIcon />
                      </motion.div>
                      {item}
                    </motion.button>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Inbox */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-slate-900/30 border-slate-800/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                      <InboxIcon />
                      Inbox
                    </CardTitle>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                      5 new
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <ActivityFeed />
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Access */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20">
                <CardContent className="p-5 text-center">
                  <motion.div 
                    className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-3 text-emerald-400"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                  >
                    <FlameIcon />
                  </motion.div>
                  <h3 className="font-semibold text-zinc-100 mb-1">Productivity Mode</h3>
                  <p className="text-xs text-zinc-500 mb-4">Focus on what matters most</p>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button size="sm" variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
                      Activate
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
