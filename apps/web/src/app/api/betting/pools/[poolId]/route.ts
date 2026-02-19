import { NextResponse } from 'next/server'
import { prisma, calculateOdds } from '@voidborne/database'
import { cache, CacheTTL } from '@/lib/cache'
import { logger } from '@/lib/logger'

// Revalidate every 15 seconds — betting pools change frequently
export const revalidate = 15

/**
 * GET /api/betting/pools/[poolId]
 * Get betting pool details with current odds
 * Cached for 15s to reduce DB load on high-traffic pools
 */
export async function GET(
  request: Request,
  { params }: { params: { poolId: string } }
) {
  try {
    const { poolId } = params
    const cacheKey = `pool:${poolId}`

    // Check in-memory cache (15s TTL)
    const cached = cache.get(cacheKey, CacheTTL.SHORT / 2)
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
          'X-Cache': 'HIT',
        },
      })
    }

    const pool = await prisma.bettingPool.findUnique({
      where: { id: poolId },
      include: {
        chapter: {
          include: {
            story: {
              select: {
                id: true,
                title: true,
              },
            },
            choices: {
              orderBy: { choiceNumber: 'asc' },
              select: {
                id: true,
                choiceNumber: true,
                text: true,
                description: true,
                totalBets: true,
                betCount: true,
                isChosen: true,
              },
            },
          },
        },
        _count: {
          select: { bets: true },
        },
      },
    })

    if (!pool) {
      return NextResponse.json(
        { error: 'Betting pool not found' },
        { status: 404 }
      )
    }

    // Calculate current odds for each choice
    const choicesWithOdds = pool.chapter.choices.map((choice) => ({
      ...choice,
      odds: calculateOdds(
        Number(choice.totalBets),
        Number(pool.totalPool)
      ),
      percentage: pool.totalPool.toNumber() > 0
        ? (choice.totalBets.toNumber() / pool.totalPool.toNumber()) * 100
        : 0,
    }))

    const result = {
      ...pool,
      chapter: {
        ...pool.chapter,
        choices: choicesWithOdds,
      },
    }

    // Cache result; skip caching resolved/closed pools (stale fast)
    if (pool.status === 'OPEN') {
      cache.set(cacheKey, result)
    }

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': pool.status === 'OPEN'
          ? 'public, s-maxage=15, stale-while-revalidate=30'
          : 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Cache': 'MISS',
      },
    })
  } catch (error) {
    logger.error('Error fetching betting pool:', error)
    return NextResponse.json(
      { error: 'Failed to fetch betting pool' },
      { status: 500 }
    )
  }
}
