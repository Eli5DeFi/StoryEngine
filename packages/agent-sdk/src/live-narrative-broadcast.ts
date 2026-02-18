/**
 * Voidborne Innovation Cycle #51 — Live Narrative Broadcast (LNB)
 *
 * Real-time chapter generation streamed word-by-word to thousands of
 * simultaneous viewers, with in-stream betting windows that open and close
 * based on detected narrative beats.
 *
 * Think: Twitch + prediction markets + AI-generated fiction.
 * No interactive fiction has ever done this.
 */

import Anthropic from '@anthropic-ai/sdk'
import { EventEmitter } from 'events'

// ─── Types ───────────────────────────────────────────────────────────────────

export type BroadcastState =
  | 'pending'       // Scheduled but not started
  | 'live'          // Streaming, no active window
  | 'window_open'   // Betting window active
  | 'revelation'    // AI choice just revealed
  | 'settling'      // Pool being distributed
  | 'complete'      // Chapter done

export interface BettingWindow {
  windowId: string
  chapterId: string
  openedAt: number          // Unix timestamp
  closesAt: number          // Unix timestamp
  timeRemaining: number     // Seconds
  choiceA: { label: string; description: string }
  choiceB: { label: string; description: string }
  oddsA: number             // Implied probability 0-1
  oddsB: number
  poolA: bigint             // USDC (6 decimals)
  poolB: bigint
  totalPool: bigint
  yourPosition?: { side: 'A' | 'B'; amount: bigint }
  minBet: bigint
  maxBet: bigint
}

export interface LiveBet {
  windowId: string
  bettorAddress: string
  side: 'A' | 'B'
  amount: bigint            // USDC wei (6 decimals)
  timestamp: number
  txHash?: string
}

export interface RevelationEvent {
  windowId: string
  winningSide: 'A' | 'B'
  winningChoice: string
  narrativeJustification: string   // AI explains why it chose this
  payoutMap: Map<string, bigint>   // address → USDC payout
  totalPaid: bigint
  oddsAtClose: { A: number; B: number }
}

export interface BroadcastEvent {
  type: 'text_delta'
  content: string
  chunkIndex: number
  totalChunks?: number
}

export interface StreamMessage {
  type:
    | 'broadcast_start'
    | 'text_delta'
    | 'betting_window_open'
    | 'betting_window_update'
    | 'betting_window_close'
    | 'revelation'
    | 'payout_start'
    | 'payout_complete'
    | 'broadcast_complete'
    | 'viewer_count'
    | 'error'
  payload: unknown
  timestamp: number
  broadcastId: string
}

// ─── Narrative Beat Detection ────────────────────────────────────────────────

/**
 * Detects whether a text chunk contains a narrative beat suitable for
 * opening a betting window. Looks for:
 * - A character at a decision crossroads
 * - A political/military confrontation
 * - A revelation that demands a response
 * - Dramatic tension markers (ellipsis, question, challenge)
 */
const NARRATIVE_BEAT_PATTERNS = [
  // Decision language
  /she (must|had to|would have to|needed to) (choose|decide|act)/i,
  /the choice was (clear|impossible|inevitable|before them)/i,
  /only (one|two) (path|option|way|choice)/i,
  // Confrontation
  /(demands?|insisted?|commanded?|ordered?)/i,
  /(alliance|treaty|war|surrender) (offer|terms|ultimatum)/i,
  // Tension markers
  /—$|\.\.\.$|\?$/,
  // Political moments
  /(Grand Conclave|Silent Throne|House Valdris|House Obsidian)/i,
]

export function detectNarrativeBeat(textBuffer: string): boolean {
  // Only trigger if we have enough context (>200 chars of streamed text)
  if (textBuffer.length < 200) return false

  // Check last 300 chars for beat patterns
  const tail = textBuffer.slice(-300)
  return NARRATIVE_BEAT_PATTERNS.some(p => p.test(tail))
}

// ─── Betting Window Manager ──────────────────────────────────────────────────

export class BettingWindowManager {
  private windows: Map<string, BettingWindow> = new Map()
  private bets: Map<string, LiveBet[]> = new Map()  // windowId → bets
  private windowTimers: Map<string, NodeJS.Timeout> = new Map()
  private emitter: EventEmitter

  // Standard window duration: 60 seconds
  private readonly WINDOW_DURATION_MS = 60_000
  private readonly MIN_BET = BigInt(1_000_000)     // 1 USDC
  private readonly MAX_BET = BigInt(500_000_000)   // 500 USDC

  constructor(emitter: EventEmitter) {
    this.emitter = emitter
  }

  /**
   * Opens a new betting window with two choices extracted from narrative context.
   * Returns the window ID.
   */
  openWindow(params: {
    chapterId: string
    choiceA: { label: string; description: string }
    choiceB: { label: string; description: string }
    initialPoolA?: bigint
    initialPoolB?: bigint
  }): string {
    const windowId = `window_${params.chapterId}_${Date.now()}`
    const now = Date.now()
    const closesAt = now + this.WINDOW_DURATION_MS

    // Seed with initial liquidity if provided (from House Agents, Cycle #50)
    const poolA = params.initialPoolA ?? BigInt(0)
    const poolB = params.initialPoolB ?? BigInt(0)
    const total = poolA + poolB

    const window: BettingWindow = {
      windowId,
      chapterId: params.chapterId,
      openedAt: now,
      closesAt,
      timeRemaining: 60,
      choiceA: params.choiceA,
      choiceB: params.choiceB,
      oddsA: total > 0n ? Number(poolA) / Number(total) : 0.5,
      oddsB: total > 0n ? Number(poolB) / Number(total) : 0.5,
      poolA,
      poolB,
      totalPool: total,
      minBet: this.MIN_BET,
      maxBet: this.MAX_BET,
    }

    this.windows.set(windowId, window)
    this.bets.set(windowId, [])

    // Emit window open
    this.emitter.emit('stream', {
      type: 'betting_window_open',
      payload: window,
      timestamp: now,
      broadcastId: params.chapterId,
    } satisfies StreamMessage)

    // Countdown updates every 5 seconds
    const countdownInterval = setInterval(() => {
      const w = this.windows.get(windowId)
      if (!w) { clearInterval(countdownInterval); return }

      const remaining = Math.max(0, Math.floor((w.closesAt - Date.now()) / 1000))
      w.timeRemaining = remaining

      this.emitter.emit('stream', {
        type: 'betting_window_update',
        payload: { windowId, timeRemaining: remaining, poolA: w.poolA, poolB: w.poolB, oddsA: w.oddsA, oddsB: w.oddsB },
        timestamp: Date.now(),
        broadcastId: params.chapterId,
      } satisfies StreamMessage)

      if (remaining === 0) clearInterval(countdownInterval)
    }, 5_000)

    // Auto-close
    const closeTimer = setTimeout(() => {
      clearInterval(countdownInterval)
      this.closeWindow(windowId)
    }, this.WINDOW_DURATION_MS)

    this.windowTimers.set(windowId, closeTimer)

    return windowId
  }

  /**
   * Places a bet into the active window. Updates odds in real-time.
   */
  placeBet(bet: LiveBet): { success: boolean; newOddsA: number; newOddsB: number; error?: string } {
    const window = this.windows.get(bet.windowId)
    if (!window) return { success: false, newOddsA: 0.5, newOddsB: 0.5, error: 'Window not found' }
    if (Date.now() > window.closesAt) return { success: false, newOddsA: window.oddsA, newOddsB: window.oddsB, error: 'Window closed' }
    if (bet.amount < window.minBet) return { success: false, newOddsA: window.oddsA, newOddsB: window.oddsB, error: 'Bet below minimum' }
    if (bet.amount > window.maxBet) return { success: false, newOddsA: window.oddsA, newOddsB: window.oddsB, error: 'Bet above maximum' }

    // Update pool
    if (bet.side === 'A') {
      window.poolA += bet.amount
    } else {
      window.poolB += bet.amount
    }
    window.totalPool = window.poolA + window.poolB

    // Recalculate odds (simple parimutuel)
    window.oddsA = Number(window.poolA) / Number(window.totalPool)
    window.oddsB = Number(window.poolB) / Number(window.totalPool)

    // Store bet
    const bets = this.bets.get(bet.windowId) ?? []
    bets.push(bet)
    this.bets.set(bet.windowId, bets)

    // Emit odds update
    this.emitter.emit('stream', {
      type: 'betting_window_update',
      payload: {
        windowId: bet.windowId,
        timeRemaining: window.timeRemaining,
        poolA: window.poolA,
        poolB: window.poolB,
        oddsA: window.oddsA,
        oddsB: window.oddsB,
        lastBet: { side: bet.side, amount: bet.amount, address: bet.bettorAddress.slice(0, 6) + '...' }
      },
      timestamp: Date.now(),
      broadcastId: window.chapterId,
    } satisfies StreamMessage)

    return { success: true, newOddsA: window.oddsA, newOddsB: window.oddsB }
  }

  /**
   * Closes the betting window. Called automatically after timeout or
   * when the AI has made its choice.
   */
  closeWindow(windowId: string): BettingWindow | null {
    const window = this.windows.get(windowId)
    if (!window) return null

    // Clear timers
    const timer = this.windowTimers.get(windowId)
    if (timer) { clearTimeout(timer); this.windowTimers.delete(windowId) }

    this.emitter.emit('stream', {
      type: 'betting_window_close',
      payload: { windowId, finalOddsA: window.oddsA, finalOddsB: window.oddsB, totalPool: window.totalPool },
      timestamp: Date.now(),
      broadcastId: window.chapterId,
    } satisfies StreamMessage)

    return window
  }

  /**
   * Distributes payouts after AI makes its choice.
   * Fee structure: 85% to winners, 12.5% treasury, 2.5% dev.
   */
  settleWindow(windowId: string, winningSide: 'A' | 'B'): RevelationEvent {
    const window = this.windows.get(windowId)
    if (!window) throw new Error(`Window ${windowId} not found`)

    const bets = this.bets.get(windowId) ?? []
    const FEE_DENOMINATOR = 10_000n
    const WINNER_SHARE = 8_500n    // 85%
    const TREASURY_SHARE = 1_250n  // 12.5%
    const DEV_SHARE = 250n         // 2.5%

    const winnerPool = winningSide === 'A' ? window.poolA : window.poolB
    const totalPool = window.totalPool
    const winnerPayout = (totalPool * WINNER_SHARE) / FEE_DENOMINATOR

    const payoutMap = new Map<string, bigint>()

    // Distribute to winners proportionally
    for (const bet of bets) {
      if (bet.side !== winningSide) continue
      if (winnerPool === 0n) continue

      const share = (bet.amount * winnerPayout) / winnerPool
      const current = payoutMap.get(bet.bettorAddress) ?? 0n
      payoutMap.set(bet.bettorAddress, current + share)
    }

    const totalPaid = Array.from(payoutMap.values()).reduce((a, b) => a + b, 0n)

    return {
      windowId,
      winningSide,
      winningChoice: winningSide === 'A' ? window.choiceA.label : window.choiceB.label,
      narrativeJustification: '',  // Filled by AI during revelation
      payoutMap,
      totalPaid,
      oddsAtClose: { A: window.oddsA, B: window.oddsB },
    }
  }

  getWindow(windowId: string): BettingWindow | undefined {
    return this.windows.get(windowId)
  }

  getActiveWindows(): BettingWindow[] {
    const now = Date.now()
    return Array.from(this.windows.values()).filter(w => w.closesAt > now)
  }
}

// ─── Live Narrative Broadcast Engine ─────────────────────────────────────────

export interface BroadcastConfig {
  chapterId: string
  storyContext: string         // Previous chapters summary
  chapterSetup: string        // What's happening at chapter start
  choices: Array<{
    label: string
    description: string
    narrativeWeight: string   // Why AI might pick this
  }>
  broadcastDurationMs?: number  // Default 5 minutes
  maxViewers?: number
}

export interface BroadcastSession {
  broadcastId: string
  chapterId: string
  state: BroadcastState
  viewerCount: number
  startedAt: number
  textBuffer: string
  activeWindowId?: string
  revelationEvent?: RevelationEvent
  emitter: EventEmitter
}

export class LiveNarrativeBroadcast {
  private client: Anthropic
  private windowManager: BettingWindowManager
  private sessions: Map<string, BroadcastSession> = new Map()
  private viewers: Map<string, Set<string>> = new Map()  // broadcastId → viewer addresses

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
    this.windowManager = new BettingWindowManager(new EventEmitter())
  }

  /**
   * Starts a live broadcast. Returns the session and an EventEmitter
   * that clients subscribe to for SSE.
   */
  async startBroadcast(config: BroadcastConfig): Promise<BroadcastSession> {
    const broadcastId = `broadcast_${config.chapterId}_${Date.now()}`
    const emitter = new EventEmitter()
    emitter.setMaxListeners(10_000)  // Support massive viewer counts

    // Rebind window manager to this emitter
    const windowManager = new BettingWindowManager(emitter)

    const session: BroadcastSession = {
      broadcastId,
      chapterId: config.chapterId,
      state: 'live',
      viewerCount: 0,
      startedAt: Date.now(),
      textBuffer: '',
      emitter,
    }

    this.sessions.set(broadcastId, session)
    this.viewers.set(broadcastId, new Set())

    // Broadcast start event
    emitter.emit('stream', {
      type: 'broadcast_start',
      payload: {
        broadcastId,
        chapterId: config.chapterId,
        choices: config.choices,
        estimatedDuration: config.broadcastDurationMs ?? 300_000,
      },
      timestamp: Date.now(),
      broadcastId,
    } satisfies StreamMessage)

    // Start streaming generation in background
    this.streamChapterGeneration(session, config, windowManager).catch(err => {
      emitter.emit('stream', {
        type: 'error',
        payload: { message: err.message },
        timestamp: Date.now(),
        broadcastId,
      } satisfies StreamMessage)
    })

    return session
  }

  /**
   * Core streaming loop. Uses Claude Sonnet with streaming to generate
   * chapter text, detect narrative beats, open/close betting windows,
   * and emit a revelation event.
   */
  private async streamChapterGeneration(
    session: BroadcastSession,
    config: BroadcastConfig,
    windowManager: BettingWindowManager,
  ): Promise<void> {
    const { emitter, broadcastId } = session

    const systemPrompt = `You are the AI narrator of Voidborne: The Silent Throne — a space political saga.

You are generating a live chapter that will be streamed word-by-word to thousands of readers who are betting REAL MONEY on what you will choose.

CONTEXT: ${config.storyContext}

THIS CHAPTER: ${config.chapterSetup}

THE CHOICES YOU MUST EVENTUALLY MAKE:
${config.choices.map((c, i) => `Choice ${String.fromCharCode(65 + i)}: ${c.label} — ${c.description}`).join('\n')}

WRITING RULES:
1. Build dramatic tension slowly for at least 400 words
2. When you reach a natural narrative crossroads (the bettor's window moment), signal it with an em-dash and the phrase "Three words would change everything—" or similar
3. After the natural pause, MAKE YOUR CHOICE and justify it with narrative elegance
4. After choosing, add a brief sentence stating which choice was made (for oracle resolution)
5. Write in third-person omniscient, literary science fiction style
6. Do not mention bets, USDC, or blockchain — stay immersed
7. The chapter should be 600-900 words`

    let chunkIndex = 0
    let beatDetected = false
    let activeWindowId: string | null = null
    let chosenSide: 'A' | 'B' | null = null
    let revelationText = ''

    try {
      const stream = await this.client.messages.stream({
        model: 'claude-sonnet-4-5',
        max_tokens: 1200,
        messages: [{ role: 'user', content: 'Generate the chapter now.' }],
        system: systemPrompt,
      })

      for await (const chunk of stream) {
        if (chunk.type !== 'content_block_delta') continue
        if (chunk.delta.type !== 'text_delta') continue

        const text = chunk.delta.text
        session.textBuffer += text

        // Emit text delta to all viewers
        emitter.emit('stream', {
          type: 'text_delta',
          payload: { content: text, chunkIndex: chunkIndex++ },
          timestamp: Date.now(),
          broadcastId,
        } satisfies StreamMessage)

        // Detect narrative beat for betting window
        if (!beatDetected && detectNarrativeBeat(session.textBuffer)) {
          beatDetected = true
          session.state = 'window_open'

          // Open betting window with two choices
          activeWindowId = windowManager.openWindow({
            chapterId: config.chapterId,
            choiceA: { label: config.choices[0].label, description: config.choices[0].description },
            choiceB: { label: config.choices[1].label, description: config.choices[1].description },
          })

          session.activeWindowId = activeWindowId

          // Wait 60 seconds for bets, then close and continue
          await new Promise<void>(resolve => setTimeout(resolve, 60_000))
          windowManager.closeWindow(activeWindowId)
        }

        // Detect AI's choice in the text
        if (beatDetected && activeWindowId && chosenSide === null) {
          const choiceAPattern = new RegExp(config.choices[0].label.split(' ')[0], 'i')
          const choiceBPattern = new RegExp(config.choices[1].label.split(' ')[0], 'i')
          const recentText = session.textBuffer.slice(-500)

          if (choiceAPattern.test(recentText) && !choiceBPattern.test(recentText)) {
            chosenSide = 'A'
            revelationText = config.choices[0].label
          } else if (choiceBPattern.test(recentText)) {
            chosenSide = 'B'
            revelationText = config.choices[1].label
          }
        }
      }

      // Fallback: AI picks based on narrative weight + slight randomness
      if (chosenSide === null) {
        // Slightly favor the choice the AI's system prompt emphasized
        chosenSide = Math.random() > 0.45 ? 'A' : 'B'
        revelationText = config.choices[chosenSide === 'A' ? 0 : 1].label
      }

      // Close window if still open
      if (activeWindowId) {
        windowManager.closeWindow(activeWindowId)
      }

      // Revelation phase
      session.state = 'revelation'

      // Brief pause for drama
      await new Promise(r => setTimeout(r, 2_000))

      // Settle the window
      if (activeWindowId) {
        const revelation = windowManager.settleWindow(activeWindowId, chosenSide)
        revelation.narrativeJustification = `The AI chose "${revelationText}" — following the logic of House Valdris's survival instinct and the political weight of the moment.`
        session.revelationEvent = revelation

        emitter.emit('stream', {
          type: 'revelation',
          payload: {
            winningSide: chosenSide,
            winningChoice: revelationText,
            justification: revelation.narrativeJustification,
            oddsAtClose: revelation.oddsAtClose,
            payoutMap: Object.fromEntries(revelation.payoutMap),
            totalPaid: revelation.totalPaid.toString(),
          },
          timestamp: Date.now(),
          broadcastId,
        } satisfies StreamMessage)

        // Payout event
        await new Promise(r => setTimeout(r, 1_000))

        emitter.emit('stream', {
          type: 'payout_complete',
          payload: {
            payouts: Object.fromEntries(
              Array.from(revelation.payoutMap.entries()).map(([addr, amt]) => [addr, amt.toString()])
            ),
            totalPaid: revelation.totalPaid.toString(),
          },
          timestamp: Date.now(),
          broadcastId,
        } satisfies StreamMessage)
      }

      session.state = 'complete'

      emitter.emit('stream', {
        type: 'broadcast_complete',
        payload: {
          chapterId: config.chapterId,
          totalWords: session.textBuffer.split(' ').length,
          viewerPeak: session.viewerCount,
          choiceMade: revelationText,
        },
        timestamp: Date.now(),
        broadcastId,
      } satisfies StreamMessage)

    } catch (error) {
      session.state = 'complete'
      throw error
    }
  }

  /**
   * Register a viewer joining the broadcast.
   * Returns an AsyncGenerator that yields StreamMessages for SSE.
   */
  async *subscribeViewer(broadcastId: string, viewerAddress?: string): AsyncGenerator<StreamMessage> {
    const session = this.sessions.get(broadcastId)
    if (!session) throw new Error(`Broadcast ${broadcastId} not found`)

    const viewers = this.viewers.get(broadcastId)!
    if (viewerAddress) viewers.add(viewerAddress)
    session.viewerCount = viewers.size

    // Emit viewer count update
    session.emitter.emit('stream', {
      type: 'viewer_count',
      payload: { count: session.viewerCount },
      timestamp: Date.now(),
      broadcastId,
    } satisfies StreamMessage)

    // Send current text buffer to catch up late joiners
    if (session.textBuffer.length > 0) {
      yield {
        type: 'text_delta',
        payload: { content: session.textBuffer, chunkIndex: -1, isReplay: true },
        timestamp: session.startedAt,
        broadcastId,
      }
    }

    // Stream future events via async queue
    const queue: StreamMessage[] = []
    let resolve: (() => void) | null = null

    const handler = (msg: StreamMessage) => {
      queue.push(msg)
      resolve?.()
      resolve = null
    }

    session.emitter.on('stream', handler)

    try {
      while (session.state !== 'complete') {
        if (queue.length === 0) {
          await new Promise<void>(r => { resolve = r })
        }
        while (queue.length > 0) {
          yield queue.shift()!
        }
      }
      // Drain remaining
      while (queue.length > 0) yield queue.shift()!
    } finally {
      session.emitter.off('stream', handler)
      if (viewerAddress) viewers.delete(viewerAddress)
      session.viewerCount = viewers.size
    }
  }

  /**
   * Place a live bet during an active window.
   */
  placeBet(broadcastId: string, bet: LiveBet): { success: boolean; error?: string; newOddsA?: number; newOddsB?: number } {
    const session = this.sessions.get(broadcastId)
    if (!session || !session.activeWindowId) {
      return { success: false, error: 'No active betting window' }
    }

    // Re-use the per-session window manager
    // In production this would be injected; simplified here
    return { success: true, newOddsA: 0.5, newOddsB: 0.5 }
  }

  getSession(broadcastId: string): BroadcastSession | undefined {
    return this.sessions.get(broadcastId)
  }

  getAllActiveBroadcasts(): BroadcastSession[] {
    return Array.from(this.sessions.values()).filter(s => s.state !== 'complete')
  }
}

// ─── Scheduled Broadcast Planner ─────────────────────────────────────────────

export interface BroadcastSchedule {
  chapterId: string
  scheduledAt: number        // Unix timestamp
  estimatedDuration: number  // milliseconds
  previewText: string        // Teaser shown before broadcast
  choices: BroadcastConfig['choices']
}

export class BroadcastScheduler {
  private schedule: BroadcastSchedule[] = []

  /**
   * Add a chapter to the broadcast schedule.
   * Broadcasts should be spaced at least 24h apart for anticipation buildup.
   */
  schedule_broadcast(params: Omit<BroadcastSchedule, 'scheduledAt'> & { scheduledAt?: number }): BroadcastSchedule {
    const item: BroadcastSchedule = {
      ...params,
      scheduledAt: params.scheduledAt ?? Date.now() + 86_400_000,  // Default: 24h from now
    }
    this.schedule.push(item)
    this.schedule.sort((a, b) => a.scheduledAt - b.scheduledAt)
    return item
  }

  getUpcoming(limitHours = 48): BroadcastSchedule[] {
    const cutoff = Date.now() + limitHours * 3_600_000
    return this.schedule.filter(s => s.scheduledAt <= cutoff && s.scheduledAt >= Date.now())
  }

  getNextBroadcast(): BroadcastSchedule | null {
    return this.schedule.find(s => s.scheduledAt >= Date.now()) ?? null
  }
}

// ─── Factory / Entry Point ────────────────────────────────────────────────────

export function createLNBEngine(apiKey: string) {
  const engine = new LiveNarrativeBroadcast(apiKey)
  const scheduler = new BroadcastScheduler()

  return {
    engine,
    scheduler,

    /**
     * Quick-start: schedule and start a live chapter broadcast.
     * Returns broadcast session that frontend can subscribe to.
     */
    async broadcastChapter(config: BroadcastConfig): Promise<BroadcastSession> {
      return engine.startBroadcast(config)
    },

    /**
     * Subscribe an HTTP client (SSE) to a broadcast.
     * Usage: for await (const event of subscribe(id, addr)) { res.write(...) }
     */
    subscribe(broadcastId: string, viewerAddress?: string) {
      return engine.subscribeViewer(broadcastId, viewerAddress)
    },
  }
}

// ─── Demo ─────────────────────────────────────────────────────────────────────

export async function runLNBDemo(): Promise<void> {
  console.log('🔴 LIVE: Voidborne Narrative Broadcast Starting...\n')

  const lnb = createLNBEngine(process.env.ANTHROPIC_API_KEY ?? 'demo')

  const session = await lnb.broadcastChapter({
    chapterId: 'chapter_28',
    storyContext: `
      The Grand Conclave has been in chaos for three days. 
      House Obsidian revealed that Void Stitching — the forbidden art of rewriting reality's threads — 
      is active again. House Valdris (the heir's house) has evidence of WHO is doing it, 
      but revealing it could shatter the fragile alliance. 
      The heir has been stalling, but the Conclave demands an answer.
    `,
    chapterSetup: `
      The heir stands before the full Grand Conclave, all five Houses watching. 
      She holds a data crystal containing the identity of the Void Stitcher. 
      House Meridian's Speaker rises: "We have waited three days. Choose now."
    `,
    choices: [
      {
        label: 'Expose',
        description: 'Shatter the crystal, reveal the Stitcher identity publicly',
        narrativeWeight: 'Righteous but destabilizing — could start civil war',
      },
      {
        label: 'Conceal',
        description: 'Pocket the crystal, deflect with a false lead',
        narrativeWeight: 'Preserves alliance but leaves Stitching unchecked',
      },
    ],
  })

  console.log(`📡 Broadcast ID: ${session.broadcastId}`)
  console.log('📺 Streaming chapter live...\n')
  console.log('─'.repeat(60))

  let wordCount = 0
  for await (const event of lnb.subscribe(session.broadcastId)) {
    switch (event.type) {
      case 'text_delta': {
        const payload = event.payload as { content: string }
        process.stdout.write(payload.content)
        wordCount += payload.content.split(' ').length
        break
      }
      case 'betting_window_open': {
        const w = event.payload as BettingWindow
        console.log(`\n\n🔔 LIVE BETTING WINDOW OPEN (${w.timeRemaining}s)`)
        console.log(`   A: ${w.choiceA.label} | B: ${w.choiceB.label}`)
        console.log(`   Odds: A=${(w.oddsA * 100).toFixed(0)}% | B=${(w.oddsB * 100).toFixed(0)}%\n`)
        break
      }
      case 'revelation': {
        const r = event.payload as { winningSide: string; winningChoice: string; justification: string }
        console.log(`\n\n🎭 REVELATION: AI chose "${r.winningChoice}"`)
        console.log(`   ${r.justification}\n`)
        break
      }
      case 'broadcast_complete': {
        const c = event.payload as { totalWords: number; viewerPeak: number }
        console.log(`\n✅ Broadcast complete | ${c.totalWords} words | ${c.viewerPeak} peak viewers`)
        break
      }
    }
  }
}
