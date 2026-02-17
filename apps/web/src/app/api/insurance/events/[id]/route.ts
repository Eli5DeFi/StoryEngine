/**
 * GET /api/insurance/events/[id]
 * Returns a single insurance event with full details.
 */

import { NextResponse } from 'next/server'
import { getEventById } from '@/lib/insurance-mock-data'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const event = getEventById(params.id)

    if (!event) {
      return NextResponse.json(
        { error: 'Insurance event not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error('[/api/insurance/events/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch insurance event' },
      { status: 500 }
    )
  }
}
