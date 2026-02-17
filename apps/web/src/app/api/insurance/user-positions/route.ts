/**
 * GET /api/insurance/user-positions?address=0x...
 * Returns all policies and stakes for a given wallet address.
 */

import { NextResponse } from 'next/server'
import { DEMO_POLICIES, DEMO_STAKES, getEventById } from '@/lib/insurance-mock-data'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const address = searchParams.get('address')

    if (!address) {
      return NextResponse.json(
        { error: 'Missing required query param: address' },
        { status: 400 }
      )
    }

    // In production: query Prisma for real user policies/stakes.
    // For demo: return mock data when any address is passed.
    const policies = DEMO_POLICIES.map((p) => ({
      ...p,
      event: getEventById(p.eventId),
    }))

    const stakes = DEMO_STAKES.map((s) => ({
      ...s,
      event: getEventById(s.eventId),
    }))

    const totalCoverageOwned = policies.reduce((sum, p) => sum + p.coverage, 0)
    const totalPremiumsPaid = policies.reduce((sum, p) => sum + p.premium, 0)
    const totalStaked = stakes.reduce((sum, s) => sum + s.staked, 0)
    const totalEarned = stakes.reduce((sum, s) => sum + s.earnedPremiums, 0)

    return NextResponse.json({
      policies,
      stakes,
      totalCoverageOwned,
      totalPremiumsPaid,
      totalStaked,
      totalEarned,
    })
  } catch (error) {
    console.error('[/api/insurance/user-positions] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user positions' },
      { status: 500 }
    )
  }
}
