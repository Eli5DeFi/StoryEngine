import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@voidborne/database'

export const dynamic = 'force-dynamic'

/**
 * GET /api/lore/protocols
 * Returns all protocols with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Optional filters
    const houseSlug = searchParams.get('house')
    const strandType = searchParams.get('strand')
    const spectrum = searchParams.get('spectrum')
    const rarity = searchParams.get('rarity')

    const where: any = {}

    if (houseSlug) {
      const house = await prisma.house.findUnique({
        where: { slug: houseSlug },
      })
      if (house) {
        where.houseId = house.id
      }
    }

    if (strandType) {
      where.strandType = strandType
    }

    if (spectrum) {
      where.spectrum = spectrum
    }

    if (rarity) {
      where.rarity = rarity
    }

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
      orderBy: [
        { powerLevel: 'desc' },
        { rarity: 'desc' },
      ],
    })

    return NextResponse.json({
      success: true,
      data: protocols.map(protocol => ({
        ...protocol,
        successRate: Number(protocol.successRate),
      })),
      filters: {
        house: houseSlug,
        strand: strandType,
        spectrum,
        rarity,
      },
    })
  } catch (error) {
    console.error('Error fetching protocols:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch protocols',
      },
      { status: 500 }
    )
  }
}
