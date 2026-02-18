/**
 * Chapter Auction House — Place Bid
 * Route: POST /api/auction/[chapterId]/bid
 *
 * Validates and records a new bid on a blank chapter auction.
 * In production: calls the AuctionHouse smart contract via a relayer,
 * deducts USDC from bidder's wallet, refunds previous highest bidder.
 *
 * Body: { bidder: string, amountUsdc: number, txHash?: string }
 * Returns: { success: boolean, newBid: AuctionBid, auction: ChapterAuction }
 */

import { NextRequest, NextResponse } from 'next/server'
import { MOCK_AUCTIONS, type AuctionBid } from '@/lib/auction-data'
import { logger } from '@/lib/logger'

export async function POST(
  req: NextRequest,
  { params }: { params: { chapterId: string } }
) {
  try {
    const chapterNum = parseInt(params.chapterId, 10)
    const body = await req.json()
    const { bidder, amountUsdc, txHash } = body as {
      bidder?: string
      amountUsdc?: number
      txHash?: string
    }

    // ── Validation ─────────────────────────────────────────────────────────
    if (!bidder || typeof bidder !== 'string') {
      return NextResponse.json({ error: 'Missing bidder address' }, { status: 400 })
    }
    if (!amountUsdc || typeof amountUsdc !== 'number' || amountUsdc <= 0) {
      return NextResponse.json({ error: 'Invalid bid amount' }, { status: 400 })
    }

    const auctionIdx = MOCK_AUCTIONS.findIndex((a) => a.chapterNumber === chapterNum)
    if (auctionIdx === -1) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
    }

    const auction = MOCK_AUCTIONS[auctionIdx]

    // ── State checks ───────────────────────────────────────────────────────
    if (auction.status !== 'active') {
      return NextResponse.json(
        { error: `Auction is ${auction.status}, not active` },
        { status: 409 }
      )
    }
    if (Date.now() > auction.auctionEndsAt) {
      return NextResponse.json({ error: 'Auction has ended' }, { status: 409 })
    }

    const minimumBid = Math.floor(auction.currentBidUsdc * 1.05)
    if (amountUsdc < minimumBid) {
      return NextResponse.json(
        {
          error: `Bid must be at least ${minimumBid} USDC (5% above current bid)`,
          minimumBid,
        },
        { status: 422 }
      )
    }

    // ── Record bid (mock — replace with DB + contract call in prod) ────────
    const newBid: AuctionBid = {
      bidder,
      amount: amountUsdc,
      timestamp: Date.now(),
      txHash: txHash ?? `0xmock_${Date.now().toString(16)}`,
    }

    // Mutate mock in-memory (in production: write to DB + emit onchain event)
    MOCK_AUCTIONS[auctionIdx] = {
      ...auction,
      currentBidUsdc: amountUsdc,
      currentBidder: bidder,
      bidCount: auction.bidCount + 1,
      bidHistory: [newBid, ...auction.bidHistory].slice(0, 50),
    }

    logger.log(`[CAH] New bid: Chapter ${chapterNum} | ${bidder} | $${amountUsdc} USDC`)

    return NextResponse.json(
      {
        success: true,
        newBid,
        auction: MOCK_AUCTIONS[auctionIdx],
        message: `Bid of $${amountUsdc.toLocaleString()} USDC recorded. You're the highest bidder!`,
      },
      { status: 201 }
    )
  } catch (err) {
    logger.error('[/api/auction/bid] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
