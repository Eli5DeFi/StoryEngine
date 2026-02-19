/**
 * Chapter Auction House — Single Auction API
 * Route: GET /api/auction/[chapterId]
 *
 * Returns detailed data for a specific chapter auction, including
 * full bid history, winner parameters, and revenue share estimates.
 */

import { NextRequest, NextResponse } from 'next/server'
import { MOCK_AUCTIONS } from '@/lib/auction-data'

export const revalidate = 15

export async function GET(
  _req: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  const chapterNum = parseInt(params.chapterId, 10)

  if (isNaN(chapterNum) || chapterNum <= 0) {
    return NextResponse.json({ error: 'Invalid chapter number' }, { status: 400 })
  }

  const auction = MOCK_AUCTIONS.find((a) => a.chapterNumber === chapterNum)

  if (!auction) {
    return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
  }

  const now = Date.now()
  const msRemaining = Math.max(0, auction.auctionEndsAt - now)
  const hoursRemaining = msRemaining / 3_600_000
  const isLive = auction.status === 'active' && msRemaining > 0
  const minimumNextBid = Math.floor(auction.currentBidUsdc * 1.05) // 5% minimum raise

  return NextResponse.json(
    {
      auction: {
        ...auction,
        msRemaining,
        hoursRemaining: +hoursRemaining.toFixed(2),
        isLive,
        minimumNextBid,
        winnerRevenueEstimate: Math.floor(auction.estimatedBetPool * 0.1),
      },
    },
    { status: 200 }
  )
}
