/**
 * GET /api/insurance/events
 * Returns active and historical narrative insurance events.
 *
 * Query params:
 *  - status: 'OPEN' | 'SETTLED_OCCURRED' | 'SETTLED_DID_NOT_OCCUR' (default: OPEN)
 *  - storyId: filter by story
 *  - page: pagination (default: 1)
 *  - limit: results per page (default: 20)
 */

import { NextResponse } from 'next/server'
import { MOCK_EVENTS } from '@/lib/insurance-mock-data'
import { InsuranceEventStatus } from '@/types/insurance'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    const storyId = searchParams.get('storyId')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50)

    let events = [...MOCK_EVENTS]

    // Filter by status (default: show all OPEN events)
    if (statusFilter) {
      events = events.filter((e) => e.status === statusFilter)
    } else {
      events = events.filter((e) => e.status === InsuranceEventStatus.OPEN)
    }

    // Filter by story
    if (storyId) {
      events = events.filter((e) => e.storyId === storyId)
    }

    // Sort: highest coverage first (most popular)
    events.sort((a, b) => b.totalCoverage - a.totalCoverage)

    // Paginate
    const total = events.length
    const start = (page - 1) * limit
    const paginated = events.slice(start, start + limit)

    return NextResponse.json({
      events: paginated,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('[/api/insurance/events] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch insurance events' },
      { status: 500 }
    )
  }
}
