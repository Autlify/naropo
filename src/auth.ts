import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { db } from '@/lib/db'
import authConfig from '@/auth.config'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import type { Adapter } from 'next-auth/adapters'
import type { Role } from '@/generated/prisma/client'

// Custom adapter to map 'image' to 'avatarUrl'
const customAdapter: Adapter = {
  ...PrismaAdapter(db),
  createUser: async (data) => {
    const { image, ...rest } = data as any
    return db.user.create({
      data: {
        ...rest,
        avatarUrl: image,
        // OAuth users are automatically verified
        emailVerified: new Date(),
      },
    })
  },
  updateUser: async ({ id, image, ...data }: any) => {
    return db.user.update({
      where: { id },
      data: {
        ...data,
        ...(image !== undefined && { avatarUrl: image }),
      },
    })
  },
  getUser: async (id) => {
    const user = await db.user.findUnique({ where: { id } })
    if (!user) return null
    return {
      ...user,
      image: user.avatarUrl,
    } as any
  },
  getUserByEmail: async (email) => {
    const user = await db.user.findUnique({ where: { email } })
    if (!user) return null
    return {
      ...user,
      image: user.avatarUrl,
    } as any
  },
  getUserByAccount: async (provider_providerAccountId) => {
    const account = await db.account.findUnique({
      where: { provider_providerAccountId },
      include: { user: true },
    })
    if (!account) return null
    return {
      ...account.user,
      image: account.user.avatarUrl,
    } as any
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: customAdapter,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/agency/sign-in',
    error: '/agency/sign-in',
  },
  providers: [
    ...authConfig.providers,
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        })

        if (!user) {
          throw new Error('Invalid credentials')
        }

        // Check if this is an auto-login attempt (password is a hex token from authN scope)
        const isAutoLogin = /^[a-f0-9]{64}$/i.test(credentials.password as string)

        if (isAutoLogin) {
          // Validate authN token
          const { validateVerificationToken, deleteVerificationToken } = await import('@/lib/queries')
          const result = await validateVerificationToken(credentials.password as string)

          if (!result.success || !result.email) {
            throw new Error('Invalid auto-login token')
          }

          // Verify the token belongs to this user
          if (result.email !== user.email) {
            throw new Error('Invalid auto-login token')
          }

          // Delete the token after successful validation (one-time use)
          await deleteVerificationToken(credentials.password as string)

          // Auto-login is only created after email verification, so we can trust it
          // No need to check emailVerified here - it was already verified in /api/auth/register/confirm
        } else {
          // Regular login flow - user must have password
          if (!user.password) {
            throw new Error('Invalid credentials')
          }

          // Check if email is verified (only for credential users)
          if (!user.emailVerified) {
            throw new Error('Please verify your email address before signing in')
          }

          const isCorrectPassword = await bcrypt.compare(
            credentials.password as string,
            user.password
          )

          if (!isCorrectPassword) {
            throw new Error('Invalid credentials')
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          image: user.avatarUrl,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      // Always fetch fresh user data from database
      const userId = user?.id || token.id

      if (userId) {
        const dbUser = await db.user.findUnique({
          where: { id: userId as string },
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            emailVerified: true,
          },
        })

        if (dbUser) {
          token.id = dbUser.id
          token.email = dbUser.email
          token.name = dbUser.name
          token.firstName = dbUser.firstName
          token.lastName = dbUser.lastName
          token.picture = dbUser.avatarUrl
          token.emailVerified = dbUser.emailVerified

          // Update avatarUrl from OAuth provider if available
          if (user?.image && !dbUser.avatarUrl) {
            await db.user.update({
              where: { id: dbUser.id },
              data: { avatarUrl: user.image },
            })
            token.picture = user.image
          }
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token && token.id) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        session.user.image = token.picture as string
        session.user.emailVerified = token.emailVerified as Date | null
      }
      return session
    },
  },
})
