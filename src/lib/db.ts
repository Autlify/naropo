import { PrismaClient } from '@/generated/prisma/client' 
import { withOptimize } from "@prisma/extension-optimize";

declare global {
  var prisma: PrismaClient | undefined
}

// export const db = globalThis.prisma || new PrismaClient({
//   accelerateUrl: process.env.DATABASE_URL!,
// })
 
export const db = globalThis.prisma || new PrismaClient({
  accelerateUrl: process.env.DATABASE_URL!,
})

if (process.env.NODE_ENV !== 'production') globalThis.prisma = db