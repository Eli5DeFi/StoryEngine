# Voidborne Evolution Cycle 14: New Features

**Date:** February 14, 2026  
**Status:** ✅ READY FOR IMPLEMENTATION

---

## 🎯 Feature 1: Real-Time Odds Dashboard with Live Betting Chart

### Overview
Transform betting from static UI into a **live, addictive experience** with real-time odds charts, market sentiment indicators, and competitive pressure displays.

### Problem Solved
- Current betting feels isolated (no sense of competition)
- Users don't see how odds change over time
- No urgency/FOMO to bet early vs. late
- Missing the "stock market" excitement of live trading

### Solution
Interactive real-time dashboard showing:
1. **Live Odds Chart** (TradingView-style candlestick/line chart)
2. **Market Sentiment Gauge** (community pulse: bullish/bearish)
3. **Whale Alert** (big bets trigger visual notifications)
4. **Time Pressure Indicator** (pool closing countdown with accelerating urgency)
5. **Social Proof** ("47 people just bet on Choice A")

### Key Features

#### 1.1 Live Odds Chart Component
```typescript
<LiveOddsChart
  poolId={poolId}
  choices={choices}
  updateInterval={5000} // 5 seconds
  chartType="line" // or "candlestick"
/>
```

**Features:**
- Real-time updates via WebSocket or polling
- Hover to see exact odds at any timestamp
- Zoom/pan timeline (last hour, 12h, 24h, all time)
- Compare up to 4 choices simultaneously
- Export chart as image for sharing

#### 1.2 Market Sentiment Indicators
```typescript
<MarketSentiment
  poolId={poolId}
  showWhaleAlerts={true}
  showRecentBets={true}
  showMomentum={true}
/>
```

**Metrics:**
- **Momentum Score:** Rate of odds change (rising/falling)
- **Whale Alerts:** Bets >$500 trigger visual popup
- **Hot Choice Badge:** Choice with most recent activity
- **Consensus Strength:** How evenly distributed vs. concentrated

#### 1.3 Time Pressure UI
```typescript
<PoolClosingTimer
  closesAt={pool.closesAt}
  style="urgent" // or "calm"
/>
```

**Visual states:**
- `>24h`: Calm green timer
- `12-24h`: Yellow, slight pulse
- `1-12h`: Orange, faster pulse
- `<1h`: Red, dramatic pulsing + urgent messaging
- `<15min`: CRITICAL - full-screen takeover option

### Technical Implementation

#### Database (Already exists!)
```prisma
model OddsSnapshot {
  id            String   @id
  poolId        String
  choiceOdds    Json     // { "choice_1": 0.65, ... }
  totalPool     Decimal
  totalBets     Int
  createdAt     DateTime
}
```

#### API Routes

**GET /api/pools/[poolId]/odds**
```typescript
// Return recent odds snapshots
{
  snapshots: [
    { timestamp: "2026-02-14T05:00:00Z", odds: { ... } },
    ...
  ],
  current: { ... },
  stats: {
    momentum: 0.15, // +15% change in last hour
    whales: 3, // Number of >$500 bets
    recentBetCount: 47 // Last 15 minutes
  }
}
```

**POST /api/pools/[poolId]/snapshots**
```typescript
// Background cron job - capture odds every 5 minutes
// Called by server-side job
```

#### Components Structure
```
apps/web/src/components/betting/
├── LiveOddsChart.tsx         # Main chart component (recharts)
├── MarketSentiment.tsx       # Sentiment indicators
├── PoolClosingTimer.tsx      # Countdown with urgency states
├── WhaleAlert.tsx            # Popup for large bets
└── OddsComparison.tsx        # Multi-choice comparison
```

#### Tech Stack
- **Charts:** Recharts (already in deps) or Chart.js
- **Real-time:** Polling every 5s (WebSocket v2)
- **State:** React Query for caching/auto-refresh
- **Animations:** Framer Motion for smooth transitions

### UX Flow

1. **User lands on story page**
   - See current odds (static)
   - "View Live Chart" button appears

2. **Click to expand live dashboard**
   - Chart slides in from right
   - Starts animating with recent data
   - Shows last 24h by default

3. **While viewing chart**
   - New bets appear as dots on timeline
   - Whale bets trigger popup notification
   - Timer shows urgency level
   - "Place Bet" CTA pulses when <1h remaining

4. **After placing bet**
   - User's bet appears on chart (different color)
   - Can compare their timing vs. others
   - Receives "Smart Bet" badge if bet when odds favorable

### Gamification

**New Badges:**
- 🎯 **Early Bird:** Bet within first hour of pool opening
- 📈 **Contrarian:** Bet against majority and win
- ⚡ **Speed Demon:** Bet in final 5 minutes
- 🐋 **Whale Watcher:** Win after following a whale bet

### Success Metrics
- **Session time:** +300% (users check odds constantly)
- **Bet volume:** +150% (urgency creates FOMO)
- **Repeat visits:** +200% (addictive live data)
- **Social sharing:** +400% (chart screenshots)

---

## 🎯 Feature 2: Character Memory Graph & Story Branching Visualizer

### Overview
Transform Voidborne from "choose your own adventure" to **"persistent story universe"** where characters remember past decisions, relationships evolve, and players can visualize story branches.

### Problem Solved
- Stories feel episodic (no continuity between chapters)
- No character development tracking
- Players can't see how their bets shaped the story
- No "what-if" replay value

### Solution
**Character Memory System** that:
1. Tracks every character's traits, relationships, and memories
2. AI references past events in new chapters
3. Visual story graph shows all possible/actual paths
4. "What-if" mode: replay chapters with different choices

### Key Features

#### 2.1 Character Profile System
```typescript
<CharacterProfile
  characterId="char_001"
  storyId={storyId}
  showMemories={true}
  showRelationships={true}
/>
```

**Displays:**
- Character portrait (AI-generated)
- Current traits (brave, cautious, loyal, etc.)
- Key memories (decisions that affected them)
- Relationships with other characters (graph)
- Appearance timeline (which chapters they appeared in)

#### 2.2 Story Branch Visualizer
```typescript
<StoryGraph
  storyId={storyId}
  mode="actual" // or "possible"
  highlightUserBets={true}
/>
```

**Graph Structure:**
```
Chapter 1
  ├─ Choice A (YOU BET HERE) → Chapter 2A ✅ CHOSEN
  └─ Choice B → Chapter 2B (greyed out)
       └─ Choice B1 → "What if..." preview
```

**Features:**
- Interactive D3.js/Cytoscape graph
- Click any node to see chapter summary
- Hover over greyed paths to see "what would have happened"
- Export as shareable image

#### 2.3 Character Memory AI Integration
**AI Prompt Enhancement:**
```typescript
// When generating new chapter, include character memories
const characterContext = await getCharacterMemories(storyId)

const prompt = `
Continue the story. Remember:

Character: Sarah
- Traits: Brave, impulsive
- Memories:
  * Chapter 3: Saved her brother from fire (Choice A won)
  * Chapter 5: Lost trust of mentor after lying (Choice B won)
- Relationships:
  * Brother Marcus: Deep bond (+0.8)
  * Mentor Dr. Chen: Strained (-0.3)

Generate Chapter 7 showing how Sarah's past decisions affect her current dilemma...
`
```

#### 2.4 "What-If" Scenario Explorer
```typescript
<WhatIfExplorer
  chapterId={chapterId}
  alternateChoiceId={choiceId}
/>
```

**Features:**
- Select any past chapter
- Click the "losing" choice
- AI generates 200-word preview of alternate timeline
- Compare: "If Choice B had won, Sarah would have..."
- Cache previews (don't regenerate every time)

### Database Schema Changes

```prisma
// New models
model Character {
  id            String   @id @default(cuid())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  storyId       String
  story         Story    @relation(fields: [storyId], references: [id], onDelete: Cascade)
  
  // Profile
  name          String
  description   String   @db.Text
  portrait      String?  // AI-generated image URL
  
  // AI-tracked traits (JSON)
  // Format: { "brave": 0.8, "cautious": 0.2, "loyal": 0.9 }
  traits        Json     @default("{}")
  
  // Appearance tracking
  firstAppearance Int    // Chapter number
  lastAppearance  Int    // Chapter number
  totalAppearances Int   @default(0)
  
  // Relationships
  memories      CharacterMemory[]
  relationships CharacterRelationship[] @relation("CharacterA")
  relatedTo     CharacterRelationship[] @relation("CharacterB")
  
  @@unique([storyId, name])
  @@index([storyId])
  @@map("characters")
}

model CharacterMemory {
  id            String   @id @default(cuid())
  createdAt     DateTime @default(now())
  
  characterId   String
  character     Character @relation(fields: [characterId], references: [id], onDelete: Cascade)
  
  chapterId     String
  choiceId      String?  // Winning choice that created this memory
  
  // Memory content
  eventType     MemoryType
  description   String   @db.Text
  emotionalImpact Float  // -1.0 (traumatic) to +1.0 (joyful)
  importance    Int      // 1-10 (how much this shapes character)
  
  @@index([characterId])
  @@index([chapterId])
  @@map("character_memories")
}

enum MemoryType {
  DECISION       // Character made a choice
  RELATIONSHIP   // Interaction with another character
  REVELATION     // Learned something important
  TRAUMA         // Negative event
  ACHIEVEMENT    // Positive accomplishment
}

model CharacterRelationship {
  id            String   @id @default(cuid())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  characterAId  String
  characterA    Character @relation("CharacterA", fields: [characterAId], references: [id], onDelete: Cascade)
  
  characterBId  String
  characterB    Character @relation("CharacterB", fields: [characterBId], references: [id], onDelete: Cascade)
  
  // Relationship score: -1.0 (enemies) to +1.0 (best friends)
  score         Float    @default(0)
  relationshipType RelationType
  
  // How this evolved
  history       Json     @default("[]")
  // Format: [{ chapter: 3, event: "Sarah saved Marcus", delta: +0.3 }]
  
  @@unique([characterAId, characterBId])
  @@index([characterAId])
  @@index([characterBId])
  @@map("character_relationships")
}

enum RelationType {
  FAMILY
  FRIEND
  ROMANTIC
  RIVAL
  MENTOR
  ENEMY
  ALLY
  NEUTRAL
}

model AlternateOutcome {
  id            String   @id @default(cuid())
  createdAt     DateTime @default(now())
  
  chapterId     String
  choiceId      String   // The choice that DIDN'T win
  
  // AI-generated preview
  preview       String   @db.Text
  fullContent   String?  @db.Text // Optional: full alternate chapter
  
  // Metadata
  aiModel       String
  generated     Boolean  @default(false)
  viewCount     Int      @default(0)
  
  @@unique([chapterId, choiceId])
  @@index([chapterId])
  @@map("alternate_outcomes")
}
```

### Technical Implementation

#### API Routes

**GET /api/stories/[storyId]/characters**
```typescript
// Return all characters with relationships
{
  characters: [
    {
      id: "char_001",
      name: "Sarah",
      traits: { brave: 0.8, impulsive: 0.6 },
      memories: [...],
      relationships: [...]
    }
  ]
}
```

**GET /api/chapters/[chapterId]/what-if/[choiceId]**
```typescript
// Generate or return cached alternate outcome
{
  preview: "If Sarah had chosen to flee...",
  generatedAt: "2026-02-14T05:00:00Z",
  cached: true
}
```

**POST /api/characters/extract**
```typescript
// Background job: AI extracts characters from chapter
// Called after chapter published
{
  chapterId: "chap_123",
  characters: ["Sarah", "Marcus", "Dr. Chen"],
  memories: [...],
  relationships: [...]
}
```

#### Components Structure
```
apps/web/src/components/characters/
├── CharacterProfile.tsx      # Profile card
├── CharacterGrid.tsx         # All characters in story
├── RelationshipGraph.tsx     # D3 network graph
├── MemoryTimeline.tsx        # Chronological memory list
└── TraitRadar.tsx            # Radar chart of traits

apps/web/src/components/story/
├── StoryBranchGraph.tsx      # Interactive decision tree
├── WhatIfExplorer.tsx        # Alternate outcome viewer
└── ChapterConnector.tsx      # Visual line between chapters
```

#### AI Integration

**Character Extraction (GPT-4o):**
```typescript
const extractCharacters = async (chapterContent: string) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{
      role: "system",
      content: `Extract characters, traits, and relationships from this chapter.
      
      Return JSON:
      {
        "characters": [
          {
            "name": "Sarah",
            "traits": { "brave": 0.8, "impulsive": 0.6 },
            "memories": [
              {
                "event": "Saved her brother",
                "type": "ACHIEVEMENT",
                "emotionalImpact": 0.9,
                "importance": 10
              }
            ]
          }
        ],
        "relationships": [
          {
            "characterA": "Sarah",
            "characterB": "Marcus",
            "type": "FAMILY",
            "score": 0.9,
            "reason": "Sarah risked her life to save Marcus"
          }
        ]
      }`
    }],
    response_format: { type: "json_object" }
  })
  
  return JSON.parse(response.choices[0].message.content)
}
```

**What-If Generation (Claude Sonnet):**
```typescript
const generateWhatIf = async (chapter: Chapter, alternateChoice: Choice) => {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4",
    messages: [{
      role: "user",
      content: `Chapter ${chapter.chapterNumber}: "${chapter.content}"
      
      The winning choice was: "${chapter.choices.find(c => c.isChosen)?.text}"
      
      Generate a 200-word preview of what would have happened if this choice had won instead:
      "${alternateChoice.text}"
      
      Keep the same characters and setting, but show how this decision would have changed the outcome.`
    }]
  })
  
  return response.content[0].text
}
```

### UX Flow

#### Character Discovery Flow
1. **User reads Chapter 3**
   - New character "Dr. Chen" appears
   - After reading, see: "1 new character discovered!"

2. **Click to view character**
   - Profile card slides in
   - Shows traits, first appearance, portrait
   - "View all characters" link

3. **Character grid page**
   - All characters as cards
   - Click any card → full profile
   - Relationship graph shows connections

#### Story Graph Flow
1. **User finishes Chapter 5**
   - "View Story Map" button appears
   - Click → full-screen graph

2. **Interactive graph**
   - Current path highlighted in color
   - Greyed-out nodes show "what could have been"
   - Hover over greyed node → tooltip: "What if..."
   - Click → generate alternate preview

3. **What-If exploration**
   - AI generates 200-word preview
   - "This would have changed 3 character relationships"
   - Share button (Twitter, Discord)

### Gamification

**New Badges:**
- 📖 **Lorekeeper:** View all characters in a story
- 🔮 **Oracle:** Generate 10 "what-if" scenarios
- 🎭 **Character Study:** View every character's memories
- 🌳 **Branch Explorer:** View complete story graph

### Success Metrics
- **Story completion rate:** +250% (investment in characters)
- **Return visits:** +400% (check character updates)
- **Social sharing:** +600% (share character profiles, graphs)
- **Premium conversion:** +150% (unlock all what-ifs)

---

## 🚀 Implementation Roadmap

### Week 1: Live Odds Dashboard (Feb 14-20)
- **Day 1-2:** API routes for odds snapshots
- **Day 3-4:** LiveOddsChart component (Recharts)
- **Day 5:** MarketSentiment + WhaleAlert
- **Day 6:** PoolClosingTimer with urgency states
- **Day 7:** Integration + testing

**Deliverable:** Live odds chart on all story pages

### Week 2: Character Memory System (Feb 21-27)
- **Day 1-2:** Database migrations (Character, Memory, Relationship models)
- **Day 3-4:** AI character extraction pipeline
- **Day 5:** CharacterProfile + RelationshipGraph components
- **Day 6:** Integration with chapter generation
- **Day 7:** Testing + backfill existing stories

**Deliverable:** Character profiles on all stories

### Week 3: Story Graph + What-If (Feb 28 - Mar 6)
- **Day 1-2:** StoryBranchGraph component (D3.js)
- **Day 3-4:** AlternateOutcome generation system
- **Day 5:** WhatIfExplorer UI
- **Day 6:** Caching + optimization
- **Day 7:** Launch + marketing

**Deliverable:** Full story graph + what-if explorer

---

## 📊 Expected Impact

### Feature 1: Live Odds Dashboard
- **Engagement:** +300% session time
- **Betting volume:** +150%
- **Viral coefficient:** +400% (chart sharing)

### Feature 2: Character Memory Graph
- **Retention:** +250% 30-day retention
- **Story completion:** +200%
- **Premium conversion:** +150%

### Combined Impact
- **MAU:** +500% (live data + story depth)
- **Revenue:** +350% (higher volume + premium)
- **Network effects:** Stories become shareable universes

---

## 🎨 Design System Integration

### Ruins of the Future Aesthetic

**Live Odds Chart:**
- Glitchy, cyberpunk chart animations
- Neon green/blue gradient lines
- Scanline overlay effect
- Monospace font for numbers
- CRT screen curvature effect

**Character Profiles:**
- Distressed borders (weathered metal)
- AI-generated portraits with VHS artifacts
- Relationship graph: circuit board aesthetic
- Memory cards: holographic shimmer

**Color Palette:**
```typescript
// From tailwind.config.ts
colors: {
  neon: {
    green: '#00ff41',
    blue: '#00d9ff',
    pink: '#ff00ff'
  },
  rust: {
    light: '#8b4513',
    DEFAULT: '#6b3410',
    dark: '#4a2408'
  }
}
```

---

## 🛠️ Technical Stack Summary

### Dependencies (Add to package.json)
```json
{
  "recharts": "^2.10.0",        // Charts
  "d3": "^7.8.5",                // Story graph
  "cytoscape": "^3.28.1",        // Alternative graph library
  "framer-motion": "^10.16.0",   // Animations
  "@tanstack/react-query": "^5.0.0" // Data fetching
}
```

### New API Routes
- `GET /api/pools/[poolId]/odds` - Odds snapshots
- `POST /api/pools/[poolId]/snapshots` - Create snapshot
- `GET /api/stories/[storyId]/characters` - All characters
- `GET /api/chapters/[chapterId]/what-if/[choiceId]` - Alternate outcome
- `POST /api/characters/extract` - Extract from chapter

### Background Jobs (Cron)
- **Every 5 minutes:** Capture odds snapshots for all open pools
- **After chapter published:** Extract characters + memories
- **On user request:** Generate what-if scenarios (rate limited)

---

## 📝 Documentation Updates

### User Guides
- "How to Read Live Odds Charts"
- "Understanding Character Relationships"
- "Exploring What-If Scenarios"

### Developer Docs
- Character Memory AI Prompt Templates
- Odds Snapshot Best Practices
- Graph Visualization Performance Tips

---

## 🎯 Success Definition

**Ship Criteria:**
1. ✅ Live odds chart updates every 5s
2. ✅ Character profiles auto-generated for all stories
3. ✅ Story graph renders <2s for 50+ chapter stories
4. ✅ What-if generation <10s per scenario

**Business Metrics (30 days post-launch):**
1. Session time: 8min → 24min (+200%)
2. Betting volume: $50K/week → $125K/week (+150%)
3. 30-day retention: 15% → 37.5% (+150%)
4. Social shares: 100/week → 600/week (+500%)

---

**Total Estimated Effort:** 3 weeks (1 developer)  
**Risk Level:** Low (leverages existing data models)  
**Launch Date:** March 6, 2026
