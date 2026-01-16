import BarChart from '@/components/icons/bar_chart'
import Calendar from '@/components/icons/calendar'
import CheckCircle from '@/components/icons/check_circled'
import Chip from '@/components/icons/chip'
import ClipboardIcon from '@/components/icons/clipboardIcon'
import Compass from '@/components/icons/compass'
import Database from '@/components/icons/database'
import Flag from '@/components/icons/flag'
import Headphone from '@/components/icons/headphone'
import Home from '@/components/icons/home'
import Info from '@/components/icons/info'
import LinkIcon from '@/components/icons/link'
import Lock from '@/components/icons/lock'
import Message from '@/components/icons/messages'
import Notification from '@/components/icons/notification'
import Payment from '@/components/icons/payment'
import Person from '@/components/icons/person'
import Pipelines from '@/components/icons/pipelines'
import AutlifyCategory from '@/components/icons/autlify-category'
import Power from '@/components/icons/power'
import Receipt from '@/components/icons/receipt'
import Send from '@/components/icons/send'
import Settings from '@/components/icons/settings'
import Shield from '@/components/icons/shield'
import Star from '@/components/icons/star'
import Tune from '@/components/icons/tune'
import Video from '@/components/icons/video_recorder'
import Wallet from '@/components/icons/wallet'
import Warning from '@/components/icons/warning'

// Default location settings
export const DEFAULT_COUNTRY = {
  name: 'Malaysia',
  isoCode: 'MY',
  phoneCode: '+60',
} as const

export const DEFAULT_CURRENCY = 'MYR'
export const DEFAULT_TAX_RATE_ID = process.env.STRIPE_MALAYSIA_TAX_RATE_ID

// export const planFeatures = [
//   {
//   SUBACCOUNT: 'core.subaccounts.account',
//   REBILLING: 'crm.billing.rebilling',
//   CONTACT: 'crm.contacts.contact',
//   FUNNEL: 'crm.funnels.funnel',
//   PIPELINE: 'crm.pipelines.pipeline',
//   }
// ]
// export const marketingFeatures = {
//   SUBACCOUNT: 'Subaccount Management',
//   REBILLING: 'Customer Rebilling',
//   CONTACT: 'Contact Management',
//   FUNNEL: 'Sales Funnels & Landing Pages',
//   PIPELINE: 'Sales Pipelines & Tickets',
// }

// export const pricingCards = [
//   {
//     title: 'Basic',
//     description: 'Perfect for getting started',
//     price: 'RM 49', // per seat (subscription quantity controls total agency + subaccount users)
//     duration: 'month',
//     trialPeriod: 14, // days - auto-upgrade with pre-collected payment method
//     highlight: 'Best for getting started',
//     features: [
//       '1 Sub account',
//       '2 Funnels',
//       '5 Pipelines',
//     ],
//     entitlementFeatures: [{
//       SUBACCOUNT: 1,
//       FUNNEL: 2, // per subaccount
//       PIPELINE: 5, // per subaccount
//       CONTACT: 100, // per subaccount
//     }],
//     priceId: 'price_1SpVOYJglUPlULDQhsRkA5YV',
//   },
//   {
//     title: 'Pro',
//     description: 'Ideal for small to medium agencies',
//     price: 'RM 99', // per seat (subscription quantity controls total agency + subaccount users)
//     duration: 'month',
//     trialPeriod: 14, // days - auto-upgrade with pre-collected payment method
//     highlight: 'Most popular',
//     features: [
//       '10 Sub accounts',
//       '15 Funnels',
//       '20 Pipelines',
//     ],
//     entitlementFeatures: [{
//       SUBACCOUNT: 10,
//       FUNNEL: 15, // per subaccount
//       PIPELINE: 20, // per subaccount
//       CONTACT: 1000, // per subaccount
//     }],
//     priceId: '',
//   },
//   {
//     title: 'Ultimate',
//     description: 'For established agencies with advanced needs',
//     price: 'RM 199', // per seat (subscription quantity controls total agency + subaccount users)
//     duration: 'month',
//     trialPeriod: 14, // days - auto-upgrade with pre-collected payment method
//     highlight: 'Everything unlimited',
//     features: [
//       'All Unlimited',
//       'Customer Rebilling',
//     ],
//     entitlementFeatures: [{
//       REBILLING: -1, // unlimited
//       SUBACCOUNT: -1, // unlimited
//       FUNNEL: -1, // unlimited per subaccount
//       PIPELINE: -1, // unlimited per subaccount
//       CONTACT: -1, // unlimited per subaccount
//     }],
//     priceId: '',
//   },
// ]

export const pricingCards = [
  {
    title: 'Starter',
    description: 'Perfect for trying out plura',
    price: 'RM 79',
    duration: 'month',
    highlight: 'Key features',
    features: ['3 Sub-Accounts', '2 Team Members', 'Unlimited Pipelines'],
    priceId: 'price_1SpVOXJglUPlULDQt9Ejhunb',
    trialEnabled: true,
    trialPeriodDays: 14,
  },
  {
    title: 'Basic',
    description: 'For serious agency owners',
    price: 'RM 149',
    duration: 'month',
    highlight: 'Everything in Starter, plus',
    features: ['Unlimited Sub-Accounts', 'Unlimited Team Members'],
    priceId: 'price_1SpVOYJglUPlULDQhsRkA5YV',
    trialEnabled: true,
    trialPeriodDays: 14,
  },
  {
    title: 'Advanced',
    description: 'The ultimate agency kit',
    price: 'RM 399',
    duration: 'month',
    highlight: 'Key features',
    features: ['Rebilling', '24/7 Support Team'],
    priceId: 'price_1SpVOZJglUPlULDQoFq3iPES',
    trialEnabled: false, // No trial for premium plan
    trialPeriodDays: 0,
  },
]

export const addOnProducts = [
  { 
    title: 'Priority Support', 
    description: '24/7 priority support with dedicated account manager',
    price: 'RM 99',
    duration: 'month',
    id: 'prod_Tn5ZVynuKgwkQ9',
    priceId: 'price_1SpVObJglUPlULDQRfhLJNEo',
  },
]

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
