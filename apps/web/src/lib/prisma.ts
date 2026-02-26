/**
 * Prisma Client Singleton
 * Prevents creating multiple Prisma instances in development/serverless
 * Ensures connection pooling is efficient
 */

import { PrismaClient } from '@voidborne/database'

declare global {
  // eslint-disable-next-line no-var
  var cachedPrisma: PrismaClient | undefined
}

let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  // Production: Always create new instance
  prisma = new PrismaClient({
    log: ['error', 'warn'],
  })
} else {
  // Development: Reuse existing instance to prevent connection exhaustion
  if (!global.cachedPrisma) {
    global.cachedPrisma = new PrismaClient({
      log: ['error', 'warn', 'query'],
    })
  }
  prisma = global.cachedPrisma
}

export { prisma }

/**
 * Helper to ensure Prisma disconnects gracefully
 * Use in API routes that need explicit cleanup
 */
export async function disconnectPrisma() {
  if (process.env.NODE_ENV === 'production') {
    await prisma.$disconnect()
  }
  // In development, keep connection alive for reuse
}
