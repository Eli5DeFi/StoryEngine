# Feature Spec: Personal Betting Analytics Dashboard

## Overview
Comprehensive personal dashboard showing betting history, performance metrics, ROI tracking, and insights. Gamifies the experience and motivates users to improve their prediction skills.

## Core Features

### 1. Performance Overview Card
- **Total Stats:**
  - Total bets placed
  - Total wagered (USDC)
  - Total won (USDC)
  - Net profit/loss
  - ROI percentage
  - Win rate
  - Current streak (wins/losses)
- **Time filters:** All-time, 30d, 7d, 24h
- **Comparison:** vs previous period ("↑15% this week")

### 2. Betting History Table
- **Columns:**
  - Date/time
  - Story + chapter
  - Choice made
  - Amount wagered
  - Odds
  - Status (pending, won, lost)
  - Payout (if won)
  - Profit/loss
- **Filters:**
  - Status (all, pending, won, lost)
  - Date range
  - Story
- **Sort:** by date, amount, profit
- **Search:** by story title
- **Pagination:** 20 per page

### 3. Performance Charts
- **Profit Over Time** - Line chart showing cumulative profit
- **Win Rate Trend** - 7-day rolling average
- **Bet Distribution** - Pie chart (stories betted on)
- **ROI by Story** - Bar chart showing which stories are most profitable

### 4. Insights & Achievements
- **Best Predictions:**
  - Highest payout
  - Best odds beaten
  - Longest win streak
- **Patterns:**
  - "You win more on Choice A type decisions"
  - "Your win rate is highest in Fantasy stories"
  - "You tend to bet early (avg 2h before close)"
- **Achievements:**
  - 🎯 First Bet
  - 🔥 3-Win Streak
  - 💰 First $100 Win
  - 🏆 Top 10 Leaderboard
  - 📈 10+ Bets Placed

### 5. Active Bets Panel
- List of pending bets (pools not yet resolved)
- Live odds updates
- Time until pool closes
- Quick link to story

## Technical Implementation

### API Routes

#### `GET /api/users/[address]/bets`
Returns user's complete betting history
```typescript
{
  bets: [{
    id: string
    poolId: string
    choiceId: string
    amount: number
    odds: number  // at time of bet
    currentOdds: number  // live update
    status: 'PENDING' | 'WON' | 'LOST'
    payout: number | null
    profit: number | null
    createdAt: Date
    resolvedAt: Date | null
    story: {
      id: string
      title: string
    }
    chapter: {
      number: number
      title: string
    }
    choice: {
      text: string
      isChosen: boolean | null
    }
  }]
  stats: {
    totalBets: number
    totalWagered: number
    totalWon: number
    netProfit: number
    roi: number
    winRate: number
    currentStreak: { type: 'win' | 'loss', count: number }
    bestWin: number
    worstLoss: number
  }
  timestamp: Date
}
```

#### `GET /api/users/[address]/performance`
Returns performance analytics data
```typescript
{
  profitTimeSeries: [{
    date: Date
    cumulativeProfit: number
    dailyProfit: number
  }]
  winRateTrend: [{
    date: Date
    winRate: number  // 7-day rolling
  }]
  betDistribution: [{
    storyTitle: string
    betCount: number
    percentage: number
  }]
  roiByStory: [{
    storyTitle: string
    roi: number
    bets: number
  }]
  achievements: [{
    id: string
    title: string
    description: string
    icon: string
    unlockedAt: Date | null
    progress: number  // 0-100
  }]
}
```

#### `GET /api/users/[address]/insights`
AI-generated betting insights
```typescript
{
  patterns: [{
    type: 'win_rate_by_choice_type' | 'timing' | 'story_preference'
    insight: string
    confidence: number
    recommendation: string
  }]
  strengths: string[]
  improvements: string[]
}
```

### Components

#### `components/dashboard/PerformanceOverview.tsx`
- Stats cards with animated counters
- Time filter toggle
- Comparison indicators
- ROI gauge chart

#### `components/dashboard/BettingHistoryTable.tsx`
- Data table with filters and sort
- Status badges (pending, won, lost)
- Profit/loss color coding
- Click to view story

#### `components/dashboard/PerformanceCharts.tsx`
- Recharts integration
- Responsive charts
- Interactive tooltips
- Export to PNG

#### `components/dashboard/ActiveBetsPanel.tsx`
- Live status of pending bets
- Countdown timers
- Quick actions (view story)

#### `components/dashboard/AchievementsGrid.tsx`
- Achievement cards
- Locked/unlocked states
- Progress bars
- Tooltip descriptions

### Database Queries

**User betting history:**
```sql
SELECT 
  b.id, b.amount, b.won, b.payout, b."createdAt",
  bp.id as "poolId", bp.status as "poolStatus",
  s.id as "storyId", s.title as "storyTitle",
  ch.number as "chapterNumber", ch.title as "chapterTitle",
  c.id as "choiceId", c.text as "choiceText", c."isChosen"
FROM bets b
JOIN betting_pools bp ON b."poolId" = bp.id
JOIN chapters ch ON bp."chapterId" = ch.id
JOIN stories s ON ch."storyId" = s.id
JOIN choices c ON b."choiceId" = c.id
WHERE b."userId" = $1
ORDER BY b."createdAt" DESC
```

**User performance stats:**
```sql
SELECT 
  COUNT(b.id) as "totalBets",
  SUM(b.amount) as "totalWagered",
  SUM(CASE WHEN b.won THEN b.payout ELSE 0 END) as "totalWon",
  SUM(CASE WHEN b.won THEN b.payout ELSE 0 END) - SUM(b.amount) as "netProfit",
  (SUM(CASE WHEN b.won THEN b.payout ELSE 0 END) - SUM(b.amount)) / NULLIF(SUM(b.amount), 0) * 100 as "roi",
  COUNT(CASE WHEN b.won THEN 1 END)::float / NULLIF(COUNT(b.id), 0) * 100 as "winRate",
  MAX(CASE WHEN b.won THEN b.payout - b.amount END) as "bestWin",
  MIN(CASE WHEN NOT b.won THEN -b.amount END) as "worstLoss"
FROM bets b
WHERE b."userId" = $1
```

**Profit time series (daily):**
```sql
SELECT 
  DATE(b."createdAt") as date,
  SUM(CASE WHEN b.won THEN b.payout - b.amount ELSE -b.amount END) as "dailyProfit",
  SUM(SUM(CASE WHEN b.won THEN b.payout - b.amount ELSE -b.amount END)) 
    OVER (ORDER BY DATE(b."createdAt")) as "cumulativeProfit"
FROM bets b
WHERE b."userId" = $1
GROUP BY DATE(b."createdAt")
ORDER BY date ASC
```

## UI Design

### Layout
```
┌─────────────────────────────────────────────────────┐
│  📊 My Betting Dashboard                            │
│  [All Time ▼] [30d] [7d] [24h]                     │
├─────────────────────────────────────────────────────┤
│ Performance Overview                                │
│ ┌──────────┬──────────┬──────────┬──────────┐      │
│ │Total Bets│ Wagered  │   Won    │  Profit  │      │
│ │    47    │ $2,340   │ $3,120   │  +$780   │      │
│ ├──────────┼──────────┼──────────┼──────────┤      │
│ │ Win Rate │   ROI    │  Streak  │Best Win  │      │
│ │  63.8%   │ +33.3%   │ 🔥 W3    │ $450     │      │
│ └──────────┴──────────┴──────────┴──────────┘      │
├─────────────────────────────────────────────────────┤
│ 📈 Profit Over Time                                 │
│ [Line chart showing cumulative profit]              │
├─────────────────────────────────────────────────────┤
│ 🎯 Betting History                                  │
│ [Filters: Status ▼ | Date Range ▼ | Search]        │
│ ┌────────────────────────────────────────────────┐  │
│ │Date      │Story     │Choice  │Bet │Status│P/L │  │
│ ├────────────────────────────────────────────────┤  │
│ │Feb 10 9am│Voidborne │A       │$50 │Won   │+$75│  │
│ │Feb 9 3pm │Echoes    │B       │$25 │Lost  │-$25│  │
│ └────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────┤
│ 🏆 Achievements                                     │
│ [Grid of achievement cards - locked/unlocked]       │
└─────────────────────────────────────────────────────┘
```

## Success Metrics
- **Engagement:** 40%+ of users visit dashboard weekly
- **Retention:** Users with dashboard access return 2x more
- **Motivation:** Users who see insights increase betting 30%
- **Social sharing:** 10%+ share achievements on Twitter

## Gamification Elements
- **Streaks:** Win/loss streaks with fire emoji
- **Achievements:** Unlock badges for milestones
- **Leaderboard rank:** Show "You're #47 of 2,341"
- **Progress bars:** Visual progress toward next achievement
- **Comparative insights:** "You're beating 73% of users"

## Privacy Settings
- **Public profile toggle:** Show/hide stats on leaderboard
- **Hide bet amounts:** Show "bet placed" without amount
- **Anonymous mode:** Don't appear in recent activity feed

## Phase 2 Enhancements (Future)
- Export betting history as CSV
- AI prediction assistant ("Based on your history, consider...")
- Bet simulator (test strategies without real money)
- Social: Compare stats with friends
- NFT badges for top achievements
