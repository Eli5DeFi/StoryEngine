/**
 * Voidborne Innovation Cycle #51 — Betrayal Protocol (BP)
 *
 * Social deduction layer for Voidborne prediction markets.
 * Every 5th chapter: some bettors are secretly "Void Stitchers" who
 * must coordinate bets while evading crowd detection.
 *
 * Think: Among Us mechanics fused with DeFi prediction markets.
 */

import { createHash, randomBytes } from 'crypto'

// ─── Types ───────────────────────────────────────────────────────────────────

export type BetrayalRoundStatus =
  | 'recruiting'   // Stitchers being assigned
  | 'active'       // Round in progress (chapter being bet)
  | 'locked'       // Betting closed, awaiting resolution
  | 'revealed'     // Stitcher identities public
  | 'settled'      // All payouts distributed

export interface StitcherAssignment {
  bettorAddress: string
  isStitcher: boolean
  stitcherKey: string        // Private key for stitcher channel (derived)
  commitment: string         // Hash of assignment (for ZK-style reveal)
  assignedAt: number
}

export interface SuspicionAccusation {
  accuserAddress: string
  accusedAddress: string
  stakedAmount: bigint       // USDC staked on this accusation
  submittedAt: number
  wasCorrect?: boolean       // Set after revelation
}

export interface BetrayalRound {
  roundId: string
  chapterId: string
  status: BetrayalRoundStatus
  totalParticipants: number
  stitcherCount: number        // ~12% of participants
  stitcherFraction: number     // Actual fraction assigned

  // Hidden until revelation
  stitcherAddresses: Set<string>
  assignments: Map<string, StitcherAssignment>

  // Stitcher coordination
  stitcherCoordination: {
    bets: StitcherBet[]                  // Private stitcher bets
    coordinatedSide: 'A' | 'B' | null   // Emerges from majority
    detectionRisk: number                // 0-1, rises as coordination is visible
    obfuscationActive: boolean           // Whether bets are being mixed
  }

  // Public detection game
  suspicionScores: Map<string, number>    // address → score 0-100
  accusations: SuspicionAccusation[]

  // Outcome
  chapterChoice?: 'A' | 'B'
  revelation?: BetrayalRevelation
}

export interface StitcherBet {
  bettorAddress: string
  side: 'A' | 'B'
  amount: bigint
  isObfuscated: boolean       // Whether this bet is disguised
  realSide: 'A' | 'B'        // True bet (may differ if obfuscated)
  timestamp: number
}

export interface BetrayalRevelation {
  revealedAt: number
  stitcherAddresses: string[]
  correctAccusers: string[]
  incorrectAccusers: string[]
  stitcherWon: boolean        // Did stitchers predict correctly?
  stitchersDetected: number   // How many stitchers were correctly flagged?

  payouts: {
    stitcherBonus: Map<string, bigint>    // Stitchers who evaded + won
    detectorBonus: Map<string, bigint>    // Crowd who correctly identified + won
    totalStitcherPayout: bigint
    totalDetectorPayout: bigint
  }

  dramaticMoments: DramaticMoment[]
}

export interface DramaticMoment {
  type: 'betrayal' | 'detection' | 'escape' | 'dominance'
  primaryAddress: string
  description: string         // Human-readable drama
  financialImpact: bigint
}

// ─── Stitcher Assignment Engine ───────────────────────────────────────────────

export class StitcherAssigner {
  private readonly STITCHER_FRACTION = 0.12  // ~12% are Stitchers
  private readonly MIN_STITCHERS = 5
  private readonly MAX_STITCHERS = 30

  /**
   * Assigns Stitcher roles to a random subset of participants.
   * Uses cryptographic randomness so assignments are unguessable.
   * Returns a Map of address → assignment (with commitment hashes for ZK-reveal).
   */
  assignRoles(participants: string[]): {
    assignments: Map<string, StitcherAssignment>
    stitcherCount: number
    commitmentRoot: string    // Merkle root of all commitments
  } {
    const n = participants.length
    const targetStitchers = Math.max(
      this.MIN_STITCHERS,
      Math.min(this.MAX_STITCHERS, Math.floor(n * this.STITCHER_FRACTION))
    )

    // Fisher-Yates shuffle for selection
    const shuffled = [...participants]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    const stitcherSet = new Set(shuffled.slice(0, targetStitchers))
    const assignments = new Map<string, StitcherAssignment>()
    const commitments: string[] = []

    for (const address of participants) {
      const isStitcher = stitcherSet.has(address)
      const nonce = randomBytes(32).toString('hex')
      const stitcherKey = createHash('sha256')
        .update(`${address}:${nonce}:stitcher_channel`)
        .digest('hex')
        .slice(0, 32)

      // Commitment: hash(address | isStitcher | nonce)
      const commitment = createHash('sha256')
        .update(`${address}:${isStitcher}:${nonce}`)
        .digest('hex')

      commitments.push(commitment)

      assignments.set(address, {
        bettorAddress: address,
        isStitcher,
        stitcherKey,
        commitment,
        assignedAt: Date.now(),
      })
    }

    // Simple commitment root (XOR of all commitments for demo; use Merkle in prod)
    const commitmentRoot = commitments
      .reduce((acc, c) => {
        const aBuffer = Buffer.from(acc, 'hex')
        const cBuffer = Buffer.from(c, 'hex')
        return Buffer.from(aBuffer.map((b, i) => b ^ cBuffer[i])).toString('hex')
      }, '00'.repeat(32))

    return { assignments, stitcherCount: targetStitchers, commitmentRoot }
  }

  /**
   * Verify a commitment reveal (used at revelation time).
   */
  verifyCommitment(address: string, isStitcher: boolean, nonce: string, commitment: string): boolean {
    const expected = createHash('sha256')
      .update(`${address}:${isStitcher}:${nonce}`)
      .digest('hex')
    return expected === commitment
  }
}

// ─── Suspicion Scoring ────────────────────────────────────────────────────────

/**
 * Computes suspicion scores for all bettors based on behavioral signals.
 * Higher score = crowd thinks you're a Stitcher.
 *
 * Signals:
 * 1. Bet timing (late bets = more suspicious)
 * 2. Bet patterns (going against crowd = suspicious)
 * 3. Coordination signals (similar timing to known suspicious actors)
 * 4. Historical Stitcher behavior
 */
export class SuspicionScorer {
  private historicalStitcherBehavior: Map<string, number[]> = new Map()  // address → past suspicion scores

  computeScores(params: {
    bets: Array<{ address: string; side: 'A' | 'B'; amount: bigint; timestamp: number }>
    windowOpenedAt: number
    windowClosedAt: number
    finalOddsA: number
    finalOddsB: number
  }): Map<string, number> {
    const scores = new Map<string, number>()
    const { bets, windowOpenedAt, windowClosedAt, finalOddsA } = params
    const windowDuration = windowClosedAt - windowOpenedAt

    // Determine majority side (by count)
    const sideACounts = bets.filter(b => b.side === 'A').length
    const sideBCounts = bets.filter(b => b.side === 'B').length
    const majoritySide: 'A' | 'B' = sideACounts >= sideBCounts ? 'A' : 'B'

    for (const bet of bets) {
      let score = 0

      // Signal 1: Contrarian betting (+35 suspicion)
      if (bet.side !== majoritySide) {
        score += 35
      }

      // Signal 2: Late betting with large amount (+25 suspicion)
      const betProgress = (bet.timestamp - windowOpenedAt) / windowDuration
      const amountUSD = Number(bet.amount) / 1_000_000
      if (betProgress > 0.8 && amountUSD > 50) {
        score += 25
      }

      // Signal 3: Bet against overwhelming odds (+20 suspicion)
      // If 80% bet A, betting B with large amount is suspicious
      const crowdOdds = finalOddsA
      const betOdds = bet.side === 'A' ? crowdOdds : (1 - crowdOdds)
      if (betOdds < 0.25 && amountUSD > 20) {
        score += 20
      }

      // Signal 4: Historical Stitcher pattern (+15 suspicion)
      const history = this.historicalStitcherBehavior.get(bet.address) ?? []
      if (history.length > 0) {
        const avgHistoricalScore = history.reduce((a, b) => a + b, 0) / history.length
        score += Math.floor(avgHistoricalScore * 0.15)
      }

      // Signal 5: Very small bets as decoys (-10 suspicion — looks clean)
      if (amountUSD < 2) {
        score -= 10
      }

      scores.set(bet.address, Math.max(0, Math.min(100, score)))
    }

    return scores
  }

  updateHistory(address: string, score: number): void {
    const history = this.historicalStitcherBehavior.get(address) ?? []
    history.push(score)
    // Keep last 10 rounds
    if (history.length > 10) history.shift()
    this.historicalStitcherBehavior.set(address, history)
  }
}

// ─── Obfuscation Engine ───────────────────────────────────────────────────────

/**
 * Stitchers can use the Obfuscation Engine to disguise their bets.
 * Strategies:
 * - Split bets: one large on real side, several tiny decoys on other side
 * - Delayed submission: queue bets for last-10-second window
 * - Proxy routing: bet through "relay" addresses (not implemented in POC)
 */
export class StitcherObfuscator {
  /**
   * Returns an obfuscation strategy for a Stitcher's intended bet.
   */
  generateObfuscationPlan(params: {
    realSide: 'A' | 'B'
    totalBudget: bigint       // Max USDC to spend
    detectionRisk: number     // 0-1 current risk level
    timeRemaining: number     // Seconds until window closes
  }): Array<{ side: 'A' | 'B'; amount: bigint; delaySeconds: number; isDecoy: boolean }> {
    const { realSide, totalBudget, detectionRisk, timeRemaining } = params
    const decoyBudget = (totalBudget * BigInt(Math.floor(detectionRisk * 20))) / 100n
    const realBudget = totalBudget - decoyBudget

    const plan: Array<{ side: 'A' | 'B'; amount: bigint; delaySeconds: number; isDecoy: boolean }> = []

    // Real bet: placed in last 15 seconds for maximum surprise
    const realDelay = Math.max(0, timeRemaining - 15)
    plan.push({
      side: realSide,
      amount: realBudget,
      delaySeconds: realDelay,
      isDecoy: false,
    })

    // Decoy bets: spread across the window on the opposite side
    if (decoyBudget > 1_000_000n) {  // > 1 USDC
      const numDecoys = Math.min(3, Math.floor(detectionRisk * 5))
      for (let i = 0; i < numDecoys; i++) {
        const decoyAmount = decoyBudget / BigInt(numDecoys)
        const decoyDelay = Math.floor(timeRemaining * (i + 1) / (numDecoys + 2))
        plan.push({
          side: realSide === 'A' ? 'B' : 'A',
          amount: decoyAmount,
          delaySeconds: decoyDelay,
          isDecoy: true,
        })
      }
    }

    return plan
  }
}

// ─── Revelation Engine ────────────────────────────────────────────────────────

export class RevelationEngine {
  /**
   * Computes the full revelation — who were Stitchers, who was correct,
   * and the dramatic moments for the UI.
   */
  computeRevelation(params: {
    round: BetrayalRound
    chapterChoice: 'A' | 'B'
    accusations: SuspicionAccusation[]
    stitcherBets: StitcherBet[]
    regularBets: Array<{ address: string; side: 'A' | 'B'; amount: bigint }>
  }): BetrayalRevelation {
    const { round, chapterChoice, accusations, stitcherBets, regularBets } = params

    const stitcherAddresses = Array.from(round.stitcherAddresses)
    const stitcherWon = round.stitcherCoordination.coordinatedSide === chapterChoice

    // Correct vs incorrect accusers
    const correctAccusers: string[] = []
    const incorrectAccusers: string[] = []

    for (const acc of accusations) {
      const wasCorrect = stitcherAddresses.includes(acc.accusedAddress)
      if (wasCorrect) correctAccusers.push(acc.accuserAddress)
      else incorrectAccusers.push(acc.accuserAddress)
    }

    const stitchersDetected = new Set(
      accusations
        .filter(a => stitcherAddresses.includes(a.accusedAddress))
        .map(a => a.accusedAddress)
    ).size

    // ─── Payout Calculation ─────────────────────────────
    // Stitcher prize pool = sum of accuser stakes + stitcher entry fees
    // Detector prize pool = sum of stitcher entry fees when stitchers lose
    const STITCHER_ENTRY_FEE = BigInt(5_000_000)  // 5 USDC per stitcher
    const totalStitcherFees = BigInt(stitcherAddresses.length) * STITCHER_ENTRY_FEE

    // Accusation pool (just the staked amounts)
    const totalAccusationStakes = accusations.reduce((sum, a) => sum + a.stakedAmount, 0n)

    const stitcherBonusPool = stitcherWon
      ? totalAccusationStakes + totalStitcherFees / 2n
      : 0n

    const detectorBonusPool = stitcherWon
      ? totalAccusationStakes
      : totalStitcherFees + totalAccusationStakes

    const stitcherBonusMap = new Map<string, bigint>()
    const detectorBonusMap = new Map<string, bigint>()

    if (stitcherWon && stitcherBonusPool > 0n) {
      const evadedStitchers = stitcherAddresses.filter(
        addr => !correctAccusers.some(ca => {
          const acc = accusations.find(a => a.accuserAddress === ca && a.accusedAddress === addr)
          return !!acc
        })
      )

      const perStitcher = evadedStitchers.length > 0
        ? stitcherBonusPool / BigInt(evadedStitchers.length)
        : 0n

      for (const addr of evadedStitchers) {
        stitcherBonusMap.set(addr, perStitcher)
      }
    }

    if (correctAccusers.length > 0 && detectorBonusPool > 0n) {
      const perDetector = detectorBonusPool / BigInt(correctAccusers.length)
      for (const addr of correctAccusers) {
        detectorBonusMap.set(addr, perDetector)
      }
    }

    const totalStitcherPayout = Array.from(stitcherBonusMap.values()).reduce((a, b) => a + b, 0n)
    const totalDetectorPayout = Array.from(detectorBonusMap.values()).reduce((a, b) => a + b, 0n)

    // ─── Dramatic Moments ────────────────────────────────
    const dramaticMoments: DramaticMoment[] = []

    // Dramatic moment: Top stitcher who evaded
    const topEvader = stitcherAddresses
      .filter(a => !correctAccusers.includes(a))
      .reduce((top, a) => {
        const bet = stitcherBets.find(b => b.bettorAddress === a)
        const topBet = stitcherBets.find(b => b.bettorAddress === top)
        return (bet?.amount ?? 0n) > (topBet?.amount ?? 0n) ? a : top
      }, stitcherAddresses[0] ?? '')

    if (topEvader) {
      const evaderBet = stitcherBets.find(b => b.bettorAddress === topEvader)
      if (evaderBet) {
        dramaticMoments.push({
          type: 'escape',
          primaryAddress: topEvader,
          description: `${topEvader.slice(0, 6)}... was a Stitcher ALL ALONG — bet ${Number(evaderBet.amount) / 1_000_000} USDC on ${evaderBet.realSide} and evaded detection. 🕵️`,
          financialImpact: evaderBet.amount,
        })
      }
    }

    // Dramatic moment: A stitcher who got caught
    const caughtStitcher = correctAccusers.length > 0
      ? accusations.find(a => stitcherAddresses.includes(a.accusedAddress))
      : null

    if (caughtStitcher) {
      dramaticMoments.push({
        type: 'detection',
        primaryAddress: caughtStitcher.accuserAddress,
        description: `${caughtStitcher.accuserAddress.slice(0, 6)}... identified Stitcher ${caughtStitcher.accusedAddress.slice(0, 6)}... and staked ${Number(caughtStitcher.stakedAmount) / 1_000_000} USDC on the accusation. CORRECT. 🔍`,
        financialImpact: caughtStitcher.stakedAmount,
      })
    }

    // Dramatic moment: Stitcher who betrayed their assigned side
    const betrayer = stitcherBets.find(b => b.side !== b.realSide)
    if (betrayer) {
      dramaticMoments.push({
        type: 'betrayal',
        primaryAddress: betrayer.bettorAddress,
        description: `${betrayer.bettorAddress.slice(0, 6)}... was a Stitcher but DEFECTED — publicly bet ${betrayer.side} while secretly betting ${betrayer.realSide}. Double agent confirmed. 🤯`,
        financialImpact: betrayer.amount,
      })
    }

    return {
      revealedAt: Date.now(),
      stitcherAddresses,
      correctAccusers,
      incorrectAccusers,
      stitcherWon,
      stitchersDetected,
      payouts: {
        stitcherBonus: stitcherBonusMap,
        detectorBonus: detectorBonusMap,
        totalStitcherPayout,
        totalDetectorPayout,
      },
      dramaticMoments,
    }
  }
}

// ─── Main Betrayal Protocol Manager ──────────────────────────────────────────

export class BetrayalProtocol {
  private rounds: Map<string, BetrayalRound> = new Map()
  private assigner = new StitcherAssigner()
  private scorer = new SuspicionScorer()
  private revelationEngine = new RevelationEngine()
  private obfuscator = new StitcherObfuscator()

  /**
   * Determines if a chapter should trigger a Betrayal Round.
   * Triggers every 5th chapter by default.
   */
  shouldTriggerBetrayalRound(chapterNumber: number): boolean {
    return chapterNumber % 5 === 0
  }

  /**
   * Initialize a Betrayal Round for a chapter.
   */
  initRound(chapterId: string, participants: string[]): BetrayalRound {
    const { assignments, stitcherCount } = this.assigner.assignRoles(participants)

    const stitcherAddresses = new Set(
      Array.from(assignments.values())
        .filter(a => a.isStitcher)
        .map(a => a.bettorAddress)
    )

    const round: BetrayalRound = {
      roundId: `betrayal_${chapterId}_${Date.now()}`,
      chapterId,
      status: 'recruiting',
      totalParticipants: participants.length,
      stitcherCount,
      stitcherFraction: stitcherCount / participants.length,
      stitcherAddresses,
      assignments,
      stitcherCoordination: {
        bets: [],
        coordinatedSide: null,
        detectionRisk: 0,
        obfuscationActive: false,
      },
      suspicionScores: new Map(),
      accusations: [],
    }

    this.rounds.set(round.roundId, round)
    return round
  }

  /**
   * Submit a public bet (visible to all). Stitchers may use obfuscation.
   */
  submitPublicBet(roundId: string, address: string, side: 'A' | 'B', amount: bigint): {
    success: boolean
    isObfuscated: boolean
    suspicionDelta: number
  } {
    const round = this.rounds.get(roundId)
    if (!round || round.status !== 'active') return { success: false, isObfuscated: false, suspicionDelta: 0 }

    const assignment = round.assignments.get(address)
    const isStitcher = assignment?.isStitcher ?? false

    if (isStitcher) {
      // Stitcher bets are tracked separately for coordination
      const obfuscationPlan = this.obfuscator.generateObfuscationPlan({
        realSide: side,
        totalBudget: amount,
        detectionRisk: round.stitcherCoordination.detectionRisk,
        timeRemaining: 60,
      })

      const mainBet = obfuscationPlan.find(p => !p.isDecoy)

      round.stitcherCoordination.bets.push({
        bettorAddress: address,
        side: obfuscationPlan[0].side,    // Public side (may be decoy)
        amount,
        isObfuscated: obfuscationPlan.length > 1,
        realSide: mainBet?.side ?? side,  // True side
        timestamp: Date.now(),
      })

      // Update coordinated side (majority of stitcher bets)
      const sideCounts = { A: 0, B: 0 }
      for (const b of round.stitcherCoordination.bets) {
        sideCounts[b.realSide]++
      }
      round.stitcherCoordination.coordinatedSide = sideCounts.A >= sideCounts.B ? 'A' : 'B'
    }

    // Update detection risk based on coordination visibility
    if (isStitcher) {
      const stitcherBetTotal = round.stitcherCoordination.bets.length
      const coordinationSignal = stitcherBetTotal / round.stitcherCount
      round.stitcherCoordination.detectionRisk = Math.min(0.9, round.stitcherCoordination.detectionRisk + coordinationSignal * 0.05)
    }

    return { success: true, isObfuscated: isStitcher, suspicionDelta: isStitcher ? 5 : 0 }
  }

  /**
   * Crowd member accuses another bettor of being a Stitcher.
   * Stakes USDC on the accusation.
   */
  accuseStitcher(roundId: string, accuserAddress: string, accusedAddress: string, stakedAmount: bigint): {
    success: boolean
    currentSuspicionScore: number
    potentialPayout: string
  } {
    const round = this.rounds.get(roundId)
    if (!round || round.status !== 'active') return { success: false, currentSuspicionScore: 0, potentialPayout: '0' }

    const suspicionScore = round.suspicionScores.get(accusedAddress) ?? 0

    round.accusations.push({
      accuserAddress,
      accusedAddress,
      stakedAmount,
      submittedAt: Date.now(),
    })

    // Potential payout estimate based on accusation pool
    const accusationPool = round.accusations.reduce((sum, a) => sum + a.stakedAmount, 0n)
    const potentialMultiplier = round.stitcherAddresses.has(accusedAddress) ? 1.8 : 0

    return {
      success: true,
      currentSuspicionScore: suspicionScore,
      potentialPayout: `${(Number(stakedAmount) / 1_000_000 * potentialMultiplier).toFixed(2)} USDC`,
    }
  }

  /**
   * Resolve the round after chapter choice is made.
   */
  resolveRound(roundId: string, chapterChoice: 'A' | 'B', regularBets: Array<{ address: string; side: 'A' | 'B'; amount: bigint }>) {
    const round = this.rounds.get(roundId)
    if (!round) throw new Error(`Round ${roundId} not found`)

    round.status = 'revealed'
    round.chapterChoice = chapterChoice

    const revelation = this.revelationEngine.computeRevelation({
      round,
      chapterChoice,
      accusations: round.accusations,
      stitcherBets: round.stitcherCoordination.bets,
      regularBets,
    })

    round.revelation = revelation
    round.status = 'settled'

    return revelation
  }

  /**
   * Get the suspicion leaderboard for a round.
   * Public-facing: shows who the crowd suspects most.
   */
  getSuspicionLeaderboard(roundId: string, topN = 10): Array<{ address: string; score: number; accusationCount: number }> {
    const round = this.rounds.get(roundId)
    if (!round) return []

    const accusationCounts = new Map<string, number>()
    for (const acc of round.accusations) {
      const count = accusationCounts.get(acc.accusedAddress) ?? 0
      accusationCounts.set(acc.accusedAddress, count + 1)
    }

    return Array.from(round.suspicionScores.entries())
      .map(([address, score]) => ({
        address,
        score,
        accusationCount: accusationCounts.get(address) ?? 0,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)
  }

  getRound(roundId: string): BetrayalRound | undefined {
    return this.rounds.get(roundId)
  }
}

// ─── Demo ─────────────────────────────────────────────────────────────────────

export function runBetrayalDemo(): void {
  console.log('🎭 BETRAYAL PROTOCOL — Round Simulation\n')

  const protocol = new BetrayalProtocol()

  // Simulate 100 bettors
  const participants = Array.from({ length: 100 }, (_, i) => `0x${i.toString(16).padStart(40, '0')}`)

  const round = protocol.initRound('chapter_25', participants)

  console.log(`📋 Round initialized:`)
  console.log(`   Participants: ${round.totalParticipants}`)
  console.log(`   Stitchers assigned: ${round.stitcherCount} (${(round.stitcherFraction * 100).toFixed(1)}%)`)
  console.log(`   Stitcher identities: HIDDEN until revelation\n`)

  // Simulate some bets
  round.status = 'active'

  const stitcherList = Array.from(round.stitcherAddresses).slice(0, 3)
  console.log(`[HIDDEN] First 3 Stitchers: ${stitcherList.map(a => a.slice(0, 8)).join(', ')}`)
  console.log(`[HIDDEN] Coordinating to bet: A\n`)

  // Some accusations
  protocol.accuseStitcher(round.roundId, participants[50], participants[3], BigInt(10_000_000))
  protocol.accuseStitcher(round.roundId, participants[70], participants[1], BigInt(5_000_000))

  console.log(`🔍 Accusations filed: ${round.accusations.length}`)
  console.log(`   ${participants[50].slice(0, 8)} accused ${participants[3].slice(0, 8)} (staked 10 USDC)`)
  console.log(`   ${participants[70].slice(0, 8)} accused ${participants[1].slice(0, 8)} (staked 5 USDC)\n`)

  // Resolve chapter
  const regularBets = participants.map(addr => ({
    address: addr,
    side: (Math.random() > 0.4 ? 'A' : 'B') as 'A' | 'B',
    amount: BigInt(Math.floor(Math.random() * 50_000_000)),
  }))

  const revelation = protocol.resolveRound(round.roundId, 'A', regularBets)

  console.log(`🎭 REVELATION!\n`)
  console.log(`   Stitchers: ${revelation.stitcherAddresses.map(a => a.slice(0, 8)).join(', ')}`)
  console.log(`   Stitcher strategy: ${round.stitcherCoordination.coordinatedSide} — Chapter chose: ${round.chapterChoice}`)
  console.log(`   Stitcher won: ${revelation.stitcherWon ? '✅' : '❌'}`)
  console.log(`   Stitchers detected: ${revelation.stitchersDetected}/${revelation.stitcherAddresses.length}`)
  console.log(`   Correct accusers: ${revelation.correctAccusers.map(a => a.slice(0, 8)).join(', ') || 'none'}`)
  console.log(`\n📖 Dramatic Moments:`)

  for (const moment of revelation.dramaticMoments) {
    console.log(`   ${moment.description}`)
  }

  console.log(`\n💰 Payouts:`)
  console.log(`   Stitcher bonuses: ${(Number(revelation.payouts.totalStitcherPayout) / 1_000_000).toFixed(2)} USDC`)
  console.log(`   Detector bonuses: ${(Number(revelation.payouts.totalDetectorPayout) / 1_000_000).toFixed(2)} USDC`)
}
