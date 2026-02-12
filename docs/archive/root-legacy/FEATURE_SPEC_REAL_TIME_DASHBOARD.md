# Feature Spec: Real-Time Betting Dashboard

## Overview
Live betting activity feed that shows what other users are betting on across all stories. Creates FOMO, social proof, and competitive dynamics.

## Core Features

### 1. Live Activity Feed
- **Recent Bets Stream** - Real-time updates of bets placed (last 50)
  - User (anonymized or username)
  - Story + chapter
  - Choice + amount
  - Odds at time of bet
  - Timestamp
- **Auto-refresh** - Updates every 10 seconds
- **Animations** - New bets slide in from top
- **Click to view** - Jump to story/pool

### 2. Community Pulse
- **Popular Stories** - Most active betting pools right now
- **Trending Choices** - Which options are getting hot
- **Big Bets Alert** - Highlight bets >$100
- **Consensus Meter** - Show when 70%+ betting on one option

### 3. Quick Stats Card
- **Platform-wide metrics:**
  - Active pools (betting open now)
  - Total wagered (last 24h)
  - Biggest win (last 7d)
  - Hottest pool (most activity)

## Technical Implementation

### API Routes

#### `GET /api/betting/recent`
Returns last N bets across platform
```typescript
{
  bets: [{
    id: string
    userId: string
    username: string | null
    storyTitle: string
    chapterNumber: number
    choiceText: string
    amount: number
    odds: number
    timestamp: Date
    poolId: string
  }]
  timestamp: Date
}
```

#### `GET /api/betting/trending`
Returns hot pools and trending choices
```typescript
{
  hotPools: [{
    poolId: string
    storyTitle: string
    chapterNumber: number
    recentBets: number  // last 1 hour
    totalPool: number
    closesAt: Date
  }]
  trendingChoices: [{
    choiceText: string
    storyTitle: string
    recentVolume: number  // last 1 hour
    totalBets: number
    momentum: number  // percentage change
  }]
}
```

### Components

#### `components/betting/RecentActivityFeed.tsx`
- Fetches `/api/betting/recent` every 10s
- AnimatePresence for smooth transitions
- Click handler to navigate to pool
- Anonymize wallet addresses (show username or short address)

#### `components/betting/CommunityPulse.tsx`
- Hot pools grid
- Trending choices list
- Big bet alerts
- Auto-refresh

#### `components/betting/PlatformStats.tsx`
- Real-time stats card
- Animated counters
- Links to analytics page

### Database Queries

**Recent bets:**
```sql
SELECT 
  b.id, b.amount, b."createdAt",
  u.username, u."walletAddress",
  s.title as "storyTitle",
  ch.number as "chapterNumber",
  c.text as "choiceText",
  bp.id as "poolId"
FROM bets b
JOIN users u ON b."userId" = u.id
JOIN choices c ON b."choiceId" = c.id
JOIN chapters ch ON c."chapterId" = ch.id
JOIN stories s ON ch."storyId" = s.id
JOIN betting_pools bp ON b."poolId" = bp.id
ORDER BY b."createdAt" DESC
LIMIT 50
```

**Hot pools (last 1h activity):**
```sql
SELECT 
  bp.id as "poolId",
  s.title as "storyTitle",
  ch.number as "chapterNumber",
  COUNT(b.id) as "recentBets",
  bp."totalPool",
  bp."closesAt"
FROM betting_pools bp
JOIN chapters ch ON bp."chapterId" = ch.id
JOIN stories s ON ch."storyId" = s.id
LEFT JOIN bets b ON bp.id = b."poolId" 
  AND b."createdAt" > NOW() - INTERVAL '1 hour'
WHERE bp.status = 'OPEN'
GROUP BY bp.id, s.title, ch.number, bp."totalPool", bp."closesAt"
HAVING COUNT(b.id) > 0
ORDER BY COUNT(b.id) DESC
LIMIT 5
```

## UI Design

### Layout
```
┌─────────────────────────────────────────────┐
│  🔥 Real-Time Betting Activity              │
├─────────────────────────────────────────────┤
│ Platform Stats Card                         │
│ [Active Pools: 12] [24h Volume: $45K]      │
│ [Biggest Win: $2.3K] [Hottest: Story X]    │
├─────────────────────────────────────────────┤
│ Live Activity Feed                          │
│ ┌─────────────────────────────────────────┐ │
│ │ 🟢 User123 bet $50 on "Choice A"        │ │
│ │    Story: "Voidborne" • Ch 3 • 2.5x     │ │
│ │    2 seconds ago                         │ │
│ ├─────────────────────────────────────────┤ │
│ │ 🟢 0x7f3a...92bc bet $25 on "Choice B"  │ │
│ │    Story: "Echoes" • Ch 1 • 3.2x        │ │
│ │    15 seconds ago                        │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ 🔥 Hot Right Now                            │
│ ┌─────────────────────────────────────────┐ │
│ │ "Voidborne" Ch 3 - 23 bets (1h)         │ │
│ │ Pool: $1,245 • Closes in 4h             │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Success Metrics
- **Engagement:** Avg time on dashboard >2min
- **Conversion:** 30%+ of dashboard visitors place bet
- **Retention:** Users check dashboard 3+ times per session
- **Social proof:** Higher conversion on "hot" pools

## Privacy Considerations
- Allow users to hide their bets (opt-out in settings)
- Default: show username if set, else short wallet address
- Never show exact wallet address in feed
- Big bets (>$100) highlighted but not linked to user

## Phase 2 Enhancements (Future)
- Bet notifications (push/email when pool closes)
- Follow users (see their bet history)
- Betting streaks (3+ wins in a row badge)
- "Whale watching" - track big bettor patterns
