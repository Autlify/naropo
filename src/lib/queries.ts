'use server'

import { auth } from '@/auth'
import { db } from './db'
import { sendInvitationEmail } from './email'
import { redirect } from 'next/navigation'
import {
  Agency,
  Lane,
  Plan,
  Prisma,
  SubAccount,
  Tag,
  Ticket,
  User,
} from '@/generated/prisma/client'
import { v4 } from 'uuid'
import {
  CreateFunnelFormSchema,
  CreateMediaType,
  UpsertFunnelPage,
} from './types'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto' 
import { CONTEXT_COOKIE, parseSavedContext } from  '@/lib/features/iam/authz/resolver'
import { hasAgencyPermission, hasSubAccountPermission } from '@/lib/features/iam/authz/permissions'
import { cookies } from 'next/headers'


/**
 * =============================================================================
 * RBAC & CONTEXT MANAGEMENT APPROACH
 * =============================================================================
 * 
 * ## Context Switching: Session-Based (Server-Side Truth)
 * 
 * - Session stores `activeAgencyId` and `activeSubAccountId`
 * - URL params (agencyId/subaccountId) are for routing only
 * - Session is the source of truth for permission checking
 * - Use `getCurrentContext()` to get active context from session
 * 
 * ## Why Session instead of URL params?
 * 
 * 1. **Security**: Permission checks use server-side session, not client-controlled URL
 * 2. **Consistency**: Same context across tabs/routes within agency/subaccount
 * 3. **Convenience**: Don't need to pass agencyId/subaccountId to every function
 * 4. **Multi-tenancy**: User can belong to multiple agencies/subaccounts
 * 
 * ## Helper Functions Pattern (Simplified & Reusable)
 * 
 * Following the `verificationToken` pattern for clean, simplified code:
 * 
 * - `getCurrentContext()` - Get activeAgencyId/activeSubAccountId from session
 * - `getRolesByScope(scope, systemOnly)` - Get AGENCY or SUBACCOUNT roles
 * - `getMemberships(scope, contextId)` - Get all memberships for agency/subaccount
 * - `getUserMemberships(userId)` - Get all memberships user has (both scopes)
 * - `upsertRole(scope, name, permissions)` - Create/update role with permissions
 * - `getRolePermissions(roleId, plan)` - Get permissions (TODO: filter by plan)
 * - `hasPermission(key)` - Check if user has permission in current context
 * 
 * ## Usage Examples
 * 
 * ```typescript
 * // Get current context
 * const context = await getCurrentContext()
 * // { userId, activeAgencyId, activeSubAccountId }
 * 
 * // Get all AGENCY roles (system only)
 * const agencyRoles = await getRolesByScope('AGENCY', true)
 * 
 * // Get all members of an agency
 * const members = await getMemberships('AGENCY', agencyId)
 * 
 * // Get all memberships for a user
 * const userMemberships = await getUserMemberships(userId)
 * // Returns: { AgencyMemberships[], SubAccountMemberships[] }
 * 
 * // Create a custom role
 * await upsertRole('AGENCY', 'SALES_MANAGER', [
 *   'contact.create', 'contact.read', 'pipeline.read'
 * ])
 * 
 * // Check permission in current context
 * const canEdit = await hasPermission('funnel.content.edit')
 * ```
 * 
 * =============================================================================
 */
 
export const getContextCookie = async () => {
  const cookieStore = await cookies()
  const contextCookie = cookieStore.get(CONTEXT_COOKIE)
  if (!contextCookie) return null
  return parseSavedContext(contextCookie.value)
}

export const getUsersWithAgencySubAccountPermissionsSidebarOptions = async (
  agencyId: string
) => {
  return await db.user.findFirst({
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
        where: { agencyId, isActive: true },
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
}

export const getAuthUserDetails = async () => {
  const session = await auth()
  if (!session?.user?.email) {
    return
  }

  const userData = await db.user.findUnique({
    where: {
      email: session.user.email,
    },
    include: {
      AgencyMemberships: {
        where: { isActive: true },
        include: {
          Agency: {
            include: {
              SidebarOption: true,
              SubAccount: {
                include: {
                  SidebarOption: true,
                },
              },
            },
          },
          Role: true,
        },
        orderBy: [{ isPrimary: 'desc' }, { joinedAt: 'asc' }],
      },
      SubAccountMemberships: {
        where: { isActive: true },
        include: {
          SubAccount: {
            include: {
              SidebarOption: true,
            },
          },
          Role: true,
        },
      },
    },
  })

  return userData
}

export const saveActivityLogsNotification = async ({
  agencyId,
  description,
  subaccountId,
}: {
  agencyId?: string
  description: string
  subaccountId?: string
}) => {
  const session = await auth()
  let userData
  if (!session?.user?.email) {
    const response = await db.user.findFirst({
      where: {
        AgencyMemberships: {
          some: {
            isActive: true,
            Agency: {
              SubAccount: {
                some: { id: subaccountId },
              },
            },
          },
        },
      },
    })
    if (response) {
      userData = response
    }
  } else {
    userData = await db.user.findUnique({
      where: { email: session.user.email },
    })
  }

  if (!userData) {
    console.log('Could not find a user')
    return
  }

  let foundAgencyId = agencyId
  if (!foundAgencyId) {
    if (!subaccountId) {
      throw new Error(
        'You need to provide atleast an agency Id or subaccount Id'
      )
    }
    const response = await db.subAccount.findUnique({
      where: { id: subaccountId },
    })
    if (response) foundAgencyId = response.agencyId
  }
  if (subaccountId) {
    await db.notification.create({
      data: {
        notification: `${userData.name} | ${description}`,
        User: {
          connect: {
            id: userData.id,
          },
        },
        Agency: {
          connect: {
            id: foundAgencyId,
          },
        },
        SubAccount: {
          connect: { id: subaccountId },
        },
      },
    })
  } else {
    await db.notification.create({
      data: {
        notification: `${userData.name} | ${description}`,
        User: {
          connect: {
            id: userData.id,
          },
        },
        Agency: {
          connect: {
            id: foundAgencyId,
          },
        },
      },
    })
  }
}

export const createTeamUser = async (agencyId: string, user: Partial<User>) => {
  const hasCreatePermission = await hasPermission('core.agency.users.create')
  if (!hasCreatePermission) return null

  // Create user without role/agencyId (those are in User model)
  const { id, email, name, avatarUrl, emailVerified, password, createdAt, updatedAt } = user
  const response = await db.user.create({
    data: {
      id: id!,
      email: email!,
      name: name!,
      avatarUrl,
      emailVerified,
      password,
      createdAt,
      updatedAt,
    },
  })
  return response
}

export const verifyAndAcceptInvitation = async () => {
  const session = await auth()
  if (!session?.user?.email) return redirect('/sign-in')

  const invitationExists = await db.invitation.findUnique({
    where: {
      email: session.user.email,
      status: 'PENDING',
    },
  })

  if (invitationExists) {
    const userDetails = await createTeamUser(invitationExists.agencyId, {
      email: invitationExists.email,
      avatarUrl: session.user.image ?? null,
      id: session.user.id,
      name: session.user.name || '',
      emailVerified: null,
      password: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    if (userDetails) {
      // Find the role by name from invitation
      const role = await db.role.findFirst({
        where: {
          name: invitationExists.role,
          scope: 'AGENCY',
        },
      })

      if (role) {
        // Create AgencyMembership for the invited user
        await db.agencyMembership.create({
          data: {
            userId: userDetails.id,
            agencyId: invitationExists.agencyId,
            roleId: role.id,
            isActive: true,
            isPrimary: false,
          },
        })

        // Update session context
        await db.session.updateMany({
          where: { userId: userDetails.id },
          data: { activeAgencyId: invitationExists.agencyId },
        })
      }

      await saveActivityLogsNotification({
        agencyId: invitationExists?.agencyId,
        description: `Joined`,
        subaccountId: undefined,
      })

      await db.invitation.delete({
        where: { email: userDetails.email },
      })

      return invitationExists.agencyId
    } else return null
  } else {
    // Check if user already has agency membership
    const existingMembership = await db.agencyMembership.findFirst({
      where: {
        User: { email: session.user.email },
      },
    })
    if (existingMembership) {
      return existingMembership.agencyId
    } else {
      return null
    }
  }
}

export const updateAgencyDetails = async (
  agencyId: string,
  agencyDetails: Partial<Agency>
) => {
  const response = await db.agency.update({
    where: { id: agencyId },
    data: { ...agencyDetails },
  })
  return response
}

export const deleteAgency = async (agencyId: string) => {
  const response = await db.agency.delete({ where: { id: agencyId } })
  return response
}

export const initUser = async (
  newUser: Partial<User>,
  agencyId?: string,
  roleName: string = 'AGENCY_OWNER'
) => {
  const session = await auth()
  if (!session?.user) return

  const userData = await db.user.upsert({
    where: {
      email: session.user.email!,
    },
    update: newUser,
    create: {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.name || '',
      avatarUrl: session.user.image,
    },
  })

  // If agencyId is provided, create AgencyMembership with specified role
  if (agencyId) {
    const existingMembership = await db.agencyMembership.findFirst({
      where: {
        userId: userData.id,
        agencyId: agencyId,
      },
    })

    if (!existingMembership) {
      // Find the role
      const role = await db.role.findFirst({
        where: {
          name: roleName,
          scope: 'AGENCY',
          isSystem: true,
        },
      })

      if (role) {
        // Check if this is the user's first agency (should be primary)
        const existingAgencies = await db.agencyMembership.count({
          where: {
            userId: userData.id,
            isActive: true,
          },
        })

        // Create the membership
        await db.agencyMembership.create({
          data: {
            userId: userData.id,
            agencyId: agencyId,
            roleId: role.id,
            isPrimary: existingAgencies === 0, // First agency is primary
            isActive: true,
          },
        })

        // Update session with this agency context
        await db.session.updateMany({
          where: { userId: userData.id },
          data: { activeAgencyId: agencyId },
        })
      }
    }
  }

  return userData
}

export const upsertAgency = async (agency: Agency, price?: Plan) => {
  if (!agency.companyEmail) return null
  try {
    const agencyDetails = await db.agency.upsert({
      where: {
        id: agency.id,
      },
      update: agency,
      create: {
        ...agency,
        SidebarOption: {
          create: [
            {
              name: 'Dashboard',
              icon: 'category',
              link: `/agency/${agency.id}`,
            },
            {
              name: 'Launchpad',
              icon: 'clipboardIcon',
              link: `/agency/${agency.id}/launchpad`,
            },
            {
              name: 'Billing',
              icon: 'payment',
              link: `/agency/${agency.id}/billing`,
            },
            {
              name: 'Settings',
              icon: 'settings',
              link: `/agency/${agency.id}/settings`,
            },
            {
              name: 'Sub Accounts',
              icon: 'person',
              link: `/agency/${agency.id}/all-subaccounts`,
            },
            {
              name: 'Team',
              icon: 'shield',
              link: `/agency/${agency.id}/team`,
            },
          ],
        },
      },
    })

    // Create AgencyMembership for the owner when creating new agency
    const existingMembership = await db.agencyMembership.findFirst({
      where: {
        agencyId: agencyDetails.id,
        User: { email: agency.companyEmail },
      },
    })

    if (!existingMembership) {
      // Get the user
      const user = await db.user.findUnique({
        where: { email: agency.companyEmail },
      })

      if (user) {
        // Get the AGENCY_OWNER role
        const ownerRole = await db.role.findFirst({
          where: {
            name: 'AGENCY_OWNER',
            scope: 'AGENCY',
            isSystem: true,
          },
        })

        if (ownerRole) {
          // Create the membership
          await db.agencyMembership.create({
            data: {
              userId: user.id,
              agencyId: agencyDetails.id,
              roleId: ownerRole.id,
              isPrimary: true,
              isActive: true,
            },
          })

          // Update session with this agency context
          await db.session.updateMany({
            where: { userId: user.id },
            data: {
              activeAgencyId: agencyDetails.id,
            },
          })
        }
      }
    }

    return agencyDetails
  } catch (error) {
    console.log(error)
  }
}

export const getAgencyDetails = async (agencyId: string) => {
  try {
    const agency = await db.agency.findUnique({
      where: { id: agencyId },
      include: { Subscription: true },
    })
    return agency
  } catch (error) {
    console.log(error)
  }
}

export const getNotificationAndUser = async (agencyId: string) => {
  try {
    const response = await db.notification.findMany({
      where: { agencyId },
      include: { User: true },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return response
  } catch (error) {
    console.log(error)
  }
}

export const upsertSubAccount = async (subAccount: SubAccount) => {
  if (!subAccount.companyEmail) return null

   const context = await getContextCookie()
  if (!context || context.kind !== 'agency') {
    console.log('🔴Error: No context found in cookies')
    return null
  }

  // Check permission for creating subaccount
  const hasCreatePermission = await hasAgencyPermission(context.agencyId, 'core.agency.subaccounts.create') // to-be-changed to use hasAgencyPermission
  if (!hasCreatePermission) {
    console.log('🔴Error: No permission to create subaccount')
    return null
  }

  // Get current user from session
  const session = await auth()
  if (!session?.user?.id) {
    console.log('🔴Error: No authenticated user')
    return null
  }

  const response = await db.subAccount.upsert({
    where: { id: subAccount.id },
    update: subAccount,
    create: {
      ...subAccount,
      Pipeline: {
        create: { name: 'Lead Cycle' },
      },
      SidebarOption: {
        create: [
          {
            name: 'Launchpad',
            icon: 'clipboardIcon',
            link: `/subaccount/${subAccount.id}/launchpad`,
          },
          {
            name: 'Settings',
            icon: 'settings',
            link: `/subaccount/${subAccount.id}/settings`,
          },
          {
            name: 'Funnels',
            icon: 'pipelines',
            link: `/subaccount/${subAccount.id}/funnels`,
          },
          {
            name: 'Media',
            icon: 'database',
            link: `/subaccount/${subAccount.id}/media`,
          },
          {
            name: 'Automations',
            icon: 'chip',
            link: `/subaccount/${subAccount.id}/automations`,
          },
          {
            name: 'Pipelines',
            icon: 'flag',
            link: `/subaccount/${subAccount.id}/pipelines`,
          },
          {
            name: 'Contacts',
            icon: 'person',
            link: `/subaccount/${subAccount.id}/contacts`,
          },
          {
            name: 'Dashboard',
            icon: 'category',
            link: `/subaccount/${subAccount.id}`,
          },
        ],
      },
    },
  })

  // Create SubAccountMembership for the creator
  const existingMembership = await db.subAccountMembership.findFirst({
    where: {
      subAccountId: response.id,
      userId: session.user.id,
    },
  })

  if (!existingMembership) {
    // Get SUBACCOUNT_ADMIN role
    const adminRole = await db.role.findFirst({
      where: {
        name: 'SUBACCOUNT_ADMIN',
        scope: 'SUBACCOUNT',
        isSystem: true,
      },
    })

    if (adminRole) {
      await db.subAccountMembership.create({
        data: {
          userId: session.user.id,
          subAccountId: response.id,
          roleId: adminRole.id,
          isActive: true,
        },
      })

      // Update session context to this subaccount
      await db.session.updateMany({
        where: { userId: session.user.id },
        data: {
          activeSubAccountId: response.id,
          activeAgencyId: subAccount.agencyId,
        },
      })
    }
  }

  return response
}

export const updateUser = async (user: Partial<User>) => {
  const response = await db.user.update({
    where: { email: user.email },
    data: { ...user },
  })

  return response
}

export const changeUserPermissions = async (
  userId: string,
  roleId: string,
  type: 'agency' | 'subaccount',
  agencyId?: string,
  subAccountId?: string
) => {
  try {
    if (type === 'agency' && agencyId) {
      // Update or create agency membership with new role
      const membership = await db.agencyMembership.findFirst({
        where: {
          userId,
          agencyId,
        },
      })

      if (membership) {
        // Update existing membership
        const response = await db.agencyMembership.update({
          where: { id: membership.id },
          data: { roleId, isActive: true },
        })
        return response
      } else {
        // Create new membership
        const response = await db.agencyMembership.create({
          data: {
            userId,
            agencyId,
            roleId,
            isActive: true,
            isPrimary: false,
          },
        })
        return response
      }
    } else if (type === 'subaccount' && subAccountId) {
      // Update or create subaccount membership with new role
      const membership = await db.subAccountMembership.findFirst({
        where: {
          userId,
          subAccountId,
        },
      })

      if (membership) {
        // Update existing membership
        const response = await db.subAccountMembership.update({
          where: { id: membership.id },
          data: { roleId, isActive: true },
        })
        return response
      } else {
        // Create new membership
        const response = await db.subAccountMembership.create({
          data: {
            userId,
            subAccountId,
            roleId,
            isActive: true,
          },
        })
        return response
      }
    }

    throw new Error('Invalid type or missing agencyId/subAccountId')
  } catch (error) {
    console.log('🔴Could not change user permissions', error)
  }
}

export const getSubaccountDetails = async (subaccountId: string) => {
  const response = await db.subAccount.findUnique({
    where: {
      id: subaccountId,
    },
  })
  return response
}

export const deleteSubAccount = async (subaccountId: string) => {
  const response = await db.subAccount.delete({
    where: {
      id: subaccountId,
    },
  })
  return response
}

export const deleteUser = async (userId: string) => {
  const deletedUser = await db.user.delete({ where: { id: userId } })
  return deletedUser
}

export const getUser = async (id: string) => {
  const user = await db.user.findUnique({
    where: {
      id,
    },
  })

  return user
}

export const sendInvitation = async (
  roleName: string,
  email: string,
  agencyId: string
) => {
  const response = await db.invitation.create({
    data: { email, agencyId, role: roleName },
  })

  try {
    await sendInvitationEmail({ email, role: roleName, invitationId: response.id })
  } catch (error) {
    console.error('Failed to send invitation email:', error)
    // Don't fail the invitation creation if email fails
  }

  return response
}

export const getMedia = async (subaccountId: string) => {
  const mediafiles = await db.subAccount.findUnique({
    where: {
      id: subaccountId,
    },
    include: { Media: true },
  })
  return mediafiles
}

export const createMedia = async (
  subaccountId: string,
  mediaFile: CreateMediaType
) => {
  const response = await db.media.create({
    data: {
      link: mediaFile.link,
      name: mediaFile.name,
      subAccountId: subaccountId,
    },
  })

  return response
}

export const deleteMedia = async (mediaId: string) => {
  const response = await db.media.delete({
    where: {
      id: mediaId,
    },
  })
  return response
}

export const getPipelineDetails = async (pipelineId: string) => {
  const response = await db.pipeline.findUnique({
    where: {
      id: pipelineId,
    },
  })
  return response
}

export const getLanesWithTicketAndTags = async (pipelineId: string) => {
  const response = await db.lane.findMany({
    where: {
      pipelineId,
    },
    orderBy: { order: 'asc' },
    include: {
      Tickets: {
        orderBy: {
          order: 'asc',
        },
        include: {
          Tags: true,
          Assigned: true,
          Customer: true,
        },
      },
    },
  })
  return response
}

export const upsertFunnel = async (
  subaccountId: string,
  funnel: z.infer<typeof CreateFunnelFormSchema> & { liveProducts: string },
  funnelId: string
) => {
  const response = await db.funnel.upsert({
    where: { id: funnelId },
    update: funnel,
    create: {
      ...funnel,
      id: funnelId || v4(),
      subAccountId: subaccountId,
    },
  })

  return response
}

export const upsertPipeline = async (
  pipeline: Prisma.PipelineUncheckedCreateWithoutLaneInput
) => {
  const response = await db.pipeline.upsert({
    where: { id: pipeline.id || v4() },
    update: pipeline,
    create: pipeline,
  })

  return response
}

export const deletePipeline = async (pipelineId: string) => {
  const response = await db.pipeline.delete({
    where: { id: pipelineId },
  })
  return response
}

export const updateLanesOrder = async (lanes: Lane[]) => {
  try {
    const updateTrans = lanes.map((lane) =>
      db.lane.update({
        where: {
          id: lane.id,
        },
        data: {
          order: lane.order,
        },
      })
    )

    await db.$transaction(updateTrans)
    console.log('🟢 Done reordered 🟢')
  } catch (error) {
    console.log(error, 'ERROR UPDATE LANES ORDER')
  }
}

export const updateTicketsOrder = async (tickets: Ticket[]) => {
  try {
    const updateTrans = tickets.map((ticket) =>
      db.ticket.update({
        where: {
          id: ticket.id,
        },
        data: {
          order: ticket.order,
          laneId: ticket.laneId,
        },
      })
    )

    await db.$transaction(updateTrans)
    console.log('🟢 Done reordered 🟢')
  } catch (error) {
    console.log(error, '🔴 ERROR UPDATE TICKET ORDER')
  }
}

export const upsertLane = async (lane: Prisma.LaneUncheckedCreateInput) => {
  let order: number

  if (!lane.order) {
    const lanes = await db.lane.findMany({
      where: {
        pipelineId: lane.pipelineId,
      },
    })

    order = lanes.length
  } else {
    order = lane.order
  }

  const response = await db.lane.upsert({
    where: { id: lane.id || v4() },
    update: lane,
    create: { ...lane, order },
  })

  return response
}

export const deleteLane = async (laneId: string) => {
  const resposne = await db.lane.delete({ where: { id: laneId } })
  return resposne
}

export const getTicketsWithTags = async (pipelineId: string) => {
  const response = await db.ticket.findMany({
    where: {
      Lane: {
        pipelineId,
      },
    },
    include: { Tags: true, Assigned: true, Customer: true },
  })
  return response
}

export const _getTicketsWithAllRelations = async (laneId: string) => {
  const response = await db.ticket.findMany({
    where: { laneId: laneId },
    include: {
      Assigned: true,
      Customer: true,
      Lane: true,
      Tags: true,
    },
  })
  return response
}

export const getSubAccountTeamMembers = async (subaccountId: string) => {
  const subaccountUsersWithAccess = await db.user.findMany({
    where: {
      SubAccountMemberships: {
        some: {
          subAccountId: subaccountId,
          isActive: true,
          Role: {
            NOT: {
              name: 'SUBACCOUNT_GUEST',
            },
          },
        },
      },
    },
    include: {
      SubAccountMemberships: {
        where: {
          subAccountId: subaccountId,
          isActive: true,
        },
        include: {
          Role: true,
        },
      },
    },
  })
  return subaccountUsersWithAccess
}

export const searchContacts = async (searchTerms: string) => {
  const response = await db.contact.findMany({
    where: {
      name: {
        contains: searchTerms,
      },
    },
  })
  return response
}

export const upsertTicket = async (
  ticket: Prisma.TicketUncheckedCreateInput,
  tags: Tag[]
) => {
  let order: number
  if (!ticket.order) {
    const tickets = await db.ticket.findMany({
      where: { laneId: ticket.laneId },
    })
    order = tickets.length
  } else {
    order = ticket.order
  }

  const response = await db.ticket.upsert({
    where: {
      id: ticket.id || v4(),
    },
    update: { ...ticket, Tags: { set: tags } },
    create: { ...ticket, Tags: { connect: tags }, order },
    include: {
      Assigned: true,
      Customer: true,
      Tags: true,
      Lane: true,
    },
  })

  return response
}

export const deleteTicket = async (ticketId: string) => {
  const response = await db.ticket.delete({
    where: {
      id: ticketId,
    },
  })

  return response
}

export const upsertTag = async (
  subaccountId: string,
  tag: Prisma.TagUncheckedCreateInput
) => {
  const response = await db.tag.upsert({
    where: { id: tag.id || v4(), subAccountId: subaccountId },
    update: tag,
    create: { ...tag, subAccountId: subaccountId },
  })

  return response
}

export const getTagsForSubaccount = async (subaccountId: string) => {
  const response = await db.subAccount.findUnique({
    where: { id: subaccountId },
    select: { Tags: true },
  })
  return response
}

export const deleteTag = async (tagId: string) => {
  const response = await db.tag.delete({ where: { id: tagId } })
  return response
}

export const upsertContact = async (
  contact: Prisma.ContactUncheckedCreateInput
) => {
  const response = await db.contact.upsert({
    where: { id: contact.id || v4() },
    update: contact,
    create: contact,
  })
  return response
}

export const getFunnels = async (subacountId: string) => {
  const funnels = await db.funnel.findMany({
    where: { subAccountId: subacountId },
    include: { FunnelPages: true },
  })

  return funnels
}

export const getFunnel = async (funnelId: string) => {
  const funnel = await db.funnel.findUnique({
    where: { id: funnelId },
    include: {
      FunnelPages: {
        orderBy: {
          order: 'asc',
        },
      },
    },
  })

  return funnel
}

export const updateFunnelProducts = async (
  products: string,
  funnelId: string
) => {
  const data = await db.funnel.update({
    where: { id: funnelId },
    data: { liveProducts: products },
  })
  return data
}

export const upsertFunnelPage = async (
  subaccountId: string,
  funnelPage: UpsertFunnelPage,
  funnelId: string
) => {
  if (!subaccountId || !funnelId) return
  const response = await db.funnelPage.upsert({
    where: { id: funnelPage.id || '' },
    update: { ...funnelPage },
    create: {
      ...funnelPage,
      content: funnelPage.content
        ? funnelPage.content
        : JSON.stringify([
          {
            content: [],
            id: '__body',
            name: 'Body',
            styles: { backgroundColor: 'white' },
            type: '__body',
          },
        ]),
      funnelId,
    },
  })

  revalidatePath(`/subaccount/${subaccountId}/funnels/${funnelId}`, 'page')
  return response
}

export const deleteFunnelePage = async (funnelPageId: string) => {
  const response = await db.funnelPage.delete({ where: { id: funnelPageId } })

  return response
}

export const getFunnelPageDetails = async (funnelPageId: string) => {
  const response = await db.funnelPage.findUnique({
    where: {
      id: funnelPageId,
    },
  })

  return response
}

export const getDomainContent = async (subDomainName: string) => {
  const response = await db.funnel.findUnique({
    where: {
      subDomainName,
    },
    include: { FunnelPages: true },
  })
  return response
}

export const getPipelines = async (subaccountId: string) => {
  const response = await db.pipeline.findMany({
    where: { subAccountId: subaccountId },
    include: {
      Lane: {
        include: { Tickets: true },
      },
    },
  })
  return response
}

export const createVerificationToken = async (
  email: string,
  scope: 'verify' | 'authN' | 'passkey' | 'email' | 'webauthN' | 'pwd-reset',
  milliseconds: number
) => {
  // Normalize friendly scope aliases to persisted identifiers
  const normalizedScope = scope === 'email' ? 'verify' : scope === 'webauthN' ? 'passkey' : scope
  const identifier = `${normalizedScope}:${email}`
  const existingToken = await db.verificationToken.findFirst({
    where: {
      identifier
    },
    orderBy: {
      expires: 'desc',
    },
  })

  if (existingToken) {
    await deleteVerificationToken(existingToken.token)
  }

  const response = await db.verificationToken.create({
    data: {
      identifier,
      token: randomBytes(32).toString('hex'),
      expires: new Date(Date.now() + milliseconds),
    }
  })
  return response
}

export const deleteVerificationToken = async (token: string) => {
  await db.verificationToken.deleteMany({
    where: { token },
  })
}

export const validateVerificationToken = async (token: string) => {
  const verificationToken = await db.verificationToken.findUnique({
    where: { token },
  })

  if (!verificationToken) {
    return { success: false, error: 'invalid-token', message: 'Invalid token' }
  }

  // Check if token is expired
  if (verificationToken.expires < new Date()) {
    // Delete expired token
    await deleteVerificationToken(verificationToken.token)
    return { success: false, error: 'expired-token', message: 'Token has expired' }
  }

  const [scope, email] = verificationToken.identifier.split(':')

  if (scope === 'verify') {
    // Update user email verification (role will be set when they create an agency)
    const user = await updateUser({
      email,
      emailVerified: new Date()
    })

    // Delete used verification token
    await deleteVerificationToken(token)

    // Create one-time authentication token for auto-login (5 minutes expiry)
    const autoLoginToken = await createVerificationToken(email, 'authN', 5 * 60 * 1000)

    return {
      success: true,
      url: `/agency/verify?verified=true&email=${encodeURIComponent(email)}&token=${autoLoginToken.token}`,
      scope,
      email,
      user
    }

  } else if (scope === 'authN') {
    // For authentication tokens, return email for auto-login
    // Token will be deleted by auth.ts after successful login
    return { success: true, email, scope }
  } else if (scope === 'passkey') {
    // Passkey flows validate scope only; specific WebAuthn verification happens in passkey endpoints
    // Do not delete token here; passkey endpoints will delete upon successful verification
    return { success: true, email, scope }
  } else if (scope === 'pwd-reset') {
    // Password reset - validate and delete token, caller handles password update
    await deleteVerificationToken(token)
    return { success: true, email, scope }
  }

  return { success: false, error: 'unknown-scope', message: 'Unknown token scope' }

}

export const getAuthenticator = async (credentialID: string) => {
  const response = await db.authenticator.findUnique({
    where: { credentialID },
  })
  return response
}

export const createAuthenticator = async (authenticator: string) => {
  const response = await db.authenticator.create({
    data: { ...JSON.parse(authenticator) },
  })
  return response
}

export const deleteAuthenticator = async (credentialID: string) => {
  const response = await db.authenticator.delete({
    where: { credentialID },
  })
  return response
}

export const updateAuthenticatorCounter = async (
  credentialID: string,
  counter: number
) => {
  const response = await db.authenticator.update({
    where: { credentialID },
    data: { counter },
  })
  return response
}




// =============================================================================
// HELPER FUNCTIONS - RBAC & Context Management
// =============================================================================

/**
 * Get current user context from session (activeAgencyId, activeSubAccountId)
 */
export const getCurrentContext = async () => {
  const session = await auth()
  if (!session?.user?.id) return null

  // Get active context from session (server-side truth)
  const currentSession = await db.session.findFirst({
    where: { userId: session.user.id },
    orderBy: { lastActiveAt: 'desc' },
    select: {
      userId: true,
      activeAgencyId: true,
      activeSubAccountId: true,
    },
  })

  return currentSession
}

/**
 * Get roles filtered by scope (AGENCY or SUBACCOUNT)
 * Optionally filter by system roles only
 */
export const getRolesByScope = async (
  scope: 'AGENCY' | 'SUBACCOUNT',
  contextId?: string,
  systemOnly: boolean = false
) => {
  const where: any = {
    scope,
  }

  if (systemOnly) {
    where.isSystem = true
  } else if (contextId) {
    // Include system roles + context-specific roles
    where.OR = [
      { isSystem: true },
      scope === 'AGENCY' ? { agencyId: contextId } : { subAccountId: contextId }
    ]
  } else {
    where.isSystem = true // Default to system only if no context
  }

  return await db.role.findMany({
    where,
    include: {
      Permissions: {
        where: { granted: true },
        include: {
          Permission: true,
        },
      },
    },
    orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
  })
}

/**
 * Get memberships for a specific agency or subaccount
 */
export const getMemberships = async (
  scope: 'AGENCY' | 'SUBACCOUNT',
  contextId: string
) => {
  if (scope === 'AGENCY') {
    return await db.agencyMembership.findMany({
      where: {
        agencyId: contextId,
        isActive: true,
      },
      include: {
        User: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
        Role: {
          include: {
            Permissions: {
              include: {
                Permission: true,
              },
            },
          },
        },
      },
      orderBy: [{ isPrimary: 'desc' }, { joinedAt: 'asc' }],
    })
  } else {
    return await db.subAccountMembership.findMany({
      where: {
        subAccountId: contextId,
        isActive: true,
      },
      include: {
        User: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
        Role: {
          include: {
            Permissions: {
              include: {
                Permission: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    })
  }
}

/**
 * Get all memberships for a user (both agency and subaccount)
 */
export const getUserMemberships = async (userId: string) => {
  return await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      AgencyMemberships: {
        where: { isActive: true },
        include: {
          Agency: {
            select: {
              id: true,
              name: true,
              agencyLogo: true,
            },
          },
          Role: {
            include: {
              Permissions: {
                include: {
                  Permission: true,
                },
              },
            },
          },
        },
        orderBy: [{ isPrimary: 'desc' }, { joinedAt: 'asc' }],
      },
      SubAccountMemberships: {
        where: { isActive: true },
        include: {
          SubAccount: {
            select: {
              id: true,
              name: true,
              subAccountLogo: true,
              agencyId: true,
            },
          },
          Role: {
            include: {
              Permissions: {
                include: {
                  Permission: true,
                },
              },
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
      },
    },
  })
}

/**
 * Create or update a role with permissions
 */
export const upsertRole = async (
  scope: 'AGENCY' | 'SUBACCOUNT',
  roleName: string,
  permissionKeys: string[],
  isSystem: boolean = false,
  agencyId?: string,
  subAccountId?: string
) => {
  // Get permissions by keys
  const permissions = await db.permission.findMany({
    where: {
      key: { in: permissionKeys },
    },
  })

  // Find existing role
  const existingRole = await db.role.findFirst({
    where: {
      name: roleName,
      scope,
      agencyId: agencyId || null,
      subAccountId: subAccountId || null,
    },
  })

  let role
  if (existingRole) {
    // Update existing role
    role = await db.role.update({
      where: { id: existingRole.id },
      data: { isSystem },
    })
  } else {
    // Create new role
    role = await db.role.create({
      data: {
        name: roleName,
        scope,
        isSystem,
        agencyId: agencyId || null,
        subAccountId: subAccountId || null,
      },
    })
  }

  // Delete existing role permissions
  await db.rolePermission.deleteMany({
    where: { roleId: role.id },
  })

  // Create new role permissions
  await db.rolePermission.createMany({
    data: permissions.map((permission) => ({
      roleId: role.id,
      permissionId: permission.id,
    })),
  })

  return role
}

/**
 * Get permissions for a role filtered by plan/entitlement
 * TODO: Implement plan-based filtering when subscription logic is ready
 */
export const getRolePermissions = async (
  roleId: string,
  plan?: string
) => {
  const rolePermissions = await db.rolePermission.findMany({
    where: { roleId },
    include: {
      Permission: true,
    },
  })

  // TODO: Filter permissions based on plan entitlements
  // For now, return all permissions
  return rolePermissions.map((rp) => rp.Permission)
}

/**
 * Check if user has permission in current context
 * Uses params/searchParams instead of session for context (URL is source of truth)
 */
export const hasPermission = async (permissionKey: string) => {
  const session = await auth()
  if (!session?.user?.id) return false

  // Get current context from session
  const context = await getCurrentContext()
  if (!context) return false

  const userId = session.user.id
  const { activeAgencyId, activeSubAccountId } = context

  // If in subaccount context, check subaccount memberships first
  if (activeSubAccountId) {
    const subaccountMembership = await db.subAccountMembership.findFirst({
      where: {
        userId,
        subAccountId: activeSubAccountId,
        isActive: true,
      },
      include: {
        Role: {
          include: {
            Permissions: {
              where: {
                Permission: {
                  key: permissionKey,
                },
              },
              include: {
                Permission: true,
              },
            },
          },
        },
      },
    })

    if (subaccountMembership && subaccountMembership.Role.Permissions.length > 0) {
      return true
    }
  }

  // Fall back to agency-level permissions
  if (activeAgencyId) {
    const agencyMembership = await db.agencyMembership.findFirst({
      where: {
        userId,
        agencyId: activeAgencyId,
        isActive: true,
      },
      include: {
        Role: {
          include: {
            Permissions: {
              where: {
                Permission: {
                  key: permissionKey,
                },
              },
              include: {
                Permission: true,
              },
            },
          },
        },
      },
    })

    if (agencyMembership && agencyMembership.Role.Permissions.length) {
      return true
    }
  }

  return false
}

export const getUserPermissionsList = async (userId: string) => {
  const permissionsSet = new Set<string>()

  // Get all active agency memberships
  const agencyMemberships = await db.agencyMembership.findMany({
    where: {
      userId,
      isActive: true,
    },
    include: {
      Role: {
        include: {
          Permissions: {
            include: {
              Permission: true,
            },
          },
        },
      },
    },
  })

  // Aggregate permissions from agency roles
  for (const membership of agencyMemberships) {
    for (const rolePermission of membership.Role.Permissions) {
      permissionsSet.add(rolePermission.Permission.key)
    }
  }

  // Get all active subaccount memberships
  const subAccountMemberships = await db.subAccountMembership.findMany({
    where: {
      userId,
      isActive: true,
    },
    include: {
      Role: {
        include: {
          Permissions: {
            include: {
              Permission: true,
            },
          },
        },
      },
    },
  })

  // Aggregate permissions from subaccount roles
  for (const membership of subAccountMemberships) {
    for (const rolePermission of membership.Role.Permissions) {
      permissionsSet.add(rolePermission.Permission.key)
    }
  }

  return Array.from(permissionsSet)
}

/**
 * Update agency member role
 */
export const updateAgencyMemberRole = async (
  userId: string,
  agencyId: string,
  roleId: string
) => {
  // Import permission check
  const { hasAgencyPermission } = await import('@/lib/features/iam/authz/permissions')

  // Check permission
  const hasPermission = await hasAgencyPermission(agencyId, 'core.agency.team_member.manage')
  if (!hasPermission) {
    throw new Error('Permission denied: Cannot assign roles')
  }

  const membership = await db.agencyMembership.findFirst({
    where: {
      userId,
      agencyId,
      isActive: true,
    },
  })

  if (!membership) {
    throw new Error('Agency membership not found')
  }

  // Validate role exists and is appropriate for agency scope
  const role = await db.role.findFirst({
    where: {
      id: roleId,
      scope: 'AGENCY',
      OR: [
        { isSystem: true },
        { agencyId: agencyId }
      ]
    },
  })

  if (!role) {
    throw new Error('Invalid role for this agency')
  }

  return await db.agencyMembership.update({
    where: { id: membership.id },
    data: { roleId },
  })
}

/**
 * Update subaccount member role
 */
export const updateSubAccountMemberRole = async (
  userId: string,
  subAccountId: string,
  roleId: string
) => {
  const membership = await db.subAccountMembership.findFirst({
    where: {
      userId,
      subAccountId,
      isActive: true,
    },
  })

  if (!membership) {
    throw new Error('SubAccount membership not found')
  }

  return await db.subAccountMembership.update({
    where: { id: membership.id },
    data: { roleId },
  })
}

