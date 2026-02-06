'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  GitBranch,
  GitCommit,
  Globe,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  MoreHorizontal,
  Rocket,
  Activity,
  Settings,
  Users,
  Database,
  Shield,
  ChevronRight,
  Copy,
  RotateCcw,
  Eye,
  Terminal,
  Zap,
  Box
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Design Sample 06: Vercel-Style Deployment Dashboard
 * 
 * Clean deployment management with build logs,
 * domain management, and project analytics
 */

// Deployment Status Badge
function DeploymentStatus({ status }: { status: 'building' | 'ready' | 'error' | 'cancelled' | 'queued' }) {
  const styles = {
    building: { icon: Loader2, className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', iconClass: 'animate-spin' },
    ready: { icon: CheckCircle2, className: 'bg-green-500/20 text-green-400 border-green-500/30', iconClass: '' },
    error: { icon: XCircle, className: 'bg-red-500/20 text-red-400 border-red-500/30', iconClass: '' },
    cancelled: { icon: XCircle, className: 'bg-muted text-muted-foreground border-border', iconClass: '' },
    queued: { icon: Clock, className: 'bg-blue-500/20 text-blue-400 border-blue-500/30', iconClass: '' },
  }
  
  const { icon: Icon, className, iconClass } = styles[status]
  
  return (
    <Badge className={cn("text-xs font-medium gap-1", className)}>
      <Icon className={cn("h-3 w-3", iconClass)} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

// Deployment Row
function DeploymentRow({ 
  branch,
  commit,
  commitMessage,
  status,
  time,
  duration,
  author,
  production = false
}: {
  branch: string
  commit: string
  commitMessage: string
  status: 'building' | 'ready' | 'error' | 'cancelled' | 'queued'
  time: string
  duration?: string
  author: { name: string; initials: string; color: string }
  production?: boolean
}) {
  return (
    <div className="group flex items-center gap-4 px-4 py-4 border-b border-border/30 hover:bg-muted/20 transition-colors">
      {/* Status */}
      <DeploymentStatus status={status} />
      
      {/* Production Badge */}
      {production && (
        <Badge variant="secondary" className="text-[10px] bg-foreground/10 text-foreground border-0">
          Production
        </Badge>
      )}
      
      {/* Branch & Commit */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm">
            <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-medium text-foreground">{branch}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <GitCommit className="h-3.5 w-3.5" />
            <span className="font-mono">{commit}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground truncate mt-0.5">{commitMessage}</p>
      </div>
      
      {/* Duration */}
      {duration && (
        <span className="text-xs text-muted-foreground">{duration}</span>
      )}
      
      {/* Time */}
      <span className="text-xs text-muted-foreground whitespace-nowrap">{time}</span>
      
      {/* Author */}
      <div 
        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium text-white"
        style={{ backgroundColor: author.color }}
        title={author.name}
      >
        {author.initials}
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {status === 'ready' && (
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

// Domain Card
function DomainCard({ 
  domain, 
  primary = false,
  valid = true,
  redirect
}: { 
  domain: string
  primary?: boolean
  valid?: boolean
  redirect?: string
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
      <div className="flex items-center gap-3">
        <Globe className={cn("h-4 w-4", valid ? "text-green-400" : "text-yellow-400")} />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{domain}</span>
            {primary && (
              <Badge className="text-[10px] bg-muted border-border">Primary</Badge>
            )}
          </div>
          {redirect && (
            <span className="text-xs text-muted-foreground">Redirects to {redirect}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

// Environment Variable Row
function EnvVarRow({ name, value, decrypted = false }: { name: string; value: string; decrypted?: boolean }) {
  return (
    <div className="flex items-center gap-4 py-2 font-mono text-sm">
      <span className="text-foreground">{name}</span>
      <span className="text-muted-foreground">=</span>
      <span className="flex-1 text-muted-foreground truncate">
        {decrypted ? value : '••••••••••••••••'}
      </span>
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
        <Eye className="h-3 w-3" />
      </Button>
    </div>
  )
}

// Build Log Preview
function BuildLogPreview() {
  const logs = [
    { type: 'info', message: 'Cloning github.com/autlify/autlify (Branch: main, Commit: 3a8f2d1)' },
    { type: 'info', message: 'Installing dependencies...' },
    { type: 'success', message: 'Dependencies installed successfully' },
    { type: 'info', message: 'Running build command: next build' },
    { type: 'info', message: 'Creating an optimized production build...' },
    { type: 'success', message: 'Compiled successfully' },
    { type: 'info', message: 'Collecting page data...' },
    { type: 'info', message: 'Generating static pages (24/24)' },
    { type: 'success', message: 'Build completed in 42s' },
  ]
  
  return (
    <div className="bg-[#0a0a0a] rounded-lg border border-border/50 p-4 font-mono text-xs overflow-hidden">
      <div className="space-y-1">
        {logs.map((log, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-muted-foreground w-8">{String(i + 1).padStart(2, '0')}</span>
            <span className={cn(
              log.type === 'success' && 'text-green-400',
              log.type === 'error' && 'text-red-400',
              log.type === 'info' && 'text-muted-foreground'
            )}>
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Stat Card
function StatCard({ label, value, icon: Icon, trend }: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; trend?: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/30 border border-border/30">
      <div className="p-2 rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">{value}</span>
          {trend && <span className="text-xs text-green-400">{trend}</span>}
        </div>
      </div>
    </div>
  )
}

// Navigation Item
function NavItem({ icon: Icon, label, active = false, badge }: { icon: React.ComponentType<{ className?: string }>; label: string; active?: boolean; badge?: string }) {
  return (
    <button className={cn(
      "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors",
      active 
        ? "bg-muted text-foreground" 
        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
    )}>
      <Icon className="h-4 w-4" />
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <Badge className="text-[10px] bg-muted border-border">{badge}</Badge>
      )}
    </button>
  )
}

export default function DesignSample06() {
  const deployments = [
    { branch: 'main', commit: '3a8f2d1', commitMessage: 'feat: add passkey authentication flow', status: 'ready' as const, time: '2 minutes ago', duration: '42s', author: { name: 'Zayn Tan', initials: 'ZT', color: '#6366f1' }, production: true },
    { branch: 'main', commit: 'f92c1a4', commitMessage: 'fix: resolve subscription modal issue', status: 'ready' as const, time: '1 hour ago', duration: '38s', author: { name: 'Jack Doe', initials: 'JD', color: '#f59e0b' } },
    { branch: 'feature/analytics', commit: 'b7e3d09', commitMessage: 'wip: analytics dashboard components', status: 'building' as const, time: 'Just now', author: { name: 'Maya Kim', initials: 'MK', color: '#ec4899' } },
    { branch: 'fix/auth-redirect', commit: '8c4a2f1', commitMessage: 'fix: auth redirect loop on mobile', status: 'error' as const, time: '3 hours ago', duration: '12s', author: { name: 'Zayn Tan', initials: 'ZT', color: '#6366f1' } },
    { branch: 'main', commit: 'e5d1c8a', commitMessage: 'chore: update dependencies', status: 'ready' as const, time: '5 hours ago', duration: '45s', author: { name: 'Jack Doe', initials: 'JD', color: '#f59e0b' } },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="border-b border-border/50 bg-background">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-foreground flex items-center justify-center">
                <Box className="h-4 w-4 text-background" />
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-foreground">autlify</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">autlify-app</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">Feedback</Button>
            <Button variant="ghost" size="sm">Docs</Button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-medium text-white">
              ZT
            </div>
          </div>
        </div>
      </header>
      
      {/* Project Header */}
      <div className="border-b border-border/50 bg-gradient-to-b from-muted/30 to-transparent">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Rocket className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">autlify-app</h1>
                <div className="flex items-center gap-3 mt-1">
                  <a href="#" className="text-sm text-blue-400 hover:underline flex items-center gap-1">
                    autlify.com
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">Production</span>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Healthy
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <GitBranch className="h-4 w-4 mr-2" />
                Connect Git
              </Button>
              <Button size="sm">
                <Zap className="h-4 w-4 mr-2" />
                Deploy
              </Button>
            </div>
          </div>
          
          {/* Project Tabs */}
          <Tabs defaultValue="deployments" className="mt-6">
            <TabsList className="bg-transparent border-b border-border/50 rounded-none p-0 h-auto gap-6">
              {['Project', 'Deployments', 'Analytics', 'Speed Insights', 'Logs', 'Storage', 'Settings'].map((tab) => (
                <TabsTrigger 
                  key={tab}
                  value={tab.toLowerCase().replace(' ', '-')}
                  className={cn(
                    "bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent pb-3 px-0",
                    tab === 'Deployments' && "border-foreground"
                  )}
                >
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Deployments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Deployments" value="247" icon={Rocket} trend="+12 today" />
              <StatCard label="Avg Build Time" value="38s" icon={Clock} />
              <StatCard label="Success Rate" value="98.2%" icon={CheckCircle2} />
            </div>
            
            {/* Deployments List */}
            <Card className="border-border/50 bg-gradient-to-br from-muted/20 to-transparent">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base">Deployments</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-7">
                    All Branches
                    <ChevronRight className="h-3 w-3 ml-1 rotate-90" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {deployments.map((deployment, i) => (
                  <DeploymentRow key={i} {...deployment} />
                ))}
              </CardContent>
            </Card>
            
            {/* Build Logs */}
            <Card className="border-border/50 bg-gradient-to-br from-muted/20 to-transparent">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">Build Logs</CardTitle>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                    Build Successful
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" className="h-7">
                  View Full Logs
                </Button>
              </CardHeader>
              <CardContent>
                <BuildLogPreview />
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Domains */}
            <Card className="border-border/50 bg-gradient-to-br from-muted/20 to-transparent">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Domains</CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  Add Domain
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                <DomainCard domain="autlify.com" primary valid />
                <DomainCard domain="www.autlify.com" redirect="autlify.com" valid />
                <DomainCard domain="autlify.vercel.app" valid />
              </CardContent>
            </Card>
            
            {/* Environment Variables */}
            <Card className="border-border/50 bg-gradient-to-br from-muted/20 to-transparent">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">Environment Variables</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  Edit
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                <EnvVarRow name="DATABASE_URL" value="postgresql://..." />
                <EnvVarRow name="NEXTAUTH_SECRET" value="secret123..." />
                <EnvVarRow name="STRIPE_SECRET_KEY" value="sk_live_..." />
              </CardContent>
            </Card>
            
            {/* Quick Actions */}
            <Card className="border-border/50 bg-gradient-to-br from-muted/20 to-transparent">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 pt-0">
                <NavItem icon={Rocket} label="Deployments" active />
                <NavItem icon={Activity} label="Analytics" badge="New" />
                <NavItem icon={Database} label="Storage" />
                <NavItem icon={Users} label="Team" badge="3" />
                <NavItem icon={Settings} label="Settings" />
              </CardContent>
            </Card>
            
            {/* Redeploy Button */}
            <Button variant="outline" className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Redeploy Production
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
