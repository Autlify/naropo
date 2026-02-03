import { ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { auth } from '@/auth';
import { hasAgencyPermission } from '@/lib/features/iam/authz/permissions';
import { redirect } from 'next/navigation';
import PageTitle from '@/components/global/page-title';
import Unauthorized from '../../../../../../components/unauthorized';

export default async function GeneralLedgerLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ agencyId: string }>;
}) {
  const { agencyId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  // Check permissions for tabs
  const [canViewCOA, canViewJournal, canViewPeriods, canViewReports, canViewSettings, canApprove] =
    await Promise.all([
      hasAgencyPermission(agencyId, 'fi.master_data.accounts.view'),
      hasAgencyPermission(agencyId, 'fi.general_ledger.journal_entries.read'),
      hasAgencyPermission(agencyId, 'fi.configuration.fiscal_years.view'),
      hasAgencyPermission(agencyId, 'fi.general_ledger.reports.view'),
      hasAgencyPermission(agencyId, 'fi.general_ledger.settings.view'),
      hasAgencyPermission(agencyId, 'fi.general_ledger.journal_entries.approve'),
    ]);

  if (
    !canViewCOA &&
    !canViewJournal &&
    !canViewPeriods &&
    !canViewReports &&
    !canViewSettings
  ) {
    return (
      <div className="h-full flex items-center justify-center">
        <Unauthorized />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <PageTitle title="General Ledger" description="" />
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="h-10">
              <TabsTrigger value="overview" asChild>
                <Link href={`/agency/${agencyId}/fi/general-ledger`}>Overview</Link>
              </TabsTrigger>
              {canViewCOA && (
                <TabsTrigger value="coa" asChild>
                  <Link href={`/agency/${agencyId}/fi/general-ledger/chart-of-accounts`}>
                    Chart of Accounts
                  </Link>
                </TabsTrigger>
              )}
              {canViewJournal && (
                <TabsTrigger value="journal" asChild>
                  <Link href={`/agency/${agencyId}/fi/general-ledger/journal-entries`}>
                    Journal Entries
                  </Link>
                </TabsTrigger>
              )}
              {canApprove && (
                <TabsTrigger value="approvals" asChild>
                  <Link href={`/agency/${agencyId}/fi/general-ledger/approvals`}>
                    Approvals
                  </Link>
                </TabsTrigger>
              )}
              {canViewPeriods && (
                <TabsTrigger value="periods" asChild>
                  <Link href={`/agency/${agencyId}/fi/general-ledger/periods`}>
                    Periods
                  </Link>
                </TabsTrigger>
              )}
              {canViewReports && (
                <TabsTrigger value="reports" asChild>
                  <Link href={`/agency/${agencyId}/fi/general-ledger/reports`}>
                    Reports
                  </Link>
                </TabsTrigger>
              )}
              {canViewSettings && (
                <TabsTrigger value="bank-ledger" asChild>
                  <Link href={`/agency/${agencyId}/fi/general-ledger/bank-ledger`}>
                    Bank Ledger
                  </Link>
                </TabsTrigger>
              )}
              {canViewSettings && (
                <TabsTrigger value="audit" asChild>
                  <Link href={`/agency/${agencyId}/fi/general-ledger/audit`}>
                    Audit Trail
                  </Link>
                </TabsTrigger>
              )}
              {canViewSettings && (
                <TabsTrigger value="posting-rules" asChild>
                  <Link href={`/agency/${agencyId}/fi/general-ledger/posting-rules`}>
                    Posting Rules
                  </Link>
                </TabsTrigger>
              )}
              {canViewSettings && (
                <TabsTrigger value="consolidation" asChild>
                  <Link href={`/agency/${agencyId}/fi/general-ledger/consolidation`}>
                    Consolidation
                  </Link>
                </TabsTrigger>
              )}
              {canViewSettings && (
                <TabsTrigger value="settings" asChild>
                  <Link href={`/agency/${agencyId}/fi/general-ledger/settings`}>
                    Settings
                  </Link>
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>
      </div>
      <main className="flex-1">{children}</main>
    </div>
  );
}
