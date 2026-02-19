/**
 * Chaos Oracle Protocol (COP)
 * Innovation Cycle #53 — "The Living Story Protocol"
 *
 * Real-world signals (crypto prices, news sentiment, social volume, on-chain
 * activity) are mapped to Voidborne narrative parameters before each chapter
 * generation. The story literally reacts to market conditions.
 *
 * Components:
 *  - SignalFetcher         : polls CoinGecko, Twitter/X, and on-chain data
 *  - ChaosMapper           : maps raw signals → narrative parameter changes
 *  - ChaosMarketEngine     : opens/closes prediction markets on chaos signals
 *  - ClaudeChaosInjector   : formats chaos context for Claude's chapter prompt
 *  - ChaosSignalArchive    : stores historical signal↔chapter correlations
 */

// ─── Core Types ────────────────────────────────────────────────────────────────

export type SignalSource = 'crypto' | 'social' | 'onchain' | 'internal'
export type SignalDirection = 'spike' | 'crash' | 'surge' | 'neutral' | 'volatile'

export interface RawSignal {
  id: string
  source: SignalSource
  metric: string               // e.g. "BTC_24H_CHANGE", "VOIDBORNE_MENTIONS"
  value: number
  direction: SignalDirection
  intensity: number            // 0–1 (how extreme vs. baseline)
  timestamp: Date
  raw: Record<string, unknown> // provider-specific payload
}

export interface NarrativeMapping {
  houseBeneficiary: string     // which house gains from this signal
  houseBurdened: string        // which house suffers
  parameterAffected: string    // e.g. "politicalPressure", "voidCorruption"
  narrativeEffect: string      // human-readable: what this means story-wise
  promptFragment: string       // injected into Claude: "Economic panic grips..."
  intensity: number            // 0–1 scaled effect
}

export interface ChaosSignal {
  id: string
  raw: RawSignal
  mapping: NarrativeMapping
  usedInChapter?: number
  wasCorrectlyBet?: boolean
  createdAt: Date
}

export interface ChaosMarket {
  id: string
  chapterNumber: number
  question: string             // "Will today's crypto crash appear in Ch15?"
  options: string[]            // ["Yes — BTC crash shapes narrative", "No — neutral chapter"]
  bets: ChaosMarketBet[]
  status: 'open' | 'closed' | 'resolved'
  result?: string
  openedAt: Date
  closesAt: Date
}

export interface ChaosMarketBet {
  id: string
  marketId: string
  playerAddress: string
  option: string
  amount: number               // USDC
  mainBetMultiplier?: number   // 2x bonus on chapter bet if correct
  status: 'open' | 'won' | 'lost'
  placedAt: Date
}

export interface ChaosChapterContext {
  chapterNumber: number
  signals: ChaosSignal[]
  promptBlock: string
  chaosIntensity: 'calm' | 'tense' | 'volatile' | 'maelstrom'
  dominantEffect: string
}

// ─── Signal Definitions ────────────────────────────────────────────────────────

/** Hard-coded narrative mappings for known signal types */
const SIGNAL_NARRATIVE_MAP: Record<string, (intensity: number, direction: SignalDirection) => NarrativeMapping> = {
  BTC_24H_CHANGE: (intensity, direction) => {
    if (direction === 'crash') return {
      houseBeneficiary: 'null',
      houseBurdened: 'valdris',
      parameterAffected: 'resourceDelta',
      narrativeEffect: 'Economic panic ripples through the Conclave. Trade routes falter.',
      promptFragment: `The Conclave's resource networks are strained — a crisis in the outer trade routes mirrors wider economic anxiety. House Valdris faces pressure on treasury commitments.`,
      intensity,
    }
    if (direction === 'surge') return {
      houseBeneficiary: 'valdris',
      houseBurdened: 'strand',
      parameterAffected: 'resourceDelta',
      narrativeEffect: 'Unprecedented wealth flows into House Valdris coffers, emboldening reckless moves.',
      promptFragment: `The Conclave's treasury overflows with unexpected tribute. House Valdris is emboldened — perhaps dangerously so. Rivals grow envious.`,
      intensity,
    }
    return {
      houseBeneficiary: 'strand',
      houseBurdened: 'null',
      parameterAffected: 'politicalPressure',
      narrativeEffect: 'Markets are stable. Political intrigues take centre stage.',
      promptFragment: `Trade winds are calm. The houses redirect their energy from economics to politics.`,
      intensity: 0.2,
    }
  },

  VOIDBORNE_SOCIAL_MENTIONS: (intensity, direction) => {
    if (direction === 'surge' || direction === 'spike') return {
      houseBeneficiary: 'obsidian',
      houseBurdened: 'aurelius',
      parameterAffected: 'allianceShift',
      narrativeEffect: 'Whispers of the Stitching spread across the Conclave. Rumour networks activate.',
      promptFragment: `Gossip about the Silent Throne reaches even the outer rings. House Obsidian's network of informants grows more active. Something — or someone — is spreading information intentionally.`,
      intensity,
    }
    return {
      houseBeneficiary: 'strand',
      houseBurdened: 'obsidian',
      parameterAffected: 'allianceShift',
      narrativeEffect: 'The Conclave quiets. Unusual secrecy grips all five houses.',
      promptFragment: `An eerie silence has settled over the Conclave's communication Strands. Houses are guarding secrets with unusual care.`,
      intensity: intensity * 0.5,
    }
  },

  FORGE_VOLUME_24H: (intensity, direction) => {
    if (direction === 'surge') return {
      houseBeneficiary: 'valdris',
      houseBurdened: 'null',
      parameterAffected: 'politicalPressure',
      narrativeEffect: 'A surge of allegiances announced. Factions re-align as old debts are called in.',
      promptFragment: `A flurry of formal allegiance declarations has swept through the Conclave chambers. Old debts are being called in with unusual urgency.`,
      intensity,
    }
    return {
      houseBeneficiary: 'null',
      houseBurdened: 'strand',
      parameterAffected: 'voidCorruption',
      narrativeEffect: 'The Stitching grows restless. Void energies build at the edges of known space.',
      promptFragment: `The Void stirs with unusual energy tonight. Thread-weavers report anomalous readings in the outer sectors.`,
      intensity,
    }
  },

  BASE_GAS_PRICE: (intensity, direction) => {
    if (direction === 'spike') return {
      houseBeneficiary: 'aurelius',
      houseBurdened: 'valdris',
      parameterAffected: 'resourceDelta',
      narrativeEffect: 'Infrastructure costs spike. Minor houses are squeezed. Only the powerful can afford movement.',
      promptFragment: `Passage through the Strand Corridor grows costly. Only the most powerful houses can afford swift deployment of forces. Minor houses are effectively paralysed.`,
      intensity,
    }
    return {
      houseBeneficiary: 'null',
      houseBurdened: 'null',
      parameterAffected: 'survivalThreat',
      narrativeEffect: 'Movement is unusually swift. Something feels calculated about the calm.',
      promptFragment: `Movement through the Corridors is unusually swift today. The ease of deployment has not gone unnoticed by those planning aggressive moves.`,
      intensity: intensity * 0.3,
    }
  },

  CRYPTO_FEAR_GREED: (intensity, direction) => {
    if (direction === 'crash') return {
      houseBeneficiary: 'null',
      houseBurdened: 'aurelius',
      parameterAffected: 'survivalThreat',
      narrativeEffect: 'Existential dread permeates the Conclave. Worst-case scenarios are suddenly credible.',
      promptFragment: `Fear pervades the Grand Conclave. Delegates who were certain of stability now hedge every word. The worst-case scenarios — previously dismissed — are being whispered about openly.`,
      intensity,
    }
    return {
      houseBeneficiary: 'valdris',
      houseBurdened: 'obsidian',
      parameterAffected: 'allianceShift',
      narrativeEffect: 'Euphoric confidence. Old grudges are forgiven. New alliances seem possible.',
      promptFragment: `A wave of optimism has swept through the Conclave. Old grudges soften. Alliance proposals that seemed impossible last week are now being entertained with genuine enthusiasm.`,
      intensity,
    }
  },
}

// ─── SignalFetcher ─────────────────────────────────────────────────────────────

/**
 * Fetches real-world signals from external APIs.
 * In production: CoinGecko (free tier), Twitter v2 API, Alchemy/viem.
 * In POC: uses realistic mock data to demonstrate the mapping layer.
 */
export class SignalFetcher {
  private readonly coingeckoBase = 'https://api.coingecko.com/api/v3'

  /** Fetch all signals for a chapter-generation event */
  async fetchAll(): Promise<RawSignal[]> {
    const signals = await Promise.allSettled([
      this.fetchCryptoPrices(),
      this.fetchSocialMentions(),
      this.fetchOnChainActivity(),
      this.fetchInternalEntropy(),
    ])

    return signals
      .filter((r): r is PromiseFulfilledResult<RawSignal[]> => r.status === 'fulfilled')
      .flatMap((r) => r.value)
  }

  private async fetchCryptoPrices(): Promise<RawSignal[]> {
    try {
      // Real CoinGecko call (free tier, no key needed)
      const resp = await fetch(
        `${this.coingeckoBase}/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true`,
        { signal: AbortSignal.timeout(5000) },
      )

      if (!resp.ok) throw new Error('CoinGecko unavailable')
      const data = await resp.json() as {
        bitcoin?: { usd: number; usd_24h_change: number }
        ethereum?: { usd: number; usd_24h_change: number }
      }

      const signals: RawSignal[] = []

      const btcChange = data.bitcoin?.usd_24h_change ?? 0
      signals.push({
        id: `crypto-btc-${Date.now()}`,
        source: 'crypto',
        metric: 'BTC_24H_CHANGE',
        value: btcChange,
        direction: this.priceDirection(btcChange),
        intensity: Math.min(1, Math.abs(btcChange) / 20),
        timestamp: new Date(),
        raw: data.bitcoin ?? {},
      })

      return signals
    } catch {
      // Fallback mock for offline/dev
      return this.mockCryptoSignals()
    }
  }

  private async fetchSocialMentions(): Promise<RawSignal[]> {
    // In production: Twitter API v2 search for "voidborne" mentions
    // POC: simulate based on time-of-day entropy
    const hour = new Date().getHours()
    const isActiveHour = hour >= 14 && hour <= 22
    const mentionVolume = isActiveHour
      ? 45 + Math.floor(Math.random() * 200)
      : 5 + Math.floor(Math.random() * 20)
    const baseline = 60
    const intensity = Math.min(1, Math.abs(mentionVolume - baseline) / baseline)
    const direction: SignalDirection = mentionVolume > baseline * 2 ? 'surge' : mentionVolume > baseline * 1.3 ? 'spike' : 'neutral'

    return [{
      id: `social-mentions-${Date.now()}`,
      source: 'social',
      metric: 'VOIDBORNE_SOCIAL_MENTIONS',
      value: mentionVolume,
      direction,
      intensity,
      timestamp: new Date(),
      raw: { mentions: mentionVolume, baseline, source: 'twitter_v2_mock' },
    }]
  }

  private async fetchOnChainActivity(): Promise<RawSignal[]> {
    // In production: Alchemy/Viem — query FORGE token transfer events last 24h
    const mockVolume = 12000 + Math.floor(Math.random() * 50000)
    const baseline = 20000
    const intensity = Math.min(1, Math.abs(mockVolume - baseline) / baseline)
    const direction: SignalDirection = mockVolume > baseline * 1.5 ? 'surge' : mockVolume < baseline * 0.5 ? 'crash' : 'neutral'

    return [{
      id: `onchain-forge-${Date.now()}`,
      source: 'onchain',
      metric: 'FORGE_VOLUME_24H',
      value: mockVolume,
      direction,
      intensity,
      timestamp: new Date(),
      raw: { volume: mockVolume, baseline, token: '$FORGE', chain: 'base' },
    }]
  }

  private async fetchInternalEntropy(): Promise<RawSignal[]> {
    // Derived from internal platform state (days since last upset, faction war status)
    const daysSinceUpset = Math.floor(Math.random() * 7)
    const direction: SignalDirection = daysSinceUpset > 5 ? 'volatile' : 'neutral'
    const intensity = Math.min(1, daysSinceUpset / 7)

    return [{
      id: `internal-entropy-${Date.now()}`,
      source: 'internal',
      metric: 'NARRATIVE_ENTROPY',
      value: daysSinceUpset,
      direction,
      intensity,
      timestamp: new Date(),
      raw: { daysSinceLastUpset: daysSinceUpset },
    }]
  }

  private priceDirection(pct: number): SignalDirection {
    if (pct < -10) return 'crash'
    if (pct < -3) return 'volatile'
    if (pct > 10) 'surge'
    if (pct > 3) return 'spike'
    return 'neutral'
  }

  private mockCryptoSignals(): RawSignal[] {
    const scenarios = [
      { change: -14.2, direction: 'crash' as SignalDirection },
      { change: 8.7, direction: 'surge' as SignalDirection },
      { change: -1.2, direction: 'neutral' as SignalDirection },
      { change: 22.1, direction: 'surge' as SignalDirection },
    ]
    const pick = scenarios[Math.floor(Math.random() * scenarios.length)]

    return [{
      id: `crypto-btc-mock-${Date.now()}`,
      source: 'crypto',
      metric: 'BTC_24H_CHANGE',
      value: pick.change,
      direction: pick.direction,
      intensity: Math.min(1, Math.abs(pick.change) / 20),
      timestamp: new Date(),
      raw: { usd: 95000 + pick.change * 950, usd_24h_change: pick.change, mock: true },
    }]
  }
}

// ─── ChaosMapper ──────────────────────────────────────────────────────────────

/**
 * Maps raw signals to narrative parameters and generates prompt fragments.
 */
export class ChaosMapper {
  map(signal: RawSignal): ChaosSignal {
    const mappingFn = SIGNAL_NARRATIVE_MAP[signal.metric]
    const mapping: NarrativeMapping = mappingFn
      ? mappingFn(signal.intensity, signal.direction)
      : this.defaultMapping(signal)

    return {
      id: `chaos-${signal.id}`,
      raw: signal,
      mapping,
      createdAt: new Date(),
    }
  }

  mapAll(signals: RawSignal[]): ChaosSignal[] {
    return signals
      .filter((s) => s.intensity > 0.15)    // filter out noise
      .map((s) => this.map(s))
      .sort((a, b) => b.raw.intensity - a.raw.intensity)  // most intense first
  }

  private defaultMapping(signal: RawSignal): NarrativeMapping {
    return {
      houseBeneficiary: 'strand',
      houseBurdened: 'null',
      parameterAffected: 'politicalPressure',
      narrativeEffect: 'Unexplained fluctuations in the Strand weave. Seers cannot account for it.',
      promptFragment: `A subtle wrongness pervades the Strand today. Thread-weavers report readings outside any known pattern. No one speaks of it openly.`,
      intensity: signal.intensity * 0.3,
    }
  }
}

// ─── ChaosMarketEngine ─────────────────────────────────────────────────────────

/**
 * Opens 30-minute prediction markets before each chapter:
 * "Will today's crypto crash appear in Chapter N?"
 */
export class ChaosMarketEngine {
  private markets: Map<string, ChaosMarket> = new Map()

  openMarkets(chapterNumber: number, signals: ChaosSignal[]): ChaosMarket[] {
    const markets: ChaosMarket[] = []
    const closesAt = new Date(Date.now() + 30 * 60 * 1000) // 30 min window

    // Market 1: "Which signal will Claude use?"
    const signalNames = signals.slice(0, 3).map((s) => s.mapping.narrativeEffect)

    if (signalNames.length > 0) {
      const m1: ChaosMarket = {
        id: `cm-${chapterNumber}-which`,
        chapterNumber,
        question: `Which Chaos Signal will shape Chapter ${chapterNumber}'s narrative?`,
        options: [...signalNames, 'None — Claude ignores all signals'],
        bets: [],
        status: 'open',
        openedAt: new Date(),
        closesAt,
      }
      this.markets.set(m1.id, m1)
      markets.push(m1)
    }

    // Market 2: Chaos Intensity
    const intensityMarket: ChaosMarket = {
      id: `cm-${chapterNumber}-intensity`,
      chapterNumber,
      question: `How intense will the Chaos effect be in Chapter ${chapterNumber}?`,
      options: ['Subtle (flavour only)', 'Moderate (plot beat affected)', 'Dominant (main conflict shaped by Chaos)'],
      bets: [],
      status: 'open',
      openedAt: new Date(),
      closesAt,
    }
    this.markets.set(intensityMarket.id, intensityMarket)
    markets.push(intensityMarket)

    return markets
  }

  placeBet(
    marketId: string,
    playerAddress: string,
    option: string,
    amount: number,
  ): ChaosMarketBet {
    const market = this.markets.get(marketId)
    if (!market) throw new Error(`Market ${marketId} not found`)
    if (market.status !== 'open') throw new Error(`Market ${marketId} is closed`)
    if (!market.options.includes(option)) throw new Error(`Invalid option`)

    const bet: ChaosMarketBet = {
      id: `cmb-${Date.now()}-${playerAddress.slice(-4)}`,
      marketId,
      playerAddress,
      option,
      amount,
      mainBetMultiplier: 2.0,  // correct chaos bet → 2x multiplier on chapter bet
      status: 'open',
      placedAt: new Date(),
    }

    market.bets.push(bet)
    return bet
  }

  resolveMarket(marketId: string, result: string): ChaosMarket {
    const market = this.markets.get(marketId)
    if (!market) throw new Error(`Market ${marketId} not found`)

    market.status = 'resolved'
    market.result = result

    for (const bet of market.bets) {
      bet.status = bet.option === result ? 'won' : 'lost'
    }

    return market
  }

  getOpenMarkets(chapterNumber: number): ChaosMarket[] {
    return Array.from(this.markets.values()).filter(
      (m) => m.chapterNumber === chapterNumber && m.status === 'open',
    )
  }
}

// ─── ClaudeChaosInjector ──────────────────────────────────────────────────────

/**
 * Formats the top 3 chaos signals into a structured block for Claude's
 * system prompt, injected alongside the Consequence Ledger context.
 */
export class ClaudeChaosInjector {
  buildChapterContext(chapterNumber: number, signals: ChaosSignal[]): ChaosChapterContext {
    const top = signals.slice(0, 3)
    const avgIntensity = top.reduce((s, c) => s + c.raw.intensity, 0) / (top.length || 1)

    const chaosIntensity: ChaosChapterContext['chaosIntensity'] =
      avgIntensity > 0.7 ? 'maelstrom'
      : avgIntensity > 0.5 ? 'volatile'
      : avgIntensity > 0.25 ? 'tense'
      : 'calm'

    const dominant = top[0]?.mapping.narrativeEffect ?? 'No dominant signal'
    const promptBlock = this.buildPromptBlock(chapterNumber, top, chaosIntensity)

    return { chapterNumber, signals: top, promptBlock, chaosIntensity, dominantEffect: dominant }
  }

  private buildPromptBlock(
    chapter: number,
    signals: ChaosSignal[],
    intensity: ChaosChapterContext['chaosIntensity'],
  ): string {
    if (signals.length === 0) return ''

    const lines: string[] = [
      `───────────────────────────────────────────────────`,
      `CHAOS ORACLE PROTOCOL — CHAPTER ${chapter}`,
      `Environmental Intensity: ${intensity.toUpperCase()}`,
      `Real-world signals shaping today's narrative context:`,
      `───────────────────────────────────────────────────`,
    ]

    for (const signal of signals) {
      const pct = (signal.raw.intensity * 100).toFixed(0)
      lines.push(``)
      lines.push(`[${signal.raw.metric}] (intensity ${pct}%)`)
      lines.push(signal.mapping.promptFragment)
      lines.push(`→ Narrative effect: ${signal.mapping.narrativeEffect}`)
      lines.push(`→ Benefits: House ${signal.mapping.houseBeneficiary.toUpperCase()}`)
      lines.push(`→ Burdens: House ${signal.mapping.houseBurdened.toUpperCase()}`)
    }

    lines.push(``)
    lines.push(`───────────────────────────────────────────────────`)
    lines.push(`INSTRUCTION: Weave the above environmental context`)
    lines.push(`naturally into the chapter's atmosphere. Do NOT`)
    lines.push(`mention "markets" or "BTC" explicitly — translate`)
    lines.push(`to in-world equivalents (trade routes, Strand flux,`)
    lines.push(`Conclave treasury pressures, Void anomalies, etc.)`)

    return lines.join('\n')
  }
}

// ─── ChaosSignalArchive ────────────────────────────────────────────────────────

/**
 * Historical record of signal↔chapter correlations.
 * Used to train the ChaosMapper over time (which signals had which effects).
 */
export class ChaosSignalArchive {
  private archive: Array<{ chapter: number; signal: ChaosSignal; actualEffect: string }> = []

  record(chapter: number, signal: ChaosSignal, actualEffect: string): void {
    signal.usedInChapter = chapter
    this.archive.push({ chapter, signal, actualEffect })
  }

  /** Get which signal types historically have the strongest narrative effects */
  getSignalEffectivenessReport(): Record<string, { uses: number; avgIntensity: number }> {
    const report: Record<string, { uses: number; total: number; avgIntensity: number }> = {}

    for (const entry of this.archive) {
      const metric = entry.signal.raw.metric
      if (!report[metric]) report[metric] = { uses: 0, total: 0, avgIntensity: 0 }
      report[metric].uses++
      report[metric].total += entry.signal.raw.intensity
      report[metric].avgIntensity = report[metric].total / report[metric].uses
    }

    return report
  }

  getChapterSignals(chapter: number): ChaosSignal[] {
    return this.archive
      .filter((e) => e.chapter === chapter)
      .map((e) => e.signal)
  }
}

// ─── ChaosOracleEngine (Master) ───────────────────────────────────────────────

export class ChaosOracleEngine {
  readonly fetcher: SignalFetcher
  readonly mapper: ChaosMapper
  readonly markets: ChaosMarketEngine
  readonly injector: ClaudeChaosInjector
  readonly archive: ChaosSignalArchive

  constructor() {
    this.fetcher = new SignalFetcher()
    this.mapper = new ChaosMapper()
    this.markets = new ChaosMarketEngine()
    this.injector = new ClaudeChaosInjector()
    this.archive = new ChaosSignalArchive()
  }

  /**
   * Full pipeline: fetch → map → open markets → build Claude context
   * Called before each chapter generation.
   */
  async processForChapter(chapterNumber: number): Promise<{
    context: ChaosChapterContext
    openMarkets: ChaosMarket[]
    signals: ChaosSignal[]
  }> {
    const raw = await this.fetcher.fetchAll()
    const signals = this.mapper.mapAll(raw)
    const context = this.injector.buildChapterContext(chapterNumber, signals)
    const openMarkets = this.markets.openMarkets(chapterNumber, signals)

    return { context, openMarkets, signals }
  }

  /** Record which signals were actually reflected in the generated chapter */
  archiveChapterSignals(chapterNumber: number, signals: ChaosSignal[], chapterSummary: string): void {
    for (const signal of signals) {
      const effect = chapterSummary.toLowerCase().includes(signal.mapping.houseBeneficiary)
        ? signal.mapping.narrativeEffect
        : 'not reflected'
      this.archive.record(chapterNumber, signal, effect)
    }
  }
}

// ─── Demo runner ──────────────────────────────────────────────────────────────

export async function runChaosOracleDemo(): Promise<void> {
  console.log('\n╔══════════════════════════════════════════════════╗')
  console.log('║  CHAOS ORACLE PROTOCOL — DEMO                    ║')
  console.log('║  Innovation Cycle #53 — The Living Story Protocol║')
  console.log('╚══════════════════════════════════════════════════╝\n')

  const engine = new ChaosOracleEngine()

  console.log('🌍 Fetching real-world signals...')
  const { context, openMarkets, signals } = await engine.processForChapter(16)

  console.log(`\n📡 Signals captured: ${signals.length}`)
  for (const s of signals) {
    console.log(`  [${s.raw.metric}] direction=${s.raw.direction} intensity=${(s.raw.intensity * 100).toFixed(0)}%`)
    console.log(`    → ${s.mapping.narrativeEffect}`)
  }

  console.log(`\n🎭 Chaos Intensity: ${context.chaosIntensity.toUpperCase()}`)
  console.log(`🏆 Dominant Effect: ${context.dominantEffect}`)

  console.log('\n📋 Claude Prompt Block:')
  console.log(context.promptBlock)

  console.log(`\n💰 ${openMarkets.length} Chaos Markets opened:`)
  for (const m of openMarkets) {
    console.log(`  Market: "${m.question}"`)
    for (const opt of m.options) {
      console.log(`    • ${opt}`)
    }
  }

  // Simulate a bet
  if (openMarkets.length > 0) {
    const bet = engine.markets.placeBet(
      openMarkets[0].id,
      '0xAlice',
      openMarkets[0].options[0],
      25,
    )
    console.log(`\n💸 Alice placed a bet: "${bet.option}" ($${bet.amount} USDC)`)
    console.log(`  → If correct: 2x multiplier on chapter bet unlocked`)
  }

  // Archive after generation
  engine.archiveChapterSignals(16, signals, 'House Valdris faces economic pressure as trade routes falter')

  console.log('\n✅ Chaos Oracle demo complete.\n')
}

export function createChaosOracleEngine(): ChaosOracleEngine {
  return new ChaosOracleEngine()
}
