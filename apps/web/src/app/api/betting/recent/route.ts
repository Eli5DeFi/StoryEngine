import { NextResponse } from 'next/server'
import { PrismaClient } from '@voidborne/database'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

/**
 * GET /api/betting/recent
 * 
 * Returns recent bets across all pools (last 50)
 * Creates FOMO and social proof
 * 
 * Query params:
 * - limit: number (default: 50, max: 100)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const recentBets = await prisma.bet.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            username: true,
            walletAddress: true,
          },
        },
        choice: {
          select: {
            text: true,
            chapter: {
              select: {
                chapterNumber: true,
                story: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
        pool: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    })

    const formattedBets = recentBets.map((bet) => ({
      id: bet.id,
      userId: bet.userId,
      username: bet.user.username || formatAddress(bet.user.walletAddress),
      walletAddress: bet.user.walletAddress,
      storyId: bet.choice.chapter.story.id,
      storyTitle: bet.choice.chapter.story.title,
      chapterNumber: bet.choice.chapter.chapterNumber,
      choiceText: bet.choice.text,
      amount: Number(bet.amount),
      odds: bet.odds || 0,
      timestamp: bet.createdAt,
      poolId: bet.pool.id,
      poolStatus: bet.pool.status,
    }))

    return NextResponse.json({
      bets: formattedBets,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Recent bets API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent bets' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Format wallet address to short form
 */
function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
