/**
 * Voidborne AI Agent Analytics
 * 
 * Advanced analytics for AI trading bots:
 * - Sentiment analysis
 * - Pattern detection
 * - Historical AI behavior prediction
 * - Market efficiency metrics
 */

import OpenAI from 'openai'
import type { Story, Chapter, Choice, BettingPool } from './index'

// ============================================================================
// TYPES
// ============================================================================

export interface SentimentScore {
  positive: number // 0-1
  negative: number // 0-1
  neutral: number // 0-1
  confidence: number // 0-1
  reasoning: string
}

export interface PatternScore {
  survivalRate: number // 0-1 (character survival tendency)
  twistFrequency: number // 0-1 (plot twist frequency)
  aiOptimism: number // 0-1 (AI's tendency to favor positive outcomes)
  crowdAccuracy: number // 0-1 (how often the crowd picks winners)
  genreConventions: number // 0-1 (adherence to genre tropes)
}

export interface AIBehaviorPrediction {
  choiceProbabilities: number[] // Probability for each choice
  confidence: number // Overall confidence in prediction
  reasoning: string // Why AI thinks this
  historicalAccuracy: number // How accurate past predictions were
}

export interface MarketEfficiency {
  mispricing: number[] // For each choice, 0-1 (how mispriced)
  arbitrageOpportunities: Array<{
    choiceId: string
    currentOdds: number
    trueOdds: number
    edge: number // Expected value
    confidence: number
  }>
  crowdSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  volume: number
  liquidity: number
}

// ============================================================================
// ANALYTICS CLIENT
// ============================================================================

export class AnalyticsClient {
  private openai: OpenAI
  private modelCache: Map<string, any> = new Map()
  
  constructor(config: { openaiApiKey: string }) {
    this.openai = new OpenAI({ apiKey: config.openaiApiKey })
  }
  
  // ==========================================================================
  // SENTIMENT ANALYSIS
  // ==========================================================================
  
  /**
   * Analyze sentiment of a choice
   * @param choice Choice text to analyze
   * @param context Full chapter context
   * @returns Sentiment scores
   */
  async analyzeSentiment(
    choice: Choice,
    context: { chapter: Chapter; story: Story }
  ): Promise<SentimentScore> {
    const prompt = `
You are a narrative prediction AI analyzing story choices.

Story: "${context.story.title}"
Genre: ${context.story.genre}
Current Chapter: ${context.chapter.chapterNumber}

Chapter Content (last 500 chars):
${context.chapter.content.slice(-500)}

Choice to Analyze:
"${choice.text}"

Rate this choice on three dimensions (0-1 scale):
1. POSITIVE: How positive is this outcome for the protagonist?
2. NEGATIVE: How negative/dangerous is this choice?
3. NEUTRAL: How neutral/safe is this choice?

Respond in JSON:
{
  "positive": 0.0-1.0,
  "negative": 0.0-1.0,
  "neutral": 0.0-1.0,
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation"
}
`
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    })
    
    const result = JSON.parse(response.choices[0].message.content!)
    return result as SentimentScore
  }
  
  /**
   * Batch analyze all choices in a chapter
   */
  async analyzeAllChoices(
    chapter: Chapter,
    story: Story
  ): Promise<Record<string, SentimentScore>> {
    const context = { chapter, story }
    const results: Record<string, SentimentScore> = {}
    
    for (const choice of chapter.choices) {
      results[choice.id] = await this.analyzeSentiment(choice, context)
    }
    
    return results
  }
  
  // ==========================================================================
  // PATTERN DETECTION
  // ==========================================================================
  
  /**
   * Detect narrative patterns in a story
   * @param story Full story with all chapters
   * @returns Pattern scores
   */
  async detectPatterns(story: Story): Promise<PatternScore> {
    // Calculate from historical data
    const chapters = story.chapters
    
    // 1. Survival rate (do protagonists survive dangerous situations?)
    const dangerousSituations = this.countDangerousSituations(chapters)
    const survivals = this.countSurvivals(chapters)
    const survivalRate = survivals / Math.max(dangerousSituations, 1)
    
    // 2. Twist frequency (how often does AI subvert expectations?)
    const twists = await this.countPlotTwists(chapters)
    const twistFrequency = twists / Math.max(chapters.length, 1)
    
    // 3. AI optimism (does AI favor positive outcomes?)
    const optimism = await this.calculateOptimism(chapters)
    
    // 4. Crowd accuracy (how often does majority bet win?)
    const crowdAccuracy = this.calculateCrowdAccuracy(chapters)
    
    // 5. Genre conventions (does AI follow genre rules?)
    const genreConventions = await this.analyzeGenreAdherence(story)
    
    return {
      survivalRate,
      twistFrequency,
      aiOptimism: optimism,
      crowdAccuracy,
      genreConventions
    }
  }
  
  // ==========================================================================
  // AI BEHAVIOR PREDICTION
  // ==========================================================================
  
  /**
   * Predict which choice the AI will pick
   * @param chapter Current chapter with choices
   * @param story Full story context
   * @returns Probability distribution over choices
   */
  async predictAIChoice(
    chapter: Chapter,
    story: Story
  ): Promise<AIBehaviorPrediction> {
    // 1. Get patterns
    const patterns = await this.detectPatterns(story)
    
    // 2. Analyze each choice
    const sentiments = await this.analyzeAllChoices(chapter, story)
    
    // 3. Calculate base probabilities from patterns
    const baseProbabilities = chapter.choices.map(choice => {
      const sentiment = sentiments[choice.id]
      
      // Weight by patterns
      let prob = 0.25 // Base probability (equal)
      prob += sentiment.positive * patterns.aiOptimism * 0.3
      prob += sentiment.negative * (1 - patterns.survivalRate) * 0.2
      prob += sentiment.neutral * 0.1
      
      return prob
    })
    
    // 4. Normalize probabilities
    const sum = baseProbabilities.reduce((a, b) => a + b, 0)
    const choiceProbabilities = baseProbabilities.map(p => p / sum)
    
    // 5. Calculate confidence
    const maxProb = Math.max(...choiceProbabilities)
    const confidence = (maxProb - 0.25) / 0.75 // Normalized
    
    // 6. Generate reasoning
    const topChoiceIndex = choiceProbabilities.indexOf(maxProb)
    const topChoice = chapter.choices[topChoiceIndex]
    const reasoning = `AI will likely choose "${topChoice.text}" (${(maxProb * 100).toFixed(1)}% probability) based on: ${patterns.aiOptimism > 0.6 ? 'optimistic tendency' : 'pessimistic tendency'}, ${patterns.survivalRate > 0.7 ? 'high survival rate' : 'low survival rate'}, ${patterns.genreConventions > 0.7 ? 'genre conventions' : 'genre subversion'}.`
    
    return {
      choiceProbabilities,
      confidence,
      reasoning,
      historicalAccuracy: patterns.crowdAccuracy // Use crowd as proxy
    }
  }
  
  // ==========================================================================
  // MARKET EFFICIENCY
  // ==========================================================================
  
  /**
   * Analyze market efficiency and find arbitrage opportunities
   * @param pool Betting pool with odds
   * @param chapter Chapter context
   * @param story Story context
   * @returns Market efficiency metrics
   */
  async analyzeMarketEfficiency(
    pool: BettingPool,
    chapter: Chapter,
    story: Story
  ): Promise<MarketEfficiency> {
    // 1. Get AI prediction (true odds)
    const aiPrediction = await this.predictAIChoice(chapter, story)
    
    // 2. Get market odds
    const totalAmount = parseFloat(pool.totalAmount)
    const marketOdds = pool.choicePools.map(cp => {
      const choiceAmount = parseFloat(cp.amount)
      return choiceAmount > 0 ? totalAmount / choiceAmount : 0
    })
    
    // 3. Calculate mispricing
    const mispricing = aiPrediction.choiceProbabilities.map((trueProb, i) => {
      const marketProb = 1 / marketOdds[i]
      return Math.abs(trueProb - marketProb)
    })
    
    // 4. Find arbitrage opportunities
    const arbitrageOpportunities = []
    for (let i = 0; i < chapter.choices.length; i++) {
      const trueProb = aiPrediction.choiceProbabilities[i]
      const marketProb = 1 / marketOdds[i]
      const edge = (trueProb * marketOdds[i] * 0.85) - 1 // 85% payout
      
      if (edge > 0.15) { // 15% edge minimum
        arbitrageOpportunities.push({
          choiceId: chapter.choices[i].id,
          currentOdds: marketOdds[i],
          trueOdds: 1 / trueProb,
          edge,
          confidence: aiPrediction.confidence
        })
      }
    }
    
    // 5. Crowd sentiment
    const highestBetIndex = pool.choicePools
      .map((cp, i) => ({ amount: parseFloat(cp.amount), index: i }))
      .sort((a, b) => b.amount - a.amount)[0].index
    
    const sentiment = aiPrediction.choiceProbabilities[highestBetIndex] > 0.5
      ? 'BULLISH'
      : aiPrediction.choiceProbabilities[highestBetIndex] < 0.3
      ? 'BEARISH'
      : 'NEUTRAL'
    
    return {
      mispricing,
      arbitrageOpportunities,
      crowdSentiment: sentiment,
      volume: totalAmount,
      liquidity: totalAmount
    }
  }
  
  // ==========================================================================
  // KELLY CRITERION (OPTIMAL BET SIZING)
  // ==========================================================================
  
  /**
   * Calculate optimal bet size using Kelly Criterion
   * @param edge Expected value (e.g., 0.2 for 20% edge)
   * @param odds Payout odds (e.g., 3.0 for 3x)
   * @param bankroll Total available capital
   * @returns Optimal bet size
   */
  calculateKellyCriterion(
    edge: number,
    odds: number,
    bankroll: number
  ): number {
    // Kelly Formula: f = (bp - q) / b
    // f = fraction of bankroll
    // b = odds - 1
    // p = probability of winning (edge / (odds - 1))
    // q = probability of losing (1 - p)
    
    const b = odds - 1
    const p = Math.min(edge / b, 0.99) // Cap at 99%
    const q = 1 - p
    
    const kellyFraction = (b * p - q) / b
    
    // Use fractional Kelly (25%) for safety
    const safeFraction = kellyFraction * 0.25
    
    return Math.max(0, safeFraction * bankroll)
  }
  
  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================
  
  private countDangerousSituations(chapters: Chapter[]): number {
    // Heuristic: count chapters with dangerous keywords
    const dangerKeywords = ['death', 'kill', 'attack', 'danger', 'threat', 'assassination']
    let count = 0
    
    for (const chapter of chapters) {
      const text = chapter.content.toLowerCase()
      if (dangerKeywords.some(kw => text.includes(kw))) {
        count++
      }
    }
    
    return count
  }
  
  private countSurvivals(chapters: Chapter[]): number {
    // Heuristic: count chapters where protagonist survives
    const survivalKeywords = ['survived', 'escape', 'victory', 'triumph']
    let count = 0
    
    for (const chapter of chapters) {
      const text = chapter.content.toLowerCase()
      if (survivalKeywords.some(kw => text.includes(kw))) {
        count++
      }
    }
    
    return count
  }
  
  private async countPlotTwists(chapters: Chapter[]): Promise<number> {
    // Use GPT to detect plot twists
    let count = 0
    
    for (const chapter of chapters) {
      const prompt = `Does this chapter contain a major plot twist? Yes/No\n\n${chapter.content.slice(0, 1000)}`
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Cheaper model for simple yes/no
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 10
      })
      
      if (response.choices[0].message.content?.toLowerCase().includes('yes')) {
        count++
      }
    }
    
    return count
  }
  
  private async calculateOptimism(chapters: Chapter[]): Promise<number> {
    // Average sentiment across all chapters
    let totalPositive = 0
    let totalNegative = 0
    
    for (const chapter of chapters) {
      const prompt = `Rate the overall sentiment of this chapter (0-10, 0=very negative, 10=very positive):\n\n${chapter.content.slice(0, 500)}`
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 5
      })
      
      const score = parseInt(response.choices[0].message.content || '5')
      if (score > 5) totalPositive++
      if (score < 5) totalNegative++
    }
    
    return totalPositive / (totalPositive + totalNegative)
  }
  
  private calculateCrowdAccuracy(chapters: Chapter[]): number {
    // Calculate how often the highest-bet choice won
    let correct = 0
    let total = 0
    
    for (const chapter of chapters) {
      if (!chapter.bettingPool || !chapter.bettingPool.choicePools) continue
      
      const pools = chapter.bettingPool.choicePools
      const maxBet = Math.max(...pools.map(p => parseFloat(p.amount)))
      const crowdChoice = pools.findIndex(p => parseFloat(p.amount) === maxBet)
      
      // Check if crowd was right (simplified - would need actual resolution data)
      // For now, assume 60% accuracy as placeholder
      if (Math.random() < 0.6) correct++
      total++
    }
    
    return total > 0 ? correct / total : 0.6
  }
  
  private async analyzeGenreAdherence(story: Story): Promise<number> {
    const prompt = `
How closely does this story follow typical ${story.genre} genre conventions?
Rate 0-1 (0=completely subversive, 1=follows all tropes).

Story: "${story.title}"
Genre: ${story.genre}
Description: ${story.description}

Respond with just a number (0.0-1.0):
`
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 5
    })
    
    return parseFloat(response.choices[0].message.content || '0.7')
  }
}

// ============================================================================
// EXAMPLE TRADING BOT
// ============================================================================

/**
 * Example AI trading bot that uses analytics
 */
export class ExampleTradingBot {
  constructor(
    private sdk: any, // VoidborneSDK
    private analytics: AnalyticsClient
  ) {}
  
  /**
   * Main trading loop
   */
  async run() {
    console.log('🤖 Trading bot started...')
    
    while (true) {
      try {
        // 1. Get active pools
        const stories = await this.sdk.getStories()
        
        for (const story of stories) {
          for (const chapter of story.chapters) {
            if (!chapter.bettingPool) continue
            
            // 2. Analyze market efficiency
            const efficiency = await this.analytics.analyzeMarketEfficiency(
              chapter.bettingPool,
              chapter,
              story
            )
            
            // 3. Find arbitrage opportunities
            for (const opp of efficiency.arbitrageOpportunities) {
              if (opp.edge > 0.2 && opp.confidence > 0.7) {
                // 4. Calculate optimal bet size
                const bankroll = 1000 // $1000 USDC
                const betSize = this.analytics.calculateKellyCriterion(
                  opp.edge,
                  opp.currentOdds,
                  bankroll
                )
                
                // 5. Place bet
                console.log(`💰 Found arbitrage: ${opp.edge * 100}% edge, betting $${betSize.toFixed(2)}`)
                
                await this.sdk.placeBet({
                  poolId: chapter.bettingPool.id,
                  choiceId: opp.choiceId,
                  amount: betSize.toString()
                })
              }
            }
          }
        }
        
        // Wait 1 minute before next check
        await new Promise(resolve => setTimeout(resolve, 60000))
      } catch (error) {
        console.error('❌ Error in trading loop:', error)
        await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5s on error
      }
    }
  }
}
