/**
 * Bettor's Paradox Engine
 * 
 * Contrarian AI that occasionally picks underdog choices for dramatic tension.
 * Creates unpredictable outcomes, prevents whale dominance, and generates viral moments.
 * 
 * @module bettor-paradox
 */

import Anthropic from '@anthropic-ai/sdk'

export interface BettingChoice {
  id: string
  text: string
  totalBets: number
  betCount: number
}

export interface ParadoxConfig {
  enabled: boolean
  minRatioForContrary: number // e.g., 4.0 (4:1 ratio triggers intervention)
  maxContrarianProbability: number // e.g., 0.30 (30% max chance of upset)
  narrativeCoherenceWeight: number // 0-1 (how much to respect story logic)
}

export interface ParadoxOutcome {
  choiceId: string
  isContrarian: boolean
  contrarian_probability: number
  narrative_coherence_score: number
  reasoning: string
  explanation?: string // AI-generated explanation for upset
}

/**
 * Bettor's Paradox Engine
 * 
 * Implements contrarian AI decision-making that balances:
 * - Narrative coherence (story makes sense)
 * - Betting dynamics (prevent predictability)
 * - Dramatic tension (create legendary upsets)
 */
export class BettorsParadoxEngine {
  private config: ParadoxConfig
  private anthropic: Anthropic
  
  constructor(config?: Partial<ParadoxConfig>) {
    this.config = {
      enabled: config?.enabled ?? true,
      minRatioForContrary: config?.minRatioForContrary ?? 4.0,
      maxContrarianProbability: config?.maxContrarianProbability ?? 0.30,
      narrativeCoherenceWeight: config?.narrativeCoherenceWeight ?? 0.70,
    }
    
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    })
  }
  
  /**
   * Determine if AI should pick contrarian choice
   * 
   * Algorithm:
   * 1. Calculate betting ratio (majority bets / underdog bets)
   * 2. If ratio >= threshold, calculate contrarian probability
   * 3. Score narrative coherence for all choices (AI evaluation)
   * 4. Weighted decision: coherence (70%) + contrarian bonus (30%)
   * 5. Pick winner based on combined score
   * 
   * @param choices - Array of betting choices with amounts
   * @param storyContext - Previous chapters for context
   * @param chapterPrompt - Setup for current chapter
   * @returns Outcome with reasoning and explanation
   */
  async decideOutcome(
    choices: BettingChoice[],
    storyContext: string,
    chapterPrompt: string
  ): Promise<ParadoxOutcome> {
    // Sort by total bets (descending)
    const sorted = [...choices].sort((a, b) => b.totalBets - a.totalBets)
    const majority = sorted[0]
    const underdog = sorted[sorted.length - 1]
    
    // Calculate betting ratio
    const ratio = majority.totalBets / (underdog.totalBets || 1)
    
    // Check if contrarian intervention applicable
    if (!this.config.enabled || ratio < this.config.minRatioForContrary) {
      // Normal decision (follow consensus)
      return {
        choiceId: majority.id,
        isContrarian: false,
        contrarian_probability: 0,
        narrative_coherence_score: 1.0,
        reasoning: `Betting distribution is balanced (${ratio.toFixed(1)}:1 ratio). Following consensus: "${majority.text}"`,
      }
    }
    
    // Calculate contrarian probability (inversely proportional to ratio)
    // Formula: min((ratio - threshold) / 10, maxProb)
    const contrarian_probability = Math.min(
      (ratio - this.config.minRatioForContrary) / 10,
      this.config.maxContrarianProbability
    )
    
    console.log(`[Bettor's Paradox] Ratio: ${ratio.toFixed(2)}:1 → Contrarian probability: ${(contrarian_probability * 100).toFixed(1)}%`)
    
    // Score narrative coherence for all choices (parallel)
    const coherencePromises = choices.map(choice =>
      this.scoreNarrativeCoherence(choice, storyContext, chapterPrompt)
    )
    const coherenceScores = await Promise.all(coherencePromises)
    
    // Map scores to choices
    const choiceScores = choices.map((choice, i) => ({
      choice,
      coherence: coherenceScores[i],
    }))
    
    const majorityScore = choiceScores.find(cs => cs.choice.id === majority.id)!
    const underdogScore = choiceScores.find(cs => cs.choice.id === underdog.id)!
    
    // Weighted decision
    const narrativeWeight = this.config.narrativeCoherenceWeight
    const contraryWeight = 1 - narrativeWeight
    
    const majorityFinalScore = majorityScore.coherence * narrativeWeight
    const underdogFinalScore = underdogScore.coherence * narrativeWeight + contrarian_probability * contraryWeight
    
    console.log(`[Bettor's Paradox] Scores:`)
    console.log(`  Majority "${majority.text}": coherence ${(majorityScore.coherence * 100).toFixed(0)}% → final ${(majorityFinalScore * 100).toFixed(0)}%`)
    console.log(`  Underdog "${underdog.text}": coherence ${(underdogScore.coherence * 100).toFixed(0)}% + contrarian ${(contrarian_probability * 100).toFixed(0)}% → final ${(underdogFinalScore * 100).toFixed(0)}%`)
    
    // Decide
    const isContrarian = underdogFinalScore > majorityFinalScore
    const winner = isContrarian ? underdog : majority
    const winnerCoherence = isContrarian ? underdogScore.coherence : majorityScore.coherence
    
    // Generate reasoning
    const totalBets = choices.reduce((sum, c) => sum + c.totalBets, 0)
    const majorityPercent = ((majority.totalBets / totalBets) * 100).toFixed(0)
    
    let reasoning: string
    if (isContrarian) {
      reasoning = `🎭 LEGENDARY UPSET! Despite ${majorityPercent}% betting on "${majority.text}", the narrative demanded "${underdog.text}" (coherence: ${(winnerCoherence * 100).toFixed(0)}%, contrarian bonus: ${(contrarian_probability * 100).toFixed(0)}%).`
    } else {
      reasoning = `Consensus outcome. ${majorityPercent}% correctly predicted "${majority.text}" (coherence: ${(winnerCoherence * 100).toFixed(0)}%).`
    }
    
    // Generate explanation for upset (if contrarian)
    let explanation: string | undefined
    if (isContrarian) {
      explanation = await this.generateUpsetExplanation(winner, storyContext, chapterPrompt)
    }
    
    return {
      choiceId: winner.id,
      isContrarian,
      contrarian_probability,
      narrative_coherence_score: winnerCoherence,
      reasoning,
      explanation,
    }
  }
  
  /**
   * Use AI (Claude) to score narrative coherence of a choice
   * 
   * Evaluates:
   * - Plot consistency with previous chapters
   * - Character motivation alignment
   * - Thematic coherence
   * - Foreshadowing payoff
   * 
   * @param choice - Betting choice to evaluate
   * @param storyContext - Previous chapters
   * @param chapterPrompt - Current chapter setup
   * @returns Score 0-1 (higher = more coherent)
   */
  private async scoreNarrativeCoherence(
    choice: BettingChoice,
    storyContext: string,
    chapterPrompt: string
  ): Promise<number> {
    const prompt = `You are a narrative coherence evaluator for a space political saga.

Story context (previous chapters):
${storyContext.slice(0, 2000)}... [truncated]

Current chapter setup:
${chapterPrompt}

Proposed choice: "${choice.text}"

Score this choice's narrative coherence (0-100) based on:
1. Plot consistency - Does it follow logically from previous events?
2. Character motivation - Are character actions believable given their history?
3. Thematic alignment - Does it serve the story's themes (power, betrayal, legacy)?
4. Foreshadowing payoff - Does it pay off subtle hints from earlier chapters?

Respond ONLY with JSON (no markdown, no extra text):
{"score": <0-100>, "reasoning": "<1-2 sentences explaining the score>"}
`
    
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      })
      
      const content = response.content[0].type === 'text' ? response.content[0].text : '{}'
      
      // Extract JSON (handle potential markdown wrapping)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.warn('[Bettor\'s Paradox] Failed to extract JSON from Claude response:', content)
        return 0.5 // Default neutral score
      }
      
      const result = JSON.parse(jsonMatch[0])
      const normalizedScore = result.score / 100 // Normalize to 0-1
      
      console.log(`[Bettor's Paradox] Coherence for "${choice.text}": ${result.score}/100 - ${result.reasoning}`)
      
      return normalizedScore
    } catch (error) {
      console.error('[Bettor\'s Paradox] Coherence scoring failed:', error)
      return 0.5 // Default neutral score on error
    }
  }
  
  /**
   * Generate narrative explanation for contrarian outcome
   * 
   * Creates a backstory that makes the upset feel earned, not random.
   * References subtle foreshadowing and rewards close readers.
   * 
   * @param choice - Winning (underdog) choice
   * @param storyContext - Previous chapters
   * @param chapterPrompt - Current chapter setup
   * @returns 2-3 sentence explanation
   */
  private async generateUpsetExplanation(
    choice: BettingChoice,
    storyContext: string,
    chapterPrompt: string
  ): Promise<string> {
    const prompt = `You are a master storyteller explaining a plot twist.

Story context (previous chapters):
${storyContext.slice(0, 2000)}... [truncated]

Chapter setup:
${chapterPrompt}

Unexpected outcome: "${choice.text}"

Write a 2-3 sentence explanation that:
1. References subtle foreshadowing from earlier chapters (be specific)
2. Makes the outcome feel earned, not random
3. Rewards readers who paid close attention to details
4. Sounds like a wise narrator revealing a hidden truth

Be specific and clever. Avoid generic statements.

Example good explanation:
"Zara's betrayal was foreshadowed in Chapter 7 when she hesitated before swearing the Oath of Threads. Those who noticed the slight tremor in her voice—and the way House Kael's ambassador smiled—predicted this moment. The majority missed the signs, but 20% of astute readers saw the storm coming."

Your explanation:
`
    
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      })
      
      const content = response.content[0].type === 'text' ? response.content[0].text : ''
      const explanation = content.trim()
      
      console.log(`[Bettor's Paradox] Generated upset explanation:`, explanation)
      
      return explanation
    } catch (error) {
      console.error('[Bettor\'s Paradox] Explanation generation failed:', error)
      return "The story's hidden currents finally surfaced, rewarding those who read between the lines. This outcome was inevitable for those who saw the signs."
    }
  }
  
  /**
   * Get current configuration
   */
  getConfig(): ParadoxConfig {
    return { ...this.config }
  }
  
  /**
   * Update configuration (for testing/tuning)
   */
  updateConfig(updates: Partial<ParadoxConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
    }
  }
}

// Export singleton for convenience
let instance: BettorsParadoxEngine | null = null

export function getBettorsParadoxEngine(config?: Partial<ParadoxConfig>): BettorsParadoxEngine {
  if (!instance) {
    instance = new BettorsParadoxEngine(config)
  }
  return instance
}

/**
 * Example usage:
 * 
 * ```typescript
 * import { getBettorsParadoxEngine, BettingChoice } from './bettor-paradox'
 * 
 * const engine = getBettorsParadoxEngine()
 * 
 * const choices: BettingChoice[] = [
 *   { id: 'choice-a', text: 'Keep alliance', totalBets: 8000, betCount: 120 },
 *   { id: 'choice-b', text: 'Betray alliance', totalBets: 2000, betCount: 30 },
 * ]
 * 
 * const storyContext = "Chapter 1-14 summary..."
 * const chapterPrompt = "Commander Zara must choose..."
 * 
 * const outcome = await engine.decideOutcome(choices, storyContext, chapterPrompt)
 * 
 * console.log('Winner:', outcome.choiceId)
 * console.log('Contrarian?', outcome.isContrarian)
 * console.log('Reasoning:', outcome.reasoning)
 * if (outcome.explanation) {
 *   console.log('Explanation:', outcome.explanation)
 * }
 * ```
 */
