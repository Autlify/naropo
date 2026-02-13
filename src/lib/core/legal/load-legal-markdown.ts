import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getLegalDoc, type LegalDocSlug } from './documents'

const markdownCache = new Map<LegalDocSlug, string>()

export async function loadLegalMarkdown(slug: LegalDocSlug): Promise<string> {
  const cached = markdownCache.get(slug)
  if (cached) return cached

  const doc = getLegalDoc(slug)
  const file = join(process.cwd(), 'docs', 'legal', doc.file)
  const content = await readFile(file, 'utf-8')
  markdownCache.set(slug, content)
  return content
}
