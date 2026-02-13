import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import type { StripeAccountType } from '@/types/billing'
import { makeStripeIdempotencyKey } from '@/lib/stripe/idempotency'

/**
 * Stripe V2 Core Accounts API - Full Dynamic Attribute Capture
 * 
 * PURPOSE: Create connected accounts for SubAccounts to receive payments/payouts.
 * NOT FOR: Agency checkout - use /api/stripe/customers + /api/stripe/create-subscription
 * 
 * Configuration Types:
 * - 'merchant': SubAccount collects payments from clients (has card_payments, transfers)
 * - 'recipient': SubAccount receives payouts from Agency (has stripe_transfers)
 * - 'customer': For customer configuration (KYC/compliance identity, not billing)
 * 
 * Entity Types:
 * - 'company': Registered business with business_details
 * - 'individual': Freelancer/sole proprietor with individual_details
 * 
 * Dashboard Access:
 * - 'none': No dashboard access (fully white-labeled)
 * - 'express': Express dashboard (limited functionality)
 * - 'full': Full Stripe dashboard access
 * 
 * @see https://docs.stripe.com/api/v2/core/accounts
 */

// ============================================================================
// Type Definitions - Full V2 Account Structure
// ============================================================================

/** Address structure used throughout V2 accounts */
interface V2Address {
    line1?: string
    line2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
}

/** Date of birth structure */
interface V2DateOfBirth {
    day: number
    month: number
    year: number
}

/** Name structure for individual */
interface V2IndividualName {
    givenName?: string
    surname?: string
    /** For Japanese names */
    givenNameKana?: string
    surnameKana?: string
    givenNameKanji?: string
    surnameKanji?: string
}

/** Individual details for entity_type: 'individual' */
interface V2IndividualDetails {
    /** Full name */
    name?: V2IndividualName
    /** Date of birth */
    dateOfBirth?: string // YYYY-MM-DD format, we parse it
    /** Phone number */
    phone?: string
    /** Email */
    email?: string
    /** Address */
    address?: V2Address
    /** ID number (SSN, Tax ID, etc) */
    idNumber?: string
    /** Nationality (ISO 3166-1 alpha-2) */
    nationality?: string
    /** Political exposure status */
    politicalExposure?: 'none' | 'existing'
}

/** Business details for entity_type: 'company' */
interface V2BusinessDetails {
    /** Registered business name */
    registeredName?: string
    /** Doing business as (DBA) name */
    doingBusinessAs?: string
    /** Registered address */
    address?: V2Address
    /** Phone number */
    phone?: string
    /** Tax ID / EIN / Company Number */
    taxId?: string
    /** VAT ID */
    vatId?: string
    /** Business structure */
    structure?: 
        | 'sole_proprietorship'
        | 'single_member_llc'
        | 'multi_member_llc'
        | 'private_partnership'
        | 'private_corporation'
        | 'public_corporation'
        | 'public_partnership'
        | 'government_instrumentality'
        | 'governmental_unit'
        | 'tax_exempt_government_instrumentality'
        | 'unincorporated_association'
        | 'incorporated_non_profit'
        | 'unincorporated_non_profit'
        | 'free_zone_llc'
        | 'free_zone_establishment'
        | 'sole_establishment'
    /** MCC (Merchant Category Code) */
    mcc?: string
    /** Product description */
    productDescription?: string
    /** Support contact */
    supportAddress?: V2Address
    supportEmail?: string
    supportPhone?: string
    supportUrl?: string
    /** Website/URL */
    url?: string
}

/** Identity structure - main identity block */
interface V2Identity {
    /** Country code (ISO 3166-1 alpha-2) */
    country?: string
    /** Entity type */
    entityType?: 'individual' | 'company'
    /** Individual details (when entityType: 'individual') */
    individualDetails?: V2IndividualDetails
    /** Business details (when entityType: 'company') */
    businessDetails?: V2BusinessDetails
}

/** Merchant configuration */
interface V2MerchantConfig {
    /** Requested capabilities */
    capabilities?: {
        cardPayments?: { requested: boolean }
        transfers?: { requested: boolean }
        bankPayments?: { ach?: { requested: boolean } }
    }
    /** Statement descriptor */
    statementDescriptor?: string
    /** Statement descriptor prefix */
    statementDescriptorPrefix?: string
    /** MCC override */
    mcc?: string
    /** Support contact */
    supportEmail?: string
    supportPhone?: string
    supportUrl?: string
}

/** Recipient configuration */
interface V2RecipientConfig {
    /** Requested capabilities */
    capabilities?: {
        stripeBalance?: {
            stripeTransfers?: { requested: boolean }
        }
        cards?: { requested: boolean }
        banksLocal?: { requested: boolean }
        banksWire?: { requested: boolean }
    }
}

/** Customer configuration (for KYC/compliance, not billing) */
interface V2CustomerConfig {
    /** Requested capabilities */
    capabilities?: {
        automaticIndirectTax?: { requested: boolean }
    }
}

/** Account configuration block */
interface V2Configuration {
    merchant?: V2MerchantConfig
    recipient?: V2RecipientConfig
    customer?: V2CustomerConfig
}

/** Default responsibilities */
interface V2Defaults {
    responsibilities?: {
        /** Who collects fees: 'application' | 'stripe' */
        feesCollector?: 'application' | 'stripe'
        /** Who handles losses: 'application' | 'stripe' */
        lossesCollector?: 'application' | 'stripe'
    }
}

/** Person relationship for company entities */
interface V2PersonRelationship {
    /** Is this the account representative? */
    representative?: boolean
    /** Is this person an executive? */
    executive?: boolean
    /** Is this person a director? */
    director?: boolean
    /** Is this person an owner (25%+ ownership)? */
    owner?: boolean
    /** Ownership percentage (if owner) */
    percentOwnership?: number
    /** Title/position */
    title?: string
}

/** Person details for company accounts */
interface V2Person {
    /** First/given name */
    firstName?: string
    /** Last name/surname */
    lastName?: string
    /** Email */
    email?: string
    /** Phone */
    phone?: string
    /** Date of birth (YYYY-MM-DD) */
    dateOfBirth?: string
    /** Address */
    address?: V2Address
    /** ID number */
    idNumber?: string
    /** Nationality */
    nationality?: string
    /** Political exposure */
    politicalExposure?: 'none' | 'existing'
    /** Relationship to account */
    relationship?: V2PersonRelationship
}

// ============================================================================
// GET - List accounts
// ============================================================================

/**
 * @method GET /api/stripe/v2/core/accounts
 * @description List all connected Stripe V2 accounts with optional filters
 * @query closed - Filter by closed status
 * @query configuration - Filter by applied configurations ('merchant', 'recipient', 'customer')
 * @return JSON response with list of accounts
 */
export async function GET(req: Request) {
    try {
        const url = new URL(req.url)
        const closed = url.searchParams.get('closed')
        const configuration = url.searchParams.get('configuration')

        const listParams: Record<string, unknown> = {
            limit: 100,
        }
        if (closed !== null) {
            listParams.closed = closed === 'true'
        }
        if (configuration) {
            listParams.applied_configurations = [configuration]
        }

        const accounts = await stripe.v2.core.accounts.list(listParams as Stripe.V2.Core.AccountListParams)
        return NextResponse.json({ 
            accounts: accounts.data,
            hasMore: accounts.has_more,
        })
    } catch (error) {
        console.error('Error fetching Stripe accounts:', error)
        return NextResponse.json(
            { error: 'Failed to fetch Stripe accounts' },
            { status: 500 }
        )
    }
}

// ============================================================================
// POST - Create account
// ============================================================================

/**
 * Full V2 Account Create Request - Dynamic attribute capture
 * Supports minimal checkout flow and detailed merchant/recipient setup
 */
interface CreateAccountRequest {
    /** Account configuration type: merchant, recipient, or customer */
    accountType: StripeAccountType
    /** Contact email */
    email?: string
    /** Display name */
    displayName?: string
    /** Dashboard access: 'none', 'express', 'full' */
    dashboard?: 'none' | 'express' | 'full'
    
    // Identity
    /** Full identity structure */
    identity?: V2Identity
    
    // Configuration
    /** Full configuration structure */
    configuration?: V2Configuration
    
    // Defaults
    /** Default responsibilities */
    defaults?: V2Defaults
    
    // Persons (for company entities)
    /** Persons to create with the account (representative, owners, directors) */
    persons?: V2Person[]
    
    // Include fields in response
    /** Fields to include in response */
    include?: ('identity' | 'configuration' | 'defaults' | 'requirements')[]
    
    // Internal references
    /** Agency ID (internal reference) */
    agencyId?: string
    /** SubAccount ID (internal reference) */
    subAccountId?: string
    
    /** Additional metadata */
    metadata?: Record<string, string>
    
    // ==========================================================================
    // Legacy fields (for backwards compatibility) - DEPRECATED
    // Use identity.individualDetails and identity.businessDetails instead
    // ==========================================================================
    /** @deprecated Use identity.country */
    country?: string
    /** @deprecated Use identity.entityType */
    entityType?: 'individual' | 'company'
    /** @deprecated Use identity.individualDetails */
    individual?: {
        firstName?: string
        lastName?: string
        dateOfBirth?: string
        phone?: string
        address?: V2Address
    }
    /** @deprecated Use configuration.merchant */
    merchant?: {
        businessName?: string
        statementDescriptor?: string
        mcc?: string
        supportEmail?: string
        supportPhone?: string
        supportUrl?: string
    }
}

// Helper: Parse date string to V2 date object
function parseDateOfBirth(dateStr: string): { day: number; month: number; year: number } | undefined {
    if (!dateStr) return undefined
    const parts = dateStr.split('-')
    if (parts.length !== 3) return undefined
    return {
        year: parseInt(parts[0]),
        month: parseInt(parts[1]),
        day: parseInt(parts[2]),
    }
}

// Helper: Convert address to Stripe format
function toStripeAddress(addr?: V2Address): Record<string, string | undefined> | undefined {
    if (!addr) return undefined
    return {
        line1: addr.line1,
        line2: addr.line2,
        city: addr.city,
        state: addr.state,
        postal_code: addr.postalCode,
        country: addr.country,
    }
}

/**
 * @method POST /api/stripe/v2/core/accounts
 * @description Create a new Stripe V2 account with full dynamic attribute capture
 * 
 * NOTE: For checkout (Agency paying Autlify), use stripe.customers (V1), not V2 accounts.
 * V2 accounts are for connected accounts: merchants (collect payments) or recipients (receive payouts).
 * 
 * EXAMPLES:
 * 
 * 1. Minimal merchant (company):
 * { accountType: 'merchant', email: 'contact@company.com', identity: { country: 'US', entityType: 'company' } }
 * 
 * 2. Full merchant (company with business details):
 * {
 *   accountType: 'merchant',
 *   email: 'contact@company.com',
 *   dashboard: 'express',
 *   identity: {
 *     country: 'US',
 *     entityType: 'company',
 *     businessDetails: {
 *       registeredName: 'Acme Corp',
 *       taxId: '12-3456789',
 *       structure: 'private_corporation',
 *       address: { line1: '123 Main St', city: 'NYC', state: 'NY', postalCode: '10001', country: 'US' }
 *     }
 *   },
 *   configuration: { merchant: { capabilities: { cardPayments: { requested: true } } } },
 *   defaults: { responsibilities: { feesCollector: 'stripe', lossesCollector: 'stripe' } }
 * }
 * 
 * 3. Individual/Freelancer recipient:
 * {
 *   accountType: 'recipient',
 *   email: 'john@freelance.com',
 *   identity: {
 *     country: 'US',
 *     entityType: 'individual',
 *     individualDetails: {
 *       name: { givenName: 'John', surname: 'Doe' },
 *       dateOfBirth: '1990-05-15',
 *       address: { line1: '456 Oak Ave', city: 'LA', state: 'CA', postalCode: '90001', country: 'US' }
 *     }
 *   }
 * }
 */
export async function POST(req: Request) {
    try {
        const body: CreateAccountRequest = await req.json()
        console.log('🔍 Creating V2 account:', JSON.stringify(body, null, 2))

        const {
            accountType,
            email,
            displayName,
            dashboard = 'none',
            identity,
            configuration,
            defaults,
            persons,
            include = ['identity', 'configuration', 'defaults'],
            agencyId,
            subAccountId,
            metadata = {},
            // Legacy fields (backwards compatibility)
            country: legacyCountry,
            entityType: legacyEntityType,
            individual: legacyIndividual,
            merchant: legacyMerchant,
        } = body

        if (!accountType) {
            return NextResponse.json(
                { error: 'accountType is required (merchant, recipient, or customer)' },
                { status: 400 }
            )
        }

        // For billing checkout flow, redirect to use V1 customers instead
        if (accountType === 'customer') {
            // V2 customer configuration is supported for KYC/compliance use cases
            // But not for billing - that uses V1 stripe.customers
            console.log('ℹ️ Note: V2 customer config is for KYC/compliance, not billing')
        }

        // Resolve identity from new structure or legacy fields
        const resolvedCountry = identity?.country || legacyCountry || 'MY'
        const resolvedEntityType = identity?.entityType || legacyEntityType || 'company'

        // Build metadata with internal references
        const accountMetadata: Record<string, string> = {
            ...metadata,
            ...(agencyId && { agencyId }),
            ...(subAccountId && { subAccountId }),
            accountType,
            entityType: resolvedEntityType,
            dashboard,
            createdAt: new Date().toISOString(),
        }

        // Build identity block dynamically
        const buildIdentity = () => {
            const baseIdentity: Record<string, unknown> = {
                country: resolvedCountry,
                entity_type: resolvedEntityType,
            }

            if (resolvedEntityType === 'individual') {
                // Use new structure or legacy
                const details = identity?.individualDetails || legacyIndividual
                if (details) {
                    const individualDetails: Record<string, unknown> = {}
                    
                    // Name handling - support both new and legacy
                    if ('name' in details && details.name) {
                        const name = details.name as V2IndividualName
                        individualDetails.name = {
                            given_name: name.givenName,
                            surname: name.surname,
                            ...(name.givenNameKana && { given_name_kana: name.givenNameKana }),
                            ...(name.surnameKana && { surname_kana: name.surnameKana }),
                            ...(name.givenNameKanji && { given_name_kanji: name.givenNameKanji }),
                            ...(name.surnameKanji && { surname_kanji: name.surnameKanji }),
                        }
                    } else if ('firstName' in details && 'lastName' in details) {
                        // Legacy format
                        individualDetails.name = {
                            given_name: (details as { firstName?: string }).firstName,
                            surname: (details as { lastName?: string }).lastName,
                        }
                    }

                    // Date of birth
                    const dob = 'dateOfBirth' in details ? details.dateOfBirth as string : undefined
                    if (dob) {
                        individualDetails.date_of_birth = parseDateOfBirth(dob)
                    }

                    // Phone
                    if ('phone' in details && details.phone) {
                        individualDetails.phone = details.phone
                    }
                    
                    // Email
                    if ('email' in details && details.email) {
                        individualDetails.email = details.email
                    }

                    // Address
                    const address = 'address' in details ? details.address : undefined
                    if (address) {
                        individualDetails.address = toStripeAddress(address)
                    }

                    // ID Number
                    if ('idNumber' in details && details.idNumber) {
                        individualDetails.id_number = details.idNumber
                    }

                    // Nationality
                    if ('nationality' in details && details.nationality) {
                        individualDetails.nationality = details.nationality
                    }

                    // Political exposure
                    if ('politicalExposure' in details && details.politicalExposure) {
                        individualDetails.political_exposure = details.politicalExposure
                    }

                    baseIdentity.individual_details = individualDetails
                }
            } else {
                // Company entity
                const details = identity?.businessDetails || (legacyMerchant ? {
                    registeredName: legacyMerchant.businessName,
                } : undefined)

                if (details) {
                    const businessDetails: Record<string, unknown> = {}

                    if (details.registeredName) {
                        businessDetails.registered_name = details.registeredName
                    }
                    if (details.doingBusinessAs) {
                        businessDetails.doing_business_as = details.doingBusinessAs
                    }
                    if (details.address) {
                        businessDetails.address = toStripeAddress(details.address)
                    }
                    if (details.phone) {
                        businessDetails.phone = details.phone
                    }
                    if (details.taxId) {
                        businessDetails.tax_id = details.taxId
                    }
                    if (details.vatId) {
                        businessDetails.vat_id = details.vatId
                    }
                    if (details.structure) {
                        businessDetails.structure = details.structure
                    }
                    if (details.mcc) {
                        businessDetails.mcc = details.mcc
                    }
                    if (details.productDescription) {
                        businessDetails.product_description = details.productDescription
                    }
                    if (details.url) {
                        businessDetails.url = details.url
                    }
                    // Support details
                    if (details.supportEmail) {
                        businessDetails.support_email = details.supportEmail
                    }
                    if (details.supportPhone) {
                        businessDetails.support_phone = details.supportPhone
                    }
                    if (details.supportUrl) {
                        businessDetails.support_url = details.supportUrl
                    }
                    if (details.supportAddress) {
                        businessDetails.support_address = toStripeAddress(details.supportAddress)
                    }

                    baseIdentity.business_details = businessDetails
                }
            }

            return baseIdentity
        }

        // Build configuration block
        const buildConfiguration = () => {
            // If explicit configuration provided, use it
            if (configuration) {
                const config: Record<string, unknown> = {}

                if (configuration.merchant) {
                    const merchant: Record<string, unknown> = {}
                    if (configuration.merchant.capabilities) {
                        merchant.capabilities = {
                            ...(configuration.merchant.capabilities.cardPayments && {
                                card_payments: { requested: configuration.merchant.capabilities.cardPayments.requested }
                            }),
                            ...(configuration.merchant.capabilities.transfers && {
                                transfers: { requested: configuration.merchant.capabilities.transfers.requested }
                            }),
                            ...(configuration.merchant.capabilities.bankPayments?.ach && {
                                bank_payments: { ach: { requested: configuration.merchant.capabilities.bankPayments.ach.requested } }
                            }),
                        }
                    }
                    if (configuration.merchant.statementDescriptor) {
                        merchant.statement_descriptor = configuration.merchant.statementDescriptor
                    }
                    if (configuration.merchant.statementDescriptorPrefix) {
                        merchant.statement_descriptor_prefix = configuration.merchant.statementDescriptorPrefix
                    }
                    if (configuration.merchant.mcc) {
                        merchant.mcc = configuration.merchant.mcc
                    }
                    if (configuration.merchant.supportEmail) {
                        merchant.support_email = configuration.merchant.supportEmail
                    }
                    if (configuration.merchant.supportPhone) {
                        merchant.support_phone = configuration.merchant.supportPhone
                    }
                    if (configuration.merchant.supportUrl) {
                        merchant.support_url = configuration.merchant.supportUrl
                    }
                    config.merchant = merchant
                }

                if (configuration.recipient) {
                    const recipient: Record<string, unknown> = {}
                    if (configuration.recipient.capabilities) {
                        recipient.capabilities = {
                            ...(configuration.recipient.capabilities.stripeBalance?.stripeTransfers && {
                                stripe_balance: {
                                    stripe_transfers: { requested: configuration.recipient.capabilities.stripeBalance.stripeTransfers.requested }
                                }
                            }),
                            ...(configuration.recipient.capabilities.cards && {
                                cards: { requested: configuration.recipient.capabilities.cards.requested }
                            }),
                            ...(configuration.recipient.capabilities.banksLocal && {
                                banks_local: { requested: configuration.recipient.capabilities.banksLocal.requested }
                            }),
                            ...(configuration.recipient.capabilities.banksWire && {
                                banks_wire: { requested: configuration.recipient.capabilities.banksWire.requested }
                            }),
                        }
                    }
                    config.recipient = recipient
                }

                if (configuration.customer) {
                    const customer: Record<string, unknown> = {}
                    if (configuration.customer.capabilities?.automaticIndirectTax) {
                        customer.capabilities = {
                            automatic_indirect_tax: { requested: configuration.customer.capabilities.automaticIndirectTax.requested }
                        }
                    }
                    config.customer = customer
                }

                return config
            }

            // Default configuration based on accountType
            if (accountType === 'merchant') {
                return {
                    merchant: {
                        capabilities: {
                            card_payments: { requested: true },
                            transfers: { requested: true },
                        },
                        ...(legacyMerchant?.statementDescriptor && {
                            statement_descriptor: legacyMerchant.statementDescriptor
                        }),
                        ...(legacyMerchant?.mcc && { mcc: legacyMerchant.mcc }),
                        ...(legacyMerchant?.supportEmail && { support_email: legacyMerchant.supportEmail }),
                        ...(legacyMerchant?.supportPhone && { support_phone: legacyMerchant.supportPhone }),
                        ...(legacyMerchant?.supportUrl && { support_url: legacyMerchant.supportUrl }),
                    },
                }
            }

            if (accountType === 'recipient') {
                return {
                    recipient: {
                        capabilities: {
                            stripe_balance: {
                                stripe_transfers: { requested: true },
                            },
                        },
                    },
                }
            }

            if (accountType === 'customer') {
                return {
                    customer: {
                        capabilities: {
                            automatic_indirect_tax: { requested: true },
                        },
                    },
                }
            }

            return undefined
        }

        // Build defaults block
        const buildDefaults = () => {
            if (!defaults?.responsibilities) return undefined
            return {
                responsibilities: {
                    ...(defaults.responsibilities.feesCollector && {
                        fees_collector: defaults.responsibilities.feesCollector
                    }),
                    ...(defaults.responsibilities.lossesCollector && {
                        losses_collector: defaults.responsibilities.lossesCollector
                    }),
                },
            }
        }

        // Build V2 account params
        const accountParams = {
            contact_email: email,
            metadata: accountMetadata,
            ...(displayName && { display_name: displayName }),
            dashboard,
            identity: buildIdentity(),
            configuration: buildConfiguration(),
            ...(buildDefaults() && { defaults: buildDefaults() }),
            include: include.map(i => {
                // Map include fields to Stripe format
                if (i === 'configuration') return `configuration.${accountType}`
                return i
            }),
        } as Stripe.V2.Core.AccountCreateParams

        console.log('📤 Stripe V2 create params:', JSON.stringify(accountParams, null, 2))

        const idem = makeStripeIdempotencyKey('v2_core_accounts_create', [
            accountType,
            resolvedEntityType,
            agencyId || '',
            subAccountId || '',
            email || '',
        ])

        const account = await stripe.v2.core.accounts.create(accountParams, { idempotencyKey: idem })

        console.log('✅ Created V2 account:', account.id, 'type:', accountType, 'entity:', resolvedEntityType)

        // Create persons if provided (for company entities)
        const createdPersons: Array<{ id: string; relationship: V2PersonRelationship }> = []
        if (persons && persons.length > 0 && resolvedEntityType === 'company') {
            // Create all persons in parallel for better performance
            const personResults = await Promise.allSettled(
                persons.map(async (person) => {
                    const personParams = {
                        ...(person.firstName && person.lastName && {
                            given_name: person.firstName,
                            family_name: person.lastName,
                        }),
                        ...(person.email && { email: person.email }),
                        ...(person.phone && { phone: person.phone }),
                        ...(person.dateOfBirth && { date_of_birth: parseDateOfBirth(person.dateOfBirth) }),
                        ...(person.address && { address: toStripeAddress(person.address) }),
                        ...(person.idNumber && { id_number: person.idNumber }),
                        ...(person.nationality && { nationality: person.nationality }),
                        ...(person.politicalExposure && { political_exposure: person.politicalExposure }),
                        relationship: {
                            ...(person.relationship?.representative && { representative: true }),
                            ...(person.relationship?.executive && { executive: true }),
                            ...(person.relationship?.director && { director: true }),
                            ...(person.relationship?.owner && { owner: true }),
                            ...(person.relationship?.percentOwnership && { percent_ownership: person.relationship.percentOwnership }),
                            ...(person.relationship?.title && { title: person.relationship.title }),
                        },
                    }

                    // Create person using V2 API
                    const createdPerson = await (stripe.v2.core.accounts as unknown as {
                        createPerson(accountId: string, params: unknown): Promise<{ id: string }>
                    }).createPerson(account.id, personParams)
                    
                    return {
                        id: createdPerson.id,
                        relationship: person.relationship || {},
                    }
                })
            )

            // Process results and log errors
            for (let i = 0; i < personResults.length; i++) {
                const result = personResults[i]
                if (result.status === 'fulfilled') {
                    createdPersons.push(result.value)
                    console.log('✅ Created person:', result.value.id, 'for account:', account.id)
                } else {
                    console.error('⚠️ Error creating person:', result.reason)
                    // Continue with other persons
                }
            }
        }

        return NextResponse.json({
            ok: true,
            account: {
                id: account.id,
                type: accountType,
                entityType: resolvedEntityType,
                dashboard,
                email: account.contact_email,
                displayName: account.display_name,
                metadata: account.metadata,
                ...(createdPersons.length > 0 && { persons: createdPersons }),
            },
        })
    } catch (error) {
        console.error('🔴 Error creating V2 account:', error)
        const message = error instanceof Stripe.errors.StripeError
            ? error.message
            : 'Failed to create account'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// ============================================================================
// PATCH - Update account
// ============================================================================

/**
 * Full V2 Account Update Request - Dynamic attribute update
 */
interface UpdateAccountRequest {
    /** Account ID to update */
    accountId: string
    /** Updated email */
    email?: string
    /** Updated display name */
    displayName?: string
    /** Updated dashboard access */
    dashboard?: 'none' | 'express' | 'full'
    
    // Identity updates
    /** Updated identity structure */
    identity?: Partial<V2Identity>
    
    // Configuration updates
    /** Updated configuration */
    configuration?: Partial<V2Configuration>
    
    // Defaults updates
    /** Updated defaults */
    defaults?: Partial<V2Defaults>
    
    // Include fields in response
    /** Fields to include in response */
    include?: ('identity' | 'configuration' | 'defaults' | 'requirements')[]
    
    /** Updated metadata (merged with existing) */
    metadata?: Record<string, string>
    
    // ==========================================================================
    // Legacy fields (for backwards compatibility) - DEPRECATED
    // ==========================================================================
    /** @deprecated Use configuration.merchant */
    merchant?: {
        businessName?: string
        statementDescriptor?: string
        mcc?: string
        supportEmail?: string
        supportPhone?: string
        supportUrl?: string
    }
    /** @deprecated Use configuration.recipient */
    recipient?: {
        payoutSpeed?: 'standard' | 'instant'
    }
}

/**
 * @method PATCH /api/stripe/v2/core/accounts
 * @description Update an existing Stripe V2 account with full dynamic attribute support
 * 
 * Use for:
 * - Updating merchant onboarding details
 * - Adding business verification info
 * - Updating support contact details
 * - Modifying payout settings
 * - Adding beneficial owners/directors (via persons)
 * 
 * EXAMPLES:
 * 
 * 1. Update business details:
 * {
 *   accountId: 'acct_xxx',
 *   identity: {
 *     businessDetails: {
 *       registeredName: 'New Corp Name',
 *       taxId: '12-3456789'
 *     }
 *   }
 * }
 * 
 * 2. Update individual details:
 * {
 *   accountId: 'acct_xxx',
 *   identity: {
 *     individualDetails: {
 *       address: { line1: 'New Address', city: 'NYC', state: 'NY', postalCode: '10001' }
 *     }
 *   }
 * }
 */
export async function PATCH(req: Request) {
    try {
        const body: UpdateAccountRequest = await req.json()
        console.log('🔄 Updating V2 account:', body.accountId)

        const { 
            accountId, 
            email, 
            displayName, 
            dashboard,
            identity,
            configuration,
            defaults,
            include = ['identity', 'configuration', 'defaults'],
            metadata,
            // Legacy
            merchant: legacyMerchant,
        } = body

        if (!accountId) {
            return NextResponse.json(
                { error: 'accountId is required' },
                { status: 400 }
            )
        }

        // Build update params dynamically
        const updateParams: Record<string, unknown> = {
            ...(email && { contact_email: email }),
            ...(displayName && { display_name: displayName }),
            ...(dashboard && { dashboard }),
            ...(metadata && { metadata }),
        }

        // Identity updates
        if (identity) {
            const identityUpdate: Record<string, unknown> = {}

            if (identity.country) {
                identityUpdate.country = identity.country
            }
            if (identity.entityType) {
                identityUpdate.entity_type = identity.entityType
            }

            // Individual details updates
            if (identity.individualDetails) {
                const details = identity.individualDetails
                const individualDetails: Record<string, unknown> = {}

                if (details.name) {
                    individualDetails.name = {
                        ...(details.name.givenName && { given_name: details.name.givenName }),
                        ...(details.name.surname && { surname: details.name.surname }),
                    }
                }
                if (details.dateOfBirth) {
                    individualDetails.date_of_birth = parseDateOfBirth(details.dateOfBirth)
                }
                if (details.phone) {
                    individualDetails.phone = details.phone
                }
                if (details.email) {
                    individualDetails.email = details.email
                }
                if (details.address) {
                    individualDetails.address = toStripeAddress(details.address)
                }
                if (details.idNumber) {
                    individualDetails.id_number = details.idNumber
                }
                if (details.nationality) {
                    individualDetails.nationality = details.nationality
                }
                if (details.politicalExposure) {
                    individualDetails.political_exposure = details.politicalExposure
                }

                if (Object.keys(individualDetails).length > 0) {
                    identityUpdate.individual_details = individualDetails
                }
            }

            // Business details updates
            if (identity.businessDetails) {
                const details = identity.businessDetails
                const businessDetails: Record<string, unknown> = {}

                if (details.registeredName) {
                    businessDetails.registered_name = details.registeredName
                }
                if (details.doingBusinessAs) {
                    businessDetails.doing_business_as = details.doingBusinessAs
                }
                if (details.address) {
                    businessDetails.address = toStripeAddress(details.address)
                }
                if (details.phone) {
                    businessDetails.phone = details.phone
                }
                if (details.taxId) {
                    businessDetails.tax_id = details.taxId
                }
                if (details.vatId) {
                    businessDetails.vat_id = details.vatId
                }
                if (details.structure) {
                    businessDetails.structure = details.structure
                }
                if (details.mcc) {
                    businessDetails.mcc = details.mcc
                }
                if (details.productDescription) {
                    businessDetails.product_description = details.productDescription
                }
                if (details.url) {
                    businessDetails.url = details.url
                }
                if (details.supportEmail) {
                    businessDetails.support_email = details.supportEmail
                }
                if (details.supportPhone) {
                    businessDetails.support_phone = details.supportPhone
                }
                if (details.supportUrl) {
                    businessDetails.support_url = details.supportUrl
                }
                if (details.supportAddress) {
                    businessDetails.support_address = toStripeAddress(details.supportAddress)
                }

                if (Object.keys(businessDetails).length > 0) {
                    identityUpdate.business_details = businessDetails
                }
            }

            if (Object.keys(identityUpdate).length > 0) {
                updateParams.identity = identityUpdate
            }
        }

        // Configuration updates
        if (configuration || legacyMerchant) {
            const configUpdate: Record<string, unknown> = {}

            // Merchant config
            if (configuration?.merchant || legacyMerchant) {
                const merchantConfig = configuration?.merchant
                const merchant: Record<string, unknown> = {}

                if (merchantConfig?.capabilities) {
                    merchant.capabilities = {
                        ...(merchantConfig.capabilities.cardPayments && {
                            card_payments: { requested: merchantConfig.capabilities.cardPayments.requested }
                        }),
                        ...(merchantConfig.capabilities.transfers && {
                            transfers: { requested: merchantConfig.capabilities.transfers.requested }
                        }),
                    }
                }
                if (merchantConfig?.statementDescriptor || legacyMerchant?.statementDescriptor) {
                    merchant.statement_descriptor = merchantConfig?.statementDescriptor || legacyMerchant?.statementDescriptor
                }
                if (merchantConfig?.mcc || legacyMerchant?.mcc) {
                    merchant.mcc = merchantConfig?.mcc || legacyMerchant?.mcc
                }
                if (merchantConfig?.supportEmail || legacyMerchant?.supportEmail) {
                    merchant.support_email = merchantConfig?.supportEmail || legacyMerchant?.supportEmail
                }
                if (merchantConfig?.supportPhone || legacyMerchant?.supportPhone) {
                    merchant.support_phone = merchantConfig?.supportPhone || legacyMerchant?.supportPhone
                }
                if (merchantConfig?.supportUrl || legacyMerchant?.supportUrl) {
                    merchant.support_url = merchantConfig?.supportUrl || legacyMerchant?.supportUrl
                }

                if (Object.keys(merchant).length > 0) {
                    configUpdate.merchant = merchant
                }
            }

            // Recipient config
            if (configuration?.recipient) {
                const recipientConfig = configuration.recipient
                const recipient: Record<string, unknown> = {}

                if (recipientConfig.capabilities) {
                    recipient.capabilities = {
                        ...(recipientConfig.capabilities.stripeBalance?.stripeTransfers && {
                            stripe_balance: {
                                stripe_transfers: { requested: recipientConfig.capabilities.stripeBalance.stripeTransfers.requested }
                            }
                        }),
                        ...(recipientConfig.capabilities.cards && {
                            cards: { requested: recipientConfig.capabilities.cards.requested }
                        }),
                        ...(recipientConfig.capabilities.banksLocal && {
                            banks_local: { requested: recipientConfig.capabilities.banksLocal.requested }
                        }),
                        ...(recipientConfig.capabilities.banksWire && {
                            banks_wire: { requested: recipientConfig.capabilities.banksWire.requested }
                        }),
                    }
                }

                if (Object.keys(recipient).length > 0) {
                    configUpdate.recipient = recipient
                }
            }

            // Customer config
            if (configuration?.customer) {
                const customerConfig = configuration.customer
                if (customerConfig.capabilities?.automaticIndirectTax) {
                    configUpdate.customer = {
                        capabilities: {
                            automatic_indirect_tax: { requested: customerConfig.capabilities.automaticIndirectTax.requested }
                        }
                    }
                }
            }

            if (Object.keys(configUpdate).length > 0) {
                updateParams.configuration = configUpdate
            }
        }

        // Defaults updates
        if (defaults?.responsibilities) {
            updateParams.defaults = {
                responsibilities: {
                    ...(defaults.responsibilities.feesCollector && {
                        fees_collector: defaults.responsibilities.feesCollector
                    }),
                    ...(defaults.responsibilities.lossesCollector && {
                        losses_collector: defaults.responsibilities.lossesCollector
                    }),
                },
            }
        }

        // Add include parameter
        updateParams.include = include

        console.log('📤 Stripe V2 update params:', JSON.stringify(updateParams, null, 2))

        const account = await stripe.v2.core.accounts.update(
            accountId, 
            updateParams as Stripe.V2.Core.AccountUpdateParams
        )

        console.log('✅ Updated V2 account:', account.id)

        return NextResponse.json({
            ok: true,
            account: {
                id: account.id,
                email: account.contact_email,
                displayName: account.display_name,
                dashboard: account.dashboard,
                metadata: account.metadata,
            },
        })
    } catch (error) {
        console.error('🔴 Error updating V2 account:', error)
        const message = error instanceof Stripe.errors.StripeError
            ? error.message
            : 'Failed to update account'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// ============================================================================
// Additional V2 Account Operations (using query params)
// ============================================================================

/**
 * @method DELETE /api/stripe/v2/core/accounts?accountId=xxx
 * @description Close a Stripe V2 account (marks as closed, cannot be deleted)
 * 
 * Note: V2 accounts cannot be fully deleted, only closed.
 * Closed accounts can still be retrieved via GET with closed=true filter.
 */
// DELETE handler would be added here if needed