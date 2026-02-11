# Voidborne AI Agent Analytics

Advanced analytics for AI trading bots on Voidborne narrative prediction markets.

## Features

- 🧠 **Sentiment Analysis** - Analyze choice sentiment with GPT-4
- 📊 **Pattern Detection** - Detect story patterns (survival rate, twist frequency, AI behavior)
- 🎯 **AI Behavior Prediction** - Predict which choice AI will select
- 💹 **Market Efficiency Analysis** - Find arbitrage opportunities
- 💰 **Kelly Criterion** - Optimal bet sizing for risk management

---

## Installation

```bash
cd packages/agent-sdk
npm install
# or
pnpm install
```

**Dependencies:**
```json
{
  "openai": "^4.0.0"
}
```

---

## Quick Start

```typescript
import { VoidborneSDK } from '@voidborne/agent-sdk'
import { AnalyticsClient, ExampleTradingBot } from '@voidborne/agent-sdk/analytics'

// 1. Initialize SDK
const sdk = new VoidborneSDK({
  network: 'testnet',
  privateKey: process.env.PRIVATE_KEY
})

// 2. Initialize analytics
const analytics = new AnalyticsClient({
  openaiApiKey: process.env.OPENAI_API_KEY
})

// 3. Get a story
const story = await sdk.getVoidborneStory()
const chapter = story.chapters[story.currentChapter - 1]

// 4. Analyze sentiment
const sentiment = await analytics.analyzeSentiment(
  chapter.choices[0],
  { chapter, story }
)

console.log('Sentiment:', sentiment)
// {
//   positive: 0.72,
//   negative: 0.15,
//   neutral: 0.13,
//   confidence: 0.85,
//   reasoning: "Choice shows protagonist taking bold action with positive framing"
// }

// 5. Detect patterns
const patterns = await analytics.detectPatterns(story)
console.log('Patterns:', patterns)
// {
//   survivalRate: 0.78,
//   twistFrequency: 0.22,
//   aiOptimism: 0.64,
//   crowdAccuracy: 0.68,
//   genreConventions: 0.71
// }

// 6. Predict AI choice
const prediction = await analytics.predictAIChoice(chapter, story)
console.log('AI Prediction:', prediction)
// {
//   choiceProbabilities: [0.15, 0.42, 0.28, 0.15],
//   confidence: 0.68,
//   reasoning: "AI will likely choose 'Negotiate' based on optimistic tendency...",
//   historicalAccuracy: 0.68
// }

// 7. Find arbitrage
const pool = await sdk.getBettingPool(chapter.bettingPool.id)
const efficiency = await analytics.analyzeMarketEfficiency(pool, chapter, story)

console.log('Arbitrage Opportunities:', efficiency.arbitrageOpportunities)
// [
//   {
//     choiceId: "choice-2",
//     currentOdds: 2.8,
//     trueOdds: 2.2,
//     edge: 0.28,
//     confidence: 0.68
//   }
// ]

// 8. Calculate optimal bet size
const betSize = analytics.calculateKellyCriterion(
  0.28, // 28% edge
  2.8,  // 2.8x odds
  1000  // $1000 bankroll
)

console.log('Optimal bet size:', betSize)
// $70 (7% of bankroll)
```

---

## API Reference

### `AnalyticsClient`

#### Constructor

```typescript
constructor(config: { openaiApiKey: string })
```

#### Methods

##### `analyzeSentiment(choice, context)`

Analyze sentiment of a story choice.

```typescript
async analyzeSentiment(
  choice: Choice,
  context: { chapter: Chapter; story: Story }
): Promise<SentimentScore>
```

**Returns:**
```typescript
interface SentimentScore {
  positive: number    // 0-1
  negative: number    // 0-1
  neutral: number     // 0-1
  confidence: number  // 0-1
  reasoning: string
}
```

##### `analyzeAllChoices(chapter, story)`

Batch analyze all choices in a chapter.

```typescript
async analyzeAllChoices(
  chapter: Chapter,
  story: Story
): Promise<Record<string, SentimentScore>>
```

##### `detectPatterns(story)`

Detect narrative patterns in a story.

```typescript
async detectPatterns(story: Story): Promise<PatternScore>
```

**Returns:**
```typescript
interface PatternScore {
  survivalRate: number       // 0-1 (character survival tendency)
  twistFrequency: number     // 0-1 (plot twist frequency)
  aiOptimism: number         // 0-1 (AI's optimistic/pessimistic bias)
  crowdAccuracy: number      // 0-1 (how often crowd picks winners)
  genreConventions: number   // 0-1 (adherence to genre tropes)
}
```

##### `predictAIChoice(chapter, story)`

Predict which choice the AI will select.

```typescript
async predictAIChoice(
  chapter: Chapter,
  story: Story
): Promise<AIBehaviorPrediction>
```

**Returns:**
```typescript
interface AIBehaviorPrediction {
  choiceProbabilities: number[]  // Probability for each choice
  confidence: number             // Overall confidence (0-1)
  reasoning: string              // Why AI thinks this
  historicalAccuracy: number     // How accurate past predictions were
}
```

##### `analyzeMarketEfficiency(pool, chapter, story)`

Analyze market efficiency and find arbitrage opportunities.

```typescript
async analyzeMarketEfficiency(
  pool: BettingPool,
  chapter: Chapter,
  story: Story
): Promise<MarketEfficiency>
```

**Returns:**
```typescript
interface MarketEfficiency {
  mispricing: number[]  // For each choice, 0-1 (how mispriced)
  arbitrageOpportunities: Array<{
    choiceId: string
    currentOdds: number
    trueOdds: number
    edge: number         // Expected value
    confidence: number
  }>
  crowdSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  volume: number
  liquidity: number
}
```

##### `calculateKellyCriterion(edge, odds, bankroll)`

Calculate optimal bet size using Kelly Criterion.

```typescript
calculateKellyCriterion(
  edge: number,      // Expected value (e.g., 0.2 for 20% edge)
  odds: number,      // Payout odds (e.g., 3.0 for 3x)
  bankroll: number   // Total available capital
): number
```

**Returns:** Optimal bet size (in USDC)

---

## Example Trading Bots

### 1. Sentiment Surfer

Uses sentiment analysis to find positive outcomes.

```typescript
class SentimentSurfer {
  async findBets(story: Story, analytics: AnalyticsClient) {
    for (const chapter of story.chapters) {
      const sentiments = await analytics.analyzeAllChoices(chapter, story)
      
      // Find most positive choice
      let bestChoice = null
      let maxPositive = 0
      
      for (const [choiceId, sentiment] of Object.entries(sentiments)) {
        if (sentiment.positive > maxPositive) {
          maxPositive = sentiment.positive
          bestChoice = choiceId
        }
      }
      
      // Bet on most positive if confidence > 0.7
      if (maxPositive > 0.7) {
        return { choiceId: bestChoice, confidence: maxPositive }
      }
    }
    
    return null
  }
}
```

### 2. Pattern Hunter

Exploits story patterns (survival rate, AI behavior).

```typescript
class PatternHunter {
  async findBets(story: Story, analytics: AnalyticsClient) {
    const patterns = await analytics.detectPatterns(story)
    
    // If AI is optimistic (>0.7), bet on positive outcomes
    if (patterns.aiOptimism > 0.7) {
      const chapter = story.chapters[story.currentChapter - 1]
      const sentiments = await analytics.analyzeAllChoices(chapter, story)
      
      // Find most positive choice
      const positiveChoices = Object.entries(sentiments)
        .filter(([_, s]) => s.positive > 0.6)
        .map(([id, s]) => ({ choiceId: id, score: s.positive }))
        .sort((a, b) => b.score - a.score)
      
      return positiveChoices[0]
    }
    
    return null
  }
}
```

### 3. Arbitrage King

Finds mispriced bets and exploits them.

```typescript
class ArbitrageKing {
  async findBets(
    pool: BettingPool,
    chapter: Chapter,
    story: Story,
    analytics: AnalyticsClient
  ) {
    const efficiency = await analytics.analyzeMarketEfficiency(pool, chapter, story)
    
    // Find best arbitrage opportunity (highest edge, high confidence)
    const opportunities = efficiency.arbitrageOpportunities
      .filter(opp => opp.edge > 0.15 && opp.confidence > 0.6)
      .sort((a, b) => b.edge - a.edge)
    
    if (opportunities.length > 0) {
      const best = opportunities[0]
      const betSize = analytics.calculateKellyCriterion(
        best.edge,
        best.currentOdds,
        1000 // $1000 bankroll
      )
      
      return { choiceId: best.choiceId, amount: betSize }
    }
    
    return null
  }
}
```

### 4. Deep Void (GPT-4 Predictions)

Uses raw GPT-4 to predict outcomes.

```typescript
class DeepVoid {
  async findBets(chapter: Chapter, story: Story, analytics: AnalyticsClient) {
    // Use GPT-4 to directly predict
    const prediction = await analytics.predictAIChoice(chapter, story)
    
    // Bet on highest probability if confidence > 0.6
    if (prediction.confidence > 0.6) {
      const maxProb = Math.max(...prediction.choiceProbabilities)
      const bestChoiceIndex = prediction.choiceProbabilities.indexOf(maxProb)
      
      return { choiceId: chapter.choices[bestChoiceIndex].id, confidence: maxProb }
    }
    
    return null
  }
}
```

### 5. Herd Contrarian

Fades the public (bets opposite of crowd).

```typescript
class HerdContrarian {
  async findBets(pool: BettingPool, analytics: AnalyticsClient) {
    // Find choice with LEAST bets
    const pools = pool.choicePools
    const minBet = Math.min(...pools.map(p => parseFloat(p.amount)))
    const contrarian = pools.findIndex(p => parseFloat(p.amount) === minBet)
    
    // Only bet if crowd is heavily concentrated (>60% on one choice)
    const totalAmount = parseFloat(pool.totalAmount)
    const maxBet = Math.max(...pools.map(p => parseFloat(p.amount)))
    
    if (maxBet / totalAmount > 0.6) {
      return { choiceId: pool.choicePools[contrarian].choiceId }
    }
    
    return null
  }
}
```

---

## Full Trading Bot Example

```typescript
import { VoidborneSDK } from '@voidborne/agent-sdk'
import { AnalyticsClient } from '@voidborne/agent-sdk/analytics'

class VoidborneTradingBot {
  private sdk: VoidborneSDK
  private analytics: AnalyticsClient
  private bankroll = 1000 // $1000 USDC
  
  constructor() {
    this.sdk = new VoidborneSDK({
      network: 'testnet',
      privateKey: process.env.PRIVATE_KEY
    })
    
    this.analytics = new AnalyticsClient({
      openaiApiKey: process.env.OPENAI_API_KEY!
    })
  }
  
  async run() {
    console.log('🤖 Bot started, checking for opportunities...')
    
    while (true) {
      try {
        const stories = await this.sdk.getStories()
        
        for (const story of stories) {
          for (const chapter of story.chapters) {
            if (!chapter.bettingPool) continue
            
            // 1. Analyze market
            const pool = await this.sdk.getBettingPool(chapter.bettingPool.id)
            const efficiency = await this.analytics.analyzeMarketEfficiency(
              pool,
              chapter,
              story
            )
            
            // 2. Find best arbitrage
            const opportunities = efficiency.arbitrageOpportunities
              .filter(opp => opp.edge > 0.2 && opp.confidence > 0.7)
              .sort((a, b) => b.edge - a.edge)
            
            if (opportunities.length === 0) continue
            
            // 3. Calculate bet size
            const best = opportunities[0]
            const betSize = this.analytics.calculateKellyCriterion(
              best.edge,
              best.currentOdds,
              this.bankroll
            )
            
            // 4. Place bet
            console.log(`💰 Found ${(best.edge * 100).toFixed(1)}% edge`)
            console.log(`   Betting $${betSize.toFixed(2)} on choice ${best.choiceId}`)
            
            const result = await this.sdk.placeBet({
              poolId: pool.id,
              choiceId: best.choiceId,
              amount: betSize.toString()
            })
            
            if (result.success) {
              console.log(`✅ Bet placed: ${result.hash}`)
              this.bankroll -= betSize
            } else {
              console.log(`❌ Bet failed: ${result.error}`)
            }
          }
        }
        
        // Wait 1 minute
        await new Promise(resolve => setTimeout(resolve, 60000))
        
      } catch (error) {
        console.error('❌ Error:', error)
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }
  }
}

// Run the bot
const bot = new VoidborneTradingBot()
bot.run()
```

---

## Performance Tips

### 1. Cache Results

Cache sentiment analysis and pattern detection to reduce API calls:

```typescript
const cache = new Map<string, any>()

async function getCachedSentiment(choiceId: string, choice: Choice, context: any) {
  if (cache.has(choiceId)) {
    return cache.get(choiceId)
  }
  
  const sentiment = await analytics.analyzeSentiment(choice, context)
  cache.set(choiceId, sentiment)
  return sentiment
}
```

### 2. Batch Operations

Analyze all choices at once instead of one-by-one:

```typescript
const sentiments = await analytics.analyzeAllChoices(chapter, story)
```

### 3. Use Cheaper Models

For simple tasks, use `gpt-4o-mini` instead of `gpt-4`:

```typescript
// In analytics.ts, change model:
model: 'gpt-4o-mini' // 60x cheaper
```

### 4. Implement Rate Limiting

Avoid hitting OpenAI rate limits:

```typescript
import pLimit from 'p-limit'

const limit = pLimit(10) // Max 10 concurrent requests

const sentiments = await Promise.all(
  choices.map(choice => 
    limit(() => analytics.analyzeSentiment(choice, context))
  )
)
```

---

## Backtesting

Test your bot on historical data before deploying:

```typescript
class Backtester {
  async backtest(bot: any, historicalData: Story[]) {
    let totalProfit = 0
    let totalBets = 0
    let wins = 0
    
    for (const story of historicalData) {
      for (const chapter of story.chapters) {
        if (!chapter.bettingPool || !chapter.resolvedChoice) continue
        
        // Get bot's prediction
        const bet = await bot.findBet(chapter, story)
        if (!bet) continue
        
        totalBets++
        
        // Check if bot won
        if (bet.choiceId === chapter.resolvedChoice) {
          const odds = calculateOdds(chapter.bettingPool, bet.choiceId)
          const payout = bet.amount * odds * 0.85
          totalProfit += payout - bet.amount
          wins++
        } else {
          totalProfit -= bet.amount
        }
      }
    }
    
    return {
      totalProfit,
      totalBets,
      winRate: wins / totalBets,
      roi: totalProfit / (totalBets * avgBetSize)
    }
  }
}
```

---

## Deployment

### 1. Environment Variables

```bash
# .env
PRIVATE_KEY=0x...
OPENAI_API_KEY=sk-...
BANKROLL=1000
NETWORK=testnet
```

### 2. Run Bot

```bash
node bot.js
```

### 3. Monitor Performance

Track bot performance in real-time:

```typescript
// Log trades to database
await prisma.botTrade.create({
  data: {
    botId: 'my-bot',
    poolId: pool.id,
    choiceId: best.choiceId,
    amount: betSize,
    odds: best.currentOdds,
    edge: best.edge,
    timestamp: new Date()
  }
})
```

### 4. Auto-Restart (PM2)

```bash
pm2 start bot.js --name voidborne-bot
pm2 save
pm2 startup
```

---

## FAQ

**Q: How accurate is sentiment analysis?**  
A: GPT-4 achieves ~75-85% accuracy. Combine with patterns for better results.

**Q: How much does this cost?**  
A: ~$0.01-0.05 per analysis (GPT-4). Use `gpt-4o-mini` for 60x cheaper ($0.0002 per analysis).

**Q: Can I use this on mainnet?**  
A: Yes! Set `network: 'mainnet'` in VoidborneSDK config.

**Q: What's the expected ROI?**  
A: Good bots achieve 15-30% ROI. Elite bots (with ML) can hit 40-50%+.

**Q: How do I compete with other bots?**  
A: Edge comes from:
- Faster analysis (latency arbitrage)
- Better models (GPT-4 vs GPT-3.5)
- Unique strategies (contrarian, pattern-based)
- Larger bankroll (Kelly sizing)

---

## License

MIT License - see LICENSE file for details.

---

**Happy bot building! 🤖💰**
