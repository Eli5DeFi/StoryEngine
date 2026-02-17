/**
 * POST /api/insurance/policies
 * Simulate buying an insurance policy (mock — replace with on-chain tx).
 *
 * Body: { eventId, coverage, walletAddress, txHash? }
 * Returns: { policyId, eventId, coverage, premium, expiresAt, message }
 */

import { NextResponse } from 'next/server'
import { getEventById } from '@/lib/insurance-mock-data'
import {
  BuyCoverageRequest,
  BuyCoverageResponse,
  calcPremium,
  InsuranceEventStatus,
} from '@/types/insurance'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body: BuyCoverageRequest = await request.json()
    const { eventId, coverage, walletAddress } = body

    // Validate inputs
    if (!eventId || !coverage || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: eventId, coverage, walletAddress' },
        { status: 400 }
      )
    }

    if (coverage < 100) {
      return NextResponse.json(
        { error: 'Minimum coverage is $100 USDC' },
        { status: 400 }
      )
    }

    if (coverage > 10_000) {
      return NextResponse.json(
        { error: 'Maximum coverage per policy is $10,000 USDC' },
        { status: 400 }
      )
    }

    // Validate event exists and is open
    const event = getEventById(eventId)
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.status !== InsuranceEventStatus.OPEN) {
      return NextResponse.json(
        { error: 'Event is no longer accepting policies' },
        { status: 400 }
      )
    }

    // Check deadline
    if (new Date(event.deadline) <= new Date()) {
      return NextResponse.json(
        { error: 'Insurance event deadline has passed' },
        { status: 400 }
      )
    }

    // Check capacity
    const remainingCapacity = event.maxCoverage - event.totalCoverage
    if (coverage > remainingCapacity) {
      return NextResponse.json(
        { error: `Insufficient capacity. Maximum available: $${remainingCapacity.toLocaleString()}` },
        { status: 400 }
      )
    }

    // Calculate premium
    const premium = calcPremium(coverage, event.premiumRateBps)

    // Generate policy ID (deterministic for demo)
    const policyId = `pol_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const response: BuyCoverageResponse = {
      policyId,
      eventId,
      coverage,
      premium,
      expiresAt: event.deadline,
      message: `Policy purchased: $${coverage.toLocaleString()} coverage for $${premium.toLocaleString()} premium. You will receive $${coverage.toLocaleString()} if "${event.description}" occurs.`,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('[/api/insurance/policies POST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to purchase policy' },
      { status: 500 }
    )
  }
}
