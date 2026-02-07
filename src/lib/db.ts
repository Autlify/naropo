import { PrismaClient } from '@/generated/prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

// Lazy initialization to prevent build-time errors when DATABASE_URL is not available
function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set')
  }
  return new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL,
  })
}

// Use proxy to defer PrismaClient creation until first use (runtime only)
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!globalThis.prisma) {
      globalThis.prisma = createPrismaClient()
    }
    return Reflect.get(globalThis.prisma, prop)
  },
})