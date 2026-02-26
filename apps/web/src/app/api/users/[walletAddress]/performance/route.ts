import { NextResponse } from 'next/server'
import { prisma, disconnectPrisma } from "@/lib/prisma"



export const dynamic = 'force-dynamic'

/**
 * GET /api/users/[walletAddress]/performance
 * 
 * Returns user's betting performance analytics:
 * - Profit time series
 * - Win rate trend
 * - Bet distribution by story
 * - ROI by story
 */
export async function GET(
  request: Request,
  { params }: { params: { walletAddress: string } }
) {
  try {
    const { walletAddress } = params
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || 'all'

    // Find user
    const user = await prisma.user.findUnique({
      where: { walletAddress },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const timeframeCutoff = getTimeframeCutoff(timeframe)
    const whereClause = timeframeCutoff
      ? `AND b."createdAt" >= '${timeframeCutoff}'`
      : ''

    // 1. Profit time series (daily cumulative profit)
    const profitTimeSeriesQuery = `
      SELECT 
        DATE(b."createdAt") as date,
        SUM(
          CASE 
            WHEN b."isWinner" = true THEN (b.payout - b.amount)
            ELSE -b.amount
          END
        )::text as "dailyProfit"
      FROM bets b
      WHERE b."userId" = $1
        ${whereClause}
      GROUP BY DATE(b."createdAt")
      ORDER BY date ASC
    `

    type ProfitDataRow = {
      date: Date
      dailyProfit: string
    }
    const profitData = await prisma.$queryRawUnsafe(profitTimeSeriesQuery, user.id) as ProfitDataRow[]

    // Calculate cumulative profit
    let cumulative = 0
    const profitTimeSeries = profitData.map((day) => {
      const daily = parseFloat(day.dailyProfit)
      cumulative += daily
      return {
        date: day.date,
        dailyProfit: daily,
        cumulativeProfit: cumulative,
      }
    })

    // 2. Win rate trend (7-day rolling average)
    const winRateTrendQuery = `
      SELECT 
        DATE(b."createdAt") as date,
        AVG(
          CASE WHEN b."isWinner" = true THEN 1.0 ELSE 0.0 END
        ) OVER (
          ORDER BY DATE(b."createdAt")
          ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
        )::text * 100 as "winRate"
      FROM bets b
      WHERE b."userId" = $1
        ${whereClause}
        AND bp.status = 'RESOLVED'
      GROUP BY DATE(b."createdAt")
      ORDER BY date ASC
    `

    type WinRateDataRow = {
      date: Date
      winRate: string
    }
    const winRateData = await prisma.$queryRawUnsafe(winRateTrendQuery, user.id) as WinRateDataRow[]

    const winRateTrend = winRateData.map((day) => ({
      date: day.date,
      winRate: parseFloat(day.winRate),
    }))

    // 3. Bet distribution by story
    const betDistributionQuery = `
      SELECT 
        s.title as "storyTitle",
        COUNT(b.id)::bigint as "betCount"
      FROM bets b
      JOIN choices c ON b."choiceId" = c.id
      JOIN chapters ch ON c."chapterId" = ch.id
      JOIN stories s ON ch."storyId" = s.id
      WHERE b."userId" = $1
        ${whereClause}
      GROUP BY s.title
      ORDER BY COUNT(b.id) DESC
    `

    type DistributionDataRow = {
      storyTitle: string
      betCount: bigint
    }
    const distributionData = await prisma.$queryRawUnsafe(betDistributionQuery, user.id) as DistributionDataRow[]

    const totalBets = distributionData.reduce(
      (sum: number, story: DistributionDataRow) => sum + Number(story.betCount),
      0
    )

    const betDistribution = distributionData.map((story) => ({
      storyTitle: story.storyTitle,
      betCount: Number(story.betCount),
      percentage: totalBets > 0 ? (Number(story.betCount) / totalBets) * 100 : 0,
    }))

    // 4. ROI by story
    const roiByStoryQuery = `
      SELECT 
        s.title as "storyTitle",
        COUNT(b.id)::bigint as bets,
        SUM(b.amount)::text as wagered,
        SUM(
          CASE 
            WHEN b."isWinner" = true THEN b.payout
            ELSE 0
          END
        )::text as won
      FROM bets b
      JOIN choices c ON b."choiceId" = c.id
      JOIN chapters ch ON c."chapterId" = ch.id
      JOIN stories s ON ch."storyId" = s.id
      WHERE b."userId" = $1
        ${whereClause}
      GROUP BY s.title
      HAVING SUM(b.amount) > 0
      ORDER BY 
        (SUM(CASE WHEN b."isWinner" = true THEN b.payout ELSE 0 END) - SUM(b.amount)) / SUM(b.amount) DESC
    `

    type RoiDataRow = {
      storyTitle: string
      bets: bigint
      wagered: string
      won: string
    }
    const roiData = await prisma.$queryRawUnsafe(roiByStoryQuery, user.id) as RoiDataRow[]

    const roiByStory = roiData.map((story) => {
      const wagered = parseFloat(story.wagered)
      const won = parseFloat(story.won)
      const roi = wagered > 0 ? ((won - wagered) / wagered) * 100 : 0

      return {
        storyTitle: story.storyTitle,
        bets: Number(story.bets),
        roi,
      }
    })

    return NextResponse.json({
      profitTimeSeries,
      winRateTrend,
      betDistribution,
      roiByStory,
      timeframe,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Performance API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    )
  } finally {
    await disconnectPrisma()
  }
}

/**
 * Get SQL timestamp for timeframe filter
 */
function getTimeframeCutoff(timeframe: string): string | null {
  const now = new Date()
  switch (timeframe) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    default:
      return null
  }
}
