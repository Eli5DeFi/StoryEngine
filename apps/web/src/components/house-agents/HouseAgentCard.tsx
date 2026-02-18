'use client'

/**
 * HouseAgentCard — Main card for each AI House Agent
 *
 * Shows:
 * - Agent identity (house emoji, name, lore)
 * - Personality matrix bars (risk, contrarianism, survival bias, etc.)
 * - Live stats (accuracy, PnL, aligned players)
 * - Current chapter bet (if active)
 * - Recent bet history preview
 * - Align / Rival buttons
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Swords,
  Star,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
} from 'lucide-react'
import type { HouseAgentPublicProfile, AgentBetRecord } from '@/app/api/house-agents/route'
import { AlignmentModal } from './AlignmentModal'
import { PersonalityBars } from './PersonalityBars'

interface HouseAgentCardProps {
  agent: HouseAgentPublicProfile
  /** Wallet address of the current viewer (for auth checks) */
  viewerAddress?: string
}

export function HouseAgentCard({ agent, viewerAddress }: HouseAgentCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [alignModalOpen, setAlignModalOpen] = useState(false)
  const [alignMode, setAlignMode] = useState<'align' | 'rival'>('align')

  const netPositive = agent.stats.netPnl >= 0
  const crowdContrarian =
    agent.currentBet && agent.currentBet.crowdPercentage < 25

  function openAlign(mode: 'align' | 'rival') {
    setAlignMode(mode)
    setAlignModalOpen(true)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative group"
      >
        {/* Glow border using house color */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-sm"
          style={{ backgroundColor: agent.colorHex }}
        />

        {/* Card */}
        <div className="relative glass-card rounded-2xl border border-void-800 group-hover:border-opacity-60 transition-all duration-500 overflow-hidden"
          style={{ borderColor: `${agent.accentHex}30` }}
        >
          {/* Header stripe */}
          <div
            className="h-1 w-full"
            style={{ background: `linear-gradient(90deg, ${agent.colorHex}, ${agent.accentHex})` }}
          />

          <div className="p-6">
            {/* Agent Identity */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ backgroundColor: `${agent.colorHex}30` }}
                >
                  {agent.emoji}
                </div>
                <div>
                  <h3
                    className="text-xl font-cinzel font-bold"
                    style={{ color: agent.accentHex }}
                  >
                    {agent.name}
                  </h3>
                  <p className="text-xs text-void-400 font-ui uppercase tracking-wider mt-0.5">
                    {agent.fullName}
                  </p>
                </div>
              </div>

              {/* PnL Badge */}
              <div
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-ui font-bold ${
                  netPositive
                    ? 'bg-success/10 text-success'
                    : 'bg-error/10 text-error'
                }`}
              >
                {netPositive ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {netPositive ? '+' : ''}
                {agent.stats.netPnl.toLocaleString()} USDC
              </div>
            </div>

            {/* Lore */}
            <p className="text-sm text-void-300 leading-relaxed mb-5">
              {agent.lore}
            </p>

            {/* Stat Row */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <StatPill
                label="Accuracy"
                value={`${agent.stats.accuracyRate.toFixed(1)}%`}
                icon={<Star className="w-3.5 h-3.5" />}
                positive={agent.stats.accuracyRate > 55}
                color={agent.accentHex}
              />
              <StatPill
                label="Aligned"
                value={agent.stats.alignedPlayers.toLocaleString()}
                icon={<Users className="w-3.5 h-3.5" />}
                color={agent.accentHex}
              />
              <StatPill
                label="Gen #{agent.stats.generationCount}"
                value={`${agent.stats.totalBets} bets`}
                icon={<Zap className="w-3.5 h-3.5" />}
                color={agent.accentHex}
              />
            </div>

            {/* Personality Bars */}
            <div className="mb-5">
              <p className="text-xs text-void-500 font-ui uppercase tracking-wider mb-3">
                Personality Matrix
              </p>
              <PersonalityBars personality={agent.personality} accentHex={agent.accentHex} />
            </div>

            {/* Current Bet */}
            {agent.currentBet && (
              <CurrentBetBanner bet={agent.currentBet} accentHex={agent.accentHex} isContrarian={crowdContrarian ?? false} />
            )}

            {/* Expand / Collapse Toggle */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 text-xs text-void-400 hover:text-void-200 transition-colors mt-4 w-full justify-center font-ui uppercase tracking-wider"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  Hide History
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  View Recent Bets
                </>
              )}
            </button>

            {/* Bet History */}
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 space-y-3">
                    {agent.recentBets.map((bet) => (
                      <BetHistoryRow key={bet.id} bet={bet} accentHex={agent.accentHex} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-5 pt-5 border-t border-void-800">
              <button
                onClick={() => openAlign('align')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-ui font-bold transition-all duration-300 hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${agent.colorHex}40, ${agent.accentHex}20)`,
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: `${agent.accentHex}60`,
                  color: agent.accentHex,
                }}
              >
                <Users className="w-4 h-4" />
                Align (+20% yield)
              </button>
              <button
                onClick={() => openAlign('rival')}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-ui font-bold border border-void-700 text-void-300 hover:border-void-500 hover:text-void-100 transition-all duration-300"
              >
                <Swords className="w-4 h-4" />
                Rival
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Alignment Modal */}
      <AlignmentModal
        open={alignModalOpen}
        onClose={() => setAlignModalOpen(false)}
        agent={agent}
        mode={alignMode}
        viewerAddress={viewerAddress}
      />
    </>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatPill({
  label,
  value,
  icon,
  positive,
  color,
}: {
  label: string
  value: string
  icon: React.ReactNode
  positive?: boolean
  color: string
}) {
  return (
    <div
      className="rounded-xl p-3 text-center"
      style={{ backgroundColor: `${color}10` }}
    >
      <div
        className="flex items-center justify-center gap-1 mb-1"
        style={{ color: color }}
      >
        {icon}
        <span className="text-xs font-ui uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-sm font-bold text-foreground">{value}</div>
    </div>
  )
}

function CurrentBetBanner({
  bet,
  accentHex,
  isContrarian,
}: {
  bet: AgentBetRecord
  accentHex: string
  isContrarian: boolean
}) {
  return (
    <div
      className="rounded-xl p-4 border"
      style={{
        backgroundColor: `${accentHex}08`,
        borderColor: `${accentHex}30`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full animate-pulse bg-green-400" />
        <span className="text-xs font-ui uppercase tracking-wider text-green-400">
          Live Bet — {bet.chapterTitle}
        </span>
        {isContrarian && (
          <span className="ml-auto text-xs font-ui font-bold text-warning bg-warning/10 px-2 py-0.5 rounded-full">
            ⚡ Contrarian
          </span>
        )}
      </div>
      <p
        className="text-sm font-semibold mb-2"
        style={{ color: accentHex }}
      >
        &ldquo;{bet.choiceText}&rdquo;
      </p>
      <p className="text-xs text-void-400 italic leading-relaxed">
        &ldquo;{bet.reasoning}&rdquo;
      </p>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-void-500 font-ui">
          Crowd: {bet.crowdPercentage}% agree
        </span>
        <span
          className="text-sm font-bold font-ui"
          style={{ color: accentHex }}
        >
          {bet.amount.toLocaleString()} USDC
        </span>
      </div>
    </div>
  )
}

function BetHistoryRow({ bet, accentHex }: { bet: AgentBetRecord; accentHex: string }) {
  const isWin = bet.won === true
  const isLoss = bet.won === false
  const isPending = !bet.resolved

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-void-900/40 border border-void-800/50">
      {/* Status Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {isPending ? (
          <Clock className="w-4 h-4 text-warning" />
        ) : isWin ? (
          <CheckCircle className="w-4 h-4 text-success" />
        ) : (
          <XCircle className="w-4 h-4 text-error" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-void-500 font-ui mb-0.5">{bet.chapterTitle}</p>
        <p className="text-sm text-void-200 leading-snug truncate">
          &ldquo;{bet.choiceText}&rdquo;
        </p>
        <p className="text-xs text-void-500 italic mt-1 line-clamp-1">
          {bet.reasoning}
        </p>
      </div>

      {/* Amount / Payout */}
      <div className="flex-shrink-0 text-right">
        <div className="text-sm font-bold font-ui">
          {isWin ? (
            <span className="text-success">+{bet.payout?.toLocaleString()}</span>
          ) : isLoss ? (
            <span className="text-error">-{bet.amount.toLocaleString()}</span>
          ) : (
            <span style={{ color: accentHex }}>{bet.amount.toLocaleString()}</span>
          )}
        </div>
        <div className="text-xs text-void-500 font-ui">USDC</div>
      </div>
    </div>
  )
}
