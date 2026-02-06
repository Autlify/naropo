'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'

/**
 * Design Sample 10: Enhanced Project Dashboard
 * 
 * Based on 01, enhanced with:
 * - Smooth spring/stagger animations
 * - Collapsible sidebar with dropdown
 * - Teal/Amber/Cyan progress bar gradients (no pink/purple)
 * - Premium icon design
 */

// Custom animated icons (avoiding boring defaults)
const GridIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
)

const LayersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
)

const PeopleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <circle cx="9" cy="7" r="4" />
    <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
    <circle cx="17" cy="11" r="3" />
    <path d="M21 21v-2a3 3 0 00-3-3h-1" />
  </svg>
)

const BellDotIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
    <circle cx="18" cy="4" r="3" fill="currentColor" className="text-teal-400" />
  </svg>
)

const GearIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
)

const ChevronIcon = ({ direction = 'right', className }: { direction?: 'up' | 'down' | 'left' | 'right'; className?: string }) => {
  const rotation = { up: -90, down: 90, left: 180, right: 0 }
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      className={cn("h-4 w-4 transition-transform duration-200", className)}
      style={{ transform: `rotate(${rotation[direction]}deg)` }}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

const StatusDot = ({ status }: { status: 'active' | 'pending' | 'done' | 'idle' }) => {
  const colors = {
    active: 'bg-teal-500',
    pending: 'bg-amber-500',
    done: 'bg-cyan-500',
    idle: 'bg-slate-500'
  }
  return (
    <motion.div 
      className={cn("w-2.5 h-2.5 rounded-full", colors[status])}
      animate={{ scale: status === 'active' ? [1, 1.2, 1] : 1 }}
      transition={{ repeat: status === 'active' ? Infinity : 0, duration: 2 }}
    />
  )
}

// Collapsible Sidebar Item with dropdown
function SidebarItem({ 
  icon: Icon, 
  label, 
  active = false,
  badge,
  children,
  collapsed
}: { 
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  active?: boolean
  badge?: string | number
  children?: React.ReactNode
  collapsed?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const hasChildren = !!children

  return (
    <div>
      <motion.button 
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
          active 
            ? "bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-foreground border border-teal-500/30" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
      >
        <Icon />
        <AnimatePresence>
          {!collapsed && (
            <motion.span 
              className="flex-1 text-left"
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
        {!collapsed && badge && (
          <Badge className="h-5 min-w-5 text-xs bg-teal-500/20 text-teal-400 border-teal-500/30">
            {badge}
          </Badge>
        )}
        {!collapsed && hasChildren && (
          <ChevronIcon direction={isOpen ? 'down' : 'right'} />
        )}
      </motion.button>

      {/* Dropdown children */}
      <AnimatePresence>
        {hasChildren && isOpen && !collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-6 mt-1 space-y-1 border-l border-border/50 pl-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Dropdown item
function DropdownItem({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <motion.button
      className={cn(
        "w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors",
        active ? "text-teal-400 bg-teal-500/10" : "text-muted-foreground hover:text-foreground"
      )}
      whileHover={{ x: 2 }}
    >
      {label}
    </motion.button>
  )
}

// Enhanced Issue Row with stagger animation
function IssueRow({ 
  id, 
  title, 
  status, 
  priority, 
  assignee,
  index
}: { 
  id: string
  title: string
  status: 'active' | 'pending' | 'done' | 'idle'
  priority: 'urgent' | 'high' | 'medium' | 'low'
  assignee?: { name: string; color: string }
  index: number
}) {
  const priorityColors = {
    'urgent': 'from-red-500 to-orange-500',
    'high': 'from-amber-500 to-yellow-500',
    'medium': 'from-teal-500 to-cyan-500',
    'low': 'from-slate-500 to-slate-400',
  }

  return (
    <motion.div 
      className="flex items-center gap-4 px-4 py-3.5 hover:bg-gradient-to-r hover:from-muted/30 hover:to-transparent transition-all cursor-pointer border-b border-border/30 last:border-b-0 group"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: 'easeOut' }}
      whileHover={{ x: 4 }}
    >
      <motion.div 
        className="w-5 h-5 rounded-md border-2 border-muted-foreground/30 group-hover:border-teal-500/50 transition-colors"
        whileHover={{ scale: 1.1 }}
      />
      <StatusDot status={status} />
      <div className={cn("w-1.5 h-6 rounded-full bg-gradient-to-b", priorityColors[priority])} />
      <span className="text-xs font-mono text-muted-foreground w-16">{id}</span>
      <span className="flex-1 text-sm text-foreground truncate group-hover:text-teal-400 transition-colors">{title}</span>
      {assignee && (
        <motion.div 
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium text-white"
          style={{ background: `linear-gradient(135deg, ${assignee.color}, ${assignee.color}88)` }}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          {assignee.name.charAt(0)}
        </motion.div>
      )}
    </motion.div>
  )
}

// Enhanced Stat Card with spring animation
function StatCard({ 
  label, 
  value, 
  change,
  changeType = 'neutral',
  index,
  gradient
}: { 
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  index: number
  gradient: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.1, 
        type: 'spring', 
        stiffness: 200, 
        damping: 20 
      }}
    >
      <Card className={cn("bg-gradient-to-br border-border/30 hover:border-border/50 transition-all group", gradient)}>
        <CardContent className="p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <motion.p 
            className="text-3xl font-bold text-foreground mt-2"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.1, type: 'spring' }}
          >
            {value}
          </motion.p>
          {change && (
            <p className={cn(
              "text-xs mt-3 flex items-center gap-1",
              changeType === 'positive' && "text-teal-400",
              changeType === 'negative' && "text-red-400",
              changeType === 'neutral' && "text-muted-foreground"
            )}>
              {changeType === 'positive' && <span className="text-lg">↗</span>}
              {changeType === 'negative' && <span className="text-lg">↘</span>}
              {change}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Enhanced Project Card with teal/amber/cyan gradients
function ProjectCard({ 
  name, 
  description, 
  progress, 
  issues, 
  members,
  color,
  index
}: { 
  name: string
  description: string
  progress: number
  issues: number
  members: number
  color: 'teal' | 'amber' | 'cyan'
  index: number
}) {
  const gradients = {
    teal: 'from-teal-500 to-emerald-500',
    amber: 'from-amber-500 to-orange-500',
    cyan: 'from-cyan-500 to-blue-500'
  }

  const bgGradients = {
    teal: 'from-teal-500/5 to-transparent',
    amber: 'from-amber-500/5 to-transparent',
    cyan: 'from-cyan-500/5 to-transparent'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group"
    >
      <Card className={cn("hover:border-foreground/20 transition-all cursor-pointer bg-gradient-to-br border-border/30", bgGradients[color])}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-teal-400 transition-colors">{name}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            </div>
            <motion.div 
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              whileHover={{ x: 3 }}
            >
              <ChevronIcon direction="right" className="text-teal-400" />
            </motion.div>
          </div>
          
          {/* Progress Bar - No pink/purple */}
          <div className="w-full h-2 bg-muted/50 rounded-full overflow-hidden mt-4">
            <motion.div 
              className={cn("h-full rounded-full bg-gradient-to-r", gradients[color])}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          
          <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className={cn("w-2 h-2 rounded-full bg-gradient-to-r", gradients[color])} />
              {progress}%
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <LayersIcon />
                {issues}
              </span>
              <span className="flex items-center gap-1.5">
                <PeopleIcon />
                {members}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function DesignSample10() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  const issues = [
    { id: 'AUT-142', title: 'Implement OAuth2 authentication flow for third-party integrations', status: 'active' as const, priority: 'high' as const, assignee: { name: 'John', color: '#14b8a6' } },
    { id: 'AUT-141', title: 'Fix memory leak in WebSocket connection handler', status: 'pending' as const, priority: 'urgent' as const, assignee: { name: 'Sarah', color: '#f59e0b' } },
    { id: 'AUT-140', title: 'Add export functionality for analytics dashboard', status: 'done' as const, priority: 'medium' as const, assignee: { name: 'Mike', color: '#06b6d4' } },
    { id: 'AUT-139', title: 'Optimize database queries for large datasets', status: 'active' as const, priority: 'high' as const },
    { id: 'AUT-138', title: 'Update documentation for API v2 endpoints', status: 'idle' as const, priority: 'low' as const, assignee: { name: 'Anna', color: '#64748b' } },
    { id: 'AUT-137', title: 'Implement dark mode toggle in settings', status: 'pending' as const, priority: 'medium' as const, assignee: { name: 'Tom', color: '#14b8a6' } },
  ]

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-teal-950/20 via-transparent to-cyan-950/20 pointer-events-none" />
      
      {/* Animated Sidebar */}
      <motion.aside 
        className="relative border-r border-border/50 bg-gradient-to-b from-slate-900/80 to-slate-950 p-4 flex flex-col z-10"
        initial={{ width: 256 }}
        animate={{ width: sidebarCollapsed ? 72 : 256 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Collapse toggle */}
        <motion.button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-slate-800 border border-border/50 flex items-center justify-center hover:bg-slate-700 transition-colors z-20"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronIcon direction={sidebarCollapsed ? 'right' : 'left'} className="h-3 w-3" />
        </motion.button>

        {/* Workspace Selector */}
        <motion.div 
          className="flex items-center gap-3 px-2 py-3"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div 
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            A
          </motion.div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div 
                className="flex-1 overflow-hidden"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
              >
                <p className="text-sm font-semibold text-foreground">Autlify</p>
                <p className="text-xs text-teal-400">Enterprise</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        <Separator className="my-4 bg-border/30" />
        
        {/* Search */}
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div 
              className="relative mb-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input 
                type="text" 
                placeholder="Search..."
                className="w-full h-10 pl-10 pr-3 rounded-xl bg-slate-800/50 border border-border/30 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Navigation with dropdowns */}
        <nav className="space-y-1">
          <SidebarItem icon={GridIcon} label="Dashboard" active collapsed={sidebarCollapsed} />
          <SidebarItem icon={LayersIcon} label="Projects" badge={5} collapsed={sidebarCollapsed}>
            <DropdownItem label="Platform Core" active />
            <DropdownItem label="Mobile App" />
            <DropdownItem label="Analytics" />
          </SidebarItem>
          <SidebarItem icon={PeopleIcon} label="Team" collapsed={sidebarCollapsed}>
            <DropdownItem label="Members" />
            <DropdownItem label="Permissions" />
            <DropdownItem label="Invites" />
          </SidebarItem>
          <SidebarItem icon={BellDotIcon} label="Notifications" badge={3} collapsed={sidebarCollapsed} />
          <SidebarItem icon={GearIcon} label="Settings" collapsed={sidebarCollapsed}>
            <DropdownItem label="General" />
            <DropdownItem label="Billing" />
            <DropdownItem label="Integrations" />
          </SidebarItem>
        </nav>
        
        <div className="flex-1" />
        
        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button 
            className={cn(
              "w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 border-0",
              sidebarCollapsed && "px-0"
            )} 
            size="sm"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {!sidebarCollapsed && <span className="ml-2">New Issue</span>}
          </Button>
        </motion.div>
      </motion.aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        {/* Header */}
        <motion.header 
          className="border-b border-border/30 px-8 py-4 flex items-center justify-between bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Track progress and manage your projects</p>
          </div>
          <div className="flex items-center gap-3">
            <motion.button 
              className="p-2 rounded-lg border border-border/30 hover:bg-muted/50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <BellDotIcon />
            </motion.button>
            <motion.div 
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500"
              whileHover={{ scale: 1.1, rotate: 5 }}
            />
          </div>
        </motion.header>
        
        <div className="p-8 space-y-8">
          {/* Stats Section */}
          <section>
            <motion.h2 
              className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Overview
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Issues" value={142} change="+12 this week" changeType="positive" index={0} gradient="from-teal-500/10 to-transparent" />
              <StatCard label="In Progress" value={23} change="5 due today" changeType="neutral" index={1} gradient="from-amber-500/10 to-transparent" />
              <StatCard label="Completed" value={89} change="+8% vs last week" changeType="positive" index={2} gradient="from-cyan-500/10 to-transparent" />
              <StatCard label="Overdue" value={7} change="-3 from last week" changeType="negative" index={3} gradient="from-red-500/10 to-transparent" />
            </div>
          </section>
          
          {/* Projects Grid */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <motion.h2 
                className="text-sm font-medium text-muted-foreground uppercase tracking-wider"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Active Projects
              </motion.h2>
              <motion.div whileHover={{ x: 3 }}>
                <Button variant="ghost" size="sm" className="text-xs text-teal-400 hover:text-teal-300">
                  View All
                  <ChevronIcon direction="right" className="ml-1 h-3 w-3" />
                </Button>
              </motion.div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ProjectCard 
                name="Platform Core" 
                description="Core infrastructure and APIs" 
                progress={65} 
                issues={24} 
                members={8} 
                color="teal" 
                index={0} 
              />
              <ProjectCard 
                name="Mobile App" 
                description="iOS and Android applications" 
                progress={42} 
                issues={18} 
                members={5} 
                color="amber" 
                index={1} 
              />
              <ProjectCard 
                name="Analytics" 
                description="Data pipeline and dashboards" 
                progress={89} 
                issues={7} 
                members={3} 
                color="cyan" 
                index={2} 
              />
            </div>
          </section>
          
          {/* Recent Issues */}
          <section>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="border-border/30 bg-gradient-to-br from-slate-900/50 to-transparent backdrop-blur-sm">
                <CardHeader className="pb-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">Recent Issues</CardTitle>
                    <Tabs defaultValue="all" className="w-auto">
                      <TabsList className="h-8 bg-slate-800/50">
                        <TabsTrigger value="all" className="text-xs px-3 h-6 data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">All</TabsTrigger>
                        <TabsTrigger value="assigned" className="text-xs px-3 h-6 data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">Assigned</TabsTrigger>
                        <TabsTrigger value="created" className="text-xs px-3 h-6 data-[state=active]:bg-teal-500/20 data-[state=active]:text-teal-400">Created</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </CardHeader>
                <CardContent className="p-0 mt-4">
                  <div className="border-t border-border/30">
                    {issues.map((issue, i) => (
                      <IssueRow key={issue.id} {...issue} index={i} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </section>
        </div>
      </main>
    </div>
  )
}
