# Next Actions - Quick Guide

## ✅ Completed Just Now (35 min)

### 1. Fixed RainbowKit SSR Issue ✅
- Disabled SSR in Web3Provider
- Homepage loads without errors
- **Commit:** `9084ce0`

### 2. Created E2E Testing Guide ✅
- Comprehensive 6-step checklist
- Edge case testing included
- **File:** `E2E_TESTING_GUIDE.md`

### 3. Set Up Contract Verification ✅
- Automated script created
- Basescan API key config added
- **File:** `scripts/verify-contracts.sh`

---

## 🎯 What to Do Next (Choose One)

### Option A: Test the Betting Flow (Recommended First) 🧪
**Time:** 30 min  
**Why:** Validate everything works before proceeding

**Steps:**
1. Open http://localhost:3000 in browser
2. Follow `E2E_TESTING_GUIDE.md` step-by-step:
   - Connect wallet (MetaMask + Base Sepolia)
   - Navigate to "The Last Archive" story
   - Approve USDC spending
   - Place a bet (10 USDC minimum)
   - Verify transaction on Basescan
3. Test edge cases (min/max bet, balance, etc.)

**Success Criteria:**
- ✅ Wallet connects without errors
- ✅ Bet transaction succeeds
- ✅ Visible on Basescan
- ✅ UI updates with bet

---

### Option B: Verify Contracts on Basescan 🔍
**Time:** 10 min  
**Why:** Make source code publicly visible

**Steps:**
```bash
# 1. Get API key
# Visit: https://basescan.org/myapikey

# 2. Add to .env
# Edit: packages/contracts/.env
BASESCAN_API_KEY="YOUR_KEY_HERE"

# 3. Run verification
cd /Users/eli5defi/.openclaw/workspace/StoryEngine
./scripts/verify-contracts.sh
```

**Success Criteria:**
- ✅ Mock USDC verified
- ✅ ChapterBettingPool verified
- ✅ Source code visible on explorer
- ✅ Read/Write tabs available

**View Verified:**
- Mock USDC: https://sepolia.basescan.org/address/0xe0761EFa93aB7dfc4d0042476C5dEA9b7B83E132#code
- ChapterBettingPool: https://sepolia.basescan.org/address/0xD4C57AC117670C8e1a8eDed3c05421d404488123#code

---

### Option C: Launch $FORGE Token 🚀
**Time:** 15 min  
**Why:** Enable self-sustaining revenue model

**Steps:**
```bash
cd /Users/eli5defi/.openclaw/workspace/StoryEngine
./scripts/launch-forge-token.sh
```

**Prerequisites:**
- Bankr API key configured
- Deployer wallet has ETH (~0.05 ETH)

**Success Criteria:**
- ✅ Token deployed to Base Sepolia
- ✅ LP pool created
- ✅ Trading fees active (0.3%)
- ✅ Address saved to `.env`

---

### Option D: Set Up Production Database 💾
**Time:** 30 min  
**Why:** Prepare for staging deployment

**Recommended Providers:**
- Railway (easiest)
- Supabase (generous free tier)
- Neon (serverless)

**Steps:**
1. Create PostgreSQL instance
2. Copy connection string
3. Update `.env.production`:
   ```
   DATABASE_URL="postgresql://..."
   ```
4. Run migrations:
   ```bash
   cd packages/database
   pnpm prisma migrate deploy
   pnpm prisma db seed
   ```

---

## 📊 Progress Tracker

| Step | Status | Time | Priority |
|------|--------|------|----------|
| 1. Fix SSR issue | ✅ Done | 10 min | Critical |
| 2. Testing guide | ✅ Done | 15 min | Critical |
| 3. Verification setup | ✅ Done | 10 min | High |
| 4. Test betting flow | 🔄 Ready | 30 min | **Next** |
| 5. Launch $FORGE | ⏳ Pending | 15 min | High |
| 6. Production DB | ⏳ Pending | 30 min | High |
| 7. Deploy Vercel | ⏳ Pending | 20 min | Medium |
| 8. Test staging | ⏳ Pending | 30 min | Medium |
| 9. Deploy mainnet | 🔒 Blocked | 10 min | Low |

**Completed:** 35 min / 160 min (22%)  
**Remaining:** 125 min (~2 hours)

---

## 🚨 Quick Troubleshooting

### Issue: Can't connect wallet
**Solution:** Make sure MetaMask is on Base Sepolia network
- RPC: `https://sepolia.base.org`
- Chain ID: `84532`

### Issue: No USDC balance
**Solution:** Mint test USDC on Basescan
1. Go to: https://sepolia.basescan.org/address/0xe0761EFa93aB7dfc4d0042476C5dEA9b7B83E132
2. "Write Contract" → `mint`
3. Amount: `1000000000` (1,000 USDC)

### Issue: Transaction reverted
**Solution:** Check:
- Bet between 10-10,000 USDC?
- USDC approved?
- Betting period active?
- Check revert reason on Basescan

---

## 📚 Key Documents

- **Testing:** `E2E_TESTING_GUIDE.md`
- **Status:** `IMPLEMENTATION_STATUS.md`
- **Progress:** `BUILD_PROGRESS.md`
- **Blockchain:** `BLOCKCHAIN_STATUS.md`
- **Quick Start:** `QUICK_START.md`

---

## 💡 Recommended Order

1. ✅ **Test betting flow** (`E2E_TESTING_GUIDE.md`) - 30 min
2. ✅ **Verify contracts** (`verify-contracts.sh`) - 10 min
3. ✅ **Launch $FORGE token** (`launch-forge-token.sh`) - 15 min
4. ✅ **Set up production DB** (Railway/Supabase) - 30 min
5. ✅ **Deploy to Vercel** (staging) - 20 min
6. ✅ **Test on staging** - 30 min
7. ⏳ **Deploy to mainnet** (after audit) - 10 min

**Total Time:** ~2.5 hours to production-ready

---

**Current Phase:** Testnet deployed, ready for testing  
**Next Milestone:** Full E2E test passed ✅  
**Final Goal:** Launch on Base mainnet 🚀
