# Deploy Voidborne to Production (5 Minutes)

## Step 1: Push to GitHub ✅

Already done! Your code is at: https://github.com/eli5-claw/StoryEngine

## Step 2: Deploy to Vercel (2 minutes)

### Option A: One-Click Deploy (Recommended)

1. Go to: https://vercel.com/new
2. Click "Import Git Repository"
3. Select `eli5-claw/StoryEngine`
4. Click "Import"
5. Vercel will auto-detect Next.js
6. Click "Deploy"

**That's it!** Vercel will:
- ✅ Auto-detect Next.js framework
- ✅ Use `vercel.json` config (already configured)
- ✅ Build and deploy in ~2 minutes

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd /Users/eli5defi/.openclaw/workspace/StoryEngine
vercel --prod
```

## Step 3: Set Environment Variables (3 minutes)

After deployment, go to your Vercel project dashboard:

1. Click "Settings" → "Environment Variables"
2. Add these **required** variables:

### Required (Minimum Viable)

```bash
# Database (get from Railway/Supabase/Neon)
DATABASE_URL=postgresql://...

# WalletConnect (get from cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

### Optional (Can add later)

```bash
# Blockchain (Base mainnet)
NEXT_PUBLIC_BETTING_POOL_ADDRESS=0x... # Deploy contracts first
NEXT_PUBLIC_FORGE_TOKEN_ADDRESS=0x...  # Launch $FORGE first

# AI (for story generation)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

3. Click "Save"
4. Trigger a redeploy (Settings → Deployments → "Redeploy")

## Step 4: Set Up Production Database (5 minutes)

### Recommended: Supabase (Free tier)

**Why Supabase:**
- ✅ Free tier (500MB database, 5GB bandwidth/month)
- ✅ 5-minute setup
- ✅ GUI for browsing data
- ✅ Automatic backups
- ✅ SQL editor built-in

**Quick Setup:**

1. **Go to:** https://supabase.com → Sign up with GitHub
2. **Create project:** Name it "voidborne", generate password
3. **Get connection string:** Settings → Database → "Connection pooling" → "Transaction mode"
4. **Copy this format:**
   ```
   postgresql://postgres.xxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
5. **Add to Vercel:** Project → Settings → Environment Variables → Add `DATABASE_URL`

**Then run migrations:**
```bash
cd packages/database
pnpm prisma migrate deploy
pnpm prisma db seed
```

**Full guide:** See `SUPABASE_SETUP.md`

### Alternative Options

**Vercel Postgres ($20/month):**
- Built into Vercel dashboard
- One-click setup
- Convenient but paid

**Railway ($5/month):**
- Simple setup at https://railway.app
- Good for production

**Neon (Generous free tier):**
- Serverless Postgres at https://neon.tech
- Great performance

## Step 5: Verify Deployment ✅

1. Visit your Vercel URL (e.g., `voidborne-xxxx.vercel.app`)
2. Connect wallet (Base Sepolia testnet for now)
3. Check story loads: `/story/voidborne-story`
4. Test betting interface

## Step 6: Custom Domain (Optional)

1. Go to Vercel project → Settings → Domains
2. Add `voidborne.ai` (or your domain)
3. Follow DNS setup instructions
4. Wait 5-10 minutes for propagation

## Current Status

- ✅ Code ready (last commit: `31ab6a6`)
- ✅ Build tested locally
- ✅ TypeScript errors fixed
- ✅ Design system complete
- ✅ Contracts deployed to Base Sepolia
- ⏳ Production database (set up above)
- ⏳ Environment variables (set up above)

## What Works Right Now

**Without database:**
- ✅ Landing page
- ✅ Wallet connection
- ❌ Story reading (needs DB)
- ❌ Betting (needs DB)

**With database:**
- ✅ Full platform
- ✅ Story reading
- ✅ Betting interface
- ✅ User profiles

## Next Steps After Deploy

1. **Deploy contracts to Base mainnet** (when ready)
   ```bash
   cd packages/contracts
   ./scripts/deploy-testnet.sh # Already done for Sepolia
   # Switch to mainnet when ready
   ```

2. **Launch $FORGE token** (optional, for self-sustaining model)
   ```bash
   ./scripts/launch-forge-token.sh
   ```

3. **Verify contracts on Basescan**
   ```bash
   ./scripts/verify-contracts.sh
   ```

## Estimated Costs

- **Vercel:** Free (Hobby) or $20/month (Pro)
- **Database:** 
  - Vercel Postgres: $20/month
  - Railway: $5/month
  - Supabase: Free tier available
  - Neon: Free tier (generous)
- **Domain:** ~$12/year (voidborne.ai)

**Total:** $5-20/month + domain

## Support

- Issues: Contact eli5defi
- Repository: https://github.com/eli5-claw/StoryEngine (private)
- Docs: See README.md, MVP_DEPLOYMENT_CHECKLIST.md

---

**Ready to deploy? Start with Step 2!** 🚀
