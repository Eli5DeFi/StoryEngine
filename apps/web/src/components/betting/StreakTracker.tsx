'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Shield, TrendingUp, Trophy } from 'lucide-react'

interface StreakData {
  currentStreak: number
  longestStreak: number
  multiplier: number
  tier: {
    name: string
    fireEmojis: number
    visual: string
  }
  nextMilestone: {
    wins: number
    multiplier: number
    progress: number
    winsNeeded: number
  } | null
  streakShields: number
  lastBetDate: string | null
  recentBets: Array<{
    betId: string
    won: boolean
    amount: string
    payout: string | null
    timestamp: string
    streakMultiplier: number | null
    story: string
    chapter: number
  }>
  stats: {
    consecutiveWins: number
    totalBetsTracked: number
  }
}

interface Props {
  walletAddress: string
  compact?: boolean
}

export function StreakTracker({ walletAddress, compact = false }: Props) {
  const [streakData, setStreakData] = useState<StreakData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStreakData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStreakData, 30000)
    return () => clearInterval(interval)
  }, [walletAddress])

  async function fetchStreakData() {
    try {
      const res = await fetch(`/api/users/${walletAddress}/streaks`)
      
      if (!res.ok) {
        throw new Error('Failed to fetch streak data')
      }

      const data = await res.json()
      setStreakData(data)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="glass-card p-4 rounded-xl border border-void-800 animate-pulse">
        <div className="h-16 bg-void-900 rounded" />
      </div>
    )
  }

  if (error || !streakData) {
    return (
      <div className="glass-card p-4 rounded-xl border border-void-800">
        <p className="text-void-500 text-sm">Unable to load streak data</p>
      </div>
    )
  }

  if (compact) {
    return <CompactStreakView data={streakData} />
  }

  return <FullStreakView data={streakData} />
}

function CompactStreakView({ data }: { data: StreakData }) {
  if (data.currentStreak === 0) {
    return (
      <div className="glass-card p-3 rounded-lg border border-void-800">
        <div className="flex items-center gap-2 text-void-500 text-sm">
          <Flame className="w-4 h-4" />
          <span>Start your prediction streak!</span>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      className="glass-card p-3 rounded-lg border-2 border-gold/50 bg-gold/5"
    >
      <div className="flex items-center justify-between">
        {/* Fire Emojis */}
        <div className="flex items-center gap-1">
          {[...Array(Math.min(data.tier.fireEmojis, 6))].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Flame
                className="w-4 h-4 text-error"
                style={{
                  filter: 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.5))',
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* Streak Info */}
        <div className="text-right">
          <div className="text-sm font-display font-bold text-gold">
            {data.multiplier.toFixed(1)}x
          </div>
          <div className="text-xs text-void-400">
            {data.currentStreak} wins
          </div>
        </div>

        {/* Shield */}
        {data.streakShields > 0 && (
          <div className="flex items-center gap-1 text-xs text-drift-teal">
            <Shield className="w-3 h-3" />
            <span>{data.streakShields}</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function FullStreakView({ data }: { data: StreakData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 rounded-2xl border-2 border-gold/50 bg-gradient-to-br from-gold/10 via-transparent to-error/10"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-display font-bold text-foreground mb-1">
            Prediction Streak
          </h3>
          <p className="text-sm text-void-400">
            {data.currentStreak === 0
              ? 'Place a winning bet to start!'
              : data.tier.name}
          </p>
        </div>

        {/* Longest Streak Badge */}
        {data.longestStreak > 0 && (
          <div className="flex items-center gap-2 text-gold">
            <Trophy className="w-5 h-5" />
            <div className="text-right">
              <div className="text-lg font-display font-bold">
                {data.longestStreak}
              </div>
              <div className="text-xs text-void-400">Best</div>
            </div>
          </div>
        )}
      </div>

      {/* Current Streak Display */}
      {data.currentStreak > 0 && (
        <div className="mb-6">
          {/* Fire Emojis */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {[...Array(Math.min(data.tier.fireEmojis, 6))].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: 'spring',
                  delay: i * 0.1,
                  duration: 0.6,
                }}
              >
                <Flame
                  className="w-8 h-8 text-error animate-pulse"
                  style={{
                    animationDelay: `${i * 150}ms`,
                    filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.6))',
                  }}
                />
              </motion.div>
            ))}
          </div>

          {/* Multiplier */}
          <div className="text-center mb-4">
            <motion.div
              key={data.multiplier}
              initial={{ scale: 1.5 }}
              animate={{ scale: 1 }}
              className="text-5xl font-display font-bold text-gold"
            >
              {data.multiplier.toFixed(1)}x
            </motion.div>
            <p className="text-sm text-void-400 mt-1">Payout Multiplier</p>
          </div>

          {/* Current Streak Count */}
          <div className="text-center">
            <div className="text-2xl font-display font-bold text-foreground">
              {data.currentStreak} Wins
            </div>
          </div>
        </div>
      )}

      {/* No Streak State */}
      {data.currentStreak === 0 && (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-void-400 mb-2">No active streak</p>
          <p className="text-sm text-void-500">
            Win your next bet to start building your multiplier!
          </p>
        </div>
      )}

      {/* Progress to Next Milestone */}
      {data.nextMilestone && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-void-400 mb-2">
            <span>Next: {data.nextMilestone.multiplier.toFixed(1)}x</span>
            <span>{data.nextMilestone.winsNeeded} more wins</span>
          </div>
          <div className="h-3 bg-void-900 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.nextMilestone.progress * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-gold via-error to-drift-teal"
            />
          </div>
        </div>
      )}

      {/* Streak Shields */}
      {data.streakShields > 0 && (
        <div className="flex items-center gap-3 p-3 bg-drift-teal/10 border border-drift-teal/30 rounded-lg">
          <Shield className="w-5 h-5 text-drift-teal" />
          <div className="flex-1">
            <p className="text-sm font-ui font-semibold text-foreground">
              Streak Protection Available
            </p>
            <p className="text-xs text-void-400">
              {data.streakShields}x shield{data.streakShields > 1 ? 's' : ''} • Save your streak from one loss
            </p>
          </div>
        </div>
      )}

      {/* Recent History */}
      {data.recentBets.length > 0 && (
        <div className="mt-6 pt-6 border-t border-void-800">
          <h4 className="text-sm font-ui font-semibold text-void-400 mb-3">
            Recent Bets
          </h4>
          <div className="space-y-2">
            {data.recentBets.slice(0, 5).map((bet) => (
              <div
                key={bet.betId}
                className="flex items-center gap-2 text-xs"
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    bet.won ? 'bg-green-400' : 'bg-red-400'
                  }`}
                />
                <span className="text-void-500 flex-1 truncate">
                  {bet.story} • Ch {bet.chapter}
                </span>
                {bet.streakMultiplier && bet.streakMultiplier > 1 && (
                  <span className="text-gold font-medium">
                    {bet.streakMultiplier.toFixed(1)}x
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
