'use client'

import React, { useState } from 'react'
import * as PremiumIcons from '@/components/icons/premium'

// Get all icon names from exports
const iconNames = Object.keys(PremiumIcons).filter(name => name.startsWith('Premium'))

// Group icons by category
const iconCategories = {
  'Core Premium': [
    'PremiumCrown', 'PremiumShield', 'PremiumAnalytics', 'PremiumTeam', 'PremiumZap',
    'PremiumDiamond', 'PremiumStar', 'PremiumRocket', 'PremiumSparkles', 'PremiumInfinity', 'PremiumLock'
  ],
  'Navigation & UI': [
    'PremiumHome', 'PremiumSettings', 'PremiumDashboard', 'PremiumApp', 'PremiumLayers'
  ],
  'Finance & Payments': [
    'PremiumWallet', 'PremiumCreditCard', 'PremiumPayment', 'PremiumReceipt', 'PremiumFinance'
  ],
  'Communication': [
    'PremiumMail', 'PremiumBell', 'PremiumMessage', 'PremiumSend', 'PremiumShare', 'PremiumMessages'
  ],
  'Users & Organization': [
    'PremiumUsers', 'PremiumBuilding', 'PremiumPerson', 'PremiumContact'
  ],
  'Data & Storage': [
    'PremiumDatabase', 'PremiumCloud', 'PremiumFolder', 'PremiumFile', 'PremiumUpload', 'PremiumDownload'
  ],
  'Actions & Operations': [
    'PremiumSearch', 'PremiumEdit', 'PremiumRefresh', 'PremiumTrash', 'PremiumCheck',
    'PremiumLink', 'PremiumBookmark', 'PremiumFlag'
  ],
  'Media': [
    'PremiumImage', 'PremiumVideo', 'PremiumMic', 'PremiumHeadphone'
  ],
  'Emotional & Social': [
    'PremiumHeart', 'PremiumGift', 'PremiumTrophy', 'PremiumAward'
  ],
  'Analytics & Charts': [
    'PremiumPieChart', 'PremiumTarget', 'PremiumBarChart'
  ],
  'Location & Navigation': [
    'PremiumMapPin', 'PremiumGlobe', 'PremiumCompass'
  ],
  'Development & Tech': [
    'PremiumCode', 'PremiumTerminal', 'PremiumServer', 'PremiumCpu', 'PremiumChip',
    'PremiumGitBranch', 'PremiumPipeline', 'PremiumListTree'
  ],
  'Status & Feedback': [
    'PremiumInfo', 'PremiumWarning', 'PremiumCheckCircle', 'PremiumNotification', 'PremiumSuccess'
  ],
  'System & Controls': [
    'PremiumPower', 'PremiumTune', 'PremiumClipboard', 'PremiumCalendar'
  ],
  'Security': [
    'PremiumKey', 'PremiumFingerprint'
  ],
  'Accessibility & UX': [
    'PremiumAccessibility'
  ],
  'Brands & Auth': [
    'PremiumMicrosoft', 'PremiumLogoPlaceholder', 'PremiumSignin', 'PremiumSignout'
  ],
  'Theme': [
    'PremiumMoon', 'PremiumSun'
  ],
  'Help & Support': [
    'PremiumHelp', 'PremiumTools', 'PremiumSupport'
  ],
  'Legal & Compliance': [
    'PremiumTerms', 'PremiumContract', 'PremiumAgreement', 'PremiumPolicy'
  ],
  'Accounting & Finance (FI-GL)': [
    'PremiumGeneralLedger', 'PremiumChartOfAccounts', 'PremiumJournalEntry',
    'PremiumBalanceSheet', 'PremiumIncomeStatement', 'PremiumReconciliation',
    'PremiumAudit', 'PremiumTax', 'PremiumBudget', 'PremiumInvoice'
  ],
  'Files & Documents': [
    'PremiumFileText'
  ]
}

export default function PremiumIconsPreview() {
  const [animated, setAnimated] = useState(true)
  const [size, setSize] = useState(32)
  const [searchTerm, setSearchTerm] = useState('')
  
  const filteredCategories = Object.entries(iconCategories).map(([category, icons]) => ({
    category,
    icons: icons.filter(name => 
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(({ icons }) => icons.length > 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Premium Icons Library
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            High-end SVG icons with gradients, glows, and animations. Perfect for premium UI designs.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 justify-center mb-8 p-4 bg-slate-800/50 rounded-xl backdrop-blur-sm border border-slate-700/50">
          <div className="flex items-center gap-2">
            <label className="text-slate-400 text-sm">Search:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search icons..."
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-slate-400 text-sm">Size:</label>
            <select
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={24}>24px</option>
              <option value={32}>32px</option>
              <option value={48}>48px</option>
              <option value={64}>64px</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-slate-400 text-sm">Animated:</label>
            <button
              onClick={() => setAnimated(!animated)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                animated 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {animated ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Icon Grid by Category */}
        <div className="space-y-8">
          {filteredCategories.map(({ category, icons }) => (
            <div key={category} className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400" />
                {category}
                <span className="text-sm font-normal text-slate-500">({icons.length})</span>
              </h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {icons.map((iconName) => {
                  const IconComponent = (PremiumIcons as Record<string, React.ComponentType<{size?: number; animated?: boolean; className?: string}>>)[iconName]
                  if (!IconComponent) return null
                  
                  return (
                    <div
                      key={iconName}
                      className="flex flex-col items-center gap-2 p-4 bg-slate-900/50 rounded-lg border border-slate-700/30 hover:border-blue-500/50 hover:bg-slate-800/50 transition-all group cursor-pointer"
                      title={iconName}
                    >
                      <div className="p-2 rounded-lg bg-slate-800/50 group-hover:bg-slate-700/50 transition-colors">
                        <IconComponent size={size} animated={animated} />
                      </div>
                      <span className="text-xs text-slate-500 text-center truncate w-full group-hover:text-slate-300 transition-colors">
                        {iconName.replace('Premium', '')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Usage Examples */}
        <div className="mt-12 bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
          <h2 className="text-xl font-semibold text-white mb-4">Usage</h2>
          <pre className="bg-slate-900 rounded-lg p-4 overflow-x-auto text-sm">
            <code className="text-slate-300">
{`import { PremiumCrown, PremiumShield } from '@/components/icons/premium'

// Basic usage
<PremiumCrown size={32} />

// With animation
<PremiumCrown size={32} animated />

// With className
<PremiumShield className="w-8 h-8" animated />`}
            </code>
          </pre>
        </div>

        {/* Stats */}
        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>Total Icons: <span className="text-white font-medium">{iconNames.length}</span> | Categories: <span className="text-white font-medium">{Object.keys(iconCategories).length}</span></p>
        </div>
      </div>
    </div>
  )
}
