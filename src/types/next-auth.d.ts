import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'
import type { Role } from '@/generated/prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      emailVerified: Date | null
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    firstName?: string | null
    lastName?: string | null
    emailVerified?: Date | null
  }

  interface CurrentUser extends User {
    name?: string | null
    avatarUrl?: string | null
    planId?: string | null
    scope?: 'AGENCY' | 'SUBACCOUNT' | null
    scopeId?: string | null
    role?: Role | null
  }

  interface FullUser extends CurrentUser {
    agencies: Array<{
      id: string
      name: string
      planId: string | null
      role: Role & { permissions: ActionKey[] } | null
    }>
    subaccounts: Array<{
      id: string
      name: string
      agencyId: string
      role: Role & { permissions: ActionKey[] } | null
    }>
  }

}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    emailVerified: Date | null
  }
}
declare module 'next-auth/react' {
  interface ClientSafeProvider {
    id: string
    name: string
    type: string
    signinUrl: string
    callbackUrl: string
  }
}