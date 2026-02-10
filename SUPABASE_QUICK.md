# Supabase Quick Reference

## TL;DR

```bash
# 1. Create project at https://supabase.com (2 min)
# 2. Get connection string (Transaction mode)
# 3. Run setup script:
./scripts/setup-supabase.sh
```

---

## Connection String Format

**Copy from:** Supabase Dashboard → Settings → Database → "Connection pooling" → "Transaction mode"

```
postgresql://postgres.xxxxxxxxxxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Important:**
- ✅ Use **Transaction mode** (port 6543)
- ✅ Add `?pgbouncer=true` at end
- ❌ Don't use Direct connection (port 5432) in production

---

## Quick Commands

```bash
# Generate Prisma client
cd packages/database
pnpm prisma generate

# Run migrations (create tables)
pnpm prisma migrate deploy

# Seed database (add Voidborne story)
pnpm prisma db seed

# Open Prisma Studio (GUI)
pnpm prisma studio

# Reset database (WARNING: deletes all data)
pnpm prisma migrate reset --force
```

---

## Verify Setup

### In Supabase Dashboard

1. **Table Editor** → Should see 9 tables:
   - User, Story, Chapter, Choice
   - BettingPool, Bet, ChoicePool
   - ForgeToken, Transaction

2. **Story table** → Should have 1 row:
   - Title: "VOIDBORNE: The Silent Throne"

3. **Chapter table** → Should have 1 row:
   - Title: "Succession"

### In Terminal

```bash
# Test API
cd apps/web
pnpm dev
# In another terminal:
curl http://localhost:3000/api/stories
```

**Expected:** JSON with Voidborne story data

---

## Environment Variables

### Local (.env)

```bash
DATABASE_URL="postgresql://postgres.xxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

### Vercel (Production)

1. Go to: Project → Settings → Environment Variables
2. Add: `DATABASE_URL` = (your connection string)
3. Check: Production, Preview, Development (all)
4. Click: Save
5. Redeploy

---

## Common Issues

### "Can't reach database server"
→ Check password, add `?pgbouncer=true`

### "Too many connections"
→ Use Transaction mode (port 6543), not Direct (port 5432)

### "SSL required"
→ Add `?pgbouncer=true&sslmode=require`

### Migration fails
→ `pnpm prisma migrate reset --force` then re-migrate

---

## Free Tier Limits

- 500 MB database
- 5 GB bandwidth/month
- 50K monthly active users
- Unlimited API requests
- 7 days log retention

**Good for:** MVP, testing, small production

---

## Useful Links

- **Dashboard:** https://app.supabase.com
- **Docs:** https://supabase.com/docs
- **Status:** https://status.supabase.com
- **Discord:** https://discord.supabase.com

---

## Next Steps

1. ✅ Supabase set up
2. ✅ Database migrated
3. ✅ Story seeded
4. → Deploy to Vercel: `vercel --prod`
5. → Add DATABASE_URL to Vercel
6. → Test production: `https://your-app.vercel.app`

---

**Full guide:** See `SUPABASE_SETUP.md` (detailed 5-minute walkthrough)
