'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, TrendingUp, Clock, Users } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

type HotPool = {
  poolId: string
  storyId: string
  storyTitle: string
  chapterNumber: number
  recentBets: number
  totalPool: number
  closesAt: Date
}

type TrendingChoice = {
  choiceId: string
  choiceText: string
  storyTitle: string
  chapterNumber: number
  recentVolume: number
  totalBets: number
  momentum: number
}

type TrendingData = {
  hotPools: HotPool[]
  trendingChoices: TrendingChoice[]
  timestamp: string
}

export function CommunityPulse() {
  const [data, setData] = useState<TrendingData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrending()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchTrending, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchTrending() {
    try {
      const response = await fetch('/api/betting/trending')
      
      if (!response.ok) throw new Error('Failed to fetch trending data')

      const data = await response.json()
      setData(data)
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch trending:', err)
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

  if (loading || !data) {
    return (
      <div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        aria-busy="true"
        aria-label="Loading trending data…"
      >
        {/* Skeleton — mirrors the live layout (2 columns, 5 rows each) */}
        {[0, 1].map((col) => (
          <div key={col} className="glass-card rounded-2xl p-8 space-y-4">
            <div className="h-6 w-1/3 bg-white/5 rounded animate-pulse" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Hot Pools */}
      <div className="glass-card rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-error/10 p-2 rounded-lg">
            <Flame className="w-5 h-5 text-error" />
          </div>
          <h3 className="text-2xl font-display font-bold text-error">Hot Right Now</h3>
        </div>

        <div className="space-y-4">
          {data.hotPools.length === 0 ? (
            <p className="text-center text-void-400 py-8">No active pools</p>
          ) : (
            data.hotPools.map((pool, index) => (
              <motion.div
                key={pool.poolId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/story/${pool.storyId}`}>
                  <div className="glass-card p-4 rounded-lg border border-void-800 hover:border-error/50 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-ui font-semibold text-foreground group-hover:text-error transition-colors truncate">
                          {pool.storyTitle}
                        </h4>
                        <p className="text-sm text-void-500">Chapter {pool.chapterNumber}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-error" />
                        <span className="text-lg font-display font-bold text-error tabular-nums">
                          {pool.recentBets}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-void-500">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>Pool: {formatCurrency(pool.totalPool)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Closes {formatDistanceToNow(new Date(pool.closesAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Trending Choices */}
      <div className="glass-card rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-drift-teal/10 p-2 rounded-lg">
            <TrendingUp className="w-5 h-5 text-drift-teal" />
          </div>
          <h3 className="text-2xl font-display font-bold text-drift-teal">Trending Choices</h3>
        </div>

        <div className="space-y-4">
          {data.trendingChoices.length === 0 ? (
            <p className="text-center text-void-400 py-8">No trending choices</p>
          ) : (
            data.trendingChoices.map((choice, index) => (
              <motion.div
                key={choice.choiceId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-4 rounded-lg border border-void-800"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-ui font-medium text-gold truncate">
                      &quot;{choice.choiceText}&quot;
                    </p>
                    <p className="text-xs text-void-500 mt-1">
                      {choice.storyTitle} • Ch {choice.chapterNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-display font-bold text-drift-teal tabular-nums">
                      {formatCurrency(choice.recentVolume)}
                    </div>
                    <div className="text-xs text-void-500">last hour</div>
                  </div>
                </div>

                {/* Momentum Bar */}
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex-1 h-2 bg-void-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-drift-teal to-drift-teal-light transition-all duration-500"
                      style={{ width: `${Math.min(choice.momentum, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-drift-teal font-medium tabular-nums w-12 text-right">
                    {choice.momentum.toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-void-500 mt-1">
                  {choice.totalBets} total bets
                </p>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
