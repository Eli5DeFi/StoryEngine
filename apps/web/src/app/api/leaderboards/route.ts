import { NextRequest, NextResponse } from 'next/server'
import { prisma, Prisma } from '@voidborne/database'

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
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'winners'
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const timeframe = searchParams.get('timeframe') || 'all'

    // Calculate time filter
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
        return NextResponse.json(
          { error: 'Invalid category' },
          { status: 400 }
        )
    }

    // Add rankings
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }))

    return NextResponse.json({
      category,
      timeframe,
      limit,
      data: rankedLeaderboard,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Leaderboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
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
 * Weekly Champions - Top performers in last 7 days
 */
async function getWeeklyChampions(limit: number) {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const bets = await prisma.bet.findMany({
    where: {
      createdAt: {
        gte: weekAgo,
      },
      isWinner: true,
      payout: {
        not: null,
      },
    },
    select: {
      userId: true,
      amount: true,
      payout: true,
    },
  })

  // Calculate weekly profit per user
  const userProfits = new Map<string, Decimal>()
  const userBetCounts = new Map<string, number>()

  bets.forEach((bet) => {
    const profit = (bet.payout || new Decimal(0)).sub(bet.amount)
    userProfits.set(
      bet.userId,
      (userProfits.get(bet.userId) || new Decimal(0)).add(profit)
    )
    userBetCounts.set(bet.userId, (userBetCounts.get(bet.userId) || 0) + 1)
  })

  // Sort by profit
  const sortedUsers = Array.from(userProfits.entries())
    .sort((a, b) => b[1].comparedTo(a[1]))
    .slice(0, limit)

  // Fetch user details
  const userIds = sortedUsers.map(([id]) => id)
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
    },
  })

  const userMap = new Map(users.map((u) => [u.id, u]))

  return sortedUsers.map(([userId, weeklyProfit]) => {
    const user = userMap.get(userId)!
    return {
      userId: user.id,
      walletAddress: user.walletAddress,
      username: user.username || formatWallet(user.walletAddress),
      avatar: user.avatar,
      weeklyProfit: weeklyProfit.toString(),
      weeklyBets: userBetCounts.get(userId) || 0,
      winRate: user.winRate,
    }
  })
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
