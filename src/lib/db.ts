import { PrismaClient } from '@/generated/prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

// During build, DATABASE_URL won't be set. Create a dummy client that errors on actual use.
function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL
  
  if (!dbUrl) {
    // Return a proxy during build that throws on any database access
    console.warn('[db] DATABASE_URL not set, returning proxy (build mode)')
    return new Proxy({} as PrismaClient, {
      get(target, prop) {
        if (prop === 'then' || prop === '$connect' || prop === '$disconnect') {
          return undefined
        }
        return () => {
          throw new Error('Database not available: DATABASE_URL is not configured')
        }
      }
    }) as PrismaClient
  }
  
  return new PrismaClient({
    accelerateUrl: dbUrl,
  })
}

export const db = globalThis.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = db