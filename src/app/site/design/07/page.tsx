'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Sparkles,
  Users,
  Check,
  MessageSquare,
  Paperclip,
  Search,
  Lightbulb,
  ChevronRight,
  ArrowUpRight,
  Zap,
  Shield,
  Globe,
  BarChart3,
  Clock,
  TrendingUp,
  Send
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'

/**
 * Design Sample 07: AI-Powered Dashboard
 * 
 * Premium emerald/teal color scheme with smooth animations.
 * Features triage intelligence cards and AI assistant interface.
 */

// Animated container wrapper
const MotionCard = motion.create(Card)
const MotionDiv = motion.div

// Triage Intelligence Card (mirrors image 4)
function TriageIntelligenceCard() {
  const suggestions = [
    { name: 'alex', avatar: 'A', color: '#10b981' },
    { name: 'Mobile App Refactor', type: 'project', color: '#6b7280' },
    { name: 'Backend', type: 'label', color: '#ef4444' }
  ]
  
  const alternatives = [
    { name: 'sarah', avatar: 'S', color: '#f59e0b' },
    { name: 'mike', avatar: 'M', color: '#3b82f6' }
  ]

  return (
    <MotionCard 
      className="border-border/50 bg-gradient-to-br from-neutral-900/80 to-neutral-950 overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <CardTitle className="text-sm">
            <span className="text-emerald-400">Triage</span>{' '}
            <span className="text-foreground">Intelligence</span>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Suggestions Row */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground w-20">Suggestions</span>
          <div className="flex items-center gap-2">
            {suggestions.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs",
                  item.type === 'label' && "bg-red-500/20 text-red-400",
                  item.type === 'project' && "bg-muted text-muted-foreground",
                  !item.type && "bg-muted"
                )}
              >
                {!item.type && (
                  <div 
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-medium"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.avatar}
                  </div>
                )}
                <span>{item.name}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Duplicate of */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground w-20">Duplicate of</span>
          <span className="text-sm text-muted-foreground">—</span>
        </div>

        {/* Related to */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground w-20">Related to</span>
          <span className="text-sm text-muted-foreground">—</span>
        </div>

        <Separator className="bg-border/30" />

        {/* Assignment Suggestion */}
        <motion.div 
          className="bg-neutral-800/50 rounded-lg p-4 space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] text-white font-medium">
              A
            </div>
            <span className="text-sm font-medium text-foreground">alex</span>
          </div>

          <div>
            <p className="text-xs font-medium text-foreground mb-1">Why this assignee was suggested</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This person was the assignee on previous issues related to performance problems in the mobile app launch flow
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-foreground mb-2">Alternatives</p>
            <div className="flex items-center gap-2">
              {alternatives.map((alt) => (
                <motion.div
                  key={alt.name}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 border border-dashed border-border cursor-pointer hover:border-emerald-500/50 transition-colors"
                >
                  <div 
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white font-medium"
                    style={{ backgroundColor: alt.color }}
                  >
                    {alt.avatar}
                  </div>
                  <span className="text-xs text-muted-foreground">{alt.name}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-md bg-neutral-700 hover:bg-neutral-600 transition-colors text-sm text-foreground"
          >
            <Check className="h-4 w-4" />
            Accept suggestion
          </motion.button>
        </motion.div>
      </CardContent>
    </MotionCard>
  )
}

// AI Chat Interface Card
function AIChatCard() {
  return (
    <MotionCard 
      className="border-border/50 bg-gradient-to-br from-neutral-900/80 to-neutral-950"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <CardContent className="p-4 space-y-4">
        {/* Code Preview */}
        <motion.div 
          className="bg-neutral-800/50 rounded-lg p-3 font-mono text-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-muted-foreground mb-1">//mcp.linear.app/sse</p>
          <p className="text-emerald-400">&quot;mcpServers&quot;: {'{'}</p>
          <p className="text-amber-400 pl-4">&quot;linear&quot;: {'{'}</p>
          <p className="text-muted-foreground pl-8">&quot;command&quot;: <span className="text-amber-300">&quot;npx&quot;</span></p>
        </motion.div>

        {/* Input Area */}
        <motion.div 
          className="bg-neutral-800/30 rounded-xl p-4 border border-border/30"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-0.5 h-5 bg-emerald-500 rounded" />
            <span className="text-sm text-muted-foreground">Ask anything</span>
          </div>

          <div className="flex items-center gap-2">
            {[
              { icon: Paperclip, label: 'Attach' },
              { icon: Search, label: 'Search' },
              { icon: Lightbulb, label: 'Reason' }
            ].map((action, i) => (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 text-xs text-muted-foreground hover:text-emerald-400 hover:border-emerald-500/50 transition-colors"
              >
                <action.icon className="h-3.5 w-3.5" />
                {action.label}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </CardContent>
    </MotionCard>
  )
}

// Metric Card with animation
function MetricCard({ 
  label, 
  value, 
  change, 
  trend,
  icon: Icon,
  color,
  index
}: { 
  label: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: React.ComponentType<{ className?: string }>
  color: string
  index: number
}) {
  const colorStyles: Record<string, string> = {
    emerald: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20',
    amber: 'from-amber-500/10 to-orange-500/10 border-amber-500/20',
    cyan: 'from-cyan-500/10 to-blue-500/10 border-cyan-500/20',
    rose: 'from-rose-500/10 to-red-500/10 border-rose-500/20',
  }
  
  const iconColors: Record<string, string> = {
    emerald: 'text-emerald-400 bg-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/20',
    rose: 'text-rose-400 bg-rose-500/20',
  }

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      <Card className={cn("bg-gradient-to-br border", colorStyles[color])}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">{label}</span>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
              >
                <span className="text-3xl font-bold text-foreground">{value}</span>
              </motion.div>
              <div className={cn(
                "flex items-center gap-1 text-sm",
                trend === 'up' ? "text-emerald-400" : "text-rose-400"
              )}>
                <TrendingUp className={cn("h-3.5 w-3.5", trend === 'down' && "rotate-180")} />
                <span>{change}</span>
                <span className="text-muted-foreground">vs last period</span>
              </div>
            </div>
            <motion.div 
              className={cn("p-2.5 rounded-xl", iconColors[color])}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <Icon className="h-5 w-5" />
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </MotionDiv>
  )
}

// Sparkline with animation
function AnimatedSparkline({ data, color = 'emerald' }: { data: number[]; color?: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  
  const colorClasses: Record<string, string> = {
    emerald: 'from-emerald-600 to-emerald-400',
    cyan: 'from-cyan-600 to-cyan-400',
    amber: 'from-amber-600 to-amber-400',
  }
  
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((value, i) => (
        <motion.div
          key={i}
          className={cn("w-1 rounded-full bg-gradient-to-t", colorClasses[color])}
          initial={{ height: 4 }}
          animate={{ height: `${((value - min) / range) * 100}%` }}
          transition={{ delay: i * 0.05, duration: 0.5, ease: 'easeOut' }}
          style={{ minHeight: 4 }}
        />
      ))}
    </div>
  )
}

// Quick Stats Card
function QuickStatsCard() {
  const sparklineData1 = [20, 35, 28, 45, 42, 55, 48, 62, 58, 70, 65, 75]
  const sparklineData2 = [15, 22, 18, 30, 25, 35, 32, 40, 38, 45, 42, 50]

  return (
    <MotionCard 
      className="border-border/50 bg-gradient-to-br from-neutral-900/80 to-neutral-950"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quick Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <motion.div 
          className="flex items-center justify-between"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <ArrowUpRight className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Clicks</p>
              <p className="text-xs text-muted-foreground">Total interactions</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-foreground">12.4k</p>
            <AnimatedSparkline data={sparklineData1} color="cyan" />
          </div>
        </motion.div>
        
        <Separator className="bg-border/30" />
        
        <motion.div 
          className="flex items-center justify-between"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Zap className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Conversions</p>
              <p className="text-xs text-muted-foreground">Goal completions</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-foreground">842</p>
            <AnimatedSparkline data={sparklineData2} color="emerald" />
          </div>
        </motion.div>
      </CardContent>
    </MotionCard>
  )
}

// Feature Card with hover animation
function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  color,
  index 
}: { 
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  color: string
  index: number
}) {
  const iconColors: Record<string, string> = {
    emerald: 'text-emerald-400 bg-emerald-500/20 group-hover:bg-emerald-500/30',
    amber: 'text-amber-400 bg-amber-500/20 group-hover:bg-amber-500/30',
    cyan: 'text-cyan-400 bg-cyan-500/20 group-hover:bg-cyan-500/30',
  }

  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group"
    >
      <Card className="border-border/30 bg-neutral-900/50 hover:bg-neutral-900/80 hover:border-emerald-500/30 transition-all cursor-pointer h-full">
        <CardContent className="p-5 space-y-3">
          <motion.div 
            className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors", iconColors[color])}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <Icon className="h-5 w-5" />
          </motion.div>
          <h3 className="font-semibold text-foreground group-hover:text-emerald-400 transition-colors">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </CardContent>
      </Card>
    </MotionDiv>
  )
}

export default function DesignSample07() {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-950/20 via-transparent to-cyan-950/20 pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <motion.header 
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <Sparkles className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-foreground">AI Command Center</h1>
              <p className="text-sm text-muted-foreground">Intelligent automation at scale</p>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500">
              <Sparkles className="h-4 w-4 mr-2" />
              New Automation
            </Button>
          </motion.div>
        </motion.header>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Total Visitors" value="24,521" change="+12.4%" trend="up" icon={Users} color="emerald" index={0} />
          <MetricCard label="Automations" value="1,847" change="+8.2%" trend="up" icon={Zap} color="amber" index={1} />
          <MetricCard label="Avg. Response" value="1.2s" change="-15.3%" trend="up" icon={Clock} color="cyan" index={2} />
          <MetricCard label="Success Rate" value="99.2%" change="+0.8%" trend="up" icon={Shield} color="rose" index={3} />
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - AI Cards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <TriageIntelligenceCard />
              <AIChatCard />
            </div>
            
            {/* Features Grid */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                Platform Capabilities
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                <FeatureCard 
                  icon={Sparkles} 
                  title="AI Suggestions" 
                  description="Smart recommendations based on historical data and patterns"
                  color="emerald"
                  index={0}
                />
                <FeatureCard 
                  icon={Globe} 
                  title="Global Scale" 
                  description="Deploy across 200+ edge locations worldwide"
                  color="amber"
                  index={1}
                />
                <FeatureCard 
                  icon={BarChart3} 
                  title="Real-time Analytics" 
                  description="Monitor performance with live dashboards and alerts"
                  color="cyan"
                  index={2}
                />
              </div>
            </motion.div>
          </div>

          {/* Right Column - Stats */}
          <div className="space-y-6">
            <QuickStatsCard />
            
            {/* Activity Feed */}
            <MotionCard 
              className="border-border/50 bg-gradient-to-br from-neutral-900/80 to-neutral-950"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { action: 'Automation triggered', detail: 'User onboarding flow', time: '2m ago', color: 'emerald' },
                  { action: 'New rule created', detail: 'Fraud detection v2', time: '15m ago', color: 'amber' },
                  { action: 'Model updated', detail: 'Classification accuracy +2%', time: '1h ago', color: 'cyan' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="flex items-center gap-3 py-2 group cursor-pointer"
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      item.color === 'emerald' && "bg-emerald-500",
                      item.color === 'amber' && "bg-amber-500",
                      item.color === 'cyan' && "bg-cyan-500"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground group-hover:text-emerald-400 transition-colors truncate">
                        {item.action}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                  </motion.div>
                ))}
              </CardContent>
            </MotionCard>
          </div>
        </div>
      </div>
    </div>
  )
}
