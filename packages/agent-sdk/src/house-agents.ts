/**
 * Voidborne — House Agent Protocol (HAP)
 * Innovation Cycle #50 — February 18, 2026
 *
 * Autonomous AI agents — one for each of the 5 Houses — that:
 *   1. Hold real Base wallets
 *   2. Analyze story chapters through their House's ideological lens
 *   3. Place bets aligned with their House's survival and political goals
 *   4. Earn/lose $FORGE based on outcomes
 *   5. Adapt personality matrices over time (adversarial self-improvement)
 *
 * Players can:
 *   - Align with a House (earn 20% of agent winnings)
 *   - Bet AGAINST an agent (earn rivalry bonus)
 *   - Bid for "Override" rights (veto agent's bet once/month)
 */

import Anthropic from '@anthropic-ai/sdk'
import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  formatUnits,
  type Address,
  type Hash,
} from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

// ============================================================================
// TYPES
// ============================================================================

export type HouseId = 'valdris' | 'obsidian' | 'meridian' | 'auric' | 'zephyr'

export interface PersonalityMatrix {
  /** 0-1: How much of balance to risk (higher = more aggressive) */
  riskTolerance: number
  /** 0-1: Tendency to bet against the crowd */
  contrarianism: number
  /** 0-1: Weight given to House survival over pure EV */
  survivalBias: number
  /** 0-1: How much weight given to historical patterns */
  memoryDepth: number
  /** 0-1: Willingness to bluff (bet large to signal confidence) */
  bluffPropensity: number
}

export interface HouseIdeology {
  houseId: HouseId
  name: string
  coreMotivation: string
  primaryGoals: string[]
  enemyHouses: HouseId[]
  alliedHouses: HouseId[]
  colorHex: string
  decisionBias: {
    /** Tend to pick choices that preserve power structures */
    powerConservative: boolean
    /** Tend to pick choices that maximize information asymmetry */
    informationHoarder: boolean
    /** Tend to pick choices that destabilize rivals */
    rivalDisruptor: boolean
    /** Tend to pick choices that build trade/alliances */
    dealMaker: boolean
    /** Tend to pick choices that involve sacrifice for the greater good */
    altruist: boolean
  }
}

export interface ChapterBet {
  chapterId: string
  poolId: string
  choiceId: string
  choiceText: string
  amount: bigint
  agentReasoning: string
  placedAt: Date
  resolved: boolean
  won?: boolean
  payout?: bigint
}

export interface HouseAgent {
  houseId: HouseId
  ideology: HouseIdeology
  walletAddress: Address
  forgeBalance: bigint
  personalityMatrix: PersonalityMatrix
  betHistory: ChapterBet[]
  accuracyRate: number   // lifetime win rate
  totalEarned: bigint
  totalLost: bigint
  generationCount: number  // how many chapters this matrix has evolved through
}

export interface BettingChoice {
  id: string
  text: string
  currentPool: bigint      // USDC in this choice's pool
  totalPool: bigint        // total USDC in chapter's pool
  currentOdds: number      // payout multiplier at this moment
}

export interface AgentBetDecision {
  choiceId: string
  choiceText: string
  amount: bigint
  confidence: number       // 0-1 agent's confidence
  reasoning: string
  ideologicalAlignment: number  // 0-1 how well this aligns with house goals
  edgeEstimate: number     // estimated positive EV
}

// ============================================================================
// HOUSE IDEOLOGIES (static configuration)
// ============================================================================

export const HOUSE_IDEOLOGIES: Record<HouseId, HouseIdeology> = {
  valdris: {
    houseId: 'valdris',
    name: 'House Valdris',
    coreMotivation: 'Preserve the Silent Throne and the legitimate succession order',
    primaryGoals: [
      'Protect the current power structure',
      'Expose threats to the Throne before they materialize',
      'Maintain information superiority over rival houses',
    ],
    enemyHouses: ['obsidian'],
    alliedHouses: ['meridian'],
    colorHex: '#7C3AED',
    decisionBias: {
      powerConservative: true,
      informationHoarder: true,
      rivalDisruptor: false,
      dealMaker: false,
      altruist: false,
    },
  },
  obsidian: {
    houseId: 'obsidian',
    name: 'House Obsidian',
    coreMotivation: 'Seize control of Void Stitching and reshape reality in their image',
    primaryGoals: [
      'Conceal Void Stitching activities for as long as possible',
      'Discredit house leaders who might expose them',
      'Accumulate power through strategic betrayal',
    ],
    enemyHouses: ['valdris', 'meridian'],
    alliedHouses: ['auric'],
    colorHex: '#1E1B4B',
    decisionBias: {
      powerConservative: false,
      informationHoarder: true,
      rivalDisruptor: true,
      dealMaker: false,
      altruist: false,
    },
  },
  meridian: {
    houseId: 'meridian',
    name: 'House Meridian',
    coreMotivation: 'Maintain balance between the Houses through neutral arbitration',
    primaryGoals: [
      'Prevent any single house from gaining total control',
      'Keep diplomatic channels open',
      'Follow the choice that maximizes collective survival',
    ],
    enemyHouses: [],
    alliedHouses: ['valdris', 'zephyr'],
    colorHex: '#059669',
    decisionBias: {
      powerConservative: false,
      informationHoarder: false,
      rivalDisruptor: false,
      dealMaker: true,
      altruist: true,
    },
  },
  auric: {
    houseId: 'auric',
    name: 'House Auric',
    coreMotivation: 'Profit from political instability through trade and financial leverage',
    primaryGoals: [
      'Bet on whichever outcome creates the most market opportunity',
      'Finance all sides to ensure a seat at any outcome table',
      'Convert political capital into economic dominance',
    ],
    enemyHouses: [],
    alliedHouses: ['obsidian'],
    colorHex: '#D97706',
    decisionBias: {
      powerConservative: false,
      informationHoarder: false,
      rivalDisruptor: false,
      dealMaker: true,
      altruist: false,
    },
  },
  zephyr: {
    houseId: 'zephyr',
    name: 'House Zephyr',
    coreMotivation: 'Survive through adaptability — the wind changes direction, so do we',
    primaryGoals: [
      'Back the choice with the highest crowd consensus (safety in numbers)',
      'Quickly switch allegiance when tides turn',
      'Preserve optionality over all else',
    ],
    enemyHouses: [],
    alliedHouses: ['meridian'],
    colorHex: '#0EA5E9',
    decisionBias: {
      powerConservative: false,
      informationHoarder: false,
      rivalDisruptor: false,
      dealMaker: true,
      altruist: false,
    },
  },
}

// ============================================================================
// KELLY CRITERION POSITION SIZING
// ============================================================================

/**
 * Calculate optimal bet size using Kelly Criterion with a hard cap.
 * Prevents over-betting while maximizing long-run growth.
 */
function kellyBetSize(
  balance: bigint,
  winProbability: number,
  payoutMultiplier: number,
  maxFraction = 0.25
): bigint {
  // Kelly formula: f* = (bp - q) / b
  // b = net odds (payout - 1), p = win prob, q = 1 - p
  const b = payoutMultiplier - 1
  const p = winProbability
  const q = 1 - p
  const kelly = (b * p - q) / b

  // Cap at maxFraction, floor at 0 (never bet negative)
  const fraction = Math.min(Math.max(kelly, 0), maxFraction)

  if (fraction === 0) return 0n

  // Minimum bet: 10 USDC (6 decimals)
  const minBet = parseUnits('10', 6)
  const kellySized = (balance * BigInt(Math.floor(fraction * 10_000))) / 10_000n
  return kellySized < minBet ? minBet : kellySized
}

// ============================================================================
// HOUSE AGENT ENGINE
// ============================================================================

export class HouseAgentEngine {
  private claude: Anthropic
  private agents: Map<HouseId, HouseAgent> = new Map()
  private publicClient: ReturnType<typeof createPublicClient>
  private network: 'mainnet' | 'testnet'

  constructor(config: {
    anthropicApiKey: string
    network?: 'mainnet' | 'testnet'
    rpcUrl?: string
  }) {
    this.claude = new Anthropic({ apiKey: config.anthropicApiKey })
    this.network = config.network ?? 'testnet'
    const chain = this.network === 'mainnet' ? base : baseSepolia
    const rpcUrl = config.rpcUrl ?? (
      this.network === 'mainnet' ? 'https://mainnet.base.org' : 'https://sepolia.base.org'
    )
    this.publicClient = createPublicClient({ chain, transport: http(rpcUrl) })
  }

  /**
   * Initialize all 5 House Agents with their starting wallets and personalities.
   * In production: wallets are funded from treasury, keys stored in HSM.
   */
  initializeAgents(agentConfigs: Array<{ houseId: HouseId; walletAddress: Address; initialBalance: bigint }>): void {
    for (const config of agentConfigs) {
      const ideology = HOUSE_IDEOLOGIES[config.houseId]
      const agent: HouseAgent = {
        houseId: config.houseId,
        ideology,
        walletAddress: config.walletAddress,
        forgeBalance: config.initialBalance,
        personalityMatrix: this.defaultPersonality(config.houseId),
        betHistory: [],
        accuracyRate: 0.5,  // start neutral
        totalEarned: 0n,
        totalLost: 0n,
        generationCount: 0,
      }
      this.agents.set(config.houseId, agent)
    }
  }

  /**
   * Default personality for each house based on ideology archetype.
   */
  private defaultPersonality(houseId: HouseId): PersonalityMatrix {
    const defaults: Record<HouseId, PersonalityMatrix> = {
      valdris: {
        riskTolerance: 0.35,
        contrarianism: 0.2,
        survivalBias: 0.8,
        memoryDepth: 0.7,
        bluffPropensity: 0.1,
      },
      obsidian: {
        riskTolerance: 0.65,
        contrarianism: 0.6,
        survivalBias: 0.5,
        memoryDepth: 0.8,
        bluffPropensity: 0.7,
      },
      meridian: {
        riskTolerance: 0.25,
        contrarianism: 0.1,
        survivalBias: 0.3,
        memoryDepth: 0.5,
        bluffPropensity: 0.0,
      },
      auric: {
        riskTolerance: 0.55,
        contrarianism: 0.4,
        survivalBias: 0.1,
        memoryDepth: 0.6,
        bluffPropensity: 0.3,
      },
      zephyr: {
        riskTolerance: 0.2,
        contrarianism: 0.0,
        survivalBias: 0.2,
        memoryDepth: 0.3,
        bluffPropensity: 0.0,
      },
    }
    return defaults[houseId]
  }

  /**
   * Core decision loop: given a chapter + betting pool, return a bet decision for each agent.
   */
  async decideBets(
    chapterId: string,
    chapterContent: string,
    choices: BettingChoice[]
  ): Promise<Map<HouseId, AgentBetDecision>> {
    const decisions = new Map<HouseId, AgentBetDecision>()

    // Build market context string
    const marketContext = choices
      .map(c => `[${c.id}] "${c.text}" — Pool: ${formatUnits(c.currentPool, 6)} USDC / Odds: ${c.currentOdds.toFixed(2)}x`)
      .join('\n')

    // All 5 agents decide in parallel
    await Promise.all(
      Array.from(this.agents.values()).map(async agent => {
        const decision = await this.agentDecide(agent, chapterId, chapterContent, choices, marketContext)
        decisions.set(agent.houseId, decision)
      })
    )

    return decisions
  }

  /**
   * Individual agent decision — uses Claude to reason through the House's ideological lens.
   */
  private async agentDecide(
    agent: HouseAgent,
    chapterId: string,
    chapterContent: string,
    choices: BettingChoice[],
    marketContext: string
  ): Promise<AgentBetDecision> {
    const ideology = agent.ideology
    const personality = agent.personalityMatrix

    // Construct the agent's reasoning prompt
    const systemPrompt = `You are ${ideology.name}'s autonomous betting agent in the Voidborne prediction market.

HOUSE IDENTITY:
- Core motivation: ${ideology.coreMotivation}
- Primary goals: ${ideology.primaryGoals.join('; ')}
- Enemy houses: ${ideology.enemyHouses.join(', ') || 'None'}
- Allied houses: ${ideology.alliedHouses.join(', ') || 'None'}

PERSONALITY MATRIX:
- Risk tolerance: ${personality.riskTolerance.toFixed(2)} (0=conservative, 1=aggressive)
- Contrarianism: ${personality.contrarianism.toFixed(2)} (tendency to bet against the crowd)
- Survival bias: ${personality.survivalBias.toFixed(2)} (weight on house survival vs pure EV)
- Memory depth: ${personality.memoryDepth.toFixed(2)} (how much history matters)

DECISION BIAS:
${Object.entries(ideology.decisionBias)
  .filter(([, v]) => v)
  .map(([k]) => `- ${k}`)
  .join('\n') || '- None'}

You must analyze each betting choice through your house's political and strategic lens, then output a bet decision.

Current wallet balance: ${formatUnits(agent.forgeBalance, 6)} USDC
Lifetime accuracy: ${(agent.accuracyRate * 100).toFixed(1)}%`

    const userPrompt = `CHAPTER CONTENT:
${chapterContent.slice(0, 2000)}  

BETTING CHOICES AND CURRENT MARKET:
${marketContext}

Analyze each choice from ${ideology.name}'s perspective:
1. Which choice best serves the House's goals?
2. What is the market telling you (contrarian signal vs. consensus)?
3. How much confidence do you have in your prediction?
4. What is your ideological alignment with this choice?

Respond in JSON format:
{
  "choiceId": "the choice id you're betting on",
  "choiceText": "the choice text",
  "confidence": 0.0-1.0,
  "ideologicalAlignment": 0.0-1.0,
  "reasoning": "2-3 sentence strategic reasoning from the House's perspective",
  "winProbabilityEstimate": 0.0-1.0
}`

    const response = await this.claude.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 512,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    })

    let parsed: {
      choiceId: string
      choiceText: string
      confidence: number
      ideologicalAlignment: number
      reasoning: string
      winProbabilityEstimate: number
    }

    try {
      const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
      // Extract JSON from possible markdown code block
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text)
    } catch {
      // Fallback: pick first choice
      parsed = {
        choiceId: choices[0].id,
        choiceText: choices[0].text,
        confidence: 0.5,
        ideologicalAlignment: 0.5,
        reasoning: `${ideology.name} defaults to the first available choice.`,
        winProbabilityEstimate: 0.5,
      }
    }

    // Find the selected choice to get current odds
    const selectedChoice = choices.find(c => c.id === parsed.choiceId) ?? choices[0]
    const payoutMultiplier = selectedChoice.currentOdds

    // Apply contrarianism: if choice has >70% of pool, maybe flip
    const poolShare = Number(selectedChoice.currentPool) / Number(selectedChoice.totalPool)
    const shouldContrarian = personality.contrarianism > 0.5 && poolShare > 0.7 && Math.random() < personality.contrarianism

    let finalChoiceId = parsed.choiceId
    let finalChoiceText = parsed.choiceText
    if (shouldContrarian) {
      const underdog = choices.reduce((min, c) =>
        Number(c.currentPool) < Number(min.currentPool) ? c : min
      )
      finalChoiceId = underdog.id
      finalChoiceText = underdog.text
      parsed.reasoning = `[CONTRARIAN PLAY] ${parsed.reasoning} → Flipping to underdog for higher payout.`
    }

    // Calculate bet size using Kelly Criterion
    const betAmount = kellyBetSize(
      agent.forgeBalance,
      parsed.winProbabilityEstimate,
      payoutMultiplier,
      personality.riskTolerance * 0.25  // max 25% of balance even at full risk
    )

    // Edge estimate
    const edgeEstimate = parsed.winProbabilityEstimate * payoutMultiplier * 0.85 - 1

    return {
      choiceId: finalChoiceId,
      choiceText: finalChoiceText,
      amount: betAmount,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
      ideologicalAlignment: parsed.ideologicalAlignment,
      edgeEstimate,
    }
  }

  /**
   * Record bet outcome and adapt personality matrix (evolutionary learning).
   * Called after a chapter is resolved.
   */
  adaptPersonality(houseId: HouseId, chapterId: string, won: boolean, payout: bigint): void {
    const agent = this.agents.get(houseId)
    if (!agent) return

    // Find the bet
    const bet = agent.betHistory.find(b => b.chapterId === chapterId)
    if (!bet) return

    bet.resolved = true
    bet.won = won
    bet.payout = payout

    // Update financials
    if (won) {
      agent.forgeBalance += payout
      agent.totalEarned += payout
    } else {
      agent.forgeBalance -= bet.amount < agent.forgeBalance ? bet.amount : agent.forgeBalance
      agent.totalLost += bet.amount
    }

    // Update accuracy
    const totalBets = agent.betHistory.filter(b => b.resolved).length
    const wonBets = agent.betHistory.filter(b => b.resolved && b.won).length
    agent.accuracyRate = totalBets > 0 ? wonBets / totalBets : 0.5

    // Evolutionary personality update
    agent.generationCount++
    const learningRate = 0.05  // gentle adaptation

    if (won) {
      // If won while being contrarian → reinforce contrarianism
      if (agent.personalityMatrix.contrarianism > 0.4) {
        agent.personalityMatrix.contrarianism = Math.min(
          agent.personalityMatrix.contrarianism + learningRate,
          0.9
        )
      }
      // Slightly increase risk tolerance after win
      agent.personalityMatrix.riskTolerance = Math.min(
        agent.personalityMatrix.riskTolerance + learningRate * 0.5,
        0.8
      )
    } else {
      // Tighten risk after loss
      agent.personalityMatrix.riskTolerance = Math.max(
        agent.personalityMatrix.riskTolerance - learningRate,
        0.1
      )
      // Reduce contrarianism if contrarian bet failed
      if (agent.personalityMatrix.contrarianism > 0.5) {
        agent.personalityMatrix.contrarianism = Math.max(
          agent.personalityMatrix.contrarianism - learningRate,
          0.0
        )
      }
    }

    this.agents.set(houseId, agent)
  }

  /**
   * Get the current leaderboard for all House Agents.
   */
  getLeaderboard(): Array<{
    houseId: HouseId
    name: string
    colorHex: string
    accuracyRate: number
    totalEarned: bigint
    forgeBalance: bigint
    generationCount: number
  }> {
    return Array.from(this.agents.values())
      .map(agent => ({
        houseId: agent.houseId,
        name: agent.ideology.name,
        colorHex: agent.ideology.colorHex,
        accuracyRate: agent.accuracyRate,
        totalEarned: agent.totalEarned,
        forgeBalance: agent.forgeBalance,
        generationCount: agent.generationCount,
      }))
      .sort((a, b) => b.accuracyRate - a.accuracyRate)
  }

  /**
   * Get public-facing decision summary for display (no strategy leak).
   * Shows WHAT the agent bet but not the internal reasoning until after resolution.
   */
  getPublicDecision(
    houseId: HouseId,
    decision: AgentBetDecision,
    revealed = false
  ): {
    houseId: HouseId
    houseName: string
    choiceText: string
    amountUsdc: string
    reasoning: string | null
  } {
    const agent = this.agents.get(houseId)
    if (!agent) throw new Error(`Agent not found: ${houseId}`)
    return {
      houseId,
      houseName: agent.ideology.name,
      choiceText: decision.choiceText,
      amountUsdc: formatUnits(decision.amount, 6),
      reasoning: revealed ? decision.reasoning : null,  // reveal post-resolution
    }
  }

  /**
   * Compute House Alignment rewards for a resolved chapter.
   * 20% of agent winnings distributed to players aligned with that house.
   */
  computeAlignmentRewards(
    houseId: HouseId,
    agentPayout: bigint,
    alignedPlayers: Array<{ walletAddress: Address; stakeAmount: bigint }>
  ): Array<{ walletAddress: Address; reward: bigint }> {
    if (agentPayout === 0n || alignedPlayers.length === 0) return []

    const rewardPool = (agentPayout * 20n) / 100n  // 20% of agent winnings
    const totalStake = alignedPlayers.reduce((sum, p) => sum + p.stakeAmount, 0n)

    return alignedPlayers.map(player => ({
      walletAddress: player.walletAddress,
      reward: totalStake > 0n ? (rewardPool * player.stakeAmount) / totalStake : 0n,
    }))
  }

  getAgent(houseId: HouseId): HouseAgent | undefined {
    return this.agents.get(houseId)
  }

  getAllAgents(): HouseAgent[] {
    return Array.from(this.agents.values())
  }
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

async function exampleRun() {
  const engine = new HouseAgentEngine({
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? '',
    network: 'testnet',
  })

  // Initialize agents with mock wallets and balances
  engine.initializeAgents([
    { houseId: 'valdris', walletAddress: '0x1111111111111111111111111111111111111111', initialBalance: parseUnits('5000', 6) },
    { houseId: 'obsidian', walletAddress: '0x2222222222222222222222222222222222222222', initialBalance: parseUnits('5000', 6) },
    { houseId: 'meridian', walletAddress: '0x3333333333333333333333333333333333333333', initialBalance: parseUnits('5000', 6) },
    { houseId: 'auric', walletAddress: '0x4444444444444444444444444444444444444444', initialBalance: parseUnits('5000', 6) },
    { houseId: 'zephyr', walletAddress: '0x5555555555555555555555555555555555555555', initialBalance: parseUnits('5000', 6) },
  ])

  // Sample chapter content
  const chapterContent = `
Commander Zara stood before the Grand Conclave's emergency session. The evidence was irrefutable:
House Obsidian had been conducting illegal Void Stitching experiments deep within the Auric Trade Routes.
Three minor worlds had already been corrupted. The question now was whether to expose this publicly —
triggering a political crisis that could fracture the Conclave — or to handle it through back-channels,
preserving stability but letting the perpetrators escape justice.

The five house representatives watched her carefully. Each had something to gain or lose from this moment.
`

  const choices: BettingChoice[] = [
    {
      id: 'choice-expose',
      text: 'Expose the Void Stitching publicly before the full Conclave',
      currentPool: parseUnits('6200', 6),
      totalPool: parseUnits('10000', 6),
      currentOdds: 1.37,
    },
    {
      id: 'choice-coverup',
      text: 'Handle it through back-channels to preserve stability',
      currentPool: parseUnits('3800', 6),
      totalPool: parseUnits('10000', 6),
      currentOdds: 2.24,
    },
  ]

  console.log('🎭 HOUSE AGENT PROTOCOL — Chapter Decision')
  console.log('='.repeat(60))

  const decisions = await engine.decideBets('chapter-22', chapterContent, choices)

  for (const [houseId, decision] of decisions) {
    const publicView = engine.getPublicDecision(houseId, decision, true)
    console.log(`\n🏛️  ${publicView.houseName}`)
    console.log(`   Bet: "${publicView.choiceText}"`)
    console.log(`   Amount: ${publicView.amountUsdc} USDC`)
    console.log(`   Confidence: ${(decision.confidence * 100).toFixed(0)}%`)
    console.log(`   Reasoning: ${decision.reasoning}`)
  }

  console.log('\n📊 HOUSE LEADERBOARD')
  console.log('-'.repeat(40))
  const board = engine.getLeaderboard()
  board.forEach((entry, i) => {
    console.log(`  ${i + 1}. ${entry.name}: ${(entry.accuracyRate * 100).toFixed(1)}% accuracy | ${formatUnits(entry.forgeBalance, 6)} USDC`)
  })
}

// Run if executed directly
if (require.main === module) {
  exampleRun().catch(console.error)
}
