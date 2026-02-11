import { NextResponse } from 'next/server'
import { PrismaClient } from '@voidborne/database'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

/**
 * GET /api/betting/trending
 * 
 * Returns hot pools and trending choices
 * Based on betting activity in last 1 hour
 */
export async function GET(request: Request) {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    // Get hot pools (most activity in last hour)
    const hotPoolsQuery = `
      SELECT 
        bp.id as "poolId",
        s.id as "storyId",
        s.title as "storyTitle",
        ch."chapterNumber" as "chapterNumber",
        COUNT(b.id)::bigint as "recentBets",
        bp."totalPool"::text,
        bp."closesAt"
      FROM betting_pools bp
      JOIN chapters ch ON bp."chapterId" = ch.id
      JOIN stories s ON ch."storyId" = s.id
      LEFT JOIN bets b ON bp.id = b."poolId" 
        AND b."createdAt" >= $1
      WHERE bp.status = 'OPEN'
        AND bp."closesAt" > NOW()
      GROUP BY bp.id, s.id, s.title, ch."chapterNumber", bp."totalPool", bp."closesAt"
      HAVING COUNT(b.id) > 0
      ORDER BY COUNT(b.id) DESC
      LIMIT 5
    `

    type HotPoolRow = {
      poolId: string
      storyId: string
      storyTitle: string
      chapterNumber: number
      recentBets: bigint
      totalPool: string
      closesAt: Date
    }
    const hotPools = await prisma.$queryRawUnsafe(hotPoolsQuery, oneHourAgo) as HotPoolRow[]

    // Get trending choices (highest volume in last hour)
    const trendingChoicesQuery = `
      SELECT 
        c.id as "choiceId",
        c.text as "choiceText",
        s.title as "storyTitle",
        ch."chapterNumber" as "chapterNumber",
        SUM(b.amount)::text as "recentVolume",
        c."betCount" as "totalBets",
        c."totalBets"::text as "totalVolume"
      FROM choices c
      JOIN chapters ch ON c."chapterId" = ch.id
      JOIN stories s ON ch."storyId" = s.id
      JOIN bets b ON c.id = b."choiceId"
        AND b."createdAt" >= $1
      GROUP BY c.id, c.text, s.title, ch."chapterNumber", c."betCount", c."totalBets"
      HAVING SUM(b.amount) > 0
      ORDER BY SUM(b.amount) DESC
      LIMIT 5
    `

    type TrendingChoiceRow = {
      choiceId: string
      choiceText: string
      storyTitle: string
      chapterNumber: number
      recentVolume: string
      totalBets: number
      totalVolume: string
    }
    const trendingChoices = await prisma.$queryRawUnsafe(trendingChoicesQuery, oneHourAgo) as TrendingChoiceRow[]

    // Calculate momentum (percentage of total volume from last hour)
    const formattedTrendingChoices = trendingChoices.map((choice) => {
      const recentVol = parseFloat(choice.recentVolume)
      const totalVol = parseFloat(choice.totalVolume)
      const momentum = totalVol > 0 ? (recentVol / totalVol) * 100 : 0

      return {
        choiceId: choice.choiceId,
        choiceText: choice.choiceText,
        storyTitle: choice.storyTitle,
        chapterNumber: choice.chapterNumber,
        recentVolume: recentVol,
        totalBets: choice.totalBets,
        momentum,
      }
    })

    return NextResponse.json({
      hotPools: hotPools.map((pool) => ({
        ...pool,
        recentBets: Number(pool.recentBets),
        totalPool: parseFloat(pool.totalPool),
      })),
      trendingChoices: formattedTrendingChoices,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Trending API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trending data' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
