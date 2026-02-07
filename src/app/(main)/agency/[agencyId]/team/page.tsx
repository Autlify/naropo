import { db } from '@/lib/db'
import React from 'react'
import DataTable from './data-table'
import { Plus } from 'lucide-react'
import { auth } from '@/auth'
import { columns } from './columns'
import SendInvitation from '@/components/forms/send-invitation'

type Props = {
  params: Promise<{ agencyId: string }>
}

const TeamPage = async ({ params }: Props) => {
  const { agencyId } = await params
  const session = await auth()
  const teamMembers = await db.user.findMany({
    where: {
      AgencyMemberships: {
        some: {
          agencyId: agencyId,
          isActive: true,
        },
      },
    },
    include: {
      AgencyMemberships: {
        where: { agencyId: agencyId, isActive: true },
        include: {
          Agency: { include: { SubAccount: true } },
          Role: true,
        },
      },
      SubAccountMemberships: {
        where: { isActive: true },
        include: {
          SubAccount: true,
          Role: true,
        },
      },
    },
  })

  if (!session?.user) return null
  const agencyDetails = await db.agency.findUnique({
    where: {
      id: agencyId,
    },
    include: {
      SubAccount: true,
    },
  })

  if (!agencyDetails) return

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-bold">Team</h1>
        <p className="text-muted-foreground">Manage your agency team members and permissions</p>
      </div>
      
      <DataTable
        actionButtonText={
          <>
            <Plus size={15} />
            Add
          </>
        }
        modalChildren={<SendInvitation agencyId={agencyDetails.id} />}
        filterValue="name"
        columns={columns}
        data={teamMembers}
      ></DataTable>
    </div>
  )
}

export default TeamPage
