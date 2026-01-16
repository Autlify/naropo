# PLAN: Enterprise FI-GL (General Ledger) Module

> **Version:** 1.0.0  
> **Created:** 2026-01-16  
> **Status:** Implementation Ready  
> **Dependencies:** Prisma, Next.js 16, React 19, TanStack Table, react-pdf, xlsx

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Database Schema](#3-database-schema)
4. [RBAC Permissions](#4-rbac-permissions)
5. [Validation Schemas](#5-validation-schemas)
6. [Server Actions](#6-server-actions)
7. [API Routes](#7-api-routes)
8. [UI Components & Routes](#8-ui-components--routes)
9. [Seed Scripts](#9-seed-scripts)
10. [Implementation Checklist](#10-implementation-checklist)

---

## 1. Executive Summary

### 1.1 Scope

Build an enterprise-grade Financial General Ledger (FI-GL) module that provides:

- **Chart of Accounts (COA)** - Hierarchical account structure with 7 levels, control accounts, system accounts
- **Journal Entries** - Double-entry bookkeeping with approval workflow
- **Financial Periods** - Period management with open/close/lock lifecycle
- **Multi-Currency** - Exchange rates, revaluation, realized/unrealized gains
- **Reconciliation** - Account matching, discrepancy resolution
- **Consolidation** - Agency-level rollup with intercompany eliminations and ownership %
- **Financial Statements** - Balance Sheet, P&L, Cash Flow with PDF/Excel/CSV export
- **Audit Trail** - Immutable transaction logs for SOX/IFRS compliance

### 1.2 Tech Stack Alignment

Following existing codebase patterns:

| Component | Technology | Pattern Source |
|-----------|------------|----------------|
| Database | Prisma + PostgreSQL | `prisma/schema.prisma` |
| Auth | NextAuth.js | `src/auth.ts` |
| RBAC | Custom permission system | `src/lib/iam/authz/*` |
| Forms | react-hook-form + Zod | `src/components/forms/*` |
| Tables | TanStack Table | `src/app/(main)/agency/[agencyId]/team/data-table.tsx` |
| UI | shadcn/ui + Tailwind | `src/components/ui/*` |
| PDF Export | react-pdf | New dependency |
| Excel Export | xlsx | New dependency |

### 1.3 Multi-Tenancy Model

```
Agency (Parent Tenant)
├── GLConfiguration (1:1)
├── ChartOfAccount[] (Agency-level COA)
├── FinancialPeriod[] (Agency periods)
├── ConsolidationSnapshot[] (Consolidated statements)
└── SubAccount[] (Child Tenants)
    ├── ChartOfAccount[] (SubAccount-level COA)
    ├── JournalEntry[] (Transactions)
    ├── AccountBalance[] (Period balances)
    └── FinancialPeriod[] (SubAccount periods - can differ from Agency)
```

---

## 2. Architecture Overview

### 2.1 Module Structure

```
src/
├── lib/
│   ├── finance/
│   │   └── gl/
│   │       ├── actions/
│   │       │   ├── chart-of-accounts.ts
│   │       │   ├── journal-entries.ts
│   │       │   ├── transactions.ts
│   │       │   ├── reconciliation.ts
│   │       │   ├── balances.ts
│   │       │   ├── periods.ts
│   │       │   ├── currency.ts
│   │       │   ├── consolidation.ts
│   │       │   ├── reports.ts
│   │       │   ├── posting.ts
│   │       │   └── audit.ts
│   │       ├── utils/
│   │       │   ├── decimal.ts
│   │       │   ├── currency-precision.ts
│   │       │   ├── period-utils.ts
│   │       │   └── hierarchy-utils.ts
│   │       └── constants.ts
│   └── schemas/
│       └── finance/
│           └── gl/
│               ├── chart-of-accounts.ts
│               ├── journal-entry.ts
│               ├── transaction.ts
│               ├── reconciliation.ts
│               ├── period.ts
│               ├── currency.ts
│               ├── consolidation.ts
│               └── report.ts
├── app/
│   └── (main)/
│       └── agency/
│           └── [agencyId]/
│               └── finance/
│                   └── gl/
│                       ├── layout.tsx
│                       ├── page.tsx (Dashboard)
│                       ├── chart-of-accounts/
│                       ├── journal-entries/
│                       ├── transactions/
│                       ├── reconciliation/
│                       ├── balances/
│                       ├── periods/
│                       ├── currency/
│                       ├── consolidation/
│                       ├── reports/
│                       ├── audit/
│                       └── settings/
│       └── subaccount/
│           └── [subaccountId]/
│               └── finance/
│                   └── gl/
│                       └── ... (similar structure, scoped to subaccount)
scripts/
├── seed-gl-system.ts
├── seed-coa-templates.ts
└── seed-gl-permissions.ts
```

### 2.2 Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                               │
│  Forms → Validation (Zod) → Server Actions → Database (Prisma)      │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      PERMISSION CHECK                                │
│  hasAgencyPermission() / hasSubAccountPermission()                  │
│  finance.gl.{resource}.{action}                                     │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC                                  │
│  Double-entry validation │ Period validation │ Balance updates      │
│  Currency conversion │ Approval workflow │ Audit logging            │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATABASE (Prisma)                               │
│  Transactions │ Journal Entries │ Account Balances │ Audit Trail    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

### 3.1 Enums

Add to `prisma/schema.prisma`:

```prisma
// ========================================
// FI-GL ENUMS
// ========================================

enum AccountType {
  ASSET
  LIABILITY
  EQUITY
  REVENUE
  EXPENSE
}

enum AccountCategory {
  // Assets
  CURRENT_ASSET
  FIXED_ASSET
  OTHER_ASSET
  // Liabilities
  CURRENT_LIABILITY
  LONG_TERM_LIABILITY
  // Equity
  CAPITAL
  RETAINED_EARNINGS_CAT
  // Revenue
  OPERATING_REVENUE
  OTHER_REVENUE
  // Expense
  COST_OF_GOODS_SOLD
  OPERATING_EXPENSE
  OTHER_EXPENSE
}

enum SubledgerType {
  NONE
  ACCOUNTS_RECEIVABLE
  ACCOUNTS_PAYABLE
  INVENTORY
  FIXED_ASSETS
  PAYROLL
  BANK
}

enum SystemAccountType {
  RETAINED_EARNINGS
  OPENING_BALANCE_CONTROL
  SUSPENSE
  ROUNDING_DIFFERENCE
  INTERCOMPANY_CLEARING
  PAYROLL_CLEARING
  PAYMENT_CLEARING
  BANK_RECONCILIATION
  FOREIGN_EXCHANGE_GAIN
  FOREIGN_EXCHANGE_LOSS
  UNREALIZED_FX_GAIN
  UNREALIZED_FX_LOSS
  CONSOLIDATION_ADJUSTMENT
  ELIMINATION_ACCOUNT
}

enum PeriodType {
  MONTH
  QUARTER
  HALF_YEAR
  YEAR
  CUSTOM
}

enum PeriodStatus {
  FUTURE
  OPEN
  CLOSED
  LOCKED
}

enum JournalEntryStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  REJECTED
  POSTED
  REVERSED
  VOIDED
}

enum JournalEntryType {
  NORMAL
  OPENING
  CLOSING
  CARRY_FORWARD
  BROUGHT_FORWARD
  YEAR_END_CLOSING
  ADJUSTMENT
  REVERSAL
  CONSOLIDATION
  ELIMINATION
}

enum BalanceType {
  NORMAL
  OPENING
  CLOSING
  ADJUSTMENT
  REVERSAL
}

enum SourceModule {
  MANUAL
  INVOICE
  PAYMENT
  EXPENSE
  PAYROLL
  ASSET
  INVENTORY
  BANK
  ADJUSTMENT
  CONSOLIDATION
  INTERCOMPANY
  REVERSAL
  YEAR_END
  OPENING_BALANCE
}

enum ReconciliationStatus {
  IN_PROGRESS
  PENDING_APPROVAL
  APPROVED
  REJECTED
  CLOSED
}

enum ReconciliationItemStatus {
  UNMATCHED
  MATCHED
  EXCLUDED
  DISCREPANCY
}

enum ConsolidationMethod {
  FULL
  PROPORTIONAL
  EQUITY
}

enum ConsolidationStatus {
  DRAFT
  IN_PROGRESS
  PENDING_APPROVAL
  APPROVED
  REJECTED
  SUPERSEDED
}

enum Industry {
  RETAIL
  MANUFACTURING
  SAAS
  ECOMMERCE
  CONSULTING
  REAL_ESTATE
  HOSPITALITY
  HEALTHCARE
  CONSTRUCTION
  NON_PROFIT
  EDUCATION
  AGRICULTURE
  GENERIC
}

enum ReportType {
  BALANCE_SHEET
  INCOME_STATEMENT
  CASH_FLOW
  TRIAL_BALANCE
  GENERAL_LEDGER
  SUBSIDIARY_LEDGER
  ACCOUNT_BALANCE
  CONSOLIDATED_BALANCE_SHEET
  CONSOLIDATED_INCOME_STATEMENT
  CONSOLIDATED_CASH_FLOW
  INTERCOMPANY_REPORT
  CUSTOM
}

enum ReportFormat {
  PDF
  EXCEL
  CSV
  JSON
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  SUBMIT
  APPROVE
  REJECT
  POST
  REVERSE
  VOID
  CLOSE
  LOCK
  CONSOLIDATE
  ELIMINATE
}
```

### 3.2 Core GL Models

```prisma
// ========================================
// FI-GL CONFIGURATION
// ========================================

model GLConfiguration {
  id                    String   @id @default(uuid())
  
  agencyId              String   @unique
  agency                Agency   @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  
  // General settings
  baseCurrency          String   @default("USD")
  fiscalYearEnd         String   @default("12-31") // MM-DD format
  fiscalYearStart       String   @default("01-01") // MM-DD format
  useControlAccounts    Boolean  @default(true)
  
  // Posting settings
  requireApproval       Boolean  @default(true)
  approvalThreshold     Decimal? @db.Decimal(18, 6) // Amount above which requires approval
  autoPostingEnabled    Boolean  @default(false)
  allowFuturePeriodPost Boolean  @default(false)
  allowClosedPeriodPost Boolean  @default(false)
  
  // Consolidation settings
  consolidationEnabled  Boolean  @default(false)
  consolidationMethod   ConsolidationMethod @default(FULL)
  eliminateIntercompany Boolean  @default(true)
  
  // Period settings
  autoCreatePeriods     Boolean  @default(true)
  periodLockDays        Int      @default(5) // Days after period end to auto-lock
  
  // Number formats
  accountCodeFormat     String   @default("####-####")
  accountCodeLength     Int      @default(8)
  accountCodeSeparator  String   @default("-")
  
  // Integrations
  erpIntegrationEnabled Boolean  @default(false)
  erpSystemType         String?
  erpApiUrl             String?
  erpApiKey             String?  @db.Text
  
  // Audit retention
  retainAuditDays       Int      @default(2555) // ~7 years
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  updatedBy             String?
  
  @@index([agencyId])
}

// ========================================
// CHART OF ACCOUNTS
// ========================================

model ChartOfAccount {
  id                    String   @id @default(uuid())
  
  // Multi-tenant scope
  agencyId              String?
  subAccountId          String?
  agency                Agency?   @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  subAccount            SubAccount? @relation(fields: [subAccountId], references: [id], onDelete: Cascade)
  
  // Account identification
  code                  String
  name                  String
  description           String?  @db.Text
  
  // Hierarchy (hybrid: parentId + materialized path + level)
  parentAccountId       String?
  parentAccount         ChartOfAccount? @relation("AccountHierarchy", fields: [parentAccountId], references: [id], onDelete: Restrict)
  childAccounts         ChartOfAccount[] @relation("AccountHierarchy")
  path                  String   @default("/") // Materialized path: "/1/12/123/"
  level                 Int      @default(0)   // 0-based depth (max 7)
  
  // Classification
  accountType           AccountType
  category              AccountCategory?
  subcategory           String?
  
  // Control account settings
  isControlAccount      Boolean  @default(false)
  subledgerType         SubledgerType @default(NONE)
  controlAccountId      String?
  controlAccount        ChartOfAccount? @relation("ControlAccountLink", fields: [controlAccountId], references: [id])
  subledgerAccounts     ChartOfAccount[] @relation("ControlAccountLink")
  
  // System account settings
  isSystemAccount       Boolean  @default(false)
  isSystemManaged       Boolean  @default(false)
  systemAccountType     SystemAccountType?
  
  // Special account flags
  isClearingAccount     Boolean  @default(false)
  isSuspenseAccount     Boolean  @default(false)
  isRetainedEarnings    Boolean  @default(false)
  isOpeningBalControl   Boolean  @default(false)
  
  // Posting behavior
  allowManualPosting    Boolean  @default(true)
  requireApproval       Boolean  @default(false)
  isPostingAccount      Boolean  @default(true) // Can post to this account (leaf node)
  
  // Consolidation settings
  isConsolidationEnabled Boolean @default(false)
  consolidationAccountCode String? // Maps to Agency Group COA
  
  // Currency settings
  currencyCode          String?  // If null, uses base currency
  isMultiCurrency       Boolean  @default(false)
  
  // Status
  isActive              Boolean  @default(true)
  isArchived            Boolean  @default(false)
  archivedAt            DateTime?
  archivedBy            String?
  
  // Normal balance (for display/validation)
  normalBalance         String   @default("DEBIT") // DEBIT or CREDIT
  
  // Sort order within parent
  sortOrder             Int      @default(0)
  
  // Audit fields
  createdAt             DateTime @default(now())
  createdBy             String
  updatedAt             DateTime @updatedAt
  updatedBy             String?
  
  // Relations
  journalEntryLines     JournalEntryLine[]
  accountBalances       AccountBalance[]
  reconciliations       Reconciliation[]
  postingRuleDebits     PostingRule[] @relation("PostingRuleDebit")
  postingRuleCredits    PostingRule[] @relation("PostingRuleCredit")
  
  @@unique([agencyId, code])
  @@unique([subAccountId, code])
  @@index([agencyId, accountType])
  @@index([agencyId, isActive])
  @@index([agencyId, path])
  @@index([agencyId, level])
  @@index([subAccountId, accountType])
  @@index([subAccountId, isActive])
  @@index([subAccountId, path])
  @@index([parentAccountId])
  @@index([controlAccountId])
  @@index([isControlAccount])
  @@index([isSystemAccount])
  @@index([isConsolidationEnabled])
}

// ========================================
// AGENCY GROUP COA (For Consolidation)
// ========================================

model AgencyGroupCOA {
  id                    String   @id @default(uuid())
  
  agencyId              String
  agency                Agency   @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  
  // Account identification
  code                  String
  name                  String
  description           String?  @db.Text
  
  // Classification
  accountType           AccountType
  category              AccountCategory?
  
  // Hierarchy
  parentId              String?
  parent                AgencyGroupCOA? @relation("GroupCOAHierarchy", fields: [parentId], references: [id], onDelete: Restrict)
  children              AgencyGroupCOA[] @relation("GroupCOAHierarchy")
  path                  String   @default("/")
  level                 Int      @default(0)
  
  // Status
  isActive              Boolean  @default(true)
  sortOrder             Int      @default(0)
  
  // Audit
  createdAt             DateTime @default(now())
  createdBy             String
  updatedAt             DateTime @updatedAt
  updatedBy             String?
  
  // Relations
  consolidationMappings ConsolidationMapping[]
  consolidatedBalances  ConsolidatedBalance[]
  worksheetLines        ConsolidationWorksheetLine[]
  
  @@unique([agencyId, code])
  @@index([agencyId, accountType])
  @@index([agencyId, isActive])
  @@index([parentId])
}

// ========================================
// CONSOLIDATION MAPPING
// ========================================

model ConsolidationMapping {
  id                    String   @id @default(uuid())
  
  agencyId              String
  agency                Agency   @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  
  // SubAccount COA → Agency Group COA mapping
  subAccountId          String
  subAccount            SubAccount @relation(fields: [subAccountId], references: [id], onDelete: Cascade)
  
  subAccountCOACode     String   // Source account code from subaccount
  groupCOAId            String   // Target Agency Group COA
  groupCOA              AgencyGroupCOA @relation(fields: [groupCOAId], references: [id], onDelete: Cascade)
  
  // Mapping rules
  mappingPercentage     Decimal  @default(100) @db.Decimal(5, 2) // For proportional consolidation
  isElimination         Boolean  @default(false) // Intercompany elimination account
  eliminationPairId     String?  // Linked elimination account in other subaccount
  
  // Status
  isActive              Boolean  @default(true)
  
  // Audit
  createdAt             DateTime @default(now())
  createdBy             String
  updatedAt             DateTime @updatedAt
  updatedBy             String?
  
  @@unique([agencyId, subAccountId, subAccountCOACode])
  @@index([agencyId])
  @@index([subAccountId])
  @@index([groupCOAId])
  @@index([isElimination])
}

// ========================================
// FINANCIAL PERIODS
// ========================================

model FinancialPeriod {
  id                    String   @id @default(uuid())
  
  // Multi-tenant scope (can be Agency or SubAccount level)
  agencyId              String?
  subAccountId          String?
  agency                Agency?   @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  subAccount            SubAccount? @relation(fields: [subAccountId], references: [id], onDelete: Cascade)
  
  // Period identification
  name                  String   // "January 2026", "Q1 FY2026"
  shortName             String?  // "Jan-26", "Q1-26"
  periodType            PeriodType
  fiscalYear            Int
  fiscalPeriod          Int      // 1-12 for months, 1-4 for quarters
  
  // Date range
  startDate             DateTime
  endDate               DateTime
  
  // Status workflow
  status                PeriodStatus @default(FUTURE)
  
  // Workflow metadata
  openedAt              DateTime?
  openedBy              String?
  closedAt              DateTime?
  closedBy              String?
  lockedAt              DateTime?
  lockedBy              String?
  
  // Balance snapshots (JSON for efficiency)
  openingBalances       Json?
  closingBalances       Json?
  
  // Year-end
  isYearEnd             Boolean  @default(false)
  yearEndProcessedAt    DateTime?
  yearEndProcessedBy    String?
  
  // Notes
  notes                 String?  @db.Text
  
  // Audit
  createdAt             DateTime @default(now())
  createdBy             String
  updatedAt             DateTime @updatedAt
  updatedBy             String?
  
  // Relations
  journalEntries        JournalEntry[]
  accountBalances       AccountBalance[]
  reconciliations       Reconciliation[]
  consolidationSnapshots ConsolidationSnapshot[]
  
  @@unique([agencyId, fiscalYear, periodType, fiscalPeriod])
  @@unique([subAccountId, fiscalYear, periodType, fiscalPeriod])
  @@index([agencyId, status])
  @@index([agencyId, fiscalYear])
  @@index([subAccountId, status])
  @@index([subAccountId, fiscalYear])
  @@index([startDate, endDate])
  @@index([status])
}

// ========================================
// JOURNAL ENTRIES
// ========================================

model JournalEntry {
  id                    String   @id @default(uuid())
  
  // Multi-tenant scope
  agencyId              String?
  subAccountId          String?
  agency                Agency?   @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  subAccount            SubAccount? @relation(fields: [subAccountId], references: [id], onDelete: Cascade)
  
  // Entry identification
  entryNumber           String   // Auto-generated: JE-2026-00001
  reference             String?  // External reference
  
  // Period
  periodId              String
  period                FinancialPeriod @relation(fields: [periodId], references: [id])
  entryDate             DateTime
  
  // Type and source
  entryType             JournalEntryType @default(NORMAL)
  sourceModule          SourceModule @default(MANUAL)
  sourceId              String?  // ID of source document
  sourceReference       String?  // Reference number of source
  
  // Posting rule (if auto-generated)
  postingRuleId         String?
  postingRule           PostingRule? @relation(fields: [postingRuleId], references: [id])
  
  // Description
  description           String   @db.Text
  notes                 String?  @db.Text
  
  // Currency
  currencyCode          String   @default("USD")
  exchangeRate          Decimal  @default(1) @db.Decimal(12, 6)
  
  // Totals (denormalized for performance)
  totalDebit            Decimal  @default(0) @db.Decimal(18, 6)
  totalCredit           Decimal  @default(0) @db.Decimal(18, 6)
  totalDebitBase        Decimal  @default(0) @db.Decimal(18, 6) // In base currency
  totalCreditBase       Decimal  @default(0) @db.Decimal(18, 6)
  
  // Status workflow
  status                JournalEntryStatus @default(DRAFT)
  
  // CF/BF tracking
  isCarryForward        Boolean  @default(false)
  isBroughtForward      Boolean  @default(false)
  carryForwardFromId    String?
  carryForwardFrom      JournalEntry? @relation("CarryForwardLink", fields: [carryForwardFromId], references: [id])
  carriedForwardTo      JournalEntry[] @relation("CarryForwardLink")
  
  // Reversal tracking
  isReversal            Boolean  @default(false)
  reversalOfId          String?
  reversalOf            JournalEntry? @relation("ReversalLink", fields: [reversalOfId], references: [id])
  reversedBy            JournalEntry[] @relation("ReversalLink")
  
  // Workflow audit
  submittedAt           DateTime?
  submittedBy           String?
  approvedAt            DateTime?
  approvedBy            String?
  rejectedAt            DateTime?
  rejectedBy            String?
  rejectionReason       String?  @db.Text
  postedAt              DateTime?
  postedBy              String?
  reversedAt            DateTime?
  reversedByUser        String?
  reversalReason        String?  @db.Text
  voidedAt              DateTime?
  voidedBy              String?
  voidReason            String?  @db.Text
  
  // Audit
  createdAt             DateTime @default(now())
  createdBy             String
  updatedAt             DateTime @updatedAt
  updatedBy             String?
  
  // Relations
  lines                 JournalEntryLine[]
  
  @@unique([agencyId, entryNumber])
  @@unique([subAccountId, entryNumber])
  @@index([agencyId, status])
  @@index([agencyId, periodId])
  @@index([agencyId, entryDate])
  @@index([agencyId, entryType])
  @@index([subAccountId, status])
  @@index([subAccountId, periodId])
  @@index([subAccountId, entryDate])
  @@index([sourceModule, sourceId])
  @@index([postingRuleId])
  @@index([status])
  @@index([createdBy])
  @@index([approvedBy])
}

model JournalEntryLine {
  id                    String   @id @default(uuid())
  
  journalEntryId        String
  journalEntry          JournalEntry @relation(fields: [journalEntryId], references: [id], onDelete: Cascade)
  
  // Line number
  lineNumber            Int
  
  // Account
  accountId             String
  account               ChartOfAccount @relation(fields: [accountId], references: [id])
  
  // Description
  description           String?
  
  // Amounts (transaction currency)
  debitAmount           Decimal  @default(0) @db.Decimal(18, 6)
  creditAmount          Decimal  @default(0) @db.Decimal(18, 6)
  
  // Base currency amounts
  debitAmountBase       Decimal  @default(0) @db.Decimal(18, 6)
  creditAmountBase      Decimal  @default(0) @db.Decimal(18, 6)
  
  // Exchange rate (line-level override if different from header)
  exchangeRate          Decimal? @db.Decimal(12, 6)
  
  // Reference fields (for subledger linking)
  subledgerType         SubledgerType @default(NONE)
  subledgerReference    String?  // Customer ID, Vendor ID, etc.
  
  // Tax information
  taxCode               String?
  taxAmount             Decimal? @db.Decimal(18, 6)
  
  // Dimensions (future extensibility)
  dimension1            String?  // Cost center
  dimension2            String?  // Department
  dimension3            String?  // Project
  dimension4            String?  // Custom
  
  // Intercompany
  isIntercompany        Boolean  @default(false)
  intercompanySubAccountId String?
  
  createdAt             DateTime @default(now())
  
  @@index([journalEntryId])
  @@index([accountId])
  @@index([subledgerType, subledgerReference])
  @@index([isIntercompany])
}

// ========================================
// ACCOUNT BALANCES
// ========================================

model AccountBalance {
  id                    String   @id @default(uuid())
  
  // Multi-tenant scope
  agencyId              String?
  subAccountId          String?
  
  // Account and period
  accountId             String
  account               ChartOfAccount @relation(fields: [accountId], references: [id], onDelete: Cascade)
  periodId              String
  period                FinancialPeriod @relation(fields: [periodId], references: [id], onDelete: Cascade)
  
  // Currency
  currencyCode          String   @default("USD")
  
  // Balance components
  openingBalance        Decimal  @default(0) @db.Decimal(18, 6) // BF
  debitMovement         Decimal  @default(0) @db.Decimal(18, 6)
  creditMovement        Decimal  @default(0) @db.Decimal(18, 6)
  closingBalance        Decimal  @default(0) @db.Decimal(18, 6) // CF
  
  // Base currency balances
  openingBalanceBase    Decimal  @default(0) @db.Decimal(18, 6)
  debitMovementBase     Decimal  @default(0) @db.Decimal(18, 6)
  creditMovementBase    Decimal  @default(0) @db.Decimal(18, 6)
  closingBalanceBase    Decimal  @default(0) @db.Decimal(18, 6)
  
  // Balance type
  balanceType           BalanceType @default(NORMAL)
  
  // Transaction count
  transactionCount      Int      @default(0)
  
  // Last recalculation
  lastRecalculatedAt    DateTime?
  
  updatedAt             DateTime @updatedAt
  
  @@unique([accountId, periodId, currencyCode])
  @@index([agencyId, periodId])
  @@index([subAccountId, periodId])
  @@index([accountId])
  @@index([periodId])
}
```

### 3.3 Multi-Currency Models

```prisma
// ========================================
// MULTI-CURRENCY
// ========================================

model Currency {
  id                    String   @id @default(uuid())
  
  code                  String   @unique // ISO 4217: USD, EUR, JPY
  name                  String           // US Dollar, Euro, Japanese Yen
  symbol                String           // $, €, ¥
  decimalPlaces         Int      @default(2) // 0 for JPY, 2 for USD
  
  isActive              Boolean  @default(true)
  isBaseCurrency        Boolean  @default(false)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  exchangeRatesFrom     ExchangeRate[] @relation("FromCurrency")
  exchangeRatesTo       ExchangeRate[] @relation("ToCurrency")
  revaluations          CurrencyRevaluation[]
  
  @@index([isActive])
  @@index([code])
}

model ExchangeRate {
  id                    String   @id @default(uuid())
  
  agencyId              String
  agency                Agency   @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  
  fromCurrencyCode      String
  fromCurrency          Currency @relation("FromCurrency", fields: [fromCurrencyCode], references: [code])
  toCurrencyCode        String
  toCurrency            Currency @relation("ToCurrency", fields: [toCurrencyCode], references: [code])
  
  rate                  Decimal  @db.Decimal(12, 6)
  inverseRate           Decimal  @db.Decimal(12, 6)
  
  effectiveDate         DateTime
  expiryDate            DateTime?
  
  rateType              String   @default("SPOT") // SPOT, AVERAGE, BUDGET
  source                String?  // API source or manual
  
  isActive              Boolean  @default(true)
  
  createdAt             DateTime @default(now())
  createdBy             String
  updatedAt             DateTime @updatedAt
  
  @@unique([agencyId, fromCurrencyCode, toCurrencyCode, effectiveDate, rateType])
  @@index([agencyId, effectiveDate])
  @@index([fromCurrencyCode, toCurrencyCode])
  @@index([effectiveDate])
}

model CurrencyRevaluation {
  id                    String   @id @default(uuid())
  
  agencyId              String?
  subAccountId          String?
  agency                Agency?   @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  subAccount            SubAccount? @relation(fields: [subAccountId], references: [id], onDelete: Cascade)
  
  periodId              String
  currencyCode          String
  currency              Currency @relation(fields: [currencyCode], references: [code])
  
  revaluationDate       DateTime
  exchangeRate          Decimal  @db.Decimal(12, 6)
  previousRate          Decimal  @db.Decimal(12, 6)
  
  // Amounts
  unrealizedGain        Decimal  @default(0) @db.Decimal(18, 6)
  unrealizedLoss        Decimal  @default(0) @db.Decimal(18, 6)
  netGainLoss           Decimal  @default(0) @db.Decimal(18, 6)
  
  // Generated journal entry
  journalEntryId        String?
  
  status                String   @default("DRAFT") // DRAFT, POSTED, REVERSED
  
  createdAt             DateTime @default(now())
  createdBy             String
  postedAt              DateTime?
  postedBy              String?
  
  @@index([agencyId, periodId])
  @@index([subAccountId, periodId])
  @@index([currencyCode])
}
```

### 3.4 Posting Rules & Templates

```prisma
// ========================================
// POSTING RULES & AUTOMATION
// ========================================

model PostingRule {
  id                    String   @id @default(uuid())
  
  // Scope
  agencyId              String?
  subAccountId          String?
  agency                Agency?   @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  subAccount            SubAccount? @relation(fields: [subAccountId], references: [id], onDelete: Cascade)
  
  // Identification
  code                  String
  name                  String
  description           String?  @db.Text
  
  // Source
  sourceModule          SourceModule
  
  // Template accounts
  debitAccountId        String
  debitAccount          ChartOfAccount @relation("PostingRuleDebit", fields: [debitAccountId], references: [id])
  creditAccountId       String
  creditAccount         ChartOfAccount @relation("PostingRuleCredit", fields: [creditAccountId], references: [id])
  
  // Amount calculation
  amountType            String   @default("FULL") // FULL, PERCENTAGE, FIXED
  percentage            Decimal? @db.Decimal(5, 4)
  fixedAmount           Decimal? @db.Decimal(18, 6)
  
  // Conditions (JSON for flexibility)
  conditions            Json?    // { "amountGreaterThan": 1000, "customerType": "VIP" }
  
  // Execution
  priority              Int      @default(0)
  isActive              Boolean  @default(true)
  autoPost              Boolean  @default(false) // Auto-post or create draft
  
  // Audit
  createdAt             DateTime @default(now())
  createdBy             String
  updatedAt             DateTime @updatedAt
  updatedBy             String?
  activatedAt           DateTime?
  activatedBy           String?
  deactivatedAt         DateTime?
  deactivatedBy         String?
  
  journalEntries        JournalEntry[]
  
  @@unique([agencyId, code])
  @@unique([subAccountId, code])
  @@index([agencyId, sourceModule, isActive])
  @@index([subAccountId, sourceModule, isActive])
  @@index([sourceModule])
  @@index([isActive])
}

model PostingTemplate {
  id                    String   @id @default(uuid())
  
  agencyId              String
  agency                Agency   @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  
  name                  String
  description           String?  @db.Text
  
  // Template definition (JSON array of lines)
  // [{ "accountCode": "1000", "debitPercent": 100, "creditPercent": 0 }, ...]
  template              Json
  
  // Default values
  defaultDescription    String?
  defaultCurrency       String   @default("USD")
  
  isActive              Boolean  @default(true)
  
  createdAt             DateTime @default(now())
  createdBy             String
  updatedAt             DateTime @updatedAt
  
  @@unique([agencyId, name])
  @@index([agencyId, isActive])
}
```

### 3.5 Reconciliation Models

```prisma
// ========================================
// RECONCILIATION
// ========================================

model Reconciliation {
  id                    String   @id @default(uuid())
  
  // Scope
  agencyId              String?
  subAccountId          String?
  agency                Agency?   @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  subAccount            SubAccount? @relation(fields: [subAccountId], references: [id], onDelete: Cascade)
  
  // Reconciliation target
  accountId             String
  account               ChartOfAccount @relation(fields: [accountId], references: [id])
  periodId              String
  period                FinancialPeriod @relation(fields: [periodId], references: [id])
  
  // Reference
  reconciliationNumber  String
  description           String?
  
  // Balances
  bookBalance           Decimal  @db.Decimal(18, 6)
  statementBalance      Decimal  @db.Decimal(18, 6)
  adjustedBookBalance   Decimal  @db.Decimal(18, 6)
  difference            Decimal  @db.Decimal(18, 6)
  
  // Status
  status                ReconciliationStatus @default(IN_PROGRESS)
  
  // Workflow
  submittedAt           DateTime?
  submittedBy           String?
  approvedAt            DateTime?
  approvedBy            String?
  rejectedAt            DateTime?
  rejectedBy            String?
  rejectionReason       String?
  closedAt              DateTime?
  closedBy              String?
  
  notes                 String?  @db.Text
  
  createdAt             DateTime @default(now())
  createdBy             String
  updatedAt             DateTime @updatedAt
  updatedBy             String?
  
  items                 ReconciliationItem[]
  
  @@unique([agencyId, reconciliationNumber])
  @@unique([subAccountId, reconciliationNumber])
  @@index([agencyId, status])
  @@index([subAccountId, status])
  @@index([accountId, periodId])
  @@index([status])
}

model ReconciliationItem {
  id                    String   @id @default(uuid())
  
  reconciliationId      String
  reconciliation        Reconciliation @relation(fields: [reconciliationId], references: [id], onDelete: Cascade)
  
  // Item type
  itemType              String   // BOOK, STATEMENT, ADJUSTMENT
  
  // Transaction reference
  transactionDate       DateTime
  reference             String?
  description           String?
  
  // Amounts
  amount                Decimal  @db.Decimal(18, 6)
  
  // Matching
  status                ReconciliationItemStatus @default(UNMATCHED)
  matchedItemId         String?  // Link to matched item
  matchedAt             DateTime?
  matchedBy             String?
  
  notes                 String?
  
  createdAt             DateTime @default(now())
  
  @@index([reconciliationId])
  @@index([status])
  @@index([matchedItemId])
}

model ReconciliationRule {
  id                    String   @id @default(uuid())
  
  agencyId              String
  agency                Agency   @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  
  name                  String
  description           String?
  
  // Rule definition (JSON)
  // { "matchBy": ["reference", "amount"], "tolerance": 0.01 }
  ruleDefinition        Json
  
  priority              Int      @default(0)
  isActive              Boolean  @default(true)
  
  createdAt             DateTime @default(now())
  createdBy             String
  updatedAt             DateTime @updatedAt
  
  @@index([agencyId, isActive])
}

// Intercompany reconciliation
model IntercompanyReconciliation {
  id                    String   @id @default(uuid())
  
  agencyId              String
  agency                Agency   @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  
  periodId              String
  
  // Subaccounts involved
  subAccountId1         String
  subAccount1           SubAccount @relation("ICRecon1", fields: [subAccountId1], references: [id])
  subAccountId2         String
  subAccount2           SubAccount @relation("ICRecon2", fields: [subAccountId2], references: [id])
  
  // Account codes
  accountCode1          String
  accountCode2          String
  
  // Balances
  balance1              Decimal  @db.Decimal(18, 6)
  balance2              Decimal  @db.Decimal(18, 6)
  difference            Decimal  @db.Decimal(18, 6)
  
  status                ReconciliationStatus @default(IN_PROGRESS)
  
  notes                 String?  @db.Text
  
  createdAt             DateTime @default(now())
  createdBy             String
  updatedAt             DateTime @updatedAt
  
  @@index([agencyId, periodId])
  @@index([subAccountId1])
  @@index([subAccountId2])
}
```

### 3.6 Consolidation Models

```prisma
// ========================================
// CONSOLIDATION
// ========================================

model ConsolidationSnapshot {
  id                    String   @id @default(uuid())
  
  agencyId              String
  agency                Agency   @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  
  periodId              String
  period                FinancialPeriod @relation(fields: [periodId], references: [id])
  
  // Snapshot identification
  snapshotNumber        String
  name                  String
  description           String?  @db.Text
  
  // Scope - which subaccounts are included
  subAccountIds         String[] // Array of subaccount IDs
  
  // Consolidation method
  consolidationMethod   ConsolidationMethod
  
  // Consolidated results (denormalized JSON for performance)
  consolidatedBalances  Json     // { "1000": { balance, eliminations, adjusted } }
  balanceSheet          Json
  incomeStatement       Json
  cashFlowStatement     Json
  
  // Adjustments summary
  eliminationEntries    Json     // Array of elimination entries
  adjustmentEntries     Json     // Array of manual adjustments
  totalEliminations     Decimal  @default(0) @db.Decimal(18, 6)
  totalAdjustments      Decimal  @default(0) @db.Decimal(18, 6)
  
  // Ownership percentages (for proportional/equity)
  ownershipPercentages  Json?    // { "subaccount1": 100, "subaccount2": 60 }
  
  // Version control
  version               Int      @default(1)
  previousVersionId     String?
  
  // Status workflow
  status                ConsolidationStatus @default(DRAFT)
  
  // Validation
  validationResults     Json?    // { warnings: [], errors: [] }
  isValid               Boolean  @default(false)
  
  // Workflow
  consolidatedAt        DateTime @default(now())
  consolidatedBy        String
  submittedAt           DateTime?
  submittedBy           String?
  approvedAt            DateTime?
  approvedBy            String?
  rejectedAt            DateTime?
  rejectedBy            String?
  rejectionReason       String?
  
  notes                 String?  @db.Text
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  // Relations
  worksheetLines        ConsolidationWorksheetLine[]
  adjustments           ConsolidationAdjustment[]
  eliminations          IntercompanyElimination[]
  consolidatedBalances_ ConsolidatedBalance[]
  
  @@unique([agencyId, periodId, version])
  @@index([agencyId, periodId, status])
  @@index([agencyId, status])
  @@index([periodId])
}

model ConsolidationWorksheetLine {
  id                    String   @id @default(uuid())
  
  snapshotId            String
  snapshot              ConsolidationSnapshot @relation(fields: [snapshotId], references: [id], onDelete: Cascade)
  
  // Group COA reference
  groupCOAId            String
  groupCOA              AgencyGroupCOA @relation(fields: [groupCOAId], references: [id])
  accountCode           String
  accountName           String
  
  // SubAccount balances (JSON for flexibility)
  // { "subaccount1": 1000.00, "subaccount2": 500.00 }
  subAccountBalances    Json
  
  // Totals before adjustments
  totalBeforeAdj        Decimal  @db.Decimal(18, 6)
  
  // Adjustments
  eliminations          Decimal  @default(0) @db.Decimal(18, 6)
  adjustments           Decimal  @default(0) @db.Decimal(18, 6)
  
  // Final consolidated balance
  consolidatedBalance   Decimal  @db.Decimal(18, 6)
  
  @@unique([snapshotId, accountCode])
  @@index([snapshotId])
  @@index([groupCOAId])
}

model ConsolidatedBalance {
  id                    String   @id @default(uuid())
  
  snapshotId            String
  snapshot              ConsolidationSnapshot @relation(fields: [snapshotId], references: [id], onDelete: Cascade)
  
  groupCOAId            String
  groupCOA              AgencyGroupCOA @relation(fields: [groupCOAId], references: [id])
  
  // Balance
  balance               Decimal  @db.Decimal(18, 6)
  
  @@unique([snapshotId, groupCOAId])
  @@index([snapshotId])
}

model ConsolidationAdjustment {
  id                    String   @id @default(uuid())
  
  snapshotId            String
  snapshot              ConsolidationSnapshot @relation(fields: [snapshotId], references: [id], onDelete: Cascade)
  
  // Adjustment details
  adjustmentNumber      String
  description           String
  
  debitAccountCode      String
  creditAccountCode     String
  amount                Decimal  @db.Decimal(18, 6)
  
  adjustmentType        String   // MANUAL, MINORITY_INTEREST, GOODWILL, OTHER
  
  // Status
  status                String   @default("DRAFT") // DRAFT, APPROVED, REJECTED
  approvedAt            DateTime?
  approvedBy            String?
  
  notes                 String?  @db.Text
  
  createdAt             DateTime @default(now())
  createdBy             String
  updatedAt             DateTime @updatedAt
  
  @@index([snapshotId])
}

model IntercompanyElimination {
  id                    String   @id @default(uuid())
  
  snapshotId            String
  snapshot              ConsolidationSnapshot @relation(fields: [snapshotId], references: [id], onDelete: Cascade)
  
  // Elimination details
  eliminationNumber     String
  description           String
  
  // Intercompany pair
  subAccountId1         String
  subAccountId2         String
  accountCode1          String
  accountCode2          String
  
  // Amount
  amount                Decimal  @db.Decimal(18, 6)
  
  eliminationType       String   // REVENUE_EXPENSE, RECEIVABLE_PAYABLE, INVENTORY_PROFIT, OTHER
  
  // Status
  status                String   @default("DRAFT")
  approvedAt            DateTime?
  approvedBy            String?
  
  // Auto or manual
  isAutoGenerated       Boolean  @default(true)
  
  notes                 String?  @db.Text
  
  createdAt             DateTime @default(now())
  createdBy             String
  
  @@index([snapshotId])
  @@index([subAccountId1, subAccountId2])
}

model SubAccountOwnership {
  id                    String   @id @default(uuid())
  
  agencyId              String
  agency                Agency   @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  
  subAccountId          String
  subAccount            SubAccount @relation(fields: [subAccountId], references: [id], onDelete: Cascade)
  
  // Ownership details
  ownershipPercentage   Decimal  @db.Decimal(5, 2) // 0.00 to 100.00
  consolidationMethod   ConsolidationMethod
  
  // Effective dates
  effectiveFrom         DateTime
  effectiveTo           DateTime?
  
  // Minority interest account (if applicable)
  minorityInterestAccountCode String?
  
  isActive              Boolean  @default(true)
  
  createdAt             DateTime @default(now())
  createdBy             String
  updatedAt             DateTime @updatedAt
  
  @@unique([agencyId, subAccountId, effectiveFrom])
  @@index([agencyId, isActive])
  @@index([subAccountId])
}
```

### 3.7 Reporting & Audit Models

```prisma
// ========================================
// REPORTING
// ========================================

model SavedReport {
  id                    String   @id @default(uuid())
  
  agencyId              String?
  subAccountId          String?
  agency                Agency?   @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  subAccount            SubAccount? @relation(fields: [subAccountId], references: [id], onDelete: Cascade)
  
  name                  String
  description           String?
  
  reportType            ReportType
  
  // Report parameters (JSON)
  parameters            Json     // { periodId, accountIds, etc. }
  
  // Schedule (optional)
  isScheduled           Boolean  @default(false)
  schedule              String?  // Cron expression
  
  // Output
  lastGeneratedAt       DateTime?
  lastGeneratedBy       String?
  
  isActive              Boolean  @default(true)
  
  createdAt             DateTime @default(now())
  createdBy             String
  updatedAt             DateTime @updatedAt
  
  @@index([agencyId, reportType])
  @@index([subAccountId, reportType])
}

model ReportTemplate {
  id                    String   @id @default(uuid())
  
  name                  String   @unique
  description           String?
  
  reportType            ReportType
  
  // Template definition
  templateDefinition    Json     // Layout, columns, calculations
  
  // Default parameters
  defaultParameters     Json?
  
  isSystem              Boolean  @default(true)
  isActive              Boolean  @default(true)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@index([reportType, isActive])
}

model COATemplate {
  id                    String   @id @default(uuid())
  
  name                  String   // "SaaS Company COA"
  industry              Industry
  description           String   @db.Text
  region                String   @default("US")
  accountingStandard    String   @default("GAAP")
  
  // Full COA structure as JSON
  template              Json
  
  // Metadata
  version               String   @default("1.0")
  isActive              Boolean  @default(true)
  isDefault             Boolean  @default(false)
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@index([industry, isActive])
  @@index([region, accountingStandard])
}

// ========================================
// AUDIT TRAIL
// ========================================

model GLAuditTrail {
  id                    String   @id @default(uuid())
  
  // Scope
  agencyId              String?
  subAccountId          String?
  
  // What changed
  entityType            String   // JournalEntry, ChartOfAccount, etc.
  entityId              String
  
  // Action
  action                AuditAction
  
  // Who
  userId                String
  userEmail             String?
  userName              String?
  
  // When
  timestamp             DateTime @default(now())
  
  // What changed (before/after)
  previousValues        Json?
  newValues             Json?
  
  // Context
  ipAddress             String?
  userAgent             String?
  sessionId             String?
  
  // Notes
  reason                String?
  
  @@index([agencyId, entityType, entityId])
  @@index([subAccountId, entityType, entityId])
  @@index([agencyId, timestamp])
  @@index([subAccountId, timestamp])
  @@index([userId])
  @@index([entityType, entityId])
  @@index([timestamp])
  @@index([action])
}
```

### 3.8 Relation Updates

Add these relations to existing models in `schema.prisma`:

```prisma
// Add to Agency model
model Agency {
  // ... existing fields ...
  
  // FI-GL Relations
  GLConfiguration       GLConfiguration?
  ChartOfAccounts       ChartOfAccount[]
  AgencyGroupCOAs       AgencyGroupCOA[]
  ConsolidationMappings ConsolidationMapping[]
  FinancialPeriods      FinancialPeriod[]
  JournalEntries        JournalEntry[]
  ExchangeRates         ExchangeRate[]
  CurrencyRevaluations  CurrencyRevaluation[]
  PostingRules          PostingRule[]
  PostingTemplates      PostingTemplate[]
  Reconciliations       Reconciliation[]
  ReconciliationRules   ReconciliationRule[]
  IntercompanyReconciliations IntercompanyReconciliation[]
  ConsolidationSnapshots ConsolidationSnapshot[]
  SubAccountOwnerships  SubAccountOwnership[]
  SavedReports          SavedReport[]
}

// Add to SubAccount model
model SubAccount {
  // ... existing fields ...
  
  // FI-GL Relations
  ChartOfAccounts       ChartOfAccount[]
  ConsolidationMappings ConsolidationMapping[]
  FinancialPeriods      FinancialPeriod[]
  JournalEntries        JournalEntry[]
  CurrencyRevaluations  CurrencyRevaluation[]
  PostingRules          PostingRule[]
  Reconciliations       Reconciliation[]
  ICReconciliations1    IntercompanyReconciliation[] @relation("ICRecon1")
  ICReconciliations2    IntercompanyReconciliation[] @relation("ICRecon2")
  SubAccountOwnership   SubAccountOwnership[]
  SavedReports          SavedReport[]
}
```

---

## 4. RBAC Permissions

### 4.1 Permission Key Structure

Following existing pattern: `{module}.{resource}.{action}`

```typescript
// src/lib/entitlement/constants.ts - Add finance module

export const KEYS = {
  // ... existing keys ...
  
  finance: {
    gl: {
      // Chart of Accounts
      coa: {
        view: 'finance.gl.coa.view',
        create: 'finance.gl.coa.create',
        edit: 'finance.gl.coa.edit',
        delete: 'finance.gl.coa.delete',
        manage_hierarchy: 'finance.gl.coa.manage_hierarchy',
        enable_consolidation: 'finance.gl.coa.enable_consolidation',
        manage_group_coa: 'finance.gl.coa.manage_group_coa',
        manage_consolidation_mapping: 'finance.gl.coa.manage_consolidation_mapping',
      },
      // Ledgers
      ledger: {
        view: 'finance.gl.ledger.view',
        create: 'finance.gl.ledger.create',
        edit: 'finance.gl.ledger.edit',
        delete: 'finance.gl.ledger.delete',
        configure: 'finance.gl.ledger.configure',
      },
      // Transactions
      transaction: {
        view: 'finance.gl.transaction.view',
        create: 'finance.gl.transaction.create',
        edit_draft: 'finance.gl.transaction.edit_draft',
        submit: 'finance.gl.transaction.submit',
        approve: 'finance.gl.transaction.approve',
        reject: 'finance.gl.transaction.reject',
        post: 'finance.gl.transaction.post',
        void: 'finance.gl.transaction.void',
      },
      // Journal Entries
      journal: {
        view: 'finance.gl.journal.view',
        create: 'finance.gl.journal.create',
        edit_draft: 'finance.gl.journal.edit_draft',
        submit: 'finance.gl.journal.submit',
        approve: 'finance.gl.journal.approve',
        reject: 'finance.gl.journal.reject',
        post: 'finance.gl.journal.post',
        reverse: 'finance.gl.journal.reverse',
        void: 'finance.gl.journal.void',
        bulk_create: 'finance.gl.journal.bulk_create',
      },
      // Reconciliation
      reconciliation: {
        view: 'finance.gl.reconciliation.view',
        create: 'finance.gl.reconciliation.create',
        execute: 'finance.gl.reconciliation.execute',
        approve: 'finance.gl.reconciliation.approve',
        reject: 'finance.gl.reconciliation.reject',
        close: 'finance.gl.reconciliation.close',
        manage_rules: 'finance.gl.reconciliation.manage_rules',
      },
      // Periods
      period: {
        view: 'finance.gl.period.view',
        create: 'finance.gl.period.create',
        edit: 'finance.gl.period.edit',
        delete: 'finance.gl.period.delete',
        open: 'finance.gl.period.open',
        close: 'finance.gl.period.close',
        lock: 'finance.gl.period.lock',
        year_end: 'finance.gl.period.year_end',
      },
      // Reporting
      report: {
        view: 'finance.gl.report.view',
        generate: 'finance.gl.report.generate',
        export: 'finance.gl.report.export',
        create_custom: 'finance.gl.report.create_custom',
        schedule: 'finance.gl.report.schedule',
      },
      // Audit
      audit: {
        view: 'finance.gl.audit.view',
        search: 'finance.gl.audit.search',
        export: 'finance.gl.audit.export',
      },
      // Multi-Currency
      currency: {
        view: 'finance.gl.currency.view',
        manage_rates: 'finance.gl.currency.manage_rates',
        revaluate: 'finance.gl.currency.revaluate',
      },
      // Consolidation
      consolidation: {
        view: 'finance.gl.consolidation.view',
        execute: 'finance.gl.consolidation.execute',
        adjust: 'finance.gl.consolidation.adjust',
        eliminate: 'finance.gl.consolidation.eliminate',
        approve: 'finance.gl.consolidation.approve',
        reject: 'finance.gl.consolidation.reject',
        rollback: 'finance.gl.consolidation.rollback',
        manage_ownership: 'finance.gl.consolidation.manage_ownership',
      },
      // Settings
      settings: {
        view: 'finance.gl.settings.view',
        edit: 'finance.gl.settings.edit',
      },
      // Posting Rules
      posting: {
        view: 'finance.gl.posting.view',
        create: 'finance.gl.posting.create',
        edit: 'finance.gl.posting.edit',
        delete: 'finance.gl.posting.delete',
        activate: 'finance.gl.posting.activate',
        execute: 'finance.gl.posting.execute',
      },
    },
  },
} as const;
```

### 4.2 Permission Definitions

```typescript
// scripts/seed-gl-permissions.ts

export const GL_PERMISSION_DEFINITIONS = [
  // ========== Chart of Accounts ==========
  {
    key: 'finance.gl.coa.view',
    name: 'View Chart of Accounts',
    description: 'Can view chart of accounts and account hierarchy',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.coa.create',
    name: 'Create Accounts',
    description: 'Can create new accounts in chart of accounts',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.coa.edit',
    name: 'Edit Accounts',
    description: 'Can edit existing accounts',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.coa.delete',
    name: 'Delete Accounts',
    description: 'Can delete accounts (if no transactions)',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.coa.manage_hierarchy',
    name: 'Manage Account Hierarchy',
    description: 'Can reorganize account hierarchy and parent relationships',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.coa.enable_consolidation',
    name: 'Enable Account Consolidation',
    description: 'Can enable/disable consolidation for accounts',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.coa.manage_group_coa',
    name: 'Manage Group COA',
    description: 'Can manage Agency-level group chart of accounts',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.coa.manage_consolidation_mapping',
    name: 'Manage Consolidation Mappings',
    description: 'Can map subaccount COA to group COA for consolidation',
    category: 'finance.gl',
  },

  // ========== Ledgers ==========
  {
    key: 'finance.gl.ledger.view',
    name: 'View Ledgers',
    description: 'Can view general and subsidiary ledgers',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.ledger.create',
    name: 'Create Ledgers',
    description: 'Can create new ledgers',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.ledger.edit',
    name: 'Edit Ledgers',
    description: 'Can edit ledger configurations',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.ledger.delete',
    name: 'Delete Ledgers',
    description: 'Can delete ledgers',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.ledger.configure',
    name: 'Configure Ledgers',
    description: 'Can configure ledger rules and settings',
    category: 'finance.gl',
  },

  // ========== Transactions ==========
  {
    key: 'finance.gl.transaction.view',
    name: 'View Transactions',
    description: 'Can view financial transactions',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.transaction.create',
    name: 'Create Transactions',
    description: 'Can create new transactions',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.transaction.edit_draft',
    name: 'Edit Draft Transactions',
    description: 'Can edit transactions in draft status',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.transaction.submit',
    name: 'Submit Transactions',
    description: 'Can submit transactions for approval',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.transaction.approve',
    name: 'Approve Transactions',
    description: 'Can approve submitted transactions',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.transaction.reject',
    name: 'Reject Transactions',
    description: 'Can reject submitted transactions',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.transaction.post',
    name: 'Post Transactions',
    description: 'Can post approved transactions to ledger',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.transaction.void',
    name: 'Void Transactions',
    description: 'Can void posted transactions',
    category: 'finance.gl',
  },

  // ========== Journal Entries ==========
  {
    key: 'finance.gl.journal.view',
    name: 'View Journal Entries',
    description: 'Can view journal entries',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.journal.create',
    name: 'Create Journal Entries',
    description: 'Can create new journal entries',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.journal.edit_draft',
    name: 'Edit Draft Journal Entries',
    description: 'Can edit journal entries in draft status',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.journal.submit',
    name: 'Submit Journal Entries',
    description: 'Can submit journal entries for approval',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.journal.approve',
    name: 'Approve Journal Entries',
    description: 'Can approve submitted journal entries',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.journal.reject',
    name: 'Reject Journal Entries',
    description: 'Can reject submitted journal entries',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.journal.post',
    name: 'Post Journal Entries',
    description: 'Can post approved journal entries',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.journal.reverse',
    name: 'Reverse Journal Entries',
    description: 'Can create reversal entries',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.journal.void',
    name: 'Void Journal Entries',
    description: 'Can void journal entries',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.journal.bulk_create',
    name: 'Bulk Create Journal Entries',
    description: 'Can create multiple journal entries at once',
    category: 'finance.gl',
  },

  // ========== Reconciliation ==========
  {
    key: 'finance.gl.reconciliation.view',
    name: 'View Reconciliations',
    description: 'Can view reconciliation records',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.reconciliation.create',
    name: 'Create Reconciliations',
    description: 'Can create new reconciliations',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.reconciliation.execute',
    name: 'Execute Reconciliation',
    description: 'Can run matching rules and reconcile items',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.reconciliation.approve',
    name: 'Approve Reconciliations',
    description: 'Can approve completed reconciliations',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.reconciliation.reject',
    name: 'Reject Reconciliations',
    description: 'Can reject reconciliations',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.reconciliation.close',
    name: 'Close Reconciliations',
    description: 'Can close approved reconciliations',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.reconciliation.manage_rules',
    name: 'Manage Reconciliation Rules',
    description: 'Can create and edit matching rules',
    category: 'finance.gl',
  },

  // ========== Periods ==========
  {
    key: 'finance.gl.period.view',
    name: 'View Financial Periods',
    description: 'Can view financial periods',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.period.create',
    name: 'Create Financial Periods',
    description: 'Can create new financial periods',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.period.edit',
    name: 'Edit Financial Periods',
    description: 'Can edit financial period details',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.period.delete',
    name: 'Delete Financial Periods',
    description: 'Can delete unused financial periods',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.period.open',
    name: 'Open Financial Periods',
    description: 'Can open periods for posting',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.period.close',
    name: 'Close Financial Periods',
    description: 'Can close periods (no more posting)',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.period.lock',
    name: 'Lock Financial Periods',
    description: 'Can permanently lock periods',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.period.year_end',
    name: 'Process Year End',
    description: 'Can run year-end closing process',
    category: 'finance.gl',
  },

  // ========== Reporting ==========
  {
    key: 'finance.gl.report.view',
    name: 'View Reports',
    description: 'Can view financial reports',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.report.generate',
    name: 'Generate Reports',
    description: 'Can generate financial reports',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.report.export',
    name: 'Export Reports',
    description: 'Can export reports to PDF, Excel, CSV',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.report.create_custom',
    name: 'Create Custom Reports',
    description: 'Can create and save custom report definitions',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.report.schedule',
    name: 'Schedule Reports',
    description: 'Can schedule automated report generation',
    category: 'finance.gl',
  },

  // ========== Audit ==========
  {
    key: 'finance.gl.audit.view',
    name: 'View Audit Trail',
    description: 'Can view audit trail records',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.audit.search',
    name: 'Search Audit Trail',
    description: 'Can search and filter audit trail',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.audit.export',
    name: 'Export Audit Trail',
    description: 'Can export audit trail data',
    category: 'finance.gl',
  },

  // ========== Multi-Currency ==========
  {
    key: 'finance.gl.currency.view',
    name: 'View Currency Settings',
    description: 'Can view currencies and exchange rates',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.currency.manage_rates',
    name: 'Manage Exchange Rates',
    description: 'Can create and edit exchange rates',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.currency.revaluate',
    name: 'Revaluate Currencies',
    description: 'Can run currency revaluation process',
    category: 'finance.gl',
  },

  // ========== Consolidation ==========
  {
    key: 'finance.gl.consolidation.view',
    name: 'View Consolidation',
    description: 'Can view consolidation snapshots and worksheets',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.consolidation.execute',
    name: 'Execute Consolidation',
    description: 'Can run consolidation process',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.consolidation.adjust',
    name: 'Create Consolidation Adjustments',
    description: 'Can create manual consolidation adjustments',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.consolidation.eliminate',
    name: 'Manage Eliminations',
    description: 'Can create and approve intercompany eliminations',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.consolidation.approve',
    name: 'Approve Consolidation',
    description: 'Can approve consolidation snapshots',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.consolidation.reject',
    name: 'Reject Consolidation',
    description: 'Can reject consolidation snapshots',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.consolidation.rollback',
    name: 'Rollback Consolidation',
    description: 'Can rollback consolidation to previous version',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.consolidation.manage_ownership',
    name: 'Manage Ownership Percentages',
    description: 'Can set subaccount ownership percentages',
    category: 'finance.gl',
  },

  // ========== Settings ==========
  {
    key: 'finance.gl.settings.view',
    name: 'View GL Settings',
    description: 'Can view GL configuration',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.settings.edit',
    name: 'Edit GL Settings',
    description: 'Can modify GL configuration',
    category: 'finance.gl',
  },

  // ========== Posting Rules ==========
  {
    key: 'finance.gl.posting.view',
    name: 'View Posting Rules',
    description: 'Can view posting rules and templates',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.posting.create',
    name: 'Create Posting Rules',
    description: 'Can create new posting rules',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.posting.edit',
    name: 'Edit Posting Rules',
    description: 'Can edit posting rules',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.posting.delete',
    name: 'Delete Posting Rules',
    description: 'Can delete posting rules',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.posting.activate',
    name: 'Activate Posting Rules',
    description: 'Can activate/deactivate posting rules',
    category: 'finance.gl',
  },
  {
    key: 'finance.gl.posting.execute',
    name: 'Execute Posting Rules',
    description: 'Can manually trigger posting rules',
    category: 'finance.gl',
  },
];
```

### 4.3 Role Templates

```typescript
// Default role permission assignments

export const GL_ROLE_PERMISSIONS = {
  // Agency Owner - Full access
  AGENCY_OWNER: [
    'finance.gl.coa.*',
    'finance.gl.ledger.*',
    'finance.gl.transaction.*',
    'finance.gl.journal.*',
    'finance.gl.reconciliation.*',
    'finance.gl.period.*',
    'finance.gl.report.*',
    'finance.gl.audit.*',
    'finance.gl.currency.*',
    'finance.gl.consolidation.*',
    'finance.gl.settings.*',
    'finance.gl.posting.*',
  ],

  // Agency Admin - All except dangerous operations
  AGENCY_ADMIN: [
    'finance.gl.coa.view',
    'finance.gl.coa.create',
    'finance.gl.coa.edit',
    'finance.gl.coa.manage_hierarchy',
    'finance.gl.ledger.*',
    'finance.gl.transaction.*',
    'finance.gl.journal.*',
    'finance.gl.reconciliation.*',
    'finance.gl.period.view',
    'finance.gl.period.create',
    'finance.gl.period.edit',
    'finance.gl.period.open',
    'finance.gl.period.close',
    'finance.gl.report.*',
    'finance.gl.audit.view',
    'finance.gl.audit.search',
    'finance.gl.currency.*',
    'finance.gl.consolidation.view',
    'finance.gl.consolidation.execute',
    'finance.gl.consolidation.adjust',
    'finance.gl.settings.view',
    'finance.gl.posting.*',
  ],

  // GL Manager - Day-to-day GL operations
  GL_MANAGER: [
    'finance.gl.coa.view',
    'finance.gl.coa.create',
    'finance.gl.coa.edit',
    'finance.gl.ledger.view',
    'finance.gl.transaction.*',
    'finance.gl.journal.*',
    'finance.gl.reconciliation.*',
    'finance.gl.period.view',
    'finance.gl.period.open',
    'finance.gl.period.close',
    'finance.gl.report.*',
    'finance.gl.audit.view',
    'finance.gl.currency.view',
    'finance.gl.currency.manage_rates',
    'finance.gl.posting.view',
    'finance.gl.posting.execute',
  ],

  // GL Accountant - Entry creation and basic operations
  GL_ACCOUNTANT: [
    'finance.gl.coa.view',
    'finance.gl.ledger.view',
    'finance.gl.transaction.view',
    'finance.gl.transaction.create',
    'finance.gl.transaction.edit_draft',
    'finance.gl.transaction.submit',
    'finance.gl.journal.view',
    'finance.gl.journal.create',
    'finance.gl.journal.edit_draft',
    'finance.gl.journal.submit',
    'finance.gl.reconciliation.view',
    'finance.gl.reconciliation.create',
    'finance.gl.reconciliation.execute',
    'finance.gl.period.view',
    'finance.gl.report.view',
    'finance.gl.report.generate',
    'finance.gl.audit.view',
    'finance.gl.currency.view',
  ],

  // GL Viewer - Read-only access
  GL_VIEWER: [
    'finance.gl.coa.view',
    'finance.gl.ledger.view',
    'finance.gl.transaction.view',
    'finance.gl.journal.view',
    'finance.gl.reconciliation.view',
    'finance.gl.period.view',
    'finance.gl.report.view',
    'finance.gl.currency.view',
  ],

  // SubAccount Admin - Full access within subaccount
  SUBACCOUNT_ADMIN: [
    'finance.gl.coa.view',
    'finance.gl.coa.create',
    'finance.gl.coa.edit',
    'finance.gl.ledger.*',
    'finance.gl.transaction.*',
    'finance.gl.journal.*',
    'finance.gl.reconciliation.*',
    'finance.gl.period.view',
    'finance.gl.period.create',
    'finance.gl.period.edit',
    'finance.gl.period.open',
    'finance.gl.period.close',
    'finance.gl.report.*',
    'finance.gl.audit.view',
    'finance.gl.currency.view',
    'finance.gl.currency.manage_rates',
    'finance.gl.posting.*',
  ],

  // SubAccount User - Limited operations
  SUBACCOUNT_USER: [
    'finance.gl.coa.view',
    'finance.gl.ledger.view',
    'finance.gl.transaction.view',
    'finance.gl.transaction.create',
    'finance.gl.transaction.edit_draft',
    'finance.gl.transaction.submit',
    'finance.gl.journal.view',
    'finance.gl.journal.create',
    'finance.gl.journal.edit_draft',
    'finance.gl.journal.submit',
    'finance.gl.reconciliation.view',
    'finance.gl.period.view',
    'finance.gl.report.view',
    'finance.gl.report.generate',
    'finance.gl.currency.view',
  ],
};
```

---

## 5. Validation Schemas

### 5.1 Chart of Accounts Schema

```typescript
// src/lib/schemas/finance/gl/chart-of-accounts.ts

import { z } from 'zod';

// Account code validation regex (configurable format)
const accountCodeRegex = /^[A-Z0-9]{1,4}(-[A-Z0-9]{1,4})*$/;

export const createAccountSchema = z.object({
  code: z
    .string()
    .min(1, 'Account code is required')
    .max(20, 'Account code must be 20 characters or less')
    .regex(accountCodeRegex, 'Invalid account code format'),
  
  name: z
    .string()
    .min(1, 'Account name is required')
    .max(100, 'Account name must be 100 characters or less'),
  
  description: z.string().max(500).optional(),
  
  parentAccountId: z.string().uuid().optional().nullable(),
  
  accountType: z.enum([
    'ASSET',
    'LIABILITY',
    'EQUITY',
    'REVENUE',
    'EXPENSE',
  ]),
  
  category: z.enum([
    'CURRENT_ASSET',
    'FIXED_ASSET',
    'OTHER_ASSET',
    'CURRENT_LIABILITY',
    'LONG_TERM_LIABILITY',
    'CAPITAL',
    'RETAINED_EARNINGS_CAT',
    'OPERATING_REVENUE',
    'OTHER_REVENUE',
    'COST_OF_GOODS_SOLD',
    'OPERATING_EXPENSE',
    'OTHER_EXPENSE',
  ]).optional(),
  
  subcategory: z.string().max(50).optional(),
  
  // Control account settings
  isControlAccount: z.boolean().default(false),
  subledgerType: z.enum([
    'NONE',
    'ACCOUNTS_RECEIVABLE',
    'ACCOUNTS_PAYABLE',
    'INVENTORY',
    'FIXED_ASSETS',
    'PAYROLL',
    'BANK',
  ]).default('NONE'),
  controlAccountId: z.string().uuid().optional().nullable(),
  
  // Posting behavior
  allowManualPosting: z.boolean().default(true),
  requireApproval: z.boolean().default(false),
  isPostingAccount: z.boolean().default(true),
  
  // Consolidation
  isConsolidationEnabled: z.boolean().default(false),
  consolidationAccountCode: z.string().max(20).optional(),
  
  // Currency
  currencyCode: z.string().length(3).optional(),
  isMultiCurrency: z.boolean().default(false),
  
  // Normal balance
  normalBalance: z.enum(['DEBIT', 'CREDIT']).default('DEBIT'),
  
  sortOrder: z.number().int().min(0).default(0),
});

export const updateAccountSchema = createAccountSchema.partial().extend({
  id: z.string().uuid(),
});

export const accountHierarchyMoveSchema = z.object({
  accountId: z.string().uuid(),
  newParentId: z.string().uuid().optional().nullable(),
  newSortOrder: z.number().int().min(0),
});

export const consolidationMappingSchema = z.object({
  subAccountId: z.string().uuid(),
  subAccountCOACode: z.string().min(1),
  groupCOAId: z.string().uuid(),
  mappingPercentage: z.number().min(0).max(100).default(100),
  isElimination: z.boolean().default(false),
  eliminationPairId: z.string().uuid().optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type AccountHierarchyMoveInput = z.infer<typeof accountHierarchyMoveSchema>;
export type ConsolidationMappingInput = z.infer<typeof consolidationMappingSchema>;
```

### 5.2 Journal Entry Schema

```typescript
// src/lib/schemas/finance/gl/journal-entry.ts

import { z } from 'zod';

// Custom validator for double-entry balance
const validateDoubleEntry = (lines: JournalEntryLineInput[]) => {
  const totalDebit = lines.reduce((sum, line) => sum + (line.debitAmount || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (line.creditAmount || 0), 0);
  
  // Allow small rounding difference (0.01)
  return Math.abs(totalDebit - totalCredit) < 0.01;
};

export const journalEntryLineSchema = z.object({
  lineNumber: z.number().int().min(1),
  accountId: z.string().uuid(),
  description: z.string().max(500).optional(),
  debitAmount: z.number().min(0).default(0),
  creditAmount: z.number().min(0).default(0),
  exchangeRate: z.number().positive().optional(),
  subledgerType: z.enum([
    'NONE',
    'ACCOUNTS_RECEIVABLE',
    'ACCOUNTS_PAYABLE',
    'INVENTORY',
    'FIXED_ASSETS',
    'PAYROLL',
    'BANK',
  ]).default('NONE'),
  subledgerReference: z.string().max(100).optional(),
  taxCode: z.string().max(20).optional(),
  taxAmount: z.number().optional(),
  dimension1: z.string().max(50).optional(), // Cost center
  dimension2: z.string().max(50).optional(), // Department
  dimension3: z.string().max(50).optional(), // Project
  dimension4: z.string().max(50).optional(), // Custom
  isIntercompany: z.boolean().default(false),
  intercompanySubAccountId: z.string().uuid().optional(),
}).refine(
  (data) => data.debitAmount > 0 || data.creditAmount > 0,
  { message: 'Each line must have either a debit or credit amount' }
).refine(
  (data) => !(data.debitAmount > 0 && data.creditAmount > 0),
  { message: 'A line cannot have both debit and credit amounts' }
);

export const createJournalEntrySchema = z.object({
  periodId: z.string().uuid(),
  entryDate: z.coerce.date(),
  
  entryType: z.enum([
    'NORMAL',
    'OPENING',
    'CLOSING',
    'CARRY_FORWARD',
    'BROUGHT_FORWARD',
    'YEAR_END_CLOSING',
    'ADJUSTMENT',
    'REVERSAL',
    'CONSOLIDATION',
    'ELIMINATION',
  ]).default('NORMAL'),
  
  sourceModule: z.enum([
    'MANUAL',
    'INVOICE',
    'PAYMENT',
    'EXPENSE',
    'PAYROLL',
    'ASSET',
    'INVENTORY',
    'BANK',
    'ADJUSTMENT',
    'CONSOLIDATION',
    'INTERCOMPANY',
    'REVERSAL',
    'YEAR_END',
    'OPENING_BALANCE',
  ]).default('MANUAL'),
  
  sourceId: z.string().uuid().optional(),
  sourceReference: z.string().max(100).optional(),
  
  description: z.string().min(1, 'Description is required').max(1000),
  notes: z.string().max(2000).optional(),
  
  currencyCode: z.string().length(3).default('USD'),
  exchangeRate: z.number().positive().default(1),
  
  lines: z
    .array(journalEntryLineSchema)
    .min(2, 'At least 2 lines are required for double-entry')
    .max(100, 'Maximum 100 lines per entry'),
    
}).refine(
  (data) => validateDoubleEntry(data.lines),
  { message: 'Total debits must equal total credits (double-entry)' }
);

export const updateJournalEntrySchema = createJournalEntrySchema.partial().extend({
  id: z.string().uuid(),
});

export const submitJournalEntrySchema = z.object({
  id: z.string().uuid(),
});

export const approveJournalEntrySchema = z.object({
  id: z.string().uuid(),
  notes: z.string().max(500).optional(),
});

export const rejectJournalEntrySchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1, 'Rejection reason is required').max(500),
});

export const postJournalEntrySchema = z.object({
  id: z.string().uuid(),
});

export const reverseJournalEntrySchema = z.object({
  id: z.string().uuid(),
  reversalDate: z.coerce.date(),
  reason: z.string().min(1, 'Reversal reason is required').max(500),
});

export const voidJournalEntrySchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1, 'Void reason is required').max(500),
});

export type JournalEntryLineInput = z.infer<typeof journalEntryLineSchema>;
export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;
export type UpdateJournalEntryInput = z.infer<typeof updateJournalEntrySchema>;
```

### 5.3 Financial Period Schema

```typescript
// src/lib/schemas/finance/gl/period.ts

import { z } from 'zod';

export const createPeriodSchema = z.object({
  name: z.string().min(1).max(100),
  shortName: z.string().max(20).optional(),
  
  periodType: z.enum([
    'MONTH',
    'QUARTER',
    'HALF_YEAR',
    'YEAR',
    'CUSTOM',
  ]),
  
  fiscalYear: z.number().int().min(2000).max(2100),
  fiscalPeriod: z.number().int().min(1).max(12),
  
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  
  isYearEnd: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
}).refine(
  (data) => data.endDate > data.startDate,
  { message: 'End date must be after start date' }
);

export const updatePeriodSchema = createPeriodSchema.partial().extend({
  id: z.string().uuid(),
});

export const openPeriodSchema = z.object({
  id: z.string().uuid(),
});

export const closePeriodSchema = z.object({
  id: z.string().uuid(),
  notes: z.string().max(500).optional(),
});

export const lockPeriodSchema = z.object({
  id: z.string().uuid(),
  notes: z.string().max(500).optional(),
});

export const yearEndProcessingSchema = z.object({
  periodId: z.string().uuid(),
  retainedEarningsAccountId: z.string().uuid(),
  createBroughtForward: z.boolean().default(true),
  notes: z.string().max(1000).optional(),
});

export type CreatePeriodInput = z.infer<typeof createPeriodSchema>;
export type UpdatePeriodInput = z.infer<typeof updatePeriodSchema>;
export type YearEndProcessingInput = z.infer<typeof yearEndProcessingSchema>;
```

### 5.4 Multi-Currency Schema

```typescript
// src/lib/schemas/finance/gl/currency.ts

import { z } from 'zod';

export const createCurrencySchema = z.object({
  code: z.string().length(3).toUpperCase(),
  name: z.string().min(1).max(100),
  symbol: z.string().min(1).max(5),
  decimalPlaces: z.number().int().min(0).max(18).default(2),
  isActive: z.boolean().default(true),
});

export const createExchangeRateSchema = z.object({
  fromCurrencyCode: z.string().length(3),
  toCurrencyCode: z.string().length(3),
  rate: z.number().positive(),
  effectiveDate: z.coerce.date(),
  expiryDate: z.coerce.date().optional(),
  rateType: z.enum(['SPOT', 'AVERAGE', 'BUDGET']).default('SPOT'),
  source: z.string().max(100).optional(),
}).refine(
  (data) => data.fromCurrencyCode !== data.toCurrencyCode,
  { message: 'From and To currencies must be different' }
);

export const currencyRevaluationSchema = z.object({
  periodId: z.string().uuid(),
  currencyCode: z.string().length(3),
  revaluationDate: z.coerce.date(),
  exchangeRate: z.number().positive(),
  notes: z.string().max(500).optional(),
});

export const convertAmountSchema = z.object({
  amount: z.number(),
  fromCurrencyCode: z.string().length(3),
  toCurrencyCode: z.string().length(3),
  effectiveDate: z.coerce.date().optional(),
  rateType: z.enum(['SPOT', 'AVERAGE', 'BUDGET']).default('SPOT'),
});

export type CreateCurrencyInput = z.infer<typeof createCurrencySchema>;
export type CreateExchangeRateInput = z.infer<typeof createExchangeRateSchema>;
export type CurrencyRevaluationInput = z.infer<typeof currencyRevaluationSchema>;
export type ConvertAmountInput = z.infer<typeof convertAmountSchema>;
```

### 5.5 Reconciliation Schema

```typescript
// src/lib/schemas/finance/gl/reconciliation.ts

import { z } from 'zod';

export const createReconciliationSchema = z.object({
  accountId: z.string().uuid(),
  periodId: z.string().uuid(),
  description: z.string().max(500).optional(),
  statementBalance: z.number(),
  notes: z.string().max(1000).optional(),
});

export const reconciliationItemSchema = z.object({
  itemType: z.enum(['BOOK', 'STATEMENT', 'ADJUSTMENT']),
  transactionDate: z.coerce.date(),
  reference: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  amount: z.number(),
  notes: z.string().max(500).optional(),
});

export const matchItemsSchema = z.object({
  reconciliationId: z.string().uuid(),
  itemIds: z.array(z.string().uuid()).min(2),
});

export const unmatchItemSchema = z.object({
  itemId: z.string().uuid(),
});

export const reconciliationRuleSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  ruleDefinition: z.object({
    matchBy: z.array(z.enum(['reference', 'amount', 'date', 'description'])),
    tolerance: z.number().min(0).max(100).optional(), // Percentage tolerance
    dateToleranceDays: z.number().int().min(0).max(30).optional(),
  }),
  priority: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export type CreateReconciliationInput = z.infer<typeof createReconciliationSchema>;
export type ReconciliationItemInput = z.infer<typeof reconciliationItemSchema>;
export type ReconciliationRuleInput = z.infer<typeof reconciliationRuleSchema>;
```

### 5.6 Consolidation Schema

```typescript
// src/lib/schemas/finance/gl/consolidation.ts

import { z } from 'zod';

export const createConsolidationSnapshotSchema = z.object({
  periodId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  subAccountIds: z.array(z.string().uuid()).min(1),
  consolidationMethod: z.enum(['FULL', 'PROPORTIONAL', 'EQUITY']).default('FULL'),
  notes: z.string().max(1000).optional(),
});

export const executeConsolidationSchema = z.object({
  snapshotId: z.string().uuid(),
});

export const consolidationAdjustmentSchema = z.object({
  snapshotId: z.string().uuid(),
  description: z.string().min(1).max(500),
  debitAccountCode: z.string().min(1),
  creditAccountCode: z.string().min(1),
  amount: z.number().positive(),
  adjustmentType: z.enum([
    'MANUAL',
    'MINORITY_INTEREST',
    'GOODWILL',
    'OTHER',
  ]),
  notes: z.string().max(1000).optional(),
});

export const intercompanyEliminationSchema = z.object({
  snapshotId: z.string().uuid(),
  description: z.string().min(1).max(500),
  subAccountId1: z.string().uuid(),
  subAccountId2: z.string().uuid(),
  accountCode1: z.string().min(1),
  accountCode2: z.string().min(1),
  amount: z.number().positive(),
  eliminationType: z.enum([
    'REVENUE_EXPENSE',
    'RECEIVABLE_PAYABLE',
    'INVENTORY_PROFIT',
    'OTHER',
  ]),
  notes: z.string().max(1000).optional(),
});

export const subAccountOwnershipSchema = z.object({
  subAccountId: z.string().uuid(),
  ownershipPercentage: z.number().min(0).max(100),
  consolidationMethod: z.enum(['FULL', 'PROPORTIONAL', 'EQUITY']),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().optional(),
  minorityInterestAccountCode: z.string().optional(),
});

export type CreateConsolidationSnapshotInput = z.infer<typeof createConsolidationSnapshotSchema>;
export type ConsolidationAdjustmentInput = z.infer<typeof consolidationAdjustmentSchema>;
export type IntercompanyEliminationInput = z.infer<typeof intercompanyEliminationSchema>;
export type SubAccountOwnershipInput = z.infer<typeof subAccountOwnershipSchema>;
```

### 5.7 Report Schema

```typescript
// src/lib/schemas/finance/gl/report.ts

import { z } from 'zod';

export const generateReportSchema = z.object({
  reportType: z.enum([
    'BALANCE_SHEET',
    'INCOME_STATEMENT',
    'CASH_FLOW',
    'TRIAL_BALANCE',
    'GENERAL_LEDGER',
    'SUBSIDIARY_LEDGER',
    'ACCOUNT_BALANCE',
    'CONSOLIDATED_BALANCE_SHEET',
    'CONSOLIDATED_INCOME_STATEMENT',
    'CONSOLIDATED_CASH_FLOW',
    'INTERCOMPANY_REPORT',
    'CUSTOM',
  ]),
  
  // Time range
  periodId: z.string().uuid().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  
  // Filters
  accountIds: z.array(z.string().uuid()).optional(),
  accountTypes: z.array(z.enum([
    'ASSET',
    'LIABILITY',
    'EQUITY',
    'REVENUE',
    'EXPENSE',
  ])).optional(),
  
  // For consolidation reports
  subAccountIds: z.array(z.string().uuid()).optional(),
  consolidationSnapshotId: z.string().uuid().optional(),
  
  // Options
  includeZeroBalances: z.boolean().default(false),
  showAccountDetails: z.boolean().default(true),
  comparePeriodId: z.string().uuid().optional(), // For comparative reports
  
  // Export format
  format: z.enum(['PDF', 'EXCEL', 'CSV', 'JSON']).default('PDF'),
});

export const saveReportSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  reportType: z.enum([
    'BALANCE_SHEET',
    'INCOME_STATEMENT',
    'CASH_FLOW',
    'TRIAL_BALANCE',
    'GENERAL_LEDGER',
    'SUBSIDIARY_LEDGER',
    'ACCOUNT_BALANCE',
    'CONSOLIDATED_BALANCE_SHEET',
    'CONSOLIDATED_INCOME_STATEMENT',
    'CONSOLIDATED_CASH_FLOW',
    'INTERCOMPANY_REPORT',
    'CUSTOM',
  ]),
  parameters: z.record(z.unknown()),
  isScheduled: z.boolean().default(false),
  schedule: z.string().optional(), // Cron expression
});

export type GenerateReportInput = z.infer<typeof generateReportSchema>;
export type SaveReportInput = z.infer<typeof saveReportSchema>;
```

### 5.8 GL Configuration Schema

```typescript
// src/lib/schemas/finance/gl/configuration.ts

import { z } from 'zod';

export const glConfigurationSchema = z.object({
  // General settings
  baseCurrency: z.string().length(3).default('USD'),
  fiscalYearEnd: z.string().regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/).default('12-31'),
  fiscalYearStart: z.string().regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/).default('01-01'),
  useControlAccounts: z.boolean().default(true),
  
  // Posting settings
  requireApproval: z.boolean().default(true),
  approvalThreshold: z.number().positive().optional(),
  autoPostingEnabled: z.boolean().default(false),
  allowFuturePeriodPost: z.boolean().default(false),
  allowClosedPeriodPost: z.boolean().default(false),
  
  // Consolidation settings
  consolidationEnabled: z.boolean().default(false),
  consolidationMethod: z.enum(['FULL', 'PROPORTIONAL', 'EQUITY']).default('FULL'),
  eliminateIntercompany: z.boolean().default(true),
  
  // Period settings
  autoCreatePeriods: z.boolean().default(true),
  periodLockDays: z.number().int().min(0).max(365).default(5),
  
  // Number formats
  accountCodeFormat: z.string().max(20).default('####-####'),
  accountCodeLength: z.number().int().min(4).max(20).default(8),
  accountCodeSeparator: z.string().max(1).default('-'),
  
  // Audit retention
  retainAuditDays: z.number().int().min(365).max(3650).default(2555),
});

export const updateGLConfigurationSchema = glConfigurationSchema.partial();

export type GLConfigurationInput = z.infer<typeof glConfigurationSchema>;
export type UpdateGLConfigurationInput = z.infer<typeof updateGLConfigurationSchema>;
```

---

## 6. Server Actions

### 6.1 Chart of Accounts Actions

```typescript
// src/lib/finance/gl/actions/chart-of-accounts.ts

'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { hasAgencyPermission, hasSubAccountPermission } from '@/lib/iam/authz/permissions'
import { 
  createAccountSchema, 
  updateAccountSchema,
  accountHierarchyMoveSchema,
  consolidationMappingSchema,
  type CreateAccountInput,
  type UpdateAccountInput,
} from '@/lib/schemas/finance/gl/chart-of-accounts'
import { logGLAudit } from './audit'
import { Prisma } from '@/generated/prisma/client'

// ========== Types ==========

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

type COAContext = {
  agencyId?: string
  subAccountId?: string
}

// ========== Helper Functions ==========

const getContext = async (): Promise<COAContext | null> => {
  const session = await auth()
  if (!session?.user?.id) return null
  
  const dbSession = await db.session.findFirst({
    where: { userId: session.user.id },
    select: { activeAgencyId: true, activeSubAccountId: true },
  })
  
  return {
    agencyId: dbSession?.activeAgencyId ?? undefined,
    subAccountId: dbSession?.activeSubAccountId ?? undefined,
  }
}

const checkPermission = async (
  context: COAContext,
  permissionKey: string
): Promise<boolean> => {
  if (context.subAccountId) {
    return hasSubAccountPermission(context.subAccountId, permissionKey)
  }
  if (context.agencyId) {
    return hasAgencyPermission(context.agencyId, permissionKey)
  }
  return false
}

const validateAccountCode = async (
  code: string,
  agencyId?: string,
  subAccountId?: string,
  excludeId?: string
): Promise<boolean> => {
  const existing = await db.chartOfAccount.findFirst({
    where: {
      code,
      ...(subAccountId ? { subAccountId } : { agencyId, subAccountId: null }),
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  })
  return !existing
}

const getAccountLevel = async (parentId: string | null): Promise<number> => {
  if (!parentId) return 1
  
  const parent = await db.chartOfAccount.findUnique({
    where: { id: parentId },
    select: { level: true },
  })
  
  return (parent?.level ?? 0) + 1
}

const buildAccountPath = async (parentId: string | null, code: string): Promise<string> => {
  if (!parentId) return code
  
  const parent = await db.chartOfAccount.findUnique({
    where: { id: parentId },
    select: { path: true },
  })
  
  return parent?.path ? `${parent.path}.${code}` : code
}

// ========== CRUD Operations ==========

export const createAccount = async (
  input: CreateAccountInput
): Promise<ActionResult<{ id: string }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.coa.create')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.coa.create' }
    }

    // Validate input
    const validated = createAccountSchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const data = validated.data

    // Check for duplicate account code
    const isUnique = await validateAccountCode(
      data.code,
      context.agencyId,
      context.subAccountId
    )
    if (!isUnique) {
      return { success: false, error: `Account code ${data.code} already exists` }
    }

    // Calculate level and path
    const level = await getAccountLevel(data.parentAccountId ?? null)
    if (level > 7) {
      return { success: false, error: 'Maximum account hierarchy depth (7 levels) exceeded' }
    }

    const path = await buildAccountPath(data.parentAccountId ?? null, data.code)

    // Validate control account relationship
    if (data.controlAccountId) {
      const controlAccount = await db.chartOfAccount.findUnique({
        where: { id: data.controlAccountId },
        select: { isControlAccount: true, subledgerType: true },
      })
      
      if (!controlAccount?.isControlAccount) {
        return { success: false, error: 'Specified control account is not marked as a control account' }
      }
    }

    // Create account
    const account = await db.chartOfAccount.create({
      data: {
        ...data,
        level,
        path,
        agencyId: context.agencyId ?? null,
        subAccountId: context.subAccountId ?? null,
      },
    })

    // Audit log
    await logGLAudit({
      action: 'CREATE',
      entityType: 'ChartOfAccount',
      entityId: account.id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      newValues: account as unknown as Prisma.JsonObject,
      description: `Created account: ${data.code} - ${data.name}`,
    })

    // Revalidate cache
    if (context.subAccountId) {
      revalidatePath(`/subaccount/${context.subAccountId}/finance/gl/chart-of-accounts`)
    } else if (context.agencyId) {
      revalidatePath(`/agency/${context.agencyId}/finance/gl/chart-of-accounts`)
    }

    return { success: true, data: { id: account.id } }
  } catch (error) {
    console.error('Error creating account:', error)
    return { success: false, error: 'Failed to create account' }
  }
}

export const updateAccount = async (
  input: UpdateAccountInput
): Promise<ActionResult<{ id: string }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.coa.edit')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.coa.edit' }
    }

    const validated = updateAccountSchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const { id, ...data } = validated.data

    // Get existing account
    const existing = await db.chartOfAccount.findUnique({
      where: { id },
      include: { AccountBalances: { take: 1 } },
    })

    if (!existing) {
      return { success: false, error: 'Account not found' }
    }

    // Check if account has transactions (restrict certain changes)
    if (existing.AccountBalances.length > 0) {
      if (data.accountType && data.accountType !== existing.accountType) {
        return { success: false, error: 'Cannot change account type after transactions have been posted' }
      }
      if (data.normalBalance && data.normalBalance !== existing.normalBalance) {
        return { success: false, error: 'Cannot change normal balance after transactions have been posted' }
      }
    }

    // Check for duplicate code if changing
    if (data.code && data.code !== existing.code) {
      const isUnique = await validateAccountCode(
        data.code,
        context.agencyId,
        context.subAccountId,
        id
      )
      if (!isUnique) {
        return { success: false, error: `Account code ${data.code} already exists` }
      }
    }

    // Update account
    const updated = await db.chartOfAccount.update({
      where: { id },
      data,
    })

    // Audit log
    await logGLAudit({
      action: 'UPDATE',
      entityType: 'ChartOfAccount',
      entityId: id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      previousValues: existing as unknown as Prisma.JsonObject,
      newValues: updated as unknown as Prisma.JsonObject,
      description: `Updated account: ${updated.code} - ${updated.name}`,
    })

    // Revalidate cache
    if (context.subAccountId) {
      revalidatePath(`/subaccount/${context.subAccountId}/finance/gl/chart-of-accounts`)
    } else if (context.agencyId) {
      revalidatePath(`/agency/${context.agencyId}/finance/gl/chart-of-accounts`)
    }

    return { success: true, data: { id: updated.id } }
  } catch (error) {
    console.error('Error updating account:', error)
    return { success: false, error: 'Failed to update account' }
  }
}

export const deleteAccount = async (
  id: string
): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.coa.delete')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.coa.delete' }
    }

    // Get existing account
    const existing = await db.chartOfAccount.findUnique({
      where: { id },
      include: {
        AccountBalances: { take: 1 },
        ChildAccounts: { take: 1 },
        JournalEntryLines: { take: 1 },
      },
    })

    if (!existing) {
      return { success: false, error: 'Account not found' }
    }

    // Prevent deletion if account has children
    if (existing.ChildAccounts.length > 0) {
      return { success: false, error: 'Cannot delete account with child accounts' }
    }

    // Prevent deletion if account has transactions
    if (existing.JournalEntryLines.length > 0 || existing.AccountBalances.length > 0) {
      return { success: false, error: 'Cannot delete account with posted transactions' }
    }

    // Prevent deletion of system accounts
    if (existing.isSystemAccount) {
      return { success: false, error: 'Cannot delete system accounts' }
    }

    // Delete account
    await db.chartOfAccount.delete({ where: { id } })

    // Audit log
    await logGLAudit({
      action: 'DELETE',
      entityType: 'ChartOfAccount',
      entityId: id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      previousValues: existing as unknown as Prisma.JsonObject,
      description: `Deleted account: ${existing.code} - ${existing.name}`,
    })

    // Revalidate cache
    if (context.subAccountId) {
      revalidatePath(`/subaccount/${context.subAccountId}/finance/gl/chart-of-accounts`)
    } else if (context.agencyId) {
      revalidatePath(`/agency/${context.agencyId}/finance/gl/chart-of-accounts`)
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting account:', error)
    return { success: false, error: 'Failed to delete account' }
  }
}

// ========== Query Operations ==========

export const getChartOfAccounts = async (options?: {
  includeInactive?: boolean
  accountType?: string
  parentId?: string | null
  search?: string
}): Promise<ActionResult<any[]>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.coa.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.coa.view' }
    }

    const accounts = await db.chartOfAccount.findMany({
      where: {
        ...(context.subAccountId 
          ? { subAccountId: context.subAccountId } 
          : { agencyId: context.agencyId, subAccountId: null }
        ),
        ...(options?.includeInactive ? {} : { isActive: true }),
        ...(options?.accountType ? { accountType: options.accountType as any } : {}),
        ...(options?.parentId !== undefined 
          ? { parentAccountId: options.parentId } 
          : {}
        ),
        ...(options?.search 
          ? {
              OR: [
                { code: { contains: options.search, mode: 'insensitive' } },
                { name: { contains: options.search, mode: 'insensitive' } },
              ],
            }
          : {}
        ),
      },
      include: {
        ParentAccount: { select: { id: true, code: true, name: true } },
        ControlAccount: { select: { id: true, code: true, name: true } },
        _count: { select: { ChildAccounts: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
    })

    return { success: true, data: accounts }
  } catch (error) {
    console.error('Error fetching chart of accounts:', error)
    return { success: false, error: 'Failed to fetch chart of accounts' }
  }
}

export const getAccountById = async (
  id: string
): Promise<ActionResult<any>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.coa.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.coa.view' }
    }

    const account = await db.chartOfAccount.findUnique({
      where: { id },
      include: {
        ParentAccount: true,
        ChildAccounts: true,
        ControlAccount: true,
        SubledgerAccounts: true,
        AccountBalances: {
          orderBy: { Period: { startDate: 'desc' } },
          take: 12,
          include: { Period: true },
        },
      },
    })

    if (!account) {
      return { success: false, error: 'Account not found' }
    }

    return { success: true, data: account }
  } catch (error) {
    console.error('Error fetching account:', error)
    return { success: false, error: 'Failed to fetch account' }
  }
}

export const getAccountHierarchy = async (): Promise<ActionResult<any[]>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.coa.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.coa.view' }
    }

    // Get all accounts for the context
    const accounts = await db.chartOfAccount.findMany({
      where: {
        ...(context.subAccountId 
          ? { subAccountId: context.subAccountId } 
          : { agencyId: context.agencyId, subAccountId: null }
        ),
        isActive: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
    })

    // Build hierarchy tree
    const buildTree = (parentId: string | null): any[] => {
      return accounts
        .filter((a) => a.parentAccountId === parentId)
        .map((account) => ({
          ...account,
          children: buildTree(account.id),
        }))
    }

    const hierarchy = buildTree(null)

    return { success: true, data: hierarchy }
  } catch (error) {
    console.error('Error fetching account hierarchy:', error)
    return { success: false, error: 'Failed to fetch account hierarchy' }
  }
}

// ========== Hierarchy Operations ==========

export const moveAccountInHierarchy = async (
  input: { accountId: string; newParentId: string | null; newSortOrder: number }
): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.coa.edit')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.coa.edit' }
    }

    const validated = accountHierarchyMoveSchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const { accountId, newParentId, newSortOrder } = validated.data

    // Get account
    const account = await db.chartOfAccount.findUnique({
      where: { id: accountId },
    })

    if (!account) {
      return { success: false, error: 'Account not found' }
    }

    // Prevent circular reference
    if (newParentId) {
      let currentParent = newParentId
      while (currentParent) {
        if (currentParent === accountId) {
          return { success: false, error: 'Cannot create circular hierarchy' }
        }
        const parent = await db.chartOfAccount.findUnique({
          where: { id: currentParent },
          select: { parentAccountId: true },
        })
        currentParent = parent?.parentAccountId ?? null
      }
    }

    // Calculate new level and path
    const newLevel = await getAccountLevel(newParentId)
    if (newLevel > 7) {
      return { success: false, error: 'Maximum account hierarchy depth (7 levels) exceeded' }
    }

    const newPath = await buildAccountPath(newParentId, account.code)

    // Update account and all descendants
    await db.$transaction(async (tx) => {
      // Update the moved account
      await tx.chartOfAccount.update({
        where: { id: accountId },
        data: {
          parentAccountId: newParentId,
          sortOrder: newSortOrder,
          level: newLevel,
          path: newPath,
        },
      })

      // Update all descendants' paths and levels
      const updateDescendants = async (parentId: string, parentPath: string, parentLevel: number) => {
        const children = await tx.chartOfAccount.findMany({
          where: { parentAccountId: parentId },
        })

        for (const child of children) {
          const childPath = `${parentPath}.${child.code}`
          const childLevel = parentLevel + 1

          await tx.chartOfAccount.update({
            where: { id: child.id },
            data: { path: childPath, level: childLevel },
          })

          await updateDescendants(child.id, childPath, childLevel)
        }
      }

      await updateDescendants(accountId, newPath, newLevel)
    })

    // Audit log
    await logGLAudit({
      action: 'UPDATE',
      entityType: 'ChartOfAccount',
      entityId: accountId,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Moved account ${account.code} to new parent`,
    })

    // Revalidate cache
    if (context.subAccountId) {
      revalidatePath(`/subaccount/${context.subAccountId}/finance/gl/chart-of-accounts`)
    } else if (context.agencyId) {
      revalidatePath(`/agency/${context.agencyId}/finance/gl/chart-of-accounts`)
    }

    return { success: true }
  } catch (error) {
    console.error('Error moving account:', error)
    return { success: false, error: 'Failed to move account' }
  }
}

// ========== Activation/Deactivation ==========

export const toggleAccountStatus = async (
  id: string,
  isActive: boolean
): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.coa.edit')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.coa.edit' }
    }

    const account = await db.chartOfAccount.findUnique({
      where: { id },
      include: { ChildAccounts: { where: { isActive: true }, take: 1 } },
    })

    if (!account) {
      return { success: false, error: 'Account not found' }
    }

    // Cannot deactivate if has active children
    if (!isActive && account.ChildAccounts.length > 0) {
      return { success: false, error: 'Cannot deactivate account with active child accounts' }
    }

    await db.chartOfAccount.update({
      where: { id },
      data: { isActive },
    })

    // Audit log
    await logGLAudit({
      action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
      entityType: 'ChartOfAccount',
      entityId: id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `${isActive ? 'Activated' : 'Deactivated'} account: ${account.code}`,
    })

    return { success: true }
  } catch (error) {
    console.error('Error toggling account status:', error)
    return { success: false, error: 'Failed to update account status' }
  }
}
```

### 6.2 Journal Entry Actions

```typescript
// src/lib/finance/gl/actions/journal-entries.ts

'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { hasAgencyPermission, hasSubAccountPermission } from '@/lib/iam/authz/permissions'
import {
  createJournalEntrySchema,
  updateJournalEntrySchema,
  approveJournalEntrySchema,
  rejectJournalEntrySchema,
  reverseJournalEntrySchema,
  voidJournalEntrySchema,
  type CreateJournalEntryInput,
  type UpdateJournalEntryInput,
} from '@/lib/schemas/finance/gl/journal-entry'
import { logGLAudit } from './audit'
import { updateAccountBalances } from './balances'
import { Prisma, JournalEntryStatus, PeriodStatus } from '@/generated/prisma/client'

// ========== Types ==========

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

type JEContext = {
  agencyId?: string
  subAccountId?: string
  userId: string
}

// ========== Helper Functions ==========

const getContext = async (): Promise<JEContext | null> => {
  const session = await auth()
  if (!session?.user?.id) return null

  const dbSession = await db.session.findFirst({
    where: { userId: session.user.id },
    select: { activeAgencyId: true, activeSubAccountId: true },
  })

  return {
    userId: session.user.id,
    agencyId: dbSession?.activeAgencyId ?? undefined,
    subAccountId: dbSession?.activeSubAccountId ?? undefined,
  }
}

const checkPermission = async (
  context: JEContext,
  permissionKey: string
): Promise<boolean> => {
  if (context.subAccountId) {
    return hasSubAccountPermission(context.subAccountId, permissionKey)
  }
  if (context.agencyId) {
    return hasAgencyPermission(context.agencyId, permissionKey)
  }
  return false
}

const generateEntryNumber = async (
  agencyId?: string,
  subAccountId?: string
): Promise<string> => {
  const year = new Date().getFullYear()
  const prefix = subAccountId ? 'SUB' : 'AGY'

  const lastEntry = await db.journalEntry.findFirst({
    where: {
      ...(subAccountId ? { subAccountId } : { agencyId, subAccountId: null }),
      entryNumber: { startsWith: `${prefix}-${year}-` },
    },
    orderBy: { entryNumber: 'desc' },
    select: { entryNumber: true },
  })

  let sequence = 1
  if (lastEntry?.entryNumber) {
    const parts = lastEntry.entryNumber.split('-')
    sequence = parseInt(parts[2] || '0', 10) + 1
  }

  return `${prefix}-${year}-${sequence.toString().padStart(6, '0')}`
}

const validatePeriod = async (
  periodId: string,
  entryDate: Date
): Promise<{ valid: boolean; error?: string }> => {
  const period = await db.financialPeriod.findUnique({
    where: { id: periodId },
  })

  if (!period) {
    return { valid: false, error: 'Financial period not found' }
  }

  if (period.status === PeriodStatus.LOCKED) {
    return { valid: false, error: 'Cannot post to a locked period' }
  }

  if (period.status === PeriodStatus.CLOSED) {
    return { valid: false, error: 'Cannot post to a closed period' }
  }

  if (period.status === PeriodStatus.FUTURE) {
    return { valid: false, error: 'Cannot post to a future period' }
  }

  if (entryDate < period.startDate || entryDate > period.endDate) {
    return { valid: false, error: 'Entry date must be within the selected period' }
  }

  return { valid: true }
}

const validateAccounts = async (
  lines: { accountId: string; debitAmount?: number; creditAmount?: number }[]
): Promise<{ valid: boolean; error?: string }> => {
  const accountIds = [...new Set(lines.map((l) => l.accountId))]

  const accounts = await db.chartOfAccount.findMany({
    where: { id: { in: accountIds } },
    select: { id: true, isActive: true, isPostingAccount: true, code: true },
  })

  for (const line of lines) {
    const account = accounts.find((a) => a.id === line.accountId)
    if (!account) {
      return { valid: false, error: `Account not found: ${line.accountId}` }
    }
    if (!account.isActive) {
      return { valid: false, error: `Account ${account.code} is inactive` }
    }
    if (!account.isPostingAccount) {
      return { valid: false, error: `Account ${account.code} does not allow posting` }
    }
  }

  return { valid: true }
}

// ========== CRUD Operations ==========

export const createJournalEntry = async (
  input: CreateJournalEntryInput
): Promise<ActionResult<{ id: string; entryNumber: string }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.journal.create')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.journal.create' }
    }

    // Validate input
    const validated = createJournalEntrySchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const data = validated.data

    // Validate period
    const periodValidation = await validatePeriod(data.periodId, data.entryDate)
    if (!periodValidation.valid) {
      return { success: false, error: periodValidation.error }
    }

    // Validate accounts
    const accountValidation = await validateAccounts(data.lines)
    if (!accountValidation.valid) {
      return { success: false, error: accountValidation.error }
    }

    // Generate entry number
    const entryNumber = await generateEntryNumber(context.agencyId, context.subAccountId)

    // Calculate totals
    const totalDebit = data.lines.reduce((sum, l) => sum + (l.debitAmount || 0), 0)
    const totalCredit = data.lines.reduce((sum, l) => sum + (l.creditAmount || 0), 0)

    // Create journal entry with lines
    const entry = await db.journalEntry.create({
      data: {
        entryNumber,
        periodId: data.periodId,
        entryDate: data.entryDate,
        entryType: data.entryType,
        sourceModule: data.sourceModule,
        sourceId: data.sourceId,
        sourceReference: data.sourceReference,
        description: data.description,
        notes: data.notes,
        currencyCode: data.currencyCode,
        exchangeRate: data.exchangeRate,
        totalDebit,
        totalCredit,
        status: JournalEntryStatus.DRAFT,
        createdBy: context.userId,
        agencyId: context.agencyId ?? null,
        subAccountId: context.subAccountId ?? null,
        Lines: {
          create: data.lines.map((line, index) => ({
            lineNumber: line.lineNumber || index + 1,
            accountId: line.accountId,
            description: line.description,
            debitAmount: line.debitAmount || 0,
            creditAmount: line.creditAmount || 0,
            localDebitAmount: (line.debitAmount || 0) * (data.exchangeRate || 1),
            localCreditAmount: (line.creditAmount || 0) * (data.exchangeRate || 1),
            exchangeRate: line.exchangeRate || data.exchangeRate || 1,
            subledgerType: line.subledgerType,
            subledgerReference: line.subledgerReference,
            taxCode: line.taxCode,
            taxAmount: line.taxAmount,
            dimension1: line.dimension1,
            dimension2: line.dimension2,
            dimension3: line.dimension3,
            dimension4: line.dimension4,
            isIntercompany: line.isIntercompany,
            intercompanySubAccountId: line.intercompanySubAccountId,
          })),
        },
      },
      include: { Lines: true },
    })

    // Audit log
    await logGLAudit({
      action: 'CREATE',
      entityType: 'JournalEntry',
      entityId: entry.id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      newValues: { entryNumber, description: data.description, totalDebit, totalCredit },
      description: `Created journal entry: ${entryNumber}`,
    })

    // Revalidate cache
    const basePath = context.subAccountId
      ? `/subaccount/${context.subAccountId}/finance/gl`
      : `/agency/${context.agencyId}/finance/gl`
    revalidatePath(`${basePath}/journal-entries`)

    return { success: true, data: { id: entry.id, entryNumber: entry.entryNumber } }
  } catch (error) {
    console.error('Error creating journal entry:', error)
    return { success: false, error: 'Failed to create journal entry' }
  }
}

export const updateJournalEntry = async (
  input: UpdateJournalEntryInput
): Promise<ActionResult<{ id: string }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.journal.edit')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.journal.edit' }
    }

    const validated = updateJournalEntrySchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const { id, lines, ...data } = validated.data

    // Get existing entry
    const existing = await db.journalEntry.findUnique({
      where: { id },
      include: { Lines: true },
    })

    if (!existing) {
      return { success: false, error: 'Journal entry not found' }
    }

    // Only allow editing DRAFT entries
    if (existing.status !== JournalEntryStatus.DRAFT) {
      return { success: false, error: 'Can only edit draft journal entries' }
    }

    // Validate period if changing
    if (data.periodId && data.entryDate) {
      const periodValidation = await validatePeriod(data.periodId, data.entryDate)
      if (!periodValidation.valid) {
        return { success: false, error: periodValidation.error }
      }
    }

    // Validate accounts if lines provided
    if (lines) {
      const accountValidation = await validateAccounts(lines)
      if (!accountValidation.valid) {
        return { success: false, error: accountValidation.error }
      }
    }

    // Update entry
    await db.$transaction(async (tx) => {
      // Delete existing lines if new lines provided
      if (lines) {
        await tx.journalEntryLine.deleteMany({ where: { journalEntryId: id } })
      }

      // Calculate new totals
      const newLines = lines || existing.Lines
      const totalDebit = newLines.reduce((sum, l) => sum + (l.debitAmount || 0), 0)
      const totalCredit = newLines.reduce((sum, l) => sum + (l.creditAmount || 0), 0)

      // Update journal entry
      await tx.journalEntry.update({
        where: { id },
        data: {
          ...data,
          totalDebit,
          totalCredit,
          ...(lines
            ? {
                Lines: {
                  create: lines.map((line, index) => ({
                    lineNumber: line.lineNumber || index + 1,
                    accountId: line.accountId,
                    description: line.description,
                    debitAmount: line.debitAmount || 0,
                    creditAmount: line.creditAmount || 0,
                    localDebitAmount: (line.debitAmount || 0) * (data.exchangeRate || existing.exchangeRate),
                    localCreditAmount: (line.creditAmount || 0) * (data.exchangeRate || existing.exchangeRate),
                    exchangeRate: line.exchangeRate || data.exchangeRate || existing.exchangeRate,
                    subledgerType: line.subledgerType,
                    subledgerReference: line.subledgerReference,
                    taxCode: line.taxCode,
                    taxAmount: line.taxAmount,
                    dimension1: line.dimension1,
                    dimension2: line.dimension2,
                    dimension3: line.dimension3,
                    dimension4: line.dimension4,
                    isIntercompany: line.isIntercompany,
                    intercompanySubAccountId: line.intercompanySubAccountId,
                  })),
                },
              }
            : {}),
        },
      })
    })

    // Audit log
    await logGLAudit({
      action: 'UPDATE',
      entityType: 'JournalEntry',
      entityId: id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Updated journal entry: ${existing.entryNumber}`,
    })

    return { success: true, data: { id } }
  } catch (error) {
    console.error('Error updating journal entry:', error)
    return { success: false, error: 'Failed to update journal entry' }
  }
}

// ========== Workflow Operations ==========

export const submitJournalEntry = async (
  id: string
): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.journal.submit')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.journal.submit' }
    }

    const entry = await db.journalEntry.findUnique({
      where: { id },
      include: { Lines: true },
    })

    if (!entry) {
      return { success: false, error: 'Journal entry not found' }
    }

    if (entry.status !== JournalEntryStatus.DRAFT) {
      return { success: false, error: 'Can only submit draft entries' }
    }

    // Check if entry requires approval
    const config = await db.gLConfiguration.findFirst({
      where: context.subAccountId
        ? { subAccountId: context.subAccountId }
        : { agencyId: context.agencyId },
    })

    const requiresApproval = config?.requireApproval ?? true
    const approvalThreshold = config?.approvalThreshold

    // Check if amount exceeds threshold
    const exceedsThreshold = approvalThreshold
      ? entry.totalDebit > approvalThreshold
      : true

    const newStatus = requiresApproval && exceedsThreshold
      ? JournalEntryStatus.PENDING_APPROVAL
      : JournalEntryStatus.APPROVED

    await db.journalEntry.update({
      where: { id },
      data: {
        status: newStatus,
        submittedAt: new Date(),
        submittedBy: context.userId,
        ...(newStatus === JournalEntryStatus.APPROVED
          ? { approvedAt: new Date(), approvedBy: context.userId }
          : {}),
      },
    })

    // Audit log
    await logGLAudit({
      action: 'SUBMIT',
      entityType: 'JournalEntry',
      entityId: id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Submitted journal entry: ${entry.entryNumber} - Status: ${newStatus}`,
    })

    return { success: true }
  } catch (error) {
    console.error('Error submitting journal entry:', error)
    return { success: false, error: 'Failed to submit journal entry' }
  }
}

export const approveJournalEntry = async (
  input: { id: string; notes?: string }
): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.journal.approve')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.journal.approve' }
    }

    const validated = approveJournalEntrySchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const { id, notes } = validated.data

    const entry = await db.journalEntry.findUnique({ where: { id } })

    if (!entry) {
      return { success: false, error: 'Journal entry not found' }
    }

    if (entry.status !== JournalEntryStatus.PENDING_APPROVAL) {
      return { success: false, error: 'Entry is not pending approval' }
    }

    // Prevent self-approval
    if (entry.createdBy === context.userId) {
      return { success: false, error: 'Cannot approve your own journal entry' }
    }

    await db.journalEntry.update({
      where: { id },
      data: {
        status: JournalEntryStatus.APPROVED,
        approvedAt: new Date(),
        approvedBy: context.userId,
        approvalNotes: notes,
      },
    })

    // Audit log
    await logGLAudit({
      action: 'APPROVE',
      entityType: 'JournalEntry',
      entityId: id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Approved journal entry: ${entry.entryNumber}`,
    })

    return { success: true }
  } catch (error) {
    console.error('Error approving journal entry:', error)
    return { success: false, error: 'Failed to approve journal entry' }
  }
}

export const rejectJournalEntry = async (
  input: { id: string; reason: string }
): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.journal.reject')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.journal.reject' }
    }

    const validated = rejectJournalEntrySchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const { id, reason } = validated.data

    const entry = await db.journalEntry.findUnique({ where: { id } })

    if (!entry) {
      return { success: false, error: 'Journal entry not found' }
    }

    if (entry.status !== JournalEntryStatus.PENDING_APPROVAL) {
      return { success: false, error: 'Entry is not pending approval' }
    }

    await db.journalEntry.update({
      where: { id },
      data: {
        status: JournalEntryStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedBy: context.userId,
        rejectionReason: reason,
      },
    })

    // Audit log
    await logGLAudit({
      action: 'REJECT',
      entityType: 'JournalEntry',
      entityId: id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Rejected journal entry: ${entry.entryNumber} - Reason: ${reason}`,
    })

    return { success: true }
  } catch (error) {
    console.error('Error rejecting journal entry:', error)
    return { success: false, error: 'Failed to reject journal entry' }
  }
}

export const postJournalEntry = async (
  id: string
): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.journal.post')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.journal.post' }
    }

    const entry = await db.journalEntry.findUnique({
      where: { id },
      include: { Lines: true, Period: true },
    })

    if (!entry) {
      return { success: false, error: 'Journal entry not found' }
    }

    if (entry.status !== JournalEntryStatus.APPROVED) {
      return { success: false, error: 'Can only post approved entries' }
    }

    // Validate period is still open
    if (entry.Period.status !== PeriodStatus.OPEN) {
      return { success: false, error: 'Cannot post to a non-open period' }
    }

    // Post entry and update balances
    await db.$transaction(async (tx) => {
      // Update entry status
      await tx.journalEntry.update({
        where: { id },
        data: {
          status: JournalEntryStatus.POSTED,
          postedAt: new Date(),
          postedBy: context.userId,
        },
      })

      // Update account balances for each line
      for (const line of entry.Lines) {
        await updateAccountBalances(tx, {
          accountId: line.accountId,
          periodId: entry.periodId,
          debitAmount: line.localDebitAmount,
          creditAmount: line.localCreditAmount,
          journalEntryId: id,
        })
      }
    })

    // Audit log
    await logGLAudit({
      action: 'POST',
      entityType: 'JournalEntry',
      entityId: id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Posted journal entry: ${entry.entryNumber}`,
    })

    // Revalidate cache
    const basePath = context.subAccountId
      ? `/subaccount/${context.subAccountId}/finance/gl`
      : `/agency/${context.agencyId}/finance/gl`
    revalidatePath(`${basePath}/journal-entries`)
    revalidatePath(`${basePath}/balances`)

    return { success: true }
  } catch (error) {
    console.error('Error posting journal entry:', error)
    return { success: false, error: 'Failed to post journal entry' }
  }
}

export const reverseJournalEntry = async (
  input: { id: string; reversalDate: Date; reason: string }
): Promise<ActionResult<{ reversalEntryId: string }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.journal.reverse')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.journal.reverse' }
    }

    const validated = reverseJournalEntrySchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const { id, reversalDate, reason } = validated.data

    const entry = await db.journalEntry.findUnique({
      where: { id },
      include: { Lines: true },
    })

    if (!entry) {
      return { success: false, error: 'Journal entry not found' }
    }

    if (entry.status !== JournalEntryStatus.POSTED) {
      return { success: false, error: 'Can only reverse posted entries' }
    }

    if (entry.isReversed) {
      return { success: false, error: 'Entry has already been reversed' }
    }

    // Find period for reversal date
    const reversalPeriod = await db.financialPeriod.findFirst({
      where: {
        startDate: { lte: reversalDate },
        endDate: { gte: reversalDate },
        status: PeriodStatus.OPEN,
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId }),
      },
    })

    if (!reversalPeriod) {
      return { success: false, error: 'No open period found for reversal date' }
    }

    // Generate reversal entry number
    const reversalEntryNumber = await generateEntryNumber(context.agencyId, context.subAccountId)

    // Create reversal entry
    const reversalEntry = await db.$transaction(async (tx) => {
      // Create reversal journal entry with swapped debits/credits
      const reversal = await tx.journalEntry.create({
        data: {
          entryNumber: reversalEntryNumber,
          periodId: reversalPeriod.id,
          entryDate: reversalDate,
          entryType: 'REVERSAL',
          sourceModule: entry.sourceModule,
          sourceId: entry.id,
          sourceReference: `Reversal of ${entry.entryNumber}`,
          description: `Reversal: ${entry.description}`,
          notes: reason,
          currencyCode: entry.currencyCode,
          exchangeRate: entry.exchangeRate,
          totalDebit: entry.totalCredit,
          totalCredit: entry.totalDebit,
          status: JournalEntryStatus.POSTED,
          createdBy: context.userId,
          submittedAt: new Date(),
          submittedBy: context.userId,
          approvedAt: new Date(),
          approvedBy: context.userId,
          postedAt: new Date(),
          postedBy: context.userId,
          reversalOfId: entry.id,
          agencyId: context.agencyId ?? null,
          subAccountId: context.subAccountId ?? null,
          Lines: {
            create: entry.Lines.map((line) => ({
              lineNumber: line.lineNumber,
              accountId: line.accountId,
              description: `Reversal: ${line.description || ''}`,
              debitAmount: line.creditAmount,
              creditAmount: line.debitAmount,
              localDebitAmount: line.localCreditAmount,
              localCreditAmount: line.localDebitAmount,
              exchangeRate: line.exchangeRate,
              subledgerType: line.subledgerType,
              subledgerReference: line.subledgerReference,
            })),
          },
        },
      })

      // Mark original entry as reversed
      await tx.journalEntry.update({
        where: { id },
        data: {
          isReversed: true,
          reversedAt: new Date(),
          reversedBy: context.userId,
        },
      })

      // Update account balances for reversal
      for (const line of entry.Lines) {
        await updateAccountBalances(tx, {
          accountId: line.accountId,
          periodId: reversalPeriod.id,
          debitAmount: line.localCreditAmount,
          creditAmount: line.localDebitAmount,
          journalEntryId: reversal.id,
        })
      }

      return reversal
    })

    // Audit log
    await logGLAudit({
      action: 'REVERSE',
      entityType: 'JournalEntry',
      entityId: id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Reversed journal entry: ${entry.entryNumber} -> ${reversalEntryNumber}`,
    })

    return { success: true, data: { reversalEntryId: reversalEntry.id } }
  } catch (error) {
    console.error('Error reversing journal entry:', error)
    return { success: false, error: 'Failed to reverse journal entry' }
  }
}

export const voidJournalEntry = async (
  input: { id: string; reason: string }
): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.journal.void')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.journal.void' }
    }

    const validated = voidJournalEntrySchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const { id, reason } = validated.data

    const entry = await db.journalEntry.findUnique({ where: { id } })

    if (!entry) {
      return { success: false, error: 'Journal entry not found' }
    }

    // Can only void draft or rejected entries
    if (![JournalEntryStatus.DRAFT, JournalEntryStatus.REJECTED].includes(entry.status)) {
      return { success: false, error: 'Can only void draft or rejected entries. Use reverse for posted entries.' }
    }

    await db.journalEntry.update({
      where: { id },
      data: {
        status: JournalEntryStatus.VOIDED,
        voidedAt: new Date(),
        voidedBy: context.userId,
        voidReason: reason,
      },
    })

    // Audit log
    await logGLAudit({
      action: 'VOID',
      entityType: 'JournalEntry',
      entityId: id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Voided journal entry: ${entry.entryNumber} - Reason: ${reason}`,
    })

    return { success: true }
  } catch (error) {
    console.error('Error voiding journal entry:', error)
    return { success: false, error: 'Failed to void journal entry' }
  }
}

// ========== Query Operations ==========

export const getJournalEntries = async (options?: {
  status?: JournalEntryStatus
  periodId?: string
  fromDate?: Date
  toDate?: Date
  search?: string
  page?: number
  pageSize?: number
}): Promise<ActionResult<{ entries: any[]; total: number }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.journal.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.journal.view' }
    }

    const page = options?.page || 1
    const pageSize = options?.pageSize || 20
    const skip = (page - 1) * pageSize

    const where: Prisma.JournalEntryWhereInput = {
      ...(context.subAccountId
        ? { subAccountId: context.subAccountId }
        : { agencyId: context.agencyId, subAccountId: null }),
      ...(options?.status ? { status: options.status } : {}),
      ...(options?.periodId ? { periodId: options.periodId } : {}),
      ...(options?.fromDate || options?.toDate
        ? {
            entryDate: {
              ...(options.fromDate ? { gte: options.fromDate } : {}),
              ...(options.toDate ? { lte: options.toDate } : {}),
            },
          }
        : {}),
      ...(options?.search
        ? {
            OR: [
              { entryNumber: { contains: options.search, mode: 'insensitive' } },
              { description: { contains: options.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    }

    const [entries, total] = await Promise.all([
      db.journalEntry.findMany({
        where,
        include: {
          Period: { select: { name: true } },
          Lines: {
            include: {
              Account: { select: { code: true, name: true } },
            },
          },
          CreatedByUser: { select: { name: true } },
        },
        orderBy: { entryDate: 'desc' },
        skip,
        take: pageSize,
      }),
      db.journalEntry.count({ where }),
    ])

    return { success: true, data: { entries, total } }
  } catch (error) {
    console.error('Error fetching journal entries:', error)
    return { success: false, error: 'Failed to fetch journal entries' }
  }
}

export const getJournalEntryById = async (
  id: string
): Promise<ActionResult<any>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.journal.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.journal.view' }
    }

    const entry = await db.journalEntry.findUnique({
      where: { id },
      include: {
        Period: true,
        Lines: {
          include: {
            Account: true,
          },
          orderBy: { lineNumber: 'asc' },
        },
        CreatedByUser: { select: { id: true, name: true, email: true } },
        SubmittedByUser: { select: { id: true, name: true, email: true } },
        ApprovedByUser: { select: { id: true, name: true, email: true } },
        RejectedByUser: { select: { id: true, name: true, email: true } },
        PostedByUser: { select: { id: true, name: true, email: true } },
        ReversalOf: { select: { id: true, entryNumber: true } },
        ReversedByEntry: { select: { id: true, entryNumber: true } },
      },
    })

    if (!entry) {
      return { success: false, error: 'Journal entry not found' }
    }

    return { success: true, data: entry }
  } catch (error) {
    console.error('Error fetching journal entry:', error)
    return { success: false, error: 'Failed to fetch journal entry' }
  }
}
```

---

*Continue to Part 3.3: Financial Periods & Balances Actions...*

### 6.3 Financial Periods Actions

```typescript
// src/lib/finance/gl/actions/periods.ts

'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { hasAgencyPermission, hasSubAccountPermission } from '@/lib/iam/authz/permissions'
import {
  createPeriodSchema,
  updatePeriodSchema,
  yearEndProcessingSchema,
  type CreatePeriodInput,
  type UpdatePeriodInput,
  type YearEndProcessingInput,
} from '@/lib/schemas/finance/gl/period'
import { logGLAudit } from './audit'
import { PeriodStatus, PeriodType, JournalEntryStatus, JournalEntryType } from '@/generated/prisma/client'

// ========== Types ==========

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

type PeriodContext = {
  agencyId?: string
  subAccountId?: string
  userId: string
}

// ========== Helper Functions ==========

const getContext = async (): Promise<PeriodContext | null> => {
  const session = await auth()
  if (!session?.user?.id) return null

  const dbSession = await db.session.findFirst({
    where: { userId: session.user.id },
    select: { activeAgencyId: true, activeSubAccountId: true },
  })

  return {
    userId: session.user.id,
    agencyId: dbSession?.activeAgencyId ?? undefined,
    subAccountId: dbSession?.activeSubAccountId ?? undefined,
  }
}

const checkPermission = async (
  context: PeriodContext,
  permissionKey: string
): Promise<boolean> => {
  if (context.subAccountId) {
    return hasSubAccountPermission(context.subAccountId, permissionKey)
  }
  if (context.agencyId) {
    return hasAgencyPermission(context.agencyId, permissionKey)
  }
  return false
}

const generatePeriodName = (
  type: PeriodType,
  fiscalYear: number,
  fiscalPeriod: number
): string => {
  switch (type) {
    case PeriodType.MONTH:
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${months[fiscalPeriod - 1]} ${fiscalYear}`
    case PeriodType.QUARTER:
      return `Q${fiscalPeriod} ${fiscalYear}`
    case PeriodType.HALF_YEAR:
      return `H${fiscalPeriod} ${fiscalYear}`
    case PeriodType.YEAR:
      return `FY ${fiscalYear}`
    default:
      return `Period ${fiscalPeriod} ${fiscalYear}`
  }
}

// ========== CRUD Operations ==========

export const createPeriod = async (
  input: CreatePeriodInput
): Promise<ActionResult<{ id: string }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.periods.create')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.periods.create' }
    }

    const validated = createPeriodSchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const data = validated.data

    // Check for overlapping periods
    const overlapping = await db.financialPeriod.findFirst({
      where: {
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId, subAccountId: null }),
        OR: [
          {
            startDate: { lte: data.endDate },
            endDate: { gte: data.startDate },
          },
        ],
      },
    })

    if (overlapping) {
      return { success: false, error: `Period overlaps with existing period: ${overlapping.name}` }
    }

    // Determine initial status
    const now = new Date()
    let status: PeriodStatus = PeriodStatus.FUTURE
    if (data.startDate <= now && data.endDate >= now) {
      status = PeriodStatus.OPEN
    } else if (data.endDate < now) {
      status = PeriodStatus.CLOSED
    }

    const period = await db.financialPeriod.create({
      data: {
        name: data.name || generatePeriodName(data.periodType, data.fiscalYear, data.fiscalPeriod),
        shortName: data.shortName,
        periodType: data.periodType,
        fiscalYear: data.fiscalYear,
        fiscalPeriod: data.fiscalPeriod,
        startDate: data.startDate,
        endDate: data.endDate,
        isYearEnd: data.isYearEnd,
        status,
        notes: data.notes,
        agencyId: context.agencyId ?? null,
        subAccountId: context.subAccountId ?? null,
      },
    })

    // Audit log
    await logGLAudit({
      action: 'CREATE',
      entityType: 'FinancialPeriod',
      entityId: period.id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Created period: ${period.name}`,
    })

    return { success: true, data: { id: period.id } }
  } catch (error) {
    console.error('Error creating period:', error)
    return { success: false, error: 'Failed to create period' }
  }
}

export const openPeriod = async (
  id: string
): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.periods.open')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.periods.open' }
    }

    const period = await db.financialPeriod.findUnique({ where: { id } })

    if (!period) {
      return { success: false, error: 'Period not found' }
    }

    if (period.status === PeriodStatus.LOCKED) {
      return { success: false, error: 'Cannot open a locked period' }
    }

    if (period.status === PeriodStatus.OPEN) {
      return { success: false, error: 'Period is already open' }
    }

    await db.financialPeriod.update({
      where: { id },
      data: {
        status: PeriodStatus.OPEN,
        openedAt: new Date(),
        openedBy: context.userId,
      },
    })

    // Audit log
    await logGLAudit({
      action: 'OPEN',
      entityType: 'FinancialPeriod',
      entityId: id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Opened period: ${period.name}`,
    })

    return { success: true }
  } catch (error) {
    console.error('Error opening period:', error)
    return { success: false, error: 'Failed to open period' }
  }
}

export const closePeriod = async (
  input: { id: string; notes?: string }
): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.periods.close')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.periods.close' }
    }

    const { id, notes } = input

    const period = await db.financialPeriod.findUnique({ where: { id } })

    if (!period) {
      return { success: false, error: 'Period not found' }
    }

    if (period.status !== PeriodStatus.OPEN) {
      return { success: false, error: 'Can only close open periods' }
    }

    // Check for unposted entries
    const unpostedEntries = await db.journalEntry.count({
      where: {
        periodId: id,
        status: {
          in: [JournalEntryStatus.DRAFT, JournalEntryStatus.PENDING_APPROVAL, JournalEntryStatus.APPROVED],
        },
      },
    })

    if (unpostedEntries > 0) {
      return { success: false, error: `Cannot close period with ${unpostedEntries} unposted entries` }
    }

    await db.financialPeriod.update({
      where: { id },
      data: {
        status: PeriodStatus.CLOSED,
        closedAt: new Date(),
        closedBy: context.userId,
        closeNotes: notes,
      },
    })

    // Audit log
    await logGLAudit({
      action: 'CLOSE',
      entityType: 'FinancialPeriod',
      entityId: id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Closed period: ${period.name}`,
    })

    return { success: true }
  } catch (error) {
    console.error('Error closing period:', error)
    return { success: false, error: 'Failed to close period' }
  }
}

export const lockPeriod = async (
  input: { id: string; notes?: string }
): Promise<ActionResult<void>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.periods.lock')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.periods.lock' }
    }

    const { id, notes } = input

    const period = await db.financialPeriod.findUnique({ where: { id } })

    if (!period) {
      return { success: false, error: 'Period not found' }
    }

    if (period.status !== PeriodStatus.CLOSED) {
      return { success: false, error: 'Can only lock closed periods' }
    }

    await db.financialPeriod.update({
      where: { id },
      data: {
        status: PeriodStatus.LOCKED,
        lockedAt: new Date(),
        lockedBy: context.userId,
        lockNotes: notes,
      },
    })

    // Audit log
    await logGLAudit({
      action: 'LOCK',
      entityType: 'FinancialPeriod',
      entityId: id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Locked period: ${period.name}`,
    })

    return { success: true }
  } catch (error) {
    console.error('Error locking period:', error)
    return { success: false, error: 'Failed to lock period' }
  }
}

// ========== Year-End Processing ==========

export const processYearEnd = async (
  input: YearEndProcessingInput
): Promise<ActionResult<{ closingEntryId: string; openingEntryId?: string }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.periods.year_end')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.periods.year_end' }
    }

    const validated = yearEndProcessingSchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const { periodId, retainedEarningsAccountId, createBroughtForward, notes } = validated.data

    // Get period
    const period = await db.financialPeriod.findUnique({ where: { id: periodId } })

    if (!period) {
      return { success: false, error: 'Period not found' }
    }

    if (!period.isYearEnd) {
      return { success: false, error: 'Selected period is not marked as year-end' }
    }

    if (period.status !== PeriodStatus.OPEN) {
      return { success: false, error: 'Year-end period must be open' }
    }

    // Get retained earnings account
    const retainedEarningsAccount = await db.chartOfAccount.findUnique({
      where: { id: retainedEarningsAccountId },
    })

    if (!retainedEarningsAccount) {
      return { success: false, error: 'Retained earnings account not found' }
    }

    // Get all income and expense account balances for the fiscal year
    const incomeExpenseBalances = await db.accountBalance.findMany({
      where: {
        Period: { fiscalYear: period.fiscalYear },
        Account: {
          accountType: { in: ['REVENUE', 'EXPENSE'] },
        },
      },
      include: { Account: true },
    })

    // Calculate net income/loss
    let totalRevenue = 0
    let totalExpense = 0

    for (const balance of incomeExpenseBalances) {
      if (balance.Account.accountType === 'REVENUE') {
        totalRevenue += balance.closingBalance
      } else {
        totalExpense += balance.closingBalance
      }
    }

    const netIncome = totalRevenue - totalExpense

    // Create year-end closing entries
    const result = await db.$transaction(async (tx) => {
      const entryNumber = `YE-${period.fiscalYear}-CLOSE`

      // Create closing journal entry
      const closingLines: any[] = []
      let lineNumber = 1

      // Close all revenue accounts (debit)
      for (const balance of incomeExpenseBalances.filter((b) => b.Account.accountType === 'REVENUE')) {
        if (balance.closingBalance !== 0) {
          closingLines.push({
            lineNumber: lineNumber++,
            accountId: balance.accountId,
            description: `Close ${balance.Account.code} to Retained Earnings`,
            debitAmount: balance.closingBalance > 0 ? balance.closingBalance : 0,
            creditAmount: balance.closingBalance < 0 ? Math.abs(balance.closingBalance) : 0,
            localDebitAmount: balance.closingBalance > 0 ? balance.closingBalance : 0,
            localCreditAmount: balance.closingBalance < 0 ? Math.abs(balance.closingBalance) : 0,
          })
        }
      }

      // Close all expense accounts (credit)
      for (const balance of incomeExpenseBalances.filter((b) => b.Account.accountType === 'EXPENSE')) {
        if (balance.closingBalance !== 0) {
          closingLines.push({
            lineNumber: lineNumber++,
            accountId: balance.accountId,
            description: `Close ${balance.Account.code} to Retained Earnings`,
            debitAmount: balance.closingBalance < 0 ? Math.abs(balance.closingBalance) : 0,
            creditAmount: balance.closingBalance > 0 ? balance.closingBalance : 0,
            localDebitAmount: balance.closingBalance < 0 ? Math.abs(balance.closingBalance) : 0,
            localCreditAmount: balance.closingBalance > 0 ? balance.closingBalance : 0,
          })
        }
      }

      // Add retained earnings line (balancing entry)
      closingLines.push({
        lineNumber: lineNumber++,
        accountId: retainedEarningsAccountId,
        description: `Net Income/(Loss) for FY ${period.fiscalYear}`,
        debitAmount: netIncome < 0 ? Math.abs(netIncome) : 0,
        creditAmount: netIncome > 0 ? netIncome : 0,
        localDebitAmount: netIncome < 0 ? Math.abs(netIncome) : 0,
        localCreditAmount: netIncome > 0 ? netIncome : 0,
      })

      const closingEntry = await tx.journalEntry.create({
        data: {
          entryNumber,
          periodId,
          entryDate: period.endDate,
          entryType: JournalEntryType.YEAR_END_CLOSING,
          sourceModule: 'YEAR_END',
          description: `Year-end closing entry for FY ${period.fiscalYear}`,
          notes,
          totalDebit: closingLines.reduce((sum, l) => sum + l.debitAmount, 0),
          totalCredit: closingLines.reduce((sum, l) => sum + l.creditAmount, 0),
          status: JournalEntryStatus.POSTED,
          createdBy: context.userId,
          submittedAt: new Date(),
          submittedBy: context.userId,
          approvedAt: new Date(),
          approvedBy: context.userId,
          postedAt: new Date(),
          postedBy: context.userId,
          agencyId: context.agencyId ?? null,
          subAccountId: context.subAccountId ?? null,
          Lines: { create: closingLines },
        },
      })

      // Mark period as year-end processed
      await tx.financialPeriod.update({
        where: { id: periodId },
        data: { isYearEndProcessed: true },
      })

      let openingEntryId: string | undefined

      // Create brought forward entry for next year if requested
      if (createBroughtForward) {
        // Find or create first period of next year
        let nextPeriod = await tx.financialPeriod.findFirst({
          where: {
            fiscalYear: period.fiscalYear + 1,
            fiscalPeriod: 1,
            ...(context.subAccountId
              ? { subAccountId: context.subAccountId }
              : { agencyId: context.agencyId }),
          },
        })

        if (nextPeriod) {
          // Get all balance sheet account balances
          const balanceSheetBalances = await tx.accountBalance.findMany({
            where: {
              periodId,
              Account: {
                accountType: { in: ['ASSET', 'LIABILITY', 'EQUITY'] },
              },
            },
            include: { Account: true },
          })

          const openingLines: any[] = []
          let openingLineNumber = 1

          for (const balance of balanceSheetBalances) {
            if (balance.closingBalance !== 0) {
              openingLines.push({
                lineNumber: openingLineNumber++,
                accountId: balance.accountId,
                description: `Opening balance brought forward from FY ${period.fiscalYear}`,
                debitAmount: balance.Account.normalBalance === 'DEBIT' && balance.closingBalance > 0 ? balance.closingBalance : 0,
                creditAmount: balance.Account.normalBalance === 'CREDIT' && balance.closingBalance > 0 ? balance.closingBalance : 0,
                localDebitAmount: balance.Account.normalBalance === 'DEBIT' && balance.closingBalance > 0 ? balance.closingBalance : 0,
                localCreditAmount: balance.Account.normalBalance === 'CREDIT' && balance.closingBalance > 0 ? balance.closingBalance : 0,
              })
            }
          }

          if (openingLines.length > 0) {
            const openingEntry = await tx.journalEntry.create({
              data: {
                entryNumber: `YE-${period.fiscalYear + 1}-OPEN`,
                periodId: nextPeriod.id,
                entryDate: nextPeriod.startDate,
                entryType: JournalEntryType.BROUGHT_FORWARD,
                sourceModule: 'YEAR_END',
                description: `Opening balances brought forward from FY ${period.fiscalYear}`,
                totalDebit: openingLines.reduce((sum, l) => sum + l.debitAmount, 0),
                totalCredit: openingLines.reduce((sum, l) => sum + l.creditAmount, 0),
                status: JournalEntryStatus.POSTED,
                createdBy: context.userId,
                submittedAt: new Date(),
                submittedBy: context.userId,
                approvedAt: new Date(),
                approvedBy: context.userId,
                postedAt: new Date(),
                postedBy: context.userId,
                agencyId: context.agencyId ?? null,
                subAccountId: context.subAccountId ?? null,
                Lines: { create: openingLines },
              },
            })

            openingEntryId = openingEntry.id
          }
        }
      }

      return { closingEntryId: closingEntry.id, openingEntryId }
    })

    // Audit log
    await logGLAudit({
      action: 'YEAR_END',
      entityType: 'FinancialPeriod',
      entityId: periodId,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Processed year-end for FY ${period.fiscalYear}. Net Income: ${netIncome}`,
    })

    return { success: true, data: result }
  } catch (error) {
    console.error('Error processing year-end:', error)
    return { success: false, error: 'Failed to process year-end' }
  }
}

// ========== Query Operations ==========

export const getFinancialPeriods = async (options?: {
  fiscalYear?: number
  status?: PeriodStatus
}): Promise<ActionResult<any[]>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.periods.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.periods.view' }
    }

    const periods = await db.financialPeriod.findMany({
      where: {
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId, subAccountId: null }),
        ...(options?.fiscalYear ? { fiscalYear: options.fiscalYear } : {}),
        ...(options?.status ? { status: options.status } : {}),
      },
      include: {
        _count: {
          select: { JournalEntries: true },
        },
      },
      orderBy: [{ fiscalYear: 'desc' }, { fiscalPeriod: 'asc' }],
    })

    return { success: true, data: periods }
  } catch (error) {
    console.error('Error fetching periods:', error)
    return { success: false, error: 'Failed to fetch periods' }
  }
}

export const getCurrentPeriod = async (): Promise<ActionResult<any>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const now = new Date()

    const period = await db.financialPeriod.findFirst({
      where: {
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId, subAccountId: null }),
        startDate: { lte: now },
        endDate: { gte: now },
        status: PeriodStatus.OPEN,
      },
    })

    return { success: true, data: period }
  } catch (error) {
    console.error('Error fetching current period:', error)
    return { success: false, error: 'Failed to fetch current period' }
  }
}

// ========== Auto-Generate Periods ==========

export const generatePeriods = async (
  fiscalYear: number,
  periodType: PeriodType = PeriodType.MONTH
): Promise<ActionResult<{ count: number }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.periods.create')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.periods.create' }
    }

    // Get GL configuration for fiscal year dates
    const config = await db.gLConfiguration.findFirst({
      where: context.subAccountId
        ? { subAccountId: context.subAccountId }
        : { agencyId: context.agencyId },
    })

    const fiscalYearStart = config?.fiscalYearStart || '01-01'
    const [startMonth, startDay] = fiscalYearStart.split('-').map(Number)

    const periods: any[] = []
    let periodsCount = 12

    if (periodType === PeriodType.QUARTER) periodsCount = 4
    if (periodType === PeriodType.HALF_YEAR) periodsCount = 2
    if (periodType === PeriodType.YEAR) periodsCount = 1

    for (let i = 0; i < periodsCount; i++) {
      let startDate: Date
      let endDate: Date

      if (periodType === PeriodType.MONTH) {
        const monthOffset = (startMonth - 1 + i) % 12
        const yearOffset = Math.floor((startMonth - 1 + i) / 12)
        startDate = new Date(fiscalYear + yearOffset, monthOffset, startDay)
        endDate = new Date(fiscalYear + yearOffset, monthOffset + 1, startDay - 1)
      } else if (periodType === PeriodType.QUARTER) {
        const monthOffset = (startMonth - 1 + i * 3) % 12
        const yearOffset = Math.floor((startMonth - 1 + i * 3) / 12)
        startDate = new Date(fiscalYear + yearOffset, monthOffset, startDay)
        endDate = new Date(fiscalYear + yearOffset, monthOffset + 3, startDay - 1)
      } else if (periodType === PeriodType.HALF_YEAR) {
        const monthOffset = (startMonth - 1 + i * 6) % 12
        const yearOffset = Math.floor((startMonth - 1 + i * 6) / 12)
        startDate = new Date(fiscalYear + yearOffset, monthOffset, startDay)
        endDate = new Date(fiscalYear + yearOffset, monthOffset + 6, startDay - 1)
      } else {
        startDate = new Date(fiscalYear, startMonth - 1, startDay)
        endDate = new Date(fiscalYear + 1, startMonth - 1, startDay - 1)
      }

      const isYearEnd = i === periodsCount - 1

      periods.push({
        name: generatePeriodName(periodType, fiscalYear, i + 1),
        periodType,
        fiscalYear,
        fiscalPeriod: i + 1,
        startDate,
        endDate,
        isYearEnd,
        status: PeriodStatus.FUTURE,
        agencyId: context.agencyId ?? null,
        subAccountId: context.subAccountId ?? null,
      })
    }

    // Create periods
    await db.financialPeriod.createMany({
      data: periods,
      skipDuplicates: true,
    })

    return { success: true, data: { count: periods.length } }
  } catch (error) {
    console.error('Error generating periods:', error)
    return { success: false, error: 'Failed to generate periods' }
  }
}
```

### 6.4 Account Balances Actions

```typescript
// src/lib/finance/gl/actions/balances.ts

'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { hasAgencyPermission, hasSubAccountPermission } from '@/lib/iam/authz/permissions'
import { Prisma, BalanceType } from '@/generated/prisma/client'

// ========== Types ==========

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

type BalanceContext = {
  agencyId?: string
  subAccountId?: string
}

type UpdateBalanceInput = {
  accountId: string
  periodId: string
  debitAmount: number
  creditAmount: number
  journalEntryId: string
}

// ========== Helper Functions ==========

const getContext = async (): Promise<BalanceContext | null> => {
  const session = await auth()
  if (!session?.user?.id) return null

  const dbSession = await db.session.findFirst({
    where: { userId: session.user.id },
    select: { activeAgencyId: true, activeSubAccountId: true },
  })

  return {
    agencyId: dbSession?.activeAgencyId ?? undefined,
    subAccountId: dbSession?.activeSubAccountId ?? undefined,
  }
}

const checkPermission = async (
  context: BalanceContext,
  permissionKey: string
): Promise<boolean> => {
  if (context.subAccountId) {
    return hasSubAccountPermission(context.subAccountId, permissionKey)
  }
  if (context.agencyId) {
    return hasAgencyPermission(context.agencyId, permissionKey)
  }
  return false
}

// ========== Internal Balance Update (Used by Journal Entry Posting) ==========

export const updateAccountBalances = async (
  tx: Prisma.TransactionClient,
  input: UpdateBalanceInput
): Promise<void> => {
  const { accountId, periodId, debitAmount, creditAmount, journalEntryId } = input

  // Get account to determine normal balance
  const account = await tx.chartOfAccount.findUnique({
    where: { id: accountId },
    select: { normalBalance: true, accountType: true },
  })

  if (!account) {
    throw new Error(`Account not found: ${accountId}`)
  }

  // Get or create balance record
  let balance = await tx.accountBalance.findUnique({
    where: {
      accountId_periodId: { accountId, periodId },
    },
  })

  if (!balance) {
    // Get previous period balance for opening balance
    const period = await tx.financialPeriod.findUnique({
      where: { id: periodId },
      select: { fiscalYear: true, fiscalPeriod: true, agencyId: true, subAccountId: true },
    })

    let openingBalance = 0

    if (period) {
      const previousPeriod = await tx.financialPeriod.findFirst({
        where: {
          agencyId: period.agencyId,
          subAccountId: period.subAccountId,
          OR: [
            { fiscalYear: period.fiscalYear, fiscalPeriod: { lt: period.fiscalPeriod } },
            { fiscalYear: { lt: period.fiscalYear } },
          ],
        },
        orderBy: [{ fiscalYear: 'desc' }, { fiscalPeriod: 'desc' }],
      })

      if (previousPeriod) {
        const prevBalance = await tx.accountBalance.findUnique({
          where: {
            accountId_periodId: { accountId, periodId: previousPeriod.id },
          },
        })
        openingBalance = prevBalance?.closingBalance ?? 0
      }
    }

    balance = await tx.accountBalance.create({
      data: {
        accountId,
        periodId,
        openingBalance,
        periodDebit: 0,
        periodCredit: 0,
        closingBalance: openingBalance,
        balanceType: BalanceType.NORMAL,
      },
    })
  }

  // Calculate new balances
  const newPeriodDebit = balance.periodDebit + debitAmount
  const newPeriodCredit = balance.periodCredit + creditAmount

  // Calculate closing balance based on normal balance
  let newClosingBalance: number
  if (account.normalBalance === 'DEBIT') {
    // Assets, Expenses: Debit increases, Credit decreases
    newClosingBalance = balance.openingBalance + newPeriodDebit - newPeriodCredit
  } else {
    // Liabilities, Equity, Revenue: Credit increases, Debit decreases
    newClosingBalance = balance.openingBalance - newPeriodDebit + newPeriodCredit
  }

  // Update balance
  await tx.accountBalance.update({
    where: { id: balance.id },
    data: {
      periodDebit: newPeriodDebit,
      periodCredit: newPeriodCredit,
      closingBalance: newClosingBalance,
      lastTransactionDate: new Date(),
    },
  })

  // Propagate changes to subsequent periods
  await propagateBalanceChanges(tx, accountId, periodId)
}

const propagateBalanceChanges = async (
  tx: Prisma.TransactionClient,
  accountId: string,
  fromPeriodId: string
): Promise<void> => {
  // Get the updated period's closing balance
  const updatedBalance = await tx.accountBalance.findUnique({
    where: { accountId_periodId: { accountId, periodId: fromPeriodId } },
    include: { Period: true },
  })

  if (!updatedBalance) return

  // Find all subsequent periods
  const subsequentPeriods = await tx.financialPeriod.findMany({
    where: {
      agencyId: updatedBalance.Period.agencyId,
      subAccountId: updatedBalance.Period.subAccountId,
      OR: [
        {
          fiscalYear: updatedBalance.Period.fiscalYear,
          fiscalPeriod: { gt: updatedBalance.Period.fiscalPeriod },
        },
        { fiscalYear: { gt: updatedBalance.Period.fiscalYear } },
      ],
    },
    orderBy: [{ fiscalYear: 'asc' }, { fiscalPeriod: 'asc' }],
  })

  let previousClosingBalance = updatedBalance.closingBalance

  for (const period of subsequentPeriods) {
    const balance = await tx.accountBalance.findUnique({
      where: { accountId_periodId: { accountId, periodId: period.id } },
    })

    if (balance) {
      // Get account normal balance
      const account = await tx.chartOfAccount.findUnique({
        where: { id: accountId },
        select: { normalBalance: true },
      })

      let newClosingBalance: number
      if (account?.normalBalance === 'DEBIT') {
        newClosingBalance = previousClosingBalance + balance.periodDebit - balance.periodCredit
      } else {
        newClosingBalance = previousClosingBalance - balance.periodDebit + balance.periodCredit
      }

      await tx.accountBalance.update({
        where: { id: balance.id },
        data: {
          openingBalance: previousClosingBalance,
          closingBalance: newClosingBalance,
        },
      })

      previousClosingBalance = newClosingBalance
    }
  }
}

// ========== Query Operations ==========

export const getAccountBalances = async (options?: {
  periodId?: string
  accountType?: string
  includeZero?: boolean
}): Promise<ActionResult<any[]>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.balances.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.balances.view' }
    }

    const balances = await db.accountBalance.findMany({
      where: {
        ...(options?.periodId ? { periodId: options.periodId } : {}),
        ...(options?.accountType
          ? { Account: { accountType: options.accountType as any } }
          : {}),
        ...(options?.includeZero ? {} : { closingBalance: { not: 0 } }),
        Account: {
          ...(context.subAccountId
            ? { subAccountId: context.subAccountId }
            : { agencyId: context.agencyId, subAccountId: null }),
        },
      },
      include: {
        Account: {
          select: {
            id: true,
            code: true,
            name: true,
            accountType: true,
            category: true,
            normalBalance: true,
          },
        },
        Period: {
          select: { id: true, name: true, fiscalYear: true, fiscalPeriod: true },
        },
      },
      orderBy: [{ Account: { code: 'asc' } }],
    })

    return { success: true, data: balances }
  } catch (error) {
    console.error('Error fetching account balances:', error)
    return { success: false, error: 'Failed to fetch account balances' }
  }
}

export const getTrialBalance = async (
  periodId: string
): Promise<ActionResult<any>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.balances.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.balances.view' }
    }

    const balances = await db.accountBalance.findMany({
      where: {
        periodId,
        Account: {
          ...(context.subAccountId
            ? { subAccountId: context.subAccountId }
            : { agencyId: context.agencyId, subAccountId: null }),
          isActive: true,
        },
      },
      include: {
        Account: {
          select: {
            id: true,
            code: true,
            name: true,
            accountType: true,
            normalBalance: true,
          },
        },
      },
      orderBy: { Account: { code: 'asc' } },
    })

    // Calculate totals
    let totalDebit = 0
    let totalCredit = 0

    const trialBalanceLines = balances.map((balance) => {
      const isDebitBalance = balance.Account.normalBalance === 'DEBIT'
      const debitBalance = isDebitBalance && balance.closingBalance > 0 ? balance.closingBalance : 0
      const creditBalance = !isDebitBalance && balance.closingBalance > 0 ? balance.closingBalance : 0

      totalDebit += debitBalance
      totalCredit += creditBalance

      return {
        ...balance,
        debitBalance,
        creditBalance,
      }
    })

    return {
      success: true,
      data: {
        lines: trialBalanceLines,
        totalDebit,
        totalCredit,
        isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
      },
    }
  } catch (error) {
    console.error('Error fetching trial balance:', error)
    return { success: false, error: 'Failed to fetch trial balance' }
  }
}

export const getAccountLedger = async (
  accountId: string,
  options?: { periodId?: string; fromDate?: Date; toDate?: Date }
): Promise<ActionResult<any>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.balances.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.balances.view' }
    }

    // Get account details
    const account = await db.chartOfAccount.findUnique({
      where: { id: accountId },
    })

    if (!account) {
      return { success: false, error: 'Account not found' }
    }

    // Get journal entry lines for this account
    const lines = await db.journalEntryLine.findMany({
      where: {
        accountId,
        JournalEntry: {
          status: 'POSTED',
          ...(options?.periodId ? { periodId: options.periodId } : {}),
          ...(options?.fromDate || options?.toDate
            ? {
                entryDate: {
                  ...(options.fromDate ? { gte: options.fromDate } : {}),
                  ...(options.toDate ? { lte: options.toDate } : {}),
                },
              }
            : {}),
        },
      },
      include: {
        JournalEntry: {
          select: {
            id: true,
            entryNumber: true,
            entryDate: true,
            description: true,
            sourceModule: true,
          },
        },
      },
      orderBy: { JournalEntry: { entryDate: 'asc' } },
    })

    // Calculate running balance
    let runningBalance = 0
    const ledgerLines = lines.map((line) => {
      if (account.normalBalance === 'DEBIT') {
        runningBalance += line.localDebitAmount - line.localCreditAmount
      } else {
        runningBalance += line.localCreditAmount - line.localDebitAmount
      }

      return {
        ...line,
        runningBalance,
      }
    })

    return {
      success: true,
      data: {
        account,
        lines: ledgerLines,
        openingBalance: 0, // TODO: Calculate from period
        closingBalance: runningBalance,
      },
    }
  } catch (error) {
    console.error('Error fetching account ledger:', error)
    return { success: false, error: 'Failed to fetch account ledger' }
  }
}
```

---

*Continue to Part 3.5: Multi-Currency & Audit Actions...*

### 6.5 Multi-Currency Actions

```typescript
// src/lib/finance/gl/actions/currency.ts

'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { hasAgencyPermission, hasSubAccountPermission } from '@/lib/iam/authz/permissions'
import {
  createCurrencySchema,
  createExchangeRateSchema,
  currencyRevaluationSchema,
  convertAmountSchema,
  type CreateCurrencyInput,
  type CreateExchangeRateInput,
  type CurrencyRevaluationInput,
  type ConvertAmountInput,
} from '@/lib/schemas/finance/gl/currency'
import { logGLAudit } from './audit'
import { JournalEntryStatus, JournalEntryType, PeriodStatus } from '@/generated/prisma/client'

// ========== Types ==========

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

type CurrencyContext = {
  agencyId?: string
  subAccountId?: string
  userId: string
}

// ========== Helper Functions ==========

const getContext = async (): Promise<CurrencyContext | null> => {
  const session = await auth()
  if (!session?.user?.id) return null

  const dbSession = await db.session.findFirst({
    where: { userId: session.user.id },
    select: { activeAgencyId: true, activeSubAccountId: true },
  })

  return {
    userId: session.user.id,
    agencyId: dbSession?.activeAgencyId ?? undefined,
    subAccountId: dbSession?.activeSubAccountId ?? undefined,
  }
}

const checkPermission = async (
  context: CurrencyContext,
  permissionKey: string
): Promise<boolean> => {
  if (context.subAccountId) {
    return hasSubAccountPermission(context.subAccountId, permissionKey)
  }
  if (context.agencyId) {
    return hasAgencyPermission(context.agencyId, permissionKey)
  }
  return false
}

// ========== Currency Management ==========

export const createCurrency = async (
  input: CreateCurrencyInput
): Promise<ActionResult<{ id: string }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.currency.create')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.currency.create' }
    }

    const validated = createCurrencySchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const data = validated.data

    // Check for duplicate currency code
    const existing = await db.currency.findFirst({
      where: {
        code: data.code,
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId }),
      },
    })

    if (existing) {
      return { success: false, error: `Currency ${data.code} already exists` }
    }

    const currency = await db.currency.create({
      data: {
        ...data,
        agencyId: context.agencyId ?? null,
        subAccountId: context.subAccountId ?? null,
      },
    })

    // Audit log
    await logGLAudit({
      action: 'CREATE',
      entityType: 'Currency',
      entityId: currency.id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Created currency: ${data.code} - ${data.name}`,
    })

    return { success: true, data: { id: currency.id } }
  } catch (error) {
    console.error('Error creating currency:', error)
    return { success: false, error: 'Failed to create currency' }
  }
}

export const getCurrencies = async (): Promise<ActionResult<any[]>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.currency.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.currency.view' }
    }

    const currencies = await db.currency.findMany({
      where: {
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId }),
        isActive: true,
      },
      orderBy: { code: 'asc' },
    })

    return { success: true, data: currencies }
  } catch (error) {
    console.error('Error fetching currencies:', error)
    return { success: false, error: 'Failed to fetch currencies' }
  }
}

// ========== Exchange Rate Management ==========

export const createExchangeRate = async (
  input: CreateExchangeRateInput
): Promise<ActionResult<{ id: string }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.currency.edit')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.currency.edit' }
    }

    const validated = createExchangeRateSchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const data = validated.data

    const exchangeRate = await db.exchangeRate.create({
      data: {
        ...data,
        agencyId: context.agencyId ?? null,
        subAccountId: context.subAccountId ?? null,
      },
    })

    // Audit log
    await logGLAudit({
      action: 'CREATE',
      entityType: 'ExchangeRate',
      entityId: exchangeRate.id,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Created exchange rate: ${data.fromCurrencyCode}/${data.toCurrencyCode} = ${data.rate}`,
    })

    return { success: true, data: { id: exchangeRate.id } }
  } catch (error) {
    console.error('Error creating exchange rate:', error)
    return { success: false, error: 'Failed to create exchange rate' }
  }
}

export const getExchangeRates = async (options?: {
  fromCurrency?: string
  toCurrency?: string
  effectiveDate?: Date
  rateType?: string
}): Promise<ActionResult<any[]>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.currency.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.currency.view' }
    }

    const effectiveDate = options?.effectiveDate || new Date()

    const rates = await db.exchangeRate.findMany({
      where: {
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId }),
        ...(options?.fromCurrency ? { fromCurrencyCode: options.fromCurrency } : {}),
        ...(options?.toCurrency ? { toCurrencyCode: options.toCurrency } : {}),
        ...(options?.rateType ? { rateType: options.rateType as any } : {}),
        effectiveDate: { lte: effectiveDate },
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: effectiveDate } },
        ],
      },
      orderBy: { effectiveDate: 'desc' },
    })

    return { success: true, data: rates }
  } catch (error) {
    console.error('Error fetching exchange rates:', error)
    return { success: false, error: 'Failed to fetch exchange rates' }
  }
}

export const getExchangeRate = async (
  fromCurrency: string,
  toCurrency: string,
  effectiveDate?: Date,
  rateType: string = 'SPOT'
): Promise<ActionResult<number>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const date = effectiveDate || new Date()

    // Same currency = rate of 1
    if (fromCurrency === toCurrency) {
      return { success: true, data: 1 }
    }

    // Try direct rate
    const directRate = await db.exchangeRate.findFirst({
      where: {
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId }),
        fromCurrencyCode: fromCurrency,
        toCurrencyCode: toCurrency,
        rateType: rateType as any,
        effectiveDate: { lte: date },
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: date } },
        ],
      },
      orderBy: { effectiveDate: 'desc' },
    })

    if (directRate) {
      return { success: true, data: directRate.rate }
    }

    // Try inverse rate
    const inverseRate = await db.exchangeRate.findFirst({
      where: {
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId }),
        fromCurrencyCode: toCurrency,
        toCurrencyCode: fromCurrency,
        rateType: rateType as any,
        effectiveDate: { lte: date },
        OR: [
          { expiryDate: null },
          { expiryDate: { gte: date } },
        ],
      },
      orderBy: { effectiveDate: 'desc' },
    })

    if (inverseRate) {
      return { success: true, data: 1 / inverseRate.rate }
    }

    return { success: false, error: `No exchange rate found for ${fromCurrency}/${toCurrency}` }
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    return { success: false, error: 'Failed to fetch exchange rate' }
  }
}

// ========== Currency Conversion ==========

export const convertAmount = async (
  input: ConvertAmountInput
): Promise<ActionResult<{ convertedAmount: number; rate: number }>> => {
  try {
    const validated = convertAmountSchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const { amount, fromCurrencyCode, toCurrencyCode, effectiveDate, rateType } = validated.data

    const rateResult = await getExchangeRate(
      fromCurrencyCode,
      toCurrencyCode,
      effectiveDate,
      rateType
    )

    if (!rateResult.success || rateResult.data === undefined) {
      return { success: false, error: rateResult.error || 'Exchange rate not found' }
    }

    const rate = rateResult.data
    const convertedAmount = Math.round(amount * rate * 100) / 100

    return { success: true, data: { convertedAmount, rate } }
  } catch (error) {
    console.error('Error converting amount:', error)
    return { success: false, error: 'Failed to convert amount' }
  }
}

// ========== Currency Revaluation ==========

export const runCurrencyRevaluation = async (
  input: CurrencyRevaluationInput
): Promise<ActionResult<{ journalEntryId: string; gainLoss: number }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.currency.revalue')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.currency.revalue' }
    }

    const validated = currencyRevaluationSchema.safeParse(input)
    if (!validated.success) {
      return { success: false, error: validated.error.errors[0].message }
    }

    const { periodId, currencyCode, revaluationDate, exchangeRate, notes } = validated.data

    // Get period
    const period = await db.financialPeriod.findUnique({ where: { id: periodId } })
    if (!period || period.status !== PeriodStatus.OPEN) {
      return { success: false, error: 'Period not found or not open' }
    }

    // Get GL configuration
    const config = await db.gLConfiguration.findFirst({
      where: context.subAccountId
        ? { subAccountId: context.subAccountId }
        : { agencyId: context.agencyId },
    })

    const baseCurrency = config?.baseCurrency || 'USD'

    if (currencyCode === baseCurrency) {
      return { success: false, error: 'Cannot revalue base currency' }
    }

    // Get all foreign currency accounts with balances
    const foreignCurrencyBalances = await db.accountBalance.findMany({
      where: {
        periodId,
        Account: {
          currencyCode,
          isMultiCurrency: true,
          ...(context.subAccountId
            ? { subAccountId: context.subAccountId }
            : { agencyId: context.agencyId }),
        },
      },
      include: { Account: true },
    })

    if (foreignCurrencyBalances.length === 0) {
      return { success: false, error: 'No foreign currency accounts found for revaluation' }
    }

    // Get unrealized gain/loss account
    const unrealizedGainLossAccount = await db.chartOfAccount.findFirst({
      where: {
        systemAccountType: 'UNREALIZED_GAIN_LOSS',
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId }),
      },
    })

    if (!unrealizedGainLossAccount) {
      return { success: false, error: 'Unrealized gain/loss account not configured' }
    }

    // Calculate revaluation adjustments
    let totalGainLoss = 0
    const revaluationLines: any[] = []

    for (const balance of foreignCurrencyBalances) {
      const currentLocalBalance = balance.closingBalance
      const revaluedBalance = balance.closingBalance * exchangeRate // Assuming closingBalance is in foreign currency
      const difference = revaluedBalance - currentLocalBalance

      if (Math.abs(difference) > 0.01) {
        totalGainLoss += difference

        revaluationLines.push({
          accountId: balance.accountId,
          description: `Currency revaluation: ${currencyCode} at ${exchangeRate}`,
          debitAmount: difference > 0 ? difference : 0,
          creditAmount: difference < 0 ? Math.abs(difference) : 0,
          localDebitAmount: difference > 0 ? difference : 0,
          localCreditAmount: difference < 0 ? Math.abs(difference) : 0,
        })
      }
    }

    if (revaluationLines.length === 0) {
      return { success: false, error: 'No revaluation adjustments needed' }
    }

    // Add balancing entry to unrealized gain/loss account
    revaluationLines.push({
      accountId: unrealizedGainLossAccount.id,
      description: `Currency revaluation ${totalGainLoss > 0 ? 'gain' : 'loss'}: ${currencyCode}`,
      debitAmount: totalGainLoss < 0 ? Math.abs(totalGainLoss) : 0,
      creditAmount: totalGainLoss > 0 ? totalGainLoss : 0,
      localDebitAmount: totalGainLoss < 0 ? Math.abs(totalGainLoss) : 0,
      localCreditAmount: totalGainLoss > 0 ? totalGainLoss : 0,
    })

    // Create revaluation journal entry
    const journalEntry = await db.$transaction(async (tx) => {
      const entry = await tx.journalEntry.create({
        data: {
          entryNumber: `REVAL-${currencyCode}-${revaluationDate.toISOString().split('T')[0]}`,
          periodId,
          entryDate: revaluationDate,
          entryType: JournalEntryType.ADJUSTMENT,
          sourceModule: 'ADJUSTMENT',
          description: `Currency revaluation for ${currencyCode} at rate ${exchangeRate}`,
          notes,
          currencyCode: baseCurrency,
          exchangeRate: 1,
          totalDebit: revaluationLines.reduce((sum, l) => sum + (l.debitAmount || 0), 0),
          totalCredit: revaluationLines.reduce((sum, l) => sum + (l.creditAmount || 0), 0),
          status: JournalEntryStatus.POSTED,
          createdBy: context.userId,
          submittedAt: new Date(),
          submittedBy: context.userId,
          approvedAt: new Date(),
          approvedBy: context.userId,
          postedAt: new Date(),
          postedBy: context.userId,
          agencyId: context.agencyId ?? null,
          subAccountId: context.subAccountId ?? null,
          Lines: {
            create: revaluationLines.map((line, index) => ({
              lineNumber: index + 1,
              ...line,
            })),
          },
        },
      })

      // Record revaluation
      await tx.currencyRevaluation.create({
        data: {
          periodId,
          currencyCode,
          revaluationDate,
          originalRate: 1, // Previous rate (simplified)
          newRate: exchangeRate,
          unrealizedGainLoss: totalGainLoss,
          journalEntryId: entry.id,
          createdBy: context.userId,
          agencyId: context.agencyId ?? null,
          subAccountId: context.subAccountId ?? null,
        },
      })

      return entry
    })

    // Audit log
    await logGLAudit({
      action: 'REVALUE',
      entityType: 'Currency',
      entityId: currencyCode,
      agencyId: context.agencyId,
      subAccountId: context.subAccountId,
      description: `Currency revaluation: ${currencyCode} at ${exchangeRate}. Gain/Loss: ${totalGainLoss}`,
    })

    return {
      success: true,
      data: { journalEntryId: journalEntry.id, gainLoss: totalGainLoss },
    }
  } catch (error) {
    console.error('Error running currency revaluation:', error)
    return { success: false, error: 'Failed to run currency revaluation' }
  }
}
```

### 6.6 Audit Trail Actions

```typescript
// src/lib/finance/gl/actions/audit.ts

'use server'

import { db } from '@/lib/db'
import { auth } from '@/auth'
import { hasAgencyPermission, hasSubAccountPermission } from '@/lib/iam/authz/permissions'
import { AuditAction, Prisma } from '@/generated/prisma/client'

// ========== Types ==========

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

type AuditContext = {
  agencyId?: string
  subAccountId?: string
  userId: string
}

type LogAuditInput = {
  action: AuditAction | string
  entityType: string
  entityId: string
  agencyId?: string
  subAccountId?: string
  previousValues?: Prisma.JsonObject
  newValues?: Prisma.JsonObject
  description: string
  ipAddress?: string
  userAgent?: string
}

// ========== Helper Functions ==========

const getContext = async (): Promise<AuditContext | null> => {
  const session = await auth()
  if (!session?.user?.id) return null

  const dbSession = await db.session.findFirst({
    where: { userId: session.user.id },
    select: { activeAgencyId: true, activeSubAccountId: true },
  })

  return {
    userId: session.user.id,
    agencyId: dbSession?.activeAgencyId ?? undefined,
    subAccountId: dbSession?.activeSubAccountId ?? undefined,
  }
}

const checkPermission = async (
  context: AuditContext,
  permissionKey: string
): Promise<boolean> => {
  if (context.subAccountId) {
    return hasSubAccountPermission(context.subAccountId, permissionKey)
  }
  if (context.agencyId) {
    return hasAgencyPermission(context.agencyId, permissionKey)
  }
  return false
}

// ========== Audit Logging (Internal) ==========

export const logGLAudit = async (input: LogAuditInput): Promise<void> => {
  try {
    const context = await getContext()
    if (!context) return

    await db.gLAuditTrail.create({
      data: {
        action: input.action as AuditAction,
        entityType: input.entityType,
        entityId: input.entityId,
        userId: context.userId,
        agencyId: input.agencyId || context.agencyId || null,
        subAccountId: input.subAccountId || context.subAccountId || null,
        previousValues: input.previousValues || Prisma.JsonNull,
        newValues: input.newValues || Prisma.JsonNull,
        description: input.description,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        timestamp: new Date(),
      },
    })
  } catch (error) {
    // Log error but don't fail the main operation
    console.error('Error logging audit trail:', error)
  }
}

// ========== Query Operations ==========

export const getAuditTrail = async (options?: {
  entityType?: string
  entityId?: string
  action?: AuditAction
  userId?: string
  fromDate?: Date
  toDate?: Date
  page?: number
  pageSize?: number
}): Promise<ActionResult<{ entries: any[]; total: number }>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.audit.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.audit.view' }
    }

    const page = options?.page || 1
    const pageSize = options?.pageSize || 50
    const skip = (page - 1) * pageSize

    const where: Prisma.GLAuditTrailWhereInput = {
      ...(context.subAccountId
        ? { subAccountId: context.subAccountId }
        : { agencyId: context.agencyId }),
      ...(options?.entityType ? { entityType: options.entityType } : {}),
      ...(options?.entityId ? { entityId: options.entityId } : {}),
      ...(options?.action ? { action: options.action } : {}),
      ...(options?.userId ? { userId: options.userId } : {}),
      ...(options?.fromDate || options?.toDate
        ? {
            timestamp: {
              ...(options.fromDate ? { gte: options.fromDate } : {}),
              ...(options.toDate ? { lte: options.toDate } : {}),
            },
          }
        : {}),
    }

    const [entries, total] = await Promise.all([
      db.gLAuditTrail.findMany({
        where,
        include: {
          User: { select: { id: true, name: true, email: true } },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: pageSize,
      }),
      db.gLAuditTrail.count({ where }),
    ])

    return { success: true, data: { entries, total } }
  } catch (error) {
    console.error('Error fetching audit trail:', error)
    return { success: false, error: 'Failed to fetch audit trail' }
  }
}

export const getEntityAuditHistory = async (
  entityType: string,
  entityId: string
): Promise<ActionResult<any[]>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.audit.view')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.audit.view' }
    }

    const entries = await db.gLAuditTrail.findMany({
      where: {
        entityType,
        entityId,
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId }),
      },
      include: {
        User: { select: { id: true, name: true, email: true } },
      },
      orderBy: { timestamp: 'desc' },
    })

    return { success: true, data: entries }
  } catch (error) {
    console.error('Error fetching entity audit history:', error)
    return { success: false, error: 'Failed to fetch entity audit history' }
  }
}

export const exportAuditTrail = async (options?: {
  entityType?: string
  fromDate?: Date
  toDate?: Date
  format?: 'json' | 'csv'
}): Promise<ActionResult<any>> => {
  try {
    const context = await getContext()
    if (!context) {
      return { success: false, error: 'Unauthorized: No session found' }
    }

    const hasPermission = await checkPermission(context, 'finance.gl.audit.export')
    if (!hasPermission) {
      return { success: false, error: 'Unauthorized: Missing permission finance.gl.audit.export' }
    }

    const entries = await db.gLAuditTrail.findMany({
      where: {
        ...(context.subAccountId
          ? { subAccountId: context.subAccountId }
          : { agencyId: context.agencyId }),
        ...(options?.entityType ? { entityType: options.entityType } : {}),
        ...(options?.fromDate || options?.toDate
          ? {
              timestamp: {
                ...(options.fromDate ? { gte: options.fromDate } : {}),
                ...(options.toDate ? { lte: options.toDate } : {}),
              },
            }
          : {}),
      },
      include: {
        User: { select: { id: true, name: true, email: true } },
      },
      orderBy: { timestamp: 'desc' },
      take: 10000, // Limit export size
    })

    if (options?.format === 'csv') {
      // Convert to CSV format
      const headers = ['Timestamp', 'Action', 'Entity Type', 'Entity ID', 'User', 'Description']
      const rows = entries.map((e) => [
        e.timestamp.toISOString(),
        e.action,
        e.entityType,
        e.entityId,
        e.User?.name || 'System',
        e.description,
      ])

      const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n')
      return { success: true, data: { format: 'csv', content: csv } }
    }

    return { success: true, data: { format: 'json', content: entries } }
  } catch (error) {
    console.error('Error exporting audit trail:', error)
    return { success: false, error: 'Failed to export audit trail' }
  }
}
```

---

*Continue to Part 4: API Routes...*

## 7. API Routes

### 7.1 Report Export API

```typescript
// src/app/api/finance/gl/reports/export/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { hasAgencyPermission, hasSubAccountPermission } from '@/lib/iam/authz/permissions'
import { generateReportSchema } from '@/lib/schemas/finance/gl/report'
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun } from 'docx'
import * as XLSX from 'xlsx'

// ========== GET - Generate Report ==========

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const reportType = searchParams.get('type')
    const periodId = searchParams.get('periodId')
    const format = searchParams.get('format') || 'json'
    const agencyId = searchParams.get('agencyId')
    const subAccountId = searchParams.get('subAccountId')

    // Check permissions
    if (subAccountId) {
      const hasPermission = await hasSubAccountPermission(subAccountId, 'finance.gl.reports.generate')
      if (!hasPermission) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else if (agencyId) {
      const hasPermission = await hasAgencyPermission(agencyId, 'finance.gl.reports.generate')
      if (!hasPermission) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'Missing context' }, { status: 400 })
    }

    // Generate report based on type
    let reportData: any

    switch (reportType) {
      case 'TRIAL_BALANCE':
        reportData = await generateTrialBalance(periodId!, subAccountId, agencyId)
        break
      case 'BALANCE_SHEET':
        reportData = await generateBalanceSheet(periodId!, subAccountId, agencyId)
        break
      case 'INCOME_STATEMENT':
        reportData = await generateIncomeStatement(periodId!, subAccountId, agencyId)
        break
      case 'GENERAL_LEDGER':
        reportData = await generateGeneralLedger(periodId!, subAccountId, agencyId)
        break
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    // Export in requested format
    if (format === 'json') {
      return NextResponse.json(reportData)
    }

    if (format === 'csv') {
      const csv = convertToCSV(reportData)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${reportType}_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    }

    if (format === 'xlsx') {
      const workbook = convertToXLSX(reportData, reportType!)
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${reportType}_${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      })
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}

// ========== Report Generation Functions ==========

async function generateTrialBalance(
  periodId: string,
  subAccountId?: string | null,
  agencyId?: string | null
) {
  const balances = await db.accountBalance.findMany({
    where: {
      periodId,
      Account: {
        ...(subAccountId ? { subAccountId } : { agencyId, subAccountId: null }),
        isActive: true,
      },
    },
    include: {
      Account: {
        select: {
          code: true,
          name: true,
          accountType: true,
          normalBalance: true,
        },
      },
      Period: {
        select: { name: true, fiscalYear: true, fiscalPeriod: true },
      },
    },
    orderBy: { Account: { code: 'asc' } },
  })

  let totalDebit = 0
  let totalCredit = 0

  const lines = balances.map((balance) => {
    const isDebitBalance = balance.Account.normalBalance === 'DEBIT'
    const debitBalance = isDebitBalance && balance.closingBalance > 0 ? balance.closingBalance : 
                         !isDebitBalance && balance.closingBalance < 0 ? Math.abs(balance.closingBalance) : 0
    const creditBalance = !isDebitBalance && balance.closingBalance > 0 ? balance.closingBalance :
                          isDebitBalance && balance.closingBalance < 0 ? Math.abs(balance.closingBalance) : 0

    totalDebit += debitBalance
    totalCredit += creditBalance

    return {
      accountCode: balance.Account.code,
      accountName: balance.Account.name,
      accountType: balance.Account.accountType,
      debit: debitBalance,
      credit: creditBalance,
    }
  })

  return {
    reportType: 'TRIAL_BALANCE',
    period: balances[0]?.Period,
    generatedAt: new Date().toISOString(),
    lines,
    totals: {
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
    },
  }
}

async function generateBalanceSheet(
  periodId: string,
  subAccountId?: string | null,
  agencyId?: string | null
) {
  const balances = await db.accountBalance.findMany({
    where: {
      periodId,
      Account: {
        ...(subAccountId ? { subAccountId } : { agencyId, subAccountId: null }),
        accountType: { in: ['ASSET', 'LIABILITY', 'EQUITY'] },
        isActive: true,
      },
    },
    include: {
      Account: {
        select: {
          code: true,
          name: true,
          accountType: true,
          category: true,
          normalBalance: true,
        },
      },
      Period: {
        select: { name: true, fiscalYear: true, fiscalPeriod: true, endDate: true },
      },
    },
    orderBy: { Account: { code: 'asc' } },
  })

  // Group by account type
  const assets = balances.filter((b) => b.Account.accountType === 'ASSET')
  const liabilities = balances.filter((b) => b.Account.accountType === 'LIABILITY')
  const equity = balances.filter((b) => b.Account.accountType === 'EQUITY')

  const totalAssets = assets.reduce((sum, b) => sum + b.closingBalance, 0)
  const totalLiabilities = liabilities.reduce((sum, b) => sum + Math.abs(b.closingBalance), 0)
  const totalEquity = equity.reduce((sum, b) => sum + Math.abs(b.closingBalance), 0)

  return {
    reportType: 'BALANCE_SHEET',
    period: balances[0]?.Period,
    asOfDate: balances[0]?.Period?.endDate,
    generatedAt: new Date().toISOString(),
    sections: {
      assets: {
        lines: assets.map((b) => ({
          accountCode: b.Account.code,
          accountName: b.Account.name,
          category: b.Account.category,
          balance: b.closingBalance,
        })),
        total: totalAssets,
      },
      liabilities: {
        lines: liabilities.map((b) => ({
          accountCode: b.Account.code,
          accountName: b.Account.name,
          category: b.Account.category,
          balance: Math.abs(b.closingBalance),
        })),
        total: totalLiabilities,
      },
      equity: {
        lines: equity.map((b) => ({
          accountCode: b.Account.code,
          accountName: b.Account.name,
          category: b.Account.category,
          balance: Math.abs(b.closingBalance),
        })),
        total: totalEquity,
      },
    },
    totals: {
      totalAssets,
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    },
  }
}

async function generateIncomeStatement(
  periodId: string,
  subAccountId?: string | null,
  agencyId?: string | null
) {
  const balances = await db.accountBalance.findMany({
    where: {
      periodId,
      Account: {
        ...(subAccountId ? { subAccountId } : { agencyId, subAccountId: null }),
        accountType: { in: ['REVENUE', 'EXPENSE'] },
        isActive: true,
      },
    },
    include: {
      Account: {
        select: {
          code: true,
          name: true,
          accountType: true,
          category: true,
        },
      },
      Period: {
        select: { name: true, fiscalYear: true, fiscalPeriod: true, startDate: true, endDate: true },
      },
    },
    orderBy: { Account: { code: 'asc' } },
  })

  const revenue = balances.filter((b) => b.Account.accountType === 'REVENUE')
  const expenses = balances.filter((b) => b.Account.accountType === 'EXPENSE')

  const totalRevenue = revenue.reduce((sum, b) => sum + Math.abs(b.closingBalance), 0)
  const totalExpenses = expenses.reduce((sum, b) => sum + b.closingBalance, 0)
  const netIncome = totalRevenue - totalExpenses

  return {
    reportType: 'INCOME_STATEMENT',
    period: balances[0]?.Period,
    generatedAt: new Date().toISOString(),
    sections: {
      revenue: {
        lines: revenue.map((b) => ({
          accountCode: b.Account.code,
          accountName: b.Account.name,
          category: b.Account.category,
          amount: Math.abs(b.closingBalance),
        })),
        total: totalRevenue,
      },
      expenses: {
        lines: expenses.map((b) => ({
          accountCode: b.Account.code,
          accountName: b.Account.name,
          category: b.Account.category,
          amount: b.closingBalance,
        })),
        total: totalExpenses,
      },
    },
    totals: {
      totalRevenue,
      totalExpenses,
      netIncome,
      isProfit: netIncome >= 0,
    },
  }
}

async function generateGeneralLedger(
  periodId: string,
  subAccountId?: string | null,
  agencyId?: string | null
) {
  const entries = await db.journalEntryLine.findMany({
    where: {
      JournalEntry: {
        periodId,
        status: 'POSTED',
        ...(subAccountId ? { subAccountId } : { agencyId, subAccountId: null }),
      },
    },
    include: {
      Account: {
        select: { code: true, name: true },
      },
      JournalEntry: {
        select: {
          entryNumber: true,
          entryDate: true,
          description: true,
        },
      },
    },
    orderBy: [{ Account: { code: 'asc' } }, { JournalEntry: { entryDate: 'asc' } }],
  })

  // Group by account
  const accountGroups: Record<string, any> = {}

  for (const entry of entries) {
    const accountKey = entry.Account.code
    if (!accountGroups[accountKey]) {
      accountGroups[accountKey] = {
        accountCode: entry.Account.code,
        accountName: entry.Account.name,
        entries: [],
        totalDebit: 0,
        totalCredit: 0,
      }
    }

    accountGroups[accountKey].entries.push({
      date: entry.JournalEntry.entryDate,
      entryNumber: entry.JournalEntry.entryNumber,
      description: entry.description || entry.JournalEntry.description,
      debit: entry.localDebitAmount,
      credit: entry.localCreditAmount,
    })

    accountGroups[accountKey].totalDebit += entry.localDebitAmount
    accountGroups[accountKey].totalCredit += entry.localCreditAmount
  }

  return {
    reportType: 'GENERAL_LEDGER',
    periodId,
    generatedAt: new Date().toISOString(),
    accounts: Object.values(accountGroups),
  }
}

// ========== Export Helpers ==========

function convertToCSV(data: any): string {
  if (data.reportType === 'TRIAL_BALANCE') {
    const headers = ['Account Code', 'Account Name', 'Type', 'Debit', 'Credit']
    const rows = data.lines.map((l: any) => [
      l.accountCode,
      `"${l.accountName}"`,
      l.accountType,
      l.debit.toFixed(2),
      l.credit.toFixed(2),
    ])
    rows.push(['', 'TOTALS', '', data.totals.totalDebit.toFixed(2), data.totals.totalCredit.toFixed(2)])
    return [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n')
  }

  // Generic CSV conversion
  const lines: string[] = []
  lines.push(`Report Type: ${data.reportType}`)
  lines.push(`Generated: ${data.generatedAt}`)
  lines.push('')
  lines.push(JSON.stringify(data, null, 2))
  return lines.join('\n')
}

function convertToXLSX(data: any, reportType: string): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new()

  if (reportType === 'TRIAL_BALANCE') {
    const wsData = [
      ['Trial Balance Report'],
      ['Period:', data.period?.name || 'N/A'],
      ['Generated:', data.generatedAt],
      [],
      ['Account Code', 'Account Name', 'Type', 'Debit', 'Credit'],
      ...data.lines.map((l: any) => [l.accountCode, l.accountName, l.accountType, l.debit, l.credit]),
      [],
      ['', 'TOTALS', '', data.totals.totalDebit, data.totals.totalCredit],
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(workbook, ws, 'Trial Balance')
  } else if (reportType === 'BALANCE_SHEET') {
    const wsData = [
      ['Balance Sheet'],
      ['As of:', data.asOfDate],
      ['Generated:', data.generatedAt],
      [],
      ['ASSETS'],
      ['Account Code', 'Account Name', 'Category', 'Balance'],
      ...data.sections.assets.lines.map((l: any) => [l.accountCode, l.accountName, l.category, l.balance]),
      ['', '', 'Total Assets', data.sections.assets.total],
      [],
      ['LIABILITIES'],
      ...data.sections.liabilities.lines.map((l: any) => [l.accountCode, l.accountName, l.category, l.balance]),
      ['', '', 'Total Liabilities', data.sections.liabilities.total],
      [],
      ['EQUITY'],
      ...data.sections.equity.lines.map((l: any) => [l.accountCode, l.accountName, l.category, l.balance]),
      ['', '', 'Total Equity', data.sections.equity.total],
      [],
      ['', '', 'Total Liabilities & Equity', data.totals.totalLiabilitiesAndEquity],
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(workbook, ws, 'Balance Sheet')
  } else if (reportType === 'INCOME_STATEMENT') {
    const wsData = [
      ['Income Statement'],
      ['Period:', data.period?.name || 'N/A'],
      ['Generated:', data.generatedAt],
      [],
      ['REVENUE'],
      ['Account Code', 'Account Name', 'Category', 'Amount'],
      ...data.sections.revenue.lines.map((l: any) => [l.accountCode, l.accountName, l.category, l.amount]),
      ['', '', 'Total Revenue', data.sections.revenue.total],
      [],
      ['EXPENSES'],
      ...data.sections.expenses.lines.map((l: any) => [l.accountCode, l.accountName, l.category, l.amount]),
      ['', '', 'Total Expenses', data.sections.expenses.total],
      [],
      ['', '', 'NET INCOME', data.totals.netIncome],
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(workbook, ws, 'Income Statement')
  }

  return workbook
}
```

### 7.2 Consolidation API

```typescript
// src/app/api/finance/gl/consolidation/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { hasAgencyPermission } from '@/lib/iam/authz/permissions'
import { ConsolidationStatus, ConsolidationMethod } from '@/generated/prisma/client'

// ========== POST - Execute Consolidation ==========

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { snapshotId } = body

    // Get snapshot
    const snapshot = await db.consolidationSnapshot.findUnique({
      where: { id: snapshotId },
      include: {
        Agency: true,
        Period: true,
        SubAccounts: {
          include: {
            SubAccount: true,
          },
        },
      },
    })

    if (!snapshot) {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 })
    }

    // Check permission
    const hasPermission = await hasAgencyPermission(snapshot.agencyId, 'finance.gl.consolidation.execute')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (snapshot.status !== ConsolidationStatus.DRAFT) {
      return NextResponse.json({ error: 'Snapshot is not in draft status' }, { status: 400 })
    }

    // Execute consolidation
    const result = await db.$transaction(async (tx) => {
      // Get all subaccount balances for the period
      const subAccountIds = snapshot.SubAccounts.map((sa) => sa.subAccountId)
      
      const balances = await tx.accountBalance.findMany({
        where: {
          periodId: snapshot.periodId,
          Account: {
            subAccountId: { in: subAccountIds },
            isConsolidationEnabled: true,
          },
        },
        include: {
          Account: {
            include: {
              ConsolidationMappings: {
                where: {
                  agencyId: snapshot.agencyId,
                },
              },
            },
          },
        },
      })

      // Get ownership percentages
      const ownerships = await tx.subAccountOwnership.findMany({
        where: {
          agencyId: snapshot.agencyId,
          subAccountId: { in: subAccountIds },
          effectiveFrom: { lte: snapshot.Period.endDate },
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: snapshot.Period.startDate } },
          ],
        },
      })

      const ownershipMap = new Map(ownerships.map((o) => [o.subAccountId, o]))

      // Create consolidated balances
      const consolidatedBalances: Map<string, number> = new Map()

      for (const balance of balances) {
        const ownership = ownershipMap.get(balance.Account.subAccountId!)
        const ownershipPct = ownership?.ownershipPercentage || 100
        const method = ownership?.consolidationMethod || ConsolidationMethod.FULL

        let consolidatedAmount = balance.closingBalance

        // Apply consolidation method
        if (method === ConsolidationMethod.PROPORTIONAL) {
          consolidatedAmount = balance.closingBalance * (ownershipPct / 100)
        } else if (method === ConsolidationMethod.EQUITY) {
          // Equity method only consolidates equity accounts
          if (balance.Account.accountType !== 'EQUITY') {
            continue
          }
          consolidatedAmount = balance.closingBalance * (ownershipPct / 100)
        }

        // Get group COA mapping
        const mapping = balance.Account.ConsolidationMappings[0]
        if (mapping) {
          const groupCOAId = mapping.groupCOAId
          const existing = consolidatedBalances.get(groupCOAId) || 0
          consolidatedBalances.set(groupCOAId, existing + consolidatedAmount)

          // Create worksheet line
          await tx.consolidationWorksheetLine.create({
            data: {
              snapshotId,
              subAccountId: balance.Account.subAccountId!,
              localAccountCode: balance.Account.code,
              groupCOAId,
              originalAmount: balance.closingBalance,
              ownershipPercent: ownershipPct,
              adjustedAmount: consolidatedAmount,
            },
          })
        }
      }

      // Create consolidated balance records
      for (const [groupCOAId, amount] of consolidatedBalances) {
        await tx.consolidatedBalance.create({
          data: {
            snapshotId,
            groupCOAId,
            consolidatedAmount: amount,
          },
        })
      }

      // Update snapshot status
      await tx.consolidationSnapshot.update({
        where: { id: snapshotId },
        data: {
          status: ConsolidationStatus.PENDING_REVIEW,
          executedAt: new Date(),
          executedBy: session.user.id,
        },
      })

      return {
        consolidatedAccounts: consolidatedBalances.size,
        subAccountsProcessed: subAccountIds.length,
      }
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Error executing consolidation:', error)
    return NextResponse.json({ error: 'Failed to execute consolidation' }, { status: 500 })
  }
}

// ========== GET - List Consolidation Snapshots ==========

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const agencyId = searchParams.get('agencyId')

    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 })
    }

    const hasPermission = await hasAgencyPermission(agencyId, 'finance.gl.consolidation.view')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const snapshots = await db.consolidationSnapshot.findMany({
      where: { agencyId },
      include: {
        Period: { select: { name: true, fiscalYear: true } },
        _count: { select: { SubAccounts: true, WorksheetLines: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(snapshots)
  } catch (error) {
    console.error('Error fetching consolidation snapshots:', error)
    return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 })
  }
}
```

---

## 8. UI Components & Routes

### 8.1 GL Layout Component

```tsx
// src/app/(main)/agency/[agencyId]/finance/gl/layout.tsx

import React from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { hasAgencyPermission } from '@/lib/iam/authz/permissions'
import Unauthorized from '@/components/unauthorized'
import BlurPage from '@/components/global/blur-page'
import GLSidebar from './_components/gl-sidebar'

type Props = {
  children: React.ReactNode
  params: Promise<{ agencyId: string }>
}

const GLLayout = async ({ children, params }: Props) => {
  const { agencyId } = await params
  const session = await auth()

  if (!session?.user) {
    return redirect('/')
  }

  // Check GL module access
  const hasGLAccess = await hasAgencyPermission(agencyId, 'finance.gl.coa.view')
  if (!hasGLAccess) {
    return <Unauthorized />
  }

  return (
    <div className="flex h-full">
      <GLSidebar agencyId={agencyId} />
      <div className="flex-1 overflow-auto">
        <BlurPage>{children}</BlurPage>
      </div>
    </div>
  )
}

export default GLLayout
```

### 8.2 GL Sidebar Component

```tsx
// src/app/(main)/agency/[agencyId]/finance/gl/_components/gl-sidebar.tsx

'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  FileText,
  Calendar,
  DollarSign,
  Scale,
  GitMerge,
  FileBarChart,
  Shield,
  Settings,
  LayoutDashboard,
} from 'lucide-react'

type Props = {
  agencyId: string
}

const menuItems = [
  {
    title: 'Dashboard',
    href: '',
    icon: LayoutDashboard,
    permission: 'finance.gl.coa.view',
  },
  {
    title: 'Chart of Accounts',
    href: '/chart-of-accounts',
    icon: BookOpen,
    permission: 'finance.gl.coa.view',
  },
  {
    title: 'Journal Entries',
    href: '/journal-entries',
    icon: FileText,
    permission: 'finance.gl.journal.view',
  },
  {
    title: 'Financial Periods',
    href: '/periods',
    icon: Calendar,
    permission: 'finance.gl.periods.view',
  },
  {
    title: 'Account Balances',
    href: '/balances',
    icon: Scale,
    permission: 'finance.gl.balances.view',
  },
  {
    title: 'Multi-Currency',
    href: '/currency',
    icon: DollarSign,
    permission: 'finance.gl.currency.view',
  },
  {
    title: 'Consolidation',
    href: '/consolidation',
    icon: GitMerge,
    permission: 'finance.gl.consolidation.view',
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: FileBarChart,
    permission: 'finance.gl.reports.view',
  },
  {
    title: 'Audit Trail',
    href: '/audit',
    icon: Shield,
    permission: 'finance.gl.audit.view',
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    permission: 'finance.gl.settings.view',
  },
]

export default function GLSidebar({ agencyId }: Props) {
  const pathname = usePathname()
  const basePath = `/agency/${agencyId}/finance/gl`

  return (
    <aside className="w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="p-6">
        <h2 className="text-lg font-semibold">General Ledger</h2>
        <p className="text-sm text-muted-foreground">Financial Management</p>
      </div>
      <nav className="space-y-1 px-3">
        {menuItems.map((item) => {
          const fullPath = `${basePath}${item.href}`
          const isActive = pathname === fullPath || 
            (item.href !== '' && pathname.startsWith(fullPath))

          return (
            <Link
              key={item.href}
              href={fullPath}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

### 8.3 GL Dashboard Page

```tsx
// src/app/(main)/agency/[agencyId]/finance/gl/page.tsx

import React from 'react'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'lucide-react'

type Props = {
  params: Promise<{ agencyId: string }>
}

export default async function GLDashboard({ params }: Props) {
  const { agencyId } = await params
  const session = await auth()

  // Fetch dashboard data
  const [
    accountCount,
    periodCount,
    pendingEntries,
    currentPeriod,
    recentActivity,
  ] = await Promise.all([
    db.chartOfAccount.count({
      where: { agencyId, subAccountId: null, isActive: true },
    }),
    db.financialPeriod.count({
      where: { agencyId, subAccountId: null },
    }),
    db.journalEntry.count({
      where: {
        agencyId,
        subAccountId: null,
        status: { in: ['DRAFT', 'PENDING_APPROVAL'] },
      },
    }),
    db.financialPeriod.findFirst({
      where: {
        agencyId,
        subAccountId: null,
        status: 'OPEN',
      },
    }),
    db.journalEntry.findMany({
      where: { agencyId, subAccountId: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        CreatedByUser: { select: { name: true } },
      },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">General Ledger Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your financial accounting system
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accountCount}</div>
            <p className="text-xs text-muted-foreground">
              Chart of accounts entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Period</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentPeriod?.name || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentPeriod ? 'Open for posting' : 'No open period'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Entries</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingEntries}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval or posting
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Periods</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{periodCount}</div>
            <p className="text-xs text-muted-foreground">
              Financial periods created
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Journal Entries</CardTitle>
          <CardDescription>Latest accounting activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              recentActivity.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{entry.entryNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      By {entry.CreatedByUser?.name} on{' '}
                      {entry.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        entry.status === 'POSTED'
                          ? 'default'
                          : entry.status === 'APPROVED'
                          ? 'secondary'
                          : entry.status === 'PENDING_APPROVAL'
                          ? 'outline'
                          : 'destructive'
                      }
                    >
                      {entry.status}
                    </Badge>
                    <span className="text-sm font-medium">
                      ${entry.totalDebit.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 8.4 Chart of Accounts Page

```tsx
// src/app/(main)/agency/[agencyId]/finance/gl/chart-of-accounts/page.tsx

import React from 'react'
import { auth } from '@/auth'
import { hasAgencyPermission } from '@/lib/iam/authz/permissions'
import { getChartOfAccounts } from '@/lib/finance/gl/actions/chart-of-accounts'
import COADataTable from './_components/coa-data-table'
import { columns } from './_components/columns'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

type Props = {
  params: Promise<{ agencyId: string }>
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function ChartOfAccountsPage({ params, searchParams }: Props) {
  const { agencyId } = await params
  const search = await searchParams

  const result = await getChartOfAccounts({
    search: search.q,
    accountType: search.type,
    includeInactive: search.inactive === 'true',
  })

  const canCreate = await hasAgencyPermission(agencyId, 'finance.gl.coa.create')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chart of Accounts</h1>
          <p className="text-muted-foreground">
            Manage your general ledger account structure
          </p>
        </div>
        {canCreate && (
          <Link href={`/agency/${agencyId}/finance/gl/chart-of-accounts/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Account
            </Button>
          </Link>
        )}
      </div>

      <COADataTable
        columns={columns}
        data={result.success ? result.data || [] : []}
        agencyId={agencyId}
      />
    </div>
  )
}
```

### 8.5 COA Data Table Columns

```tsx
// src/app/(main)/agency/[agencyId]/finance/gl/chart-of-accounts/_components/columns.tsx

'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2, Eye, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export type Account = {
  id: string
  code: string
  name: string
  accountType: string
  category: string | null
  normalBalance: string
  isActive: boolean
  isControlAccount: boolean
  level: number
  _count: { ChildAccounts: number }
  ParentAccount: { code: string; name: string } | null
}

export const columns: ColumnDef<Account>[] = [
  {
    accessorKey: 'code',
    header: 'Code',
    cell: ({ row }) => {
      const level = row.original.level
      return (
        <div className="flex items-center gap-2">
          <span style={{ paddingLeft: `${(level - 1) * 16}px` }}>
            {row.original._count.ChildAccounts > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </span>
          <span className="font-mono">{row.original.code}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'name',
    header: 'Account Name',
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.name}</span>
        {row.original.ParentAccount && (
          <span className="text-xs text-muted-foreground">
            Parent: {row.original.ParentAccount.code}
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'accountType',
    header: 'Type',
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.accountType}</Badge>
    ),
  },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.category || '-'}
      </span>
    ),
  },
  {
    accessorKey: 'normalBalance',
    header: 'Normal Balance',
    cell: ({ row }) => (
      <Badge variant={row.original.normalBalance === 'DEBIT' ? 'default' : 'secondary'}>
        {row.original.normalBalance}
      </Badge>
    ),
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? 'default' : 'destructive'}>
        {row.original.isActive ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const account = row.original
      const agencyId = (table.options.meta as any)?.agencyId

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/agency/${agencyId}/finance/gl/chart-of-accounts/${account.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/agency/${agencyId}/finance/gl/chart-of-accounts/${account.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
```

---

*Continue to Part 5: Forms & Seed Scripts...*

### 8.6 Account Form Component

```tsx
// src/app/(main)/agency/[agencyId]/finance/gl/chart-of-accounts/_components/account-form.tsx

'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { createAccount, updateAccount } from '@/lib/finance/gl/actions/chart-of-accounts'
import { createAccountSchema, type CreateAccountInput } from '@/lib/schemas/finance/gl/chart-of-accounts'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

type Props = {
  agencyId: string
  account?: any
  parentAccounts?: { id: string; code: string; name: string }[]
  controlAccounts?: { id: string; code: string; name: string }[]
}

const accountTypes = [
  { value: 'ASSET', label: 'Asset' },
  { value: 'LIABILITY', label: 'Liability' },
  { value: 'EQUITY', label: 'Equity' },
  { value: 'REVENUE', label: 'Revenue' },
  { value: 'EXPENSE', label: 'Expense' },
]

const normalBalances = [
  { value: 'DEBIT', label: 'Debit' },
  { value: 'CREDIT', label: 'Credit' },
]

const categories = {
  ASSET: ['Current Assets', 'Fixed Assets', 'Intangible Assets', 'Other Assets'],
  LIABILITY: ['Current Liabilities', 'Long-term Liabilities', 'Other Liabilities'],
  EQUITY: ['Share Capital', 'Retained Earnings', 'Reserves', 'Other Equity'],
  REVENUE: ['Operating Revenue', 'Non-operating Revenue', 'Other Income'],
  EXPENSE: ['Cost of Goods Sold', 'Operating Expenses', 'Administrative Expenses', 'Other Expenses'],
}

export default function AccountForm({ agencyId, account, parentAccounts = [], controlAccounts = [] }: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<CreateAccountInput>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      code: account?.code || '',
      name: account?.name || '',
      description: account?.description || '',
      accountType: account?.accountType || 'ASSET',
      category: account?.category || '',
      normalBalance: account?.normalBalance || 'DEBIT',
      parentAccountId: account?.parentAccountId || undefined,
      controlAccountId: account?.controlAccountId || undefined,
      isPostingAccount: account?.isPostingAccount ?? true,
      isControlAccount: account?.isControlAccount ?? false,
      currencyCode: account?.currencyCode || 'USD',
      isMultiCurrency: account?.isMultiCurrency ?? false,
    },
  })

  const watchAccountType = form.watch('accountType')

  const onSubmit = async (data: CreateAccountInput) => {
    setIsSubmitting(true)
    try {
      const result = account
        ? await updateAccount({ id: account.id, ...data })
        : await createAccount(data)

      if (result.success) {
        toast.success(account ? 'Account updated successfully' : 'Account created successfully')
        router.push(`/agency/${agencyId}/finance/gl/chart-of-accounts`)
        router.refresh()
      } else {
        toast.error(result.error || 'An error occurred')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 1000" {...field} />
                    </FormControl>
                    <FormDescription>
                      Unique identifier for this account
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Cash and Cash Equivalents" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the purpose of this account..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accountTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(categories[watchAccountType as keyof typeof categories] || []).map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="normalBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Normal Balance *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select normal balance" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {normalBalances.map((balance) => (
                          <SelectItem key={balance.value} value={balance.value}>
                            {balance.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Hierarchy & Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Hierarchy & Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="parentAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Account</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select parent account (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None (Top-level account)</SelectItem>
                        {parentAccounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.code} - {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Organize accounts in a hierarchy
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="controlAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Control Account</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select control account (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {controlAccounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.code} - {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Link to a control account for subledger integration
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currencyCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input placeholder="USD" {...field} />
                    </FormControl>
                    <FormDescription>
                      Default currency for this account
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="isPostingAccount"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Posting Account</FormLabel>
                        <FormDescription>
                          Allow posting journal entries to this account
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isControlAccount"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Control Account</FormLabel>
                        <FormDescription>
                          This account aggregates subledger balances
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isMultiCurrency"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Multi-Currency</FormLabel>
                        <FormDescription>
                          Enable foreign currency transactions
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {account ? 'Update Account' : 'Create Account'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

### 8.7 Journal Entry Form Component

```tsx
// src/app/(main)/agency/[agencyId]/finance/gl/journal-entries/_components/journal-entry-form.tsx

'use client'

import React from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { createJournalEntry, updateJournalEntry } from '@/lib/finance/gl/actions/journal-entries'
import { createJournalEntrySchema, type CreateJournalEntryInput } from '@/lib/schemas/finance/gl/journal-entry'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DatePicker } from '@/components/ui/date-picker'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Props = {
  agencyId: string
  entry?: any
  accounts: { id: string; code: string; name: string }[]
  periods: { id: string; name: string; status: string }[]
}

const entryTypes = [
  { value: 'STANDARD', label: 'Standard Entry' },
  { value: 'ADJUSTING', label: 'Adjusting Entry' },
  { value: 'CLOSING', label: 'Closing Entry' },
  { value: 'RECURRING', label: 'Recurring Entry' },
]

export default function JournalEntryForm({ agencyId, entry, accounts, periods }: Props) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const openPeriods = periods.filter((p) => p.status === 'OPEN')

  const form = useForm<CreateJournalEntryInput>({
    resolver: zodResolver(createJournalEntrySchema),
    defaultValues: {
      periodId: entry?.periodId || openPeriods[0]?.id || '',
      entryDate: entry?.entryDate || new Date(),
      entryType: entry?.entryType || 'STANDARD',
      sourceModule: entry?.sourceModule || 'MANUAL',
      description: entry?.description || '',
      notes: entry?.notes || '',
      currencyCode: entry?.currencyCode || 'USD',
      exchangeRate: entry?.exchangeRate || 1,
      lines: entry?.Lines?.map((l: any, i: number) => ({
        lineNumber: i + 1,
        accountId: l.accountId,
        description: l.description,
        debitAmount: l.debitAmount || 0,
        creditAmount: l.creditAmount || 0,
      })) || [
        { lineNumber: 1, accountId: '', description: '', debitAmount: 0, creditAmount: 0 },
        { lineNumber: 2, accountId: '', description: '', debitAmount: 0, creditAmount: 0 },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  })

  const watchLines = form.watch('lines')
  const totalDebit = watchLines?.reduce((sum, l) => sum + (Number(l.debitAmount) || 0), 0) || 0
  const totalCredit = watchLines?.reduce((sum, l) => sum + (Number(l.creditAmount) || 0), 0) || 0
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01

  const onSubmit = async (data: CreateJournalEntryInput) => {
    if (!isBalanced) {
      toast.error('Journal entry must be balanced (debits = credits)')
      return
    }

    setIsSubmitting(true)
    try {
      const result = entry
        ? await updateJournalEntry({ id: entry.id, ...data })
        : await createJournalEntry(data)

      if (result.success) {
        toast.success(entry ? 'Journal entry updated' : 'Journal entry created')
        router.push(`/agency/${agencyId}/finance/gl/journal-entries`)
        router.refresh()
      } else {
        toast.error(result.error || 'An error occurred')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const addLine = () => {
    append({
      lineNumber: fields.length + 1,
      accountId: '',
      description: '',
      debitAmount: 0,
      creditAmount: 0,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header Information */}
        <Card>
          <CardHeader>
            <CardTitle>Entry Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="periodId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {openPeriods.map((period) => (
                          <SelectItem key={period.id} value={period.id}>
                            {period.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="entryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry Date *</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        onDateChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="entryType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entry Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {entryTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief description of the entry" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Journal Entry Lines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Entry Lines</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              <Plus className="mr-2 h-4 w-4" />
              Add Line
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[150px] text-right">Debit</TableHead>
                  <TableHead className="w-[150px] text-right">Credit</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell className="text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`lines.${index}.accountId`}
                        render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {accounts.map((acc) => (
                                  <SelectItem key={acc.id} value={acc.id}>
                                    {acc.code} - {acc.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`lines.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Line description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`lines.${index}.debitAmount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                className="text-right"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`lines.${index}.creditAmount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                className="text-right"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      {fields.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Totals Row */}
                <TableRow className="font-medium">
                  <TableCell colSpan={3} className="text-right">
                    Totals
                  </TableCell>
                  <TableCell className="text-right">{totalDebit.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{totalCredit.toFixed(2)}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* Balance Warning */}
            {!isBalanced && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Entry is not balanced. Difference: {Math.abs(totalDebit - totalCredit).toFixed(2)}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !isBalanced}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {entry ? 'Update Entry' : 'Create Entry'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
```

---

## 9. Seed Scripts

### 9.1 GL System Permissions Seed

```typescript
// scripts/seed-gl-permissions.ts

import { db } from '@/lib/db'

const GL_PERMISSIONS = [
  // Chart of Accounts
  { key: 'finance.gl.coa.view', name: 'View Chart of Accounts', category: 'finance.gl' },
  { key: 'finance.gl.coa.create', name: 'Create Accounts', category: 'finance.gl' },
  { key: 'finance.gl.coa.edit', name: 'Edit Accounts', category: 'finance.gl' },
  { key: 'finance.gl.coa.delete', name: 'Delete Accounts', category: 'finance.gl' },
  
  // Journal Entries
  { key: 'finance.gl.journal.view', name: 'View Journal Entries', category: 'finance.gl' },
  { key: 'finance.gl.journal.create', name: 'Create Journal Entries', category: 'finance.gl' },
  { key: 'finance.gl.journal.edit', name: 'Edit Journal Entries', category: 'finance.gl' },
  { key: 'finance.gl.journal.submit', name: 'Submit Journal Entries', category: 'finance.gl' },
  { key: 'finance.gl.journal.approve', name: 'Approve Journal Entries', category: 'finance.gl' },
  { key: 'finance.gl.journal.reject', name: 'Reject Journal Entries', category: 'finance.gl' },
  { key: 'finance.gl.journal.post', name: 'Post Journal Entries', category: 'finance.gl' },
  { key: 'finance.gl.journal.reverse', name: 'Reverse Journal Entries', category: 'finance.gl' },
  { key: 'finance.gl.journal.void', name: 'Void Journal Entries', category: 'finance.gl' },
  
  // Financial Periods
  { key: 'finance.gl.periods.view', name: 'View Financial Periods', category: 'finance.gl' },
  { key: 'finance.gl.periods.create', name: 'Create Financial Periods', category: 'finance.gl' },
  { key: 'finance.gl.periods.open', name: 'Open Periods', category: 'finance.gl' },
  { key: 'finance.gl.periods.close', name: 'Close Periods', category: 'finance.gl' },
  { key: 'finance.gl.periods.lock', name: 'Lock Periods', category: 'finance.gl' },
  { key: 'finance.gl.periods.year_end', name: 'Process Year-End', category: 'finance.gl' },
  
  // Account Balances
  { key: 'finance.gl.balances.view', name: 'View Account Balances', category: 'finance.gl' },
  
  // Multi-Currency
  { key: 'finance.gl.currency.view', name: 'View Currencies', category: 'finance.gl' },
  { key: 'finance.gl.currency.create', name: 'Create Currencies', category: 'finance.gl' },
  { key: 'finance.gl.currency.edit', name: 'Edit Exchange Rates', category: 'finance.gl' },
  { key: 'finance.gl.currency.revalue', name: 'Run Currency Revaluation', category: 'finance.gl' },
  
  // Consolidation
  { key: 'finance.gl.consolidation.view', name: 'View Consolidation', category: 'finance.gl' },
  { key: 'finance.gl.consolidation.create', name: 'Create Consolidation Snapshots', category: 'finance.gl' },
  { key: 'finance.gl.consolidation.execute', name: 'Execute Consolidation', category: 'finance.gl' },
  { key: 'finance.gl.consolidation.approve', name: 'Approve Consolidation', category: 'finance.gl' },
  
  // Reports
  { key: 'finance.gl.reports.view', name: 'View GL Reports', category: 'finance.gl' },
  { key: 'finance.gl.reports.generate', name: 'Generate Reports', category: 'finance.gl' },
  { key: 'finance.gl.reports.export', name: 'Export Reports', category: 'finance.gl' },
  
  // Audit
  { key: 'finance.gl.audit.view', name: 'View Audit Trail', category: 'finance.gl' },
  { key: 'finance.gl.audit.export', name: 'Export Audit Trail', category: 'finance.gl' },
  
  // Settings
  { key: 'finance.gl.settings.view', name: 'View GL Settings', category: 'finance.gl' },
  { key: 'finance.gl.settings.edit', name: 'Edit GL Settings', category: 'finance.gl' },
]

async function main() {
  console.log('🌱 Seeding GL permissions...')

  for (const permission of GL_PERMISSIONS) {
    await db.permission.upsert({
      where: { key: permission.key },
      update: { name: permission.name, category: permission.category },
      create: {
        key: permission.key,
        name: permission.name,
        category: permission.category,
        description: `Permission to ${permission.name.toLowerCase()}`,
        isSystem: true,
      },
    })
    console.log(`  ✓ ${permission.key}`)
  }

  console.log('✅ GL permissions seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding GL permissions:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
```

### 9.2 Default Chart of Accounts Seed

```typescript
// scripts/seed-gl-default-coa.ts

import { db } from '@/lib/db'
import { AccountType, NormalBalance } from '@/generated/prisma/client'

const DEFAULT_COA = [
  // ASSETS
  { code: '1000', name: 'Assets', type: 'ASSET', balance: 'DEBIT', level: 1, isPosting: false, category: 'Assets' },
  { code: '1100', name: 'Current Assets', type: 'ASSET', balance: 'DEBIT', level: 2, parent: '1000', isPosting: false, category: 'Current Assets' },
  { code: '1110', name: 'Cash and Cash Equivalents', type: 'ASSET', balance: 'DEBIT', level: 3, parent: '1100', isPosting: true, category: 'Current Assets' },
  { code: '1111', name: 'Petty Cash', type: 'ASSET', balance: 'DEBIT', level: 4, parent: '1110', isPosting: true, category: 'Current Assets' },
  { code: '1112', name: 'Bank - Operating Account', type: 'ASSET', balance: 'DEBIT', level: 4, parent: '1110', isPosting: true, category: 'Current Assets' },
  { code: '1120', name: 'Accounts Receivable', type: 'ASSET', balance: 'DEBIT', level: 3, parent: '1100', isPosting: true, isControl: true, subledger: 'AR', category: 'Current Assets' },
  { code: '1130', name: 'Inventory', type: 'ASSET', balance: 'DEBIT', level: 3, parent: '1100', isPosting: true, category: 'Current Assets' },
  { code: '1140', name: 'Prepaid Expenses', type: 'ASSET', balance: 'DEBIT', level: 3, parent: '1100', isPosting: true, category: 'Current Assets' },
  
  { code: '1200', name: 'Non-Current Assets', type: 'ASSET', balance: 'DEBIT', level: 2, parent: '1000', isPosting: false, category: 'Fixed Assets' },
  { code: '1210', name: 'Property, Plant & Equipment', type: 'ASSET', balance: 'DEBIT', level: 3, parent: '1200', isPosting: false, category: 'Fixed Assets' },
  { code: '1211', name: 'Land', type: 'ASSET', balance: 'DEBIT', level: 4, parent: '1210', isPosting: true, category: 'Fixed Assets' },
  { code: '1212', name: 'Buildings', type: 'ASSET', balance: 'DEBIT', level: 4, parent: '1210', isPosting: true, category: 'Fixed Assets' },
  { code: '1213', name: 'Equipment', type: 'ASSET', balance: 'DEBIT', level: 4, parent: '1210', isPosting: true, category: 'Fixed Assets' },
  { code: '1219', name: 'Accumulated Depreciation', type: 'ASSET', balance: 'CREDIT', level: 4, parent: '1210', isPosting: true, category: 'Fixed Assets' },
  
  // LIABILITIES
  { code: '2000', name: 'Liabilities', type: 'LIABILITY', balance: 'CREDIT', level: 1, isPosting: false, category: 'Liabilities' },
  { code: '2100', name: 'Current Liabilities', type: 'LIABILITY', balance: 'CREDIT', level: 2, parent: '2000', isPosting: false, category: 'Current Liabilities' },
  { code: '2110', name: 'Accounts Payable', type: 'LIABILITY', balance: 'CREDIT', level: 3, parent: '2100', isPosting: true, isControl: true, subledger: 'AP', category: 'Current Liabilities' },
  { code: '2120', name: 'Accrued Expenses', type: 'LIABILITY', balance: 'CREDIT', level: 3, parent: '2100', isPosting: true, category: 'Current Liabilities' },
  { code: '2130', name: 'Unearned Revenue', type: 'LIABILITY', balance: 'CREDIT', level: 3, parent: '2100', isPosting: true, category: 'Current Liabilities' },
  { code: '2140', name: 'Taxes Payable', type: 'LIABILITY', balance: 'CREDIT', level: 3, parent: '2100', isPosting: true, category: 'Current Liabilities' },
  
  { code: '2200', name: 'Non-Current Liabilities', type: 'LIABILITY', balance: 'CREDIT', level: 2, parent: '2000', isPosting: false, category: 'Long-term Liabilities' },
  { code: '2210', name: 'Long-term Debt', type: 'LIABILITY', balance: 'CREDIT', level: 3, parent: '2200', isPosting: true, category: 'Long-term Liabilities' },
  
  // EQUITY
  { code: '3000', name: 'Equity', type: 'EQUITY', balance: 'CREDIT', level: 1, isPosting: false, category: 'Equity' },
  { code: '3100', name: 'Share Capital', type: 'EQUITY', balance: 'CREDIT', level: 2, parent: '3000', isPosting: true, category: 'Share Capital' },
  { code: '3200', name: 'Retained Earnings', type: 'EQUITY', balance: 'CREDIT', level: 2, parent: '3000', isPosting: true, category: 'Retained Earnings', systemType: 'RETAINED_EARNINGS' },
  { code: '3300', name: 'Current Year Earnings', type: 'EQUITY', balance: 'CREDIT', level: 2, parent: '3000', isPosting: false, category: 'Retained Earnings' },
  
  // REVENUE
  { code: '4000', name: 'Revenue', type: 'REVENUE', balance: 'CREDIT', level: 1, isPosting: false, category: 'Revenue' },
  { code: '4100', name: 'Operating Revenue', type: 'REVENUE', balance: 'CREDIT', level: 2, parent: '4000', isPosting: false, category: 'Operating Revenue' },
  { code: '4110', name: 'Sales Revenue', type: 'REVENUE', balance: 'CREDIT', level: 3, parent: '4100', isPosting: true, category: 'Operating Revenue' },
  { code: '4120', name: 'Service Revenue', type: 'REVENUE', balance: 'CREDIT', level: 3, parent: '4100', isPosting: true, category: 'Operating Revenue' },
  { code: '4200', name: 'Other Income', type: 'REVENUE', balance: 'CREDIT', level: 2, parent: '4000', isPosting: true, category: 'Non-operating Revenue' },
  
  // EXPENSES
  { code: '5000', name: 'Expenses', type: 'EXPENSE', balance: 'DEBIT', level: 1, isPosting: false, category: 'Expenses' },
  { code: '5100', name: 'Cost of Goods Sold', type: 'EXPENSE', balance: 'DEBIT', level: 2, parent: '5000', isPosting: true, category: 'Cost of Goods Sold' },
  { code: '5200', name: 'Operating Expenses', type: 'EXPENSE', balance: 'DEBIT', level: 2, parent: '5000', isPosting: false, category: 'Operating Expenses' },
  { code: '5210', name: 'Salaries & Wages', type: 'EXPENSE', balance: 'DEBIT', level: 3, parent: '5200', isPosting: true, category: 'Operating Expenses' },
  { code: '5220', name: 'Rent Expense', type: 'EXPENSE', balance: 'DEBIT', level: 3, parent: '5200', isPosting: true, category: 'Operating Expenses' },
  { code: '5230', name: 'Utilities Expense', type: 'EXPENSE', balance: 'DEBIT', level: 3, parent: '5200', isPosting: true, category: 'Operating Expenses' },
  { code: '5240', name: 'Depreciation Expense', type: 'EXPENSE', balance: 'DEBIT', level: 3, parent: '5200', isPosting: true, category: 'Operating Expenses' },
  { code: '5250', name: 'Professional Fees', type: 'EXPENSE', balance: 'DEBIT', level: 3, parent: '5200', isPosting: true, category: 'Operating Expenses' },
  { code: '5260', name: 'Office Supplies', type: 'EXPENSE', balance: 'DEBIT', level: 3, parent: '5200', isPosting: true, category: 'Operating Expenses' },
  { code: '5270', name: 'Insurance Expense', type: 'EXPENSE', balance: 'DEBIT', level: 3, parent: '5200', isPosting: true, category: 'Operating Expenses' },
  { code: '5300', name: 'Other Expenses', type: 'EXPENSE', balance: 'DEBIT', level: 2, parent: '5000', isPosting: true, category: 'Other Expenses' },
  
  // SYSTEM ACCOUNTS (for currency revaluation, etc.)
  { code: '8000', name: 'Other Comprehensive Income', type: 'EQUITY', balance: 'CREDIT', level: 1, isPosting: false, category: 'Other Equity' },
  { code: '8100', name: 'Unrealized Gain/Loss - FX', type: 'EQUITY', balance: 'CREDIT', level: 2, parent: '8000', isPosting: true, category: 'Other Equity', systemType: 'UNREALIZED_GAIN_LOSS' },
  { code: '8200', name: 'Realized Gain/Loss - FX', type: 'REVENUE', balance: 'CREDIT', level: 2, parent: '4000', isPosting: true, category: 'Non-operating Revenue', systemType: 'REALIZED_GAIN_LOSS' },
]

async function seedDefaultCOA(agencyId: string) {
  console.log(`🌱 Seeding default COA for agency: ${agencyId}`)

  const accountMap = new Map<string, string>()

  for (const acc of DEFAULT_COA) {
    const parentId = acc.parent ? accountMap.get(acc.parent) : null
    
    const path = acc.parent
      ? `${(await db.chartOfAccount.findUnique({ where: { id: parentId! } }))?.path}.${acc.code}`
      : acc.code

    const account = await db.chartOfAccount.upsert({
      where: {
        code_agencyId_subAccountId: {
          code: acc.code,
          agencyId,
          subAccountId: null,
        },
      },
      update: {
        name: acc.name,
        accountType: acc.type as AccountType,
        normalBalance: acc.balance as NormalBalance,
        category: acc.category,
        level: acc.level,
        isPostingAccount: acc.isPosting,
        isControlAccount: acc.isControl || false,
        subledgerType: acc.subledger,
        systemAccountType: acc.systemType,
      },
      create: {
        code: acc.code,
        name: acc.name,
        accountType: acc.type as AccountType,
        normalBalance: acc.balance as NormalBalance,
        category: acc.category,
        level: acc.level,
        path,
        parentAccountId: parentId,
        isPostingAccount: acc.isPosting,
        isControlAccount: acc.isControl || false,
        subledgerType: acc.subledger,
        systemAccountType: acc.systemType,
        agencyId,
        isSystemAccount: !!acc.systemType,
        sortOrder: parseInt(acc.code),
      },
    })

    accountMap.set(acc.code, account.id)
    console.log(`  ✓ ${acc.code} - ${acc.name}`)
  }

  console.log(`✅ Default COA seeded for agency: ${agencyId}`)
  return accountMap
}

export { seedDefaultCOA }

// Main execution
async function main() {
  const agencyId = process.argv[2]
  if (!agencyId) {
    console.error('Usage: npx ts-node scripts/seed-gl-default-coa.ts <agencyId>')
    process.exit(1)
  }

  await seedDefaultCOA(agencyId)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding COA:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
```

---

## 10. Implementation Checklist

### Phase 1: Foundation (Week 1-2)
- [ ] Add GL models to Prisma schema
- [ ] Run migration
- [ ] Seed GL permissions
- [ ] Create validation schemas
- [ ] Implement Chart of Accounts actions
- [ ] Build COA UI components

### Phase 2: Core Accounting (Week 3-4)
- [ ] Implement Journal Entry actions
- [ ] Build Journal Entry form
- [ ] Add workflow (submit, approve, reject, post)
- [ ] Implement Financial Periods actions
- [ ] Build Periods management UI
- [ ] Implement Account Balances actions

### Phase 3: Advanced Features (Week 5-6)
- [ ] Multi-currency support
- [ ] Exchange rate management
- [ ] Currency revaluation
- [ ] Year-end processing
- [ ] Audit trail implementation

### Phase 4: Reporting & Consolidation (Week 7-8)
- [ ] Trial Balance report
- [ ] Balance Sheet report
- [ ] Income Statement report
- [ ] General Ledger report
- [ ] PDF/Excel export
- [ ] Consolidation for agencies

### Phase 5: Testing & Polish (Week 9-10)
- [ ] Unit tests for actions
- [ ] Integration tests
- [ ] E2E tests
- [ ] Performance optimization
- [ ] Documentation
- [ ] User training materials

---

## Appendix A: GL Constants

```typescript
// src/lib/finance/gl/constants.ts

export const GL_CONSTANTS = {
  MAX_HIERARCHY_DEPTH: 7,
  DEFAULT_CURRENCY: 'USD',
  DECIMAL_PRECISION: 2,
  MAX_ACCOUNT_CODE_LENGTH: 20,
  MAX_ACCOUNT_NAME_LENGTH: 200,
  
  ACCOUNT_TYPES: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const,
  NORMAL_BALANCES: ['DEBIT', 'CREDIT'] as const,
  PERIOD_TYPES: ['MONTH', 'QUARTER', 'HALF_YEAR', 'YEAR', 'CUSTOM'] as const,
  
  ENTRY_STATUSES: [
    'DRAFT',
    'PENDING_APPROVAL', 
    'APPROVED',
    'REJECTED',
    'POSTED',
    'REVERSED',
    'VOIDED',
  ] as const,
  
  REPORT_TYPES: [
    'TRIAL_BALANCE',
    'BALANCE_SHEET',
    'INCOME_STATEMENT',
    'CASH_FLOW',
    'GENERAL_LEDGER',
    'ACCOUNT_LEDGER',
    'AGING_REPORT',
  ] as const,
  
  EXPORT_FORMATS: ['PDF', 'EXCEL', 'CSV', 'JSON'] as const,
  
  CONSOLIDATION_METHODS: ['FULL', 'PROPORTIONAL', 'EQUITY'] as const,
}

export type AccountType = typeof GL_CONSTANTS.ACCOUNT_TYPES[number]
export type NormalBalance = typeof GL_CONSTANTS.NORMAL_BALANCES[number]
export type PeriodType = typeof GL_CONSTANTS.PERIOD_TYPES[number]
export type EntryStatus = typeof GL_CONSTANTS.ENTRY_STATUSES[number]
export type ReportType = typeof GL_CONSTANTS.REPORT_TYPES[number]
export type ExportFormat = typeof GL_CONSTANTS.EXPORT_FORMATS[number]
export type ConsolidationMethod = typeof GL_CONSTANTS.CONSOLIDATION_METHODS[number]
```

---

**END OF PLAN DOCUMENT**

*Document Version: 1.0.0*
*Last Updated: 2026-01-16*
*Status: Implementation Ready*
