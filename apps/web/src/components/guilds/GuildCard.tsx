'use client'

/**
 * GuildCard — Compact guild display for directory listing.
 *
 * Shows: tier badge, house color, treasury, win rate, member count,
 * war record, territory count, and a CTA to view full profile.
 */

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Shield,
  Users,
  TrendingUp,
  Swords,
  Map,
  DollarSign,
  Crown,
  ChevronRight,
  Lock,
} from 'lucide-react'
import type { GuildPublicProfile } from '@/lib/guilds'

const TIER_STYLES: Record<
  string,
  { label: string; border: string; badge: string; glow: string }
> = {
  void: {
    label: 'Void',
    border: 'border-purple-400/60',
    badge: 'bg-purple-900/60 text-purple-300 border border-purple-400/40',
    glow: 'shadow-purple-500/20',
  },
  gold: {
    label: 'Gold',
    border: 'border-gold/50',
    badge: 'bg-gold/10 text-gold border border-gold/30',
    glow: 'shadow-gold/15',
  },
  silver: {
    label: 'Silver',
    border: 'border-void-400/40',
    badge: 'bg-void-600/40 text-void-200 border border-void-400/30',
    glow: 'shadow-void-400/10',
  },
  iron: {
    label: 'Iron',
    border: 'border-void-600/30',
    badge: 'bg-void-800/40 text-void-400 border border-void-600/20',
    glow: '',
  },
  ember: {
    label: 'Ember',
    border: 'border-orange-800/30',
    badge: 'bg-orange-900/20 text-orange-400 border border-orange-800/20',
    glow: '',
  },
}

interface GuildCardProps {
  guild: GuildPublicProfile
  rank?: number
  isTopGuild?: boolean
}

export function GuildCard({ guild, rank, isTopGuild }: GuildCardProps) {
  const tier = TIER_STYLES[guild.tier] ?? TIER_STYLES.ember
  const warTotal =
    guild.warRecord.wins + guild.warRecord.losses + guild.warRecord.draws

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className={`
        relative rounded-xl border ${tier.border}
        bg-void-950/70 backdrop-blur
        ${tier.glow ? `shadow-lg ${tier.glow}` : ''}
        overflow-hidden group
      `}
    >
      {/* Rank badge */}
      {rank && (
        <div className="absolute top-3 left-3 z-10">
          <span
            className={`
              text-xs font-mono font-bold px-2 py-0.5 rounded-full
              ${rank === 1 ? 'bg-gold/20 text-gold border border-gold/40' : 'bg-void-800/60 text-void-400 border border-void-700/40'}
            `}
          >
            #{rank}
          </span>
        </div>
      )}

      {/* Agenda holder indicator */}
      {isTopGuild && (
        <div className="absolute top-3 right-3 z-10">
          <span className="flex items-center gap-1 text-xs font-ui font-semibold px-2 py-0.5 rounded-full bg-gold/15 text-gold border border-gold/30">
            <Crown className="w-3 h-3" />
            Agenda Holder
          </span>
        </div>
      )}

      {/* House color stripe */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: guild.houseColorHex }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4 mt-1">
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center text-xl flex-shrink-0 border"
            style={{
              backgroundColor: guild.houseColorHex + '22',
              borderColor: guild.houseColorHex + '55',
            }}
          >
            {guild.emoji}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-cinzel font-bold text-foreground text-sm truncate">
                {guild.name}
              </h3>
              <span className="text-void-500 font-mono text-xs">{guild.tag}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`text-xs font-ui font-semibold px-2 py-0.5 rounded-full ${tier.badge}`}
              >
                {tier.label} Tier
              </span>
              <span
                className="text-xs font-ui capitalize"
                style={{ color: guild.houseColorHex }}
              >
                House {guild.house.charAt(0).toUpperCase() + guild.house.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-void-400 text-xs font-body leading-relaxed line-clamp-2 mb-4">
          {guild.description}
        </p>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <StatPill
            icon={<DollarSign className="w-3 h-3" />}
            label="Treasury"
            value={`$${(guild.treasuryBalanceUsdc / 1000).toFixed(1)}K`}
            color="text-gold"
          />
          <StatPill
            icon={<TrendingUp className="w-3 h-3" />}
            label="Win Rate"
            value={`${guild.winRate.toFixed(0)}%`}
            color={guild.winRate >= 60 ? 'text-success' : guild.winRate >= 50 ? 'text-warning' : 'text-error'}
          />
          <StatPill
            icon={<Users className="w-3 h-3" />}
            label="Members"
            value={`${guild.memberCount}/${guild.maxMembers}`}
            color="text-drift-teal"
          />
          <StatPill
            icon={<Swords className="w-3 h-3" />}
            label="Wars"
            value={`${guild.warRecord.wins}W-${guild.warRecord.losses}L`}
            color="text-void-300"
          />
          <StatPill
            icon={<Map className="w-3 h-3" />}
            label="Sectors"
            value={`${guild.territoriesHeld}/${guild.totalTerritories}`}
            color="text-drift-purple"
          />
          <StatPill
            icon={<Shield className="w-3 h-3" />}
            label="Score"
            value={guild.score.toLocaleString()}
            color="text-foreground"
          />
        </div>

        {/* Footer CTA */}
        <div className="flex items-center justify-between">
          {guild.isRecruiting ? (
            <span className="text-xs font-ui font-semibold text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-full">
              ● Recruiting
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs font-ui text-void-500">
              <Lock className="w-3 h-3" />
              Closed
            </span>
          )}

          <Link
            href={`/guilds/${guild.id}`}
            className="flex items-center gap-1 text-xs font-ui font-semibold text-gold hover:text-gold-light transition-colors group-hover:gap-2"
          >
            View Guild
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function StatPill({
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
    <div className="bg-void-900/60 rounded-lg p-2 border border-void-800/40">
      <div className={`flex items-center gap-1 mb-0.5 ${color}`}>{icon}</div>
      <div className={`text-sm font-mono font-bold ${color}`}>{value}</div>
      <div className="text-void-500 text-[10px] font-ui">{label}</div>
    </div>
  )
}
