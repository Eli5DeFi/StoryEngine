'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

interface OddsChartProps {
  poolId: string
  interval?: '5m' | '15m' | '1h' | '6h' | '24h'
  autoRefresh?: boolean
  refreshInterval?: number // milliseconds
}

interface OddsSnapshot {
  timestamp: string
  odds: Record<string, number>
  totalPool: string
  totalBets: number
}

interface Choice {
  id: string
  text: string
  choiceNumber: number
}

const COLORS = [
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
]

export function OddsChart({
  poolId,
  interval = '1h',
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}: OddsChartProps) {
  const [data, setData] = useState<any[]>([])
  const [choices, setChoices] = useState<Choice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOdds = useCallback(async () => {
    try {
      const res = await fetch(`/api/betting/odds-history/${poolId}?interval=${interval}&limit=50`)
      if (!res.ok) throw new Error('Failed to fetch odds')

      const json = await res.json()
      setChoices(json.choices)

      // Transform data for Recharts
      const chartData = json.snapshots.map((snapshot: OddsSnapshot) => {
        const point: any = {
          time: new Date(snapshot.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          timestamp: snapshot.timestamp,
        }

        // Add odds for each choice (convert to percentage)
        json.choices.forEach((choice: Choice) => {
          const odds = snapshot.odds[choice.id] || 0
          point[`choice_${choice.choiceNumber}`] = parseFloat((odds * 100).toFixed(2))
        })

        return point
      })

      setData(chartData)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch odds:', err)
      setError('Failed to load odds data')
    } finally {
      setLoading(false)
    }
  }, [interval, poolId])

  useEffect(() => {
    fetchOdds()

    if (autoRefresh) {
      const intervalId = setInterval(fetchOdds, refreshInterval)
      return () => clearInterval(intervalId)
    }
  }, [fetchOdds, autoRefresh, refreshInterval])

  if (loading) {
    return (
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-5 h-5 text-gold animate-pulse" />
          <h3 className="text-lg font-semibold text-foreground">Loading Odds...</h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card rounded-xl p-6 border border-red-500/30">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  const latestData = data[data.length - 1] || {}
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-6 border border-void-800"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-gold" />
          <h3 className="text-lg font-semibold text-foreground">
            Live Betting Odds
          </h3>
        </div>
        
        {/* Interval Selector */}
        <div className="flex gap-2">
          {['5m', '15m', '1h', '6h', '24h'].map((int) => (
            <button
              key={int}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                interval === int
                  ? 'bg-gold text-void-950'
                  : 'bg-void-800/50 text-foreground/70 hover:bg-void-800'
              }`}
            >
              {int}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="time"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft', style: { fill: '#9ca3af' } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#f3f4f6' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value) => {
              const choiceNum = value.replace('choice_', '')
              const choice = choices.find((c) => c.choiceNumber === parseInt(choiceNum))
              return choice?.text || value
            }}
          />
          
          {choices.map((choice, index) => (
            <Line
              key={choice.id}
              type="monotone"
              dataKey={`choice_${choice.choiceNumber}`}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Latest Odds */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {choices.map((choice, index) => {
          const latestOdds = latestData[`choice_${choice.choiceNumber}`] || 0
          const isLeading = latestOdds === Math.max(
            ...choices.map(c => latestData[`choice_${c.choiceNumber}`] || 0)
          )

          return (
            <div
              key={choice.id}
              className={`p-4 rounded-lg border ${
                isLeading
                  ? 'border-gold/50 bg-gold/10'
                  : 'border-void-800 bg-void-900/30'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground/70">
                  Choice {choice.choiceNumber}
                </span>
                {isLeading && (
                  <span className="px-2 py-0.5 rounded-full bg-gold text-void-950 text-xs font-bold">
                    LEADING
                  </span>
                )}
              </div>
              
              <p className="text-foreground text-sm mb-2 line-clamp-2">
                {choice.text}
              </p>
              
              <div className="flex items-center gap-2">
                <span
                  className="text-2xl font-bold"
                  style={{ color: COLORS[index % COLORS.length] }}
                >
                  {latestOdds.toFixed(1)}%
                </span>
                
                {/* Trend indicator (placeholder for now) */}
                {/* <TrendingUp className="w-4 h-4 text-green-400" /> */}
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
