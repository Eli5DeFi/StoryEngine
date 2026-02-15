# VOIDBORNE: THE SILENT THRONE
## Master Development Roadmap

**Status:** Phase 1 Complete ✅  
**Next:** Phase 2 - Database Integration  
**Timeline:** Feb 16 - Apr 30, 2026 (10 weeks)  
**Goal:** Launch complete interactive narrative betting platform

---

## 🎯 VISION

Transform Voidborne from static lore site to a fully functional AI-powered narrative betting platform where:
- Users read branching sci-fi story chapters
- Bet USDC on which path AI will choose
- Influence the narrative through collective decisions
- Explore deep lore (Houses, Protocols, Characters)
- Track reputation, progression, and winnings

---

## ✅ PHASE 1: LORE FOUNDATION (COMPLETE)

**Duration:** Feb 10-15, 2026 (6 days)  
**Status:** ✅ SHIPPED

### Deliverables
- [x] 26 static lore routes (7 Houses, 14 Protocols, 5 Characters)
- [x] Brand-compliant landing page (Strand aesthetics)
- [x] Navigation system with breadcrumbs
- [x] Cross-linked lore entries
- [x] Mobile responsive design
- [x] Vercel deployment pipeline

### Metrics
- 39 files, 4,240 lines added
- All routes returning 200 OK
- Brand guide compliance: 100%

---

## 🗄️ PHASE 2: DATABASE INTEGRATION (Feb 17-22, 2026)

**Duration:** 6 days  
**Goal:** Make lore dynamic, prepare for user interactions

### Week 1: Schema & Migration (Days 1-3)

**Prisma Schema Extensions:**
```prisma
// houses.prisma
model House {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  description String   @db.Text
  primaryColor String  // Hex color
  strandType  String   // G, L, S, R, C, Ø
  territory   String
  population  Int
  reputation  Int      @default(500)
  
  // Relations
  protocols   Protocol[]
  characters  Character[]
  users       UserHouse[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// protocols.prisma
model Protocol {
  id           String   @id @default(cuid())
  slug         String   @unique
  code         String   // SR-01, NL-∅, etc.
  name         String
  description  String   @db.Text
  strandType   String   // Primary Strand
  spectrum     String   // HARD, SOFT, HYBRID
  orderRange   String   // "7-9", "4-6"
  cost         String   @db.Text
  
  // Relations
  house        House    @relation(fields: [houseId], references: [id])
  houseId      String
  characters   CharacterProtocol[]
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

// characters.prisma
model Character {
  id           String   @id @default(cuid())
  slug         String   @unique
  name         String
  title        String?
  house        House    @relation(fields: [houseId], references: [id])
  houseId      String
  bio          String   @db.Text
  age          Int?
  protocols    CharacterProtocol[]
  
  // Progression
  level        Int      @default(1)
  experience   Int      @default(0)
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model CharacterProtocol {
  character    Character @relation(fields: [characterId], references: [id])
  characterId  String
  protocol     Protocol  @relation(fields: [protocolId], references: [id])
  protocolId   String
  mastery      Int       @default(1) // 1-10
  
  @@id([characterId, protocolId])
}

// user-lore.prisma
model UserHouse {
  user         User     @relation(fields: [userId], references: [id])
  userId       String
  house        House    @relation(fields: [houseId], references: [id])
  houseId      String
  reputation   Int      @default(0)
  rank         String   @default("Initiate")
  
  @@id([userId, houseId])
}
```

**Tasks:**
- [ ] Day 1: Write complete Prisma schema extensions
- [ ] Day 2: Create migration scripts
- [ ] Day 2: Seed database with existing lore content
- [ ] Day 3: Test migrations locally
- [ ] Day 3: Deploy to production database

### Week 1: API Routes (Days 4-6)

**API Endpoints:**
```typescript
// GET /api/lore/houses
// GET /api/lore/houses/[slug]
// GET /api/lore/protocols
// GET /api/lore/protocols/[slug]
// GET /api/lore/characters
// GET /api/lore/characters/[slug]
// POST /api/lore/houses/[slug]/join (user joins house)
// POST /api/lore/houses/[slug]/reputation (update rep)
```

**Tasks:**
- [ ] Day 4: Build CRUD API routes for Houses
- [ ] Day 5: Build CRUD API routes for Protocols
- [ ] Day 5: Build CRUD API routes for Characters
- [ ] Day 6: Add user-house relationship endpoints
- [ ] Day 6: Test all endpoints, write API docs

### Success Metrics
- ✅ All lore content migrated from static → database
- ✅ 9+ API routes functional
- ✅ Lore pages now pull from database
- ✅ No performance regression (<200ms response)

---

## 📖 PHASE 3: STORY CONTENT (Feb 23 - Mar 8, 2026)

**Duration:** 14 days (2 weeks)  
**Goal:** Write complete Chapter 1 with branching narrative

### Week 2: Story Writing (Feb 23-29)

**Chapter 1 Outline:**
```
CHAPTER 1: THE CONCLAVE CONVENES
Setting: Valdris Cathedral-Ship "The Geodesic"
POV: Sera Valdris

OPENING:
- Emperor Idris IX dies (Ø-Strand failure)
- Silent Throne empty for first time in 300 years
- Five Houses召oned to Grand Conclave

RISING ACTION:
- Sera arrives, senses Lattice disturbance
- Meets other heirs (Rael, Lienne, Kael, Ash)
- Political maneuvering begins
- Ancient Protocol activation detected

DECISION POINT 1:
Choice A: Investigate Protocol activation (risky, knowledge)
Choice B: Form alliance with Meridian (political, safe)
Choice C: Challenge Kael-Thuun directly (aggressive, honor)

CONSEQUENCES:
A → Discovers Proof conspiracy, gains enemy
B → Political capital, delays confrontation
C → Duel, establishes dominance or weakness

CLIFFHANGER:
- Lattice anomaly intensifies
- Someone has activated a forbidden Protocol
- The Throne begins to... respond
```

**Tasks:**
- [ ] Day 1-2: Write opening scene (3,000 words)
- [ ] Day 3-4: Write character introductions (2,500 words)
- [ ] Day 5-6: Write decision point setup (2,000 words)
- [ ] Day 7: Write all 3 branch outcomes (3,000 words)
- [ ] Day 7: Edit, polish, brand voice consistency

### Week 3: Story Integration (Mar 1-8)

**Database Schema:**
```prisma
model Story {
  id          String    @id @default(cuid())
  slug        String    @unique
  title       String
  description String    @db.Text
  status      String    // ACTIVE, PAUSED, COMPLETE
  chapters    Chapter[]
  createdAt   DateTime  @default(now())
}

model Chapter {
  id            String    @id @default(cuid())
  storyId       String
  story         Story     @relation(fields: [storyId], references: [id])
  number        Int
  title         String
  content       String    @db.Text
  status        String    // READING, BETTING, LOCKED, RESOLVED
  
  // Betting
  bettingPool   BettingPool?
  branches      Branch[]
  chosenBranch  Branch?   @relation("ChosenBranch", fields: [chosenBranchId], references: [id])
  chosenBranchId String?
  
  createdAt     DateTime  @default(now())
  resolvedAt    DateTime?
}

model Branch {
  id          String    @id @default(cuid())
  chapterId   String
  chapter     Chapter   @relation(fields: [chapterId], references: [id])
  index       Int       // 0, 1, 2
  title       String
  preview     String    @db.Text
  outcome     String    @db.Text // What happens if chosen
  
  // Lore connections
  houseFavor  String?   // Which house benefits
  protocolUsed String?  // Which protocol is used
  
  bets        Bet[]
  chosenBy    Chapter[] @relation("ChosenBranch")
}
```

**Tasks:**
- [ ] Day 8: Extend Prisma schema for stories
- [ ] Day 9: Create story seeding script
- [ ] Day 10: Build story reading UI
- [ ] Day 11: Add branch preview cards
- [ ] Day 12: Integrate lore connections (house colors, protocol refs)
- [ ] Day 13: Add progress tracking
- [ ] Day 14: Test complete reading flow

### Success Metrics
- ✅ 10,000+ word Chapter 1 written
- ✅ 3 compelling narrative branches
- ✅ Lore integration (Houses, Protocols referenced)
- ✅ Reading experience matches brand guide
- ✅ Users can read full chapter

---

## 💰 PHASE 4: BETTING MECHANICS (Mar 9-22, 2026)

**Duration:** 14 days (2 weeks)  
**Goal:** Full betting cycle functional (bet → AI decides → payout)

### Week 4: Smart Contracts (Mar 9-15)

**Contract Architecture:**
```solidity
// BettingPool.sol
contract BettingPool {
    uint256 public chapterId;
    uint256 public deadline;
    
    mapping(uint8 => uint256) public branchTotals; // 0, 1, 2
    mapping(address => mapping(uint8 => uint256)) public userBets;
    
    uint8 public winningBranch;
    bool public resolved;
    
    function placeBet(uint8 branchIndex) external payable;
    function resolve(uint8 _winningBranch) external onlyOwner;
    function claim() external;
}
```

**Tasks:**
- [ ] Day 1-2: Write BettingPool.sol contract
- [ ] Day 2: Write tests (100% coverage)
- [ ] Day 3: Deploy to Base testnet
- [ ] Day 4: Audit & security review
- [ ] Day 5: Deploy to Base mainnet
- [ ] Day 6-7: Build TypeScript SDK (viem integration)

### Week 5: Betting UI & Backend (Mar 16-22)

**Features:**
- Betting interface (amount, branch selection)
- Pool stats (total pot, odds, time remaining)
- Transaction handling (wallet connection, confirmations)
- Claim winnings UI

**API Routes:**
```typescript
// POST /api/betting/pools - Create new pool
// GET /api/betting/pools/[id] - Get pool details
// POST /api/betting/pools/[id]/bet - Place bet (triggers contract)
// GET /api/betting/pools/[id]/stats - Pool statistics
// POST /api/betting/pools/[id]/resolve - Resolve pool (admin)
// POST /api/betting/pools/[id]/claim - Claim winnings
```

**Tasks:**
- [ ] Day 8: Build betting UI components
- [ ] Day 9: Integrate wallet connection (RainbowKit)
- [ ] Day 10: Wire up contract calls (placeBet)
- [ ] Day 11: Build admin resolution interface
- [ ] Day 12: Build claim winnings flow
- [ ] Day 13: Add real-time pool updates
- [ ] Day 14: End-to-end betting test

### AI Decision Engine (Placeholder)

**For MVP:** Admin manually resolves based on narrative coherence  
**Future:** AI model weights:
- Narrative coherence (40%)
- Market sentiment (30%)
- Dramatic tension (20%)
- Lore consistency (10%)

### Success Metrics
- ✅ Smart contract deployed on Base mainnet
- ✅ Users can bet USDC on branches
- ✅ Real-time pool stats display
- ✅ Winners can claim payouts
- ✅ Complete betting cycle: bet → resolve → claim

---

## ⚡ PHASE 5: INTERACTIVE FEATURES (Mar 23 - Apr 13, 2026)

**Duration:** 21 days (3 weeks)  
**Goal:** Rich user experience, progression, discovery

### Week 6: Searchable Codex (Mar 23-29)

**Features:**
- Full-text search across all lore
- Filters (Houses, Protocols, Characters)
- Highlighted results
- Related entries

**Tech:**
- Postgres full-text search OR Algolia
- Search API endpoint
- Debounced search UI

**Tasks:**
- [ ] Day 1-2: Implement search backend
- [ ] Day 3-4: Build search UI
- [ ] Day 5: Add filters and sorting
- [ ] Day 6: Add search analytics
- [ ] Day 7: Polish and optimize

### Week 7: Character Progression (Mar 30 - Apr 5)

**System:**
```typescript
// User gains XP by:
// - Reading chapters (+50 XP)
// - Placing bets (+25 XP)
// - Winning bets (+100 XP)
// - Joining a house (+200 XP)

interface UserProgression {
  level: number
  experience: number
  totalWinnings: number
  houseLoyalty: string
  protocolsMastered: string[]
  achievements: Achievement[]
}
```

**Tasks:**
- [ ] Day 1-2: Design XP system
- [ ] Day 3: Implement progression backend
- [ ] Day 4-5: Build progression UI (profile page)
- [ ] Day 6: Add achievement badges
- [ ] Day 7: Leaderboards

### Week 8: House Reputation (Apr 6-13)

**System:**
- Users join a House
- Earn reputation through:
  - Betting on house-aligned branches
  - Winning bets that favor your house
  - Reading house-related lore
- Reputation unlocks:
  - House-exclusive content
  - Betting bonuses
  - Special achievements

**Tasks:**
- [ ] Day 1-2: Design reputation mechanics
- [ ] Day 3-4: Build house join flow
- [ ] Day 5-6: Reputation tracking & display
- [ ] Day 7: House leaderboards

### Success Metrics
- ✅ Users can search all lore (<500ms)
- ✅ XP and leveling system functional
- ✅ Users can join houses and earn reputation
- ✅ Leaderboards display top players

---

## 🚀 PHASE 6: POLISH & LAUNCH (Apr 14-30, 2026)

**Duration:** 17 days  
**Goal:** Production-ready, marketed, launched

### Week 9: Analytics & Optimization (Apr 14-20)

**Analytics:**
- [ ] Plausible or Mixpanel integration
- [ ] Track: reads, bets, wins, bounces
- [ ] Conversion funnels
- [ ] Performance monitoring (Sentry)

**Optimization:**
- [ ] Lighthouse score >90
- [ ] Image optimization
- [ ] Code splitting
- [ ] Database query optimization
- [ ] Caching strategy

### Week 10: Marketing & Launch (Apr 21-27)

**Marketing Assets:**
- [ ] Landing page final polish
- [ ] Demo video (2 min)
- [ ] Twitter thread (10 tweets)
- [ ] Press kit
- [ ] Documentation site

**Launch Checklist:**
- [ ] Security audit
- [ ] Legal review (ToS, Privacy Policy)
- [ ] Customer support system
- [ ] Monitoring dashboards
- [ ] Backup & recovery plan

**Launch Channels:**
- [ ] ProductHunt
- [ ] Hacker News
- [ ] r/web3
- [ ] Crypto Twitter
- [ ] Base ecosystem Discord

### Week 10+: Post-Launch (Apr 28-30)

- [ ] Monitor analytics
- [ ] Fix critical bugs
- [ ] Gather user feedback
- [ ] Plan Chapter 2

---

## 📊 SUCCESS METRICS

### Phase 2 (Database)
- ✅ All lore in database
- ✅ API response time <200ms
- ✅ Zero data loss during migration

### Phase 3 (Story)
- ✅ 10,000+ words written
- ✅ Reading time: 30-45 min
- ✅ User engagement: >70% finish Chapter 1

### Phase 4 (Betting)
- ✅ $10K+ TVL in first week
- ✅ 100+ unique bettors
- ✅ Zero smart contract exploits

### Phase 5 (Features)
- ✅ 500+ user profiles created
- ✅ 50+ searches per day
- ✅ Users join houses: >80%

### Phase 6 (Launch)
- ✅ 1,000+ unique visitors in week 1
- ✅ 100+ wallet connections
- ✅ ProductHunt: Top 10 of the day

---

## 🛠️ TECH STACK

**Frontend:**
- Next.js 14, React, TypeScript
- TailwindCSS + brand guide styles
- RainbowKit + wagmi + viem
- Framer Motion (animations)

**Backend:**
- Prisma ORM
- PostgreSQL (Vercel Postgres)
- Next.js API routes
- Vercel serverless

**Blockchain:**
- Base (L2)
- Solidity smart contracts
- USDC for betting
- viem for contract interactions

**Infrastructure:**
- Vercel (hosting)
- GitHub (code)
- Sentry (monitoring)
- Plausible (analytics)

---

## 💡 DEFERRED / FUTURE

**Phase 7+:**
- Protocol demonstrations (3D visualization)
- Multiplayer collaborative betting
- AI-generated branch expansions
- NFT achievements
- DAO governance
- Mobile app (React Native)

---

## 🎯 IMMEDIATE NEXT STEPS (Feb 16, 2026)

**Tomorrow (Day 1 - Feb 16):**
1. ✅ Create this master roadmap
2. Design complete Prisma schema extensions
3. Set up local database for testing
4. Write migration scripts

**This Week (Feb 16-22):**
- Complete Phase 2 (Database Integration)
- Migrate all static lore to database
- Build 9+ API routes
- Test dynamic lore pages

**Ready to start?** 🚀

Say "let's go" and I'll begin Phase 2: Database Integration!
