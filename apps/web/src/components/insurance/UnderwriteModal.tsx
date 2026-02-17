'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, AlertTriangle, CheckCircle, Loader2, Info } from 'lucide-react'
import type { InsuranceEvent, UnderwriteResponse } from '@/types/insurance'
import { premiumRateBpsToPercent, formatUSDC, timeUntil } from '@/types/insurance'

const PRESET_AMOUNTS = [500, 1_000, 2_500, 5_000, 10_000, 25_000]

interface UnderwriteModalProps {
  event: InsuranceEvent
  onClose: () => void
}

type Step = 'configure' | 'confirm' | 'success' | 'error'

export function UnderwriteModal({ event, onClose }: UnderwriteModalProps) {
  const [step, setStep] = useState<Step>('configure')
  const [amount, setAmount] = useState(2_500)
  const [inputValue, setInputValue] = useState('2500')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<UnderwriteResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const premiumPct = premiumRateBpsToPercent(event.premiumRateBps)
  const isValidAmount = amount >= 500 && amount <= 100_000

  // Estimate underwriter APY (simplified client-side)
  const utilizationRatio =
    event.underwriterPool > 0
      ? Math.min(event.totalCoverage / event.underwriterPool, 1)
      : 0.5
  const estimatedAPY = Math.min(
    Math.round(premiumPct * 12 + utilizationRatio * 20),
    400
  )
  const estimatedEarnings = Math.round((amount * estimatedAPY) / 100 / 12) // Monthly estimate

  const handleInput = (value: string) => {
    setInputValue(value)
    const parsed = parseFloat(value)
    if (!isNaN(parsed) && parsed > 0) setAmount(Math.round(parsed))
  }

  const handleStake = async () => {
    if (!isValidAmount) return
    setLoading(true)
    try {
      const res = await fetch('/api/insurance/underwrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          amount,
          walletAddress: '0xDEMO_WALLET',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to stake')
        setStep('error')
        return
      }
      setResult(data)
      setStep('success')
    } catch {
      setErrorMsg('Network error. Please try again.')
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="glass-card rounded-2xl border border-gold/30 w-full max-w-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-void-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gold" />
              <h2 className="font-display font-bold text-lg text-foreground">
                Earn Yield as Underwriter
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-void-400 hover:text-foreground hover:bg-void-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* ─────────── CONFIGURE ─────────── */}
            {step === 'configure' && (
              <>
                {/* Event info */}
                <div className="p-3 rounded-xl bg-void-900/60 border border-void-800">
                  <span className="text-xs text-void-500 font-ui uppercase tracking-wider block mb-1">
                    You are backing
                  </span>
                  <p className="text-sm text-foreground font-ui leading-snug">
                    {event.characterName} survives: &ldquo;{event.description}&rdquo; does NOT occur
                  </p>
                  <p className="text-xs text-void-500 font-ui mt-1">
                    {timeUntil(event.deadline)}
                  </p>
                </div>

                {/* How it works */}
                <div className="flex gap-2 p-3 rounded-xl bg-gold/5 border border-gold/20">
                  <Info className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-void-400 font-ui">
                    As an underwriter, you stake USDC and earn a share of premiums paid by
                    policyholders. If {event.characterName} survives, you keep your stake +
                    earnings. If the event occurs, your stake pays out policyholders.
                  </p>
                </div>

                {/* Amount input */}
                <div>
                  <label className="block text-xs text-void-400 font-ui uppercase tracking-wider mb-2">
                    Stake Amount (USDC)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-void-400 font-mono">
                      $
                    </span>
                    <input
                      type="number"
                      value={inputValue}
                      onChange={(e) => handleInput(e.target.value)}
                      min={500}
                      max={100_000}
                      className="w-full bg-void-900 border border-void-700 rounded-xl pl-7 pr-3 py-3 text-foreground font-mono text-lg focus:outline-none focus:border-gold/60 transition-colors"
                    />
                  </div>
                  <p className="text-xs text-void-500 font-ui mt-1">
                    Min: $500 · Max: $100,000 per position
                  </p>
                </div>

                {/* Preset amounts */}
                <div className="flex flex-wrap gap-2">
                  {PRESET_AMOUNTS.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        setAmount(preset)
                        setInputValue(String(preset))
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-ui font-semibold transition-colors ${
                        amount === preset
                          ? 'bg-gold/20 border border-gold/50 text-gold'
                          : 'bg-void-800 border border-void-700 text-void-400 hover:text-foreground hover:border-void-600'
                      }`}
                    >
                      ${preset >= 1000 ? `${preset / 1000}K` : preset}
                    </button>
                  ))}
                </div>

                {/* APY Summary */}
                <div className="p-4 rounded-xl bg-gold/5 border border-gold/20 space-y-2.5">
                  <h3 className="text-sm font-semibold text-gold font-ui">Yield Estimate</h3>
                  <div className="flex justify-between text-sm font-ui">
                    <span className="text-void-400">Your stake</span>
                    <span className="text-foreground font-semibold">{formatUSDC(amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-ui">
                    <span className="text-void-400">Estimated APY</span>
                    <span className="text-gold font-bold">{estimatedAPY}%</span>
                  </div>
                  <div className="flex justify-between text-sm font-ui">
                    <span className="text-void-400">Est. monthly earnings</span>
                    <span className="text-gold font-semibold">~{formatUSDC(estimatedEarnings)}</span>
                  </div>
                  <div className="border-t border-gold/20 pt-2 text-xs text-void-500 font-ui">
                    APY is variable based on premium inflow and pool utilization.
                    {event.riskTier === 'EXTREME' || event.riskTier === 'HIGH'
                      ? ' High risk event — higher yield reflects higher probability of payout.'
                      : ''}
                  </div>
                </div>

                {/* Risk warning */}
                {(event.riskTier === 'EXTREME' || event.riskTier === 'HIGH') && (
                  <div className="flex gap-2 p-3 rounded-xl bg-error/10 border border-error/30">
                    <AlertTriangle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-error font-ui">
                      <strong>High Risk:</strong> The market implies a{' '}
                      {(100 - event.impliedSurvivalProbability).toFixed(0)}% chance of this event
                      occurring. Your stake may be used for payouts.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => setStep('confirm')}
                  disabled={!isValidAmount}
                  className="w-full py-3 rounded-xl bg-gold/15 hover:bg-gold/25 border border-gold/35 hover:border-gold/60 text-gold font-ui font-bold text-base transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Review Stake
                </button>
              </>
            )}

            {/* ─────────── CONFIRM ─────────── */}
            {step === 'confirm' && (
              <>
                <div className="p-4 rounded-xl bg-void-900/60 border border-void-800 space-y-3">
                  <h3 className="font-display font-bold text-foreground">Confirm Stake</h3>
                  <div className="space-y-2 text-sm font-ui">
                    <div className="flex justify-between">
                      <span className="text-void-400">Backing</span>
                      <span className="text-foreground text-right max-w-[60%]">
                        {event.characterName} survives Ch. {event.chapterNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-void-400">Your stake</span>
                      <span className="text-foreground font-semibold">{formatUSDC(amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-void-400">Est. APY</span>
                      <span className="text-gold font-bold">{estimatedAPY}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-void-400">Risk if event occurs</span>
                      <span className="text-error font-semibold">Stake used for payouts</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-void-500 font-ui text-center">
                  Staked capital is locked until event settlement or deadline expiry.
                  APY estimates are not guaranteed.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setStep('configure')}
                    disabled={loading}
                    className="py-3 rounded-xl bg-void-800 hover:bg-void-700 border border-void-700 text-void-300 font-ui font-semibold transition-colors disabled:opacity-40"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleStake}
                    disabled={loading}
                    className="py-3 rounded-xl bg-gold/15 hover:bg-gold/25 border border-gold/35 text-gold font-ui font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Staking…
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4" />
                        Confirm Stake
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* ─────────── SUCCESS ─────────── */}
            {step === 'success' && result && (
              <div className="text-center space-y-4 py-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-gold" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-foreground mb-1">
                    Stake Confirmed!
                  </h3>
                  <p className="text-sm text-void-400 font-ui">
                    You&apos;re now earning yield as an underwriter
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-gold/10 border border-gold/30 text-left space-y-2">
                  <div className="flex justify-between text-sm font-ui">
                    <span className="text-void-400">Stake ID</span>
                    <span className="text-foreground font-mono text-xs">{result.stakeId}</span>
                  </div>
                  <div className="flex justify-between text-sm font-ui">
                    <span className="text-void-400">Staked</span>
                    <span className="text-gold font-semibold">{formatUSDC(result.staked)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-ui">
                    <span className="text-void-400">Estimated APY</span>
                    <span className="text-gold font-bold">{result.estimatedAPY}%</span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl bg-void-800 hover:bg-void-700 border border-void-700 text-foreground font-ui font-semibold transition-colors"
                >
                  Done
                </button>
              </div>
            )}

            {/* ─────────── ERROR ─────────── */}
            {step === 'error' && (
              <div className="text-center space-y-4 py-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-error/20 border border-error/40 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-error" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-foreground mb-1">
                    Stake Failed
                  </h3>
                  <p className="text-sm text-void-400 font-ui">{errorMsg}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={onClose}
                    className="py-3 rounded-xl bg-void-800 hover:bg-void-700 border border-void-700 text-void-300 font-ui font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setStep('configure')}
                    className="py-3 rounded-xl bg-error/20 hover:bg-error/30 border border-error/40 text-error font-ui font-semibold transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
