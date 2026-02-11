import { NextResponse } from 'next/server'
import { PrismaClient } from '@voidborne/database'
import { cache, CacheTTL } from '@/lib/cache'

const prisma = new PrismaClient()

// Revalidate every 60 seconds
export const revalidate = 60

/**
 * GET /api/betting/platform-stats
 * 
 * Returns platform-wide betting statistics
 * Used for dashboard quick stats card
 * 
 * Optimizations:
 * - In-memory cache (60s TTL)
 * - Parallel query execution where possible
 * - Response caching headers
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '24h'
    
    const cacheKey = `platform-stats:${timeframe}`
    
    // Check cache first
    const cached = cache.get(cacheKey, CacheTTL.MEDIUM)
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      })
    }

    const timeframeCutoff = getTimeframeCutoff(timeframe)

    // Parallel query execution for better performance
    const [activePools, volumeQuery, biggestWinResult, hottestPoolResult] = await Promise.all([
      // Active pools (open right now)
      prisma.bettingPool.count({
        where: {
          status: 'OPEN',
          closesAt: {
            gt: new Date(),
          },
        },
      }),
      
      // Total wagered (timeframe)
      timeframeCutoff
        ? prisma.bet.aggregate({
            where: {
              createdAt: {
                gte: new Date(timeframeCutoff),
              },
            },
            _sum: {
              amount: true,
            },
          })
        : prisma.bet.aggregate({
            _sum: {
              amount: true,
            },
          }),
      
      // Biggest win (timeframe)
      prisma.$queryRawUnsafe(`
        SELECT 
          (b.payout - b.amount)::text as profit
        FROM bets b
        WHERE b."isWinner" = true
          ${timeframeCutoff ? `AND b."createdAt" >= '${timeframeCutoff}'` : ''}
        ORDER BY (b.payout - b.amount) DESC
        LIMIT 1
      `) as Promise<Array<{ profit: string }>>,
      
      // Hottest pool (most bets in last hour)
      prisma.$queryRawUnsafe(`
        SELECT 
          bp.id as "poolId",
          s.title as "storyTitle",
          ch."chapterNumber" as "chapterNumber",
          COUNT(b.id)::bigint as "betCount"
        FROM betting_pools bp
        JOIN chapters ch ON bp."chapterId" = ch.id
        JOIN stories s ON ch."storyId" = s.id
        LEFT JOIN bets b ON bp.id = b."poolId" 
          AND b."createdAt" >= NOW() - INTERVAL '1 hour'
        WHERE bp.status = 'OPEN'
        GROUP BY bp.id, s.title, ch."chapterNumber"
        ORDER BY COUNT(b.id) DESC
        LIMIT 1
      `) as Promise<Array<{
        poolId: string
        storyTitle: string
        chapterNumber: number
        betCount: bigint
      }>>,
    ])

    // Process results
    const totalWagered = Number(volumeQuery._sum.amount || 0)
    
    const biggestWin = biggestWinResult.length > 0 
      ? parseFloat(biggestWinResult[0].profit)
      : 0

    const hottestPool = hottestPoolResult.length > 0
      ? {
          poolId: hottestPoolResult[0].poolId,
          storyTitle: hottestPoolResult[0].storyTitle,
          chapterNumber: hottestPoolResult[0].chapterNumber,
          betCount: Number(hottestPoolResult[0].betCount),
        }
      : null

    const response = {
      activePools,
      totalWagered,
      biggestWin,
      hottestPool,
      timeframe,
      timestamp: new Date().toISOString(),
    }
    
    // Cache the response
    cache.set(cacheKey, response)
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    })
  } catch (error) {
    console.error('Platform stats API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platform stats' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Get SQL timestamp for timeframe filter
 */
function getTimeframeCutoff(timeframe: string): string | null {
  const now = new Date()
  switch (timeframe) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    default:
      return null
  }
}
