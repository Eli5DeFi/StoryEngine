import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@narrative-forge/database'
import {
  calculateStreakMultiplier,
  getNextMilestone,
  getStreakTier,
  getFireEmojis,
} from '@narrative-forge/database/streaks'

/**
 * GET /api/users/[walletAddress]/streaks
 * 
 * Get user's streak data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { walletAddress: string } }
) {
  try {
    const { walletAddress } = params

    // Get user
    const user = await prisma.user.findUnique({
      where: { walletAddress },
      select: {
        id: true,
        walletAddress: true,
        currentStreak: true,
        longestStreak: true,
        streakMultiplier: true,
        consecutiveWins: true,
        lastBetDate: true,
        streakShieldsAvailable: true,
        bets: {
          where: {
            pool: {
              status: 'RESOLVED'
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10,
          select: {
            id: true,
            isWinner: true,
            amount: true,
            payout: true,
            createdAt: true,
            streakMultiplier: true,
            pool: {
              select: {
                chapter: {
                  select: {
                    story: {
                      select: {
                        title: true
                      }
                    },
                    chapterNumber: true
                  }
                }
              }
            }
          }
        }
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate current tier and next milestone
    const currentTier = getStreakTier(user.currentStreak)
    const nextMilestone = getNextMilestone(user.currentStreak)
    const fireEmojis = getFireEmojis(user.currentStreak)

    // Format recent wins/losses
    const recentBets = user.bets.map(bet => ({
      betId: bet.id,
      won: bet.isWinner,
      amount: bet.amount.toString(),
      payout: bet.payout?.toString() || null,
      timestamp: bet.createdAt,
      streakMultiplier: bet.streakMultiplier,
      story: bet.pool.chapter.story.title,
      chapter: bet.pool.chapter.chapterNumber,
    }))

    return NextResponse.json({
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      multiplier: user.streakMultiplier,
      tier: {
        name: currentTier.displayName,
        fireEmojis: currentTier.fireEmojis,
        visual: fireEmojis,
      },
      nextMilestone: nextMilestone ? {
        wins: nextMilestone.wins,
        multiplier: nextMilestone.multiplier,
        progress: nextMilestone.progress,
        winsNeeded: nextMilestone.wins - user.currentStreak,
      } : null,
      streakShields: user.streakShieldsAvailable,
      lastBetDate: user.lastBetDate,
      recentBets,
      stats: {
        consecutiveWins: user.consecutiveWins,
        totalBetsTracked: user.bets.length,
      }
    })
  } catch (error) {
    console.error('Error fetching streak data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
