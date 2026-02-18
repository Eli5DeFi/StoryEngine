/**
 * Voidborne Innovation Cycle #51 — Temporal Oracle Markets (TOM)
 *
 * Long-range prediction markets that let readers bet on story outcomes
 * 5-100 chapters in advance, with compounding multipliers based on
 * prediction horizon. Creates long-term engagement and narrative investors.
 *
 * "I've had 500 USDC on 'Void Gate opens by Chapter 50' since Chapter 28."
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type TemporalMarketStatus =
  | 'pending'      // Created but not yet open for bets
  | 'open'         // Accepting bets
  | 'locked'       // Bet window closed, awaiting resolution chapter
  | 'resolving'    // AI is extracting resolution
  | 'resolved'     // Outcome known
  | 'disputed'     // Community challenging AI resolution
  | 'voided'       // Story diverged, market cancelled

export type ResolutionOracleType =
  | 'ai_extract'       // Claude reads the chapter and returns True/False
  | 'sage_vote'        // High-tier Sages vote on outcome
  | 'onchain_state'    // Smart contract state (e.g., Void Gate address ≠ 0x0)
  | 'community_vote'   // Broad community vote (last resort)

export interface TemporalMarket {
  marketId: string
  question: string                // "Will House Valdris hold the throne by Chapter 40?"
  detail: string                  // Extended description for bettors
  openAtChapter: number
  resolveAtChapter: number
  horizon: number                 // resolveAt - openAt
  multiplier: number              // Payout multiplier (based on horizon curve)
  
  // Pool state
  yesPool: bigint                 // USDC staked on YES
  noPool: bigint                  // USDC staked on NO
  totalPool: bigint
  
  // Participation
  yesCount: number
  noCount: number
  
  // Resolution
  resolutionOracleType: ResolutionOracleType
  resolutionCriteria: string      // English criteria fed to AI oracle
  resolutionChapterText?: string  // Filled when resolving
  outcome?: boolean               // true = YES won, false = NO won
  
  status: TemporalMarketStatus
  createdAt: number
  openedAt?: number
  lockedAt?: number
  resolvedAt?: number
  
  // Dispute tracking
  disputeCount: number
  disputeDeadlineMs?: number
}

export interface TemporalBet {
  betId: string
  marketId: string
  bettorAddress: string
  side: 'yes' | 'no'
  amount: bigint                  // USDC (6 decimals)
  appliedMultiplier: number       // Locked in at bet time
  expectedPayout: bigint          // Estimated at bet time
  timestamp: number
  chapterAtBet: number            // Which chapter was current when bet placed
}

export interface TemporalPortfolio {
  address: string
  activeBets: TemporalBet[]
  resolvedBets: Array<TemporalBet & { payout: bigint; won: boolean }>
  totalStaked: bigint
  totalWon: bigint
  totalLost: bigint
  winRate: number
  longestCorrectHorizon: number   // Farthest-ahead correct prediction
  temporalOracleNFT?: string      // NFT token ID if earned
}

export interface DisputeVote {
  voterAddress: string
  marketId: string
  voteOutcome: boolean            // true = YES won, false = NO won
  sageTier: number               // Voter's Sage tier (from Cycle #50 SSP)
  reasoning?: string
  timestamp: number
}

// ─── Horizon Multiplier Curve ─────────────────────────────────────────────────

/**
 * The core of Temporal Markets: higher-horizon bets pay more.
 * Curve is designed to be:
 * - Exciting for 1-5 chapter bets (small premium)
 * - Lucrative for 10-20 chapter bets (real incentive)
 * - Life-changing for 50+ chapter bets (moonshot territory)
 */
export function getHorizonMultiplier(horizon: number): number {
  if (horizon <= 0) return 1.0
  if (horizon === 1) return 1.15
  if (horizon <= 5) return 1.15 + (horizon - 1) * 0.15   // 1.15 → 1.75
  if (horizon <= 10) return 1.75 + (horizon - 5) * 0.35  // 1.75 → 3.50
  if (horizon <= 20) return 3.50 + (horizon - 10) * 0.25 // 3.50 → 6.00
  if (horizon <= 50) return 6.00 + (horizon - 20) * 0.15 // 6.00 → 10.50
  return Math.min(20.0, 10.50 + (horizon - 50) * 0.10)   // 10.50 → 20.00 cap
}

/**
 * Returns a human-readable description of the multiplier tier.
 */
export function getMultiplierTier(multiplier: number): { tier: string; color: string; description: string } {
  if (multiplier < 1.5) return { tier: 'Scout', color: '#94a3b8', description: 'Short-range prediction' }
  if (multiplier < 2.5) return { tier: 'Seer', color: '#34d399', description: 'Near-future oracle' }
  if (multiplier < 4.0) return { tier: 'Prophet', color: '#60a5fa', description: 'Mid-range visionary' }
  if (multiplier < 7.0) return { tier: 'Augur', color: '#a78bfa', description: 'Long-range predictor' }
  if (multiplier < 12.0) return { tier: 'Void Oracle', color: '#f59e0b', description: 'Temporal master' }
  return { tier: 'Timeweaver', color: '#ef4444', description: 'Reality-altering prediction' }
}

// ─── AI Resolution Oracle ─────────────────────────────────────────────────────

export interface OracleResolutionRequest {
  marketId: string
  question: string
  criteria: string
  chapterText: string     // Full resolved chapter text
  storyContext: string    // Summary of story so far
}

export interface OracleResolutionResult {
  outcome: boolean
  confidence: number      // 0-1
  reasoning: string
  quotedEvidence: string  // Direct quote from chapter supporting resolution
  requiresHumanReview: boolean  // Set true if confidence < 0.75
}

export class AIResolutionOracle {
  /**
   * Uses Claude to extract True/False from chapter text.
   * Returns structured resolution with confidence and evidence.
   *
   * In production: this calls the Anthropic API.
   * Demo: returns mock result.
   */
  async resolve(request: OracleResolutionRequest): Promise<OracleResolutionResult> {
    // In production, this would call Claude with a structured prompt:
    /*
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `
          TEMPORAL MARKET RESOLUTION

          Question: "${request.question}"
          Criteria: "${request.criteria}"

          Story context: ${request.storyContext}

          Chapter text to evaluate:
          ${request.chapterText}

          Return JSON:
          {
            "outcome": boolean,     // true if the condition is MET
            "confidence": 0-1,
            "reasoning": "...",
            "quotedEvidence": "direct quote from chapter"
          }
        `
      }],
      system: 'You are a precise narrative oracle. Only return the JSON object, no other text.'
    })
    */

    // Mock resolution for demo
    return {
      outcome: Math.random() > 0.5,
      confidence: 0.85 + Math.random() * 0.14,
      reasoning: `Based on the chapter text, the condition "${request.question.slice(0, 50)}..." is clearly ${Math.random() > 0.5 ? 'met' : 'not met'} as evidenced by the narrative events.`,
      quotedEvidence: `"The heir's decision sealed the fate of House Valdris — there would be no returning from this moment."`,
      requiresHumanReview: false,
    }
  }
}

// ─── Temporal Market Manager ──────────────────────────────────────────────────

export class TemporalMarketManager {
  private markets: Map<string, TemporalMarket> = new Map()
  private bets: Map<string, TemporalBet[]> = new Map()        // marketId → bets
  private portfolios: Map<string, TemporalPortfolio> = new Map()
  private oracle = new AIResolutionOracle()
  private disputeVotes: Map<string, DisputeVote[]> = new Map()

  // Fee structure
  private readonly WINNER_SHARE = 8_500n        // 85% of pool to winners
  private readonly TREASURY_SHARE = 1_250n      // 12.5% to treasury
  private readonly DEV_SHARE = 250n             // 2.5% to dev
  private readonly FEE_DENOMINATOR = 10_000n
  private readonly DISPUTE_WINDOW_MS = 48 * 60 * 60 * 1000  // 48h

  /**
   * Create a new temporal market.
   * Anyone can create a market (with a small creation fee in production).
   */
  createMarket(params: {
    question: string
    detail: string
    openAtChapter: number
    resolveAtChapter: number
    resolutionOracleType?: ResolutionOracleType
    resolutionCriteria: string
  }): TemporalMarket {
    const horizon = params.resolveAtChapter - params.openAtChapter
    if (horizon < 1) throw new Error('Horizon must be at least 1 chapter')

    const marketId = `temporal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const market: TemporalMarket = {
      marketId,
      question: params.question,
      detail: params.detail,
      openAtChapter: params.openAtChapter,
      resolveAtChapter: params.resolveAtChapter,
      horizon,
      multiplier: getHorizonMultiplier(horizon),
      yesPool: 0n,
      noPool: 0n,
      totalPool: 0n,
      yesCount: 0,
      noCount: 0,
      resolutionOracleType: params.resolutionOracleType ?? 'ai_extract',
      resolutionCriteria: params.resolutionCriteria,
      status: 'pending',
      createdAt: Date.now(),
      disputeCount: 0,
    }

    this.markets.set(marketId, market)
    this.bets.set(marketId, [])

    return market
  }

  /**
   * Open a market for betting (called when current chapter reaches openAtChapter).
   */
  openMarket(marketId: string): TemporalMarket {
    const market = this.markets.get(marketId)
    if (!market) throw new Error(`Market ${marketId} not found`)
    if (market.status !== 'pending') throw new Error(`Market already ${market.status}`)

    market.status = 'open'
    market.openedAt = Date.now()
    return market
  }

  /**
   * Place a bet on a temporal market.
   * Multiplier is locked in at bet time (not at resolution).
   */
  placeBet(params: {
    marketId: string
    bettorAddress: string
    side: 'yes' | 'no'
    amount: bigint
    currentChapter: number
  }): TemporalBet {
    const market = this.markets.get(params.marketId)
    if (!market) throw new Error(`Market ${params.marketId} not found`)
    if (market.status !== 'open') throw new Error(`Market is not open for betting`)
    if (params.amount < 1_000_000n) throw new Error('Minimum bet is 1 USDC')

    // Multiplier is the BASE market multiplier; actual payout also depends on parimutuel
    // For simplicity in POC, we track the market's horizon multiplier
    const appliedMultiplier = market.multiplier

    // Estimate payout (pre-settlement estimate)
    const currentPool = (params.side === 'yes' ? market.yesPool : market.noPool) + params.amount
    const totalPoolAfter = market.totalPool + params.amount
    const winnerShare = (totalPoolAfter * this.WINNER_SHARE) / this.FEE_DENOMINATOR
    const estimatedPayout = currentPool > 0n
      ? (params.amount * winnerShare) / currentPool
      : params.amount

    const bet: TemporalBet = {
      betId: `bet_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      marketId: params.marketId,
      bettorAddress: params.bettorAddress,
      side: params.side,
      amount: params.amount,
      appliedMultiplier,
      expectedPayout: BigInt(Math.floor(Number(estimatedPayout) * appliedMultiplier)),
      timestamp: Date.now(),
      chapterAtBet: params.currentChapter,
    }

    // Update pools
    if (params.side === 'yes') {
      market.yesPool += params.amount
      market.yesCount++
    } else {
      market.noPool += params.amount
      market.noCount++
    }
    market.totalPool += params.amount

    const bets = this.bets.get(params.marketId) ?? []
    bets.push(bet)
    this.bets.set(params.marketId, bets)

    // Update portfolio
    const portfolio = this.getOrCreatePortfolio(params.bettorAddress)
    portfolio.activeBets.push(bet)
    portfolio.totalStaked += params.amount

    return bet
  }

  /**
   * Lock market when resolution chapter is reached.
   */
  lockMarket(marketId: string): void {
    const market = this.markets.get(marketId)
    if (!market) throw new Error(`Market ${marketId} not found`)
    market.status = 'locked'
    market.lockedAt = Date.now()
  }

  /**
   * Resolve market using AI oracle after resolution chapter is published.
   */
  async resolveMarket(marketId: string, chapterText: string, storyContext: string): Promise<{
    market: TemporalMarket
    resolution: OracleResolutionResult
    payouts: Map<string, bigint>
  }> {
    const market = this.markets.get(marketId)
    if (!market) throw new Error(`Market ${marketId} not found`)
    if (market.status !== 'locked' && market.status !== 'resolving') {
      throw new Error(`Market must be locked before resolution`)
    }

    market.status = 'resolving'
    market.resolutionChapterText = chapterText

    // Run AI oracle
    const resolution = await this.oracle.resolve({
      marketId,
      question: market.question,
      criteria: market.resolutionCriteria,
      chapterText,
      storyContext,
    })

    if (resolution.requiresHumanReview) {
      market.status = 'disputed'
      market.disputeDeadlineMs = Date.now() + this.DISPUTE_WINDOW_MS
      return { market, resolution, payouts: new Map() }
    }

    // Settle
    const payouts = this.settleMarket(market, resolution.outcome)
    market.outcome = resolution.outcome
    market.status = 'resolved'
    market.resolvedAt = Date.now()

    // Set dispute window (anyone can challenge for 48h)
    market.disputeDeadlineMs = Date.now() + this.DISPUTE_WINDOW_MS

    return { market, resolution, payouts }
  }

  /**
   * Compute payouts for all winners, applying the horizon multiplier.
   */
  private settleMarket(market: TemporalMarket, outcome: boolean): Map<string, bigint> {
    const bets = this.bets.get(market.marketId) ?? []
    const winningSide: 'yes' | 'no' = outcome ? 'yes' : 'no'
    const winnerPool = outcome ? market.yesPool : market.noPool

    const winnerPayout = (market.totalPool * this.WINNER_SHARE) / this.FEE_DENOMINATOR
    const payouts = new Map<string, bigint>()

    for (const bet of bets) {
      if (bet.side !== winningSide) continue
      if (winnerPool === 0n) continue

      // Base parimutuel payout
      const baseShare = (bet.amount * winnerPayout) / winnerPool

      // Apply horizon multiplier (the extra incentive for long-range bets)
      // Multiplier applies only to PROFIT (not principal)
      const profit = baseShare > bet.amount ? baseShare - bet.amount : 0n
      const boostedProfit = BigInt(Math.floor(Number(profit) * bet.appliedMultiplier))
      const totalPayout = bet.amount + boostedProfit

      const current = payouts.get(bet.bettorAddress) ?? 0n
      payouts.set(bet.bettorAddress, current + totalPayout)

      // Update portfolio
      const portfolio = this.getOrCreatePortfolio(bet.bettorAddress)
      const activeBetIdx = portfolio.activeBets.findIndex(b => b.betId === bet.betId)
      if (activeBetIdx !== -1) {
        const [activeBet] = portfolio.activeBets.splice(activeBetIdx, 1)
        portfolio.resolvedBets.push({ ...activeBet, payout: totalPayout, won: true })
        portfolio.totalWon += totalPayout
      }
    }

    // Mark losers in portfolio
    for (const bet of bets) {
      if (bet.side === winningSide) continue
      const portfolio = this.getOrCreatePortfolio(bet.bettorAddress)
      const activeBetIdx = portfolio.activeBets.findIndex(b => b.betId === bet.betId)
      if (activeBetIdx !== -1) {
        const [activeBet] = portfolio.activeBets.splice(activeBetIdx, 1)
        portfolio.resolvedBets.push({ ...activeBet, payout: 0n, won: false })
        portfolio.totalLost += bet.amount
      }
    }

    return payouts
  }

  /**
   * Submit a Sage vote for a disputed market resolution.
   * Requires Sage tier 4+ (from Cycle #50 Sage Staking Protocol).
   */
  submitDisputeVote(vote: DisputeVote): { success: boolean; voteCount: number; leadingOutcome: boolean } {
    const market = this.markets.get(vote.marketId)
    if (!market || market.status !== 'disputed') {
      return { success: false, voteCount: 0, leadingOutcome: false }
    }

    if (vote.sageTier < 4) {
      return { success: false, voteCount: 0, leadingOutcome: false }  // Minimum Sage 4 to vote
    }

    const votes = this.disputeVotes.get(vote.marketId) ?? []
    // Weight votes by sage tier
    votes.push(vote)
    this.disputeVotes.set(vote.marketId, votes)

    // Weighted tally
    const weightedYes = votes.filter(v => v.voteOutcome).reduce((sum, v) => sum + v.sageTier, 0)
    const weightedNo = votes.filter(v => !v.voteOutcome).reduce((sum, v) => sum + v.sageTier, 0)
    const leadingOutcome = weightedYes >= weightedNo

    // Auto-resolve if 10+ Sage votes and clear majority
    const totalWeight = weightedYes + weightedNo
    if (votes.length >= 10 && (weightedYes / totalWeight > 0.7 || weightedNo / totalWeight > 0.7)) {
      const outcome = weightedYes > weightedNo
      this.settleMarket(market, outcome)
      market.outcome = outcome
      market.status = 'resolved'
      market.resolvedAt = Date.now()
    }

    return { success: true, voteCount: votes.length, leadingOutcome }
  }

  /**
   * Get all markets for a given chapter range.
   */
  getMarketsForChapterRange(fromChapter: number, toChapter: number): TemporalMarket[] {
    return Array.from(this.markets.values()).filter(
      m => m.resolveAtChapter >= fromChapter && m.resolveAtChapter <= toChapter
    )
  }

  /**
   * Get a bettor's full temporal portfolio with stats.
   */
  getPortfolio(address: string): TemporalPortfolio {
    const portfolio = this.getOrCreatePortfolio(address)

    // Compute win rate
    const resolved = portfolio.resolvedBets
    portfolio.winRate = resolved.length > 0
      ? resolved.filter(b => b.won).length / resolved.length
      : 0

    // Compute longest correct horizon
    portfolio.longestCorrectHorizon = resolved
      .filter(b => b.won)
      .reduce((max, b) => {
        const market = this.markets.get(b.marketId)
        return Math.max(max, market?.horizon ?? 0)
      }, 0)

    return portfolio
  }

  /**
   * Get the Temporal Oracle Leaderboard.
   * Top predictors across all resolved markets.
   */
  getLeaderboard(topN = 20): Array<{
    rank: number
    address: string
    winRate: number
    totalWon: bigint
    longestHorizon: number
    multiplierTier: string
  }> {
    const allAddresses = new Set<string>()
    for (const bets of this.bets.values()) {
      for (const bet of bets) {
        allAddresses.add(bet.bettorAddress)
      }
    }

    return Array.from(allAddresses)
      .map(addr => {
        const portfolio = this.getPortfolio(addr)
        const maxMultiplier = getHorizonMultiplier(portfolio.longestCorrectHorizon)
        return {
          address: addr,
          winRate: portfolio.winRate,
          totalWon: portfolio.totalWon,
          longestHorizon: portfolio.longestCorrectHorizon,
          multiplierTier: getMultiplierTier(maxMultiplier).tier,
        }
      })
      .filter(p => p.totalWon > 0n)
      .sort((a, b) => {
        // Sort by win rate × total won (combined score)
        const scoreA = a.winRate * Number(a.totalWon)
        const scoreB = b.winRate * Number(b.totalWon)
        return scoreB - scoreA
      })
      .slice(0, topN)
      .map((p, i) => ({ ...p, rank: i + 1 }))
  }

  private getOrCreatePortfolio(address: string): TemporalPortfolio {
    let portfolio = this.portfolios.get(address)
    if (!portfolio) {
      portfolio = {
        address,
        activeBets: [],
        resolvedBets: [],
        totalStaked: 0n,
        totalWon: 0n,
        totalLost: 0n,
        winRate: 0,
        longestCorrectHorizon: 0,
      }
      this.portfolios.set(address, portfolio)
    }
    return portfolio
  }

  getMarket(marketId: string): TemporalMarket | undefined {
    return this.markets.get(marketId)
  }

  getAllMarkets(): TemporalMarket[] {
    return Array.from(this.markets.values())
  }

  getOpenMarkets(): TemporalMarket[] {
    return Array.from(this.markets.values()).filter(m => m.status === 'open')
  }
}

// ─── Demo ─────────────────────────────────────────────────────────────────────

export function runTemporalMarketsDemo(): void {
  console.log('📅 TEMPORAL ORACLE MARKETS — Simulation\n')

  const manager = new TemporalMarketManager()

  // Create three markets with different horizons
  const markets = [
    manager.createMarket({
      question: 'Will House Valdris still hold the Silent Throne by Chapter 40?',
      detail: 'House Valdris currently controls the throne. This market resolves YES if they retain control at Chapter 40 resolution.',
      openAtChapter: 28,
      resolveAtChapter: 40,  // 12-chapter horizon
      resolutionCriteria: 'House Valdris representative is confirmed as throne-holder in the chapter',
    }),
    manager.createMarket({
      question: 'Will the Void Gate open before Chapter 50?',
      detail: 'The Void Gate is referenced throughout the saga. Resolves YES if the Gate opens or is activated in any chapter before or at Chapter 50.',
      openAtChapter: 28,
      resolveAtChapter: 50,  // 22-chapter horizon
      resolutionCriteria: 'The text explicitly describes the Void Gate opening, activating, or being breached',
    }),
    manager.createMarket({
      question: 'Will a non-heir character assume the Silent Throne by Chapter 100?',
      detail: 'This market resolves YES if any character other than the designated heir takes the throne by Chapter 100.',
      openAtChapter: 28,
      resolveAtChapter: 100, // 72-chapter horizon
      resolutionCriteria: 'A character explicitly described as NOT the original heir is confirmed as throne-holder',
    }),
  ]

  for (const market of markets) {
    manager.openMarket(market.marketId)
    const tier = getMultiplierTier(market.multiplier)
    console.log(`📊 Market: "${market.question.slice(0, 50)}..."`)
    console.log(`   Horizon: ${market.horizon} chapters | Multiplier: ${market.multiplier.toFixed(2)}x | Tier: ${tier.tier}`)
  }

  console.log('\n💰 Placing bets...\n')

  // Simulate bets on the markets
  const bettor1 = '0xAlice'
  const bettor2 = '0xBob'

  const bet1 = manager.placeBet({
    marketId: markets[0].marketId,
    bettorAddress: bettor1,
    side: 'yes',
    amount: BigInt(50_000_000),   // 50 USDC
    currentChapter: 28,
  })

  const bet2 = manager.placeBet({
    marketId: markets[1].marketId,
    bettorAddress: bettor1,
    side: 'no',
    amount: BigInt(100_000_000),  // 100 USDC
    currentChapter: 28,
  })

  const bet3 = manager.placeBet({
    marketId: markets[2].marketId,
    bettorAddress: bettor2,
    side: 'yes',
    amount: BigInt(25_000_000),   // 25 USDC
    currentChapter: 28,
  })

  console.log(`${bettor1} bet 50 USDC YES on throne question (horizon: ${markets[0].horizon}, mult: ${bet1.appliedMultiplier.toFixed(2)}x)`)
  console.log(`${bettor1} bet 100 USDC NO on Void Gate question (horizon: ${markets[1].horizon}, mult: ${bet2.appliedMultiplier.toFixed(2)}x)`)
  console.log(`${bettor2} bet 25 USDC YES on non-heir question (horizon: ${markets[2].horizon}, mult: ${bet3.appliedMultiplier.toFixed(2)}x)`)

  console.log('\n📈 Multiplier Curve Demo:')
  const horizons = [1, 5, 10, 15, 20, 30, 50, 72, 100]
  for (const h of horizons) {
    const mult = getHorizonMultiplier(h)
    const tier = getMultiplierTier(mult)
    console.log(`   Horizon ${h.toString().padStart(3)} chapters: ${mult.toFixed(2)}x (${tier.tier})`)
  }

  console.log('\n🏆 Temporal Oracle Leaderboard (simulated):')
  console.log('   After market resolution, top predictors appear here')
  console.log('   Ranked by: win rate × total winnings × max horizon achieved')
}
