/**
 * /insurance — Narrative Insurance Protocol Page
 * Innovation Cycle #47 — "The Living Story Protocol"
 *
 * Readers can hedge against story outcomes they fear.
 * Underwriters earn DeFi yield by backing narrative risk pools.
 */

'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, TrendingUp, ArrowLeft, RefreshCw, BookOpen, Info } from 'lucide-react'
import Link from 'next/link'
import type { InsuranceEvent } from '@/types/insurance'
import { InsuranceStats } from '@/components/insurance/InsuranceStats'
import { InsuranceEventCard } from '@/components/insurance/InsuranceEventCard'
import { UserPositions } from '@/components/insurance/UserPositions'

type TabFilter = 'all' | 'low' | 'medium' | 'high' | 'extreme'

const FILTER_LABELS: Record<TabFilter, string> = {
  all: 'All Events',
  low: '🟢 Low Risk',
  medium: '🔵 Medium',
  high: '🟡 High Risk',
  extreme: '🔴 Extreme',
}

// Placeholder wallet address until wagmi is wired up
const DEMO_WALLET = '0xDEMO_WALLET'

export default function InsurancePage() {
  const [events, setEvents] = useState<InsuranceEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<TabFilter>('all')
  const [showPositions, setShowPositions] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchEvents()
    // Auto-refresh every 60s
    const interval = setInterval(fetchEvents, 60_000)
    return () => clearInterval(interval)
  }, [])

  async function fetchEvents() {
    try {
      const res = await fetch('/api/insurance/events?status=OPEN')
      if (!res.ok) throw new Error('Failed to fetch events')
      const data = await res.json()
      setEvents(data.events)
    } catch (err) {
      console.error('InsurancePage fetch error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchEvents()
  }

  // Filter events by risk tier
  const filteredEvents =
    filter === 'all'
      ? events
      : events.filter((e) => e.riskTier.toLowerCase() === filter)

  return (
    <div className="min-h-screen bg-background">
      {/* ── Navigation bar ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 border-b border-void-800/60 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 rounded-lg text-void-400 hover:text-foreground hover:bg-void-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-drift-teal" />
                <h1 className="font-display font-bold text-lg text-foreground">
                  Narrative Insurance
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-drift-teal/15 text-drift-teal text-xs font-ui font-semibold border border-drift-teal/30">
                  NIP Protocol
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPositions(!showPositions)}
                className={`px-3 py-1.5 rounded-lg text-sm font-ui font-semibold border transition-all ${
                  showPositions
                    ? 'bg-drift-teal/20 border-drift-teal/50 text-drift-teal'
                    : 'bg-void-800 border-void-700 text-void-400 hover:text-foreground'
                }`}
              >
                My Positions
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 rounded-lg text-void-400 hover:text-foreground hover:bg-void-800 transition-colors disabled:opacity-40"
                title="Refresh events"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 py-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-drift-teal/10 border border-drift-teal/25">
            <Shield className="w-4 h-4 text-drift-teal" />
            <span className="text-sm font-ui text-drift-teal font-semibold">
              Innovation Cycle #47 · Living Story Protocol
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground leading-tight">
            Protect What You Love.{' '}
            <span className="text-drift-teal">Earn From What You Know.</span>
          </h2>
          <p className="max-w-2xl mx-auto text-void-400 font-ui text-base leading-relaxed">
            Buy coverage against feared story outcomes. Earn DeFi yield by underwriting narrative
            risk. Premium rates reveal the market&apos;s implied survival probability for each
            character — live, transparent, and on-chain.
          </p>

          {/* Two value props */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-4">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-drift-teal/5 border border-drift-teal/20">
              <Shield className="w-5 h-5 text-drift-teal flex-shrink-0" />
              <div className="text-left">
                <div className="text-sm font-semibold text-drift-teal font-ui">Policyholder</div>
                <div className="text-xs text-void-400 font-ui">
                  Pay premium → receive full payout if event occurs
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gold/5 border border-gold/20">
              <TrendingUp className="w-5 h-5 text-gold flex-shrink-0" />
              <div className="text-left">
                <div className="text-sm font-semibold text-gold font-ui">Underwriter</div>
                <div className="text-xs text-void-400 font-ui">
                  Stake capital → earn premium yield if event doesn&apos;t occur
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Platform stats */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <InsuranceStats />
        </motion.section>

        {/* My Positions (toggled) */}
        {showPositions && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-2xl border border-void-800 p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <BookOpen className="w-5 h-5 text-drift-teal" />
              <h3 className="font-display font-bold text-lg text-foreground">My Positions</h3>
            </div>
            <UserPositions walletAddress={DEMO_WALLET} />
          </motion.section>
        )}

        {/* Events section */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h3 className="font-display font-bold text-xl text-foreground">
                Active Insurable Events
              </h3>
              <p className="text-sm text-void-400 font-ui mt-0.5">
                {events.length} events · Open for coverage and underwriting
              </p>
            </div>

            {/* Risk filter tabs */}
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(FILTER_LABELS) as TabFilter[]).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setFilter(tier)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-ui font-semibold transition-all ${
                    filter === tier
                      ? 'bg-void-700 text-foreground border border-void-600'
                      : 'bg-void-900 text-void-500 border border-void-800 hover:text-void-300 hover:border-void-700'
                  }`}
                >
                  {FILTER_LABELS[tier]}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="glass-card rounded-2xl border border-void-800 h-96 animate-pulse"
                />
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-16 text-void-500 font-ui">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No {filter !== 'all' ? `${filter}-risk` : ''} events open right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredEvents.map((event, index) => (
                <InsuranceEventCard key={event.id} event={event} index={index} />
              ))}
            </div>
          )}
        </section>

        {/* FAQ / Explainer */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl border border-void-800 p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Info className="w-5 h-5 text-void-400" />
            <h3 className="font-display font-bold text-lg text-foreground">
              How Narrative Insurance Works
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="text-2xl">🛡️</div>
              <h4 className="font-semibold text-foreground font-ui">Buy Coverage</h4>
              <p className="text-sm text-void-400 font-ui leading-relaxed">
                Pay a premium (typically 5–50% of coverage) to protect yourself against a feared
                outcome. If the event occurs, you receive the full coverage amount in USDC.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl">📈</div>
              <h4 className="font-semibold text-foreground font-ui">Earn as Underwriter</h4>
              <p className="text-sm text-void-400 font-ui leading-relaxed">
                Stake USDC into risk pools to back characters you believe will survive. Earn
                proportional premiums if the event doesn&apos;t occur — up to 400% APY on
                high-risk events.
              </p>
            </div>
            <div className="space-y-2">
              <div className="text-2xl">📊</div>
              <h4 className="font-semibold text-foreground font-ui">Read the Market</h4>
              <p className="text-sm text-void-400 font-ui leading-relaxed">
                Premium rates are live prediction markets. A 5% rate means the market believes
                95% survival probability. A 50% rate means true uncertainty. No bet required to
                learn what the market knows.
              </p>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  )
}
