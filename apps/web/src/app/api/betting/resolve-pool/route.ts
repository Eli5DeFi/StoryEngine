import { NextRequest, NextResponse } from 'next/server'
import { prisma, calculateStreakMultiplier } from '@voidborne/database'
import { sendBulkNotifications } from '@/lib/notifications'

/**
 * POST /api/betting/resolve-pool
 * 
 * Resolve a betting pool and update user streaks
 * Called after AI makes a decision
 */
export async function POST(request: NextRequest) {
  try {
    const { poolId, winningChoiceId } = await request.json()

    if (!poolId || !winningChoiceId) {
      return NextResponse.json(
        { error: 'Missing poolId or winningChoiceId' },
        { status: 400 }
      )
    }

    // Get pool with all bets
    const pool = await prisma.bettingPool.findUnique({
      where: { id: poolId },
      include: {
        bets: {
          include: {
            user: true,
            choice: true,
          },
        },
        chapter: {
          include: {
            choices: true,
          },
        },
      },
    })

    if (!pool) {
      return NextResponse.json(
        { error: 'Pool not found' },
        { status: 404 }
      )
    }

    if (pool.status === 'RESOLVED') {
      return NextResponse.json(
        { error: 'Pool already resolved' },
        { status: 400 }
      )
    }

    // Calculate payouts and update streaks
    const updates = await prisma.$transaction(async (tx) => {
      // Mark winning bets
      const winningBets = pool.bets.filter(b => b.choiceId === winningChoiceId)
      const losingBets = pool.bets.filter(b => b.choiceId !== winningChoiceId)

      const totalWinningAmount = winningBets.reduce(
        (sum, bet) => sum + Number(bet.amount),
        0
      )

      // 85% of pool goes to winners
      const payoutPool = Number(pool.totalPool) * 0.85

      // Update winning bets and user streaks
      const winnerUpdates = await Promise.all(
        winningBets.map(async (bet) => {
          const betAmount = Number(bet.amount)
          const proportion = betAmount / totalWinningAmount
          const basePayout = payoutPool * proportion

          // Get user's current streak before updating
          const user = await tx.user.findUnique({
            where: { id: bet.userId },
            select: { currentStreak: true, longestStreak: true },
          })

          if (!user) throw new Error(`User ${bet.userId} not found`)

          const newStreak = user.currentStreak + 1
          const newMultiplier = calculateStreakMultiplier(newStreak)
          const finalPayout = basePayout * newMultiplier

          // Award streak shield every 10 wins
          const streakShields = Math.floor(newStreak / 10) - Math.floor(user.currentStreak / 10)

          // Update bet
          await tx.bet.update({
            where: { id: bet.id },
            data: {
              isWinner: true,
              payout: finalPayout,
              // TODO: Add streakMultiplier to Bet model schema
              // streakMultiplier: newMultiplier,
            },
          })

          // Update user streak
          await tx.user.update({
            where: { id: bet.userId },
            data: {
              currentStreak: newStreak,
              longestStreak: Math.max(newStreak, user.longestStreak),
              // TODO: Add streakMultiplier, consecutiveWins, streakShieldsAvailable to User model schema
              // streakMultiplier: newMultiplier,
              // consecutiveWins: { increment: 1 },
              totalWon: { increment: finalPayout },
              lastBetDate: new Date(),
              // Award shields
              // ...(streakShields > 0 && {
              //   streakShieldsAvailable: { increment: streakShields }
              // }),
            },
          })

          return {
            userId: bet.userId,
            walletAddress: bet.user.walletAddress,
            betAmount: betAmount,
            basePayout: basePayout,
            finalPayout: finalPayout,
            streakMultiplier: newMultiplier,
            newStreak: newStreak,
            isNewRecord: newStreak > user.longestStreak,
            shieldsAwarded: streakShields,
          }
        })
      )

      // Update losing bets and break streaks (unless shield used)
      const loserUpdates = await Promise.all(
        losingBets.map(async (bet) => {
          const user = await tx.user.findUnique({
            where: { id: bet.userId },
            select: {
              currentStreak: true,
              // TODO: Add streakShieldsAvailable to User model schema
              // streakShieldsAvailable: true,
            },
          })

          if (!user) throw new Error(`User ${bet.userId} not found`)

          const hadStreak = user.currentStreak > 0
          // TODO: Add streakShieldsAvailable to User model schema
          // const hasShield = user.streakShieldsAvailable > 0

          // TODO: Implement shield usage logic (requires user confirmation)
          // For now, always break streak
          const usedShield = false

          await tx.bet.update({
            where: { id: bet.id },
            data: {
              isWinner: false,
              // TODO: Add wasStreakBroken, usedStreakShield to Bet model schema
              // wasStreakBroken: hadStreak && !usedShield,
              // usedStreakShield: usedShield,
            },
          })

          if (!usedShield) {
            await tx.user.update({
              where: { id: bet.userId },
              data: {
                currentStreak: 0,
                // TODO: Add streakMultiplier to User model schema
                // streakMultiplier: 1.0,
                totalLost: { increment: Number(bet.amount) },
              },
            })
          }

          return {
            userId: bet.userId,
            walletAddress: bet.user.walletAddress,
            streakBroken: hadStreak && !usedShield,
            previousStreak: user.currentStreak,
            usedShield,
          }
        })
      )

      // Update pool status
      await tx.bettingPool.update({
        where: { id: poolId },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          winningChoiceId,
          winnersPaid: payoutPool,
          treasuryCut: Number(pool.totalPool) * 0.125,
          devCut: Number(pool.totalPool) * 0.025,
        },
      })

      // Mark winning choice
      await tx.choice.update({
        where: { id: winningChoiceId },
        data: {
          isChosen: true,
          chosenAt: new Date(),
        },
      })

      return { winnerUpdates, loserUpdates }
    })

    // Send notifications to winners
    if (updates.winnerUpdates.length > 0) {
      await sendBulkNotifications({
        userIds: updates.winnerUpdates.map((u) => u.userId),
        type: 'BET_WON',
        title: '🎉 You won!',
        message: `Your bet on "${pool.chapter.choices.find((c) => c.id === winningChoiceId)?.text}" won! You earned ${updates.winnerUpdates.find((u) => u.userId)?.finalPayout.toFixed(2)} USDC.`,
        link: `/story/${pool.chapter.storyId}`,
        metadata: {
          poolId,
          choiceId: winningChoiceId,
          totalWon: updates.winnerUpdates.reduce((sum, u) => sum + u.finalPayout, 0),
        },
      })
    }

    // Send notifications to losers
    if (updates.loserUpdates.length > 0) {
      await sendBulkNotifications({
        userIds: updates.loserUpdates.map((u) => u.userId),
        type: 'BET_LOST',
        title: 'Better luck next time',
        message: `Your bet didn't win this time. Keep predicting to improve your accuracy!`,
        link: `/story/${pool.chapter.storyId}`,
        metadata: {
          poolId,
          choiceId: winningChoiceId,
          streakBroken: updates.loserUpdates.filter((u) => u.streakBroken).length,
        },
      })
    }

    // Send streak milestone notifications
    const milestoneWinners = updates.winnerUpdates.filter((u) => {
      return u.newStreak % 5 === 0 && u.newStreak > 0 // Every 5 wins
    })

    if (milestoneWinners.length > 0) {
      for (const winner of milestoneWinners) {
        await sendBulkNotifications({
          userIds: [winner.userId],
          type: 'STREAK_MILESTONE',
          title: `🔥 ${winner.newStreak}-Win Streak!`,
          message: `You're on fire! Keep the streak going for ${winner.streakMultiplier}x multipliers.`,
          link: '/dashboard',
          metadata: {
            streak: winner.newStreak,
            multiplier: winner.streakMultiplier,
            isNewRecord: winner.isNewRecord,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      poolId,
      winningChoiceId,
      winners: updates.winnerUpdates.length,
      losers: updates.loserUpdates.length,
      totalPaidOut: updates.winnerUpdates.reduce((sum, u) => sum + u.finalPayout, 0),
      streaksUpdated: updates.winnerUpdates.length + updates.loserUpdates.length,
      newRecords: updates.winnerUpdates.filter(u => u.isNewRecord).length,
      streaksBroken: updates.loserUpdates.filter(u => u.streakBroken).length,
      details: {
        winners: updates.winnerUpdates,
        losers: updates.loserUpdates,
      },
    })
  } catch (error) {
    console.error('Error resolving pool:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
