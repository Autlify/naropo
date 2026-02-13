/**
 * Sidebar Directory - Static sidebar definitions
 * 
 * This replaces DB-based sidebar loading with static TypeScript definitions.
 * - 0 DB queries for sidebar structure
 * - Feature entitlements and permissions checked at render time
 * - DB table kept for future per-agency customizations (override layer)
 * 
 * Source: scripts/seed-sidebar-options.ts
 */

import type { FeatureKey, ModuleCode, SubModuleCode } from '@/lib/registry'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SidebarLinkDef {
  name: string
  link: string
  icon?: string
  order?: number
  feature?: FeatureKey
  agency: boolean
  subaccount: boolean
  user: boolean
}

export interface SidebarOptionDef {
  name: string
  link: string
  icon: string
  module?: ModuleCode
  subModule?: SubModuleCode | 'default'
  order?: number
  agency: boolean
  subaccount: boolean
  user: boolean
  links: SidebarLinkDef[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar Registry
// ─────────────────────────────────────────────────────────────────────────────

export const SIDEBAR_REGISTRY: SidebarOptionDef[] = [
  {
    name: 'Dashboard',
    icon: 'dashboard',
    module: 'org',
    subModule: 'default',
    link: `/`,
    agency: true,
    subaccount: true,
    user: false,
    order: 10,
    links: [],
  },
  {
    name: 'Launchpad',
    icon: 'clipboardIcon',
    link: `/launchpad`,
    module: 'org',
    subModule: 'default',
    agency: true,
    subaccount: true,
    user: false,
    order: 20,
    links: [],
  },
  {
    name: 'Apps',
    icon: 'apps',
    link: `/apps`,
    module: 'org',
    subModule: 'default',
    agency: true,
    subaccount: true,
    user: false,
    order: 30,
    links: [],
  },
  {
    name: 'Billing',
    icon: 'payment',
    link: `/billing`,
    module: 'org',
    subModule: 'billing',
    agency: true,
    subaccount: false,
    user: false,
    order: 40,
    links: [
      {
        name: 'Subscription',
        link: '/billing/subscription',
        icon: 'receipt',
        feature: 'org.billing.account',
        agency: true,
        subaccount: false,
        user: false,
        order: 10,
      },
      {
        name: 'Payment Methods',
        link: '/billing/payment-methods',
        icon: 'payment',
        feature: 'org.billing.account',
        agency: true,
        subaccount: false,
        user: false,
        order: 20,
      },
      {
        name: 'Usage',
        link: '/billing/usage',
        icon: 'chart',
        feature: 'org.billing.account',
        agency: true,
        subaccount: false,
        user: false,
        order: 30,
      },
      {
        name: 'Credits & Discounts',
        link: '/billing/credits',
        icon: 'wallet',
        feature: 'org.billing.account',
        agency: true,
        subaccount: false,
        user: false,
        order: 40,
      },
      {
        name: 'Addons',
        link: '/billing/addons',
        icon: 'addons',
        feature: 'org.billing.account',
        agency: true,
        subaccount: false,
        user: false,
        order: 50,
      },
    ],
  },
  {
    name: 'Settings',
    icon: 'settings',
    link: `/settings`,
    module: 'org',
    subModule: 'default',
    agency: true,
    subaccount: true,
    user: false,
    order: 50,
    links: [],
  },
  {
    name: 'Sub-Accounts',
    icon: 'person',
    link: `/all-subaccounts`,
    module: 'org',
    subModule: 'subaccount',
    agency: true,
    subaccount: false,
    user: false,
    order: 60,
    links: [],
  },
  {
    name: 'Access Control',
    icon: 'team',
    link: `/team`,
    module: 'iam',
    subModule: 'authZ',
    agency: true,
    subaccount: true,
    user: false,
    order: 70,
    links: [
      {
        name: 'Members',
        link: '/team',
        icon: 'member',
        feature: 'iam.authZ.members',
        agency: true,
        subaccount: true,
        user: false,
        order: 20,
      },
      {
        name: 'Roles',
        link: '/team/roles',
        icon: 'roles',
        feature: 'iam.authZ.roles',
        agency: true,
        subaccount: true,
        user: false,
        order: 10,
      },
    ],
  },
  {
    name: 'Funnels',
    icon: 'pipelines',
    link: `/funnels`,
    module: 'crm',
    subModule: 'funnels',
    agency: false,
    subaccount: true,
    user: false,
    order: 80,
    links: [],
  },
  {
    name: 'Media',
    icon: 'database',
    link: `/media`,
    module: 'org',
    subModule: 'default',
    agency: false,
    subaccount: true,
    user: false,
    order: 90,
    links: [],
  },
  {
    name: 'Automations',
    icon: 'chip',
    link: `/automations`,
    module: 'org',
    subModule: 'organization',
    agency: false,
    subaccount: true,
    user: false,
    order: 100,
    links: [],
  },
  {
    name: 'Pipelines',
    icon: 'flag',
    link: `/pipelines`,
    module: 'crm',
    subModule: 'pipelines',
    agency: false,
    subaccount: true,
    user: false,
    order: 110,
    links: [],
  },
  {
    name: 'Contacts',
    icon: 'person',
    link: `/contacts`,
    module: 'crm',
    subModule: 'customers',
    agency: false,
    subaccount: true,
    user: false,
    order: 120,
    links: [],
  },
  {
    name: 'General Ledger',
    link: '/fi/general-ledger',
    icon: 'finance',
    module: 'fi',
    subModule: 'general_ledger',
    agency: true,
    subaccount: true,
    user: false,
    order: 130,
    links: [
      {
        name: 'Overview',
        link: '/fi/general-ledger',
        icon: 'dashboard',
        feature: 'fi.general_ledger.balances',
        agency: true,
        subaccount: true,
        user: false,
        order: 10,
      },
      {
        name: 'Chart of Accounts',
        link: '/fi/general-ledger/chart-of-accounts',
        icon: 'list-tree',
        feature: 'fi.general_ledger.accounts',
        agency: true,
        subaccount: true,
        user: false,
        order: 20,
      },
      {
        name: 'Journal Entries',
        link: '/fi/general-ledger/journal-entries',
        icon: 'fileText',
        feature: 'fi.general_ledger.journal_entries',
        agency: true,
        subaccount: true,
        user: false,
        order: 30,
      },
      {
        name: 'Approvals',
        link: '/fi/general-ledger/approvals',
        icon: 'clipboardIcon',
        feature: 'fi.general_ledger.journal_entries',
        agency: true,
        subaccount: true,
        user: false,
        order: 40,
      },
      {
        name: 'Financial Periods',
        link: '/fi/general-ledger/periods',
        icon: 'calendar',
        feature: 'fi.configuration.fiscal_years',
        agency: true,
        subaccount: true,
        user: false,
        order: 50,
      },
      {
        name: 'Reports',
        link: '/fi/general-ledger/reports',
        icon: 'bar-chart-3',
        feature: 'fi.general_ledger.reports',
        agency: true,
        subaccount: true,
        user: false,
        order: 60,
      },
      {
        name: 'Audit Trail',
        link: '/fi/general-ledger/audit',
        icon: 'shield',
        feature: 'fi.general_ledger.accounts',
        agency: true,
        subaccount: false,
        user: false,
        order: 70,
      },
      {
        name: 'Consolidation',
        link: '/fi/general-ledger/consolidation',
        icon: 'chart',
        feature: 'fi.general_ledger.consolidation',
        agency: true,
        subaccount: false,
        user: false,
        order: 80,
      },
      {
        name: 'Settings',
        link: '/fi/general-ledger/settings',
        icon: 'settings',
        feature: 'fi.general_ledger.settings',
        agency: true,
        subaccount: true,
        user: false,
        order: 90,
      },
    ],
  },
  {
    name: 'Banking',
    link: '/fi/bank-ledger',
    icon: 'wallet',
    module: 'fi',
    subModule: 'bank_ledger',
    agency: true,
    subaccount: true,
    user: false,
    order: 140,
    links: [
      {
        name: 'Transactions',
        link: '/fi/bank-ledger/subledgers',
        icon: 'wallet',
        feature: 'fi.bank_ledger.subledgers',
        agency: true,
        subaccount: true,
        user: false,
        order: 10,
      },
      {
        name: 'Bank Reconciliations',
        link: '/fi/bank-ledger/bank-accounts',
        icon: 'building-2',
        feature: 'fi.bank_ledger.bank_accounts',
        agency: true,
        subaccount: true,
        user: false,
        order: 20,
      },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Filter sidebar options by scope (agency vs subaccount)
 */
export function filterByScope(
  options: SidebarOptionDef[],
  scope: 'agency' | 'subaccount' | 'user'
): SidebarOptionDef[] {
  return options
    .filter((opt) => opt[scope])
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    .map((opt) => ({
      ...opt,
      links: opt.links.filter((link) => link[scope]),
    }))
}

/**
 * Filter sidebar options by enabled features (entitlements)
 */
export function filterByEntitlements(
  options: SidebarOptionDef[],
  enabledFeatures: Set<string>
): SidebarOptionDef[] {
  return options
    .map((opt) => ({
      ...opt,
      links: opt.links.filter((link) => {
        // No feature requirement = always visible
        if (!link.feature) return true
        return enabledFeatures.has(link.feature)
      }),
    }))
    
    // Keep parent if it has no feature requirement OR has visible children
    .filter((opt) => opt.links.length > 0 || !opt.links.some((l) => l.feature))
}

/**
 * Group sidebar options by module
 */
export function groupByModule(options: SidebarOptionDef[]): Record<string, SidebarOptionDef[]> {
  const groups: Record<string, SidebarOptionDef[]> = {}
  
  for (const opt of options) {
    const module = opt.module ?? 'org'
    if (!groups[module]) groups[module] = []
    groups[module].push(opt)
  }
  
  return groups
}

/**
 * Get sidebar options for a specific scope, filtered by entitlements
 */
export function getSidebarForScope(params: {
  scope: 'agency' | 'subaccount' | 'user'
  enabledFeatures: string[]
}): SidebarOptionDef[] {
  const byScope = filterByScope(SIDEBAR_REGISTRY, params.scope)
  const featureSet = new Set(params.enabledFeatures)
  return filterByEntitlements(byScope, featureSet)
}

// ─────────────────────────────────────────────────────────────────────────────
// DB-Compatible Interface
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Shape matching the Prisma SidebarOption model for easy migration
 */
export interface SidebarOptionWithLinks {
  id: string
  name: string
  link: string
  icon: string
  order: number
  module: string | null
  subModule: string | null
  agency: boolean
  subaccount: boolean
  user: boolean
  OptionLinks: {
    id: string
    name: string
    link: string
    icon: string | null
    order: number
    feature: string | null
    agency: boolean
    subaccount: boolean
    user: boolean
  }[]
}

let idCounter = 0
const generateId = () => `sidebar-${++idCounter}`

/**
 * Get sidebar options from registry in DB-compatible format
 * Drop-in replacement for getSidebarOptions() from queries.ts
 * 
 * This eliminates DB queries for sidebar structure while maintaining
 * the same interface expected by sidebar components.
 */
export function getSidebarOptionsFromRegistry(
  scopeType: 'agency' | 'subaccount' | 'user'
): SidebarOptionWithLinks[] {
  // Reset ID counter for consistency
  idCounter = 0
  
  return SIDEBAR_REGISTRY
    .filter((opt) => opt[scopeType])
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    .map((opt): SidebarOptionWithLinks => ({
      id: generateId(),
      name: opt.name,
      link: opt.link,
      icon: opt.icon,
      order: opt.order ?? 0,
      module: opt.module ?? null,
      subModule: opt.subModule ?? null,
      agency: opt.agency,
      subaccount: opt.subaccount,
      user: opt.user,
      OptionLinks: opt.links
        .filter((link) => link[scopeType])
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
        .map((link) => ({
          id: generateId(),
          name: link.name,
          link: link.link,
          icon: link.icon ?? null,
          order: link.order ?? 0,
          feature: link.feature ?? null,
          agency: link.agency,
          subaccount: link.subaccount,
          user: link.user,
        })),
    }))
}
