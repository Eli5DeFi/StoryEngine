import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cache, CacheTTL } from '@/lib/cache'

export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics/leaderboard
 *
 * Returns top bettors by total wagered, win rate, and profit.
 *
 * Query params:
 * - limit:    number (default: 10, max: 100)
 * - sortBy:   'wagered' | 'winRate' | 'profit' (default: 'profit')
 * - timeframe: 'all' | '30d' | '7d' | '24h' (default: 'all')
 *
 * Optimizations (this cycle):
 * - Replaced new PrismaClient() with shared singleton → no more connection exhaustion
 * - Removed $disconnect() in finally → singleton stays alive
 * - Eliminated SQL injection: ORDER BY and LIMIT now use a pre-validated whitelist
 *   instead of raw string interpolation; timeframe uses $queryRaw tagged template
 * - Added in-memory cache (2-min TTL) to avoid hammering DB on every request
 */

type SortBy = 'wagered' | 'winRate' | 'profit'
type Timeframe = 'all' | '30d' | '7d' | '24h'

/** Safe whitelist — never interpolate user input directly into ORDER BY */
const ORDER_BY_MAP: Record<SortBy, string> = {
  wagered:
    'COALESCE(SUM(b.amount), 0)',
  winRate:
    'CASE WHEN COUNT(b.id) > 0 THEN COUNT(CASE WHEN b."isWinner" = true THEN 1 END)::float / COUNT(b.id)::float ELSE 0 END',
  profit:
    'COALESCE(SUM(CASE WHEN b."isWinner" = true THEN b.payout ELSE 0 END), 0) - COALESCE(SUM(b.amount), 0)',
}

type UserStatsRow = {
  userId: string
  walletAddress: string | null
  username: string | null
  totalBets: bigint
  totalWagered: string
  totalWon: string
  winningBets: bigint
  winRate: string
  profit: string
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const rawSort = searchParams.get('sortBy') || 'profit'
    const rawTimeframe = searchParams.get('timeframe') || 'all'

    // Validate against whitelist — never trust user input
    const sortBy: SortBy = (rawSort in ORDER_BY_MAP ? rawSort : 'profit') as SortBy
    const timeframe: Timeframe = (['all', '30d', '7d', '24h'].includes(rawTimeframe)
      ? rawTimeframe
      : 'all') as Timeframe

    const cacheKey = `leaderboard:${sortBy}:${timeframe}:${limit}`
    const cached = cache.get<ReturnType<typeof buildResponse>>(cacheKey, CacheTTL.MEDIUM * 2)
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240' },
      })
    }

    const cutoffDate = getTimeframeCutoff(timeframe)
    const orderExpr = ORDER_BY_MAP[sortBy]

    // Safe: ORDER BY uses pre-validated whitelist string, LIMIT is Number-clamped,
    // timeframe uses Prisma tagged template ($queryRaw) with actual Date parameter.
    const userStats: UserStatsRow[] = cutoffDate
      ? await prisma.$queryRaw`
          SELECT
            u.id                                                AS "userId",
            u."walletAddress",
            u.username,
            COUNT(b.id)::bigint                                 AS "totalBets",
            COALESCE(SUM(b.amount), 0)::text                   AS "totalWagered",
            COALESCE(SUM(CASE WHEN b."isWinner" = true THEN b.payout ELSE 0 END), 0)::text AS "totalWon",
            COUNT(CASE WHEN b."isWinner" = true THEN 1 END)::bigint AS "winningBets",
            CASE
              WHEN COUNT(b.id) > 0
              THEN (COUNT(CASE WHEN b."isWinner" = true THEN 1 END)::float / COUNT(b.id)::float * 100)::text
              ELSE '0'
            END                                                 AS "winRate",
            (
              COALESCE(SUM(CASE WHEN b."isWinner" = true THEN b.payout ELSE 0 END), 0) -
              COALESCE(SUM(b.amount), 0)
            )::text                                             AS profit
          FROM users u
          LEFT JOIN bets b ON u.id = b."userId" AND b."createdAt" >= ${cutoffDate}
          GROUP BY u.id, u."walletAddress", u.username
          HAVING COUNT(b.id) > 0
          ORDER BY ${orderExpr} DESC NULLS LAST
          LIMIT ${limit}
        `
      : await prisma.$queryRaw`
          SELECT
            u.id                                                AS "userId",
            u."walletAddress",
            u.username,
            COUNT(b.id)::bigint                                 AS "totalBets",
            COALESCE(SUM(b.amount), 0)::text                   AS "totalWagered",
            COALESCE(SUM(CASE WHEN b."isWinner" = true THEN b.payout ELSE 0 END), 0)::text AS "totalWon",
            COUNT(CASE WHEN b."isWinner" = true THEN 1 END)::bigint AS "winningBets",
            CASE
              WHEN COUNT(b.id) > 0
              THEN (COUNT(CASE WHEN b."isWinner" = true THEN 1 END)::float / COUNT(b.id)::float * 100)::text
              ELSE '0'
            END                                                 AS "winRate",
            (
              COALESCE(SUM(CASE WHEN b."isWinner" = true THEN b.payout ELSE 0 END), 0) -
              COALESCE(SUM(b.amount), 0)
            )::text                                             AS profit
          FROM users u
          LEFT JOIN bets b ON u.id = b."userId"
          GROUP BY u.id, u."walletAddress", u.username
          HAVING COUNT(b.id) > 0
          ORDER BY ${orderExpr} DESC NULLS LAST
          LIMIT ${limit}
        `

    // Fetch badges + streaks for top users in a single query
    const userIds = userStats.map((u) => u.userId)
    const usersWithExtras = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        currentStreak: true,
        badges: {
          include: { badge: true },
          orderBy: { earnedAt: 'desc' },
          take: 5,
        },
      },
    })

    const userExtrasMap = new Map(
      usersWithExtras.map((u) => [
        u.id,
        {
          currentStreak: u.currentStreak,
          badges: u.badges.map((ub) => ub.badge),
        },
      ])
    )

    const leaderboard = userStats.map((user, index) => {
      const extras = userExtrasMap.get(user.userId)
      return {
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
        currentStreak: extras?.currentStreak ?? 0,
        badges: extras?.badges ?? [],
      }
    })

    const response = buildResponse(leaderboard, sortBy, timeframe)
    cache.set(cacheKey, response)

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=240' },
    })
  } catch (error) {
    logger.error('Leaderboard API error:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}

function buildResponse(leaderboard: unknown[], sortBy: SortBy, timeframe: Timeframe) {
  return { leaderboard, sortBy, timeframe, timestamp: new Date().toISOString() }
}

/** Returns a Date for the timeframe cutoff, or null for 'all'. */
function getTimeframeCutoff(timeframe: Timeframe): Date | null {
  const now = Date.now()
  switch (timeframe) {
    case '24h': return new Date(now - 24 * 60 * 60 * 1000)
    case '7d':  return new Date(now - 7  * 24 * 60 * 60 * 1000)
    case '30d': return new Date(now - 30 * 24 * 60 * 60 * 1000)
    default:    return null
  }
}

function formatAddress(address: string | null): string {
  if (!address) return 'Anonymous'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
