import { NextResponse } from 'next/server'
import { prisma, calculateOdds } from '@voidborne/database'
import { cache, CacheTTL } from '@/lib/cache'

// Revalidate every 30 seconds (betting data changes frequently)
export const revalidate = 30

/**
 * GET /api/betting/pools/[poolId]
 * Get betting pool details with current odds
 * 
 * Optimizations:
 * - In-memory cache (30s TTL)
 * - Response caching headers
 * - Optimized query with select fields only
 */
export async function GET(
  request: Request,
  { params }: { params: { poolId: string } }
) {
  try {
    const cacheKey = `pool-${params.poolId}`
    
    // Check cache first
    const cached = cache.get(cacheKey, CacheTTL.SHORT)
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'X-Cache': 'HIT',
        },
      })
    }
    
    const pool = await prisma.bettingPool.findUnique({
      where: { id: params.poolId },
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

    const response = {
      ...pool,
      chapter: {
        ...pool.chapter,
        choices: choicesWithOdds,
      },
    }
    
    // Cache the response
    cache.set(cacheKey, response)

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        'X-Cache': 'MISS',
      },
    })
  } catch (error) {
    console.error('Error fetching betting pool:', error)
    return NextResponse.json(
      { error: 'Failed to fetch betting pool' },
      { status: 500 }
    )
  }
}
