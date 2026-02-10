# ✅ Voidborne Optimization Checklist

Quick reference for maintaining performance.

## 🚀 Before Every Deployment

- [ ] Run bundle analyzer: `ANALYZE=true pnpm build`
- [ ] Check bundle sizes (target: < 1.5MB first load)
- [ ] Run Lighthouse audit (target: > 90)
- [ ] Test on slow 3G network
- [ ] Verify no console errors
- [ ] Test mobile responsiveness

## 📦 Adding New Dependencies

Before adding a package:

1. Check bundle size: `npm info <package> | grep unpacked`
2. Consider lighter alternatives
3. Use dynamic imports if > 50KB
4. Check if tree-shakeable

## 🎨 Adding New Components

Heavy components (> 20KB) should be:

- [ ] Lazy loaded with `dynamic()`
- [ ] Have loading skeleton
- [ ] Use SSR: false if client-only
- [ ] Memoized if props rarely change

## 📸 Adding Images

- [ ] Use Next.js `<Image>` component
- [ ] Provide width/height (prevent CLS)
- [ ] Use `priority` for above-fold
- [ ] Format: WebP or AVIF
- [ ] Compress before uploading

## 🎯 Performance Targets

| Metric | Target |
|--------|--------|
| FCP | < 1.0s |
| LCP | < 2.0s |
| TTI | < 3.0s |
| TBT | < 200ms |
| CLS | < 0.1 |
| Bundle | < 1.5MB |
| Lighthouse | > 90 |

## 🔍 Weekly Maintenance

Every Monday:

- [ ] Run bundle analysis
- [ ] Check Vercel Analytics
- [ ] Review Core Web Vitals
- [ ] Clean up unused deps
- [ ] Update optimization docs

## 🚨 Red Flags

Stop and optimize if:

- Bundle size > 2MB
- LCP > 3s
- Lighthouse < 85
- TBT > 300ms
- Layout shifts (CLS > 0.15)

## 📚 Resources

- [Performance Guide](../PERFORMANCE_GUIDE.md)
- [Next.js Optimization](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web.dev](https://web.dev/performance/)

---

**Last updated:** Feb 11, 2026
