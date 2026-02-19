# Voidborne Optimization Cycle — Feb 18, 2026

**Branch:** `optimize/bundle-caching-ux`
**PR:** https://github.com/Eli5DeFi/StoryEngine/pull/42
**Status:** ✅ COMPLETE (awaiting manual review)

## Metrics

| Route | Before | After | Delta |
|-------|--------|-------|-------|
| /dashboard | 285 kB | 272 kB | -4.6% |
| /lore | 242 kB | 229 kB | -5.4% |
| /lore/houses-dynamic | 242 kB | 229 kB | -5.4% |
| /leaderboards | 719 kB | 720 kB* | FCP/TTI improved |
| Build result | success | success | ✅ |

*Leaderboards: lazy-loaded → skeleton shows instantly, component loads async

## Changes Made

### 1. Lazy-Load Leaderboards (UX)
- `apps/web/src/app/leaderboards/page.tsx`
- Dynamic import + skeleton loader for 562-line Leaderboards component
- Leaderboard now revalidates every 300s (was 3600s)

### 2. API In-Memory Cache
- `GET /api/stories` — 5min cache per query params
- `GET /api/lore/houses` — 5min cache
- `GET /api/lore/protocols` — 5min cache per filter combo
- `GET /api/leaderboards` — 5min cache per category/timeframe
- POST routes invalidate cache on write

### 3. Lore ISR Fetch Caching
- Changed `cache: 'no-store'` → `next: { revalidate: 300 }` in:
  - `/lore/houses-dynamic` page + slug
  - `/lore/protocols-dynamic` page + slug
- Added `export const dynamic = 'force-dynamic'` to prevent build timeout

### 4. next.config.js Improvements
- Removed duplicate `next.config.mjs` (renamed to .bak)
- AVIF-first image format
- Image cache TTL: 60s → 3600s
- Added `scrollRestoration: true`
- Added Web3 Node.js fallbacks
- Per-route HTTP cache headers
- Fixed `@wagmi` chunk group test regex

### 5. API Route Fixes
- Added `force-dynamic` to all routes using `request.url` / `nextUrl.searchParams`
- Eliminates DYNAMIC_SERVER_USAGE build warnings

## What Wasn't Changed
- Story page (729 kB) — requires larger refactor (wagmi stack is the weight)
- my-bets page (718 kB) — same reason
- ConsoleLog replacement in 34+ API routes — already handled by `removeConsole` in prod build
