import { Decimal } from '@prisma/client/runtime/library'

/**
 * Database utility functions
 */

/**
 * Convert Decimal to number (for JSON serialization)
 */
export function decimalToNumber(decimal: Decimal): number {
  return decimal.toNumber()
}

/**
 * Convert Decimal to string (for display)
 */
export function decimalToString(decimal: Decimal, decimals: number = 6): string {
  return decimal.toFixed(decimals)
}

/**
 * Calculate odds for a choice
 */
export function calculateOdds(choiceBets: number, totalPool: number): number {
  if (choiceBets === 0) return 0
  return totalPool / choiceBets
}

/**
 * Calculate payout for a winning bet
 */
export function calculatePayout(
  betAmount: number,
  choiceBets: number,
  totalPool: number,
  winnerShare: number = 0.85 // 85% to winners
): number {
  if (choiceBets === 0) return 0
  const winningPool = totalPool * winnerShare
  return (betAmount / choiceBets) * winningPool
}

/**
 * Calculate platform fees
 */
export function calculateFees(totalPool: number): {
  winnerShare: number
  treasuryCut: number
  devCut: number
} {
  const winnerShare = totalPool * 0.85  // 85% to winners
  const treasuryCut = totalPool * 0.125 // 12.5% to treasury
  const devCut = totalPool * 0.025      // 2.5% to dev

  return {
    winnerShare,
    treasuryCut,
    devCut,
  }
}

/**
 * Format wallet address (truncate)
 */
export function formatAddress(address: string, chars: number = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

/**
 * Calculate reading time (words per minute)
 */
export function calculateReadingTime(wordCount: number, wpm: number = 200): number {
  return Math.ceil(wordCount / wpm)
}

/**
 * Generate username from wallet address
 */
export function generateUsername(walletAddress: string): string {
  return `user_${walletAddress.slice(2, 8)}`
}

/**
 * Check if betting pool is currently open
 */
export function isPoolOpen(opensAt: Date, closesAt: Date): boolean {
  const now = new Date()
  return now >= opensAt && now < closesAt
}

/**
 * Time remaining until pool closes
 */
export function timeRemaining(closesAt: Date): {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number // milliseconds
} {
  const now = new Date()
  const total = closesAt.getTime() - now.getTime()

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 }
  }

  const seconds = Math.floor((total / 1000) % 60)
  const minutes = Math.floor((total / 1000 / 60) % 60)
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24)
  const days = Math.floor(total / (1000 * 60 * 60 * 24))

  return { days, hours, minutes, seconds, total }
}

/**
 * Format time remaining as string
 */
export function formatTimeRemaining(closesAt: Date): string {
  const { days, hours, minutes } = timeRemaining(closesAt)

  if (days > 0) {
    return `${days}d ${hours}h`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m`
  } else {
    return 'Closing soon'
  }
}
