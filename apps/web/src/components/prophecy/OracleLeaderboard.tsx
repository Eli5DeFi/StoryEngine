'use client'

/**
 * OracleLeaderboard
 * Displays top prophecy collectors ranked by fulfilled NFT count.
 * Shows rank title, wallet, stats, and portfolio value.
 */

import { useEffect, useState } from 'react'

interface LeaderboardEntry {
  position: number
  userId: string
  walletAddress: string
  displayName: string | null
  total: number
  fulfilled: number
  echoed: number
  unfulfilled: number
  pending: number
  fulfillmentRate: number
  totalForgePaid: number
  estimatedPortfolioValue: number
  rank: string
}

const RANK_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  VOID_EYE: { icon: '◉', label: 'Void Eye',  color: 'text-violet-400' },
  PROPHET:  { icon: '✦', label: 'Prophet',   color: 'text-amber-300' },
  ORACLE:   { icon: '◈', label: 'Oracle',    color: 'text-amber-400' },
  SEER:     { icon: '◇', label: 'Seer',      color: 'text-slate-300' },
  NOVICE:   { icon: '▪', label: 'Novice',    color: 'text-void-500' },
}

const POSITION_STYLES = [
  'border-amber-400/40 bg-amber-500/5',   // 1st
  'border-slate-400/30 bg-slate-500/5',   // 2nd
  'border-amber-700/30 bg-amber-900/5',   // 3rd
]

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function OracleLeaderboard({ limit = 10 }: { limit?: number }) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(`/api/prophecies/leaderboard?limit=${limit}`)
        if (!res.ok) throw new Error('Failed to fetch leaderboard')
        const data = await res.json()
        setEntries(data.leaderboard ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error')
      } finally {
        setLoading(false)
      }
    }
    fetchLeaderboard()
  }, [limit])

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 rounded border border-void-800/30 bg-void-950/40 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-6 text-sm font-mono text-void-500">
        Failed to load leaderboard
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-10 space-y-2">
        <div className="text-3xl text-void-700">◎</div>
        <p className="text-void-500 font-mono text-sm">
          No oracles yet — be the first to mint a prophecy
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => {
        const rankCfg = RANK_CONFIG[entry.rank] ?? RANK_CONFIG.NOVICE
        const positionStyle = POSITION_STYLES[entry.position - 1] ?? 'border-void-800/30 bg-void-950/20'

        return (
          <div
            key={entry.userId}
            className={`flex items-center gap-4 rounded border p-3 transition-all ${positionStyle}`}
          >
            {/* Position */}
            <div className={`text-lg font-bold font-mono w-6 text-center ${
              entry.position === 1 ? 'text-amber-400' :
              entry.position === 2 ? 'text-slate-300' :
              entry.position === 3 ? 'text-amber-700' : 'text-void-500'
            }`}>
              {entry.position <= 3 ? ['★', '◈', '◇'][entry.position - 1] : entry.position}
            </div>

            {/* Rank icon + address */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-sm ${rankCfg.color}`}>{rankCfg.icon}</span>
                <span className="text-sm font-mono text-void-200 truncate">
                  {entry.displayName ?? truncateAddress(entry.walletAddress)}
                </span>
                <span className={`text-[10px] font-mono ${rankCfg.color} uppercase`}>
                  {rankCfg.label}
                </span>
              </div>
              <div className="text-[10px] font-mono text-void-600 mt-0.5">
                {entry.total} minted · {entry.fulfillmentRate}% fulfillment rate
              </div>
            </div>

            {/* Stats */}
            <div className="text-right shrink-0">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-amber-400">{entry.fulfilled}★</span>
                <span className="text-slate-400">{entry.echoed}◈</span>
                <span className="text-void-600">{entry.unfulfilled}▪</span>
              </div>
              <div className="text-[10px] text-void-500 font-mono mt-0.5">
                ~{entry.estimatedPortfolioValue} $FORGE
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
