'use client'

/**
 * AuctionCard — Compact card for the Auction House listing.
 *
 * Shows:
 * - Chapter number + title
 * - Status badge (active | upcoming | won | settled)
 * - Current bid + bid count
 * - Countdown for active auctions
 * - Winner info for won/settled auctions
 * - "View Auction" CTA
 */

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Gavel,
  Crown,
  Clock,
  Users,
  ChevronRight,
  Lock,
  Sparkles,
} from 'lucide-react'
import type { ChapterAuction, AuctionStatus } from '@/lib/auction-data'
import { AuctionCountdown } from './AuctionCountdown'

interface AuctionCardProps {
  auction: ChapterAuction
  index?: number
}

const STATUS_CONFIG: Record<
  AuctionStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  active: {
    label: 'LIVE AUCTION',
    color: 'text-green-400 border-green-800 bg-green-950/40',
    icon: Gavel,
  },
  upcoming: {
    label: 'UPCOMING',
    color: 'text-drift-teal border-drift-teal/30 bg-drift-teal/5',
    icon: Clock,
  },
  won: {
    label: 'PATRON CLAIMED',
    color: 'text-gold border-gold/30 bg-gold/5',
    icon: Crown,
  },
  settled: {
    label: 'SETTLED',
    color: 'text-void-400 border-void-700 bg-void-900/40',
    icon: Lock,
  },
}

const GENRE_COLORS: Record<string, string> = {
  Heist: 'bg-blue-900/40 text-blue-300',
  Romance: 'bg-pink-900/40 text-pink-300',
  Horror: 'bg-red-900/40 text-red-300',
  War: 'bg-orange-900/40 text-orange-300',
  Mystery: 'bg-purple-900/40 text-purple-300',
  Revelation: 'bg-gold/10 text-gold',
}

export function AuctionCard({ auction, index = 0 }: AuctionCardProps) {
  const config = STATUS_CONFIG[auction.status]
  const StatusIcon = config.icon
  const isActive = auction.status === 'active'
  const hasWinner = auction.status === 'won' || auction.status === 'settled'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 180, damping: 20 }}
      className={`relative rounded-2xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 ${
        isActive
          ? 'border-gold/40 bg-gradient-to-br from-void-900/80 to-gold/5'
          : 'border-void-800 bg-void-950/60'
      }`}
    >
      {/* Active glow pulse */}
      {isActive && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none">
          <motion.div
            className="absolute inset-0 rounded-2xl border border-gold/30"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
          />
        </div>
      )}

      <div className="relative p-5 sm:p-6 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-void-500 font-mono uppercase tracking-widest mb-1">
              Blank Chapter #{Math.floor(auction.chapterNumber / 10)} · Ch. {auction.chapterNumber}
            </div>
            <h3 className="text-foreground font-display font-bold text-lg leading-snug">
              {auction.title}
            </h3>
          </div>

          {/* Status badge */}
          <span
            className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-ui uppercase tracking-wider ${config.color}`}
          >
            <StatusIcon className="w-3 h-3" />
            {config.label}
          </span>
        </div>

        {/* Description */}
        <p className="text-void-400 text-sm leading-relaxed line-clamp-2">
          {auction.description}
        </p>

        {/* Winner parameters (if won/settled) */}
        {hasWinner && auction.winnerParameters && (
          <div className="flex flex-wrap gap-2">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-ui ${
                GENRE_COLORS[auction.winnerParameters.genre] ?? 'bg-void-800 text-void-300'
              }`}
            >
              {auction.winnerParameters.genre}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-ui bg-void-800 text-void-300 capitalize">
              House {auction.winnerParameters.spotlightHouse}
            </span>
            {auction.patronNftId && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-ui bg-gold/10 text-gold">
                <Sparkles className="w-3 h-3" />
                Patron NFT #{auction.patronNftId}
              </span>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          <div>
            <div className="text-[10px] text-void-500 uppercase tracking-wider mb-0.5">Top Bid</div>
            <div className={`font-mono font-bold text-sm ${isActive ? 'text-gold' : 'text-void-200'}`}>
              ${auction.currentBidUsdc.toLocaleString()}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-void-500 uppercase tracking-wider mb-0.5">Bids</div>
            <div className="flex items-center gap-1 text-void-300 text-sm">
              <Users className="w-3 h-3 text-void-500" />
              {auction.bidCount}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-void-500 uppercase tracking-wider mb-0.5">
              {hasWinner ? 'Patron Earns' : 'Pool Est.'}
            </div>
            <div className="text-drift-teal font-mono text-sm font-bold">
              ${Math.floor(auction.estimatedBetPool * 0.1).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Countdown or winner info */}
        <div className="flex items-center justify-between pt-1 border-t border-void-800">
          {isActive ? (
            <AuctionCountdown endsAt={auction.auctionEndsAt} />
          ) : auction.status === 'upcoming' ? (
            <div className="flex items-center gap-2 text-drift-teal text-sm font-ui">
              <Clock className="w-4 h-4" />
              <span>Opens in {Math.ceil((auction.auctionStartsAt - Date.now()) / 86_400_000)}d</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-void-400 text-sm font-ui">
              <Crown className="w-4 h-4 text-gold" />
              <span className="font-mono truncate max-w-[150px]">
                {auction.currentBidderEns ?? auction.currentBidder}
              </span>
            </div>
          )}

          <Link
            href={`/auction/${auction.chapterNumber}`}
            className={`flex items-center gap-1 text-sm font-ui transition-colors group ${
              isActive
                ? 'text-gold hover:text-gold-light'
                : 'text-void-400 hover:text-void-200'
            }`}
          >
            {isActive ? 'Bid Now' : 'View'}
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
