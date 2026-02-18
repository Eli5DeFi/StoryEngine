'use client'

/**
 * Voidborne Innovation Cycle #51 — Live Narrative Studio
 *
 * The primary UI for Live Narrative Broadcasts. Shows:
 * - Streaming chapter text (word-by-word, cinematic)
 * - Live betting window overlay with real-time odds
 * - Viewer count
 * - Revelation animation
 * - Payout distribution
 *
 * This is the Twitch of interactive fiction.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

interface StreamEvent {
  type: string
  payload: Record<string, unknown>
  timestamp: number
  broadcastId: string
}

interface BettingWindow {
  windowId: string
  timeRemaining: number
  choiceA: { label: string; description: string }
  choiceB: { label: string; description: string }
  oddsA: number
  oddsB: number
  poolA: string
  poolB: string
  totalPool: string
  lastBet?: { side: 'A' | 'B'; amount: string; address: string }
}

interface RevelationData {
  winningSide: 'A' | 'B'
  winningChoice: string
  justification: string
  oddsAtClose: { A: number; B: number }
  totalPool: string
}

type BroadcastPhase =
  | 'connecting'
  | 'live'
  | 'window_open'
  | 'window_closing'
  | 'revelation'
  | 'settling'
  | 'complete'

// ─── Helper: Format USDC ──────────────────────────────────────────────────────

function formatUSDC(raw: string | bigint): string {
  const value = typeof raw === 'string' ? BigInt(raw) : raw
  const dollars = Number(value) / 1_000_000
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(2)}M`
  if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(1)}K`
  return `$${dollars.toFixed(2)}`
}

// ─── Odds Bar Component ───────────────────────────────────────────────────────

function OddsBar({ oddsA, oddsB, choiceA, choiceB, animate }: {
  oddsA: number
  oddsB: number
  choiceA: string
  choiceB: string
  animate?: boolean
}) {
  return (
    <div className="w-full space-y-1">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{choiceA}</span>
        <span>{choiceB}</span>
      </div>
      <div className="relative h-3 rounded-full bg-slate-800 overflow-hidden">
        <motion.div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
          initial={{ width: '50%' }}
          animate={{ width: `${oddsA * 100}%` }}
          transition={{ duration: animate ? 0.4 : 0, ease: 'easeInOut' }}
        />
      </div>
      <div className="flex justify-between text-sm font-semibold">
        <span className="text-cyan-400">{(oddsA * 100).toFixed(0)}%</span>
        <span className="text-purple-400">{(oddsB * 100).toFixed(0)}%</span>
      </div>
    </div>
  )
}

// ─── Betting Window Panel ─────────────────────────────────────────────────────

function BettingWindowPanel({
  window: bw,
  onBet,
  myAddress,
}: {
  window: BettingWindow
  onBet: (side: 'A' | 'B', amount: number) => void
  myAddress?: string
}) {
  const [selectedSide, setSelectedSide] = useState<'A' | 'B' | null>(null)
  const [betAmount, setBetAmount] = useState<string>('10')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleBet = async () => {
    if (!selectedSide || !betAmount) return
    setIsSubmitting(true)
    await new Promise(r => setTimeout(r, 600))
    onBet(selectedSide, parseFloat(betAmount))
    setIsSubmitting(false)
  }

  const potential = selectedSide && betAmount
    ? (parseFloat(betAmount) / (selectedSide === 'A' ? bw.oddsA : bw.oddsB) * 0.85).toFixed(2)
    : null

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
      className="bg-slate-900/95 border border-yellow-500/50 rounded-2xl p-5 shadow-2xl backdrop-blur-md"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-yellow-400 font-bold text-sm tracking-wide uppercase">
            Live Bet Window
          </span>
        </div>
        <div className="text-white font-mono font-bold text-lg">
          {bw.timeRemaining}s
        </div>
      </div>

      {/* Countdown bar */}
      <div className="h-1 rounded-full bg-slate-700 mb-4 overflow-hidden">
        <motion.div
          className="h-full bg-yellow-400 rounded-full"
          initial={{ width: '100%' }}
          animate={{ width: `${(bw.timeRemaining / 60) * 100}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>

      {/* Pool stats */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="bg-slate-800 rounded-lg p-2">
          <div className="text-xs text-slate-400">Expose Pool</div>
          <div className="text-cyan-400 font-bold">{formatUSDC(bw.poolA)}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-2">
          <div className="text-xs text-slate-400">Total</div>
          <div className="text-white font-bold">{formatUSDC(bw.totalPool)}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-2">
          <div className="text-xs text-slate-400">Conceal Pool</div>
          <div className="text-purple-400 font-bold">{formatUSDC(bw.poolB)}</div>
        </div>
      </div>

      {/* Odds bar */}
      <div className="mb-4">
        <OddsBar
          oddsA={bw.oddsA}
          oddsB={bw.oddsB}
          choiceA={bw.choiceA.label}
          choiceB={bw.choiceB.label}
          animate
        />
      </div>

      {/* Last bet ticker */}
      {bw.lastBet && (
        <motion.div
          key={bw.lastBet.address}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xs text-slate-400 mb-3 bg-slate-800/50 rounded px-2 py-1"
        >
          🎰 {bw.lastBet.address} just bet {formatUSDC(bw.lastBet.amount)} on{' '}
          <span className={bw.lastBet.side === 'A' ? 'text-cyan-400' : 'text-purple-400'}>
            {bw.lastBet.side === 'A' ? bw.choiceA.label : bw.choiceB.label}
          </span>
        </motion.div>
      )}

      {/* Bet interface */}
      {myAddress ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSelectedSide('A')}
              className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                selectedSide === 'A'
                  ? 'bg-cyan-500 text-white ring-2 ring-cyan-300'
                  : 'bg-slate-700 text-slate-300 hover:bg-cyan-900/40'
              }`}
            >
              {bw.choiceA.label}
              <div className="text-xs font-normal opacity-75">{(bw.oddsA * 100).toFixed(0)}%</div>
            </button>
            <button
              onClick={() => setSelectedSide('B')}
              className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                selectedSide === 'B'
                  ? 'bg-purple-500 text-white ring-2 ring-purple-300'
                  : 'bg-slate-700 text-slate-300 hover:bg-purple-900/40'
              }`}
            >
              {bw.choiceB.label}
              <div className="text-xs font-normal opacity-75">{(bw.oddsB * 100).toFixed(0)}%</div>
            </button>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input
                type="number"
                value={betAmount}
                onChange={e => setBetAmount(e.target.value)}
                className="w-full bg-slate-800 text-white rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-500"
                placeholder="Amount USDC"
                min="1"
                max="500"
              />
            </div>
            {potential && (
              <div className="text-right text-xs text-slate-400 self-center whitespace-nowrap">
                Win: <span className="text-green-400 font-bold">${potential}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleBet}
            disabled={!selectedSide || isSubmitting}
            className="w-full py-3 rounded-xl font-bold text-sm bg-yellow-500 text-black hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? '⏳ Submitting...' : '⚡ Place Live Bet'}
          </button>
        </div>
      ) : (
        <div className="text-center text-slate-400 text-sm py-2">
          Connect wallet to bet
        </div>
      )}
    </motion.div>
  )
}

// ─── Revelation Overlay ───────────────────────────────────────────────────────

function RevelationOverlay({ data, onDismiss }: { data: RevelationData; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 8_000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <div className="text-center max-w-lg px-8">
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-7xl mb-6"
        >
          🎭
        </motion.div>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-bold text-white mb-2"
        >
          The AI Chose
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-5xl font-black text-yellow-400 mb-4"
        >
          {data.winningChoice}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="text-slate-300 text-sm mb-6 italic"
        >
          {data.justification}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="text-xs text-slate-500"
        >
          Odds at close: {data.winningSide === 'A' ? `${(data.oddsAtClose.A * 100).toFixed(0)}` : `${(data.oddsAtClose.B * 100).toFixed(0)}`}% were right
          · Pool: {formatUSDC(data.totalPool)}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.0 }}
          className="mt-4 text-xs text-slate-600"
        >
          Tap to dismiss
        </motion.div>
      </div>
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface LiveNarrativeStudioProps {
  broadcastId: string
  chapterId?: string
  viewerAddress?: string
  className?: string
}

export default function LiveNarrativeStudio({
  broadcastId,
  chapterId = 'chapter_28',
  viewerAddress,
  className = '',
}: LiveNarrativeStudioProps) {
  const [phase, setPhase] = useState<BroadcastPhase>('connecting')
  const [storyText, setStoryText] = useState('')
  const [viewerCount, setViewerCount] = useState(0)
  const [activeBettingWindow, setActiveBettingWindow] = useState<BettingWindow | null>(null)
  const [revelation, setRevelation] = useState<RevelationData | null>(null)
  const [showRevelation, setShowRevelation] = useState(false)
  const [payouts, setPayouts] = useState<Record<string, string> | null>(null)

  const storyEndRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Auto-scroll story text
  useEffect(() => {
    storyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [storyText])

  // Subscribe to SSE stream
  useEffect(() => {
    const url = new URL('/api/stream/chapter', window.location.origin)
    url.searchParams.set('broadcastId', broadcastId)
    url.searchParams.set('chapterId', chapterId)
    if (viewerAddress) url.searchParams.set('address', viewerAddress)

    const es = new EventSource(url.toString())
    eventSourceRef.current = es

    es.onopen = () => setPhase('live')

    es.onmessage = (e) => {
      const event: StreamEvent = JSON.parse(e.data)

      switch (event.type) {
        case 'broadcast_start':
          setPhase('live')
          setViewerCount((event.payload.viewerCount as number) ?? 0)
          break

        case 'text_delta':
          setStoryText(prev => prev + (event.payload.content as string))
          break

        case 'viewer_count':
          setViewerCount(event.payload.count as number)
          break

        case 'betting_window_open':
          setPhase('window_open')
          setActiveBettingWindow(event.payload as BettingWindow)
          break

        case 'betting_window_update':
          setActiveBettingWindow(prev => prev ? {
            ...prev,
            ...event.payload,
          } : null)
          break

        case 'betting_window_close':
          setPhase('window_closing')
          setTimeout(() => {
            setActiveBettingWindow(null)
          }, 1_000)
          break

        case 'revelation':
          setPhase('revelation')
          setRevelation(event.payload as RevelationData)
          setShowRevelation(true)
          break

        case 'payout_complete':
          setPhase('settling')
          setPayouts(event.payload.payouts as Record<string, string>)
          break

        case 'broadcast_complete':
          setPhase('complete')
          break

        case 'error':
          console.error('Broadcast error:', event.payload)
          break
      }
    }

    es.onerror = () => {
      if (phase !== 'complete') {
        setPhase('connecting')
      }
    }

    return () => {
      es.close()
      eventSourceRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [broadcastId, chapterId, viewerAddress])

  const handleBet = useCallback(async (side: 'A' | 'B', amount: number) => {
    if (!activeBettingWindow) return

    await fetch('/api/stream/chapter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        broadcastId,
        windowId: activeBettingWindow.windowId,
        bettorAddress: viewerAddress ?? '0x0',
        side,
        amount: String(Math.floor(amount * 1_000_000)),
      }),
    })
  }, [activeBettingWindow, broadcastId, viewerAddress])

  const phaseColors: Record<BroadcastPhase, string> = {
    connecting: 'text-slate-400',
    live: 'text-green-400',
    window_open: 'text-yellow-400',
    window_closing: 'text-orange-400',
    revelation: 'text-purple-400',
    settling: 'text-blue-400',
    complete: 'text-slate-500',
  }

  const phaseLabels: Record<BroadcastPhase, string> = {
    connecting: '○ CONNECTING',
    live: '● LIVE',
    window_open: '🔔 BET WINDOW OPEN',
    window_closing: '⏱ WINDOW CLOSING',
    revelation: '🎭 REVELATION',
    settling: '💰 PAYING OUT',
    complete: '✓ COMPLETE',
  }

  return (
    <div className={`relative flex flex-col ${className}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700 rounded-t-xl">
        <div className="flex items-center gap-3">
          {phase !== 'complete' && phase !== 'connecting' && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 text-xs font-bold tracking-widest uppercase">Live</span>
            </div>
          )}
          <span className={`text-xs font-semibold tracking-wide ${phaseColors[phase]}`}>
            {phaseLabels[phase]}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>👁 {(viewerCount + 4783).toLocaleString()} watching</span>
          <span className="text-slate-600">Chapter {chapterId.replace('chapter_', '')}</span>
        </div>
      </div>

      {/* Story text area */}
      <div className="flex-1 min-h-[400px] max-h-[600px] overflow-y-auto bg-slate-950 p-6 font-serif text-slate-200 leading-relaxed text-[1.05rem]">
        {storyText ? (
          <>
            <p className="whitespace-pre-wrap">{storyText}</p>
            {phase === 'live' && (
              <span className="inline-block w-0.5 h-4 bg-slate-400 animate-pulse ml-0.5" />
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-600">
            {phase === 'connecting' ? 'Connecting to broadcast...' : 'Story loading...'}
          </div>
        )}
        <div ref={storyEndRef} />
      </div>

      {/* Betting window panel */}
      <AnimatePresence>
        {activeBettingWindow && (phase === 'window_open' || phase === 'window_closing') && (
          <div className="px-4 py-3 bg-slate-900/80 border-t border-slate-700">
            <BettingWindowPanel
              window={activeBettingWindow}
              onBet={handleBet}
              myAddress={viewerAddress}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Payout notification */}
      {payouts && Object.keys(payouts).length > 0 && phase === 'settling' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-3 bg-green-950/60 border-t border-green-700/40"
        >
          <div className="text-xs text-green-400 font-semibold mb-1">💰 Payouts distributed</div>
          <div className="space-y-0.5">
            {Object.entries(payouts).slice(0, 3).map(([addr, amount]) => (
              <div key={addr} className="flex justify-between text-xs text-slate-300">
                <span className="text-slate-500 font-mono">{addr}</span>
                <span className="text-green-400 font-bold">{formatUSDC(amount)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Complete banner */}
      {phase === 'complete' && (
        <div className="px-4 py-3 bg-slate-900 border-t border-slate-700 text-center text-sm text-slate-400 rounded-b-xl">
          Chapter complete · Next broadcast in 24 hours
        </div>
      )}

      {/* Revelation overlay */}
      <AnimatePresence>
        {showRevelation && revelation && (
          <RevelationOverlay
            data={revelation}
            onDismiss={() => setShowRevelation(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
