import { notFound } from 'next/navigation'
import DocsMarkdown from '@/components/site/docs/docs-markdown'
import { isLegalDocSlug, getLegalDoc, type LegalDocSlug } from '@/lib/core/legal/documents'
import { loadLegalMarkdown } from '@/lib/core/legal/load-legal-markdown'

export const runtime = 'nodejs'

type Props = {
  params: Promise<{ doc: string }>
}

export default async function LegalDocPage({ params }: Props) {
  const { doc } = await params
  if (!isLegalDocSlug(doc)) return notFound()

  const slug = doc as LegalDocSlug
  const meta = getLegalDoc(slug)
  const markdown = await loadLegalMarkdown(slug)

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">{meta.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This document is provided in-app for convenience.
        </p>
      </div>
      <DocsMarkdown markdown={markdown} />
    </div>
  )
}
