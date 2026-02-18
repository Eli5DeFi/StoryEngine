'use client'

/**
 * AuctionContent — Client wrapper for the Auction House listing page.
 *
 * Fetches /api/auction, shows:
 * - Hero stats (total patrons, bid volume, next auction)
 * - Active auction spotlight (highlighted at top)
 * - Historical auctions grid
 * - How-it-works explainer
 *
 * Polls every 30s to refresh bid data.
 */

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Gavel,
  Crown,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  BookOpen,
  Percent,
  Users,
} from 'lucide-react'
import type { ChapterAuction } from '@/lib/auction-data'
import { AuctionCard } from './AuctionCard'

interface ApiResponse {
  auctions: ChapterAuction[]
  summary: {
    activeAuctions: number
    upcomingAuctions: number
    totalPatrons: number
    totalBidVolume: number
    highestBid: number
    totalWinnerRevenue: number
  }
}

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: BookOpen,
    title: 'Every 10th Chapter is Blank',
    text: 'Chapters 10, 20, 30… are narrative wildcards. The story pauses and waits for a Patron.',
  },
  {
    step: '02',
    icon: Gavel,
    title: '48-Hour Auction',
    text: 'Bidding opens 48 hours before the blank chapter publishes. Minimum bid: 1,000 USDC. Each new bid must exceed the last by 5%.',
  },
  {
    step: '03',
    icon: Crown,
    title: 'Winner Sets the Stage',
    text: 'The highest bidder chooses: Genre, House Spotlight, and one story twist. The AI uses your parameters as absolute canon.',
  },
  {
    step: '04',
    icon: Percent,
    title: 'Earn 10% of All Bets',
    text: 'Every bet placed on your chapter earns you 10% of the pool — automatically. The more dramatic your parameters, the more people bet.',
  },
]

export function AuctionContent() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError(null)

    try {
      const res = await fetch('/api/auction', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load auctions')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => fetchData(true), 30_000)
    return () => clearInterval(interval)
  }, [fetchData])

  if (loading) return <AuctionSkeleton />
  if (error || !data) return <ErrorState message={error ?? 'No data'} onRetry={() => fetchData()} />

  const { auctions, summary } = data
  const activeAuction = auctions.find((a) => a.status === 'active')
  const historicalAuctions = auctions.filter((a) => a.status !== 'active' && a.status !== 'upcoming')
  const upcomingAuctions = auctions.filter((a) => a.status === 'upcoming')

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

      {/* ── Hero Stats ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        {[
          { label: 'Total Patrons', value: summary.totalPatrons, icon: Crown, color: 'text-gold' },
          {
            label: 'Bid Volume',
            value: `$${(summary.totalBidVolume / 1000).toFixed(1)}K`,
            icon: TrendingUp,
            color: 'text-drift-teal',
          },
          {
            label: 'Highest Bid',
            value: `$${summary.highestBid.toLocaleString()}`,
            icon: Gavel,
            color: 'text-drift-purple',
          },
          {
            label: 'Patron Revenue',
            value: `$${summary.totalWinnerRevenue.toLocaleString()}`,
            icon: Percent,
            color: 'text-green-400',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-void-800 bg-void-950/60 p-4 space-y-1"
          >
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <div className={`text-2xl font-mono font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-void-500 font-ui uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </motion.div>

      {/* ── Active Auction Spotlight ─────────────────────────────────────── */}
      {activeAuction && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2.5 h-2.5 rounded-full bg-green-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              />
              <h2 className="text-foreground font-display font-bold text-2xl">Live Auction</h2>
            </div>
            <button
              onClick={() => fetchData(true)}
              className="ml-auto text-void-500 hover:text-void-200 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <AuctionCard auction={activeAuction} index={0} />
        </section>
      )}

      {/* ── Upcoming Auctions ─────────────────────────────────────────────── */}
      {upcomingAuctions.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-foreground font-display font-bold text-2xl">Upcoming</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {upcomingAuctions.map((a, i) => (
              <AuctionCard key={a.auctionId} auction={a} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ── Historical ────────────────────────────────────────────────────── */}
      {historicalAuctions.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-foreground font-display font-bold text-2xl">Patron Archive</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {historicalAuctions.map((a, i) => (
              <AuctionCard key={a.auctionId} auction={a} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-foreground font-display font-bold text-3xl mb-3">
            How the Chapter Auction House Works
          </h2>
          <p className="text-void-400 text-base max-w-2xl mx-auto">
            The only place in interactive fiction where you can literally commission a chapter —
            and get paid for it.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-void-800 bg-void-950/60 p-5 space-y-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-void-600 font-mono text-xs">{item.step}</span>
                <item.icon className="w-5 h-5 text-gold" />
              </div>
              <h3 className="text-foreground font-bold">{item.title}</h3>
              <p className="text-void-400 text-sm leading-relaxed">{item.text}</p>
            </motion.div>
          ))}
        </div>

        {/* Revenue callout */}
        <div className="rounded-2xl border border-gold/20 bg-gold/5 p-6 text-center space-y-2">
          <Crown className="w-8 h-8 text-gold mx-auto" />
          <p className="text-foreground font-display font-bold text-xl">
            "I commissioned a Horror chapter. It generated $12,700 in bets. I earned $1,270 for writing nothing."
          </p>
          <p className="text-void-400 text-sm">— the_oracle.eth, Patron of Chapter 40</p>
        </div>
      </section>
    </div>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function AuctionSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-void-900" />
        ))}
      </div>
      <div className="h-48 rounded-2xl bg-void-900" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 rounded-2xl bg-void-900" />
        ))}
      </div>
    </div>
  )
}

// ─── Error State ──────────────────────────────────────────────────────────────

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="max-w-lg mx-auto py-24 text-center space-y-4">
      <AlertCircle className="w-12 h-12 text-error mx-auto" />
      <p className="text-error font-bold">{message}</p>
      <button
        onClick={onRetry}
        className="px-6 py-2 rounded-lg border border-void-700 text-void-300 hover:border-void-500 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
