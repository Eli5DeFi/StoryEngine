import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@voidborne/database'

export const dynamic = 'force-dynamic'

/**
 * GET /api/pools/[poolId]/odds
 * 
 * Returns real-time odds data for a betting pool:
 * - Recent snapshots (time-series data)
 * - Current odds calculated from live bets
 * - Market sentiment indicators
 * - Whale activity alerts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { poolId: string } }
) {
  try {
    const { poolId } = params
    const searchParams = request.nextUrl.searchParams
    
    // Query params
    const timeframe = searchParams.get('timeframe') || '24h' // 1h, 6h, 12h, 24h, all
    const limit = parseInt(searchParams.get('limit') || '100')

    // 1. Get pool details
    const pool = await prisma.bettingPool.findUnique({
      where: { id: poolId },
      include: {
        bets: {
          include: {
            choice: true,
            user: {
              select: {
                id: true,
                username: true,
                walletAddress: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        chapter: {
          include: {
            choices: {
              include: {
                _count: {
                  select: { bets: true }
                }
              }
            }
          }
        }
      }
    })

    if (!pool) {
      return NextResponse.json(
        { error: 'Pool not found' },
        { status: 404 }
      )
    }

    // 2. Calculate timeframe cutoff
    const now = new Date()
    let cutoffDate = new Date(now)
    
    switch (timeframe) {
      case '1h':
        cutoffDate.setHours(cutoffDate.getHours() - 1)
        break
      case '6h':
        cutoffDate.setHours(cutoffDate.getHours() - 6)
        break
      case '12h':
        cutoffDate.setHours(cutoffDate.getHours() - 12)
        break
      case '24h':
        cutoffDate.setHours(cutoffDate.getHours() - 24)
        break
      case 'all':
        cutoffDate = pool.opensAt
        break
    }

    // 3. Get historical snapshots
    const snapshots = await prisma.oddsSnapshot.findMany({
      where: {
        poolId,
        createdAt: {
          gte: cutoffDate
        }
      },
      orderBy: { createdAt: 'asc' },
      take: limit
    })

    // 4. Calculate current odds from live bets
    const choices = pool.chapter.choices
    const currentOdds: Record<string, number> = {}
    const totalPool = Number(pool.totalPool)

    choices.forEach(choice => {
      const choiceBets = pool.bets.filter(bet => bet.choiceId === choice.id)
      const choiceTotal = choiceBets.reduce(
        (sum, bet) => sum + Number(bet.amount),
        0
      )
      
      // Calculate implied probability (pool share)
      currentOdds[choice.id] = totalPool > 0 ? choiceTotal / totalPool : 0
    })

    // 5. Detect whale bets (>$500)
    const whaleThreshold = 500
    const recentWhales = pool.bets
      .filter(bet => Number(bet.amount) >= whaleThreshold)
      .slice(0, 5)
      .map(bet => ({
        id: bet.id,
        amount: Number(bet.amount),
        choiceId: bet.choiceId,
        choiceText: choices.find(c => c.id === bet.choiceId)?.text,
        timestamp: bet.createdAt,
        user: bet.user.username || `${bet.user.walletAddress.slice(0, 6)}...${bet.user.walletAddress.slice(-4)}`
      }))

    // 6. Calculate market sentiment metrics
    const last15MinBets = pool.bets.filter(bet => {
      const betTime = new Date(bet.createdAt)
      const fifteenMinAgo = new Date(now.getTime() - 15 * 60 * 1000)
      return betTime >= fifteenMinAgo
    })

    // Calculate momentum (rate of odds change in last hour)
    const momentum: Record<string, number> = {}
    if (snapshots.length >= 2) {
      const latestSnapshot = snapshots[snapshots.length - 1]
      const hourAgoSnapshot = snapshots.find(s => {
        const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)
        return new Date(s.createdAt) <= hourAgo
      }) || snapshots[0]

      const latestOdds = latestSnapshot.choiceOdds as Record<string, number>
      const hourAgoOdds = hourAgoSnapshot.choiceOdds as Record<string, number>

      choices.forEach(choice => {
        const latest = latestOdds[choice.id] || 0
        const hourAgo = hourAgoOdds[choice.id] || 0
        momentum[choice.id] = latest - hourAgo // +0.15 = +15% momentum
      })
    }

    // 7. Determine "hot" choice (most recent activity)
    const choiceActivity: Record<string, number> = {}
    last15MinBets.forEach(bet => {
      choiceActivity[bet.choiceId] = (choiceActivity[bet.choiceId] || 0) + 1
    })

    const hotChoiceId = Object.entries(choiceActivity).sort(
      ([, a], [, b]) => b - a
    )[0]?.[0]

    // 8. Calculate consensus strength (Herfindahl index)
    // 0 = perfectly distributed, 1 = all on one choice
    const consensusStrength = Object.values(currentOdds).reduce(
      (sum, prob) => sum + prob * prob,
      0
    )

    // 9. Time remaining
    const closesAt = new Date(pool.closesAt)
    const timeRemaining = closesAt.getTime() - now.getTime()
    const hoursRemaining = timeRemaining / (1000 * 60 * 60)

    // 10. Urgency level
    let urgencyLevel: 'calm' | 'moderate' | 'high' | 'critical'
    if (hoursRemaining > 24) urgencyLevel = 'calm'
    else if (hoursRemaining > 12) urgencyLevel = 'moderate'
    else if (hoursRemaining > 1) urgencyLevel = 'high'
    else urgencyLevel = 'critical'

    // 11. Format response
    return NextResponse.json({
      pool: {
        id: pool.id,
        status: pool.status,
        totalPool: Number(pool.totalPool),
        totalBets: pool.totalBets,
        uniqueBettors: pool.uniqueBettors,
        opensAt: pool.opensAt,
        closesAt: pool.closesAt,
        timeRemaining: Math.max(0, timeRemaining),
        hoursRemaining: Math.max(0, hoursRemaining),
        urgencyLevel
      },
      
      current: {
        odds: currentOdds,
        timestamp: now.toISOString()
      },
      
      snapshots: snapshots.map(s => ({
        timestamp: s.createdAt,
        odds: s.choiceOdds,
        totalPool: Number(s.totalPool),
        totalBets: s.totalBets,
        uniqueBettors: s.uniqueBettors
      })),
      
      sentiment: {
        momentum, // Per-choice momentum
        hotChoiceId, // Most active choice
        consensusStrength, // 0-1, how concentrated
        recentBetCount: last15MinBets.length,
        whaleCount: recentWhales.length
      },
      
      whales: recentWhales,
      
      choices: choices.map(choice => ({
        id: choice.id,
        text: choice.text,
        choiceNumber: choice.choiceNumber,
        currentOdds: currentOdds[choice.id] || 0,
        totalBets: choice._count.bets,
        isHot: choice.id === hotChoiceId
      }))
    })

  } catch (error) {
    console.error('Error fetching pool odds:', error)
    return NextResponse.json(
      { error: 'Failed to fetch odds data' },
      { status: 500 }
    )
  }
}
