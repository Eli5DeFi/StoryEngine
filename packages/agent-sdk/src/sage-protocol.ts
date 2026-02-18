/**
 * Voidborne — Sage Staking Protocol (SSP)
 * Innovation Cycle #50 — February 18, 2026
 *
 * Reputation-as-asset system where prediction accuracy is tracked on-chain
 * and unlocks Sage tiers. High-accuracy bettors can "stake" their skill to
 * earn passive yield from less-skilled players (Wisdom Pool).
 *
 * Tiers:
 *   0 Wanderer    — < 10 bets
 *   1 Seeker      — 40%+ accuracy, 10+ bets
 *   2 Cartographer— 55%+ accuracy, 50+ bets, 5-streak
 *   3 Oracle      — 65%+ accuracy, 200+ bets, 10-streak
 *   4 Sage        — 75%+ accuracy, 500+ bets, 20-streak
 *   5 Architect   — Top 10 all-time accuracy, 1000+ bets
 */

import { formatUnits, parseUnits, type Address } from 'viem'

// ============================================================================
// TYPES
// ============================================================================

export type SageTier = 0 | 1 | 2 | 3 | 4 | 5

export interface TierConfig {
  tier: SageTier
  name: string
  emoji: string
  minAccuracy: number
  minBets: number
  minStreak: number
  feeDiscount: number       // % discount on betting fees
  earlyAccessHours: number  // hours before chapter opens to public
  governanceVotes: number
  wisdomPoolAPY: number     // % APY from Wisdom Pool (0 = not staking-eligible)
}

export const TIER_CONFIGS: TierConfig[] = [
  { tier: 0, name: 'Wanderer',      emoji: '🧭', minAccuracy: 0,    minBets: 0,    minStreak: 0,  feeDiscount: 0,  earlyAccessHours: 0,  governanceVotes: 0,   wisdomPoolAPY: 0  },
  { tier: 1, name: 'Seeker',        emoji: '🔍', minAccuracy: 0.40, minBets: 10,   minStreak: 0,  feeDiscount: 5,  earlyAccessHours: 0,  governanceVotes: 0,   wisdomPoolAPY: 0  },
  { tier: 2, name: 'Cartographer',  emoji: '🗺️', minAccuracy: 0.55, minBets: 50,   minStreak: 5,  feeDiscount: 10, earlyAccessHours: 1,  governanceVotes: 1,   wisdomPoolAPY: 0  },
  { tier: 3, name: 'Oracle',        emoji: '🔮', minAccuracy: 0.65, minBets: 200,  minStreak: 10, feeDiscount: 15, earlyAccessHours: 6,  governanceVotes: 5,   wisdomPoolAPY: 2  },
  { tier: 4, name: 'Sage',          emoji: '🧙', minAccuracy: 0.75, minBets: 500,  minStreak: 20, feeDiscount: 20, earlyAccessHours: 24, governanceVotes: 25,  wisdomPoolAPY: 8  },
  { tier: 5, name: 'Architect',     emoji: '🏛️', minAccuracy: 0.82, minBets: 1000, minStreak: 0,  feeDiscount: 25, earlyAccessHours: 48, governanceVotes: 100, wisdomPoolAPY: 15 },
]

export interface PlayerStats {
  walletAddress: Address
  totalBets: number
  wonBets: number
  currentStreak: number
  longestStreak: number
  accuracyRate: number       // wonBets / totalBets
  currentTier: SageTier
  tierConfig: TierConfig
  totalWagered: bigint       // USDC (6 decimals)
  totalWon: bigint
  netPnl: bigint
  wisdomPoolStake: bigint    // current stake in Wisdom Pool (if eligible)
  wisdomPoolEarned: bigint   // lifetime Wisdom Pool earnings
  lastBetAt: Date | null
  tierProgressPercent: number  // 0-100% progress to next tier
}

export interface WisdomPool {
  totalStaked: bigint              // total USDC staked by Sages
  availableRewards: bigint         // accrued from mentored betting premiums
  stakes: Map<Address, bigint>     // individual stakes
  lastDistributionAt: Date
  cumulativeYield: bigint          // total ever distributed
}

export interface MentoredBet {
  bettor: Address
  poolId: string
  choiceId: string
  baseAmount: bigint
  premiumPaid: bigint    // 1% of baseAmount
  tier: SageTier
}

// ============================================================================
// SAGE PROTOCOL ENGINE
// ============================================================================

export class SageProtocolEngine {
  private playerStats: Map<Address, PlayerStats> = new Map()
  private wisdomPool: WisdomPool = {
    totalStaked: 0n,
    availableRewards: 0n,
    stakes: new Map(),
    lastDistributionAt: new Date(),
    cumulativeYield: 0n,
  }
  private topArchitects: Address[] = []  // top 10 by accuracy (for Tier 5)

  // ============================================================================
  // PLAYER STATS
  // ============================================================================

  /**
   * Initialize or retrieve player stats.
   */
  getOrCreateStats(walletAddress: Address): PlayerStats {
    if (!this.playerStats.has(walletAddress)) {
      this.playerStats.set(walletAddress, this.blankStats(walletAddress))
    }
    return this.playerStats.get(walletAddress)!
  }

  /**
   * Record a resolved bet and update all stats.
   */
  recordBetOutcome(
    walletAddress: Address,
    wagered: bigint,
    won: boolean,
    payout: bigint
  ): PlayerStats {
    const stats = this.getOrCreateStats(walletAddress)

    stats.totalBets++
    stats.totalWagered += wagered

    if (won) {
      stats.wonBets++
      stats.currentStreak++
      stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak)
      stats.totalWon += payout
    } else {
      stats.currentStreak = 0
      stats.totalWon += 0n
    }

    stats.accuracyRate = stats.totalBets > 0 ? stats.wonBets / stats.totalBets : 0
    stats.netPnl = stats.totalWon - stats.totalWagered
    stats.lastBetAt = new Date()

    // Recompute tier
    stats.currentTier = this.computeTier(stats, walletAddress)
    stats.tierConfig = TIER_CONFIGS[stats.currentTier]
    stats.tierProgressPercent = this.computeProgressToNextTier(stats)

    this.playerStats.set(walletAddress, stats)
    this.refreshArchitectLeaderboard()
    return stats
  }

  /**
   * Compute what tier a player is at based on their stats.
   */
  computeTier(stats: PlayerStats, walletAddress: Address): SageTier {
    // Check Architect first (top 10 all-time)
    if (
      this.topArchitects.includes(walletAddress)
      && stats.accuracyRate >= TIER_CONFIGS[5].minAccuracy
      && stats.totalBets >= TIER_CONFIGS[5].minBets
    ) {
      return 5
    }

    // Check Sage → Oracle → Cartographer → Seeker → Wanderer
    for (let tier = 4; tier >= 1; tier--) {
      const config = TIER_CONFIGS[tier]
      if (
        stats.accuracyRate >= config.minAccuracy
        && stats.totalBets >= config.minBets
        && stats.longestStreak >= config.minStreak
      ) {
        return tier as SageTier
      }
    }

    return 0
  }

  /**
   * Progress percentage toward the next tier.
   */
  computeProgressToNextTier(stats: PlayerStats): number {
    if (stats.currentTier === 5) return 100

    const next = TIER_CONFIGS[stats.currentTier + 1]
    const current = TIER_CONFIGS[stats.currentTier]

    // Weighted progress across all requirements
    const scores: number[] = []

    // Accuracy progress
    const accBase = current.minAccuracy
    const accTarget = next.minAccuracy
    if (accTarget > accBase) {
      scores.push(Math.min((stats.accuracyRate - accBase) / (accTarget - accBase), 1))
    }

    // Bet count progress
    const betBase = current.minBets
    const betTarget = next.minBets
    if (betTarget > betBase) {
      scores.push(Math.min((stats.totalBets - betBase) / (betTarget - betBase), 1))
    }

    // Streak progress
    if (next.minStreak > 0) {
      scores.push(Math.min(stats.longestStreak / next.minStreak, 1))
    }

    if (scores.length === 0) return 100
    const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length
    return Math.round(avg * 100)
  }

  // ============================================================================
  // WISDOM POOL
  // ============================================================================

  /**
   * A player opts into Wisdom Pool staking (requires Tier 3+).
   * Their staked $FORGE earns yield from mentored betting premiums.
   */
  stakeInWisdomPool(walletAddress: Address, amount: bigint): void {
    const stats = this.getOrCreateStats(walletAddress)

    if (stats.currentTier < 3) {
      throw new Error(`Wisdom Pool requires Oracle tier (3) or higher. Current: ${TIER_CONFIGS[stats.currentTier].name}`)
    }

    const current = this.wisdomPool.stakes.get(walletAddress) ?? 0n
    this.wisdomPool.stakes.set(walletAddress, current + amount)
    this.wisdomPool.totalStaked += amount

    stats.wisdomPoolStake = current + amount
    this.playerStats.set(walletAddress, stats)
  }

  /**
   * Record a mentored bet premium (1% from a Tier 0-2 player's bet).
   * In production, called by the betting smart contract.
   */
  recordMentoredPremium(premium: bigint): void {
    // Platform takes 20%, rest goes to Wisdom Pool
    const platformFee = (premium * 20n) / 100n
    const poolContribution = premium - platformFee
    this.wisdomPool.availableRewards += poolContribution
  }

  /**
   * Distribute Wisdom Pool rewards proportionally to stakers.
   * Called daily/weekly by cron job.
   */
  distributeWisdomPoolRewards(): Array<{ walletAddress: Address; reward: bigint }> {
    if (this.wisdomPool.availableRewards === 0n || this.wisdomPool.totalStaked === 0n) {
      return []
    }

    const rewards: Array<{ walletAddress: Address; reward: bigint }> = []

    for (const [address, stake] of this.wisdomPool.stakes) {
      if (stake === 0n) continue
      const reward = (this.wisdomPool.availableRewards * stake) / this.wisdomPool.totalStaked
      rewards.push({ walletAddress: address, reward })

      // Update player stats
      const stats = this.playerStats.get(address)
      if (stats) {
        stats.wisdomPoolEarned += reward
        this.playerStats.set(address, stats)
      }
    }

    this.wisdomPool.cumulativeYield += this.wisdomPool.availableRewards
    this.wisdomPool.availableRewards = 0n
    this.wisdomPool.lastDistributionAt = new Date()

    return rewards
  }

  /**
   * Estimate APY for a Wisdom Pool staker based on current pool state.
   */
  estimateWisdomPoolAPY(walletAddress: Address): number {
    const stats = this.getOrCreateStats(walletAddress)
    if (stats.wisdomPoolStake === 0n || this.wisdomPool.totalStaked === 0n) return 0

    // Use tier-based APY guarantee as floor
    const tierAPY = TIER_CONFIGS[stats.currentTier].wisdomPoolAPY
    return tierAPY
  }

  // ============================================================================
  // FEE DISCOUNTS
  // ============================================================================

  /**
   * Calculate effective betting fee after Sage tier discount.
   * Base fee: 2.5%. Sages get up to 25% discount on fees.
   */
  effectiveFee(walletAddress: Address, baseFeePercent = 2.5): number {
    const stats = this.getOrCreateStats(walletAddress)
    const discount = TIER_CONFIGS[stats.currentTier].feeDiscount / 100
    return baseFeePercent * (1 - discount)
  }

  /**
   * Check if player has early access to a chapter's betting window.
   */
  hasEarlyAccess(walletAddress: Address, hoursUntilOpen: number): boolean {
    const stats = this.getOrCreateStats(walletAddress)
    return TIER_CONFIGS[stats.currentTier].earlyAccessHours >= hoursUntilOpen
  }

  // ============================================================================
  // LEADERBOARD
  // ============================================================================

  /**
   * Get top N players by accuracy (minimum bet threshold).
   */
  getAccuracyLeaderboard(limit = 10, minBets = 50): PlayerStats[] {
    return Array.from(this.playerStats.values())
      .filter(s => s.totalBets >= minBets)
      .sort((a, b) => b.accuracyRate - a.accuracyRate)
      .slice(0, limit)
  }

  /**
   * Get Wisdom Pool leaderboard (top stakers).
   */
  getWisdomPoolLeaderboard(limit = 10): Array<{ walletAddress: Address; stake: bigint; earned: bigint; apy: number }> {
    return Array.from(this.wisdomPool.stakes.entries())
      .filter(([, stake]) => stake > 0n)
      .map(([address, stake]) => ({
        walletAddress: address,
        stake,
        earned: this.playerStats.get(address)?.wisdomPoolEarned ?? 0n,
        apy: this.estimateWisdomPoolAPY(address),
      }))
      .sort((a, b) => Number(b.stake - a.stake))
      .slice(0, limit)
  }

  // ============================================================================
  // DISPLAY
  // ============================================================================

  /**
   * Generate a Sage card for display / on-chain attestation.
   */
  generateSageCard(walletAddress: Address): string {
    const stats = this.getOrCreateStats(walletAddress)
    const config = stats.tierConfig
    const bars = (val: number, max = 100) => {
      const pct = Math.min(val / max, 1)
      return '█'.repeat(Math.round(pct * 10)).padEnd(10, '░')
    }

    return [
      `${config.emoji} SAGE PROTOCOL — ${config.name.toUpperCase()}`,
      `Wallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
      '',
      `Accuracy:    ${bars(stats.accuracyRate * 100)} ${(stats.accuracyRate * 100).toFixed(1)}%`,
      `Total Bets:  ${stats.totalBets.toLocaleString()}`,
      `Win Streak:  ${stats.currentStreak} (best: ${stats.longestStreak})`,
      `Net PnL:     ${Number(formatUnits(stats.netPnl, 6)) >= 0 ? '+' : ''}${formatUnits(stats.netPnl, 6)} USDC`,
      '',
      `Tier Perks:`,
      `  ✅ Fee Discount: ${config.feeDiscount}%`,
      `  ✅ Early Access: ${config.earlyAccessHours}h before public`,
      `  ✅ Governance Votes: ${config.governanceVotes}`,
      config.wisdomPoolAPY > 0 ? `  ✅ Wisdom Pool APY: ${config.wisdomPoolAPY}%` : `  🔒 Wisdom Pool: Unlock at Oracle tier`,
      '',
      stats.currentTier < 5
        ? `Progress to ${TIER_CONFIGS[stats.currentTier + 1].name}: ${stats.tierProgressPercent}%`
        : '🏛️ Maximum tier achieved',
      stats.wisdomPoolStake > 0n
        ? `Wisdom Pool Staked: ${formatUnits(stats.wisdomPoolStake, 6)} USDC | Earned: ${formatUnits(stats.wisdomPoolEarned, 6)} USDC`
        : config.wisdomPoolAPY > 0 ? 'Join Wisdom Pool to earn passive USDC yield' : '',
    ].filter(Boolean).join('\n')
  }

  // ============================================================================
  // PRIVATE
  // ============================================================================

  private blankStats(walletAddress: Address): PlayerStats {
    return {
      walletAddress,
      totalBets: 0,
      wonBets: 0,
      currentStreak: 0,
      longestStreak: 0,
      accuracyRate: 0,
      currentTier: 0,
      tierConfig: TIER_CONFIGS[0],
      totalWagered: 0n,
      totalWon: 0n,
      netPnl: 0n,
      wisdomPoolStake: 0n,
      wisdomPoolEarned: 0n,
      lastBetAt: null,
      tierProgressPercent: 0,
    }
  }

  private refreshArchitectLeaderboard(): void {
    this.topArchitects = this.getAccuracyLeaderboard(10, 1000)
      .map(s => s.walletAddress)
  }
}

// ============================================================================
// EXAMPLE
// ============================================================================

if (require.main === module) {
  const engine = new SageProtocolEngine()
  const player = '0xAbCd1234AbCd1234AbCd1234AbCd1234AbCd1234' as Address

  // Simulate 60 bets: 75% win rate
  for (let i = 0; i < 60; i++) {
    const won = Math.random() < 0.75
    engine.recordBetOutcome(player, parseUnits('50', 6), won, won ? parseUnits('95', 6) : 0n)
  }

  console.log(engine.generateSageCard(player))
  console.log('\n📊 Top Accuracy Leaderboard:')
  engine.getAccuracyLeaderboard(5, 5).forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.walletAddress.slice(0, 8)}... — ${(s.accuracyRate * 100).toFixed(1)}% (${s.totalBets} bets) — ${s.tierConfig.emoji} ${s.tierConfig.name}`)
  })
}
