import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateNVI, getMockAIPredictions } from '@/lib/nvi/calculator';

interface BettingPool {
  id: string;
  chapterId: string;
  totalPool: any;
  closesAt: Date;
  chapter: {
    id: string;
    chapterNumber: number;
    story: {
      id: string;
      title: string;
    };
  };
  bets: Array<{
    choiceId: string;
    amount: any;
  }>;
}

/**
 * GET /api/nvi/dashboard
 * 
 * Returns NVI dashboard data:
 * - Current NVI scores for active chapters
 * - Available options (calls/puts)
 * - Trending volatility changes
 * - Market stats
 */
export async function GET(request: NextRequest) {
  try {
    // Get active betting pools (chapters with open pools)
    const activePools = await prisma.bettingPool.findMany({
      where: {
        closesAt: {
          gt: new Date(),
        },
      },
      include: {
        chapter: {
          include: {
            story: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
        bets: {
          select: {
            choiceId: true,
            amount: true,
          },
        },
      },
      orderBy: {
        totalPool: 'desc',
      },
      take: 20, // Top 20 active pools
    });

    // Calculate NVI for each pool
    const nviScores = await Promise.all(
      activePools.map(async (pool: BettingPool) => {
        try {
          // Get betting distribution
          const bettingPool = pool.bets.map((bet: { choiceId: string; amount: any }) => ({
            choiceId: bet.choiceId,
            amount: Number(bet.amount),
          }));

          // Get choices for this chapter
          const chapter = await prisma.chapter.findUnique({
            where: { id: pool.chapterId },
            include: {
              choices: true,
            },
          });

          if (!chapter) return null;

          const chapterData = {
            chapterId: pool.chapterId,
            choices: chapter.choices.map((c: { id: string; text: string }) => ({
              id: c.id,
              text: c.text,
            })),
            bettingPool,
          };

          // Get AI predictions (mock for now - in production, call AI models)
          const aiPredictions = await getMockAIPredictions(chapterData);

          // Calculate NVI
          const nvi = await calculateNVI(chapterData, aiPredictions);

          return {
            chapterId: pool.chapterId,
            poolId: pool.id,
            storyTitle: pool.chapter.story.title,
            chapterNumber: pool.chapter.chapterNumber,
            nviValue: nvi.nviValue,
            entropy: nvi.entropy,
            aiVariance: nvi.aiVariance,
            confidence: nvi.confidence,
            totalPool: Number(pool.totalPool),
            closesAt: pool.closesAt,
            urgency: getUrgencyLevel(pool.closesAt),
          };
        } catch (error) {
          console.error(`Error calculating NVI for pool ${pool.id}:`, error);
          return null;
        }
      })
    );

    // Filter out nulls and sort by NVI (highest volatility first)
    type NVIScoreType = NonNullable<typeof nviScores[0]>;
    const validNVIScores = nviScores
      .filter((score): score is NVIScoreType => score !== null)
      .sort((a: NVIScoreType, b: NVIScoreType) => b.nviValue - a.nviValue);

    // Calculate market stats
    const marketStats = {
      totalPools: validNVIScores.length,
      avgNVI: validNVIScores.reduce((sum: number, s: NVIScoreType) => sum + s.nviValue, 0) / validNVIScores.length || 0,
      highestNVI: Math.max(...validNVIScores.map((s: NVIScoreType) => s.nviValue), 0),
      lowestNVI: Math.min(...validNVIScores.map((s: NVIScoreType) => s.nviValue), 100),
      totalVolume: validNVIScores.reduce((sum: number, s: NVIScoreType) => sum + s.totalPool, 0),
      volatileStories: validNVIScores.filter((s: NVIScoreType) => s.nviValue >= 70).length, // High volatility
      stableStories: validNVIScores.filter((s: NVIScoreType) => s.nviValue <= 40).length,   // Low volatility
    };

    // Get trending volatility (compare to 1 hour ago)
    // TODO: Implement historical NVI tracking for momentum calculation
    const trending = validNVIScores.slice(0, 5).map((score: NVIScoreType) => ({
      ...score,
      momentum: 0, // Placeholder - will calculate from historical data
    }));

    return NextResponse.json({
      success: true,
      data: {
        nviScores: validNVIScores,
        marketStats,
        trending,
      },
    });
  } catch (error) {
    console.error('Error fetching NVI dashboard:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch NVI dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate urgency level based on time until pool closes
 */
function getUrgencyLevel(closesAt: Date): 'calm' | 'moderate' | 'high' | 'critical' {
  const now = new Date();
  const hoursUntilClose = (closesAt.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilClose > 24) return 'calm';
  if (hoursUntilClose > 12) return 'moderate';
  if (hoursUntilClose > 1) return 'high';
  return 'critical';
}
