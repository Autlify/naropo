import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { hasAgencyPermission } from '@/lib/features/iam/authz/permissions';
import { Skeleton } from '@/components/ui/skeleton';
import { PostingRulesTable } from '@/components/fi/general-ledger/posting-rules';
import { listPostingRules } from '@/lib/features/fi/general-ledger/actions/posting-rules';
import { listChartOfAccounts } from '@/lib/features/fi/general-ledger/actions/chart-of-accounts';
import { Zap } from 'lucide-react';

type Props = {
  params: Promise<{ agencyId: string }>;
};

export default async function PostingRulesPage({ params }: Props) {
  const { agencyId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const hasPermission = await hasAgencyPermission(agencyId, 'fi.general_ledger.settings.view');
  if (!hasPermission) {
    notFound();
  }

  const canManage = await hasAgencyPermission(agencyId, 'fi.general_ledger.settings.manage');

  // Fetch data in parallel
  const [rulesResult, accountsResult] = await Promise.all([
    listPostingRules(),
    listChartOfAccounts(),
  ]);

  const rules = rulesResult.success ? rulesResult.data?.rules ?? [] : [];
  const accounts = accountsResult.success
    ? (accountsResult.data ?? []).map((a: any) => ({ id: a.id, code: a.code, name: a.name }))
    : [];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Zap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Posting Rules</h1>
          <p className="text-sm text-muted-foreground">
            Configure automated journal entry templates
          </p>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <PostingRulesTable
          rules={rules}
          accounts={accounts}
          agencyId={agencyId}
          canManage={canManage}
        />
      </Suspense>
    </div>
  );
}
