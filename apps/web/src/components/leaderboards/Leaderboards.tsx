'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy,
  TrendingUp,
  Flame,
  DollarSign,
  Target,
  Crown,
  Star,
  Zap,
} from 'lucide-react'
import Image from 'next/image'

type Category = 'winners' | 'predictors' | 'streaks' | 'whales' | 'weekly'
type Timeframe = 'all' | '30d' | '7d' | '24h'

interface LeaderboardEntry {
  rank: number
  userId: string
  walletAddress: string
  username: string
  avatar?: string | null
  // Winners & Whales
  profit?: string
  totalWagered?: string
  // Predictors
  winRate?: number
  totalBets?: number
  // Streaks
  currentStreak?: number
  longestStreak?: number
  isOnFire?: boolean
  // Weekly
  weeklyProfit?: string
  weeklyBets?: number
}

interface LeaderboardData {
  category: Category
  timeframe: Timeframe
  limit: number
  data: LeaderboardEntry[]
  updatedAt: string
}

const CATEGORIES = [
  {
    id: 'winners' as Category,
    label: 'Top Winners',
    icon: Trophy,
    description: 'Highest net profit',
    gradient: 'from-yellow-500 to-amber-600',
  },
  {
    id: 'predictors' as Category,
    label: 'Best Predictors',
    icon: Target,
    description: 'Highest win rate',
    gradient: 'from-blue-500 to-cyan-600',
  },
  {
    id: 'streaks' as Category,
    label: 'Hot Streaks',
    icon: Flame,
    description: 'Longest winning streaks',
    gradient: 'from-red-500 to-orange-600',
  },
  {
    id: 'whales' as Category,
    label: 'Biggest Bettors',
    icon: DollarSign,
    description: 'Highest total wagered',
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    id: 'weekly' as Category,
    label: 'Weekly Champions',
    icon: Crown,
    description: 'Top performers this week',
    gradient: 'from-purple-500 to-pink-600',
  },
]

const TIMEFRAMES: { id: Timeframe; label: string }[] = [
  { id: 'all', label: 'All Time' },
  { id: '30d', label: '30 Days' },
  { id: '7d', label: '7 Days' },
  { id: '24h', label: '24 Hours' },
]

export function Leaderboards() {
  const [category, setCategory] = useState<Category>('winners')
  const [timeframe, setTimeframe] = useState<Timeframe>('all')
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [category, timeframe])

  async function fetchLeaderboard() {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/leaderboards?category=${category}&timeframe=${timeframe}&limit=50`
      )
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentCategory = CATEGORIES.find((c) => c.id === category)!

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-3 px-6 py-3 glass-card rounded-full border border-gold/30"
        >
          <Trophy className="w-6 h-6 text-gold" />
          <h1 className="text-2xl font-cinzel font-bold text-gold">
            The Void Champions
          </h1>
        </motion.div>
        <p className="text-foreground/70 max-w-2xl mx-auto">
          Legends who've mastered the art of prediction. May their wisdom guide your bets.
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-3 justify-center">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`relative group px-6 py-3 rounded-xl transition-all ${
                category === cat.id
                  ? 'bg-gradient-to-r ' + cat.gradient + ' text-white shadow-lg'
                  : 'glass-card border border-void-800 hover:border-gold/50 text-foreground/70'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span className="font-semibold text-sm">{cat.label}</span>
              </div>
              {category !== cat.id && (
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-gold/10 to-transparent" />
              )}
            </button>
          )
        })}
      </div>

      {/* Timeframe Filter (hide for weekly) */}
      {category !== 'weekly' && (
        <div className="flex gap-2 justify-center">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeframe === tf.id
                  ? 'bg-gold text-void-950'
                  : 'bg-void-800/50 text-foreground/70 hover:bg-void-800'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-void-800">
        {/* Header */}
        <div className={`bg-gradient-to-r ${currentCategory.gradient} px-6 py-4`}>
          <div className="flex items-center gap-3 text-white">
            <currentCategory.icon className="w-5 h-5" />
            <h3 className="font-bold text-lg">{currentCategory.label}</h3>
            <span className="text-sm opacity-90">• {currentCategory.description}</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center gap-3 text-foreground/50">
                <div className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                <span>Loading champions...</span>
              </div>
            </div>
          ) : data && data.data.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-void-800 text-foreground/70 text-sm">
                  <th className="px-6 py-4 text-left font-semibold">Rank</th>
                  <th className="px-6 py-4 text-left font-semibold">Player</th>
                  {renderTableHeaders(category)}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {data.data.map((entry, index) => (
                    <motion.tr
                      key={entry.userId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-void-900/50 hover:bg-void-900/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <RankBadge rank={entry.rank} />
                      </td>
                      <td className="px-6 py-4">
                        <PlayerCard entry={entry} />
                      </td>
                      {renderTableData(category, entry)}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-foreground/50">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No champions yet. Be the first to make history!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {data && (
          <div className="px-6 py-3 border-t border-void-800 text-xs text-foreground/50 text-center">
            Updated {new Date(data.updatedAt).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// COMPONENTS
// ============================================================================

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center gap-2">
        <Crown className="w-5 h-5 text-yellow-400" />
        <span className="font-bold text-yellow-400">#1</span>
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className="flex items-center gap-2">
        <Star className="w-5 h-5 text-gray-400" />
        <span className="font-bold text-gray-400">#2</span>
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div className="flex items-center gap-2">
        <Star className="w-5 h-5 text-amber-600" />
        <span className="font-bold text-amber-600">#3</span>
      </div>
    )
  }
  return <span className="text-foreground/70 font-semibold">#{rank}</span>
}

function PlayerCard({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div className="flex items-center gap-3">
      {/* Avatar */}
      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-gold/30 to-void-900">
        {entry.avatar ? (
          <Image
            src={entry.avatar}
            alt={entry.username}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gold font-bold">
            {entry.username[0].toUpperCase()}
          </div>
        )}
      </div>

      {/* Name & Address */}
      <div>
        <div className="font-semibold text-foreground flex items-center gap-2">
          {entry.username}
          {entry.isOnFire && <Flame className="w-4 h-4 text-orange-500" />}
        </div>
        <div className="text-xs text-foreground/50">{formatAddress(entry.walletAddress)}</div>
      </div>
    </div>
  )
}

// ============================================================================
// TABLE RENDERERS
// ============================================================================

function renderTableHeaders(category: Category) {
  switch (category) {
    case 'winners':
      return (
        <>
          <th className="px-6 py-4 text-right font-semibold">Net Profit</th>
          <th className="px-6 py-4 text-right font-semibold">Total Bets</th>
          <th className="px-6 py-4 text-right font-semibold">Win Rate</th>
        </>
      )
    case 'predictors':
      return (
        <>
          <th className="px-6 py-4 text-right font-semibold">Win Rate</th>
          <th className="px-6 py-4 text-right font-semibold">Total Bets</th>
          <th className="px-6 py-4 text-right font-semibold">Profit</th>
        </>
      )
    case 'streaks':
      return (
        <>
          <th className="px-6 py-4 text-right font-semibold">Current Streak</th>
          <th className="px-6 py-4 text-right font-semibold">Longest Streak</th>
          <th className="px-6 py-4 text-right font-semibold">Win Rate</th>
        </>
      )
    case 'whales':
      return (
        <>
          <th className="px-6 py-4 text-right font-semibold">Total Wagered</th>
          <th className="px-6 py-4 text-right font-semibold">Total Bets</th>
          <th className="px-6 py-4 text-right font-semibold">Profit</th>
        </>
      )
    case 'weekly':
      return (
        <>
          <th className="px-6 py-4 text-right font-semibold">Weekly Profit</th>
          <th className="px-6 py-4 text-right font-semibold">Bets This Week</th>
          <th className="px-6 py-4 text-right font-semibold">Win Rate</th>
        </>
      )
  }
}

function renderTableData(category: Category, entry: LeaderboardEntry) {
  switch (category) {
    case 'winners':
      return (
        <>
          <td className="px-6 py-4 text-right">
            <ProfitBadge profit={entry.profit!} />
          </td>
          <td className="px-6 py-4 text-right text-foreground/70">
            {entry.totalBets}
          </td>
          <td className="px-6 py-4 text-right">
            <WinRateBadge winRate={entry.winRate!} />
          </td>
        </>
      )
    case 'predictors':
      return (
        <>
          <td className="px-6 py-4 text-right">
            <WinRateBadge winRate={entry.winRate!} />
          </td>
          <td className="px-6 py-4 text-right text-foreground/70">
            {entry.totalBets}
          </td>
          <td className="px-6 py-4 text-right">
            <ProfitBadge profit={entry.profit!} />
          </td>
        </>
      )
    case 'streaks':
      return (
        <>
          <td className="px-6 py-4 text-right">
            <StreakBadge streak={entry.currentStreak!} isOnFire={entry.isOnFire} />
          </td>
          <td className="px-6 py-4 text-right">
            <StreakBadge streak={entry.longestStreak!} />
          </td>
          <td className="px-6 py-4 text-right">
            <WinRateBadge winRate={entry.winRate!} />
          </td>
        </>
      )
    case 'whales':
      return (
        <>
          <td className="px-6 py-4 text-right">
            <span className="font-mono font-bold text-gold">
              ${formatNumber(entry.totalWagered!)}
            </span>
          </td>
          <td className="px-6 py-4 text-right text-foreground/70">
            {entry.totalBets}
          </td>
          <td className="px-6 py-4 text-right">
            <ProfitBadge profit={entry.profit!} />
          </td>
        </>
      )
    case 'weekly':
      return (
        <>
          <td className="px-6 py-4 text-right">
            <ProfitBadge profit={entry.weeklyProfit!} />
          </td>
          <td className="px-6 py-4 text-right text-foreground/70">
            {entry.weeklyBets}
          </td>
          <td className="px-6 py-4 text-right">
            <WinRateBadge winRate={entry.winRate!} />
          </td>
        </>
      )
  }
}

function ProfitBadge({ profit }: { profit: string }) {
  const value = parseFloat(profit)
  const isPositive = value >= 0
  return (
    <span
      className={`font-mono font-bold ${
        isPositive ? 'text-green-400' : 'text-red-400'
      }`}
    >
      {isPositive ? '+' : ''}${formatNumber(profit)}
    </span>
  )
}

function WinRateBadge({ winRate }: { winRate: number }) {
  const color =
    winRate >= 70
      ? 'text-green-400'
      : winRate >= 50
      ? 'text-yellow-400'
      : 'text-red-400'
  return (
    <div className="flex items-center gap-2 justify-end">
      <TrendingUp className={`w-4 h-4 ${color}`} />
      <span className={`font-bold ${color}`}>{winRate.toFixed(1)}%</span>
    </div>
  )
}

function StreakBadge({ streak, isOnFire }: { streak: number; isOnFire?: boolean }) {
  if (streak === 0) {
    return <span className="text-foreground/50">—</span>
  }
  return (
    <div className="flex items-center gap-2 justify-end">
      {isOnFire && <Zap className="w-4 h-4 text-orange-500" />}
      <span className={`font-bold ${isOnFire ? 'text-orange-400' : 'text-gold'}`}>
        {streak} 🔥
      </span>
    </div>
  )
}

// ============================================================================
// HELPERS
// ============================================================================

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function formatNumber(value: string): string {
  const num = parseFloat(value)
  if (isNaN(num)) return '0'
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K'
  return num.toFixed(2)
}
