'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Shield, AlertTriangle, CheckCircle, Loader2, ExternalLink } from 'lucide-react'
import type { InsuranceEvent, BuyCoverageResponse } from '@/types/insurance'
import { calcPremium, formatUSDC, premiumRateBpsToPercent, timeUntil } from '@/types/insurance'
import { RiskBadge } from './RiskBadge'

const PRESET_AMOUNTS = [100, 250, 500, 1_000, 2_500, 5_000]

interface BuyCoverageModalProps {
  event: InsuranceEvent
  onClose: () => void
}

type Step = 'configure' | 'confirm' | 'success' | 'error'

export function BuyCoverageModal({ event, onClose }: BuyCoverageModalProps) {
  const [step, setStep] = useState<Step>('configure')
  const [coverage, setCoverage] = useState<number>(500)
  const [inputValue, setInputValue] = useState('500')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BuyCoverageResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const premiumPct = premiumRateBpsToPercent(event.premiumRateBps)
  const premium = calcPremium(coverage, event.premiumRateBps)
  const isValidAmount = coverage >= 100 && coverage <= 10_000

  // Debounced input handler
  const handleInput = (value: string) => {
    setInputValue(value)
    const parsed = parseFloat(value)
    if (!isNaN(parsed) && parsed > 0) {
      setCoverage(Math.round(parsed))
    }
  }

  const handleBuy = async () => {
    if (!isValidAmount) return
    setLoading(true)
    try {
      const res = await fetch('/api/insurance/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          coverage,
          walletAddress: '0xDEMO_WALLET', // Replace with wagmi useAccount().address
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to purchase policy')
        setStep('error')
        return
      }

      setResult(data)
      setStep('success')
    } catch (err) {
      setErrorMsg('Network error. Please try again.')
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="glass-card rounded-2xl border border-drift-teal/30 w-full max-w-md shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-void-800">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-drift-teal" />
              <h2 className="font-display font-bold text-lg text-foreground">
                Buy Coverage
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
            {/* ─────────── STEP: CONFIGURE ─────────── */}
            {step === 'configure' && (
              <>
                {/* Event info */}
                <div className="p-3 rounded-xl bg-void-900/60 border border-void-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-void-500 font-ui uppercase tracking-wider">
                      Insuring against
                    </span>
                    <RiskBadge tier={event.riskTier} />
                  </div>
                  <p className="text-sm text-foreground font-ui leading-snug">
                    {event.description}
                  </p>
                  <p className="text-xs text-void-500 font-ui mt-1">
                    {timeUntil(event.deadline)}
                  </p>
                </div>

                {/* Coverage amount */}
                <div>
                  <label className="block text-xs text-void-400 font-ui uppercase tracking-wider mb-2">
                    Coverage Amount (USDC)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-void-400 font-mono">
                      $
                    </span>
                    <input
                      type="number"
                      value={inputValue}
                      onChange={(e) => handleInput(e.target.value)}
                      min={100}
                      max={10_000}
                      className="w-full bg-void-900 border border-void-700 rounded-xl pl-7 pr-3 py-3 text-foreground font-mono text-lg focus:outline-none focus:border-drift-teal/60 transition-colors"
                    />
                  </div>
                  <p className="text-xs text-void-500 font-ui mt-1">
                    Min: $100 · Max: $10,000 per policy
                  </p>
                </div>

                {/* Preset amounts */}
                <div className="flex flex-wrap gap-2">
                  {PRESET_AMOUNTS.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        setCoverage(preset)
                        setInputValue(String(preset))
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-ui font-semibold transition-colors ${
                        coverage === preset
                          ? 'bg-drift-teal/20 border border-drift-teal/50 text-drift-teal'
                          : 'bg-void-800 border border-void-700 text-void-400 hover:text-foreground hover:border-void-600'
                      }`}
                    >
                      ${preset >= 1000 ? `${preset / 1000}K` : preset}
                    </button>
                  ))}
                </div>

                {/* Premium breakdown */}
                <div className="p-4 rounded-xl bg-drift-teal/5 border border-drift-teal/20 space-y-2.5">
                  <h3 className="text-sm font-semibold text-drift-teal font-ui">Policy Summary</h3>
                  <div className="flex justify-between text-sm font-ui">
                    <span className="text-void-400">Coverage</span>
                    <span className="text-foreground font-semibold">{formatUSDC(coverage)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-ui">
                    <span className="text-void-400">
                      Premium ({premiumPct.toFixed(0)}%)
                    </span>
                    <span className="text-foreground font-semibold">
                      {formatUSDC(premium)}
                    </span>
                  </div>
                  <div className="border-t border-drift-teal/20 pt-2 flex justify-between text-sm font-ui">
                    <span className="text-void-400">Payout if event occurs</span>
                    <span className="text-drift-teal font-bold">{formatUSDC(coverage)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-ui">
                    <span className="text-void-400">You pay now</span>
                    <span className="text-foreground font-bold">{formatUSDC(premium)} USDC</span>
                  </div>
                </div>

                {/* Warning for extreme risk */}
                {event.riskTier === 'EXTREME' && (
                  <div className="flex gap-2 p-3 rounded-xl bg-error/10 border border-error/30">
                    <AlertTriangle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-error font-ui">
                      This is an <strong>Extreme Risk</strong> event. The market implies{' '}
                      {event.impliedSurvivalProbability.toFixed(0)}% survival probability.
                      Underwriting capacity is limited.
                    </p>
                  </div>
                )}

                {/* CTA */}
                <button
                  onClick={() => setStep('confirm')}
                  disabled={!isValidAmount}
                  className="w-full py-3 rounded-xl bg-drift-teal/20 hover:bg-drift-teal/30 border border-drift-teal/40 hover:border-drift-teal/70 text-drift-teal font-ui font-bold text-base transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Review Policy
                </button>
              </>
            )}

            {/* ─────────── STEP: CONFIRM ─────────── */}
            {step === 'confirm' && (
              <>
                <div className="p-4 rounded-xl bg-void-900/60 border border-void-800 space-y-3">
                  <h3 className="font-display font-bold text-foreground">Confirm Purchase</h3>
                  <div className="space-y-2 text-sm font-ui">
                    <div className="flex justify-between">
                      <span className="text-void-400">Event</span>
                      <span className="text-foreground text-right max-w-[60%]">
                        {event.description}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-void-400">Coverage</span>
                      <span className="text-foreground font-semibold">{formatUSDC(coverage)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-void-400">Premium you pay</span>
                      <span className="text-warning font-semibold">{formatUSDC(premium)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-void-400">Payout if event occurs</span>
                      <span className="text-drift-teal font-bold">{formatUSDC(coverage)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-void-400">Expires</span>
                      <span className="text-void-300">{timeUntil(event.deadline)}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-void-500 font-ui text-center">
                  By purchasing, you agree to the Narrative Insurance Protocol terms.
                  Premiums are non-refundable after purchase.
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
                    onClick={handleBuy}
                    disabled={loading}
                    className="py-3 rounded-xl bg-drift-teal/20 hover:bg-drift-teal/30 border border-drift-teal/40 text-drift-teal font-ui font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Purchasing…
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        Confirm Purchase
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* ─────────── STEP: SUCCESS ─────────── */}
            {step === 'success' && result && (
              <div className="text-center space-y-4 py-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-success/20 border border-success/40 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-foreground mb-1">
                    Policy Purchased!
                  </h3>
                  <p className="text-sm text-void-400 font-ui">
                    You&apos;re now insured against &ldquo;{event.description}&rdquo;
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-success/10 border border-success/30 text-left space-y-2">
                  <div className="flex justify-between text-sm font-ui">
                    <span className="text-void-400">Policy ID</span>
                    <span className="text-foreground font-mono text-xs">{result.policyId}</span>
                  </div>
                  <div className="flex justify-between text-sm font-ui">
                    <span className="text-void-400">Coverage</span>
                    <span className="text-success font-semibold">{formatUSDC(result.coverage)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-ui">
                    <span className="text-void-400">Premium paid</span>
                    <span className="text-foreground">{formatUSDC(result.premium)}</span>
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

            {/* ─────────── STEP: ERROR ─────────── */}
            {step === 'error' && (
              <div className="text-center space-y-4 py-2">
                <div className="w-16 h-16 mx-auto rounded-full bg-error/20 border border-error/40 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-error" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-foreground mb-1">
                    Purchase Failed
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
