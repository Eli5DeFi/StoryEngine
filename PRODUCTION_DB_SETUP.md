# Production Database Setup Guide

## Option 1: Railway (Recommended - Easiest)

**Why Railway:**
- $5/month (500 hours free per month)
- PostgreSQL 16
- Automatic backups
- Easy connection string
- No credit card for trial

### Setup Steps:

1. **Create Railway Account:**
   ```
   Visit: https://railway.app
   Sign up with GitHub
   ```

2. **Create PostgreSQL Database:**
   - Click "New Project"
   - Select "Provision PostgreSQL"
   - Railway automatically creates database

3. **Get Connection String:**
   - Click on PostgreSQL service
   - Go to "Variables" tab
   - Copy `DATABASE_URL`
   - Format: `postgresql://user:pass@host:port/dbname`

4. **Update Environment Variables:**
   ```bash
   # Create production env file
   cp .env.example .env.production
   
   # Edit .env.production
   # Replace DATABASE_URL with Railway connection string
   ```

5. **Run Migrations:**
   ```bash
   cd packages/database
   
   # Set production database URL
   export DATABASE_URL="postgresql://railway-url-here"
   
   # Run migrations
   pnpm prisma migrate deploy
   
   # Seed database
   pnpm prisma db seed
   ```

6. **Verify:**
   ```bash
   # Check tables exist
   pnpm prisma studio
   ```

**Cost:** $5/month (500 hrs free = ~20 days)

---

## Option 2: Supabase (Free Tier)

**Why Supabase:**
- Free tier (500MB database, 50K auth users)
- PostgreSQL 15
- Built-in auth & storage
- Generous limits

### Setup Steps:

1. **Create Supabase Account:**
   ```
   Visit: https://supabase.com
   Sign up with GitHub
   ```

2. **Create Project:**
   - Click "New Project"
   - Name: `voidborne`
   - Region: Choose closest to users
   - Database password: Generate strong password
   - Pricing: Free tier

3. **Get Connection String:**
   - Go to Project Settings → Database
   - Copy "Connection string" (Pooler mode recommended)
   - Replace `[YOUR-PASSWORD]` with your password

4. **Configure Connection Pooling (Important!):**
   ```
   Use: supabase-pooler.supabase.co (port 6543)
   Not: db.supabase.co (port 5432)
   ```
   Pooler mode prevents connection exhaustion.

5. **Update Environment Variables:**
   ```bash
   # .env.production
   DATABASE_URL="postgresql://postgres.xxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```

6. **Run Migrations:**
   ```bash
   cd packages/database
   export DATABASE_URL="your-supabase-url"
   pnpm prisma migrate deploy
   pnpm prisma db seed
   ```

**Cost:** Free (up to 500MB)

---

## Option 3: Neon (Serverless)

**Why Neon:**
- Generous free tier (0.5GB storage, 3GB data transfer)
- Serverless (scales to zero)
- Instant branching
- PostgreSQL 16

### Setup Steps:

1. **Create Neon Account:**
   ```
   Visit: https://neon.tech
   Sign up with GitHub
   ```

2. **Create Project:**
   - Click "Create Project"
   - Name: `voidborne`
   - Region: Choose closest
   - PostgreSQL: 16

3. **Get Connection String:**
   - Copy from project dashboard
   - Format: `postgresql://user:pass@host/dbname?sslmode=require`

4. **Update & Migrate:**
   ```bash
   export DATABASE_URL="neon-connection-string"
   cd packages/database
   pnpm prisma migrate deploy
   pnpm prisma db seed
   ```

**Cost:** Free (0.5GB storage)

---

## Which Should You Choose?

| Feature | Railway | Supabase | Neon |
|---------|---------|----------|------|
| **Free Tier** | 500 hrs/mo | 500MB | 0.5GB |
| **Ease of Setup** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **PostgreSQL** | 16 | 15 | 16 |
| **Pooling** | Manual | Built-in | Built-in |
| **Backups** | Auto | Auto | Auto |
| **Cost (paid)** | $5/mo | $25/mo | $19/mo |

**Recommendation:** 
- **Development/Testing:** Railway (easiest)
- **Production (free):** Supabase (most generous)
- **Serverless:** Neon (scales to zero)

---

## Post-Setup Checklist

After setting up production database:

- [ ] Connection string copied
- [ ] Added to `.env.production`
- [ ] Migrations ran successfully
- [ ] Database seeded with Voidborne story
- [ ] Tables visible in admin panel
- [ ] Connection works from local machine

**Verify:**
```bash
# Test connection
export DATABASE_URL="production-url"
pnpm prisma studio

# Should open browser showing tables
```

---

## Next Steps After DB Setup

1. ✅ **Deploy to Vercel**
   - Connect GitHub repo
   - Add `DATABASE_URL` to environment variables
   - Deploy staging branch

2. ✅ **Update contracts for mainnet**
   - Deploy to Base mainnet
   - Update contract addresses in frontend

3. ✅ **Launch $FORGE token**
   - Use production database
   - Real revenue flowing

---

## Troubleshooting

### Issue: "Can't reach database"
**Solution:** Check firewall rules, ensure IP whitelisted

### Issue: "SSL connection required"
**Solution:** Add `?sslmode=require` to connection string

### Issue: "Too many connections"
**Solution:** Use connection pooling (Supabase Pooler mode or pgBouncer)

### Issue: "Migrations fail"
**Solution:** 
```bash
# Reset and re-run
pnpm prisma migrate reset --force
pnpm prisma migrate deploy
```

---

**Ready to set up?** Choose your provider and follow the steps above!
