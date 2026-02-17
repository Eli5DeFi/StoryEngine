/**
 * @module psychic-oracle/types
 * @description Type definitions for the Voidborne Psychic Consensus Oracle (PCO).
 *
 * The PCO is a two-layer prediction market:
 *   Layer 1 — Story betting (which AI choice will be selected)
 *   Layer 2 — Consensus prediction (will the crowd be right?)
 */

// ─── Core Enums ──────────────────────────────────────────────────────────────

export enum ConsensusPosition {
  /** Betting that the majority story choice will be selected by AI */
  CROWD_BELIEVER = 'crowd_right',
  /** Betting that the minority story choice will be selected — 2× bonus if correct */
  CONTRARIAN     = 'crowd_wrong',
}

export enum PoolStatus {
  OPEN        = 'OPEN',
  CLOSED      = 'CLOSED',  // Betting deadline passed, waiting for resolution
  RESOLVED    = 'RESOLVED',
}

// ─── Story Pool ──────────────────────────────────────────────────────────────

export interface StoryChoice {
  /** 0-indexed choice identifier */
  index: number
  /** Story text for this choice (e.g. "Trust House Meridian") */
  text: string
  /** Total $FORGE wagered on this choice */
  totalBets: bigint
  /** Implied probability (0-100) based on current bets */
  oddsPercent: number
  /** Potential payout multiplier if this choice wins */
  payoutMultiplier: number
}

export interface StoryPool {
  poolId: bigint
  chapterId: bigint
  bettingDeadline: Date
  numChoices: number
  totalBets: bigint
  status: PoolStatus
  choices: StoryChoice[]
  winningChoice?: number
  crowdWasRight?: boolean
}

// ─── Psychic Market ──────────────────────────────────────────────────────────

export interface ConsensusMarket {
  /** Total $FORGE bet that crowd (majority) will be correct */
  crowdRightBets: bigint
  /** Total $FORGE bet by contrarians (minority will win) */
  crowdWrongBets: bigint
  /** Implied % probability that crowd will be correct (from meta-market) */
  crowdRightPercent: number
  /** Bonus multiplier for correct contrarians (always 2×) */
  contraBonusMultiplier: number
  /** Whether this market has been settled */
  resolved: boolean
  /** Post-resolution: was the crowd correct? */
  crowdWasRight?: boolean
  /** Psychic bonus pool seeded from main pool (2%) */
  psychicBonus?: bigint
}

// ─── Psychic Leaderboard ─────────────────────────────────────────────────────

export interface PsychicProfile {
  address: `0x${string}`
  /** ELO-style score (starts at 1000) */
  score: number
  /** Count of correct contrarian predictions (most prestigious) */
  contraryWins: number
  /** Total psychic bets placed */
  totalBets: number
  /** Win percentage (0-100) */
  accuracy: number
  /** Badge tier unlocked by score */
  badge: PsychicBadge
}

export enum PsychicBadge {
  INITIATE    = 'INITIATE',    // score 0-999
  SEER        = 'SEER',        // score 1000-1249
  ORACLE      = 'ORACLE',      // score 1250-1499
  PROPHET     = 'PROPHET',     // score 1500-1749
  VOID_SEER   = 'VOID_SEER',   // score 1750+ (legendary)
}

export function computeBadge(score: number): PsychicBadge {
  if (score >= 1750) return PsychicBadge.VOID_SEER
  if (score >= 1500) return PsychicBadge.PROPHET
  if (score >= 1250) return PsychicBadge.ORACLE
  if (score >= 1000) return PsychicBadge.SEER
  return PsychicBadge.INITIATE
}

// ─── Bet Records ─────────────────────────────────────────────────────────────

export interface MainBet {
  poolId: bigint
  bettor: `0x${string}`
  choice: number
  amount: bigint
  timestamp: Date
  txHash: string
}

export interface PsychicBet {
  poolId: bigint
  bettor: `0x${string}`
  position: ConsensusPosition
  amount: bigint
  timestamp: Date
  txHash: string
}

// ─── Payout Previews ─────────────────────────────────────────────────────────

export interface MainPayoutPreview {
  poolId: bigint
  choice: number
  betAmount: bigint
  /** Expected payout if this choice wins (before fees) */
  expectedPayout: bigint
  /** Effective odds multiplier */
  multiplier: number
  /** Odds of this choice winning (0-100) */
  impliedOdds: number
}

export interface PsychicPayoutPreview {
  poolId: bigint
  position: ConsensusPosition
  betAmount: bigint
  /** Expected payout if crowd believer wins */
  crowdBelieverPayout: bigint
  /** Expected payout if contrarian wins (includes 2× bonus) */
  contrarianPayout: bigint
  /** Current meta-odds that crowd will be right */
  crowdRightOdds: number
}

// ─── Resolution ──────────────────────────────────────────────────────────────

export interface ResolutionResult {
  poolId: bigint
  winningChoice: number
  crowdWasRight: boolean
  winningChoiceBets: bigint
  totalBets: bigint
  /** Contrarian payouts are boosted by CONTRARIAN_MULT (2×) */
  contrarianBoost: number
  txHash: string
  resolvedAt: Date
}

// ─── Contract Config ─────────────────────────────────────────────────────────

export interface PCOConfig {
  /** Contract address on Base (or testnet) */
  contractAddress: `0x${string}`
  /** $FORGE token address */
  forgeTokenAddress: `0x${string}`
  /** Chain ID (8453 = Base mainnet, 84532 = Base Sepolia) */
  chainId: number
  /** Oracle backend address */
  oracleAddress: `0x${string}`
}
