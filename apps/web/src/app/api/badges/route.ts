import { NextResponse } from 'next/server'
import { PrismaClient } from '@voidborne/database'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

/**
 * GET /api/badges
 * Get all available badges
 */
export async function GET() {
  try {
    const badges = await prisma.badge.findMany({
      orderBy: [
        { rarity: 'desc' },
        { criteriaValue: 'asc' },
      ],
    })

    return NextResponse.json({ badges })
  } catch (error) {
    console.error('Badges API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
