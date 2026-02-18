import { NextRequest, NextResponse } from 'next/server'
import { prisma, Prisma } from '@voidborne/database'
import { cache, CacheTTL } from '@/lib/cache'
import { logger } from '@/lib/logger'

// Decimal class and type from Prisma
const Decimal = Prisma.Decimal
type Decimal = Prisma.Decimal

/**
 * GET /api/leaderboards
 * 
 * Fetch leaderboard data for The Void Champions
 * 
 * Query params:
 * - category: winners | predictors | streaks | whales | weekly
 * - limit: number of results (default 10, max 100)
 * - timeframe: all | 30d | 7d | 24h
 */
// Dynamic: reads request.url — in-memory cache handles the caching layer
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'winners'
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const timeframe = searchParams.get('timeframe') || 'all'

    // Check in-memory cache (5 min) — leaderboards are expensive aggregations
    const cacheKey = `leaderboard:${category}:${limit}:${timeframe}`
    const cached = cache.get(cacheKey, CacheTTL.LONG)
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Cache': 'HIT',
        },
      })
    }

    const timeFilter = getTimeFilter(timeframe)
    let leaderboard: any[] = []

    switch (category) {
      case 'winners':
        leaderboard = await getTopWinners(limit, timeFilter)
        break
      case 'predictors':
        leaderboard = await getBestPredictors(limit, timeFilter)
        break
      case 'streaks':
        leaderboard = await getHotStreaks(limit)
        break
      case 'whales':
        leaderboard = await getBiggestBettors(limit, timeFilter)
        break
      case 'weekly':
        leaderboard = await getWeeklyChampions(limit)
        break
      default:
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }))

    const response = {
      category,
      timeframe,
      limit,
      data: rankedLeaderboard,
      updatedAt: new Date().toISOString(),
    }

    cache.set(cacheKey, response)

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Cache': 'MISS',
      },
    })
  } catch (error) {
    logger.error('Leaderboard API error:', error)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}

// ============================================================================
// LEADERBOARD QUERIES
// ============================================================================

/**
 * Top Winners - Users with highest net profit
 */
async function getTopWinners(limit: number, timeFilter?: any) {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      walletAddress: true,
      username: true,
      avatar: true,
      totalWon: true,
      totalLost: true,
      totalBets: true,
      winRate: true,
      bets: timeFilter
        ? {
            where: {
              createdAt: timeFilter,
              isWinner: true,
            },
            select: {
              amount: true,
              payout: true,
            },
          }
        : undefined,
    },
    orderBy: {
      totalWon: 'desc',
    },
    take: limit,
  })

  return users.map((user) => {
    // Calculate profit (including timeframe filter if applied)
    let profit: Decimal
    if (timeFilter && user.bets) {
      const timeframeWon = user.bets.reduce(
        (sum, bet) => sum.add(bet.payout || new Decimal(0)),
        new Decimal(0)
      )
      const timeframeBet = user.bets.reduce(
        (sum, bet) => sum.add(bet.amount),
        new Decimal(0)
      )
      profit = timeframeWon.sub(timeframeBet)
    } else {
      profit = user.totalWon.sub(user.totalLost)
    }

    return {
      userId: user.id,
      walletAddress: user.walletAddress,
      username: user.username || formatWallet(user.walletAddress),
      avatar: user.avatar,
      profit: profit.toString(),
      totalBets: user.totalBets,
      winRate: user.winRate,
    }
  })
}

/**
 * Best Predictors - Users with highest win rate (min 10 bets)
 */
async function getBestPredictors(limit: number, timeFilter?: any) {
  const users = await prisma.user.findMany({
    where: {
      totalBets: {
        gte: 10, // Minimum 10 bets to qualify
      },
    },
    select: {
      id: true,
      walletAddress: true,
      username: true,
      avatar: true,
      totalBets: true,
      winRate: true,
      totalWon: true,
      totalLost: true,
      bets: timeFilter
        ? {
            where: {
              createdAt: timeFilter,
            },
            select: {
              isWinner: true,
              amount: true,
            },
          }
        : undefined,
    },
    orderBy: {
      winRate: 'desc',
    },
    take: limit,
  })

  return users.map((user) => {
    let winRate = user.winRate
    let totalBets = user.totalBets

    // Recalculate for timeframe if filtered
    if (timeFilter && user.bets && user.bets.length > 0) {
      totalBets = user.bets.length
      const wins = user.bets.filter((b) => b.isWinner).length
      winRate = (wins / totalBets) * 100
    }

    const profit = user.totalWon.sub(user.totalLost)

    return {
      userId: user.id,
      walletAddress: user.walletAddress,
      username: user.username || formatWallet(user.walletAddress),
      avatar: user.avatar,
      winRate: Number(winRate.toFixed(2)),
      totalBets,
      profit: profit.toString(),
    }
  })
}

/**
 * Hot Streaks - Users with longest current/all-time streaks
 */
async function getHotStreaks(limit: number) {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { currentStreak: { gt: 0 } },
        { longestStreak: { gte: 3 } }, // At least 3-win streak
      ],
    },
    select: {
      id: true,
      walletAddress: true,
      username: true,
      avatar: true,
      currentStreak: true,
      longestStreak: true,
      totalBets: true,
      winRate: true,
      totalWon: true,
      totalLost: true,
    },
    orderBy: [{ currentStreak: 'desc' }, { longestStreak: 'desc' }],
    take: limit,
  })

  return users.map((user) => {
    const profit = user.totalWon.sub(user.totalLost)
    return {
      userId: user.id,
      walletAddress: user.walletAddress,
      username: user.username || formatWallet(user.walletAddress),
      avatar: user.avatar,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      totalBets: user.totalBets,
      winRate: user.winRate,
      profit: profit.toString(),
      isOnFire: user.currentStreak >= 5, // 5+ wins in a row
    }
  })
}

/**
 * Biggest Bettors - Whales with highest total wagered
 */
async function getBiggestBettors(limit: number, timeFilter?: any) {
  const aggregation = await prisma.bet.groupBy({
    by: ['userId'],
    where: timeFilter ? { createdAt: timeFilter } : undefined,
    _sum: {
      amount: true,
    },
    _count: {
      id: true,
    },
    orderBy: {
      _sum: {
        amount: 'desc',
      },
    },
    take: limit,
  })

  // Fetch user details
  const userIds = aggregation.map((a) => a.userId)
  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
    },
    select: {
      id: true,
      walletAddress: true,
      username: true,
      avatar: true,
      winRate: true,
      totalWon: true,
      totalLost: true,
    },
  })

  const userMap = new Map(users.map((u) => [u.id, u]))

  return aggregation.map((agg) => {
    const user = userMap.get(agg.userId)!
    const profit = user.totalWon.sub(user.totalLost)

    return {
      userId: user.id,
      walletAddress: user.walletAddress,
      username: user.username || formatWallet(user.walletAddress),
      avatar: user.avatar,
      totalWagered: agg._sum.amount?.toString() || '0',
      totalBets: agg._count.id,
      winRate: user.winRate,
      profit: profit.toString(),
    }
  })
}

/**
 * Weekly Champions - Top performers in last 7 days.
 * Uses a single DB aggregation instead of loading all bets into memory,
 * which was O(N) in JS and caused full table scans on high-traffic instances.
 */
async function getWeeklyChampions(limit: number) {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  // Single aggregation query: sum payout - amount per user, join users inline
  type WeeklyRow = {
    userId: string
    walletAddress: string
    username: string | null
    avatar: string | null
    winRate: Decimal
    weeklyProfit: string
    weeklyBets: bigint
  }

  const rows = await prisma.$queryRaw<WeeklyRow[]>`
    SELECT
      u.id           AS "userId",
      u."walletAddress",
      u.username,
      u.avatar,
      u."winRate",
      SUM(b.payout - b.amount)::text  AS "weeklyProfit",
      COUNT(b.id)::bigint             AS "weeklyBets"
    FROM bets b
    JOIN users u ON u.id = b."userId"
    WHERE b."createdAt" >= ${weekAgo}
      AND b."isWinner" = true
      AND b.payout IS NOT NULL
    GROUP BY u.id, u."walletAddress", u.username, u.avatar, u."winRate"
    ORDER BY SUM(b.payout - b.amount) DESC
    LIMIT ${limit}
  `

  return rows.map((row) => ({
    userId: row.userId,
    walletAddress: row.walletAddress,
    username: row.username || formatWallet(row.walletAddress),
    avatar: row.avatar,
    weeklyProfit: row.weeklyProfit,
    weeklyBets: Number(row.weeklyBets),
    winRate: row.winRate,
  }))
}

// ============================================================================
// HELPERS
// ============================================================================

function getTimeFilter(timeframe: string) {
  if (timeframe === 'all') return undefined

  const now = new Date()
  const filters: Record<string, Date> = {
    '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
    '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
  }

  return filters[timeframe] ? { gte: filters[timeframe] } : undefined
}

function formatWallet(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
