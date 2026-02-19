/**
 * Guild Detail API — /api/guilds/[guildId]
 *
 * GET /api/guilds/[guildId] — Full guild profile with members, wars, territory
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import type { GuildDetailProfile } from '@/lib/guilds'

export const revalidate = 30

// ─── Mock extended guild data ────────────────────────────────────────────────

const MOCK_GUILD_DETAILS: Record<string, GuildDetailProfile> = {
  guild_valdris_throne: {
    id: 'guild_valdris_throne',
    name: 'The Eternal Guard',
    tag: '[ETG]',
    description:
      'First-formed. Never-broken. We hold the line so the narrative bends toward order. House Valdris demands excellence — join only if you can maintain a 60%+ win rate.',
    house: 'valdris',
    tier: 'gold',
    score: 9420,
    totalScore: 84200,
    memberCount: 48,
    maxMembers: 50,
    treasuryBalanceUsdc: 14250,
    totalWageredUsdc: 98400,
    winRate: 64.2,
    territoriesHeld: 2,
    totalTerritories: 6,
    isRecruiting: true,
    founderAddress: '0x9f8e7d6c5b4a3210fedcba9876543210abcdef01',
    founderUsername: 'VoidWarden',
    agenda: 'Chapter 47: House Valdris discovers the Null Relic before it is weaponized.',
    createdAt: '2026-01-15T08:00:00Z',
    lastActivityAt: '2026-02-19T06:42:00Z',
    warRecord: { wins: 12, losses: 3, draws: 2 },
    houseColorHex: '#8b7ab8',
    houseAccentHex: '#c4b5fd',
    emoji: '👑',
    members: [
      {
        walletAddress: '0x9f8e7d6c5b4a3210fedcba9876543210abcdef01',
        username: 'VoidWarden',
        role: 'leader',
        contributedUsdc: 4200,
        winRate: 71.3,
        joinedAt: '2026-01-15T08:00:00Z',
        shareWeight: 8.5,
      },
      {
        walletAddress: '0xabc123...def456',
        username: 'SilverThread',
        role: 'officer',
        contributedUsdc: 2100,
        winRate: 68.7,
        joinedAt: '2026-01-16T10:00:00Z',
        shareWeight: 4.2,
      },
      {
        walletAddress: '0xfed987...cba654',
        username: 'ThroneKeeper',
        role: 'officer',
        contributedUsdc: 1850,
        winRate: 65.0,
        joinedAt: '2026-01-17T12:00:00Z',
        shareWeight: 3.7,
      },
      {
        walletAddress: '0x123abc...789def',
        username: 'OrderBound',
        role: 'member',
        contributedUsdc: 900,
        winRate: 62.1,
        joinedAt: '2026-01-20T09:00:00Z',
        shareWeight: 1.8,
      },
      {
        walletAddress: '0x456def...012abc',
        username: 'ValdrisFang',
        role: 'member',
        contributedUsdc: 750,
        winRate: 60.5,
        joinedAt: '2026-01-22T14:00:00Z',
        shareWeight: 1.5,
      },
    ],
    recentWars: [
      {
        id: 'war_001',
        opponentGuildId: 'guild_null_void',
        opponentGuildName: 'The Void Prophets',
        opponentHouse: 'null',
        outcome: 'won',
        ourScore: 4200,
        theirScore: 1800,
        startedAt: '2026-02-10T00:00:00Z',
        endedAt: '2026-02-14T23:59:00Z',
        battleChapters: [41, 42, 43],
      },
      {
        id: 'war_002',
        opponentGuildId: 'guild_obsidian_veil',
        opponentGuildName: 'The Shroud Collective',
        opponentHouse: 'obsidian',
        outcome: 'won',
        ourScore: 3800,
        theirScore: 3100,
        startedAt: '2026-01-28T00:00:00Z',
        endedAt: '2026-02-01T23:59:00Z',
        battleChapters: [37, 38],
      },
      {
        id: 'war_003',
        opponentGuildId: 'guild_aurelius_coin',
        opponentGuildName: 'The Golden Ledger',
        opponentHouse: 'aurelius',
        outcome: 'lost',
        ourScore: 5100,
        theirScore: 5600,
        startedAt: '2026-01-20T00:00:00Z',
        endedAt: '2026-01-25T23:59:00Z',
        battleChapters: [33, 34, 35],
      },
    ],
    territory: [
      {
        sectorId: 'sector_core',
        sectorName: 'Void Core',
        controllerGuildId: 'guild_valdris_throne',
        yieldPerChapterUsdc: 120,
        capturedAt: '2026-02-05T00:00:00Z',
        defenseStrength: 87,
      },
      {
        sectorId: 'sector_thread_nexus',
        sectorName: 'Thread Nexus',
        controllerGuildId: 'guild_valdris_throne',
        yieldPerChapterUsdc: 80,
        capturedAt: '2026-02-12T00:00:00Z',
        defenseStrength: 72,
      },
    ],
    topBets: [
      {
        chapterTitle: 'Chapter 44 — The Fraying Accord',
        choiceText: 'House Valdris refuses the alliance — honor demands it',
        amountUsdc: 1200,
        outcome: 'won',
        payoutUsdc: 2340,
        placedAt: '2026-02-16T14:00:00Z',
      },
      {
        chapterTitle: 'Chapter 43 — Silent Chambers',
        choiceText: 'The Heir reveals the Stitch location to the Conclave',
        amountUsdc: 900,
        outcome: 'won',
        payoutUsdc: 1620,
        placedAt: '2026-02-12T10:00:00Z',
      },
      {
        chapterTitle: 'Chapter 42 — Null Tide',
        choiceText: 'Mobilize all House forces immediately',
        amountUsdc: 800,
        outcome: 'lost',
        payoutUsdc: null,
        placedAt: '2026-02-08T09:00:00Z',
      },
    ],
  },
}

// ─── GET /api/guilds/[guildId] ───────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { guildId: string } }
) {
  try {
    const { guildId } = params
    const guild = MOCK_GUILD_DETAILS[guildId]

    if (!guild) {
      return NextResponse.json({ error: 'Guild not found' }, { status: 404 })
    }

    return NextResponse.json({ guild })
  } catch (err) {
    logger.error('GET /api/guilds/[guildId]', err)
    return NextResponse.json({ error: 'Failed to fetch guild' }, { status: 500 })
  }
}
