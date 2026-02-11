# Feature Spec: Prediction Streaks & Multipliers 🔥

**Status:** Ready for Implementation  
**Priority:** HIGH (10x Engagement Impact)  
**Estimated Dev Time:** 2-3 days  
**Category:** Betting Enhancement + Gamification

---

## 🎯 The Problem

Current betting system lacks:
- **Loyalty rewards** for consistent predictors
- **Competitive dynamics** beyond leaderboards
- **Daily check-in incentives**
- **Progression systems** that create habit loops

Result: Users bet once, leave, forget to come back.

---

## 💡 The Solution

**Prediction Streaks with Payout Multipliers**

Win consecutive bets → Earn multipliers → Get bigger payouts → Feel like a prediction god

### Core Mechanics

```
Streak Level → Multiplier → Visual

1-2 wins    → 1.0x (base) → 🔥
3-4 wins    → 1.1x (+10%)  → 🔥🔥
5-7 wins    → 1.2x (+20%)  → 🔥🔥🔥
8-12 wins   → 1.3x (+30%)  → 🔥🔥🔥🔥
13-20 wins  → 1.5x (+50%)  → 🔥🔥🔥🔥🔥
21+ wins    → 2.0x (+100%) → 🔥🔥🔥🔥🔥🔥 LEGENDARY
```

**Example:**
- Base payout: 100 USDC
- 5-win streak: 120 USDC (+20%)
- 10-win streak: 130 USDC (+30%)
- 21-win streak: 200 USDC (+100%!) 🚀

**Loss breaks streak** (resets to 0, creates tension)

---

## 🎮 User Experience

### 1. Streak Tracker (Persistent UI Element)

**Location:** Top-right corner of betting interface

```tsx
┌─────────────────────────────┐
│  🔥 5-Win Streak            │
│  1.2x Payout Multiplier     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━  │
│  5/7 to next level          │
└─────────────────────────────┘
```

**States:**
- No streak: Show "Start your streak"
- Active streak: Show fire emoji count + multiplier
- At risk: Pulse animation if next bet could break streak
- Broken: Show "Streak broken 💔 Start fresh"

### 2. Streak Protection (Power-Up)

**Unlock at 10+ streak:** "Streak Shield" 🛡️
- 1 free loss protection per 10-win streak
- Costs 10% of your bet to activate
- Keeps streak alive if you lose

### 3. Streak Milestones (Achievements)

**Badge System:**
- 🔥 "Hot Streak" (3 wins)
- 🔥🔥 "On Fire" (5 wins)
- 🔥🔥🔥 "Blazing" (10 wins)
- 🔥🔥🔥🔥 "Inferno" (15 wins)
- 🔥🔥🔥🔥🔥 "God Mode" (20 wins)
- 🔥🔥🔥🔥🔥🔥 "LEGEND" (30+ wins)

**Social Sharing:**
"I just hit a 15-win streak on @NarrativeForge! 🔥🔥🔥🔥 Can you beat it?"

### 4. Leaderboard Integration

**New Tab:** "Longest Streaks"
- All-time longest streaks
- Current active streaks
- Total streak wins (lifetime)

---

## 🏗️ Technical Implementation

### Database Schema Changes

```prisma
// Add to User model
model User {
  // ... existing fields

  // Streaks
  currentStreak     Int      @default(0)
  longestStreak     Int      @default(0)
  streakMultiplier  Float    @default(1.0)
  lastBetDate       DateTime?
  consecutiveWins   Int      @default(0)
  
  // Streak Protection
  streakShieldsAvailable Int @default(0)
  streakShieldUsedAt     DateTime?
  
  @@index([currentStreak])
  @@index([longestStreak])
}

// Add to Bet model
model Bet {
  // ... existing fields
  
  streakMultiplier  Float?   @default(1.0)
  wasStreakBroken   Boolean  @default(false)
  usedStreakShield  Boolean  @default(false)
}
```

**Migration:**
```bash
pnpm prisma migrate dev --name add_streaks
```

### API Endpoints

#### 1. GET `/api/users/[wallet]/streaks`

**Response:**
```json
{
  "currentStreak": 5,
  "longestStreak": 12,
  "multiplier": 1.2,
  "nextMilestone": {
    "wins": 7,
    "multiplier": 1.3,
    "progress": 0.71
  },
  "streakShields": 1,
  "recentWins": [
    { "betId": "...", "won": true, "timestamp": "..." },
    { "betId": "...", "won": true, "timestamp": "..." }
  ]
}
```

#### 2. POST `/api/betting/place` (Updated)

**Add streak logic:**
```typescript
// Calculate streak multiplier
const user = await getUserStreakData(userId)
const multiplier = calculateStreakMultiplier(user.currentStreak)

// Apply to payout
const basePayout = calculateBasePayout(bet.amount, odds)
const finalPayout = basePayout * multiplier

// Save bet with streak metadata
await prisma.bet.create({
  data: {
    ...betData,
    streakMultiplier: multiplier
  }
})
```

#### 3. POST `/api/betting/resolve` (New)

**Update streaks after resolution:**
```typescript
// For each winning bet
if (bet.isWinner) {
  await prisma.user.update({
    where: { id: bet.userId },
    data: {
      currentStreak: { increment: 1 },
      longestStreak: Math.max(currentStreak + 1, longestStreak),
      consecutiveWins: { increment: 1 }
    }
  })
}

// For each losing bet
if (!bet.isWinner && !bet.usedStreakShield) {
  await prisma.user.update({
    where: { id: bet.userId },
    data: {
      currentStreak: 0,
      wasStreakBroken: true
    }
  })
}
```

### React Components

#### 1. `StreakTracker.tsx`

```tsx
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, Shield, TrendingUp } from 'lucide-react'

export function StreakTracker({ userId }: { userId: string }) {
  const [streakData, setStreakData] = useState(null)
  
  useEffect(() => {
    fetchStreakData()
  }, [userId])
  
  async function fetchStreakData() {
    const res = await fetch(`/api/users/${userId}/streaks`)
    const data = await res.json()
    setStreakData(data)
  }
  
  if (!streakData) return null
  
  const { currentStreak, multiplier, nextMilestone, streakShields } = streakData
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 rounded-xl border-2 border-gold/50"
    >
      {/* Current Streak */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {[...Array(Math.min(currentStreak, 6))].map((_, i) => (
            <Flame
              key={i}
              className="w-5 h-5 text-error animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
          {currentStreak === 0 && (
            <span className="text-void-500">Start your streak!</span>
          )}
        </div>
        
        {streakShields > 0 && (
          <div className="flex items-center gap-1 text-xs text-drift-teal">
            <Shield className="w-4 h-4" />
            <span>{streakShields}x Shield</span>
          </div>
        )}
      </div>
      
      {/* Multiplier */}
      {currentStreak > 2 && (
        <div className="text-center mb-3">
          <div className="text-3xl font-display font-bold text-gold">
            {multiplier.toFixed(1)}x
          </div>
          <div className="text-xs text-void-400">Payout Multiplier</div>
        </div>
      )}
      
      {/* Progress to Next Level */}
      {nextMilestone && (
        <div>
          <div className="flex justify-between text-xs text-void-500 mb-1">
            <span>{currentStreak} wins</span>
            <span>{nextMilestone.wins} wins</span>
          </div>
          <div className="h-2 bg-void-900 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${nextMilestone.progress * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-gold to-error"
            />
          </div>
          <div className="text-xs text-center text-gold mt-1">
            {nextMilestone.wins - currentStreak} more to {nextMilestone.multiplier}x!
          </div>
        </div>
      )}
    </motion.div>
  )
}
```

#### 2. `StreakBrokenModal.tsx`

```tsx
'use client'

import { motion } from 'framer-motion'
import { X } from 'lucide-react'

export function StreakBrokenModal({ 
  streak, 
  onClose 
}: { 
  streak: number
  onClose: () => void 
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 20 }}
        className="glass-card p-8 rounded-2xl max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="text-6xl mb-4">💔</div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">
            Streak Broken
          </h2>
          <p className="text-void-400 mb-6">
            Your {streak}-win streak has ended. Start fresh and aim even higher!
          </p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gold hover:bg-gold/80 text-void-950 font-ui font-semibold rounded-xl transition-all"
          >
            Try Again
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
```

#### 3. Integration into Betting Interface

```tsx
// In apps/web/src/components/betting/BettingInterface.tsx

import { StreakTracker } from './StreakTracker'

export function BettingInterface() {
  return (
    <div>
      {/* Add streak tracker at top */}
      <StreakTracker userId={currentUser.id} />
      
      {/* Existing betting UI */}
      <ChoiceList />
      <BettingForm />
    </div>
  )
}
```

---

## 📊 Expected Impact

### Engagement Metrics

**Before Streaks:**
- Daily active users: 100
- Avg bets/user: 1.2/day
- 7-day retention: 25%
- Session frequency: 2x/week

**After Streaks (Projected):**
- Daily active users: 250 (+150%)
- Avg bets/user: 3.5/day (+192%)
- 7-day retention: 55% (+120%)
- Session frequency: 5x/week (+150%)

**Why It Works:**
1. **Daily check-ins** (don't break streak!)
2. **Loss aversion** (scared to lose multiplier)
3. **Social proof** (longest streak leaderboard)
4. **Progressive rewards** (always next milestone)

### Revenue Impact

**Assumptions:**
- 500 active users
- Avg bet: $50 USDC
- Avg bets/user: 3.5/day (with streaks)
- Platform fee: 2.5%

**Monthly Revenue:**
```
500 users × 3.5 bets/day × $50 × 30 days × 2.5% fee
= $65,625/month
vs $22,500/month without streaks
= +191% revenue increase
```

---

## 🎨 Design Considerations

### Visual Hierarchy
1. **Subtle when no streak** (don't distract)
2. **Prominent at 5+** (celebrate achievement)
3. **Animated at 10+** (full spectacle)

### Accessibility
- Color-blind friendly (not just red/green)
- Screen reader support
- Keyboard navigation

### Mobile
- Sticky header on scroll
- Touch-friendly shield activation
- Haptic feedback on milestone

---

## ✅ Implementation Checklist

### Phase 1: Backend (Day 1)
- [ ] Prisma schema updates
- [ ] Database migration
- [ ] Streak calculation utilities
- [ ] API endpoint: GET `/api/users/[wallet]/streaks`
- [ ] Update: POST `/api/betting/place`
- [ ] New: POST `/api/betting/resolve`
- [ ] Unit tests for streak logic

### Phase 2: Frontend (Day 2)
- [ ] `StreakTracker.tsx` component
- [ ] `StreakBrokenModal.tsx` component
- [ ] `StreakProtectionButton.tsx` component
- [ ] Integration into betting interface
- [ ] Animations with Framer Motion
- [ ] Mobile responsive design

### Phase 3: Polish (Day 3)
- [ ] Leaderboard integration
- [ ] Achievement badges
- [ ] Social sharing
- [ ] Analytics tracking
- [ ] Performance optimization
- [ ] E2E tests

---

## 🚀 Launch Strategy

### Week 1: Soft Launch
- Enable for 10% of users
- Monitor engagement metrics
- Collect feedback
- Fix bugs

### Week 2: Full Launch
- Announce via Twitter/Discord
- Launch contest: "Longest Streak Wins $1K"
- Influencer partnerships
- Press release

### Week 3: Optimization
- A/B test multiplier levels
- Adjust based on data
- Add streak leaderboard
- Introduce streak shields

---

## 📝 Success Metrics

**Track:**
1. **Streak activation rate** (% users who start a streak)
2. **Avg streak length** (mean, median, P90)
3. **Longest streaks** (top 10)
4. **Retention lift** (7-day, 30-day)
5. **Betting frequency increase** (bets/user/day)
6. **Revenue per user** (ARPU)

**Goals:**
- 60% of users start a streak
- Avg streak: 4.2 wins
- Top streaks: 20+ wins
- 30-day retention: 45%+
- +150% betting frequency
- +100% ARPU

---

## 🎯 Why This Is a 10x Feature

1. **Habit Formation** → Daily check-ins become automatic
2. **Loss Aversion** → Users scared to lose progress
3. **Progressive Rewards** → Always a next goal
4. **Social Proof** → Leaderboards create FOMO
5. **Skill Signal** → Streaks = status
6. **Network Effects** → More bettors = better odds = more engagement

**Result:** Users go from casual bettors → addicted streak chasers

---

**Ready to implement? Start with Phase 1 backend! 🚀**
