/**
 * @abstraction UI Constants
 * @description Icons, EditorBtns, and default styles for the UI.
 * 
 * For pricing/products, use:
 * - @/lib/registry/plans/pricing-config.ts (SSoT: PRICING_CONFIG, PLAN_IDS, pricing cards)
 * - @/lib/registry/plans/plan-entitlements.ts (entitlements, feature limits)
 * 
 * @namespace Autlify.Lib.Constants
 * @module LIB
 */

import BarChart from '@/components/icons/bar_chart'
import BarChart3 from '@/components/icons/bar-chart-3'
import Building from '@/components/icons/building'
import Calendar from '@/components/icons/calendar'
import CheckCircle from '@/components/icons/check_circled'
import Chip from '@/components/icons/chip'
import ClipboardIcon from '@/components/icons/clipboardIcon'
import Compass from '@/components/icons/compass'
import Contact from '@/components/icons/contact'
import CreditCard from '@/components/icons/credit-card'
import Dashboard from '@/components/icons/dashboard'
import Database from '@/components/icons/database'
import FileText from '@/components/icons/file-text'
import Finance from '@/components/icons/finance'
import Flag from '@/components/icons/flag'
import GitBranch from '@/components/icons/git-branch'
import Apps from '@/components/icons/apps'
import Headphone from '@/components/icons/headphone'
import Home from '@/components/icons/home'
import ImageIcon from '@/components/icons/image'
import Info from '@/components/icons/info'
import Layers from '@/components/icons/layers'
import LinkIcon from '@/components/icons/link'
import ListTree from '@/components/icons/list-tree'
import Lock from '@/components/icons/lock'
import Message from '@/components/icons/messages'
import Notification from '@/components/icons/notification'
import Payment from '@/components/icons/payment'
import Person from '@/components/icons/person'
import Pipelines from '@/components/icons/pipelines'
import AutlifyCategory from '@/components/icons/autlify-category'
import Power from '@/components/icons/power'
import Receipt from '@/components/icons/receipt'
import Rocket from '@/components/icons/rocket'
import Send from '@/components/icons/send'
import Settings from '@/components/icons/settings'
import Shield from '@/components/icons/shield'
import Sparkles from '@/components/icons/sparkles'
import Star from '@/components/icons/star'
import Tune from '@/components/icons/tune'
import Video from '@/components/icons/video_recorder'
import Wallet from '@/components/icons/wallet'
import Warning from '@/components/icons/warning'
import Zap from '@/components/icons/zap'
import Addons from '@/components/icons/addons'
import Roles from '@/components/icons/roles'
import Permissions from '@/components/icons/permissions'
import Member from '@/components/icons/member'
import Policy from '@/components/icons/policy'
import Team from '@/components/icons/team'


export const icons = [
  {
    value: 'chart',
    label: 'Bar Chart',
    path: BarChart,
  },
  {
    value: 'headphone',
    label: 'Headphones',
    path: Headphone,
  },
  {
    value: 'send',
    label: 'Send',
    path: Send,
  },
  {
    value: 'pipelines',
    label: 'Pipelines',
    path: Pipelines,
  },
  {
    value: 'calendar',
    label: 'Calendar',
    path: Calendar,
  },
  {
    value: 'settings',
    label: 'Settings',
    path: Settings,
  },
  {
    value: 'check',
    label: 'Check Circled',
    path: CheckCircle,
  },
  {
    value: 'chip',
    label: 'Chip',
    path: Chip,
  },
  {
    value: 'compass',
    label: 'Compass',
    path: Compass,
  },
  {
    value: 'database',
    label: 'Database',
    path: Database,
  },
  {
    value: 'flag',
    label: 'Flag',
    path: Flag,
  },
  {
    value: 'home',
    label: 'Home',
    path: Home,
  },
  {
    value: 'info',
    label: 'Info',
    path: Info,
  },
  {
    value: 'link',
    label: 'Link',
    path: LinkIcon,
  },
  {
    value: 'lock',
    label: 'Lock',
    path: Lock,
  },
  {
    value: 'messages',
    label: 'Messages',
    path: Message,
  },
  {
    value: 'notification',
    label: 'Notification',
    path: Notification,
  },
  {
    value: 'payment',
    label: 'Payment',
    path: Payment,
  },
  {
    value: 'power',
    label: 'Power',
    path: Power,
  },
  {
    value: 'receipt',
    label: 'Receipt',
    path: Receipt,
  },
  {
    value: 'shield',
    label: 'Shield',
    path: Shield,
  },
  {
    value: 'star',
    label: 'Star',
    path: Star,
  },
  {
    value: 'tune',
    label: 'Tune',
    path: Tune,
  },
  {
    value: 'videorecorder',
    label: 'Video Recorder',
    path: Video,
  },
  {
    value: 'wallet',
    label: 'Wallet',
    path: Wallet,
  },
  {
    value: 'warning',
    label: 'Warning',
    path: Warning,
  },
  {
    value: 'person',
    label: 'Person',
    path: Person,
  },
  {
    value: 'category',
    label: 'Category',
    path: AutlifyCategory,
  },
  {
    value: 'clipboardIcon',
    label: 'Clipboard Icon',
    path: ClipboardIcon,
  },
  {
    value: 'finance',
    label: 'Finance',
    path: Finance,
  },
  {
    value: 'apps',
    label: 'Apps',
    path: Apps,
  },
  {
    value: 'dashboard',
    label: 'Dashboard',
    path: Dashboard,
  },
  {
    value: 'rocket',
    label: 'Rocket',
    path: Rocket,
  },
  {
    value: 'building',
    label: 'Building',
    path: Building,
  },
  {
    value: 'credit-card',
    label: 'Credit Card',
    path: CreditCard,
  },
  {
    value: 'sparkles',
    label: 'Sparkles',
    path: Sparkles,
  },
  {
    value: 'list-tree',
    label: 'List Tree',
    path: ListTree,
  },
  {
    value: 'git-branch',
    label: 'Git Branch',
    path: GitBranch,
  },
  {
    value: 'layers',
    label: 'Layers',
    path: Layers,
  },
  {
    value: 'contact',
    label: 'Contact',
    path: Contact,
  },
  {
    value: 'bar-chart-3',
    label: 'Bar Chart 3',
    path: BarChart3,
  },
  {
    value: 'image',
    label: 'Image',
    path: ImageIcon,
  },
  {
    value: 'file-text',
    label: 'File Text',
    path: FileText,
  },
  {
    value: 'zap',
    label: 'Zap',
    path : Zap,
  },
  {
    value: 'addons',
    label: 'Addons',
    path : Addons,
  },
  {
    value: 'roles',
    label: 'Roles',
    path : Roles,
  },
  {
    value: 'permissions',
    label: 'Permissions',
    path : Permissions,
  },
  {
    value: 'member',
    label: 'Member',
    path : Member,
  },
  {
    value: 'policy',
    label: 'Policy',
    path : Policy,
  },
  {
    value: 'team',
    label: 'Team',
    path : Team,
  },
]

export type EditorBtns =
  | 'text'
  | 'container'
  | 'section'
  | 'contactForm'
  | 'paymentForm'
  | 'link'
  | '2Col'
  | 'video'
  | '__body'
  | 'image'
  | null
  | '3Col'

export const defaultStyles: React.CSSProperties = {
  backgroundPosition: 'center',
  objectFit: 'cover',
  backgroundRepeat: 'no-repeat',
  textAlign: 'left',
  opacity: '100%',
}
