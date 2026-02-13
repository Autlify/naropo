/*
  Warnings:

  - The values [price_1SyzhnA9USWB0LkI5GGYXpSD,price_1SyzhnA9USWB0LkI308wbMvc,price_1SyzhoA9USWB0LkI5D4gH5uO,price_1SyzhoA9USWB0LkIhhEDcODz,price_1SyzhpA9USWB0LkI5WiSJf1L,price_1SyzhqA9USWB0LkIApPieSYG,price_1SyzhqA9USWB0LkIiGWeC9I7] on the enum `Plan` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[agencyId,priceId]` on the table `AddOns` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SubscriptionItemKind" AS ENUM ('PLAN', 'ADDON');

-- CreateEnum
CREATE TYPE "WebhookEventStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "AccessContextScope" AS ENUM ('SYSTEM', 'AGENCY', 'SUBACCOUNT');

-- CreateEnum
CREATE TYPE "finance"."ApPaymentStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'PROCESSING', 'COMPLETED', 'FAILED', 'VOID');

-- CreateEnum
CREATE TYPE "finance"."PaymentMethod" AS ENUM ('ACH', 'WIRE', 'CHECK', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'BANK_TRANSFER', 'DIGITAL_WALLET', 'OTHER');

-- CreateEnum
CREATE TYPE "finance"."ArReceiptStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'DEPOSITED', 'CLEARED', 'BOUNCED', 'VOID');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Icon" ADD VALUE 'mail';
ALTER TYPE "Icon" ADD VALUE 'inifinity';
ALTER TYPE "Icon" ADD VALUE 'award';
ALTER TYPE "Icon" ADD VALUE 'analytics';
ALTER TYPE "Icon" ADD VALUE 'globe';
ALTER TYPE "Icon" ADD VALUE 'team';
ALTER TYPE "Icon" ADD VALUE 'target';
ALTER TYPE "Icon" ADD VALUE 'crown';
ALTER TYPE "Icon" ADD VALUE 'analytcis';
ALTER TYPE "Icon" ADD VALUE 'zap';

-- AlterEnum
BEGIN;
CREATE TYPE "Plan_new" AS ENUM ('price_1SzWP7EDFXmtidMA6eacKYD6', 'price_1SzWP8EDFXmtidMAgI3pJQnC', 'price_1SzWP9EDFXmtidMA25Slofpy', 'price_1SzWP9EDFXmtidMAvFt8eA0e', 'price_1SzWPAEDFXmtidMA7O56e1ma', 'price_1SzWPBEDFXmtidMA9OXh9jcB', 'price_1SzWPCEDFXmtidMAxuItUkUl');
ALTER TABLE "Subscription" ALTER COLUMN "plan" TYPE "Plan_new" USING ("plan"::text::"Plan_new");
ALTER TYPE "Plan" RENAME TO "Plan_old";
ALTER TYPE "Plan_new" RENAME TO "Plan";
DROP TYPE "public"."Plan_old";
COMMIT;

-- AlterTable
ALTER TABLE "finance"."Customer" ADD COLUMN     "bankAccount" TEXT,
ADD COLUMN     "bankCountryCode" CHAR(2),
ADD COLUMN     "bankIban" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "bankRoutingNumber" TEXT,
ADD COLUMN     "bankSwiftCode" TEXT,
ADD COLUMN     "billingAddress" JSONB,
ADD COLUMN     "creditHold" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "creditHoldReason" TEXT,
ADD COLUMN     "defaultArPostingTemplateKey" TEXT,
ADD COLUMN     "defaultReceivableAccountId" TEXT,
ADD COLUMN     "defaultRevenueAccountId" TEXT,
ADD COLUMN     "defaultTaxAccountId" TEXT,
ADD COLUMN     "dunningEmail" TEXT,
ADD COLUMN     "dunningEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "dunningLevel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "externalRefs" JSONB,
ADD COLUMN     "invoiceAutomation" JSONB,
ADD COLUMN     "lastDunningDate" TIMESTAMP(3),
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "preferredPaymentMethod" TEXT,
ADD COLUMN     "shippingAddress" JSONB,
ADD COLUMN     "statementEmail" TEXT,
ADD COLUMN     "tags" TEXT[];

-- AlterTable
ALTER TABLE "finance"."Vendor" ADD COLUMN     "bankCountryCode" CHAR(2),
ADD COLUMN     "bankIban" TEXT,
ADD COLUMN     "bankRoutingNumber" TEXT,
ADD COLUMN     "billingAddress" JSONB,
ADD COLUMN     "defaultApPostingTemplateKey" TEXT,
ADD COLUMN     "defaultExpenseAccountId" TEXT,
ADD COLUMN     "defaultLiabilityAccountId" TEXT,
ADD COLUMN     "defaultTaxAccountId" TEXT,
ADD COLUMN     "defaultWithholdingTaxAccountId" TEXT,
ADD COLUMN     "externalRefs" JSONB,
ADD COLUMN     "invoiceAutomation" JSONB,
ADD COLUMN     "invoiceEmail" TEXT,
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paymentHold" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentHoldReason" TEXT,
ADD COLUMN     "preferredPaymentMethod" TEXT,
ADD COLUMN     "remittanceEmail" TEXT,
ADD COLUMN     "tags" TEXT[];

-- AlterTable
ALTER TABLE "AddOns" ADD COLUMN     "addonKey" TEXT;

-- AlterTable
ALTER TABLE "AgencySettings" ADD COLUMN     "settingsJson" JSONB;

-- AlterTable
ALTER TABLE "SubAccountSettings" ADD COLUMN     "settingsJson" JSONB;

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'stripe',
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" "WebhookEventStatus" NOT NULL DEFAULT 'RECEIVED',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "payload" JSONB,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingState" (
    "id" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "agencyId" TEXT,
    "subAccountId" TEXT,
    "customerId" TEXT,
    "subscriptionId" TEXT,
    "planPriceId" TEXT,
    "planKey" TEXT,
    "addonPriceIds" JSONB,
    "addonKeys" JSONB,
    "isTrialing" BOOLEAN NOT NULL DEFAULT false,
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntitlementSnapshot" (
    "id" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "entitlements" JSONB NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT NOT NULL DEFAULT 'system',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntitlementSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionItem" (
    "id" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "stripeSubscriptionItemId" TEXT NOT NULL,
    "kind" "SubscriptionItemKind" NOT NULL,
    "priceId" TEXT NOT NULL,
    "quantity" INTEGER,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditGrantCursor" (
    "id" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "lastGrantedAt" TIMESTAMP(3),
    "nextGrantAt" TIMESTAMP(3),
    "lastInvoiceId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditGrantCursor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessContextSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "scope" "AccessContextScope" NOT NULL DEFAULT 'AGENCY',
    "roleId" TEXT,
    "permissionKeys" JSONB NOT NULL,
    "permissionHash" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessContextSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavProfileSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavProfileSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."ApPayment" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "subAccountId" TEXT,
    "paymentNumber" TEXT NOT NULL,
    "reference" TEXT,
    "vendorId" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" "finance"."PaymentMethod" NOT NULL,
    "status" "finance"."ApPaymentStatus" NOT NULL DEFAULT 'DRAFT',
    "currencyCode" TEXT NOT NULL DEFAULT 'MYR',
    "amount" DECIMAL(18,6) NOT NULL,
    "amountBase" DECIMAL(18,6),
    "exchangeRate" DECIMAL(18,6) NOT NULL DEFAULT 1,
    "exchangeDifference" DECIMAL(18,6),
    "bankAccountId" TEXT,
    "bankName" TEXT,
    "bankAccount" TEXT,
    "bankReference" TEXT,
    "submittedAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectionReason" TEXT,
    "processedAt" TIMESTAMP(3),
    "processedBy" TEXT,
    "voidedAt" TIMESTAMP(3),
    "voidedBy" TEXT,
    "voidReason" TEXT,
    "journalEntryId" TEXT,
    "clearingDocumentNumber" TEXT,
    "externalRefs" JSONB,
    "metadata" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "ApPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."ApPaymentAllocation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "openItemId" TEXT,
    "invoiceNumber" TEXT,
    "allocatedAmount" DECIMAL(18,6) NOT NULL,
    "allocatedAmountBase" DECIMAL(18,6),
    "exchangeDifference" DECIMAL(18,6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApPaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."ArReceipt" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "subAccountId" TEXT,
    "receiptNumber" TEXT NOT NULL,
    "reference" TEXT,
    "customerId" TEXT NOT NULL,
    "receiptDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" "finance"."PaymentMethod" NOT NULL,
    "status" "finance"."ArReceiptStatus" NOT NULL DEFAULT 'DRAFT',
    "currencyCode" TEXT NOT NULL DEFAULT 'MYR',
    "amount" DECIMAL(18,6) NOT NULL,
    "amountBase" DECIMAL(18,6),
    "exchangeRate" DECIMAL(18,6) NOT NULL DEFAULT 1,
    "exchangeDifference" DECIMAL(18,6),
    "depositBankAccountId" TEXT,
    "bankName" TEXT,
    "bankReference" TEXT,
    "checkNumber" TEXT,
    "submittedAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectionReason" TEXT,
    "depositedAt" TIMESTAMP(3),
    "depositedBy" TEXT,
    "clearedAt" TIMESTAMP(3),
    "clearedBy" TEXT,
    "bouncedAt" TIMESTAMP(3),
    "bouncedBy" TEXT,
    "bounceReason" TEXT,
    "voidedAt" TIMESTAMP(3),
    "voidedBy" TEXT,
    "voidReason" TEXT,
    "journalEntryId" TEXT,
    "clearingDocumentNumber" TEXT,
    "externalRefs" JSONB,
    "metadata" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "ArReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."ArReceiptAllocation" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "openItemId" TEXT,
    "invoiceNumber" TEXT,
    "allocatedAmount" DECIMAL(18,6) NOT NULL,
    "allocatedAmountBase" DECIMAL(18,6),
    "exchangeDifference" DECIMAL(18,6),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArReceiptAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebhookEvent_eventType_idx" ON "WebhookEvent"("eventType");

-- CreateIndex
CREATE INDEX "WebhookEvent_status_idx" ON "WebhookEvent"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_provider_eventId_key" ON "WebhookEvent"("provider", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "BillingState_scopeKey_key" ON "BillingState"("scopeKey");

-- CreateIndex
CREATE INDEX "BillingState_agencyId_idx" ON "BillingState"("agencyId");

-- CreateIndex
CREATE INDEX "BillingState_subAccountId_idx" ON "BillingState"("subAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "EntitlementSnapshot_scopeKey_key" ON "EntitlementSnapshot"("scopeKey");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionItem_stripeSubscriptionItemId_key" ON "SubscriptionItem"("stripeSubscriptionItemId");

-- CreateIndex
CREATE INDEX "SubscriptionItem_scopeKey_idx" ON "SubscriptionItem"("scopeKey");

-- CreateIndex
CREATE INDEX "SubscriptionItem_stripeSubscriptionId_idx" ON "SubscriptionItem"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionItem_kind_idx" ON "SubscriptionItem"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "CreditGrantCursor_scopeKey_key" ON "CreditGrantCursor"("scopeKey");

-- CreateIndex
CREATE INDEX "AccessContextSnapshot_scopeKey_idx" ON "AccessContextSnapshot"("scopeKey");

-- CreateIndex
CREATE INDEX "AccessContextSnapshot_userId_idx" ON "AccessContextSnapshot"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AccessContextSnapshot_userId_scopeKey_key" ON "AccessContextSnapshot"("userId", "scopeKey");

-- CreateIndex
CREATE UNIQUE INDEX "NavProfileSnapshot_userId_key" ON "NavProfileSnapshot"("userId");

-- CreateIndex
CREATE INDEX "ApPayment_agencyId_status_idx" ON "finance"."ApPayment"("agencyId", "status");

-- CreateIndex
CREATE INDEX "ApPayment_vendorId_idx" ON "finance"."ApPayment"("vendorId");

-- CreateIndex
CREATE INDEX "ApPayment_paymentDate_idx" ON "finance"."ApPayment"("paymentDate");

-- CreateIndex
CREATE UNIQUE INDEX "ApPayment_agencyId_paymentNumber_key" ON "finance"."ApPayment"("agencyId", "paymentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ApPayment_subAccountId_paymentNumber_key" ON "finance"."ApPayment"("subAccountId", "paymentNumber");

-- CreateIndex
CREATE INDEX "ApPaymentAllocation_paymentId_idx" ON "finance"."ApPaymentAllocation"("paymentId");

-- CreateIndex
CREATE INDEX "ApPaymentAllocation_openItemId_idx" ON "finance"."ApPaymentAllocation"("openItemId");

-- CreateIndex
CREATE INDEX "ArReceipt_agencyId_status_idx" ON "finance"."ArReceipt"("agencyId", "status");

-- CreateIndex
CREATE INDEX "ArReceipt_customerId_idx" ON "finance"."ArReceipt"("customerId");

-- CreateIndex
CREATE INDEX "ArReceipt_receiptDate_idx" ON "finance"."ArReceipt"("receiptDate");

-- CreateIndex
CREATE UNIQUE INDEX "ArReceipt_agencyId_receiptNumber_key" ON "finance"."ArReceipt"("agencyId", "receiptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ArReceipt_subAccountId_receiptNumber_key" ON "finance"."ArReceipt"("subAccountId", "receiptNumber");

-- CreateIndex
CREATE INDEX "ArReceiptAllocation_receiptId_idx" ON "finance"."ArReceiptAllocation"("receiptId");

-- CreateIndex
CREATE INDEX "ArReceiptAllocation_openItemId_idx" ON "finance"."ArReceiptAllocation"("openItemId");

-- CreateIndex
CREATE INDEX "AddOns_priceId_idx" ON "AddOns"("priceId");

-- CreateIndex
CREATE UNIQUE INDEX "AddOns_agencyId_priceId_key" ON "AddOns"("agencyId", "priceId");

-- AddForeignKey
ALTER TABLE "finance"."ApPayment" ADD CONSTRAINT "ApPayment_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ApPayment" ADD CONSTRAINT "ApPayment_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ApPayment" ADD CONSTRAINT "ApPayment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "finance"."Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ApPayment" ADD CONSTRAINT "ApPayment_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "finance"."JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ApPaymentAllocation" ADD CONSTRAINT "ApPaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "finance"."ApPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ApPaymentAllocation" ADD CONSTRAINT "ApPaymentAllocation_openItemId_fkey" FOREIGN KEY ("openItemId") REFERENCES "finance"."OpenItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ArReceipt" ADD CONSTRAINT "ArReceipt_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ArReceipt" ADD CONSTRAINT "ArReceipt_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ArReceipt" ADD CONSTRAINT "ArReceipt_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "finance"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ArReceipt" ADD CONSTRAINT "ArReceipt_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "finance"."JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ArReceiptAllocation" ADD CONSTRAINT "ArReceiptAllocation_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "finance"."ArReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."ArReceiptAllocation" ADD CONSTRAINT "ArReceiptAllocation_openItemId_fkey" FOREIGN KEY ("openItemId") REFERENCES "finance"."OpenItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
