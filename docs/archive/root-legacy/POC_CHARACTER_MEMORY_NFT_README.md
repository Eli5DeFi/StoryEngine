# Character Memory NFT - Proof of Concept

**Dynamic, soul-bound NFTs that evolve based on betting behavior in Voidborne**

---

## 🎯 Overview

Character Memory NFTs are **living digital artifacts** that grow with you as you explore Voidborne's narrative universe.

**Key Features:**
- ✅ **Auto-mint on first bet** - No extra steps required
- ✅ **Dynamic evolution** - Changes based on your choices
- ✅ **Soul-bound** - Cannot be transferred (truly yours)
- ✅ **Badge system** - Earn collectibles for story milestones
- ✅ **Gas-optimized** - Efficient updates on Base

---

## 📦 What's Included

### Smart Contract (`CharacterMemoryNFT.sol`)

**Location:** `packages/contracts/src/CharacterMemoryNFT.sol`

**Features:**
- ERC-721 NFT with dynamic metadata
- Soul-bound (non-transferable)
- Auto-evolution based on betting stats
- Badge system for achievements
- Gas-optimized storage

**Contract Size:** 16.1 KB  
**Test Coverage:** Coming soon

### TypeScript Client (`CharacterMemoryNFTClient.ts`)

**Location:** `packages/contracts/src/clients/CharacterMemoryNFTClient.ts`

**Features:**
- Easy-to-use API
- Type-safe interfaces
- Event listeners
- Utility methods (USDC conversion, formatting)
- Example usage

**Client Size:** 15.5 KB

---

## 🚀 Quick Start

### 1. Deploy Contract

```bash
# Install dependencies
cd packages/contracts
npm install

# Compile
forge build

# Deploy to Base Sepolia (testnet)
forge create src/CharacterMemoryNFT.sol:CharacterMemoryNFT \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY \
  --constructor-args \
    "Voidborne Character Memory" \
    "VOIDCHAR" \
    "ipfs://QmYourBaseURI/"
```

### 2. Initialize Client

```typescript
import { CharacterMemoryNFTClient } from './clients/CharacterMemoryNFTClient'
import { ethers } from 'ethers'

// Read-only mode (query data)
const provider = new ethers.providers.JsonRpcProvider('https://sepolia.base.org')
const client = new CharacterMemoryNFTClient(
  '0xYourContractAddress',
  provider
)

// Write mode (mint, update stats)
const client = new CharacterMemoryNFTClient(
  '0xYourContractAddress',
  provider,
  process.env.PRIVATE_KEY // Your private key
)
```

### 3. Mint NFT

```typescript
// Mint for a user (first bet)
const result = await client.mint('0xUserWalletAddress')

console.log('Token ID:', result.tokenId)
console.log('TX Hash:', result.txHash)
console.log('Gas Used:', result.gasUsed.toString())
```

### 4. Update Stats (After Bet)

```typescript
// User placed a $25 bet and won $50 payout
const tokenId = await client.getTokenByWallet('0xUserWalletAddress')

const result = await client.updateStats(
  tokenId,
  CharacterMemoryNFTClient.usdcToWei(25), // Bet amount
  true, // Won
  CharacterMemoryNFTClient.usdcToWei(50)  // Payout
)

if (result.evolved) {
  console.log('🎉 Character evolved!')
  console.log('New Archetype:', CharacterMemoryNFTClient.getArchetypeName(result.newArchetype!))
  console.log('New Risk Level:', CharacterMemoryNFTClient.getRiskLevelName(result.newRiskLevel!))
  console.log('New Alignment:', CharacterMemoryNFTClient.getAlignmentName(result.newAlignment!))
}
```

### 5. Award Badge

```typescript
// User witnessed a major story event
await client.awardBadge(
  tokenId,
  'Witnessed the Fall of Valdris', // Badge name
  'chapter-15', // Chapter ID
  BadgeRarity.LEGENDARY
)
```

### 6. Query Character

```typescript
// Get full profile
const profile = await client.getProfileByWallet('0xUserWalletAddress')

console.log('Character Stats:')
console.log('- Total Bets:', profile!.stats.totalBets.toString())
console.log('- Total Wagered:', CharacterMemoryNFTClient.weiToUsdc(profile!.stats.totalWagered))
console.log('- Win Rate:', CharacterMemoryNFTClient.formatWinRate(profile!.stats.winRate))
console.log('- Archetype:', CharacterMemoryNFTClient.getArchetypeName(profile!.stats.archetype))
console.log('- Badges:', profile!.badges.length)
```

---

## 🧬 Evolution System

### Archetypes

Determined by betting behavior after **10+ bets**:

| Archetype | Criteria | Description |
|-----------|----------|-------------|
| **Strategist** | Win rate ≥ 70% | High win rate, calculated bets |
| **Gambler** | Avg bet > $50 | Large bets, high variance |
| **Oracle** | Longest streak ≥ 5 | Long winning streaks, good predictions |
| **Contrarian** | Default | Bets against the crowd |

### Risk Levels

Determined by average bet size after **5+ bets**:

| Risk Level | Average Bet | Description |
|-----------|------------|-------------|
| **Conservative** | < $20 | Small, safe bets |
| **Balanced** | $20-100 | Moderate bets |
| **Aggressive** | > $100 | Large, risky bets |

### Alignments

Determined by win rate after **10+ bets**:

| Alignment | Criteria | Description |
|-----------|----------|-------------|
| **Order** | Win rate ≥ 60% | Bets on predictable outcomes |
| **Chaos** | Win rate < 60% | Bets on unlikely outcomes |
| **Neutral** | Default | Not yet determined |

### Evolution Triggers

NFT metadata (image, attributes) updates when:
- ✅ Archetype changes
- ✅ Risk level changes
- ✅ Alignment changes
- ✅ New badge earned

---

## 🏆 Badge System

### Badge Rarities

| Rarity | Examples | Impact |
|--------|----------|--------|
| **Common** | "Placed First Bet", "Won First Bet" | Basic milestones |
| **Rare** | "10-Win Streak", "Bet 1000 USDC Total" | Notable achievements |
| **Epic** | "Witnessed Major Plot Twist", "Contrarian Win" | Significant events |
| **Legendary** | "Perfect Chapter (100% wins)", "Founding Reader" | Rare accomplishments |

### Example Badges

```typescript
// Common: First bet
await client.awardBadge(tokenId, 'First Bet', 'chapter-1', BadgeRarity.COMMON)

// Rare: 10-win streak
await client.awardBadge(tokenId, '10-Win Streak', 'chapter-8', BadgeRarity.RARE)

// Epic: Witnessed major event
await client.awardBadge(tokenId, 'Witnessed the Betrayal', 'chapter-15', BadgeRarity.EPIC)

// Legendary: Founding reader
await client.awardBadge(tokenId, 'Founding Reader - Feb 2026', 'genesis', BadgeRarity.LEGENDARY)
```

---

## 📊 Data Model

### CharacterStats

```typescript
interface CharacterStats {
  totalBets: bigint           // Total number of bets placed
  totalWagered: bigint        // Total USDC wagered (6 decimals)
  totalWon: bigint            // Total USDC won (6 decimals)
  winRate: number             // Win rate in basis points (0-10000)
  currentStreak: number       // Current winning streak
  longestStreak: number       // Longest winning streak
  archetype: Archetype        // Character archetype
  riskLevel: RiskLevel        // Risk tolerance
  alignment: Alignment        // Order vs Chaos
  mintedAt: number            // Timestamp minted
  lastUpdatedAt: number       // Last stats update
}
```

### Badge

```typescript
interface Badge {
  badgeId: string      // Keccak256 hash of badge name
  earnedAt: number     // Timestamp earned
  chapterId: string    // Chapter where earned
  rarity: BadgeRarity  // Common/Rare/Epic/Legendary
}
```

### CharacterProfile

```typescript
interface CharacterProfile {
  tokenId: number       // NFT token ID
  owner: string         // Wallet address
  stats: CharacterStats // Character stats
  badges: Badge[]       // Earned badges
  metadataURI: string   // IPFS metadata URI
}
```

---

## 🔧 Integration with Voidborne

### 1. Auto-Mint on First Bet

In your betting contract:

```solidity
// Import CharacterMemoryNFT
import "./CharacterMemoryNFT.sol";

contract ChapterBettingPool {
  CharacterMemoryNFT public characterNFT;
  
  function placeBet(uint8 branchIndex, uint256 amount) external {
    // Check if user has NFT
    uint256 tokenId = characterNFT.walletToTokenId(msg.sender);
    
    if (tokenId == 0) {
      // First bet, mint NFT
      characterNFT.mint(msg.sender);
    }
    
    // Continue with bet logic...
  }
}
```

### 2. Update Stats After Bet Resolves

```typescript
// After chapter resolves and winners are determined
async function resolveChapter(chapterId: string) {
  const bets = await getBetsForChapter(chapterId)
  const winningChoiceId = await determineWinner(chapterId)
  
  for (const bet of bets) {
    const won = bet.choiceId === winningChoiceId
    const payout = won ? calculatePayout(bet) : 0
    
    // Get user's NFT token ID
    const tokenId = await nftClient.getTokenByWallet(bet.userId)
    
    if (tokenId > 0) {
      // Update NFT stats
      await nftClient.updateStats(
        tokenId,
        CharacterMemoryNFTClient.usdcToWei(bet.amount),
        won,
        CharacterMemoryNFTClient.usdcToWei(payout)
      )
    }
  }
}
```

### 3. Award Badges for Story Milestones

```typescript
// When a user witnesses a major story event
async function checkStoryMilestones(userId: string, chapterId: string) {
  const tokenId = await nftClient.getTokenByWallet(userId)
  if (tokenId === 0) return
  
  const chapter = await getChapter(chapterId)
  
  // Check for milestone badges
  if (chapter.isMajorPlotPoint) {
    await nftClient.awardBadge(
      tokenId,
      `Witnessed: ${chapter.title}`,
      chapterId,
      BadgeRarity.EPIC
    )
  }
  
  // Check for achievement badges
  const stats = await nftClient.getStats(tokenId)
  
  if (stats.currentStreak === 10) {
    await nftClient.awardBadge(
      tokenId,
      '10-Win Streak',
      chapterId,
      BadgeRarity.RARE
    )
  }
}
```

---

## 🎨 Metadata & Images

### Metadata Structure (JSON)

```json
{
  "name": "Voidborne Character #123",
  "description": "A battle-tested Oracle who survived 50 chapters of Voidborne",
  "image": "ipfs://QmImageHash",
  "animation_url": "ipfs://QmAnimationHash",
  "attributes": [
    {
      "trait_type": "Archetype",
      "value": "Oracle"
    },
    {
      "trait_type": "Risk Level",
      "value": "Aggressive"
    },
    {
      "trait_type": "Alignment",
      "value": "Order"
    },
    {
      "display_type": "number",
      "trait_type": "Total Bets",
      "value": 127
    },
    {
      "display_type": "boost_percentage",
      "trait_type": "Win Rate",
      "value": 73.2
    },
    {
      "display_type": "number",
      "trait_type": "Longest Streak",
      "value": 15
    },
    {
      "display_type": "number",
      "trait_type": "Badges Earned",
      "value": 8
    }
  ],
  "badges": [
    {
      "name": "Founding Reader",
      "rarity": "Legendary",
      "chapter": "genesis"
    },
    {
      "name": "Witnessed the Fall of Valdris",
      "rarity": "Epic",
      "chapter": "chapter-15"
    }
  ]
}
```

### Image Generation (DALL-E Prompts)

Dynamic prompts based on traits:

```typescript
function generateImagePrompt(stats: CharacterStats): string {
  const archetype = CharacterMemoryNFTClient.getArchetypeName(stats.archetype)
  const riskLevel = CharacterMemoryNFTClient.getRiskLevelName(stats.riskLevel)
  const alignment = CharacterMemoryNFTClient.getAlignmentName(stats.alignment)
  
  const basePrompt = `Fantasy character portrait, ${archetype} archetype, ${riskLevel} personality, ${alignment} alignment, digital art, concept art, highly detailed`
  
  // Add traits based on stats
  const traits: string[] = []
  
  if (stats.winRate > 8000) {
    traits.push('glowing eyes (victorious)')
  }
  
  if (stats.longestStreak >= 10) {
    traits.push('golden crown (streak master)')
  }
  
  if (stats.totalWon > stats.totalWagered * 2n) {
    traits.push('radiant aura (profitable)')
  }
  
  if (stats.currentStreak === 0 && stats.totalBets > 10) {
    traits.push('battle scars (experienced losses)')
  }
  
  return `${basePrompt}, ${traits.join(', ')}`
}
```

---

## 💰 Gas Costs (Base Sepolia)

| Operation | Gas Used | Cost (GWEI=0.001) |
|-----------|----------|-------------------|
| **Mint** | ~150,000 | $0.15 |
| **Update Stats** | ~80,000 | $0.08 |
| **Update Stats (with evolution)** | ~120,000 | $0.12 |
| **Award Badge** | ~100,000 | $0.10 |
| **Query Stats** | 0 (read-only) | Free |

**Total cost per user (Year 1):**
- Mint: $0.15
- 50 stat updates: $4-6 (avg $0.08-0.12 each)
- 5 badge awards: $0.50
- **Total: ~$5-7/year per active user**

---

## 🔐 Security Considerations

### Soul-Bound (Non-Transferable)

NFTs cannot be transferred:
```solidity
function transferFrom(...) public pure override {
  revert SoulBoundToken();
}
```

**Why?**
- Prevents secondary market manipulation
- Ensures NFT reflects true betting history
- Protects against theft

Users can still **burn** their NFT if desired.

### Access Control

Only authorized updaters can modify stats:
```solidity
modifier onlyAuthorized() {
  require(isAuthorizedUpdater[msg.sender] || msg.sender == owner());
  _;
}
```

**Authorized updaters:**
- Betting pool contracts
- Backend services (for badge awards)
- Contract owner (admin)

### Reentrancy Protection

All write functions use `nonReentrant`:
```solidity
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

function updateStats(...) external onlyAuthorized nonReentrant {
  // Safe from reentrancy attacks
}
```

---

## 🧪 Testing

### Unit Tests (Coming Soon)

```bash
cd packages/contracts
forge test
```

Test coverage:
- ✅ Minting (happy path, duplicates, edge cases)
- ✅ Stats updates (wins, losses, streaks)
- ✅ Evolution triggers (archetype, risk, alignment)
- ✅ Badge awards (new, duplicates, rarities)
- ✅ Soul-bound transfers (should revert)
- ✅ Access control (unauthorized updates)
- ✅ Gas optimization

### Integration Tests

```typescript
// Test with real Voidborne betting flow
describe('CharacterMemoryNFT Integration', () => {
  it('should mint on first bet', async () => {
    const wallet = '0x...'
    
    // User places first bet
    await bettingPool.placeBet(choiceId, amount)
    
    // NFT should be minted
    const tokenId = await nftClient.getTokenByWallet(wallet)
    expect(tokenId).toBeGreaterThan(0)
  })
  
  it('should evolve after 10 bets', async () => {
    // Place 10 winning bets
    for (let i = 0; i < 10; i++) {
      await placeBetAndWin(wallet, 25)
    }
    
    // Check evolution
    const stats = await nftClient.getStats(tokenId)
    expect(stats.archetype).toBe(Archetype.STRATEGIST) // High win rate
  })
})
```

---

## 📈 Analytics

### Tracking Metrics

```typescript
// Track NFT engagement
interface NFTAnalytics {
  totalMinted: number
  activeToday: number       // Updated in last 24h
  averageBetsPerNFT: number
  averageWinRate: number
  
  archetypeDistribution: {
    strategist: number
    gambler: number
    oracle: number
    contrarian: number
  }
  
  riskLevelDistribution: {
    conservative: number
    balanced: number
    aggressive: number
  }
  
  badgeStats: {
    totalBadgesEarned: number
    commonBadges: number
    rareBadges: number
    epicBadges: number
    legendaryBadges: number
  }
}
```

### SQL Queries

```sql
-- Get archetype distribution
SELECT 
  CASE character_stats.archetype
    WHEN 1 THEN 'Strategist'
    WHEN 2 THEN 'Gambler'
    WHEN 3 THEN 'Oracle'
    WHEN 4 THEN 'Contrarian'
    ELSE 'None'
  END as archetype,
  COUNT(*) as count
FROM character_stats
GROUP BY archetype
ORDER BY count DESC;

-- Get top 10 most evolved characters
SELECT 
  token_id,
  total_bets,
  total_won,
  win_rate,
  longest_streak,
  (SELECT COUNT(*) FROM badges WHERE token_id = character_stats.token_id) as badge_count
FROM character_stats
ORDER BY 
  (total_bets * win_rate * longest_streak) DESC
LIMIT 10;
```

---

## 🚀 Deployment Checklist

### Pre-Launch

- [ ] Smart contract audited (Certik, OpenZeppelin)
- [ ] TypeScript client tested
- [ ] Metadata API deployed (generates dynamic JSON)
- [ ] Image generation pipeline setup (DALL-E API)
- [ ] Gas costs calculated
- [ ] Database schema updated (mirror on-chain data)

### Launch

- [ ] Deploy to Base mainnet
- [ ] Verify contract on Basescan
- [ ] Set authorized updaters (betting contracts, backend)
- [ ] Set base URI (IPFS gateway)
- [ ] Update frontend (show NFT in user profile)
- [ ] Add NFT gallery page

### Post-Launch

- [ ] Monitor gas costs
- [ ] Track evolution patterns
- [ ] Gather user feedback
- [ ] Iterate on badge design
- [ ] Add more evolution rules

---

## 📚 Resources

**Smart Contract:**
- OpenZeppelin ERC-721: https://docs.openzeppelin.com/contracts/4.x/erc721
- Foundry Docs: https://book.getfoundry.sh/

**Metadata Standards:**
- OpenSea Metadata: https://docs.opensea.io/docs/metadata-standards
- ERC-721 Metadata: https://eips.ethereum.org/EIPS/eip-721

**Image Generation:**
- DALL-E API: https://platform.openai.com/docs/guides/images
- Midjourney API: https://docs.midjourney.com/

**Base Network:**
- Base Docs: https://docs.base.org/
- Base Sepolia Faucet: https://faucet.quicknode.com/base/sepolia

---

## 💡 Future Enhancements

### Phase 2 Features

1. **Cross-Story Persistence**
   - NFTs carry over to new Voidborne stories
   - Veteran perks (higher betting limits, exclusive markets)

2. **Advanced Traits**
   - Story-specific traits ("Survived the Siege", "Betrayed House Kross")
   - Relationship traits ("Allied with X", "Enemy of Y")

3. **Social Features**
   - Compare NFTs with friends
   - Leaderboard by rarest NFT
   - NFT battles (who has better stats?)

4. **Creator Economy**
   - Top NFT holders can submit character backstories
   - Influence AI story generation
   - Earn royalties from popular stories

5. **Cosmetic Upgrades**
   - Paid upgrades ($2-10) for custom artwork
   - Animated versions
   - 3D models (VR/AR ready)

---

## 🤝 Contributing

Found a bug? Have a feature idea?

1. Open an issue on GitHub
2. Submit a pull request
3. Join our Discord: [discord.gg/voidborne](#)

---

## 📄 License

MIT License - see LICENSE file for details

---

**Built with ❤️ for Voidborne by the Voidborne team**
