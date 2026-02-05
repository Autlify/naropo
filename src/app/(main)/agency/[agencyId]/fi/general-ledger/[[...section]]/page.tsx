/**
 * FI-GL Catch-All Route
 * 
 * Consolidates all GL sections into one dynamic route.
 * Renders existing components directly without intermediate wrappers.
 */

import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Existing GL Components
import { ApprovalQueue } from '@/components/features/fi/general-ledger/approvals'
import { AuditTrailViewer } from '@/components/features/fi/general-ledger/audit'
import { ChartOfAccountsTable } from '@/components/features/fi/general-ledger/chart-of-accounts'
import { ConsolidationDashboard } from '@/components/features/fi/general-ledger/consolidation'
import { JournalEntriesTable, JournalEntryForm } from '@/components/features/fi/general-ledger/journal-entries'
import { ReportFilters, TrialBalanceReport } from '@/components/features/fi/general-ledger/reports'
import { GLSettingsForm, GLSetupWizard } from '@/components/features/fi/general-ledger/settings'

// Actions for data fetching
import { listChartOfAccounts } from '@/lib/features/fi/general-ledger/actions/chart-of-accounts'
import { listJournalEntries, getPendingApprovals } from '@/lib/features/fi/general-ledger/actions/journal-entries'
import { getAuditEntityTypes } from '@/lib/features/fi/general-ledger/actions/audit'
import { listFinancialPeriods } from '@/lib/features/fi/general-ledger/actions/periods'
import { listConsolidationSnapshots } from '@/lib/features/fi/general-ledger/actions/consolidation'
import { getGLConfiguration } from '@/lib/features/fi/general-ledger/actions/configuration'
import { generateTrialBalance } from '@/lib/features/fi/general-ledger/actions/reports'
import { hasAgencyPermission } from '@/lib/features/iam/authz/permissions'

// Types
import type { GenLedgerAccount, FiscalPeriod, ConsolidationSnapshot, PendingEntry } from '@/types/finance'

type Props = {
  params: Promise<{ agencyId: string; section?: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

// ============================================================================
// Section: Overview (default)
// ============================================================================
async function OverviewSection({ agencyId }: { agencyId: string }) {
  const [accountsResult, entriesResult, periodsResult] = await Promise.all([
    listChartOfAccounts(),
    listJournalEntries(),
    listFinancialPeriods(),
  ])

  const accounts = accountsResult.success ? (accountsResult.data ?? []) : []
  const entries = entriesResult.success ? (entriesResult.data ?? []) : []
  const periods = periodsResult.success ? (periodsResult.data ?? []) : []

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">General Ledger</h1>
        <p className="text-sm text-muted-foreground">Financial accounting overview</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Accounts</div>
          <div className="text-2xl font-bold">{accounts.length}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Journal Entries</div>
          <div className="text-2xl font-bold">{entries.length}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Periods</div>
          <div className="text-2xl font-bold">{periods.length}</div>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-4">Recent Journal Entries</h2>
        <JournalEntriesTable entries={entries.slice(0, 5)} agencyId={agencyId} />
      </div>
    </div>
  )
}

// ============================================================================
// Section: Chart of Accounts
// ============================================================================
async function ChartOfAccountsSection({ agencyId }: { agencyId: string }) {
  const accountsResult = await listChartOfAccounts()
  const accounts = accountsResult.success ? (accountsResult.data ?? []) : []

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">Chart of Accounts</h1>
        <p className="text-sm text-muted-foreground">Manage your GL account structure</p>
      </div>
      <ChartOfAccountsTable 
        accounts={accounts as GenLedgerAccount[]} 
        agencyId={agencyId}
      />
    </div>
  )
}

// ============================================================================
// Section: Journal Entries
// ============================================================================
async function JournalEntriesSection({ agencyId }: { agencyId: string }) {
  const entriesResult = await listJournalEntries()
  const entries = entriesResult.success ? (entriesResult.data ?? []) : []

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">Journal Entries</h1>
        <p className="text-sm text-muted-foreground">View and manage journal entries</p>
      </div>
      <JournalEntriesTable entries={entries} agencyId={agencyId} />
    </div>
  )
}

// ============================================================================
// Section: New Journal Entry
// ============================================================================
async function JournalEntryNewSection({ agencyId }: { agencyId: string }) {
  const [accountsResult, periodsResult] = await Promise.all([
    listChartOfAccounts(),
    listFinancialPeriods(),
  ])
  const accounts = accountsResult.success ? (accountsResult.data ?? []) : []
  const periods = periodsResult.success ? (periodsResult.data ?? []) : []

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">New Journal Entry</h1>
        <p className="text-sm text-muted-foreground">Create a new journal entry</p>
      </div>
      <JournalEntryForm 
        agencyId={agencyId}
        accounts={accounts as Partial<GenLedgerAccount[]>}
        periods={periods as FiscalPeriod[]}
      />
    </div>
  )
}

// ============================================================================
// Section: Periods
// ============================================================================
async function PeriodsSection({ agencyId }: { agencyId: string }) {
  const periodsResult = await listFinancialPeriods()
  const periods = periodsResult.success ? (periodsResult.data ?? []) : []

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">Fiscal Periods</h1>
        <p className="text-sm text-muted-foreground">Manage accounting periods</p>
      </div>
      <div className="rounded-lg border">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="p-3 text-left font-medium">Period</th>
              <th className="p-3 text-left font-medium">Start Date</th>
              <th className="p-3 text-left font-medium">End Date</th>
              <th className="p-3 text-left font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((period: FiscalPeriod) => (
              <tr key={period.id} className="border-b">
                <td className="p-3">{period.name}</td>
                <td className="p-3">{new Date(period.startDate).toLocaleDateString()}</td>
                <td className="p-3">{new Date(period.endDate).toLocaleDateString()}</td>
                <td className="p-3">{period.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================================
// Section: Approvals
// ============================================================================
async function ApprovalsSection({ agencyId }: { agencyId: string }) {
  const result = await getPendingApprovals()
  const entries = result.success ? (result.data?.journalEntries as PendingEntry[] ?? []) : []

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">Approvals</h1>
        <p className="text-sm text-muted-foreground">Review and approve pending journal entries</p>
      </div>
      <ApprovalQueue entries={entries} agencyId={agencyId} />
    </div>
  )
}

// ============================================================================
// Section: Audit Trail
// ============================================================================
async function AuditSection({ agencyId }: { agencyId: string }) {
  const entityTypes = await getAuditEntityTypes(agencyId)

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">Audit Trail</h1>
        <p className="text-sm text-muted-foreground">View audit history for all GL transactions</p>
      </div>
      <AuditTrailViewer agencyId={agencyId} entityTypes={entityTypes} />
    </div>
  )
}

// ============================================================================
// Section: Consolidation
// ============================================================================
async function ConsolidationSection({ agencyId }: { agencyId: string }) {
  const [snapshotsResult, periodsResult, canManage] = await Promise.all([
    listConsolidationSnapshots(),
    listFinancialPeriods(),
    hasAgencyPermission(agencyId, 'fi.general_ledger.consolidation.manage'),
  ])
  const snapshots = snapshotsResult.success ? (snapshotsResult.data?.snapshots as ConsolidationSnapshot[] ?? []) : []
  const periods = periodsResult.success ? (periodsResult.data as FiscalPeriod[] ?? []) : []

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">Consolidation</h1>
        <p className="text-sm text-muted-foreground">Multi-entity financial consolidation</p>
      </div>
      <ConsolidationDashboard 
        snapshots={snapshots}
        periods={periods}
        agencyId={agencyId}
        canManage={canManage}
      />
    </div>
  )
}

// ============================================================================
// Section: Settings
// ============================================================================
async function SettingsSection({ agencyId }: { agencyId: string }) {
  const configResult = await getGLConfiguration()
  const config = configResult.success ? configResult.data : null

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">GL Settings</h1>
        <p className="text-sm text-muted-foreground">Configure General Ledger module</p>
      </div>
      {config ? (
        <GLSettingsForm section="fiscalYear" initialData={config} />
      ) : (
        <GLSetupWizard agencyId={agencyId} />
      )}
    </div>
  )
}

// ============================================================================
// Section: Trial Balance Report
// ============================================================================
async function TrialBalanceSection({ agencyId }: { agencyId: string }) {
  const [periodsResult, trialBalanceResult] = await Promise.all([
    listFinancialPeriods(),
    generateTrialBalance(new Date().toISOString().split('T')[0]),
  ])
  const periods = periodsResult.success ? (periodsResult.data as FiscalPeriod[] ?? []) : []
  const trialBalanceData = trialBalanceResult.success ? trialBalanceResult.data : { 
    accounts: [], 
    totals: { debit: 0, credit: 0 },
    asOfDate: new Date().toISOString(),
    generatedAt: new Date().toISOString(),
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">Trial Balance</h1>
        <p className="text-sm text-muted-foreground">View trial balance report</p>
      </div>
      <ReportFilters 
        reportType="trial-balance"
        periods={periods} 
        basePath={`/agency/${agencyId}/fi/general-ledger/reports/trial-balance`}
      />
      <TrialBalanceReport data={trialBalanceData} agencyId={agencyId} />
    </div>
  )
}

// ============================================================================
// Main Page Component
// ============================================================================
export default async function GLSectionPage({ params }: Props) {
  const { agencyId, section } = await params
  const sectionPath = section?.join('/') ?? ''

  return (
    <Suspense fallback={<Skeleton className="h-96 w-full m-4" />}>
      {renderSection(agencyId, sectionPath)}
    </Suspense>
  )
}

function renderSection(agencyId: string, sectionPath: string) {
  switch (sectionPath) {
    case '':
      return <OverviewSection agencyId={agencyId} />
    case 'chart-of-accounts':
      return <ChartOfAccountsSection agencyId={agencyId} />
    case 'journal-entries':
      return <JournalEntriesSection agencyId={agencyId} />
    case 'journal-entries/new':
      return <JournalEntryNewSection agencyId={agencyId} />
    case 'periods':
      return <PeriodsSection agencyId={agencyId} />
    case 'approvals':
      return <ApprovalsSection agencyId={agencyId} />
    case 'audit':
      return <AuditSection agencyId={agencyId} />
    case 'consolidation':
      return <ConsolidationSection agencyId={agencyId} />
    case 'settings':
      return <SettingsSection agencyId={agencyId} />
    case 'reports':
    case 'reports/trial-balance':
      return <TrialBalanceSection agencyId={agencyId} />
    default:
      notFound()
  }
}
