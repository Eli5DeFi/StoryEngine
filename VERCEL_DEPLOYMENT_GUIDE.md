# Vercel Deployment Guide - Voidborne

## Prerequisites

- Vercel account connected to GitHub
- WalletConnect Project ID
- Base Sepolia RPC URL (optional, uses public endpoint by default)

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Eli5DeFi/StoryEngine)

## Manual Setup

### 1. Install Vercel CLI (Optional)

```bash
npm i -g vercel
```

### 2. Environment Variables

Create these in Vercel Dashboard → Settings → Environment Variables:

#### Required

```bash
# WalletConnect (get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here

# Chain Configuration
NEXT_PUBLIC_CHAIN_ID=84532  # Base Sepolia testnet
```

#### Optional

```bash
# Custom API URL (defaults to same domain)
NEXT_PUBLIC_API_URL=https://your-domain.vercel.app

# Custom RPC (uses public endpoint by default)
NEXT_PUBLIC_BASE_SEPOLIA_RPC=https://your-rpc-url

# Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id
```

### 3. Deploy via GitHub Integration

**Automatic Deployment:**

1. Connect GitHub repo to Vercel
2. Select `StoryEngine` repository
3. Framework Preset: **Next.js**
4. Root Directory: `apps/web`
5. Build Command: `pnpm build`
6. Install Command: `pnpm install`
7. Output Directory: `.next`
8. Add environment variables (from step 2)
9. Click **Deploy**

**Manual Deployment:**

```bash
cd /path/to/StoryEngine
vercel --prod
```

### 4. Configure Build Settings

In Vercel Dashboard → Settings → General:

```json
{
  "buildCommand": "cd apps/web && pnpm build",
  "devCommand": "cd apps/web && pnpm dev",
  "installCommand": "pnpm install",
  "outputDirectory": "apps/web/.next"
}
```

### 5. Node.js Version

Vercel → Settings → General → Node.js Version: **20.x**

## Post-Deployment Checks

### 1. Build Verification

```bash
# Check build logs in Vercel dashboard
# Should see: "✓ Generating static pages (55/55)"
```

### 2. Test Critical Routes

- ✅ Homepage: `https://your-domain.vercel.app/`
- ✅ Lore: `https://your-domain.vercel.app/lore`
- ✅ About: `https://your-domain.vercel.app/about`
- ✅ FAQ: `https://your-domain.vercel.app/faq`
- ✅ Houses: `https://your-domain.vercel.app/lore/houses-dynamic`
- ✅ Story: `https://your-domain.vercel.app/story/1`

### 3. Test Wallet Connection

1. Visit deployed site
2. Click "Connect Wallet"
3. Verify WalletConnect modal opens
4. Test wallet connection
5. Check Base Sepolia network switch

### 4. Performance Check

Run Lighthouse audit:
- Performance: >90
- Accessibility: >95
- Best Practices: >90
- SEO: >90

## Environment Variables Reference

### NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID

**Get it:** https://cloud.walletconnect.com

1. Create account
2. Create new project
3. Copy Project ID
4. Paste in Vercel environment variables

### NEXT_PUBLIC_CHAIN_ID

**Options:**
- `84532` - Base Sepolia (testnet) ✅ Recommended
- `8453` - Base Mainnet (production only)
- `1` - Ethereum Mainnet
- `11155111` - Sepolia (Ethereum testnet)

### NEXT_PUBLIC_API_URL

**Default:** Same domain as deployment

**Custom:** If API is on different domain:
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## Troubleshooting

### Build Fails

**Error:** `Module not found: Can't resolve '@/lib/contracts'`

**Fix:** Ensure `apps/web/src/lib/contracts.ts` exists and exports `CONTRACTS`

---

**Error:** `Type error: Module '"@/lib/contracts"' has no exported member...`

**Fix:** Check `contracts.ts` exports match imports in hooks:
```typescript
export const CONTRACTS = { /* ... */ }
export function formatUSDC(value: bigint): string { /* ... */ }
export function formatForge(value: bigint): string { /* ... */ }
export function parseUSDC(value: string): bigint { /* ... */ }
```

---

**Error:** `Dynamic server usage: no-store fetch`

**Fix:** Expected for SSG pages, not an error. Build will succeed.

### Deployment Fails

**Error:** `Command "pnpm build" exited with 1`

**Fix:** 
1. Check build locally: `cd apps/web && pnpm build`
2. Verify all dependencies installed
3. Check environment variables are set in Vercel

---

**Error:** `ENOENT: no such file or directory`

**Fix:** Verify root directory is set correctly in Vercel:
- Root Directory: `./` (project root, NOT `apps/web`)
- Build Command: `cd apps/web && pnpm build`

### Runtime Errors

**Error:** Wallet doesn't connect

**Fix:**
1. Verify `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` is set
2. Check WalletConnect project is active
3. Test with different wallet (MetaMask, Coinbase Wallet, Rainbow)

---

**Error:** Wrong network

**Fix:**
1. Verify `NEXT_PUBLIC_CHAIN_ID=84532` (Base Sepolia)
2. Check wallet is connected to Base Sepolia
3. Add Base Sepolia network to wallet:
   - Network Name: Base Sepolia
   - RPC URL: https://sepolia.base.org
   - Chain ID: 84532
   - Currency: ETH
   - Block Explorer: https://sepolia.basescan.org

### Performance Issues

**Slow image loading:**

**Fix:** Images should auto-optimize via Next.js Image component
- Verify `<Image>` component is used (not `<img>`)
- Check `next.config.mjs` has `images` config
- Monitor Vercel image optimization quota

---

**High bundle size:**

**Fix:**
1. Check bundle analyzer: `pnpm build --analyze`
2. Review large dependencies
3. Enable code splitting if needed

## Local Testing Before Deploy

### 1. Build Test

```bash
cd apps/web
pnpm build
```

**Expected output:**
```
✓ Generating static pages (55/55)
✅ Build successful
```

### 2. Production Preview

```bash
cd apps/web
pnpm build && pnpm start
```

Open: http://localhost:3000

### 3. Type Check

```bash
cd apps/web
pnpm type-check
```

**Expected:** No errors

### 4. Lint Check

```bash
cd apps/web
pnpm lint
```

**Expected:** No errors or warnings

## Smart Contract Integration (Post-Deploy)

After deploying contracts to Base Sepolia:

### 1. Update Contract Addresses

Edit `apps/web/src/lib/contracts.ts`:

```typescript
export const BETTING_POOL_ADDRESS = '0xYourDeployedAddress' as `0x${string}`
export const CONTRACTS = {
  forgeToken: '0xYourForgeTokenAddress' as `0x${string}`,
  // ...
}
```

### 2. Redeploy

```bash
git add apps/web/src/lib/contracts.ts
git commit -m "feat: Update contract addresses for Base Sepolia"
git push origin main
```

Vercel will auto-deploy.

### 3. Verify Contract Integration

1. Visit deployed site
2. Connect wallet (Base Sepolia)
3. Test betting functionality
4. Check transaction confirmations on BaseScan

## Monitoring

### Vercel Dashboard

- **Deployments:** Track build status
- **Analytics:** Page views, performance
- **Logs:** Runtime errors, function logs
- **Speed Insights:** Core Web Vitals

### Recommended Alerts

1. **Failed Builds** - Get notified on build failures
2. **High Error Rate** - Alert if runtime errors spike
3. **Slow Response** - Alert if p95 > 1s

## Production Checklist

Before going to mainnet:

- [ ] All tests passing locally
- [ ] Build successful on Vercel
- [ ] Environment variables configured
- [ ] Wallet connection works
- [ ] All routes load correctly
- [ ] Images optimized and loading
- [ ] Performance score >90
- [ ] Smart contracts deployed to mainnet
- [ ] Contract addresses updated
- [ ] Security audit completed
- [ ] Domain configured
- [ ] SSL certificate active
- [ ] Analytics tracking enabled
- [ ] Error monitoring configured

## Support

**Vercel Issues:** https://vercel.com/support  
**WalletConnect Issues:** https://docs.walletconnect.com  
**Base Network:** https://docs.base.org

---

**Last Updated:** February 16, 2026  
**Build Status:** ✅ Passing (55 routes)  
**Node Version:** 20.x  
**Framework:** Next.js 14
