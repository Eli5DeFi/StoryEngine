/**
 * GET /api/insurance/stats
 * Returns platform-wide insurance statistics.
 */

import { NextResponse } from 'next/server'
import { MOCK_STATS } from '@/lib/insurance-mock-data'

export const dynamic = 'force-dynamic'
export const revalidate = 60 // Cache for 60 seconds

export async function GET() {
  try {
    return NextResponse.json(MOCK_STATS)
  } catch (error) {
    console.error('[/api/insurance/stats] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch insurance stats' },
      { status: 500 }
    )
  }
}
