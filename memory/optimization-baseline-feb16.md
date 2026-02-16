## Baseline Metrics (Feb 16, 2026)

### Bundle Sizes
- Largest chunk (wallet libs): 84.8 kB
- First Load JS shared: 88.6 kB  
- /leaderboards: 713 kB
- /my-bets: 712 kB
- /story/[storyId]: 722 kB

### Issues Found
1. **Dynamic API Routes** (preventing static generation):
   - /api/betting/recent
   - /api/betting/platform-stats
   - /api/analytics/stats
   - /api/leaderboards
   - /api/notifications/preferences
   - /api/share/og-image

2. **Build Warnings**:
   - MetaMask SDK async-storage (can ignore - browser only)
   - Pino-pretty (can ignore - dev only)

3. **Code Quality**:
   - Console.logs present
   - TypeScript warnings
   - No loading states
   - No error boundaries

### Optimization Goals
- [ ] Fix dynamic API routes → enable static generation
- [ ] Add React.memo + useMemo for expensive components
- [ ] Implement proper loading states
- [ ] Add error boundaries
- [ ] Remove console.logs
- [ ] Optimize images (WebP, lazy loading)
- [ ] Add mobile responsiveness improvements

