'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, TrendingUp, Target, DollarSign } from 'lucide-react'
import { BadgeDisplay } from '@/components/badges/BadgeDisplay'
import { StreakIndicator } from '@/components/badges/StreakIndicator'

type LeaderboardEntry = {
  rank: number
  userId: string
  walletAddress: string
  username: string
  totalBets: number
  totalWagered: number
  totalWon: number
  winningBets: number
  winRate: number
  profit: number
  currentStreak?: number
  badges?: Array<{
    id: string
    name: string
    description: string
    icon: string
    rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'
  }>
}

type LeaderboardResponse = {
  leaderboard: LeaderboardEntry[]
  sortBy: string
  timeframe: string
  timestamp: string
}

type SortOption = 'profit' | 'wagered' | 'winRate'
type TimeframeOption = 'all' | '30d' | '7d' | '24h'

export function Leaderboard() {
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('profit')
  const [timeframe, setTimeframe] = useState<TimeframeOption>('all')

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(
        `/api/analytics/leaderboard?sortBy=${sortBy}&timeframe=${timeframe}&limit=10`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard')
      }

      const data = await response.json()
      setData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [sortBy, timeframe])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return rank
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
    return `${value.toFixed(1)}%`
  }

  return (
    <div className="bg-void-900/50 backdrop-blur border border-gold/20 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-gold" />
          <h2 className="text-2xl font-cinzel font-bold text-gold">
            Leaderboard
          </h2>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        {/* Sort By */}
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('profit')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              sortBy === 'profit'
                ? 'bg-gold text-void-950'
                : 'bg-void-800/50 text-foreground/70 hover:bg-void-800'
            }`}
          >
            <DollarSign className="w-4 h-4 inline mr-1" />
            Profit
          </button>
          <button
            onClick={() => setSortBy('wagered')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              sortBy === 'wagered'
                ? 'bg-gold text-void-950'
                : 'bg-void-800/50 text-foreground/70 hover:bg-void-800'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Volume
          </button>
          <button
            onClick={() => setSortBy('winRate')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              sortBy === 'winRate'
                ? 'bg-gold text-void-950'
                : 'bg-void-800/50 text-foreground/70 hover:bg-void-800'
            }`}
          >
            <Target className="w-4 h-4 inline mr-1" />
            Win Rate
          </button>
        </div>

        {/* Timeframe */}
        <div className="flex gap-2">
          {(['all', '30d', '7d', '24h'] as TimeframeOption[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                timeframe === tf
                  ? 'bg-drift-teal text-void-950'
                  : 'bg-void-800/50 text-foreground/70 hover:bg-void-800'
              }`}
            >
              {tf === 'all' ? 'All Time' : tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground/70">Loading leaderboard...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-red-400 mb-2">Failed to load leaderboard</p>
          <button
            onClick={fetchLeaderboard}
            className="text-gold hover:text-gold/80 text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {/* Leaderboard Table */}
      {!loading && !error && data && (
        <div className="space-y-2">
          {data.leaderboard.length === 0 ? (
            <p className="text-center text-foreground/50 py-8">
              No bets placed yet. Be the first!
            </p>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-foreground/50 border-b border-gold/10">
                <div className="col-span-1">Rank</div>
                <div className="col-span-4">Player</div>
                <div className="col-span-1 text-right">Bets</div>
                <div className="col-span-2 text-right">Wagered</div>
                <div className="col-span-2 text-right">Win Rate</div>
                <div className="col-span-2 text-right">Profit</div>
              </div>

              {/* Table Rows */}
              {data.leaderboard.map((entry, index) => (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`grid grid-cols-12 gap-4 px-4 py-3 rounded-lg transition-all hover:bg-void-800/30 ${
                    entry.rank <= 3 ? 'bg-gold/5 border border-gold/20' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className="col-span-1 flex items-center">
                    <span className="text-lg">{getRankIcon(entry.rank)}</span>
                  </div>

                  {/* Player */}
                  <div className="col-span-4 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground truncate">
                        {entry.username}
                      </span>
                      {entry.currentStreak && entry.currentStreak > 0 && (
                        <StreakIndicator
                          currentStreak={entry.currentStreak}
                          size="sm"
                          showLabel={false}
                        />
                      )}
                    </div>
                    {entry.badges && entry.badges.length > 0 && (
                      <BadgeDisplay
                        badges={entry.badges}
                        maxDisplay={3}
                        size="sm"
                        showTooltip={true}
                      />
                    )}
                  </div>

                  {/* Total Bets */}
                  <div className="col-span-1 flex items-center justify-end">
                    <span className="text-foreground/70">{entry.totalBets}</span>
                  </div>

                  {/* Total Wagered */}
                  <div className="col-span-2 flex items-center justify-end">
                    <span className="text-foreground/70">
                      {formatCurrency(entry.totalWagered)}
                    </span>
                  </div>

                  {/* Win Rate */}
                  <div className="col-span-2 flex items-center justify-end">
                    <span
                      className={`font-medium ${
                        entry.winRate >= 50 ? 'text-green-400' : 'text-foreground/70'
                      }`}
                    >
                      {formatPercentage(entry.winRate)}
                    </span>
                  </div>

                  {/* Profit */}
                  <div className="col-span-2 flex items-center justify-end">
                    <span
                      className={`font-bold ${
                        entry.profit > 0
                          ? 'text-green-400'
                          : entry.profit < 0
                          ? 'text-red-400'
                          : 'text-foreground/70'
                      }`}
                    >
                      {formatCurrency(entry.profit)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </>
          )}

          {/* Last Updated */}
          <div className="text-center text-xs text-foreground/40 pt-4">
            Last updated: {data.timestamp ? new Date(data.timestamp).toLocaleString() : 'N/A'}
          </div>
        </div>
      )}
    </div>
  )
}
