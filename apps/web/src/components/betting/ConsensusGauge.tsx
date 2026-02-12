'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface ConsensusGaugeProps {
  poolId: string
  autoRefresh?: boolean
  refreshInterval?: number
}

interface Consensus {
  leadingChoice: {
    choiceId: string
    text: string
    probability: number
    betAmount: string
    betCount: number
  }
  confidenceLevel: number
  confidenceLabel: string
  trend: {
    direction: 'rising' | 'falling' | 'stable'
    change: number
  }
  totalPool: string
  totalBets: number
  uniqueBettors: number
}

export function ConsensusGauge({
  poolId,
  autoRefresh = true,
  refreshInterval = 30000,
}: ConsensusGaugeProps) {
  const [consensus, setConsensus] = useState<Consensus | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchConsensus = async () => {
    try {
      const res = await fetch(`/api/betting/consensus/${poolId}`)
      if (!res.ok) throw new Error('Failed to fetch consensus')

      const data = await res.json()
      setConsensus(data)
    } catch (err) {
      console.error('Failed to fetch consensus:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConsensus()

    if (autoRefresh) {
      const intervalId = setInterval(fetchConsensus, refreshInterval)
      return () => clearInterval(intervalId)
    }
  }, [poolId, autoRefresh, refreshInterval])

  if (loading || !consensus) {
    return (
      <div className="glass-card rounded-xl p-6">
        <div className="h-48 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const { leadingChoice, confidenceLevel, confidenceLabel, trend, uniqueBettors } = consensus

  const getConfidenceColor = (level: number) => {
    if (level >= 80) return 'text-green-400'
    if (level >= 60) return 'text-yellow-400'
    if (level >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const getTrendIcon = () => {
    if (trend.direction === 'rising') return <TrendingUp className="w-4 h-4 text-green-400" />
    if (trend.direction === 'falling') return <TrendingDown className="w-4 h-4 text-red-400" />
    return <Minus className="w-4 h-4 text-foreground/50" />
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card rounded-xl p-6 border border-void-800"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-5 h-5 text-gold" />
        <h3 className="text-lg font-semibold text-foreground">
          Community Consensus
        </h3>
      </div>

      {/* Radial Gauge */}
      <div className="relative flex items-center justify-center mb-6">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="#374151"
            strokeWidth="12"
          />
          
          {/* Progress circle */}
          <motion.circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="#d4af37"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 80}`}
            strokeDashoffset={`${2 * Math.PI * 80 * (1 - leadingChoice.probability / 100)}`}
            transform="rotate(-90 100 100)"
            initial={{ strokeDashoffset: 2 * Math.PI * 80 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 80 * (1 - leadingChoice.probability / 100) }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center"
          >
            <div className="text-4xl font-bold text-gold mb-1">
              {leadingChoice.probability.toFixed(0)}%
            </div>
            <div className="text-xs text-foreground/70">
              of bettors
            </div>
          </motion.div>
        </div>
      </div>

      {/* Leading Choice */}
      <div className="bg-void-900/50 rounded-lg p-4 mb-4 border border-gold/30">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="text-xs text-foreground/50 mb-1">Leading Choice:</div>
            <div className="text-foreground font-semibold line-clamp-2">
              {leadingChoice.text}
            </div>
          </div>
          
          {getTrendIcon()}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <div className="text-xs text-foreground/50">Pool</div>
            <div className="text-sm font-bold text-gold">
              ${parseFloat(leadingChoice.betAmount).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-xs text-foreground/50">Bets</div>
            <div className="text-sm font-bold text-foreground">
              {leadingChoice.betCount}
            </div>
          </div>
        </div>
      </div>

      {/* Confidence Level */}
      <div className="bg-void-900/30 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-foreground/70">Confidence Level:</span>
          <span className={`text-sm font-bold ${getConfidenceColor(confidenceLevel)}`}>
            {confidenceLabel}
          </span>
        </div>
        
        {/* Confidence bar */}
        <div className="h-2 bg-void-800 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${getConfidenceColor(confidenceLevel)} bg-current`}
            initial={{ width: 0 }}
            animate={{ width: `${confidenceLevel}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-foreground/50" />
          <span className="text-foreground/70">
            {uniqueBettors} {uniqueBettors === 1 ? 'bettor' : 'bettors'}
          </span>
        </div>

        {trend.direction !== 'stable' && (
          <div className="flex items-center gap-1 text-foreground/70">
            <span className="text-xs">
              {trend.direction === 'rising' ? '+' : ''}
              {trend.change.toFixed(1)}% (15m)
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
