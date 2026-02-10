# Deployment Guide

Complete guide for deploying NarrativeForge to production.

## Quick Deploy (Vercel + Railway)

**Fastest path to production:** ~15 minutes

### 1. Database (Railway - Free Tier)

```bash
# 1. Go to https://railway.app/
# 2. Sign in with GitHub
# 3. Click "New Project" → "Provision PostgreSQL"
# 4. Copy the "Postgres Connection URL"
# 5. Save as DATABASE_URL
```

### 2. Deploy Frontend (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd apps/web
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name? narrativeforge
# - Directory? ./
# - Override settings? No
```

### 3. Set Environment Variables (Vercel Dashboard)

```bash
# Go to: https://vercel.com/[username]/narrativeforge/settings/environment-variables

# Add these variables:
DATABASE_URL              = postgresql://... (from Railway)
BANKR_API_KEY            = your_bankr_api_key
NEXT_PUBLIC_CHAIN_ID     = 8453
NEXT_PUBLIC_APP_URL      = https://narrativeforge.vercel.app
BASE_RPC_URL             = https://mainnet.base.org
BASE_TESTNET_RPC_URL     = https://sepolia.base.org

# Optional (add later):
OPENAI_API_KEY           = sk-...
ANTHROPIC_API_KEY        = sk-ant-...
NEXT_PUBLIC_FORGE_TOKEN_ADDRESS = 0x... (after launching token)
```

### 4. Migrate Database

```bash
# In your local terminal (with DATABASE_URL from Railway):
export DATABASE_URL="postgresql://..."

cd packages/database
pnpm install
pnpm db:push
pnpm db:seed
```

### 5. Redeploy (Apply Env Vars)

```bash
cd apps/web
vercel --prod
```

### 6. Done! 🎉

Visit your site: `https://narrativeforge.vercel.app`

---

## Alternative Deployments

### Option 2: Vercel + Supabase

**Database: Supabase (Free Tier)**

```bash
# 1. Go to https://supabase.com/
# 2. Create new project
# 3. Get connection string from Settings → Database
# 4. Use "Connection Pooling" URL (for better performance)
```

**Rest same as Option 1**

### Option 3: Vercel + Neon

**Database: Neon (Free Tier)**

```bash
# 1. Go to https://neon.tech/
# 2. Create new project
# 3. Copy connection string
# 4. Use "Pooled connection" for production
```

**Rest same as Option 1**

### Option 4: Self-Hosted (VPS)

**For DigitalOcean, AWS, or any VPS:**

```bash
# 1. Set up Ubuntu 22.04 server
# 2. Install Node.js 20+
sudo apt update
sudo apt install -y nodejs npm postgresql
sudo npm install -g pnpm

# 3. Clone repo
git clone https://github.com/eli5-claw/StoryEngine.git
cd StoryEngine

# 4. Set up environment
cp .env.example .env
# Edit .env with your values

# 5. Install & build
pnpm install
pnpm build

# 6. Set up database
cd packages/database
pnpm db:push
pnpm db:seed

# 7. Run with PM2
sudo npm install -g pm2
cd ../../apps/web
pm2 start npm --name "narrativeforge" -- start
pm2 save
pm2 startup

# 8. Set up Nginx reverse proxy (port 3000 → 80)
sudo apt install nginx
# Configure nginx...
```

---

## Production Checklist

### Before Launch

- [ ] Database migrated and seeded
- [ ] Environment variables set
- [ ] Smart contracts deployed to Base
- [ ] $FORGE token launched
- [ ] BANKR_API_KEY configured
- [ ] Error tracking set up (Sentry)
- [ ] Analytics set up (Google Analytics)

### Security

- [ ] Environment variables secured
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Database connection uses SSL
- [ ] API rate limiting enabled
- [ ] CORS configured properly

### Performance

- [ ] Database indexes added
- [ ] Image optimization enabled
- [ ] CDN configured (automatic with Vercel)
- [ ] Caching strategy implemented
- [ ] Database connection pooling

### Monitoring

- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Database monitoring (Railway/Supabase dashboard)
- [ ] Analytics (Google Analytics)

---

## Environment Variables Reference

### Required

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/narrativeforge"

# Bankr
BANKR_API_KEY="your_api_key"

# Blockchain
NEXT_PUBLIC_CHAIN_ID="8453"  # Base mainnet
BASE_RPC_URL="https://mainnet.base.org"

# App
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NODE_ENV="production"
```

### Optional (Add Later)

```bash
# AI Generation
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Token Address (after launch)
NEXT_PUBLIC_FORGE_TOKEN_ADDRESS="0x..."

# Analytics
NEXT_PUBLIC_GA_ID="G-..."

# Error Tracking
SENTRY_DSN="https://..."

# Testnet (for development)
BASE_TESTNET_RPC_URL="https://sepolia.base.org"
```

---

## Database Migration Strategy

### Development → Production

**Option A: Prisma Migrate (Recommended)**

```bash
# 1. Create migration locally
cd packages/database
pnpm db:migrate

# 2. Commit migration files
git add prisma/migrations
git commit -m "feat: Add initial migration"

# 3. Deploy migration to production
DATABASE_URL="postgresql://production..." pnpm db:migrate deploy
```

**Option B: Prisma Push (Quick & Dirty)**

```bash
# Push schema directly to production
DATABASE_URL="postgresql://production..." pnpm db:push

# ⚠️ Warning: No migration history, use for rapid iteration only
```

### Seeding Production

```bash
# Only seed once (initial setup)
DATABASE_URL="postgresql://production..." pnpm db:seed

# For production, you may want a different seed:
# 1. Create seed-production.ts with minimal data
# 2. Run: DATABASE_URL="..." pnpm tsx prisma/seed-production.ts
```

---

## Scaling Considerations

### Database (When you grow)

**When to upgrade:**
- 1,000+ concurrent users
- 10,000+ bets/day
- Slow query times (>100ms)

**Options:**
- Railway Pro ($5/month) → 1GB RAM, faster CPU
- Supabase Pro ($25/month) → Dedicated CPU, backups
- Neon Scale ($69/month) → Auto-scaling, read replicas
- Self-hosted PostgreSQL → Full control

### Frontend (Automatic with Vercel)

- Automatic scaling (serverless)
- CDN caching worldwide
- Edge functions for low latency
- No server management

### Blockchain (Already Decentralized)

- Base network handles scaling
- Betting pools on-chain (immutable)
- Bankr manages wallet infrastructure

---

## Monitoring & Alerts

### Set Up Sentry (Error Tracking)

```bash
# 1. Sign up at https://sentry.io/
# 2. Create new project (Next.js)
# 3. Get DSN
# 4. Add to .env:
SENTRY_DSN="https://...@sentry.io/..."

# 5. Install Sentry
cd apps/web
pnpm add @sentry/nextjs

# 6. Initialize
pnpm sentry:init
```

### Set Up UptimeRobot (Uptime Monitoring)

```bash
# 1. Go to https://uptimerobot.com/
# 2. Add monitor:
#    - Type: HTTPS
#    - URL: https://your-domain.com/api/health
#    - Interval: 5 minutes
# 3. Set up alerts (email, Slack, Discord)
```

### Database Monitoring

- **Railway:** Built-in metrics dashboard
- **Supabase:** Database health, slow queries
- **Neon:** Query performance, connection stats

---

## Troubleshooting

### Deployment Fails

```bash
# Check build logs
vercel logs [deployment-url]

# Common issues:
# - Missing environment variables → Add in Vercel dashboard
# - Database connection fails → Check DATABASE_URL
# - TypeScript errors → Run `pnpm type-check` locally
```

### Database Connection Issues

```bash
# Test connection locally
DATABASE_URL="postgresql://..." pnpm db:studio

# Common issues:
# - SSL required → Add `?sslmode=require` to DATABASE_URL
# - Connection limit → Use connection pooling URL
# - Firewall → Whitelist Vercel IPs
```

### Runtime Errors

```bash
# Check Vercel function logs
vercel logs --follow

# Check Sentry for errors
# Visit: https://sentry.io/organizations/[org]/issues/

# Common issues:
# - API route errors → Check error logs
# - Database timeouts → Add connection pooling
# - Memory limits → Upgrade Vercel plan
```

---

## Cost Estimates

### Free Tier (Perfect for MVP)

- **Vercel:** Free (100GB bandwidth/month)
- **Railway:** Free ($5 credit/month, ~1 month)
- **Database:** Supabase/Neon free tier
- **Base Network:** Gas fees only (~$0.01/transaction)
- **Bankr:** Free tier available

**Total:** ~$5-10/month (after Railway credit)

### Production (1,000 users/day)

- **Vercel Pro:** $20/month
- **Database:** Railway Pro $20/month OR Supabase Pro $25/month
- **Base Gas:** ~$50/month (for pool resolutions)
- **AI Costs:** ~$100/month (story generation)
- **Bankr:** Pay-as-you-go

**Total:** ~$200/month

### Scale (10,000 users/day)

- **Vercel:** $40-60/month
- **Database:** $100-200/month
- **Base Gas:** ~$500/month
- **AI Costs:** ~$1,000/month

**Total:** ~$2,000/month

---

## Next Steps After Deployment

1. **Launch $FORGE token** on Base mainnet
2. **Deploy betting pool contracts** to Base
3. **Set up AI story generation** (GPT-4/Claude)
4. **Add wallet connection** (wagmi + RainbowKit)
5. **Enable real-time updates** (WebSockets)
6. **Build user dashboard**
7. **Marketing launch** 🚀

---

## Support

- **Vercel:** https://vercel.com/docs
- **Railway:** https://docs.railway.app/
- **Supabase:** https://supabase.com/docs
- **Neon:** https://neon.tech/docs
- **Bankr:** https://docs.bankr.bot/

---

**Ready to deploy? Run:**

```bash
./scripts/quick-start.sh  # Local testing first
vercel                     # Then deploy!
```

Good luck! 🚀
