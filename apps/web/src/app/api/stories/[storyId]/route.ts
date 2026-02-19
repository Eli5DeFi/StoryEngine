import { NextResponse } from 'next/server'
import { prisma } from '@voidborne/database'
import { cache, CacheTTL } from '@/lib/cache'
import { logger } from '@/lib/logger'

// ISR: revalidate every 60 seconds at the CDN edge
export const revalidate = 60

/**
 * GET /api/stories/[storyId]
 *
 * Returns a single story with all chapters, choices, and betting pools.
 *
 * Optimizations:
 * - In-memory cache (60s TTL) to avoid repeated DB reads for the same story
 * - viewCount increment is fire-and-forget (non-blocking) to cut ~50ms off p50
 * - ISR edge-cache header so Vercel CDN serves repeat requests without hitting this function
 */
export async function GET(
  _request: Request,
  { params }: { params: { storyId: string } }
) {
  const { storyId } = params
  const cacheKey = `story:${storyId}`

  try {
    // ── 1. Serve from in-memory cache ──────────────────────────────────────
    const cached = cache.get(cacheKey, CacheTTL.LONG)
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'X-Cache': 'HIT',
        },
      })
    }

    // ── 2. Fetch from DB ───────────────────────────────────────────────────
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
          },
        },
        chapters: {
          orderBy: { chapterNumber: 'asc' },
          include: {
            choices: {
              orderBy: { choiceNumber: 'asc' },
              include: {
                _count: { select: { bets: true } },
              },
            },
            bettingPool: {
              include: {
                _count: { select: { bets: true } },
              },
            },
          },
        },
      },
    })

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    // ── 3. Fire-and-forget view count (non-blocking) ───────────────────────
    // We intentionally do NOT await this; it shaves ~50ms from the response.
    prisma.story
      .update({ where: { id: storyId }, data: { viewCount: { increment: 1 } } })
      .catch((err) => logger.warn('viewCount increment failed:', err))

    // ── 4. Cache + respond ─────────────────────────────────────────────────
    cache.set(cacheKey, story)

    return NextResponse.json(story, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'X-Cache': 'MISS',
      },
    })
  } catch (error) {
    logger.error('Error fetching story:', error)
    return NextResponse.json({ error: 'Failed to fetch story' }, { status: 500 })
  }
}
