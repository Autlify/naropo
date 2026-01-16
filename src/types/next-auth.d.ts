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
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    emailVerified: Date | null
  }
}
