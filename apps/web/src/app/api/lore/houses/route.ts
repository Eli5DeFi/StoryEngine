import { NextResponse } from 'next/server'
import { prisma } from '@voidborne/database'

export const dynamic = 'force-dynamic'

/**
 * GET /api/lore/houses
 * Returns all houses with their stats and protocols
 */
export async function GET() {
  try {
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
          orderBy: {
            powerLevel: 'desc',
          },
        },
        _count: {
          select: {
            userHouses: true,
            protocols: true,
          },
        },
      },
      orderBy: {
        influence: 'desc',
      },
    })

    return NextResponse.json({
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
    })
  } catch (error) {
    console.error('Error fetching houses:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch houses',
      },
      { status: 500 }
    )
  }
}
