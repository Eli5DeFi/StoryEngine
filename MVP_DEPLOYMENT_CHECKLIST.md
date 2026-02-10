# MVP Deployment Checklist

**Target:** Get Voidborne MVP live on production  
**Estimated Time:** 1 hour (with credentials ready)  
**Last Updated:** Feb 10, 2026 23:10 WIB

---

## ✅ Pre-Deployment (Completed)

- [x] Codebase ready
- [x] All tests passing (10/10 contracts)
- [x] SKILL.md created for agent integration
- [x] Production configs created
- [x] Vercel config optimized
- [x] Database schema finalized
- [x] Smart contracts tested
- [x] Frontend built successfully
- [x] Documentation complete

---

## 🚀 Deployment Steps

### Phase 1: Database Setup (10 min)

**Choose ONE provider:**

#### Option A: Railway (Recommended)
```bash
# 1. Sign up: https://railway.app (GitHub OAuth)
# 2. New Project → Provision PostgreSQL
# 3. Copy DATABASE_URL from Variables tab
# 4. Add to .env.production

DATABASE_URL="postgresql://postgres:password@postgres.railway.internal:5432/railway"
```

#### Option B: Supabase (Free)
```bash
# 1. Sign up: https://supabase.com
# 2. Create new project (choose region)
# 3. Project Settings → Database → Connection string (Pooler)
# 4. Add to .env.production

DATABASE_URL="postgresql://postgres.xxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

#### Option C: Neon (Serverless)
```bash
# 1. Sign up: https://neon.tech
# 2. Create project
# 3. Copy connection string from dashboard
# 4. Add to .env.production

DATABASE_URL="postgresql://user:pass@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

**Then run migrations:**
```bash
cd packages/database
export DATABASE_URL="your-database-url"
pnpm prisma migrate deploy
pnpm prisma db seed
```

**Verify:**
```bash
pnpm prisma studio
# Should show tables with Voidborne story
```

**Status:** ⬜ Not started / 🔄 In progress / ✅ Complete

---

### Phase 2: Deploy Frontend to Vercel (15 min)

**Prerequisites:**
- Vercel account (free): https://vercel.com
- GitHub repo connected

**Steps:**

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Login:**
```bash
vercel login
```

3. **Link project:**
```bash
cd /Users/eli5defi/.openclaw/workspace/StoryEngine
vercel link
# Choose: Link to existing project or create new
```

4. **Add environment variables:**
```bash
# Required variables
vercel env add DATABASE_URL production
vercel env add NEXT_PUBLIC_CHAIN_ID production
vercel env add NEXT_PUBLIC_USDC_ADDRESS production
vercel env add NEXT_PUBLIC_BETTING_POOL_ADDRESS production

# Optional but recommended
vercel env add OPENAI_API_KEY production
vercel env add ANTHROPIC_API_KEY production
```

**Or via Vercel Dashboard:**
- Go to project settings
- Environment Variables tab
- Add all variables from `.env.production.example`

5. **Deploy:**
```bash
vercel --prod
```

6. **Verify deployment:**
- Visit deployed URL
- Check homepage loads
- Test story page
- Verify wallet connection

**Expected URL:** `https://voidborne.vercel.app` or custom domain

**Status:** ⬜ Not started / 🔄 In progress / ✅ Complete

---

### Phase 3: Deploy Contracts to Base Mainnet (15 min)

**Prerequisites:**
- Deployer wallet with ETH on Base (~0.1 ETH for gas)
- Private key ready

**Steps:**

1. **Update .env in packages/contracts:**
```bash
cd packages/contracts
cp .env .env.backup

# Edit .env
PRIVATE_KEY="0xYOUR_PRIVATE_KEY"
BASE_RPC_URL="https://mainnet.base.org"
```

2. **Dry run (test):**
```bash
forge script script/Deploy.s.sol \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY \
  --verify \
  --dry-run
```

3. **Deploy for real:**
```bash
forge script script/Deploy.s.sol \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

4. **Save contract addresses:**
```bash
# From deployment output, copy:
# ChapterBettingPool: 0x...
# Add to .env.production and Vercel
```

5. **Verify on Basescan:**
```bash
# Get API key: https://basescan.org/myapikey
export BASESCAN_API_KEY="your-key"
./scripts/verify-contracts.sh
```

**Status:** ⬜ Not started / 🔄 In progress / ✅ Complete

---

### Phase 4: Update Frontend with Mainnet Addresses (5 min)

**Update Vercel environment variables:**

```bash
# Update contract address
vercel env rm NEXT_PUBLIC_BETTING_POOL_ADDRESS production
vercel env add NEXT_PUBLIC_BETTING_POOL_ADDRESS production
# Paste: 0xYOUR_DEPLOYED_ADDRESS

# Trigger redeploy
vercel --prod
```

**Or via Dashboard:**
- Project Settings → Environment Variables
- Update `NEXT_PUBLIC_BETTING_POOL_ADDRESS`
- Redeploy from Deployments tab

**Verify:**
- Visit production URL
- Check wallet connects to Base mainnet
- Test betting interface (DON'T place real bet yet)

**Status:** ⬜ Not started / 🔄 In progress / ✅ Complete

---

### Phase 5: Final Testing (15 min)

**Test checklist:**

- [ ] Homepage loads correctly
- [ ] Story page displays
- [ ] Chapter content readable
- [ ] 3 choices visible
- [ ] Betting pool shows correct data
- [ ] Wallet connects (MetaMask)
- [ ] USDC balance displays
- [ ] Approve USDC transaction works
- [ ] Place bet transaction works
- [ ] Bet visible on Basescan
- [ ] Bet recorded in database

**Test with small amounts first (10 USDC)!**

**If any issues:**
1. Check Vercel deployment logs
2. Check browser console
3. Check Basescan for tx errors
4. Verify environment variables

**Status:** ⬜ Not started / 🔄 In progress / ✅ Complete

---

### Phase 6: Launch $FORGE Token (Optional, 10 min)

**Prerequisites:**
- Bankr API key: https://bankr.bot
- Bankr skill installed (already done)

**Steps:**

```bash
cd /Users/eli5defi/.openclaw/workspace/StoryEngine

# Add Bankr key to .env
echo 'BANKR_API_KEY="your-key"' >> .env.production

# Launch token
./scripts/launch-forge-token.sh
```

**Token will:**
- Deploy on Base
- Create LP pool
- Enable 0.3% trading fees
- Fund platform treasury

**Status:** ⬜ Not started / 🔄 In progress / ✅ Complete

---

## 📋 Post-Launch Tasks

### Immediate (Within 1 hour)

- [ ] Monitor deployment logs
- [ ] Check error rates
- [ ] Test all core flows
- [ ] Verify transactions on-chain
- [ ] Set up monitoring/alerts

### Day 1

- [ ] Announce launch on Twitter
- [ ] Post to Discord/Telegram
- [ ] Submit to Product Hunt
- [ ] Monitor user feedback
- [ ] Fix critical bugs

### Week 1

- [ ] Set up analytics (Google Analytics/Mixpanel)
- [ ] Implement error tracking (Sentry)
- [ ] Add user feedback mechanism
- [ ] Monitor contract gas usage
- [ ] Optimize based on usage

---

## 🔧 Troubleshooting

### Issue: Database connection fails

**Solution:**
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check firewall rules
# For Railway: whitelist Vercel IPs
# For Supabase: use Pooler mode
# For Neon: ensure SSL mode enabled
```

### Issue: Vercel build fails

**Solution:**
```bash
# Check build logs
vercel logs

# Test build locally
cd apps/web
pnpm build

# Common fixes:
# - Clear node_modules: rm -rf node_modules && pnpm install
# - Clear .next: rm -rf .next
# - Check environment variables
```

### Issue: Contract deployment fails

**Solution:**
```bash
# Check wallet balance
cast balance $DEPLOYER_ADDRESS --rpc-url $BASE_RPC_URL

# Estimate gas
forge script script/Deploy.s.sol --rpc-url $BASE_RPC_URL --estimate-gas

# Check RPC endpoint
curl -X POST $BASE_RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Issue: Frontend can't connect to contracts

**Solution:**
```bash
# Verify contract address in environment
echo $NEXT_PUBLIC_BETTING_POOL_ADDRESS

# Check ABI is correct
# Verify network ID matches (8453 for Base)

# Test contract call
cast call $NEXT_PUBLIC_BETTING_POOL_ADDRESS \
  "getPoolState(uint256,uint256)(uint256,uint256[3],uint256,bool,bool,uint8)" \
  1 1 \
  --rpc-url $BASE_RPC_URL
```

---

## 🎯 Success Criteria

**MVP is live when:**

✅ Homepage loads on production domain  
✅ Story reads smoothly  
✅ Betting interface functional  
✅ Users can connect wallets  
✅ USDC bets work end-to-end  
✅ Transactions visible on Basescan  
✅ Database records all activity  
✅ No critical errors in logs  

**Bonus (nice to have):**

✅ Custom domain configured  
✅ $FORGE token launched  
✅ Analytics tracking  
✅ Error monitoring  
✅ Social media presence  

---

## 📊 Deployment Progress

**Estimated Timeline:**

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 1 | Database setup | 10 min | ⬜ |
| 2 | Vercel deployment | 15 min | ⬜ |
| 3 | Contract deployment | 15 min | ⬜ |
| 4 | Update addresses | 5 min | ⬜ |
| 5 | Final testing | 15 min | ⬜ |
| 6 | Token launch | 10 min | ⬜ |
| **Total** | **End-to-end** | **70 min** | **0%** |

---

## 🚀 Quick Start (TL;DR)

**Fastest path to production:**

```bash
# 1. Set up database (choose provider, get URL)
export DATABASE_URL="postgresql://..."

# 2. Run migrations
cd packages/contracts
pnpm prisma migrate deploy
pnpm prisma db seed

# 3. Deploy to Vercel
cd ../..
vercel --prod
# Add environment variables when prompted

# 4. Deploy contracts
cd packages/contracts
forge script script/Deploy.s.sol --rpc-url $BASE_RPC_URL --broadcast

# 5. Update contract address in Vercel
vercel env add NEXT_PUBLIC_BETTING_POOL_ADDRESS production
vercel --prod

# 6. Test!
open https://voidborne.vercel.app
```

---

**Ready to deploy?** Start with Phase 1 (Database Setup) above!

**Need help?** Check SKILL.md for API docs or PRODUCTION_DB_SETUP.md for database guides.

**Last Updated:** Feb 10, 2026 23:10 WIB  
**Status:** Ready for deployment 🚀
