'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Zap, Users, DollarSign } from 'lucide-react'

interface Whale {
  id: string
  amount: number
  choiceId: string
  choiceText: string
  timestamp: string
  user: string
}

interface Sentiment {
  momentum: Record<string, number>
  hotChoiceId?: string
  consensusStrength: number
  recentBetCount: number
  whaleCount: number
}

interface MarketSentimentProps {
  poolId: string
  updateInterval?: number
  showWhaleAlerts?: boolean
  showRecentBets?: boolean
  showMomentum?: boolean
  className?: string
}

export function MarketSentiment({
  poolId,
  updateInterval = 10000, // 10 seconds
  showWhaleAlerts = true,
  showRecentBets = true,
  showMomentum = true,
  className = ''
}: MarketSentimentProps) {
  const [sentiment, setSentiment] = useState<Sentiment | null>(null)
  const [whales, setWhales] = useState<Whale[]>([])
  const [loading, setLoading] = useState(true)
  const [newWhale, setNewWhale] = useState<Whale | null>(null)

  const fetchSentiment = async () => {
    try {
      const response = await fetch(`/api/pools/${poolId}/odds`)
      if (!response.ok) throw new Error('Failed to fetch sentiment')
      
      const data = await response.json()
      
      setSentiment(data.sentiment)
      
      // Check for new whales
      const currentWhaleIds = whales.map(w => w.id)
      const newWhales = data.whales.filter((w: Whale) => !currentWhaleIds.includes(w.id))
      
      if (newWhales.length > 0 && showWhaleAlerts) {
        setNewWhale(newWhales[0]) // Show alert for most recent whale
        
        // Clear alert after 5 seconds
        setTimeout(() => setNewWhale(null), 5000)
      }
      
      setWhales(data.whales)
    } catch (error) {
      console.error('Error fetching sentiment:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSentiment()
    const interval = setInterval(fetchSentiment, updateInterval)
    return () => clearInterval(interval)
  }, [poolId, updateInterval])

  if (loading || !sentiment) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Calculate overall market sentiment
  const avgMomentum = Object.values(sentiment.momentum).reduce((sum, m) => sum + Math.abs(m), 0) / 
    Object.values(sentiment.momentum).length
  
  const marketTrend = avgMomentum > 0.05 ? 'volatile' : avgMomentum > 0.02 ? 'active' : 'stable'

  // Consensus interpretation
  const consensusLevel = 
    sentiment.consensusStrength > 0.7 ? 'strong' :
    sentiment.consensusStrength > 0.4 ? 'moderate' :
    'weak'

  return (
    <div className={className}>
      {/* Whale Alert Popup */}
      <AnimatePresence>
        {newWhale && showWhaleAlerts && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed top-4 right-4 z-50 max-w-md"
          >
            <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-2 border-amber-500/50 rounded-lg p-4 backdrop-blur-md shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/30 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-bold text-amber-400">🐋 Whale Alert!</h4>
                  </div>
                  <p className="text-sm text-foreground/90 mb-2">
                    <span className="font-bold">{newWhale.user}</span> just bet{' '}
                    <span className="font-bold text-amber-400">
                      ${newWhale.amount.toLocaleString()}
                    </span>
                  </p>
                  <p className="text-xs text-foreground/70 line-clamp-2">
                    on "{newWhale.choiceText}"
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Market Sentiment Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Market Activity */}
        {showRecentBets && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-lg border border-primary/20 bg-background/50 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground/70">Activity</span>
              </div>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${
                  marketTrend === 'volatile'
                    ? 'bg-red-500/20 text-red-400'
                    : marketTrend === 'active'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-green-500/20 text-green-400'
                }`}
              >
                {marketTrend.toUpperCase()}
              </span>
            </div>
            <p className="text-2xl font-bold font-mono text-foreground">
              {sentiment.recentBetCount}
            </p>
            <p className="text-xs text-foreground/50">bets in last 15 min</p>
          </motion.div>
        )}

        {/* Consensus Strength */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-lg border border-primary/20 bg-background/50 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground/70">Consensus</span>
            </div>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded ${
                consensusLevel === 'strong'
                  ? 'bg-purple-500/20 text-purple-400'
                  : consensusLevel === 'moderate'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}
            >
              {consensusLevel.toUpperCase()}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold font-mono text-foreground">
              {(sentiment.consensusStrength * 100).toFixed(0)}%
            </p>
          </div>
          <p className="text-xs text-foreground/50">
            {consensusLevel === 'strong' 
              ? 'Most agree on one choice'
              : consensusLevel === 'moderate'
              ? 'Bets fairly distributed'
              : 'Highly divided opinion'
            }
          </p>
        </motion.div>
      </div>

      {/* Momentum Indicators */}
      {showMomentum && Object.keys(sentiment.momentum).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-3 p-4 rounded-lg border border-primary/20 bg-background/50 backdrop-blur-sm"
        >
          <h4 className="text-sm font-medium text-foreground/70 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Momentum (Last Hour)
          </h4>
          <div className="space-y-2">
            {Object.entries(sentiment.momentum)
              .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
              .slice(0, 4)
              .map(([choiceId, momentum], index) => {
                const isPositive = momentum > 0
                const isNeutral = Math.abs(momentum) < 0.01
                
                return (
                  <div key={choiceId} className="flex items-center gap-2">
                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                      {isNeutral ? (
                        <Minus className="w-4 h-4 text-foreground/30" />
                      ) : isPositive ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <span className="text-xs text-foreground/60 flex-1">
                      Choice {index + 1}
                    </span>
                    <span
                      className={`text-sm font-mono font-bold ${
                        isNeutral
                          ? 'text-foreground/30'
                          : isPositive
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                    >
                      {isPositive && '+'}
                      {(momentum * 100).toFixed(1)}%
                    </span>
                  </div>
                )
              })}
          </div>
        </motion.div>
      )}

      {/* Recent Whales */}
      {showWhaleAlerts && whales.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-3 p-4 rounded-lg border border-amber-500/20 bg-amber-500/5 backdrop-blur-sm"
        >
          <h4 className="text-sm font-medium text-foreground/70 mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-500" />
            Recent Whale Bets (${'>'}500)
          </h4>
          <div className="space-y-2">
            {whales.slice(0, 3).map((whale, index) => (
              <motion.div
                key={whale.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground/80 truncate">
                    {whale.user}
                  </p>
                  <p className="text-foreground/50 truncate">
                    {whale.choiceText}
                  </p>
                </div>
                <span className="ml-2 font-bold font-mono text-amber-500 flex-shrink-0">
                  ${whale.amount.toLocaleString()}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
