'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, PieChart, BarChart3 } from 'lucide-react'

type PerformanceData = {
  profitTimeSeries: Array<{
    date: Date
    dailyProfit: number
    cumulativeProfit: number
  }>
  winRateTrend: Array<{
    date: Date
    winRate: number
  }>
  betDistribution: Array<{
    storyTitle: string
    betCount: number
    percentage: number
  }>
  roiByStory: Array<{
    storyTitle: string
    bets: number
    roi: number
  }>
  timeframe: string
  timestamp: string
}

interface PerformanceChartsProps {
  walletAddress: string
  timeframe: string
}

export function PerformanceCharts({ walletAddress, timeframe }: PerformanceChartsProps) {
  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPerformanceData()
  }, [walletAddress, timeframe])

  async function fetchPerformanceData() {
    try {
      setLoading(true)
      
      const response = await fetch(
        `/api/users/${walletAddress}/performance?timeframe=${timeframe}`
      )
      
      if (!response.ok) throw new Error('Failed to fetch performance data')

      const data = await response.json()
      setData(data)
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch performance data:', err)
      setLoading(false)
    }
  }

  if (loading || !data) {
    return (
      <div className="glass-card rounded-2xl p-8">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-void-400">Loading charts...</p>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-cinzel font-bold text-gold mb-2">
          Performance Analytics
        </h2>
        <p className="text-foreground/70">
          Visualize your betting patterns and results
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bet Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-drift-teal/10 p-2 rounded-lg">
              <PieChart className="w-5 h-5 text-drift-teal" />
            </div>
            <h3 className="text-2xl font-display font-bold text-drift-teal">
              Bet Distribution
            </h3>
          </div>

          {data.betDistribution.length === 0 ? (
            <p className="text-center text-void-400 py-8">No bets yet</p>
          ) : (
            <div className="space-y-4">
              {data.betDistribution.slice(0, 5).map((story, index) => (
                <div key={story.storyTitle}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground font-ui truncate flex-1 mr-4">
                      {story.storyTitle}
                    </span>
                    <span className="text-sm text-void-400 font-mono tabular-nums">
                      {story.betCount} bets ({story.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-void-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-drift-teal to-drift-teal-light transition-all duration-500"
                      style={{ width: `${story.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ROI by Story */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gold/10 p-2 rounded-lg">
              <BarChart3 className="w-5 h-5 text-gold" />
            </div>
            <h3 className="text-2xl font-display font-bold text-gold">
              ROI by Story
            </h3>
          </div>

          {data.roiByStory.length === 0 ? (
            <p className="text-center text-void-400 py-8">No completed bets yet</p>
          ) : (
            <div className="space-y-4">
              {data.roiByStory.slice(0, 5).map((story) => (
                <div key={story.storyTitle}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground font-ui truncate flex-1 mr-4">
                      {story.storyTitle}
                    </span>
                    <span
                      className={`text-sm font-mono tabular-nums font-bold ${
                        story.roi >= 0 ? 'text-success' : 'text-error'
                      }`}
                    >
                      {story.roi >= 0 ? '+' : ''}{story.roi.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-void-900 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          story.roi >= 0
                            ? 'bg-gradient-to-r from-success to-success-light'
                            : 'bg-gradient-to-r from-error to-error-light'
                        }`}
                        style={{
                          width: `${Math.min(Math.abs(story.roi), 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-void-500 w-16 text-right">
                      {story.bets} bets
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Profit Over Time (Simple List) */}
      {data.profitTimeSeries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-success/10 p-2 rounded-lg">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <h3 className="text-2xl font-display font-bold text-success">
              Profit Trend
            </h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.profitTimeSeries.slice(-4).reverse().map((day) => (
              <div key={day.date.toString()} className="glass-card p-4 rounded-lg">
                <div className="text-xs text-void-500 mb-1">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div
                  className={`text-2xl font-display font-bold tabular-nums ${
                    day.dailyProfit >= 0 ? 'text-success' : 'text-error'
                  }`}
                >
                  {formatCurrency(day.dailyProfit)}
                </div>
                <div className="text-xs text-void-500 mt-1">
                  Total: {formatCurrency(day.cumulativeProfit)}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
