-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "finance";

-- CreateEnum
CREATE TYPE "RoleScope" AS ENUM ('SYSTEM', 'AGENCY', 'SUBACCOUNT');

-- CreateEnum
CREATE TYPE "Entity" AS ENUM ('INDIVIDUAL', 'COMPANY', 'NON_PROFIT', 'GOVERNMENT_ENTITY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING', 'INCOMPLETE', 'UNPAID');

-- CreateEnum
CREATE TYPE "ApiKeyKind" AS ENUM ('USER', 'AGENCY', 'SUBACCOUNT');

-- CreateEnum
CREATE TYPE "Icon" AS ENUM ('settings', 'chart', 'calendar', 'check', 'chip', 'compass', 'database', 'flag', 'home', 'info', 'link', 'lock', 'messages', 'notification', 'payment', 'power', 'receipt', 'shield', 'star', 'tune', 'videorecorder', 'wallet', 'warning', 'headphone', 'send', 'pipelines', 'person', 'category', 'contact', 'clipboardIcon', 'finance', 'apps', 'dashboard', 'rocket', 'users', 'building', 'creditCard', 'listTree', 'fileText', 'sparkles', 'layers', 'gitBranch', 'barChart3', 'image');

-- CreateEnum
CREATE TYPE "TriggerTypes" AS ENUM ('CONTACT_FORM');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('CREATE_CONTACT');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('ACCEPTED', 'REVOKED', 'PENDING');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('price_1SpVOXJglUPlULDQt9Ejhunb', 'price_1SpVOYJglUPlULDQhsRkA5YV', 'price_1SpVOZJglUPlULDQoFq3iPES');

-- CreateEnum
CREATE TYPE "FeatureValueType" AS ENUM ('BOOLEAN', 'INTEGER', 'DECIMAL', 'STRING', 'JSON');

-- CreateEnum
CREATE TYPE "MeteringType" AS ENUM ('NONE', 'COUNT', 'SUM');

-- CreateEnum
CREATE TYPE "MeterAggregation" AS ENUM ('COUNT', 'SUM', 'LAST');

-- CreateEnum
CREATE TYPE "MeteringScope" AS ENUM ('AGENCY', 'SUBACCOUNT');

-- CreateEnum
CREATE TYPE "UsagePeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "LimitEnforcement" AS ENUM ('HARD', 'SOFT');

-- CreateEnum
CREATE TYPE "OverageMode" AS ENUM ('NONE', 'INTERNAL_CREDITS', 'STRIPE_METERED');

-- CreateEnum
CREATE TYPE "CreditLedgerType" AS ENUM ('GRANT', 'TOPUP', 'CONSUME', 'ADJUST', 'EXPIRE');

-- CreateEnum
CREATE TYPE "MFAMethodType" AS ENUM ('TOTP', 'SMS', 'EMAIL', 'BACKUP_CODES', 'PASSKEY');

-- CreateEnum
CREATE TYPE "SSOProvider" AS ENUM ('OIDC', 'SAML', 'GOOGLE_WORKSPACE', 'MICROSOFT_ENTRA', 'OKTA', 'PING_IDENTITY', 'AUTH0');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING', 'FAILED');

-- CreateEnum
CREATE TYPE "SSOEventType" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'USER_SUSPENDED', 'TOKEN_REFRESH', 'CONNECTION_TESTED', 'CONNECTION_UPDATED');

-- CreateEnum
CREATE TYPE "finance"."AccountType" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "finance"."AccountCategory" AS ENUM ('CURRENT_ASSET', 'FIXED_ASSET', 'OTHER_ASSET', 'CURRENT_LIABILITY', 'LONG_TERM_LIABILITY', 'CAPITAL', 'RETAINED_EARNINGS_CAT', 'OPERATING_REVENUE', 'OTHER_REVENUE', 'COST_OF_GOODS_SOLD', 'OPERATING_EXPENSE', 'OTHER_EXPENSE');

-- CreateEnum
CREATE TYPE "finance"."SubledgerType" AS ENUM ('NONE', 'ACCOUNTS_RECEIVABLE', 'ACCOUNTS_PAYABLE', 'INVENTORY', 'FIXED_ASSETS', 'PAYROLL', 'BANK');

-- CreateEnum
CREATE TYPE "finance"."SystemAccountType" AS ENUM ('RETAINED_EARNINGS', 'OPENING_BALANCE_CONTROL', 'SUSPENSE', 'ROUNDING_DIFFERENCE', 'INTERCOMPANY_CLEARING', 'PAYROLL_CLEARING', 'PAYMENT_CLEARING', 'BANK_RECONCILIATION', 'FOREIGN_EXCHANGE_GAIN', 'FOREIGN_EXCHANGE_LOSS', 'UNREALIZED_FX_GAIN', 'UNREALIZED_FX_LOSS', 'CONSOLIDATION_ADJUSTMENT', 'ELIMINATION_ACCOUNT');

-- CreateEnum
CREATE TYPE "finance"."PeriodType" AS ENUM ('MONTH', 'QUARTER', 'HALF_YEAR', 'YEAR', 'CUSTOM');

-- CreateEnum
CREATE TYPE "finance"."PeriodStatus" AS ENUM ('FUTURE', 'OPEN', 'CLOSED', 'LOCKED');

-- CreateEnum
CREATE TYPE "finance"."JournalEntryStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'POSTED', 'REVERSED', 'VOIDED');

-- CreateEnum
CREATE TYPE "finance"."JournalEntryType" AS ENUM ('NORMAL', 'OPENING', 'CLOSING', 'CARRY_FORWARD', 'BROUGHT_FORWARD', 'YEAR_END_CLOSING', 'ADJUSTMENT', 'REVERSAL', 'CONSOLIDATION', 'ELIMINATION');

-- CreateEnum
CREATE TYPE "finance"."BalanceType" AS ENUM ('NORMAL', 'OPENING', 'CLOSING', 'ADJUSTMENT', 'REVERSAL');

-- CreateEnum
CREATE TYPE "finance"."SourceModule" AS ENUM ('MANUAL', 'INVOICE', 'PAYMENT', 'EXPENSE', 'PAYROLL', 'ASSET', 'INVENTORY', 'BANK', 'ADJUSTMENT', 'CONSOLIDATION', 'INTERCOMPANY', 'REVERSAL', 'YEAR_END', 'OPENING_BALANCE');

-- CreateEnum
CREATE TYPE "finance"."PartnerType" AS ENUM ('CUSTOMER', 'VENDOR', 'EMPLOYEE', 'BANK', 'INTERCOMPANY', 'OTHER');

-- CreateEnum
CREATE TYPE "finance"."ClearingDocumentType" AS ENUM ('PAYMENT', 'RECEIPT', 'CREDIT_NOTE', 'DEBIT_NOTE', 'ADJUSTMENT', 'WRITE_OFF', 'TRANSFER', 'MANUAL');

-- CreateEnum
CREATE TYPE "finance"."OpenItemStatus" AS ENUM ('OPEN', 'PARTIALLY_CLEARED', 'CLEARED', 'WRITTEN_OFF');

-- CreateEnum
CREATE TYPE "finance"."ReconciliationStatus" AS ENUM ('IN_PROGRESS', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "finance"."ReconciliationItemStatus" AS ENUM ('UNMATCHED', 'MATCHED', 'EXCLUDED', 'DISCREPANCY');

-- CreateEnum
CREATE TYPE "finance"."ConsolidationMethod" AS ENUM ('FULL', 'PROPORTIONAL', 'EQUITY');

-- CreateEnum
CREATE TYPE "finance"."ConsolidationStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "finance"."Industry" AS ENUM ('RETAIL', 'MANUFACTURING', 'SAAS', 'ECOMMERCE', 'CONSULTING', 'REAL_ESTATE', 'HOSPITALITY', 'HEALTHCARE', 'CONSTRUCTION', 'NON_PROFIT', 'EDUCATION', 'AGRICULTURE', 'GENERIC');

-- CreateEnum
CREATE TYPE "finance"."ReportType" AS ENUM ('BALANCE_SHEET', 'INCOME_STATEMENT', 'CASH_FLOW', 'TRIAL_BALANCE', 'GENERAL_LEDGER', 'SUBSIDIARY_LEDGER', 'ACCOUNT_BALANCE', 'CONSOLIDATED_BALANCE_SHEET', 'CONSOLIDATED_INCOME_STATEMENT', 'CONSOLIDATED_CASH_FLOW', 'INTERCOMPANY_REPORT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "finance"."ReportFormat" AS ENUM ('PDF', 'EXCEL', 'CSV', 'JSON');

-- CreateEnum
CREATE TYPE "finance"."AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'SUBMIT', 'APPROVE', 'REJECT', 'POST', 'REVERSE', 'VOID', 'CLOSE', 'LOCK', 'CONSOLIDATE', 'ELIMINATE');

-- CreateEnum
CREATE TYPE "AppScopeKind" AS ENUM ('AGENCY', 'SUBACCOUNT');

-- CreateEnum
CREATE TYPE "AppInstallationStatus" AS ENUM ('INSTALLED', 'AVAILABLE', 'EXPIRED', 'DISABLED');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "finance"."EInvoiceFormat" AS ENUM ('UBL_2_1', 'CII_D16B', 'PEPPOL_BIS_3', 'EN16931', 'MYINVOIS', 'ZATCA_FATOORA', 'SGP_INVOICENOW', 'FACTUR_X', 'XRECHNUNG', 'FatturaPA', 'GST_EINVOICE');

-- CreateEnum
CREATE TYPE "finance"."EInvoiceStatus" AS ENUM ('DRAFT', 'PENDING_VALIDATION', 'VALIDATED', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "finance"."EInvoiceDocType" AS ENUM ('INVOICE', 'CREDIT_NOTE', 'DEBIT_NOTE', 'CORRECTED', 'PREPAYMENT', 'SELF_BILLED');

-- CreateEnum
CREATE TYPE "finance"."DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'TIERED');

-- CreateEnum
CREATE TYPE "finance"."DiscountDuration" AS ENUM ('ONCE', 'REPEATING', 'FOREVER');

-- CreateEnum
CREATE TYPE "finance"."DiscountScope" AS ENUM ('INVOICE', 'LINE_ITEM', 'SUBSCRIPTION', 'SPECIFIC_PRODUCT');

-- CreateEnum
CREATE TYPE "finance"."IndustryClassificationScheme" AS ENUM ('MSIC_2008', 'MSIC_2020', 'ISIC_REV4', 'SIC_US', 'NAICS_2022', 'NACE_REV2', 'SSIC_2020', 'ANZSIC_2006', 'UNSPSC', 'HS_2022');

-- CreateEnum
CREATE TYPE "finance"."TaxExemptionVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT,
    "trialEligible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermsAgreement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agreedToThirdPartyServices" BOOLEAN NOT NULL DEFAULT false,
    "thirdPartyServicesAgreedAt" TIMESTAMP(3),
    "consentToCookies" BOOLEAN NOT NULL DEFAULT false,
    "cookiesConsentAt" TIMESTAMP(3),
    "agreedToPrivacy" BOOLEAN NOT NULL DEFAULT false,
    "privacyAgreedAt" TIMESTAMP(3),
    "agreedToServiceTerms" BOOLEAN NOT NULL DEFAULT false,
    "serviceTermsAgreedAt" TIMESTAMP(3),
    "agreedToMarketing" BOOLEAN NOT NULL DEFAULT false,
    "marketingAgreedAt" TIMESTAMP(3),
    "agreedToTermsConditions" BOOLEAN NOT NULL DEFAULT false,
    "termsConditionsAgreedAt" TIMESTAMP(3),
    "agreedToDataProcessing" BOOLEAN NOT NULL DEFAULT false,
    "dataProcessingAgreedAt" TIMESTAMP(3),
    "agreedToRetentionPolicy" BOOLEAN NOT NULL DEFAULT false,
    "andRetentionPolicyAgreedAt" TIMESTAMP(3),
    "agreedToRefundPolicy" BOOLEAN NOT NULL DEFAULT false,
    "refundPolicyAgreedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TermsAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Authenticator" (
    "credentialID" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "credentialPublicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "credentialDeviceType" TEXT NOT NULL,
    "credentialBackedUp" BOOLEAN NOT NULL,
    "transports" TEXT,

    CONSTRAINT "Authenticator_pkey" PRIMARY KEY ("userId","credentialID")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "activeAgencyId" TEXT,
    "activeSubAccountId" TEXT,
    "deviceName" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "kind" "ApiKeyKind" NOT NULL DEFAULT 'USER',
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "agencyId" TEXT,
    "subAccountId" TEXT,
    "permissionKeys" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "allowedSubAccountIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "TaxIdentity" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "subAccountId" TEXT,
    "entityType" "Entity",
    "entityStructure" TEXT DEFAULT '',
    "legalName" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "state" TEXT,
    "idType" TEXT,
    "idNumber" TEXT,
    "tinType" TEXT,
    "tinNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxObligation" (
    "id" TEXT NOT NULL,
    "taxIdentityId" TEXT NOT NULL,
    "taxCategory" TEXT NOT NULL DEFAULT '',
    "taxCode" TEXT DEFAULT '',
    "taxRegistrationNo" TEXT NOT NULL,
    "taxExmptionNo" TEXT,
    "taxRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "jurisdiction" TEXT DEFAULT '',
    "taxAuthority" TEXT DEFAULT '',
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "frequency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxObligation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agency" (
    "id" TEXT NOT NULL,
    "connectAccountId" TEXT DEFAULT '',
    "customerId" TEXT NOT NULL DEFAULT '',
    "taxIdentityId" TEXT,
    "name" TEXT NOT NULL,
    "agencyLogo" TEXT NOT NULL DEFAULT '',
    "companyEmail" TEXT NOT NULL,
    "companyPhone" TEXT NOT NULL,
    "whiteLabel" BOOLEAN NOT NULL DEFAULT true,
    "line1" TEXT NOT NULL,
    "line2" TEXT DEFAULT '',
    "city" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "goal" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubAccount" (
    "id" TEXT NOT NULL,
    "connectAccountId" TEXT DEFAULT '',
    "taxIdentityId" TEXT,
    "name" TEXT NOT NULL,
    "subAccountLogo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyEmail" TEXT NOT NULL,
    "companyPhone" TEXT NOT NULL,
    "goal" INTEGER NOT NULL DEFAULT 5,
    "line1" TEXT NOT NULL,
    "line2" TEXT DEFAULT '',
    "city" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,

    CONSTRAINT "SubAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subAccountId" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pipeline" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subAccountId" TEXT NOT NULL,

    CONSTRAINT "Pipeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lane" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Lane_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "laneId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "value" DECIMAL(65,30),
    "description" TEXT,
    "customerId" TEXT,
    "assignedUserId" TEXT,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trigger" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "TriggerTypes" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subAccountId" TEXT NOT NULL,

    CONSTRAINT "Trigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Automation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "triggerId" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "subAccountId" TEXT NOT NULL,

    CONSTRAINT "Automation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationInstance" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "automationId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AutomationInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Action" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ActionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "automationId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "laneId" TEXT NOT NULL DEFAULT '0',

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subAccountId" TEXT NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "type" TEXT,
    "name" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "subAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Funnel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "subDomainName" TEXT,
    "favicon" TEXT,
    "subAccountId" TEXT NOT NULL,
    "liveProducts" TEXT DEFAULT '[]',

    CONSTRAINT "Funnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassName" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "funnelId" TEXT NOT NULL,
    "customData" TEXT,

    CONSTRAINT "ClassName_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FunnelPage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pathName" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "visits" INTEGER NOT NULL DEFAULT 0,
    "content" TEXT,
    "order" INTEGER NOT NULL,
    "previewImage" TEXT,
    "funnelId" TEXT NOT NULL,

    CONSTRAINT "FunnelPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencySidebarOption" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Menu',
    "link" TEXT NOT NULL DEFAULT '#',
    "icon" "Icon" NOT NULL DEFAULT 'info',
    "agencyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencySidebarOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubAccountSidebarOption" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Menu',
    "link" TEXT NOT NULL DEFAULT '#',
    "icon" "Icon" NOT NULL DEFAULT 'info',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "subAccountId" TEXT,

    CONSTRAINT "SubAccountSidebarOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SidebarOption" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Menu',
    "link" TEXT NOT NULL DEFAULT '#',
    "icon" "Icon" NOT NULL DEFAULT 'info',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "module" TEXT,
    "subModule" TEXT,
    "agency" BOOLEAN NOT NULL DEFAULT false,
    "subaccount" BOOLEAN NOT NULL DEFAULT false,
    "user" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SidebarOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SidebarOptionLink" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Menu',
    "link" TEXT NOT NULL DEFAULT '#',
    "icon" "Icon",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "feature" TEXT,
    "agency" BOOLEAN NOT NULL DEFAULT false,
    "subaccount" BOOLEAN NOT NULL DEFAULT false,
    "user" BOOLEAN NOT NULL DEFAULT false,
    "sidebarOptionId" TEXT NOT NULL,

    CONSTRAINT "SidebarOptionLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "role" TEXT NOT NULL DEFAULT 'SUBACCOUNT_USER',

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "notification" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "subAccountId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "plan" "Plan",
    "price" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "priceId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "currentPeriodEndDate" TIMESTAMP(3) NOT NULL,
    "subscritiptionId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "trialEndedAt" TIMESTAMP(3),
    "agencyId" TEXT,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddOns" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "priceId" TEXT NOT NULL,
    "agencyId" TEXT,

    CONSTRAINT "AddOns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "agencyId" TEXT,
    "subAccountId" TEXT,
    "scope" "RoleScope" NOT NULL DEFAULT 'AGENCY',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubAccountMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subAccountId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubAccountMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntitlementFeature" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "valueType" "FeatureValueType" NOT NULL,
    "unit" TEXT,
    "metering" "MeteringType" NOT NULL DEFAULT 'NONE',
    "aggregation" "MeterAggregation" NOT NULL DEFAULT 'COUNT',
    "scope" "MeteringScope" NOT NULL DEFAULT 'AGENCY',
    "period" "UsagePeriod",
    "isToggleable" BOOLEAN NOT NULL DEFAULT false,
    "defaultEnabled" BOOLEAN NOT NULL DEFAULT true,
    "requiresRestart" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "displayName" TEXT,
    "icon" TEXT,
    "helpText" TEXT,
    "creditEnabled" BOOLEAN NOT NULL DEFAULT false,
    "creditUnit" TEXT,
    "creditExpires" BOOLEAN NOT NULL DEFAULT false,
    "creditPriority" INTEGER NOT NULL DEFAULT 100,
    "stripeMeterId" TEXT,
    "stripeMeterEventName" TEXT,
    "stripeUsagePriceId" TEXT,
    "stripeTopUpPriceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntitlementFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntitlementOverride" (
    "id" TEXT NOT NULL,
    "scope" "MeteringScope" NOT NULL DEFAULT 'AGENCY',
    "agencyId" TEXT NOT NULL,
    "subAccountId" TEXT,
    "featureKey" TEXT NOT NULL,
    "isEnabled" BOOLEAN,
    "isUnlimited" BOOLEAN,
    "maxDeltaInt" INTEGER,
    "maxDeltaDec" DECIMAL(18,6),
    "maxOverrideInt" INTEGER,
    "maxOverrideDec" DECIMAL(18,6),
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntitlementOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanFeature" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isUnlimited" BOOLEAN NOT NULL DEFAULT false,
    "includedInt" INTEGER,
    "maxInt" INTEGER,
    "includedDec" DECIMAL(18,6),
    "maxDec" DECIMAL(18,6),
    "enforcement" "LimitEnforcement" NOT NULL DEFAULT 'HARD',
    "overageMode" "OverageMode" NOT NULL DEFAULT 'NONE',
    "overageFee" DECIMAL(10,2),
    "stripeOveragePriceId" TEXT,
    "recurringCreditGrantInt" INTEGER,
    "recurringCreditGrantDec" DECIMAL(18,6),
    "rolloverCredits" BOOLEAN NOT NULL DEFAULT false,
    "topUpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "topUpPriceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeaturePreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "scope" "MeteringScope" NOT NULL DEFAULT 'AGENCY',
    "agencyId" TEXT,
    "subAccountId" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeaturePreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageTracking" (
    "id" TEXT NOT NULL,
    "scope" "MeteringScope" NOT NULL DEFAULT 'AGENCY',
    "agencyId" TEXT NOT NULL,
    "subAccountId" TEXT,
    "featureKey" TEXT NOT NULL,
    "currentUsage" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "period" "UsagePeriod" NOT NULL DEFAULT 'MONTHLY',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "lastEventAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageTracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageEvent" (
    "id" TEXT NOT NULL,
    "scope" "MeteringScope" NOT NULL DEFAULT 'AGENCY',
    "agencyId" TEXT NOT NULL,
    "subAccountId" TEXT,
    "featureKey" TEXT NOT NULL,
    "quantity" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "actionKey" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "stripeMeterEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureCreditBalance" (
    "id" TEXT NOT NULL,
    "scope" "MeteringScope" NOT NULL DEFAULT 'AGENCY',
    "agencyId" TEXT NOT NULL,
    "subAccountId" TEXT,
    "featureKey" TEXT NOT NULL,
    "balance" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureCreditBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureCreditLedger" (
    "id" TEXT NOT NULL,
    "scope" "MeteringScope" NOT NULL DEFAULT 'AGENCY',
    "agencyId" TEXT NOT NULL,
    "subAccountId" TEXT,
    "featureKey" TEXT NOT NULL,
    "type" "CreditLedgerType" NOT NULL,
    "delta" DECIMAL(18,6) NOT NULL,
    "reason" TEXT,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "stripePaymentIntentId" TEXT,
    "stripeInvoiceId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureCreditLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Passkey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL DEFAULT 'Passkey',
    "deviceName" TEXT,
    "authenticatorType" TEXT,
    "backupEligible" BOOLEAN NOT NULL DEFAULT false,
    "backupState" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "Passkey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MFAChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "codeType" "MFAMethodType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "sessionToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MFAChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MFAMethod" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "MFAMethodType" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "secret" TEXT,
    "phoneNumber" TEXT,
    "backupCodes" TEXT,
    "backupCodesUsed" TEXT,
    "trustedDevices" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MFAMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SSOConnection" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "provider" "SSOProvider" NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "authorizationUrl" TEXT,
    "tokenUrl" TEXT,
    "userinfoUrl" TEXT,
    "jwksUrl" TEXT,
    "entityId" TEXT,
    "acsUrl" TEXT,
    "ssoUrl" TEXT,
    "sloUrl" TEXT,
    "x509Certificate" TEXT,
    "allowedDomains" TEXT NOT NULL,
    "autoProvisionUsers" BOOLEAN NOT NULL DEFAULT true,
    "autoProvisionRole" TEXT,
    "requireSSO" BOOLEAN NOT NULL DEFAULT false,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "testedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SSOConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SSOUserMapping" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ssoConnectionId" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "providerEmail" TEXT NOT NULL,
    "providerName" TEXT,
    "providerPicture" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "syncStatus" "SyncStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SSOUserMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SSOAuditLog" (
    "id" TEXT NOT NULL,
    "ssoConnectionId" TEXT NOT NULL,
    "eventType" "SSOEventType" NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SSOAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."GLConfiguration" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL DEFAULT 'USD',
    "fiscalYearEnd" TEXT NOT NULL DEFAULT '12-31',
    "fiscalYearStart" TEXT NOT NULL DEFAULT '01-01',
    "useControlAccounts" BOOLEAN NOT NULL DEFAULT true,
    "requireApproval" BOOLEAN NOT NULL DEFAULT true,
    "approvalThreshold" DECIMAL(18,6),
    "autoPostingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "allowFuturePeriodPost" BOOLEAN NOT NULL DEFAULT false,
    "allowClosedPeriodPost" BOOLEAN NOT NULL DEFAULT false,
    "consolidationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "consolidationMethod" "finance"."ConsolidationMethod" NOT NULL DEFAULT 'FULL',
    "eliminateIntercompany" BOOLEAN NOT NULL DEFAULT true,
    "autoCreatePeriods" BOOLEAN NOT NULL DEFAULT true,
    "periodLockDays" INTEGER NOT NULL DEFAULT 5,
    "accountCodeFormat" TEXT NOT NULL DEFAULT '####-####',
    "accountCodeLength" INTEGER NOT NULL DEFAULT 8,
    "accountCodeSeparator" TEXT NOT NULL DEFAULT '-',
    "journalEntryPrefix" TEXT,
    "reversalEntryPrefix" TEXT,
    "adjustingEntryPrefix" TEXT,
    "reconciliationPrefix" TEXT,
    "consolidationPrefix" TEXT,
    "revaluationPrefix" TEXT,
    "closingEntryPrefix" TEXT,
    "docNumAssetStart" INTEGER NOT NULL DEFAULT 100000000,
    "docNumLiabilityStart" INTEGER NOT NULL DEFAULT 200000000,
    "docNumEquityStart" INTEGER NOT NULL DEFAULT 300000000,
    "docNumRevenueStart" INTEGER NOT NULL DEFAULT 400000000,
    "docNumExpenseStart" INTEGER NOT NULL DEFAULT 500000000,
    "docNumClearingStart" INTEGER NOT NULL DEFAULT 10000000,
    "invoiceFormat" TEXT,
    "paymentFormat" TEXT,
    "creditNoteFormat" TEXT,
    "debitNoteFormat" TEXT,
    "receiptFormat" TEXT,
    "documentNumberResetRule" TEXT NOT NULL DEFAULT 'YEARLY',
    "erpIntegrationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "erpSystemType" TEXT,
    "erpApiUrl" TEXT,
    "erpApiKey" TEXT,
    "retainAuditDays" INTEGER NOT NULL DEFAULT 2555,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "GLConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."GLConfigurationSubAccount" (
    "id" TEXT NOT NULL,
    "subAccountId" TEXT NOT NULL,
    "agencyConfigId" TEXT,
    "isIndependent" BOOLEAN NOT NULL DEFAULT false,
    "baseCurrency" TEXT,
    "fiscalYearEnd" TEXT,
    "fiscalYearStart" TEXT,
    "useControlAccounts" BOOLEAN,
    "requireApproval" BOOLEAN,
    "approvalThreshold" DECIMAL(18,6),
    "autoPostingEnabled" BOOLEAN,
    "allowFuturePeriodPost" BOOLEAN,
    "allowClosedPeriodPost" BOOLEAN,
    "autoCreatePeriods" BOOLEAN,
    "periodLockDays" INTEGER,
    "accountCodeFormat" TEXT,
    "accountCodeLength" INTEGER,
    "accountCodeSeparator" TEXT,
    "journalEntryPrefix" TEXT,
    "reversalEntryPrefix" TEXT,
    "adjustingEntryPrefix" TEXT,
    "reconciliationPrefix" TEXT,
    "consolidationPrefix" TEXT,
    "revaluationPrefix" TEXT,
    "closingEntryPrefix" TEXT,
    "invoiceFormat" TEXT,
    "paymentFormat" TEXT,
    "creditNoteFormat" TEXT,
    "debitNoteFormat" TEXT,
    "receiptFormat" TEXT,
    "consolidationAccountMapping" JSONB,
    "retainAuditDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "GLConfigurationSubAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."ChartOfAccount" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "subAccountId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentAccountId" TEXT,
    "path" TEXT NOT NULL DEFAULT '/',
    "level" INTEGER NOT NULL DEFAULT 0,
    "accountType" "finance"."AccountType" NOT NULL,
    "category" "finance"."AccountCategory",
    "subcategory" TEXT,
    "isControlAccount" BOOLEAN NOT NULL DEFAULT false,
    "subledgerType" "finance"."SubledgerType" NOT NULL DEFAULT 'NONE',
    "controlAccountId" TEXT,
    "isSystemAccount" BOOLEAN NOT NULL DEFAULT false,
    "isSystemManaged" BOOLEAN NOT NULL DEFAULT false,
    "systemAccountType" "finance"."SystemAccountType",
    "isClearingAccount" BOOLEAN NOT NULL DEFAULT false,
    "isSuspenseAccount" BOOLEAN NOT NULL DEFAULT false,
    "isRetainedEarnings" BOOLEAN NOT NULL DEFAULT false,
    "isOpeningBalControl" BOOLEAN NOT NULL DEFAULT false,
    "allowManualPosting" BOOLEAN NOT NULL DEFAULT true,
    "requireApproval" BOOLEAN NOT NULL DEFAULT false,
    "isPostingAccount" BOOLEAN NOT NULL DEFAULT true,
    "isConsolidationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "consolidationAccountCode" TEXT,
    "currencyCode" TEXT,
    "isMultiCurrency" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,
    "normalBalance" TEXT NOT NULL DEFAULT 'DEBIT',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "ChartOfAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."AgencyGroupCOA" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "accountType" "finance"."AccountType" NOT NULL,
    "category" "finance"."AccountCategory",
    "parentId" TEXT,
    "path" TEXT NOT NULL DEFAULT '/',
    "level" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "AgencyGroupCOA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."ConsolidationMapping" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "subAccountId" TEXT NOT NULL,
    "subAccountCOACode" TEXT NOT NULL,
    "groupCOAId" TEXT NOT NULL,
    "mappingPercentage" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "isElimination" BOOLEAN NOT NULL DEFAULT false,
    "eliminationPairId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "ConsolidationMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."FinancialPeriod" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "subAccountId" TEXT,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "periodType" "finance"."PeriodType" NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "fiscalPeriod" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "finance"."PeriodStatus" NOT NULL DEFAULT 'FUTURE',
    "openedAt" TIMESTAMP(3),
    "openedBy" TEXT,
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "openingBalances" JSONB,
    "closingBalances" JSONB,
    "isYearEnd" BOOLEAN NOT NULL DEFAULT false,
    "yearEndProcessedAt" TIMESTAMP(3),
    "yearEndProcessedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "FinancialPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."JournalEntry" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "subAccountId" TEXT,
    "entryNumber" TEXT NOT NULL,
    "reference" TEXT,
    "periodId" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "entryType" "finance"."JournalEntryType" NOT NULL DEFAULT 'NORMAL',
    "sourceModule" "finance"."SourceModule" NOT NULL DEFAULT 'MANUAL',
    "sourceId" TEXT,
    "sourceReference" TEXT,
    "postingRuleId" TEXT,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "exchangeRate" DECIMAL(12,6) NOT NULL DEFAULT 1,
    "totalDebit" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "totalCredit" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "totalDebitBase" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "totalCreditBase" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "status" "finance"."JournalEntryStatus" NOT NULL DEFAULT 'DRAFT',
    "isCarryForward" BOOLEAN NOT NULL DEFAULT false,
    "isBroughtForward" BOOLEAN NOT NULL DEFAULT false,
    "carryForwardFromId" TEXT,
    "isReversal" BOOLEAN NOT NULL DEFAULT false,
    "reversalOfId" TEXT,
    "submittedAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectionReason" TEXT,
    "postedAt" TIMESTAMP(3),
    "postedBy" TEXT,
    "reversedAt" TIMESTAMP(3),
    "reversedByUser" TEXT,
    "reversalReason" TEXT,
    "voidedAt" TIMESTAMP(3),
    "voidedBy" TEXT,
    "voidReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."JournalEntryLine" (
    "id" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "accountId" TEXT NOT NULL,
    "description" TEXT,
    "debitAmount" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "creditAmount" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "debitAmountBase" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "creditAmountBase" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "exchangeRate" DECIMAL(12,6),
    "subledgerType" "finance"."SubledgerType" NOT NULL DEFAULT 'NONE',
    "subledgerReference" TEXT,
    "taxCode" TEXT,
    "taxAmount" DECIMAL(18,6),
    "dimension1" TEXT,
    "dimension2" TEXT,
    "dimension3" TEXT,
    "dimension4" TEXT,
    "isIntercompany" BOOLEAN NOT NULL DEFAULT false,
    "intercompanySubAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JournalEntryLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."AccountBalance" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "subAccountId" TEXT,
    "accountId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'USD',
    "openingBalance" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "debitMovement" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "creditMovement" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "closingBalance" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "openingBalanceBase" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "debitMovementBase" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "creditMovementBase" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "closingBalanceBase" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "balanceType" "finance"."BalanceType" NOT NULL DEFAULT 'NORMAL',
    "transactionCount" INTEGER NOT NULL DEFAULT 0,
    "lastRecalculatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."Currency" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "decimalPlaces" INTEGER NOT NULL DEFAULT 2,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBaseCurrency" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."ExchangeRate" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "fromCurrencyCode" TEXT NOT NULL,
    "toCurrencyCode" TEXT NOT NULL,
    "rate" DECIMAL(12,6) NOT NULL,
    "inverseRate" DECIMAL(12,6) NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "rateType" TEXT NOT NULL DEFAULT 'SPOT',
    "source" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."CurrencyRevaluation" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "subAccountId" TEXT,
    "periodId" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "revaluationDate" TIMESTAMP(3) NOT NULL,
    "exchangeRate" DECIMAL(12,6) NOT NULL,
    "previousRate" DECIMAL(12,6) NOT NULL,
    "unrealizedGain" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "unrealizedLoss" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "netGainLoss" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "journalEntryId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "postedAt" TIMESTAMP(3),
    "postedBy" TEXT,

    CONSTRAINT "CurrencyRevaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."PostingRule" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "subAccountId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sourceModule" "finance"."SourceModule" NOT NULL,
    "debitAccountId" TEXT NOT NULL,
    "creditAccountId" TEXT NOT NULL,
    "amountType" TEXT NOT NULL DEFAULT 'FULL',
    "percentage" DECIMAL(5,4),
    "fixedAmount" DECIMAL(18,6),
    "conditions" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "autoPost" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "activatedAt" TIMESTAMP(3),
    "activatedBy" TEXT,
    "deactivatedAt" TIMESTAMP(3),
    "deactivatedBy" TEXT,

    CONSTRAINT "PostingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."PostingTemplate" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "template" JSONB NOT NULL,
    "defaultDescription" TEXT,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."Reconciliation" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "subAccountId" TEXT,
    "accountId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "reconciliationNumber" TEXT NOT NULL,
    "description" TEXT,
    "bookBalance" DECIMAL(18,6) NOT NULL,
    "statementBalance" DECIMAL(18,6) NOT NULL,
    "statementDate" TIMESTAMP(3) NOT NULL,
    "adjustedBookBalance" DECIMAL(18,6) NOT NULL,
    "difference" DECIMAL(18,6) NOT NULL,
    "status" "finance"."ReconciliationStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "submittedAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectionReason" TEXT,
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "Reconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."ReconciliationItem" (
    "id" TEXT NOT NULL,
    "reconciliationId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "reference" TEXT,
    "description" TEXT,
    "amount" DECIMAL(18,6) NOT NULL,
    "status" "finance"."ReconciliationItemStatus" NOT NULL DEFAULT 'UNMATCHED',
    "matchedItemId" TEXT,
    "matchedAt" TIMESTAMP(3),
    "matchedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReconciliationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."ReconciliationRule" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ruleDefinition" JSONB NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReconciliationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."IntercompanyReconciliation" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "subAccountId1" TEXT NOT NULL,
    "subAccountId2" TEXT NOT NULL,
    "accountCode1" TEXT NOT NULL,
    "accountCode2" TEXT NOT NULL,
    "balance1" DECIMAL(18,6) NOT NULL,
    "balance2" DECIMAL(18,6) NOT NULL,
    "difference" DECIMAL(18,6) NOT NULL,
    "status" "finance"."ReconciliationStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntercompanyReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."ConsolidationSnapshot" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "snapshotNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subAccountIds" TEXT[],
    "consolidationMethod" "finance"."ConsolidationMethod" NOT NULL,
    "consolidatedBalances" JSONB NOT NULL,
    "balanceSheet" JSONB NOT NULL,
    "incomeStatement" JSONB NOT NULL,
    "cashFlowStatement" JSONB NOT NULL,
    "eliminationEntries" JSONB NOT NULL,
    "adjustmentEntries" JSONB NOT NULL,
    "totalEliminations" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "totalAdjustments" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "ownershipPercentages" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "previousVersionId" TEXT,
    "status" "finance"."ConsolidationStatus" NOT NULL DEFAULT 'DRAFT',
    "validationResults" JSONB,
    "isValid" BOOLEAN NOT NULL DEFAULT false,
    "consolidatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consolidatedBy" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsolidationSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."ConsolidationWorksheetLine" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "groupCOAId" TEXT NOT NULL,
    "accountCode" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "subAccountBalances" JSONB NOT NULL,
    "totalBeforeAdj" DECIMAL(18,6) NOT NULL,
    "eliminations" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "adjustments" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "consolidatedBalance" DECIMAL(18,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsolidationWorksheetLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."ConsolidatedBalance" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "groupCOAId" TEXT NOT NULL,
    "balance" DECIMAL(18,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsolidatedBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."ConsolidationAdjustment" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "adjustmentNumber" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "debitAccountCode" TEXT NOT NULL,
    "creditAccountCode" TEXT NOT NULL,
    "amount" DECIMAL(18,6) NOT NULL,
    "adjustmentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsolidationAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."IntercompanyElimination" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "eliminationNumber" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "subAccountId1" TEXT NOT NULL,
    "subAccountId2" TEXT NOT NULL,
    "accountCode1" TEXT NOT NULL,
    "accountCode2" TEXT NOT NULL,
    "amount" DECIMAL(18,6) NOT NULL,
    "eliminationType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "isAutoGenerated" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntercompanyElimination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."SubAccountOwnership" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "subAccountId" TEXT NOT NULL,
    "ownershipPercentage" DECIMAL(5,2) NOT NULL,
    "consolidationMethod" "finance"."ConsolidationMethod" NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "minorityInterestAccountCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubAccountOwnership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."SavedReport" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "subAccountId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "reportType" "finance"."ReportType" NOT NULL,
    "parameters" JSONB NOT NULL,
    "isScheduled" BOOLEAN NOT NULL DEFAULT false,
    "schedule" TEXT,
    "lastGeneratedAt" TIMESTAMP(3),
    "lastGeneratedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."ReportTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "reportType" "finance"."ReportType" NOT NULL,
    "templateDefinition" JSONB NOT NULL,
    "defaultParameters" JSONB,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."COATemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" "finance"."Industry" NOT NULL,
    "description" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'US',
    "accountingStandard" TEXT NOT NULL DEFAULT 'GAAP',
    "template" JSONB NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "COATemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."GLAuditTrail" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "subAccountId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "finance"."AuditAction" NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT,
    "userName" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previousValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "reason" TEXT,

    CONSTRAINT "GLAuditTrail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."SubLedger" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "subAccountId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "finance"."SubledgerType" NOT NULL,
    "controlAccountId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "SubLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."Vendor" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "subAccountId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" JSONB,
    "subLedgerId" TEXT,
    "paymentTermDays" INTEGER NOT NULL DEFAULT 30,
    "currency" TEXT NOT NULL DEFAULT 'MYR',
    "creditLimit" DECIMAL(18,6),
    "bankName" TEXT,
    "bankAccount" TEXT,
    "bankSwiftCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."Customer" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "subAccountId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" JSONB,
    "subLedgerId" TEXT,
    "paymentTermDays" INTEGER NOT NULL DEFAULT 30,
    "currency" TEXT NOT NULL DEFAULT 'MYR',
    "creditLimit" DECIMAL(18,6),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."GLConfigurationLock" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "subAccountId" TEXT,
    "settingKey" TEXT NOT NULL,
    "lockedValue" TEXT NOT NULL,
    "lockedReason" TEXT NOT NULL,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedBy" TEXT NOT NULL,
    "unlockConditions" JSONB,
    "isPermanent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GLConfigurationLock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."OpenItem" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "subAccountId" TEXT,
    "accountId" TEXT NOT NULL,
    "journalEntryId" TEXT,
    "journalLineId" TEXT,
    "sourceModule" "finance"."SourceModule" NOT NULL,
    "sourceId" TEXT,
    "sourceReference" TEXT,
    "reference" TEXT,
    "assignment" TEXT,
    "text" TEXT,
    "itemDate" TIMESTAMP(3) NOT NULL,
    "itemType" TEXT,
    "dueDate" TIMESTAMP(3),
    "localCurrencyCode" TEXT NOT NULL DEFAULT 'MYR',
    "localAmount" DECIMAL(18,6) NOT NULL,
    "localRemainingAmount" DECIMAL(18,6) NOT NULL,
    "documentCurrencyCode" TEXT NOT NULL DEFAULT 'MYR',
    "documentAmount" DECIMAL(18,6) NOT NULL,
    "documentRemainingAmount" DECIMAL(18,6) NOT NULL,
    "documentNumber" TEXT,
    "documentDate" TIMESTAMP(3),
    "exchangeRate" DECIMAL(12,6) NOT NULL DEFAULT 1,
    "partnerType" "finance"."PartnerType",
    "customerId" TEXT,
    "vendorId" TEXT,
    "status" "finance"."OpenItemStatus" NOT NULL DEFAULT 'OPEN',
    "clearingDate" TIMESTAMP(3),
    "clearingDocumentId" TEXT,
    "clearingReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postedAt" TIMESTAMP(3),
    "clearedAt" TIMESTAMP(3),
    "clearedBy" TEXT,

    CONSTRAINT "OpenItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."OpenItemAllocation" (
    "id" TEXT NOT NULL,
    "openItemId" TEXT NOT NULL,
    "clearedById" TEXT NOT NULL,
    "clearedByType" "finance"."ClearingDocumentType" NOT NULL,
    "clearedByRef" TEXT,
    "localAmount" DECIMAL(18,6) NOT NULL,
    "documentAmount" DECIMAL(18,6) NOT NULL,
    "exchangeDifference" DECIMAL(18,6) NOT NULL DEFAULT 0,
    "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "allocatedBy" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "OpenItemAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationApiKey" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "agencyId" TEXT,
    "subAccountId" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "IntegrationApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationConnection" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DISCONNECTED',
    "agencyId" TEXT,
    "subAccountId" TEXT,
    "credentials" JSONB,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "IntegrationConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationWebhookSubscription" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secretHash" TEXT,
    "secretEnc" TEXT,
    "events" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationWebhookSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationProviderEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "externalEventId" TEXT,
    "headers" JSONB,
    "payload" JSONB,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "IntegrationProviderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationWebhookDelivery" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "providerEventId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationWebhookDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationWebhookDeliveryAttempt" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "statusCode" INTEGER,
    "responseBody" TEXT,
    "error" TEXT,
    "durationMs" INTEGER,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntegrationWebhookDeliveryAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppInstallation" (
    "id" TEXT NOT NULL,
    "appKey" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "subAccountId" TEXT,
    "status" "AppInstallationStatus" NOT NULL DEFAULT 'INSTALLED',
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uninstalledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppInstallation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scope" "MeteringScope" NOT NULL,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'OPEN',
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "diagnostics" JSONB,
    "agencyId" TEXT NOT NULL,
    "subAccountId" TEXT,
    "createdByUserId" TEXT,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."IndustryClassification" (
    "id" TEXT NOT NULL,
    "taxIdentityId" TEXT NOT NULL,
    "scheme" "finance"."IndustryClassificationScheme" NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT,
    "parentCode" TEXT,
    "level" INTEGER,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IndustryClassification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."TaxExemptionCertificate" (
    "id" TEXT NOT NULL,
    "taxIdentityId" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "exemptionType" TEXT NOT NULL,
    "issuingAuthority" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "coveredTaxTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "exemptionPercentage" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "documentUrl" TEXT,
    "documentHash" TEXT,
    "verificationStatus" "finance"."TaxExemptionVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxExemptionCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."EInvoiceSettings" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "subAccountId" TEXT,
    "defaultFormat" "finance"."EInvoiceFormat" NOT NULL DEFAULT 'UBL_2_1',
    "countryCode" TEXT NOT NULL,
    "authorityClientId" TEXT,
    "authorityClientSecret" TEXT,
    "authorityEndpoint" TEXT,
    "defaultRevenueAccountId" TEXT,
    "defaultReceivableAccountId" TEXT,
    "defaultTaxOutputAccountId" TEXT,
    "invoicePrefix" TEXT NOT NULL DEFAULT 'INV',
    "invoiceNextSeq" INTEGER NOT NULL DEFAULT 1,
    "creditNotePrefix" TEXT NOT NULL DEFAULT 'CN',
    "creditNoteNextSeq" INTEGER NOT NULL DEFAULT 1,
    "autoSubmit" BOOLEAN NOT NULL DEFAULT false,
    "autoSubmitDelay" INTEGER NOT NULL DEFAULT 0,
    "signInvoices" BOOLEAN NOT NULL DEFAULT false,
    "signingCertUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EInvoiceSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."EInvoice" (
    "id" TEXT NOT NULL,
    "settingsId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "documentType" "finance"."EInvoiceDocType" NOT NULL DEFAULT 'INVOICE',
    "format" "finance"."EInvoiceFormat" NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "documentCurrency" TEXT NOT NULL DEFAULT 'MYR',
    "taxCurrency" TEXT,
    "status" "finance"."EInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "buyerReference" TEXT,
    "orderReference" TEXT,
    "contractReference" TEXT,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "supplierTaxIdentityId" TEXT,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerTaxId" TEXT,
    "customerAddress" JSONB,
    "customerContact" JSONB,
    "lineExtensionAmount" DECIMAL(15,2) NOT NULL,
    "taxExclusiveAmount" DECIMAL(15,2) NOT NULL,
    "taxInclusiveAmount" DECIMAL(15,2) NOT NULL,
    "allowanceTotalAmount" DECIMAL(15,2),
    "chargeTotalAmount" DECIMAL(15,2),
    "prepaidAmount" DECIMAL(15,2),
    "payableRoundingAmount" DECIMAL(15,4),
    "payableAmount" DECIMAL(15,2) NOT NULL,
    "taxBreakdown" JSONB,
    "paymentMeansCode" TEXT,
    "paymentTermsNote" TEXT,
    "bankAccountId" TEXT,
    "bankAccountName" TEXT,
    "allowanceCharges" JSONB,
    "deliveryDate" TIMESTAMP(3),
    "deliveryAddress" JSONB,
    "notes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "authorityResponseId" TEXT,
    "validationId" TEXT,
    "qrCodeData" TEXT,
    "signedAt" TIMESTAMP(3),
    "signatureValue" TEXT,
    "certificateInfo" TEXT,
    "validationErrors" JSONB,
    "rawDocument" TEXT,
    "rawDocumentFormat" TEXT,
    "journalEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "EInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."EInvoiceLineItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unitCode" TEXT NOT NULL DEFAULT 'C62',
    "itemName" TEXT NOT NULL,
    "itemDescription" TEXT,
    "sellersItemId" TEXT,
    "standardItemId" TEXT,
    "standardItemScheme" TEXT,
    "classificationCode" TEXT,
    "classificationScheme" TEXT,
    "unitPrice" DECIMAL(15,4) NOT NULL,
    "priceBaseQuantity" DECIMAL(15,4) DEFAULT 1,
    "lineExtensionAmount" DECIMAL(15,2) NOT NULL,
    "taxCategoryCode" TEXT NOT NULL DEFAULT 'S',
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxScheme" TEXT NOT NULL DEFAULT 'SST',
    "taxAmount" DECIMAL(15,2) NOT NULL,
    "exemptionReasonCode" TEXT,
    "exemptionReason" TEXT,
    "allowanceCharges" JSONB,
    "orderLineReference" TEXT,
    "revenueAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EInvoiceLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."EInvoiceSubmission" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "format" "finance"."EInvoiceFormat" NOT NULL,
    "endpoint" TEXT NOT NULL,
    "requestPayload" TEXT,
    "responseStatus" INTEGER,
    "responsePayload" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "authorityId" TEXT,
    "validationId" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "willRetry" BOOLEAN NOT NULL DEFAULT false,
    "nextRetryAt" TIMESTAMP(3),

    CONSTRAINT "EInvoiceSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."Discount" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "finance"."DiscountType" NOT NULL,
    "percentOff" DECIMAL(5,2),
    "amountOff" DECIMAL(15,2),
    "currency" TEXT DEFAULT 'MYR',
    "scope" "finance"."DiscountScope" NOT NULL DEFAULT 'INVOICE',
    "duration" "finance"."DiscountDuration" NOT NULL DEFAULT 'ONCE',
    "durationInMonths" INTEGER,
    "maxRedemptions" INTEGER,
    "timesRedeemed" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "minimumAmount" DECIMAL(15,2),
    "applicablePlans" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "applicableProducts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "stripeCouponId" TEXT,
    "stripePromoCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."AppliedDiscount" (
    "id" TEXT NOT NULL,
    "discountId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "subscriptionId" TEXT,
    "originalAmount" DECIMAL(15,2) NOT NULL,
    "discountAmount" DECIMAL(15,2) NOT NULL,
    "finalAmount" DECIMAL(15,2) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedById" TEXT,

    CONSTRAINT "AppliedDiscount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TagToTicket" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TagToTicket_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_customerId_key" ON "User"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "TermsAgreement_userId_key" ON "TermsAgreement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Authenticator_credentialID_key" ON "Authenticator"("credentialID");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_activeAgencyId_idx" ON "Session"("activeAgencyId");

-- CreateIndex
CREATE INDEX "Session_activeSubAccountId_idx" ON "Session"("activeSubAccountId");

-- CreateIndex
CREATE INDEX "Session_sessionToken_idx" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_prefix_key" ON "ApiKey"("prefix");

-- CreateIndex
CREATE INDEX "ApiKey_ownerUserId_idx" ON "ApiKey"("ownerUserId");

-- CreateIndex
CREATE INDEX "ApiKey_agencyId_idx" ON "ApiKey"("agencyId");

-- CreateIndex
CREATE INDEX "ApiKey_subAccountId_idx" ON "ApiKey"("subAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "TaxIdentity_agencyId_key" ON "TaxIdentity"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxIdentity_subAccountId_key" ON "TaxIdentity"("subAccountId");

-- CreateIndex
CREATE INDEX "TaxIdentity_countryCode_idx" ON "TaxIdentity"("countryCode");

-- CreateIndex
CREATE INDEX "TaxIdentity_tinNumber_idx" ON "TaxIdentity"("tinNumber");

-- CreateIndex
CREATE INDEX "TaxObligation_taxIdentityId_idx" ON "TaxObligation"("taxIdentityId");

-- CreateIndex
CREATE INDEX "TaxObligation_isActive_idx" ON "TaxObligation"("isActive");

-- CreateIndex
CREATE INDEX "TaxObligation_effectiveFrom_effectiveTo_idx" ON "TaxObligation"("effectiveFrom", "effectiveTo");

-- CreateIndex
CREATE UNIQUE INDEX "TaxObligation_taxIdentityId_taxCategory_jurisdiction_key" ON "TaxObligation"("taxIdentityId", "taxCategory", "jurisdiction");

-- CreateIndex
CREATE UNIQUE INDEX "Agency_taxIdentityId_key" ON "Agency"("taxIdentityId");

-- CreateIndex
CREATE INDEX "Agency_taxIdentityId_idx" ON "Agency"("taxIdentityId");

-- CreateIndex
CREATE UNIQUE INDEX "SubAccount_taxIdentityId_key" ON "SubAccount"("taxIdentityId");

-- CreateIndex
CREATE INDEX "SubAccount_agencyId_idx" ON "SubAccount"("agencyId");

-- CreateIndex
CREATE INDEX "SubAccount_taxIdentityId_idx" ON "SubAccount"("taxIdentityId");

-- CreateIndex
CREATE INDEX "Tag_subAccountId_idx" ON "Tag"("subAccountId");

-- CreateIndex
CREATE INDEX "Pipeline_subAccountId_idx" ON "Pipeline"("subAccountId");

-- CreateIndex
CREATE INDEX "Lane_pipelineId_idx" ON "Lane"("pipelineId");

-- CreateIndex
CREATE INDEX "Ticket_laneId_idx" ON "Ticket"("laneId");

-- CreateIndex
CREATE INDEX "Ticket_customerId_idx" ON "Ticket"("customerId");

-- CreateIndex
CREATE INDEX "Ticket_assignedUserId_idx" ON "Ticket"("assignedUserId");

-- CreateIndex
CREATE INDEX "Trigger_subAccountId_idx" ON "Trigger"("subAccountId");

-- CreateIndex
CREATE INDEX "Automation_triggerId_idx" ON "Automation"("triggerId");

-- CreateIndex
CREATE INDEX "Automation_subAccountId_idx" ON "Automation"("subAccountId");

-- CreateIndex
CREATE INDEX "AutomationInstance_automationId_idx" ON "AutomationInstance"("automationId");

-- CreateIndex
CREATE INDEX "Action_automationId_idx" ON "Action"("automationId");

-- CreateIndex
CREATE INDEX "Contact_subAccountId_idx" ON "Contact"("subAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Media_link_key" ON "Media"("link");

-- CreateIndex
CREATE INDEX "Media_subAccountId_idx" ON "Media"("subAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Funnel_subDomainName_key" ON "Funnel"("subDomainName");

-- CreateIndex
CREATE INDEX "Funnel_subAccountId_idx" ON "Funnel"("subAccountId");

-- CreateIndex
CREATE INDEX "ClassName_funnelId_idx" ON "ClassName"("funnelId");

-- CreateIndex
CREATE INDEX "FunnelPage_funnelId_idx" ON "FunnelPage"("funnelId");

-- CreateIndex
CREATE INDEX "AgencySidebarOption_agencyId_idx" ON "AgencySidebarOption"("agencyId");

-- CreateIndex
CREATE INDEX "SubAccountSidebarOption_subAccountId_idx" ON "SubAccountSidebarOption"("subAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_email_key" ON "Invitation"("email");

-- CreateIndex
CREATE INDEX "Invitation_agencyId_idx" ON "Invitation"("agencyId");

-- CreateIndex
CREATE INDEX "Notification_agencyId_idx" ON "Notification"("agencyId");

-- CreateIndex
CREATE INDEX "Notification_subAccountId_idx" ON "Notification"("subAccountId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_subscritiptionId_key" ON "Subscription"("subscritiptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_agencyId_key" ON "Subscription"("agencyId");

-- CreateIndex
CREATE INDEX "Subscription_customerId_idx" ON "Subscription"("customerId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AddOns_priceId_key" ON "AddOns"("priceId");

-- CreateIndex
CREATE INDEX "AddOns_agencyId_idx" ON "AddOns"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE INDEX "Permission_category_idx" ON "Permission"("category");

-- CreateIndex
CREATE INDEX "Permission_isSystem_idx" ON "Permission"("isSystem");

-- CreateIndex
CREATE INDEX "RolePermission_roleId_idx" ON "RolePermission"("roleId");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "Role_agencyId_idx" ON "Role"("agencyId");

-- CreateIndex
CREATE INDEX "Role_subAccountId_idx" ON "Role"("subAccountId");

-- CreateIndex
CREATE INDEX "Role_scope_idx" ON "Role"("scope");

-- CreateIndex
CREATE INDEX "Role_isSystem_idx" ON "Role"("isSystem");

-- CreateIndex
CREATE UNIQUE INDEX "Role_agencyId_subAccountId_name_key" ON "Role"("agencyId", "subAccountId", "name");

-- CreateIndex
CREATE INDEX "AgencyMembership_userId_idx" ON "AgencyMembership"("userId");

-- CreateIndex
CREATE INDEX "AgencyMembership_agencyId_idx" ON "AgencyMembership"("agencyId");

-- CreateIndex
CREATE INDEX "AgencyMembership_roleId_idx" ON "AgencyMembership"("roleId");

-- CreateIndex
CREATE INDEX "AgencyMembership_isActive_idx" ON "AgencyMembership"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyMembership_userId_agencyId_key" ON "AgencyMembership"("userId", "agencyId");

-- CreateIndex
CREATE INDEX "SubAccountMembership_userId_idx" ON "SubAccountMembership"("userId");

-- CreateIndex
CREATE INDEX "SubAccountMembership_subAccountId_idx" ON "SubAccountMembership"("subAccountId");

-- CreateIndex
CREATE INDEX "SubAccountMembership_roleId_idx" ON "SubAccountMembership"("roleId");

-- CreateIndex
CREATE INDEX "SubAccountMembership_isActive_idx" ON "SubAccountMembership"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SubAccountMembership_userId_subAccountId_key" ON "SubAccountMembership"("userId", "subAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "EntitlementFeature_key_key" ON "EntitlementFeature"("key");

-- CreateIndex
CREATE INDEX "EntitlementFeature_category_idx" ON "EntitlementFeature"("category");

-- CreateIndex
CREATE INDEX "EntitlementFeature_valueType_idx" ON "EntitlementFeature"("valueType");

-- CreateIndex
CREATE INDEX "EntitlementFeature_metering_idx" ON "EntitlementFeature"("metering");

-- CreateIndex
CREATE INDEX "EntitlementFeature_scope_idx" ON "EntitlementFeature"("scope");

-- CreateIndex
CREATE INDEX "EntitlementOverride_agencyId_idx" ON "EntitlementOverride"("agencyId");

-- CreateIndex
CREATE INDEX "EntitlementOverride_subAccountId_idx" ON "EntitlementOverride"("subAccountId");

-- CreateIndex
CREATE INDEX "EntitlementOverride_featureKey_idx" ON "EntitlementOverride"("featureKey");

-- CreateIndex
CREATE INDEX "EntitlementOverride_scope_idx" ON "EntitlementOverride"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "EntitlementOverride_scope_agencyId_subAccountId_featureKey_key" ON "EntitlementOverride"("scope", "agencyId", "subAccountId", "featureKey");

-- CreateIndex
CREATE INDEX "PlanFeature_planId_idx" ON "PlanFeature"("planId");

-- CreateIndex
CREATE INDEX "PlanFeature_featureKey_idx" ON "PlanFeature"("featureKey");

-- CreateIndex
CREATE INDEX "PlanFeature_overageMode_idx" ON "PlanFeature"("overageMode");

-- CreateIndex
CREATE UNIQUE INDEX "PlanFeature_planId_featureKey_key" ON "PlanFeature"("planId", "featureKey");

-- CreateIndex
CREATE INDEX "FeaturePreference_userId_idx" ON "FeaturePreference"("userId");

-- CreateIndex
CREATE INDEX "FeaturePreference_featureKey_idx" ON "FeaturePreference"("featureKey");

-- CreateIndex
CREATE INDEX "FeaturePreference_agencyId_idx" ON "FeaturePreference"("agencyId");

-- CreateIndex
CREATE INDEX "FeaturePreference_subAccountId_idx" ON "FeaturePreference"("subAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "FeaturePreference_userId_scope_agencyId_subAccountId_featur_key" ON "FeaturePreference"("userId", "scope", "agencyId", "subAccountId", "featureKey");

-- CreateIndex
CREATE INDEX "UsageTracking_agencyId_idx" ON "UsageTracking"("agencyId");

-- CreateIndex
CREATE INDEX "UsageTracking_subAccountId_idx" ON "UsageTracking"("subAccountId");

-- CreateIndex
CREATE INDEX "UsageTracking_featureKey_idx" ON "UsageTracking"("featureKey");

-- CreateIndex
CREATE INDEX "UsageTracking_periodStart_periodEnd_idx" ON "UsageTracking"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "UsageTracking_scope_idx" ON "UsageTracking"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "UsageTracking_scope_agencyId_subAccountId_featureKey_period_key" ON "UsageTracking"("scope", "agencyId", "subAccountId", "featureKey", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "UsageEvent_idempotencyKey_key" ON "UsageEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "UsageEvent_agencyId_subAccountId_featureKey_createdAt_idx" ON "UsageEvent"("agencyId", "subAccountId", "featureKey", "createdAt");

-- CreateIndex
CREATE INDEX "UsageEvent_scope_idx" ON "UsageEvent"("scope");

-- CreateIndex
CREATE INDEX "FeatureCreditBalance_agencyId_idx" ON "FeatureCreditBalance"("agencyId");

-- CreateIndex
CREATE INDEX "FeatureCreditBalance_subAccountId_idx" ON "FeatureCreditBalance"("subAccountId");

-- CreateIndex
CREATE INDEX "FeatureCreditBalance_featureKey_idx" ON "FeatureCreditBalance"("featureKey");

-- CreateIndex
CREATE INDEX "FeatureCreditBalance_scope_idx" ON "FeatureCreditBalance"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureCreditBalance_scope_agencyId_subAccountId_featureKey_key" ON "FeatureCreditBalance"("scope", "agencyId", "subAccountId", "featureKey");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureCreditLedger_idempotencyKey_key" ON "FeatureCreditLedger"("idempotencyKey");

-- CreateIndex
CREATE INDEX "FeatureCreditLedger_agencyId_subAccountId_featureKey_create_idx" ON "FeatureCreditLedger"("agencyId", "subAccountId", "featureKey", "createdAt");

-- CreateIndex
CREATE INDEX "FeatureCreditLedger_scope_idx" ON "FeatureCreditLedger"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "Passkey_credentialId_key" ON "Passkey"("credentialId");

-- CreateIndex
CREATE INDEX "Passkey_userId_idx" ON "Passkey"("userId");

-- CreateIndex
CREATE INDEX "MFAChallenge_userId_expiresAt_idx" ON "MFAChallenge"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "MFAChallenge_code_idx" ON "MFAChallenge"("code");

-- CreateIndex
CREATE INDEX "MFAMethod_userId_idx" ON "MFAMethod"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MFAMethod_userId_type_key" ON "MFAMethod"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "SSOConnection_agencyId_key" ON "SSOConnection"("agencyId");

-- CreateIndex
CREATE INDEX "SSOConnection_provider_idx" ON "SSOConnection"("provider");

-- CreateIndex
CREATE INDEX "SSOUserMapping_userId_idx" ON "SSOUserMapping"("userId");

-- CreateIndex
CREATE INDEX "SSOUserMapping_ssoConnectionId_idx" ON "SSOUserMapping"("ssoConnectionId");

-- CreateIndex
CREATE UNIQUE INDEX "SSOUserMapping_ssoConnectionId_providerUserId_key" ON "SSOUserMapping"("ssoConnectionId", "providerUserId");

-- CreateIndex
CREATE INDEX "SSOAuditLog_ssoConnectionId_createdAt_idx" ON "SSOAuditLog"("ssoConnectionId", "createdAt");

-- CreateIndex
CREATE INDEX "SSOAuditLog_email_idx" ON "SSOAuditLog"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GLConfiguration_agencyId_key" ON "finance"."GLConfiguration"("agencyId");

-- CreateIndex
CREATE INDEX "GLConfiguration_agencyId_idx" ON "finance"."GLConfiguration"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "GLConfigurationSubAccount_subAccountId_key" ON "finance"."GLConfigurationSubAccount"("subAccountId");

-- CreateIndex
CREATE INDEX "GLConfigurationSubAccount_subAccountId_idx" ON "finance"."GLConfigurationSubAccount"("subAccountId");

-- CreateIndex
CREATE INDEX "GLConfigurationSubAccount_agencyConfigId_idx" ON "finance"."GLConfigurationSubAccount"("agencyConfigId");

-- CreateIndex
CREATE INDEX "ChartOfAccount_agencyId_accountType_idx" ON "finance"."ChartOfAccount"("agencyId", "accountType");

-- CreateIndex
CREATE INDEX "ChartOfAccount_agencyId_isActive_idx" ON "finance"."ChartOfAccount"("agencyId", "isActive");

-- CreateIndex
CREATE INDEX "ChartOfAccount_agencyId_path_idx" ON "finance"."ChartOfAccount"("agencyId", "path");

-- CreateIndex
CREATE INDEX "ChartOfAccount_agencyId_level_idx" ON "finance"."ChartOfAccount"("agencyId", "level");

-- CreateIndex
CREATE INDEX "ChartOfAccount_subAccountId_accountType_idx" ON "finance"."ChartOfAccount"("subAccountId", "accountType");

-- CreateIndex
CREATE INDEX "ChartOfAccount_subAccountId_isActive_idx" ON "finance"."ChartOfAccount"("subAccountId", "isActive");

-- CreateIndex
CREATE INDEX "ChartOfAccount_subAccountId_path_idx" ON "finance"."ChartOfAccount"("subAccountId", "path");

-- CreateIndex
CREATE INDEX "ChartOfAccount_parentAccountId_idx" ON "finance"."ChartOfAccount"("parentAccountId");

-- CreateIndex
CREATE INDEX "ChartOfAccount_controlAccountId_idx" ON "finance"."ChartOfAccount"("controlAccountId");

-- CreateIndex
CREATE INDEX "ChartOfAccount_isControlAccount_idx" ON "finance"."ChartOfAccount"("isControlAccount");

-- CreateIndex
CREATE INDEX "ChartOfAccount_isSystemAccount_idx" ON "finance"."ChartOfAccount"("isSystemAccount");

-- CreateIndex
CREATE INDEX "ChartOfAccount_isConsolidationEnabled_idx" ON "finance"."ChartOfAccount"("isConsolidationEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "ChartOfAccount_agencyId_code_key" ON "finance"."ChartOfAccount"("agencyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ChartOfAccount_subAccountId_code_key" ON "finance"."ChartOfAccount"("subAccountId", "code");

-- CreateIndex
CREATE INDEX "AgencyGroupCOA_agencyId_accountType_idx" ON "finance"."AgencyGroupCOA"("agencyId", "accountType");

-- CreateIndex
CREATE INDEX "AgencyGroupCOA_agencyId_isActive_idx" ON "finance"."AgencyGroupCOA"("agencyId", "isActive");

-- CreateIndex
CREATE INDEX "AgencyGroupCOA_parentId_idx" ON "finance"."AgencyGroupCOA"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "AgencyGroupCOA_agencyId_code_key" ON "finance"."AgencyGroupCOA"("agencyId", "code");

-- CreateIndex
CREATE INDEX "ConsolidationMapping_agencyId_idx" ON "finance"."ConsolidationMapping"("agencyId");

-- CreateIndex
CREATE INDEX "ConsolidationMapping_subAccountId_idx" ON "finance"."ConsolidationMapping"("subAccountId");

-- CreateIndex
CREATE INDEX "ConsolidationMapping_groupCOAId_idx" ON "finance"."ConsolidationMapping"("groupCOAId");

-- CreateIndex
CREATE INDEX "ConsolidationMapping_isElimination_idx" ON "finance"."ConsolidationMapping"("isElimination");

-- CreateIndex
CREATE UNIQUE INDEX "ConsolidationMapping_agencyId_subAccountId_subAccountCOACod_key" ON "finance"."ConsolidationMapping"("agencyId", "subAccountId", "subAccountCOACode");

-- CreateIndex
CREATE INDEX "FinancialPeriod_agencyId_status_idx" ON "finance"."FinancialPeriod"("agencyId", "status");

-- CreateIndex
CREATE INDEX "FinancialPeriod_agencyId_fiscalYear_idx" ON "finance"."FinancialPeriod"("agencyId", "fiscalYear");

-- CreateIndex
CREATE INDEX "FinancialPeriod_subAccountId_status_idx" ON "finance"."FinancialPeriod"("subAccountId", "status");

-- CreateIndex
CREATE INDEX "FinancialPeriod_subAccountId_fiscalYear_idx" ON "finance"."FinancialPeriod"("subAccountId", "fiscalYear");

-- CreateIndex
CREATE INDEX "FinancialPeriod_startDate_endDate_idx" ON "finance"."FinancialPeriod"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "FinancialPeriod_status_idx" ON "finance"."FinancialPeriod"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialPeriod_agencyId_fiscalYear_periodType_fiscalPeriod_key" ON "finance"."FinancialPeriod"("agencyId", "fiscalYear", "periodType", "fiscalPeriod");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialPeriod_subAccountId_fiscalYear_periodType_fiscalPe_key" ON "finance"."FinancialPeriod"("subAccountId", "fiscalYear", "periodType", "fiscalPeriod");

-- CreateIndex
CREATE INDEX "JournalEntry_agencyId_status_idx" ON "finance"."JournalEntry"("agencyId", "status");

-- CreateIndex
CREATE INDEX "JournalEntry_agencyId_periodId_idx" ON "finance"."JournalEntry"("agencyId", "periodId");

-- CreateIndex
CREATE INDEX "JournalEntry_agencyId_entryDate_idx" ON "finance"."JournalEntry"("agencyId", "entryDate");

-- CreateIndex
CREATE INDEX "JournalEntry_agencyId_entryType_idx" ON "finance"."JournalEntry"("agencyId", "entryType");

-- CreateIndex
CREATE INDEX "JournalEntry_subAccountId_status_idx" ON "finance"."JournalEntry"("subAccountId", "status");

-- CreateIndex
CREATE INDEX "JournalEntry_subAccountId_periodId_idx" ON "finance"."JournalEntry"("subAccountId", "periodId");

-- CreateIndex
CREATE INDEX "JournalEntry_subAccountId_entryDate_idx" ON "finance"."JournalEntry"("subAccountId", "entryDate");

-- CreateIndex
CREATE INDEX "JournalEntry_sourceModule_sourceId_idx" ON "finance"."JournalEntry"("sourceModule", "sourceId");

-- CreateIndex
CREATE INDEX "JournalEntry_postingRuleId_idx" ON "finance"."JournalEntry"("postingRuleId");

-- CreateIndex
CREATE INDEX "JournalEntry_status_idx" ON "finance"."JournalEntry"("status");

-- CreateIndex
CREATE INDEX "JournalEntry_createdBy_idx" ON "finance"."JournalEntry"("createdBy");

-- CreateIndex
CREATE INDEX "JournalEntry_approvedBy_idx" ON "finance"."JournalEntry"("approvedBy");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_agencyId_entryNumber_key" ON "finance"."JournalEntry"("agencyId", "entryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_subAccountId_entryNumber_key" ON "finance"."JournalEntry"("subAccountId", "entryNumber");

-- CreateIndex
CREATE INDEX "JournalEntryLine_journalEntryId_idx" ON "finance"."JournalEntryLine"("journalEntryId");

-- CreateIndex
CREATE INDEX "JournalEntryLine_accountId_idx" ON "finance"."JournalEntryLine"("accountId");

-- CreateIndex
CREATE INDEX "JournalEntryLine_subledgerType_subledgerReference_idx" ON "finance"."JournalEntryLine"("subledgerType", "subledgerReference");

-- CreateIndex
CREATE INDEX "JournalEntryLine_isIntercompany_idx" ON "finance"."JournalEntryLine"("isIntercompany");

-- CreateIndex
CREATE INDEX "AccountBalance_agencyId_periodId_idx" ON "finance"."AccountBalance"("agencyId", "periodId");

-- CreateIndex
CREATE INDEX "AccountBalance_subAccountId_periodId_idx" ON "finance"."AccountBalance"("subAccountId", "periodId");

-- CreateIndex
CREATE INDEX "AccountBalance_accountId_idx" ON "finance"."AccountBalance"("accountId");

-- CreateIndex
CREATE INDEX "AccountBalance_periodId_idx" ON "finance"."AccountBalance"("periodId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountBalance_accountId_periodId_currencyCode_key" ON "finance"."AccountBalance"("accountId", "periodId", "currencyCode");

-- CreateIndex
CREATE UNIQUE INDEX "Currency_code_key" ON "finance"."Currency"("code");

-- CreateIndex
CREATE INDEX "Currency_isActive_idx" ON "finance"."Currency"("isActive");

-- CreateIndex
CREATE INDEX "Currency_code_idx" ON "finance"."Currency"("code");

-- CreateIndex
CREATE INDEX "ExchangeRate_agencyId_effectiveDate_idx" ON "finance"."ExchangeRate"("agencyId", "effectiveDate");

-- CreateIndex
CREATE INDEX "ExchangeRate_fromCurrencyCode_toCurrencyCode_idx" ON "finance"."ExchangeRate"("fromCurrencyCode", "toCurrencyCode");

-- CreateIndex
CREATE INDEX "ExchangeRate_effectiveDate_idx" ON "finance"."ExchangeRate"("effectiveDate");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_agencyId_fromCurrencyCode_toCurrencyCode_effec_key" ON "finance"."ExchangeRate"("agencyId", "fromCurrencyCode", "toCurrencyCode", "effectiveDate", "rateType");

-- CreateIndex
CREATE INDEX "CurrencyRevaluation_agencyId_periodId_idx" ON "finance"."CurrencyRevaluation"("agencyId", "periodId");

-- CreateIndex
CREATE INDEX "CurrencyRevaluation_subAccountId_periodId_idx" ON "finance"."CurrencyRevaluation"("subAccountId", "periodId");

-- CreateIndex
CREATE INDEX "CurrencyRevaluation_currencyCode_idx" ON "finance"."CurrencyRevaluation"("currencyCode");

-- CreateIndex
CREATE INDEX "PostingRule_agencyId_sourceModule_isActive_idx" ON "finance"."PostingRule"("agencyId", "sourceModule", "isActive");

-- CreateIndex
CREATE INDEX "PostingRule_subAccountId_sourceModule_isActive_idx" ON "finance"."PostingRule"("subAccountId", "sourceModule", "isActive");

-- CreateIndex
CREATE INDEX "PostingRule_sourceModule_idx" ON "finance"."PostingRule"("sourceModule");

-- CreateIndex
CREATE INDEX "PostingRule_isActive_idx" ON "finance"."PostingRule"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PostingRule_agencyId_code_key" ON "finance"."PostingRule"("agencyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "PostingRule_subAccountId_code_key" ON "finance"."PostingRule"("subAccountId", "code");

-- CreateIndex
CREATE INDEX "PostingTemplate_agencyId_isActive_idx" ON "finance"."PostingTemplate"("agencyId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PostingTemplate_agencyId_name_key" ON "finance"."PostingTemplate"("agencyId", "name");

-- CreateIndex
CREATE INDEX "Reconciliation_agencyId_status_idx" ON "finance"."Reconciliation"("agencyId", "status");

-- CreateIndex
CREATE INDEX "Reconciliation_subAccountId_status_idx" ON "finance"."Reconciliation"("subAccountId", "status");

-- CreateIndex
CREATE INDEX "Reconciliation_accountId_periodId_idx" ON "finance"."Reconciliation"("accountId", "periodId");

-- CreateIndex
CREATE INDEX "Reconciliation_status_idx" ON "finance"."Reconciliation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Reconciliation_agencyId_reconciliationNumber_key" ON "finance"."Reconciliation"("agencyId", "reconciliationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Reconciliation_subAccountId_reconciliationNumber_key" ON "finance"."Reconciliation"("subAccountId", "reconciliationNumber");

-- CreateIndex
CREATE INDEX "ReconciliationItem_reconciliationId_idx" ON "finance"."ReconciliationItem"("reconciliationId");

-- CreateIndex
CREATE INDEX "ReconciliationItem_status_idx" ON "finance"."ReconciliationItem"("status");

-- CreateIndex
CREATE INDEX "ReconciliationItem_matchedItemId_idx" ON "finance"."ReconciliationItem"("matchedItemId");

-- CreateIndex
CREATE INDEX "ReconciliationRule_agencyId_isActive_idx" ON "finance"."ReconciliationRule"("agencyId", "isActive");

-- CreateIndex
CREATE INDEX "IntercompanyReconciliation_agencyId_periodId_idx" ON "finance"."IntercompanyReconciliation"("agencyId", "periodId");

-- CreateIndex
CREATE INDEX "IntercompanyReconciliation_subAccountId1_idx" ON "finance"."IntercompanyReconciliation"("subAccountId1");

-- CreateIndex
CREATE INDEX "IntercompanyReconciliation_subAccountId2_idx" ON "finance"."IntercompanyReconciliation"("subAccountId2");

-- CreateIndex
CREATE INDEX "ConsolidationSnapshot_agencyId_periodId_status_idx" ON "finance"."ConsolidationSnapshot"("agencyId", "periodId", "status");

-- CreateIndex
CREATE INDEX "ConsolidationSnapshot_agencyId_status_idx" ON "finance"."ConsolidationSnapshot"("agencyId", "status");

-- CreateIndex
CREATE INDEX "ConsolidationSnapshot_periodId_idx" ON "finance"."ConsolidationSnapshot"("periodId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsolidationSnapshot_agencyId_periodId_version_key" ON "finance"."ConsolidationSnapshot"("agencyId", "periodId", "version");

-- CreateIndex
CREATE INDEX "ConsolidationWorksheetLine_snapshotId_idx" ON "finance"."ConsolidationWorksheetLine"("snapshotId");

-- CreateIndex
CREATE INDEX "ConsolidationWorksheetLine_groupCOAId_idx" ON "finance"."ConsolidationWorksheetLine"("groupCOAId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsolidationWorksheetLine_snapshotId_accountCode_key" ON "finance"."ConsolidationWorksheetLine"("snapshotId", "accountCode");

-- CreateIndex
CREATE INDEX "ConsolidatedBalance_snapshotId_idx" ON "finance"."ConsolidatedBalance"("snapshotId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsolidatedBalance_snapshotId_groupCOAId_key" ON "finance"."ConsolidatedBalance"("snapshotId", "groupCOAId");

-- CreateIndex
CREATE INDEX "ConsolidationAdjustment_snapshotId_idx" ON "finance"."ConsolidationAdjustment"("snapshotId");

-- CreateIndex
CREATE INDEX "IntercompanyElimination_snapshotId_idx" ON "finance"."IntercompanyElimination"("snapshotId");

-- CreateIndex
CREATE INDEX "IntercompanyElimination_subAccountId1_subAccountId2_idx" ON "finance"."IntercompanyElimination"("subAccountId1", "subAccountId2");

-- CreateIndex
CREATE INDEX "SubAccountOwnership_agencyId_isActive_idx" ON "finance"."SubAccountOwnership"("agencyId", "isActive");

-- CreateIndex
CREATE INDEX "SubAccountOwnership_subAccountId_idx" ON "finance"."SubAccountOwnership"("subAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "SubAccountOwnership_agencyId_subAccountId_effectiveFrom_key" ON "finance"."SubAccountOwnership"("agencyId", "subAccountId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "SavedReport_agencyId_reportType_idx" ON "finance"."SavedReport"("agencyId", "reportType");

-- CreateIndex
CREATE INDEX "SavedReport_subAccountId_reportType_idx" ON "finance"."SavedReport"("subAccountId", "reportType");

-- CreateIndex
CREATE UNIQUE INDEX "ReportTemplate_name_key" ON "finance"."ReportTemplate"("name");

-- CreateIndex
CREATE INDEX "ReportTemplate_reportType_isActive_idx" ON "finance"."ReportTemplate"("reportType", "isActive");

-- CreateIndex
CREATE INDEX "COATemplate_industry_isActive_idx" ON "finance"."COATemplate"("industry", "isActive");

-- CreateIndex
CREATE INDEX "COATemplate_region_accountingStandard_idx" ON "finance"."COATemplate"("region", "accountingStandard");

-- CreateIndex
CREATE INDEX "GLAuditTrail_agencyId_entityType_entityId_idx" ON "finance"."GLAuditTrail"("agencyId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "GLAuditTrail_subAccountId_entityType_entityId_idx" ON "finance"."GLAuditTrail"("subAccountId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "GLAuditTrail_agencyId_timestamp_idx" ON "finance"."GLAuditTrail"("agencyId", "timestamp");

-- CreateIndex
CREATE INDEX "GLAuditTrail_subAccountId_timestamp_idx" ON "finance"."GLAuditTrail"("subAccountId", "timestamp");

-- CreateIndex
CREATE INDEX "GLAuditTrail_userId_idx" ON "finance"."GLAuditTrail"("userId");

-- CreateIndex
CREATE INDEX "GLAuditTrail_entityType_entityId_idx" ON "finance"."GLAuditTrail"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "GLAuditTrail_timestamp_idx" ON "finance"."GLAuditTrail"("timestamp");

-- CreateIndex
CREATE INDEX "GLAuditTrail_action_idx" ON "finance"."GLAuditTrail"("action");

-- CreateIndex
CREATE INDEX "SubLedger_agencyId_type_idx" ON "finance"."SubLedger"("agencyId", "type");

-- CreateIndex
CREATE INDEX "SubLedger_subAccountId_type_idx" ON "finance"."SubLedger"("subAccountId", "type");

-- CreateIndex
CREATE INDEX "SubLedger_controlAccountId_idx" ON "finance"."SubLedger"("controlAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "SubLedger_agencyId_code_key" ON "finance"."SubLedger"("agencyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "SubLedger_subAccountId_code_key" ON "finance"."SubLedger"("subAccountId", "code");

-- CreateIndex
CREATE INDEX "Vendor_agencyId_isActive_idx" ON "finance"."Vendor"("agencyId", "isActive");

-- CreateIndex
CREATE INDEX "Vendor_subAccountId_isActive_idx" ON "finance"."Vendor"("subAccountId", "isActive");

-- CreateIndex
CREATE INDEX "Vendor_subLedgerId_idx" ON "finance"."Vendor"("subLedgerId");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_agencyId_code_key" ON "finance"."Vendor"("agencyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_subAccountId_code_key" ON "finance"."Vendor"("subAccountId", "code");

-- CreateIndex
CREATE INDEX "Customer_agencyId_isActive_idx" ON "finance"."Customer"("agencyId", "isActive");

-- CreateIndex
CREATE INDEX "Customer_subAccountId_isActive_idx" ON "finance"."Customer"("subAccountId", "isActive");

-- CreateIndex
CREATE INDEX "Customer_subLedgerId_idx" ON "finance"."Customer"("subLedgerId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_agencyId_code_key" ON "finance"."Customer"("agencyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_subAccountId_code_key" ON "finance"."Customer"("subAccountId", "code");

-- CreateIndex
CREATE INDEX "GLConfigurationLock_agencyId_idx" ON "finance"."GLConfigurationLock"("agencyId");

-- CreateIndex
CREATE INDEX "GLConfigurationLock_subAccountId_idx" ON "finance"."GLConfigurationLock"("subAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "GLConfigurationLock_agencyId_settingKey_key" ON "finance"."GLConfigurationLock"("agencyId", "settingKey");

-- CreateIndex
CREATE UNIQUE INDEX "GLConfigurationLock_subAccountId_settingKey_key" ON "finance"."GLConfigurationLock"("subAccountId", "settingKey");

-- CreateIndex
CREATE INDEX "OpenItem_agencyId_accountId_status_idx" ON "finance"."OpenItem"("agencyId", "accountId", "status");

-- CreateIndex
CREATE INDEX "OpenItem_subAccountId_accountId_status_idx" ON "finance"."OpenItem"("subAccountId", "accountId", "status");

-- CreateIndex
CREATE INDEX "OpenItem_customerId_status_idx" ON "finance"."OpenItem"("customerId", "status");

-- CreateIndex
CREATE INDEX "OpenItem_vendorId_status_idx" ON "finance"."OpenItem"("vendorId", "status");

-- CreateIndex
CREATE INDEX "OpenItem_clearingDate_idx" ON "finance"."OpenItem"("clearingDate");

-- CreateIndex
CREATE INDEX "OpenItem_sourceModule_sourceId_idx" ON "finance"."OpenItem"("sourceModule", "sourceId");

-- CreateIndex
CREATE INDEX "OpenItem_reference_idx" ON "finance"."OpenItem"("reference");

-- CreateIndex
CREATE INDEX "OpenItemAllocation_openItemId_idx" ON "finance"."OpenItemAllocation"("openItemId");

-- CreateIndex
CREATE INDEX "OpenItemAllocation_clearedById_idx" ON "finance"."OpenItemAllocation"("clearedById");

-- CreateIndex
CREATE INDEX "OpenItemAllocation_allocatedAt_idx" ON "finance"."OpenItemAllocation"("allocatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationApiKey_keyPrefix_key" ON "IntegrationApiKey"("keyPrefix");

-- CreateIndex
CREATE INDEX "IntegrationApiKey_agencyId_idx" ON "IntegrationApiKey"("agencyId");

-- CreateIndex
CREATE INDEX "IntegrationApiKey_subAccountId_idx" ON "IntegrationApiKey"("subAccountId");

-- CreateIndex
CREATE INDEX "IntegrationApiKey_createdByUserId_idx" ON "IntegrationApiKey"("createdByUserId");

-- CreateIndex
CREATE INDEX "IntegrationConnection_provider_idx" ON "IntegrationConnection"("provider");

-- CreateIndex
CREATE INDEX "IntegrationConnection_agencyId_idx" ON "IntegrationConnection"("agencyId");

-- CreateIndex
CREATE INDEX "IntegrationConnection_subAccountId_idx" ON "IntegrationConnection"("subAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConnection_provider_agencyId_subAccountId_key" ON "IntegrationConnection"("provider", "agencyId", "subAccountId");

-- CreateIndex
CREATE INDEX "IntegrationWebhookSubscription_connectionId_idx" ON "IntegrationWebhookSubscription"("connectionId");

-- CreateIndex
CREATE INDEX "IntegrationWebhookSubscription_isActive_idx" ON "IntegrationWebhookSubscription"("isActive");

-- CreateIndex
CREATE INDEX "IntegrationProviderEvent_provider_idx" ON "IntegrationProviderEvent"("provider");

-- CreateIndex
CREATE INDEX "IntegrationProviderEvent_connectionId_idx" ON "IntegrationProviderEvent"("connectionId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationProviderEvent_connectionId_externalEventId_key" ON "IntegrationProviderEvent"("connectionId", "externalEventId");

-- CreateIndex
CREATE INDEX "IntegrationWebhookDelivery_subscriptionId_idx" ON "IntegrationWebhookDelivery"("subscriptionId");

-- CreateIndex
CREATE INDEX "IntegrationWebhookDelivery_status_idx" ON "IntegrationWebhookDelivery"("status");

-- CreateIndex
CREATE INDEX "IntegrationWebhookDelivery_nextAttemptAt_idx" ON "IntegrationWebhookDelivery"("nextAttemptAt");

-- CreateIndex
CREATE INDEX "IntegrationWebhookDeliveryAttempt_deliveryId_idx" ON "IntegrationWebhookDeliveryAttempt"("deliveryId");

-- CreateIndex
CREATE INDEX "IntegrationWebhookDeliveryAttempt_attemptedAt_idx" ON "IntegrationWebhookDeliveryAttempt"("attemptedAt");

-- CreateIndex
CREATE INDEX "AppInstallation_appKey_idx" ON "AppInstallation"("appKey");

-- CreateIndex
CREATE INDEX "AppInstallation_agencyId_idx" ON "AppInstallation"("agencyId");

-- CreateIndex
CREATE INDEX "AppInstallation_subAccountId_idx" ON "AppInstallation"("subAccountId");

-- CreateIndex
CREATE INDEX "SupportTicket_scope_agencyId_idx" ON "SupportTicket"("scope", "agencyId");

-- CreateIndex
CREATE INDEX "SupportTicket_scope_subAccountId_idx" ON "SupportTicket"("scope", "subAccountId");

-- CreateIndex
CREATE INDEX "SupportTicket_status_createdAt_idx" ON "SupportTicket"("status", "createdAt");

-- CreateIndex
CREATE INDEX "IndustryClassification_taxIdentityId_idx" ON "finance"."IndustryClassification"("taxIdentityId");

-- CreateIndex
CREATE INDEX "IndustryClassification_scheme_code_idx" ON "finance"."IndustryClassification"("scheme", "code");

-- CreateIndex
CREATE UNIQUE INDEX "IndustryClassification_taxIdentityId_scheme_code_key" ON "finance"."IndustryClassification"("taxIdentityId", "scheme", "code");

-- CreateIndex
CREATE INDEX "TaxExemptionCertificate_taxIdentityId_idx" ON "finance"."TaxExemptionCertificate"("taxIdentityId");

-- CreateIndex
CREATE INDEX "TaxExemptionCertificate_expiryDate_idx" ON "finance"."TaxExemptionCertificate"("expiryDate");

-- CreateIndex
CREATE INDEX "TaxExemptionCertificate_verificationStatus_idx" ON "finance"."TaxExemptionCertificate"("verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "EInvoiceSettings_agencyId_key" ON "finance"."EInvoiceSettings"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "EInvoiceSettings_subAccountId_key" ON "finance"."EInvoiceSettings"("subAccountId");

-- CreateIndex
CREATE INDEX "EInvoice_settingsId_idx" ON "finance"."EInvoice"("settingsId");

-- CreateIndex
CREATE INDEX "EInvoice_status_idx" ON "finance"."EInvoice"("status");

-- CreateIndex
CREATE INDEX "EInvoice_customerId_idx" ON "finance"."EInvoice"("customerId");

-- CreateIndex
CREATE INDEX "EInvoice_issueDate_idx" ON "finance"."EInvoice"("issueDate");

-- CreateIndex
CREATE INDEX "EInvoice_journalEntryId_idx" ON "finance"."EInvoice"("journalEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "EInvoice_settingsId_invoiceNumber_key" ON "finance"."EInvoice"("settingsId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "EInvoiceLineItem_invoiceId_idx" ON "finance"."EInvoiceLineItem"("invoiceId");

-- CreateIndex
CREATE INDEX "EInvoiceLineItem_classificationCode_idx" ON "finance"."EInvoiceLineItem"("classificationCode");

-- CreateIndex
CREATE INDEX "EInvoiceSubmission_invoiceId_idx" ON "finance"."EInvoiceSubmission"("invoiceId");

-- CreateIndex
CREATE INDEX "EInvoiceSubmission_submittedAt_idx" ON "finance"."EInvoiceSubmission"("submittedAt");

-- CreateIndex
CREATE INDEX "Discount_agencyId_idx" ON "finance"."Discount"("agencyId");

-- CreateIndex
CREATE INDEX "Discount_code_idx" ON "finance"."Discount"("code");

-- CreateIndex
CREATE INDEX "Discount_isActive_idx" ON "finance"."Discount"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Discount_agencyId_code_key" ON "finance"."Discount"("agencyId", "code");

-- CreateIndex
CREATE INDEX "AppliedDiscount_discountId_idx" ON "finance"."AppliedDiscount"("discountId");

-- CreateIndex
CREATE INDEX "AppliedDiscount_invoiceId_idx" ON "finance"."AppliedDiscount"("invoiceId");

-- CreateIndex
CREATE INDEX "AppliedDiscount_subscriptionId_idx" ON "finance"."AppliedDiscount"("subscriptionId");

-- CreateIndex
CREATE INDEX "_TagToTicket_B_index" ON "_TagToTicket"("B");

-- AddForeignKey
ALTER TABLE "TermsAgreement" ADD CONSTRAINT "TermsAgreement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Authenticator" ADD CONSTRAINT "Authenticator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxObligation" ADD CONSTRAINT "TaxObligation_taxIdentityId_fkey" FOREIGN KEY ("taxIdentityId") REFERENCES "TaxIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agency" ADD CONSTRAINT "Agency_taxIdentityId_fkey" FOREIGN KEY ("taxIdentityId") REFERENCES "TaxIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubAccount" ADD CONSTRAINT "SubAccount_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubAccount" ADD CONSTRAINT "FK_SUBACCOUNT_TAXIDENTITY" FOREIGN KEY ("taxIdentityId") REFERENCES "TaxIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pipeline" ADD CONSTRAINT "Pipeline_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lane" ADD CONSTRAINT "Lane_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_laneId_fkey" FOREIGN KEY ("laneId") REFERENCES "Lane"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trigger" ADD CONSTRAINT "Trigger_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_triggerId_fkey" FOREIGN KEY ("triggerId") REFERENCES "Trigger"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationInstance" ADD CONSTRAINT "AutomationInstance_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Funnel" ADD CONSTRAINT "Funnel_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassName" ADD CONSTRAINT "ClassName_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "Funnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunnelPage" ADD CONSTRAINT "FunnelPage_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "Funnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencySidebarOption" ADD CONSTRAINT "AgencySidebarOption_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubAccountSidebarOption" ADD CONSTRAINT "SubAccountSidebarOption_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SidebarOptionLink" ADD CONSTRAINT "SidebarOptionLink_sidebarOptionId_fkey" FOREIGN KEY ("sidebarOptionId") REFERENCES "SidebarOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddOns" ADD CONSTRAINT "AddOns_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyMembership" ADD CONSTRAINT "AgencyMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyMembership" ADD CONSTRAINT "AgencyMembership_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyMembership" ADD CONSTRAINT "AgencyMembership_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubAccountMembership" ADD CONSTRAINT "SubAccountMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubAccountMembership" ADD CONSTRAINT "SubAccountMembership_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubAccountMembership" ADD CONSTRAINT "SubAccountMembership_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntitlementOverride" ADD CONSTRAINT "EntitlementOverride_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntitlementOverride" ADD CONSTRAINT "EntitlementOverride_featureKey_fkey" FOREIGN KEY ("featureKey") REFERENCES "EntitlementFeature"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanFeature" ADD CONSTRAINT "PlanFeature_featureKey_fkey" FOREIGN KEY ("featureKey") REFERENCES "EntitlementFeature"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeaturePreference" ADD CONSTRAINT "FeaturePreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageTracking" ADD CONSTRAINT "UsageTracking_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureCreditBalance" ADD CONSTRAINT "FeatureCreditBalance_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Passkey" ADD CONSTRAINT "Passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MFAChallenge" ADD CONSTRAINT "MFAChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MFAMethod" ADD CONSTRAINT "MFAMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SSOConnection" ADD CONSTRAINT "SSOConnection_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SSOUserMapping" ADD CONSTRAINT "SSOUserMapping_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SSOUserMapping" ADD CONSTRAINT "SSOUserMapping_ssoConnectionId_fkey" FOREIGN KEY ("ssoConnectionId") REFERENCES "SSOConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SSOAuditLog" ADD CONSTRAINT "SSOAuditLog_ssoConnectionId_fkey" FOREIGN KEY ("ssoConnectionId") REFERENCES "SSOConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."GLConfiguration" ADD CONSTRAINT "GLConfiguration_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."GLConfigurationSubAccount" ADD CONSTRAINT "GLConfigurationSubAccount_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."GLConfigurationSubAccount" ADD CONSTRAINT "GLConfigurationSubAccount_agencyConfigId_fkey" FOREIGN KEY ("agencyConfigId") REFERENCES "finance"."GLConfiguration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ChartOfAccount" ADD CONSTRAINT "ChartOfAccount_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ChartOfAccount" ADD CONSTRAINT "ChartOfAccount_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ChartOfAccount" ADD CONSTRAINT "ChartOfAccount_parentAccountId_fkey" FOREIGN KEY ("parentAccountId") REFERENCES "finance"."ChartOfAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ChartOfAccount" ADD CONSTRAINT "ChartOfAccount_controlAccountId_fkey" FOREIGN KEY ("controlAccountId") REFERENCES "finance"."ChartOfAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."AgencyGroupCOA" ADD CONSTRAINT "AgencyGroupCOA_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."AgencyGroupCOA" ADD CONSTRAINT "AgencyGroupCOA_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "finance"."AgencyGroupCOA"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ConsolidationMapping" ADD CONSTRAINT "ConsolidationMapping_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ConsolidationMapping" ADD CONSTRAINT "ConsolidationMapping_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ConsolidationMapping" ADD CONSTRAINT "ConsolidationMapping_groupCOAId_fkey" FOREIGN KEY ("groupCOAId") REFERENCES "finance"."AgencyGroupCOA"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."FinancialPeriod" ADD CONSTRAINT "FinancialPeriod_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."FinancialPeriod" ADD CONSTRAINT "FinancialPeriod_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."JournalEntry" ADD CONSTRAINT "JournalEntry_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."JournalEntry" ADD CONSTRAINT "JournalEntry_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."JournalEntry" ADD CONSTRAINT "JournalEntry_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "finance"."FinancialPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."JournalEntry" ADD CONSTRAINT "JournalEntry_postingRuleId_fkey" FOREIGN KEY ("postingRuleId") REFERENCES "finance"."PostingRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."JournalEntry" ADD CONSTRAINT "JournalEntry_carryForwardFromId_fkey" FOREIGN KEY ("carryForwardFromId") REFERENCES "finance"."JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."JournalEntry" ADD CONSTRAINT "JournalEntry_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "finance"."JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."JournalEntryLine" ADD CONSTRAINT "JournalEntryLine_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "finance"."JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."JournalEntryLine" ADD CONSTRAINT "JournalEntryLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "finance"."ChartOfAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."AccountBalance" ADD CONSTRAINT "AccountBalance_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."AccountBalance" ADD CONSTRAINT "AccountBalance_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."AccountBalance" ADD CONSTRAINT "AccountBalance_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "finance"."ChartOfAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."AccountBalance" ADD CONSTRAINT "AccountBalance_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "finance"."FinancialPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ExchangeRate" ADD CONSTRAINT "ExchangeRate_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ExchangeRate" ADD CONSTRAINT "ExchangeRate_fromCurrencyCode_fkey" FOREIGN KEY ("fromCurrencyCode") REFERENCES "finance"."Currency"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ExchangeRate" ADD CONSTRAINT "ExchangeRate_toCurrencyCode_fkey" FOREIGN KEY ("toCurrencyCode") REFERENCES "finance"."Currency"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."CurrencyRevaluation" ADD CONSTRAINT "CurrencyRevaluation_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."CurrencyRevaluation" ADD CONSTRAINT "CurrencyRevaluation_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."CurrencyRevaluation" ADD CONSTRAINT "CurrencyRevaluation_currencyCode_fkey" FOREIGN KEY ("currencyCode") REFERENCES "finance"."Currency"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."PostingRule" ADD CONSTRAINT "PostingRule_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."PostingRule" ADD CONSTRAINT "PostingRule_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."PostingRule" ADD CONSTRAINT "PostingRule_debitAccountId_fkey" FOREIGN KEY ("debitAccountId") REFERENCES "finance"."ChartOfAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."PostingRule" ADD CONSTRAINT "PostingRule_creditAccountId_fkey" FOREIGN KEY ("creditAccountId") REFERENCES "finance"."ChartOfAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."PostingTemplate" ADD CONSTRAINT "PostingTemplate_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."Reconciliation" ADD CONSTRAINT "Reconciliation_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."Reconciliation" ADD CONSTRAINT "Reconciliation_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."Reconciliation" ADD CONSTRAINT "Reconciliation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "finance"."ChartOfAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."Reconciliation" ADD CONSTRAINT "Reconciliation_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "finance"."FinancialPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ReconciliationItem" ADD CONSTRAINT "ReconciliationItem_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "finance"."Reconciliation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ReconciliationRule" ADD CONSTRAINT "ReconciliationRule_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."IntercompanyReconciliation" ADD CONSTRAINT "IntercompanyReconciliation_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."IntercompanyReconciliation" ADD CONSTRAINT "IntercompanyReconciliation_subAccountId1_fkey" FOREIGN KEY ("subAccountId1") REFERENCES "SubAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."IntercompanyReconciliation" ADD CONSTRAINT "IntercompanyReconciliation_subAccountId2_fkey" FOREIGN KEY ("subAccountId2") REFERENCES "SubAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ConsolidationSnapshot" ADD CONSTRAINT "ConsolidationSnapshot_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ConsolidationSnapshot" ADD CONSTRAINT "ConsolidationSnapshot_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "finance"."FinancialPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ConsolidationWorksheetLine" ADD CONSTRAINT "ConsolidationWorksheetLine_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "finance"."ConsolidationSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ConsolidationWorksheetLine" ADD CONSTRAINT "ConsolidationWorksheetLine_groupCOAId_fkey" FOREIGN KEY ("groupCOAId") REFERENCES "finance"."AgencyGroupCOA"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ConsolidatedBalance" ADD CONSTRAINT "ConsolidatedBalance_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "finance"."ConsolidationSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ConsolidatedBalance" ADD CONSTRAINT "ConsolidatedBalance_groupCOAId_fkey" FOREIGN KEY ("groupCOAId") REFERENCES "finance"."AgencyGroupCOA"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ConsolidationAdjustment" ADD CONSTRAINT "ConsolidationAdjustment_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "finance"."ConsolidationSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."IntercompanyElimination" ADD CONSTRAINT "IntercompanyElimination_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "finance"."ConsolidationSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."SubAccountOwnership" ADD CONSTRAINT "SubAccountOwnership_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."SubAccountOwnership" ADD CONSTRAINT "SubAccountOwnership_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."SavedReport" ADD CONSTRAINT "SavedReport_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."SavedReport" ADD CONSTRAINT "SavedReport_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."SubLedger" ADD CONSTRAINT "SubLedger_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."SubLedger" ADD CONSTRAINT "SubLedger_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."SubLedger" ADD CONSTRAINT "SubLedger_controlAccountId_fkey" FOREIGN KEY ("controlAccountId") REFERENCES "finance"."ChartOfAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."Vendor" ADD CONSTRAINT "Vendor_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."Vendor" ADD CONSTRAINT "Vendor_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."Vendor" ADD CONSTRAINT "Vendor_subLedgerId_fkey" FOREIGN KEY ("subLedgerId") REFERENCES "finance"."SubLedger"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."Customer" ADD CONSTRAINT "Customer_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."Customer" ADD CONSTRAINT "Customer_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."Customer" ADD CONSTRAINT "Customer_subLedgerId_fkey" FOREIGN KEY ("subLedgerId") REFERENCES "finance"."SubLedger"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."GLConfigurationLock" ADD CONSTRAINT "GLConfigurationLock_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."GLConfigurationLock" ADD CONSTRAINT "GLConfigurationLock_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."OpenItem" ADD CONSTRAINT "OpenItem_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."OpenItem" ADD CONSTRAINT "OpenItem_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."OpenItem" ADD CONSTRAINT "OpenItem_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "finance"."ChartOfAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."OpenItem" ADD CONSTRAINT "OpenItem_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "finance"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."OpenItem" ADD CONSTRAINT "OpenItem_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "finance"."Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."OpenItemAllocation" ADD CONSTRAINT "OpenItemAllocation_openItemId_fkey" FOREIGN KEY ("openItemId") REFERENCES "finance"."OpenItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationApiKey" ADD CONSTRAINT "IntegrationApiKey_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationApiKey" ADD CONSTRAINT "IntegrationApiKey_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationApiKey" ADD CONSTRAINT "IntegrationApiKey_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationConnection" ADD CONSTRAINT "IntegrationConnection_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationWebhookSubscription" ADD CONSTRAINT "IntegrationWebhookSubscription_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationProviderEvent" ADD CONSTRAINT "IntegrationProviderEvent_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "IntegrationConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationWebhookDelivery" ADD CONSTRAINT "IntegrationWebhookDelivery_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "IntegrationWebhookSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationWebhookDelivery" ADD CONSTRAINT "IntegrationWebhookDelivery_providerEventId_fkey" FOREIGN KEY ("providerEventId") REFERENCES "IntegrationProviderEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationWebhookDeliveryAttempt" ADD CONSTRAINT "IntegrationWebhookDeliveryAttempt_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "IntegrationWebhookDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppInstallation" ADD CONSTRAINT "AppInstallation_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppInstallation" ADD CONSTRAINT "AppInstallation_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."IndustryClassification" ADD CONSTRAINT "IndustryClassification_taxIdentityId_fkey" FOREIGN KEY ("taxIdentityId") REFERENCES "TaxIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."TaxExemptionCertificate" ADD CONSTRAINT "TaxExemptionCertificate_taxIdentityId_fkey" FOREIGN KEY ("taxIdentityId") REFERENCES "TaxIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."EInvoiceSettings" ADD CONSTRAINT "EInvoiceSettings_defaultRevenueAccountId_fkey" FOREIGN KEY ("defaultRevenueAccountId") REFERENCES "finance"."ChartOfAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."EInvoiceSettings" ADD CONSTRAINT "EInvoiceSettings_defaultReceivableAccountId_fkey" FOREIGN KEY ("defaultReceivableAccountId") REFERENCES "finance"."ChartOfAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."EInvoiceSettings" ADD CONSTRAINT "EInvoiceSettings_defaultTaxOutputAccountId_fkey" FOREIGN KEY ("defaultTaxOutputAccountId") REFERENCES "finance"."ChartOfAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."EInvoice" ADD CONSTRAINT "EInvoice_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "finance"."EInvoiceSettings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."EInvoice" ADD CONSTRAINT "EInvoice_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "finance"."JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."EInvoice" ADD CONSTRAINT "EInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "finance"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."EInvoice" ADD CONSTRAINT "EInvoice_supplierTaxIdentityId_fkey" FOREIGN KEY ("supplierTaxIdentityId") REFERENCES "TaxIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."EInvoiceLineItem" ADD CONSTRAINT "EInvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "finance"."EInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."EInvoiceLineItem" ADD CONSTRAINT "EInvoiceLineItem_revenueAccountId_fkey" FOREIGN KEY ("revenueAccountId") REFERENCES "finance"."ChartOfAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."EInvoiceSubmission" ADD CONSTRAINT "EInvoiceSubmission_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "finance"."EInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."AppliedDiscount" ADD CONSTRAINT "AppliedDiscount_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "finance"."Discount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TagToTicket" ADD CONSTRAINT "_TagToTicket_A_fkey" FOREIGN KEY ("A") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TagToTicket" ADD CONSTRAINT "_TagToTicket_B_fkey" FOREIGN KEY ("B") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
