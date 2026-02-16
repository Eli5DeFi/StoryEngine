import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@voidborne/database'

export const dynamic = 'force-dynamic'

/**
 * GET /api/lore/houses/[slug]
 * Returns detailed information about a specific house
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    const house = await prisma.house.findUnique({
      where: { slug },
      include: {
        protocols: {
          orderBy: {
            powerLevel: 'desc',
          },
        },
        userHouses: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                walletAddress: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            reputation: 'desc',
          },
          take: 10, // Top 10 members
        },
        _count: {
          select: {
            userHouses: true,
            protocols: true,
          },
        },
      },
    })

    if (!house) {
      return NextResponse.json(
        {
          success: false,
          error: 'House not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...house,
        reputation: Number(house.reputation),
        totalBets: Number(house.totalBets),
        winRate: Number(house.winRate),
        influence: Number(house.influence),
        memberCount: house._count.userHouses,
        protocolCount: house._count.protocols,
        topMembers: house.userHouses.map(uh => ({
          user: uh.user,
          reputation: uh.reputation,
          rank: uh.rank,
          level: uh.level,
          joinedAt: uh.joinedAt,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching house:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch house',
      },
      { status: 500 }
    )
  }
}
