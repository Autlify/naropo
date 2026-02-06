'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Palette,
  Zap,
  Moon,
  Sun,
  Sparkles,
  Layout,
  Copy,
  Check,
  ArrowRight,
  Code2,
  Layers,
  Paintbrush
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

/**
 * Design Sample 02: HeroUI-Style Component Showcase
 * 
 * Inspired by HeroUI landing page - modern theming showcase
 * with interactive theme switcher and component previews
 */

// Theme Preview Card
function ThemePreviewCard({ 
  name, 
  active, 
  colors,
  onClick 
}: { 
  name: string
  active: boolean
  colors: { primary: string; secondary: string; accent: string }
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-3 p-4 rounded-xl border transition-all",
        active 
          ? "border-primary bg-muted/50" 
          : "border-border/50 hover:border-border bg-transparent hover:bg-muted/30"
      )}
    >
      <div className="flex gap-1">
        <div className={cn("w-6 h-6 rounded-full", colors.primary)} />
        <div className={cn("w-6 h-6 rounded-full", colors.secondary)} />
        <div className={cn("w-6 h-6 rounded-full", colors.accent)} />
      </div>
      <span className={cn(
        "text-sm font-medium",
        active ? "text-foreground" : "text-muted-foreground"
      )}>
        {name}
      </span>
    </button>
  )
}

// Feature Card
function FeatureCard({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <Card className="group hover:border-primary/50 transition-all bg-gradient-to-br from-muted/30 to-transparent border-border/50">
      <CardContent className="p-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

// Interactive Code Block
function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <div className="relative group">
      <pre className="bg-gradient-to-br from-muted to-muted/50 border border-border/50 rounded-xl p-4 overflow-x-auto">
        <code className="text-sm text-muted-foreground font-mono">{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  )
}

// Product Card Preview (like the Nike shoe in HeroUI)
function ProductPreviewCard() {
  return (
    <Card className="max-w-sm bg-gradient-to-br from-purple-900/30 via-pink-900/20 to-purple-900/30 border-purple-500/20 overflow-hidden">
      <div className="relative h-48 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 blur-2xl opacity-50 absolute" />
        <Sparkles className="h-16 w-16 text-purple-400 relative z-10" />
      </div>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-foreground">Premium Widget</h3>
            <p className="text-sm text-muted-foreground">Customizable, responsive</p>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            ♡
          </Button>
        </div>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-xl font-bold text-foreground">$99.00</span>
          <span className="text-sm text-muted-foreground line-through">$149.00</span>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">33% off</Badge>
        </div>
        <div className="flex gap-2 mb-4">
          {['XS', 'S', 'M', 'L', 'XL'].map((size) => (
            <button
              key={size}
              className={cn(
                "w-8 h-8 rounded-lg border text-xs font-medium transition-colors",
                size === 'M' 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "border-border/50 text-muted-foreground hover:border-border"
              )}
            >
              {size}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            Buy now
          </Button>
          <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
            Add to bag
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// User Card Preview
function UserPreviewCard() {
  return (
    <Card className="max-w-sm bg-gradient-to-br from-muted/50 to-muted/20 border-border/50">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
            ZL
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">Zoey Lang</h3>
              <Badge variant="secondary" className="text-xs">Pro</Badge>
            </div>
            <p className="text-sm text-muted-foreground">@zoeylang</p>
          </div>
          <Button size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-500">
            Follow
          </Button>
        </div>
        <p className="mt-4 text-sm text-foreground">
          Full-stack developer, @hero_ui enthusiast. Building beautiful apps ✨
        </p>
        <div className="flex gap-4 mt-4 text-sm">
          <span className="text-muted-foreground">
            <strong className="text-foreground">4</strong> Following
          </span>
          <span className="text-muted-foreground">
            <strong className="text-foreground">97.1K</strong> Followers
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DesignSample02() {
  const [activeTheme, setActiveTheme] = useState('modern')
  
  const themes = [
    { name: 'HeroUI', colors: { primary: 'bg-white', secondary: 'bg-gray-400', accent: 'bg-gray-600' } },
    { name: 'Modern', colors: { primary: 'bg-purple-500', secondary: 'bg-blue-500', accent: 'bg-cyan-500' } },
    { name: 'Elegant', colors: { primary: 'bg-amber-500', secondary: 'bg-orange-500', accent: 'bg-red-500' } },
    { name: 'Retro', colors: { primary: 'bg-green-500', secondary: 'bg-teal-500', accent: 'bg-emerald-500' } },
  ]

  const configCode = `module.exports = {
  // ...
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: "#7828c8",
          }
        },
        dark: {
          colors: {
            primary: "#9353d3",
          }
        },
      },
    }),
  ],
}`

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-16">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400 px-4 py-1.5">
              <Sparkles className="h-3 w-3 mr-2" />
              HeroUI v3.0.0 (Beta)
            </Badge>
          </div>
          
          {/* Headline */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Make <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">beautiful</span> websites
              regardless of your design experience.
            </h1>
            <p className="text-lg text-muted-foreground">
              Beautiful, fast and modern React UI library for building accessible and customizable web applications.
            </p>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <div className="flex items-center h-11 px-4 rounded-lg bg-muted border border-border/50 text-sm font-mono text-muted-foreground">
              <span className="text-primary mr-2">$</span>
              npx heroui-cli@latest init
              <Copy className="ml-3 h-4 w-4 cursor-pointer hover:text-foreground transition-colors" />
            </div>
          </div>
          
          {/* Preview Cards */}
          <div className="flex flex-wrap justify-center gap-8">
            <ProductPreviewCard />
            <UserPreviewCard />
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard 
              icon={Palette} 
              title="Themeable" 
              description="Provides a plugin to customize default themes, you can change all semantic tokens."
            />
            <FeatureCard 
              icon={Zap} 
              title="Fast" 
              description="Built on top of Tailwind CSS, which means no runtime styles, and no unnecessary classes."
            />
            <FeatureCard 
              icon={Moon} 
              title="Light & Dark UI" 
              description="Automatic dark mode recognition, HeroUI automatically changes the theme when detects HTML theme."
            />
            <FeatureCard 
              icon={Code2} 
              title="Unique DX" 
              description="HeroUI is fully-typed to minimize the learning curve, and provide the best possible developer experience."
            />
          </div>
        </div>
      </section>
      
      {/* Theming Section */}
      <section className="py-20 bg-gradient-to-b from-muted/20 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Apply your own{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
                  theming
                </span>{' '}
                decisions.
              </h2>
              <p className="text-muted-foreground mb-8">
                HeroUI provides a custom TailwindCSS plugin that allows you to customize the default themes or create your own.
              </p>
              
              {/* Theme Selector */}
              <div className="flex flex-wrap gap-3 mb-8">
                {themes.map((theme) => (
                  <ThemePreviewCard
                    key={theme.name}
                    name={theme.name}
                    active={activeTheme === theme.name.toLowerCase()}
                    colors={theme.colors}
                    onClick={() => setActiveTheme(theme.name.toLowerCase())}
                  />
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl blur-xl" />
              <Card className="relative bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] border-border/30">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">tailwind.config.js</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <CodeBlock code={configCode} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
      
      {/* Quick Integration Section */}
      <section className="py-20 border-t border-border/50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
            <Zap className="h-3 w-3 mr-2" />
            Quick Integration
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Get your billing system running in minutes
          </h2>
          <p className="text-muted-foreground mb-8">
            Simple API, powerful components, endless possibilities.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg">
              View Documentation
            </Button>
            <Button size="lg" variant="outline">
              Browse Components
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
