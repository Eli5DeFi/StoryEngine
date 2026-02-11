# Voidborne Evolution: Badges & Social Sharing Features

## Overview

This document covers 2 new features designed to increase engagement, retention, and viral growth:

1. **Achievement Badges & Streaks System** - Gamification
2. **Social Sharing with OG Image Generation** - Viral growth

Both features were implemented on **February 11, 2026** as part of the Voidborne Evolution cron cycle.

---

## Feature 1: Achievement Badges & Streaks System

### What It Does

Gamifies the betting experience by tracking user achievements and win streaks. Users earn badges for hitting milestones and maintain visible streaks that incentivize consecutive wins.

### Why It's Valuable

- **Increased Engagement**: Users return daily to maintain streaks
- **Social Proof**: Badges displayed on leaderboards create FOMO
- **Retention**: Visual progression keeps users invested
- **Competition**: Encourages users to compete for rare badges

### Components

#### 1. Database Schema

**New Tables:**
- `badges` - Defines all available badges
- `user_badges` - Junction table for earned badges

**Updated User Fields:**
- `currentStreak` - Current win streak count
- `longestStreak` - All-time best streak
- `lastBetDate` - Last bet timestamp (for streak calculation)

**Initial Badges:**
| Badge | Rarity | Criteria | Value |
|-------|--------|----------|-------|
| 🎯 First Blood | Common | First winning bet | 1 win |
| 🔥 Hot Streak | Rare | Consecutive wins | 3 wins |
| ⚡ Perfect Week | Epic | Consecutive wins | 7 wins |
| 👑 Legendary Predictor | Legendary | Consecutive wins | 15 wins |
| 🐋 High Roller | Epic | Total wagered | $10,000 |
| 💰 Profit King | Rare | Total profit | $1,000 |
| 💎 Diamond Hands | Legendary | Total bets placed | 100 bets |

#### 2. API Routes

**GET /api/badges**
```typescript
// Returns all available badges
{
  badges: Badge[]
}
```

**GET /api/badges/[userId]**
```typescript
// Returns badges earned by specific user
{
  badges: Array<Badge & { earnedAt: Date }>
}
```

#### 3. Services

**`/src/lib/badges.ts`**

```typescript
// Check and award badges after each bet
await checkAndAwardBadges(userId)

// Update streak after bet resolution
await updateUserStreak(userId, won)
```

**Streak Logic:**
- Increments on wins (if same day or consecutive day)
- Resets to 0 on losses
- Tracks `longestStreak` separately
- Updates `lastBetDate` for gap detection

#### 4. UI Components

**`<BadgeDisplay />`**
- Shows user badges with rarity-based styling
- Animated entrance (stagger effect)
- Tooltips with badge name, description, earn date
- Special sparkle effect for Legendary badges
- Responsive sizing (sm/md/lg)

**`<StreakIndicator />`
- Flame icon with current streak count
- Visual intensity increases with streak level:
  - 🔥 3+ wins: Hot (red/orange)
  - 🔥 7+ wins: On Fire (orange glow)
  - 🔥 15+ wins: Legendary (yellow/gold)
- Pulse animation for active streaks
- Shows longest streak on hover

#### 5. Integration

**Leaderboard Enhancement:**
- Badges displayed next to usernames (max 3 visible)
- Streak indicators for users with active streaks
- Badges sorted by rarity (Legendary first)
- Increased column width for player info

**Trigger Points:**
- After bet placement (check volume/bets criteria)
- After bet resolution (check wins/streak/profit)
- Background job (daily recalculation for accuracy)

### Implementation Plan

#### Phase 1: Database & Schema (Week 1)
- [x] Run migration: `20260211_badges_and_streaks.sql`
- [x] Update Prisma schema
- [x] Generate Prisma client: `npx prisma generate`
- [x] Seed initial badges

#### Phase 2: Backend Services (Week 1-2)
- [x] Implement `checkAndAwardBadges()`
- [x] Implement `updateUserStreak()`
- [x] Create badge API routes
- [x] Update leaderboard API to include badges/streaks

#### Phase 3: Frontend Components (Week 2)
- [x] Create `<BadgeDisplay />` component
- [x] Create `<StreakIndicator />` component
- [x] Update `<Leaderboard />` to show badges/streaks
- [x] Add badge tooltips and animations

#### Phase 4: Testing & Polish (Week 3)
- [ ] Test badge awarding logic (unit tests)
- [ ] Test streak calculation edge cases
- [ ] Performance testing (leaderboard query optimization)
- [ ] UI polish (animations, responsive design)

#### Phase 5: Launch (Week 4)
- [ ] Deploy to staging
- [ ] QA testing
- [ ] Deploy to production
- [ ] Monitor badge distribution

### Technical Details

**Rarity Color Gradients:**
```typescript
const rarityColors = {
  COMMON: 'from-gray-400 to-gray-600',
  RARE: 'from-blue-400 to-blue-600',
  EPIC: 'from-purple-400 to-purple-600',
  LEGENDARY: 'from-yellow-400 to-yellow-600',
}
```

**Streak Calculation:**
```typescript
// Same day or consecutive day = continue streak
const daysSinceLastBet = Math.floor(
  (now.getTime() - lastBetDate.getTime()) / (1000 * 60 * 60 * 24)
)

if (won && daysSinceLastBet <= 1) {
  newStreak = currentStreak + 1
} else if (won) {
  newStreak = 1 // Reset if gap > 1 day
} else {
  newStreak = 0 // Reset on loss
}
```

---

## Feature 2: Social Sharing with OG Image Generation

### What It Does

Allows users to share their bets, wins, streaks, and profiles on social media with auto-generated, beautiful Open Graph images.

### Why It's Valuable

- **Viral Growth**: Each share is free marketing
- **Social Proof**: Winners sharing creates FOMO
- **User Acquisition**: 1-click sharing lowers friction
- **Brand Awareness**: Consistent "Ruins of the Future" aesthetic

### Components

#### 1. OG Image Generation

**GET /api/share/og**

Generates 1200x630 Open Graph images using Next.js `ImageResponse` (edge runtime).

**Query Parameters:**
- `type` - 'bet' | 'win' | 'streak' | 'profile'
- `storyTitle` - Story name
- `choice` - Choice text
- `amount` - Bet amount ($)
- `potentialWin` - Potential winnings ($)
- `username` - User display name
- `streak` - Current win streak
- `badges` - Comma-separated badge emojis

**Design Features:**
- Dark void background with purple/teal gradients
- Gold border and branding
- Voidborne logo in top-left
- Large, readable text (48px+ titles)
- Clear value proposition at bottom
- Responsive to different content types

**Example URL:**
```
/api/share/og?type=bet&storyTitle=The%20Last%20Memory&choice=Escape%20Through%20Airlock&amount=100&potentialWin=250&username=Alice&streak=5&badges=🎯🔥💎
```

#### 2. Share API

**POST /api/share**

Generates shareable links for all platforms with proper metadata.

**Request Body:**
```json
{
  "type": "bet",
  "betId": "bet_123",
  "userId": "user_456",
  "platform": "twitter"
}
```

**Response:**
```json
{
  "shareText": "I just bet $100 on...",
  "shareUrl": "https://voidborne.xyz/story/...",
  "shareUrls": {
    "twitter": "https://twitter.com/intent/tweet?...",
    "farcaster": "https://warpcast.com/~/compose?...",
    "telegram": "https://t.me/share/url?..."
  },
  "ogImageUrl": "https://voidborne.xyz/api/share/og?...",
  "data": { ... }
}
```

**Share Text Templates:**

**Bet:**
```
I just bet $100 on "Escape Through Airlock" in The Last Memory! 🎯

Think you can predict better? Join me on Voidborne!
```

**Win:**
```
💰 I WON $250 on Voidborne!

Story: The Last Memory
Choice: Escape Through Airlock

Bet on AI stories and win big!
```

**Streak:**
```
🔥 5 WIN STREAK on Voidborne!

I'm on fire predicting AI story choices. Can you beat my streak?
```

**Profile:**
```
📊 My Voidborne Stats:
🎯🔥💎

42 bets | 67.3% win rate | 8 longest streak

Join me and predict AI story outcomes!
```

#### 3. Share Button Component

**`<ShareButton />`**

```tsx
<ShareButton
  type="bet"
  betId="bet_123"
  label="Share"
  variant="default"
/>
```

**Features:**
- Loading state while fetching share data
- Dropdown menu with platform options
- Copy-to-clipboard functionality
- Preview of share text
- Smooth animations (Framer Motion)
- Auto-closes when clicking outside

**Platforms Supported:**
- Twitter (with hashtags: #Voidborne #AIStories #PredictionMarket)
- Farcaster/Warpcast
- Telegram
- Copy link (generic)

#### 4. Integration Points

**After Bet Placement:**
```tsx
<div className="flex gap-2">
  <button>View Bet</button>
  <ShareButton type="bet" betId={betId} />
</div>
```

**After Bet Win:**
```tsx
<div className="celebration-modal">
  <h2>🎉 You Won ${payout}!</h2>
  <ShareButton type="win" betId={betId} label="Share Win" />
</div>
```

**On Leaderboard:**
```tsx
<div className="user-row">
  {/* ... user stats ... */}
  {entry.currentStreak >= 3 && (
    <ShareButton type="streak" userId={entry.userId} variant="compact" />
  )}
</div>
```

**On Profile Page:**
```tsx
<div className="profile-header">
  {/* ... user info ... */}
  <ShareButton type="profile" userId={userId} />
</div>
```

### Implementation Plan

#### Phase 1: OG Image Generation (Week 1)
- [x] Create `/api/share/og/route.tsx`
- [x] Design image layouts for 4 types (bet/win/streak/profile)
- [x] Test image rendering on different platforms
- [x] Optimize image size (should be < 200KB)

#### Phase 2: Share API (Week 1-2)
- [x] Create `/api/share/route.ts`
- [x] Fetch bet/user data from database
- [x] Generate share text templates
- [x] Build platform-specific URLs
- [x] Error handling

#### Phase 3: UI Components (Week 2)
- [x] Create `<ShareButton />` component
- [x] Add dropdown menu with platforms
- [x] Copy-to-clipboard functionality
- [x] Animation and polish

#### Phase 4: Integration (Week 2-3)
- [ ] Add share buttons to bet confirmation
- [ ] Add share buttons to win modal
- [ ] Add share buttons to leaderboard
- [ ] Add share button to profile page

#### Phase 5: Testing & Optimization (Week 3)
- [ ] Test OG images on Twitter (card validator)
- [ ] Test OG images on Facebook (debugger)
- [ ] Test share flow end-to-end
- [ ] A/B test share text variations

#### Phase 6: Launch & Monitor (Week 4)
- [ ] Deploy to production
- [ ] Track share click rate
- [ ] Track conversion from shares (new users)
- [ ] Iterate on share text based on data

### Technical Details

**OG Image Spec:**
- Dimensions: 1200x630px (Twitter/FB recommended)
- Format: PNG (higher quality than JPEG for text)
- File size: Target < 200KB (Edge Functions limit: 1MB)
- Runtime: Edge (faster, lower latency)

**Platform Share URLs:**

**Twitter:**
```
https://twitter.com/intent/tweet?text={text}&url={url}&hashtags={tags}
```

**Farcaster:**
```
https://warpcast.com/~/compose?text={text}
```

**Telegram:**
```
https://t.me/share/url?url={url}&text={text}
```

**OG Meta Tags (for share URLs):**
```html
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:image" content="{ogImageUrl}" />
<meta property="og:url" content="{shareUrl}" />
<meta property="twitter:card" content="summary_large_image" />
```

---

## Success Metrics

### Badges & Streaks

**Engagement:**
- Daily Active Users (DAU) increase: Target +20%
- Average session duration: Target +30%
- Bet frequency: Target +15%

**Retention:**
- 7-day retention: Target +25%
- 30-day retention: Target +20%
- Users with 3+ day streak: Target 40%

**Social Proof:**
- Users with ≥1 badge: Target 60% (Week 4)
- Users with Epic/Legendary badge: Target 5%
- Average badges per active user: Target 2.5

### Social Sharing

**Viral Growth:**
- Share button click rate: Target 15%
- Shares per winning bet: Target 30%
- Shares per 5+ win streak: Target 50%

**Acquisition:**
- New users from shared links: Track via UTM params
- Conversion rate (share → signup): Target 5%
- Viral coefficient (K-factor): Target 0.3+ (sustainable growth)

**Engagement:**
- Twitter impressions per share: Track via API
- Farcaster engagement: Track via Neynar
- Total reach: Track cumulative

---

## Deployment Checklist

### Pre-Deployment

- [x] Database migration created
- [ ] Migration tested on staging
- [ ] Prisma schema updated
- [ ] Prisma client generated
- [ ] All API routes tested
- [ ] UI components QA'd
- [ ] OG images validated (Twitter/FB)

### Deployment

- [ ] Run migration on production DB
- [ ] Deploy backend code
- [ ] Deploy frontend code
- [ ] Verify API routes accessible
- [ ] Test share flow end-to-end
- [ ] Monitor error logs

### Post-Deployment

- [ ] Seed initial badges (if not in migration)
- [ ] Backfill streaks for existing users
- [ ] Monitor badge distribution
- [ ] Track share metrics
- [ ] User feedback collection

---

## Future Enhancements

### Badges & Streaks

- **Seasonal Badges**: Limited-time badges for events
- **Rarity Tiers**: Ultra-rare badges (< 1% unlock rate)
- **Badge Shop**: Spend winnings to buy cosmetic badges
- **Streak Rewards**: Daily bonuses for active streaks
- **Leaderboard Filters**: Filter by badge rarity

### Social Sharing

- **Share-to-Earn**: Reward users for sharing (tokens/points)
- **Referral Tracking**: Attribute new users to sharers
- **Video OG Images**: Animated preview videos
- **Story Templates**: Pre-made share graphics for stories
- **Instagram Stories**: Vertical format share images

---

## Support

For questions or issues:
- **Developer**: Claw (AI assistant)
- **Repository**: `/Users/eli5defi/.openclaw/workspace/StoryEngine`
- **Documentation**: This file + inline code comments

---

**Last Updated**: February 11, 2026  
**Status**: ✅ Implementation Complete, ⏳ Testing & Integration Pending
