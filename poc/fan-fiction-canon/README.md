# Fan Fiction Canonization Market - POC

**Innovation Cycle #45 - Voidborne**  
**Date:** February 15, 2026

---

## Overview

**Fan Fiction Canonization Market (FFC)** allows fans to write side stories about Voidborne characters, submit them to the platform, and have the community bet on which stories become official canon.

**Key Features:**
- 📖 Writers submit stories (0.1 ETH fee)
- 🎯 Top 3 stories enter betting pool
- 🤖 AI scores quality (40% weight)
- 👥 Community votes (60% weight)
- 💰 Winners earn 70% of betting pool
- 🏆 Winners receive Canonical Author NFT badge
- ✅ Winning stories become official canon

---

## How It Works

### 1. Story Submission

Writers submit their fan fiction:

```typescript
const submissionId = await client.submitStory(
  'QmIPFSHashOfStory...', // Story stored on IPFS
  'Commander Zara\'s Lost Years', // Title
  1 // Character ID (Zara)
)
```

**Requirements:**
- Pay 0.1 ETH submission fee
- Story must be 800-3000 words
- Must reference existing canon
- Pass AI validation (coherence, plagiarism, character consistency)

**Economics:**
- Submission fee: 0.1 ETH (~$330)
- Platform keeps fees
- Author gets chance at $1,400+ pool earnings

---

### 2. Pool Creation

Platform selects top 3 submissions (based on AI + community review):

```typescript
const poolId = await client.createPool([
  submissionId1,
  submissionId2,
  submissionId3
])
```

**Pool Timeline:**
- Voting period: 72 hours
- Betting window: 48 hours (parallel to voting)
- Settlement: AI + community scores combined
- Winner announced + rewards distributed

---

### 3. Community Betting

Readers bet on which story will become canon:

```typescript
// Check current odds
const odds = await client.getAllOdds(poolId)
// { 1: 40%, 2: 35%, 3: 25% }

// Place bet
await client.placeBet(
  poolId,
  submissionId2, // Betting on story #2
  ethers.parseUnits('100', 6), // 100 USDC
  usdcAddress
)

// Check potential payout
const payout = await client.calculatePayout(
  poolId,
  submissionId2,
  ethers.parseUnits('100', 6)
)
// Payout if story #2 wins: ~285 USDC (2.85x)
```

**Betting Mechanics:**
- Parimutuel pool (like horse racing)
- Better odds on underdog stories
- 85% of pool to winners (pro-rata)
- 15% platform fee

---

### 4. Pool Settlement

Platform settles pool using AI + community scores:

```typescript
const winnerId = await client.settlePool(
  poolId,
  [85, 78, 92], // AI coherence scores (0-100)
  [3000, 5500, 1500] // Community vote % (30%, 55%, 15%)
)

// Final scores (40% AI, 60% community):
// Story 1: 0.85*0.4 + 0.30*0.6 = 0.52
// Story 2: 0.78*0.4 + 0.55*0.6 = 0.642 ✅ WINNER
// Story 3: 0.92*0.4 + 0.15*0.6 = 0.458
```

**Scoring:**
- **AI Score (40%):** Coherence, quality, character consistency
- **Community Vote (60%):** Popular vote on best story

**Winner Rewards:**
- Story becomes official canon
- Author earns 70% of betting pool
- Author receives Canonical Author NFT badge
- Story integrated into main narrative

---

### 5. Claim Rewards

**Authors:**
```typescript
// Check earnings
const earnings = await client.getAuthorEarnings(authorAddress)
console.log(`You earned ${ethers.formatUnits(earnings, 6)} USDC!`)

// Claim
await client.claimEarnings()
```

**Bettors:**
```typescript
// Claim winnings if you bet on winner
await client.claimWinnings(poolId)
```

---

## Economic Model

### Example Pool

**Setup:**
- 3 stories submitted (0.1 ETH × 3 = 0.3 ETH fees to platform)
- Total betting pool: 2,000 USDC

**Bets:**
- Story A: 500 USDC (25%)
- Story B: 1,200 USDC (60%)
- Story C: 300 USDC (15%)

**Settlement:**
- AI scores: A=85, B=78, C=90
- Community votes: A=30%, B=55%, C=15%
- **Final winner: Story B** (score 0.642)

**Payouts:**
```
Author of Story B:
- Earnings: 2,000 × 70% = 1,400 USDC ✅
- ROI: 1,400 / 330 = 324% 🚀

Bettors who picked Story B (1,200 USDC total):
- Share pool: 2,000 × 85% = 1,700 USDC
- Each bettor: (bet / 1,200) × 1,700
- Example: 100 USDC bet → 141.67 USDC (1.42x)

Platform:
- Submission fees: 0.3 ETH (~$1,000)
- Betting pool cut: 2,000 × 15% = 300 USDC
- Total: ~$1,300
```

---

## Installation

### Prerequisites

- Node.js 20+
- Foundry (for smart contracts)
- IPFS node (or Pinata/Infura)

### Setup

```bash
# Clone repository
cd /Users/eli5defi/.openclaw/workspace/StoryEngine/poc/fan-fiction-canon

# Install dependencies
npm install ethers@6

# Set up environment variables
cp .env.example .env
# Edit .env with your keys
```

**.env:**
```bash
# Base RPC
BASE_RPC_URL=https://mainnet.base.org

# Wallet
PRIVATE_KEY=your_private_key_here

# Contract addresses (after deployment)
FAN_FICTION_CANON_ADDRESS=0x...
USDC_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

# IPFS
IPFS_API_URL=https://api.pinata.cloud/pinning/pinFileToIPFS
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_KEY=your_pinata_secret

# AI (for validation)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

---

## Smart Contract Deployment

### Deploy to Base Sepolia (testnet)

```bash
# Compile contract
forge build

# Deploy
forge script script/DeployFFC.s.sol:DeployFFC \
  --rpc-url $BASE_SEPOLIA_RPC \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify

# Deployed to: 0x...
```

### Verify on BaseScan

```bash
forge verify-contract \
  0xYourContractAddress \
  src/FanFictionCanon.sol:FanFictionCanon \
  --chain base-sepolia
```

---

## TypeScript Client Usage

### Basic Example

```typescript
import { ethers } from 'ethers'
import { FanFictionCanonClient } from './client'

// Setup
const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL)
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider)

const client = new FanFictionCanonClient(
  process.env.FAN_FICTION_CANON_ADDRESS!,
  wallet
)

// Submit story
const submissionId = await client.submitStory(
  'QmStoryHash...',
  'Commander Zara\'s Secret Mission',
  1 // Character ID
)

console.log('Submitted:', submissionId)
```

### Author Workflow

```typescript
// 1. Submit story
const submissionId = await client.submitStory(
  ipfsHash,
  title,
  characterId
)

// 2. Wait for pool creation (check events)
client.onPoolCreated((poolId, submissionIds) => {
  if (submissionIds.includes(submissionId)) {
    console.log('Your story is in pool', poolId)
  }
})

// 3. After settlement, claim earnings
await client.claimEarnings()
```

### Bettor Workflow

```typescript
// 1. Find active pool
const poolId = await client.nextPoolId() - 1

// 2. Check odds
const odds = await client.getAllOdds(poolId)
console.log('Odds:', odds)

// 3. Check potential payout
const betAmount = ethers.parseUnits('100', 6) // 100 USDC
const payout = await client.calculatePayout(poolId, submissionId, betAmount)
console.log('Potential payout:', ethers.formatUnits(payout, 6), 'USDC')

// 4. Place bet
await client.placeBet(poolId, submissionId, betAmount, usdcAddress)

// 5. After settlement, claim winnings
await client.claimWinnings(poolId)
```

---

## Testing

### Unit Tests (Foundry)

```bash
# Run all tests
forge test -vvv

# Test coverage
forge coverage

# Gas report
forge test --gas-report
```

**Key Test Cases:**
- ✅ Submission with valid fee
- ✅ Pool creation with 3 submissions
- ✅ Betting mechanics (pro-rata payout)
- ✅ Settlement (AI + community scoring)
- ✅ Earnings/winnings claims
- ✅ NFT badge minting
- ✅ Edge cases (0 bets, ties, etc.)

---

## IPFS Integration

### Uploading Stories

```typescript
import { create } from 'ipfs-http-client'

const ipfs = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
})

async function uploadStory(content: string, metadata: any) {
  // Upload story content
  const { cid: contentCid } = await ipfs.add(content)
  
  // Upload metadata (title, author, etc.)
  const metadataJson = JSON.stringify({
    title: metadata.title,
    author: metadata.author,
    characterId: metadata.characterId,
    wordCount: content.split(/\s+/).length,
    contentCid: contentCid.toString(),
  })
  
  const { cid: metadataCid } = await ipfs.add(metadataJson)
  
  return {
    contentHash: contentCid.toString(),
    metadataHash: metadataCid.toString(),
  }
}
```

---

## AI Validation

### Story Coherence Check

```typescript
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

async function validateStory(
  story: string,
  characterId: number,
  existingLore: string[]
): Promise<{ valid: boolean; score: number; issues: string[] }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  
  // 1. Check word count
  const wordCount = story.split(/\s+/).length
  if (wordCount < 800 || wordCount > 3000) {
    return {
      valid: false,
      score: 0,
      issues: [`Word count ${wordCount} outside range 800-3000`],
    }
  }
  
  // 2. Plagiarism check (GPT-4 embeddings)
  // ... implementation ...
  
  // 3. Coherence check (Claude)
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `Score this fan fiction's coherence with existing lore (0-100):

Existing lore:
${existingLore.join('\n\n')}

Fan story:
${story}

Provide JSON: {"score": <0-100>, "reasoning": "<brief>"}`,
    }],
  })
  
  const result = JSON.parse(
    response.content[0].type === 'text' ? response.content[0].text : '{}'
  )
  
  return {
    valid: result.score >= 60,
    score: result.score,
    issues: result.score < 60 ? ['Low coherence score'] : [],
  }
}
```

---

## Revenue Projections

### Year 1 (100 submissions/month)

```
Monthly:
- Submission fees: 100 × 0.1 ETH × $3,300 = $33,000
- Betting pools: 20 pools × $2,000 × 15% = $6,000
- Total: $39,000/month

Annual: $468,000
```

### Year 5 (1,000 submissions/month)

```
Monthly:
- Submission fees: 1,000 × 0.1 ETH × $3,300 = $330,000
- Betting pools: 200 pools × $10,000 × 15% = $300,000
- Total: $630,000/month

Annual: $7.56M
```

**Creator Economy:**
- Year 1: $1.1M paid to authors
- Year 5: $11M paid to authors

---

## Roadmap

### Phase 1: MVP (Weeks 1-4)
- ✅ Smart contract development
- ✅ TypeScript client
- ✅ IPFS integration
- ✅ Basic validation

### Phase 2: AI Validation (Weeks 5-6)
- [ ] GPT-4 plagiarism detection
- [ ] Claude coherence scoring
- [ ] Character consistency checks
- [ ] Explicit content filtering

### Phase 3: Frontend (Weeks 7-8)
- [ ] Submission portal
- [ ] Pool betting interface
- [ ] Community voting UI
- [ ] Creator dashboard

### Phase 4: Beta Testing (Weeks 9-10)
- [ ] 50 beta authors
- [ ] 10 pools tested
- [ ] Bug fixes
- [ ] UX improvements

### Phase 5: Launch (Week 11)
- [ ] Mainnet deployment
- [ ] Marketing campaign
- [ ] Influencer partnerships
- [ ] 🎉 Launch!

---

## Security

### Audits

- **OpenZeppelin:** Smart contract audit
- **Trail of Bits:** Security review
- **Bug Bounty:** $10K reward pool

### Best Practices

- ✅ ReentrancyGuard on all state-changing functions
- ✅ Access control (Ownable)
- ✅ Input validation
- ✅ Safe math (Solidity 0.8+)
- ✅ Event logging

---

## FAQ

**Q: How do I become a Canonical Author?**  
A: Submit a high-quality story, get it selected for a pool, and have it win (AI + community vote).

**Q: What are the odds of winning?**  
A: Depends on competition. Aim for 60%+ coherence score and strong community appeal.

**Q: Can I submit multiple stories?**  
A: Yes! No limit. More submissions = more chances.

**Q: What if my story isn't selected for a pool?**  
A: Submission fee is non-refundable. Focus on quality!

**Q: How long until my story becomes canon?**  
A: ~1 week (72h voting + 48h settlement + integration).

**Q: Can I bet on my own story?**  
A: Yes, but be aware of potential conflicts. Community may vote against obvious self-promotion.

---

## Support

**Discord:** #fan-fiction-canon channel  
**Twitter:** @VoidborneGame  
**Docs:** https://voidborne.gg/docs/fan-fiction

---

## License

MIT License - See LICENSE file

---

**Ready to write your Voidborne story? Submit now! 🚀**

**Next Steps:**
1. Write 800-3000 word story
2. Upload to IPFS
3. Submit via client (0.1 ETH)
4. Wait for pool selection
5. Hope for canonization!

**May the best story win! 📖✨**
