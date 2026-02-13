import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { LegalAcceptForm } from '@/components/legal/legal-accept-form'
import type { LegalScope } from '@/lib/core/legal/documents'

type Props = {
  searchParams: Promise<{ scope?: string; next?: string }>
}

export default async function LegalAcceptPage({ searchParams }: Props) {
  const sp = await searchParams
  const scope = (sp.scope === 'billing' ? 'billing' : 'baseline') as LegalScope

  const session = await auth()
  if (!session?.user?.id) {
    // Legal acceptance is recorded against the authenticated user.
    return redirect(`/agency/sign-in?next=${encodeURIComponent(`/legal/accept?scope=${scope}`)}`)
  }

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-12">
      <div className="mb-8 space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Legal acceptance</h1>
        <p className="text-sm text-muted-foreground">
          {scope === 'billing'
            ? 'Before using billing features, please accept the billing policies.'
            : 'Before using the app, please accept the baseline terms.'}
        </p>
      </div>

      <LegalAcceptForm scope={scope} />
    </div>
  )
}
