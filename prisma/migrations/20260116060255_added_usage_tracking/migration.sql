/*
  Warnings:

  - You are about to drop the column `limit` on the `PlanFeature` table. All the data in the column will be lost.
  - You are about to drop the column `overage` on the `PlanFeature` table. All the data in the column will be lost.
  - The `period` column on the `UsageTracking` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[scope,agencyId,subAccountId,featureKey,periodStart]` on the table `UsageTracking` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `EntitlementFeature` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `valueType` on the `EntitlementFeature` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `periodEnd` on table `UsageTracking` required. This step will fail if there are existing NULL values in that column.

*/
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

-- DropIndex
DROP INDEX "UsageTracking_agencyId_featureKey_period_key";

-- AlterTable
ALTER TABLE "EntitlementFeature" ADD COLUMN     "aggregation" "MeterAggregation" NOT NULL DEFAULT 'COUNT',
ADD COLUMN     "creditEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "creditExpires" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "creditPriority" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "creditUnit" TEXT,
ADD COLUMN     "metering" "MeteringType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "period" "UsagePeriod",
ADD COLUMN     "scope" "MeteringScope" NOT NULL DEFAULT 'AGENCY',
ADD COLUMN     "stripeMeterEventName" TEXT,
ADD COLUMN     "stripeMeterId" TEXT,
ADD COLUMN     "stripeTopUpPriceId" TEXT,
ADD COLUMN     "stripeUsagePriceId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "valueType",
ADD COLUMN     "valueType" "FeatureValueType" NOT NULL;

-- AlterTable
ALTER TABLE "PlanFeature" DROP COLUMN "limit",
DROP COLUMN "overage",
ADD COLUMN     "enforcement" "LimitEnforcement" NOT NULL DEFAULT 'HARD',
ADD COLUMN     "includedDec" DECIMAL(18,6),
ADD COLUMN     "includedInt" INTEGER,
ADD COLUMN     "isEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isUnlimited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxDec" DECIMAL(18,6),
ADD COLUMN     "maxInt" INTEGER,
ADD COLUMN     "overageMode" "OverageMode" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "recurringCreditGrantDec" DECIMAL(18,6),
ADD COLUMN     "recurringCreditGrantInt" INTEGER,
ADD COLUMN     "rolloverCredits" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeOveragePriceId" TEXT,
ADD COLUMN     "topUpEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "topUpPriceId" TEXT;

-- AlterTable
ALTER TABLE "UsageTracking" ADD COLUMN     "lastEventAt" TIMESTAMP(3),
ADD COLUMN     "scope" "MeteringScope" NOT NULL DEFAULT 'AGENCY',
ADD COLUMN     "subAccountId" TEXT,
ALTER COLUMN "currentUsage" SET DEFAULT 0,
ALTER COLUMN "currentUsage" SET DATA TYPE DECIMAL(18,6),
DROP COLUMN "period",
ADD COLUMN     "period" "UsagePeriod" NOT NULL DEFAULT 'MONTHLY',
ALTER COLUMN "periodStart" DROP DEFAULT,
ALTER COLUMN "periodEnd" SET NOT NULL;

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
CREATE INDEX "EntitlementFeature_valueType_idx" ON "EntitlementFeature"("valueType");

-- CreateIndex
CREATE INDEX "EntitlementFeature_metering_idx" ON "EntitlementFeature"("metering");

-- CreateIndex
CREATE INDEX "EntitlementFeature_scope_idx" ON "EntitlementFeature"("scope");

-- CreateIndex
CREATE INDEX "PlanFeature_overageMode_idx" ON "PlanFeature"("overageMode");

-- CreateIndex
CREATE INDEX "UsageTracking_subAccountId_idx" ON "UsageTracking"("subAccountId");

-- CreateIndex
CREATE INDEX "UsageTracking_scope_idx" ON "UsageTracking"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "UsageTracking_scope_agencyId_subAccountId_featureKey_period_key" ON "UsageTracking"("scope", "agencyId", "subAccountId", "featureKey", "periodStart");

-- AddForeignKey
ALTER TABLE "EntitlementOverride" ADD CONSTRAINT "EntitlementOverride_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntitlementOverride" ADD CONSTRAINT "EntitlementOverride_featureKey_fkey" FOREIGN KEY ("featureKey") REFERENCES "EntitlementFeature"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeatureCreditBalance" ADD CONSTRAINT "FeatureCreditBalance_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;
