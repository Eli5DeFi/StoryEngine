/**
 * Narrative Insurance Protocol (NIP) - Type Definitions
 * Innovation Cycle #47 - "The Living Story Protocol"
 *
 * Readers can hedge against story outcomes they fear.
 * Underwriters earn yield by backing narrative risk pools.
 */

// ============================================================================
// ENUMS
// ============================================================================

export enum InsuranceEventStatus {
  OPEN = 'OPEN', // Accepting policies & underwriting
  SETTLED_OCCURRED = 'SETTLED_OCCURRED', // Event happened → payouts made
  SETTLED_DID_NOT_OCCUR = 'SETTLED_DID_NOT_OCCUR', // Event didn't happen → underwriters rewarded
  EXPIRED = 'EXPIRED', // Deadline passed, not yet settled
}

export enum PolicyStatus {
  ACTIVE = 'ACTIVE',
  CLAIMED = 'CLAIMED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum StakeStatus {
  ACTIVE = 'ACTIVE',
  WITHDRAWN = 'WITHDRAWN',
}

export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

// ============================================================================
// CORE MODELS
// ============================================================================

export interface InsuranceEvent {
  id: string
  chapterId: string
  storyId: string
  characterId: string

  // Display info
  description: string // e.g. "Captain Zara executed in Chapter 15"
  characterName: string
  storyTitle: string
  chapterNumber: number
  characterAvatar?: string

  // Financials
  premiumRateBps: number // Basis points: 1500 = 15%
  totalCoverage: number // USDC (6 decimals)
  totalPremiums: number // USDC (6 decimals)
  underwriterPool: number // USDC (6 decimals)

  // Risk info
  riskTier: RiskTier
  impliedSurvivalProbability: number // 0-100 percentage

  // Timing
  createdAt: string
  deadline: string // ISO timestamp when betting closes

  // Status
  status: InsuranceEventStatus

  // Stats
  policyCount: number
  underwriterCount: number
  maxCoverage: number // USDC capacity remaining
}

export interface InsurancePolicy {
  id: string
  eventId: string
  event?: InsuranceEvent

  // Owner
  policyholderAddress: string

  // Financials
  coverage: number // USDC coverage amount
  premium: number // USDC premium paid
  potentialPayout: number // Same as coverage if event occurs

  // Timing
  purchasedAt: string
  expiresAt: string

  // Status
  status: PolicyStatus
  claimedAt?: string
  payout?: number
}

export interface UnderwriterStake {
  id: string
  eventId: string
  event?: InsuranceEvent

  // Owner
  underwriterAddress: string

  // Financials
  staked: number // USDC staked
  earnedPremiums: number // USDC earned so far
  estimatedAPY: number // Percentage

  // Timing
  stakedAt: string

  // Status
  status: StakeStatus
  withdrawnAt?: string
}

// ============================================================================
// API REQUEST / RESPONSE TYPES
// ============================================================================

export interface BuyCoverageRequest {
  eventId: string
  coverage: number // USDC amount
  walletAddress: string
  txHash?: string // On-chain tx if using smart contract
}

export interface BuyCoverageResponse {
  policyId: string
  eventId: string
  coverage: number
  premium: number
  expiresAt: string
  message: string
}

export interface UnderwriteRequest {
  eventId: string
  amount: number // USDC to stake
  walletAddress: string
  txHash?: string
}

export interface UnderwriteResponse {
  stakeId: string
  eventId: string
  staked: number
  estimatedAPY: number
  message: string
}

export interface InsuranceEventsResponse {
  events: InsuranceEvent[]
  total: number
  page: number
  limit: number
}

export interface UserPositionsResponse {
  policies: InsurancePolicy[]
  stakes: UnderwriterStake[]
  totalCoverageOwned: number
  totalPremiumsPaid: number
  totalStaked: number
  totalEarned: number
}

export interface InsuranceStatsResponse {
  totalEventsOpen: number
  totalCoverageOutstanding: number
  totalUnderwriterCapital: number
  totalPoliciesActive: number
  platformEarnings: number
  avgPremiumRate: number
  claimsRatio: number // % of events that resulted in payouts
}

// ============================================================================
// HELPERS
// ============================================================================

export function premiumRateBpsToPercent(bps: number): number {
  return bps / 100
}

export function calcPremium(coverage: number, premiumRateBps: number): number {
  return Math.floor((coverage * premiumRateBps) / 10000)
}

export function impliedSurvivalProbability(premiumRateBps: number): number {
  // If premium rate is 15% → market implies 85% survival probability
  return Math.max(0, Math.min(100, 100 - premiumRateBps / 100))
}

export function getRiskTier(premiumRateBps: number): RiskTier {
  if (premiumRateBps <= 1000) return 'LOW' // ≤10%
  if (premiumRateBps <= 2500) return 'MEDIUM' // 10-25%
  if (premiumRateBps <= 5000) return 'HIGH' // 25-50%
  return 'EXTREME' // >50%
}

export function formatUSDC(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`
  return `$${amount.toFixed(2)}`
}

export function timeUntil(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return 'Closed'
  const hours = Math.floor(diff / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  if (hours > 48) return `${Math.floor(hours / 24)}d remaining`
  if (hours > 0) return `${hours}h ${minutes}m remaining`
  return `${minutes}m remaining`
}
