import { NextRequest, NextResponse } from 'next/server'
import { prisma, Prisma } from '@voidborne/database'
import { logger } from '@/lib/logger'

/**
 * GET /api/betting/consensus/[poolId]
 * 
 * Get current community consensus for a betting pool
 * Shows what percentage of bettors think each choice will win
 * 
 * Returns:
 * - Leading choice (highest probability)
 * - Confidence level (how strong is the consensus)
 * - Odds distribution
 * - Trending (odds direction: rising/falling)
 */

export const dynamic = 'force-dynamic'

const Decimal = Prisma.Decimal
type Decimal = Prisma.Decimal

export async function GET(
  request: NextRequest,
  { params }: { params: { poolId: string } }
) {
  try {
    const { poolId } = params

    // Fetch betting pool with all bets and choices
    const pool = await prisma.bettingPool.findUnique({
      where: { id: poolId },
      include: {
        chapter: {
          include: {
            choices: {
              include: {
                bets: true,
              },
            },
          },
        },
        bets: {
          include: {
            choice: true,
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

    // Calculate odds for each choice
    const choiceStats = pool.chapter.choices.map((choice) => {
      const choiceBets = choice.bets
      const totalBetAmount = choiceBets.reduce(
        (sum, bet) => sum.add(bet.amount),
        new Decimal(0)
      )
      const betCount = choiceBets.length

      return {
        choiceId: choice.id,
        text: choice.text,
        choiceNumber: choice.choiceNumber,
        totalBetAmount,
        betCount,
      }
    })

    // Calculate total pool amount
    const totalPoolAmount = choiceStats.reduce(
      (sum, choice) => sum.add(choice.totalBetAmount),
      new Decimal(0)
    )

    // Calculate implied probabilities (odds)
    const oddsDistribution = choiceStats.map((choice) => {
      const probability =
        parseFloat(totalPoolAmount.toString()) > 0
          ? parseFloat(choice.totalBetAmount.toString()) /
            parseFloat(totalPoolAmount.toString())
          : 1 / choiceStats.length // Equal odds if no bets

      return {
        choiceId: choice.choiceId,
        text: choice.text,
        choiceNumber: choice.choiceNumber,
        probability: parseFloat((probability * 100).toFixed(2)),
        odds: probability > 0 ? parseFloat((1 / probability).toFixed(2)) : 0,
        betAmount: choice.totalBetAmount.toString(),
        betCount: choice.betCount,
      }
    })

    // Sort by probability (highest first)
    oddsDistribution.sort((a, b) => b.probability - a.probability)

    // Determine leading choice
    const leadingChoice = oddsDistribution[0]

    // Calculate confidence level (how much better is #1 vs #2)
    const confidenceLevel = calculateConfidence(oddsDistribution)

    // Get recent trend (last 15 minutes)
    const trend = await calculateTrend(poolId, leadingChoice.choiceId)

    return NextResponse.json({
      poolId,
      status: pool.status,
      
      // Leading choice
      leadingChoice: {
        choiceId: leadingChoice.choiceId,
        text: leadingChoice.text,
        probability: leadingChoice.probability,
        betAmount: leadingChoice.betAmount,
        betCount: leadingChoice.betCount,
      },

      // Confidence (0-100)
      confidenceLevel,
      confidenceLabel: getConfidenceLabel(confidenceLevel),

      // Full odds distribution
      oddsDistribution,

      // Trend (rising/falling/stable)
      trend,

      // Pool stats
      totalPool: totalPoolAmount.toString(),
      totalBets: pool.totalBets,
      uniqueBettors: pool.uniqueBettors,

      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    logger.error('Consensus API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch consensus' },
      { status: 500 }
    )
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Calculate confidence level based on odds distribution
 * High confidence = large gap between #1 and #2
 * Low confidence = close race
 */
function calculateConfidence(oddsDistribution: any[]): number {
  if (oddsDistribution.length < 2) return 100

  const first = oddsDistribution[0].probability
  const second = oddsDistribution[1].probability

  // Confidence is the margin between #1 and #2
  // Scale to 0-100
  const margin = first - second
  const confidence = Math.min(margin * 2, 100) // 50-point gap = 100% confidence

  return parseFloat(confidence.toFixed(2))
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 80) return 'Very High'
  if (confidence >= 60) return 'High'
  if (confidence >= 40) return 'Moderate'
  if (confidence >= 20) return 'Low'
  return 'Very Low'
}

/**
 * Calculate trend for a choice (rising/falling/stable)
 * Compares current odds vs 15 minutes ago
 */
async function calculateTrend(poolId: string, choiceId: string) {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)

  const recentSnapshots = await prisma.oddsSnapshot.findMany({
    where: {
      poolId,
      createdAt: {
        gte: fifteenMinutesAgo,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
    take: 2, // First and last snapshot in last 15 min
  })

  if (recentSnapshots.length < 2) {
    return {
      direction: 'stable',
      change: 0,
    }
  }

  const firstSnapshot = recentSnapshots[0]
  const lastSnapshot = recentSnapshots[recentSnapshots.length - 1]

  const firstOdds = (firstSnapshot.choiceOdds as any)[choiceId] || 0
  const lastOdds = (lastSnapshot.choiceOdds as any)[choiceId] || 0

  const change = ((lastOdds - firstOdds) / firstOdds) * 100

  let direction: 'rising' | 'falling' | 'stable' = 'stable'
  if (change > 5) direction = 'rising'
  if (change < -5) direction = 'falling'

  return {
    direction,
    change: parseFloat(change.toFixed(2)),
  }
}
