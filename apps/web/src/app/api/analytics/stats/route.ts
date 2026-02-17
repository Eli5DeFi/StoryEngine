import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

import { cache, CacheTTL } from '@/lib/cache'

// Mark as dynamic due to search params
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/analytics/stats
 * 
 * Returns platform-wide statistics
 * 
 * Query params:
 * - timeframe: 'all' | '30d' | '7d' | '24h' (default: 'all')
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = (searchParams.get('timeframe') || 'all') as 'all' | '30d' | '7d' | '24h'
    
    const cacheKey = `analytics-stats-${timeframe}`
    
    // Check cache first (1 minute TTL for stats)
    const cached = cache.get(cacheKey, CacheTTL.MEDIUM)
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      })
    }

    // Build timeframe filter
    const timeframeFilter = getTimeframeFilter(timeframe)

    // Get platform stats using raw queries for better performance
    const [
      storiesData,
      chaptersData,
      betsData,
      usersData,
      poolsData,
    ] = await Promise.all([
      // Stories count and status breakdown
      prisma.story.groupBy({
        by: ['status'],
        _count: true,
        where: timeframeFilter ? { createdAt: timeframeFilter } : undefined,
      }),

      // Chapters count
      prisma.chapter.count({
        where: timeframeFilter ? { createdAt: timeframeFilter } : undefined,
      }),

      // Betting stats
      timeframeFilter
        ? prisma.$queryRaw<Array<{
            totalBets: bigint
            totalWagered: string
            totalPaidOut: string
            avgBetSize: string
          }>>`
            SELECT 
              COUNT(*)::bigint as "totalBets",
              COALESCE(SUM(amount), 0)::text as "totalWagered",
              COALESCE(SUM(CASE WHEN won = true THEN payout ELSE 0 END), 0)::text as "totalPaidOut",
              COALESCE(AVG(amount), 0)::text as "avgBetSize"
            FROM bets
            WHERE "createdAt" >= ${timeframeFilter.gte.toISOString()}::timestamp
          `
        : prisma.$queryRaw<Array<{
            totalBets: bigint
            totalWagered: string
            totalPaidOut: string
            avgBetSize: string
          }>>`
            SELECT 
              COUNT(*)::bigint as "totalBets",
              COALESCE(SUM(amount), 0)::text as "totalWagered",
              COALESCE(SUM(CASE WHEN won = true THEN payout ELSE 0 END), 0)::text as "totalPaidOut",
              COALESCE(AVG(amount), 0)::text as "avgBetSize"
            FROM bets
          `,

      // Users count and engagement
      prisma.user.count({
        where: timeframeFilter ? { createdAt: timeframeFilter } : undefined,
      }),

      // Active pools
      prisma.bettingPool.count({
        where: {
          status: 'OPEN',
        },
      }),
    ])

    const bettingStats = betsData[0] || {
      totalBets: BigInt(0),
      totalWagered: '0',
      totalPaidOut: '0',
      avgBetSize: '0',
    }

    // Get most popular story
    const popularStory = await prisma.bet.groupBy({
      by: ['choiceId'],
      _count: true,
      orderBy: {
        _count: {
          choiceId: 'desc',
        },
      },
      take: 1,
    })

    let mostPopularStory = null
    if (popularStory.length > 0) {
      const choice = await prisma.choice.findUnique({
        where: { id: popularStory[0].choiceId },
        include: {
          chapter: {
            include: {
              story: {
                select: {
                  id: true,
                  title: true,
                  genre: true,
                },
              },
            },
          },
        },
      })

      if (choice?.chapter?.story) {
        mostPopularStory = {
          id: choice.chapter.story.id,
          title: choice.chapter.story.title,
          genre: choice.chapter.story.genre,
          totalBets: popularStory[0]._count,
        }
      }
    }

    // Calculate story status breakdown
    const storyStatusBreakdown = storiesData.reduce((acc: Record<string, number>, item: { status: string; _count: number }) => {
      acc[item.status] = item._count
      return acc
    }, {} as Record<string, number>)

    const response = {
      timeframe,
      stories: {
        total: storiesData.reduce((sum: number, item: { status: string; _count: number }) => sum + item._count, 0),
        byStatus: storyStatusBreakdown,
        mostPopular: mostPopularStory,
      },
      chapters: {
        total: chaptersData,
      },
      betting: {
        totalBets: Number(bettingStats.totalBets),
        totalWagered: parseFloat(bettingStats.totalWagered),
        totalPaidOut: parseFloat(bettingStats.totalPaidOut),
        avgBetSize: parseFloat(bettingStats.avgBetSize),
        platformRevenue: parseFloat(bettingStats.totalWagered) * 0.15, // 15% platform fee
        activePools: poolsData,
      },
      users: {
        total: usersData,
      },
      timestamp: new Date().toISOString(),
    }
    
    // Cache the response
    cache.set(cacheKey, response)
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}

/**
 * Get Prisma filter for timeframe
 */
function getTimeframeFilter(timeframe: string): { gte: Date } | undefined {
  const date = getTimeframeDate(timeframe)
  return date ? { gte: date } : undefined
}

/**
 * Get Date object for timeframe
 */
function getTimeframeDate(timeframe: string): Date | null {
  const now = new Date()
  switch (timeframe) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000)
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    default:
      return null
  }
}
