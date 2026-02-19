'use client'

/**
 * ChaosOracleWidget
 * Innovation Cycle #53 — "The Living Story Protocol"
 *
 * Shows real-world signals (BTC price, social volume, on-chain activity)
 * mapped to Voidborne narrative parameters. Lives in the story sidebar.
 *
 * Design: "Ruins of the Future" — dark bg, amber/teal accent, Cinzel headers.
 * Refreshes every 5 minutes. Animates signal rows on load.
 */

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingDown,
  TrendingUp,
  Minus,
  Zap,
  Globe,
  Activity,
  RefreshCw,
  AlertTriangle,
  Flame,
  Waves,
  Wind,
  Eye,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NarrativeMapping {
  houseBeneficiary: string
  houseBurdened: string
  parameterAffected: string
  narrativeEffect: string
  promptFragment: string
  intensity: number
}

interface ProcessedSignal {
  id: string
  source: 'crypto' | 'social' | 'onchain' | 'internal'
  metric: string
  metricLabel: string
  value: number
  valueFormatted: string
  direction: 'spike' | 'crash' | 'surge' | 'neutral' | 'volatile'
  intensity: number
  mapping: NarrativeMapping
  timestamp: string
}

interface ChaosOracleData {
  signals: ProcessedSignal[]
  chaosIntensity: 'calm' | 'tense' | 'volatile' | 'maelstrom'
  dominantEffect: string
  dominantHouseBeneficiary: string
  dominantHouseBurdened: string
  chapterMoodOverride: string
  cachedAt: string
  isMock: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const HOUSE_COLOURS: Record<string, string> = {
  valdris: 'text-amber-400',
  obsidian: 'text-purple-400',
  aurelius: 'text-cyan-400',
  strand: 'text-emerald-400',
  null: 'text-gray-400',
  none: 'text-gray-500',
}

const INTENSITY_COLOURS: Record<string, { bar: string; glow: string; badge: string }> = {
  calm: { bar: 'bg-emerald-500', glow: 'shadow-emerald-500/20', badge: 'bg-emerald-900/60 text-emerald-300 border-emerald-700' },
  tense: { bar: 'bg-amber-500', glow: 'shadow-amber-500/20', badge: 'bg-amber-900/60 text-amber-300 border-amber-700' },
  volatile: { bar: 'bg-orange-500', glow: 'shadow-orange-500/20', badge: 'bg-orange-900/60 text-orange-300 border-orange-700' },
  maelstrom: { bar: 'bg-red-500', glow: 'shadow-red-500/20', badge: 'bg-red-900/60 text-red-300 border-red-700' },
}

function DirectionIcon({ direction, size = 16 }: { direction: ProcessedSignal['direction']; size?: number }) {
  const cls = `w-${size / 4} h-${size / 4}`
  switch (direction) {
    case 'crash':   return <TrendingDown className={`${cls} text-red-400`} />
    case 'volatile': return <Waves className={`${cls} text-orange-400`} />
    case 'surge':   return <TrendingUp className={`${cls} text-emerald-400`} />
    case 'spike':   return <Zap className={`${cls} text-amber-400`} />
    default:        return <Minus className={`${cls} text-gray-500`} />
  }
}

function SourceIcon({ source }: { source: ProcessedSignal['source'] }) {
  const cls = 'w-3.5 h-3.5'
  switch (source) {
    case 'crypto':   return <TrendingUp className={`${cls} text-amber-400`} />
    case 'social':   return <Globe className={`${cls} text-blue-400`} />
    case 'onchain':  return <Activity className={`${cls} text-purple-400`} />
    case 'internal': return <Eye className={`${cls} text-gray-400`} />
  }
}

function IntensityBar({ intensity, colour }: { intensity: number; colour: string }) {
  return (
    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${colour}`}
        initial={{ width: 0 }}
        animate={{ width: `${intensity * 100}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  )
}

const INTENSITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  calm: Wind,
  tense: Flame,
  volatile: Waves,
  maelstrom: AlertTriangle,
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ChaosOracleWidgetProps {
  /** Compact mode for tight sidebars */
  compact?: boolean
  /** Chapter number to label context for */
  chapterNumber?: number
  className?: string
}

export function ChaosOracleWidget({ compact = false, chapterNumber, className = '' }: ChaosOracleWidgetProps) {
  const [data, setData] = useState<ChaosOracleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchSignals = useCallback(async (manual = false) => {
    try {
      if (manual) setRefreshing(true)
      else setLoading(true)

      const resp = await fetch('/api/chaos-oracle/signals', {
        cache: manual ? 'no-cache' : 'default',
      })

      if (!resp.ok) throw new Error(`${resp.status}`)
      const json: ChaosOracleData = await resp.json()
      setData(json)
      setLastRefresh(new Date())
      setError(null)
    } catch {
      setError('Chaos Oracle temporarily offline')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchSignals()
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => fetchSignals(), 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchSignals])

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`rounded-xl border border-white/5 bg-black/40 p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 rounded-full bg-amber-500/30 animate-pulse" />
          <div className="h-3 w-32 rounded bg-white/10 animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="mb-3 space-y-2">
            <div className="h-3 w-full rounded bg-white/5 animate-pulse" />
            <div className="h-1 w-full rounded bg-white/5 animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className={`rounded-xl border border-red-900/30 bg-red-950/20 p-4 ${className}`}>
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>{error ?? 'No data'}</span>
        </div>
        <button
          onClick={() => fetchSignals(true)}
          className="mt-2 text-xs text-red-400/60 hover:text-red-400 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  const intensityStyle = INTENSITY_COLOURS[data.chaosIntensity]
  const IntensityIcon = INTENSITY_ICONS[data.chaosIntensity] ?? Wind
  const topSignals = compact ? data.signals.slice(0, 2) : data.signals

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-xl border border-white/8 bg-black/50 backdrop-blur-sm overflow-hidden ${className}`}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={`px-4 py-3 border-b border-white/5 flex items-center justify-between shadow-lg ${intensityStyle.glow}`}>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <IntensityIcon className="w-4 h-4 text-amber-400" />
            {data.chaosIntensity === 'maelstrom' && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
            )}
          </div>
          <div>
            <p className="text-xs font-cinzel font-semibold text-white/90 tracking-wide uppercase">
              Chaos Oracle
            </p>
            {chapterNumber && (
              <p className="text-[10px] text-white/40">
                Chapter {chapterNumber} context
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Intensity badge */}
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider ${intensityStyle.badge}`}>
            {data.chaosIntensity}
          </span>

          {/* Refresh button */}
          <button
            onClick={() => fetchSignals(true)}
            disabled={refreshing}
            className="text-white/30 hover:text-white/60 transition-colors disabled:opacity-50"
            title="Refresh signals"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Dominant Effect ──────────────────────────────────────────────── */}
      <div className="px-4 py-3 bg-gradient-to-r from-amber-950/30 to-transparent border-b border-white/5">
        <p className="text-[11px] text-amber-400/80 font-mono mb-0.5 uppercase tracking-wider">
          Dominant Signal
        </p>
        <p className="text-xs text-white/80 leading-snug">
          {data.dominantEffect}
        </p>
        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-white/40">
          <span>
            Favours{' '}
            <span className={`font-semibold capitalize ${HOUSE_COLOURS[data.dominantHouseBeneficiary] ?? 'text-white'}`}>
              House {data.dominantHouseBeneficiary}
            </span>
          </span>
          <span>·</span>
          <span>
            Burdens{' '}
            <span className={`font-semibold capitalize ${HOUSE_COLOURS[data.dominantHouseBurdened] ?? 'text-white'}`}>
              House {data.dominantHouseBurdened}
            </span>
          </span>
        </div>
      </div>

      {/* ── Signal List ──────────────────────────────────────────────────── */}
      <div className="divide-y divide-white/5">
        {topSignals.map((signal, idx) => (
          <SignalRow
            key={signal.id}
            signal={signal}
            index={idx}
            isExpanded={expanded === signal.id}
            onToggle={() => setExpanded(prev => prev === signal.id ? null : signal.id)}
            intensityBarColour={intensityStyle.bar}
            compact={compact}
          />
        ))}
      </div>

      {/* ── Chapter Mood ─────────────────────────────────────────────────── */}
      {!compact && (
        <div className="px-4 py-3 bg-black/20 border-t border-white/5">
          <p className="text-[10px] text-white/30 font-mono uppercase tracking-wider mb-1">
            Today's chapter mood
          </p>
          <p className="text-[11px] text-white/50 italic leading-snug">
            "{data.chapterMoodOverride}"
          </p>
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="px-4 py-2 bg-black/10 border-t border-white/3 flex items-center justify-between">
        <p className="text-[9px] text-white/20 font-mono">
          {data.isMock ? 'simulated signals' : 'live signals'}
          {lastRefresh && ` · ${lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
        </p>
        {data.isMock && (
          <span className="text-[9px] text-white/20 italic">mock mode</span>
        )}
      </div>
    </motion.div>
  )
}

// ─── SignalRow ─────────────────────────────────────────────────────────────────

interface SignalRowProps {
  signal: ProcessedSignal
  index: number
  isExpanded: boolean
  onToggle: () => void
  intensityBarColour: string
  compact: boolean
}

function SignalRow({ signal, index, isExpanded, onToggle, intensityBarColour, compact }: SignalRowProps) {
  const houseColour = HOUSE_COLOURS[signal.mapping.houseBeneficiary] ?? 'text-white'

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
    >
      {/* Row header — always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-2.5 hover:bg-white/3 transition-colors group"
      >
        <div className="flex items-center gap-2 mb-1.5">
          {/* Source icon */}
          <SourceIcon source={signal.source} />

          {/* Metric label */}
          <span className="text-[11px] text-white/70 font-mono flex-1 truncate">
            {signal.metricLabel}
          </span>

          {/* Value */}
          <span className={`text-[11px] font-mono font-semibold ${
            signal.direction === 'crash' ? 'text-red-400' :
            signal.direction === 'surge' || signal.direction === 'spike' ? 'text-emerald-400' :
            'text-white/50'
          }`}>
            {signal.valueFormatted}
          </span>

          {/* Direction icon */}
          <DirectionIcon direction={signal.direction} size={14} />
        </div>

        {/* Intensity bar */}
        <IntensityBar intensity={signal.intensity} colour={intensityBarColour} />

        {/* Effect preview */}
        {!compact && (
          <p className="mt-1.5 text-[10px] text-white/40 leading-tight group-hover:text-white/60 transition-colors line-clamp-1">
            → {signal.mapping.narrativeEffect}
          </p>
        )}
      </button>

      {/* Expanded: narrative detail */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2.5 bg-white/[0.02] border-t border-white/5">
              {/* Prompt fragment */}
              <div className="pt-2.5">
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1 font-mono">
                  Narrative injection
                </p>
                <p className="text-[11px] text-white/60 italic leading-relaxed">
                  "{signal.mapping.promptFragment}"
                </p>
              </div>

              {/* House impact */}
              <div className="flex gap-4">
                <div>
                  <p className="text-[9px] text-white/20 uppercase tracking-wider mb-0.5">Gains</p>
                  <p className={`text-[11px] font-semibold capitalize ${houseColour}`}>
                    House {signal.mapping.houseBeneficiary}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-white/20 uppercase tracking-wider mb-0.5">Suffers</p>
                  <p className={`text-[11px] font-semibold capitalize ${HOUSE_COLOURS[signal.mapping.houseBurdened] ?? 'text-gray-400'}`}>
                    House {signal.mapping.houseBurdened}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-white/20 uppercase tracking-wider mb-0.5">Parameter</p>
                  <p className="text-[11px] font-mono text-white/40">
                    {signal.mapping.parameterAffected}
                  </p>
                </div>
              </div>

              {/* Intensity readout */}
              <div className="flex items-center gap-2">
                <p className="text-[9px] text-white/20 uppercase tracking-wider">Intensity</p>
                <div className="flex-1">
                  <IntensityBar intensity={signal.intensity} colour={intensityBarColour} />
                </div>
                <p className="text-[10px] font-mono text-white/40">
                  {(signal.intensity * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
