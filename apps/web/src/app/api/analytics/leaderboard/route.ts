import { NextResponse } from 'next/server'
import { PrismaClient } from '@voidborne/database'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics/leaderboard
 * 
 * Returns top bettors by total wagered, win rate, and profit
 * 
 * Query params:
 * - limit: number (default: 10, max: 100)
 * - sortBy: 'wagered' | 'winRate' | 'profit' (default: 'profit')
 * - timeframe: 'all' | '30d' | '7d' | '24h' (default: 'all')
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const sortBy = (searchParams.get('sortBy') || 'profit') as 'wagered' | 'winRate' | 'profit'
    const timeframe = (searchParams.get('timeframe') || 'all') as 'all' | '30d' | '7d' | '24h'

    // Calculate timeframe cutoff
    const timeframeCutoff = getTimeframeCutoff(timeframe)

    // Build query based on filters
    const orderByClause =
      sortBy === 'wagered'
        ? 'SUM(b.amount)'
        : sortBy === 'winRate'
        ? 'COUNT(CASE WHEN b.won = true THEN 1 END)::float / COUNT(b.id)::float'
        : 'COALESCE(SUM(CASE WHEN b.won = true THEN b.payout ELSE 0 END), 0) - COALESCE(SUM(b.amount), 0)'

    const baseQuery = `
      SELECT 
        u.id as "userId",
        u."walletAddress",
        u.username,
        COUNT(b.id)::bigint as "totalBets",
        COALESCE(SUM(b.amount), 0)::text as "totalWagered",
        COALESCE(SUM(CASE WHEN b.won = true THEN b.payout ELSE 0 END), 0)::text as "totalWon",
        COUNT(CASE WHEN b.won = true THEN 1 END)::bigint as "winningBets",
        CASE 
          WHEN COUNT(b.id) > 0 
          THEN (COUNT(CASE WHEN b.won = true THEN 1 END)::float / COUNT(b.id)::float * 100)::text
          ELSE '0'
        END as "winRate",
        (
          COALESCE(SUM(CASE WHEN b.won = true THEN b.payout ELSE 0 END), 0) - 
          COALESCE(SUM(b.amount), 0)
        )::text as profit
      FROM users u
      LEFT JOIN bets b ON u.id = b."userId"
      ${timeframeCutoff ? `WHERE b."createdAt" >= '${timeframeCutoff}'` : ''}
      GROUP BY u.id, u."walletAddress", u.username
      HAVING COUNT(b.id) > 0
      ORDER BY ${orderByClause} DESC NULLS LAST
      LIMIT ${limit}
    `

    // Get user stats with aggregations
    const userStats = await prisma.$queryRawUnsafe<Array<{
      userId: string
      walletAddress: string | null
      username: string | null
      totalBets: bigint
      totalWagered: string
      totalWon: string
      winningBets: bigint
      winRate: string
      profit: string
    }>>(baseQuery)

    // Convert BigInt to Number and Decimal strings to Numbers
    const leaderboard = userStats.map((user, index) => ({
      rank: index + 1,
      userId: user.userId,
      walletAddress: user.walletAddress || 'Anonymous',
      username: user.username || formatAddress(user.walletAddress),
      totalBets: Number(user.totalBets),
      totalWagered: parseFloat(user.totalWagered),
      totalWon: parseFloat(user.totalWon),
      winningBets: Number(user.winningBets),
      winRate: parseFloat(user.winRate),
      profit: parseFloat(user.profit),
    }))

    return NextResponse.json({
      leaderboard,
      sortBy,
      timeframe,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
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
      return `'${new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()}'`
    case '7d':
      return `'${new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()}'`
    case '30d':
      return `'${new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()}'`
    default:
      return null
  }
}

/**
 * Format wallet address to short form
 */
function formatAddress(address: string | null): string {
  if (!address) return 'Anonymous'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
