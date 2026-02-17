'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Shield, TrendingUp, Users, ChevronRight, AlertTriangle } from 'lucide-react'
import type { InsuranceEvent } from '@/types/insurance'
import { formatUSDC, premiumRateBpsToPercent, timeUntil } from '@/types/insurance'
import { RiskBadge } from './RiskBadge'
import { SurvivalMeter } from './SurvivalMeter'
import { BuyCoverageModal } from './BuyCoverageModal'
import { UnderwriteModal } from './UnderwriteModal'

interface InsuranceEventCardProps {
  event: InsuranceEvent
  index: number
}

export function InsuranceEventCard({ event, index }: InsuranceEventCardProps) {
  const [showBuyModal, setShowBuyModal] = useState(false)
  const [showUnderwriteModal, setShowUnderwriteModal] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const premiumPct = premiumRateBpsToPercent(event.premiumRateBps)
  const isUrgent = new Date(event.deadline).getTime() - Date.now() < 12 * 3_600_000
  const utilizationPct =
    event.maxCoverage > 0
      ? Math.min(Math.round((event.totalCoverage / event.maxCoverage) * 100), 100)
      : 100

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.07 }}
        className="glass-card rounded-2xl border border-void-800 hover:border-void-600 transition-all duration-300 overflow-hidden"
      >
        {/* Header: Risk indicator strip */}
        <div
          className={`h-1 w-full ${
            event.riskTier === 'EXTREME'
              ? 'bg-gradient-to-r from-error to-error/60 animate-pulse'
              : event.riskTier === 'HIGH'
              ? 'bg-gradient-to-r from-warning to-warning/60'
              : event.riskTier === 'MEDIUM'
              ? 'bg-gradient-to-r from-drift-teal to-drift-teal/60'
              : 'bg-gradient-to-r from-success to-success/60'
          }`}
        />

        <div className="p-5">
          {/* Top row: Character + story info */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Character avatar placeholder */}
              <div className="w-11 h-11 rounded-full bg-void-800 flex items-center justify-center flex-shrink-0 ring-2 ring-void-700 text-lg">
                {event.characterName.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="font-display font-bold text-foreground text-base leading-tight truncate">
                  {event.characterName}
                </h3>
                <p className="text-xs text-void-400 font-ui truncate">
                  {event.storyTitle} · Ch. {event.chapterNumber}
                </p>
              </div>
            </div>
            <RiskBadge tier={event.riskTier} />
          </div>

          {/* Event description */}
          <div className="mb-4">
            <p className="text-sm text-void-300 font-ui leading-snug">
              <span className="text-void-500 text-xs font-semibold uppercase tracking-wider mr-1">
                Insurable Event:
              </span>
              {event.description}
            </p>
          </div>

          {/* Survival probability meter */}
          <SurvivalMeter
            probability={event.impliedSurvivalProbability}
            characterName={event.characterName}
            className="mb-4"
          />

          {/* Key stats row */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-2 rounded-lg bg-void-900/60">
              <div className="text-lg font-bold font-mono text-gold">
                {premiumPct.toFixed(0)}%
              </div>
              <div className="text-xs text-void-500 font-ui">Premium Rate</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-void-900/60">
              <div className="text-lg font-bold font-mono text-drift-teal">
                {formatUSDC(event.totalCoverage)}
              </div>
              <div className="text-xs text-void-500 font-ui">Coverage Sold</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-void-900/60">
              <div className="text-lg font-bold font-mono text-drift-purple">
                {event.policyCount.toLocaleString()}
              </div>
              <div className="text-xs text-void-500 font-ui">Policyholders</div>
            </div>
          </div>

          {/* Capacity bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-void-500 font-ui">Pool capacity</span>
              <span className="text-xs text-void-400 font-mono">
                {formatUSDC(event.totalCoverage)} / {formatUSDC(event.maxCoverage)}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-void-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-drift-teal to-drift-blue transition-all duration-500"
                style={{ width: `${utilizationPct}%` }}
              />
            </div>
          </div>

          {/* Deadline / urgency */}
          <div className="flex items-center gap-2 mb-5">
            {isUrgent ? (
              <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-void-500 flex-shrink-0" />
            )}
            <span
              className={`text-xs font-ui ${isUrgent ? 'text-warning font-semibold' : 'text-void-400'}`}
            >
              {timeUntil(event.deadline)}
            </span>
            <span className="text-void-700 text-xs">·</span>
            <Users className="w-3.5 h-3.5 text-void-500 flex-shrink-0" />
            <span className="text-xs text-void-500 font-ui">
              {event.underwriterCount} underwriters
            </span>
          </div>

          {/* CTA Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowBuyModal(true)}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-drift-teal/15 hover:bg-drift-teal/25 border border-drift-teal/30 hover:border-drift-teal/60 text-drift-teal font-ui font-semibold text-sm transition-all duration-200"
            >
              <Shield className="w-4 h-4" />
              Buy Coverage
            </button>
            <button
              onClick={() => setShowUnderwriteModal(true)}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gold/10 hover:bg-gold/20 border border-gold/25 hover:border-gold/50 text-gold font-ui font-semibold text-sm transition-all duration-200"
            >
              <TrendingUp className="w-4 h-4" />
              Earn Yield
            </button>
          </div>

          {/* Expand for more detail */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full mt-3 flex items-center justify-center gap-1 text-xs text-void-500 hover:text-void-300 font-ui transition-colors"
          >
            <span>{expanded ? 'Hide details' : 'How it works'}</span>
            <ChevronRight
              className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`}
            />
          </button>

          {/* Expanded explanation */}
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-void-800 space-y-2"
            >
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-drift-teal mt-0.5 flex-shrink-0" />
                <p className="text-xs text-void-400 font-ui">
                  <span className="text-drift-teal font-semibold">Policyholder:</span>{' '}
                  Pay {premiumPct.toFixed(0)}% premium → receive full coverage if the event occurs.
                  Protect {event.characterName} at cost of{' '}
                  {premiumPct.toFixed(0)} USDC per 100 USDC coverage.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                <p className="text-xs text-void-400 font-ui">
                  <span className="text-gold font-semibold">Underwriter:</span>{' '}
                  Stake USDC → earn proportional premiums if {event.characterName} survives.
                  High yield, but risk capital if event occurs.
                </p>
              </div>
              <p className="text-xs text-void-600 font-ui italic">
                Premium rates reflect market-implied survival probability. Higher premium = market
                expects event is more likely.
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Modals */}
      {showBuyModal && (
        <BuyCoverageModal event={event} onClose={() => setShowBuyModal(false)} />
      )}
      {showUnderwriteModal && (
        <UnderwriteModal event={event} onClose={() => setShowUnderwriteModal(false)} />
      )}
    </>
  )
}
