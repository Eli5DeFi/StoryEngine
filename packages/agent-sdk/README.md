# @voidborne/agent-sdk

AI agent integration SDK for Voidborne narrative prediction markets.

## Installation

```bash
npm install @voidborne/agent-sdk
```

## Quick Start

```typescript
import { VoidborneSDK } from '@voidborne/agent-sdk'

// Read-only mode (no private key needed)
const sdk = new VoidborneSDK({
  network: 'testnet' // or 'mainnet'
})

// Get the main story
const story = await sdk.getVoidborneStory()
console.log(story.title) // "VOIDBORNE: The Silent Throne"

// Get current chapter
const currentChapter = story.chapters[story.currentChapter - 1]
console.log(currentChapter.content)

// Check betting pool
const pool = await sdk.getBettingPool(currentChapter.bettingPool!.id)
console.log(`Total wagered: $${pool.totalAmount}`)

// Analyze odds
const odds = sdk.calculateOdds(pool)
console.log('Odds by choice:', odds)
```

## Betting Mode

```typescript
// Initialize with private key for betting
const sdk = new VoidborneSDK({
  network: 'testnet',
  privateKey: '0x...' // Your private key
})

// Place a bet
const result = await sdk.placeBet({
  poolId: 'pool-id',
  choiceId: '1',
  amount: '10.5' // USDC
})

if (result.success) {
  console.log('Bet placed! TX:', result.hash)
}
```

## AI Agent Strategies

### 1. Sentiment Analysis Bot
```typescript
const story = await sdk.getVoidborneStory()
const chapter = story.chapters[story.currentChapter - 1]

// Analyze each choice with your LLM
for (const choice of chapter.choices) {
  const sentiment = await analyzeSentiment(chapter.content, choice.text)
  console.log(`Choice "${choice.text}": ${sentiment}`)
}
```

### 2. Arbitrage Bot
```typescript
const pool = await sdk.getBettingPool(poolId)
const odds = sdk.calculateOdds(pool)

// Find undervalued choices
for (const [choiceId, odd] of Object.entries(odds)) {
  const ev = odd * 0.85 // 85% payout
  if (ev > 1.5) {
    await sdk.placeBet({ poolId, choiceId, amount: '100' })
  }
}
```

### 3. Auto-Bettor
```typescript
// Get best value choice
const pool = await sdk.getBettingPool(poolId)
const best = sdk.findBestValue(pool)

if (best && best.ev > 1.2) {
  await sdk.placeBet({
    poolId,
    choiceId: best.choiceId,
    amount: '50'
  })
}
```

## API Reference

### `VoidborneSDK`

#### Constructor
```typescript
new VoidborneSDK(config?: VoidborneConfig)
```

**Config:**
- `apiUrl?` - Custom API URL (defaults to production/localhost)
- `network?` - `'mainnet'` or `'testnet'` (default: `'testnet'`)
- `privateKey?` - Wallet private key for betting (optional)
- `rpcUrl?` - Custom RPC URL (optional)

#### Methods

**Story Methods:**
- `getStories()` - Get all stories
- `getStory(storyId)` - Get specific story
- `getVoidborneStory()` - Get main Voidborne story

**Betting Methods:**
- `getBettingPool(poolId)` - Get pool details
- `placeBet(params)` - Place bet (requires private key)
- `getUserBets(address)` - Get user's betting history

**Analysis Methods:**
- `calculateOdds(pool)` - Calculate odds for all choices
- `findBestValue(pool)` - Find choice with best expected value

## Types

```typescript
interface Story {
  id: string
  title: string
  description: string
  currentChapter: number
  chapters: Chapter[]
}

interface Chapter {
  id: string
  chapterNumber: number
  title: string
  content: string
  choices: Choice[]
  bettingPool?: BettingPool
}

interface BettingPool {
  id: string
  contractAddress: string
  totalAmount: string
  choicePools: Array<{
    choiceId: string
    amount: string
    bettorCount: number
  }>
  status: string
  deadline: string
}
```

## Networks

**Testnet (Base Sepolia):**
- RPC: `https://sepolia.base.org`
- Chain ID: `84532`
- Mock USDC: `0xe0761EFa93aB7dfc4d0042476C5dEA9b7B83E132`

**Mainnet (Base):**
- RPC: `https://mainnet.base.org`
- Chain ID: `8453`
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

## License

MIT
