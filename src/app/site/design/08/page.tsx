'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Circle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  FileText,
  MessageSquare,
  ChevronRight,
  ArrowRight,
  Diamond,
  Square,
  Mountain,
  Video,
  Link2,
  Calendar,
  Target,
  Layers,
  GitBranch
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'

/**
 * Design Sample 08: Linear-Style Project Overview
 * 
 * Premium slate/green color scheme mirroring Linear's project
 * management with properties, milestones, and status updates.
 */

const MotionCard = motion.create(Card)
const MotionDiv = motion.div

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

// Project Overview Card (mirrors image 5 left)
function ProjectOverviewCard() {
  const properties = [
    { label: 'In Progress', color: '#22c55e', type: 'status' },
    { label: 'ENG', icon: Users, type: 'team' },
  ]
  
  const team = [
    { initials: 'A', color: '#f59e0b' },
    { initials: 'S', color: '#3b82f6' },
    { initials: 'M', color: '#10b981' },
  ]

  const resources = [
    { label: 'Exploration', icon: Mountain, color: '#8b5cf6' },
    { label: 'User interviews', icon: Video, color: '#f59e0b' },
  ]

  const milestones = [
    { label: 'Design Review', percent: 100, color: '#22c55e', complete: true },
    { label: 'Internal Alpha', percent: 100, subtext: '100% of 10', color: '#22c55e', complete: true },
    { label: 'GA', percent: 25, subtext: '25% of 53', color: '#6b7280', complete: false },
  ]

  return (
    <MotionCard 
      className="border-border/50 bg-gradient-to-br from-slate-900/90 to-slate-950"
      variants={itemVariants}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Project Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Properties */}
        <div className="flex items-start gap-6">
          <span className="text-sm text-muted-foreground w-20 pt-0.5">Properties</span>
          <div className="flex items-center gap-2 flex-wrap">
            {properties.map((prop, i) => (
              <motion.div
                key={prop.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded text-xs",
                  prop.type === 'status' && "bg-green-500/20 text-green-400"
                )}
              >
                {prop.type === 'status' && (
                  <Circle className="h-2.5 w-2.5 fill-green-400 text-green-400" />
                )}
                {prop.icon && <prop.icon className="h-3 w-3 text-muted-foreground" />}
                <span className={prop.type === 'team' ? "text-muted-foreground" : ""}>{prop.label}</span>
              </motion.div>
            ))}
            {/* Team avatars */}
            <div className="flex -space-x-1">
              {team.map((member, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  whileHover={{ scale: 1.15, zIndex: 10 }}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] text-white font-medium border-2 border-slate-900"
                  style={{ backgroundColor: member.color }}
                >
                  {member.initials}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="flex items-start gap-6">
          <span className="text-sm text-muted-foreground w-20 pt-0.5">Resources</span>
          <div className="flex items-center gap-2 flex-wrap">
            {resources.map((res, i) => (
              <motion.div
                key={res.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/50 text-xs cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <res.icon className="h-3 w-3" style={{ color: res.color }} />
                <span className="text-muted-foreground">{res.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Milestones */}
        <div className="flex items-start gap-6">
          <span className="text-sm text-muted-foreground w-20 pt-0.5">Milestones</span>
          <div className="space-y-2">
            {milestones.map((milestone, i) => (
              <motion.div
                key={milestone.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-2"
              >
                <Diamond 
                  className={cn(
                    "h-3 w-3",
                    milestone.complete ? "text-green-400 fill-green-400" : "text-muted-foreground"
                  )} 
                />
                <span className={cn(
                  "text-sm",
                  milestone.complete ? "text-foreground" : "text-muted-foreground"
                )}>
                  {milestone.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {milestone.subtext || `${milestone.percent}%`}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </MotionCard>
  )
}

// Status Update Card (mirrors image 5 popup)
function StatusUpdateCard() {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <MotionCard 
      className="border-border/50 bg-gradient-to-br from-slate-900/90 to-slate-950 overflow-visible"
      variants={itemVariants}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4 relative">
        {/* Status selector preview */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Status</span>
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
              On track
            </Badge>
          </div>
          
          {/* Dropdown simulation */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-12 left-4 right-4 bg-slate-800 rounded-lg border border-border/50 shadow-2xl z-20 overflow-hidden"
              >
                <div className="p-1">
                  {[
                    { label: 'At risk', color: '#f59e0b', icon: AlertTriangle },
                    { label: 'On track', color: '#22c55e', icon: CheckCircle2, active: true },
                  ].map((status) => (
                    <motion.button
                      key={status.label}
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-left",
                        status.active && "bg-white/5"
                      )}
                    >
                      <status.icon className="h-4 w-4" style={{ color: status.color }} />
                      <span className="text-foreground">{status.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Separator className="bg-border/30" />
          
          {/* Update content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span className="text-sm text-green-400 font-medium">On track</span>
            </div>
            <p className="text-sm text-foreground">We are ready to launch next Thursday</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Sep 8</span>
            </div>
          </motion.div>
        </div>
      </CardContent>
    </MotionCard>
  )
}

// Collaborative Document Card (mirrors image 5 bottom)
function CollaborativeDocCard() {
  const features = [
    { label: 'Collaborative documents', active: true },
    { label: 'Inline comments', active: false },
    { label: 'Text-to-issue commands', active: false },
  ]

  return (
    <motion.div 
      className="grid lg:grid-cols-2 gap-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      {/* Left - Feature description */}
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-foreground leading-snug">
            Ideate and specify<br />what to build next
          </h2>
        </motion.div>

        <div className="space-y-1">
          {features.map((feature, i) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              className={cn(
                "flex items-center gap-3 py-2 px-3 rounded-md cursor-pointer transition-colors",
                feature.active 
                  ? "bg-green-500/10 border-l-2 border-green-500" 
                  : "hover:bg-slate-800/50 text-muted-foreground"
              )}
            >
              <span className={cn(
                "text-sm",
                feature.active ? "text-foreground font-medium" : ""
              )}>
                {feature.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right - Document preview */}
      <MotionCard 
        className="border-border/50 bg-gradient-to-br from-slate-900/90 to-slate-950"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7 }}
      >
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>Spice harvester</span>
            <ChevronRight className="h-3 w-3" />
            <span>Project specs</span>
            <span className="ml-auto text-muted-foreground/50">• • •</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Editor content */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Users className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-foreground font-medium">Collaborate on</span>
                  <motion.span
                    initial={{ backgroundColor: 'rgba(34, 197, 94, 0)' }}
                    animate={{ backgroundColor: 'rgba(34, 197, 94, 0.3)' }}
                    transition={{ delay: 1, duration: 0.3 }}
                    className="px-1 rounded text-foreground font-medium relative"
                  >
                    ideas
                    <span className="absolute -top-2 -right-2 px-1 py-0.5 bg-green-500 text-[8px] text-white rounded font-medium">
                      zoe
                    </span>
                  </motion.span>
                </div>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Write down product ideas and work together on{' '}
                  <motion.span
                    initial={{ backgroundColor: 'rgba(59, 130, 246, 0)' }}
                    animate={{ backgroundColor: 'rgba(59, 130, 246, 0.3)' }}
                    transition={{ delay: 1.2, duration: 0.3 }}
                    className="px-0.5 rounded relative"
                  >
                    feature specs
                    <span className="absolute -top-2 -right-3 px-1 py-0.5 bg-blue-500 text-[8px] text-white rounded font-medium">
                      quinn
                    </span>
                  </motion.span>{' '}
                  in realtime, multiplayer project documents. Add **style** and ##structure with rich-text formatting options.
                </p>
              </div>
            </div>

            {/* Skeleton lines */}
            <div className="space-y-3 pt-4">
              {[80, 65, 90, 45, 70, 55].map((width, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 0.3, scaleX: 1 }}
                  transition={{ delay: 1.1 + i * 0.05, duration: 0.3 }}
                  className="h-2 bg-slate-700/50 rounded origin-left"
                  style={{ width: `${width}%` }}
                />
              ))}
            </div>
          </motion.div>
        </CardContent>
      </MotionCard>
    </motion.div>
  )
}

// Roadmap Timeline Card
function RoadmapCard() {
  const items = [
    { label: 'Research & Planning', status: 'complete', date: 'Jan 2026' },
    { label: 'Design System', status: 'complete', date: 'Feb 2026' },
    { label: 'org.Features', status: 'current', date: 'Mar 2026' },
    { label: 'Beta Launch', status: 'upcoming', date: 'Apr 2026' },
    { label: 'Public Release', status: 'upcoming', date: 'May 2026' },
  ]

  return (
    <MotionCard 
      className="border-border/50 bg-gradient-to-br from-slate-900/90 to-slate-950"
      variants={itemVariants}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Roadmap</CardTitle>
          <Badge className="bg-slate-800 text-muted-foreground border-0 text-xs">
            Q1 2026
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[7px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-green-500 via-green-500 to-slate-700" />
          
          <div className="space-y-4">
            {items.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-4 relative"
              >
                <motion.div 
                  className={cn(
                    "w-4 h-4 rounded-full border-2 z-10 flex items-center justify-center",
                    item.status === 'complete' && "bg-green-500 border-green-500",
                    item.status === 'current' && "bg-slate-900 border-green-500",
                    item.status === 'upcoming' && "bg-slate-900 border-slate-700"
                  )}
                  whileHover={{ scale: 1.2 }}
                >
                  {item.status === 'current' && (
                    <motion.div 
                      className="w-2 h-2 rounded-full bg-green-500"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  )}
                </motion.div>
                <div className="flex-1 flex items-center justify-between">
                  <span className={cn(
                    "text-sm",
                    item.status === 'upcoming' ? "text-muted-foreground" : "text-foreground"
                  )}>
                    {item.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{item.date}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </MotionCard>
  )
}

// Quick Links Card
function QuickLinksCard() {
  const links = [
    { icon: GitBranch, label: 'Repository', count: 24 },
    { icon: Target, label: 'Issues', count: 156 },
    { icon: Layers, label: 'Cycles', count: 8 },
    { icon: FileText, label: 'Docs', count: 42 },
  ]

  return (
    <MotionCard 
      className="border-border/50 bg-gradient-to-br from-slate-900/90 to-slate-950"
      variants={itemVariants}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Quick Links</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {links.map((link, i) => (
          <motion.button
            key={link.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors text-left group"
          >
            <link.icon className="h-4 w-4 text-muted-foreground group-hover:text-green-400 transition-colors" />
            <div>
              <span className="text-sm text-foreground">{link.label}</span>
              <span className="text-xs text-muted-foreground ml-2">{link.count}</span>
            </div>
          </motion.button>
        ))}
      </CardContent>
    </MotionCard>
  )
}

export default function DesignSample08() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Subtle gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-green-950/10 via-transparent to-slate-900/30 pointer-events-none" />
      
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
              className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <Layers className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Project Hub</h1>
              <p className="text-sm text-muted-foreground">Linear-style project management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="border-slate-700">
              <Link2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="sm" className="bg-green-600 hover:bg-green-500">
                <Target className="h-4 w-4 mr-2" />
                New Issue
              </Button>
            </motion.div>
          </div>
        </motion.header>

        {/* Main Grid */}
        <motion.div 
          className="grid lg:grid-cols-3 gap-6 mb-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left column - Project Overview */}
          <div className="lg:col-span-2">
            <ProjectOverviewCard />
          </div>

          {/* Right column - Roadmap */}
          <RoadmapCard />
        </motion.div>

        {/* Status & Quick Links Row */}
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
        >
          <StatusUpdateCard />
          <QuickLinksCard />
          
          {/* Activity Summary */}
          <MotionCard 
            className="border-border/50 bg-gradient-to-br from-slate-900/90 to-slate-950"
            variants={itemVariants}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">This Week</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Issues closed', value: 23, change: '+8' },
                { label: 'PRs merged', value: 15, change: '+3' },
                { label: 'Comments', value: 47, change: '+12' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-foreground">{stat.value}</span>
                    <span className="text-xs text-green-400">{stat.change}</span>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </MotionCard>
        </motion.div>

        <Separator className="bg-border/30 mb-10" />

        {/* Collaborative Documents Section */}
        <CollaborativeDocCard />
      </div>
    </div>
  )
}
