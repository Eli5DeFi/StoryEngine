# Live Odds Dashboard Implementation Guide

**Feature:** Real-Time Betting Odds with Market Sentiment  
**Status:** ✅ Ready for Integration  
**Estimated Integration Time:** 2-4 hours

---

## 📦 What's Included

### 1. API Route
**File:** `apps/web/src/app/api/pools/[poolId]/odds/route.ts`

**Endpoint:** `GET /api/pools/[poolId]/odds`

**Query Parameters:**
- `timeframe` (optional): `1h` | `6h` | `12h` | `24h` | `all` (default: `24h`)
- `limit` (optional): Max snapshots to return (default: `100`)

**Response:**
```typescript
{
  pool: {
    id: string
    status: PoolStatus
    totalPool: number
    totalBets: number
    uniqueBettors: number
    opensAt: Date
    closesAt: Date
    timeRemaining: number // milliseconds
    hoursRemaining: number
    urgencyLevel: 'calm' | 'moderate' | 'high' | 'critical'
  },
  current: {
    odds: Record<choiceId, probability>, // 0-1
    timestamp: string
  },
  snapshots: Array<{
    timestamp: Date
    odds: Record<choiceId, probability>
    totalPool: number
    totalBets: number
    uniqueBettors: number
  }>,
  sentiment: {
    momentum: Record<choiceId, number>, // Change in last hour
    hotChoiceId: string, // Most active choice
    consensusStrength: number, // 0-1, how concentrated
    recentBetCount: number, // Last 15 minutes
    whaleCount: number
  },
  whales: Array<{
    id: string
    amount: number
    choiceId: string
    choiceText: string
    timestamp: Date
    user: string
  }>,
  choices: Array<{
    id: string
    text: string
    choiceNumber: number
    currentOdds: number
    totalBets: number
    isHot: boolean
  }>
}
```

### 2. Components

#### LiveOddsChart
**File:** `apps/web/src/components/betting/LiveOddsChart.tsx`

**Usage:**
```tsx
import { LiveOddsChart } from '@/components/betting/LiveOddsChart'

<LiveOddsChart
  poolId="pool_123"
  choices={choices}
  updateInterval={5000} // 5 seconds
  timeframe="24h"
  className="mt-4"
/>
```

**Features:**
- Real-time line chart (Recharts)
- Timeframe selector (1h, 6h, 12h, 24h, all)
- Live/pause toggle
- Cyberpunk scanline effect
- Hover tooltips with exact odds
- Current odds legend
- Auto-updates every 5 seconds

#### MarketSentiment
**File:** `apps/web/src/components/betting/MarketSentiment.tsx`

**Usage:**
```tsx
import { MarketSentiment } from '@/components/betting/MarketSentiment'

<MarketSentiment
  poolId="pool_123"
  updateInterval={10000}
  showWhaleAlerts={true}
  showRecentBets={true}
  showMomentum={true}
/>
```

**Features:**
- Market activity indicator (volatile/active/stable)
- Consensus strength gauge
- Momentum indicators per choice
- Whale bet alerts (>$500)
- Recent whale list
- Animated popup for new whales

#### PoolClosingTimer
**File:** `apps/web/src/components/betting/PoolClosingTimer.tsx`

**Usage:**
```tsx
import { PoolClosingTimer } from '@/components/betting/PoolClosingTimer'

<PoolClosingTimer
  closesAt={pool.closesAt}
  style="auto" // or 'calm' | 'moderate' | 'high' | 'critical'
  showIcon={true}
  compact={false}
  onUrgencyChange={(level) => console.log('Urgency:', level)}
/>
```

**Features:**
- Auto-calculated urgency levels:
  - **Calm** (>24h): Green, no pulse
  - **Moderate** (12-24h): Yellow, slow pulse
  - **High** (1-12h): Orange, medium pulse
  - **Critical** (<1h): Red, fast pulse + urgent messaging
- Compact mode for inline display
- Real-time countdown (updates every second)
- Urgency callback for external logic

---

## 🚀 Quick Integration

### Step 1: Install Dependencies

```bash
cd apps/web
pnpm add recharts framer-motion lucide-react
```

### Step 2: Add to Story Page

Edit: `apps/web/src/app/story/[storyId]/page.tsx`

```tsx
import { LiveOddsChart } from '@/components/betting/LiveOddsChart'
import { MarketSentiment } from '@/components/betting/MarketSentiment'
import { PoolClosingTimer } from '@/components/betting/PoolClosingTimer'

// Inside your story page component:
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  {/* Main Content */}
  <div className="lg:col-span-2">
    <ChapterReader chapter={currentChapter} story={story} />
    
    {/* Add Live Odds Chart */}
    {currentChapter.bettingPool && (
      <LiveOddsChart
        poolId={currentChapter.bettingPool.id}
        choices={currentChapter.choices}
        className="mt-8"
      />
    )}
  </div>

  {/* Sidebar */}
  <div className="lg:col-span-1">
    <div className="sticky top-8 space-y-4">
      {/* Pool Closing Timer */}
      {currentChapter.bettingPool && (
        <PoolClosingTimer
          closesAt={currentChapter.bettingPool.closesAt}
        />
      )}
      
      {/* Betting Interface */}
      <BettingInterface {...} />
      
      {/* Market Sentiment */}
      {currentChapter.bettingPool && (
        <MarketSentiment
          poolId={currentChapter.bettingPool.id}
        />
      )}
    </div>
  </div>
</div>
```

### Step 3: Add Cron Job for Snapshots

Create a background job to capture odds snapshots every 5 minutes:

**File:** `apps/web/src/app/api/cron/capture-odds/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@voidborne/database'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // Get all open betting pools
    const openPools = await prisma.bettingPool.findMany({
      where: {
        status: 'OPEN'
      },
      include: {
        bets: {
          include: { choice: true }
        },
        chapter: {
          include: { choices: true }
        }
      }
    })

    const snapshots = []

    for (const pool of openPools) {
      // Calculate current odds
      const totalPool = Number(pool.totalPool)
      const choiceOdds: Record<string, number> = {}

      pool.chapter.choices.forEach(choice => {
        const choiceBets = pool.bets.filter(bet => bet.choiceId === choice.id)
        const choiceTotal = choiceBets.reduce(
          (sum, bet) => sum + Number(bet.amount),
          0
        )
        choiceOdds[choice.id] = totalPool > 0 ? choiceTotal / totalPool : 0
      })

      // Create snapshot
      const snapshot = await prisma.oddsSnapshot.create({
        data: {
          poolId: pool.id,
          choiceOdds,
          totalPool: pool.totalPool,
          totalBets: pool.totalBets,
          uniqueBettors: pool.uniqueBettors
        }
      })

      snapshots.push(snapshot)
    }

    return NextResponse.json({
      success: true,
      snapshotsCaptured: snapshots.length
    })
  } catch (error) {
    console.error('Error capturing odds snapshots:', error)
    return NextResponse.json(
      { error: 'Failed to capture snapshots' },
      { status: 500 }
    )
  }
}
```

**Add to Vercel Cron:**  
`vercel.json`
```json
{
  "crons": [{
    "path": "/api/cron/capture-odds",
    "schedule": "*/5 * * * *"
  }]
}
```

Or use a manual cron service (cron-job.org, EasyCron, etc.) to hit:  
`POST https://your-domain.com/api/cron/capture-odds`

---

## 🎨 Styling & Customization

### Cyberpunk Aesthetic

All components use the "Ruins of the Future" design system:
- Neon colors (green, cyan, magenta)
- Glitch/scanline effects
- Monospace fonts for numbers
- Blur/backdrop effects
- Pulsing animations

### Customizing Colors

Edit: `apps/web/tailwind.config.ts`

```typescript
colors: {
  neon: {
    green: '#00ff41',
    blue: '#00d9ff',
    pink: '#ff00ff'
  }
}
```

Then update components:
```tsx
// In LiveOddsChart.tsx
const CHOICE_COLORS = [
  '#00ff41', // Your custom colors
  '#00d9ff',
  '#ff00ff',
  // ...
]
```

---

## 📊 Performance Optimization

### 1. Snapshot Retention

Old snapshots can bloat the database. Add cleanup job:

```typescript
// Delete snapshots older than 30 days
await prisma.oddsSnapshot.deleteMany({
  where: {
    createdAt: {
      lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }
  }
})
```

### 2. Rate Limiting

Add rate limiting to odds endpoint (Next.js middleware):

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(100, '1 m') // 100 requests per minute
})

// In API route:
const { success } = await ratelimit.limit(request.ip)
if (!success) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
```

### 3. Caching

Use React Query for client-side caching:

```tsx
import { useQuery } from '@tanstack/react-query'

const { data } = useQuery({
  queryKey: ['poolOdds', poolId, timeframe],
  queryFn: () => fetch(`/api/pools/${poolId}/odds?timeframe=${timeframe}`).then(r => r.json()),
  refetchInterval: 5000, // Auto-refetch every 5s
  staleTime: 3000 // Consider fresh for 3s
})
```

---

## 🐛 Troubleshooting

### Issue: Charts not rendering

**Solution:** Ensure `recharts` is installed and imported correctly
```bash
pnpm add recharts
```

### Issue: Snapshots not captured

**Solution:** Check cron job is running:
- Vercel: Check "Cron Jobs" tab in dashboard
- Manual: Check cron service logs

### Issue: Whale alerts not showing

**Solution:** Verify whale threshold in API route:
```typescript
const whaleThreshold = 500 // Lower this for testing
```

### Issue: Performance slow with many snapshots

**Solution:** Limit snapshots returned:
```typescript
const limit = parseInt(searchParams.get('limit') || '100') // Reduce to 50
```

---

## 📈 Analytics & Monitoring

Track engagement metrics:

```typescript
// In component useEffect
useEffect(() => {
  // Track when users view live chart
  analytics.track('Live Odds Chart Viewed', {
    poolId,
    timeframe,
    storyId
  })
}, [poolId])

// Track timeframe changes
const handleTimeframeChange = (tf: string) => {
  setSelectedTimeframe(tf)
  analytics.track('Timeframe Changed', { from: selectedTimeframe, to: tf })
}
```

**Key Metrics to Monitor:**
- % of users who view live chart
- Average time spent on chart
- Timeframe preference distribution
- Whale alert click-through rate
- Bet conversion after viewing chart

---

## 🚀 Launch Checklist

- [ ] Install dependencies (`recharts`, `framer-motion`)
- [ ] Add API route (`/api/pools/[poolId]/odds`)
- [ ] Add components to story page
- [ ] Set up cron job for snapshots (every 5 minutes)
- [ ] Test with sample data
- [ ] Add analytics tracking
- [ ] Monitor performance (page load, API latency)
- [ ] Gather user feedback

---

## 🎯 Success Metrics (30 days post-launch)

**Target:**
- Session time: +200% (users stay to watch odds)
- Betting volume: +150% (FOMO from live data)
- Return visits: +300% (addictive live updates)
- Social sharing: +400% (chart screenshots)

**Measure:**
- Google Analytics: Session duration
- Database: Bet volume before/after
- Custom events: Chart views, timeframe changes
- Social: Twitter mentions with chart images

---

## 🔮 Future Enhancements

1. **WebSocket Support** - Replace polling with real-time WebSocket updates
2. **Candlestick Charts** - Show open/high/low/close like stock trading
3. **Export Chart** - Download as PNG for sharing
4. **Bet Placement from Chart** - Click chart to place bet at specific time
5. **Historical Comparison** - Compare current pool to past similar pools
6. **Whale Following** - "Copy whale bets" feature
7. **Smart Alerts** - Push notifications when odds shift dramatically

---

**Questions?** Check `/docs/` or open an issue on GitHub.
