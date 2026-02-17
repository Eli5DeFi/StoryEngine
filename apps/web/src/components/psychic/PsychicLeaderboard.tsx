'use client'

/**
 * @component PsychicLeaderboard
 * @description ELO-style leaderboard for the Psychic Consensus Oracle.
 *
 * Shows top Seers, Oracles, Prophets, and Void Seers ranked by score.
 * Fetches from the REST API (no on-chain reads — cheaper and faster).
 *
 * Design: "Ruins of the Future" glass-card aesthetic.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Crown, TrendingUp, Brain, RefreshCw, Loader2 } from 'lucide-react'
import { useAccount } from 'wagmi'
import type { PsychicBadge } from '@/hooks/usePsychicOracle'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number
  address: `0x${string}`
  displayName: string    // ENS or truncated address
  score: number
  contraryWins: number
  totalBets: number
  accuracy: number
  badge: PsychicBadge
}

// ─── Badge config ─────────────────────────────────────────────────────────────

const BADGE_CONFIG: Record<PsychicBadge, { emoji: string; label: string; color: string; ring: string }> = {
  INITIATE:  { emoji: '🌑', label: 'Initiate',  color: 'text-void-400',    ring: 'ring-void-700' },
  SEER:      { emoji: '🔮', label: 'Seer',      color: 'text-drift-purple', ring: 'ring-drift-purple/50' },
  ORACLE:    { emoji: '🌟', label: 'Oracle',    color: 'text-gold',         ring: 'ring-gold/50' },
  PROPHET:   { emoji: '🌌', label: 'Prophet',   color: 'text-drift-teal',   ring: 'ring-drift-teal/50' },
  VOID_SEER: { emoji: '⚫', label: 'Void Seer', color: 'text-white',        ring: 'ring-white/30' },
}

const RANK_MEDALS = ['🥇', '🥈', '🥉']

// ─── Helper: truncate address ─────────────────────────────────────────────────

function truncateAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

// ─── LeaderboardRow ───────────────────────────────────────────────────────────

interface LeaderboardRowProps {
  entry: LeaderboardEntry
  isCurrentUser: boolean
  index: number
}

function LeaderboardRow({ entry, isCurrentUser, index }: LeaderboardRowProps) {
  const badge = BADGE_CONFIG[entry.badge]
  const medal = RANK_MEDALS[entry.rank - 1] ?? null

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={[
        'flex items-center gap-4 px-5 py-4 border-b border-void-700/30 last:border-0 transition-colors',
        isCurrentUser ? 'bg-gold/5' : 'hover:bg-void-900/30',
      ].join(' ')}
    >
      {/* Rank */}
      <div className="w-8 text-center flex-shrink-0">
        {medal ? (
          <span className="text-xl">{medal}</span>
        ) : (
          <span className="text-sm font-mono text-void-500">#{entry.rank}</span>
        )}
      </div>

      {/* Badge avatar */}
      <div className={[
        'w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0',
        'bg-void-800/80 ring-1', badge.ring,
      ].join(' ')}>
        {badge.emoji}
      </div>

      {/* Name + badge */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={['font-ui text-sm font-semibold truncate', isCurrentUser ? 'text-gold' : 'text-foreground'].join(' ')}>
            {entry.displayName}
          </span>
          {isCurrentUser && (
            <span className="text-[9px] font-ui uppercase tracking-widest text-gold/60 bg-gold/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
              You
            </span>
          )}
        </div>
        <div className={['text-xs font-ui', badge.color].join(' ')}>
          {badge.label} · {entry.accuracy}% accuracy
        </div>
      </div>

      {/* Score + stats */}
      <div className="text-right flex-shrink-0">
        <div className={['font-display font-bold tabular-nums', badge.color].join(' ')}>
          {entry.score.toLocaleString()}
        </div>
        <div className="text-xs text-void-500 font-ui">
          {entry.contraryWins}⚡ · {entry.totalBets} bets
        </div>
      </div>
    </motion.div>
  )
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow({ index }: { index: number }) {
  return (
    <div
      className="flex items-center gap-4 px-5 py-4 border-b border-void-700/30 animate-pulse"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="w-8 h-4 bg-void-800 rounded" />
      <div className="w-10 h-10 bg-void-800 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-void-800 rounded w-32" />
        <div className="h-2.5 bg-void-800/60 rounded w-20" />
      </div>
      <div className="space-y-2 text-right">
        <div className="h-4 bg-void-800 rounded w-16 ml-auto" />
        <div className="h-2.5 bg-void-800/60 rounded w-20 ml-auto" />
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export interface PsychicLeaderboardProps {
  /** Limit to top N entries (default 10) */
  limit?: number
  /** Show compact (no header, fewer rows) */
  compact?: boolean
  className?: string
}

export function PsychicLeaderboard({
  limit = 10,
  compact = false,
  className = '',
}: PsychicLeaderboardProps) {
  const { address } = useAccount()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [myEntry, setMyEntry] = useState<LeaderboardEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState(Date.now())

  const fetchLeaderboard = useCallback(async () => {
    setError(null)
    try {
      const params = new URLSearchParams({ limit: limit.toString() })
      if (address) params.set('user', address)

      const res = await fetch(`/api/psychic/leaderboard?${params}`)
      if (!res.ok) throw new Error(`Failed: ${res.status}`)

      const data: { entries: LeaderboardEntry[]; myEntry?: LeaderboardEntry } = await res.json()
      setEntries(data.entries)
      if (data.myEntry) setMyEntry(data.myEntry)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard')
    } finally {
      setLoading(false)
    }
  }, [limit, address])

  useEffect(() => { fetchLeaderboard() }, [fetchLeaderboard, lastRefresh])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={['glass-card rounded-2xl overflow-hidden', className].join(' ')}>
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between px-6 py-5 border-b border-void-700/40">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gold" />
            <h3 className="font-display font-bold text-gold text-xl">Psychic Leaderboard</h3>
          </div>
          <button
            onClick={() => { setLoading(true); setLastRefresh(Date.now()) }}
            disabled={loading}
            className="text-void-500 hover:text-void-300 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={['w-4 h-4', loading ? 'animate-spin' : ''].join(' ')} />
          </button>
        </div>
      )}

      {/* Legend */}
      {!compact && (
        <div className="px-6 py-3 border-b border-void-700/30 flex items-center gap-6 text-xs text-void-500 font-ui">
          <span className="flex items-center gap-1"><Brain className="w-3 h-3" /> ELO Score</span>
          <span className="flex items-center gap-1"><span className="text-gold">⚡</span> Contrarian wins</span>
          <span className="flex items-center gap-1"><Crown className="w-3 h-3 text-drift-teal" /> Accuracy %</span>
        </div>
      )}

      {/* Rows */}
      <div>
        {loading ? (
          Array.from({ length: compact ? 5 : limit }).map((_, i) => (
            <SkeletonRow key={i} index={i} />
          ))
        ) : error ? (
          <div className="px-6 py-8 text-center text-void-500 text-sm">{error}</div>
        ) : entries.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <Brain className="w-8 h-8 text-void-700 mx-auto mb-3" />
            <p className="text-void-500 text-sm">No psychic bets placed yet.</p>
            <p className="text-void-600 text-xs mt-1">Be the first Seer!</p>
          </div>
        ) : (
          <AnimatePresence>
            {entries.map((entry, i) => (
              <LeaderboardRow
                key={entry.address}
                entry={entry}
                isCurrentUser={address?.toLowerCase() === entry.address.toLowerCase()}
                index={i}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Current user row (if not in top N) */}
      {myEntry && !entries.some(e => e.address.toLowerCase() === address?.toLowerCase()) && (
        <>
          <div className="px-6 py-2 text-center text-xs text-void-600 font-ui border-t border-void-700/30">
            · · ·
          </div>
          <LeaderboardRow
            entry={myEntry}
            isCurrentUser
            index={entries.length}
          />
        </>
      )}

      {/* Footer */}
      {!compact && entries.length > 0 && (
        <div className="px-6 py-4 border-t border-void-700/30 bg-void-900/20">
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-ui text-void-500">
            {(['SEER', 'ORACLE', 'PROPHET', 'VOID_SEER'] as PsychicBadge[]).map(b => {
              const cfg = BADGE_CONFIG[b]
              const count = entries.filter(e => e.badge === b).length
              return (
                <div key={b} className="space-y-1">
                  <div className="text-base">{cfg.emoji}</div>
                  <div className={cfg.color}>{cfg.label}</div>
                  <div>{count}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
