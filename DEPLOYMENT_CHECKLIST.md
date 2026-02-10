# NarrativeForge Deployment Checklist

**Date:** Feb 10, 2026  
**Status:** In Progress (Step 1 Complete, Steps 2-3 In Progress)

---

## ✅ Step 1: Frontend Integration (COMPLETE)

### Components Updated:
- [x] `USDCBalance.tsx` - Show USDC balance (replaces ForgeBalance)
- [x] `ConnectWallet.tsx` - Integrated USDC balance display
- [x] `BettingInterface.tsx` - Complete USDC betting flow
- [x] `Hero.tsx`, `HowItWorks.tsx`, `FeaturedStories.tsx` - New design
- [x] `Navbar.tsx`, `Footer.tsx` - Responsive navigation

### Hooks Created:
- [x] `useUSDCBalance.ts` - Read USDC balance (6 decimals)
- [x] `usePlaceBet.ts` - Handle USDC approval + betting

### Contract Utils:
- [x] `contracts.ts` - USDC address, formatUSDC/parseUSDC helpers
- [x] `BETTING_POOL_ABI` - Updated with actual contract functions
- [x] Pool state enum, odds formatting

### Features:
- [x] ERC20 approval before betting
- [x] Real-time balance checks
- [x] Min/max bet validation
- [x] Potential payout calculator
- [x] Error handling with UI feedback
- [x] Loading states (approving vs placing)

### Design System:
- [x] "Ruins of the Future" aesthetic
- [x] Gold primary (#d4a853), drift accents (teal/purple)
- [x] Glassmorphism cards
- [x] Starfield backgrounds
- [x] Cinzel/Space Grotesk/Rajdhani fonts
- [x] Ambient animations

**Commit:** ad106eb  
**Files Changed:** 6  
**Lines:** +476, -240

---

## 🔄 Step 2: Testnet Deployment (IN PROGRESS)

### Wallet Setup:
- [x] Generate deployment wallet
  - Address: `0x52125f5418ff2a5dec156Af70441dF2C9a9BcfBB`
  - Private key: Securely stored in `.env`
- [x] Update `.env` with deployment config
- [ ] Get Base Sepolia testnet ETH (WAITING)
  - Faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
  - Amount needed: ~0.1 ETH
  - Current balance: 0 ETH

### Contracts to Deploy:
- [ ] MockUSDC.sol (ERC20, 6 decimals)
- [ ] ChapterBettingPool.sol (Story #1, Chapter #1)

### Deployment Command:
```bash
cd packages/contracts
source ../../.env
forge script script/DeployTestnet.s.sol:DeployTestnetScript \
  --rpc-url $BASE_TESTNET_RPC_URL \
  --broadcast \
  --verify
```

### Post-Deployment:
- [ ] Copy deployed addresses to `.env`:
  - `NEXT_PUBLIC_USDC_ADDRESS`
  - `NEXT_PUBLIC_BETTING_POOL_ADDRESS`
- [ ] Verify contracts on Basescan Sepolia
- [ ] Test betting flow end-to-end

**Status:** Waiting for testnet ETH

---

## 🔄 Step 3: Database Setup (IN PROGRESS)

### Option Selected: Local PostgreSQL

**Installation:**
- [x] Check Homebrew availability
- [ ] Install PostgreSQL@15 (in progress)
- [ ] Start PostgreSQL service
- [ ] Create `narrativeforge` database

### Once Installed:
```bash
# Start PostgreSQL
brew services start postgresql@15

# Create database
createdb narrativeforge

# Update .env
DATABASE_URL="postgresql://$(whoami)@localhost:5432/narrativeforge?schema=public"

# Install dependencies
cd packages/database
npm install

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed example data
npx prisma db seed
```

### Database Schema (9 Models):
- [x] User - Wallet authentication, profile, stats
- [x] Story - AI-generated stories with metadata
- [x] Chapter - Story chapters with content
- [x] Choice - Branch options for betting
- [x] BettingPool - Parimutuel pools with USDC
- [x] Bet - User bets on choices
- [x] AIGeneration - AI model usage tracking
- [x] Analytics - Daily metrics

**Status:** PostgreSQL installing (~2 min remaining)

---

## 📋 Next Steps (After Steps 2-3 Complete)

### 1. Test Betting Flow:
```bash
# Start dev server
cd apps/web
npm run dev

# Open: http://localhost:3000
# Connect wallet (use deployer address)
# Try betting on a story
```

### 2. Verify All Components:
- [ ] Landing page loads
- [ ] Wallet connects (Base Sepolia)
- [ ] USDC balance displays
- [ ] Can approve USDC
- [ ] Can place bet
- [ ] Transaction confirms
- [ ] Bet recorded in database

### 3. Deploy $FORGE Token (Bankr):
```bash
# Launch $FORGE via Bankr
npm run launch-forge-token

# Update .env
NEXT_PUBLIC_FORGE_TOKEN_ADDRESS="<deployed-address>"
```

### 4. Deploy to Production (Vercel):
```bash
# Push to GitHub
git push origin main

# Connect Vercel
# - Import repository
# - Add environment variables from .env
# - Deploy

# Update for mainnet:
NEXT_PUBLIC_CHAIN_ID="8453"
NEXT_PUBLIC_USDC_ADDRESS="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
```

---

## 🔐 Security Checklist

- [x] `.env` in `.gitignore`
- [x] Private key never committed
- [x] Testnet-only for now
- [ ] Multi-sig for mainnet treasury
- [ ] Contract audit before mainnet
- [ ] Rate limiting on API routes
- [ ] Input validation (SQL injection prevention)

---

## 📊 Progress Summary

| Step | Status | Time Spent | Remaining |
|------|--------|------------|-----------|
| 1. Frontend Integration | ✅ Complete | 1.5 hours | - |
| 2. Testnet Deployment | 🔄 50% | 15 min | 15 min |
| 3. Database Setup | 🔄 30% | 10 min | 20 min |
| **TOTAL** | **60% Done** | **1h 55min** | **35 min** |

---

## 🎯 Definition of Done

**Testnet Demo is complete when:**
1. ✅ All components use new design system
2. ✅ USDC integration complete (approval + betting)
3. ⏳ Contracts deployed to Base Sepolia
4. ⏳ Database running with migrations
5. ⏳ Can connect wallet (Base Sepolia)
6. ⏳ Can approve USDC spending
7. ⏳ Can place bet successfully
8. ⏳ Bet appears in database
9. ⏳ Can view betting pool stats

**Then ready for:**
- $FORGE token launch (Bankr)
- Mainnet deployment (Base)
- Production hosting (Vercel)

---

**Current Blockers:**
1. ⏳ Base Sepolia testnet ETH (user action required)
2. 🔄 PostgreSQL installation (2 min remaining)

**ETA to Working Demo:** ~40 minutes (after testnet ETH arrives)

_Last updated: Feb 10, 2026 17:00 WIB_
