-- CreateEnum
CREATE TYPE "finance"."AutomationCategory" AS ENUM ('FOREX', 'DISCREPANCY', 'OPERATIONS', 'CLEARING', 'TAX', 'INVENTORY');

-- CreateEnum
CREATE TYPE "finance"."ConnectorType" AS ENUM ('INTERNAL_MODULE', 'EXCHANGE_RATE', 'ERP', 'BANK', 'PAYMENT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "finance"."ConnectorHealth" AS ENUM ('HEALTHY', 'DEGRADED', 'ERROR', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "finance"."FanoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'PARTIAL', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "TemplateCategory" AS ENUM ('CHART_OF_ACCOUNTS', 'JOURNAL_UPLOAD', 'POSTING_RULES', 'REPORT_LAYOUT', 'TAX_CONFIGURATION', 'INTEGRATION_MAPPING', 'INDUSTRY_SETUP');

-- CreateEnum
CREATE TYPE "TemplateSource" AS ENUM ('SYSTEM', 'CUSTOM');

-- CreateEnum
CREATE TYPE "finance"."UploadStatus" AS ENUM ('PENDING', 'VALIDATING', 'VALIDATED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "finance"."AutomationAccountMapping" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "subAccountId" TEXT,
    "category" "finance"."AutomationCategory" NOT NULL,
    "subcategory" TEXT NOT NULL,
    "debitAccountId" TEXT NOT NULL,
    "creditAccountId" TEXT NOT NULL,
    "tolerance" DECIMAL(18,4),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "templateId" TEXT,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "AutomationAccountMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."IntegrationConnector" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "connectorType" "finance"."ConnectorType" NOT NULL,
    "name" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "credentials" TEXT,
    "fieldMappings" JSONB NOT NULL DEFAULT '[]',
    "lastSync" TIMESTAMP(3),
    "lastError" TEXT,
    "healthStatus" "finance"."ConnectorHealth" NOT NULL DEFAULT 'UNKNOWN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "IntegrationConnector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."FanoutLog" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "connectorId" TEXT,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "sourceModule" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "status" "finance"."FanoutStatus" NOT NULL DEFAULT 'PENDING',
    "entriesCreated" INTEGER NOT NULL DEFAULT 0,
    "journalEntryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "errorMessage" TEXT,
    "errorDetails" JSONB,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastRetry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "FanoutLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "category" "TemplateCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "source" "TemplateSource" NOT NULL DEFAULT 'CUSTOM',
    "schema" JSONB NOT NULL,
    "data" JSONB,
    "requiredEntitlements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."JournalUploadBatch" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "subAccountId" TEXT,
    "filename" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "templateId" TEXT,
    "status" "finance"."UploadStatus" NOT NULL DEFAULT 'PENDING',
    "validRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "validationErrors" JSONB,
    "journalEntryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "JournalUploadBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "finance"."ExchangeRateCache" (
    "id" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL,
    "targetCurrency" TEXT NOT NULL,
    "rateDate" DATE NOT NULL,
    "rate" DECIMAL(18,10) NOT NULL,
    "inverseRate" DECIMAL(18,10) NOT NULL,
    "provider" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeRateCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AutomationAccountMapping_agencyId_idx" ON "finance"."AutomationAccountMapping"("agencyId");

-- CreateIndex
CREATE INDEX "AutomationAccountMapping_subAccountId_idx" ON "finance"."AutomationAccountMapping"("subAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "AutomationAccountMapping_agencyId_subAccountId_category_sub_key" ON "finance"."AutomationAccountMapping"("agencyId", "subAccountId", "category", "subcategory");

-- CreateIndex
CREATE INDEX "IntegrationConnector_agencyId_idx" ON "finance"."IntegrationConnector"("agencyId");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationConnector_agencyId_connectorId_key" ON "finance"."IntegrationConnector"("agencyId", "connectorId");

-- CreateIndex
CREATE INDEX "FanoutLog_agencyId_idx" ON "finance"."FanoutLog"("agencyId");

-- CreateIndex
CREATE INDEX "FanoutLog_eventType_idx" ON "finance"."FanoutLog"("eventType");

-- CreateIndex
CREATE INDEX "FanoutLog_status_idx" ON "finance"."FanoutLog"("status");

-- CreateIndex
CREATE INDEX "FanoutLog_entityType_entityId_idx" ON "finance"."FanoutLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Template_agencyId_idx" ON "Template"("agencyId");

-- CreateIndex
CREATE INDEX "Template_category_idx" ON "Template"("category");

-- CreateIndex
CREATE INDEX "Template_source_idx" ON "Template"("source");

-- CreateIndex
CREATE INDEX "JournalUploadBatch_agencyId_idx" ON "finance"."JournalUploadBatch"("agencyId");

-- CreateIndex
CREATE INDEX "JournalUploadBatch_status_idx" ON "finance"."JournalUploadBatch"("status");

-- CreateIndex
CREATE INDEX "ExchangeRateCache_baseCurrency_targetCurrency_idx" ON "finance"."ExchangeRateCache"("baseCurrency", "targetCurrency");

-- CreateIndex
CREATE INDEX "ExchangeRateCache_rateDate_idx" ON "finance"."ExchangeRateCache"("rateDate");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRateCache_baseCurrency_targetCurrency_rateDate_prov_key" ON "finance"."ExchangeRateCache"("baseCurrency", "targetCurrency", "rateDate", "provider");

-- AddForeignKey
ALTER TABLE "finance"."AutomationAccountMapping" ADD CONSTRAINT "AutomationAccountMapping_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."AutomationAccountMapping" ADD CONSTRAINT "AutomationAccountMapping_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."AutomationAccountMapping" ADD CONSTRAINT "AutomationAccountMapping_debitAccountId_fkey" FOREIGN KEY ("debitAccountId") REFERENCES "finance"."ChartOfAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."AutomationAccountMapping" ADD CONSTRAINT "AutomationAccountMapping_creditAccountId_fkey" FOREIGN KEY ("creditAccountId") REFERENCES "finance"."ChartOfAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."IntegrationConnector" ADD CONSTRAINT "IntegrationConnector_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."FanoutLog" ADD CONSTRAINT "FanoutLog_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."FanoutLog" ADD CONSTRAINT "FanoutLog_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "finance"."IntegrationConnector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."JournalUploadBatch" ADD CONSTRAINT "JournalUploadBatch_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finance"."JournalUploadBatch" ADD CONSTRAINT "JournalUploadBatch_subAccountId_fkey" FOREIGN KEY ("subAccountId") REFERENCES "SubAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
