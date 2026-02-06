'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Crown,
  Sparkles,
  Users,
  FolderKanban,
  Clock,
  Bell,
  Settings,
  ChevronRight,
  ArrowUpRight,
  Star,
  Bookmark,
  Calendar,
  FileText,
  MessageCircle,
  PlusCircle,
  Search,
  Command,
  Layers,
  Palette,
  Zap,
  TrendingUp,
  MoreHorizontal,
  Check
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'

/**
 * Design Sample 09: Premium Workspace Dashboard
 * 
 * Gold/Amber color scheme with luxurious feel.
 * Collaborative workspace with team features.
 */

const MotionCard = motion.create(Card)
const MotionDiv = motion.div

// Premium Banner
function PremiumBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 border-amber-500/30 overflow-hidden">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div 
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <Crown className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <h3 className="font-semibold text-foreground">Upgrade to Premium</h3>
              <p className="text-sm text-muted-foreground">
                Unlock unlimited workspaces, priority support, and advanced analytics.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">Later</Button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white">
                <Sparkles className="h-4 w-4 mr-2" />
                Upgrade Now
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Workspace Card
function WorkspaceCard({ 
  name, 
  icon, 
  members, 
  projects, 
  lastActive,
  starred = false,
  index
}: { 
  name: string
  icon: string
  members: number
  projects: number
  lastActive: string
  starred?: boolean
  index: number
}) {
  const [isStarred, setIsStarred] = useState(starred)

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group"
    >
      <Card className="border-border/30 bg-gradient-to-br from-neutral-900/80 to-neutral-950 hover:border-amber-500/30 transition-all cursor-pointer h-full">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <motion.div 
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center text-2xl"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              {icon}
            </motion.div>
            <motion.button
              onClick={() => setIsStarred(!isStarred)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className="p-1"
            >
              <Star 
                className={cn(
                  "h-4 w-4 transition-colors",
                  isStarred ? "text-amber-400 fill-amber-400" : "text-muted-foreground opacity-0 group-hover:opacity-100"
                )} 
              />
            </motion.button>
          </div>

          <h3 className="font-semibold text-foreground mb-1 group-hover:text-amber-400 transition-colors">
            {name}
          </h3>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {members} members
            </span>
            <span className="flex items-center gap-1">
              <FolderKanban className="h-3 w-3" />
              {projects} projects
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {lastActive}
            </span>
            <motion.div
              initial={{ opacity: 0, x: -5 }}
              whileHover={{ x: 3 }}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-4 w-4 text-amber-400" />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </MotionDiv>
  )
}

// Team Member Avatar with status
function TeamMember({ 
  name, 
  initials, 
  color, 
  status, 
  role 
}: { 
  name: string
  initials: string
  color: string
  status: 'online' | 'away' | 'offline'
  role: string
}) {
  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-amber-500',
    offline: 'bg-neutral-500',
  }

  return (
    <motion.div 
      className="flex items-center gap-3 py-2 group cursor-pointer"
      whileHover={{ x: 4 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative">
        <div 
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium text-white"
          style={{ backgroundColor: color }}
        >
          {initials}
        </div>
        <div className={cn(
          "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-neutral-900",
          statusColors[status]
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate group-hover:text-amber-400 transition-colors">
          {name}
        </p>
        <p className="text-xs text-muted-foreground truncate">{role}</p>
      </div>
      <MessageCircle className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  )
}

// Quick Action Card
function QuickActionCard({ 
  icon: Icon, 
  label, 
  description, 
  color,
  index
}: { 
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  color: string
  index: number
}) {
  const colorStyles: Record<string, string> = {
    amber: 'from-amber-500/20 to-orange-500/20 group-hover:from-amber-500/30 group-hover:to-orange-500/30',
    cyan: 'from-cyan-500/20 to-blue-500/20 group-hover:from-cyan-500/30 group-hover:to-blue-500/30',
    rose: 'from-rose-500/20 to-pink-500/20 group-hover:from-rose-500/30 group-hover:to-pink-500/30',
    green: 'from-green-500/20 to-emerald-500/20 group-hover:from-green-500/30 group-hover:to-emerald-500/30',
  }

  const iconColors: Record<string, string> = {
    amber: 'text-amber-400',
    cyan: 'text-cyan-400',
    rose: 'text-rose-400',
    green: 'text-green-400',
  }

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 + index * 0.05, duration: 0.3 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r transition-all text-left group",
        colorStyles[color]
      )}
    >
      <div className={cn("p-2 rounded-lg bg-neutral-900/50", iconColors[color])}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <span className="text-sm font-medium text-foreground block">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
    </motion.button>
  )
}

// Activity Item
function ActivityItem({ 
  user, 
  action, 
  target, 
  time, 
  index 
}: { 
  user: { name: string; initials: string; color: string }
  action: string
  target: string
  time: string
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 + index * 0.1 }}
      className="flex items-start gap-3 py-3"
    >
      <div 
        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium text-white flex-shrink-0"
        style={{ backgroundColor: user.color }}
      >
        {user.initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground font-medium">{user.name}</span>{' '}
          {action}{' '}
          <span className="text-amber-400">{target}</span>
        </p>
        <span className="text-xs text-muted-foreground">{time}</span>
      </div>
    </motion.div>
  )
}

// Stats Bar
function StatsBar() {
  const stats = [
    { label: 'Active Projects', value: '24', change: '+3' },
    { label: 'Team Members', value: '12', change: '+2' },
    { label: 'Completed Tasks', value: '847', change: '+45' },
    { label: 'Hours Logged', value: '1,234', change: '+89' },
  ]

  return (
    <motion.div 
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {stats.map((stat, i) => (
        <MotionDiv 
          key={stat.label} 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: i * 0.1, duration: 0.4 }}
        >
          <Card className="border-border/30 bg-neutral-900/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <div className="flex items-end justify-between">
                <motion.span 
                  className="text-2xl font-bold text-foreground"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  {stat.value}
                </motion.span>
                <span className="text-xs text-green-400 flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change}
                </span>
              </div>
            </CardContent>
          </Card>
        </MotionDiv>
      ))}
    </motion.div>
  )
}

// Command Palette Hint
function CommandPaletteHint() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground"
    >
      <span>Press</span>
      <kbd className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-xs font-mono flex items-center gap-1">
        <Command className="h-3 w-3" />
        K
      </kbd>
      <span>to open command palette</span>
    </motion.div>
  )
}

export default function DesignSample09() {
  const workspaces = [
    { name: 'Engineering Hub', icon: '⚙️', members: 8, projects: 12, lastActive: 'Active now', starred: true },
    { name: 'Marketing Team', icon: '📈', members: 5, projects: 8, lastActive: '2 hours ago', starred: true },
    { name: 'Product Design', icon: '🎨', members: 4, projects: 6, lastActive: '1 day ago', starred: false },
    { name: 'Sales Operations', icon: '💼', members: 6, projects: 4, lastActive: '3 hours ago', starred: false },
  ]

  const teamMembers = [
    { name: 'Alex Chen', initials: 'AC', color: '#f59e0b', status: 'online' as const, role: 'Lead Engineer' },
    { name: 'Sarah Miller', initials: 'SM', color: '#10b981', status: 'online' as const, role: 'Product Manager' },
    { name: 'Mike Johnson', initials: 'MJ', color: '#3b82f6', status: 'away' as const, role: 'Designer' },
    { name: 'Emily Davis', initials: 'ED', color: '#8b5cf6', status: 'offline' as const, role: 'Developer' },
  ]

  const activities = [
    { user: { name: 'Alex', initials: 'AC', color: '#f59e0b' }, action: 'created a new project', target: 'Mobile App v2', time: '2 minutes ago' },
    { user: { name: 'Sarah', initials: 'SM', color: '#10b981' }, action: 'commented on', target: 'Q1 Roadmap', time: '15 minutes ago' },
    { user: { name: 'Mike', initials: 'MJ', color: '#3b82f6' }, action: 'completed task in', target: 'Design System', time: '1 hour ago' },
  ]

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Warm gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-amber-950/10 via-transparent to-orange-950/10 pointer-events-none" />
      
      <div className="relative">
        {/* Header */}
        <motion.header 
          className="border-b border-border/30 bg-neutral-950/80 backdrop-blur-sm sticky top-0 z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <motion.div 
                className="flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Crown className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-foreground">Workspace</span>
              </motion.div>
              
              <div className="hidden md:flex items-center gap-1">
                <Tabs defaultValue="overview">
                  <TabsList className="bg-neutral-900/50 border border-border/30">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="projects">Projects</TabsTrigger>
                    <TabsTrigger value="team">Team</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <motion.button 
                whileHover={{ scale: 1.1 }}
                className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <Search className="h-4 w-4 text-muted-foreground" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                className="p-2 rounded-lg hover:bg-neutral-800 transition-colors relative"
              >
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <Settings className="h-4 w-4 text-muted-foreground" />
              </motion.button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xs text-white font-medium">
                AC
              </div>
            </div>
          </div>
        </motion.header>

        <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Premium Banner */}
          <PremiumBanner />

          {/* Stats */}
          <StatsBar />

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left - Workspaces */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Your Workspaces</h2>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="sm" className="border-amber-500/30 hover:bg-amber-500/10">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    New Workspace
                  </Button>
                </motion.div>
              </div>

              <motion.div 
                className="grid sm:grid-cols-2 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {workspaces.map((workspace, i) => (
                  <WorkspaceCard key={workspace.name} {...workspace} index={i} />
                ))}
              </motion.div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Quick Actions
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <QuickActionCard icon={FileText} label="New Document" description="Create blank doc" color="amber" index={0} />
                  <QuickActionCard icon={FolderKanban} label="New Project" description="Start from template" color="cyan" index={1} />
                  <QuickActionCard icon={Calendar} label="Schedule Meeting" description="Book team sync" color="rose" index={2} />
                  <QuickActionCard icon={Layers} label="Import Data" description="From external source" color="green" index={3} />
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Team Members */}
              <MotionCard 
                className="border-border/30 bg-neutral-900/50"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Team Members</CardTitle>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                      3 online
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {teamMembers.map((member, i) => (
                    <motion.div
                      key={member.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.05 }}
                    >
                      <TeamMember {...member} />
                    </motion.div>
                  ))}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    className="w-full mt-3 py-2 rounded-lg border border-dashed border-border/50 text-sm text-muted-foreground hover:text-foreground hover:border-amber-500/50 transition-colors"
                  >
                    Invite teammates
                  </motion.button>
                </CardContent>
              </MotionCard>

              {/* Recent Activity */}
              <MotionCard 
                className="border-border/30 bg-neutral-900/50"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Recent Activity</CardTitle>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      View all
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {activities.map((activity, i) => (
                    <ActivityItem key={i} {...activity} index={i} />
                  ))}
                </CardContent>
              </MotionCard>

              {/* Bookmarks */}
              <MotionCard 
                className="border-border/30 bg-neutral-900/50"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bookmark className="h-4 w-4 text-amber-400" />
                    Bookmarks
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {['Q1 Goals Document', 'Design Guidelines', 'API Documentation'].map((item, i) => (
                    <motion.button
                      key={item}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 + i * 0.05 }}
                      whileHover={{ x: 4 }}
                      className="w-full flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-neutral-800/50 text-sm text-muted-foreground hover:text-foreground transition-colors text-left group"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="flex-1">{item}</span>
                      <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                  ))}
                </CardContent>
              </MotionCard>
            </div>
          </div>

          {/* Command Palette Hint */}
          <CommandPaletteHint />
        </main>
      </div>
    </div>
  )
}
