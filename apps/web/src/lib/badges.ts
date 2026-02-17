import { prisma } from '@/lib/prisma'

/**
 * Check and award badges for a user after placing a bet
 */
export async function checkAndAwardBadges(userId: string) {
  try {
    // Get user stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        bets: {
          orderBy: { createdAt: 'desc' },
        },
        badges: {
          include: { badge: true },
        },
      },
    })

    if (!user) return

    // Calculate total wagered
    const totalWagered = user.bets.reduce(
      (sum: number, bet: { amount: any }) => sum + parseFloat(bet.amount.toString()),
      0
    )

    // Calculate total profit
    const totalProfit = user.bets.reduce(
      (sum: number, bet: { isWinner: boolean; payout: any; amount: any }) =>
        sum +
        (bet.isWinner
          ? parseFloat((bet.payout || 0).toString()) - parseFloat(bet.amount.toString())
          : -parseFloat(bet.amount.toString())),
      0
    )

    // Get existing badge IDs
    const existingBadgeIds = user.badges.map(ub => ub.badgeId)

    // Get all badges
    const allBadges = await prisma.badge.findMany()

    // Check each badge
    for (const badge of allBadges) {
      // Skip if already earned
      if (existingBadgeIds.includes(badge.id)) continue

      let shouldAward = false

      switch (badge.criteriaType) {
        case 'WINS':
          const winningBets = user.bets.filter(b => b.isWinner).length
          shouldAward = winningBets >= (badge.criteriaValue || 0)
          break

        case 'STREAK':
          shouldAward = user.currentStreak >= (badge.criteriaValue || 0)
          break

        case 'PROFIT':
          shouldAward = totalProfit >= (badge.criteriaValue || 0)
          break

        case 'VOLUME':
          shouldAward = totalWagered >= (badge.criteriaValue || 0)
          break

        case 'BETS':
          shouldAward = user.totalBets >= (badge.criteriaValue || 0)
          break

        case 'SPECIAL':
          // Manual badges, don't auto-award
          break
      }

      // Award badge
      if (shouldAward) {
        await prisma.userBadge.create({
          data: {
            userId: user.id,
            badgeId: badge.id,
          },
        })
      }
    }
  } catch (error) {
    console.error('Badge check error:', error)
  } finally {
  }
}

/**
 * Update user streak after bet resolution
 */
export async function updateUserStreak(userId: string, won: boolean) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) return

    const now = new Date()
    const lastBetDate = user.lastBetDate

    // Check if this is a new day (reset streak if more than 1 day gap)
    const daysSinceLastBet = lastBetDate
      ? Math.floor((now.getTime() - lastBetDate.getTime()) / (1000 * 60 * 60 * 24))
      : 999

    let newStreak = user.currentStreak

    if (won) {
      // Increment streak if same day or consecutive day
      if (daysSinceLastBet <= 1) {
        newStreak += 1
      } else {
        newStreak = 1 // Reset to 1 if gap > 1 day
      }
    } else {
      // Reset streak on loss
      newStreak = 0
    }

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(user.longestStreak, newStreak),
        lastBetDate: now,
      },
    })
  } catch (error) {
    console.error('Streak update error:', error)
  } finally {
  }
}
