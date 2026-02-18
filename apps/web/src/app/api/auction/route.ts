/**
 * Chapter Auction House (CAH) — Auction List API
 * Innovation Cycle #51 — "The Emergent Theater"
 * Route: GET /api/auction
 *
 * Returns all chapter auctions — upcoming, active, and settled.
 * Every 10th chapter is a "Blank Chapter" auctioned to the highest bidder.
 * The winner earns:
 *   - Narrative authorship rights (genre, House spotlight, twist)
 *   - Patron NFT (on-chain provenance)
 *   - 10% of all bets placed on that chapter
 *
 * In production: queries the AuctionHouse smart contract + Prisma DB.
 */

import { NextResponse } from 'next/server'
import { MOCK_AUCTIONS } from '@/lib/auction-data'

export const revalidate = 30 // ISR: refresh every 30s

export async function GET() {
  try {
    const auctions = MOCK_AUCTIONS

    const summary = {
      activeAuctions: auctions.filter((a) => a.status === 'active').length,
      upcomingAuctions: auctions.filter((a) => a.status === 'upcoming').length,
      totalPatrons: auctions.filter((a) => a.status === 'won' || a.status === 'settled').length,
      totalBidVolume: auctions.reduce((acc, a) => acc + a.currentBidUsdc, 0),
      highestBid: Math.max(...auctions.map((a) => a.currentBidUsdc)),
      totalWinnerRevenue: auctions
        .filter((a) => a.status === 'settled')
        .reduce((acc, a) => acc + Math.floor(a.estimatedBetPool * 0.1), 0),
    }

    return NextResponse.json({ auctions, summary }, { status: 200 })
  } catch (err) {
    console.error('[/api/auction] Error:', err)
    return NextResponse.json({ error: 'Failed to fetch auctions' }, { status: 500 })
  }
}
