/**
 * Example Consequence Rules for Voidborne Chapter 3
 * 
 * Demonstrates how to define consequence rules that create
 * permanent narrative impacts.
 */

import { ConsequenceRule } from './types'

/**
 * Create example consequence rules for demonstration
 */
export function createExampleRules(storyId: string): ConsequenceRule[] {
  return [
    // ========================================================================
    // Choice A: Accuse Lord Kaelen of Stitching
    // ========================================================================
    {
      id: 'rule-accuse-kaelen-reputation',
      name: 'Kaelen Reputation Drop',
      description: 'Publicly accusing Lord Kaelen damages his reputation',
      storyId,
      triggerChoiceId: 'choice-accuse-kaelen',
      triggerChapter: 3,
      mutations: [
        { op: 'add', path: 'characters.lord-kaelen.reputation', value: -65 },
        { op: 'set', path: 'characters.lord-kaelen.relationships.house-valdris', value: -80 },
        { op: 'add', path: 'characters.lord-kaelen.relationships.house-arctis', value: 30 },
        { op: 'append', path: 'characters.lord-kaelen.traumaticEvents', value: 'public-accusation' },
      ],
      futureRequirements: {
        4: ['Lord Kaelen must appear plotting revenge'],
        5: ['House Arctis offers alliance to player'],
        12: ['Lord Kaelen betrays player if relationship < -70'],
      },
      displayText: '⚠️ Lord Kaelen now despises you',
      severity: 'critical',
    },
    {
      id: 'rule-accuse-kaelen-politics',
      name: 'Political Tension Escalates',
      description: 'Public accusation increases political instability',
      storyId,
      triggerChoiceId: 'choice-accuse-kaelen',
      triggerChapter: 3,
      mutations: [
        { op: 'add', path: 'world.politicalTension', value: 25 },
        { op: 'add', path: 'world.factionInfluence.house-arctis', value: 15 },
        { op: 'add', path: 'world.factionInfluence.house-kaelen', value: -20 },
      ],
      futureRequirements: {
        6: ['Political crisis must occur due to high tension'],
      },
      displayText: '📈 Political tension is rising',
      severity: 'major',
    },
    {
      id: 'rule-accuse-kaelen-investigation',
      name: 'Stitching Investigation Begins',
      description: 'Opens the stitching investigation plot thread',
      storyId,
      triggerChoiceId: 'choice-accuse-kaelen',
      triggerChapter: 3,
      mutations: [
        { op: 'set', path: 'plotThreads.stitching-investigation.status', value: 'active' },
        { op: 'set', path: 'plotThreads.stitching-investigation.tension', value: 90 },
        { op: 'append', path: 'plotThreads.stitching-investigation.keySuspects', value: 'lord-kaelen' },
        { op: 'set', path: 'plotThreads.stitching-investigation.cluesDiscovered', value: 3 },
      ],
      futureRequirements: {
        4: ['Investigation continues - player must find more clues'],
        8: ['Investigation resolves based on clues found (need 5+ for conviction)'],
      },
      displayText: '🔍 Investigation opened',
      severity: 'major',
    },

    // ========================================================================
    // Choice B: Warn Kaelen Privately
    // ========================================================================
    {
      id: 'rule-warn-kaelen-trust',
      name: 'Kaelen Grateful for Warning',
      description: 'Private warning builds trust with Lord Kaelen',
      storyId,
      triggerChoiceId: 'choice-warn-kaelen',
      triggerChapter: 3,
      mutations: [
        { op: 'add', path: 'characters.lord-kaelen.reputation', value: 15 },
        { op: 'set', path: 'characters.lord-kaelen.relationships.player', value: 60 },
        { op: 'append', path: 'characters.lord-kaelen.secrets', value: 'player-warned-me' },
      ],
      futureRequirements: {
        4: ['Lord Kaelen offers information about rival houses'],
        7: ['Lord Kaelen helps player during crisis'],
      },
      displayText: '🤝 Lord Kaelen trusts you',
      severity: 'moderate',
    },
    {
      id: 'rule-warn-kaelen-investigation-quiet',
      name: 'Investigation Remains Quiet',
      description: 'Private warning keeps investigation dormant',
      storyId,
      triggerChoiceId: 'choice-warn-kaelen',
      triggerChapter: 3,
      mutations: [
        { op: 'set', path: 'plotThreads.stitching-investigation.status', value: 'dormant' },
        { op: 'set', path: 'plotThreads.stitching-investigation.tension', value: 20 },
      ],
      futureRequirements: {
        10: ['Investigation may resurface if new evidence emerges'],
      },
      displayText: '🤫 Investigation stays quiet',
      severity: 'minor',
    },

    // ========================================================================
    // Choice C: Do Nothing
    // ========================================================================
    {
      id: 'rule-do-nothing-status-quo',
      name: 'Status Quo Maintained',
      description: 'Taking no action preserves current relationships',
      storyId,
      triggerChoiceId: 'choice-do-nothing',
      triggerChapter: 3,
      mutations: [
        // No immediate changes - but sets up future vulnerability
      ],
      futureRequirements: {
        5: ['Player is caught off-guard by Kaelen\'s actions'],
        9: ['Other houses distrust player for inaction'],
      },
      displayText: '⏸️ No immediate consequences',
      severity: 'minor',
    },
    {
      id: 'rule-do-nothing-stitching-spreads',
      name: 'Stitching Epidemic Worsens',
      description: 'Inaction allows stitching to spread unchecked',
      storyId,
      triggerChoiceId: 'choice-do-nothing',
      triggerChapter: 3,
      mutations: [
        { op: 'append', path: 'world.cosmicAnomalies', value: 'stitching-outbreak' },
        { op: 'add', path: 'world.politicalTension', value: 10 },
      ],
      futureRequirements: {
        6: ['Stitching casualties increase - public panic'],
        11: ['Player blamed for not acting sooner'],
      },
      displayText: '☠️ Stitching threat grows',
      severity: 'moderate',
    },

    // ========================================================================
    // Conditional Rules (Example)
    // ========================================================================
    {
      id: 'rule-kaelen-revenge-high-tension',
      name: 'Kaelen Plots Assassination (High Tension)',
      description: 'If political tension > 80 and Kaelen hates player, assassination plot begins',
      storyId,
      triggerChoiceId: 'choice-accuse-kaelen',
      triggerChapter: 3,
      conditions: [
        { path: 'world.politicalTension', operator: 'gt', value: 80 },
        { path: 'characters.lord-kaelen.relationships.player', operator: 'lt', value: -60 },
      ],
      mutations: [
        { op: 'set', path: 'plotThreads.assassination-plot.status', value: 'active' },
        { op: 'set', path: 'plotThreads.assassination-plot.tension', value: 95 },
        { op: 'append', path: 'plotThreads.assassination-plot.keySuspects', value: 'lord-kaelen' },
      ],
      futureRequirements: {
        5: ['Player survives assassination attempt'],
        6: ['Player must identify assassin or face second attempt'],
      },
      displayText: '⚠️ CRITICAL: Kaelen plots your assassination!',
      severity: 'critical',
    },
  ]
}

/**
 * Example: Initialize narrative state with starting conditions
 */
export function createInitialState(storyId: string): any {
  return {
    storyId,
    chapterNumber: 0,
    version: 1,
    timestamp: new Date(),
    characters: {
      'lord-kaelen': {
        alive: true,
        reputation: 20,
        location: 'house-kaelen-manor',
        relationships: {
          'house-valdris': 10,
          'house-arctis': -10,
          'player': 0,
        },
        traumaticEvents: [],
        secrets: ['possibly-involved-in-stitching'],
        powerLevel: 65,
      },
      'lady-arctis': {
        alive: true,
        reputation: 45,
        location: 'house-arctis-tower',
        relationships: {
          'house-kaelen': -30,
          'player': 20,
        },
        traumaticEvents: [],
        secrets: ['knows-more-than-she-says'],
        powerLevel: 70,
      },
    },
    world: {
      politicalTension: 55,
      economicStability: 60,
      factionInfluence: {
        'house-kaelen': 40,
        'house-arctis': 50,
        'house-valdris': 35,
      },
      activeWars: [],
      discoveredTechnologies: ['basic-stitching-detection'],
      cosmicAnomalies: ['void-storms-increasing'],
      environmentalHazards: [],
    },
    plotThreads: {
      'stitching-investigation': {
        status: 'dormant',
        tension: 30,
        keySuspects: ['lord-kaelen', 'unknown-faction'],
        cluesDiscovered: 1,
        chapters: [2, 3],
      },
      'assassination-plot': {
        status: 'dormant',
        tension: 0,
        keySuspects: [],
        cluesDiscovered: 0,
        chapters: [],
      },
    },
    metadata: {
      totalChoicesMade: 0,
      majorBranches: [],
    },
  }
}
