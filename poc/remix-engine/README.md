# Remix Pool - POC Smart Contract

**Innovation:** Narrative Remix Engine  
**Cycle:** #43 (Feb 13, 2026)  
**Status:** Production-ready POC

---

## Overview

The Remix Pool enables community members to create alternate narrative chapters and bet on whether their version or the AI's canon version will be chosen.

**Key Features:**
- User-submitted story remixes (IPFS storage)
- Parimutuel betting (AI Canon vs Remixes)
- Community + AI voting (weighted decision)
- Creator fee distribution (10% of winning pool)
- Platform fee (2.5%)
- Time-locked betting/voting periods

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  RemixPool.sol                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │ Pool Manager │  │ Remix Submit │  │ Betting  │ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │    Voting    │  │  Resolution  │  │ Payouts  │ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
         │                    │                  │
         ▼                    ▼                  ▼
    IERC20              IPFS Content         Users
   (USDC/FORGE)        (via contentHash)
```

---

## Usage

### 1. Deploy Contract

```solidity
// Constructor parameters
address bettingToken = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913; // USDC on Base
address treasury = 0x...;           // Your treasury address
uint256 minBetAmount = 1e6;         // $1 USDC (6 decimals)
uint256 maxBetAmount = 10000e6;     // $10,000 USDC
uint256 aiVotingPower = 6000;       // 60% (basis points)

RemixPool pool = new RemixPool(
    bettingToken,
    treasury,
    minBetAmount,
    maxBetAmount,
    aiVotingPower
);
```

### 2. Create Pool (Owner Only)

```solidity
uint256 poolId = pool.createPool(
    chapterId: 5,
    aiChoiceId: 1,
    bettingDuration: 48 hours,
    votingDuration: 24 hours
);
// Returns poolId = 1
```

### 3. Submit Remix (Any User)

```typescript
// Frontend: Upload content to IPFS
const content = "My alternate Chapter 6 where the heir rejects the treaty..."
const ipfsHash = await uploadToIPFS(content) // "QmXyz..."

// Smart contract: Submit remix
const tx = await remixPool.submitRemix(
    poolId: 1,
    title: "The Betrayal Path",
    contentHash: ipfsHash
)
// Returns remixId = 1
```

### 4. Place Bets

```solidity
// Approve USDC first
IERC20(usdc).approve(address(remixPool), 100e6); // $100

// Bet on AI canon (remixId = 0)
remixPool.placeBet(
    poolId: 1,
    remixId: 0,
    amount: 100e6
);

// Or bet on a specific remix
remixPool.placeBet(
    poolId: 1,
    remixId: 1, // User's remix
    amount: 50e6
);
```

### 5. Vote (Community)

```solidity
// Vote for AI canon
remixPool.vote(remixId: 0);

// Vote for a remix
remixPool.vote(remixId: 1);
```

### 6. Submit AI Vote (Owner Only)

```solidity
// After analyzing story coherence, AI votes
remixPool.submitAIVote(
    poolId: 1,
    remixId: 1 // AI chooses the user's remix!
);
```

### 7. Close Betting (Owner, After Deadline)

```solidity
remixPool.closeBetting(poolId: 1);
// Pool status: OPEN → CLOSED
```

### 8. Resolve Pool (Owner, After Voting Deadline)

```solidity
remixPool.resolvePool(poolId: 1);
// Calculates winner based on AI vote (60%) + community vote (40%)
// Distributes creator fee to remix author
// Pool status: CLOSED → RESOLVED
```

### 9. Claim Winnings (Winners)

```solidity
remixPool.claimWinnings(poolId: 1);
// Calculates pro-rata payout
// Transfers USDC to winner
```

---

## Fee Structure

**Parimutuel Pool Example:**

```
Total bets: $10,000
- AI Canon: $6,000 (60%)
- Remix #1: $3,000 (30%)
- Remix #2: $1,000 (10%)

AI Canon wins:

Platform fee (2.5%): $250
Creator fee (10% of winning pool): $600
Distributable: $9,150

Winners (AI Canon bettors) share $9,150 pro-rata:
- Bet $100 → Get $152.50 (1.525x payout)
- Bet $500 → Get $762.50
- etc.

Remix #1 creator earns: $0 (didn't win)
```

**Remix Wins:**

```
Total bets: $10,000
- AI Canon: $6,000 (60%)
- Remix #1: $3,000 (30%)  ← WINNER
- Remix #2: $1,000 (10%)

Platform fee (2.5%): $250
Creator fee (10% of winning pool): $300
Distributable: $9,450

Winners (Remix #1 bettors) share $9,450 pro-rata:
- Bet $100 → Get $315 (3.15x payout)
- Bet $500 → Get $1,575
- etc.

Remix #1 creator earns: $300 (10% of $3,000)
```

---

## Security Features

### 1. ReentrancyGuard
Prevents reentrancy attacks on all external calls:
- `placeBet()`
- `claimWinnings()`
- `distributeCreatorFee()`

### 2. Pausable
Emergency stop mechanism:
- `pause()` - Owner can pause all operations
- `unpause()` - Resume operations

### 3. SafeERC20
Prevents token transfer failures:
- `safeTransferFrom()`
- `safeTransfer()`

### 4. Access Control
- `onlyOwner` for admin functions:
  - `createPool()`
  - `closeBetting()`
  - `resolvePool()`
  - `submitAIVote()`
  - `pause()/unpause()`

### 5. Time Locks
- Betting only allowed before `bettingDeadline`
- Voting only allowed between `bettingDeadline` and `votingDeadline`
- Resolution only after `votingDeadline`

### 6. Validation
- Pool exists checks
- Remix exists checks
- Status checks (OPEN/CLOSED/RESOLVED)
- Amount checks (min/max bet)
- Duplicate vote prevention

---

## Gas Optimization

**Estimated Gas Costs (Base L2):**

| Function | Gas | Cost @ 0.1 gwei |
|----------|-----|-----------------|
| `createPool()` | ~150,000 | $0.015 |
| `submitRemix()` | ~180,000 | $0.018 |
| `placeBet()` | ~120,000 | $0.012 |
| `vote()` | ~80,000 | $0.008 |
| `resolvePool()` | ~200,000 | $0.020 |
| `claimWinnings()` | ~100,000 | $0.010 |

**Total user cost (bet + vote + claim):** ~$0.03

**Optimizations applied:**
- Immutable variables where possible
- Packed structs (though Solidity auto-packs)
- Minimal storage reads (cache in memory)
- Batch operations where possible

---

## Testing

### Run Tests

```bash
cd packages/contracts

# Install dependencies
forge install

# Run tests
forge test -vvv

# Run specific test
forge test --match-test testPlaceBet -vvv

# Run with gas report
forge test --gas-report
```

### Test Coverage

**Target:** 100% coverage

**Test Cases:**
1. ✅ Pool creation
2. ✅ Remix submission
3. ✅ Betting (AI canon + remixes)
4. ✅ Voting (community)
5. ✅ AI vote submission
6. ✅ Pool resolution
7. ✅ Winner calculation
8. ✅ Payout distribution
9. ✅ Creator fee distribution
10. ✅ Edge cases (empty pool, no votes, tie)
11. ✅ Revert scenarios (invalid pool, expired deadline, etc.)
12. ✅ Access control (onlyOwner functions)
13. ✅ Pause/unpause
14. ✅ Reentrancy protection

---

## Deployment

### Testnet (Base Sepolia)

```bash
# Set environment variables
export PRIVATE_KEY=0x...
export BASE_SEPOLIA_RPC=https://sepolia.base.org
export ETHERSCAN_API_KEY=...

# Deploy
forge create --rpc-url $BASE_SEPOLIA_RPC \
  --private-key $PRIVATE_KEY \
  --constructor-args \
    "0xe0761EFa93aB7dfc4d0042476C5dEA9b7B83E132" \
    "0x..." \
    "1000000" \
    "10000000000" \
    "6000" \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  src/remix/RemixPool.sol:RemixPool
```

**Testnet Addresses:**
- USDC (Mock): `0xe0761EFa93aB7dfc4d0042476C5dEA9b7B83E132`
- Treasury: TBD

### Mainnet (Base)

```bash
# Use same command but with mainnet RPC
export BASE_MAINNET_RPC=https://mainnet.base.org

forge create --rpc-url $BASE_MAINNET_RPC \
  --private-key $PRIVATE_KEY \
  --constructor-args \
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" \
    "0x..." \
    "1000000" \
    "10000000000" \
    "6000" \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  src/remix/RemixPool.sol:RemixPool
```

**Mainnet Addresses:**
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Treasury: TBD

---

## Frontend Integration

### Setup

```bash
npm install wagmi viem @tanstack/react-query
```

### TypeScript Client

```typescript
import { useContractWrite, useContractRead } from 'wagmi'
import { parseUnits } from 'viem'

// ABI (simplified)
const REMIX_POOL_ABI = [
  {
    name: 'submitRemix',
    type: 'function',
    inputs: [
      { name: 'poolId', type: 'uint256' },
      { name: 'title', type: 'string' },
      { name: 'contentHash', type: 'string' }
    ],
    outputs: [{ name: 'remixId', type: 'uint256' }]
  },
  {
    name: 'placeBet',
    type: 'function',
    inputs: [
      { name: 'poolId', type: 'uint256' },
      { name: 'remixId', type: 'uint256' },
      { name: 'amount', type: 'uint256' }
    ]
  }
  // ... other functions
]

// Submit remix hook
function useSubmitRemix() {
  return useContractWrite({
    address: '0x...', // RemixPool address
    abi: REMIX_POOL_ABI,
    functionName: 'submitRemix'
  })
}

// Place bet hook
function usePlaceBet() {
  return useContractWrite({
    address: '0x...',
    abi: REMIX_POOL_ABI,
    functionName: 'placeBet'
  })
}

// Get pool info hook
function usePoolInfo(poolId: number) {
  return useContractRead({
    address: '0x...',
    abi: REMIX_POOL_ABI,
    functionName: 'getPool',
    args: [poolId]
  })
}

// Usage in component
function RemixBettingUI({ poolId }: { poolId: number }) {
  const { data: pool } = usePoolInfo(poolId)
  const { write: placeBet } = usePlaceBet()
  
  async function handleBet(remixId: number, amount: string) {
    const amountWei = parseUnits(amount, 6) // USDC has 6 decimals
    
    placeBet({
      args: [poolId, remixId, amountWei]
    })
  }
  
  return (
    <div>
      <h2>Pool #{poolId}</h2>
      <p>Total Bets: ${pool?.totalBets}</p>
      {/* ... betting UI */}
    </div>
  )
}
```

---

## API Integration

### Backend (Next.js API Routes)

```typescript
// app/api/remix/submit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { poolId, title, content, contentHash, creatorAddress, txHash } = await req.json()
  
  // Verify transaction on-chain
  const receipt = await publicClient.getTransactionReceipt({ hash: txHash })
  
  // Extract remixId from event logs
  const remixId = parseRemixIdFromLogs(receipt.logs)
  
  // Save to database
  const remix = await db.remix.create({
    data: {
      id: remixId.toString(),
      poolId,
      creatorAddress,
      title,
      content,
      contentHash,
      txHash,
      totalBets: 0,
      votes: 0
    }
  })
  
  return NextResponse.json({ success: true, remix })
}
```

---

## IPFS Integration

### Upload Content

```typescript
import { PinataSDK } from 'pinata'

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: 'https://voidborne.mypinata.cloud'
})

async function uploadRemixToIPFS(content: string, metadata: any) {
  // Upload content
  const file = new File([content], 'remix.txt', { type: 'text/plain' })
  const upload = await pinata.upload.file(file)
  
  // Pin with metadata
  await pinata.pin.add({
    cid: upload.IpfsHash,
    metadata: {
      name: metadata.title,
      keyvalues: {
        poolId: metadata.poolId,
        creator: metadata.creator,
        timestamp: Date.now()
      }
    }
  })
  
  return upload.IpfsHash
}

async function fetchRemixFromIPFS(contentHash: string) {
  const response = await fetch(`https://voidborne.mypinata.cloud/ipfs/${contentHash}`)
  return response.text()
}
```

---

## Production Checklist

### Pre-Launch

- [ ] Smart contract audited (Quantstamp + Trail of Bits)
- [ ] Gas optimizations applied
- [ ] Frontend integration tested (testnet)
- [ ] IPFS pinning service configured (Pinata + Infura)
- [ ] Database schema deployed (PostgreSQL)
- [ ] API routes tested
- [ ] Mobile app integrated
- [ ] Analytics tracking (Mixpanel)
- [ ] Error monitoring (Sentry)

### Launch

- [ ] Deploy to Base mainnet
- [ ] Verify on Basescan
- [ ] Fund treasury with initial USDC
- [ ] Create first pool
- [ ] Announce on Twitter/Discord
- [ ] Monitor for bugs

### Post-Launch

- [ ] Monitor gas costs
- [ ] Track user engagement
- [ ] Collect feedback
- [ ] Iterate on UX
- [ ] Plan v2 features

---

## Roadmap

### v1.0 (Current)
- ✅ Basic remix submission
- ✅ Parimutuel betting
- ✅ AI + community voting
- ✅ Creator fees
- ✅ Time-locked periods

### v1.1 (Next)
- [ ] Multi-sig AI vote (prevent centralization)
- [ ] Dispute resolution (if vote is contentious)
- [ ] Remix versioning (edit after submit)
- [ ] Collaborative remixes (multiple authors)

### v2.0 (Future)
- [ ] Remix NFTs (mint winning remixes)
- [ ] Creator marketplace (trade remix rights)
- [ ] Cross-chapter remixes (alternate entire arcs)
- [ ] DAO governance (community controls)

---

## Support

**Questions?**
- Discord: [discord.gg/voidborne]
- Twitter: [@VoidborneLive]
- Email: dev@voidborne.live

**Found a bug?**
- GitHub Issues: [github.com/voidborne/StoryEngine/issues]

**Want to contribute?**
- See CONTRIBUTING.md
- PRs welcome!

---

**License:** MIT  
**Status:** Production-ready POC  
**Audit:** Pending (Quantstamp Q2 2026)

🎭 **Voidborne Remix Pool - Empowering Creators** 🚀
