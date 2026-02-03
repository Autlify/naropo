import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { hasAgencyPermission } from '@/lib/features/iam/authz/permissions';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApprovalQueue } from '@/components/fi/general-ledger/approvals';
import { getPendingApprovals } from '@/lib/features/fi/general-ledger/actions/journal-entries';
import { ClipboardCheck, FileText } from 'lucide-react';

type Props = {
    params: Promise<{ agencyId: string }>;
};

const ApprovalsPage = async ({ params }: Props) => {
    const { agencyId } = await params;

    const session = await auth();
    if (!session?.user?.id) {
        redirect('/sign-in');
    }

    const hasPermission = await hasAgencyPermission(agencyId, 'fi.general_ledger.journal_entries.approve');
    if (!hasPermission) {
        notFound();
    }

    // Fetch pending approvals
    const result = await getPendingApprovals();
    const data = result.success ? result.data : { journalEntries: [], counts: { journalEntries: 0 } };

    const totalPending = data?.counts.journalEntries ?? 0;

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <ClipboardCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Approvals</h1>
                    <p className="text-sm text-muted-foreground">
                        Review and approve pending financial transactions
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className={totalPending > 0 ? 'border-amber-500/50 bg-amber-500/5' : undefined}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{totalPending}</div>
                        <p className="text-xs text-muted-foreground">
                            {totalPending === 0 ? 'All caught up' : 'Awaiting your review'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <ApprovalQueue
                    entries={data?.journalEntries ?? []}
                    agencyId={agencyId}
                />
            </Suspense>
        </div>
    );
}

export default ApprovalsPage;
