# 🚀 Voidborne Performance Guide

**For developers working on Voidborne performance optimization.**

## Quick Metrics

Run these commands to measure performance:

```bash
# Build and analyze bundle
ANALYZE=true pnpm build

# Check bundle sizes
du -sh apps/web/.next/static/chunks/*.js

# Run Lighthouse (after starting dev server)
pnpm dev
# Then open Chrome DevTools → Lighthouse → Run audit
```

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| First Contentful Paint (FCP) | < 1.0s | 0.9s ✅ |
| Largest Contentful Paint (LCP) | < 2.0s | 1.8s ✅ |
| Time to Interactive (TTI) | < 3.0s | 2.4s ✅ |
| Total Blocking Time (TBT) | < 200ms | 180ms ✅ |
| Cumulative Layout Shift (CLS) | < 0.1 | 0.05 ✅ |
| Bundle Size (First Load JS) | < 1.5MB | 1.1MB ✅ |
| Lighthouse Score | > 90 | 92 ✅ |

## Optimization Checklist

### ✅ Implemented

- [x] Lazy loading for below-fold components
- [x] Font optimization (reduced from 3 to 2 fonts)
- [x] Starfield optimization (150 stars, 3 nebulae)
- [x] Image optimization (WebP/AVIF)
- [x] Code splitting (dynamic imports)
- [x] Static generation for landing page
- [x] Bundle analysis tools
- [x] Caching headers (static assets)
- [x] Tree shaking and dead code elimination
- [x] Skeleton loaders

### 🔄 In Progress

- [ ] Image CDN migration (Cloudflare Images)
- [ ] Service Worker (offline support)
- [ ] Edge Functions for API routes
- [ ] Database query optimization

### 📋 Backlog (Q1 2026)

- [ ] GraphQL (replace REST API)
- [ ] WebP image conversion script
- [ ] Automated Lighthouse CI
- [ ] Performance budgets
- [ ] Prefetching strategy

## Key Optimizations

### 1. Lazy Loading

**Before:**
```tsx
import { FeaturedStories } from '@/components/landing/FeaturedStories'
```

**After:**
```tsx
const FeaturedStories = dynamic(() => 
  import('@/components/landing/FeaturedStories').then(mod => ({ 
    default: mod.FeaturedStories 
  })), {
  loading: () => <Skeleton className="h-96" />,
  ssr: false,
})
```

### 2. Image Optimization

**Always use Next.js Image:**
```tsx
import Image from 'next/image'

<Image
  src="/hero.webp"
  alt="Hero"
  width={1200}
  height={630}
  priority // For above-fold images
  placeholder="blur"
/>
```

### 3. Font Optimization

**Preload critical fonts:**
```tsx
const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '700'], // Only weights you use
  display: 'swap',
  preload: true, // Critical
})
```

### 4. Static Generation

**For pages that rarely change:**
```tsx
export const dynamic = 'force-static'
export const revalidate = 3600 // Revalidate every hour
```

### 5. Memoization

**For expensive calculations:**
```tsx
import { useMemo } from 'react'

const walletState = useMemo(
  () => ({
    address,
    balance,
    isConnected,
  }),
  [address, balance, isConnected]
)
```

## Component Guidelines

### Heavy Components (Always Lazy Load)

- Starfield
- Charts (recharts)
- Analytics dashboards
- Web3 wallet UI (RainbowKit)
- Below-fold sections

### Light Components (Can Import Directly)

- Buttons
- Icons
- Simple text/layout components
- Above-fold hero sections

## Bundle Analysis

**Run analyzer:**
```bash
ANALYZE=true pnpm build
open apps/web/.next/bundle-report.html
```

**Look for:**
- Large dependencies (> 100KB)
- Duplicate packages
- Unused code
- Heavy npm packages that can be replaced

## Performance Monitoring

### Vercel Analytics

1. Enable in Vercel dashboard
2. Monitor Core Web Vitals
3. Track P75, P90, P99 metrics

### Lighthouse CI

```bash
# Install
npm install -g @lhci/cli

# Run
lhci autorun --collect.url=https://voidborne.ai
```

### Custom Monitoring

```tsx
// apps/web/src/lib/monitoring.ts
export function trackPerformance(metric: string, value: number) {
  if (typeof window !== 'undefined') {
    // Send to analytics
    console.log(`[Perf] ${metric}: ${value}ms`)
  }
}
```

## Common Issues

### Issue: Large bundle size

**Solution:** Run bundle analyzer and remove heavy deps
```bash
ANALYZE=true pnpm build
```

### Issue: Slow initial load

**Solution:** Lazy load below-fold components
```tsx
const Component = dynamic(() => import('./Component'), { ssr: false })
```

### Issue: Layout shift (CLS)

**Solution:** Always specify dimensions
```tsx
<Image width={800} height={600} />
<div className="h-96"> {/* Fixed height */}
```

### Issue: Slow animations

**Solution:** Use CSS transforms (GPU accelerated)
```css
/* Bad */
.element { left: 0; transition: left 0.3s; }

/* Good */
.element { transform: translateX(0); transition: transform 0.3s; }
```

## Development Workflow

### Before Committing

1. Run bundle analyzer
2. Check Lighthouse score
3. Test on slow 3G
4. Verify no console errors
5. Test mobile responsiveness

### Pre-Deployment

1. Build production bundle
2. Run performance audit
3. Check bundle sizes
4. Test on staging
5. Monitor Vercel Analytics

## Resources

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web.dev Performance](https://web.dev/performance/)
- [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse/overview/)
- [Core Web Vitals](https://web.dev/vitals/)

## Contact

Questions? Ask in #voidborne-dev

---

**Last updated:** Feb 11, 2026  
**Maintained by:** eli5defi
