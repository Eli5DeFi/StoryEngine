import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/badges/[userId]
 * Get badges earned by a specific user
 */
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: {
        badge: true,
      },
      orderBy: {
        earnedAt: 'desc',
      },
    })

    const badges = userBadges.map(ub => ({
      ...ub.badge,
      earnedAt: ub.earnedAt,
    }))

    return NextResponse.json({ badges })
  } catch (error) {
    console.error('User badges API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user badges' },
      { status: 500 }
    )
  }
}
