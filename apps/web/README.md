# NarrativeForge Web App

The landing page and main web application for NarrativeForge - blockchain-integrated AI story betting platform.

## Features

- 🎨 **Modern Landing Page** - Hero, token stats, how it works, platform metrics, featured stories
- 🪙 **Bankr Integration** - Wallet connection, $FORGE token stats, trading
- 📱 **Responsive Design** - Mobile-first approach with Tailwind CSS
- ⚡ **Performance Optimized** - Next.js 14, React 18, code splitting
- 🎭 **Smooth Animations** - Framer Motion for delightful UX

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **UI:** React 18, Tailwind CSS, Radix UI, Framer Motion
- **Blockchain:** viem, wagmi (Base network)
- **Bankr:** @bankr/sdk for token + wallet management
- **TypeScript:** Full type safety

## Getting Started

### Install Dependencies

```bash
cd apps/web
npm install
# or
bun install
```

### Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:
- **BANKR_API_KEY** - Get from [bankr.bot/api](https://bankr.bot/api)
- **NEXT_PUBLIC_FORGE_TOKEN_ADDRESS** - After launching $FORGE token
- **DATABASE_URL** - PostgreSQL connection string
- **REDIS_URL** - Redis connection string

### Run Development Server

```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
apps/web/
├── src/
│   ├── app/              # Next.js app router
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Landing page
│   │   └── globals.css   # Global styles
│   ├── components/
│   │   ├── landing/      # Landing page sections
│   │   │   ├── Navbar.tsx
│   │   │   ├── Hero.tsx
│   │   │   ├── TokenStats.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── PlatformMetrics.tsx
│   │   │   ├── FeaturedStories.tsx
│   │   │   └── Footer.tsx
│   │   └── ui/           # Reusable UI components
│   │       └── button.tsx
│   └── lib/
│       └── utils.ts      # Utility functions
├── public/               # Static assets
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## Landing Page Sections

### 1. Navbar
- Logo and navigation links
- Wallet connect button
- Mobile responsive menu

### 2. Hero
- Main value proposition
- CTA buttons (Start Betting, Buy $FORGE)
- Quick stats (Total Bets, Active Readers, Stories, Winnings)
- Animated background effects

### 3. Token Stats
- Real-time $FORGE metrics (price, market cap, volume, holders)
- Bankr integration badge
- Trading status indicators

### 4. How It Works
- 4-step process explanation
- Example betting pool with payout calculation
- Visual step indicators

### 5. Platform Metrics
- Total users, stories created, TVL, AI decisions
- Real-time updates
- Animated counters

### 6. Featured Stories
- Active betting pools
- Pool size, time left, number of bettors
- Genre badges
- "Place Bet" CTAs

### 7. Footer
- Product, resources, community, legal links
- Social media icons
- System status indicator

## Bankr Integration

### Wallet Connection

```typescript
import { BankrClient } from '@narrative-forge/bankr-integration'

const client = new BankrClient({
  apiKey: process.env.BANKR_API_KEY,
  chain: 'base',
})

// Get wallet address
const address = await client.getWalletAddress('base')
```

### Token Stats

```typescript
import { TokenManager } from '@narrative-forge/bankr-integration'

const tokenManager = new TokenManager(client)
const tokenInfo = await tokenManager.getForgeTokenInfo(tokenAddress)
```

### Buy/Sell $FORGE

```typescript
// User buys $FORGE
await tokenManager.buyForge({
  tokenAddress,
  ethAmount: '0.1',
  chain: 'base',
})

// User sells $FORGE
await tokenManager.sellForge({
  tokenAddress,
  tokenAmount: '1000',
  chain: 'base',
})
```

## Styling

### Dark Theme
The app uses a dark theme with custom color palette defined in `globals.css`:
- Primary: Blue (#3b82f6)
- Secondary: Purple
- Accent: Pink
- Background: Dark blue-gray

### Components
All components use Tailwind CSS with custom utilities:
- `.text-gradient` - Gradient text effect
- `.glow` - Box shadow glow effect
- `.card-hover` - Card hover animation
- `.animated-bg` - Animated gradient background

### Animations
Framer Motion provides smooth page transitions:
- Fade in on scroll
- Slide in from sides
- Scale on hover
- Pulse effects

## Deployment

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

```bash
vercel deploy
```

### Environment Variables (Production)

Set these in your hosting platform:
- `BANKR_API_KEY`
- `NEXT_PUBLIC_FORGE_TOKEN_ADDRESS`
- `NEXT_PUBLIC_BASE_RPC_URL`
- `NEXT_PUBLIC_CHAIN_ID=8453`
- `DATABASE_URL`
- `REDIS_URL`

## Performance Optimizations

- **Image Optimization** - Next.js automatic image optimization
- **Code Splitting** - Automatic route-based splitting
- **Font Optimization** - Next.js font optimization (Inter)
- **CSS Optimization** - Tailwind CSS purging unused styles
- **Lazy Loading** - Components loaded on demand
- **Server Components** - Static rendering where possible

## Accessibility

- **Semantic HTML** - Proper heading hierarchy
- **ARIA Labels** - Screen reader support
- **Keyboard Navigation** - Full keyboard support
- **Color Contrast** - WCAG AA compliant
- **Focus Indicators** - Visible focus states

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Next Steps

1. **Connect to Backend API** - Integrate with betting pool APIs
2. **Add Wallet Modal** - wagmi + RainbowKit for wallet connection
3. **Real-time Updates** - WebSocket for live betting pools
4. **Story Reading UI** - Chapter viewer with betting interface
5. **User Dashboard** - Portfolio, betting history, winnings

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion)
- [Bankr SDK](https://docs.bankr.bot/sdk/installation)
- [viem](https://viem.sh)
- [wagmi](https://wagmi.sh)

## Support

- Discord: [NarrativeForge Community](https://discord.gg/narrativeforge)
- Twitter: [@NarrativeForge](https://twitter.com/narrativeforge)
- Email: support@narrativeforge.ai
