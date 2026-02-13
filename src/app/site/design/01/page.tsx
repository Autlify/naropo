'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    LayoutDashboard,
    FolderKanban,
    Users,
    Settings,
    Bell,
    Search,
    Plus,
    ChevronRight,
    Circle,
    CheckCircle2,
    Clock,
    AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { useState } from 'react'

/**
 * Design Sample 01: Linear-Style Project Dashboard
 * 
 * Inspired by Linear app - clean, minimal, dark theme with subtle gradients
 * Focus on information density while maintaining readability
 */

// Sidebar Navigation Item
function SidebarItem({
    icon: Icon,
    label,
    active = false,
    badge
}: {
    icon: React.ElementType
    label: string
    active?: boolean
    badge?: string | number
}) {
    return (
        <button
            className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
        >
            <Icon className="h-4 w-4" />
            <span className="flex-1 text-left">{label}</span>
            {badge && (
                <Badge variant="secondary" className="h-5 min-w-5 text-xs">
                    {badge}
                </Badge>
            )}
        </button>
    )
}

// Issue Row Component
function IssueRow({
    id,
    title,
    status,
    priority,
    assignee
}: {
    id: string
    title: string
    status: 'todo' | 'in-progress' | 'done' | 'backlog'
    priority: 'urgent' | 'high' | 'medium' | 'low'
    assignee?: string
}) {
    const statusIcons = {
        'backlog': <Circle className="h-4 w-4 text-muted-foreground" />,
        'todo': <Circle className="h-4 w-4 text-blue-500" />,
        'in-progress': <Clock className="h-4 w-4 text-yellow-500" />,
        'done': <CheckCircle2 className="h-4 w-4 text-green-500" />,
    }

    const priorityColors = {
        'urgent': 'bg-red-500',
        'high': 'bg-orange-500',
        'medium': 'bg-yellow-500',
        'low': 'bg-blue-500',
    }

    return (
        <div className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer border-b border-border/50 last:border-b-0">
            <div className="w-4 h-4 rounded-full border border-muted-foreground/30" />
            {statusIcons[status]}
            <div className={cn("w-2 h-2 rounded-full", priorityColors[priority])} />
            <span className="text-xs font-mono text-muted-foreground w-16">{id}</span>
            <span className="flex-1 text-sm text-foreground truncate">{title}</span>
            {assignee && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-medium text-white">
                    {assignee.charAt(0).toUpperCase()}
                </div>
            )}
        </div>
    )
}

// Stat Card
function StatCard({
    label,
    value,
    change,
    changeType = 'neutral'
}: {
    label: string
    value: string | number
    change?: string
    changeType?: 'positive' | 'negative' | 'neutral'
}) {
    return (
        <Card className="bg-gradient-to-br from-muted/50 to-muted/20 border-border/50">
            <CardContent className="p-5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
                {change && (
                    <p className={cn(
                        "text-xs mt-2",
                        changeType === 'positive' && "text-green-500",
                        changeType === 'negative' && "text-red-500",
                        changeType === 'neutral' && "text-muted-foreground"
                    )}>
                        {change}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}

// Project Card
function ProjectCard({
    name,
    description,
    progress,
    issues,
    members
}: {
    name: string
    description: string
    progress: number
    issues: number
    members: number
}) {
    return (
        <Card className="group hover:border-foreground/20 transition-all cursor-pointer bg-gradient-to-br from-muted/30 to-transparent">
            <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{name}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-4">
                    <div
                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                    <span>{progress}% complete</span>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {issues}
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {members}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default function DesignSample01() {
    const issues = [
        { id: 'AUT-142', title: 'Implement OAuth2 authentication flow for third-party integrations', status: 'in-progress' as const, priority: 'high' as const, assignee: 'John' },
        { id: 'AUT-141', title: 'Fix memory leak in WebSocket connection handler', status: 'todo' as const, priority: 'urgent' as const, assignee: 'Sarah' },
        { id: 'AUT-140', title: 'Add export functionality for analytics dashboard', status: 'done' as const, priority: 'medium' as const, assignee: 'Mike' },
        { id: 'AUT-139', title: 'Optimize database queries for large datasets', status: 'in-progress' as const, priority: 'high' as const },
        { id: 'AUT-138', title: 'Update documentation for API v2 endpoints', status: 'backlog' as const, priority: 'low' as const, assignee: 'Anna' },
        { id: 'AUT-137', title: 'Implement dark mode toggle in settings', status: 'todo' as const, priority: 'medium' as const, assignee: 'Tom' },
    ]
    const [tab, setTab] = useState('all')
    const handleValueChange = (value: string) => {
        setTab(value)
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border bg-gradient-to-b from-muted/20 to-transparent p-4 flex flex-col">
                {/* Workspace Selector */}
                <div className="flex items-center gap-3 px-2 py-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                        A
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">Autlify</p>
                        <p className="text-xs text-muted-foreground">Enterprise</p>
                    </div>
                </div>

                <Separator className="my-4" />

                {/* Search */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full h-9 pl-9 pr-3 rounded-lg bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                </div>

                {/* Navigation */}
                <nav className="space-y-1">
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" active />
                    <SidebarItem icon={FolderKanban} label="Projects" badge={5} />
                    <SidebarItem icon={Users} label="Team" />
                    <SidebarItem icon={Bell} label="Notifications" badge={3} />
                    <SidebarItem icon={Settings} label="Settings" />
                </nav>

                <div className="flex-1" />

                {/* Bottom CTA */}
                <Button className="w-full mt-4" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Issue
                </Button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {/* Header */}
                <header className="border-b border-border px-8 py-4 flex items-center justify-between bg-gradient-to-r from-muted/10 to-transparent">
                    <div>
                        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
                        <p className="text-sm text-muted-foreground">Track progress and manage your projects</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm">
                            <Bell className="h-4 w-4" />
                        </Button>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600" />
                    </div>
                </header>

                <div className="p-8 space-y-8">
                    {/* Stats Section */}
                    <section>
                        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard label="Total Issues" value={142} change="+12 this week" changeType="positive" />
                            <StatCard label="In Progress" value={23} change="5 due today" changeType="neutral" />
                            <StatCard label="Completed" value={89} change="+8% vs last week" changeType="positive" />
                            <StatCard label="Overdue" value={7} change="-3 from last week" changeType="negative" />
                        </div>
                    </section>

                    {/* Projects Grid */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Projects</h2>
                            <Button variant="ghost" size="sm" className="text-xs">View All</Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <ProjectCard name="Platform Core" description="Core infrastructure and APIs" progress={65} issues={24} members={8} />
                            <ProjectCard name="Mobile App" description="iOS and Android applications" progress={42} issues={18} members={5} />
                            <ProjectCard name="Analytics" description="Data pipeline and dashboards" progress={89} issues={7} members={3} />
                        </div>
                    </section>

                    {/* Recent Issues */}
                    <section>
                        <Card className="border-border/50 bg-gradient-to-br from-muted/20 to-transparent">
                            <CardHeader className="pb-0">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-semibold">Recent Issues</CardTitle>
                                    <SegmentedControl 
                                    size="sm"
                                        tabs={[
                                            { id: 'all', label: "All" },
                                            { id: 'assigned', label: 'Assigned' },
                                            { id: 'created', label: 'Created' }
                                        ]}
                                        value={tab}
                                        onValueChange={handleValueChange}
                                    />
                                    {/* <Tabs defaultValue="all" className="w-auto">
                                        <TabsList className="h-8">
                                           
                                            <TabsTrigger value="all" className="text-xs px-3 h-6">All</TabsTrigger>
                                            <TabsTrigger value="assigned" className="text-xs px-3 h-6">Assigned</TabsTrigger>
                                            <TabsTrigger value="created" className="text-xs px-3 h-6">Created</TabsTrigger>
                                        </TabsList>
                                    </Tabs> */}
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 mt-4">
                                <div className="border-t border-border/50">
                                    {issues.map((issue) => (
                                        <IssueRow key={issue.id} {...issue} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </main>
        </div>
    )
}
