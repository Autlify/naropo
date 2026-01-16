**PHASE 1: ANALYZE EXISTING PATTERNS**
Please analyze these files to understand our code standards:
1. @prisma/schema.prisma - our data model patterns (multi-tenancy, relations, indexes)
2. #file:src/lib/iam - our RBAC permission model
3. #file:src/app/(main)/agency - our route structure and layout patterns
4. #file:src/lib/actions - our server action patterns (validation, error handling, logging)
5. #file:src/components - our UI component patterns

**PHASE 2: DESIGN ARCHITECTURE**
Based on the patterns above, design comprehensive architecture for:
- Chart of Accounts (COA hierarchy, account types, categories)
- **Agency-Level Consolidation** (group COA for consolidating internally-owned subaccounts, consolidation-enabled accounts, intercompany eliminations)
- General & Subsidiary Ledgers (creation, modification, deletion, configuration, validation)
- Transactions (creation, approval, posting, voiding)
- Journal Entries (double-entry bookkeeping, posting workflow, approval workflow)
- Posting Rules (automated GL posting from other modules)
- Reconciliation (account-level, period-level, matching rules & engine)
- Ledger Reports (detailed, summary)
- Audit Trail (immutable transaction logs)
- Multi-Currency Support (conversion rates, revaluation, realization)
- Account Balances (period-based, real-time calculations)
- Reporting (standard reports, custom report builder)
- Financial Periods (opening, closing, year-end processing)
- Financial Statements (Balance Sheet, P&L, Cash Flow, custom reports)
- **Consolidated Financial Statements** (Agency-level rollup from subaccounts, intercompany eliminations, consolidation adjustments)


**PHASE 3: IMPLEMENT** (Step by step)
Start with:

1. **Database Schema** (/prisma/schema.prisma):
   
   **Core GL Models:**
   - ChartOfAccounts (hierarchy, account types, categories, status, control accounts, **isConsolidationEnabled**, **consolidationAccountCode**)
   - AgencyGroupCOA (Agency-level master COA for consolidation, mapping to subaccount COAs)
   - ConsolidationMapping (maps subaccount COA to Agency group COA)
   - GeneralLedger, SubsidiaryLedger (ledger types, configurations, rules)
   - JournalEntry, JournalEntryLine (double-entry, multi-line, approval workflow states)
   - Transaction (base transaction model, lifecycle states)
   - FinancialPeriod (period management, opening/closing balances, status)
   - AccountBalance (period-based, running balances, snapshots)
   - ConsolidatedBalance (Agency-level consolidated balances from subaccounts)
   
   **Posting & Automation:**
   - PostingRule (automated GL posting templates from other modules)
   - PostingTemplate (reusable posting patterns)
   
   **Reconciliation:**
   - Reconciliation (account/period reconciliation records)
   - ReconciliationItem (matching items, discrepancies)
   - ReconciliationRule (automated matching rules engine)
   - IntercompanyReconciliation (reconcile intercompany transactions between subaccounts)
   - IntercompanyElimination (elimination entries for consolidation)
   
   **Audit & Compliance:**
   - AuditTrail (immutable transaction logs, who/what/when)
   - TransactionHistory (version history for all changes)
   
   **Multi-Currency:**
   - Currency (supported currencies)
   - ExchangeRate (conversion rates, effective dates)
   - CurrencyRevaluation (unrealized gain/loss)
   - CurrencyRealization (realized gain/loss on settlement)
   
   **Reporting:**
   - Report (saved report configurations)
   - ReportTemplate (standard report templates)
   - CustomReport (user-defined reports)
   - FinancialStatement (Balance Sheet, P&L, Cash Flow, custom)
   - ConsolidatedFinancialStatement (Agency-level consolidated statements)
   - ConsolidationAdjustment (manual adjustments for consolidation)
   - ConsolidationWorksheet (consolidation working papers)
   
   **All models must:**
   - Follow our Agency/Subaccount multi-tenant pattern
   - Include proper indexes for performance (composite indexes on common queries)
   - Use soft deletes where applicable
   - Include createdAt, updatedAt, createdBy, updatedBy fields
   - Have proper foreign key relations and cascades

2. **Server Actions** (/src/lib/finance/gl):
   
   **Chart of Accounts** (/chart-of-accounts):
   - createAccount, updateAccount, deleteAccount, archiveAccount
   - getAccountHierarchy, getAccountByCode, listAccounts
   - validateAccountCode, checkAccountUsage
   - enableConsolidation, mapToGroupCOA
   - createAgencyGroupCOA, updateGroupCOA
   - createConsolidationMapping, updateConsolidationMapping
   - getConsolidationMappings, validateConsolidationMapping
   
   **Ledger Management** (/ledgers):
   - createGeneralLedger, createSubsidiaryLedger
   - updateLedgerConfig, deleteLedger
   - validateLedgerRules, linkSubsidiaryToGeneral
   
   **Transaction Management** (/transactions):
   - createTransaction, updateTransaction (draft only)
   - submitForApproval, approveTransaction, rejectTransaction
   - postTransaction, voidTransaction
   - getTransactionHistory, listTransactions
   
   **Journal Entries** (/journal-entries):
   - createJournalEntry, updateJournalEntry (draft only)
   - validateDoubleEntry (debits = credits)
   - submitForApproval, approveEntry, rejectEntry
   - postJournalEntry (mark as posted, update balances)
   - reverseJournalEntry, voidJournalEntry
   - bulkCreateJournalEntries
   
   **Posting Engine** (/posting):
   - executePostingRule (automated posting from other modules)
   - createPostingTemplate, applyPostingTemplate
   - batchPost, scheduledPosting
   - validatePostingRules
   
   **Reconciliation** (/reconciliation):
   - createReconciliation, updateReconciliation
   - executeMatchingRules (automated matching)
   - manualMatch, unmatch
   - approveReconciliation, closeReconciliation
   - getReconciliationDiscrepancies
   - createIntercompanyReconciliation, reconcileIntercompany
   - createEliminationEntry, approveEliminationEntry
   - getIntercompanyDiscrepancies
   
   **Account Balances** (/balances):
   - calculateAccountBalance (period-based, real-time)
   - getRunningBalance, getBalanceSnapshot
   - recalculateAllBalances (for data integrity)
   - getTrialBalance
   
   **Consolidation** (/consolidation):
   - consolidateSubaccounts (rollup balances from subaccounts to Agency level)
   - applyConsolidationAdjustments (manual adjustments)
   - applyEliminationEntries (intercompany eliminations)
   - getConsolidatedBalance (Agency-level consolidated balance by account)
   - validateConsolidation (ensure all mappings are valid)
   - getConsolidationWorksheet (working papers)
   - rollbackConsolidation (undo consolidation)
   
   **Financial Periods** (/periods):
   - createPeriod, updatePeriod, deletePeriod
   - openPeriod, closePeriod
   - yearEndProcessing, yearEndRollover
   - validatePeriodClose, getPeriodStatus
   
   **Multi-Currency** (/currency):
   - createExchangeRate, updateExchangeRate, getExchangeRate
   - convertAmount, revaluateAccount
   - calculateUnrealizedGainLoss, calculateRealizedGainLoss
   - processRevaluation, processRealization
   
   **Reporting** (/reports):
   - generateBalanceSheet, generateProfitLoss, generateCashFlow
   - generateTrialBalance, generateGeneralLedger
   - generateSubsidiaryLedger, generateAccountBalanceReport
   - **generateConsolidatedBalanceSheet** (Agency-level with subaccount rollup)
   - **generateConsolidatedProfitLoss** (Agency-level P&L)
   - **generateConsolidatedCashFlow** (Agency-level cash flow)
   - **generateConsolidationWorksheet** (detailed consolidation working papers)
   - **generateIntercompanyReport** (intercompany transactions and eliminations)
   - createCustomReport, executeCustomReport
   - exportReport (PDF, Excel, CSV)
   
   **Audit Trail** (/audit):
   - logTransaction (auto-called on all changes)
   - getAuditTrail, searchAuditLogs
   - getTransactionVersionHistory
   
   **All actions must:**
   - Follow our error handling and logging pattern
   - Include proper validation (Zod schemas)
   - Check RBAC permissions before execution
   - Log all operations to audit trail
   - Return ActionState<T> for error handling
   - Handle multi-currency conversions where applicable

3. **RBAC Permissions** (/src/lib/iam):
   
   **Permission Structure** (finance.gl.*):
   
   **Chart of Accounts:**
   - finance.gl.coa.view
   - finance.gl.coa.create
   - finance.gl.coa.edit
   - finance.gl.coa.delete
   - finance.gl.coa.manage_hierarchy
   - finance.gl.coa.enable_consolidation
   - finance.gl.coa.manage_group_coa
   - finance.gl.coa.manage_consolidation_mapping
   
   **Ledgers:**
   - finance.gl.ledger.view
   - finance.gl.ledger.create
   - finance.gl.ledger.edit
   - finance.gl.ledger.delete
   - finance.gl.ledger.configure
   
   **Transactions:**
   - finance.gl.transaction.view
   - finance.gl.transaction.create
   - finance.gl.transaction.edit_draft
   - finance.gl.transaction.submit
   - finance.gl.transaction.approve
   - finance.gl.transaction.post
   - finance.gl.transaction.void
   
   **Journal Entries:**
   - finance.gl.journal.view
   - finance.gl.journal.create
   - finance.gl.journal.edit_draft
   - finance.gl.journal.submit
   - finance.gl.journal.approve
   - finance.gl.journal.post
   - finance.gl.journal.reverse
   - finance.gl.journal.void
   
   **Reconciliation:**
   - finance.gl.reconciliation.view
   - finance.gl.reconciliation.create
   - finance.gl.reconciliation.execute
   - finance.gl.reconciliation.approve
   - finance.gl.reconciliation.close
   
   **Periods:**
   - finance.gl.period.view
   - finance.gl.period.create
   - finance.gl.period.open
   - finance.gl.period.close
   - finance.gl.period.year_end
   
   **Reporting:**
   - finance.gl.report.view
   - finance.gl.report.generate
   - finance.gl.report.export
   - finance.gl.report.create_custom
   
   **Audit:**
   - finance.gl.audit.view
   - finance.gl.audit.search
   
   **Multi-Currency:**
   - finance.gl.currency.manage_rates
   - finance.gl.currency.revaluate
   
   **Consolidation:**
   - finance.gl.consolidation.view
   - finance.gl.consolidation.execute
   - finance.gl.consolidation.adjust
   - finance.gl.consolidation.eliminate
   - finance.gl.consolidation.approve
   - finance.gl.consolidation.rollback

4. **Validation Schemas** (/src/lib/schemas/finance/gl):
   - chartOfAccountsSchema (Zod validation)
   - journalEntrySchema (double-entry validation)
   - transactionSchema (lifecycle validation)
   - reconciliationSchema
   - periodSchema (period close validation)
   - currencySchema, exchangeRateSchema
   - reportSchema, customReportSchema

5. **API Routes** (if needed - /src/app/api/finance/gl):
   - RESTful endpoints following our pattern
   - Proper authentication and authorization
   - Rate limiting for bulk operations
   - WebSocket for real-time balance updates

6. **UI Components** (/src/app/(main)/[agencyId]/finance/gl):
   
   **Chart of Accounts** (/chart-of-accounts):
   - Account list (table with hierarchy, search, filters)
   - Account form (create/edit with validation, consolidation settings)
   - Account hierarchy tree view (drag-drop reordering)
   - Account usage/activity report
   - **Agency Group COA management** (Agency-level master COA)
   - **Consolidation mapping interface** (map subaccount COA to group COA)
   - **Consolidation-enabled accounts view** (filter/highlight)
   
   **Ledgers** (/ledgers):
   - General ledger list & configuration
   - Subsidiary ledger list & configuration
   - Ledger viewer (detailed transactions)
   - Ledger linking interface
   
   **Transactions** (/transactions):
   - Transaction list (with status badges, filters)
   - Transaction form (multi-line, approval workflow)
   - Transaction approval queue
   - Transaction history/audit view
   
   **Journal Entries** (/journal-entries):
   - Journal entry list (draft, pending, posted, voided)
   - Journal entry form (multi-line debit/credit with validation)
   - Approval workflow interface
   - Batch entry interface
   - Reversal/void interface
   
   **Reconciliation** (/reconciliation):
   - Reconciliation dashboard
   - Account reconciliation interface (matching engine)
   - Period reconciliation interface
   - Discrepancy resolution UI
   - Reconciliation reports
   
   **Account Balances** (/balances):
   - Balance dashboard (real-time)
   - Trial balance report
   - Account balance detail view
   - Period comparison view
   
   **Financial Periods** (/periods):
   - Period calendar view
   - Period management (open/close)
   - Year-end processing wizard
   - Period status dashboard
   
   **Multi-Currency** (/currency):
   - Exchange rate management
   - Currency revaluation interface
   - Gain/loss reports
   - Multi-currency transaction view
   
   **Reports** (/reports):
   - Report dashboard
   - Balance Sheet viewer (with Agency/Subaccount toggle)
   - Profit & Loss statement (with Agency/Subaccount toggle)
   - Cash Flow statement (with Agency/Subaccount toggle)
   - **Consolidated Balance Sheet** (Agency-level)
   - **Consolidated P&L** (Agency-level)
   - **Consolidated Cash Flow** (Agency-level)
   - General Ledger report
   - Custom report builder
   - Report export options
   
   **Consolidation** (/consolidation):
   - Consolidation dashboard (Agency-level overview)
   - Consolidation mapping management
   - Consolidation execution interface (select subaccounts, run consolidation)
   - Intercompany reconciliation interface
   - Elimination entries management
   - Consolidation adjustments interface
   - Consolidation worksheet viewer
   - Consolidation validation report (show unmapped accounts, errors)
   - Intercompany transaction report
   - Consolidation audit trail
   
   **Audit Trail** (/audit):
   - Audit log viewer (searchable, filterable)
   - Transaction history viewer
   - User activity reports
   
   **All UI components must:**
   - Follow our layout pattern and use existing UI components
   - Include proper loading states
   - Handle errors gracefully with user-friendly messages
   - Support keyboard navigation
   - Be fully responsive (mobile, tablet, desktop)
   - Include inline help/tooltips for complex features
   - Use optimistic updates where applicable
   - Implement proper access control (hide/disable based on permissions)


7. **Currency Decimal Places 📍**
   **Implementation:**

   ```typescript
   // Use free NPM package
   import { currencies } from 'currency-codes';

   // Or maintain static lookup
   const CURRENCY_PRECISION = {
   'JPY': 0,  // Japanese Yen
   'KRW': 0,  // Korean Won
   'VND': 0,  // Vietnamese Dong
   'USD': 2,  // US Dollar
   'EUR': 2,  // Euro
   'BTC': 8,  // Bitcoin
   'ETH': 18, // Ethereum
   } as const;
   ```

   **Free Sources:**
   - NPM: `currency-codes` (ISO 4217 data)
   - NPM: `@dinero.js/currencies`
   - API: exchangerate-api.com (free tier)

   ---

 1. **Control Accounts for Subledgers ✅**

```prisma
model ChartOfAccount {
  id                    String   @id @default(cuid())
  code                  String
  name                  String
  
  // Account classification
  accountType           AccountType
  isControlAccount      Boolean  @default(false)
  subledgerType         SubledgerType?
  
  // Subledger linkage
  controlAccountId      String?
  controlAccount        ChartOfAccount? @relation("ControlAccountLink", fields: [controlAccountId], references: [id])
  subledgerAccounts     ChartOfAccount[] @relation("ControlAccountLink")
  
  // ... other fields ...
}

enum SubledgerType {
  ACCOUNTS_RECEIVABLE   // AR control
  ACCOUNTS_PAYABLE      // AP control
  INVENTORY             // Inventory control
  FIXED_ASSETS          // Asset register
  PAYROLL               // Payroll control
  BANK                  // Cash control
  NONE
}
```

**Example:**
```
Control: "1200 - Accounts Receivable" (isControlAccount: true)
  ├─ "1200-001 - Customer A"
  ├─ "1200-002 - Customer B"
  └─ "1200-003 - Customer C"
```

**Business Rules:**
- Control balance = SUM of subledgers
- Restrict direct posting to control accounts
- Auto-reconciliation validation

---

9. **Configuration & Setup UI 🎛️**

```prisma
model GLConfiguration {
  id                    String   @id @default(cuid())
  
  agencyId              String   @unique
  agency                Agency   @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  
  // General settings
  baseCurrency          String   @default("USD")
  fiscalYearEnd         String   @default("12-31")
  fiscalYearStart       String   @default("01-01")
  useControlAccounts    Boolean  @default(true)
  
  // Posting settings
  requireApproval       Boolean  @default(true)
  autoPostingEnabled    Boolean  @default(false)
  allowFuturePeriodPost Boolean  @default(false)
  allowClosedPeriodPost Boolean  @default(false)
  
  // Consolidation settings
  consolidationMethod   ConsolidationMethod @default(FULL)
  eliminateIntercompany Boolean  @default(true)
  
  // Period settings
  autoCreatePeriods     Boolean  @default(true)
  periodLockDays        Int      @default(5)
  
  // Number formats
  accountCodeFormat     String   @default("####-####")
  accountCodeLength     Int      @default(8)
  
  // Integrations
  erpIntegrationEnabled Boolean  @default(false)
  erpSystemType         String?
  erpApiUrl             String?
  erpApiKey             String?  @db.Text
  
  // Audit
  retainAuditDays       Int      @default(2555) // 7 years
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  updatedBy             String?
}

enum ConsolidationMethod {
  FULL              // 100% consolidation
  PROPORTIONAL      // Based on ownership %
  EQUITY            // Equity method
}
```

**UI Structure:**
```
/[agencyId]/finance/gl/settings
├─ /general         (base currency, fiscal year)
├─ /posting         (approval rules, auto-posting)
├─ /consolidation   (method, intercompany)
├─ /periods         (auto-create, lock rules)
├─ /number-formats  (account code format)
├─ /integrations    (ERP, bank feeds)
└─ /audit           (retention policies)
```

---

10. **Industry COA Templates 📋**

```prisma
model COATemplate {
  id                String   @id @default(cuid())
  
  name              String   // "SaaS Company COA"
  industry          Industry
  description       String
  region            String   @default("US")
  accountingStandard String  @default("GAAP")
  
  // Template definition
  template          Json     // Full COA structure
  
  // Metadata
  version           String   @default("1.0")
  active            Boolean  @default(true)
  isDefault         Boolean  @default(false)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([industry, active])
  @@index([region, accountingStandard])
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
```

**Seed Templates:**
1. Retail Business (GAAP)
2. SaaS Company (GAAP)
3. Manufacturing (GAAP)
4. E-commerce (GAAP)
5. Consulting/Services (GAAP)
6. Non-Profit (GAAP)
7. Generic Business (IFRS)

**Setup Wizard UI:**
```
/[agencyId]/finance/gl/setup/wizard
Step 1: Select industry
Step 2: Select template
Step 3: Customize accounts
Step 4: Review and create
```

---

11. **Carry Forward & Brought Forward 🔄**
```prisma
   model AccountBalance {
   id                String   @id @default(cuid())
   
   accountId         String
   account           ChartOfAccount @relation(fields: [accountId], references: [id])
   
   periodId          String
   period            FinancialPeriod @relation(fields: [periodId], references: [id])
   
   // Balance components
   openingBalance    Decimal  @db.Decimal(18, 6) @default(0) // BF
   debitMovement     Decimal  @db.Decimal(18, 6) @default(0)
   creditMovement    Decimal  @db.Decimal(18, 6) @default(0)
   closingBalance    Decimal  @db.Decimal(18, 6) @default(0) // CF
   
   balanceType       BalanceType @default(NORMAL)
   
   @@unique([accountId, periodId])
   @@index([periodId])
   @@index([accountId])
   }

   enum BalanceType {
   NORMAL
   OPENING           // BF from previous
   CLOSING           // CF to next
   ADJUSTMENT
   REVERSAL
   }

   model JournalEntry {
   id                String   @id @default(cuid())
   
   entryType         JournalEntryType @default(NORMAL)
   
   // CF/BF tracking
   isCarryForward    Boolean  @default(false)
   isBroughtForward  Boolean  @default(false)
   
   carryForwardFromId String?
   carryForwardFrom   JournalEntry? @relation("CarryForwardLink", fields: [carryForwardFromId], references: [id])
   carriedForwardTo   JournalEntry[] @relation("CarryForwardLink")
   
   // ...
   }

   enum JournalEntryType {
   NORMAL
   OPENING
   CLOSING
   CARRY_FORWARD
   BROUGHT_FORWARD
   YEAR_END_CLOSING  // Income/Expense → Retained Earnings
   ADJUSTMENT
   REVERSAL
   CONSOLIDATION
   ELIMINATION
   }
  ```
**Period-Close Logic:** 
```typescript
      // Income/Expense → Retained Earnings
      JE: Debit Revenue $100k | Credit Retained Earnings $100k

      // Balance Sheet → Carry Forward
      CF: Debit Cash CF $50k | Credit Opening Balance Control $50k

      // Next Period Open → Brought Forward
      BF: Debit Opening Balance Control $50k | Credit Cash BF $50k
   ```

---

**12. System Accounts & Account Protection 🔒**

```prisma
model ChartOfAccount {
  id                    String   @id @default(cuid())
  code                  String
  name                  String
  
  // Account classification
  accountType           AccountType
  
  // System account protection
  isSystemAccount       Boolean  @default(false)  // Cannot be deleted
  isSystemManaged       Boolean  @default(false)  // Cannot be modified by users
  systemAccountType     SystemAccountType?        // Identifies system account purpose
  
  // Special account types
  isClearingAccount     Boolean  @default(false)  // Temporary holding account
  isSuspenseAccount     Boolean  @default(false)  // Unresolved transactions
  isRetainedEarnings    Boolean  @default(false)  // Year-end close destination
  isOpeningBalControl   Boolean  @default(false)  // Opening balance control
  
  // Account behavior
  allowManualPosting    Boolean  @default(true)   // Allow direct posting
  requireApproval       Boolean  @default(false)  // Extra approval required
  
  // Control account (from previous)
  isControlAccount      Boolean  @default(false)
  subledgerType         SubledgerType?
  
  // Audit protection
  canDelete             Boolean  @default(true)   // Computed based on rules
  canModify             Boolean  @default(true)   // Computed based on rules
  deletionBlockedReason String?                   // Why deletion is blocked
  
  // ... other fields ...
}

enum SystemAccountType {
  RETAINED_EARNINGS           // Year-end income/expense close
  OPENING_BALANCE_CONTROL     // Period opening control
  SUSPENSE                    // Unresolved items
  ROUNDING_DIFFERENCE         // Currency rounding
  INTERCOMPANY_CLEARING       // IC transaction clearing
  PAYROLL_CLEARING            // Payroll processing
  PAYMENT_CLEARING            // Payment processing
  BANK_RECONCILIATION         // Bank rec clearing
  FOREIGN_EXCHANGE_GAIN       // FX realized gain
  FOREIGN_EXCHANGE_LOSS       // FX realized loss
  UNREALIZED_FX_GAIN          // FX unrealized gain
  UNREALIZED_FX_LOSS          // FX unrealized loss
  CONSOLIDATION_ADJUSTMENT    // Consolidation adjustments
  ELIMINATION_ACCOUNT         // Intercompany eliminations
}
```

**System Account Protection Rules:**

```typescript
// Business logic for account deletion/modification
const canDeleteAccount = (account: ChartOfAccount): boolean => {
  // Cannot delete if:
  if (account.isSystemAccount) return false;
  if (account.hasTransactions) return false;
  if (account.childAccounts.length > 0) return false;
  if (account.isControlAccount && account.subledgerAccounts.length > 0) return false;
  if (account.isUsedInPostingRules) return false;
  return true;
};

const canModifyAccount = (account: ChartOfAccount): boolean => {
  // Cannot modify core fields if:
  if (account.isSystemManaged) return false; // Full lock
  if (account.isSystemAccount) {
    // Can only modify description, not code/type
    return { allowedFields: ['description', 'notes'] };
  }
  return true;
};
```

**System Accounts to Create on Setup:**

```typescript
const SYSTEM_ACCOUNTS = [
  {
    code: '3999',
    name: 'Retained Earnings',
    type: 'EQUITY',
    isSystemAccount: true,
    isSystemManaged: true,
    systemAccountType: 'RETAINED_EARNINGS',
    isRetainedEarnings: true,
    allowManualPosting: false, // Only system can post
  },
  {
    code: '9999',
    name: 'Opening Balance Control',
    type: 'EQUITY',
    isSystemAccount: true,
    isSystemManaged: true,
    systemAccountType: 'OPENING_BALANCE_CONTROL',
    isOpeningBalControl: true,
    allowManualPosting: false,
  },
  {
    code: '1099',
    name: 'Suspense Account',
    type: 'ASSET',
    isSystemAccount: true,
    isSuspenseAccount: true,
    systemAccountType: 'SUSPENSE',
    requireApproval: true,
  },
  {
    code: '1098',
    name: 'Clearing Account',
    type: 'ASSET',
    isSystemAccount: true,
    isClearingAccount: true,
    systemAccountType: 'INTERCOMPANY_CLEARING',
    allowManualPosting: false,
  },
  {
    code: '7100',
    name: 'Foreign Exchange Gain',
    type: 'REVENUE',
    isSystemAccount: true,
    systemAccountType: 'FOREIGN_EXCHANGE_GAIN',
  },
  {
    code: '8100',
    name: 'Foreign Exchange Loss',
    type: 'EXPENSE',
    isSystemAccount: true,
    systemAccountType: 'FOREIGN_EXCHANGE_LOSS',
  },
];
```

**UI Indicators:**
- 🔒 System Account badge (cannot delete)
- 🔐 System Managed badge (limited editing)
- 🔄 Clearing Account badge
- ⚠️ Suspense Account badge (requires approval)
- 💼 Control Account badge
- Show deletion blocked reason on hover

---





**VALIDATION REQUIREMENTS:**
- Double-entry validation (debits = credits)
- Period closing validation
- Permission checks on all operations
- Audit trail for all transactions
- Multi-currency support (if applicable)


**PHASE 3: CLARIFICATIONS & QUESTIONS**
Additional on top of the above, if you has no quesitons after anlyzing each Questions with Decision below, please provide comprehensive answers for each question before proceeding to implementation.

---

# Phase 3A: ADDITIONAL CLARIFICATIONS & QUESTIONS

## FAQ Questions (1-6)

### 1. Currency Handling ✅

**Decision: Use Decimal with precise specifications**

```prisma
model JournalEntryLine {
  amount         Decimal  @db.Decimal(18, 6)  // Transaction amounts
  baseAmount     Decimal? @db.Decimal(18, 6)  // Converted to base currency
  exchangeRate   Decimal? @db.Decimal(12, 6)  // Supports extreme rates (crypto, historical)
}

model ExchangeRate {
  rate           Decimal  @db.Decimal(12, 6)  // 999,999.999999
}

model PostingRule {
  percentage     Decimal? @db.Decimal(5, 4)   // Tax rates: 99.9999%
  threshold      Decimal? @db.Decimal(18, 6)  // Amount thresholds
}

model Currency {
  code            String   @id // ISO 4217 code
  name            String
  symbol          String
  decimalPlaces   Int      @default(2) // Store actual decimal places
  active          Boolean  @default(true)
  // ...
}
```

**Implementation:**
- `Decimal(18, 6)`: Transaction amounts (up to 999 trillion with 6 decimal precision)
- `Decimal(12, 6)`: Exchange rates (supports extreme historical/crypto rates)
- `Decimal(5, 4)`: Percentages/tax rates (up to 99.9999%)
- **Never use Float** - prevents rounding errors in financial calculations

**Currency Decimal Places:**
- Use `currency-codes` NPM package (free, ISO 4217 data)
- Alternative: `@dinero.js/currencies` (includes precision metadata)
- Store `decimalPlaces` in Currency model for dynamic formatting

```typescript
const CURRENCY_PRECISION = {
  'JPY': 0,  'KRW': 0,  'VND': 0,  // No decimals
  'USD': 2,  'EUR': 2,  'GBP': 2,  // Standard 2 decimals
  'BTC': 8,  'ETH': 18,             // Crypto precision
} as const;
```

---

### 2. Account Hierarchy Depth 🌳

**Decision: Hybrid approach - parentId + materialized path + level**

```prisma
model ChartOfAccount {
  id                    String   @id @default(cuid())
  code                  String   // "1000-1100-1110" or "1.1.1.1"
  name                  String
  
  // Self-reference for tree structure
  parentAccountId       String?
  parentAccount         ChartOfAccount? @relation("AccountHierarchy", fields: [parentAccountId], references: [id], onDelete: Restrict)
  childAccounts         ChartOfAccount[] @relation("AccountHierarchy")
  
  // Materialized path for fast queries
  path                  String   // "/1/12/123/1234/"
  level                 Int      @default(0) // 0-based depth
  
  // Classification
  accountType           AccountType
  category              String?  // "Current Assets", "Fixed Assets"
  subcategory           String?  // "Cash & Cash Equivalents"
  
  @@index([path])
  @@index([parentAccountId])
  @@index([level])
  @@index([agencyId, code])
  @@index([agencyId, accountType, level])
}
```

**Maximum Depth: 7 levels**
- Level 0: Account Type (Asset, Liability, Equity, Revenue, Expense)
- Level 1: Category (Current Assets, Fixed Assets)
- Level 2: Subcategory (Cash, Inventory)
- Level 3-6: Detail accounts
- Level 7: Sub-detail

**Benefits:**
- `parentAccountId`: Intuitive tree operations
- `path`: Fast descendant queries (`WHERE path LIKE '/1/12/%'`)
- `level`: Quick filtering & validation

---

### 3. Period Management 📅

**Decision: Flexible per-entity periods with different fiscal years**

```prisma
model FinancialPeriod {
  id                String   @id @default(cuid())
  
  // Multi-tenant support
  agencyId          String?
  subAccountId      String?
  agency            Agency?   @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  subAccount        SubAccount? @relation(fields: [subAccountId], references: [id], onDelete: Cascade)
  
  // Period definition
  name              String   // "January 2026", "Q1 FY2026"
  periodType        PeriodType
  fiscalYear        Int      // 2026
  fiscalPeriod      Int      // 1-12 for months, 1-4 for quarters
  
  startDate         DateTime
  endDate           DateTime
  
  // Status workflow
  status            PeriodStatus @default(FUTURE)
  
  // Closing metadata
  openedAt          DateTime?
  openedBy          String?
  closedAt          DateTime?
  closedBy          String?
  lockedAt          DateTime?
  lockedBy          String?
  
  // Snapshots
  openingBalances   Json?
  closingBalances   Json?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  createdBy         String
  updatedBy         String?
  
  @@unique([agencyId, fiscalYear, periodType, fiscalPeriod])
  @@unique([subAccountId, fiscalYear, periodType, fiscalPeriod])
  @@index([agencyId, status])
  @@index([subAccountId, status])
}

enum PeriodType {
  MONTH
  QUARTER
  HALF_YEAR
  YEAR
  CUSTOM
}

enum PeriodStatus {
  FUTURE      // Not yet started
  OPEN        // Active, can post transactions
  CLOSED      // Closed, limited posting (adjustments only)
  LOCKED      // Permanently locked, no changes
}
```

**Business Rules:**
- SubAccounts CAN have different fiscal years than Agency
- Supports calendar year AND custom fiscal years
- Status workflow: FUTURE → OPEN → CLOSED → LOCKED
- Period mapping required for consolidation

---

### 4. Consolidation Scope 📊

**Decision: Hybrid - Real-time for current, Snapshots for historical**

```prisma
model ConsolidationSnapshot {
  id                    String   @id @default(cuid())
  
  agencyId              String
  agency                Agency   @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  
  periodId              String
  period                FinancialPeriod @relation(fields: [periodId], references: [id])
  
  // Scope
  subAccountIds         String[]
  
  // Consolidated results (denormalized)
  consolidatedBalances  Json
  balanceSheet          Json
  incomeStatement       Json
  cashFlowStatement     Json
  
  // Adjustments
  eliminationEntries    Json
  adjustmentEntries     Json
  
  // Metadata
  version               Int      @default(1)
  status                ConsolidationStatus @default(DRAFT)
  
  consolidatedAt        DateTime @default(now())
  consolidatedBy        String
  approvedAt            DateTime?
  approvedBy            String?
  
  validationResults     Json?
  notes                 String?
  
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  
  @@unique([agencyId, periodId, version])
  @@index([agencyId, periodId, status])
}

enum ConsolidationStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  REJECTED
  SUPERSEDED
}

model ConsolidationWorksheet {
  id                    String   @id @default(cuid())
  snapshotId            String
  snapshot              ConsolidationSnapshot @relation(fields: [snapshotId], references: [id], onDelete: Cascade)
  
  accountCode           String
  subAccountBalances    Json     // { "subaccount1": 1000 }
  eliminations          Decimal  @db.Decimal(18, 6) @default(0)
  adjustments           Decimal  @db.Decimal(18, 6) @default(0)
  consolidatedBalance   Decimal  @db.Decimal(18, 6)
  
  @@unique([snapshotId, accountCode])
  @@index([snapshotId])
}
```

**Usage:**
- **Real-time**: Current open period, what-if scenarios, dashboards
- **Snapshots**: Closed periods, approved consolidations, regulatory reporting
- **Versioning**: Support restatements with new version

---

### 5. Who Fields 👤

**Decision: Comprehensive audit trail on ALL transactional models**

```prisma
model JournalEntry {
  id          String   @id @default(cuid())
  
  // Standard CRUD audit
  createdAt   DateTime @default(now())
  createdBy   String   // User ID (String to prevent deletion issues)
  updatedAt   DateTime @updatedAt
  updatedBy   String?
  
  // Workflow audit
  submittedAt DateTime?
  submittedBy String?
  approvedAt  DateTime?
  approvedBy  String?
  rejectedAt  DateTime?
  rejectedBy  String?
  rejectionReason String?
  
  // Posting audit
  postedAt    DateTime?
  postedBy    String?
  
  // Reversal audit
  reversedAt  DateTime?
  reversedBy  String?
  reversalReason String?
  
  // Voiding audit
  voidedAt    DateTime?
  voidedBy    String?
  voidReason  String?
  
  @@index([createdBy])
  @@index([approvedBy])
  @@index([postedBy])
}
```

**Apply to:**
- ✅ ChartOfAccount, JournalEntry, Transaction
- ✅ Reconciliation, FinancialPeriod, ConsolidationSnapshot
- ✅ PostingRule
- ❌ AccountBalance (calculated), AuditTrail (system-generated)

**Rationale:**
- SOX/IFRS compliance
- Fraud detection & forensics
- Complete accountability trail

---

### 6. Posting Rules 🔗

**Decision: Polymorphic pattern with JSON templates**

```prisma
model PostingRule {
  id                String   @id @default(cuid())
  
  agencyId          String?
  subAccountId      String?
  agency            Agency?   @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  subAccount        SubAccount? @relation(fields: [subAccountId], references: [id], onDelete: Cascade)
  
  code              String   @unique // "INV-REVENUE"
  name              String
  description       String?
  
  // Polymorphic source reference
  sourceModule      SourceModule
  
  // JSON rules for flexibility
  conditions        Json?    // { "amountGreaterThan": 1000 }
  template          Json     // [{ "debit": "1000", "credit": "4000", "percentage": 100 }]
  
  // Metadata
  priority          Int      @default(0)
  active            Boolean  @default(true)
  autoPost          Boolean  @default(false)
  
  // Audit
  createdAt         DateTime @default(now())
  createdBy         String
  updatedAt         DateTime @updatedAt
  updatedBy         String?
  activatedAt       DateTime?
  activatedBy       String?
  deactivatedAt     DateTime?
  deactivatedBy     String?
  
  journalEntries    JournalEntry[]
  
  @@index([sourceModule, active])
  @@index([agencyId, active])
}

enum SourceModule {
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

model JournalEntry {
  id                String   @id @default(cuid())
  
  // Polymorphic source tracking
  sourceModule      SourceModule
  sourceId          String
  sourceReference   String?  // "INV-001"
  
  postingRuleId     String?
  postingRule       PostingRule? @relation(fields: [postingRuleId], references: [id])
  
  @@index([sourceModule, sourceId])
  @@index([postingRuleId])
}
```

**Benefits:**
- No circular dependencies
- Easy to add new modules
- Flexible JSON rules
- Full traceability

---

## Final Summary Table

| Requirement              | Decision                                        | Key Points                                                  |
| ------------------------ | ----------------------------------------------- | ----------------------------------------------------------- |
| **1. Decimals**          | (18,6) amounts, (12,6) rates, (5,4) percentages | Use `currency-codes` NPM, store precision in Currency model |
| **2. Hierarchy**         | Hybrid: parentId + path + level, Max 7 levels   | Performance + flexibility                                   |
| **3. Periods**           | Per-entity flexible fiscal years                | Support calendar + custom fiscal years                      |
| **4. Consolidation**     | Hybrid: real-time + versioned snapshots         | Draft → Review → Approve workflow                           |
| **5. Audit Fields**      | Comprehensive who/when/why on all models        | SOX compliance, full forensics                              |
| **6. Posting Rules**     | Polymorphic with JSON templates                 | Loose coupling, flexible conditions                         |
| **7. Currency Decimals** | currency-codes package + decimalPlaces field    | Free ISO 4217 data                                          |
| **8. Control Accounts**  | isControlAccount + subledgerType + linkage      | AR, AP, Inventory, etc.                                     |
| **9. Settings UI**       | GLConfiguration model + dedicated UI            | 7 settings pages                                            |
| **10. COA Templates**    | COATemplate model + 6-8 industry seeds          | Setup wizard with customization                             |
| **11. CF/BF Types**      | BalanceType + JournalEntryType + linkage        | Period open/close automation                                |
| **12. System Accounts**  | isSystemAccount + protection flags + types      | 15+ system account types, deletion protection               |

**This is a production-ready enterprise accounting system design! 🚀**

---

**Please start with Step 1 (Database Schema). After I review, we'll proceed to Step 2.**