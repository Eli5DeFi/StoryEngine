/**
 * Voidborne — Narrative DNA Engine (NDE)
 * Innovation Cycle #50 — February 18, 2026
 *
 * Each player's betting history creates a 12-dimension Narrative DNA vector.
 * This DNA personalizes future chapter generation through Claude API prompts,
 * creating a unique story experience while preserving canonical plot events.
 *
 * DNA can be minted as NFTs, traded, and shared with other players.
 */

import type { HouseId } from './house-agents'

// ============================================================================
// TYPES
// ============================================================================

export interface NarrativeDNA {
  playerId: string
  version: number
  confidence: number        // 0-100: how many bets have shaped this (100 = fully calibrated)
  vector: DNAVector
  dominantTraits: string[]  // top 3 traits for display
  archetypeLabel: string    // human-readable archetype
  mintable: boolean         // enough confidence to mint as NFT
  lastUpdatedAt: Date
}

export interface DNAVector {
  /**
   * 0 = simple action/adventure preference
   * 1 = loves deep political intrigue and moral complexity
   */
  politicalComplexity: number

  /**
   * 0 = rarely backs betrayal choices
   * 1 = consistently picks the betrayal option
   */
  betrayalAffinity: number

  /**
   * 0 = tends to bet characters will die/fail
   * 1 = tends to bet characters will survive/succeed
   */
  survivalOptimism: number

  /**
   * Which house's bets are most often aligned with this player?
   * e.g., "obsidian" | "valdris" | "none"
   */
  houseAllegiance: HouseId | 'none'

  /**
   * 0 = always bets with the crowd (consensus bettor)
   * 1 = always bets against the crowd (contrarian)
   */
  riskProfile: number

  /**
   * 0 = prefers slow, methodical plot reveals
   * 1 = prefers fast-paced, action-driven chapters
   */
  pacingPreference: number

  /**
   * 0 = consistently backs ruthless/pragmatic choices
   * 1 = consistently backs honorable/principled choices
   */
  moralAlignment: number

  /**
   * 0 = hates upsets (prefers predictable, safe bets)
   * 1 = loves upsets (contrarian by nature, craves surprises)
   */
  plotTwistHunger: number

  /**
   * 0 = bets for breaking alliances/fractures
   * 1 = bets for maintaining alliances/stability
   */
  allianceStability: number

  /**
   * 0 = ignores secondary characters in bets
   * 1 = actively bets on secondary character arcs
   */
  characterDepth: number

  /**
   * 0 = prefers personal/intimate stakes
   * 1 = prefers universe-scale stakes and cosmic consequences
   */
  cosmicScope: number

  /**
   * 0 = strongly prefers triumphant story arcs
   * 1 = strongly prefers tragic/dark story arcs
   */
  emotionalIntensity: number
}

export interface BetRecord {
  chapterId: string
  chapterNumber: number
  choiceId: string
  choiceText: string
  choiceIndex: number      // 0 = first/consensus, 1 = underdog, etc.
  poolShare: number        // fraction of pool this choice had (0-1) when bet placed
  won: boolean
  houseAgentAlignment: HouseId | null  // if bet matched a house agent's choice
  storyTags: string[]      // AI-extracted tags: ["betrayal", "survival", "alliance", etc.]
}

export interface PersonalizationPrompt {
  systemAddition: string   // appended to chapter generation system prompt
  userAddition: string     // appended to the chapter user prompt
  emphasizedElements: string[]
  deemphasizedElements: string[]
}

// ============================================================================
// DNA ENGINE
// ============================================================================

export class NarrativeDNAEngine {
  private playerDNAs: Map<string, NarrativeDNA> = new Map()

  /**
   * Initialize or retrieve a player's DNA.
   */
  getOrCreateDNA(playerId: string): NarrativeDNA {
    if (!this.playerDNAs.has(playerId)) {
      this.playerDNAs.set(playerId, this.blankDNA(playerId))
    }
    return this.playerDNAs.get(playerId)!
  }

  /**
   * Update DNA from a single bet record.
   * Uses exponential moving average (EMA) for smooth adaptation.
   */
  updateFromBet(playerId: string, bet: BetRecord): NarrativeDNA {
    const dna = this.getOrCreateDNA(playerId)
    const alpha = this.learningRate(dna.confidence)  // lower alpha early (faster learning)

    // --- betrayal affinity ---
    if (bet.storyTags.includes('betrayal')) {
      const betTeaBetrayalChoice = bet.choiceText.toLowerCase().includes('betray')
        || bet.choiceText.toLowerCase().includes('deceive')
        || bet.choiceText.toLowerCase().includes('expose')
      dna.vector.betrayalAffinity = this.ema(
        dna.vector.betrayalAffinity,
        betTeaBetrayalChoice ? 1 : 0,
        alpha
      )
    }

    // --- survival optimism ---
    if (bet.storyTags.includes('survival') || bet.storyTags.includes('death')) {
      const bettedSurvival = bet.choiceText.toLowerCase().includes('survive')
        || bet.choiceText.toLowerCase().includes('protect')
        || bet.choiceText.toLowerCase().includes('save')
      dna.vector.survivalOptimism = this.ema(dna.vector.survivalOptimism, bettedSurvival ? 1 : 0, alpha)
    }

    // --- risk profile (contrarianism) ---
    // If bet on minority pool position → contrarian signal
    const isContrarian = bet.poolShare < 0.35
    dna.vector.riskProfile = this.ema(dna.vector.riskProfile, isContrarian ? 1 : 0, alpha)

    // --- moral alignment ---
    if (bet.storyTags.includes('honor') || bet.storyTags.includes('pragmatic')) {
      const isHonorable = bet.storyTags.includes('honor')
        || bet.choiceText.toLowerCase().includes('truth')
        || bet.choiceText.toLowerCase().includes('justice')
      dna.vector.moralAlignment = this.ema(dna.vector.moralAlignment, isHonorable ? 1 : 0, alpha)
    }

    // --- plot twist hunger ---
    if (bet.won && isContrarian) {
      dna.vector.plotTwistHunger = this.ema(dna.vector.plotTwistHunger, 1, alpha)
    } else if (!bet.won && isContrarian) {
      dna.vector.plotTwistHunger = this.ema(dna.vector.plotTwistHunger, 0.2, alpha)
    }

    // --- alliance stability ---
    if (bet.storyTags.includes('alliance') || bet.storyTags.includes('fracture')) {
      const favoredAlliance = bet.storyTags.includes('alliance')
        && !bet.choiceText.toLowerCase().includes('break')
        && !bet.choiceText.toLowerCase().includes('betray')
      dna.vector.allianceStability = this.ema(dna.vector.allianceStability, favoredAlliance ? 1 : 0, alpha)
    }

    // --- house allegiance ---
    if (bet.houseAgentAlignment) {
      const counts = this.countHouseAllegiance(playerId)
      const topHouse = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
      dna.vector.houseAllegiance = topHouse ? (topHouse[0] as HouseId) : 'none'
    }

    // Increase confidence
    dna.confidence = Math.min(dna.confidence + 1, 100)
    dna.version++
    dna.mintable = dna.confidence >= 20
    dna.lastUpdatedAt = new Date()

    // Recompute derived fields
    dna.dominantTraits = this.computeDominantTraits(dna.vector)
    dna.archetypeLabel = this.computeArchetype(dna.vector)

    this.playerDNAs.set(playerId, dna)
    return dna
  }

  /**
   * Generate a personalization prompt to inject into Claude chapter generation.
   */
  generatePersonalizationPrompt(dna: NarrativeDNA): PersonalizationPrompt {
    if (dna.confidence < 5) {
      // Not enough data yet — return neutral
      return {
        systemAddition: '',
        userAddition: '',
        emphasizedElements: [],
        deemphasizedElements: [],
      }
    }

    const v = dna.vector
    const emphasized: string[] = []
    const deemphasized: string[] = []

    // Build emphasis list based on DNA extremes (>0.7 or <0.3)
    if (v.politicalComplexity > 0.7) emphasized.push('multi-layered political intrigue and moral ambiguity')
    if (v.politicalComplexity < 0.3) emphasized.push('clear, direct stakes and action sequences')
    if (v.betrayalAffinity > 0.7) emphasized.push('subtle loyalty tests and betrayal foreshadowing')
    if (v.survivalOptimism < 0.3) emphasized.push('realistic consequences — characters may not survive')
    if (v.survivalOptimism > 0.8) emphasized.push('hope and resilience in the face of danger')
    if (v.riskProfile > 0.6) emphasized.push('ambiguous choices where contrarian thinking is rewarded')
    if (v.moralAlignment > 0.7) emphasized.push('ethical dilemmas with clear principled options')
    if (v.moralAlignment < 0.3) emphasized.push('pragmatic realpolitik — no clean moral choices')
    if (v.plotTwistHunger > 0.7) emphasized.push('unexpected reversals and surprising reveals')
    if (v.allianceStability < 0.3) emphasized.push('fractures in alliances and shifting loyalties')
    if (v.allianceStability > 0.8) emphasized.push('the strength of tested alliances')
    if (v.cosmicScope > 0.7) emphasized.push('universe-scale consequences and existential stakes')
    if (v.emotionalIntensity > 0.7) emphasized.push('darker, more tragic undertones and sacrifice themes')
    if (v.characterDepth > 0.7) emphasized.push('rich secondary character development')

    // House allegiance → POV emphasis
    const houseSceneMap: Record<string, string> = {
      valdris: "House Valdris's perspective and Throne-preserving motivations",
      obsidian: "House Obsidian's shadowy operations and strategic reveals",
      meridian: "House Meridian's neutral arbitration and diplomatic calculations",
      auric: "House Auric's economic machinations and opportunity-seeking",
      zephyr: "House Zephyr's adaptive survival and political flexibility",
    }
    if (v.houseAllegiance !== 'none' && houseSceneMap[v.houseAllegiance]) {
      emphasized.push(houseSceneMap[v.houseAllegiance])
    }

    // Pacing signal
    const pacingNote = v.pacingPreference > 0.7
      ? 'fast-paced, high-tension prose with shorter scenes'
      : v.pacingPreference < 0.3
        ? 'slower, atmospheric prose with deeper world-building details'
        : ''
    if (pacingNote) emphasized.push(pacingNote)

    const systemAddition = emphasized.length > 0
      ? `\n\nREADER PERSONALIZATION (based on ${dna.confidence} bets):\nThis chapter should subtly emphasize:\n${emphasized.map(e => `- ${e}`).join('\n')}`
      : ''

    const userAddition = dna.archetypeLabel !== 'The Neutral Observer'
      ? `\n\nReader archetype: "${dna.archetypeLabel}" — tailor the chapter's atmosphere accordingly.`
      : ''

    return {
      systemAddition,
      userAddition,
      emphasizedElements: emphasized,
      deemphasizedElements: deemphasized,
    }
  }

  /**
   * Compute the distance between two DNA vectors (0 = identical, 1 = opposite).
   * Used for DNA trading marketplace compatibility scores.
   */
  dnaSimilarity(a: NarrativeDNA, b: NarrativeDNA): number {
    const va = a.vector
    const vb = b.vector

    const numericKeys: Array<keyof Omit<DNAVector, 'houseAllegiance'>> = [
      'politicalComplexity', 'betrayalAffinity', 'survivalOptimism',
      'riskProfile', 'pacingPreference', 'moralAlignment', 'plotTwistHunger',
      'allianceStability', 'characterDepth', 'cosmicScope', 'emotionalIntensity',
    ]

    const squaredDiffs = numericKeys.map(k => {
      const diff = (va[k] as number) - (vb[k] as number)
      return diff * diff
    })

    const euclidean = Math.sqrt(squaredDiffs.reduce((sum, d) => sum + d, 0))
    const maxDistance = Math.sqrt(numericKeys.length)  // max if all dimensions are 0 vs 1
    return 1 - euclidean / maxDistance
  }

  /**
   * Generate a human-readable "DNA Card" for display / NFT metadata.
   */
  generateDNACard(dna: NarrativeDNA): string {
    const v = dna.vector
    const bars = (val: number) => '█'.repeat(Math.round(val * 10)).padEnd(10, '░')

    return [
      `🧬 NARRATIVE DNA — ${dna.archetypeLabel}`,
      `Player: ${dna.playerId} | Confidence: ${dna.confidence}/100 | v${dna.version}`,
      '',
      `Political Complexity  ${bars(v.politicalComplexity)} ${(v.politicalComplexity * 100).toFixed(0)}%`,
      `Betrayal Affinity     ${bars(v.betrayalAffinity)} ${(v.betrayalAffinity * 100).toFixed(0)}%`,
      `Survival Optimism     ${bars(v.survivalOptimism)} ${(v.survivalOptimism * 100).toFixed(0)}%`,
      `Contrarianism         ${bars(v.riskProfile)} ${(v.riskProfile * 100).toFixed(0)}%`,
      `Plot Twist Hunger     ${bars(v.plotTwistHunger)} ${(v.plotTwistHunger * 100).toFixed(0)}%`,
      `Moral Alignment       ${bars(v.moralAlignment)} ${(v.moralAlignment * 100).toFixed(0)}%`,
      `Emotional Intensity   ${bars(v.emotionalIntensity)} ${(v.emotionalIntensity * 100).toFixed(0)}%`,
      `Cosmic Scope          ${bars(v.cosmicScope)} ${(v.cosmicScope * 100).toFixed(0)}%`,
      '',
      `House Allegiance: ${v.houseAllegiance === 'none' ? 'Unaligned' : v.houseAllegiance.toUpperCase()}`,
      `Dominant Traits: ${dna.dominantTraits.join(', ')}`,
      dna.mintable ? '✅ Ready to mint as NFT' : `🔒 ${20 - dna.confidence} more bets to unlock minting`,
    ].join('\n')
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private blankDNA(playerId: string): NarrativeDNA {
    return {
      playerId,
      version: 0,
      confidence: 0,
      vector: {
        politicalComplexity: 0.5,
        betrayalAffinity: 0.5,
        survivalOptimism: 0.5,
        houseAllegiance: 'none',
        riskProfile: 0.5,
        pacingPreference: 0.5,
        moralAlignment: 0.5,
        plotTwistHunger: 0.5,
        allianceStability: 0.5,
        characterDepth: 0.5,
        cosmicScope: 0.5,
        emotionalIntensity: 0.5,
      },
      dominantTraits: [],
      archetypeLabel: 'The Neutral Observer',
      mintable: false,
      lastUpdatedAt: new Date(),
    }
  }

  private ema(current: number, newValue: number, alpha: number): number {
    // Exponential moving average: smoothly updates toward new signal
    const result = (1 - alpha) * current + alpha * newValue
    return Math.min(Math.max(result, 0), 1)
  }

  private learningRate(confidence: number): number {
    // Higher learning rate when less confident (few bets), stabilizes over time
    if (confidence < 10) return 0.4
    if (confidence < 30) return 0.2
    if (confidence < 60) return 0.1
    return 0.05
  }

  private countHouseAllegiance(_playerId: string): Record<string, number> {
    // In production: query DB for player's bet history vs. house agent bets
    // Mock implementation for POC
    return {
      valdris: 0,
      obsidian: 0,
      meridian: 0,
      auric: 0,
      zephyr: 0,
    }
  }

  private computeDominantTraits(v: DNAVector): string[] {
    const traits: Array<[string, number, boolean]> = [
      ['Contrarian', v.riskProfile, true],
      ['Betrayal-Seeker', v.betrayalAffinity, true],
      ['Optimist', v.survivalOptimism, true],
      ['Twist-Hunter', v.plotTwistHunger, true],
      ['Strategist', v.politicalComplexity, true],
      ['Moralist', v.moralAlignment, true],
      ['Cosmicist', v.cosmicScope, true],
      ['Tragedian', v.emotionalIntensity, true],
      ['Consensus Bettor', 1 - v.riskProfile, v.riskProfile < 0.3],
      ['Alliance Builder', v.allianceStability, v.allianceStability > 0.7],
    ]

    return traits
      .filter(([, score, active]) => active && score > 0.65)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 3)
      .map(([name]) => name)
  }

  private computeArchetype(v: DNAVector): string {
    if (v.betrayalAffinity > 0.7 && v.politicalComplexity > 0.6) return 'The Grand Schemer'
    if (v.riskProfile > 0.7 && v.plotTwistHunger > 0.7) return 'The Chaos Agent'
    if (v.survivalOptimism > 0.8 && v.moralAlignment > 0.7) return 'The True Believer'
    if (v.moralAlignment < 0.3 && v.politicalComplexity > 0.6) return 'The Realpolitician'
    if (v.cosmicScope > 0.8 && v.emotionalIntensity > 0.6) return 'The Void Dreamer'
    if (v.allianceStability > 0.8 && v.riskProfile < 0.3) return 'The Conclave Loyalist'
    if (v.characterDepth > 0.8) return 'The Story Architect'
    if (v.pacingPreference > 0.8) return 'The Adrenaline Seeker'
    if (v.riskProfile < 0.2 && v.survivalOptimism > 0.6) return 'The Safe Warden'
    return 'The Neutral Observer'
  }
}
