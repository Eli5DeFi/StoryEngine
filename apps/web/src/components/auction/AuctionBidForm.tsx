'use client'

/**
 * AuctionBidForm — Wallet-connected bid placement for Chapter Auctions.
 *
 * Flow:
 *   1. User enters USDC amount (≥ minimumBid)
 *   2. Simulate USDC approval (in prod: useWriteContract → ERC20.approve)
 *   3. POST /api/auction/[chapterId]/bid
 *   4. Optimistic UI update + success toast
 *
 * Shows:
 * - Current highest bid + minimum next bid
 * - Wallet connect prompt if disconnected
 * - Loading/confirming states
 * - Winner rights explainer
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount } from 'wagmi'
import {
  DollarSign,
  Gavel,
  Crown,
  CheckCircle2,
  Loader2,
  Wallet,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { ChapterAuction } from '@/lib/auction-data'

interface AuctionBidFormProps {
  auction: ChapterAuction
  minimumNextBid: number
  onBidSuccess: (newBid: number) => void
}

const WINNER_RIGHTS = [
  { icon: '🎭', text: 'Choose the chapter genre (Heist, Horror, Romance, War, Mystery, Revelation)' },
  { icon: '👑', text: 'Select which House gets the narrative spotlight' },
  { icon: '⚡', text: 'Pick one story twist from a curated list' },
  { icon: '🖼️', text: 'Receive a Patron NFT with your name inscribed on-chain' },
  { icon: '💰', text: 'Earn 10% of all bets placed on your chapter' },
]

export function AuctionBidForm({ auction, minimumNextBid, onBidSuccess }: AuctionBidFormProps) {
  const { address, isConnected } = useAccount()
  const [amount, setAmount] = useState<string>(minimumNextBid.toLocaleString())
  const [step, setStep] = useState<'idle' | 'approving' | 'bidding' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showRights, setShowRights] = useState(false)

  const parsedAmount = parseInt(amount.replace(/,/g, ''), 10)
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount >= minimumNextBid
  const isBusy = step === 'approving' || step === 'bidding'

  async function handleBid() {
    if (!isConnected || !address || !isValidAmount) return

    setStep('approving')
    setErrorMsg(null)

    try {
      // In production: approve USDC spend → call AuctionHouse.placeBid()
      // Here: simulate 1.2s approval delay then POST to API
      await new Promise((r) => setTimeout(r, 1200))

      setStep('bidding')

      const res = await fetch(`/api/auction/${auction.chapterNumber}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidder: address,
          amountUsdc: parsedAmount,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Bid failed')
      }

      setStep('success')
      onBidSuccess(parsedAmount)

      // Reset after 4s
      setTimeout(() => setStep('idle'), 4000)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
      setStep('error')
      setTimeout(() => setStep('idle'), 5000)
    }
  }

  function formatInput(val: string) {
    const digits = val.replace(/\D/g, '')
    if (!digits) return ''
    return parseInt(digits, 10).toLocaleString()
  }

  if (!isConnected) {
    return (
      <div className="rounded-xl border border-void-800 bg-void-950/60 p-6 text-center space-y-4">
        <Wallet className="w-10 h-10 text-void-500 mx-auto" />
        <p className="text-void-400 text-sm">Connect your wallet to place a bid</p>
        <p className="text-void-600 text-xs">Requires Base network + USDC</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Current bid context */}
      <div className="rounded-xl border border-void-800 bg-void-950/60 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-void-400">Current highest bid</span>
          <span className="text-gold font-bold font-mono">
            ${auction.currentBidUsdc.toLocaleString()} USDC
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-void-400">Minimum next bid</span>
          <span className="text-drift-teal font-mono font-bold">
            ${minimumNextBid.toLocaleString()} USDC
          </span>
        </div>
        {auction.currentBidder && (
          <div className="flex justify-between text-xs text-void-500">
            <span>Current leader</span>
            <span className="font-mono">{auction.currentBidderEns ?? auction.currentBidder}</span>
          </div>
        )}
      </div>

      {/* Bid input */}
      <div className="space-y-2">
        <label className="text-xs text-void-400 uppercase tracking-wider font-ui">
          Your bid (USDC)
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-void-500" />
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(formatInput(e.target.value))}
            disabled={isBusy || step === 'success'}
            placeholder={minimumNextBid.toLocaleString()}
            className="w-full bg-void-900 border border-void-700 rounded-lg pl-9 pr-4 py-3 
                       text-foreground font-mono text-lg focus:outline-none focus:border-gold
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />
        </div>
        {!isNaN(parsedAmount) && parsedAmount < minimumNextBid && (
          <p className="text-red-400 text-xs">
            Must be at least ${minimumNextBid.toLocaleString()} USDC (+5% above current bid)
          </p>
        )}
      </div>

      {/* Quick amounts */}
      <div className="flex gap-2 flex-wrap">
        {[minimumNextBid, minimumNextBid + 500, minimumNextBid + 2000, minimumNextBid + 5000].map((preset) => (
          <button
            key={preset}
            onClick={() => setAmount(preset.toLocaleString())}
            disabled={isBusy}
            className="px-3 py-1 rounded-full border border-void-700 text-void-300 text-xs
                       hover:border-gold hover:text-gold transition-colors disabled:opacity-40"
          >
            ${preset.toLocaleString()}
          </button>
        ))}
      </div>

      {/* Bid button */}
      <AnimatePresence mode="wait">
        {step === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 bg-green-950/50 border border-green-700 rounded-xl p-4"
          >
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-green-400 font-bold text-sm">Bid placed!</p>
              <p className="text-green-600 text-xs">
                You're the highest bidder at ${parsedAmount.toLocaleString()} USDC
              </p>
            </div>
          </motion.div>
        ) : step === 'error' ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-red-950/50 border border-red-800 rounded-xl p-4 text-red-400 text-sm"
          >
            {errorMsg ?? 'Bid failed. Try again.'}
          </motion.div>
        ) : (
          <motion.button
            key="bid-btn"
            onClick={handleBid}
            disabled={!isValidAmount || isBusy}
            whileHover={isValidAmount && !isBusy ? { scale: 1.02 } : {}}
            whileTap={isValidAmount && !isBusy ? { scale: 0.98 } : {}}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl
                       bg-gold text-background font-display font-bold text-lg
                       hover:bg-gold-light transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isBusy ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {step === 'approving' ? 'Approving USDC…' : 'Placing bid…'}
              </>
            ) : (
              <>
                <Gavel className="w-5 h-5" />
                Place Bid — ${isNaN(parsedAmount) ? '—' : parsedAmount.toLocaleString()} USDC
              </>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Winner rights explainer */}
      <button
        onClick={() => setShowRights((v) => !v)}
        className="w-full flex items-center justify-between text-void-400 text-sm hover:text-void-200 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-gold" />
          What do I win?
        </span>
        {showRights ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      <AnimatePresence>
        {showRights && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <ul className="space-y-2 pb-2">
              {WINNER_RIGHTS.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-void-300">
                  <span className="flex-shrink-0">{r.icon}</span>
                  <span>{r.text}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 p-3 rounded-lg bg-gold/5 border border-gold/20">
              <p className="text-gold text-xs font-ui">
                💰 Estimated winner payout:{' '}
                <strong>${Math.floor(auction.estimatedBetPool * 0.1).toLocaleString()} USDC</strong>
                {' '}(10% of ~${auction.estimatedBetPool.toLocaleString()} bet pool)
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
