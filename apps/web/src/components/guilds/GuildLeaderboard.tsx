'use client'

/**
 * GuildLeaderboard — Monthly guild rankings panel.
 *
 * Displays top 5 guilds by score with animated rank bars,
 * tier badges, and a "see all guilds" link.
 */

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Crown, TrendingUp, Shield, ChevronRight } from 'lucide-react'
import type { GuildPublicProfile } from '@/lib/guilds'

const TIER_LABEL: Record<string, string> = {
  void: 'Void',
  gold: 'Gold',
  silver: 'Silver',
  iron: 'Iron',
  ember: 'Ember',
}

interface GuildLeaderboardProps {
  guilds: GuildPublicProfile[]
  currentSeason?: string
  seasonEndsAt?: string
}

export function GuildLeaderboard({
  guilds,
  currentSeason = 'Season 3',
  seasonEndsAt,
}: GuildLeaderboardProps) {
  const top5 = [...guilds].sort((a, b) => b.score - a.score).slice(0, 5)
  const maxScore = top5[0]?.score ?? 1

  const daysRemaining = seasonEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(seasonEndsAt).getTime() - Date.now()) / 86400000
        )
      )
    : null

  return (
    <div className="rounded-xl border border-void-800/40 bg-void-950/60 backdrop-blur overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-void-800/40 flex items-center justify-between">
        <div>
          <h3 className="font-cinzel font-bold text-foreground text-sm flex items-center gap-2">
            <Crown className="w-4 h-4 text-gold" />
            Guild Leaderboard
          </h3>
          <p className="text-void-500 text-xs font-ui mt-0.5">
            {currentSeason}
            {daysRemaining !== null && (
              <span className="ml-2 text-warning">
                • {daysRemaining}d remaining
              </span>
            )}
          </p>
        </div>
        <Link
          href="/guilds"
          className="text-xs font-ui font-semibold text-gold hover:text-gold-light transition-colors flex items-center gap-1"
        >
          All Guilds
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Rankings */}
      <div className="p-4 space-y-3">
        {top5.map((guild, idx) => {
          const rank = idx + 1
          const scorePercent = (guild.score / maxScore) * 100
          const isFirst = rank === 1

          return (
            <motion.div
              key={guild.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.07 }}
            >
              <Link href={`/guilds/${guild.id}`} className="block group">
                <div className="flex items-center gap-3 mb-1.5">
                  {/* Rank */}
                  <span
                    className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold flex-shrink-0
                      ${isFirst
                        ? 'bg-gold/20 text-gold border border-gold/40'
                        : 'bg-void-800/60 text-void-400 border border-void-700/30'}
                    `}
                  >
                    {rank}
                  </span>

                  {/* Emoji + name */}
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="text-base leading-none">{guild.emoji}</span>
                    <span className="font-cinzel font-semibold text-xs text-foreground group-hover:text-gold transition-colors truncate">
                      {guild.name}
                    </span>
                    <span className="text-void-600 font-mono text-[10px] flex-shrink-0">
                      {guild.tag}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <div className="font-mono font-bold text-xs text-foreground">
                      {guild.score.toLocaleString()}
                    </div>
                    <div className="text-void-500 text-[10px] font-ui">pts</div>
                  </div>
                </div>

                {/* Score bar */}
                <div className="ml-9 bg-void-900/60 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${scorePercent}%` }}
                    transition={{ duration: 0.6, delay: idx * 0.07 + 0.2, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: guild.houseColorHex }}
                  />
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {/* Agenda holder note */}
      {top5[0] && (
        <div className="px-4 py-3 border-t border-void-800/30 bg-gold/5">
          <p className="text-xs font-ui text-void-400 flex items-start gap-1.5">
            <Crown className="w-3.5 h-3.5 text-gold flex-shrink-0 mt-0.5" />
            <span>
              <span className="text-gold font-semibold">{top5[0].name}</span>{' '}
              holds the Narrative Agenda — their chosen story direction is
              injected into the AI narrator's next chapter prompt.
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
