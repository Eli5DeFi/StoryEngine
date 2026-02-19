import { NextResponse } from 'next/server'
import { prisma } from '@voidborne/database'
import { cache, CacheTTL } from '@/lib/cache'
import { logger } from '@/lib/logger'

// Dynamic: reads searchParams — in-memory cache handles the caching layer
export const dynamic = 'force-dynamic'

/**
 * GET /api/stories
 * List all active stories — with in-memory cache (60s TTL) to reduce DB hits.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'ACTIVE'
    const genre = searchParams.get('genre')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Cache key based on query params
    const cacheKey = `stories:${status}:${genre}:${limit}:${offset}`
    const cached = cache.get<{ stories: unknown[]; total: number; limit: number; offset: number }>(cacheKey, CacheTTL.LONG)

    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120', 'X-Cache': 'HIT' },
      })
    }

    const where: Record<string, unknown> = { status }
    if (genre) where.genre = genre

    const [stories, total] = await Promise.all([
      prisma.story.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
            },
          },
          _count: {
            select: { chapters: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.story.count({ where }),
    ])

    const response = { stories, total, limit, offset }
    cache.set(cacheKey, response)

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120', 'X-Cache': 'MISS' },
    })
  } catch (error) {
    logger.error('Error fetching stories:', error)
    return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 })
  }
}

/**
 * POST /api/stories
 * Create a new story — clears list cache after creation.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, genre, authorId, coverImage } = body

    if (!title || !description || !genre || !authorId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const story = await prisma.story.create({
      data: {
        title,
        description,
        genre,
        authorId,
        coverImage,
        isAIGenerated: true,
      },
      include: {
        author: {
          select: { id: true, username: true, walletAddress: true },
        },
      },
    })

    // Invalidate story-list keys only (prefix match) so a single new story
    // doesn't evict unrelated cache entries (e.g. betting stats).
    cache.clear('stories:')

    return NextResponse.json(story, { status: 201 })
  } catch (error) {
    logger.error('Error creating story:', error)
    return NextResponse.json({ error: 'Failed to create story' }, { status: 500 })
  }
}
