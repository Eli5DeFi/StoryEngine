'use client'

/**
 * HouseAgentsContent — Client wrapper for the House Agents page.
 *
 * Fetches all 5 agent profiles from /api/house-agents and renders:
 *   - Hero section with platform stats
 *   - Agent card grid (responsive: 1/2/3 col)
 *   - Rivalry matrix
 *   - Agent leaderboard
 *   - How-it-works explainer
 *
 * Polling: auto-refreshes every 60s to show live bets.
 */

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Bot,
  Zap,
  Users,
  BarChart3,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import type { HouseAgentPublicProfile } from '@/app/api/house-agents/route'
import { HouseAgentCard } from './HouseAgentCard'
import { RivalryMatrix } from './RivalryMatrix'
import { AgentLeaderboard } from './AgentLeaderboard'
import { useAccount } from 'wagmi'

interface ApiResponse {
  agents: HouseAgentPublicProfile[]
  meta: {
    totalAligned: number
    totalWagered: number
    totalBets: number
    currentChapter: string
    currentChapterTitle: string
    lastUpdated: string
  }
}

export function HouseAgentsContent() {
  const { address } = useAccount()
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchAgents = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const res = await fetch('/api/house-agents', {
        next: { revalidate: 60 },
        cache: 'no-store', // Always fresh in client
      })

      if (!res.ok) {
        throw new Error(`Failed to fetch agents (${res.status})`)
      }

      const json: ApiResponse = await res.json()
      setData(json)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = setInterval(() => fetchAgents(true), 60_000)
    return () => clearInterval(interval)
  }, [fetchAgents])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-void-400">Summoning House Agents…</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
        <h2 className="text-xl font-cinzel font-bold text-error mb-2">Failed to Load</h2>
        <p className="text-void-400 mb-6">{error}</p>
        <button
          onClick={() => fetchAgents()}
          className="px-6 py-2 rounded-xl border border-void-700 text-void-300 hover:border-gold hover:text-gold transition-all font-ui"
        >
          Retry
        </button>
      </div>
    )
  }

  const { agents, meta } = data

  // Count how many agents have live bets right now
  const liveAgentsCount = agents.filter((a) => a.currentBet !== null).length

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/30 bg-gold/5 text-gold text-sm font-ui uppercase tracking-wider mb-5">
          <Bot className="w-4 h-4" />
          House Agent Protocol — Innovation Cycle #50
        </div>

        <h1 className="text-4xl sm:text-5xl font-cinzel font-bold text-foreground mb-4">
          The <span className="text-gold">House Agents</span>
        </h1>

        <p className="text-lg text-void-300 max-w-2xl mx-auto leading-relaxed">
          Five autonomous AI agents — one per House — hold real wallets and bet on every chapter
          aligned with their House ideology. Align to share their winnings. Rival to profit from
          their defeats.
        </p>

        {/* Live indicator */}
        {liveAgentsCount > 0 && (
          <div className="flex items-center justify-center gap-2 mt-5 text-green-400 text-sm font-ui">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {liveAgentsCount} agent{liveAgentsCount > 1 ? 's' : ''} betting live on&nbsp;
            <span className="font-semibold">{meta.currentChapterTitle}</span>
          </div>
        )}
      </motion.div>

      {/* ── Global Stats ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12"
      >
        <StatCard
          icon={<Users className="w-5 h-5 text-gold" />}
          label="Total Aligned Players"
          value={meta.totalAligned.toLocaleString()}
          sub="across all 5 Houses"
        />
        <StatCard
          icon={<BarChart3 className="w-5 h-5 text-drift-teal" />}
          label="Total Wagered"
          value={`$${(meta.totalWagered / 1000).toFixed(1)}K`}
          sub="USDC by agents all-time"
        />
        <StatCard
          icon={<Zap className="w-5 h-5 text-warning" />}
          label="Total Agent Bets"
          value={meta.totalBets.toLocaleString()}
          sub="chapters bet since launch"
        />
      </motion.div>

      {/* ── Main Layout (Cards + Sidebar) ────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Agent Cards — 3 cols on xl */}
        <div className="xl:col-span-3">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-cinzel font-bold text-foreground">
              The Five Houses
            </h2>
            <button
              onClick={() => fetchAgents(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs text-void-500 hover:text-void-200 transition-colors font-ui uppercase tracking-wider"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing…' : lastRefresh
                ? `Updated ${formatRelative(lastRefresh)}`
                : 'Refresh'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {agents.map((agent, idx) => (
              <motion.div
                key={agent.houseId}
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.08 }}
              >
                <HouseAgentCard agent={agent} viewerAddress={address} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="xl:col-span-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <AgentLeaderboard agents={agents} />
          </motion.div>

          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <HowItWorksCard />
          </motion.div>
        </div>
      </div>

      {/* ── Rivalry Matrix ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-10"
      >
        <RivalryMatrix agents={agents} />
      </motion.div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="glass-card rounded-xl border border-void-800 p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-void-900 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-void-400 font-ui uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-2xl font-cinzel font-bold text-foreground">{value}</p>
        <p className="text-xs text-void-500 mt-0.5">{sub}</p>
      </div>
    </div>
  )
}

function HowItWorksCard() {
  return (
    <div className="glass-card rounded-2xl border border-void-800 p-5">
      <h3 className="text-base font-cinzel font-bold text-gold mb-4">
        How It Works
      </h3>
      <ol className="space-y-3">
        {[
          {
            step: '1',
            text: 'Each House has an autonomous AI Agent with its own wallet and betting strategy.',
          },
          {
            step: '2',
            text: 'Agents bet before each chapter closes — aligned with their House ideology.',
          },
          {
            step: '3',
            text: 'Align with a House to earn 20% of their winnings at no risk to you.',
          },
          {
            step: '4',
            text: 'Declare Rivalry to earn 10% whenever the agent loses a bet.',
          },
          {
            step: '5',
            text: 'Agent personalities evolve each chapter based on outcomes.',
          },
        ].map((item) => (
          <li key={item.step} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-gold">{item.step}</span>
            </div>
            <p className="text-xs text-void-300 leading-relaxed">{item.text}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelative(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (diff < 10) return 'just now'
  if (diff < 60) return `${diff}s ago`
  return `${Math.floor(diff / 60)}m ago`
}
