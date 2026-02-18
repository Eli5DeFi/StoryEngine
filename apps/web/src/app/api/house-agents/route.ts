/**
 * House Agent Protocol (HAP) — API Routes
 * Innovation Cycle #50 — February 18, 2026
 *
 * Returns mock + cached data for all 5 House AI Agents.
 * These agents autonomously bet on chapters aligned with their House ideology.
 *
 * Cached for 60s to prevent hammering and enable ISR refresh.
 */

import { NextResponse } from 'next/server'

export const revalidate = 60

// ============================================================================
// HOUSE AGENT MOCK DATA
// (Replace with real DB queries once House Agent tables are migrated)
// ============================================================================

export interface HouseAgentPublicProfile {
  houseId: string
  name: string
  fullName: string
  lore: string
  colorHex: string
  accentHex: string
  emoji: string
  walletAddress: string
  personality: {
    riskTolerance: number       // 0-100
    contrarianism: number       // 0-100
    survivalBias: number        // 0-100
    memoryDepth: number         // 0-100
    bluffPropensity: number     // 0-100
  }
  stats: {
    totalBets: number
    wonBets: number
    accuracyRate: number        // 0-100
    totalWageredUsdc: number
    totalEarnedUsdc: number
    netPnl: number
    generationCount: number
    alignedPlayers: number
    overridesAvailable: number
  }
  recentBets: AgentBetRecord[]
  currentBet: AgentBetRecord | null
  rivalIntensity: Record<string, number>  // houseId -> 0-100 rivalry score
}

export interface AgentBetRecord {
  id: string
  chapterId: string
  chapterTitle: string
  choiceText: string
  amount: number           // USDC
  reasoning: string
  placedAt: string         // ISO date
  resolved: boolean
  won: boolean | null
  payout: number | null
  crowdPercentage: number  // % of crowd that picked same choice (contrarian metric)
}

// Static house ideologies (these never change — true agent DNA)
const HOUSE_AGENTS: HouseAgentPublicProfile[] = [
  {
    houseId: 'valdris',
    name: 'Valdris',
    fullName: 'House Valdris — The Eternal Throne',
    lore: 'Oldest of the Five Houses, Valdris believes order precedes all. Their Agent never bets against established power structures — and has paid dearly for it.',
    colorHex: '#8b7ab8',
    accentHex: '#c4b5fd',
    emoji: '👑',
    walletAddress: '0x1111...v4dr1s',
    personality: {
      riskTolerance: 28,
      contrarianism: 15,
      survivalBias: 82,
      memoryDepth: 91,
      bluffPropensity: 22,
    },
    stats: {
      totalBets: 234,
      wonBets: 142,
      accuracyRate: 60.7,
      totalWageredUsdc: 58400,
      totalEarnedUsdc: 71200,
      netPnl: 12800,
      generationCount: 12,
      alignedPlayers: 847,
      overridesAvailable: 1,
    },
    recentBets: [
      {
        id: 'vb-234',
        chapterId: 'ch-47',
        chapterTitle: 'Chapter 47: The Obsidian Accord',
        choiceText: "Zara signs the treaty — preserving the Senate structure",
        amount: 420,
        reasoning: 'The Senate must endure. History shows that alliances forged in crisis outlast those born in calm. House Valdris does not wager against continuity.',
        placedAt: '2026-02-18T09:14:00Z',
        resolved: true,
        won: true,
        payout: 680,
        crowdPercentage: 61,
      },
      {
        id: 'vb-233',
        chapterId: 'ch-46',
        chapterTitle: 'Chapter 46: The Rift Protocol',
        choiceText: 'The Council convenes — delaying the vote',
        amount: 350,
        reasoning: 'Patience is the oldest weapon. Delay is not weakness. It is the art of letting entropy work for you.',
        placedAt: '2026-02-17T14:30:00Z',
        resolved: true,
        won: false,
        payout: null,
        crowdPercentage: 38,
      },
      {
        id: 'vb-232',
        chapterId: 'ch-45',
        chapterTitle: 'Chapter 45: Fractures',
        choiceText: 'Kael stands down — preserving the truce',
        amount: 500,
        reasoning: 'Honor is currency. Kael has always chosen principle over advantage. We stake on his nature.',
        placedAt: '2026-02-16T11:00:00Z',
        resolved: true,
        won: true,
        payout: 780,
        crowdPercentage: 55,
      },
    ],
    currentBet: {
      id: 'vb-235',
      chapterId: 'ch-48',
      chapterTitle: 'Chapter 48: The Silent Vote',
      choiceText: 'The Empress reclaims the throne room — restoring old order',
      amount: 600,
      reasoning: 'Power abhors a vacuum. The Empress will not allow the vacuum to persist. This is her nature, her lineage, her only move.',
      placedAt: '2026-02-18T16:45:00Z',
      resolved: false,
      won: null,
      payout: null,
      crowdPercentage: 44,
    },
    rivalIntensity: {
      obsidian: 88,
      meridian: 30,
      auric: 45,
      zephyr: 20,
    },
  },
  {
    houseId: 'obsidian',
    name: 'Obsidian',
    fullName: 'House Obsidian — The Shadow Protocol',
    lore: 'Chaos is a tool, and House Obsidian wields it masterfully. Their Agent bets contrarian — almost always against the crowd — and has built a cult following for it.',
    colorHex: '#374151',
    accentHex: '#9ca3af',
    emoji: '🖤',
    walletAddress: '0x2222...0bs1d',
    personality: {
      riskTolerance: 78,
      contrarianism: 89,
      survivalBias: 18,
      memoryDepth: 55,
      bluffPropensity: 85,
    },
    stats: {
      totalBets: 278,
      wonBets: 141,
      accuracyRate: 50.7,
      totalWageredUsdc: 92000,
      totalEarnedUsdc: 87400,
      netPnl: -4600,
      generationCount: 18,
      alignedPlayers: 1203,
      overridesAvailable: 0,
    },
    recentBets: [
      {
        id: 'ob-278',
        chapterId: 'ch-47',
        chapterTitle: 'Chapter 47: The Obsidian Accord',
        choiceText: 'Mara betrays the pact — igniting civil war',
        amount: 1200,
        reasoning: 'Everyone expects loyalty. We expect chaos. And chaos, my dear observers, always arrives on time.',
        placedAt: '2026-02-18T09:20:00Z',
        resolved: true,
        won: false,
        payout: null,
        crowdPercentage: 19,
      },
      {
        id: 'ob-277',
        chapterId: 'ch-46',
        chapterTitle: 'Chapter 46: The Rift Protocol',
        choiceText: 'The Rift Protocol activates — destroying both factions',
        amount: 800,
        reasoning: 'Nuclear option. Only a fool ignores the nuclear option when it\'s on the table. We are not fools.',
        placedAt: '2026-02-17T14:25:00Z',
        resolved: true,
        won: true,
        payout: 3200,
        crowdPercentage: 8,
      },
      {
        id: 'ob-276',
        chapterId: 'ch-45',
        chapterTitle: 'Chapter 45: Fractures',
        choiceText: 'Kael defects to House Zephyr',
        amount: 600,
        reasoning: 'Kael has been signaling for three chapters. No one listened. We did.',
        placedAt: '2026-02-16T10:55:00Z',
        resolved: true,
        won: false,
        payout: null,
        crowdPercentage: 12,
      },
    ],
    currentBet: {
      id: 'ob-279',
      chapterId: 'ch-48',
      chapterTitle: 'Chapter 48: The Silent Vote',
      choiceText: 'The assassin strikes — the vote never happens',
      amount: 900,
      reasoning: 'They call it a "Silent Vote" for a reason. Silence is our medium. The vote will not happen. Watch.',
      placedAt: '2026-02-18T16:50:00Z',
      resolved: false,
      won: null,
      payout: null,
      crowdPercentage: 7,
    },
    rivalIntensity: {
      valdris: 88,
      meridian: 65,
      auric: 40,
      zephyr: 55,
    },
  },
  {
    houseId: 'meridian',
    name: 'Meridian',
    fullName: 'House Meridian — The Negotiator',
    lore: 'Where others see conflict, Meridian sees opportunity. Their Agent specializes in identifying diplomatic outcomes the crowd overlooks — and betting on them heavily.',
    colorHex: '#065f46',
    accentHex: '#34d399',
    emoji: '⚖️',
    walletAddress: '0x3333...m3r1d',
    personality: {
      riskTolerance: 52,
      contrarianism: 35,
      survivalBias: 62,
      memoryDepth: 78,
      bluffPropensity: 41,
    },
    stats: {
      totalBets: 198,
      wonBets: 131,
      accuracyRate: 66.2,
      totalWageredUsdc: 49200,
      totalEarnedUsdc: 63800,
      netPnl: 14600,
      generationCount: 9,
      alignedPlayers: 934,
      overridesAvailable: 1,
    },
    recentBets: [
      {
        id: 'me-198',
        chapterId: 'ch-47',
        chapterTitle: 'Chapter 47: The Obsidian Accord',
        choiceText: "Zara signs the treaty — preserving the Senate structure",
        amount: 380,
        reasoning: 'Both sides need this accord. The alternative is mutual destruction. Rational actors choose treaties.',
        placedAt: '2026-02-18T09:18:00Z',
        resolved: true,
        won: true,
        payout: 580,
        crowdPercentage: 61,
      },
      {
        id: 'me-197',
        chapterId: 'ch-46',
        chapterTitle: 'Chapter 46: The Rift Protocol',
        choiceText: 'The Council convenes — delaying the vote',
        amount: 290,
        reasoning: 'The Council is the natural mediator. They will convene. They always convene.',
        placedAt: '2026-02-17T14:28:00Z',
        resolved: true,
        won: false,
        payout: null,
        crowdPercentage: 38,
      },
      {
        id: 'me-196',
        chapterId: 'ch-45',
        chapterTitle: 'Chapter 45: Fractures',
        choiceText: 'Kael stands down — preserving the truce',
        amount: 440,
        reasoning: 'The truce is the deal. Kael is a deal-keeper. Simple.',
        placedAt: '2026-02-16T10:58:00Z',
        resolved: true,
        won: true,
        payout: 680,
        crowdPercentage: 55,
      },
    ],
    currentBet: {
      id: 'me-199',
      chapterId: 'ch-48',
      chapterTitle: 'Chapter 48: The Silent Vote',
      choiceText: 'A coalition forms — three Houses vote as one',
      amount: 450,
      reasoning: 'The coalition is already whispering. Three houses. One voice. This is the equilibrium the story is building toward.',
      placedAt: '2026-02-18T16:48:00Z',
      resolved: false,
      won: null,
      payout: null,
      crowdPercentage: 22,
    },
    rivalIntensity: {
      valdris: 30,
      obsidian: 65,
      auric: 20,
      zephyr: 35,
    },
  },
  {
    houseId: 'auric',
    name: 'Auric',
    fullName: 'House Auric — The Golden Covenant',
    lore: 'Honor above survival. House Auric\'s Agent is the most predictable — and the most respected. It always bets on the "right" outcome, not the profitable one.',
    colorHex: '#78350f',
    accentHex: '#d4a853',
    emoji: '✨',
    walletAddress: '0x4444...4ur1c',
    personality: {
      riskTolerance: 35,
      contrarianism: 20,
      survivalBias: 55,
      memoryDepth: 85,
      bluffPropensity: 8,
    },
    stats: {
      totalBets: 156,
      wonBets: 98,
      accuracyRate: 62.8,
      totalWageredUsdc: 38900,
      totalEarnedUsdc: 47200,
      netPnl: 8300,
      generationCount: 7,
      alignedPlayers: 1456,
      overridesAvailable: 1,
    },
    recentBets: [
      {
        id: 'au-156',
        chapterId: 'ch-47',
        chapterTitle: 'Chapter 47: The Obsidian Accord',
        choiceText: "Zara signs the treaty — preserving the Senate structure",
        amount: 300,
        reasoning: 'Peace is the covenant. Zara\'s lineage demands it. We do not bet on dishonor.',
        placedAt: '2026-02-18T09:15:00Z',
        resolved: true,
        won: true,
        payout: 458,
        crowdPercentage: 61,
      },
      {
        id: 'au-155',
        chapterId: 'ch-46',
        chapterTitle: 'Chapter 46: The Rift Protocol',
        choiceText: 'The Council convenes — delaying the vote',
        amount: 250,
        reasoning: 'The principled path is patience. The Council will ensure this.',
        placedAt: '2026-02-17T14:32:00Z',
        resolved: true,
        won: false,
        payout: null,
        crowdPercentage: 38,
      },
      {
        id: 'au-154',
        chapterId: 'ch-45',
        chapterTitle: 'Chapter 45: Fractures',
        choiceText: 'Kael stands down — preserving the truce',
        amount: 380,
        reasoning: 'Kael\'s honor is his compass. The truce holds because Kael holds.',
        placedAt: '2026-02-16T10:52:00Z',
        resolved: true,
        won: true,
        payout: 590,
        crowdPercentage: 55,
      },
    ],
    currentBet: {
      id: 'au-157',
      chapterId: 'ch-48',
      chapterTitle: 'Chapter 48: The Silent Vote',
      choiceText: 'The Empress reclaims the throne room — restoring old order',
      amount: 350,
      reasoning: 'Order is the covenant. Restoration is its expression. House Auric never wavers.',
      placedAt: '2026-02-18T16:44:00Z',
      resolved: false,
      won: null,
      payout: null,
      crowdPercentage: 44,
    },
    rivalIntensity: {
      valdris: 45,
      obsidian: 40,
      meridian: 20,
      zephyr: 60,
    },
  },
  {
    houseId: 'zephyr',
    name: 'Zephyr',
    fullName: 'House Zephyr — The Wind Traders',
    lore: 'Information is the only commodity that matters. House Zephyr\'s Agent leverages trade intelligence and cross-House signals — often detecting regime changes 3 chapters early.',
    colorHex: '#1e3a5f',
    accentHex: '#4ea5d9',
    emoji: '🌊',
    walletAddress: '0x5555...z3phr',
    personality: {
      riskTolerance: 61,
      contrarianism: 48,
      survivalBias: 70,
      memoryDepth: 68,
      bluffPropensity: 55,
    },
    stats: {
      totalBets: 312,
      wonBets: 196,
      accuracyRate: 62.8,
      totalWageredUsdc: 74600,
      totalEarnedUsdc: 91300,
      netPnl: 16700,
      generationCount: 21,
      alignedPlayers: 689,
      overridesAvailable: 1,
    },
    recentBets: [
      {
        id: 'ze-312',
        chapterId: 'ch-47',
        chapterTitle: 'Chapter 47: The Obsidian Accord',
        choiceText: 'Trade routes are renegotiated — Meridian gains influence',
        amount: 520,
        reasoning: 'The treaty is a cover. The real move is the trade route amendment buried in clause 7. Meridian wrote it. Meridian wins.',
        placedAt: '2026-02-18T09:22:00Z',
        resolved: true,
        won: false,
        payout: null,
        crowdPercentage: 18,
      },
      {
        id: 'ze-311',
        chapterId: 'ch-46',
        chapterTitle: 'Chapter 46: The Rift Protocol',
        choiceText: 'Zephyr brokers a back-channel deal',
        amount: 700,
        reasoning: 'Every crisis is a negotiation. We position as broker. This is how House Zephyr survives every chapter.',
        placedAt: '2026-02-17T14:27:00Z',
        resolved: true,
        won: true,
        payout: 1820,
        crowdPercentage: 14,
      },
      {
        id: 'ze-310',
        chapterId: 'ch-45',
        chapterTitle: 'Chapter 45: Fractures',
        choiceText: 'Kael defects to House Zephyr',
        amount: 450,
        reasoning: 'We have been recruiting Kael for 8 chapters. The defection signals are clear to us. Watch.',
        placedAt: '2026-02-16T10:50:00Z',
        resolved: true,
        won: false,
        payout: null,
        crowdPercentage: 12,
      },
    ],
    currentBet: {
      id: 'ze-313',
      chapterId: 'ch-48',
      chapterTitle: 'Chapter 48: The Silent Vote',
      choiceText: 'A coalition forms — three Houses vote as one',
      amount: 680,
      reasoning: 'Three Houses. We are one of them. We know this coalition exists because we built it. Betting 680 USDC on our own play.',
      placedAt: '2026-02-18T16:52:00Z',
      resolved: false,
      won: null,
      payout: null,
      crowdPercentage: 22,
    },
    rivalIntensity: {
      valdris: 20,
      obsidian: 55,
      meridian: 35,
      auric: 60,
    },
  },
]

// ============================================================================
// GET /api/house-agents
// Returns all 5 house agents with their stats and recent activity.
// ============================================================================

export async function GET() {
  try {
    // Calculate aggregate stats
    const totalAligned = HOUSE_AGENTS.reduce((sum, a) => sum + a.stats.alignedPlayers, 0)
    const totalWagered = HOUSE_AGENTS.reduce((sum, a) => sum + a.stats.totalWageredUsdc, 0)
    const totalBets = HOUSE_AGENTS.reduce((sum, a) => sum + a.stats.totalBets, 0)

    return NextResponse.json(
      {
        agents: HOUSE_AGENTS,
        meta: {
          totalAligned,
          totalWagered,
          totalBets,
          currentChapter: 'ch-48',
          currentChapterTitle: 'Chapter 48: The Silent Vote',
          lastUpdated: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    )
  } catch (error) {
    console.error('[house-agents] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch house agents' },
      { status: 500 }
    )
  }
}
