'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Clock,
  Globe,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  Zap,
  MousePointer,
  Target,
  Activity,
  Layers,
  MoreHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Design Sample 05: Analytics Dashboard
 * 
 * Inspired by Vercel Analytics / PostHog / Mixpanel with
 * real-time metrics, charts, and funnel visualization
 */

// Metric Card with Trend
function MetricCard({ 
  label, 
  value, 
  change, 
  trend,
  icon: Icon,
  color = 'blue'
}: { 
  label: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: React.ComponentType<{ className?: string }>
  color?: 'blue' | 'green' | 'purple' | 'orange'
}) {
  const colorStyles = {
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    orange: 'from-orange-500/20 to-yellow-500/20 border-orange-500/30',
  }
  
  const iconColors = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
  }
  
  return (
    <Card className={cn("bg-gradient-to-br border", colorStyles[color])}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            <span className="text-sm text-muted-foreground">{label}</span>
            <div>
              <span className="text-3xl font-bold text-foreground">{value}</span>
              <div className={cn(
                "flex items-center gap-1 mt-1 text-sm",
                trend === 'up' ? "text-green-400" : "text-red-400"
              )}>
                {trend === 'up' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                <span>{change}</span>
                <span className="text-muted-foreground">vs last period</span>
              </div>
            </div>
          </div>
          <div className={cn("p-2.5 rounded-xl bg-muted/50", iconColors[color])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Mini Sparkline Chart (CSS-based)
function Sparkline({ data, color = 'blue' }: { data: number[]; color?: string }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((value, i) => (
        <div
          key={i}
          className={cn(
            "w-1 rounded-full bg-gradient-to-t",
            color === 'blue' && "from-blue-600 to-blue-400",
            color === 'green' && "from-green-600 to-green-400",
            color === 'purple' && "from-purple-600 to-purple-400"
          )}
          style={{ height: `${((value - min) / range) * 100}%`, minHeight: 4 }}
        />
      ))}
    </div>
  )
}

// Area Chart Visualization (CSS-based approximation)
function AreaChart() {
  const points = [30, 45, 35, 55, 48, 70, 65, 80, 75, 90, 85, 95]
  
  return (
    <div className="h-48 flex items-end gap-1 px-2 relative">
      {/* Grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="border-t border-border/30 w-full" />
        ))}
      </div>
      
      {/* Bars */}
      {points.map((value, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div 
            className="w-full rounded-t bg-gradient-to-t from-blue-600/80 to-blue-400/60 relative group cursor-pointer hover:from-blue-500 hover:to-blue-300 transition-colors"
            style={{ height: `${value}%` }}
          >
            {/* Tooltip */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-foreground text-background text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              {Math.round(value * 100)} visitors
            </div>
          </div>
        </div>
      ))}
      
      {/* X-axis labels */}
      <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-[10px] text-muted-foreground">
        {['12am', '', '6am', '', '12pm', '', '6pm', '', '12am'].map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
    </div>
  )
}

// Funnel Visualization
function FunnelStep({ 
  label, 
  count, 
  percent, 
  dropoff,
  index
}: { 
  label: string
  count: string
  percent: number
  dropoff?: string
  index: number
}) {
  const colors = [
    'from-blue-500 to-blue-600',
    'from-cyan-500 to-cyan-600',
    'from-teal-500 to-teal-600',
    'from-green-500 to-green-600',
  ]
  
  return (
    <div className="relative">
      <div 
        className={cn("rounded-lg p-4 bg-gradient-to-r", colors[index % colors.length])}
        style={{ width: `${percent}%`, minWidth: 200 }}
      >
        <div className="flex items-center justify-between text-white">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-sm font-bold">{count}</span>
        </div>
      </div>
      {dropoff && (
        <div className="absolute -right-16 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-red-400">
          <ArrowDownRight className="h-3 w-3" />
          {dropoff}
        </div>
      )}
    </div>
  )
}

// Country Row
function CountryRow({ 
  country, 
  flag, 
  visitors, 
  percent 
}: { 
  country: string
  flag: string
  visitors: string
  percent: number
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-lg">{flag}</span>
      <span className="flex-1 text-sm text-foreground">{country}</span>
      <span className="text-sm text-muted-foreground">{visitors}</span>
      <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

// Page Row
function PageRow({ 
  path, 
  views, 
  avgTime,
  bounce
}: { 
  path: string
  views: string
  avgTime: string
  bounce: string
}) {
  return (
    <div className="flex items-center gap-4 py-2.5 border-b border-border/30 last:border-0">
      <span className="flex-1 text-sm text-foreground font-mono truncate">{path}</span>
      <span className="text-sm text-muted-foreground w-16 text-right">{views}</span>
      <span className="text-sm text-muted-foreground w-16 text-right">{avgTime}</span>
      <span className="text-sm text-muted-foreground w-16 text-right">{bounce}</span>
    </div>
  )
}

// Real-time Visitors Counter
function RealtimeCounter({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30">
      <div className="relative">
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping" />
      </div>
      <div>
        <span className="text-2xl font-bold text-foreground">{count}</span>
        <span className="text-sm text-muted-foreground ml-2">people on site</span>
      </div>
      <Badge className="ml-auto bg-green-500/20 text-green-400 border-green-500/30">
        <Activity className="h-3 w-3 mr-1" />
        Live
      </Badge>
    </div>
  )
}

export default function DesignSample05() {
  const sparklineData1 = [20, 35, 28, 45, 42, 55, 48, 62, 58, 70, 65, 75]
  const sparklineData2 = [15, 22, 18, 30, 25, 35, 32, 40, 38, 45, 42, 50]
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-foreground">Analytics</span>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <Tabs defaultValue="overview">
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="realtime">Real-time</TabsTrigger>
                  <TabsTrigger value="funnels">Funnels</TabsTrigger>
                  <TabsTrigger value="events">Events</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button variant="outline" size="sm">
                Last 7 days
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Real-time Counter */}
        <RealtimeCounter count={142} />
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard 
            label="Total Visitors" 
            value="24,521" 
            change="+12.4%" 
            trend="up"
            icon={Users}
            color="blue"
          />
          <MetricCard 
            label="Page Views" 
            value="89,432" 
            change="+8.2%" 
            trend="up"
            icon={Eye}
            color="green"
          />
          <MetricCard 
            label="Avg. Session" 
            value="3m 24s" 
            change="-2.1%" 
            trend="down"
            icon={Clock}
            color="purple"
          />
          <MetricCard 
            label="Bounce Rate" 
            value="42.3%" 
            change="-5.8%" 
            trend="up"
            icon={Target}
            color="orange"
          />
        </div>
        
        {/* Chart Section */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <Card className="lg:col-span-2 border-border/50 bg-gradient-to-br from-muted/30 to-transparent">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base">Visitors Over Time</CardTitle>
                <CardDescription>Hourly visitor count for today</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs text-muted-foreground">Visitors</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs text-muted-foreground">Page Views</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 pb-8">
              <AreaChart />
            </CardContent>
          </Card>
          
          {/* Side Stats */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="border-border/50 bg-gradient-to-br from-muted/30 to-transparent">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <MousePointer className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Clicks</p>
                      <p className="text-xs text-muted-foreground">Total interactions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">12.4k</p>
                    <Sparkline data={sparklineData1} color="blue" />
                  </div>
                </div>
                
                <Separator className="bg-border/50" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <Layers className="h-4 w-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Conversions</p>
                      <p className="text-xs text-muted-foreground">Goal completions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">842</p>
                    <Sparkline data={sparklineData2} color="purple" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Top Countries */}
            <Card className="border-border/50 bg-gradient-to-br from-muted/30 to-transparent">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Top Countries</CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs">
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <CountryRow country="United States" flag="🇺🇸" visitors="8,234" percent={80} />
                <CountryRow country="United Kingdom" flag="🇬🇧" visitors="3,421" percent={45} />
                <CountryRow country="Germany" flag="🇩🇪" visitors="2,198" percent={35} />
                <CountryRow country="Canada" flag="🇨🇦" visitors="1,876" percent={28} />
                <CountryRow country="Australia" flag="🇦🇺" visitors="1,234" percent={20} />
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Funnel & Pages Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Conversion Funnel */}
          <Card className="border-border/50 bg-gradient-to-br from-muted/30 to-transparent">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Conversion Funnel</CardTitle>
                <CardDescription>Signup flow analysis</CardDescription>
              </div>
              <Badge className="bg-muted border-border/50">
                <Zap className="h-3 w-3 mr-1" />
                3.2% conversion
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3 pr-20">
              <FunnelStep label="Landing Page" count="24,521" percent={100} dropoff="-38%" index={0} />
              <FunnelStep label="Signup Started" count="15,203" percent={62} dropoff="-52%" index={1} />
              <FunnelStep label="Email Verified" count="7,298" percent={30} dropoff="-12%" index={2} />
              <FunnelStep label="Completed" count="6,422" percent={26} index={3} />
            </CardContent>
          </Card>
          
          {/* Top Pages */}
          <Card className="border-border/50 bg-gradient-to-br from-muted/30 to-transparent">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Top Pages</CardTitle>
                <CardDescription>Most visited pages this period</CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {/* Header */}
              <div className="flex items-center gap-4 py-2 border-b border-border/50 text-xs text-muted-foreground uppercase tracking-wider">
                <span className="flex-1">Page</span>
                <span className="w-16 text-right">Views</span>
                <span className="w-16 text-right">Avg Time</span>
                <span className="w-16 text-right">Bounce</span>
              </div>
              <PageRow path="/" views="12,432" avgTime="2:34" bounce="38%" />
              <PageRow path="/pricing" views="8,234" avgTime="4:12" bounce="24%" />
              <PageRow path="/features" views="6,891" avgTime="3:45" bounce="32%" />
              <PageRow path="/blog" views="4,532" avgTime="5:23" bounce="18%" />
              <PageRow path="/docs" views="3,876" avgTime="6:12" bounce="12%" />
              <PageRow path="/signup" views="2,984" avgTime="1:45" bounce="52%" />
            </CardContent>
          </Card>
        </div>
        
        {/* Footer Stats */}
        <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground py-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span>42 countries</span>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span>156 pages tracked</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span>Last updated: 2 minutes ago</span>
          </div>
        </div>
      </main>
    </div>
  )
}
