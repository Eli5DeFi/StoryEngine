'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  DollarSign,
  Target,
  Activity 
} from 'lucide-react'

type StatsData = {
  timeframe: string
  stories: {
    total: number
    byStatus: Record<string, number>
    mostPopular: {
      id: string
      title: string
      genre: string
      totalBets: number
    } | null
  }
  chapters: {
    total: number
  }
  betting: {
    totalBets: number
    totalWagered: number
    totalPaidOut: number
    avgBetSize: number
    platformRevenue: number
    activePools: number
  }
  users: {
    total: number
  }
  timestamp: string
}

type TimeframeOption = 'all' | '30d' | '7d' | '24h'

export function StatsOverview() {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<TimeframeOption>('all')

  useEffect(() => {
    fetchStats()
  }, [timeframe])

  async function fetchStats() {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/analytics/stats?timeframe=${timeframe}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }

      const data = await response.json()
      setData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-cinzel font-bold text-gold mb-2">
            Platform Analytics
          </h2>
          <p className="text-foreground/70">
            Real-time insights into Voidborne's betting ecosystem
          </p>
        </div>

        {/* Timeframe Filter */}
        <div className="flex gap-2">
          {(['all', '30d', '7d', '24h'] as TimeframeOption[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeframe === tf
                  ? 'bg-gold text-void-950'
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-void-900/50 backdrop-blur border border-gold/20 rounded-lg p-6 animate-pulse"
            >
              <div className="h-20 bg-void-800/50 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-void-900/50 backdrop-blur border border-red-500/20 rounded-lg p-8 text-center">
          <p className="text-red-400 mb-4">Failed to load analytics</p>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-gold hover:bg-gold/90 text-void-950 rounded-lg font-medium transition-all"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Stats Grid */}
      {!loading && !error && data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Wagered */}
            <StatCard
              icon={<DollarSign className="w-6 h-6" />}
              title="Total Wagered"
              value={formatCurrency(data.betting.totalWagered)}
              subtitle={`Avg: ${formatCurrency(data.betting.avgBetSize)} per bet`}
              color="gold"
              delay={0}
            />

            {/* Platform Revenue */}
            <StatCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Platform Revenue"
              value={formatCurrency(data.betting.platformRevenue)}
              subtitle="15% of total volume"
              color="green"
              delay={0.1}
            />

            {/* Total Bets */}
            <StatCard
              icon={<Target className="w-6 h-6" />}
              title="Total Bets"
              value={formatNumber(data.betting.totalBets)}
              subtitle={`${data.betting.activePools} active pools`}
              color="drift-teal"
              delay={0.2}
            />

            {/* Total Users */}
            <StatCard
              icon={<Users className="w-6 h-6" />}
              title="Total Users"
              value={formatNumber(data.users.total)}
              subtitle="Registered bettors"
              color="purple"
              delay={0.3}
            />

            {/* Stories */}
            <StatCard
              icon={<BookOpen className="w-6 h-6" />}
              title="Stories"
              value={formatNumber(data.stories.total)}
              subtitle={`${data.chapters.total} chapters`}
              color="gold"
              delay={0.4}
            />

            {/* Total Paid Out */}
            <StatCard
              icon={<Activity className="w-6 h-6" />}
              title="Total Paid Out"
              value={formatCurrency(data.betting.totalPaidOut)}
              subtitle="To winning bettors"
              color="green"
              delay={0.5}
            />
          </div>

          {/* Most Popular Story */}
          {data.stories.mostPopular && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-void-900/50 backdrop-blur border border-gold/20 rounded-lg p-6"
            >
              <h3 className="text-lg font-cinzel font-bold text-gold mb-4">
                🔥 Most Popular Story
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-bold text-foreground mb-1">
                    {data.stories.mostPopular.title}
                  </h4>
                  <p className="text-foreground/70">
                    {data.stories.mostPopular.genre}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gold">
                    {formatNumber(data.stories.mostPopular.totalBets)}
                  </div>
                  <div className="text-sm text-foreground/70">Total Bets</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Story Status Breakdown */}
          {Object.keys(data.stories.byStatus).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-void-900/50 backdrop-blur border border-gold/20 rounded-lg p-6"
            >
              <h3 className="text-lg font-cinzel font-bold text-gold mb-4">
                Story Status
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(data.stories.byStatus).map(([status, count]) => (
                  <div
                    key={status}
                    className="bg-void-800/30 rounded-lg p-4 text-center"
                  >
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {count}
                    </div>
                    <div className="text-sm text-foreground/70 capitalize">
                      {status.toLowerCase()}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Last Updated */}
          <div className="text-center text-xs text-foreground/40">
            Last updated: {new Date(data.timestamp).toLocaleString()}
          </div>
        </>
      )}
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  title: string
  value: string
  subtitle: string
  color: string
  delay: number
}

function StatCard({ icon, title, value, subtitle, color, delay }: StatCardProps) {
  const colorClasses = {
    gold: 'text-gold',
    green: 'text-green-400',
    'drift-teal': 'text-drift-teal',
    purple: 'text-purple-400',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-void-900/50 backdrop-blur border border-gold/20 rounded-lg p-6 hover:border-gold/40 transition-all"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
        <h3 className="text-foreground/70 text-sm font-medium">{title}</h3>
      </div>
      <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
      <div className="text-sm text-foreground/50">{subtitle}</div>
    </motion.div>
  )
}
