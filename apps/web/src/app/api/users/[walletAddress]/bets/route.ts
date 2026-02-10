import { NextResponse } from 'next/server'
import { PrismaClient } from '@voidborne/database'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

/**
 * GET /api/users/[walletAddress]/bets
 * 
 * Returns user's complete betting history with stats
 * 
 * Query params:
 * - status: 'all' | 'pending' | 'won' | 'lost' (default: 'all')
 * - limit: number (default: 20, max: 100)
 * - offset: number (default: 0) - for pagination
 * - timeframe: 'all' | '30d' | '7d' | '24h' (default: 'all')
 */
export async function GET(
  request: Request,
  { params }: { params: { walletAddress: string } }
) {
  try {
    const { walletAddress } = params
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status') || 'all'
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const timeframe = searchParams.get('timeframe') || 'all'

    // Find user
    const user = await prisma.user.findUnique({
      where: { walletAddress },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Build where clause
    const whereClause: any = {
      userId: user.id,
    }

    // Filter by status
    if (status === 'won') {
      whereClause.isWinner = true
    } else if (status === 'lost') {
      whereClause.isWinner = false
      whereClause.pool = {
        status: 'RESOLVED',
      }
    } else if (status === 'pending') {
      whereClause.pool = {
        status: {
          in: ['OPEN', 'PENDING', 'CLOSED', 'RESOLVING'],
        },
      }
    }

    // Filter by timeframe
    if (timeframe !== 'all') {
      const cutoff = getTimeframeCutoff(timeframe)
      if (cutoff) {
        whereClause.createdAt = {
          gte: cutoff,
        }
      }
    }

    // Fetch bets
    const [bets, totalCount] = await Promise.all([
      prisma.bet.findMany({
        where: whereClause,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          choice: {
            select: {
              text: true,
              isChosen: true,
              chapter: {
                select: {
                  number: true,
                  title: true,
                  story: {
                    select: {
                      id: true,
                      title: true,
                    },
                  },
                },
              },
            },
          },
          pool: {
            select: {
              id: true,
              status: true,
              totalPool: true,
            },
          },
        },
      }),
      prisma.bet.count({ where: whereClause }),
    ])

    // Calculate current odds for pending bets
    const formattedBets = bets.map((bet) => {
      const profit = bet.isWinner && bet.payout
        ? Number(bet.payout) - Number(bet.amount)
        : bet.pool.status === 'RESOLVED' && !bet.isWinner
        ? -Number(bet.amount)
        : null

      return {
        id: bet.id,
        poolId: bet.pool.id,
        amount: Number(bet.amount),
        odds: bet.odds || 0,
        status:
          bet.pool.status === 'RESOLVED'
            ? bet.isWinner
              ? 'WON'
              : 'LOST'
            : 'PENDING',
        payout: bet.payout ? Number(bet.payout) : null,
        profit,
        createdAt: bet.createdAt,
        story: {
          id: bet.choice.chapter.story.id,
          title: bet.choice.chapter.story.title,
        },
        chapter: {
          number: bet.choice.chapter.number,
          title: bet.choice.chapter.title,
        },
        choice: {
          text: bet.choice.text,
          isChosen: bet.choice.isChosen,
        },
      }
    })

    // Calculate stats
    const statsQuery = `
      SELECT 
        COUNT(b.id)::bigint as "totalBets",
        SUM(b.amount)::text as "totalWagered",
        SUM(CASE WHEN b."isWinner" THEN b.payout ELSE 0 END)::text as "totalWon",
        (SUM(CASE WHEN b."isWinner" THEN b.payout ELSE 0 END) - SUM(b.amount))::text as "netProfit",
        CASE 
          WHEN SUM(b.amount) > 0 
          THEN ((SUM(CASE WHEN b."isWinner" THEN b.payout ELSE 0 END) - SUM(b.amount)) / SUM(b.amount) * 100)::text
          ELSE '0'
        END as roi,
        CASE 
          WHEN COUNT(CASE WHEN bp.status = 'RESOLVED' THEN 1 END) > 0
          THEN (COUNT(CASE WHEN b."isWinner" THEN 1 END)::float / COUNT(CASE WHEN bp.status = 'RESOLVED' THEN 1 END)::float * 100)::text
          ELSE '0'
        END as "winRate",
        MAX(CASE WHEN b."isWinner" THEN (b.payout - b.amount) END)::text as "bestWin",
        MIN(CASE WHEN NOT b."isWinner" AND bp.status = 'RESOLVED' THEN -b.amount END)::text as "worstLoss"
      FROM bets b
      JOIN betting_pools bp ON b."poolId" = bp.id
      WHERE b."userId" = $1
    `

    const statsResult = await prisma.$queryRawUnsafe<Array<{
      totalBets: bigint
      totalWagered: string
      totalWon: string
      netProfit: string
      roi: string
      winRate: string
      bestWin: string | null
      worstLoss: string | null
    }>>(statsQuery, user.id)

    const stats = statsResult[0]
      ? {
          totalBets: Number(stats.totalBets),
          totalWagered: parseFloat(stats.totalWagered),
          totalWon: parseFloat(stats.totalWon),
          netProfit: parseFloat(stats.netProfit),
          roi: parseFloat(stats.roi),
          winRate: parseFloat(stats.winRate),
          bestWin: stats.bestWin ? parseFloat(stats.bestWin) : 0,
          worstLoss: stats.worstLoss ? parseFloat(stats.worstLoss) : 0,
        }
      : {
          totalBets: 0,
          totalWagered: 0,
          totalWon: 0,
          netProfit: 0,
          roi: 0,
          winRate: 0,
          bestWin: 0,
          worstLoss: 0,
        }

    // Calculate current streak
    const recentBetsForStreak = await prisma.bet.findMany({
      where: {
        userId: user.id,
        pool: {
          status: 'RESOLVED',
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        isWinner: true,
      },
    })

    let currentStreak = { type: 'none' as 'win' | 'loss' | 'none', count: 0 }
    if (recentBetsForStreak.length > 0) {
      const firstResult = recentBetsForStreak[0].isWinner
      let count = 0
      for (const bet of recentBetsForStreak) {
        if (bet.isWinner === firstResult) {
          count++
        } else {
          break
        }
      }
      currentStreak = {
        type: firstResult ? 'win' : 'loss',
        count,
      }
    }

    return NextResponse.json({
      bets: formattedBets,
      stats: {
        ...stats,
        currentStreak,
      },
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('User bets API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user bets' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Get Date object for timeframe filter
 */
function getTimeframeCutoff(timeframe: string): Date | null {
  const now = new Date()
  switch (timeframe) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000)
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    default:
      return null
  }
}
