/**
 * House Agent Alignment API
 * POST /api/house-agents/[houseId]/align
 *
 * Records a player's alignment with a House Agent.
 * Aligned players earn 20% of agent winnings for active chapters.
 *
 * Also supports rivalries (isRival=true) — rival players earn
 * bonus when the agent LOSES a bet.
 */

import { NextRequest, NextResponse } from 'next/server'

const VALID_HOUSE_IDS = ['valdris', 'obsidian', 'meridian', 'auric', 'zephyr']

interface AlignmentRequest {
  walletAddress: string
  isRival?: boolean         // true = rival mode (earn when agent loses)
  signedMessage?: string    // optional wallet sig for auth (future feature)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { houseId: string } }
) {
  const { houseId } = params

  // Validate house
  if (!VALID_HOUSE_IDS.includes(houseId)) {
    return NextResponse.json(
      { error: `Unknown house: ${houseId}` },
      { status: 400 }
    )
  }

  let body: AlignmentRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { walletAddress, isRival = false } = body

  // Basic wallet validation
  if (!walletAddress || !/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) {
    return NextResponse.json(
      { error: 'Invalid or missing walletAddress' },
      { status: 400 }
    )
  }

  // TODO: Store alignment in DB (tables: house_agent_alignments)
  // For now, return mock success with computed rewards info
  const mockRewardRate = isRival ? 0.10 : 0.20  // 10% rival, 20% align

  return NextResponse.json({
    success: true,
    alignment: {
      walletAddress,
      houseId,
      isRival,
      rewardRate: mockRewardRate,
      rewardDescription: isRival
        ? `You earn ${(mockRewardRate * 100).toFixed(0)}% of House ${houseId}\'s losses as a bonus`
        : `You earn ${(mockRewardRate * 100).toFixed(0)}% of House ${houseId}\'s winnings on each chapter`,
      alignedAt: new Date().toISOString(),
      activeUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    },
    message: isRival
      ? `You are now a rival of House ${houseId}. May chaos serve you well.`
      : `You are now aligned with House ${houseId}. Share in their glory.`,
  })
}

/**
 * GET /api/house-agents/[houseId]/align
 * Returns current alignment stats for this house.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { houseId: string } }
) {
  const { houseId } = params

  if (!VALID_HOUSE_IDS.includes(houseId)) {
    return NextResponse.json(
      { error: `Unknown house: ${houseId}` },
      { status: 400 }
    )
  }

  // Mock stats (replace with DB query)
  const mockStats = {
    valdris:  { aligned: 847,  rivals: 124 },
    obsidian: { aligned: 1203, rivals: 89  },
    meridian: { aligned: 934,  rivals: 201 },
    auric:    { aligned: 1456, rivals: 67  },
    zephyr:   { aligned: 689,  rivals: 310 },
  }[houseId]

  return NextResponse.json({
    houseId,
    ...mockStats,
    totalEngaged: (mockStats?.aligned ?? 0) + (mockStats?.rivals ?? 0),
    lastUpdated: new Date().toISOString(),
  })
}
