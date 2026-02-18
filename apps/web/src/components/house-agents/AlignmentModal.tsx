'use client'

/**
 * AlignmentModal — Modal for aligning with or rivaling a House Agent.
 *
 * Align: Earn 20% of agent winnings on active chapters.
 * Rival: Earn 10% bonus when the agent LOSES a bet.
 *
 * Shows:
 * - Mode toggle (Align / Rival)
 * - House info & flavor text
 * - Reward structure
 * - Wallet connection gating
 * - Submit action
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, Swords, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import type { HouseAgentPublicProfile } from '@/app/api/house-agents/route'
import { useAccount } from 'wagmi'
import { ConnectWallet } from '@/components/wallet/ConnectWallet'
import { ClientOnly } from '@/components/ClientOnly'

interface AlignmentModalProps {
  open: boolean
  onClose: () => void
  agent: HouseAgentPublicProfile
  mode: 'align' | 'rival'
  viewerAddress?: string
}

type SubmitState = 'idle' | 'loading' | 'success' | 'error'

export function AlignmentModal({ open, onClose, agent, mode, viewerAddress }: AlignmentModalProps) {
  const { address, isConnected } = useAccount()
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const activeAddress = address ?? viewerAddress

  async function handleSubmit() {
    if (!activeAddress) return

    setSubmitState('loading')
    setErrorMessage('')

    try {
      const res = await fetch(`/api/house-agents/${agent.houseId}/align`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: activeAddress,
          isRival: mode === 'rival',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Unknown error')
      }

      setSubmitState('success')
    } catch (err) {
      setSubmitState('error')
      setErrorMessage(err instanceof Error ? err.message : 'Failed to align')
    }
  }

  function handleClose() {
    setSubmitState('idle')
    setErrorMessage('')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md px-4"
          >
            <div
              className="glass-card rounded-2xl border overflow-hidden"
              style={{ borderColor: `${agent.accentHex}40` }}
            >
              {/* Top stripe */}
              <div
                className="h-1"
                style={{ background: `linear-gradient(90deg, ${agent.colorHex}, ${agent.accentHex})` }}
              />

              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${agent.colorHex}30` }}
                    >
                      {agent.emoji}
                    </div>
                    <div>
                      <h2 className="text-lg font-cinzel font-bold" style={{ color: agent.accentHex }}>
                        {mode === 'align' ? 'Align With' : 'Become Rival of'}
                      </h2>
                      <p className="text-sm text-void-400 font-ui">House {agent.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="text-void-500 hover:text-void-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mode Card */}
                {mode === 'align' ? (
                  <div
                    className="rounded-xl p-4 border mb-5"
                    style={{ backgroundColor: `${agent.accentHex}10`, borderColor: `${agent.accentHex}30` }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4" style={{ color: agent.accentHex }} />
                      <span className="text-sm font-bold" style={{ color: agent.accentHex }}>
                        Aligned — 20% Yield Share
                      </span>
                    </div>
                    <p className="text-sm text-void-300 leading-relaxed">
                      You earn <strong className="text-foreground">20% of House {agent.name}&rsquo;s winnings</strong> on every
                      chapter while aligned. Risk is on the agent — not you.
                    </p>
                    <ul className="mt-3 space-y-1.5">
                      {[
                        `Agent wins 1,200 USDC → You earn 240 USDC`,
                        `Agent loses → You lose nothing`,
                        `Alignment active for 30 days`,
                        `1 active alignment per wallet`,
                      ].map((point) => (
                        <li key={point} className="flex items-start gap-2 text-xs text-void-400">
                          <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="rounded-xl p-4 border border-error/30 bg-error/5 mb-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Swords className="w-4 h-4 text-error" />
                      <span className="text-sm font-bold text-error">
                        Rival — Earn on Agent&rsquo;s Losses
                      </span>
                    </div>
                    <p className="text-sm text-void-300 leading-relaxed">
                      You earn a <strong className="text-foreground">10% bonus</strong> each time
                      House {agent.name} loses a bet. The bigger their loss, the bigger your share.
                    </p>
                    <ul className="mt-3 space-y-1.5">
                      {[
                        `Agent loses 1,000 USDC → You earn 100 USDC`,
                        `Agent wins → You earn nothing`,
                        `Rivalry lasts 30 days`,
                        `Track agent bets in real-time`,
                      ].map((point) => (
                        <li key={point} className="flex items-start gap-2 text-xs text-void-400">
                          <Swords className="w-3.5 h-3.5 text-error flex-shrink-0 mt-0.5" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Flavor text */}
                <p className="text-xs text-void-500 italic mb-5 text-center">
                  {mode === 'align'
                    ? `"House ${agent.name} has ${agent.stats.alignedPlayers.toLocaleString()} allies. Join their ranks."`
                    : `"${agent.stats.alignedPlayers} back them. You bet against them. Bold."`}
                </p>

                {/* Auth + Submit */}
                <ClientOnly>
                  {!isConnected && !viewerAddress ? (
                    <div className="text-center">
                      <p className="text-sm text-void-400 mb-4">
                        Connect your wallet to {mode === 'align' ? 'align' : 'rival'} House {agent.name}.
                      </p>
                      <ConnectWallet />
                    </div>
                  ) : submitState === 'success' ? (
                    <div className="flex flex-col items-center gap-3 py-4">
                      <CheckCircle className="w-12 h-12 text-success" />
                      <p className="text-lg font-cinzel font-bold text-success">
                        {mode === 'align' ? 'Aligned!' : 'Rivalry Declared!'}
                      </p>
                      <p className="text-sm text-void-400 text-center">
                        {mode === 'align'
                          ? `You now share in House ${agent.name}'s glory. Rewards begin next chapter.`
                          : `House ${agent.name} has a new rival. May they stumble.`}
                      </p>
                      <button
                        onClick={handleClose}
                        className="mt-2 px-6 py-2 rounded-xl border border-void-700 text-void-300 hover:text-foreground hover:border-void-500 transition-all text-sm font-ui"
                      >
                        Close
                      </button>
                    </div>
                  ) : (
                    <>
                      {submitState === 'error' && (
                        <div className="flex items-center gap-2 text-error text-sm mb-4 p-3 rounded-xl bg-error/5 border border-error/20">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          {errorMessage}
                        </div>
                      )}
                      <button
                        onClick={handleSubmit}
                        disabled={submitState === 'loading'}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-ui font-bold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={
                          mode === 'align'
                            ? {
                                background: `linear-gradient(135deg, ${agent.colorHex}, ${agent.accentHex})`,
                                color: '#ffffff',
                              }
                            : {
                                background: 'linear-gradient(135deg, #7f1d1d, #ef4444)',
                                color: '#ffffff',
                              }
                        }
                      >
                        {submitState === 'loading' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : mode === 'align' ? (
                          <Users className="w-4 h-4" />
                        ) : (
                          <Swords className="w-4 h-4" />
                        )}
                        {submitState === 'loading'
                          ? 'Processing…'
                          : mode === 'align'
                          ? `Align with House ${agent.name}`
                          : `Declare Rivalry`}
                      </button>
                    </>
                  )}
                </ClientOnly>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
