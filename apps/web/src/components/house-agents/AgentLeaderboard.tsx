'use client'

/**
 * AgentLeaderboard — Compact ranking of all 5 House Agents by performance.
 *
 * Ranks by:
 *   1. Net PnL (primary)
 *   2. Accuracy rate (secondary)
 *
 * Highlights #1 with a gold crown. Shows live current bet indicator.
 */

import { motion } from 'framer-motion'
import { Crown, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import type { HouseAgentPublicProfile } from '@/app/api/house-agents/route'

interface AgentLeaderboardProps {
  agents: HouseAgentPublicProfile[]
}

export function AgentLeaderboard({ agents }: AgentLeaderboardProps) {
  const sorted = [...agents].sort((a, b) => b.stats.netPnl - a.stats.netPnl)

  return (
    <div className="glass-card rounded-2xl border border-void-800 p-6">
      <div className="flex items-center gap-2 mb-5">
        <Crown className="w-5 h-5 text-gold" />
        <h3 className="text-lg font-cinzel font-bold text-gold">
          Agent Rankings
        </h3>
        <span className="ml-auto text-xs text-void-500 font-ui">by Net PnL</span>
      </div>

      <div className="space-y-3">
        {sorted.map((agent, idx) => {
          const isFirst = idx === 0
          const netPositive = agent.stats.netPnl >= 0
          const hasLiveBet = agent.currentBet !== null

          return (
            <motion.div
              key={agent.houseId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="flex items-center gap-3 p-3 rounded-xl transition-all duration-300 hover:bg-void-900/50"
              style={isFirst ? { backgroundColor: `${agent.accentHex}08` } : {}}
            >
              {/* Rank */}
              <div className="w-7 flex-shrink-0 text-center">
                {isFirst ? (
                  <Crown className="w-4 h-4 text-gold mx-auto" />
                ) : (
                  <span className="text-sm font-bold text-void-500">#{idx + 1}</span>
                )}
              </div>

              {/* House */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: `${agent.colorHex}30` }}
              >
                {agent.emoji}
              </div>

              {/* Name + Accuracy */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-bold font-cinzel"
                    style={{ color: agent.accentHex }}
                  >
                    {agent.name}
                  </span>
                  {hasLiveBet && (
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <Activity className="w-3 h-3" />
                      Live
                    </span>
                  )}
                </div>
                <div className="text-xs text-void-500 font-ui">
                  {agent.stats.accuracyRate.toFixed(1)}% acc · {agent.stats.totalBets} bets
                </div>
              </div>

              {/* Net PnL */}
              <div
                className={`flex items-center gap-1 text-sm font-bold font-ui ${
                  netPositive ? 'text-success' : 'text-error'
                }`}
              >
                {netPositive ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {netPositive ? '+' : ''}
                {agent.stats.netPnl.toLocaleString()}
              </div>
            </motion.div>
          )
        })}
      </div>

      <p className="text-xs text-void-600 text-center mt-4 font-ui">
        Rankings reset each story arc · All figures in USDC
      </p>
    </div>
  )
}
