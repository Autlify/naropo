'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { v4 as uuid, v4 } from 'uuid'
import { z } from 'zod'
import { auth } from '@/auth'
import { hasSubAccountPermission } from '@/lib/features/iam/authz/permissions'

const subdomainLabelRegex = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

function normalizeSubdomain(input: string | null | undefined): string | null {
  const v = (input ?? '').trim().toLowerCase()
  if (!v) return null
  return v
}

async function requireSubPerm(subAccountId: string, key: Parameters<typeof hasSubAccountPermission>[1]) {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthenticated')
  const ok = await hasSubAccountPermission(subAccountId, key)
  if (!ok) throw new Error('Forbidden')
}

export const setFunnelPublished = async (input: {
  subAccountId: string
  funnelId: string
  published: boolean
}) => {
  const schema = z.object({
    subAccountId: z.string().min(1),
    funnelId: z.string().min(1),
    published: z.boolean(),
  })
  const { subAccountId, funnelId, published } = schema.parse(input)
  await requireSubPerm(subAccountId, 'crm.funnels.content.publish')

  const funnel = await db.funnel.findFirst({
    where: { id: funnelId, subAccountId },
    include: { FunnelPages: { select: { id: true } } },
  })
  if (!funnel) throw new Error('Funnel not found')

  if (published) {
    const sub = normalizeSubdomain(funnel.subDomainName)
    if (!sub) throw new Error('Subdomain is required to publish')
    if (!subdomainLabelRegex.test(sub)) {
      throw new Error('Subdomain must be a valid DNS label (a-z, 0-9, hyphen)')
    }
    if (!funnel.FunnelPages?.length) throw new Error('Add at least 1 page before publishing')

    const conflict = await db.funnel.findFirst({
      where: { subDomainName: sub, id: { not: funnelId } },
      select: { id: true },
    })
    if (conflict) throw new Error('Subdomain is already taken')
  }

  const updated = await db.funnel.update({
    where: { id: funnelId },
    data: { published },
  })

  revalidatePath(`/subaccount/${subAccountId}/funnels`, 'page')
  revalidatePath(`/subaccount/${subAccountId}/funnels/${funnelId}`, 'page')
  return updated
}

export const deactivateFunnel = async (input: { subAccountId: string; funnelId: string }) => {
  const schema = z.object({ subAccountId: z.string().min(1), funnelId: z.string().min(1) })
  const { subAccountId, funnelId } = schema.parse(input)
  await requireSubPerm(subAccountId, 'crm.funnels.content.update')

  const funnel = await db.funnel.findFirst({ where: { id: funnelId, subAccountId } })
  if (!funnel) throw new Error('Funnel not found')

  const updated = await db.funnel.update({
    where: { id: funnelId },
    // “Deactivate” = unpublish + clear subdomain to prevent public access.
    data: { published: false, subDomainName: null },
  })

  revalidatePath(`/subaccount/${subAccountId}/funnels`, 'page')
  revalidatePath(`/subaccount/${subAccountId}/funnels/${funnelId}`, 'page')
  return updated
}

export const duplicateFunnel = async (input: { subAccountId: string; funnelId: string }) => {
  const schema = z.object({ subAccountId: z.string().min(1), funnelId: z.string().min(1) })
  const { subAccountId, funnelId } = schema.parse(input)
  await requireSubPerm(subAccountId, 'crm.funnels.content.create')

  const source = await db.funnel.findFirst({
    where: { id: funnelId, subAccountId },
    include: { FunnelPages: { orderBy: { order: 'asc' } }, ClassName: true },
  })
  if (!source) throw new Error('Funnel not found')

  const newFunnelId = uuid()
  const newName = source.name.length > 80 ? source.name.slice(0, 77) + '…' : source.name

  const created = await db.funnel.create({
    data: {
      id: newFunnelId,
      subAccountId,
      name: `Copy of ${newName}`,
      description: source.description,
      favicon: source.favicon,
      published: false,
      subDomainName: null,
      liveProducts: source.liveProducts,
      ClassName:
        source.ClassName && source.ClassName.length
          ? {
              connectOrCreate: source.ClassName.map((c) => ({
                where: { id: c.id },
                create: {
                  // Don’t pass relational/readonly fields (funnelId/createdAt/updatedAt)
                  // Nested create will automatically link to the new funnel.
                  id: c.id,
                  name: c.name,
                  color: c.color,
                  customData: c.customData,
                },
              })),
            }
          : undefined,
    },
  })

  if (source.FunnelPages?.length) {
    await db.funnelPage.createMany({
      data: source.FunnelPages.map((p) => ({
        id: uuid(),
        funnelId: newFunnelId,
        name: p.name,
        pathName: p.pathName,
        visits: 0,
        content: p.content,
        order: p.order,
        previewImage: p.previewImage 
      })),
    })
  }

  revalidatePath(`/subaccount/${subAccountId}/funnels`, 'page')
  return created
}
