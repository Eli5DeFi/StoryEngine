'use client'

/**
 * GuildDetailContent — Full guild profile page client component.
 *
 * Sections:
 * 1. Hero banner (house gradient, tier badge, agenda)
 * 2. Stats row (treasury, win rate, wars W/L/D, sectors)
 * 3. Active wars + recent war history
 * 4. Territory control (VoidMap + sector list)
 * 5. Member roster
 * 6. Top bets history
 * 7. Join guild CTA
 */

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount } from 'wagmi'
import {
  ArrowLeft,
  Crown,
  Shield,
  Users,
  DollarSign,
  TrendingUp,
  Swords,
  Map,
  Check,
  Loader2,
  AlertCircle,
  Trophy,
  RefreshCw,
  ExternalLink,
  Star,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import Link from 'next/link'
import { VoidMap, type VoidSector } from './VoidMap'
import type { GuildDetailProfile } from '@/lib/guilds'

// ─── Types ─────────────────────────────────────────────────────────────────

interface ApiResponse {
  guild: GuildDetailProfile
}

interface GuildDetailContentProps {
  guildId: string
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function GuildDetailContent({ guildId }: GuildDetailContentProps) {
  const { address, isConnected } = useAccount()
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [showAllMembers, setShowAllMembers] = useState(false)

  const fetchGuild = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Revalidate every 30s (matches the API route's revalidate config).
      // Avoids cache: 'no-store' which bypasses Vercel's edge cache on every hit.
      const res = await fetch(`/api/guilds/${guildId}`, {
        next: { revalidate: 30 },
      })
      if (res.status === 404) {
        setError('Guild not found')
        return
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json: ApiResponse = await res.json()
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load guild')
    } finally {
      setLoading(false)
    }
  }, [guildId])

  useEffect(() => {
    fetchGuild()
  }, [fetchGuild])

  async function handleJoin() {
    if (!isConnected || !address || !data?.guild) return
    setJoining(true)
    setJoinError(null)
    try {
      const res = await fetch(`/api/guilds/${guildId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      })
      const json = await res.json()
      if (!res.ok) {
        setJoinError(json.error ?? 'Failed to join')
        return
      }
      setJoined(true)
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setJoining(false)
    }
  }

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return <GuildDetailSkeleton />
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-error" />
        <h2 className="font-cinzel font-bold text-xl text-foreground">
          {error ?? 'Unknown error'}
        </h2>
        <div className="flex gap-3">
          <button
            onClick={fetchGuild}
            className="px-5 py-2.5 rounded-lg border border-gold/30 text-gold hover:bg-gold/10 font-ui font-semibold text-sm transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
          <Link
            href="/guilds"
            className="px-5 py-2.5 rounded-lg border border-void-700/40 text-void-400 hover:text-foreground font-ui font-semibold text-sm transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            All Guilds
          </Link>
        </div>
      </div>
    )
  }

  const { guild } = data
  const isAgendaHolder = !!guild.agenda
  const displayedMembers = showAllMembers
    ? guild.members
    : guild.members.slice(0, 5)

  // Build VoidSectors from guild territory data
  const voidSectors: VoidSector[] = guild.territory.map((t) => ({
    id: t.sectorId,
    name: t.sectorName,
    description: '',
    controllerGuildId: t.controllerGuildId,
    controllerGuildName: guild.name,
    controllerHouseColor: guild.houseColorHex,
    controllerEmoji: guild.emoji,
    yieldPerChapterUsdc: t.yieldPerChapterUsdc,
    defenseStrength: t.defenseStrength,
    position: sectorPositions[t.sectorId] ?? { col: 0, row: 0 },
  }))

  return (
    <div className="min-h-screen">
      {/* ── Hero Banner ── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${guild.houseColorHex}22 0%, #05060b 60%)`,
          borderBottom: `1px solid ${guild.houseColorHex}33`,
        }}
      >
        {/* Starfield dots */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          {[...Array(25)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-0.5 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.6 + 0.2,
              }}
            />
          ))}
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Back link */}
          <Link
            href="/guilds"
            className="inline-flex items-center gap-1.5 text-void-400 hover:text-gold transition-colors text-sm font-ui mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            All Guilds
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Guild icon */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl border-2 flex-shrink-0"
              style={{
                backgroundColor: guild.houseColorHex + '22',
                borderColor: guild.houseColorHex + '66',
              }}
            >
              {guild.emoji}
            </div>

            <div className="flex-1 min-w-0">
              {/* Name + tag */}
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-cinzel font-bold text-3xl text-foreground">
                  {guild.name}
                </h1>
                <span className="font-mono text-void-400 text-sm">
                  {guild.tag}
                </span>
                <TierBadge tier={guild.tier} />
                {isAgendaHolder && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/15 border border-gold/30 text-gold text-xs font-ui font-bold">
                    <Crown className="w-3 h-3" />
                    Agenda Holder
                  </span>
                )}
              </div>

              {/* House */}
              <div
                className="text-sm font-ui mt-1"
                style={{ color: guild.houseColorHex }}
              >
                House{' '}
                {guild.house.charAt(0).toUpperCase() + guild.house.slice(1)}
              </div>

              {/* Description */}
              <p className="text-void-300 text-sm font-body mt-2 leading-relaxed max-w-xl">
                {guild.description}
              </p>
            </div>

            {/* Score */}
            <div className="text-right">
              <div className="font-mono font-bold text-3xl text-gold">
                {guild.score.toLocaleString()}
              </div>
              <div className="text-void-500 text-xs font-ui">Season Score</div>
              <div className="text-void-400 text-xs font-ui mt-0.5">
                All-time: {guild.totalScore.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Active Agenda */}
          {guild.agenda && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-xl border border-gold/30 bg-gold/8 flex items-start gap-3"
            >
              <Crown className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-gold text-xs font-ui font-bold uppercase tracking-wider mb-0.5">
                  Active Narrative Agenda (injected into AI narrator)
                </div>
                <div className="text-foreground text-sm font-body font-medium italic">
                  "{guild.agenda}"
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
        >
          <StatCard
            icon={<DollarSign className="w-4 h-4" />}
            label="Treasury"
            value={`$${(guild.treasuryBalanceUsdc / 1000).toFixed(1)}K`}
            sub={`$${(guild.totalWageredUsdc / 1000).toFixed(0)}K wagered`}
            color="text-gold"
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4" />}
            label="Win Rate"
            value={`${guild.winRate.toFixed(1)}%`}
            sub={`${guild.memberCount}/${guild.maxMembers} members`}
            color={
              guild.winRate >= 60
                ? 'text-success'
                : guild.winRate >= 50
                ? 'text-warning'
                : 'text-error'
            }
          />
          <StatCard
            icon={<Swords className="w-4 h-4" />}
            label="War Record"
            value={`${guild.warRecord.wins}W / ${guild.warRecord.losses}L`}
            sub={`${guild.warRecord.draws} draws`}
            color="text-drift-teal"
          />
          <StatCard
            icon={<Map className="w-4 h-4" />}
            label="Territory"
            value={`${guild.territoriesHeld}/${guild.totalTerritories} Sectors`}
            sub={`+$${guild.territory.reduce((s, t) => s + t.yieldPerChapterUsdc, 0)}/chapter`}
            color="text-drift-purple"
          />
        </motion.div>

        {/* 2-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left col: Wars + Bets */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Wars */}
            {guild.recentWars.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl border border-void-800/40 bg-void-950/60 overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-void-800/40 flex items-center gap-2">
                  <Swords className="w-4 h-4 text-error" />
                  <h2 className="font-cinzel font-bold text-foreground text-sm">
                    War History
                  </h2>
                </div>
                <div className="p-4 space-y-3">
                  {guild.recentWars.map((war) => (
                    <div
                      key={war.id}
                      className="flex items-center gap-4 p-3 rounded-xl bg-void-900/40 border border-void-800/30"
                    >
                      <div
                        className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold border flex-shrink-0
                          ${war.outcome === 'won'
                            ? 'bg-success/15 border-success/30 text-success'
                            : war.outcome === 'lost'
                            ? 'bg-error/15 border-error/30 text-error'
                            : war.outcome === 'ongoing'
                            ? 'bg-warning/15 border-warning/30 text-warning'
                            : 'bg-void-700/30 border-void-600/30 text-void-400'}
                        `}
                      >
                        {war.outcome === 'won'
                          ? 'W'
                          : war.outcome === 'lost'
                          ? 'L'
                          : war.outcome === 'ongoing'
                          ? '⚔'
                          : 'D'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-ui font-semibold text-sm text-foreground truncate">
                          vs {war.opponentGuildName}
                        </div>
                        <div className="text-void-500 text-xs font-ui mt-0.5">
                          Chapters {war.battleChapters.join(', ')} ·{' '}
                          {new Date(war.startedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-mono font-bold text-sm text-foreground">
                          {war.ourScore.toLocaleString()} — {war.theirScore.toLocaleString()}
                        </div>
                        <div className="text-void-500 text-xs font-ui">score</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Top Bets */}
            {guild.topBets.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-xl border border-void-800/40 bg-void-950/60 overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-void-800/40 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-gold" />
                  <h2 className="font-cinzel font-bold text-foreground text-sm">
                    Notable Bets
                  </h2>
                </div>
                <div className="p-4 space-y-3">
                  {guild.topBets.map((bet, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-void-900/40 border border-void-800/30"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-xs font-ui text-void-400 mb-0.5">
                            {bet.chapterTitle}
                          </div>
                          <div className="font-body text-sm text-foreground leading-relaxed">
                            "{bet.choiceText}"
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div
                            className={`font-mono font-bold text-sm ${
                              bet.outcome === 'won'
                                ? 'text-success'
                                : bet.outcome === 'lost'
                                ? 'text-error'
                                : 'text-warning'
                            }`}
                          >
                            {bet.outcome === 'won' && bet.payoutUsdc
                              ? `+$${bet.payoutUsdc}`
                              : bet.outcome === 'lost'
                              ? `-$${bet.amountUsdc}`
                              : `$${bet.amountUsdc} pending`}
                          </div>
                          <div className="text-void-500 text-xs font-ui">
                            bet: ${bet.amountUsdc}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}
          </div>

          {/* Right col: Territory + Members + Join */}
          <div className="space-y-5">
            {/* VoidMap */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <VoidMap highlightGuildId={guild.id} compact />
            </motion.div>

            {/* Members */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-xl border border-void-800/40 bg-void-950/60 overflow-hidden"
            >
              <div className="px-4 py-3.5 border-b border-void-800/40 flex items-center gap-2">
                <Users className="w-4 h-4 text-drift-teal" />
                <h2 className="font-cinzel font-bold text-foreground text-sm">
                  Members ({guild.memberCount})
                </h2>
              </div>
              <div className="p-3 space-y-2">
                {displayedMembers.map((member, i) => (
                  <div
                    key={member.walletAddress}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-void-900/40 border border-void-800/20"
                  >
                    <div className="w-7 h-7 rounded-full bg-void-800/60 flex items-center justify-center text-xs font-mono font-bold text-void-400 flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-ui font-semibold text-xs text-foreground truncate">
                          {member.username}
                        </span>
                        {member.role !== 'member' && (
                          <span
                            className={`text-[10px] font-ui px-1.5 py-0.5 rounded-full ${
                              member.role === 'leader'
                                ? 'bg-gold/15 text-gold border border-gold/20'
                                : 'bg-drift-teal/10 text-drift-teal border border-drift-teal/20'
                            }`}
                          >
                            {member.role}
                          </span>
                        )}
                      </div>
                      <div className="text-void-500 text-[10px] font-ui">
                        {member.winRate.toFixed(0)}% win rate ·{' '}
                        {member.shareWeight.toFixed(1)}% share
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-gold">
                        ${member.contributedUsdc.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}

                {guild.members.length > 5 && (
                  <button
                    onClick={() => setShowAllMembers((v) => !v)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-ui text-void-400 hover:text-foreground transition-colors"
                  >
                    {showAllMembers ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        Show All {guild.members.length} Members
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.section>

            {/* Join CTA */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl border border-void-700/40 bg-void-950/60 p-4"
            >
              {joined ? (
                <div className="flex items-center gap-2 text-success text-sm font-ui font-semibold">
                  <Check className="w-5 h-5" />
                  Joined! Welcome to {guild.name}.
                </div>
              ) : !guild.isRecruiting ? (
                <div className="text-center">
                  <div className="text-void-400 text-sm font-ui mb-1">🔒 Closed Enrollment</div>
                  <p className="text-void-600 text-xs font-body">
                    This guild is not currently recruiting members.
                  </p>
                </div>
              ) : (
                <>
                  <h4 className="font-cinzel font-bold text-foreground text-sm mb-1 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gold" />
                    Join This Guild
                  </h4>
                  <p className="text-void-400 text-xs font-body mb-3 leading-relaxed">
                    {guild.memberCount}/{guild.maxMembers} slots filled. Earn
                    your share of guild treasury yields on every collective bet.
                  </p>

                  {joinError && (
                    <div className="flex items-start gap-2 p-2 rounded-lg border border-error/30 bg-error/5 mb-3">
                      <AlertCircle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
                      <span className="text-error text-xs font-ui">
                        {joinError}
                      </span>
                    </div>
                  )}

                  {!isConnected ? (
                    <div className="text-center py-2">
                      <p className="text-void-500 text-xs font-ui mb-2">
                        Connect wallet to join
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={handleJoin}
                      disabled={joining || guild.memberCount >= guild.maxMembers}
                      className="w-full py-2.5 rounded-lg font-ui font-semibold text-sm transition-all disabled:opacity-40"
                      style={{
                        backgroundColor: guild.houseColorHex + '22',
                        borderColor: guild.houseColorHex + '55',
                        color: guild.houseAccentHex,
                        border: '1px solid',
                      }}
                    >
                      {joining ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Joining...
                        </span>
                      ) : (
                        `Join ${guild.name}`
                      )}
                    </button>
                  )}
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  color: string
}) {
  return (
    <div className="rounded-xl border border-void-800/40 bg-void-950/60 p-4">
      <div className={`flex items-center gap-2 mb-2 ${color}`}>
        {icon}
        <span className="text-void-400 text-xs font-ui">{label}</span>
      </div>
      <div className={`text-xl font-mono font-bold ${color}`}>{value}</div>
      <div className="text-void-500 text-xs font-ui mt-0.5">{sub}</div>
    </div>
  )
}

function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    void: 'bg-purple-900/40 border-purple-400/30 text-purple-300',
    gold: 'bg-gold/10 border-gold/30 text-gold',
    silver: 'bg-void-600/30 border-void-500/30 text-void-200',
    iron: 'bg-void-800/30 border-void-700/20 text-void-400',
    ember: 'bg-orange-900/20 border-orange-700/20 text-orange-400',
  }
  return (
    <span
      className={`text-xs font-ui font-bold px-2.5 py-0.5 rounded-full border ${styles[tier] ?? styles.ember}`}
    >
      {tier.charAt(0).toUpperCase() + tier.slice(1)} Tier
    </span>
  )
}

function GuildDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          <div className="h-52 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-52 rounded-xl bg-white/5 animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-64 rounded-xl bg-white/5 animate-pulse" />
          <div className="h-48 rounded-xl bg-white/5 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

// sector -> grid position map
const sectorPositions: Record<string, { col: number; row: number }> = {
  sector_core: { col: 1, row: 0 },
  sector_thread_nexus: { col: 2, row: 1 },
  sector_null_wastes: { col: 0, row: 1 },
  sector_golden_spire: { col: 0, row: 2 },
  sector_shadow_gate: { col: 2, row: 2 },
  sector_drift_basin: { col: 1, row: 2 },
}
