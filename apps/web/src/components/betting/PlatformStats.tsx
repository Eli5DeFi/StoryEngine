'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Target, TrendingUp, Trophy, Flame } from 'lucide-react'
import Link from 'next/link'

type PlatformStatsData = {
  activePools: number
  totalWagered: number
  biggestWin: number
  hottestPool: {
    poolId: string
    storyTitle: string
    chapterNumber: number
    betCount: number
  } | null
  timeframe: string
  timestamp: string
}

export function PlatformStats() {
  const [stats, setStats] = useState<PlatformStatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchStats() {
    try {
      const response = await fetch('/api/betting/platform-stats?timeframe=24h')
      
      if (!response.ok) throw new Error('Failed to fetch stats')

      const data = await response.json()
      setStats(data)
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch platform stats:', err)
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`
    }
    return `$${amount.toFixed(0)}`
  }

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-void-800 rounded mb-4" />
            <div className="h-8 bg-void-800 rounded" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Active Pools */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl p-6 bg-drift-teal/5 border border-drift-teal/20"
      >
        <div className="flex items-center gap-2 mb-2 text-void-400">
          <Target className="w-4 h-4" />
          <span className="text-xs font-ui uppercase tracking-wider">Active Pools</span>
        </div>
        <div className="text-4xl font-display font-bold text-drift-teal tabular-nums">
          {stats.activePools}
        </div>
        <div className="text-xs text-void-500 mt-1">Open Now</div>
      </motion.div>

      {/* 24h Volume */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl p-6 bg-gold/5 border border-gold/20"
      >
        <div className="flex items-center gap-2 mb-2 text-void-400">
          <TrendingUp className="w-4 h-4" />
          <span className="text-xs font-ui uppercase tracking-wider">24h Volume</span>
        </div>
        <div className="text-4xl font-display font-bold text-gold tabular-nums">
          {formatCurrency(stats.totalWagered)}
        </div>
        <div className="text-xs text-void-500 mt-1">USDC</div>
      </motion.div>

      {/* Biggest Win */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-xl p-6 bg-success/5 border border-success/20"
      >
        <div className="flex items-center gap-2 mb-2 text-void-400">
          <Trophy className="w-4 h-4" />
          <span className="text-xs font-ui uppercase tracking-wider">Biggest Win (7d)</span>
        </div>
        <div className="text-4xl font-display font-bold text-success tabular-nums">
          {formatCurrency(stats.biggestWin)}
        </div>
        <div className="text-xs text-void-500 mt-1">Single Bet</div>
      </motion.div>

      {/* Hottest Pool */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-xl p-6 bg-error/5 border border-error/20"
      >
        <div className="flex items-center gap-2 mb-2 text-void-400">
          <Flame className="w-4 h-4" />
          <span className="text-xs font-ui uppercase tracking-wider">Hottest Pool</span>
        </div>
        {stats.hottestPool ? (
          <Link href={`/story/${stats.hottestPool.poolId}`}>
            <div className="text-2xl font-display font-bold text-error tabular-nums hover:text-error/80 transition-colors cursor-pointer">
              {stats.hottestPool.betCount} bets/hr
            </div>
            <div className="text-xs text-void-500 mt-1 truncate">
              {stats.hottestPool.storyTitle}
            </div>
          </Link>
        ) : (
          <div>
            <div className="text-2xl font-display font-bold text-error tabular-nums">—</div>
            <div className="text-xs text-void-500 mt-1">No activity</div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
