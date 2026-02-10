# Database Setup Options

## Option 1: Railway (Recommended - Free Tier)

**Steps:**
1. Visit: https://railway.app/
2. Sign in with GitHub
3. Click "New Project" → "Provision PostgreSQL"
4. Copy connection string
5. Update `.env` with `DATABASE_URL`

**Pros:** Free, fast, good UI, automatic backups
**Cons:** 500 hours/month limit (sufficient for development)

---

## Option 2: Supabase (Alternative)

**Steps:**
1. Visit: https://supabase.com/
2. Sign in with GitHub
3. Create new project
4. Go to Settings → Database → Connection string
5. Update `.env` with `DATABASE_URL`

**Pros:** Free forever, generous limits, built-in auth
**Cons:** Slightly slower cold starts

---

## Option 3: Neon (Serverless Postgres)

**Steps:**
1. Visit: https://neon.tech/
2. Sign in with GitHub
3. Create new project
4. Copy connection string
5. Update `.env` with `DATABASE_URL`

**Pros:** Serverless, auto-scales, free tier
**Cons:** New platform (less mature)

---

## Option 4: Local PostgreSQL

**Steps:**
```bash
# macOS (Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb narrativeforge

# Connection string
DATABASE_URL="postgresql://$(whoami)@localhost:5432/narrativeforge?schema=public"
```

**Pros:** Full control, no limits, fastest
**Cons:** Requires local setup, not production-ready

---

## Quick Start (Railway)

I'll open Railway for you. After getting the connection string:

```bash
# Update .env
DATABASE_URL="postgresql://postgres:password@host:5432/railway"

# Run migrations
cd /Users/eli5defi/.openclaw/workspace/StoryEngine/packages/database
npm install
npx prisma migrate dev --name init

# Seed example data
npx prisma db seed

# Generate Prisma client
npx prisma generate
```

