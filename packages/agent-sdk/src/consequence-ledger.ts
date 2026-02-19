/**
 * Narrative Consequence Ledger (NCL)
 * Innovation Cycle #53 — "The Living Story Protocol"
 *
 * Every betting pool resolution creates a structured consequence that persists
 * across chapters. Claude receives the 5 most pressing outstanding consequences
 * before generating each new chapter — making Voidborne narratively coherent
 * for the first time at scale.
 *
 * Key components:
 *  - ConsequenceRecorder   : parses bet outcomes into typed consequence vectors
 *  - ConsequenceLedger     : persistent store with query / resolution API
 *  - NarrativeDebtEngine   : computes chapter Narrative Debt Score (NDS)
 *  - ClaudeContextBuilder  : formats outstanding debts as Claude system-prompt block
 *  - ConsequenceBetMarket  : new betting surface — bet on WHEN a consequence resolves
 *  - LivingStoryOrchestrator : master coordinator for full NCL lifecycle
 */

import { createHash } from 'crypto'

// ─── Core Types ────────────────────────────────────────────────────────────────

export type HouseId = 'valdris' | 'obsidian' | 'aurelius' | 'strand' | 'null'
export type ConsequenceStatus = 'pending' | 'partial' | 'resolved' | 'escalated' | 'crisis'
export type ConsequenceSeverity = 1 | 2 | 3 | 4 | 5

export interface ConsequenceVector {
  /** -1 (destabilising) to +1 (stabilising) across the Conclave */
  politicalPressure: number
  /** -1 (scarcity/loss) to +1 (abundance/gain) */
  resourceDelta: number
  /** -1 (fracturing alliances) to +1 (forging alliances) */
  allianceShift: number
  /** 0 (clean) to 1 (fully corrupted by Stitching) */
  voidCorruption: number
  /** 0 (no threat) to 1 (civilisation-ending) */
  survivalThreat: number
}

export interface NarrativeConsequence {
  id: string                          // e.g. "CH03-001"
  chapterOrigin: number               // chapter where this consequence was born
  choiceId: string                    // the winning choice that caused this
  housesAffected: HouseId[]           // which houses bear the burden
  description: string                 // human-readable, Claude-ready sentence
  severity: ConsequenceSeverity       // 1 = flavour, 5 = civilisation-altering
  vector: ConsequenceVector           // structured multi-dimensional impact
  status: ConsequenceStatus
  expectedResolutionRange: [number, number]   // [chapterMin, chapterMax]
  actualResolutionChapter?: number
  resolutionDescription?: string
  parentConsequenceId?: string        // chain of cascading consequences
  childConsequenceIds: string[]
  bets: ConsequenceBet[]
  narrativeDebt: number               // pre-computed: severity × overdue_factor
  createdAt: Date
  updatedAt: Date
}

export interface ConsequenceBet {
  id: string
  consequenceId: string
  playerAddress: string
  predictedChapter: number            // exact chapter bet
  rangeMin: number                    // optional range bet (±2 for reduced odds)
  rangeMax: number
  amount: number                      // USDC
  multiplier: number                  // exact=8x, ±1=4x, ±2=2x, range=1.5x
  status: 'open' | 'won' | 'lost' | 'refunded'
  placedAt: Date
}

export interface NarrativeDebtReport {
  totalDebt: number
  isCrisis: boolean                   // NDS > CRISIS_THRESHOLD (25)
  criticalConsequences: NarrativeConsequence[]
  overdueConsequences: NarrativeConsequence[]    // past expectedResolutionRange
  upcomingResolutions: NarrativeConsequence[]    // expected in next 3 chapters
  debtByHouse: Record<HouseId, number>
  debtTrend: 'rising' | 'stable' | 'falling'
}

export interface ChapterConsequenceContext {
  chapterNumber: number
  systemPromptBlock: string           // injected verbatim into Claude's system prompt
  mustResolve: NarrativeConsequence[] // CRISIS: Claude MUST address these
  shouldAddress: NarrativeConsequence[]  // high priority — Claude should acknowledge
  mayReference: NarrativeConsequence[]   // optional flavour references
  debtScore: number
  isCrisisChapter: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CRISIS_THRESHOLD = 25
const MAX_MUST_RESOLVE = 2
const MAX_SHOULD_ADDRESS = 3
const MAX_MAY_REFERENCE = 5
const EXACT_CHAPTER_MULTIPLIER = 8
const WITHIN_ONE_MULTIPLIER = 4
const WITHIN_TWO_MULTIPLIER = 2
const RANGE_MULTIPLIER = 1.5

// ─── ConsequenceRecorder ──────────────────────────────────────────────────────

/**
 * Parses resolved betting pool data into structured NarrativeConsequence objects.
 */
export class ConsequenceRecorder {
  /**
   * Extract consequence(s) from a resolved chapter choice.
   * In production this calls Claude to generate the consequence text
   * from the full chapter content + winning choice.
   */
  createFromChoice(
    chapterNumber: number,
    choiceId: string,
    choiceText: string,
    housesAffected: HouseId[],
    contextHint?: string,
  ): NarrativeConsequence {
    const id = this.generateId(chapterNumber, choiceId)
    const vector = this.deriveVector(choiceText, housesAffected)
    const severity = this.computeSeverity(vector)
    const resolutionRange = this.estimateResolutionRange(severity, chapterNumber)

    const description = contextHint
      ? contextHint
      : this.narrativiseChoice(choiceText, housesAffected, vector)

    return {
      id,
      chapterOrigin: chapterNumber,
      choiceId,
      housesAffected,
      description,
      severity,
      vector,
      status: 'pending',
      expectedResolutionRange: resolutionRange,
      childConsequenceIds: [],
      bets: [],
      narrativeDebt: severity,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  /** Escalate an existing consequence (increases severity + resets window) */
  escalate(
    base: NarrativeConsequence,
    reason: string,
    currentChapter: number,
  ): NarrativeConsequence {
    const newSeverity = Math.min(5, (base.severity + 1) as ConsequenceSeverity) as ConsequenceSeverity
    const newVector: ConsequenceVector = {
      politicalPressure: Math.min(1, Math.abs(base.vector.politicalPressure) * 1.3) * Math.sign(base.vector.politicalPressure),
      resourceDelta: base.vector.resourceDelta * 1.2,
      allianceShift: base.vector.allianceShift * 1.2,
      voidCorruption: Math.min(1, base.vector.voidCorruption + 0.15),
      survivalThreat: Math.min(1, base.vector.survivalThreat + 0.1),
    }

    return {
      ...base,
      severity: newSeverity,
      vector: newVector,
      status: 'escalated',
      description: `[ESCALATED — ${reason}] ${base.description}`,
      expectedResolutionRange: [
        currentChapter + 1,
        currentChapter + 1 + newSeverity * 2,
      ],
      narrativeDebt: newSeverity * 1.5,
      updatedAt: new Date(),
    }
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private generateId(chapter: number, choiceId: string): string {
    const hash = createHash('sha1')
      .update(`${chapter}-${choiceId}-${Date.now()}`)
      .digest('hex')
      .slice(0, 4)
      .toUpperCase()
    return `CH${String(chapter).padStart(2, '0')}-${hash}`
  }

  private deriveVector(choiceText: string, houses: HouseId[]): ConsequenceVector {
    const text = choiceText.toLowerCase()

    // Heuristic mapping — in production, Claude classifies this
    const political = text.includes('seize') || text.includes('force') ? -0.7
      : text.includes('negotiate') || text.includes('peace') ? 0.5
      : -0.1

    const resource = text.includes('destroy') || text.includes('drain') ? -0.6
      : text.includes('trade') || text.includes('supply') ? 0.4
      : 0

    const alliance = text.includes('betray') || text.includes('exile') ? -0.8
      : text.includes('ally') || text.includes('unite') ? 0.7
      : 0

    const void_ = text.includes('stitch') || text.includes('void') || text.includes('null') ? 0.4 : 0.1

    const survival = houses.includes('null') ? 0.5
      : text.includes('annihilate') || text.includes('collapse') ? 0.6
      : 0.1

    return {
      politicalPressure: political,
      resourceDelta: resource,
      allianceShift: alliance,
      voidCorruption: void_,
      survivalThreat: survival,
    }
  }

  private computeSeverity(vector: ConsequenceVector): ConsequenceSeverity {
    const magnitude =
      Math.abs(vector.politicalPressure) * 2 +
      Math.abs(vector.resourceDelta) * 1.5 +
      Math.abs(vector.allianceShift) * 2 +
      vector.voidCorruption * 2.5 +
      vector.survivalThreat * 3

    if (magnitude > 7) return 5
    if (magnitude > 5) return 4
    if (magnitude > 3) return 3
    if (magnitude > 1.5) return 2
    return 1
  }

  private estimateResolutionRange(
    severity: ConsequenceSeverity,
    origin: number,
  ): [number, number] {
    const minDelay = severity * 2
    const maxDelay = severity * 5
    return [origin + minDelay, origin + maxDelay]
  }

  private narrativiseChoice(
    choiceText: string,
    houses: HouseId[],
    vector: ConsequenceVector,
  ): string {
    const houseNames = houses.map((h) => `House ${h.charAt(0).toUpperCase() + h.slice(1)}`).join(' and ')
    const pressure = vector.politicalPressure < -0.4
      ? 'Political fractures deepen'
      : vector.politicalPressure > 0.4
      ? 'Political unity strengthens'
      : 'Political tensions simmer'
    const void_ = vector.voidCorruption > 0.3
      ? ` The Stitching spreads.`
      : ''
    return `${houseNames}: ${choiceText}. ${pressure}.${void_}`
  }
}

// ─── ConsequenceLedger ────────────────────────────────────────────────────────

/**
 * In-memory + persistence layer for all narrative consequences.
 * In production, backs onto the Prisma database (NarrativeConsequence model).
 */
export class ConsequenceLedger {
  private consequences: Map<string, NarrativeConsequence> = new Map()
  private readonly recorder = new ConsequenceRecorder()

  /** Add a new consequence (from resolved chapter) */
  async record(consequence: NarrativeConsequence): Promise<NarrativeConsequence> {
    this.consequences.set(consequence.id, consequence)
    return consequence
  }

  /** Record directly from choice data (convenience) */
  async recordFromChoice(
    chapterNumber: number,
    choiceId: string,
    choiceText: string,
    housesAffected: HouseId[],
    contextHint?: string,
  ): Promise<NarrativeConsequence> {
    const c = this.recorder.createFromChoice(
      chapterNumber, choiceId, choiceText, housesAffected, contextHint,
    )
    return this.record(c)
  }

  /** Mark consequence as resolved */
  async resolve(
    id: string,
    chapterNumber: number,
    resolution: string,
  ): Promise<NarrativeConsequence> {
    const c = this.consequences.get(id)
    if (!c) throw new Error(`Consequence ${id} not found`)

    const updated: NarrativeConsequence = {
      ...c,
      status: 'resolved',
      actualResolutionChapter: chapterNumber,
      resolutionDescription: resolution,
      narrativeDebt: 0,
      updatedAt: new Date(),
    }

    this.consequences.set(id, updated)
    return updated
  }

  /** Escalate (called by NarrativeDebtEngine when overdue) */
  async escalate(
    id: string,
    reason: string,
    currentChapter: number,
  ): Promise<NarrativeConsequence> {
    const c = this.consequences.get(id)
    if (!c) throw new Error(`Consequence ${id} not found`)
    const escalated = this.recorder.escalate(c, reason, currentChapter)
    this.consequences.set(id, escalated)
    return escalated
  }

  /** Get all pending/partial/escalated consequences */
  getActive(): NarrativeConsequence[] {
    return Array.from(this.consequences.values()).filter(
      (c) => c.status !== 'resolved',
    )
  }

  /** Get consequences that originated at or before a given chapter */
  getByMaxOrigin(maxChapter: number): NarrativeConsequence[] {
    return this.getActive().filter((c) => c.chapterOrigin <= maxChapter)
  }

  /** Get overdue consequences (past their expected resolution window) */
  getOverdue(currentChapter: number): NarrativeConsequence[] {
    return this.getActive().filter(
      (c) => currentChapter > c.expectedResolutionRange[1],
    )
  }

  /** Get all consequences resolved in a specific chapter */
  getResolvedInChapter(chapter: number): NarrativeConsequence[] {
    return Array.from(this.consequences.values()).filter(
      (c) => c.actualResolutionChapter === chapter,
    )
  }

  getAll(): NarrativeConsequence[] {
    return Array.from(this.consequences.values())
  }

  get(id: string): NarrativeConsequence | undefined {
    return this.consequences.get(id)
  }
}

// ─── NarrativeDebtEngine ──────────────────────────────────────────────────────

/**
 * Computes the Narrative Debt Score (NDS) per chapter and triggers CRISIS mode
 * when unresolved consequences accumulate past the threshold.
 */
export class NarrativeDebtEngine {
  constructor(private readonly ledger: ConsequenceLedger) {}

  /** Full debt report for a given chapter */
  async computeDebtReport(currentChapter: number): Promise<NarrativeDebtReport> {
    const active = this.ledger.getByMaxOrigin(currentChapter)
    const overdue = this.ledger.getOverdue(currentChapter)

    // Auto-escalate overdue high-severity consequences
    for (const c of overdue) {
      if (c.severity >= 3 && c.status !== 'escalated') {
        await this.ledger.escalate(
          c.id,
          `Expected resolution by Ch${c.expectedResolutionRange[1]}, now at Ch${currentChapter}`,
          currentChapter,
        )
      }
    }

    const refreshedActive = this.ledger.getByMaxOrigin(currentChapter)
    const totalDebt = refreshedActive.reduce((sum, c) => sum + this.computeSingleDebt(c, currentChapter), 0)

    const upcoming = refreshedActive.filter(
      (c) =>
        c.expectedResolutionRange[0] <= currentChapter + 3 &&
        c.expectedResolutionRange[0] >= currentChapter,
    )

    const debtByHouse = this.computeDebtByHouse(refreshedActive, currentChapter)

    return {
      totalDebt,
      isCrisis: totalDebt >= CRISIS_THRESHOLD,
      criticalConsequences: refreshedActive.filter((c) => c.severity >= 4).sort((a, b) => b.severity - a.severity),
      overdueConsequences: this.ledger.getOverdue(currentChapter),
      upcomingResolutions: upcoming,
      debtByHouse,
      debtTrend: this.computeTrend(currentChapter),
    }
  }

  private computeSingleDebt(c: NarrativeConsequence, currentChapter: number): number {
    if (c.status === 'resolved') return 0

    const overduePenalty = currentChapter > c.expectedResolutionRange[1]
      ? (currentChapter - c.expectedResolutionRange[1]) * 0.5
      : 0

    const escalatedMultiplier = c.status === 'escalated' ? 1.8 : 1

    return (c.severity + overduePenalty) * escalatedMultiplier
  }

  private computeDebtByHouse(
    consequences: NarrativeConsequence[],
    currentChapter: number,
  ): Record<HouseId, number> {
    const result: Record<HouseId, number> = {
      valdris: 0, obsidian: 0, aurelius: 0, strand: 0, null: 0,
    }

    for (const c of consequences) {
      const debt = this.computeSingleDebt(c, currentChapter)
      for (const house of c.housesAffected) {
        result[house] += debt / c.housesAffected.length
      }
    }

    return result
  }

  private computeTrend(currentChapter: number): 'rising' | 'stable' | 'falling' {
    const prevChapterResolved = this.ledger.getResolvedInChapter(currentChapter - 1).length
    const currentActive = this.ledger.getActive().length

    if (prevChapterResolved === 0 && currentActive > 3) return 'rising'
    if (prevChapterResolved >= 2) return 'falling'
    return 'stable'
  }
}

// ─── ClaudeContextBuilder ─────────────────────────────────────────────────────

/**
 * Formats the Narrative Debt Report into a structured block that is injected
 * verbatim into Claude's system prompt before chapter generation.
 */
export class ClaudeContextBuilder {
  constructor(
    private readonly ledger: ConsequenceLedger,
    private readonly debtEngine: NarrativeDebtEngine,
  ) {}

  async buildChapterContext(chapterNumber: number): Promise<ChapterConsequenceContext> {
    const report = await this.debtEngine.computeDebtReport(chapterNumber)
    const active = this.ledger.getByMaxOrigin(chapterNumber)

    // Sort by (severity DESC, overdue DESC, expectedResolution ASC)
    const sorted = [...active].sort((a, b) => {
      if (b.severity !== a.severity) return b.severity - a.severity
      const aOverdue = chapterNumber > a.expectedResolutionRange[1] ? 1 : 0
      const bOverdue = chapterNumber > b.expectedResolutionRange[1] ? 1 : 0
      if (bOverdue !== aOverdue) return bOverdue - aOverdue
      return a.expectedResolutionRange[0] - b.expectedResolutionRange[0]
    })

    const mustResolve = report.isCrisis
      ? sorted.filter((c) => c.severity >= 4).slice(0, MAX_MUST_RESOLVE)
      : []

    const remainder = sorted.filter((c) => !mustResolve.includes(c))
    const shouldAddress = remainder.slice(0, MAX_SHOULD_ADDRESS)
    const mayReference = remainder.slice(MAX_SHOULD_ADDRESS, MAX_SHOULD_ADDRESS + MAX_MAY_REFERENCE)

    const systemPromptBlock = this.formatPromptBlock(
      chapterNumber,
      report,
      mustResolve,
      shouldAddress,
      mayReference,
    )

    return {
      chapterNumber,
      systemPromptBlock,
      mustResolve,
      shouldAddress,
      mayReference,
      debtScore: report.totalDebt,
      isCrisisChapter: report.isCrisis,
    }
  }

  private formatPromptBlock(
    chapter: number,
    report: NarrativeDebtReport,
    mustResolve: NarrativeConsequence[],
    shouldAddress: NarrativeConsequence[],
    mayReference: NarrativeConsequence[],
  ): string {
    const lines: string[] = [
      `═══════════════════════════════════════════════════`,
      `NARRATIVE CONSEQUENCE LEDGER — CHAPTER ${chapter}`,
      `Narrative Debt Score: ${report.totalDebt.toFixed(1)} / ${CRISIS_THRESHOLD} threshold`,
      report.isCrisis ? `⚠️  CRISIS MODE ACTIVE — Debt exceeds threshold` : `Status: Stable`,
      `═══════════════════════════════════════════════════`,
      ``,
    ]

    if (mustResolve.length > 0) {
      lines.push(`🔴 MUST RESOLVE IN THIS CHAPTER (narrative debt crisis):`)
      for (const c of mustResolve) {
        lines.push(this.formatConsequenceLine(c, chapter, '  '))
      }
      lines.push(``)
    }

    if (shouldAddress.length > 0) {
      lines.push(`🟡 SHOULD ADDRESS (high priority outstanding debts):`)
      for (const c of shouldAddress) {
        lines.push(this.formatConsequenceLine(c, chapter, '  '))
      }
      lines.push(``)
    }

    if (mayReference.length > 0) {
      lines.push(`🟢 MAY REFERENCE (active background tensions):`)
      for (const c of mayReference) {
        lines.push(this.formatConsequenceLine(c, chapter, '  '))
      }
      lines.push(``)
    }

    if (report.debtByHouse) {
      const topHouse = Object.entries(report.debtByHouse).sort((a, b) => b[1] - a[1])[0]
      if (topHouse && topHouse[1] > 2) {
        lines.push(`⚡ Highest debt bearer: House ${topHouse[0].toUpperCase()} (score: ${topHouse[1].toFixed(1)})`)
      }
    }

    lines.push(`═══════════════════════════════════════════════════`)
    lines.push(`NOTE: The above represents PROMISED narrative threads. Do not introduce`)
    lines.push(`major new consequences unless explicitly required by the chapter's choices.`)
    lines.push(`Resolve where possible. Escalate only if dramatically necessary.`)

    return lines.join('\n')
  }

  private formatConsequenceLine(
    c: NarrativeConsequence,
    currentChapter: number,
    indent: string,
  ): string {
    const overdue = currentChapter > c.expectedResolutionRange[1]
    const overdueTag = overdue ? ` [OVERDUE — Ch${c.expectedResolutionRange[1]} deadline passed]` : ''
    const resWindow = `Expected Ch${c.expectedResolutionRange[0]}–${c.expectedResolutionRange[1]}`
    const houses = c.housesAffected.map((h) => `House ${h.charAt(0).toUpperCase() + h.slice(1)}`).join(', ')
    const sev = '★'.repeat(c.severity) + '☆'.repeat(5 - c.severity)

    return [
      `${indent}[${c.id}]${overdueTag}`,
      `${indent}  ${c.description}`,
      `${indent}  Severity: ${sev} | Affects: ${houses} | ${resWindow}`,
    ].join('\n')
  }
}

// ─── ConsequenceBetMarket ─────────────────────────────────────────────────────

/**
 * Betting surface for consequence resolution timing.
 * Players bet on which chapter a specific consequence resolves.
 * Multipliers: exact chapter = 8x, ±1 = 4x, ±2 = 2x, range = 1.5x.
 */
export class ConsequenceBetMarket {
  constructor(private readonly ledger: ConsequenceLedger) {}

  /** Open a new bet market for a consequence */
  async openMarket(consequenceId: string): Promise<{
    consequenceId: string
    availableWindows: Array<{ label: string; multiplier: number; chapter?: number }>
  }> {
    const c = this.ledger.get(consequenceId)
    if (!c) throw new Error(`Consequence ${consequenceId} not found`)
    if (c.status === 'resolved') throw new Error(`Consequence already resolved`)

    const [min, max] = c.expectedResolutionRange
    const windows = []

    // Exact chapter bets
    for (let ch = min; ch <= max; ch++) {
      windows.push({
        label: `Resolves exactly in Chapter ${ch}`,
        multiplier: EXACT_CHAPTER_MULTIPLIER,
        chapter: ch,
      })
    }

    // Range bets
    windows.push({
      label: `Resolves within expected window (Ch${min}–${max})`,
      multiplier: RANGE_MULTIPLIER,
    })

    windows.push({
      label: `Resolves EARLY (before Ch${min})`,
      multiplier: WITHIN_TWO_MULTIPLIER,
    })

    windows.push({
      label: `Escalates (does NOT resolve, becomes more severe)`,
      multiplier: EXACT_CHAPTER_MULTIPLIER,
    })

    return { consequenceId, availableWindows: windows }
  }

  /** Place a consequence resolution bet */
  async placeBet(
    consequenceId: string,
    playerAddress: string,
    predictedChapter: number,
    amount: number,
  ): Promise<ConsequenceBet> {
    const c = this.ledger.get(consequenceId)
    if (!c) throw new Error(`Consequence ${consequenceId} not found`)

    const multiplier = this.determineMultiplier(c, predictedChapter)

    const bet: ConsequenceBet = {
      id: `bet-${Date.now()}-${playerAddress.slice(-6)}`,
      consequenceId,
      playerAddress,
      predictedChapter,
      rangeMin: predictedChapter - 1,
      rangeMax: predictedChapter + 1,
      amount,
      multiplier,
      status: 'open',
      placedAt: new Date(),
    }

    c.bets.push(bet)
    return bet
  }

  /** Settle all bets for a consequence once it resolves */
  async settleBets(
    consequenceId: string,
    actualChapter: number,
  ): Promise<{
    won: ConsequenceBet[]
    lost: ConsequenceBet[]
    totalPayout: number
  }> {
    const c = this.ledger.get(consequenceId)
    if (!c) throw new Error(`Consequence ${consequenceId} not found`)

    const won: ConsequenceBet[] = []
    const lost: ConsequenceBet[] = []
    let totalPayout = 0

    for (const bet of c.bets) {
      const isWin =
        bet.predictedChapter === actualChapter ||
        Math.abs(bet.predictedChapter - actualChapter) <= 1

      if (isWin) {
        bet.status = 'won'
        const payout = bet.amount * bet.multiplier
        totalPayout += payout
        won.push(bet)
      } else {
        bet.status = 'lost'
        lost.push(bet)
      }
    }

    return { won, lost, totalPayout }
  }

  private determineMultiplier(c: NarrativeConsequence, predictedChapter: number): number {
    const [min, max] = c.expectedResolutionRange
    if (predictedChapter >= min && predictedChapter <= max) {
      return EXACT_CHAPTER_MULTIPLIER
    }
    if (predictedChapter === min - 1 || predictedChapter === max + 1) {
      return WITHIN_ONE_MULTIPLIER
    }
    if (predictedChapter === min - 2 || predictedChapter === max + 2) {
      return WITHIN_TWO_MULTIPLIER
    }
    return RANGE_MULTIPLIER
  }
}

// ─── LivingStoryOrchestrator ──────────────────────────────────────────────────

/**
 * Master coordinator for the full NCL lifecycle.
 * Consumed by the chapter generation API route before calling Claude.
 */
export class LivingStoryOrchestrator {
  readonly ledger: ConsequenceLedger
  readonly recorder: ConsequenceRecorder
  readonly debtEngine: NarrativeDebtEngine
  readonly contextBuilder: ClaudeContextBuilder
  readonly betMarket: ConsequenceBetMarket

  constructor() {
    this.ledger = new ConsequenceLedger()
    this.recorder = new ConsequenceRecorder()
    this.debtEngine = new NarrativeDebtEngine(this.ledger)
    this.contextBuilder = new ClaudeContextBuilder(this.ledger, this.debtEngine)
    this.betMarket = new ConsequenceBetMarket(this.ledger)
  }

  /**
   * Called after each chapter's betting pool resolves.
   * Returns the new consequence + the updated debt report.
   */
  async onChapterResolved(
    chapterNumber: number,
    winningChoiceId: string,
    winningChoiceText: string,
    housesAffected: HouseId[],
    consequenceHint?: string,
  ): Promise<{
    consequence: NarrativeConsequence
    debtReport: NarrativeDebtReport
    betMarket: Awaited<ReturnType<ConsequenceBetMarket['openMarket']>>
  }> {
    const consequence = await this.ledger.recordFromChoice(
      chapterNumber,
      winningChoiceId,
      winningChoiceText,
      housesAffected,
      consequenceHint,
    )

    const debtReport = await this.debtEngine.computeDebtReport(chapterNumber)
    const betMarket = await this.betMarket.openMarket(consequence.id)

    return { consequence, debtReport, betMarket }
  }

  /**
   * Called BEFORE Claude generates the next chapter.
   * Returns the system prompt block to inject + metadata.
   */
  async getChapterContext(chapterNumber: number): Promise<ChapterConsequenceContext> {
    return this.contextBuilder.buildChapterContext(chapterNumber)
  }

  /**
   * Resolve a consequence once Claude's chapter addresses it.
   * Settles all open bets on that consequence.
   */
  async resolveConsequence(
    consequenceId: string,
    chapterNumber: number,
    resolution: string,
  ): Promise<{
    consequence: NarrativeConsequence
    settlements: Awaited<ReturnType<ConsequenceBetMarket['settleBets']>>
  }> {
    const consequence = await this.ledger.resolve(consequenceId, chapterNumber, resolution)
    const settlements = await this.betMarket.settleBets(consequenceId, chapterNumber)
    return { consequence, settlements }
  }

  /** Generate a narrative-ready summary for the story UI */
  async getPublicDebtSummary(currentChapter: number): Promise<{
    activeConsequences: number
    severity: 'low' | 'medium' | 'high' | 'crisis'
    topTension: string | null
    upcomingExplosions: string[]
    debtScore: number
  }> {
    const report = await this.debtEngine.computeDebtReport(currentChapter)
    const severity = report.isCrisis
      ? 'crisis'
      : report.totalDebt > 15
      ? 'high'
      : report.totalDebt > 8
      ? 'medium'
      : 'low'

    const topTension = report.criticalConsequences[0]?.description ?? null
    const upcomingExplosions = report.upcomingResolutions
      .filter((c) => c.severity >= 3)
      .map((c) => c.description)
      .slice(0, 3)

    return {
      activeConsequences: this.ledger.getActive().length,
      severity,
      topTension,
      upcomingExplosions,
      debtScore: report.totalDebt,
    }
  }
}

// ─── Demo runner ──────────────────────────────────────────────────────────────

export async function runConsequenceLedgerDemo(): Promise<void> {
  console.log('\n╔══════════════════════════════════════════════════╗')
  console.log('║  NARRATIVE CONSEQUENCE LEDGER — DEMO            ║')
  console.log('║  Innovation Cycle #53 — The Living Story Protocol║')
  console.log('╚══════════════════════════════════════════════════╝\n')

  const engine = new LivingStoryOrchestrator()

  // ── Simulate 5 chapters of story decisions ──────────────────────────────────

  console.log('📖 Chapter 3 resolves — House Valdris seizes the Null Gate...')
  const r3 = await engine.onChapterResolved(
    3,
    'choice-a',
    'Seize control of the Null Gate by force',
    ['valdris', 'null'],
    'House Valdris storms the Null Gate, triggering a permanent rift with House Strand. The Stitching anomaly intensifies.',
  )
  console.log(`  ✅ Consequence recorded: ${r3.consequence.id} (severity ${r3.consequence.severity}/5)`)
  console.log(`  📊 Narrative Debt: ${r3.debtReport.totalDebt.toFixed(1)}`)

  console.log('\n📖 Chapter 7 resolves — The Aurelius heir goes missing...')
  const r7 = await engine.onChapterResolved(
    7,
    'choice-b',
    'Allow the Aurelius heir to disappear into the Void Corridor',
    ['aurelius', 'valdris'],
    'The Aurelius succession collapses. Three factions now claim the seat. House Valdris is implicated.',
  )
  console.log(`  ✅ Consequence recorded: ${r7.consequence.id} (severity ${r7.consequence.severity}/5)`)
  console.log(`  📊 Narrative Debt: ${r7.debtReport.totalDebt.toFixed(1)}`)

  console.log('\n📖 Chapter 10 resolves — The Stitching Protocol is invoked...')
  const r10 = await engine.onChapterResolved(
    10,
    'choice-a',
    'Invoke the forbidden Stitching Protocol to stabilise reality',
    ['null', 'strand', 'valdris'],
    'The Stitching Protocol tears a hole in the Strand weave. Void Corruption index spikes across all territories.',
  )
  console.log(`  ✅ Consequence recorded: ${r10.consequence.id} (severity ${r10.consequence.severity}/5)`)
  console.log(`  📊 Narrative Debt: ${r10.debtReport.totalDebt.toFixed(1)} ${r10.debtReport.isCrisis ? '⚠️ CRISIS!' : ''}`)

  // ── Place some consequence bets ───────────────────────────────────────────────

  console.log('\n💰 Players betting on consequence resolution timing...')
  const bet1 = await engine.betMarket.placeBet(r3.consequence.id, '0xAlice', 14, 50)
  console.log(`  ${bet1.id}: Alice bets $50 USDC that CH03 consequence resolves in Ch14 (${bet1.multiplier}x)`)

  const bet2 = await engine.betMarket.placeBet(r7.consequence.id, '0xBob', 18, 100)
  console.log(`  ${bet2.id}: Bob bets $100 USDC that CH07 consequence resolves in Ch18 (${bet2.multiplier}x)`)

  // ── Get Chapter 15 context for Claude ─────────────────────────────────────────

  console.log('\n🤖 Building Claude context for Chapter 15 generation...\n')
  const ctx = await engine.getChapterContext(15)
  console.log(ctx.systemPromptBlock)
  console.log(`\n  Crisis chapter: ${ctx.isCrisisChapter}`)
  console.log(`  Must resolve (${ctx.mustResolve.length}):`, ctx.mustResolve.map(c => c.id))
  console.log(`  Should address (${ctx.shouldAddress.length}):`, ctx.shouldAddress.map(c => c.id))

  // ── Resolve a consequence in Chapter 15 ───────────────────────────────────────

  console.log('\n📖 Chapter 15 generated — Null Gate consequence resolved...')
  const resolution = await engine.resolveConsequence(
    r3.consequence.id,
    15,
    'House Strand forces a renegotiation. The Null Gate returns to joint stewardship. Political fractures partially heal.',
  )
  console.log(`  ✅ Consequence ${r3.consequence.id} resolved`)
  console.log(`  💰 Bet settlements: ${resolution.settlements.won.length} won, ${resolution.settlements.lost.length} lost`)
  console.log(`  💸 Total payout: $${resolution.settlements.totalPayout} USDC`)

  // ── Public summary ─────────────────────────────────────────────────────────────

  console.log('\n📊 Public debt summary (for UI display)...')
  const summary = await engine.getPublicDebtSummary(15)
  console.log(`  Active consequences: ${summary.activeConsequences}`)
  console.log(`  Severity level: ${summary.severity.toUpperCase()}`)
  console.log(`  Top tension: "${summary.topTension}"`)
  console.log(`  Upcoming explosions: ${summary.upcomingExplosions.length} threats`)
  console.log(`  Debt score: ${summary.debtScore.toFixed(1)}`)

  console.log('\n✅ Consequence Ledger demo complete.\n')
}

// Export orchestrator as default singleton factory
export function createLivingStoryEngine(): LivingStoryOrchestrator {
  return new LivingStoryOrchestrator()
}
