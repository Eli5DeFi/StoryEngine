# Quick Start: New Features (Badges & Sharing)

## TL;DR

Two new features implemented for Voidborne:

1. **🎯 Achievement Badges & Streaks** - Gamification to increase engagement
2. **📱 Social Sharing with OG Images** - Viral growth via beautiful shareable content

---

## 🚀 Deployment Steps

### 1. Database Migration

```bash
cd packages/database

# Apply migration
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 2. Verify Tables Created

```sql
SELECT * FROM badges;
SELECT * FROM user_badges;
SELECT current_streak, longest_streak FROM users LIMIT 5;
```

### 3. Test API Endpoints

```bash
# List all badges
curl http://localhost:3000/api/badges

# Get user badges (replace USER_ID)
curl http://localhost:3000/api/badges/USER_ID

# Generate share link (POST)
curl -X POST http://localhost:3000/api/share \
  -H "Content-Type: application/json" \
  -d '{"type":"bet","betId":"BET_ID"}'

# Test OG image
open "http://localhost:3000/api/share/og?type=bet&storyTitle=Test%20Story&choice=Choice%20A&amount=100&potentialWin=200&username=Alice&streak=5&badges=🎯🔥"
```

### 4. Frontend Integration

Add share buttons to key pages:

**After Bet Placement (`apps/web/src/app/story/[storyId]/page.tsx`):**
```tsx
import { ShareButton } from '@/components/share/ShareButton'

// After successful bet
<ShareButton type="bet" betId={betId} />
```

**Win Modal:**
```tsx
<div className="win-celebration">
  <h2>🎉 You Won ${payout}!</h2>
  <ShareButton type="win" betId={betId} label="Share Win" />
</div>
```

**Profile Page:**
```tsx
import { BadgeDisplay } from '@/components/badges/BadgeDisplay'
import { StreakIndicator } from '@/components/badges/StreakIndicator'

<BadgeDisplay badges={user.badges} maxDisplay={5} size="lg" />
<StreakIndicator currentStreak={user.currentStreak} longestStreak={user.longestStreak} />
```

---

## 🎨 Usage Examples

### Display User Badges

```tsx
import { BadgeDisplay } from '@/components/badges/BadgeDisplay'

<BadgeDisplay
  badges={[
    {
      id: 'badge_1',
      name: 'First Blood',
      description: 'Place your first bet',
      icon: '🎯',
      rarity: 'COMMON',
      earnedAt: new Date()
    }
  ]}
  maxDisplay={3}
  size="md"
  showTooltip={true}
/>
```

### Show Win Streak

```tsx
import { StreakIndicator } from '@/components/badges/StreakIndicator'

<StreakIndicator
  currentStreak={7}
  longestStreak={12}
  size="md"
  showLabel={true}
/>
```

### Add Share Button

```tsx
import { ShareButton } from '@/components/share/ShareButton'

<ShareButton
  type="bet"
  betId="bet_123"
  label="Share"
  variant="default"
/>
```

---

## 📊 Initial Badges

| Emoji | Name | Rarity | Criteria | Value |
|-------|------|--------|----------|-------|
| 🎯 | First Blood | Common | Winning bets | 1 |
| 🔥 | Hot Streak | Rare | Win streak | 3 |
| ⚡ | Perfect Week | Epic | Win streak | 7 |
| 👑 | Legendary Predictor | Legendary | Win streak | 15 |
| 🐋 | High Roller | Epic | Total wagered | $10,000 |
| 💰 | Profit King | Rare | Total profit | $1,000 |
| 💎 | Diamond Hands | Legendary | Total bets | 100 |

---

## 🔧 Backend Services

### Award Badges After Bet

```typescript
import { checkAndAwardBadges } from '@/lib/badges'

// After bet placed or resolved
await checkAndAwardBadges(userId)
```

### Update Streak

```typescript
import { updateUserStreak } from '@/lib/badges'

// After bet is resolved
await updateUserStreak(userId, won)
```

---

## 🎯 Key Metrics to Track

### Badges & Streaks
- Daily Active Users (DAU) - Target: +20%
- 7-day retention - Target: +25%
- Users with active streak (3+) - Target: 40%
- Average badges per user - Target: 2.5

### Social Sharing
- Share button click rate - Target: 15%
- Shares per winning bet - Target: 30%
- New users from shares - Track via UTM
- Viral coefficient (K-factor) - Target: 0.3+

---

## 📝 Next Steps

1. **Deploy to Staging**
   - Test migration
   - Verify badge awarding
   - Test share flow
   - Validate OG images

2. **Integrate Share Buttons**
   - Bet confirmation page
   - Win celebration modal
   - Leaderboard
   - Profile page

3. **Monitor & Iterate**
   - Track badge distribution
   - Monitor share metrics
   - A/B test share text
   - Add more badges based on data

4. **Future Enhancements**
   - Seasonal/limited badges
   - Share-to-earn rewards
   - Video OG images
   - Referral tracking

---

## 📚 Full Documentation

See `docs/FEATURES_BADGES_AND_SHARING.md` for complete technical specs, implementation details, and API reference.

---

## 🐛 Troubleshooting

**Badges not awarding?**
- Check `checkAndAwardBadges()` is called after bet placement
- Verify user stats are accurate in DB
- Check console logs for errors

**OG images not showing?**
- Test URL directly in browser
- Validate with Twitter Card Validator
- Check Edge Function logs
- Verify image is < 200KB

**Streaks not updating?**
- Ensure `updateUserStreak()` called after resolution
- Check `lastBetDate` is being updated
- Verify streak logic (consecutive days)

---

**Status**: ✅ Implemented | ⏳ Testing & Integration Pending  
**Commit**: `64727a0`  
**Date**: February 11, 2026
