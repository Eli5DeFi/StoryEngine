import { NextResponse } from 'next/server'
import { prisma } from '@voidborne/database'
import { cache, CacheTTL } from '@/lib/cache'
import { logger } from '@/lib/logger'

// Dynamic: DB-backed at request time; in-memory cache handles the caching layer
export const dynamic = 'force-dynamic'

/**
 * GET /api/lore/houses
 * Returns all houses with their stats and protocols.
 * In-memory cache (5 min) + ISR to avoid hammering the DB.
 */
export async function GET() {
  try {
    const cacheKey = 'lore:houses'
    const cached = cache.get(cacheKey, CacheTTL.LONG)

    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Cache': 'HIT',
        },
      })
    }

    const houses = await prisma.house.findMany({
      include: {
        protocols: {
          select: {
            id: true,
            slug: true,
            code: true,
            name: true,
            rarity: true,
            powerLevel: true,
          },
          orderBy: { powerLevel: 'desc' },
        },
        _count: {
          select: {
            userHouses: true,
            protocols: true,
          },
        },
      },
      orderBy: { influence: 'desc' },
    })

    const response = {
      success: true,
      data: houses.map(house => ({
        ...house,
        reputation: Number(house.reputation),
        totalBets: Number(house.totalBets),
        winRate: Number(house.winRate),
        influence: Number(house.influence),
        memberCount: house._count.userHouses,
        protocolCount: house._count.protocols,
      })),
    }

    cache.set(cacheKey, response)

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Cache': 'MISS',
      },
    })
  } catch (error) {
    logger.error('Error fetching houses:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch houses' },
      { status: 500 }
    )
  }
}
