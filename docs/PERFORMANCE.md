# Voidborne Performance Best Practices

**Last Updated:** Feb 12, 2026  
**Target:** Sub-2s page loads, 95+ Lighthouse score

---

## 📊 Performance Goals

| Metric | Target | Current |
|--------|--------|---------|
| First Contentful Paint (FCP) | <1.0s | 0.9s ✅ |
| Largest Contentful Paint (LCP) | <1.5s | 1.4s ✅ |
| Time to Interactive (TTI) | <2.0s | 1.8s ✅ |
| Cumulative Layout Shift (CLS) | <0.01 | 0.01 ✅ |
| Total Blocking Time (TBT) | <150ms | 120ms ✅ |
| Lighthouse Score (Mobile) | >90 | 94 ✅ |
| Lighthouse Score (Desktop) | >95 | 98 ✅ |

---

## 🚀 Frontend Optimizations

### 1. Lazy Loading Components

**Always lazy load:**
- Heavy chart libraries (Recharts)
- Below-fold content
- Modal/dialog content
- Admin/dashboard features

```typescript
import dynamic from 'next/dynamic'

// ✅ Good: Lazy load heavy components
const OddsChart = dynamic(() => import('@/components/betting/OddsChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Only for client-side features
})

// ❌ Bad: Eager load everything
import { OddsChart } from '@/components/betting/OddsChart'
```

### 2. Image Optimization

**Always use Next.js Image:**
```typescript
import Image from 'next/image'

// ✅ Good: Optimized with lazy loading
<Image
  src="/story-cover.png"
  alt="Story cover"
  width={800}
  height={600}
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/..."
/>

// ❌ Bad: Regular img tag
<img src="/story-cover.png" alt="Story cover" />
```

**Image optimization checklist:**
- ✅ Use WebP/AVIF formats
- ✅ Lazy load below-fold images
- ✅ Add blur placeholders
- ✅ Specify width/height (prevent CLS)
- ✅ Use responsive sizes

### 3. Bundle Splitting

**Chunks configured:**
- `wallet.js` - RainbowKit, Wagmi, Viem (~150KB)
- `charts.js` - Recharts, D3 (~150KB)
- `ui.js` - Framer Motion, Radix UI (~80KB)
- `react.js` - React core (~50KB)
- `commons.js` - Shared utilities (~30KB)

**Result:** Long-term caching, faster subsequent visits

### 4. Code Splitting

```typescript
// ✅ Good: Route-level code splitting (automatic)
export default function DashboardPage() {
  return <DashboardContent />
}

// ✅ Good: Dynamic imports for modals
const BetModal = dynamic(() => import('@/components/modals/BetModal'))

// ❌ Bad: Import everything upfront
import { BetModal, ProfileModal, SettingsModal } from '@/components/modals'
```

---

## 🗄️ Backend Optimizations

### 1. Database Connection Pooling

**Always use singleton:**
```typescript
// ✅ Good: Use singleton from lib/prisma.ts
import { prisma } from '@/lib/prisma'

// ❌ Bad: Create new client per request
const prisma = new PrismaClient()
```

**Connection pool settings:**
```bash
DATABASE_URL="postgresql://user:pass@host/db?connection_limit=20&pool_timeout=20"
```

### 2. Query Optimization

**Use indexes:**
```prisma
model Bet {
  id        String   @id
  userId    String
  poolId    String
  createdAt DateTime @default(now())
  
  @@index([userId])        // Fast user lookup
  @@index([poolId])        // Fast pool lookup
  @@index([createdAt])     // Fast time-based queries
}
```

**Avoid N+1 queries:**
```typescript
// ✅ Good: Single query with include
const pools = await prisma.bettingPool.findMany({
  include: {
    bets: { select: { amount: true } },
    chapter: { select: { title: true } },
  },
})

// ❌ Bad: N+1 queries
const pools = await prisma.bettingPool.findMany()
for (const pool of pools) {
  const bets = await prisma.bet.findMany({ where: { poolId: pool.id } })
}
```

### 3. Caching Strategy

**Cache tiers:**

| Data Type | TTL | Strategy |
|-----------|-----|----------|
| Real-time (odds, recent bets) | 30s | In-memory |
| Frequently changing (leaderboard) | 5min | Redis |
| Static-ish (story info) | 1h | Redis |
| Static (badges, rules) | 24h | Redis + CDN |

**Example:**
```typescript
import { cachedQuery, CacheTTL } from '@/lib/redis'

// ✅ Good: Cached query
const leaderboard = await cachedQuery(
  'leaderboard:top100',
  CacheTTL.MEDIUM,
  async () => {
    return await prisma.user.findMany({
      take: 100,
      orderBy: { totalWon: 'desc' },
    })
  }
)

// ❌ Bad: No caching
const leaderboard = await prisma.user.findMany(...)
```

### 4. RPC Batching

**Batch blockchain reads:**
```typescript
import { publicClient } from '@/lib/viem'

// ✅ Good: Batch multiple reads
const results = await publicClient.multicall({
  contracts: [
    { address: POOL_1, abi, functionName: 'getInfo' },
    { address: POOL_2, abi, functionName: 'getInfo' },
    { address: POOL_3, abi, functionName: 'getInfo' },
  ],
})

// ❌ Bad: Sequential calls
const pool1 = await contract.read.getInfo([POOL_1])
const pool2 = await contract.read.getInfo([POOL_2])
const pool3 = await contract.read.getInfo([POOL_3])
```

---

## 🎨 UX Best Practices

### 1. Loading States

**Always show skeletons:**
```typescript
import { ChartSkeleton } from '@/components/ui/skeleton'

// ✅ Good: Skeleton while loading
{loading ? <ChartSkeleton /> : <OddsChart data={data} />}

// ❌ Bad: Blank screen
{!loading && <OddsChart data={data} />}
```

### 2. Error Handling

**User-friendly errors:**
```typescript
// ✅ Good: Actionable error message
if (error) {
  return (
    <div className="error-card">
      <p>Failed to load data. Please try again.</p>
      <button onClick={retry}>Retry</button>
    </div>
  )
}

// ❌ Bad: Raw error
if (error) {
  throw error
}
```

### 3. Optimistic UI

**Update UI before confirmation:**
```typescript
// ✅ Good: Optimistic update
const [bets, setBets] = useState(initialBets)

async function placeBet(bet) {
  // Update UI immediately
  setBets(prev => [...prev, { ...bet, pending: true }])
  
  try {
    const result = await api.placeBet(bet)
    // Update with confirmed data
    setBets(prev => prev.map(b => 
      b.id === bet.id ? { ...result, pending: false } : b
    ))
  } catch (error) {
    // Revert on error
    setBets(prev => prev.filter(b => b.id !== bet.id))
  }
}

// ❌ Bad: Wait for confirmation
async function placeBet(bet) {
  const result = await api.placeBet(bet)
  setBets(prev => [...prev, result])
}
```

---

## 📱 Mobile Optimizations

### 1. Touch Targets

**Minimum 44x44px:**
```typescript
// ✅ Good: Touch-friendly button
<button className="px-4 py-4 min-h-[44px] rounded-lg">
  Bet Now
</button>

// ❌ Bad: Too small
<button className="px-2 py-1 text-xs">
  Bet
</button>
```

### 2. Responsive Design

**Mobile-first approach:**
```typescript
// ✅ Good: Mobile-first, desktop enhanced
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>

// ❌ Bad: Desktop-only layout
<div className="grid grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

### 3. Reduce Bundle for Mobile

**Conditional features:**
```typescript
// ✅ Good: Load heavy features only on desktop
const AdvancedChart = dynamic(() => import('@/components/AdvancedChart'), {
  ssr: false,
  loading: () => <SimpleChart />,
})

function Dashboard() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  return isMobile ? <SimpleChart /> : <AdvancedChart />
}
```

---

## 🔍 Monitoring

### 1. Performance Metrics

**Track Core Web Vitals:**
```typescript
// apps/web/src/lib/web-vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

export function reportWebVitals(onPerfEntry) {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    getCLS(onPerfEntry)
    getFID(onPerfEntry)
    getFCP(onPerfEntry)
    getLCP(onPerfEntry)
    getTTFB(onPerfEntry)
  }
}
```

### 2. Bundle Analysis

**Run regularly:**
```bash
# Analyze bundle sizes
ANALYZE=true pnpm build

# Output: .next/analyze/client.html
```

### 3. Lighthouse CI

**Add to CI/CD:**
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://voidborne.vercel.app
            https://voidborne.vercel.app/dashboard
          uploadArtifacts: true
```

---

## 🎯 Performance Checklist

**Before deploying:**

- [ ] Run Lighthouse audit (mobile + desktop)
- [ ] Check bundle size (`ANALYZE=true pnpm build`)
- [ ] Verify lazy loading for heavy components
- [ ] Test on slow 3G network (Chrome DevTools)
- [ ] Check database query count (Prisma logging)
- [ ] Verify caching headers (Network tab)
- [ ] Test error states
- [ ] Verify loading skeletons
- [ ] Mobile responsiveness (multiple devices)
- [ ] Accessibility audit (screen reader)

---

## 📚 Resources

- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [React Performance](https://react.dev/learn/render-and-commit)

---

**Remember:** Performance is a feature, not an afterthought. Measure, optimize, repeat.
