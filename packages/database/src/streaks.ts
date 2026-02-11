/**
 * Streak Calculation Utilities
 * Handles prediction streak logic, multipliers, and rewards
 */

export interface StreakTier {
  minWins: number
  maxWins: number | null
  multiplier: number
  displayName: string
  fireEmojis: number
}

export const STREAK_TIERS: StreakTier[] = [
  { minWins: 0, maxWins: 2, multiplier: 1.0, displayName: 'No Streak', fireEmojis: 0 },
  { minWins: 3, maxWins: 4, multiplier: 1.1, displayName: 'Hot Streak', fireEmojis: 2 },
  { minWins: 5, maxWins: 7, multiplier: 1.2, displayName: 'On Fire', fireEmojis: 3 },
  { minWins: 8, maxWins: 12, multiplier: 1.3, displayName: 'Blazing', fireEmojis: 4 },
  { minWins: 13, maxWins: 20, multiplier: 1.5, displayName: 'Inferno', fireEmojis: 5 },
  { minWins: 21, maxWins: null, multiplier: 2.0, displayName: 'LEGEND', fireEmojis: 6 },
]

/**
 * Calculate streak multiplier based on current wins
 */
export function calculateStreakMultiplier(currentStreak: number): number {
  const tier = STREAK_TIERS.find(
    (t) => currentStreak >= t.minWins && (t.maxWins === null || currentStreak <= t.maxWins)
  )
  return tier?.multiplier ?? 1.0
}

/**
 * Get current streak tier info
 */
export function getStreakTier(currentStreak: number): StreakTier {
  const tier = STREAK_TIERS.find(
    (t) => currentStreak >= t.minWins && (t.maxWins === null || currentStreak <= t.maxWins)
  )
  return tier ?? STREAK_TIERS[0]
}

/**
 * Get next milestone info
 */
export function getNextMilestone(currentStreak: number): {
  wins: number
  multiplier: number
  progress: number
} | null {
  const currentTier = getStreakTier(currentStreak)
  const currentIndex = STREAK_TIERS.indexOf(currentTier)
  
  // Already at max tier
  if (currentIndex === STREAK_TIERS.length - 1 && currentTier.maxWins === null) {
    return null
  }
  
  const nextTier = STREAK_TIERS[currentIndex + 1]
  if (!nextTier) return null
  
  const progress = (currentStreak - currentTier.minWins) / (nextTier.minWins - currentTier.minWins)
  
  return {
    wins: nextTier.minWins,
    multiplier: nextTier.multiplier,
    progress: Math.min(progress, 1),
  }
}

/**
 * Calculate streak shield eligibility
 * Earn 1 shield per 10-win streak
 */
export function calculateStreakShields(currentStreak: number): number {
  return Math.floor(currentStreak / 10)
}

/**
 * Apply payout multiplier
 */
export function applyStreakMultiplier(basePayout: number, multiplier: number): number {
  return basePayout * multiplier
}

/**
 * Streak display helpers
 */
export function getFireEmojis(currentStreak: number): string {
  const tier = getStreakTier(currentStreak)
  return '🔥'.repeat(tier.fireEmojis)
}

export function getStreakDisplayText(currentStreak: number): string {
  if (currentStreak === 0) return 'Start your streak!'
  
  const tier = getStreakTier(currentStreak)
  return `${currentStreak}-Win Streak • ${tier.displayName}`
}
