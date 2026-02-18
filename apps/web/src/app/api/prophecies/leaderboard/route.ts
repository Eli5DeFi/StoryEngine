import { NextResponse } from 'next/server'
import { prisma } from '@voidborne/database'

/**
 * GET /api/prophecies/leaderboard
 * Oracle leaderboard — top collectors ranked by fulfilled prophecy count.
 * ?limit=20
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 100)

    // Aggregate mints by user with prophecy status breakdown
    const rawData = await prisma.prophecyMint.groupBy({
      by: ['userId', 'walletAddress'],
      _count: { id: true },
      _sum: { forgePaid: true },
    })

    if (rawData.length === 0) {
      return NextResponse.json({ leaderboard: [], updatedAt: new Date() })
    }

    // Enrich with per-status counts
    const enriched = await Promise.all(
      rawData.map(async (row) => {
        const [fulfilled, echoed, unfulfilled, pending] = await Promise.all([
          prisma.prophecyMint.count({
            where: { userId: row.userId, prophecy: { status: 'FULFILLED' } },
          }),
          prisma.prophecyMint.count({
            where: { userId: row.userId, prophecy: { status: 'ECHOED' } },
          }),
          prisma.prophecyMint.count({
            where: { userId: row.userId, prophecy: { status: 'UNFULFILLED' } },
          }),
          prisma.prophecyMint.count({
            where: { userId: row.userId, prophecy: { status: 'PENDING' } },
          }),
        ])

        const total = row._count.id
        const user = await prisma.user.findUnique({
          where: { id: row.userId },
          select: { username: true },
        })

        return {
          userId: row.userId,
          walletAddress: row.walletAddress,
          displayName: user?.username ?? null,
          total,
          fulfilled,
          echoed,
          unfulfilled,
          pending,
          fulfillmentRate: total > 0 ? Math.round((fulfilled / total) * 100) : 0,
          totalForgePaid: Number(row._sum.forgePaid ?? 0),
          estimatedPortfolioValue: fulfilled * 50 + echoed * 15 + unfulfilled * 5,
          rank: computeOracleRank(fulfilled),
        }
      })
    )

    // Sort by fulfilled count desc, then total mints desc
    const sorted = enriched
      .sort((a, b) => b.fulfilled - a.fulfilled || b.total - a.total)
      .slice(0, limit)
      .map((entry, index) => ({ ...entry, position: index + 1 }))

    return NextResponse.json({ leaderboard: sorted, updatedAt: new Date() })
  } catch (err) {
    console.error('[GET /api/prophecies/leaderboard]', err)
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}

function computeOracleRank(fulfilled: number): string {
  if (fulfilled >= 50) return 'VOID_EYE'
  if (fulfilled >= 25) return 'PROPHET'
  if (fulfilled >= 10) return 'ORACLE'
  if (fulfilled >= 3) return 'SEER'
  return 'NOVICE'
}
