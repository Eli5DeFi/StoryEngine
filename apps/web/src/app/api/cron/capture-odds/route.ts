import { NextResponse } from 'next/server'
import { prisma, Prisma } from '@voidborne/database'

/**
 * POST /api/cron/capture-odds
 * 
 * Cron job that captures odds snapshots every 5 minutes
 * Run this via a cron service (e.g. Vercel Cron, GitHub Actions)
 * 
 * Schedule: */5 * * * * (every 5 minutes)
 */

export const dynamic = 'force-dynamic'

const Decimal = Prisma.Decimal
type Decimal = Prisma.Decimal

export async function POST(request: Request) {
  try {
    // Verify cron secret (security)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'dev-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Find all open betting pools
    const openPools = await prisma.bettingPool.findMany({
      where: {
        status: 'OPEN',
      },
      include: {
        chapter: {
          include: {
            choices: true,
          },
        },
        bets: {
          select: {
            choiceId: true,
            amount: true,
          },
        },
      },
    })

    console.log(`[Cron] Found ${openPools.length} open pools`)

    const snapshots = []

    for (const pool of openPools) {
      // Calculate current odds
      const choiceOdds = calculateOdds(pool.bets, pool.chapter.choices)

      // Create snapshot
      const snapshot = await prisma.oddsSnapshot.create({
        data: {
          poolId: pool.id,
          choiceOdds,
          totalPool: pool.totalPool,
          totalBets: pool.totalBets,
          uniqueBettors: pool.uniqueBettors,
        },
      })

      snapshots.push({
        poolId: pool.id,
        snapshotId: snapshot.id,
        timestamp: snapshot.createdAt,
      })

      console.log(`[Cron] Captured odds snapshot for pool ${pool.id}`)
    }

    // Clean up old snapshots (keep last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const deletedCount = await prisma.oddsSnapshot.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    })

    console.log(`[Cron] Deleted ${deletedCount.count} old snapshots`)

    return NextResponse.json({
      success: true,
      snapshotsCreated: snapshots.length,
      snapshotsDeleted: deletedCount.count,
      snapshots,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Cron] Capture odds error:', error)
    return NextResponse.json(
      { error: 'Failed to capture odds' },
      { status: 500 }
    )
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function calculateOdds(bets: any[], choices: any[]): Record<string, number> {
  // Calculate total bet amount per choice
  const choiceTotals = new Map<string, Decimal>()
  let grandTotal = new Decimal(0)

  bets.forEach((bet) => {
    const amount = bet.amount instanceof Decimal ? bet.amount : new Decimal(bet.amount)
    choiceTotals.set(
      bet.choiceId,
      (choiceTotals.get(bet.choiceId) || new Decimal(0)).add(amount)
    )
    grandTotal = grandTotal.add(amount)
  })

  // Calculate odds (implied probability)
  const odds: Record<string, number> = {}
  
  if (parseFloat(grandTotal.toString()) === 0) {
    // No bets yet, equal odds
    choices.forEach((choice) => {
      odds[choice.id] = 1 / choices.length
    })
  } else {
    // Convert bet amounts to implied probabilities
    choices.forEach((choice) => {
      const choiceTotal = choiceTotals.get(choice.id) || new Decimal(0)
      const probability = parseFloat(choiceTotal.toString()) / parseFloat(grandTotal.toString())
      odds[choice.id] = parseFloat(probability.toFixed(4))
    })
  }

  return odds
}

/**
 * Usage:
 * 
 * 1. Set environment variable:
 *    CRON_SECRET=your-secret-key
 * 
 * 2. Set up Vercel Cron (vercel.json):
 *    {
 *      "crons": [{
 *        "path": "/api/cron/capture-odds",
 *        "schedule": "*/5 * * * *"
 *      }]
 *    }
 * 
 * 3. Or use external cron service:
 *    curl -X POST https://your-domain.com/api/cron/capture-odds \
 *      -H "Authorization: Bearer your-secret-key"
 */
