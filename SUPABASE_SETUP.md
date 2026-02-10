# Supabase Setup for Voidborne (5 Minutes)

## Step 1: Create Supabase Project (2 minutes)

1. **Go to:** https://supabase.com
2. **Click:** "Start your project"
3. **Sign in** with GitHub (recommended)
4. **Click:** "New Project"
5. **Fill in:**
   - **Name:** `voidborne` (or any name)
   - **Database Password:** Generate strong password (save it!)
   - **Region:** Choose closest to you (e.g., `us-east-1`)
   - **Pricing:** Free tier (0$/month, 500MB database)
6. **Click:** "Create new project"
7. **Wait:** ~2 minutes for database provisioning

## Step 2: Get Connection String (1 minute)

1. **Go to:** Project Settings (gear icon) → Database
2. **Find:** "Connection string" section
3. **Select:** "Connection pooling" → "Transaction mode"
4. **Copy** the connection string, it looks like:

```
postgresql://postgres.xxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

5. **Replace** `[YOUR-PASSWORD]` with your actual database password

### Connection String Format

**For Prisma (use Transaction mode):**
```bash
DATABASE_URL="postgresql://postgres.xxxxxxxxxxxx:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Important:** Add `?pgbouncer=true` at the end for Prisma compatibility

## Step 3: Configure Environment Variables (1 minute)

### Local Development

1. **Copy** `.env.example` to `.env`:
   ```bash
   cd /Users/eli5defi/.openclaw/workspace/StoryEngine
   cp .env.example .env
   ```

2. **Edit** `.env` and add your Supabase connection string:
   ```bash
   DATABASE_URL="postgresql://postgres.xxxxxxxxxxxx:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```

### Production (Vercel)

1. **Go to:** Your Vercel project → Settings → Environment Variables
2. **Add** new variable:
   - **Key:** `DATABASE_URL`
   - **Value:** Your Supabase connection string (with `?pgbouncer=true`)
   - **Environments:** Production, Preview, Development (all checked)
3. **Click:** "Save"

## Step 4: Run Database Migrations (1 minute)

```bash
cd /Users/eli5defi/.openclaw/workspace/StoryEngine/packages/database

# Generate Prisma client
pnpm prisma generate

# Run migrations (creates tables)
pnpm prisma migrate deploy

# Seed database (adds Voidborne story)
pnpm prisma db seed
```

**Expected output:**
```
✔ Generated Prisma Client
✔ Applied 1 migration
✔ Seeded database with Voidborne story
```

## Step 5: Verify Setup (30 seconds)

### Check Tables in Supabase Dashboard

1. **Go to:** Table Editor (in left sidebar)
2. **You should see:**
   - User
   - Story
   - Chapter
   - Choice
   - BettingPool
   - Bet
   - ChoicePool
   - ForgeToken
   - Transaction

### Check Seed Data

1. **Click:** "Story" table
2. **You should see:** 1 row with title "VOIDBORNE: The Silent Throne"
3. **Click:** "Chapter" table
4. **You should see:** 1 row with title "Succession"

### Test Local API

```bash
# Start dev server
cd /Users/eli5defi/.openclaw/workspace/StoryEngine/apps/web
pnpm dev

# In another terminal, test API
curl http://localhost:3000/api/stories
```

**Expected:** JSON with Voidborne story data

## Troubleshooting

### Error: "Can't reach database server"

**Fix:** Check your connection string:
- Password is correct
- Added `?pgbouncer=true` at the end
- Using "Transaction mode" pooler (port 6543, not 5432)

### Error: "SSL connection required"

**Fix:** Add `?sslmode=require` to connection string:
```
DATABASE_URL="postgresql://...?pgbouncer=true&sslmode=require"
```

### Error: "Too many connections"

**Fix:** You're using direct connection (port 5432), switch to pooler (port 6543):
- Use "Transaction mode" connection string from Supabase dashboard

### Migration fails

**Fix:** Reset database and try again:
```bash
# Reset (WARNING: deletes all data)
pnpm prisma migrate reset --force

# Re-run migrations
pnpm prisma migrate deploy
pnpm prisma db seed
```

## Supabase Dashboard Features

### SQL Editor
- Run custom SQL queries
- Test database directly
- View query performance

### Table Editor
- Browse data (GUI)
- Edit rows manually
- Filter and search

### Database Settings
- Connection pooling (already configured)
- Extensions (PostGIS, pgvector available)
- Backups (automatic on Free tier)

## Free Tier Limits

**Supabase Free Tier:**
- ✅ 500 MB database storage
- ✅ 5 GB bandwidth/month
- ✅ 2 GB file storage
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests
- ✅ Social OAuth providers
- ✅ 7 days of log retention

**Good for:** MVP, testing, small-scale production

**Upgrade when:** You exceed limits or need:
- More storage (Pro: $25/month)
- Longer log retention
- Point-in-time recovery
- Support SLA

## Alternative: Direct Connection (Not Recommended)

If you need direct connection (not pooled):

1. **Get connection string:** Settings → Database → "Direct connection"
2. **Format:**
   ```
   postgresql://postgres:[PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
   ```
3. **Use cases:** Migrations, CLI tools, certain ORMs
4. **Don't use for:** Production apps (connection limit: 60)

**For Vercel/production:** Always use pooled connection (Transaction mode)

## Next Steps After Setup

### 1. Deploy to Vercel

```bash
vercel --prod
```

**Then add `DATABASE_URL` env var in Vercel dashboard**

### 2. Test Production

1. Visit your Vercel URL
2. Go to `/story/voidborne-story`
3. Should load Voidborne story from Supabase

### 3. Monitor Usage

- Supabase Dashboard → Reports
- Check database size, API requests, bandwidth
- Free tier alerts you when approaching limits

## Security Best Practices

### ✅ Do:
- Use connection pooling (Transaction mode)
- Use environment variables for credentials
- Enable Row Level Security (RLS) in Supabase (optional)
- Rotate database password periodically

### ❌ Don't:
- Commit `.env` to Git (already in `.gitignore`)
- Use direct connection in production
- Share connection strings publicly
- Use same password for multiple projects

## Support

- **Supabase Docs:** https://supabase.com/docs
- **Supabase Discord:** https://discord.supabase.com
- **Prisma + Supabase:** https://supabase.com/docs/guides/integrations/prisma

---

**Estimated Time:** 5 minutes  
**Cost:** Free (up to 500MB)  
**Status:** ✅ Production-ready

**Ready to set up?** → https://supabase.com
