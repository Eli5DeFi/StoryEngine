'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react'
import type { UserPositionsResponse } from '@/types/insurance'
import { formatUSDC, timeUntil, PolicyStatus, StakeStatus } from '@/types/insurance'

interface UserPositionsProps {
  walletAddress: string
}

export function UserPositions({ walletAddress }: UserPositionsProps) {
  const [data, setData] = useState<UserPositionsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'policies' | 'stakes'>('policies')

  const fetchPositions = useCallback(async () => {
    try {
      const res = await fetch(`/api/insurance/user-positions?address=${walletAddress}`)
      if (!res.ok) throw new Error('Failed to fetch positions')
      setData(await res.json())
    } catch (err) {
      console.error('UserPositions fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [walletAddress])

  useEffect(() => {
    if (!walletAddress) return
    fetchPositions()
  }, [walletAddress, fetchPositions])

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-20 bg-void-900 rounded-xl" />
        ))}
      </div>
    )
  }

  if (!data || (data.policies.length === 0 && data.stakes.length === 0)) {
    return (
      <div className="text-center py-10 text-void-500 font-ui">
        <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No positions yet. Buy coverage or stake to earn yield.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Coverage Owned', value: formatUSDC(data.totalCoverageOwned), color: 'text-drift-teal' },
          { label: 'Premiums Paid', value: formatUSDC(data.totalPremiumsPaid), color: 'text-void-300' },
          { label: 'Total Staked', value: formatUSDC(data.totalStaked), color: 'text-gold' },
          { label: 'Premiums Earned', value: formatUSDC(data.totalEarned), color: 'text-success' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card rounded-xl p-3 border border-void-800">
            <div className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-void-500 font-ui">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-void-900 rounded-xl w-fit">
        {(['policies', 'stakes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-ui font-semibold transition-all ${
              activeTab === tab
                ? 'bg-void-700 text-foreground'
                : 'text-void-500 hover:text-void-300'
            }`}
          >
            {tab === 'policies'
              ? `Policies (${data.policies.length})`
              : `Stakes (${data.stakes.length})`}
          </button>
        ))}
      </div>

      {/* Policies list */}
      {activeTab === 'policies' && (
        <div className="space-y-3">
          {data.policies.map((policy, i) => (
            <motion.div
              key={policy.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-4 border border-void-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-drift-teal/15 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-drift-teal" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-ui text-foreground truncate">
                      {policy.event?.description ?? `Event #${policy.eventId}`}
                    </p>
                    <p className="text-xs text-void-500 font-ui mt-0.5">
                      {policy.event?.storyTitle} · Ch. {policy.event?.chapterNumber}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-void-600" />
                      <span className="text-xs text-void-500 font-ui">
                        {timeUntil(policy.expiresAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-base font-bold font-mono text-drift-teal">
                    {formatUSDC(policy.coverage)}
                  </div>
                  <div className="text-xs text-void-500 font-ui">coverage</div>
                  <StatusPill status={policy.status} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Stakes list */}
      {activeTab === 'stakes' && (
        <div className="space-y-3">
          {data.stakes.map((stake, i) => (
            <motion.div
              key={stake.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-4 border border-void-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gold/15 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-gold" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-ui text-foreground truncate">
                      Backing: {stake.event?.characterName ?? `Event #${stake.eventId}`} survives
                    </p>
                    <p className="text-xs text-void-500 font-ui mt-0.5">
                      {stake.event?.storyTitle}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gold font-ui font-semibold">
                        {stake.estimatedAPY}% APY
                      </span>
                      <span className="text-void-700">·</span>
                      <span className="text-xs text-success font-ui">
                        +{formatUSDC(stake.earnedPremiums)} earned
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-base font-bold font-mono text-gold">
                    {formatUSDC(stake.staked)}
                  </div>
                  <div className="text-xs text-void-500 font-ui">staked</div>
                  <StakeStatusPill status={stake.status} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatusPill({ status }: { status: PolicyStatus }) {
  const config = {
    [PolicyStatus.ACTIVE]: { label: 'Active', className: 'text-success bg-success/15' },
    [PolicyStatus.CLAIMED]: { label: 'Claimed', className: 'text-drift-teal bg-drift-teal/15' },
    [PolicyStatus.EXPIRED]: { label: 'Expired', className: 'text-void-500 bg-void-800' },
    [PolicyStatus.CANCELLED]: { label: 'Cancelled', className: 'text-error bg-error/15' },
  }[status]

  return (
    <span
      className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-ui font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  )
}

function StakeStatusPill({ status }: { status: StakeStatus }) {
  const config = {
    [StakeStatus.ACTIVE]: { label: 'Earning', className: 'text-gold bg-gold/15' },
    [StakeStatus.WITHDRAWN]: { label: 'Withdrawn', className: 'text-void-500 bg-void-800' },
  }[status]

  return (
    <span
      className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-ui font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  )
}
