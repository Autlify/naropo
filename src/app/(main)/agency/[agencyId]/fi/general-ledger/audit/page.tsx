import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { hasAgencyPermission } from '@/lib/features/iam/authz/permissions';
import { Skeleton } from '@/components/ui/skeleton';
import { AuditTrailViewer } from '@/components/fi/general-ledger/audit';
import {
  searchAuditTrail,
  getAuditEntityTypes,
} from '@/lib/features/fi/general-ledger/actions/audit';
import { History } from 'lucide-react';

type Props = {
  params: Promise<{ agencyId: string }>;
};

const AuditTrailPage = async ({ params }: Props) => {
  const { agencyId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const hasPermission = await hasAgencyPermission(agencyId, 'fi.general_ledger.settings.view');
  if (!hasPermission) {
    notFound();
  }

  // Fetch initial data
  const [auditResult, entityTypes] = await Promise.all([
    searchAuditTrail({ agencyId, page: 1, pageSize: 25 }),
    getAuditEntityTypes(agencyId),
  ]);

  const initialData = auditResult.success ? auditResult.data : undefined;

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <History className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Trail</h1>
          <p className="text-sm text-muted-foreground">
            Track all changes and actions in the General Ledger
          </p>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <AuditTrailViewer
          agencyId={agencyId}
          entityTypes={entityTypes}
          initialData={initialData}
        />
      </Suspense>
    </div>
  );
}

export default AuditTrailPage;