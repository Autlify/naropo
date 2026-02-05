'use client'

import React, { useState } from 'react'
import { AutlifyLogo, AutlifyLogoModern } from '@/components/brand'

export default function BrandPreview() {
  const [animated, setAnimated] = useState(true)
  
  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-hidden relative">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Top left gradient orb */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent blur-[100px]" />
        {/* Bottom right gradient orb */}
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-cyan-600/15 via-blue-600/10 to-transparent blur-[100px]" />
        {/* Center subtle orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-violet-600/5 to-cyan-600/5 blur-[120px]" />
        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        {/* Premium Header */}
        <header className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] mb-8">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 animate-pulse" />
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Brand Identity</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Autlify Brand
            </span>
          </h1>
          
          <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
            Premium brand assets designed for modern interfaces. 
            <span className="text-slate-500"> Crafted with precision and elegance.</span>
          </p>
        </header>

        {/* Animation Toggle - Premium Style */}
        <div className="flex justify-center mb-16">
          <button
            onClick={() => setAnimated(!animated)}
            className={`group relative px-8 py-3 rounded-2xl font-medium transition-all duration-300 ${
              animated 
                ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-white shadow-[0_0_30px_-10px_rgba(99,102,241,0.5)]' 
                : 'bg-white/[0.03] border border-white/10 text-slate-400 hover:bg-white/[0.05] hover:border-white/15'
            }`}
          >
            <span className="relative z-10 flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full transition-all duration-300 ${
                animated 
                  ? 'bg-gradient-to-r from-indigo-400 to-purple-400 shadow-[0_0_12px_3px_rgba(129,140,248,0.4)]' 
                  : 'bg-slate-600'
              }`} />
              {animated ? 'Animations Active' : 'Animations Paused'}
            </span>
          </button>
        </div>

        {/* Hero Logo Showcase */}
        <section className="mb-24">
          <div className="relative">
            {/* Glassmorphic showcase card */}
            <div className="relative rounded-3xl p-px bg-gradient-to-b from-white/10 via-white/5 to-transparent overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-transparent to-purple-600/5" />
              <div className="relative rounded-3xl bg-slate-900/40 backdrop-blur-xl p-12 md:p-16">
                <div className="flex flex-col md:flex-row items-center justify-center gap-16">
                  {/* Primary Logo Featured */}
                  <div className="text-center group">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500" />
                      <AutlifyLogo size={120} variant="icon" theme="gradient" animated={animated} className="relative" />
                    </div>
                    <p className="text-sm text-slate-500 mt-6 font-medium">Primary Mark</p>
                  </div>
                  
                  <div className="hidden md:block w-px h-32 bg-gradient-to-b from-transparent via-slate-700 to-transparent" />
                  
                  {/* Modern Logo Featured */}
                  <div className="text-center group">
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500" />
                      <AutlifyLogoModern size={120} variant="icon" theme="gradient" animated={animated} className="relative" />
                    </div>
                    <p className="text-sm text-slate-500 mt-6 font-medium">Modern Variant</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Primary Logo Section */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-10">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20">
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">Primary Logo</h2>
              <p className="text-sm text-slate-500">The core Autlify brand mark</p>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Dark Theme Card */}
            <div className="group relative rounded-2xl p-px bg-gradient-to-b from-white/10 to-transparent hover:from-white/15 transition-all duration-300">
              <div className="rounded-2xl bg-slate-900/60 backdrop-blur-sm p-8 h-full">
                <div className="flex items-center gap-2 mb-8">
                  <span className="w-3 h-3 rounded-full bg-slate-800 border border-slate-700" />
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Dark Theme</span>
                </div>
                
                <div className="flex items-center justify-around py-8">
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center h-20">
                      <AutlifyLogo size={64} variant="icon" theme="gradient" animated={animated} />
                    </div>
                    <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">Icon</span>
                  </div>
                  
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center h-20">
                      <AutlifyLogo size={48} variant="full" theme="gradient" animated={animated} />
                    </div>
                    <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">Full</span>
                  </div>
                  
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center h-20">
                      <AutlifyLogo size={40} variant="compact" theme="gradient" animated={animated} />
                    </div>
                    <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">Compact</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Light Theme Card */}
            <div className="group relative rounded-2xl p-px bg-gradient-to-b from-slate-200/50 to-slate-300/20 hover:from-slate-200/60 transition-all duration-300">
              <div className="rounded-2xl bg-white p-8 h-full">
                <div className="flex items-center gap-2 mb-8">
                  <span className="w-3 h-3 rounded-full bg-slate-100 border border-slate-200" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Light Theme</span>
                </div>
                
                <div className="flex items-center justify-around py-8">
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center h-20">
                      <AutlifyLogo size={64} variant="icon" theme="light" animated={animated} />
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Icon</span>
                  </div>
                  
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center h-20">
                      <AutlifyLogo size={48} variant="full" theme="light" animated={animated} />
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Full</span>
                  </div>
                  
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center h-20">
                      <AutlifyLogo size={40} variant="compact" theme="light" animated={animated} />
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Compact</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Modern Logo Section */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-10">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/20">
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-cyan-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">Modern Variant</h2>
              <p className="text-sm text-slate-500">Alternative dynamic style</p>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Dark Theme Card */}
            <div className="group relative rounded-2xl p-px bg-gradient-to-b from-white/10 to-transparent hover:from-white/15 transition-all duration-300">
              <div className="rounded-2xl bg-slate-900/60 backdrop-blur-sm p-8 h-full">
                <div className="flex items-center gap-2 mb-8">
                  <span className="w-3 h-3 rounded-full bg-slate-800 border border-slate-700" />
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Dark Theme</span>
                </div>
                
                <div className="flex items-center justify-around py-8">
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center h-20">
                      <AutlifyLogoModern size={64} variant="icon" theme="gradient" animated={animated} />
                    </div>
                    <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">Icon</span>
                  </div>
                  
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center h-20">
                      <AutlifyLogoModern size={48} variant="full" theme="dark" animated={animated} />
                    </div>
                    <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">Full</span>
                  </div>
                  
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center h-20">
                      <AutlifyLogoModern size={40} variant="compact" theme="dark" animated={animated} />
                    </div>
                    <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">Compact</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Light Theme Card */}
            <div className="group relative rounded-2xl p-px bg-gradient-to-b from-slate-200/50 to-slate-300/20 hover:from-slate-200/60 transition-all duration-300">
              <div className="rounded-2xl bg-white p-8 h-full">
                <div className="flex items-center gap-2 mb-8">
                  <span className="w-3 h-3 rounded-full bg-slate-100 border border-slate-200" />
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Light Theme</span>
                </div>
                
                <div className="flex items-center justify-around py-8">
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center h-20">
                      <AutlifyLogoModern size={64} variant="icon" theme="gradient" animated={animated} />
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Icon</span>
                  </div>
                  
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center h-20">
                      <AutlifyLogoModern size={48} variant="full" theme="light" animated={animated} />
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Full</span>
                  </div>
                  
                  <div className="text-center space-y-3">
                    <div className="flex items-center justify-center h-20">
                      <AutlifyLogoModern size={40} variant="compact" theme="light" animated={animated} />
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Compact</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Size Scale */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-10">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/20">
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">Size Scale</h2>
              <p className="text-sm text-slate-500">Responsive sizing from 24px to 96px</p>
            </div>
          </div>
          
          <div className="relative rounded-2xl p-px bg-gradient-to-b from-white/10 to-transparent">
            <div className="rounded-2xl bg-slate-900/40 backdrop-blur-sm p-12">
              <div className="flex items-end justify-center gap-8 md:gap-12 flex-wrap">
                {[24, 32, 40, 48, 64, 80, 96].map((size, i) => (
                  <div key={size} className="text-center group" style={{ animationDelay: `${i * 100}ms` }}>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <AutlifyLogo size={size} variant="icon" theme="gradient" animated={animated} className="relative" />
                    </div>
                    <p className="text-[10px] font-mono text-slate-600 mt-4">{size}px</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Usage Code */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-10">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">Implementation</h2>
              <p className="text-sm text-slate-500">Quick start code examples</p>
            </div>
          </div>
          
          <div className="relative rounded-2xl p-px bg-gradient-to-b from-white/10 to-transparent overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-emerald-500/10 to-transparent" />
            <div className="relative rounded-2xl bg-slate-950/80 backdrop-blur-sm p-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-xs text-slate-600 ml-4 font-mono">brand-usage.tsx</span>
              </div>
              
              <pre className="text-sm leading-relaxed overflow-x-auto">
                <code>
                  <span className="text-purple-400">import</span>
                  <span className="text-slate-400">{" { "}</span>
                  <span className="text-cyan-300">AutlifyLogo</span>
                  <span className="text-slate-400">,</span>
                  <span className="text-cyan-300"> AutlifyLogoModern</span>
                  <span className="text-slate-400">{" } "}</span>
                  <span className="text-purple-400">from</span>
                  <span className="text-emerald-400"> &apos;@/components/brand&apos;</span>
                  {"\n\n"}
                  <span className="text-slate-600">{"// Primary Logo"}</span>
                  {"\n"}
                  <span className="text-slate-300">{"<"}</span>
                  <span className="text-cyan-300">AutlifyLogo</span>
                  {"\n"}
                  <span className="text-slate-400">{"  size"}</span>
                  <span className="text-slate-500">{"="}</span>
                  <span className="text-slate-300">{"{"}</span>
                  <span className="text-amber-300">48</span>
                  <span className="text-slate-300">{"}"}</span>
                  {"\n"}
                  <span className="text-slate-400">{"  variant"}</span>
                  <span className="text-slate-500">{"="}</span>
                  <span className="text-emerald-400">&quot;full&quot;</span>
                  <span className="text-slate-600">{"      // 'icon' | 'full' | 'compact'"}</span>
                  {"\n"}
                  <span className="text-slate-400">{"  theme"}</span>
                  <span className="text-slate-500">{"="}</span>
                  <span className="text-emerald-400">&quot;gradient&quot;</span>
                  <span className="text-slate-600">{"   // 'gradient' | 'light' | 'dark'"}</span>
                  {"\n"}
                  <span className="text-slate-400">{"  animated"}</span>
                  {"\n"}
                  <span className="text-slate-300">{"/>"}</span>
                  {"\n\n"}
                  <span className="text-slate-600">{"// Modern Alternative"}</span>
                  {"\n"}
                  <span className="text-slate-300">{"<"}</span>
                  <span className="text-cyan-300">AutlifyLogoModern</span>
                  <span className="text-slate-400">{" size"}</span>
                  <span className="text-slate-500">{"="}</span>
                  <span className="text-slate-300">{"{"}</span>
                  <span className="text-amber-300">40</span>
                  <span className="text-slate-300">{"}"}</span>
                  <span className="text-slate-400">{" variant"}</span>
                  <span className="text-slate-500">{"="}</span>
                  <span className="text-emerald-400">&quot;icon&quot;</span>
                  <span className="text-slate-400">{" animated"}</span>
                  <span className="text-slate-300">{" />"}</span>
                </code>
              </pre>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pt-12 border-t border-white/5">
          <p className="text-sm text-slate-600">
            Autlify Brand Guidelines &middot; Design System v1.0
          </p>
        </footer>
      </div>
    </div>
  )
}
