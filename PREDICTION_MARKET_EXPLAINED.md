# 🎲 Voidborne Prediction Market - Complete Explanation

## Overview

Voidborne uses **combinatorial prediction markets** to let readers bet USDC on story outcomes. Think of it as:
- **Sports betting** (parlays, teasers) meets **interactive fiction**
- **Parimutuel pools** (like horse racing) but for narrative choices
- **DeFi protocols** (trustless, on-chain settlement) for storytelling

---

## Part 1: Core Concepts

### 1.1 What Is a Prediction Market?

A prediction market allows people to bet on future events. The market price reflects collective belief about probability.

**Example:**
- Event: "Will House Valdris ally with House Kyreth?"
- If 70% of bets are YES → market thinks 70% likely
- If you think it's 90% likely → you bet YES for profit

### 1.2 Parimutuel vs Fixed Odds

**Voidborne uses PARIMUTUEL betting:**

| Aspect | Fixed Odds | Parimutuel (Voidborne) |
|--------|------------|------------------------|
| Odds | Set when you bet | Determined at resolution |
| Risk | Bookmaker takes risk | Shared among bettors |
| Pool | You bet against house | You bet against other players |
| Example | Sportsbooks | Horse racing, Voidborne |

**How Parimutuel Works:**
```
Total Pool: $10,000 USDC
Choice A bets: $7,000 (70%)
Choice B bets: $3,000 (30%)

If Choice A wins:
- Payout = $10,000 / $7,000 = 1.43x
- You bet $100 → You get $143 (43% profit)

If Choice B wins:
- Payout = $10,000 / $3,000 = 3.33x
- You bet $100 → You get $333 (233% profit!)
```

### 1.3 Combinatorial Betting

**Single Bet:**
- "Choice A wins in Chapter 5"

**Combinatorial Bet (PARLAY):**
- "Choice A wins in Chapter 5 AND Character survives Chapter 6 AND Artifact discovered in Chapter 7"
- All 3 must happen to win
- Higher risk = **exponentially higher payout**

**Math:**
```
Outcome 1 odds: 2.0x
Outcome 2 odds: 1.5x
Outcome 3 odds: 3.0x

Combined odds = 2.0 × 1.5 × 3.0 = 9.0x

Bet $100 → Win $900 (if all 3 hit)
```

---

## Part 2: Smart Contract Architecture

### 2.1 Contract: `CombinatorialBettingPool.sol`

**Technology Stack:**
- **Blockchain:** Base L2 (low fees, fast)
- **Token:** USDC (stablecoin)
- **Framework:** Solidity 0.8.23 + OpenZeppelin
- **Security:** ReentrancyGuard, Ownable, SafeERC20

### 2.2 Core Data Structures

#### Outcome
Represents a possible future event in the story.

```solidity
struct Outcome {
    uint256 outcomeId;           // Unique ID
    OutcomeType outcomeType;      // STORY_CHOICE, CHARACTER_FATE, etc.
    string description;           // "House Valdris forms alliance"
    uint256 chapterId;            // Which chapter this occurs in
    uint256 choiceId;             // Optional: specific choice ID
    OutcomeStatus status;         // PENDING → RESOLVED_TRUE/FALSE
    uint256 resolvedAt;           // Timestamp of resolution
}
```

**6 Outcome Types:**
1. `STORY_CHOICE` - Standard chapter decision ("Left door" vs "Right door")
2. `CHARACTER_FATE` - Character survives/dies
3. `RELATIONSHIP` - Alliance formed/broken
4. `ITEM_DISCOVERY` - Artifact found
5. `PLOT_TWIST` - Specific event happens
6. `WORLD_STATE` - Global condition met (war declared, treaty signed)

#### MultiDimensionalBet
Represents a user's combinatorial bet.

```solidity
struct MultiDimensionalBet {
    address bettor;              // Who placed the bet
    uint256[] outcomeIds;        // Which outcomes (2-10)
    uint256 amount;              // USDC amount wagered
    uint256 combinedOdds;        // Calculated at bet time (18 decimals)
    BetType betType;             // PARLAY, TEASER, ROUND_ROBIN, PROGRESSIVE
    bool settled;                // Has this been paid out?
    bool won;                    // Did bettor win?
    uint256 payout;              // How much paid (if won)
    uint256 timestamp;           // When bet was placed
}
```

**4 Bet Types:**
1. **PARLAY** - All outcomes must occur (highest risk/reward)
2. **TEASER** - Adjusted odds for safer bets
3. **ROUND_ROBIN** - Multiple parlays combined
4. **PROGRESSIVE** - Add legs over time

### 2.3 Key Functions

#### Creating Outcomes (Admin Only)
```solidity
function createOutcome(
    OutcomeType outcomeType,
    string calldata description,
    uint256 chapterId,
    uint256 choiceId
) external onlyOwner returns (uint256 outcomeId)
```

**When used:**
- Before each chapter is published
- Creates betting options for that chapter
- Example: "Chapter 5 has 3 choices → Create 3 outcomes"

#### Placing Bets (Anyone)
```solidity
function placeCombiBet(
    uint256[] calldata outcomeIds,  // E.g. [12, 45, 67]
    uint256 amount,                  // E.g. 100 USDC
    BetType betType                  // E.g. PARLAY
) external nonReentrant returns (uint256 betId)
```

**What happens:**
1. **Validation:**
   - Check 2-10 outcomes
   - Check all outcomes are PENDING (not resolved yet)
   - Check amount is valid (<= max bet)

2. **Odds Calculation:**
   ```solidity
   uint256 combinedOdds = calculateCombinedOdds(outcomeIds);
   // Multiplies individual outcome odds together
   ```

3. **Storage:**
   - Create bet record
   - Add to user's bet history
   - Update global statistics

4. **Token Transfer:**
   ```solidity
   bettingToken.safeTransferFrom(msg.sender, address(this), amount);
   // Transfers USDC from bettor to contract
   ```

5. **Update Pools:**
   - Track how much wagered on each outcome
   - Used to calculate odds for future bets

#### Resolving Outcomes (Admin Only)
```solidity
function resolveOutcome(
    uint256 outcomeId,
    bool occurred  // true = happened, false = didn't happen
) external onlyOwner
```

**When used:**
- After chapter is published
- AI/author decides which choice won
- Sets outcome to RESOLVED_TRUE or RESOLVED_FALSE

#### Settling Bets (Anyone Can Trigger)
```solidity
function settleBet(uint256 betId) external nonReentrant
```

**What happens:**
1. **Check All Resolved:**
   - All outcomes in the bet must be resolved
   - Can't settle partially

2. **Determine Win/Loss:**
   - For PARLAY: ALL outcomes must be RESOLVED_TRUE
   - If any is FALSE → Bet loses

3. **Calculate Payout (if won):**
   ```solidity
   uint256 grossPayout = (bet.amount * bet.combinedOdds) / ODDS_DECIMALS;
   // Example: $100 × 9.0x = $900
   
   uint256 platformFee = (grossPayout * 500) / 10000; // 5%
   uint256 netPayout = grossPayout - platformFee;     // $855
   ```

4. **Distribute Fees:**
   - 70% to treasury (protocol)
   - 30% to operational wallet (maintenance)

5. **Pay Winner:**
   ```solidity
   bettingToken.safeTransfer(bet.bettor, netPayout);
   ```

### 2.4 Odds Calculation

**Simplified Parimutuel Formula:**

```solidity
function getOddsForOutcome(uint256 outcomeId) public view returns (uint256) {
    uint256 totalBets = outcomeTotalBets[outcomeId];
    
    // Default: 2.0x if no bets yet
    if (totalBets == 0) return 2 * ODDS_DECIMALS;
    
    // More bets = lower odds (more likely)
    // Fewer bets = higher odds (less likely)
    uint256 numBets = outcomeNumBets[outcomeId];
    uint256 baseOdds = (totalBets * ODDS_DECIMALS) / (totalBets + 1e6);
    
    return baseOdds < ODDS_DECIMALS ? ODDS_DECIMALS : baseOdds;
}
```

**Real-world Example:**
```
Chapter 5 has 3 choices:

Choice A: $5,000 wagered (50 bets) → Odds: 1.2x (likely)
Choice B: $3,000 wagered (30 bets) → Odds: 1.5x (possible)
Choice C: $500 wagered (5 bets)    → Odds: 5.0x (unlikely)

Combined bet (A + B + C): 1.2 × 1.5 × 5.0 = 9.0x
```

---

## Part 3: Complete User Flow

### 3.1 Bettor Journey

**Step 1: Read Story**
```
User reads Chapter 4
Chapter ends with cliffhanger:
"The Regent receives three messengers..."
```

**Step 2: Explore Betting Options**
```
Chapter 5 outcomes available:
- Outcome #12: Regent allies with Valdris
- Outcome #13: Regent allies with Kyreth  
- Outcome #14: Regent rejects both

Current odds:
- #12: 1.8x (popular choice)
- #13: 2.5x (moderate)
- #14: 5.0x (dark horse)
```

**Step 3: Place Bet**
```
User wallet: 500 USDC

Option 1: Single bet
- Bet 100 USDC on Outcome #14
- Potential payout: 100 × 5.0 = 500 USDC (400 profit)

Option 2: Parlay (multi-chapter)
- Bet 50 USDC on:
  - Outcome #14 (5.0x) AND
  - Outcome #22 (2.0x, Chapter 6) AND
  - Outcome #31 (3.0x, Chapter 7)
- Combined odds: 5.0 × 2.0 × 3.0 = 30.0x
- Potential payout: 50 × 30.0 = 1,500 USDC (1,450 profit!)
```

**Step 4: Approve & Execute Transaction**
```javascript
// Frontend calls:
await usdcContract.approve(bettingPool, amount);
await bettingPool.placeCombiBet(
  [12, 22, 31],      // outcome IDs
  50 * 1e6,          // 50 USDC (6 decimals)
  BetType.PARLAY
);

// Transaction confirmed on Base L2 (~2 seconds, $0.01 gas)
```

**Step 5: Wait for Chapters**
```
Week 1: Chapter 5 published → Outcome #14 RESOLVES TRUE ✅
Week 2: Chapter 6 published → Outcome #22 RESOLVES TRUE ✅
Week 3: Chapter 7 published → Outcome #31 RESOLVES FALSE ❌

Result: Bet loses (needed all 3)
```

**Step 6: Settle Bet**
```javascript
// After all outcomes resolved:
await bettingPool.settleBet(betId);

// If won: USDC sent to wallet automatically
// If lost: Bet marked as settled, no payout
```

### 3.2 Author/Admin Journey

**Before Publishing Chapter:**
```javascript
// Create betting outcomes for Chapter 5
await bettingPool.createOutcome(
  OutcomeType.STORY_CHOICE,
  "Regent allies with House Valdris",
  5,  // chapterId
  1   // choiceId
);

await bettingPool.createOutcome(
  OutcomeType.STORY_CHOICE,
  "Regent allies with House Kyreth",
  5,
  2
);

// Repeat for all choices...
```

**After Publishing Chapter:**
```javascript
// AI/author decides: Choice #2 (Kyreth) was selected
await bettingPool.resolveOutcome(13, true);   // Outcome #13 happened
await bettingPool.resolveOutcome(12, false);  // Outcome #12 didn't
await bettingPool.resolveOutcome(14, false);  // Outcome #14 didn't
```

**Batch Settlement (Optional):**
```javascript
// Settle all pending bets for Chapter 5
const betIds = [1, 2, 3, 4, 5, ...]; // Get from backend
await bettingPool.settleBetBatch(betIds);
```

---

## Part 4: Economic Model

### 4.1 Fee Structure

| Item | Rate | Destination |
|------|------|-------------|
| Platform Fee | 5% of gross payout | Split 70/30 |
| Treasury Share | 3.5% (70% of fee) | Protocol treasury |
| Operational Share | 1.5% (30% of fee) | Maintenance wallet |

**Example:**
```
Bet: $100 USDC
Odds: 10.0x
Gross Payout: $1,000

Platform Fee (5%): $50
- Treasury: $35 (70%)
- Ops Wallet: $15 (30%)

Net Payout to Winner: $950
```

### 4.2 Revenue Projections

**Conservative Scenario (Year 1):**
```
Monthly Active Bettors: 1,000
Avg Bet per User: $50 USDC
Bets per Month: 5
Total Monthly Volume: $250,000

Platform Revenue (5%): $12,500/month
Annual Revenue: $150,000
```

**Growth Scenario (Year 3):**
```
Monthly Active Bettors: 10,000
Avg Bet per User: $75 USDC
Bets per Month: 8
Total Monthly Volume: $6,000,000

Platform Revenue (5%): $300,000/month
Annual Revenue: $3,600,000
```

### 4.3 Risk Management

**Contract Safety Limits:**
```solidity
uint256 public constant MAX_OUTCOMES_PER_BET = 10;      // Cap combo bets
uint256 public constant MIN_OUTCOMES_PER_BET = 2;       // Enforce combos
uint256 public maxBetAmount = 10_000 * 1e6;             // $10K max bet
```

**Why These Limits:**
- **Max 10 outcomes:** Prevents absurd 1000x+ parlays (too risky for protocol)
- **Min 2 outcomes:** Forces combos (higher fees, more engagement)
- **$10K max bet:** Prevents whale manipulation early on

---

## Part 5: Technical Implementation Details

### 5.1 Frontend Integration

**Example: Place Bet Component**
```typescript
// apps/web/src/components/betting/PlaceBetForm.tsx

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import BETTING_POOL_ABI from '@/contracts/CombinatorialBettingPool.json';

export function PlaceBetForm({ outcomes }: { outcomes: Outcome[] }) {
  const [selectedOutcomes, setSelectedOutcomes] = useState<number[]>([]);
  const [amount, setAmount] = useState('');
  
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handlePlaceBet = async () => {
    // 1. Approve USDC spending
    await writeContract({
      address: USDC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [BETTING_POOL_ADDRESS, parseUnits(amount, 6)],
    });
    
    // 2. Place bet
    await writeContract({
      address: BETTING_POOL_ADDRESS,
      abi: BETTING_POOL_ABI,
      functionName: 'placeCombiBet',
      args: [
        selectedOutcomes,
        parseUnits(amount, 6),
        0, // BetType.PARLAY
      ],
    });
  };

  return (
    <form onSubmit={handlePlaceBet}>
      {/* Outcome selection checkboxes */}
      {/* Amount input */}
      {/* Submit button */}
    </form>
  );
}
```

### 5.2 Backend Integration

**Example: Resolve Outcomes After Chapter Publish**
```typescript
// apps/api/src/services/betting.service.ts

import { ethers } from 'ethers';
import BETTING_POOL_ABI from '../contracts/CombinatorialBettingPool.json';

export class BettingService {
  private contract: ethers.Contract;

  constructor() {
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
    this.contract = new ethers.Contract(
      process.env.BETTING_POOL_ADDRESS!,
      BETTING_POOL_ABI,
      wallet
    );
  }

  async resolveChapterOutcomes(chapterId: number, winningChoiceId: number) {
    // Get all outcomes for this chapter
    const outcomes = await this.getOutcomesForChapter(chapterId);
    
    // Resolve each outcome
    for (const outcome of outcomes) {
      const occurred = outcome.choiceId === winningChoiceId;
      const tx = await this.contract.resolveOutcome(
        outcome.outcomeId,
        occurred
      );
      await tx.wait();
      console.log(`Resolved outcome ${outcome.outcomeId}: ${occurred}`);
    }
  }

  async settlePendingBets(betIds: number[]) {
    const tx = await this.contract.settleBetBatch(betIds);
    await tx.wait();
    console.log(`Settled ${betIds.length} bets`);
  }
}
```

### 5.3 Database Schema Integration

**Linking On-Chain Data to Database:**
```prisma
// packages/database/prisma/schema.prisma

model Outcome {
  id           String   @id @default(uuid())
  outcomeId    Int      @unique // From smart contract
  chapterId    String
  choiceId     Int?
  description  String
  outcomeType  String
  status       String   @default("PENDING")
  resolvedAt   DateTime?
  createdAt    DateTime @default(now())
  
  chapter      Chapter  @relation(fields: [chapterId], references: [id])
  bets         Bet[]
}

model Bet {
  id            String   @id @default(uuid())
  betId         Int      @unique // From smart contract
  userId        String
  outcomeIds    Int[]
  amount        Decimal
  combinedOdds  Decimal
  betType       String
  settled       Boolean  @default(false)
  won           Boolean?
  payout        Decimal?
  timestamp     DateTime @default(now())
  
  user          User     @relation(fields: [userId], references: [id])
}
```

---

## Part 6: Security & Auditing

### 6.1 Built-in Security Features

**OpenZeppelin Standards:**
- `ReentrancyGuard` - Prevents reentrancy attacks
- `Ownable` - Admin-only functions
- `SafeERC20` - Safe token transfers
- `Pausable` - Emergency stop mechanism (if added)

**Key Protections:**
```solidity
// Prevents reentrancy (calling function before it finishes)
function settleBet(uint256 betId) external nonReentrant { ... }

// Admin-only outcome creation
function createOutcome(...) external onlyOwner { ... }

// Safe token handling (prevents overflow/underflow)
bettingToken.safeTransferFrom(msg.sender, address(this), amount);
```

### 6.2 Emergency Functions

**Emergency Withdrawal (Owner Only):**
```solidity
function emergencyWithdraw() external onlyOwner {
    uint256 balance = bettingToken.balanceOf(address(this));
    bettingToken.safeTransfer(owner(), balance);
}
```

**Use Case:** Critical bug discovered, need to pause and refund users.

### 6.3 Audit Checklist

**Before Mainnet Launch:**
- [ ] Professional audit (Trail of Bits, ConsenSys Diligence, or OpenZeppelin)
- [ ] Testnet deployment (Base Sepolia)
- [ ] 100+ test transactions
- [ ] Gas optimization review
- [ ] Emergency response plan
- [ ] Multisig for admin functions
- [ ] Bug bounty program ($50K+)

---

## Part 7: Advanced Features (Future)

### 7.1 Automated Market Maker (AMM)

**Current:** Parimutuel (odds at resolution)  
**Future:** AMM (live trading before resolution)

```solidity
// Trade outcome tokens before chapter published
function buyOutcomeTokens(uint256 outcomeId, uint256 amount) external {
    // Bonding curve: price increases as more bought
    uint256 price = calculatePrice(outcomeId, amount);
    // ...
}

function sellOutcomeTokens(uint256 outcomeId, uint256 amount) external {
    // Sell before resolution, lock in profit/loss early
    // ...
}
```

**Benefits:**
- Price discovery before resolution
- Exit bets early
- Create liquid market for outcomes

### 7.2 Prediction Market Derivatives

**Spreads:**
```
Bet: "Valdris influence will be between 600-800"
Instead of: "Valdris wins Chapter 5"
```

**Futures:**
```
Bet: "Valdris will control 3+ chapters by Season 1 end"
Long-term, multi-chapter bets
```

### 7.3 Social Features

**Bet Copying:**
```typescript
// Follow top bettors, auto-copy their bets
function followBettor(address expert, uint256 copyPercentage) external;
```

**Leaderboards:**
```typescript
// Track best performing bettors
struct BettorStats {
    uint256 totalWagered;
    uint256 totalWon;
    uint256 winRate;
    uint256 avgOdds;
    uint256 rank;
}
```

---

## Summary

**Voidborne's Prediction Market:**

1. **What:** Combinatorial parimutuel betting on story outcomes
2. **How:** Smart contracts on Base, USDC wagering
3. **Why:** Engagement + Revenue (5% fees)
4. **Unique:** Parlays across chapters (up to 10 outcomes)
5. **Safe:** OpenZeppelin security, max bet limits
6. **Scalable:** Supports thousands of concurrent bets

**Key Numbers:**
- **Platform Fee:** 5% of gross payouts
- **Max Bet:** $10,000 USDC
- **Combo Range:** 2-10 outcomes
- **Settlement:** Automatic after all outcomes resolved
- **Gas Cost:** ~$0.01 per bet (Base L2)

**Next Steps:**
1. Deploy to Base Sepolia testnet
2. Integrate with frontend
3. Beta test with 100 users
4. Professional audit
5. Mainnet launch

---

*Last Updated: February 16, 2026*
