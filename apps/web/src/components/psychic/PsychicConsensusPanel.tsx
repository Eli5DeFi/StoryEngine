'use client'

/**
 * @component PsychicConsensusPanel
 * @description The two-layer Psychic Consensus Oracle UI.
 *
 * Layer 1: Story betting — which AI choice wins?
 * Layer 2: Psychic meta-bet — will the crowd be right?
 *
 * Designed for the "Ruins of the Future" design system:
 * - Dark glass morphism cards
 * - Gold / drift-teal accent palette
 * - Framer Motion animations
 * - Mobile-first responsive layout
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Eye, Brain, Trophy, Zap, AlertTriangle, CheckCircle,
  TrendingUp, TrendingDown, Clock, Loader2, ChevronDown, ChevronUp,
  Star, Shield, Flame
} from 'lucide-react'
import { useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import { usePsychicOracle, type PsychicBadge, type ChoiceState } from '@/hooks/usePsychicOracle'
import { Button } from '@/components/ui/button'

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Badge config for rendering */
const BADGE_CONFIG: Record<PsychicBadge, { label: string; emoji: string; color: string; glow: string }> = {
  INITIATE:  { label: 'Initiate',   emoji: '🌑', color: 'text-void-400',      glow: '' },
  SEER:      { label: 'Seer',       emoji: '🔮', color: 'text-drift-purple',   glow: 'shadow-[0_0_12px_rgba(139,122,184,0.4)]' },
  ORACLE:    { label: 'Oracle',     emoji: '🌟', color: 'text-gold',           glow: 'shadow-[0_0_16px_rgba(212,168,83,0.5)]' },
  PROPHET:   { label: 'Prophet',    emoji: '🌌', color: 'text-drift-teal',     glow: 'shadow-[0_0_20px_rgba(78,165,217,0.6)]' },
  VOID_SEER: { label: 'Void Seer', emoji: '⚫', color: 'text-white',          glow: 'shadow-[0_0_24px_rgba(255,255,255,0.3)]' },
}

/** Psychic Edge signal label */
function psychicEdgeLabel(edge: number): { text: string; color: string; icon: React.ElementType } {
  if (edge >= 3)   return { text: 'Extreme Contrarian Signal', color: 'text-error',   icon: Flame }
  if (edge >= 2)   return { text: 'Strong Contrarian Signal',  color: 'text-warning', icon: TrendingUp }
  if (edge >= 1.5) return { text: 'Balanced Market',           color: 'text-drift-teal', icon: TrendingDown }
  return             { text: 'Crowd Believer Favored',          color: 'text-gold',    icon: Shield }
}

// ─── Amount input ─────────────────────────────────────────────────────────────

interface AmountInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  max?: string
}

function AmountInput({ value, onChange, placeholder = '0.00', disabled, max }: AmountInputProps) {
  const presets = ['10', '50', '100', '500']
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 glass-card rounded-xl px-4 py-3 border border-void-700/50 focus-within:border-gold/40 transition-colors">
        <span className="text-void-400 text-sm font-ui">USDC</span>
        <input
          type="number"
          min="1"
          step="1"
          max={max}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent text-foreground font-mono text-lg focus:outline-none disabled:opacity-50 tabular-nums"
        />
        {max && (
          <button
            onClick={() => onChange(max)}
            className="text-xs text-gold hover:text-gold-light transition-colors font-ui"
          >
            MAX
          </button>
        )}
      </div>
      <div className="flex gap-2">
        {presets.map(p => (
          <button
            key={p}
            onClick={() => onChange(p)}
            disabled={disabled}
            className="flex-1 py-1.5 rounded-lg text-xs font-ui text-void-400 hover:text-gold hover:bg-gold/10 border border-void-700/50 hover:border-gold/30 transition-all disabled:opacity-50"
          >
            ${p}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Choice card ──────────────────────────────────────────────────────────────

interface ChoiceCardProps {
  choice: ChoiceState
  selected: boolean
  myBet: bigint
  isOpen: boolean
  onClick: () => void
}

function ChoiceCard({ choice, selected, myBet, isOpen, onClick }: ChoiceCardProps) {
  const hasBet = myBet > 0n
  const formatAmount = (v: bigint) => parseFloat(formatUnits(v, 6)).toFixed(2)

  return (
    <motion.button
      onClick={onClick}
      disabled={!isOpen}
      whileHover={isOpen ? { scale: 1.01 } : {}}
      whileTap={isOpen ? { scale: 0.99 } : {}}
      className={[
        'relative w-full text-left rounded-2xl p-5 border transition-all duration-200',
        selected
          ? 'border-gold/60 bg-gold/10 shadow-[0_0_20px_rgba(212,168,83,0.2)]'
          : 'border-void-700/50 bg-void-900/40 hover:border-void-600/60 hover:bg-void-900/60',
        !isOpen && 'opacity-70 cursor-not-allowed',
      ].join(' ')}
    >
      {/* Majority badge */}
      {choice.isMajority && (
        <span className="absolute top-3 right-3 text-[10px] font-ui uppercase tracking-widest text-drift-teal bg-drift-teal/10 border border-drift-teal/30 rounded-full px-2 py-0.5">
          Crowd Pick
        </span>
      )}

      {/* Choice text */}
      <p className="text-sm font-story text-foreground/90 pr-20 mb-4 leading-relaxed">
        {choice.text}
      </p>

      {/* Stats row */}
      <div className="flex items-end justify-between">
        <div className="space-y-0.5">
          <div className="text-2xl font-display font-bold tabular-nums" style={{
            color: selected ? '#d4a853' : choice.isMajority ? '#4ea5d9' : '#6e6e77'
          }}>
            {choice.oddsPercent}%
          </div>
          <div className="text-xs text-void-500 font-ui">crowd backing</div>
        </div>

        <div className="text-right space-y-0.5">
          <div className="text-lg font-display font-bold text-gold tabular-nums">
            {choice.payoutMultiplier.toFixed(2)}×
          </div>
          <div className="text-xs text-void-500 font-ui">payout</div>
        </div>
      </div>

      {/* User position indicator */}
      {hasBet && (
        <div className="mt-3 pt-3 border-t border-void-700/40 flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0" />
          <span className="text-xs text-success font-ui">Your bet: ${formatAmount(myBet)} USDC</span>
        </div>
      )}

      {/* Selection indicator */}
      {selected && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent rounded-full"
        />
      )}
    </motion.button>
  )
}

// ─── Psychic consensus toggle ─────────────────────────────────────────────────

interface ConsensusToggleProps {
  crowdRightPercent: number
  selected: boolean | null   // null = not selected
  myRight: bigint
  myWrong: bigint
  isOpen: boolean
  onSelect: (crowdRight: boolean) => void
}

function ConsensusToggle({ crowdRightPercent, selected, myRight, myWrong, isOpen, onSelect }: ConsensusToggleProps) {
  const crowdWrongPercent = 100 - crowdRightPercent
  const formatAmount = (v: bigint) => parseFloat(formatUnits(v, 6)).toFixed(2)

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Crowd Believer */}
      <motion.button
        onClick={() => isOpen && onSelect(true)}
        whileHover={isOpen ? { scale: 1.02 } : {}}
        whileTap={isOpen ? { scale: 0.98 } : {}}
        disabled={!isOpen}
        className={[
          'rounded-2xl p-4 border text-left transition-all duration-200',
          selected === true
            ? 'border-drift-teal/60 bg-drift-teal/15 shadow-[0_0_16px_rgba(78,165,217,0.2)]'
            : 'border-void-700/50 bg-void-900/40 hover:border-drift-teal/30',
          !isOpen && 'opacity-60 cursor-not-allowed',
        ].join(' ')}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-drift-teal/10 border border-drift-teal/30 flex items-center justify-center">
            <Users2 className="w-4 h-4 text-drift-teal" />
          </div>
          <span className="text-xs font-ui text-void-300 uppercase tracking-wider">Believer</span>
        </div>
        <div className="text-xl font-display font-bold text-drift-teal tabular-nums mb-1">
          {crowdRightPercent}%
        </div>
        <div className="text-xs text-void-500">crowd will be right</div>
        {myRight > 0n && (
          <div className="mt-2 text-xs text-drift-teal/80 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> ${formatAmount(myRight)}
          </div>
        )}
      </motion.button>

      {/* Contrarian */}
      <motion.button
        onClick={() => isOpen && onSelect(false)}
        whileHover={isOpen ? { scale: 1.02 } : {}}
        whileTap={isOpen ? { scale: 0.98 } : {}}
        disabled={!isOpen}
        className={[
          'rounded-2xl p-4 border text-left transition-all duration-200',
          selected === false
            ? 'border-gold/60 bg-gold/15 shadow-[0_0_16px_rgba(212,168,83,0.25)]'
            : 'border-void-700/50 bg-void-900/40 hover:border-gold/30',
          !isOpen && 'opacity-60 cursor-not-allowed',
        ].join(' ')}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-gold" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-ui text-void-300 uppercase tracking-wider">Contrarian</span>
            <span className="text-[9px] font-ui text-gold/60">2× BONUS</span>
          </div>
        </div>
        <div className="text-xl font-display font-bold text-gold tabular-nums mb-1">
          {crowdWrongPercent}%
        </div>
        <div className="text-xs text-void-500">crowd will be wrong</div>
        {myWrong > 0n && (
          <div className="mt-2 text-xs text-gold/80 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> ${formatAmount(myWrong)}
          </div>
        )}
      </motion.button>
    </div>
  )
}

// Lucide doesn't export Users2 in all versions — define fallback
function Users2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PsychicConsensusPanelProps {
  contractAddress: `0x${string}`
  poolId: bigint
  /** Display text for each choice (from DB) */
  choiceTexts: string[]
  /** Called after successful bet */
  onBetPlaced?: () => void
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function PsychicConsensusPanel({
  contractAddress,
  poolId,
  choiceTexts,
  onBetPlaced,
}: PsychicConsensusPanelProps) {
  const { isConnected } = useAccount()
  const oracle = usePsychicOracle(contractAddress, poolId, choiceTexts)

  // UI state
  const [activeLayer, setActiveLayer] = useState<'main' | 'psychic'>('main')
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
  const [psychicSide, setPsychicSide] = useState<boolean | null>(null)
  const [mainAmount, setMainAmount] = useState('')
  const [psychicAmount, setPsychicAmount] = useState('')
  const [showProfile, setShowProfile] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Auto-clear success message
  useEffect(() => {
    if (!successMsg) return
    const t = setTimeout(() => setSuccessMsg(null), 4000)
    return () => clearTimeout(t)
  }, [successMsg])

  // ── Countdown ──────────────────────────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState('')
  useEffect(() => {
    if (!oracle.poolState) return
    const tick = () => {
      const diff = oracle.poolState!.bettingDeadline.getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Closed'); return }
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1_000)
      setTimeLeft(h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [oracle.poolState])

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function handleMainBet() {
    if (selectedChoice === null || !mainAmount) return
    await oracle.betOnChoice(selectedChoice, mainAmount)
    if (!oracle.error) {
      setSuccessMsg(`✓ Bet placed on Choice ${String.fromCharCode(65 + selectedChoice)}`)
      setMainAmount('')
      setSelectedChoice(null)
      onBetPlaced?.()
    }
  }

  async function handlePsychicBet() {
    if (psychicSide === null || !psychicAmount) return
    await oracle.betOnConsensus(psychicSide, psychicAmount)
    if (!oracle.error) {
      setSuccessMsg(psychicSide ? '✓ Believer position placed' : '✓ Contrarian position placed!')
      setPsychicAmount('')
      setPsychicSide(null)
      onBetPlaced?.()
    }
  }

  // ── Loading / Error ────────────────────────────────────────────────────────
  if (oracle.loading) {
    return (
      <div className="glass-card rounded-2xl p-8 flex items-center justify-center gap-3 text-void-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="font-ui text-sm">Loading Oracle...</span>
      </div>
    )
  }

  if (!oracle.poolState) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center text-void-500 text-sm">
        Pool not found.
      </div>
    )
  }

  const { poolState, choices, consensus, profile } = oracle
  const isOpen = poolState.isOpen

  // ── Psychic Edge label ────────────────────────────────────────────────────
  const edgeInfo = consensus ? psychicEdgeLabel(consensus.psychicEdge) : null
  const EdgeIcon = edgeInfo?.icon ?? Flame

  return (
    <div className="space-y-4">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-6">
        {/* Title row */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-5 h-5 text-gold" />
              <h3 className="text-2xl font-display font-bold text-gold">Oracle Bets</h3>
            </div>
            <p className="text-xs text-void-400 font-ui">Dual-layer prediction market</p>
          </div>

          {/* Status + timer */}
          <div className="text-right space-y-1">
            <div className={[
              'inline-flex items-center gap-1.5 text-xs font-ui uppercase tracking-widest px-3 py-1 rounded-full',
              isOpen
                ? 'bg-success/10 text-success border border-success/30'
                : poolState.resolved
                  ? 'bg-void-700/30 text-void-400 border border-void-700/50'
                  : 'bg-warning/10 text-warning border border-warning/30',
            ].join(' ')}>
              <span className={['w-1.5 h-1.5 rounded-full', isOpen ? 'bg-success animate-pulse' : 'bg-warning'].join(' ')} />
              {isOpen ? 'Open' : poolState.resolved ? 'Resolved' : 'Closed'}
            </div>
            {isOpen && (
              <div className={[
                'flex items-center gap-1 text-xs font-mono justify-end',
                timeLeft.includes('s') && !timeLeft.includes('m') ? 'text-error' : 'text-void-400',
              ].join(' ')}>
                <Clock className="w-3 h-3" />
                {timeLeft}
              </div>
            )}
          </div>
        </div>

        {/* Pool stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-xl p-3 bg-gold/5 border border-gold/20 text-center">
            <div className="text-xl font-display font-bold text-gold tabular-nums">
              ${parseFloat(formatUnits(poolState.totalBets, 6)).toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] text-void-500 font-ui uppercase tracking-wider mt-0.5">Pool Size</div>
          </div>
          {consensus && (
            <>
              <div className="glass-card rounded-xl p-3 bg-drift-teal/5 border border-drift-teal/20 text-center">
                <div className="text-xl font-display font-bold text-drift-teal tabular-nums">
                  ${parseFloat(formatUnits(consensus.crowdRightBets + consensus.crowdWrongBets, 6)).toFixed(0)}
                </div>
                <div className="text-[10px] text-void-500 font-ui uppercase tracking-wider mt-0.5">Psychic Pool</div>
              </div>
              <div className={['glass-card rounded-xl p-3 border text-center', edgeInfo ? 'border-void-700/30' : ''].join(' ')}>
                <div className={['text-xl font-display font-bold tabular-nums', edgeInfo?.color].join(' ')}>
                  {consensus.psychicEdge.toFixed(1)}×
                </div>
                <div className="text-[10px] text-void-500 font-ui uppercase tracking-wider mt-0.5">Edge Score</div>
              </div>
            </>
          )}
        </div>

        {/* Psychic Edge signal */}
        {edgeInfo && consensus && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={['mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-ui',
              consensus.psychicEdge >= 3 ? 'bg-error/10 border-error/30 text-error'
              : consensus.psychicEdge >= 2 ? 'bg-warning/10 border-warning/30 text-warning'
              : 'bg-drift-teal/5 border-drift-teal/20 text-drift-teal/80'
            ].join(' ')}
          >
            <EdgeIcon className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{edgeInfo.text}</span>
            <span className="ml-auto text-void-500 font-mono">{consensus.psychicEdge}×</span>
          </motion.div>
        )}
      </div>

      {/* ── Layer tabs ──────────────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="grid grid-cols-2 border-b border-void-700/50">
          {(['main', 'psychic'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveLayer(tab)}
              className={[
                'py-4 text-sm font-ui uppercase tracking-widest transition-all duration-200 relative',
                activeLayer === tab
                  ? 'text-gold bg-gold/5'
                  : 'text-void-500 hover:text-void-300',
              ].join(' ')}
            >
              <div className="flex items-center justify-center gap-2">
                {tab === 'main' ? (
                  <><TrendingUp className="w-4 h-4" /> Story Bet</>
                ) : (
                  <><Brain className="w-4 h-4" /> Psychic Oracle</>
                )}
              </div>
              {activeLayer === tab && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-4 right-4 h-0.5 bg-gold rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* ── Layer 1: Story Bet ──────────────────────────────────────── */}
            {activeLayer === 'main' && (
              <motion.div
                key="main"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="space-y-5"
              >
                <p className="text-xs text-void-400 font-ui leading-relaxed">
                  Predict which path the AI narrator will choose. Parimutuel: 85% of pool to winners.
                </p>

                {/* Choice cards */}
                <div className="space-y-3">
                  {choices.map(choice => (
                    <ChoiceCard
                      key={choice.index}
                      choice={choice}
                      selected={selectedChoice === choice.index}
                      myBet={oracle.myMainBets[choice.index] ?? 0n}
                      isOpen={isOpen}
                      onClick={() => setSelectedChoice(
                        selectedChoice === choice.index ? null : choice.index
                      )}
                    />
                  ))}
                </div>

                {/* Bet input (visible when choice selected) */}
                <AnimatePresence>
                  {selectedChoice !== null && isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 overflow-hidden"
                    >
                      <AmountInput
                        value={mainAmount}
                        onChange={setMainAmount}
                        disabled={oracle.txPending}
                      />
                      {mainAmount && selectedChoice !== null && (
                        <div className="text-xs text-void-400 font-mono px-1">
                          Est. payout: <span className="text-gold">
                            ${(parseFloat(mainAmount || '0') * (choices[selectedChoice]?.payoutMultiplier ?? 1) * 0.85).toFixed(2)} USDC
                          </span> if AI picks {String.fromCharCode(65 + selectedChoice)}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* CTA */}
                {isOpen && (
                  <Button
                    onClick={isConnected ? handleMainBet : undefined}
                    disabled={!isConnected || selectedChoice === null || !mainAmount || oracle.txPending}
                    className="w-full bg-gold hover:bg-gold-light text-void-950 font-ui font-bold uppercase tracking-widest py-3 rounded-xl transition-all disabled:opacity-40"
                  >
                    {oracle.txPending ? (
                      <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Confirming...</span>
                    ) : !isConnected ? (
                      'Connect Wallet'
                    ) : selectedChoice === null ? (
                      'Choose a Path'
                    ) : (
                      `Bet on ${String.fromCharCode(65 + selectedChoice)}`
                    )}
                  </Button>
                )}

                {/* Claim button when resolved */}
                {poolState.resolved && !oracle.mainClaimed && (
                  <Button
                    onClick={oracle.claimMainWinnings}
                    disabled={oracle.txPending}
                    className="w-full bg-success/20 hover:bg-success/30 text-success border border-success/40 font-ui uppercase tracking-widest py-3 rounded-xl"
                  >
                    {oracle.txPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Claim Winnings'}
                  </Button>
                )}
              </motion.div>
            )}

            {/* ── Layer 2: Psychic Oracle ─────────────────────────────────── */}
            {activeLayer === 'psychic' && (
              <motion.div
                key="psychic"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="space-y-5"
              >
                {/* Explainer */}
                <div className="glass-card rounded-xl p-4 border border-drift-purple/20 bg-drift-purple/5">
                  <div className="flex items-start gap-3">
                    <Brain className="w-4 h-4 text-drift-purple mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="text-xs text-void-300 font-ui font-semibold">The Meta Game</p>
                      <p className="text-xs text-void-400 leading-relaxed">
                        Bet on <span className="text-drift-teal">whether the crowd is right</span>, not just who wins.
                        Correct contrarians earn <span className="text-gold font-bold">2× bonus payout</span> — for predicting the upset.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Consensus toggle */}
                {consensus ? (
                  <>
                    <ConsensusToggle
                      crowdRightPercent={consensus.crowdRightPercent}
                      selected={psychicSide}
                      myRight={oracle.myPsychicBetRight}
                      myWrong={oracle.myPsychicBetWrong}
                      isOpen={isOpen}
                      onSelect={v => setPsychicSide(psychicSide === v ? null : v)}
                    />

                    {/* Bet input */}
                    <AnimatePresence>
                      {psychicSide !== null && isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-3 overflow-hidden"
                        >
                          <AmountInput
                            value={psychicAmount}
                            onChange={setPsychicAmount}
                            disabled={oracle.txPending}
                          />
                          {psychicAmount && psychicSide !== null && (
                            <div className="text-xs text-void-400 font-mono px-1">
                              Est. payout: <span className={psychicSide ? 'text-drift-teal' : 'text-gold'}>
                                {psychicSide
                                  ? `$${(parseFloat(psychicAmount || '0') * (100 / Math.max(consensus.crowdRightPercent, 1))).toFixed(2)} USDC`
                                  : `$${(parseFloat(psychicAmount || '0') * 2 * (100 / Math.max(100 - consensus.crowdRightPercent, 1))).toFixed(2)} USDC (2× bonus)`
                                }
                              </span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* CTA */}
                    {isOpen && (
                      <Button
                        onClick={isConnected ? handlePsychicBet : undefined}
                        disabled={!isConnected || psychicSide === null || !psychicAmount || oracle.txPending}
                        className={[
                          'w-full font-ui font-bold uppercase tracking-widest py-3 rounded-xl transition-all disabled:opacity-40',
                          psychicSide === false
                            ? 'bg-gold hover:bg-gold-light text-void-950'
                            : 'bg-drift-teal/20 hover:bg-drift-teal/30 text-drift-teal border border-drift-teal/40',
                        ].join(' ')}
                      >
                        {oracle.txPending ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />Confirming...
                          </span>
                        ) : psychicSide === false ? (
                          '⚡ Go Contrarian (2×)'
                        ) : psychicSide === true ? (
                          '🤝 Bet with the Crowd'
                        ) : (
                          'Pick a Side'
                        )}
                      </Button>
                    )}

                    {/* Psychic claim */}
                    {poolState.resolved && !oracle.psychicClaimed && (
                      <Button
                        onClick={oracle.claimPsychicWinnings}
                        disabled={oracle.txPending}
                        className="w-full bg-drift-purple/20 hover:bg-drift-purple/30 text-drift-purple border border-drift-purple/40 font-ui uppercase tracking-widest py-3 rounded-xl"
                      >
                        {oracle.txPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : '🔮 Claim Psychic Winnings'}
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-void-500 text-sm">Loading consensus data...</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Psychic Profile ─────────────────────────────────────────────────── */}
      {profile && profile.totalBets > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl overflow-hidden border border-void-700/40"
        >
          <button
            onClick={() => setShowProfile(v => !v)}
            className="w-full flex items-center justify-between p-5 hover:bg-void-900/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={[
                'w-10 h-10 rounded-xl flex items-center justify-center text-xl',
                BADGE_CONFIG[profile.badge].glow,
                'bg-void-800/60 border border-void-700/50',
              ].join(' ')}>
                {profile.badgeEmoji}
              </div>
              <div>
                <div className={['font-display font-bold', BADGE_CONFIG[profile.badge].color].join(' ')}>
                  {BADGE_CONFIG[profile.badge].label}
                </div>
                <div className="text-xs text-void-500 font-ui">
                  Score: {profile.score.toLocaleString()} · {profile.accuracy}% accuracy
                </div>
              </div>
            </div>
            {showProfile ? <ChevronUp className="w-4 h-4 text-void-500" /> : <ChevronDown className="w-4 h-4 text-void-500" />}
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-void-700/40"
              >
                <div className="p-5 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-display font-bold text-gold">{profile.contraryWins}</div>
                    <div className="text-xs text-void-500 font-ui mt-0.5">Contrarian Wins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-display font-bold text-drift-teal">{profile.totalBets}</div>
                    <div className="text-xs text-void-500 font-ui mt-0.5">Total Bets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-display font-bold text-drift-purple">{profile.feeDiscount / 100}%</div>
                    <div className="text-xs text-void-500 font-ui mt-0.5">Fee Discount</div>
                  </div>
                </div>

                {/* Progress to next badge */}
                {profile.badge !== 'VOID_SEER' && (
                  <div className="px-5 pb-5">
                    <ProgressToNextBadge score={profile.score} />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Error / Success toasts ──────────────────────────────────────────── */}
      <AnimatePresence>
        {oracle.error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-start gap-3 glass-card rounded-xl p-4 border border-error/40 bg-error/5"
          >
            <AlertTriangle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-error leading-relaxed break-words">{oracle.error}</p>
            </div>
            <button onClick={oracle.resetError} className="text-void-500 hover:text-void-300 text-sm">✕</button>
          </motion.div>
        )}
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 glass-card rounded-xl p-4 border border-success/40 bg-success/5"
          >
            <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
            <p className="text-xs text-success">{successMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Progress bar helper ──────────────────────────────────────────────────────

const BADGE_THRESHOLDS: Record<PsychicBadge, number> = {
  INITIATE: 0,
  SEER: 1000,
  ORACLE: 1250,
  PROPHET: 1500,
  VOID_SEER: 1750,
}

function ProgressToNextBadge({ score }: { score: number }) {
  const badges: PsychicBadge[] = ['INITIATE', 'SEER', 'ORACLE', 'PROPHET', 'VOID_SEER']
  const currentBadge = badges.reduce<PsychicBadge>(
    (best, b) => (score >= BADGE_THRESHOLDS[b] ? b : best),
    'INITIATE'
  )
  const currentIndex = badges.indexOf(currentBadge)
  const nextBadge = badges[currentIndex + 1]
  if (!nextBadge) return null

  const from = BADGE_THRESHOLDS[currentBadge]
  const to = BADGE_THRESHOLDS[nextBadge]
  const pct = Math.round(((score - from) / (to - from)) * 100)
  const cfg = BADGE_CONFIG[nextBadge]

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-ui text-void-500">
        <span>Next: <span className={cfg.color}>{cfg.emoji} {cfg.label}</span></span>
        <span>{to - score} pts to go</span>
      </div>
      <div className="h-1.5 bg-void-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-drift-purple to-gold"
        />
      </div>
    </div>
  )
}
