/**
 * Chapter Auction House — Shared Data & Types
 * Innovation Cycle #51: "The Emergent Theater"
 *
 * Centralised types and mock data for the CAH feature.
 * In production, replace MOCK_AUCTIONS with Prisma DB queries.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuctionBid {
  bidder: string
  amount: number       // USDC (6 decimals, stored as float for display)
  timestamp: number    // Unix ms
  txHash?: string
  ensName?: string
}

export type AuctionStatus = 'upcoming' | 'active' | 'won' | 'settled'

export interface PatronParameters {
  genre: 'Heist' | 'Romance' | 'Horror' | 'War' | 'Mystery' | 'Revelation'
  spotlightHouse: 'valdris' | 'obsidian' | 'meridian' | 'solace' | 'void'
  twist: string
  customNotes?: string
}

export interface ChapterAuction {
  auctionId: string
  chapterNumber: number      // Always a multiple of 10
  title: string
  description: string
  status: AuctionStatus
  startBidUsdc: number       // 1,000 USDC minimum
  currentBidUsdc: number
  currentBidder?: string     // wallet address
  currentBidderEns?: string
  auctionStartsAt: number    // Unix ms
  auctionEndsAt: number      // Unix ms
  bidCount: number
  bidHistory: AuctionBid[]
  // Winner extras (only populated when status === 'won' | 'settled')
  patronNftId?: number
  patronNftTxHash?: string
  winnerParameters?: PatronParameters
  // Revenue share
  estimatedBetPool: number   // USDC — 10% goes to winner
  winnerSharePct: number     // 10
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const NOW = Date.now()
const HOUR = 3_600_000
const DAY = 86_400_000

/** In-memory store (mutable for bid simulation). Replace with DB in production. */
export const MOCK_AUCTIONS: ChapterAuction[] = [
  // ── Active: Chapter 50 (current blank chapter) ─────────────────────────────
  {
    auctionId: 'auction-ch50',
    chapterNumber: 50,
    title: 'Blank Chapter #5 — The Grand Silence',
    description:
      'The Conclave enters a historic recess. What fills the void? The highest bidder commands the narrative.',
    status: 'active',
    startBidUsdc: 1_000,
    currentBidUsdc: 6_250,
    currentBidder: '0xAb3f...f7d2',
    currentBidderEns: 'voidpatrон.eth',
    auctionStartsAt: NOW - 30 * HOUR,
    auctionEndsAt: NOW + 18 * HOUR,
    bidCount: 14,
    bidHistory: [
      { bidder: '0xAb3f...f7d2', amount: 6_250, timestamp: NOW - 2 * HOUR, txHash: '0xabc...1' },
      { bidder: '0x9f1a...c3e5', amount: 5_800, timestamp: NOW - 4 * HOUR, txHash: '0xabc...2' },
      { bidder: '0xBe7c...d1a9', amount: 4_400, timestamp: NOW - 8 * HOUR, txHash: '0xabc...3' },
      { bidder: '0xDef0...2233', amount: 3_100, timestamp: NOW - 12 * HOUR, txHash: '0xabc...4' },
      { bidder: '0x7712...ee44', amount: 2_000, timestamp: NOW - 20 * HOUR, txHash: '0xabc...5' },
      { bidder: '0xAb3f...f7d2', amount: 1_500, timestamp: NOW - 25 * HOUR, txHash: '0xabc...6' },
      { bidder: '0x9f1a...c3e5', amount: 1_000, timestamp: NOW - 29 * HOUR, txHash: '0xabc...7' },
    ],
    estimatedBetPool: 94_000,
    winnerSharePct: 10,
  },
  // ── Upcoming: Chapter 60 ───────────────────────────────────────────────────
  {
    auctionId: 'auction-ch60',
    chapterNumber: 60,
    title: 'Blank Chapter #6 — The Unwritten War',
    description:
      'Ten chapters hence, the story reaches another inflection point. The Patron of Chapter 60 will define the battlefield.',
    status: 'upcoming',
    startBidUsdc: 1_000,
    currentBidUsdc: 1_000,
    auctionStartsAt: NOW + 10 * DAY,
    auctionEndsAt: NOW + 12 * DAY,
    bidCount: 0,
    bidHistory: [],
    estimatedBetPool: 0,
    winnerSharePct: 10,
  },
  // ── Won: Chapter 40 ───────────────────────────────────────────────────────
  {
    auctionId: 'auction-ch40',
    chapterNumber: 40,
    title: 'Blank Chapter #4 — The Betrayal at Meridian Keep',
    description:
      "A dark chapter commissioned by 'the_oracle.eth' — who chose Horror + House Obsidian spotlight + \"The highest ally reveals the deepest wound.\"",
    status: 'won',
    startBidUsdc: 1_000,
    currentBidUsdc: 8_900,
    currentBidder: '0xFf82...991b',
    currentBidderEns: 'the_oracle.eth',
    auctionStartsAt: NOW - 15 * DAY,
    auctionEndsAt: NOW - 13 * DAY,
    bidCount: 23,
    bidHistory: [
      { bidder: '0xFf82...991b', amount: 8_900, timestamp: NOW - 13 * DAY, ensName: 'the_oracle.eth' },
      { bidder: '0x4412...8d3c', amount: 8_200, timestamp: NOW - 13.1 * DAY },
      { bidder: '0xFf82...991b', amount: 7_500, timestamp: NOW - 13.5 * DAY, ensName: 'the_oracle.eth' },
    ],
    estimatedBetPool: 127_400,
    winnerSharePct: 10,
    patronNftId: 4,
    patronNftTxHash: '0xdeadbeef...4040',
    winnerParameters: {
      genre: 'Horror',
      spotlightHouse: 'obsidian',
      twist: 'The highest ally reveals the deepest wound.',
      customNotes: 'Make it bleak. No false hope.',
    },
  },
  // ── Settled: Chapter 30 ───────────────────────────────────────────────────
  {
    auctionId: 'auction-ch30',
    chapterNumber: 30,
    title: 'Blank Chapter #3 — The Solace Gambit',
    description: "A masterwork of political romance commissioned by 'voidborn-dao.eth'.",
    status: 'settled',
    startBidUsdc: 1_000,
    currentBidUsdc: 5_400,
    currentBidder: '0x2234...7a9f',
    currentBidderEns: 'voidborn-dao.eth',
    auctionStartsAt: NOW - 30 * DAY,
    auctionEndsAt: NOW - 28 * DAY,
    bidCount: 11,
    bidHistory: [
      { bidder: '0x2234...7a9f', amount: 5_400, timestamp: NOW - 28 * DAY, ensName: 'voidborn-dao.eth' },
    ],
    estimatedBetPool: 83_000,
    winnerSharePct: 10,
    patronNftId: 3,
    patronNftTxHash: '0xdeadbeef...3030',
    winnerParameters: {
      genre: 'Romance',
      spotlightHouse: 'solace',
      twist: 'A forbidden union is proposed — and accepted.',
    },
  },
  // ── Settled: Chapter 20 ───────────────────────────────────────────────────
  {
    auctionId: 'auction-ch20',
    chapterNumber: 20,
    title: 'Blank Chapter #2 — The Heist at Senate Tower',
    description: "An action-packed chapter defined by 'meridian-prime.eth'.",
    status: 'settled',
    startBidUsdc: 1_000,
    currentBidUsdc: 4_100,
    currentBidder: '0x9988...cc11',
    currentBidderEns: 'meridian-prime.eth',
    auctionStartsAt: NOW - 45 * DAY,
    auctionEndsAt: NOW - 43 * DAY,
    bidCount: 8,
    bidHistory: [
      { bidder: '0x9988...cc11', amount: 4_100, timestamp: NOW - 43 * DAY, ensName: 'meridian-prime.eth' },
    ],
    estimatedBetPool: 61_200,
    winnerSharePct: 10,
    patronNftId: 2,
    patronNftTxHash: '0xdeadbeef...2020',
    winnerParameters: {
      genre: 'Heist',
      spotlightHouse: 'meridian',
      twist: 'The stolen artifact was never the real prize.',
    },
  },
  // ── Settled: Chapter 10 ───────────────────────────────────────────────────
  {
    auctionId: 'auction-ch10',
    chapterNumber: 10,
    title: 'Blank Chapter #1 — The First Void Crossing',
    description: "The inaugural Blank Chapter. Commissioned by 'voidpioneer.eth'.",
    status: 'settled',
    startBidUsdc: 1_000,
    currentBidUsdc: 2_200,
    currentBidder: '0x1234...abcd',
    currentBidderEns: 'voidpioneer.eth',
    auctionStartsAt: NOW - 60 * DAY,
    auctionEndsAt: NOW - 58 * DAY,
    bidCount: 5,
    bidHistory: [
      { bidder: '0x1234...abcd', amount: 2_200, timestamp: NOW - 58 * DAY, ensName: 'voidpioneer.eth' },
    ],
    estimatedBetPool: 32_800,
    winnerSharePct: 10,
    patronNftId: 1,
    patronNftTxHash: '0xdeadbeef...1010',
    winnerParameters: {
      genre: 'Mystery',
      spotlightHouse: 'void',
      twist: 'The Void Gate is not a place — it is a person.',
    },
  },
]
