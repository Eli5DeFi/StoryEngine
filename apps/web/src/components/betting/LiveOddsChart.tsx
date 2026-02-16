'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { motion } from 'framer-motion'

interface OddsSnapshot {
  timestamp: string
  odds: Record<string, number>
  totalPool: number
  totalBets: number
  uniqueBettors: number
}

interface Choice {
  id: string
  text: string
  choiceNumber: number
  currentOdds: number
  totalBets: number
  isHot: boolean
}

interface LiveOddsChartProps {
  poolId: string
  choices: Choice[]
  updateInterval?: number // milliseconds
  timeframe?: '1h' | '6h' | '12h' | '24h' | 'all'
  className?: string
}

// Cyberpunk color palette for different choices
const CHOICE_COLORS = [
  '#00ff41', // Neon green
  '#00d9ff', // Cyan
  '#ff00ff', // Magenta
  '#ffd700', // Gold
  '#ff4500', // Orange-red
  '#9370db'  // Purple
]

export function LiveOddsChart({
  poolId,
  choices,
  updateInterval = 5000, // 5 seconds
  timeframe = '24h',
  className = ''
}: LiveOddsChartProps) {
  const [snapshots, setSnapshots] = useState<OddsSnapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe)
  const [isLive, setIsLive] = useState(true)

  // Fetch odds data (wrapped in useCallback to avoid dependency warnings)
  const fetchOdds = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/pools/${poolId}/odds?timeframe=${selectedTimeframe}`
      )
      
      if (!response.ok) throw new Error('Failed to fetch odds')
      
      const data = await response.json()
      setSnapshots(data.snapshots || [])
      setError(null)
    } catch (err) {
      // Only log errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching odds:', err)
      }
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [poolId, selectedTimeframe])

  // Initial fetch
  useEffect(() => {
    fetchOdds()
  }, [fetchOdds])

  // Live updates
  useEffect(() => {
    if (!isLive) return

    const interval = setInterval(() => {
      fetchOdds()
    }, updateInterval)

    return () => clearInterval(interval)
  }, [fetchOdds, updateInterval, isLive])

  // Format chart data
  const chartData = snapshots.map(snapshot => {
    const dataPoint: any = {
      timestamp: new Date(snapshot.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      fullTimestamp: new Date(snapshot.timestamp).toISOString()
    }

    // Add each choice's odds
    choices.forEach(choice => {
      const odds = (snapshot.odds as Record<string, number>)[choice.id] || 0
      dataPoint[`choice${choice.choiceNumber}`] = (odds * 100).toFixed(1) // Convert to percentage
    })

    return dataPoint
  })

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null

    return (
      <div className="bg-background/95 border border-primary/30 rounded-lg p-3 shadow-xl backdrop-blur-sm">
        <p className="text-sm font-mono text-foreground/70 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => {
          const choiceNumber = parseInt(entry.dataKey.replace('choice', ''))
          const choice = choices.find(c => c.choiceNumber === choiceNumber)
          
          return (
            <div key={index} className="flex items-center justify-between gap-4 mb-1">
              <span
                className="text-sm font-medium"
                style={{ color: entry.color }}
              >
                Choice {choiceNumber}
              </span>
              <span className="text-sm font-mono font-bold" style={{ color: entry.color }}>
                {entry.value}%
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-foreground/60">Loading live odds...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="text-center">
          <p className="text-red-500 font-medium mb-2">Failed to load odds</p>
          <p className="text-sm text-foreground/60">{error}</p>
          <button
            onClick={fetchOdds}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (snapshots.length === 0) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <p className="text-foreground/60">No odds data available yet</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative ${className}`}
    >
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-foreground">Live Betting Odds</h3>
          {isLive && (
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-1.5 text-xs text-green-500"
            >
              <div className="w-2 h-2 rounded-full bg-green-500" />
              LIVE
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Timeframe selector */}
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {(['1h', '6h', '12h', '24h', 'all'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  selectedTimeframe === tf
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground/60 hover:text-foreground'
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Live toggle */}
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              isLive
                ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                : 'bg-muted text-foreground/60 hover:text-foreground'
            }`}
          >
            {isLive ? 'Live' : 'Paused'}
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="relative rounded-lg border border-primary/20 bg-background/50 backdrop-blur-sm p-4">
        {/* Scanline effect (cyberpunk aesthetic) */}
        <div className="absolute inset-0 pointer-events-none opacity-5">
          <div className="w-full h-full bg-gradient-to-b from-transparent via-primary to-transparent animate-scan" />
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              opacity={0.1}
            />
            
            <XAxis
              dataKey="timestamp"
              stroke="currentColor"
              opacity={0.5}
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            
            <YAxis
              stroke="currentColor"
              opacity={0.5}
              tick={{ fontSize: 12 }}
              tickLine={false}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Legend
              wrapperStyle={{
                paddingTop: '20px'
              }}
              formatter={(value, entry: any) => {
                const choiceNumber = parseInt(value.replace('choice', ''))
                const choice = choices.find(c => c.choiceNumber === choiceNumber)
                return (
                  <span className="text-sm font-medium">
                    {choice?.text || `Choice ${choiceNumber}`}
                    {choice?.isHot && ' 🔥'}
                  </span>
                )
              }}
            />

            {/* Line for each choice */}
            {choices.map((choice, index) => (
              <Line
                key={choice.id}
                type="monotone"
                dataKey={`choice${choice.choiceNumber}`}
                stroke={CHOICE_COLORS[index % CHOICE_COLORS.length]}
                strokeWidth={choice.isHot ? 3 : 2}
                dot={{ r: choice.isHot ? 4 : 2 }}
                activeDot={{ r: 6 }}
                animationDuration={300}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend with current odds */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {choices.map((choice, index) => (
          <div
            key={choice.id}
            className="flex items-center justify-between p-3 rounded-lg border border-primary/10 bg-background/30"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: CHOICE_COLORS[index % CHOICE_COLORS.length] }}
              />
              <span className="text-sm font-medium text-foreground/80">
                Choice {choice.choiceNumber}
                {choice.isHot && <span className="ml-1">🔥</span>}
              </span>
            </div>
            <span
              className="text-lg font-bold font-mono"
              style={{ color: CHOICE_COLORS[index % CHOICE_COLORS.length] }}
            >
              {(choice.currentOdds * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      {/* Last updated */}
      <p className="text-xs text-foreground/40 mt-3 text-right font-mono">
        Last updated: {new Date(snapshots[snapshots.length - 1]?.timestamp).toLocaleTimeString()}
      </p>
    </motion.div>
  )
}
