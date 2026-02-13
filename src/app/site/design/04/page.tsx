'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Circle,
  CheckCircle2,
  Clock,
  Pause,
  AlertCircle,
  Plus,
  Filter,
  LayoutGrid,
  List,
  Calendar,
  MoreHorizontal,
  CircleDot,
  ChevronRight,
  ArrowUpRight,
  Target,
  Zap,
  Users,
  GitBranch,
  MessageSquare,
  Link2
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Design Sample 04: Linear-Style Project Management
 * 
 * Inspired by Linear's clean, keyboard-first design with
 * issue tracking, cycles, and project views
 */

// Issue status icons
const statusIcons = {
  backlog: Circle,
  todo: CircleDot,
  'in-progress': Clock,
  'in-review': Pause,
  done: CheckCircle2,
  cancelled: AlertCircle,
}

const statusColors = {
  backlog: 'text-muted-foreground',
  todo: 'text-muted-foreground',
  'in-progress': 'text-yellow-500',
  'in-review': 'text-purple-500',
  done: 'text-green-500',
  cancelled: 'text-red-500',
}

const priorityColors = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
  none: 'bg-muted',
}

// Issue Row Component
function IssueRow({ 
  id,
  title,
  status,
  priority,
  assignee,
  project,
  labels,
  comments
}: {
  id: string
  title: string
  status: keyof typeof statusIcons
  priority: keyof typeof priorityColors
  assignee?: { initials: string; color: string }
  project?: string
  labels?: { name: string; color: string }[]
  comments?: number
}) {
  const StatusIcon = statusIcons[status]
  
  return (
    <div className="group flex items-center gap-3 px-4 py-2.5 border-b border-border/30 hover:bg-muted/30 transition-colors cursor-pointer">
      {/* Priority indicator */}
      <div className={cn("w-1 h-4 rounded-full", priorityColors[priority])} />
      
      {/* Status Icon */}
      <button className="p-0.5 hover:bg-muted rounded transition-colors">
        <StatusIcon className={cn("h-4 w-4", statusColors[status])} />
      </button>
      
      {/* Issue ID */}
      <span className="text-xs text-muted-foreground font-mono w-16">{id}</span>
      
      {/* Title */}
      <span className="flex-1 text-sm text-foreground truncate">{title}</span>
      
      {/* Labels */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {labels?.map((label) => (
          <span 
            key={label.name}
            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
            style={{ backgroundColor: `${label.color}20`, color: label.color }}
          >
            {label.name}
          </span>
        ))}
      </div>
      
      {/* Comments */}
      {comments && comments > 0 && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <MessageSquare className="h-3 w-3" />
          <span className="text-xs">{comments}</span>
        </div>
      )}
      
      {/* Project */}
      {project && (
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
          {project}
        </span>
      )}
      
      {/* Assignee */}
      {assignee && (
        <div 
          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium text-white"
          style={{ backgroundColor: assignee.color }}
        >
          {assignee.initials}
        </div>
      )}
      
      {/* More actions */}
      <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-all">
        <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </div>
  )
}

// Cycle Progress Card
function CycleCard({ 
  name,
  progress,
  issues,
  completed,
  dateRange,
  active = false
}: {
  name: string
  progress: number
  issues: number
  completed: number
  dateRange: string
  active?: boolean
}) {
  return (
    <Card className={cn(
      "border-border/50 bg-gradient-to-br from-muted/30 to-transparent transition-all cursor-pointer hover:border-border",
      active && "border-primary/50 bg-primary/5"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
            <span className="font-medium text-sm text-foreground">{name}</span>
            {active && <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">Active</Badge>}
          </div>
          <span className="text-xs text-muted-foreground">{dateRange}</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{completed} of {issues} issues</span>
            <span className="text-foreground font-medium">{progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all",
                active ? "bg-primary" : "bg-muted-foreground"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Project Card
function ProjectCard({
  name,
  icon,
  color,
  issues,
  lead
}: {
  name: string
  icon: string
  color: string
  issues: number
  lead: { name: string; initials: string }
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer group">
      <div 
        className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
        style={{ backgroundColor: `${color}20` }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">{name}</span>
          <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <span className="text-xs text-muted-foreground">{issues} issues</span>
      </div>
      <div 
        className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-medium text-white"
        style={{ backgroundColor: color }}
      >
        {lead.initials}
      </div>
    </div>
  )
}

// Quick Filter Button
function QuickFilter({ label, count, active = false }: { label: string; count?: number; active?: boolean }) {
  return (
    <button className={cn(
      "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors",
      active 
        ? "bg-primary/10 text-primary" 
        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
    )}>
      {label}
      {count !== undefined && (
        <span className={cn(
          "px-1 py-0.5 rounded text-[10px]",
          active ? "bg-primary/20" : "bg-muted"
        )}>
          {count}
        </span>
      )}
    </button>
  )
}

export default function DesignSample04() {
  const issues = [
    { id: 'AUT-142', title: 'Implement passkey authentication flow', status: 'in-progress' as const, priority: 'high' as const, assignee: { initials: 'ZT', color: '#6366f1' }, project: 'Auth', labels: [{ name: 'feature', color: '#22c55e' }], comments: 3 },
    { id: 'AUT-141', title: 'Fix subscription upgrade modal not closing', status: 'in-review' as const, priority: 'urgent' as const, assignee: { initials: 'JD', color: '#f59e0b' }, project: 'Billing', labels: [{ name: 'bug', color: '#ef4444' }], comments: 5 },
    { id: 'AUT-140', title: 'Add usage analytics to dashboard', status: 'todo' as const, priority: 'medium' as const, project: 'Dashboard', labels: [{ name: 'enhancement', color: '#3b82f6' }] },
    { id: 'AUT-139', title: 'Create onboarding wizard for new agencies', status: 'in-progress' as const, priority: 'high' as const, assignee: { initials: 'MK', color: '#ec4899' }, project: 'Onboard' },
    { id: 'AUT-138', title: 'Optimize database queries for project listing', status: 'done' as const, priority: 'low' as const, assignee: { initials: 'ZT', color: '#6366f1' }, labels: [{ name: 'performance', color: '#8b5cf6' }] },
    { id: 'AUT-137', title: 'Add dark mode support to email templates', status: 'backlog' as const, priority: 'none' as const },
    { id: 'AUT-136', title: 'Implement file upload progress indicator', status: 'todo' as const, priority: 'medium' as const, assignee: { initials: 'JD', color: '#f59e0b' }, project: 'Upload' },
    { id: 'AUT-135', title: 'Update legal pages with new privacy policy', status: 'done' as const, priority: 'high' as const, assignee: { initials: 'MK', color: '#ec4899' } },
  ]

  const projects = [
    { name: 'Authentication', icon: '🔐', color: '#6366f1', issues: 24, lead: { name: 'Zayn Tan', initials: 'ZT' } },
    { name: 'Billing System', icon: '💳', color: '#22c55e', issues: 18, lead: { name: 'Jack Doe', initials: 'JD' } },
    { name: 'Dashboard', icon: '📊', color: '#f59e0b', issues: 32, lead: { name: 'Maya Kim', initials: 'MK' } },
    { name: 'API Platform', icon: '⚡', color: '#3b82f6', issues: 15, lead: { name: 'Zayn Tan', initials: 'ZT' } },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-semibold text-foreground">Autlify</span>
            </div>
            
            <nav className="flex items-center gap-1">
              {['Inbox', 'My Issues', 'Active', 'Backlog'].map((item) => (
                <button
                  key={item}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md transition-colors",
                    item === 'Active' 
                      ? "bg-muted text-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <div className="h-4 w-px bg-border" />
            <Tabs defaultValue="list">
              <TabsList className="h-8 bg-muted/50">
                <TabsTrigger value="list" className="h-6 w-6 p-0">
                  <List className="h-3.5 w-3.5" />
                </TabsTrigger>
                <TabsTrigger value="board" className="h-6 w-6 p-0">
                  <LayoutGrid className="h-3.5 w-3.5" />
                </TabsTrigger>
                <TabsTrigger value="calendar" className="h-6 w-6 p-0">
                  <Calendar className="h-3.5 w-3.5" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>
      
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border/50 h-[calc(100vh-53px)] p-4 space-y-6 flex-shrink-0">
          {/* Cycles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cycles</span>
              <button className="p-1 hover:bg-muted rounded transition-colors">
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-2">
              <CycleCard 
                name="Sprint 24" 
                progress={68} 
                issues={24} 
                completed={16}
                dateRange="Feb 10 - Feb 24"
                active
              />
              <CycleCard 
                name="Sprint 25" 
                progress={0} 
                issues={12} 
                completed={0}
                dateRange="Feb 24 - Mar 10"
              />
            </div>
          </div>
          
          <Separator className="bg-border/50" />
          
          {/* Projects */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Projects</span>
              <button className="p-1 hover:bg-muted rounded transition-colors">
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-1">
              {projects.map((project) => (
                <ProjectCard key={project.name} {...project} />
              ))}
            </div>
          </div>
          
          <Separator className="bg-border/50" />
          
          {/* Team */}
          <div className="space-y-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Team</span>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[
                  { initials: 'ZT', color: '#6366f1' },
                  { initials: 'JD', color: '#f59e0b' },
                  { initials: 'MK', color: '#ec4899' },
                ].map((member) => (
                  <div
                    key={member.initials}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium text-white border-2 border-background"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.initials}
                  </div>
                ))}
              </div>
              <button className="w-7 h-7 rounded-full flex items-center justify-center border-2 border-dashed border-border hover:border-muted-foreground transition-colors">
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-lg font-semibold text-foreground">Active Issues</h1>
              <p className="text-sm text-muted-foreground">24 issues in Sprint 24</p>
            </div>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Issue
            </Button>
          </div>
          
          {/* Quick Filters */}
          <div className="flex items-center gap-2 mb-4">
            <QuickFilter label="All" active />
            <QuickFilter label="My Issues" count={5} />
            <QuickFilter label="In Progress" count={8} />
            <QuickFilter label="Bugs" count={3} />
            <QuickFilter label="Features" count={12} />
          </div>
          
          {/* Issues List */}
          <Card className="border-border/50 bg-gradient-to-br from-muted/20 to-transparent">
            <CardContent className="p-0">
              {/* Group Header */}
              <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-b border-border/30">
                <Clock className="h-3.5 w-3.5 text-yellow-500" />
                <span className="text-xs font-medium text-foreground">In Progress</span>
                <Badge className="text-[10px] bg-yellow-500/20 text-yellow-500 border-yellow-500/30 h-4">2</Badge>
              </div>
              {issues.filter(i => i.status === 'in-progress').map((issue) => (
                <IssueRow key={issue.id} {...issue} />
              ))}
              
              {/* Group Header */}
              <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-b border-border/30">
                <Pause className="h-3.5 w-3.5 text-purple-500" />
                <span className="text-xs font-medium text-foreground">In Review</span>
                <Badge className="text-[10px] bg-purple-500/20 text-purple-500 border-purple-500/30 h-4">1</Badge>
              </div>
              {issues.filter(i => i.status === 'in-review').map((issue) => (
                <IssueRow key={issue.id} {...issue} />
              ))}
              
              {/* Group Header */}
              <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-b border-border/30">
                <CircleDot className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">Todo</span>
                <Badge className="text-[10px] bg-muted border-border h-4">2</Badge>
              </div>
              {issues.filter(i => i.status === 'todo').map((issue) => (
                <IssueRow key={issue.id} {...issue} />
              ))}
              
              {/* Group Header */}
              <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-b border-border/30">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                <span className="text-xs font-medium text-foreground">Done</span>
                <Badge className="text-[10px] bg-green-500/20 text-green-500 border-green-500/30 h-4">2</Badge>
              </div>
              {issues.filter(i => i.status === 'done').map((issue) => (
                <IssueRow key={issue.id} {...issue} />
              ))}
            </CardContent>
          </Card>
          
          {/* Keyboard Shortcuts Hint */}
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">C</kbd>
              New Issue
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">J</kbd>
              Next
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">K</kbd>
              Previous
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">?</kbd>
              All shortcuts
            </span>
          </div>
        </main>
      </div>
    </div>
  )
}
