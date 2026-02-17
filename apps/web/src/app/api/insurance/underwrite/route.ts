/**
 * POST /api/insurance/underwrite
 * Simulate staking capital as an underwriter (mock — replace with on-chain tx).
 *
 * Body: { eventId, amount, walletAddress, txHash? }
 * Returns: { stakeId, eventId, staked, estimatedAPY, message }
 */

import { NextResponse } from 'next/server'
import { getEventById } from '@/lib/insurance-mock-data'
import {
  UnderwriteRequest,
  UnderwriteResponse,
  InsuranceEventStatus,
} from '@/types/insurance'

export const dynamic = 'force-dynamic'

/** Estimate APY based on premium rate and pool utilization */
function estimateAPY(premiumRateBps: number, utilizationRatio: number): number {
  // Base APY = premium rate (annualized over avg 30-day event)
  // multiplied by utilization ratio (how much of the pool is needed)
  const baseAPY = (premiumRateBps / 100) * 12 // Monthly → Annual
  const utilizationBonus = utilizationRatio * 20 // Up to 20% extra at 100% utilization
  return Math.min(Math.round(baseAPY + utilizationBonus), 400) // Cap at 400% APY
}

export async function POST(request: Request) {
  try {
    const body: UnderwriteRequest = await request.json()
    const { eventId, amount, walletAddress } = body

    // Validate inputs
    if (!eventId || !amount || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: eventId, amount, walletAddress' },
        { status: 400 }
      )
    }

    if (amount < 500) {
      return NextResponse.json(
        { error: 'Minimum underwriting stake is $500 USDC' },
        { status: 400 }
      )
    }

    if (amount > 100_000) {
      return NextResponse.json(
        { error: 'Maximum underwriting stake is $100,000 USDC per position' },
        { status: 400 }
      )
    }

    // Validate event
    const event = getEventById(eventId)
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.status !== InsuranceEventStatus.OPEN) {
      return NextResponse.json(
        { error: 'Event is no longer accepting underwriters' },
        { status: 400 }
      )
    }

    if (new Date(event.deadline) <= new Date()) {
      return NextResponse.json(
        { error: 'Insurance event deadline has passed' },
        { status: 400 }
      )
    }

    // Calculate estimated APY
    const utilizationRatio =
      event.underwriterPool > 0
        ? Math.min(event.totalCoverage / event.underwriterPool, 1)
        : 0.5
    const estimatedAPY = estimateAPY(event.premiumRateBps, utilizationRatio)

    // Generate stake ID
    const stakeId = `stake_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const response: UnderwriteResponse = {
      stakeId,
      eventId,
      staked: amount,
      estimatedAPY,
      message: `Staked $${amount.toLocaleString()} USDC. Estimated APY: ${estimatedAPY}%. You earn premiums if "${event.characterName}" survives. Your capital backs payouts if they don't.`,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('[/api/insurance/underwrite POST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to stake capital' },
      { status: 500 }
    )
  }
}
