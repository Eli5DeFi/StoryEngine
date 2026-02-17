'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, TrendingUp, Users, DollarSign } from 'lucide-react'
import type { InsuranceStatsResponse } from '@/types/insurance'
import { formatUSDC } from '@/types/insurance'

export function InsuranceStats() {
  const [stats, setStats] = useState<InsuranceStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 60_000)
    return () => clearInterval(interval)
  }, [])

  async function fetchStats() {
    try {
      const res = await fetch('/api/insurance/stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      setStats(await res.json())
    } catch (err) {
      console.error('InsuranceStats fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      label: 'Total Coverage Active',
      value: stats ? formatUSDC(stats.totalCoverageOutstanding) : '—',
      subtext: `${stats?.totalPoliciesActive.toLocaleString() ?? '—'} active policies`,
      icon: Shield,
      color: 'text-drift-teal',
      bg: 'bg-drift-teal/10 border-drift-teal/20',
    },
    {
      label: 'Underwriter Capital',
      value: stats ? formatUSDC(stats.totalUnderwriterCapital) : '—',
      subtext: 'Backing narrative risk pools',
      icon: DollarSign,
      color: 'text-gold',
      bg: 'bg-gold/10 border-gold/20',
    },
    {
      label: 'Open Events',
      value: stats ? String(stats.totalEventsOpen) : '—',
      subtext: `Avg ${stats?.avgPremiumRate.toFixed(1) ?? '—'}% premium rate`,
      icon: TrendingUp,
      color: 'text-drift-purple',
      bg: 'bg-drift-purple/10 border-drift-purple/20',
    },
    {
      label: 'Claims Ratio',
      value: stats ? `${stats.claimsRatio}%` : '—',
      subtext: `$${stats ? formatUSDC(stats.platformEarnings) : '—'} protocol earnings`,
      icon: Users,
      color: 'text-success',
      bg: 'bg-success/10 border-success/20',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card, i) => {
        const Icon = card.icon
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`glass-card rounded-xl p-5 border ${card.bg}`}
          >
            {loading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-void-800 rounded w-3/4" />
                <div className="h-8 bg-void-800 rounded w-1/2" />
                <div className="h-3 bg-void-800 rounded w-2/3" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-4 h-4 ${card.color}`} />
                  <span className="text-xs font-ui text-void-400 uppercase tracking-wider">
                    {card.label}
                  </span>
                </div>
                <div className={`text-2xl font-display font-bold ${card.color} mb-1`}>
                  {card.value}
                </div>
                <div className="text-xs text-void-400 font-ui">{card.subtext}</div>
              </>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
