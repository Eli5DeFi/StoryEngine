/**
 * Combinatorial Betting Client SDK
 * 
 * TypeScript client for interacting with CombinatorialBettingPool contract
 * Enables multi-dimensional narrative betting (parlays, teasers, round robins)
 */

import { ethers, Contract, Signer } from 'ethers'

// ============ TYPES ============

export enum BetType {
  PARLAY = 0,      // All outcomes must occur
  TEASER = 1,      // Adjusted odds
  ROUND_ROBIN = 2, // Multiple parlays
  PROGRESSIVE = 3  // Add legs over time
}

export enum OutcomeType {
  STORY_CHOICE = 0,
  CHARACTER_FATE = 1,
  RELATIONSHIP = 2,
  ITEM_DISCOVERY = 3,
  PLOT_TWIST = 4,
  WORLD_STATE = 5
}

export enum OutcomeStatus {
  PENDING = 0,
  RESOLVED_TRUE = 1,
  RESOLVED_FALSE = 2,
  CANCELLED = 3
}

export interface Outcome {
  outcomeId: number
  outcomeType: OutcomeType
  description: string
  chapterId: number
  choiceId: number
  status: OutcomeStatus
  totalBets: bigint
  numBets: number
}

export interface MultiDimensionalBet {
  betId: number
  bettor: string
  outcomeIds: number[]
  amount: bigint
  combinedOdds: bigint
  betType: BetType
  settled: boolean
  won: boolean
  payout: bigint
  timestamp: number
}

export interface BettingStats {
  totalBetsPlaced: bigint
  totalVolume: bigint
  totalPayouts: bigint
  activeBets: bigint
}

export interface ParlayBuilder {
  outcomes: number[]
  expectedOdds: number
  potentialPayout: bigint
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'
}

// ============ CONTRACT ABI ============

const COMBINATORIAL_POOL_ABI = [
  "function createOutcome(uint8 outcomeType, string calldata description, uint256 chapterId, uint256 choiceId) external returns (uint256)",
  "function resolveOutcome(uint256 outcomeId, bool occurred) external",
  "function placeCombiBet(uint256[] calldata outcomeIds, uint256 amount, uint8 betType) external returns (uint256)",
  "function settleBet(uint256 betId) external",
  "function settleBetBatch(uint256[] calldata betIds) external",
  "function calculateCombinedOdds(uint256[] calldata outcomeIds) external view returns (uint256)",
  "function getOddsForOutcome(uint256 outcomeId) external view returns (uint256)",
  "function getUserBets(address user) external view returns (uint256[])",
  "function getBet(uint256 betId) external view returns (address, uint256[], uint256, uint256, uint8, bool, bool, uint256)",
  "function getOutcome(uint256 outcomeId) external view returns (uint8, string, uint256, uint8, uint256, uint256)",
  "function getStats() external view returns (uint256, uint256, uint256, uint256)",
  "event CombiBetPlaced(uint256 indexed betId, address indexed bettor, uint256[] outcomeIds, uint256 amount, uint256 combinedOdds, uint8 betType)",
  "event BetSettled(uint256 indexed betId, address indexed bettor, bool won, uint256 payout)",
  "event OutcomeResolved(uint256 indexed outcomeId, bool occurred, uint256 timestamp)"
]

// ============ CLIENT ============

export class CombinatorialBettingClient {
  private contract: Contract
  private signer?: Signer
  
  constructor(
    contractAddress: string,
    provider: ethers.Provider,
    signer?: Signer
  ) {
    this.contract = new Contract(
      contractAddress,
      COMBINATORIAL_POOL_ABI,
      signer || provider
    )
    this.signer = signer
  }
  
  // ============ READ FUNCTIONS ============
  
  /**
   * Get current odds for a single outcome
   */
  async getOdds(outcomeId: number): Promise<number> {
    const oddsRaw = await this.contract.getOddsForOutcome(outcomeId)
    return Number(oddsRaw) / 1e18 // Convert from 18 decimals to float
  }
  
  /**
   * Calculate combined odds for multiple outcomes (parlay)
   */
  async calculateParlayOdds(outcomeIds: number[]): Promise<number> {
    const oddsRaw = await this.contract.calculateCombinedOdds(outcomeIds)
    return Number(oddsRaw) / 1e18
  }
  
  /**
   * Get outcome details
   */
  async getOutcome(outcomeId: number): Promise<Outcome> {
    const [outcomeType, description, chapterId, status, totalBets, numBets] = 
      await this.contract.getOutcome(outcomeId)
    
    return {
      outcomeId,
      outcomeType,
      description,
      chapterId: Number(chapterId),
      choiceId: 0, // Not returned by contract
      status,
      totalBets,
      numBets: Number(numBets)
    }
  }
  
  /**
   * Get bet details
   */
  async getBet(betId: number): Promise<MultiDimensionalBet> {
    const [bettor, outcomeIds, amount, combinedOdds, betType, settled, won, payout] = 
      await this.contract.getBet(betId)
    
    return {
      betId,
      bettor,
      outcomeIds: outcomeIds.map((id: bigint) => Number(id)),
      amount,
      combinedOdds,
      betType,
      settled,
      won,
      payout,
      timestamp: 0 // Not returned by contract
    }
  }
  
  /**
   * Get all bets for a user
   */
  async getUserBets(userAddress: string): Promise<number[]> {
    const betIds = await this.contract.getUserBets(userAddress)
    return betIds.map((id: bigint) => Number(id))
  }
  
  /**
   * Get platform statistics
   */
  async getStats(): Promise<BettingStats> {
    const [totalBetsPlaced, totalVolume, totalPayouts, activeBets] = 
      await this.contract.getStats()
    
    return {
      totalBetsPlaced,
      totalVolume,
      totalPayouts,
      activeBets
    }
  }
  
  // ============ WRITE FUNCTIONS ============
  
  /**
   * Place a parlay bet on multiple outcomes
   */
  async placeParlayBet(
    outcomeIds: number[],
    amountUSDC: bigint,
    betType: BetType = BetType.PARLAY
  ): Promise<{ betId: number; txHash: string }> {
    if (!this.signer) throw new Error('Signer required for betting')
    
    const tx = await this.contract.placeCombiBet(outcomeIds, amountUSDC, betType)
    const receipt = await tx.wait()
    
    // Parse betId from event
    const event = receipt.logs.find((log: any) => 
      log.fragment?.name === 'CombiBetPlaced'
    )
    const betId = event ? Number(event.args[0]) : 0
    
    return {
      betId,
      txHash: receipt.hash
    }
  }
  
  /**
   * Settle a bet after outcomes are resolved
   */
  async settleBet(betId: number): Promise<{ won: boolean; payout: bigint; txHash: string }> {
    if (!this.signer) throw new Error('Signer required')
    
    const tx = await this.contract.settleBet(betId)
    const receipt = await tx.wait()
    
    // Parse settlement from event
    const event = receipt.logs.find((log: any) => 
      log.fragment?.name === 'BetSettled'
    )
    
    return {
      won: event?.args[2] || false,
      payout: event?.args[3] || 0n,
      txHash: receipt.hash
    }
  }
  
  /**
   * Settle multiple bets in one transaction
   */
  async settleBetBatch(betIds: number[]): Promise<string> {
    if (!this.signer) throw new Error('Signer required')
    
    const tx = await this.contract.settleBetBatch(betIds)
    const receipt = await tx.wait()
    return receipt.hash
  }
  
  // ============ HELPER FUNCTIONS ============
  
  /**
   * Build a parlay bet with analysis
   */
  async buildParlay(outcomeIds: number[]): Promise<ParlayBuilder> {
    const odds = await this.calculateParlayOdds(outcomeIds)
    
    // Risk assessment
    let risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' = 'LOW'
    if (odds > 50) risk = 'EXTREME'
    else if (odds > 20) risk = 'HIGH'
    else if (odds > 10) risk = 'MEDIUM'
    
    return {
      outcomes: outcomeIds,
      expectedOdds: odds,
      potentialPayout: 0n, // Calculated based on bet amount
      risk
    }
  }
  
  /**
   * Calculate potential payout for a bet amount
   */
  calculatePotentialPayout(
    betAmount: bigint,
    odds: number,
    platformFeeBps: number = 500 // 5%
  ): bigint {
    const grossPayout = (betAmount * BigInt(Math.floor(odds * 1e18))) / BigInt(1e18)
    const fee = (grossPayout * BigInt(platformFeeBps)) / 10000n
    return grossPayout - fee
  }
  
  /**
   * Format odds for display (e.g., 2.5x, 10.3x, 47.2x)
   */
  formatOdds(odds: number): string {
    return `${odds.toFixed(1)}x`
  }
  
  /**
   * Format USDC amount for display (e.g., $1,234.56)
   */
  formatUSDC(amount: bigint): string {
    const dollars = Number(amount) / 1e6
    return `$${dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  
  /**
   * Check if a bet is ready to settle
   */
  async isBetSettleable(betId: number): Promise<boolean> {
    const bet = await this.getBet(betId)
    
    if (bet.settled) return false
    
    // Check if all outcomes are resolved
    for (const outcomeId of bet.outcomeIds) {
      const outcome = await this.getOutcome(outcomeId)
      if (outcome.status === OutcomeStatus.PENDING) {
        return false
      }
    }
    
    return true
  }
  
  /**
   * Estimate win probability based on odds
   */
  estimateWinProbability(odds: number): number {
    // Simplified: probability ≈ 1 / odds
    // Real implementation would use market data
    return Math.min(1, 1 / odds)
  }
  
  /**
   * Calculate expected value of a bet
   */
  calculateExpectedValue(
    betAmount: bigint,
    odds: number,
    winProbability: number
  ): bigint {
    const payout = this.calculatePotentialPayout(betAmount, odds)
    const expectedWin = Number(payout) * winProbability
    const expectedLoss = Number(betAmount) * (1 - winProbability)
    return BigInt(Math.floor(expectedWin - expectedLoss))
  }
  
  // ============ EVENT LISTENERS ============
  
  /**
   * Listen for new bets
   */
  onBetPlaced(callback: (betId: number, bettor: string, odds: number) => void) {
    this.contract.on('CombiBetPlaced', (betId, bettor, outcomeIds, amount, combinedOdds, betType) => {
      callback(Number(betId), bettor, Number(combinedOdds) / 1e18)
    })
  }
  
  /**
   * Listen for bet settlements
   */
  onBetSettled(callback: (betId: number, won: boolean, payout: bigint) => void) {
    this.contract.on('BetSettled', (betId, bettor, won, payout) => {
      callback(Number(betId), won, payout)
    })
  }
  
  /**
   * Listen for outcome resolutions
   */
  onOutcomeResolved(callback: (outcomeId: number, occurred: boolean) => void) {
    this.contract.on('OutcomeResolved', (outcomeId, occurred, timestamp) => {
      callback(Number(outcomeId), occurred)
    })
  }
}

// ============ EXAMPLE USAGE ============

export async function exampleUsage() {
  // Initialize client (read-only)
  const provider = new ethers.JsonRpcProvider('https://base-mainnet.g.alchemy.com/v2/YOUR_KEY')
  const client = new CombinatorialBettingClient(
    '0x...', // Contract address
    provider
  )
  
  // Get odds for single outcome
  const odds = await client.getOdds(1)
  console.log(`Outcome 1 odds: ${client.formatOdds(odds)}`)
  
  // Build a parlay
  const parlay = await client.buildParlay([1, 2, 3])
  console.log(`Parlay odds: ${client.formatOdds(parlay.expectedOdds)} (${parlay.risk} risk)`)
  
  // Calculate potential payout
  const betAmount = 100n * 1000000n // $100 USDC
  const payout = client.calculatePotentialPayout(betAmount, parlay.expectedOdds)
  console.log(`Bet $100 → Potential payout: ${client.formatUSDC(payout)}`)
  
  // Get user's bet history
  const userBets = await client.getUserBets('0x...')
  console.log(`User has ${userBets.length} bets`)
  
  // Get platform stats
  const stats = await client.getStats()
  console.log(`Total volume: ${client.formatUSDC(stats.totalVolume)}`)
}

// ============ ADVANCED STRATEGIES ============

/**
 * Kelly Criterion bet sizing for optimal risk management
 */
export function kellyBetSize(
  bankroll: bigint,
  odds: number,
  winProbability: number,
  fraction: number = 0.25 // Use fractional Kelly (25%) for safety
): bigint {
  const b = odds - 1 // Net odds
  const p = winProbability
  const q = 1 - p
  
  const kellyFraction = (b * p - q) / b
  const safeFraction = kellyFraction * fraction
  
  return BigInt(Math.floor(Number(bankroll) * Math.max(0, safeFraction)))
}

/**
 * Find arbitrage opportunities across multiple outcomes
 */
export async function findArbitrage(
  client: CombinatorialBettingClient,
  outcomeGroups: number[][]
): Promise<{ profit: number; bets: any[] } | null> {
  // Implementation would analyze cross-outcome odds
  // for guaranteed profit opportunities
  return null // Placeholder
}

/**
 * Hedge a parlay bet to lock in profits
 */
export function calculateHedge(
  originalBet: MultiDimensionalBet,
  currentOdds: number[]
): { hedgeAmount: bigint; guaranteedProfit: bigint } {
  // Implementation would calculate optimal hedge bet
  // to guarantee profit regardless of outcome
  return {
    hedgeAmount: 0n,
    guaranteedProfit: 0n
  }
}
