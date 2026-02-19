'use client'

/**
 * GuildsContent — Full guild directory page client component.
 *
 * Features:
 * - Platform stats bar (total guilds, members, treasury, active wars)
 * - Filter/sort toolbar (house, tier, recruiting, sort order)
 * - Guild card grid
 * - Void Map sidebar (territory overview)
 * - Guild Leaderboard sidebar
 * - Floating "Create Guild" CTA
 */

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  Users,
  DollarSign,
  Swords,
  Filter,
  RefreshCw,
  Plus,
  AlertCircle,
  Map,
} from 'lucide-react'
import Link from 'next/link'
import { GuildCard } from './GuildCard'
import { VoidMap } from './VoidMap'
import { GuildLeaderboard } from './GuildLeaderboard'
import type { GuildPublicProfile } from '@/lib/guilds'

type SortOption = 'score' | 'treasury' | 'members' | 'winrate' | 'newest'

interface GuildsApiResponse {
  guilds: GuildPublicProfile[]
  stats: {
    totalGuilds: number
    totalMembers: number
    totalTreasuryUsdc: number
    totalWageredUsdc: number
    activeWars: number
    rankedGuild: string
    rankedGuildId: string
    currentAgendaHolder: string
    currentSeason: string
    seasonEndsAt: string
  }
}

const HOUSE_OPTIONS = [
  { value: '', label: 'All Houses' },
  { value: 'valdris', label: '👑 Valdris', color: '#8b7ab8' },
  { value: 'obsidian', label: '🌑 Obsidian', color: '#334155' },
  { value: 'aurelius', label: '⚖️ Aurelius', color: '#d4a853' },
  { value: 'strand', label: '🌀 Strand', color: '#4ea5d9' },
  { value: 'null', label: '💀 Null Collective', color: '#ef4444' },
]

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'score', label: 'Season Score' },
  { value: 'treasury', label: 'Treasury' },
  { value: 'members', label: 'Members' },
  { value: 'winrate', label: 'Win Rate' },
  { value: 'newest', label: 'Newest' },
]

export function GuildsContent() {
  const [data, setData] = useState<GuildsApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Filters
  const [houseFilter, setHouseFilter] = useState('')
  const [recruitingOnly, setRecruitingOnly] = useState(false)
  const [sort, setSort] = useState<SortOption>('score')

  const fetchGuilds = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true)
      else setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (houseFilter) params.set('house', houseFilter)
      if (recruitingOnly) params.set('recruiting', 'true')
      params.set('sort', sort)

      try {
        const res = await fetch(`/api/guilds?${params}`, {
          cache: 'no-store',
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json: GuildsApiResponse = await res.json()
        setData(json)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load guilds')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [houseFilter, recruitingOnly, sort]
  )

  useEffect(() => {
    fetchGuilds()
  }, [fetchGuilds])

  const { guilds = [], stats } = data ?? {}

  return (
    <div className="min-h-screen bg-background">
      {/* ── Page Header ── */}
      <div className="border-b border-gold/20 bg-void-950/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-cinzel font-bold text-gold flex items-center gap-2">
              <Shield className="w-6 h-6" />
              Narrative Guilds
            </h1>
            <p className="text-void-400 text-xs font-ui mt-0.5">
              Form factions. Control territory. Shape the story.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchGuilds(true)}
              disabled={refreshing}
              className="p-2 rounded-lg border border-void-700/40 text-void-400 hover:text-foreground hover:border-void-500 transition-all disabled:opacity-40"
              title="Refresh"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              />
            </button>

            <Link
              href="/guilds/create"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-all font-ui font-semibold text-sm"
            >
              <Plus className="w-4 h-4" />
              Create Guild
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Platform Stats Bar ── */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
          >
            <PlatformStat
              icon={<Shield className="w-4 h-4" />}
              label="Active Guilds"
              value={stats.totalGuilds.toString()}
              color="text-gold"
            />
            <PlatformStat
              icon={<Users className="w-4 h-4" />}
              label="Guild Members"
              value={stats.totalMembers.toString()}
              color="text-drift-teal"
            />
            <PlatformStat
              icon={<DollarSign className="w-4 h-4" />}
              label="Total Treasury"
              value={`$${(stats.totalTreasuryUsdc / 1000).toFixed(1)}K`}
              color="text-success"
            />
            <PlatformStat
              icon={<Swords className="w-4 h-4" />}
              label="Active Wars"
              value={stats.activeWars.toString()}
              color="text-error"
            />
          </motion.div>
        )}

        {/* ── Season Banner ── */}
        {stats?.currentSeason && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6 px-4 py-3 rounded-xl border border-gold/20 bg-gold/5 flex items-center justify-between flex-wrap gap-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-gold text-lg">🏆</span>
              <div>
                <span className="font-cinzel font-bold text-gold text-sm">
                  {stats.currentSeason}
                </span>
                <span className="text-void-400 text-xs font-ui ml-3">
                  Ranked guild earns Narrative Agenda injection into Chapter AI
                  prompt
                </span>
              </div>
            </div>
            <Link
              href={`/guilds/${stats.rankedGuildId}`}
              className="text-xs font-ui font-semibold text-gold border border-gold/30 px-3 py-1 rounded-full hover:bg-gold/10 transition-all"
            >
              👑 {stats.rankedGuild} leads
            </Link>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left: Filters + Guild Grid ── */}
          <div className="lg:col-span-2">
            {/* Filter toolbar */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-wrap items-center gap-3 mb-5"
            >
              <div className="flex items-center gap-2 text-void-400">
                <Filter className="w-4 h-4" />
                <span className="text-xs font-ui font-semibold">Filter:</span>
              </div>

              {/* House filter */}
              <select
                value={houseFilter}
                onChange={(e) => setHouseFilter(e.target.value)}
                className="text-xs font-ui bg-void-900/60 border border-void-700/40 rounded-lg px-3 py-1.5 text-foreground focus:border-gold/40 focus:outline-none"
              >
                {HOUSE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>

              {/* Recruiting toggle */}
              <button
                onClick={() => setRecruitingOnly((v) => !v)}
                className={`
                  text-xs font-ui font-semibold px-3 py-1.5 rounded-lg border transition-all
                  ${recruitingOnly
                    ? 'bg-success/10 border-success/30 text-success'
                    : 'bg-void-900/60 border-void-700/40 text-void-400 hover:text-foreground'}
                `}
              >
                {recruitingOnly ? '● Recruiting Only' : 'All Guilds'}
              </button>

              {/* Sort */}
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-void-500 text-xs font-ui">Sort:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortOption)}
                  className="text-xs font-ui bg-void-900/60 border border-void-700/40 rounded-lg px-3 py-1.5 text-foreground focus:border-gold/40 focus:outline-none"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>

            {/* Guild grid */}
            {loading ? (
              <GuildGridSkeleton />
            ) : error ? (
              <ErrorState message={error} onRetry={() => fetchGuilds()} />
            ) : guilds.length === 0 ? (
              <EmptyState houseFilter={houseFilter} />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${houseFilter}-${sort}-${recruitingOnly}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  {guilds.map((guild, idx) => (
                    <GuildCard
                      key={guild.id}
                      guild={guild}
                      rank={idx + 1}
                      isTopGuild={stats?.currentAgendaHolder === guild.id}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* ── Right: Sidebar ── */}
          <div className="space-y-6">
            {/* Void Map */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <VoidMap compact />
            </motion.div>

            {/* Leaderboard */}
            {guilds.length > 0 && stats && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <GuildLeaderboard
                  guilds={guilds}
                  currentSeason={stats.currentSeason}
                  seasonEndsAt={stats.seasonEndsAt}
                />
              </motion.div>
            )}

            {/* Create CTA card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-xl border border-void-700/40 bg-void-950/60 p-5 text-center"
            >
              <div className="text-3xl mb-2">⚔️</div>
              <h4 className="font-cinzel font-bold text-foreground text-sm mb-1">
                Start a Guild
              </h4>
              <p className="text-void-400 text-xs font-body mb-4 leading-relaxed">
                Unite bettors under one banner. Control territory. Inject your
                House agenda into the AI narrator.
              </p>
              <Link
                href="/guilds/create"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-all font-ui font-semibold text-sm"
              >
                <Plus className="w-4 h-4" />
                Found a Guild
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PlatformStat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <div className="rounded-xl border border-void-800/40 bg-void-950/60 p-4">
      <div className={`flex items-center gap-2 mb-1 ${color}`}>
        {icon}
        <span className="text-xs font-ui text-void-400">{label}</span>
      </div>
      <div className={`text-2xl font-mono font-bold ${color}`}>{value}</div>
    </div>
  )
}

function GuildGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-64 rounded-xl bg-void-900/40 animate-pulse border border-void-800/30"
        />
      ))}
    </div>
  )
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertCircle className="w-10 h-10 text-error mb-3" />
      <h3 className="font-cinzel font-bold text-foreground mb-1">
        Failed to load guilds
      </h3>
      <p className="text-void-400 text-sm font-body mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="px-5 py-2 rounded-lg border border-gold/30 text-gold hover:bg-gold/10 transition-all font-ui font-semibold text-sm"
      >
        Try Again
      </button>
    </div>
  )
}

function EmptyState({ houseFilter }: { houseFilter: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Shield className="w-10 h-10 text-void-600 mb-3" />
      <h3 className="font-cinzel font-bold text-foreground mb-1">
        No guilds found
      </h3>
      <p className="text-void-400 text-sm font-body mb-4">
        {houseFilter
          ? `No guilds aligned to House ${houseFilter}. Be the first to found one.`
          : 'No guilds match your filters.'}
      </p>
      <Link
        href="/guilds/create"
        className="px-5 py-2 rounded-lg border border-gold/30 text-gold hover:bg-gold/10 transition-all font-ui font-semibold text-sm flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Found the First Guild
      </Link>
    </div>
  )
}
