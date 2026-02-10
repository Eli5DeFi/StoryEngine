'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

type RecentBet = {
  id: string
  userId: string
  username: string
  walletAddress: string
  storyId: string
  storyTitle: string
  chapterNumber: number
  choiceText: string
  amount: number
  odds: number
  timestamp: Date
  poolId: string
  poolStatus: string
}

type RecentActivityResponse = {
  bets: RecentBet[]
  timestamp: string
}

export function RecentActivityFeed() {
  const [bets, setBets] = useState<RecentBet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRecentBets()
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchRecentBets, 10000)
    return () => clearInterval(interval)
  }, [])

  async function fetchRecentBets() {
    try {
      const response = await fetch('/api/betting/recent?limit=20')
      
      if (!response.ok) {
        throw new Error('Failed to fetch recent bets')
      }

      const data: RecentActivityResponse = await response.json()
      
      // Only update if new bets (avoid flicker)
      if (data.bets.length > 0) {
        setBets((prev) => {
          const newBets = data.bets.filter(
            (newBet) => !prev.some((oldBet) => oldBet.id === newBet.id)
          )
          return [...newBets, ...prev].slice(0, 50)
        })
      }
      
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

  if (loading && bets.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gold/10 p-2 rounded-lg">
            <TrendingUp className="w-5 h-5 text-gold" />
          </div>
          <h3 className="text-2xl font-display font-bold text-gold">Live Activity</h3>
        </div>
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-void-400">Loading recent bets...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card rounded-2xl p-8">
        <div className="text-center py-12">
          <p className="text-red-400 mb-2">Failed to load activity</p>
          <button
            onClick={fetchRecentBets}
            className="text-gold hover:text-gold/80 text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gold/10 p-2 rounded-lg">
            <TrendingUp className="w-5 h-5 text-gold" />
          </div>
          <h3 className="text-2xl font-display font-bold text-gold">Live Activity</h3>
          <div className="flex items-center gap-2 text-xs text-void-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>Live</span>
          </div>
        </div>
      </div>

      {/* Bets Feed */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-void-800 scrollbar-track-void-950">
        {bets.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-void-600 mx-auto mb-4" />
            <p className="text-void-400">Waiting for bets...</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {bets.map((bet, index) => (
              <motion.div
                key={bet.id}
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link href={`/story/${bet.storyId}`}>
                  <div className="glass-card p-4 rounded-lg border border-void-800 hover:border-gold/50 transition-all cursor-pointer group">
                    <div className="flex items-start justify-between gap-4">
                      {/* User & Action */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full" />
                          <span className="font-ui font-semibold text-foreground truncate">
                            {bet.username}
                          </span>
                          <span className="text-void-500 text-sm">bet</span>
                          <span className="font-ui font-bold text-drift-teal">
                            {formatCurrency(bet.amount)}
                          </span>
                        </div>

                        {/* Bet Details */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-void-400">on</span>
                            <span className="text-gold font-medium truncate">
                              "{bet.choiceText}"
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-void-500">
                            <span className="truncate">{bet.storyTitle}</span>
                            <span>•</span>
                            <span>Ch {bet.chapterNumber}</span>
                            {bet.odds > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-drift-teal font-medium">
                                  {bet.odds.toFixed(2)}x
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Timestamp */}
                      <div className="text-xs text-void-500 whitespace-nowrap">
                        {formatDistanceToNow(new Date(bet.timestamp), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
