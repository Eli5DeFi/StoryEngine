import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@voidborne/database'

/**
 * GET /api/betting/odds-history/[poolId]
 * 
 * Fetch time-series odds data for a betting pool
 * Shows how odds changed over time as bets came in
 * 
 * Query params:
 * - interval: 5m | 15m | 1h | 6h | 24h (default: 5m)
 * - limit: number of snapshots (default: 50, max: 500)
 */

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { poolId: string } }
) {
  try {
    const { poolId } = params
    const { searchParams } = new URL(request.url)
    const interval = searchParams.get('interval') || '5m'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500)

    // Fetch betting pool
    const pool = await prisma.bettingPool.findUnique({
      where: { id: poolId },
      include: {
        chapter: {
          include: {
            choices: true,
          },
        },
      },
    })

    if (!pool) {
      return NextResponse.json(
        { error: 'Betting pool not found' },
        { status: 404 }
      )
    }

    // Calculate time filter based on interval
    const timeFilter = getTimeFilter(interval)

    // Fetch odds snapshots
    const snapshots = await prisma.oddsSnapshot.findMany({
      where: {
        poolId,
        ...(timeFilter && { createdAt: { gte: timeFilter } }),
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
    })

    // If no snapshots exist, generate current odds snapshot
    if (snapshots.length === 0) {
      const currentOdds = await calculateCurrentOdds(poolId, pool.chapter.choices)
      
      return NextResponse.json({
        poolId,
        interval,
        snapshots: [
          {
            timestamp: new Date().toISOString(),
            odds: currentOdds,
            totalPool: pool.totalPool.toString(),
            totalBets: pool.totalBets,
            uniqueBettors: pool.uniqueBettors,
          },
        ],
        choices: pool.chapter.choices.map((choice) => ({
          id: choice.id,
          text: choice.text,
          choiceNumber: choice.choiceNumber,
        })),
      })
    }

    // Format response
    const formattedSnapshots = snapshots.map((snapshot) => ({
      timestamp: snapshot.createdAt.toISOString(),
      odds: snapshot.choiceOdds,
      totalPool: snapshot.totalPool.toString(),
      totalBets: snapshot.totalBets,
      uniqueBettors: snapshot.uniqueBettors,
    }))

    return NextResponse.json({
      poolId,
      interval,
      snapshots: formattedSnapshots,
      choices: pool.chapter.choices.map((choice) => ({
        id: choice.id,
        text: choice.text,
        choiceNumber: choice.choiceNumber,
      })),
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Odds history API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch odds history' },
      { status: 500 }
    )
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function getTimeFilter(interval: string): Date | null {
  const now = new Date()
  const filters: Record<string, number> = {
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
  }

  const ms = filters[interval]
  if (!ms) return null

  return new Date(now.getTime() - ms)
}

/**
 * Calculate current odds for each choice based on betting volume
 * Uses implied probability from bet amounts
 */
async function calculateCurrentOdds(poolId: string, choices: any[]) {
  const bets = await prisma.bet.findMany({
    where: { poolId },
    select: {
      choiceId: true,
      amount: true,
    },
  })

  // Calculate total bet amount per choice
  const choiceTotals = new Map<string, number>()
  let grandTotal = 0

  bets.forEach((bet) => {
    const amount = parseFloat(bet.amount.toString())
    choiceTotals.set(
      bet.choiceId,
      (choiceTotals.get(bet.choiceId) || 0) + amount
    )
    grandTotal += amount
  })

  // Calculate odds (implied probability)
  const odds: Record<string, number> = {}
  
  if (grandTotal === 0) {
    // No bets yet, equal odds
    choices.forEach((choice) => {
      odds[choice.id] = 1 / choices.length
    })
  } else {
    // Convert bet amounts to implied probabilities
    choices.forEach((choice) => {
      const choiceTotal = choiceTotals.get(choice.id) || 0
      odds[choice.id] = choiceTotal / grandTotal
    })
  }

  return odds
}
