/**
 * Shared guild types and constants.
 * Imported by API routes AND client components.
 */

// ─── Types ─────────────────────────────────────────────────────────────────

export type HouseAlignment =
  | 'valdris'
  | 'obsidian'
  | 'aurelius'
  | 'strand'
  | 'null'

export type GuildTier = 'ember' | 'iron' | 'silver' | 'gold' | 'void'

export interface GuildPublicProfile {
  id: string
  name: string
  tag: string
  description: string
  house: HouseAlignment
  tier: GuildTier
  score: number
  totalScore: number
  memberCount: number
  maxMembers: number
  treasuryBalanceUsdc: number
  totalWageredUsdc: number
  winRate: number
  territoriesHeld: number
  totalTerritories: number
  isRecruiting: boolean
  founderAddress: string
  founderUsername: string
  agenda?: string
  createdAt: string
  lastActivityAt: string
  warRecord: { wins: number; losses: number; draws: number }
  houseColorHex: string
  houseAccentHex: string
  emoji: string
}

export interface GuildMemberPublic {
  walletAddress: string
  username: string
  role: 'leader' | 'officer' | 'member'
  contributedUsdc: number
  winRate: number
  joinedAt: string
  shareWeight: number
}

export interface FactionWarPublic {
  id: string
  opponentGuildId: string
  opponentGuildName: string
  opponentHouse: string
  outcome: 'won' | 'lost' | 'draw' | 'ongoing'
  ourScore: number
  theirScore: number
  startedAt: string
  endedAt?: string
  battleChapters: number[]
}

export interface TerritoryControl {
  sectorId: string
  sectorName: string
  controllerGuildId: string
  yieldPerChapterUsdc: number
  capturedAt: string
  defenseStrength: number
}

export interface GuildBetPublic {
  chapterTitle: string
  choiceText: string
  amountUsdc: number
  outcome: 'won' | 'lost' | 'pending'
  payoutUsdc: number | null
  placedAt: string
}

export interface GuildDetailProfile extends GuildPublicProfile {
  members: GuildMemberPublic[]
  recentWars: FactionWarPublic[]
  territory: TerritoryControl[]
  topBets: GuildBetPublic[]
}

// ─── House metadata ─────────────────────────────────────────────────────────

export const HOUSE_META: Record<
  HouseAlignment,
  { colorHex: string; accentHex: string; emoji: string; lore: string }
> = {
  valdris: {
    colorHex: '#8b7ab8',
    accentHex: '#c4b5fd',
    emoji: '👑',
    lore: 'Order, honor, military precision. Silver threads flow from the ancient throne.',
  },
  obsidian: {
    colorHex: '#334155',
    accentHex: '#94a3b8',
    emoji: '🌑',
    lore: 'Shadow, espionage, null threads. Information is the only true currency.',
  },
  aurelius: {
    colorHex: '#d4a853',
    accentHex: '#fde68a',
    emoji: '⚖️',
    lore: 'Commerce, negotiation, gold threads. Every alliance has a price.',
  },
  strand: {
    colorHex: '#4ea5d9',
    accentHex: '#7dd3fc',
    emoji: '🌀',
    lore: 'Ancient law, cosmic order, all threads. The Strand weaves fate itself.',
  },
  null: {
    colorHex: '#ef4444',
    accentHex: '#fca5a5',
    emoji: '💀',
    lore: 'Chaos, Void worship, broken threads. The Null Collective fears nothing.',
  },
}
