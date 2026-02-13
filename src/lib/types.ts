import {
  Contact,
  Lane,
  Notification,
  Prisma,
  Role,
  Tag,
  Ticket,
  User,
} from '@/generated/prisma/client'
import {
  _getTicketsWithAllRelations, 
  getAuthUserDetails,
  getFunnels,
  getMedia,
  getPipelineDetails,
  getTicketsWithTags,
  getUserMemberships,
  getUsersWithAgencySubAccountPermissionsSidebarOptions,
} from './queries'
import { z } from 'zod'

import Stripe from 'stripe'

export type NotificationWithUser =
  | ({
      User: {
        id: string
        name: string
        avatarUrl: string
        email: string
        createdAt: Date
        updatedAt: Date
        role: Role
        agencyId: string | null
      }
    } & Notification)[]
  | undefined

export type UserWithPermissionsAndSubAccounts = Awaited<ReturnType<
  typeof getUserMemberships
>>

export const FunnelPageSchema = z.object({
  name: z.string().min(1),
  pathName: z.string().optional(),
})

export type AuthUserWithAgencySigebarOptionsSubAccounts =
  Awaited<ReturnType<typeof getAuthUserDetails>>

export type UsersWithAgencySubAccountPermissionsSidebarOptions =
  Awaited<ReturnType<
    typeof getUsersWithAgencySubAccountPermissionsSidebarOptions
  >>

export type GetMediaFiles = Awaited<ReturnType<typeof getMedia>>

export type CreateMediaType = Prisma.MediaCreateWithoutSubaccountInput

export type TicketAndTags = Ticket & {
  Tags: Tag[]
  Assigned: User | null
  Customer: Contact | null
}

export type LaneDetail = Lane & {
  Tickets: TicketAndTags[]
}

export const CreatePipelineFormSchema = z.object({
  name: z.string().min(1),
})

export const CreateFunnelFormSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  subDomainName: z.string().optional(),
  favicon: z.string().optional(),
})

export type PipelineDetailsWithLanesCardsTagsTickets = Awaited<ReturnType<
  typeof getPipelineDetails
>>

export const LaneFormSchema = z.object({
  name: z.string().min(1),
})

export type TicketWithTags = Awaited<ReturnType<typeof getTicketsWithTags>>

const currencyNumberRegex = /^\d+(\.\d{1,2})?$/

export const TicketFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  value: z.string().refine((value) => currencyNumberRegex.test(value), {
    message: 'Value must be a valid price.',
  }),
})

export type TicketDetails = Awaited<ReturnType<
  typeof _getTicketsWithAllRelations
>>

export const ContactUserFormSchema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email(),
})

export type Address = {
  city: string
  country: string
  line1: string
  postal_code: string
  state: string
}

export type ShippingInfo = {
  address: Address
  name: string
}

export type StripeCustomerType = {
  email: string
  name: string
  phone: string
  individual_name: string
  business_name?: string
  address: Stripe.AddressParam
  shipping: Stripe.CustomerUpdateParams.Shipping
  metadata?: {
    entityType?: string
    identificationNo?: string
    [key: string]: string | undefined
  }
  // shipping: ShippingInfo
  // address: Address
}

export type PricesList = Stripe.ApiList<Stripe.Price>

export type FunnelsForSubAccount = Awaited<ReturnType<
  typeof getFunnels
>>[0]

export type UpsertFunnelPage = Prisma.FunnelPageCreateWithoutFunnelInput

export type StripeCustomerProps = Stripe.CustomerCreateParams


export type StripeProductProps = Stripe.Product

export type StripePriceProps = Stripe.Price

// ============================================================================
// Re-export Catalog Types from types/billing.ts (SSoT)
// ============================================================================

export type {
  CatalogProduct,
  CatalogPrice,
  PlanDefinition,
  AddonDefinition,
  AddonClassificationType as AddonType,
  AddonCategoryType as AddonCategory,
} from '@/types/billing'