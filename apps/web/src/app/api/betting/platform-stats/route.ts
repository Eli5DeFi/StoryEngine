import { NextResponse } from 'next/server'
import { PrismaClient } from '@voidborne/database'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

/**
 * GET /api/betting/platform-stats
 * 
 * Returns platform-wide betting statistics
 * Used for dashboard quick stats card
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '24h'

    const timeframeCutoff = getTimeframeCutoff(timeframe)

    // Active pools (open right now)
    const activePools = await prisma.bettingPool.count({
      where: {
        status: 'OPEN',
        closesAt: {
          gt: new Date(),
        },
      },
    })

    // Total wagered (timeframe)
    const volumeQuery = timeframeCutoff
      ? await prisma.bet.aggregate({
          where: {
            createdAt: {
              gte: new Date(timeframeCutoff),
            },
          },
          _sum: {
            amount: true,
          },
        })
      : await prisma.bet.aggregate({
          _sum: {
            amount: true,
          },
        })

    const totalWagered = Number(volumeQuery._sum.amount || 0)

    // Biggest win (timeframe)
    const biggestWinQuery = `
      SELECT 
        (b.payout - b.amount)::text as profit
      FROM bets b
      WHERE b."isWinner" = true
        ${timeframeCutoff ? `AND b."createdAt" >= '${timeframeCutoff}'` : ''}
      ORDER BY (b.payout - b.amount) DESC
      LIMIT 1
    `

    const biggestWinResult = await prisma.$queryRawUnsafe<Array<{
      profit: string
    }>>(biggestWinQuery)

    const biggestWin = biggestWinResult.length > 0 
      ? parseFloat(biggestWinResult[0].profit)
      : 0

    // Hottest pool (most bets in last hour)
    const hottestPoolQuery = `
      SELECT 
        bp.id as "poolId",
        s.title as "storyTitle",
        ch.number as "chapterNumber",
        COUNT(b.id)::bigint as "betCount"
      FROM betting_pools bp
      JOIN chapters ch ON bp."chapterId" = ch.id
      JOIN stories s ON ch."storyId" = s.id
      LEFT JOIN bets b ON bp.id = b."poolId" 
        AND b."createdAt" >= NOW() - INTERVAL '1 hour'
      WHERE bp.status = 'OPEN'
      GROUP BY bp.id, s.title, ch.number
      ORDER BY COUNT(b.id) DESC
      LIMIT 1
    `

    const hottestPoolResult = await prisma.$queryRawUnsafe<Array<{
      poolId: string
      storyTitle: string
      chapterNumber: number
      betCount: bigint
    }>>(hottestPoolQuery)

    const hottestPool = hottestPoolResult.length > 0
      ? {
          poolId: hottestPoolResult[0].poolId,
          storyTitle: hottestPoolResult[0].storyTitle,
          chapterNumber: hottestPoolResult[0].chapterNumber,
          betCount: Number(hottestPoolResult[0].betCount),
        }
      : null

    return NextResponse.json({
      activePools,
      totalWagered,
      biggestWin,
      hottestPool,
      timeframe,
      timestamp: new Date().toISOString(),
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
