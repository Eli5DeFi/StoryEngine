/**
 * Prisma Client Singleton with Connection Pooling
 * 
 * Prevents "too many connections" errors by reusing a single
 * PrismaClient instance across all API routes.
 * 
 * Connection pooling is configured in DATABASE_URL:
 * postgresql://user:pass@host/db?connection_limit=20&pool_timeout=20
 */

import { PrismaClient } from '@voidborne/database'

declare global {
  var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
    
    // Connection pooling settings
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

// Reuse client in development (hot reload safe)
export const prisma = global.prisma || prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

// Graceful shutdown
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

/**
 * Database health check
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    console.error('Database health check failed:', error)
    return false
  }
}

/**
 * Get connection pool stats (for monitoring)
 */
export async function getConnectionStats() {
  try {
    const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM pg_stat_activity
      WHERE datname = current_database()
    `
    
    return {
      activeConnections: Number(result[0]?.count || 0),
      maxConnections: parseInt(process.env.DATABASE_CONNECTION_LIMIT || '20'),
    }
  } catch (error) {
    console.error('Failed to get connection stats:', error)
    return null
  }
}
