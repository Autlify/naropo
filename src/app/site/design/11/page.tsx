'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { motion, useMotionValue, useTransform, animate } from 'motion/react'
import { useState, useEffect } from 'react'

/**
 * Design Sample 11: Premium Analytics Dashboard
 * 
 * Blue/Cyan gradient background (like 01-06)
 * Cascade/wave animations with counter effects
 * Premium custom icons
 */

// Premium custom icons
const TrendUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path d="M2 20L9 13L13 17L22 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 8H22V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const TrendDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path d="M2 4L9 11L13 7L22 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 16H22V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const ChartBarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <rect x="3" y="12" width="4" height="9" rx="1" stroke="currentColor" strokeWidth="2" />
    <rect x="10" y="8" width="4" height="13" rx="1" stroke="currentColor" strokeWidth="2" />
    <rect x="17" y="3" width="4" height="18" rx="1" stroke="currentColor" strokeWidth="2" />
  </svg>
)

const PieChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path d="M21.21 15.89A10 10 0 118 2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M22 12A10 10 0 0012 2v10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const LineChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 16l4-4 4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
    <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="currentColor" strokeWidth="2" />
  </svg>
)

const ActivityIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const ZapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// Animated counter component
function AnimatedCounter({ target, duration = 2 }: { target: number; duration?: number }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (value) => Math.round(value).toLocaleString())
  const [displayValue, setDisplayValue] = useState('0')

  useEffect(() => {
    const controls = animate(count, target, { duration })
    const unsubscribe = rounded.on('change', (v) => setDisplayValue(v))
    return () => {
      controls.stop()
      unsubscribe()
    }
  }, [target, duration, count, rounded])

  return <span>{displayValue}</span>
}

// Animated bar chart
function AnimatedBarChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data)
  
  return (
    <div className="flex items-end gap-1 h-20">
      {data.map((value, i) => (
        <motion.div
          key={i}
          className={cn("flex-1 rounded-t", color)}
          initial={{ height: 0 }}
          animate={{ height: `${(value / max) * 100}%` }}
          transition={{ 
            delay: i * 0.05 + 0.5, 
            duration: 0.6, 
            ease: [0.34, 1.56, 0.64, 1] // Spring-like ease
          }}
        />
      ))}
    </div>
  )
}

// Wave animated line
function WaveLine({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className="h-0.5 bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 1 }}
      transition={{ delay, duration: 0.8, ease: 'easeOut' }}
    />
  )
}

// Premium stat card with wave animation
function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  change, 
  trend,
  color,
  index
}: { 
  icon: React.ComponentType
  label: string
  value: number
  change: string
  trend: 'up' | 'down' | 'neutral'
  color: string
  index: number
}) {
  const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
    blue: { bg: 'from-blue-500/10 to-blue-600/5', border: 'border-blue-500/20', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
    cyan: { bg: 'from-cyan-500/10 to-cyan-600/5', border: 'border-cyan-500/20', text: 'text-cyan-400', glow: 'shadow-cyan-500/20' },
    indigo: { bg: 'from-indigo-500/10 to-indigo-600/5', border: 'border-indigo-500/20', text: 'text-indigo-400', glow: 'shadow-indigo-500/20' },
    sky: { bg: 'from-sky-500/10 to-sky-600/5', border: 'border-sky-500/20', text: 'text-sky-400', glow: 'shadow-sky-500/20' },
  }
  
  const colors = colorMap[color] || colorMap.blue

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: -10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ 
        delay: index * 0.15, 
        duration: 0.6, 
        ease: [0.21, 1.11, 0.81, 0.99] 
      }}
    >
      <Card className={cn(
        "bg-gradient-to-br border overflow-hidden group hover:shadow-lg transition-all",
        colors.bg, colors.border, `hover:${colors.glow}`
      )}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <motion.div 
              className={cn("p-2.5 rounded-xl bg-slate-800/50", colors.text)}
              whileHover={{ scale: 1.1, rotate: 10 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <Icon />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.15 }}
              className={cn(
                "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                trend === 'up' && "bg-emerald-500/20 text-emerald-400",
                trend === 'down' && "bg-red-500/20 text-red-400",
                trend === 'neutral' && "bg-slate-500/20 text-slate-400"
              )}
            >
              {trend === 'up' && <TrendUpIcon />}
              {trend === 'down' && <TrendDownIcon />}
              {change}
            </motion.div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-3xl font-bold text-foreground">
            <AnimatedCounter target={value} duration={1.5 + index * 0.2} />
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Chart card with cascade animation
function ChartCard({ 
  title, 
  subtitle, 
  data, 
  color,
  index
}: { 
  title: string
  subtitle: string
  data: number[]
  color: string
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        delay: 0.4 + index * 0.1, 
        duration: 0.5,
        ease: 'easeOut'
      }}
    >
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-950 border-border/30 overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">{title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            </div>
            <motion.button 
              className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
              whileHover={{ scale: 1.1 }}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
            </motion.button>
          </div>
        </CardHeader>
        <CardContent>
          <AnimatedBarChart data={data} color={color} />
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Activity feed item
function ActivityItem({ 
  action, 
  target, 
  time, 
  icon: Icon,
  color,
  index
}: { 
  action: string
  target: string
  time: string
  icon: React.ComponentType
  color: string
  index: number
}) {
  return (
    <motion.div
      className="flex items-center gap-3 py-3 group cursor-pointer"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6 + index * 0.08, duration: 0.4 }}
      whileHover={{ x: 4 }}
    >
      <motion.div 
        className={cn("p-2 rounded-lg", color)}
        whileHover={{ scale: 1.15, rotate: 10 }}
      >
        <Icon />
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground group-hover:text-blue-400 transition-colors">
          {action} <span className="font-medium">{target}</span>
        </p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </motion.div>
  )
}

// Geographic stat
function GeoStat({ country, flag, value, percent, index }: { country: string; flag: string; value: string; percent: number; index: number }) {
  return (
    <motion.div
      className="flex items-center gap-3 py-2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.7 + index * 0.1, duration: 0.4 }}
    >
      <span className="text-xl">{flag}</span>
      <span className="flex-1 text-sm text-foreground">{country}</span>
      <span className="text-sm text-muted-foreground">{value}</span>
      <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <motion.div 
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ delay: 0.9 + index * 0.1, duration: 0.6 }}
        />
      </div>
    </motion.div>
  )
}

export default function DesignSample11() {
  const chartData1 = [30, 45, 35, 55, 48, 70, 65, 80, 75, 90, 85, 95]
  const chartData2 = [20, 32, 45, 38, 52, 48, 60, 55, 72, 68, 78, 82]

  return (
    <div className="min-h-screen bg-background min-w-screen">
      {/* Premium gradient background - similar to 01-06 */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-950/30 via-slate-950 to-cyan-950/30 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-6 py-8">
        {/* Header with wave animation */}
        <motion.header 
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div>
            <motion.div 
              className="flex items-center gap-3 mb-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div 
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 10 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <LineChartIcon />
              </motion.div>
              <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            </motion.div>
            <motion.p 
              className="text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Real-time insights and performance metrics
            </motion.p>
          </div>
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button variant="outline" className="border-blue-500/30 hover:bg-blue-500/10">
              <svg viewBox="0 0 24 24" className="h-4 w-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              Export
            </Button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500">
                <ZapIcon />
                <span className="ml-2">Live View</span>
              </Button>
            </motion.div>
          </motion.div>
        </motion.header>

        <WaveLine delay={0.5} />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <StatCard icon={ChartBarIcon} label="Total Revenue" value={284523} change="+12.5%" trend="up" color="blue" index={0} />
          <StatCard icon={GlobeIcon} label="Visitors" value={48291} change="+8.2%" trend="up" color="cyan" index={1} />
          <StatCard icon={ActivityIcon} label="Conversions" value={3847} change="-2.4%" trend="down" color="indigo" index={2} />
          <StatCard icon={PieChartIcon} label="Avg. Order" value={142} change="+5.1%" trend="up" color="sky" index={3} />
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2 space-y-6">
            <ChartCard 
              title="Revenue Overview" 
              subtitle="Monthly performance trend" 
              data={chartData1} 
              color="bg-gradient-to-t from-blue-600 to-blue-400" 
              index={0} 
            />
            <ChartCard 
              title="Visitor Analytics" 
              subtitle="Daily unique visitors" 
              data={chartData2} 
              color="bg-gradient-to-t from-cyan-600 to-cyan-400" 
              index={1} 
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Activity Feed */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-950 border-border/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ActivityIcon />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ActivityItem icon={TrendUpIcon} action="Revenue spike" target="+$12.4k" time="2 min ago" color="bg-emerald-500/20 text-emerald-400" index={0} />
                  <Separator className="bg-border/20" />
                  <ActivityItem icon={GlobeIcon} action="New market" target="Germany" time="15 min ago" color="bg-blue-500/20 text-blue-400" index={1} />
                  <Separator className="bg-border/20" />
                  <ActivityItem icon={ZapIcon} action="Campaign live" target="Summer Sale" time="1 hour ago" color="bg-amber-500/20 text-amber-400" index={2} />
                </CardContent>
              </Card>
            </motion.div>

            {/* Top Regions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-950 border-border/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <GlobeIcon />
                    Top Regions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GeoStat country="United States" flag="🇺🇸" value="$142.5k" percent={85} index={0} />
                  <GeoStat country="Germany" flag="🇩🇪" value="$48.2k" percent={45} index={1} />
                  <GeoStat country="Japan" flag="🇯🇵" value="$32.8k" percent={35} index={2} />
                  <GeoStat country="UK" flag="🇬🇧" value="$28.1k" percent={28} index={3} />
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
