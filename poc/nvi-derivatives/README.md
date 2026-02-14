# NVI Derivatives POC

**Narrative Volatility Index (NVI) Options Trading** - Proof of Concept

Trade story unpredictability with European-style options (calls, puts, spreads).

---

## 🎯 What is NVI?

**NVI (Narrative Volatility Index)** measures story unpredictability, similar to VIX for stocks.

**Formula:**
```
NVI = sqrt(
  (Σ(choice_probability^2)) * entropy_factor * ai_confidence_variance
)
```

**Components:**
1. **Betting pool distribution** - Shannon entropy of reader bets
2. **AI model variance** - Disagreement between GPT-4, Claude, Gemini
3. **Normalized to 0-100 scale**

**High NVI (70+):** Story is highly unpredictable (plot twists likely)  
**Low NVI (30-):** Story is predictable (clear outcome)

---

## 📊 Options Trading

### Call Options (Bet Volatility Increases)

```
Buy NVI CALL (Strike: 70, Premium: 5 USDC)

If NVI rises to 80:
  Profit = (80 - 70) * 5 / 100 = 0.5 USDC
  Total payout = 5 + 0.5 = 5.5 USDC (1.1x)

If NVI stays below 70:
  Loss = 5 USDC (option expires worthless)
```

### Put Options (Bet Volatility Decreases)

```
Buy NVI PUT (Strike: 70, Premium: 4 USDC)

If NVI drops to 60:
  Profit = (70 - 60) * 4 / 100 = 0.4 USDC
  Total payout = 4 + 0.4 = 4.4 USDC (1.1x)

If NVI stays above 70:
  Loss = 4 USDC (option expires worthless)
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│             NVIOptionsPool.sol (Base)               │
│  - Create options (writers provide liquidity)      │
│  - Purchase options (buyers pay premium)           │
│  - Settle options (payouts after NVI finalized)    │
└─────────────────────────────────────────────────────┘
                          ▲
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
┌───────▼─────────┐              ┌──────────▼─────────┐
│  nviCalculator  │              │   client.ts        │
│  (Backend)      │              │   (Frontend)       │
│                 │              │                    │
│  - Calculate    │              │  - Create options  │
│    NVI score    │              │  - Purchase        │
│  - AI variance  │              │  - Settle          │
│  - Entropy      │              │  - Simulate        │
└─────────────────┘              └────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Foundry (for smart contracts)
- Base Sepolia testnet ETH (for deployment)

### Installation

```bash
cd poc/nvi-derivatives

# Install dependencies
npm install

# Compile smart contract
forge build

# Run tests
forge test -vvv
```

### Deploy to Base Sepolia

```bash
# Set environment variables
export PRIVATE_KEY="your-private-key"
export BASE_SEPOLIA_RPC="https://sepolia.base.org"
export FORGE_TOKEN_ADDRESS="0x..." # $FORGE token on Base Sepolia

# Deploy
forge create --rpc-url $BASE_SEPOLIA_RPC \
  --private-key $PRIVATE_KEY \
  contracts/NVIOptionsPool.sol:NVIOptionsPool \
  --constructor-args $FORGE_TOKEN_ADDRESS

# Copy deployed address to .env
echo "NVI_OPTIONS_POOL_ADDRESS=0x..." >> .env
```

---

## 📖 Usage Examples

### 1. Calculate NVI

```typescript
import { calculateNVI, getMockAIPredictions } from './src/nviCalculator';

const chapterData = {
  chapterId: 'chapter-10',
  choices: [
    { id: 'A', text: 'Ally with House Kael' },
    { id: 'B', text: 'Form neutral coalition' },
    { id: 'C', text: 'Go rogue' },
  ],
  bettingPool: [
    { choiceId: 'A', amount: 35000 },
    { choiceId: 'B', amount: 45000 },
    { choiceId: 'C', amount: 20000 },
  ],
};

const aiPredictions = await getMockAIPredictions(chapterData);

const nviResult = await calculateNVI(chapterData, aiPredictions);

console.log('NVI Score:', nviResult.nviValue); // e.g., 73
console.log('Entropy:', nviResult.entropy);     // e.g., 1.53
console.log('AI Variance:', nviResult.aiVariance); // e.g., 0.42
```

### 2. Create an Option (Writer)

```typescript
import { NVIOptionsClient, OptionType } from './src/client';
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

const client = new NVIOptionsClient(
  process.env.NVI_OPTIONS_POOL_ADDRESS!,
  signer,
  [] // Load ABI from compiled contract
);

// Create CALL option
const tx = await client.createOption(
  100n,                                   // Chapter 100
  OptionType.CALL,                        // Call option
  7000n,                                  // Strike NVI = 70.00
  ethers.parseUnits('5', 18),             // Premium = 5 USDC
  BigInt(Math.floor(Date.now() / 1000)) + 7n * 24n * 60n * 60n  // 7 days
);

await tx.wait();
console.log('Option created! 🎉');
```

### 3. Purchase an Option (Buyer)

```typescript
// Find available options for a chapter
const optionIds = await client.getChapterOptions(100n);

// Get option details
const option = await client.getOption(optionIds[0]);
console.log(client.formatOption(option));
// "CALL Option | Strike: 70 | Premium: 5 USDC | Expires: 2/21/2026"

// Purchase option
const tx = await client.purchaseOption(optionIds[0]);
await tx.wait();
console.log('Option purchased! 💰');
```

### 4. Simulate Payout (Before Settling)

```typescript
// Simulate different NVI outcomes
const scenarios = [60, 70, 80, 90];

for (const hypotheticalNVI of scenarios) {
  const payout = await client.simulatePayout(
    1n,
    BigInt(hypotheticalNVI * 100)
  );
  
  console.log(
    `If NVI = ${hypotheticalNVI}:`,
    ethers.formatUnits(payout, 18),
    'USDC'
  );
}

/*
If NVI = 60: 0 USDC (out of money)
If NVI = 70: 0 USDC (at strike)
If NVI = 80: 5.5 USDC (in the money)
If NVI = 90: 6 USDC (deep in the money)
*/
```

### 5. Settle Option (After NVI Finalized)

```typescript
// Option owner (platform/DAO) finalizes NVI
await client.contract.finalizeNVI(100n, 8000n); // NVI = 80.00

// Option holder settles to claim payout
const settleTx = await client.settleOption(1n);
await settleTx.wait();

// Check payout
const option = await client.getOption(1n);
console.log('Payout:', ethers.formatUnits(option.payout, 18), 'USDC');
```

---

## 🧪 Testing

### Smart Contract Tests

```bash
forge test -vvv

# Specific test
forge test --match-test testCreateOption -vvv

# Gas report
forge test --gas-report
```

### TypeScript Tests

```bash
npm test
```

---

## 📊 Example Trading Strategies

### 1. Volatility Spike (Buy CALL)

```typescript
// When you expect plot twist announcement

const tx = await client.createOption(
  chapterId,
  OptionType.CALL,
  7000n,                      // Current NVI: 70
  ethers.parseUnits('5', 18), // Premium: 5 USDC
  expiry
);

// If plot twist spikes NVI to 85:
// Profit = (85 - 70) * 5 / 100 = 0.75 USDC (15% ROI)
```

### 2. Stabilization (Buy PUT)

```typescript
// After chaotic chapter, expect story to stabilize

const tx = await client.createOption(
  chapterId,
  OptionType.PUT,
  7000n,                      // Current NVI: 70
  ethers.parseUnits('4', 18), // Premium: 4 USDC
  expiry
);

// If story stabilizes to NVI 60:
// Profit = (70 - 60) * 4 / 100 = 0.4 USDC (10% ROI)
```

### 3. Bull Call Spread (Range Betting)

```typescript
// Buy call at lower strike
await client.createOption(
  chapterId,
  OptionType.CALL,
  6500n,                      // Strike: 65
  ethers.parseUnits('6', 18), // Premium: 6 USDC
  expiry
);

// Sell call at higher strike (not implemented in POC, future feature)
// Strike: 75, Premium: 3 USDC
// Net cost: 3 USDC
// Max profit: 7 USDC (if NVI lands between 65-75)
```

---

## 🎓 How NVI Works (Technical Deep Dive)

### 1. Shannon Entropy Calculation

```
Entropy = -Σ(p * log₂(p)) for all choices

Example:
Choices: [50%, 50%] → Entropy = 1.0 (maximum for 2 choices)
Choices: [90%, 10%] → Entropy = 0.47 (low, clear favorite)
```

**High entropy** = Balanced betting = High uncertainty  
**Low entropy** = Skewed betting = Low uncertainty

### 2. AI Model Variance

```
Variance = sqrt(Σ(x - mean)² / n)

Example:
GPT-4:   [60% A, 30% B, 10% C]
Claude:  [40% A, 50% B, 10% C]
Gemini:  [30% A, 40% B, 30% C]

High variance = AI models disagree = High uncertainty
```

### 3. NVI Formula

```javascript
NVI = sqrt(
  (Σ(choice_probability^2)) * entropy * ai_variance
)

// Normalized to 0-100 scale
nviScaled = min(100, round(NVI * 100))
```

### 4. Option Payout

**CALL Option:**
```
If finalNVI > strikeNVI:
  payout = premium + ((finalNVI - strikeNVI) * premium / 100)
Else:
  payout = 0 (expires worthless)
```

**PUT Option:**
```
If finalNVI < strikeNVI:
  payout = premium + ((strikeNVI - finalNVI) * premium / 100)
Else:
  payout = 0 (expires worthless)
```

**Max payout capped at 3x premium (collateral limit)**

---

## 🔒 Security Considerations

### Smart Contract Security

**Implemented:**
- ✅ ReentrancyGuard on all state-changing functions
- ✅ Input validation (strike > 0, premium > 0)
- ✅ Collateral locking (3x premium max payout)
- ✅ Transfer checks (revert on failure)
- ✅ Access control (onlyOwner for NVI finalization)

**Production Requirements:**
- 🔐 Multi-signature for NVI oracle (prevent manipulation)
- 🔐 Chainlink oracle integration (decentralized NVI calculation)
- 🔐 Emergency pause mechanism (circuit breaker)
- 🔐 Audit by CertiK or Trail of Bits
- 🔐 Bug bounty program ($50K+ rewards)

### Economic Security

**Risks:**
- Option writers could front-run NVI announcements
- Large players could manipulate betting pools to influence NVI
- Flash loan attacks on option liquidity

**Mitigations:**
- Time-locks on NVI finalization (2-hour delay)
- Maximum bet size caps (prevent single-player dominance)
- NVI calculation includes multiple data sources (not just betting pool)

---

## 📈 Revenue Model

**Platform Fees:**
- Option purchase: 2.5% of premium
- Option settlement: 0.5% of payout (future feature)
- Option creation: 1% of max collateral (future feature)

**Example Revenue (Year 1):**
```
Monthly active traders: 500
Avg trades per month: 20
Avg option premium: $50 USDC
Monthly volume: $500K

Platform fees (2.5%): $12.5K/month
Annual: $150K
```

**Scaling (Year 3):**
```
Monthly active traders: 5,000
Avg trades per month: 40
Avg option premium: $100 USDC
Monthly volume: $20M

Platform fees (2.5%): $500K/month
Annual: $6M
```

---

## 🛠️ Development Roadmap

### Phase 1: POC (Weeks 1-2) ✅

- [x] Smart contract (NVIOptionsPool.sol)
- [x] NVI calculation algorithm
- [x] TypeScript client library
- [x] Documentation

### Phase 2: Testing (Weeks 3-4)

- [ ] Unit tests (Foundry)
- [ ] Integration tests (Hardhat)
- [ ] Testnet deployment (Base Sepolia)
- [ ] Beta testing (50 users)

### Phase 3: Production (Weeks 5-8)

- [ ] Security audit (CertiK)
- [ ] Mainnet deployment (Base)
- [ ] Frontend UI (React + Next.js)
- [ ] Public launch

### Future Features

- [ ] **NVI Futures** - Lock in future volatility
- [ ] **Spreads** - Bull/bear call/put spreads
- [ ] **Straddles** - Buy both call and put
- [ ] **Greeks** - Delta, gamma, theta, vega
- [ ] **Automated market making** - Algorithmic liquidity
- [ ] **Cross-chain** - Deploy on Ethereum, Arbitrum, Optimism

---

## 🤝 Contributing

Contributions welcome! This is a POC for Innovation Cycle #45.

**How to contribute:**
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📝 License

MIT License - see [LICENSE](./LICENSE)

---

## 🙏 Acknowledgments

- **VIX (CBOE)** - Inspiration for volatility index
- **Black-Scholes** - Options pricing model
- **OpenZeppelin** - Secure contract primitives
- **Voidborne Community** - Feedback and testing

---

## 📞 Support

**Questions?**
- Discord: discord.gg/voidborne
- Twitter: @Voidborne
- GitHub Issues: github.com/voidborne/StoryEngine/issues

---

**Built with ❤️ by the Voidborne team**

**Innovation Cycle #45:** The Bloomberg Terminal for Stories 🚀
