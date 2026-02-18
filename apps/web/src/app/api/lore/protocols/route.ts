import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@voidborne/database'
import { cache, CacheTTL } from '@/lib/cache'
import { logger } from '@/lib/logger'

// Dynamic: reads searchParams at request time
export const dynamic = 'force-dynamic'

/**
 * GET /api/lore/protocols
 * Returns all protocols with optional filters.
 * Cached per unique filter combination (5 min TTL).
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const houseSlug = searchParams.get('house')
    const strandType = searchParams.get('strand')
    const spectrum = searchParams.get('spectrum')
    const rarity = searchParams.get('rarity')

    const cacheKey = `lore:protocols:${houseSlug}:${strandType}:${spectrum}:${rarity}`
    const cached = cache.get(cacheKey, CacheTTL.LONG)

    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Cache': 'HIT',
        },
      })
    }

    const where: Record<string, unknown> = {}

    if (houseSlug) {
      const house = await prisma.house.findUnique({ where: { slug: houseSlug } })
      if (house) where.houseId = house.id
    }
    if (strandType) where.strandType = strandType
    if (spectrum) where.spectrum = spectrum
    if (rarity) where.rarity = rarity

    const protocols = await prisma.protocol.findMany({
      where,
      include: {
        house: {
          select: {
            id: true,
            slug: true,
            name: true,
            primaryColor: true,
            icon: true,
          },
        },
      },
      orderBy: [{ powerLevel: 'desc' }, { rarity: 'desc' }],
    })

    const response = {
      success: true,
      data: protocols.map(p => ({ ...p, successRate: Number(p.successRate) })),
      filters: { house: houseSlug, strand: strandType, spectrum, rarity },
    }

    cache.set(cacheKey, response)

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Cache': 'MISS',
      },
    })
  } catch (error) {
    logger.error('Error fetching protocols:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch protocols' },
      { status: 500 }
    )
  }
}
