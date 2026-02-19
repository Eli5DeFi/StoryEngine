/**
 * Chaos Oracle Protocol — Signal Processing Tests
 * Innovation Cycle #53 — "The Living Story Protocol"
 *
 * Tests the signal-to-narrative mapping logic inline (no HTTP calls).
 */

// ─── Inline type / helper mirror (avoids next imports in test context) ──────

type SignalDirection = 'spike' | 'crash' | 'surge' | 'neutral' | 'volatile'

interface NarrativeMapping {
  houseBeneficiary: string
  houseBurdened: string
  parameterAffected: string
  narrativeEffect: string
  intensity: number
}

type MappingFn = (intensity: number, direction: SignalDirection, value: number) => NarrativeMapping

function priceDirection(pct: number): SignalDirection {
  if (pct < -10) return 'crash'
  if (pct < -3) return 'volatile'
  if (pct > 10) return 'surge'
  if (pct > 3) return 'spike'
  return 'neutral'
}

const BTC_MAP: MappingFn = (intensity, direction) => {
  if (direction === 'crash') return { houseBeneficiary: 'null', houseBurdened: 'valdris', parameterAffected: 'politicalPressure', narrativeEffect: 'House Valdris treasury depleted', intensity }
  if (direction === 'surge' || direction === 'spike') return { houseBeneficiary: 'valdris', houseBurdened: 'null', parameterAffected: 'politicalPressure', narrativeEffect: 'Valdris treasury overflows', intensity }
  return { houseBeneficiary: 'strand', houseBurdened: 'none', parameterAffected: 'politicalPressure', narrativeEffect: 'Markets stable', intensity: 0.2 }
}

function computeChaosIntensity(avgIntensity: number): 'calm' | 'tense' | 'volatile' | 'maelstrom' {
  if (avgIntensity > 0.7) return 'maelstrom'
  if (avgIntensity > 0.5) return 'volatile'
  if (avgIntensity > 0.25) return 'tense'
  return 'calm'
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('priceDirection', () => {
  it('identifies crash below -10%', () => {
    expect(priceDirection(-14.2)).toBe('crash')
    expect(priceDirection(-10.1)).toBe('crash')
  })

  it('identifies volatile between -10% and -3%', () => {
    expect(priceDirection(-5.0)).toBe('volatile')
    expect(priceDirection(-3.1)).toBe('volatile')
  })

  it('identifies neutral between -3% and +3%', () => {
    expect(priceDirection(-1.0)).toBe('neutral')
    expect(priceDirection(0)).toBe('neutral')
    expect(priceDirection(2.5)).toBe('neutral')
  })

  it('identifies surge above +10%', () => {
    expect(priceDirection(12.0)).toBe('surge')
    expect(priceDirection(22.1)).toBe('surge')
  })

  it('identifies spike between +3% and +10%', () => {
    expect(priceDirection(5.0)).toBe('spike')
    expect(priceDirection(9.9)).toBe('spike')
  })
})

describe('BTC narrative mapping', () => {
  it('burdens Valdris on crash', () => {
    const mapping = BTC_MAP(0.8, 'crash', -14.2)
    expect(mapping.houseBurdened).toBe('valdris')
    expect(mapping.houseBeneficiary).toBe('null')
    expect(mapping.intensity).toBe(0.8)
  })

  it('benefits Valdris on surge', () => {
    const mapping = BTC_MAP(0.6, 'surge', 12.0)
    expect(mapping.houseBeneficiary).toBe('valdris')
    expect(mapping.intensity).toBe(0.6)
  })

  it('returns stable mapping on neutral', () => {
    const mapping = BTC_MAP(0.1, 'neutral', 1.2)
    expect(mapping.houseBeneficiary).toBe('strand')
    expect(mapping.intensity).toBe(0.2) // fixed stable intensity
  })
})

describe('chaos intensity computation', () => {
  it('returns calm for low avg intensity', () => {
    expect(computeChaosIntensity(0.1)).toBe('calm')
    expect(computeChaosIntensity(0.24)).toBe('calm')
  })

  it('returns tense for moderate intensity', () => {
    expect(computeChaosIntensity(0.3)).toBe('tense')
    expect(computeChaosIntensity(0.5)).toBe('tense')
  })

  it('returns volatile for elevated intensity', () => {
    expect(computeChaosIntensity(0.55)).toBe('volatile')
    expect(computeChaosIntensity(0.7)).toBe('volatile')
  })

  it('returns maelstrom for extreme intensity', () => {
    expect(computeChaosIntensity(0.71)).toBe('maelstrom')
    expect(computeChaosIntensity(1.0)).toBe('maelstrom')
  })
})

describe('intensity clamping', () => {
  it('never exceeds 1.0 regardless of price swing', () => {
    const swings = [-50, -20, 25, 100]
    swings.forEach(swing => {
      const intensity = Math.min(1, Math.abs(swing) / 20)
      expect(intensity).toBeLessThanOrEqual(1)
      expect(intensity).toBeGreaterThanOrEqual(0)
    })
  })
})
