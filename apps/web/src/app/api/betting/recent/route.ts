import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cache, CacheTTL } from '@/lib/cache'


// Revalidate every 30 seconds
export const revalidate = 30

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
    
    const cacheKey = `recent-bets-${limit}`
    
    // Check cache first
    const cached = cache.get(cacheKey, CacheTTL.SHORT)
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      })
    }

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

    const response = {
      bets: formattedBets,
      timestamp: new Date().toISOString(),
    }
    
    // Cache the response
    cache.set(cacheKey, response)
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    logger.error('Recent bets API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent bets' },
      { status: 500 }
    )
  }
}

/**
 * Format wallet address to short form
 */
function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
