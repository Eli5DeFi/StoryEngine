# Optimization Testing Guide

## Before Testing

Ensure you have:
1. Latest code from `optimize/performance-ux-cost-feb-14` branch
2. Dependencies installed: `pnpm install`
3. Database running: `pnpm docker:up`

---

## 1. Bundle Size Testing

### Build and Analyze

```bash
# Build with bundle analyzer
cd apps/web
ANALYZE=true pnpm build

# Check output
open .next/analyze/client.html  # macOS
xdg-open .next/analyze/client.html  # Linux
```

### Expected Results
- **Main bundle:** ~420KB (gzipped)
- **Charts (lazy):** ~280KB (separate chunk, loaded on-demand)
- **Wallet libs:** ~150KB (separate chunk)

### Before Optimization
```
main.js: 850KB (includes charts)
```

### After Optimization
```
main.js: 420KB (no charts)
charts.js: 280KB (lazy-loaded)
```

---

## 2. Page Load Performance

### Lighthouse Audit

```bash
# Start dev server
pnpm dev

# Open Chrome DevTools
# Navigate to http://localhost:3000
# Run Lighthouse audit (Performance mode)
```

### Expected Scores
- **Performance:** >90
- **FCP:** <1.2s
- **LCP:** <1.5s
- **TTI:** <2.0s

### Test Pages
1. Home page
2. Dashboard
3. Story page with betting pools
4. Leaderboards

---

## 3. Database Performance

### Apply Migration

```bash
cd packages/database
pnpm db:push

# Verify indexes created
pnpm db:studio
# Check Indexes tab in Prisma Studio
```

### Test Queries

```bash
# Run query performance tests
cd apps/web
pnpm test:performance
```

### Expected Response Times
| Endpoint | Target |
|----------|--------|
| /api/betting/trending | <100ms |
| /api/leaderboards | <50ms |
| /api/users/[wallet]/bets | <50ms |
| /api/pools/[id]/odds | <75ms |

---

## 4. Lazy Loading Testing

### Test Chart Components

```bash
# Start dev server
pnpm dev

# Open browser with DevTools Network tab
# Navigate to page with charts
# Verify:
# 1. Skeleton shows first
# 2. Chart loads after initial page load
# 3. Separate chunk request for charts bundle
```

### Manual Test
1. Open http://localhost:3000/dashboard
2. Open Chrome DevTools Network tab
3. Filter by JS files
4. Look for `chunks/[hash]-charts.js` loading separately
5. Verify skeleton appears before chart

---

## 5. Cron Job Testing

### Test Structured Logging

```bash
# Trigger capture-odds cron
curl -X POST http://localhost:3000/api/cron/capture-odds \
  -H "Authorization: Bearer dev-secret"

# Check logs - should see JSON format
# {
#   "timestamp": "2026-02-14T11:00:00.000Z",
#   "level": "INFO",
#   "jobName": "capture-odds",
#   "message": "Found 5 open pools"
# }
```

### Test Both Cron Jobs
1. `/api/cron/capture-odds` - Odds snapshots
2. `/api/cron/extract-characters` - Character extraction

---

## 6. Visual Regression Testing

### Check Loading States

**Before optimization:**
- Spinner during chart load

**After optimization:**
- Skeleton placeholder
- Smooth transition to chart
- No layout shift

### Test Flow
1. Navigate to betting pool page
2. Observe loading state (should be skeleton)
3. Wait for chart to load
4. Verify no layout jumps

---

## 7. Mobile Testing

### Responsive Design

```bash
# Open Chrome DevTools
# Toggle device toolbar (Cmd+Shift+M)
# Test on:
# - iPhone SE (375px)
# - iPhone 12 Pro (390px)
# - iPad (768px)
```

### Check
- [ ] Charts are responsive
- [ ] Skeletons match layout
- [ ] No horizontal scroll
- [ ] Touch interactions work

---

## 8. Production Build Testing

### Build for Production

```bash
# Clean build
pnpm clean
pnpm install
pnpm build

# Start production server
pnpm start

# Test on http://localhost:3000
```

### Verify
- [ ] No console.logs (except errors/warnings)
- [ ] Lazy loading works
- [ ] API responses cached
- [ ] Images optimized (WebP)

---

## 9. Cost Tracking

### Before Deployment
Note baseline metrics:
- Database query count (last 24h)
- Vercel bandwidth usage
- RPC call volume

### After Deployment
Compare metrics after 24h:
- Expected: 60-70% reduction in queries
- Expected: 50-60% reduction in bandwidth

---

## 10. Rollback Testing

### Test Rollback Scenario

```bash
# Remove migration (if needed)
cd packages/database
# Delete migration file
pnpm db:push

# Revert lazy loading
# Change imports back to direct imports
```

### Verify
- App still works without migration
- Direct imports work if lazy loading removed

---

## Testing Checklist

### Pre-Merge
- [ ] Bundle size reduced (ANALYZE=true pnpm build)
- [ ] Lighthouse score >90
- [ ] Database indexes applied
- [ ] Lazy loading works
- [ ] Cron jobs use structured logging
- [ ] No console.logs in production build
- [ ] Mobile responsive
- [ ] No TypeScript errors
- [ ] No ESLint warnings

### Post-Deploy (Staging)
- [ ] Monitor error rates (first 1 hour)
- [ ] Check bundle sizes (Vercel dashboard)
- [ ] Verify API response times
- [ ] Test all major user flows
- [ ] Check database query count

### Post-Deploy (Production)
- [ ] Monitor for 24 hours
- [ ] Compare costs (database, bandwidth)
- [ ] Check Lighthouse scores
- [ ] Verify no regressions
- [ ] Collect user feedback

---

## Performance Benchmarks

### Bundle Sizes (Target)
```
Before:  850KB initial
After:   420KB initial (51% reduction)
Charts:  280KB lazy-loaded
```

### API Response Times (Target)
```
/trending:     <100ms (was 250ms)
/leaderboards: <50ms  (was 180ms)
/user-bets:    <50ms  (was 120ms)
```

### Lighthouse Scores (Target)
```
Performance: >90 (was 72)
FCP: <1.2s (was 1.8s)
LCP: <1.5s (was 2.4s)
TTI: <2.0s (was 3.2s)
```

---

## Troubleshooting

### Charts Not Loading
**Problem:** Chart skeleton shows but chart never loads
**Solution:**
1. Check browser console for errors
2. Verify dynamic import path is correct
3. Check network tab for chunk download

### Database Queries Still Slow
**Problem:** API responses still taking >200ms
**Solution:**
1. Verify migration applied: check Prisma Studio
2. Run EXPLAIN ANALYZE on slow queries
3. Check cache is working (second request should be fast)

### Bundle Size Not Reduced
**Problem:** Main bundle still large
**Solution:**
1. Verify using lazy imports (`from './Chart.lazy'`)
2. Check webpack config in next.config.js
3. Run bundle analyzer to identify other heavy deps

---

## Success Criteria

✅ **Performance:** 2x faster page loads  
✅ **Cost:** 50% lower monthly costs  
✅ **UX:** 10x better loading experience  
✅ **Quality:** No console.logs, proper logging

**Ready to merge when all tests pass.**
