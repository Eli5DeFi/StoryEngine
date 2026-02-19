/**
 * Join Guild API — POST /api/guilds/[guildId]/join
 *
 * Validates wallet address and adds member to guild.
 * In production: DB insert + on-chain registration.
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function POST(
  req: NextRequest,
  { params }: { params: { guildId: string } }
) {
  try {
    const { guildId } = params
    const body = await req.json()
    const { walletAddress } = body

    if (!walletAddress || !/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: 'Valid wallet address required' },
        { status: 400 }
      )
    }

    if (!guildId) {
      return NextResponse.json({ error: 'Guild ID required' }, { status: 400 })
    }

    // In production: check if guild exists, check capacity, insert guild_members row
    logger.info('Guild join request (mock)', { guildId, walletAddress })

    return NextResponse.json({
      success: true,
      message: 'Successfully joined guild',
      guildId,
      walletAddress,
      role: 'member',
      joinedAt: new Date().toISOString(),
    })
  } catch (err) {
    logger.error('POST /api/guilds/[guildId]/join', err)
    return NextResponse.json({ error: 'Failed to join guild' }, { status: 500 })
  }
}
