import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@voidborne/database'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/lore/protocols/[slug]
 * Returns detailed information about a specific protocol
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    const protocol = await prisma.protocol.findUnique({
      where: { slug },
      include: {
        house: true,
      },
    })

    if (!protocol) {
      return NextResponse.json(
        {
          success: false,
          error: 'Protocol not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...protocol,
        successRate: Number(protocol.successRate),
        house: {
          ...protocol.house,
          reputation: Number(protocol.house.reputation),
          totalBets: Number(protocol.house.totalBets),
          winRate: Number(protocol.house.winRate),
          influence: Number(protocol.house.influence),
        },
      },
    })
  } catch (error) {
    logger.error('Error fetching protocol:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch protocol',
      },
      { status: 500 }
    )
  }
}
