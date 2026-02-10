'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, DollarSign, Target, Flame, TrendingDown } from 'lucide-react'

type PerformanceStats = {
  totalBets: number
  totalWagered: number
  totalWon: number
  netProfit: number
  roi: number
  winRate: number
  bestWin: number
  worstLoss: number
  currentStreak: { type: 'win' | 'loss' | 'none', count: number }
}

type BettingResponse = {
  stats: PerformanceStats
  timestamp: string
}

interface PerformanceOverviewProps {
  walletAddress: string
  timeframe: string
}

export function PerformanceOverview({ walletAddress, timeframe }: PerformanceOverviewProps) {
  const [stats, setStats] = useState<PerformanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [walletAddress, timeframe])

  async function fetchStats() {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(
        `/api/users/${walletAddress}/bets?limit=1&timeframe=${timeframe}`
      )
      
      if (!response.ok) throw new Error('Failed to fetch stats')

      const data: BettingResponse = await response.json()
      setStats(data.stats)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="glass-card rounded-xl p-6 animate-pulse">
            <div className="h-4 bg-void-800 rounded mb-4" />
            <div className="h-8 bg-void-800 rounded mb-2" />
            <div className="h-3 bg-void-800 rounded w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="text-red-400 mb-2">Failed to load stats</p>
        <button
          onClick={fetchStats}
          className="text-gold hover:text-gold/80 text-sm"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-cinzel font-bold text-gold mb-2">
          Performance Overview
        </h2>
        <p className="text-foreground/70">
          Track your betting performance and statistics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-6 bg-drift-teal/5 border border-drift-teal/20"
        >
          <div className="flex items-center gap-2 mb-2 text-void-400">
            <Target className="w-4 h-4" />
            <span className="text-xs font-ui uppercase tracking-wider">Total Bets</span>
          </div>
          <div className="text-4xl font-display font-bold text-drift-teal tabular-nums">
            {stats.totalBets}
          </div>
          <div className="text-xs text-void-500 mt-1">Placed</div>
        </motion.div>

        {/* Total Wagered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-xl p-6 bg-gold/5 border border-gold/20"
        >
          <div className="flex items-center gap-2 mb-2 text-void-400">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-ui uppercase tracking-wider">Total Wagered</span>
          </div>
          <div className="text-4xl font-display font-bold text-gold tabular-nums">
            {formatCurrency(stats.totalWagered)}
          </div>
          <div className="text-xs text-void-500 mt-1">USDC</div>
        </motion.div>

        {/* Total Won */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl p-6 bg-success/5 border border-success/20"
        >
          <div className="flex items-center gap-2 mb-2 text-void-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-ui uppercase tracking-wider">Total Won</span>
          </div>
          <div className="text-4xl font-display font-bold text-success tabular-nums">
            {formatCurrency(stats.totalWon)}
          </div>
          <div className="text-xs text-void-500 mt-1">USDC</div>
        </motion.div>

        {/* Net Profit */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`glass-card rounded-xl p-6 ${
            stats.netProfit >= 0
              ? 'bg-success/5 border border-success/20'
              : 'bg-error/5 border border-error/20'
          }`}
        >
          <div className="flex items-center gap-2 mb-2 text-void-400">
            {stats.netProfit >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-xs font-ui uppercase tracking-wider">Net Profit</span>
          </div>
          <div
            className={`text-4xl font-display font-bold tabular-nums ${
              stats.netProfit >= 0 ? 'text-success' : 'text-error'
            }`}
          >
            {formatCurrency(stats.netProfit)}
          </div>
          <div className="text-xs text-void-500 mt-1">
            {formatPercentage(stats.roi)} ROI
          </div>
        </motion.div>

        {/* Win Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-xl p-6 bg-drift-teal/5 border border-drift-teal/20"
        >
          <div className="flex items-center gap-2 mb-2 text-void-400">
            <Target className="w-4 h-4" />
            <span className="text-xs font-ui uppercase tracking-wider">Win Rate</span>
          </div>
          <div className="text-4xl font-display font-bold text-drift-teal tabular-nums">
            {stats.winRate.toFixed(1)}%
          </div>
          <div className="text-xs text-void-500 mt-1">Success Rate</div>
        </motion.div>

        {/* ROI */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`glass-card rounded-xl p-6 ${
            stats.roi >= 0
              ? 'bg-success/5 border border-success/20'
              : 'bg-error/5 border border-error/20'
          }`}
        >
          <div className="flex items-center gap-2 mb-2 text-void-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-ui uppercase tracking-wider">ROI</span>
          </div>
          <div
            className={`text-4xl font-display font-bold tabular-nums ${
              stats.roi >= 0 ? 'text-success' : 'text-error'
            }`}
          >
            {formatPercentage(stats.roi)}
          </div>
          <div className="text-xs text-void-500 mt-1">Return on Investment</div>
        </motion.div>

        {/* Current Streak */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className={`glass-card rounded-xl p-6 ${
            stats.currentStreak.type === 'win'
              ? 'bg-success/5 border border-success/20'
              : stats.currentStreak.type === 'loss'
              ? 'bg-error/5 border border-error/20'
              : 'bg-void-900/50 border border-void-800'
          }`}
        >
          <div className="flex items-center gap-2 mb-2 text-void-400">
            <Flame className="w-4 h-4" />
            <span className="text-xs font-ui uppercase tracking-wider">Current Streak</span>
          </div>
          <div
            className={`text-4xl font-display font-bold tabular-nums ${
              stats.currentStreak.type === 'win'
                ? 'text-success'
                : stats.currentStreak.type === 'loss'
                ? 'text-error'
                : 'text-void-500'
            }`}
          >
            {stats.currentStreak.count > 0 ? (
              <>
                {stats.currentStreak.type === 'win' ? '🔥' : '❄️'} {stats.currentStreak.count}
              </>
            ) : (
              '—'
            )}
          </div>
          <div className="text-xs text-void-500 mt-1">
            {stats.currentStreak.type === 'win'
              ? 'Wins'
              : stats.currentStreak.type === 'loss'
              ? 'Losses'
              : 'No streak'}
          </div>
        </motion.div>

        {/* Best Win */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="glass-card rounded-xl p-6 bg-gold/5 border border-gold/20"
        >
          <div className="flex items-center gap-2 mb-2 text-void-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-ui uppercase tracking-wider">Best Win</span>
          </div>
          <div className="text-4xl font-display font-bold text-gold tabular-nums">
            {stats.bestWin > 0 ? formatCurrency(stats.bestWin) : '—'}
          </div>
          <div className="text-xs text-void-500 mt-1">Single Bet</div>
        </motion.div>
      </div>
    </div>
  )
}
