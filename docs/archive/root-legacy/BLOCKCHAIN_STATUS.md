# Blockchain Infrastructure Status

**Date:** February 10, 2026 16:15 GMT+7  
**Phase:** Blockchain Infrastructure Complete  
**Status:** ✅ Ready for Token Launch + Contract Deployment

---

## 🎉 What Was Built

### Smart Contract Deployment Infrastructure ✅

**Foundry Configuration:**
- Base mainnet RPC endpoint
- Base Sepolia testnet RPC endpoint
- Basescan verification support
- Optimized compiler settings

**Deployment Scripts:**
1. **Deploy.s.sol** - Mainnet deployment
   - Requires existing $FORGE token
   - Deploys ChapterBettingPool
   - Automatic verification
   
2. **DeployTestnet.s.sol** - Testnet deployment
   - Includes MockForgeToken (1M tokens)
   - Mints tokens to deployer
   - Deploys ChapterBettingPool
   - Complete testnet setup

**Automation Scripts:**
- `deploy-testnet.sh` - One-command testnet deploy
- `launch-forge-token.sh` - Bankr launch guide

---

### Wallet Integration (Frontend) ✅

**React Hooks:**
- `useForgeBalance()` - Real-time balance updates
- `usePlaceBet()` - Place bet with auto-approval

**Components:**
- `ConnectWallet` - Custom styled connect button
- `ForgeBalance` - Display user's FORGE balance

**Utilities:**
- Contract ABIs (BettingPool + ERC-20)
- Format/parse FORGE amounts (18 decimals)
- Contract addresses from environment
- TypeScript types for all contracts

---

### Documentation ✅

**BLOCKCHAIN_SETUP.md (12KB)**
- Complete deployment guide
- 3 methods to launch $FORGE token
- Contract deployment (testnet + mainnet)
- Wallet connection integration
- Testing checklist
- Monitoring & troubleshooting
- Cost estimates

---

## 📊 Files Created

| Category | Files | Size |
|----------|-------|------|
| Deployment Scripts (Solidity) | 2 | ~5KB |
| Automation Scripts (Bash) | 2 | ~2.5KB |
| Wallet Components | 2 | ~4.5KB |
| React Hooks | 2 | ~3KB |
| Contract Utilities | 1 | ~3.2KB |
| Documentation | 1 | ~12KB |
| **TOTAL** | **10** | **~30KB** |

---

## 🚀 How to Use

### Step 1: Launch $FORGE Token

**Option A: Via Bankr Skill (Easiest)**

In any OpenClaw chat:
```
"launch a token named NarrativeForge with symbol FORGE on base testnet with 1 billion supply"
```

**Result:** Token address (save to .env)

**Option B: Run Script**
```bash
./scripts/launch-forge-token.sh
# Follow instructions to launch via Bankr
```

---

### Step 2: Deploy Betting Pool Contract

**For Testnet (Base Sepolia):**
```bash
# Set your private key
export PRIVATE_KEY="0x..."

# Deploy (includes mock FORGE token)
./scripts/deploy-testnet.sh
```

**What this does:**
1. Checks ETH balance
2. Deploys MockForgeToken (1M FORGE)
3. Mints tokens to your wallet
4. Deploys ChapterBettingPool
5. Verifies on Basescan
6. Outputs contract addresses

**For Mainnet (Base):**
```bash
export PRIVATE_KEY="0x..."
export FORGE_TOKEN_ADDRESS="0x..."  # Real FORGE from Bankr
export BASESCAN_API_KEY="..."

cd packages/contracts
forge script script/Deploy.s.sol --rpc-url base --broadcast --verify
```

---

### Step 3: Update Environment Variables

```bash
# Add to .env (root and apps/web/.env.local)
NEXT_PUBLIC_FORGE_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_BETTING_POOL_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=84532  # Base Sepolia (or 8453 for mainnet)
```

---

### Step 4: Add Liquidity (Optional for Testnet)

**Via Bankr:**
```
"add liquidity for token 0x[FORGE_ADDRESS] on base testnet with 0.5 ETH and 100000 FORGE"
```

---

### Step 5: Test Wallet Connection

```bash
cd apps/web

# Install wagmi dependencies (if not already)
pnpm add wagmi viem @tanstack/react-query @rainbow-me/rainbowkit

# Start dev server
pnpm dev

# Visit http://localhost:3000
# Click "Connect Wallet"
# Switch to Base Sepolia network
# View your FORGE balance
```

---

### Step 6: Test Betting Flow

1. **Navigate to story page**
   - `/story/[storyId]`

2. **Connect wallet**
   - Click "Connect Wallet"
   - Approve connection

3. **Place test bet**
   - Select a choice
   - Enter amount (e.g., 10 FORGE)
   - Click "Place Bet"
   - Approve FORGE spending (if first time)
   - Confirm transaction
   - Wait for confirmation

4. **Verify**
   - Check transaction on [Base Sepolia Explorer](https://sepolia.basescan.org/)
   - Verify bet in database
   - Check balance updated

---

## 🎯 Deployment Checklist

### Testnet Launch ✅

- [ ] Get Base Sepolia ETH from [faucet](https://faucet.base.org/)
- [ ] Set PRIVATE_KEY environment variable
- [ ] Run `./scripts/deploy-testnet.sh`
- [ ] Save contract addresses to .env
- [ ] Test wallet connection
- [ ] Place first test bet
- [ ] Verify on Basescan

### Mainnet Launch ⏳

- [ ] Launch $FORGE via Bankr (mainnet)
- [ ] Add substantial liquidity (e.g., 10 ETH)
- [ ] Deploy ChapterBettingPool to Base mainnet
- [ ] Verify contracts on Basescan
- [ ] Update production environment variables
- [ ] Test on production
- [ ] Monitor first transactions

---

## 🔧 Technical Details

### Smart Contracts

**ChapterBettingPool:**
- Parimutuel betting logic
- 85/12.5/2.5 fee split
- Time-locked betting periods
- Winner calculation
- Pro-rata distribution

**MockForgeToken (Testnet Only):**
- Standard ERC-20
- 18 decimals
- Mintable for testing
- No trading fees

### Wallet Integration

**wagmi/viem stack:**
- Type-safe contract interactions
- Automatic transaction handling
- Real-time balance updates
- Chain switching
- Error handling

**RainbowKit:**
- Beautiful wallet UI
- Multiple wallet support
- Mobile-friendly
- Customizable styling

---

## 💰 Cost Estimates

### Testnet (Free)
- Token deployment: **Free** (mock token)
- Contract deployment: **Free** (faucet ETH)
- Testing: **Free**
- **Total: $0**

### Mainnet
- $FORGE launch (Bankr): **Included in Bankr fees**
- ChapterBettingPool deployment: **~$20-50** (gas)
- Initial liquidity: **Your choice** (e.g., 10 ETH)
- **Total: ~$20-50 + liquidity**

### Ongoing
- Pool resolution: **~$1-2 per resolution**
- Payout distribution: **Included**
- Monitoring: **Free** (Basescan)

---

## 📈 Next Steps

### TODAY (Immediate)

**1. Get Testnet ETH**
- Visit: https://faucet.base.org/
- Connect wallet
- Request ETH

**2. Deploy to Testnet**
```bash
export PRIVATE_KEY="0x..."
./scripts/deploy-testnet.sh
```

**3. Test Locally**
```bash
cd apps/web
pnpm dev
# Test wallet connection + betting
```

---

### THIS WEEK

**Monday (Today):**
- [x] ✅ Blockchain infrastructure built
- [x] ✅ Deployment scripts created
- [x] ✅ Wallet integration complete
- [ ] ⏳ Deploy to Base Sepolia
- [ ] ⏳ Test betting flow end-to-end

**Tuesday:**
- [ ] Launch $FORGE on testnet
- [ ] Add liquidity
- [ ] Full integration testing
- [ ] Bug fixes

**Wednesday:**
- [ ] Performance testing
- [ ] Security review
- [ ] Gas optimization
- [ ] Documentation updates

**Thursday:**
- [ ] Mainnet preparation
- [ ] Final testing
- [ ] Deploy to mainnet
- [ ] Monitor initial transactions

**Friday:**
- [ ] Marketing launch
- [ ] Community announcement
- [ ] First real bets! 🎉

---

## 🐛 Common Issues & Solutions

### Issue: "Insufficient funds for gas"
**Solution:** Get testnet ETH from https://faucet.base.org/

### Issue: "Contract deployment fails"
**Solution:** 
```bash
# Check balance
cast balance $DEPLOYER_ADDRESS --rpc-url base_sepolia

# Verify RPC endpoint
cast chain-id --rpc-url base_sepolia  # Should be 84532
```

### Issue: "Wallet won't connect"
**Solution:**
- Check if WalletConnect project ID is set
- Verify wagmi config is correct
- Clear browser cache
- Try different wallet

### Issue: "Transaction reverts"
**Common causes:**
- Insufficient FORGE balance
- Insufficient gas
- Pool already closed
- Amount below minimum bet

**Debug:**
```bash
# Check your balance
cast balance $YOUR_ADDRESS --rpc-url base_sepolia

# Check FORGE balance
cast call $FORGE_TOKEN "balanceOf(address)(uint256)" $YOUR_ADDRESS --rpc-url base_sepolia
```

---

## 📚 Resources

### Documentation
- [BLOCKCHAIN_SETUP.md](./BLOCKCHAIN_SETUP.md) - Complete guide
- [Base Docs](https://docs.base.org/)
- [Wagmi Docs](https://wagmi.sh/)
- [RainbowKit Docs](https://www.rainbowkit.com/)
- [Foundry Book](https://book.getfoundry.sh/)

### Tools
- [Base Sepolia Faucet](https://faucet.base.org/)
- [Base Sepolia Explorer](https://sepolia.basescan.org/)
- [Base Mainnet Explorer](https://basescan.org/)
- [Bankr Dashboard](https://bankr.bot/)

### Support
- Base Discord: https://discord.gg/base
- Bankr Discord: https://discord.gg/bankr
- Foundry Telegram: https://t.me/foundry_rs

---

## ✅ Success Criteria

### Testnet Complete When:
- [x] Deployment scripts created
- [x] Wallet integration built
- [x] Documentation complete
- [ ] Contracts deployed to Base Sepolia
- [ ] Wallet connection working
- [ ] First test bet placed successfully
- [ ] Transaction confirmed on-chain
- [ ] Bet recorded in database

### Mainnet Complete When:
- [ ] $FORGE token live on Base
- [ ] Betting pool contract deployed
- [ ] Substantial liquidity added
- [ ] Frontend deployed to production
- [ ] First real bet placed
- [ ] All monitoring in place
- [ ] Revenue flowing! 💰

---

## 🎉 Summary

**What's ready:**
- ✅ Complete Foundry deployment setup
- ✅ Testnet + mainnet deployment scripts
- ✅ Wallet integration (wagmi + RainbowKit)
- ✅ React hooks for blockchain interaction
- ✅ Automatic FORGE approval flow
- ✅ Transaction confirmation tracking
- ✅ Comprehensive documentation
- ✅ Automated deployment scripts

**What's next:**
1. **Get testnet ETH** (5 min) - https://faucet.base.org/
2. **Deploy to testnet** (10 min) - `./scripts/deploy-testnet.sh`
3. **Test wallet connection** (5 min) - `cd apps/web && pnpm dev`
4. **Place first bet** (5 min) - Test the full flow
5. **Launch on mainnet** (This week) - For real! 🚀

---

**Current Status:** 🟢 **Ready for testnet deployment**

**Total Development Time:** ~11 hours  
**Files Created:** 80 files, ~290KB  
**Commits:** 12 commits  
**Next:** Deploy to Base Sepolia testnet

---

**Ready to deploy?**

```bash
# 1. Get testnet ETH
# Visit: https://faucet.base.org/

# 2. Deploy contracts
export PRIVATE_KEY="0x..."
./scripts/deploy-testnet.sh

# 3. Test it!
cd apps/web && pnpm dev
```

**Let's ship this to the blockchain! 🚀**
