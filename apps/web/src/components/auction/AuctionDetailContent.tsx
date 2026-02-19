'use client'

/**
 * AuctionDetailContent — Full detail view for a single chapter auction.
 *
 * Shows:
 * - Chapter info + status
 * - Live countdown (active auctions)
 * - Full bid history
 * - AuctionBidForm (for active auctions)
 * - Winner parameters display (for won/settled)
 * - PatronParameters form (for the winner to configure)
 * - Revenue breakdown
 */

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount } from 'wagmi'
import {
  Crown,
  Gavel,
  History,
  TrendingUp,
  Sparkles,
  AlertCircle,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import type { ChapterAuction } from '@/lib/auction-data'
import { AuctionCountdown } from './AuctionCountdown'
import { AuctionBidForm } from './AuctionBidForm'
import { PatronParameters } from './PatronParameters'

interface AuctionDetail extends ChapterAuction {
  msRemaining: number
  hoursRemaining: number
  isLive: boolean
  minimumNextBid: number
  winnerRevenueEstimate: number
}

interface ApiResponse {
  auction: AuctionDetail
}

interface AuctionDetailContentProps {
  chapterId: string
}

export function AuctionDetailContent({ chapterId }: AuctionDetailContentProps) {
  const { address } = useAccount()
  const [data, setData] = useState<AuctionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPatronConfig, setShowPatronConfig] = useState(false)

  const fetchAuction = useCallback(async () => {
    try {
      const res = await fetch(`/api/auction/${chapterId}`, { cache: 'no-store' })
      const json: ApiResponse = await res.json()
      if (!res.ok) throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`)
      setData(json.auction)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load auction')
    } finally {
      setLoading(false)
    }
  }, [chapterId])

  useEffect(() => {
    fetchAuction()
    const interval = setInterval(fetchAuction, 15_000)
    return () => clearInterval(interval)
  }, [fetchAuction])

  if (loading) return <DetailSkeleton />
  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-error mx-auto" />
        <p className="text-error">{error ?? 'Auction not found'}</p>
        <Link href="/auction" className="text-void-400 hover:text-void-200 transition-colors text-sm">
          ← Back to Auction House
        </Link>
      </div>
    )
  }

  const isWinner =
    address &&
    data.currentBidder?.toLowerCase() === address.toLowerCase() &&
    (data.status === 'won' || data.status === 'settled')

  const isActiveAndOpen = data.status === 'active' && data.msRemaining > 0

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

      {/* Back link */}
      <Link
        href="/auction"
        className="inline-flex items-center gap-2 text-void-400 hover:text-void-200 text-sm transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Auction House
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="px-3 py-1 rounded-full border border-void-700 text-void-400 text-xs font-mono uppercase tracking-widest">
            Chapter {data.chapterNumber}
          </span>
          {data.status === 'active' && (
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="px-3 py-1 rounded-full border border-green-700 text-green-400 text-xs font-ui uppercase tracking-widest"
            >
              ● Live Auction
            </motion.span>
          )}
          {(data.status === 'won' || data.status === 'settled') && (
            <span className="flex items-center gap-1 px-3 py-1 rounded-full border border-gold/40 text-gold text-xs font-ui uppercase tracking-widest">
              <Crown className="w-3 h-3" />
              Patron Claimed
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground">
          {data.title}
        </h1>
        <p className="text-void-400 text-base max-w-2xl leading-relaxed">{data.description}</p>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

        {/* ── Left column ─────────────────────────────────────────────────── */}
        <div className="space-y-8">

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: 'Current Bid',
                value: `$${data.currentBidUsdc.toLocaleString()}`,
                color: 'text-gold',
                icon: Gavel,
              },
              {
                label: 'Bid Count',
                value: data.bidCount.toString(),
                color: 'text-drift-teal',
                icon: TrendingUp,
              },
              {
                label: 'Winner Earns ~',
                value: `$${data.winnerRevenueEstimate.toLocaleString()}`,
                color: 'text-green-400',
                icon: Sparkles,
              },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-void-800 bg-void-950/60 p-4">
                <s.icon className={`w-4 h-4 ${s.color} mb-2`} />
                <div className={`text-xl font-mono font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-void-500 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Countdown */}
          {isActiveAndOpen && (
            <div className="rounded-xl border border-gold/30 bg-gold/5 p-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="text-void-400 text-xs uppercase tracking-wider mb-1 font-ui">Auction closes in</p>
                <AuctionCountdown
                  endsAt={data.auctionEndsAt}
                  onEnded={fetchAuction}
                  className="text-xl"
                />
              </div>
              <div className="text-right text-xs text-void-500">
                Minimum next bid:<br />
                <span className="text-drift-teal font-mono font-bold text-sm">
                  ${data.minimumNextBid.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Winner parameters display */}
          {data.winnerParameters && (
            <div className="rounded-xl border border-gold/30 bg-gold/5 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-gold" />
                <h3 className="text-foreground font-display font-bold">Chapter Parameters</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Genre', value: data.winnerParameters.genre },
                  { label: 'House Spotlight', value: `House ${data.winnerParameters.spotlightHouse}` },
                ].map((p) => (
                  <div key={p.label} className="bg-void-900/50 rounded-lg p-3">
                    <div className="text-[10px] text-void-500 uppercase tracking-wider mb-1">{p.label}</div>
                    <div className="text-foreground font-bold capitalize">{p.value}</div>
                  </div>
                ))}
              </div>

              <div className="bg-void-900/50 rounded-lg p-3">
                <div className="text-[10px] text-void-500 uppercase tracking-wider mb-1">Twist</div>
                <p className="text-void-200 italic">"{data.winnerParameters.twist}"</p>
              </div>

              {data.winnerParameters.customNotes && (
                <div className="bg-void-900/50 rounded-lg p-3">
                  <div className="text-[10px] text-void-500 uppercase tracking-wider mb-1">Patron Notes</div>
                  <p className="text-void-300 text-sm">{data.winnerParameters.customNotes}</p>
                </div>
              )}

              {data.patronNftId && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gold">
                    <Sparkles className="w-4 h-4" />
                    Patron NFT #{data.patronNftId}
                  </div>
                  {data.patronNftTxHash && (
                    <a
                      href={`https://basescan.org/tx/${data.patronNftTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-void-400 hover:text-void-200 transition-colors text-xs"
                    >
                      View on Base
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Winner's configure form */}
          {isWinner && !data.winnerParameters && (
            <div className="rounded-xl border border-gold/40 bg-gold/5 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-gold" />
                  <h3 className="text-gold font-display font-bold">You Are the Patron!</h3>
                </div>
              </div>
              <p className="text-void-300 text-sm">
                Congratulations. You won Chapter {data.chapterNumber}. Configure your chapter parameters below.
              </p>
              <PatronParameters
                chapterNumber={data.chapterNumber}
                onSubmit={(params) => {
                  console.log('Patron parameters submitted:', params)
                  fetchAuction()
                }}
              />
            </div>
          )}

          {/* Bid history */}
          {data.bidHistory.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-void-400" />
                <h3 className="text-foreground font-bold">Bid History</h3>
              </div>
              <div className="space-y-2">
                {data.bidHistory.map((bid, i) => (
                  <motion.div
                    key={`${bid.bidder}-${bid.timestamp}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center justify-between p-3 rounded-lg border text-sm ${
                      i === 0
                        ? 'border-gold/30 bg-gold/5'
                        : 'border-void-800 bg-void-950/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {i === 0 && <Crown className="w-4 h-4 text-gold flex-shrink-0" />}
                      <span className={`font-mono ${i === 0 ? 'text-gold' : 'text-void-300'} truncate max-w-[160px]`}>
                        {bid.ensName ?? bid.bidder}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className={`font-mono font-bold ${i === 0 ? 'text-gold' : 'text-void-200'}`}>
                        ${bid.amount.toLocaleString()}
                      </span>
                      <span className="text-void-600 text-xs">
                        {new Date(bid.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right column: bid form ───────────────────────────────────────── */}
        <div>
          {isActiveAndOpen ? (
            <div className="sticky top-24 rounded-2xl border border-void-700 bg-void-950/80 p-6 space-y-5 backdrop-blur">
              <div className="flex items-center gap-2">
                <Gavel className="w-5 h-5 text-gold" />
                <h2 className="text-foreground font-display font-bold text-lg">Place Your Bid</h2>
              </div>
              <AuctionBidForm
                auction={data}
                minimumNextBid={data.minimumNextBid}
                onBidSuccess={(newAmount) => {
                  setData((prev) =>
                    prev
                      ? {
                          ...prev,
                          currentBidUsdc: newAmount,
                          bidCount: prev.bidCount + 1,
                          currentBidder: address ?? prev.currentBidder,
                        }
                      : prev
                  )
                }}
              />
            </div>
          ) : (
            <div className="sticky top-24 rounded-2xl border border-void-800 bg-void-950/60 p-6 text-center space-y-4">
              <Crown className="w-10 h-10 text-gold mx-auto" />
              <h3 className="text-foreground font-bold font-display">
                {data.status === 'upcoming' ? 'Auction Not Yet Open' : 'Auction Closed'}
              </h3>
              <p className="text-void-400 text-sm">
                {data.status === 'upcoming'
                  ? `Bidding opens ${new Date(data.auctionStartsAt).toLocaleDateString()}`
                  : `Won by ${data.currentBidderEns ?? data.currentBidder ?? 'unknown'} for $${data.currentBidUsdc.toLocaleString()} USDC`}
              </p>
              <Link
                href="/auction"
                className="block text-gold hover:text-gold-light transition-colors text-sm"
              >
                View all auctions →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
      <div className="h-4 w-32 rounded bg-void-900" />
      <div className="space-y-3">
        <div className="h-8 w-64 rounded bg-void-900" />
        <div className="h-4 w-full max-w-lg rounded bg-void-900" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-void-900" />)}
          </div>
          <div className="h-40 rounded-xl bg-void-900" />
        </div>
        <div className="h-80 rounded-2xl bg-void-900" />
      </div>
    </div>
  )
}
