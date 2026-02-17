import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'


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
    logger.error('Badges API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    )
  }
}
