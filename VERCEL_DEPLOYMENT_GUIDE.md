# 🚀 Vercel Deployment Guide - Voidborne

**Complete guide for deploying Voidborne to Vercel**

---

## Prerequisites

- [x] Vercel account (free tier works)
- [x] GitHub repository
- [x] Node.js 18+ installed locally
- [x] Pnpm installed (`npm install -g pnpm`)

---

## Step 1: Prepare for Deployment

### Install Dependencies

```bash
cd /Users/eli5defi/.openclaw/workspace/StoryEngine

# Install all dependencies
pnpm install

# Navigate to web app
cd apps/web

# Build locally to test
pnpm build

# Expected output:
# ✓ Compiled successfully
# ✓ Linting and checking validity of types
# ✓ Collecting page data
# ✓ Generating static pages
# ✓ Finalizing page optimization

# If build succeeds, you're ready!
```

### Run Tests

```bash
# From root directory
cd /Users/eli5defi/.openclaw/workspace/StoryEngine

# Run web app tests (if any)
cd apps/web
pnpm test

# Run smart contract tests
cd ../../poc/combinatorial-betting
forge test

# Expected: All tests pass
```

---

## Step 2: Environment Variables

### Create `.env.local` (Local Testing)

```bash
cd apps/web

# Copy example
cp .env.example .env.local

# Edit with your values
nano .env.local
```

**Required variables:**
```bash
# WalletConnect (get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id_here

# API URL (localhost for dev, your domain for prod)
NEXT_PUBLIC_API_URL=http://localhost:3000

# Chain ID
# Base Sepolia: 84532
# Base Mainnet: 8453
# MegaETH: TBD
NEXT_PUBLIC_CHAIN_ID=84532

# Optional: Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Vercel Environment Variables

You'll add these in the Vercel dashboard (Step 4).

---

## Step 3: Push to GitHub

```bash
cd /Users/eli5defi/.openclaw/workspace/StoryEngine

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Voidborne ready for deployment"

# Create GitHub repo
# Visit: https://github.com/new
# Name: StoryEngine (or your choice)

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/StoryEngine.git

# Push
git branch -M main
git push -u origin main
```

---

## Step 4: Deploy to Vercel

### Option A: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (from root directory)
cd /Users/eli5defi/.openclaw/workspace/StoryEngine
vercel

# Follow prompts:
# ? Set up and deploy "~/StoryEngine"? [Y/n] Y
# ? Which scope? [Your account]
# ? Link to existing project? [n] n
# ? What's your project's name? voidborne
# ? In which directory is your code located? ./
# ? Want to override the settings? [y/N] N

# Vercel will auto-detect:
# - Framework: Next.js
# - Build Command: cd apps/web && pnpm build
# - Output Directory: apps/web/.next
# - Install Command: pnpm install

# Wait for deployment...
# ✓ Deployment ready!
# Preview: https://voidborne-xyz.vercel.app
```

### Option B: Vercel Dashboard

1. **Visit:** https://vercel.com/new

2. **Import Git Repository:**
   - Click "Add New" → "Project"
   - Select your GitHub repo

3. **Configure Project:**
   - Framework Preset: **Next.js**
   - Root Directory: `./` (leave as default)
   - Build Command: `cd apps/web && pnpm build`
   - Output Directory: `apps/web/.next`
   - Install Command: `pnpm install`

4. **Environment Variables:**
   Click "Environment Variables" and add:
   ```
   NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_value
   NEXT_PUBLIC_API_URL=https://your-domain.vercel.app
   NEXT_PUBLIC_CHAIN_ID=84532
   ```

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes
   - ✅ Deployment complete!

---

## Step 5: Configure Custom Domain (Optional)

### Add Domain

1. **In Vercel Dashboard:**
   - Go to your project → Settings → Domains
   - Add domain: `voidborne.io` (or your choice)

2. **Update DNS:**
   - Add CNAME record:
     ```
     Type: CNAME
     Name: @ (or www)
     Value: cname.vercel-dns.com
     ```

3. **Update Environment Variables:**
   ```bash
   NEXT_PUBLIC_API_URL=https://voidborne.io
   ```

4. **Redeploy:**
   ```bash
   vercel --prod
   ```

---

## Step 6: Verify Deployment

### Check Pages

Visit these URLs and verify they load:

- ✅ Homepage: https://your-domain.vercel.app
- ✅ Lore: https://your-domain.vercel.app/lore
- ✅ Houses: https://your-domain.vercel.app/lore/houses-dynamic
- ✅ About: https://your-domain.vercel.app/about
- ✅ FAQ: https://your-domain.vercel.app/faq

### Check Web3 Functionality

1. **Connect Wallet:**
   - Click "Connect Wallet"
   - Should show MetaMask, Rainbow, etc.

2. **Switch Network:**
   - Should prompt to switch to Base

3. **Test Betting UI:**
   - Navigate to betting page
   - Components should render (countdown, status badge, etc.)

### Performance Check

```bash
# Run Lighthouse audit
npx lighthouse https://your-domain.vercel.app --view

# Target scores:
# Performance: 90+
# Accessibility: 90+
# Best Practices: 90+
# SEO: 90+
```

---

## Step 7: Continuous Deployment

### Automatic Deployments

Vercel automatically deploys when you push to `main`:

```bash
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin main

# Vercel automatically:
# 1. Detects push
# 2. Builds project
# 3. Runs tests
# 4. Deploys to production
# 5. Sends notification

# View deployment:
# Visit Vercel dashboard or check email
```

### Preview Deployments

Vercel creates preview deployments for pull requests:

```bash
# Create feature branch
git checkout -b feature/new-page

# Make changes, commit, push
git push origin feature/new-page

# Create PR on GitHub
# Vercel creates preview deployment
# URL: https://voidborne-xyz-git-feature-new-page.vercel.app
```

---

## Troubleshooting

### Build Fails

**Error:** `Module not found`

**Fix:**
```bash
# Ensure all dependencies installed
pnpm install

# Check package.json paths
# Verify imports use @/ prefix
```

**Error:** `Out of memory`

**Fix:**
Add to `package.json`:
```json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max_old_space_size=4096' next build"
  }
}
```

Or update `vercel.json`:
```json
{
  "build": {
    "env": {
      "NODE_OPTIONS": "--max_old_space_size=4096"
    }
  }
}
```

### TypeScript Errors

**Error:** `Type 'X' is not assignable to type 'Y'`

**Fix:**
```bash
# Run type check locally
cd apps/web
pnpm tsc --noEmit

# Fix errors, then redeploy
```

**Temporary Fix (not recommended):**
Update `next.config.mjs`:
```js
typescript: {
  ignoreBuildErrors: true, // Only use for emergency deploys!
}
```

### Environment Variables Not Working

**Problem:** `process.env.NEXT_PUBLIC_X` is undefined

**Fix:**
1. Check Vercel dashboard → Settings → Environment Variables
2. Ensure variables start with `NEXT_PUBLIC_`
3. Redeploy after adding variables

### Web3 Wallet Not Connecting

**Problem:** "Unsupported chain" error

**Fix:**
```typescript
// Ensure chain config correct
import { base, baseSepolia } from 'wagmi/chains';

const config = createConfig({
  chains: [baseSepolia], // or [base] for mainnet
  // ...
});
```

### Slow Load Times

**Fix:**
```typescript
// Use dynamic imports for heavy components
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false, // Disable server-side rendering if not needed
});
```

---

## Optimization Checklist

### Before Production

- [ ] **Remove console.logs** - Set `removeConsole: true` in `next.config.mjs`
- [ ] **Enable compression** - Vercel does this automatically
- [ ] **Optimize images** - Use Next.js Image component
- [ ] **Code splitting** - Use dynamic imports
- [ ] **Cache static assets** - Configure headers
- [ ] **Minimize bundle** - Check bundle analyzer
- [ ] **Test on mobile** - Responsive design verified
- [ ] **SEO meta tags** - All pages have proper metadata
- [ ] **Accessibility** - ARIA labels, keyboard navigation
- [ ] **Error boundaries** - Graceful error handling

### Bundle Analysis

```bash
cd apps/web

# Analyze bundle size
pnpm build
# Check output:
# Route (app)                  Size     First Load JS
# ┌ ○ /                        5.2 kB    150 kB
# ├ ○ /lore                    8.1 kB    153 kB
# └ ○ /about                   3.4 kB    148 kB

# Target: First Load < 200 kB
```

---

## Monitoring & Analytics

### Vercel Analytics

Enable in Vercel dashboard:
- Go to project → Analytics
- Click "Enable Analytics"
- Free tier: 100K requests/month

### Google Analytics (Optional)

```typescript
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src={`https://www.googletagmanlytics.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Sentry (Error Tracking)

```bash
# Install
pnpm add @sentry/nextjs

# Initialize
npx @sentry/wizard@latest -i nextjs

# Follow prompts
```

---

## Production Checklist

Before going live:

- [ ] All pages load correctly
- [ ] Web3 wallet connects
- [ ] Betting contract deployed (testnet first!)
- [ ] Environment variables set
- [ ] Custom domain configured
- [ ] SSL certificate active (auto via Vercel)
- [ ] Analytics enabled
- [ ] Error tracking setup (Sentry)
- [ ] SEO optimized (meta tags, sitemap)
- [ ] Mobile tested (iOS + Android)
- [ ] Performance: Lighthouse 90+
- [ ] Security headers configured
- [ ] Legal pages (Terms, Privacy)
- [ ] Customer support ready (Discord/email)

---

## Estimated Costs

### Vercel

**Hobby (Free):**
- 100 GB bandwidth/month
- 100 builds/day
- Unlimited team members
- **Perfect for testnet launch**

**Pro ($20/month):**
- 1 TB bandwidth/month
- 6000 build minutes/month
- Analytics included
- **Recommended for mainnet**

### Total Monthly (Mainnet)

- Vercel Pro: $20
- Domain: $12/year ($1/month)
- RPC (Alchemy/Infura): $50-$200
- **Total: ~$70-$220/month**

---

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Discord:** #deployment channel
- **Email:** support@voidborne.io

---

**Deployment Status:** ✅ Ready for Vercel

*Last Updated: February 16, 2026*
