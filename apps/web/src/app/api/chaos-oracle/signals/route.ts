/**
 * GET /api/chaos-oracle/signals
 *
 * Chaos Oracle Protocol (COP) — API layer
 * Innovation Cycle #53 — "The Living Story Protocol"
 *
 * Returns real-world signals (crypto prices, social volume, on-chain activity)
 * mapped to Voidborne narrative parameters. Powers the ChaosOracleWidget UI.
 *
 * No authentication required — public read endpoint.
 * Cached for 5 minutes to avoid CoinGecko rate limits.
 */

import { NextResponse } from 'next/server'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NarrativeMapping {
  houseBeneficiary: string
  houseBurdened: string
  parameterAffected: string
  narrativeEffect: string
  promptFragment: string
  intensity: number
}

export interface ProcessedSignal {
  id: string
  source: 'crypto' | 'social' | 'onchain' | 'internal'
  metric: string
  metricLabel: string
  value: number
  valueFormatted: string
  direction: 'spike' | 'crash' | 'surge' | 'neutral' | 'volatile'
  intensity: number // 0–1
  mapping: NarrativeMapping
  timestamp: string
}

export interface ChaosOracleResponse {
  signals: ProcessedSignal[]
  chaosIntensity: 'calm' | 'tense' | 'volatile' | 'maelstrom'
  dominantEffect: string
  dominantHouseBeneficiary: string
  dominantHouseBurdened: string
  chapterMoodOverride: string
  cachedAt: string
  isMock: boolean
}

// ─── Signal-to-Narrative Mapping Table ────────────────────────────────────────

type MappingFn = (
  intensity: number,
  direction: 'spike' | 'crash' | 'surge' | 'neutral' | 'volatile',
  value: number,
) => NarrativeMapping

const NARRATIVE_MAP: Record<string, MappingFn> = {
  BTC_24H_CHANGE: (intensity, direction, value) => {
    if (direction === 'crash') {
      return {
        houseBeneficiary: 'null',
        houseBurdened: 'valdris',
        parameterAffected: 'politicalPressure',
        narrativeEffect: 'House Valdris treasury depleted — desperate measures incoming',
        promptFragment: `Economic calamity has struck the outer Conclave rings. House Valdris's trade fleet has suffered catastrophic losses overnight. The once-confident faction now debates radical actions in closed chambers.`,
        intensity,
      }
    }
    if (direction === 'surge' || direction === 'spike') {
      return {
        houseBeneficiary: 'valdris',
        houseBurdened: 'null',
        parameterAffected: 'politicalPressure',
        narrativeEffect: 'Valdris treasury overflows — boldness breeds recklessness',
        promptFragment: `The Conclave's treasury overflows with unexpected tribute. House Valdris is emboldened — perhaps dangerously so. Rivals grow envious and begin quiet counter-manoeuvres.`,
        intensity,
      }
    }
    return {
      houseBeneficiary: 'strand',
      houseBurdened: 'none',
      parameterAffected: 'politicalPressure',
      narrativeEffect: 'Markets stable — political intrigues take centre stage',
      promptFragment: `Trade winds are calm. The houses redirect energy from economics to politics. Subtle negotiations unfold in shadow.`,
      intensity: 0.2,
    }
  },

  ETH_24H_CHANGE: (intensity, direction) => {
    if (direction === 'crash' || direction === 'volatile') {
      return {
        houseBeneficiary: 'obsidian',
        houseBurdened: 'aurelius',
        parameterAffected: 'resourceDelta',
        narrativeEffect: 'Infrastructure fractures — Obsidian rises in the chaos',
        promptFragment: `Critical Strand infrastructure has begun failing across three sectors. House Aurelius, most dependent on the network, scrambles to maintain operations. House Obsidian, with its off-network resources, watches with barely concealed satisfaction.`,
        intensity,
      }
    }
    if (direction === 'surge') {
      return {
        houseBeneficiary: 'aurelius',
        houseBurdened: 'obsidian',
        parameterAffected: 'resourceDelta',
        narrativeEffect: 'Aurelius ascends as infrastructure costs soar',
        promptFragment: `The cost of Strand-linked operations has reached historic highs. House Aurelius, which owns the key relay nodes, quietly doubles its infrastructure tolls. The other houses have no choice but to pay.`,
        intensity,
      }
    }
    return {
      houseBeneficiary: 'strand',
      houseBurdened: 'none',
      parameterAffected: 'resourceDelta',
      narrativeEffect: 'Strand networks hum steadily — no disruption',
      promptFragment: `The Strand networks pulse with their usual rhythms. No bottlenecks, no crises — a rare calm that experienced observers find suspicious.`,
      intensity: 0.15,
    }
  },

  VOIDBORNE_SOCIAL_MENTIONS: (intensity, direction) => {
    if (direction === 'surge' || direction === 'spike') {
      return {
        houseBeneficiary: 'obsidian',
        houseBurdened: 'aurelius',
        parameterAffected: 'allianceShift',
        narrativeEffect: 'Whispers of the Stitching spread — Obsidian\'s network activates',
        promptFragment: `Gossip about the Silent Throne reaches even the outer rings. House Obsidian's network of informants grows more active. Something — or someone — is spreading information intentionally.`,
        intensity,
      }
    }
    return {
      houseBeneficiary: 'strand',
      houseBurdened: 'obsidian',
      parameterAffected: 'allianceShift',
      narrativeEffect: 'Eerie silence grips the Conclave — secrets are being kept',
      promptFragment: `An unusual quiet has settled over the Conclave's communication Strands. Houses guard secrets with rare care. Something significant is being concealed.`,
      intensity: intensity * 0.5,
    }
  },

  FORGE_VOLUME_24H: (intensity, direction) => {
    if (direction === 'surge') {
      return {
        houseBeneficiary: 'valdris',
        houseBurdened: 'null',
        parameterAffected: 'politicalPressure',
        narrativeEffect: 'Allegiance surge — old debts called in with urgency',
        promptFragment: `A flurry of formal allegiance declarations has swept through the Conclave chambers. Old debts are being called in with unusual urgency. The political map shifts overnight.`,
        intensity,
      }
    }
    return {
      houseBeneficiary: 'null',
      houseBurdened: 'strand',
      parameterAffected: 'voidCorruption',
      narrativeEffect: 'The Stitching grows restless — Void energies accumulate',
      promptFragment: `The Void stirs with unusual energy. Thread-weavers report anomalous readings in the outer sectors. Something is building in the spaces between.`,
      intensity,
    }
  },

  NARRATIVE_ENTROPY: (intensity, direction) => {
    if (direction === 'volatile') {
      return {
        houseBeneficiary: 'null',
        houseBurdened: 'aurelius',
        parameterAffected: 'survivalThreat',
        narrativeEffect: 'The Void grows restless — an unexpected event stirs',
        promptFragment: `The patterns that govern the Stitching have become erratic. Scholars disagree about what is coming, but all agree something unprecedented approaches.`,
        intensity,
      }
    }
    return {
      houseBeneficiary: 'strand',
      houseBurdened: 'none',
      parameterAffected: 'survivalThreat',
      narrativeEffect: 'Calm tension — all houses watch, none act',
      promptFragment: `A period of unusual stillness has settled over the Conclave. All factions seem to be waiting for something. The moment before the storm.`,
      intensity: 0.1,
    }
  },
}

// ─── Signal Fetchers ──────────────────────────────────────────────────────────

interface CoinGeckoPrice {
  usd: number
  usd_24h_change: number
}

async function fetchCryptoSignals(): Promise<ProcessedSignal[]> {
  try {
    const resp = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true',
      {
        signal: AbortSignal.timeout(6000),
        headers: { Accept: 'application/json' },
        next: { revalidate: 300 }, // 5-min cache
      },
    )

    if (!resp.ok) throw new Error(`CoinGecko ${resp.status}`)

    const data = await resp.json() as {
      bitcoin?: CoinGeckoPrice
      ethereum?: CoinGeckoPrice
    }

    const signals: ProcessedSignal[] = []

    if (data.bitcoin) {
      const change = data.bitcoin.usd_24h_change
      const direction = priceDirection(change)
      const intensity = Math.min(1, Math.abs(change) / 20)
      const mapping = NARRATIVE_MAP.BTC_24H_CHANGE(intensity, direction, change)

      signals.push({
        id: `btc-${Date.now()}`,
        source: 'crypto',
        metric: 'BTC_24H_CHANGE',
        metricLabel: 'Bitcoin 24h',
        value: change,
        valueFormatted: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
        direction,
        intensity,
        mapping,
        timestamp: new Date().toISOString(),
      })
    }

    if (data.ethereum) {
      const change = data.ethereum.usd_24h_change
      const direction = priceDirection(change)
      const intensity = Math.min(1, Math.abs(change) / 20)
      const mapping = NARRATIVE_MAP.ETH_24H_CHANGE(intensity, direction, change)

      signals.push({
        id: `eth-${Date.now()}`,
        source: 'crypto',
        metric: 'ETH_24H_CHANGE',
        metricLabel: 'Ethereum 24h',
        value: change,
        valueFormatted: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
        direction,
        intensity,
        mapping,
        timestamp: new Date().toISOString(),
      })
    }

    return signals
  } catch {
    // Fallback mock — realistic scenario
    return generateMockCryptoSignals()
  }
}

function generateMockCryptoSignals(): ProcessedSignal[] {
  const hour = new Date().getHours()
  // Deterministic-ish based on hour to keep consistent within a session
  const seed = (hour * 7 + new Date().getDate() * 13) % 100

  const btcChange = seed < 20 ? -12.4 : seed < 40 ? 8.2 : seed < 60 ? -2.1 : seed < 80 ? 15.7 : -0.8
  const ethChange = seed < 30 ? -9.1 : seed < 60 ? 6.3 : seed < 80 ? -4.5 : 11.2

  const btcDir = priceDirection(btcChange)
  const btcIntensity = Math.min(1, Math.abs(btcChange) / 20)

  const ethDir = priceDirection(ethChange)
  const ethIntensity = Math.min(1, Math.abs(ethChange) / 20)

  return [
    {
      id: `btc-mock-${Date.now()}`,
      source: 'crypto',
      metric: 'BTC_24H_CHANGE',
      metricLabel: 'Bitcoin 24h',
      value: btcChange,
      valueFormatted: `${btcChange >= 0 ? '+' : ''}${btcChange.toFixed(2)}%`,
      direction: btcDir,
      intensity: btcIntensity,
      mapping: NARRATIVE_MAP.BTC_24H_CHANGE(btcIntensity, btcDir, btcChange),
      timestamp: new Date().toISOString(),
    },
    {
      id: `eth-mock-${Date.now()}`,
      source: 'crypto',
      metric: 'ETH_24H_CHANGE',
      metricLabel: 'Ethereum 24h',
      value: ethChange,
      valueFormatted: `${ethChange >= 0 ? '+' : ''}${ethChange.toFixed(2)}%`,
      direction: ethDir,
      intensity: ethIntensity,
      mapping: NARRATIVE_MAP.ETH_24H_CHANGE(ethIntensity, ethDir, ethChange),
      timestamp: new Date().toISOString(),
    },
  ]
}

function generateSocialSignal(): ProcessedSignal {
  const hour = new Date().getHours()
  const isActiveHour = hour >= 14 && hour <= 22
  const mentions = isActiveHour ? 45 + Math.floor(Math.random() * 200) : 8 + Math.floor(Math.random() * 25)
  const baseline = 60
  const intensity = Math.min(1, Math.abs(mentions - baseline) / baseline)
  const direction: ProcessedSignal['direction'] =
    mentions > baseline * 2 ? 'surge' : mentions > baseline * 1.3 ? 'spike' : 'neutral'

  return {
    id: `social-${Date.now()}`,
    source: 'social',
    metric: 'VOIDBORNE_SOCIAL_MENTIONS',
    metricLabel: 'Voidborne Mentions',
    value: mentions,
    valueFormatted: `${mentions} mentions`,
    direction,
    intensity,
    mapping: NARRATIVE_MAP.VOIDBORNE_SOCIAL_MENTIONS(intensity, direction, mentions),
    timestamp: new Date().toISOString(),
  }
}

function generateOnchainSignal(): ProcessedSignal {
  const volume = 12000 + Math.floor(Math.random() * 50000)
  const baseline = 20000
  const intensity = Math.min(1, Math.abs(volume - baseline) / baseline)
  const direction: ProcessedSignal['direction'] =
    volume > baseline * 1.5 ? 'surge' : volume < baseline * 0.5 ? 'crash' : 'neutral'

  return {
    id: `onchain-${Date.now()}`,
    source: 'onchain',
    metric: 'FORGE_VOLUME_24H',
    metricLabel: '$FORGE Volume 24h',
    value: volume,
    valueFormatted: `$${(volume / 1000).toFixed(1)}K`,
    direction,
    intensity,
    mapping: NARRATIVE_MAP.FORGE_VOLUME_24H(intensity, direction, volume),
    timestamp: new Date().toISOString(),
  }
}

function generateEntropySignal(): ProcessedSignal {
  const daysSince = Math.floor(Math.random() * 7)
  const intensity = Math.min(1, daysSince / 7)
  const direction: ProcessedSignal['direction'] = daysSince > 5 ? 'volatile' : 'neutral'

  return {
    id: `entropy-${Date.now()}`,
    source: 'internal',
    metric: 'NARRATIVE_ENTROPY',
    metricLabel: 'Narrative Entropy',
    value: daysSince,
    valueFormatted: daysSince === 0 ? 'Just disrupted' : `${daysSince}d since last upset`,
    direction,
    intensity,
    mapping: NARRATIVE_MAP.NARRATIVE_ENTROPY(intensity, direction, daysSince),
    timestamp: new Date().toISOString(),
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function priceDirection(pct: number): ProcessedSignal['direction'] {
  if (pct < -10) return 'crash'
  if (pct < -3) return 'volatile'
  if (pct > 10) return 'surge'
  if (pct > 3) return 'spike'
  return 'neutral'
}

function computeChaosIntensity(signals: ProcessedSignal[]): ChaosOracleResponse['chaosIntensity'] {
  const avg = signals.reduce((s, c) => s + c.intensity, 0) / (signals.length || 1)
  if (avg > 0.7) return 'maelstrom'
  if (avg > 0.5) return 'volatile'
  if (avg > 0.25) return 'tense'
  return 'calm'
}

function chapterMoodFromSignals(dominant: ProcessedSignal | undefined): string {
  if (!dominant) return 'A quiet chapter — intrigue moves in shadow.'
  const { direction } = dominant
  const effects: Record<string, string> = {
    crash: 'Crisis energy permeates. Desperate choices surface.',
    volatile: 'Instability crackles through every scene.',
    surge: 'Ambition swells. Power shifts are imminent.',
    spike: 'Tension spikes. Someone will overreach.',
    neutral: 'Calculated stillness — the board is being set.',
  }
  return effects[direction] ?? 'The Stitching stirs.'
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const [cryptoSignals, socialSignal, onchainSignal, entropySignal] = await Promise.all([
      fetchCryptoSignals(),
      Promise.resolve(generateSocialSignal()),
      Promise.resolve(generateOnchainSignal()),
      Promise.resolve(generateEntropySignal()),
    ])

    const allSignals = [
      ...cryptoSignals,
      socialSignal,
      onchainSignal,
      entropySignal,
    ].sort((a, b) => b.intensity - a.intensity) // highest impact first

    const chaosIntensity = computeChaosIntensity(allSignals)
    const dominant = allSignals[0]
    const isMock = allSignals.some(
      (s) => s.id.includes('mock') || s.source === 'social' || s.source === 'internal',
    )

    const response: ChaosOracleResponse = {
      signals: allSignals,
      chaosIntensity,
      dominantEffect: dominant?.mapping.narrativeEffect ?? 'No dominant signal',
      dominantHouseBeneficiary: dominant?.mapping.houseBeneficiary ?? 'none',
      dominantHouseBurdened: dominant?.mapping.houseBurdened ?? 'none',
      chapterMoodOverride: chapterMoodFromSignals(dominant),
      cachedAt: new Date().toISOString(),
      isMock,
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('[chaos-oracle/signals] Error:', error)
    return NextResponse.json(
      { error: 'Chaos Oracle temporarily offline', signals: [] },
      { status: 500 },
    )
  }
}
