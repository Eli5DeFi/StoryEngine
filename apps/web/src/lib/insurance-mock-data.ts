/**
 * Narrative Insurance Protocol — Mock Data
 *
 * Realistic mock data for local development & demo.
 * Replace with real Prisma queries once the DB migration runs.
 */

import {
  InsuranceEvent,
  InsuranceEventStatus,
  InsuranceStatsResponse,
  UnderwriterStake,
  StakeStatus,
  PolicyStatus,
  InsurancePolicy,
  getRiskTier,
  impliedSurvivalProbability,
} from '@/types/insurance'

const NOW = new Date()
const future = (hours: number) =>
  new Date(NOW.getTime() + hours * 3_600_000).toISOString()
const past = (hours: number) =>
  new Date(NOW.getTime() - hours * 3_600_000).toISOString()

export const MOCK_EVENTS: InsuranceEvent[] = [
  {
    id: 'evt_001',
    chapterId: 'ch_015',
    storyId: 'story_voidborne',
    characterId: 'zara',
    description: 'Captain Zara executed by the Imperial Council in Chapter 15',
    characterName: 'Captain Zara',
    storyTitle: 'Voidborne: The Shattered Armistice',
    chapterNumber: 15,
    characterAvatar: '/characters/zara.png',
    premiumRateBps: 2000, // 20%
    totalCoverage: 142_000,
    totalPremiums: 28_400,
    underwriterPool: 320_000,
    riskTier: getRiskTier(2000),
    impliedSurvivalProbability: impliedSurvivalProbability(2000),
    createdAt: past(48),
    deadline: future(36),
    status: InsuranceEventStatus.OPEN,
    policyCount: 1_240,
    underwriterCount: 87,
    maxCoverage: 500_000,
  },
  {
    id: 'evt_002',
    chapterId: 'ch_015',
    storyId: 'story_voidborne',
    characterId: 'nexus',
    description: 'AI Navigator NEXUS corrupted and permanently destroyed in Chapter 15',
    characterName: 'NEXUS',
    storyTitle: 'Voidborne: The Shattered Armistice',
    chapterNumber: 15,
    characterAvatar: '/characters/nexus.png',
    premiumRateBps: 800, // 8%
    totalCoverage: 67_500,
    totalPremiums: 5_400,
    underwriterPool: 210_000,
    riskTier: getRiskTier(800),
    impliedSurvivalProbability: impliedSurvivalProbability(800),
    createdAt: past(24),
    deadline: future(36),
    status: InsuranceEventStatus.OPEN,
    policyCount: 430,
    underwriterCount: 52,
    maxCoverage: 500_000,
  },
  {
    id: 'evt_003',
    chapterId: 'ch_015',
    storyId: 'story_voidborne',
    characterId: 'marlowe',
    description: 'Commander Marlowe defects to the Empire in Chapter 15',
    characterName: 'Commander Marlowe',
    storyTitle: 'Voidborne: The Shattered Armistice',
    chapterNumber: 15,
    characterAvatar: '/characters/marlowe.png',
    premiumRateBps: 4500, // 45%
    totalCoverage: 89_000,
    totalPremiums: 40_050,
    underwriterPool: 120_000,
    riskTier: getRiskTier(4500),
    impliedSurvivalProbability: impliedSurvivalProbability(4500),
    createdAt: past(12),
    deadline: future(36),
    status: InsuranceEventStatus.OPEN,
    policyCount: 780,
    underwriterCount: 34,
    maxCoverage: 200_000,
  },
  {
    id: 'evt_004',
    chapterId: 'ch_014',
    storyId: 'story_chromesong',
    characterId: 'lyra',
    description: 'Lyra Voss memory-wiped by the Corporate Syndicate in Chapter 8',
    characterName: 'Lyra Voss',
    storyTitle: 'Chromesong: Neural Winter',
    chapterNumber: 8,
    characterAvatar: '/characters/lyra.png',
    premiumRateBps: 1500, // 15%
    totalCoverage: 53_200,
    totalPremiums: 7_980,
    underwriterPool: 180_000,
    riskTier: getRiskTier(1500),
    impliedSurvivalProbability: impliedSurvivalProbability(1500),
    createdAt: past(6),
    deadline: future(60),
    status: InsuranceEventStatus.OPEN,
    policyCount: 310,
    underwriterCount: 41,
    maxCoverage: 400_000,
  },
  {
    id: 'evt_005',
    chapterId: 'ch_007',
    storyId: 'story_ruinborn',
    characterId: 'kael',
    description: "Kael the Ruinborn sacrificed himself to seal the Void Gate in Chapter 12",
    characterName: 'Kael',
    storyTitle: 'Ruinborn: Echoes of the Forgotten Age',
    chapterNumber: 12,
    characterAvatar: '/characters/kael.png',
    premiumRateBps: 6500, // 65% — EXTREME risk
    totalCoverage: 210_000,
    totalPremiums: 136_500,
    underwriterPool: 50_000,
    riskTier: getRiskTier(6500),
    impliedSurvivalProbability: impliedSurvivalProbability(6500),
    createdAt: past(96),
    deadline: future(6),
    status: InsuranceEventStatus.OPEN,
    policyCount: 2_100,
    underwriterCount: 18,
    maxCoverage: 100_000,
  },
  {
    id: 'evt_006',
    chapterId: 'ch_010',
    storyId: 'story_voidborne',
    characterId: 'zara',
    description: 'Captain Zara betrayed the Resistance in Chapter 10',
    characterName: 'Captain Zara',
    storyTitle: 'Voidborne: The Shattered Armistice',
    chapterNumber: 10,
    characterAvatar: '/characters/zara.png',
    premiumRateBps: 1200,
    totalCoverage: 97_000,
    totalPremiums: 11_640,
    underwriterPool: 280_000,
    riskTier: getRiskTier(1200),
    impliedSurvivalProbability: impliedSurvivalProbability(1200),
    createdAt: past(200),
    deadline: past(10),
    status: InsuranceEventStatus.SETTLED_DID_NOT_OCCUR,
    policyCount: 890,
    underwriterCount: 63,
    maxCoverage: 0,
  },
]

export const MOCK_STATS: InsuranceStatsResponse = {
  totalEventsOpen: 5,
  totalCoverageOutstanding: 561_700,
  totalUnderwriterCapital: 880_000,
  totalPoliciesActive: 4_760,
  platformEarnings: 6_271,
  avgPremiumRate: 25.6,
  claimsRatio: 18, // 18% of settled events resulted in payouts
}

// ============================================================================
// USER DEMO POSITIONS (wallet-specific, shown when connected)
// ============================================================================

export const DEMO_POLICIES: InsurancePolicy[] = [
  {
    id: 'pol_001',
    eventId: 'evt_001',
    policyholderAddress: '0xDEMO',
    coverage: 1_000,
    premium: 200,
    potentialPayout: 1_000,
    purchasedAt: past(24),
    expiresAt: future(36),
    status: PolicyStatus.ACTIVE,
  },
  {
    id: 'pol_002',
    eventId: 'evt_003',
    policyholderAddress: '0xDEMO',
    coverage: 500,
    premium: 225,
    potentialPayout: 500,
    purchasedAt: past(10),
    expiresAt: future(36),
    status: PolicyStatus.ACTIVE,
  },
]

export const DEMO_STAKES: UnderwriterStake[] = [
  {
    id: 'stake_001',
    eventId: 'evt_002',
    underwriterAddress: '0xDEMO',
    staked: 5_000,
    earnedPremiums: 420,
    estimatedAPY: 84,
    stakedAt: past(20),
    status: StakeStatus.ACTIVE,
  },
]

// ============================================================================
// HELPERS
// ============================================================================

export function getEventById(id: string): InsuranceEvent | undefined {
  return MOCK_EVENTS.find((e) => e.id === id)
}

export function getOpenEvents(): InsuranceEvent[] {
  return MOCK_EVENTS.filter((e) => e.status === InsuranceEventStatus.OPEN)
}

export function getHistoricalEvents(): InsuranceEvent[] {
  return MOCK_EVENTS.filter((e) => e.status !== InsuranceEventStatus.OPEN)
}
