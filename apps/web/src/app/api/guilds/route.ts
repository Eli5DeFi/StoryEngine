/**
 * Guilds API — Innovation Cycle #52 "The Faction War Engine"
 *
 * GET  /api/guilds  — List all guilds (filterable by house/tier/recruiting/sort)
 * POST /api/guilds  — Create a new guild
 *
 * Uses mock data until Guild DB migration is applied.
 * Mirrors /api/house-agents pattern (ISR 60s).
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import {
  HOUSE_META,
  type HouseAlignment,
  type GuildTier,
  type GuildPublicProfile,
} from '@/lib/guilds'

export const revalidate = 60

// ─── Mock guild data ─────────────────────────────────────────────────────────

const MOCK_GUILDS: GuildPublicProfile[] = [
  {
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
  },
  {
    id: 'guild_obsidian_veil',
    name: 'The Shroud Collective',
    tag: '[VEIL]',
    description:
      'We operate in the dark. Our bets are hidden until resolution. Join if you enjoy information asymmetry and contrarian plays against the crowd.',
    house: 'obsidian',
    tier: 'silver',
    score: 7130,
    totalScore: 52600,
    memberCount: 31,
    maxMembers: 50,
    treasuryBalanceUsdc: 8900,
    totalWageredUsdc: 62300,
    winRate: 58.7,
    territoriesHeld: 1,
    totalTerritories: 6,
    isRecruiting: true,
    founderAddress: '0x1a2b3c4d5e6f7890abcdef1234567890fedcba98',
    founderUsername: 'NullShadow',
    createdAt: '2026-01-22T11:00:00Z',
    lastActivityAt: '2026-02-19T05:15:00Z',
    warRecord: { wins: 7, losses: 5, draws: 1 },
    houseColorHex: '#334155',
    houseAccentHex: '#94a3b8',
    emoji: '🌑',
  },
  {
    id: 'guild_aurelius_coin',
    name: 'The Golden Ledger',
    tag: '[GLDG]',
    description:
      'We treat the narrative like a market. Every choice has a price. Our treasury compounds through disciplined collective betting and yield optimization.',
    house: 'aurelius',
    tier: 'gold',
    score: 8560,
    totalScore: 71400,
    memberCount: 42,
    maxMembers: 50,
    treasuryBalanceUsdc: 22100,
    totalWageredUsdc: 145000,
    winRate: 61.3,
    territoriesHeld: 2,
    totalTerritories: 6,
    isRecruiting: false,
    founderAddress: '0xabcdef1234567890fedcba9876543210abcdef12',
    founderUsername: 'AureliusPrime',
    createdAt: '2026-01-18T09:30:00Z',
    lastActivityAt: '2026-02-18T23:55:00Z',
    warRecord: { wins: 10, losses: 4, draws: 3 },
    houseColorHex: '#d4a853',
    houseAccentHex: '#fde68a',
    emoji: '⚖️',
  },
  {
    id: 'guild_strand_weavers',
    name: 'The Thread Council',
    tag: '[THRD]',
    description:
      'We study the pattern. Every chapter choice ripples through 10 more. Long-range bettors, temporal oracle holders, and lore scholars welcome.',
    house: 'strand',
    tier: 'silver',
    score: 6890,
    totalScore: 44100,
    memberCount: 27,
    maxMembers: 50,
    treasuryBalanceUsdc: 6400,
    totalWageredUsdc: 38700,
    winRate: 56.8,
    territoriesHeld: 1,
    totalTerritories: 6,
    isRecruiting: true,
    founderAddress: '0x2345678901234567890123456789012345678901',
    founderUsername: 'StrandKeeper',
    createdAt: '2026-01-28T14:00:00Z',
    lastActivityAt: '2026-02-19T04:00:00Z',
    warRecord: { wins: 6, losses: 6, draws: 2 },
    houseColorHex: '#4ea5d9',
    houseAccentHex: '#7dd3fc',
    emoji: '🌀',
  },
  {
    id: 'guild_null_void',
    name: 'The Void Prophets',
    tag: '[VOID]',
    description:
      'Chaos is the point. We bet on the unlikely, the heretical, the story-breaking choice. High risk. High reward. Low tolerance for conventional wisdom.',
    house: 'null',
    tier: 'iron',
    score: 4200,
    totalScore: 28900,
    memberCount: 19,
    maxMembers: 50,
    treasuryBalanceUsdc: 3100,
    totalWageredUsdc: 21400,
    winRate: 42.1,
    territoriesHeld: 0,
    totalTerritories: 6,
    isRecruiting: true,
    founderAddress: '0x3456789012345678901234567890123456789012',
    founderUsername: 'VoidEater',
    createdAt: '2026-02-01T20:00:00Z',
    lastActivityAt: '2026-02-19T07:30:00Z',
    warRecord: { wins: 3, losses: 9, draws: 1 },
    houseColorHex: '#ef4444',
    houseAccentHex: '#fca5a5',
    emoji: '💀',
  },
  {
    id: 'guild_aurelius_merchants',
    name: 'The Null Exchange',
    tag: '[NEX]',
    description:
      'A neutral trade guild aligned to Aurelius ideology but accepting members of any House origin. Focus on treasury growth over narrative alignment.',
    house: 'aurelius',
    tier: 'ember',
    score: 1850,
    totalScore: 4200,
    memberCount: 8,
    maxMembers: 50,
    treasuryBalanceUsdc: 920,
    totalWageredUsdc: 5100,
    winRate: 51.2,
    territoriesHeld: 0,
    totalTerritories: 6,
    isRecruiting: true,
    founderAddress: '0x4567890123456789012345678901234567890123',
    founderUsername: 'GoldThread9',
    createdAt: '2026-02-10T10:00:00Z',
    lastActivityAt: '2026-02-18T18:00:00Z',
    warRecord: { wins: 1, losses: 2, draws: 0 },
    houseColorHex: '#d4a853',
    houseAccentHex: '#fde68a',
    emoji: '⚖️',
  },
]

// ─── Platform stats ──────────────────────────────────────────────────────────

const PLATFORM_GUILD_STATS = {
  totalGuilds: MOCK_GUILDS.length,
  totalMembers: MOCK_GUILDS.reduce((s, g) => s + g.memberCount, 0),
  totalTreasuryUsdc: MOCK_GUILDS.reduce((s, g) => s + g.treasuryBalanceUsdc, 0),
  totalWageredUsdc: MOCK_GUILDS.reduce((s, g) => s + g.totalWageredUsdc, 0),
  activeWars: 2,
  rankedGuild: 'The Eternal Guard',
  rankedGuildId: 'guild_valdris_throne',
  currentAgendaHolder: 'guild_valdris_throne',
  currentSeason: 'Season 3 — The Void Convergence',
  seasonEndsAt: '2026-03-01T00:00:00Z',
}

// ─── GET /api/guilds ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const house = searchParams.get('house') as HouseAlignment | null
    const tier = searchParams.get('tier') as GuildTier | null
    const recruiting = searchParams.get('recruiting')
    const sort = searchParams.get('sort') || 'score'

    let guilds = [...MOCK_GUILDS]

    if (house && Object.keys(HOUSE_META).includes(house)) {
      guilds = guilds.filter((g) => g.house === house)
    }
    if (tier) guilds = guilds.filter((g) => g.tier === tier)
    if (recruiting === 'true') guilds = guilds.filter((g) => g.isRecruiting)

    switch (sort) {
      case 'score':
        guilds.sort((a, b) => b.score - a.score)
        break
      case 'treasury':
        guilds.sort((a, b) => b.treasuryBalanceUsdc - a.treasuryBalanceUsdc)
        break
      case 'members':
        guilds.sort((a, b) => b.memberCount - a.memberCount)
        break
      case 'winrate':
        guilds.sort((a, b) => b.winRate - a.winRate)
        break
      case 'newest':
        guilds.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        break
      default:
        guilds.sort((a, b) => b.score - a.score)
    }

    return NextResponse.json({ guilds, stats: PLATFORM_GUILD_STATS })
  } catch (err) {
    logger.error('GET /api/guilds', err)
    return NextResponse.json({ error: 'Failed to fetch guilds' }, { status: 500 })
  }
}

// ─── POST /api/guilds ────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, tag, description, house, founderAddress } = body

    if (!name || name.length < 3 || name.length > 40) {
      return NextResponse.json(
        { error: 'Guild name must be 3-40 characters' },
        { status: 400 }
      )
    }
    if (!tag || tag.length < 2 || tag.length > 5) {
      return NextResponse.json(
        { error: 'Guild tag must be 2-5 characters' },
        { status: 400 }
      )
    }
    if (!description || description.length < 10) {
      return NextResponse.json(
        { error: 'Description must be at least 10 characters' },
        { status: 400 }
      )
    }
    if (!house || !Object.keys(HOUSE_META).includes(house)) {
      return NextResponse.json({ error: 'Invalid house alignment' }, { status: 400 })
    }
    if (!founderAddress) {
      return NextResponse.json({ error: 'Wallet address required' }, { status: 400 })
    }

    const existingName = MOCK_GUILDS.find(
      (g) => g.name.toLowerCase() === (name as string).toLowerCase()
    )
    if (existingName) {
      return NextResponse.json(
        { error: 'A guild with that name already exists' },
        { status: 409 }
      )
    }

    const houseMeta = HOUSE_META[house as HouseAlignment]

    const newGuild: GuildPublicProfile = {
      id: `guild_${Date.now()}`,
      name: (name as string).trim(),
      tag: `[${(tag as string).toUpperCase().replace(/[\[\]]/g, '')}]`,
      description: (description as string).trim(),
      house: house as HouseAlignment,
      tier: 'ember',
      score: 0,
      totalScore: 0,
      memberCount: 1,
      maxMembers: 50,
      treasuryBalanceUsdc: 0,
      totalWageredUsdc: 0,
      winRate: 0,
      territoriesHeld: 0,
      totalTerritories: 6,
      isRecruiting: true,
      founderAddress,
      founderUsername:
        (founderAddress as string).slice(0, 6) +
        '...' +
        (founderAddress as string).slice(-4),
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      warRecord: { wins: 0, losses: 0, draws: 0 },
      houseColorHex: houseMeta.colorHex,
      houseAccentHex: houseMeta.accentHex,
      emoji: houseMeta.emoji,
    }

    logger.info('Guild created (mock)', { guildId: newGuild.id, name, house })

    return NextResponse.json({ guild: newGuild }, { status: 201 })
  } catch (err) {
    logger.error('POST /api/guilds', err)
    return NextResponse.json({ error: 'Failed to create guild' }, { status: 500 })
  }
}
