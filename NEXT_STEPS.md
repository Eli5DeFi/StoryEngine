# 🚀 NarrativeForge - Next Steps

**Project Status:** Foundation Complete ✅  
**Current Phase:** 1 of 5  
**Ready For:** Core development

---

## ✅ What's Complete

### 1. Project Structure
- [x] Monorepo scaffolding (apps, packages, services)
- [x] Git repository initialized
- [x] Environment variables template
- [x] Docker Compose (Postgres + Redis)
- [x] Package.json with scripts

### 2. Smart Contracts
- [x] `ChapterBettingPool.sol` - Core betting contract (9.6KB)
  - 85/12.5/2.5 split (winners/treasury/ops)
  - Pro-rata reward distribution
  - Emergency cancel function
  - Bet limits and validation
- [x] Comprehensive tests (8.7KB, 13 test cases)
- [x] Deployment script for Base L2
- [x] Foundry configuration

### 3. Documentation
- [x] Comprehensive README
- [x] Full implementation specification (in your prompt)
- [x] Fantasy Story Writer skill installed

---

## 🎯 Immediate Next Steps (Week 1)

### Step 1: Install Dependencies & Initialize Foundry

```bash
cd /Users/eli5defi/.openclaw/workspace/StoryEngine

# Install OpenZeppelin contracts
cd packages/contracts
forge install OpenZeppelin/openzeppelin-contracts --no-commit

# Run tests to verify setup
forge test -vvv

# If tests pass ✅, you're ready to continue!
```

### Step 2: Start Local Development Services

```bash
# Start Postgres + Redis
docker-compose up -d

# Verify services are running
docker ps

# You should see:
# - narrativeforge-postgres (port 5432)
# - narrativeforge-redis (port 6379)
```

### Step 3: Initialize Next.js App

```bash
# Navigate to apps directory
cd apps

# Create Next.js 14 app
npx create-next-app@latest web --typescript --tailwind --app --src-dir --import-alias "@/*"

# Install core dependencies
cd web
pnpm install wagmi viem @rainbow-me/rainbowkit zustand socket.io-client d3
```

### Step 4: Set Up Database Schema

Create `apps/web/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Story {
  id          Int       @id @default(autoincrement())
  title       String
  genre       String?
  setting     String?
  status      String    @default("active")
  worldState  Json      @default("{}")
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  chapters    Chapter[]
  characters  Character[]
  @@index([status])
}

model Chapter {
  id                     Int      @id @default(autoincrement())
  storyId                Int
  chapterNumber          Int
  title                  String?
  content                String
  contentIpfs            String?
  sceneImageUrl          String?
  mood                   String?
  worldStateSnapshot     Json?
  selectedBranchIndex    Int?
  createdAt              DateTime @default(now())
  
  story                  Story    @relation(fields: [storyId], references: [id])
  branches               Branch[]
  bets                   Bet[]
  
  @@unique([storyId, chapterNumber])
  @@index([storyId])
}

model Branch {
  id             Int      @id @default(autoincrement())
  chapterId      Int
  branchIndex    Int
  title          String
  previewText    String
  previewImage   String?
  contentIpfs    String?
  difficulty     String?
  riskLevel      Int?
  isWinner       Boolean  @default(false)
  narrativeScore Decimal?
  createdAt      DateTime @default(now())
  
  chapter        Chapter  @relation(fields: [chapterId], references: [id])
  
  @@unique([chapterId, branchIndex])
}

model Character {
  id               Int      @id @default(autoincrement())
  storyId          Int
  name             String
  title            String?
  status           String   @default("alive")
  role             String?
  portraitUrl      String?
  backstory        String?
  motivation       String?
  traits           String[]
  abilities        String[]
  firstAppearance  Int?
  notableQuotes    String[]
  metadata         Json     @default("{}")
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  story            Story    @relation(fields: [storyId], references: [id])
  
  @@index([storyId])
}

model Bet {
  id             Int      @id @default(autoincrement())
  storyId        Int
  chapterId      Int
  bettorAddress  String
  branchIndex    Int
  amount         Decimal
  isAgent        Boolean  @default(false)
  txHash         String?
  claimed        Boolean  @default(false)
  rewardAmount   Decimal?
  poolContract   String?
  createdAt      DateTime @default(now())
  
  chapter        Chapter  @relation(fields: [chapterId], references: [id])
  
  @@index([bettorAddress])
  @@index([chapterId])
}

model User {
  id            Int      @id @default(autoincrement())
  walletAddress String   @unique
  username      String?
  avatarUrl     String?
  totalBets     Int      @default(0)
  totalWins     Int      @default(0)
  totalWagered  Decimal  @default(0)
  totalWon      Decimal  @default(0)
  isAgent       Boolean  @default(false)
  agentName     String?
  createdAt     DateTime @default(now())
}
```

Then run:

```bash
pnpm prisma generate
pnpm prisma db push
```

---

## 📅 Week-by-Week Development Plan

### Week 1: Foundation ✅ COMPLETE
- [x] Project structure
- [x] Smart contracts
- [x] Tests
- [ ] Database schema → **DO THIS NEXT**
- [ ] Basic Next.js app → **AFTER DATABASE**

### Week 2: Story Engine
- [ ] Create `services/story-engine/`
- [ ] Implement world state manager
- [ ] Implement chapter generator (GPT-4o)
- [ ] Implement branch selector algorithm
- [ ] Implement coherence checker (embeddings)
- [ ] Write tests for story engine

### Week 3: Visual Novel Reader
- [ ] Create VN reader component
- [ ] Implement typewriter text effect
- [ ] Implement scene transitions
- [ ] Character sprite system
- [ ] Background parallax
- [ ] Audio integration (optional)

### Week 4: Betting System
- [ ] Create betting UI components
- [ ] Integrate wagmi + RainbowKit
- [ ] Live odds display (WebSocket)
- [ ] Bet placement flow
- [ ] Reward claiming UI
- [ ] Deploy contracts to Base Sepolia

### Week 5: WebSocket Real-Time
- [ ] Set up Socket.io server
- [ ] Implement real-time odds updates
- [ ] Implement chapter reveal events
- [ ] Implement bet placement broadcasts
- [ ] Test with multiple clients

### Week 6: Compendium System
- [ ] Create compendium extraction service
- [ ] Character profile pages
- [ ] Relationship graph (D3.js)
- [ ] Monster bestiary
- [ ] Timeline component
- [ ] Lore encyclopedia

### Week 7-8: Polish & Testing
- [ ] Mobile responsive design
- [ ] Scene illustration generation
- [ ] Error handling
- [ ] Loading states
- [ ] E2E tests (Playwright)
- [ ] Performance optimization

### Week 9-10: AI Agents
- [ ] Agent registry contract
- [ ] Agent API endpoints
- [ ] Agent SDK documentation
- [ ] Leaderboard (humans + agents)
- [ ] Agent rate limiting

### Week 11: Security Audit
- [ ] Smart contract audit
- [ ] Penetration testing
- [ ] Load testing (k6)
- [ ] Fix security issues
- [ ] Final testing

### Week 12: Launch
- [ ] Deploy to Base Mainnet
- [ ] Deploy frontend to Vercel
- [ ] Beta testing
- [ ] Marketing launch
- [ ] Monitor and iterate

---

## 🔧 Key Implementation Files to Create

### Story Engine (`services/story-engine/`)

**generator.ts**
```typescript
export class ChapterGenerator {
  async generateChapter(
    storyId: number,
    chapterNumber: number,
    worldState: WorldState,
    previousChapters: Chapter[]
  ): Promise<GeneratedChapter>;
  
  async generateBranches(
    chapter: Chapter,
    branchCount: number
  ): Promise<Branch[]>;
}
```

**branchSelector.ts**
```typescript
export class BranchSelector {
  selectWinningBranch(branches: Branch[]): number {
    // Weighted algorithm:
    // 35% narrative quality
    // 25% dramatic tension
    // 20% character arc progression
    // 10% world-building potential
    // 10% entropy (randomness)
  }
}
```

**coherenceChecker.ts**
```typescript
export class CoherenceChecker {
  async checkCoherence(
    newContent: string,
    worldState: WorldState,
    history: string[]
  ): Promise<CoherenceReport>;
  
  async findContradictions(
    newContent: string,
    existingLore: string[]
  ): Promise<Contradiction[]>;
}
```

### Betting Service (`services/betting-service/`)

**poolManager.ts**
```typescript
export class PoolManager {
  async createPool(
    chapterId: number,
    branches: Branch[]
  ): Promise<ContractAddress>;
  
  async lockPool(poolAddress: string): Promise<TxHash>;
  
  async settlePool(
    poolAddress: string,
    winningBranch: number
  ): Promise<TxHash>;
}
```

**oddsCalculator.ts**
```typescript
export class OddsCalculator {
  calculateOdds(bets: Bet[]): BranchOdds[];
  
  calculatePayout(
    betAmount: number,
    branchBets: number,
    totalPool: number
  ): number;
}
```

### Compendium Service (`services/compendium-service/`)

**extractor.ts**
```typescript
export class CompendiumExtractor {
  async extractFromChapter(
    chapter: Chapter
  ): Promise<ExtractionResult>;
  
  async updateCompendium(
    extraction: ExtractionResult,
    currentCompendium: Compendium
  ): Promise<Compendium>;
}
```

---

## 🎨 UI Components to Build

### Visual Novel Reader
- `SceneRenderer.tsx` - Canvas/DOM scene display
- `DialogueBox.tsx` - Typewriter text with character portraits
- `CharacterSprite.tsx` - Animated character images
- `BranchSelector.tsx` - Choose-your-path UI
- `ChapterNav.tsx` - Progress indicator

### Betting Interface
- `BetPanel.tsx` - Main betting interface
- `OddsBar.tsx` - Live odds display per branch
- `BetConfirmModal.tsx` - Wallet approval flow
- `LiveOddsTicker.tsx` - WebSocket-powered ticker
- `RewardClaim.tsx` - Claim winnings

### Compendium
- `CharacterCard.tsx` - Character profile card
- `RelationshipGraph.tsx` - D3.js force-directed graph
- `MonsterCard.tsx` - Bestiary entry
- `TimelineViz.tsx` - Story timeline
- `LoreEntry.tsx` - Encyclopedia article

---

## 🧪 Testing Strategy

### Smart Contracts (Foundry)
```bash
# Run all tests
forge test -vvv

# Test with coverage
forge coverage

# Fuzz testing
forge test --fuzz-runs 10000

# Gas reporting
forge test --gas-report
```

### Backend (Vitest)
```bash
# Run backend tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

### E2E (Playwright)
```bash
# Run E2E tests
pnpm test:e2e

# Interactive mode
pnpm test:e2e --ui

# Specific test
pnpm test:e2e tests/betting-flow.spec.ts
```

### Load Testing (k6)
```bash
# Test betting under load
k6 run tests/load/betting.js

# Test with 1000 virtual users
k6 run --vus 1000 --duration 30s tests/load/betting.js
```

---

## 📚 Resources

### Documentation to Create
- [ ] API specification (REST + WebSocket)
- [ ] Agent SDK documentation
- [ ] Compendium data model
- [ ] Story engine design doc
- [ ] Smart contract architecture

### External Resources
- **Foundry Book**: https://book.getfoundry.sh/
- **wagmi Docs**: https://wagmi.sh/
- **Next.js 14**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **D3.js**: https://d3js.org/
- **Socket.io**: https://socket.io/docs/

---

## 🚨 Critical Success Factors

1. **Story Quality** - AI must generate engaging narratives
2. **Coherence** - World state must remain consistent
3. **Fair Betting** - Branch selection algorithm must be unbiased
4. **Performance** - Sub-200ms API responses, smooth UI
5. **Security** - Smart contracts must be audited and secure

---

## 💡 Quick Wins (Easy Wins to Build Momentum)

1. **Basic VN Reader** - Get typewriter text working first
2. **Mock Story** - Create a hard-coded 3-chapter story for testing
3. **Local Betting** - Test betting flow on Anvil local chain
4. **Character Cards** - Simple UI for character profiles
5. **WebSocket Echo** - Prove real-time updates work

---

## 🎯 Success Metrics

**Week 1:** Database schema complete, Next.js running ✅  
**Week 2:** First AI-generated chapter with 3 branches ✅  
**Week 3:** VN reader displays chapter with typewriter effect ✅  
**Week 4:** First successful bet placed on Sepolia testnet ✅  
**Week 6:** Compendium auto-generates from chapter ✅  
**Week 10:** 10 AI agents actively betting ✅  
**Week 12:** 100 users on mainnet, $10K+ in pools ✅

---

## 🤝 Getting Help

**Stuck on something?** Use these resources:

1. **Smart Contracts**: Ask in Foundry Discord
2. **Next.js**: Check Next.js Discord
3. **AI/LLM**: OpenAI community forum
4. **General**: Twitter [@Eli5defi](https://twitter.com/Eli5defi)

---

## 🎉 Let's Build!

You now have everything you need to start building NarrativeForge.

**Recommended starting point:**

```bash
# 1. Install Foundry dependencies
cd packages/contracts
forge install OpenZeppelin/openzeppelin-contracts --no-commit
forge test -vvv

# 2. Start Docker services
docker-compose up -d

# 3. Initialize Next.js app
cd apps
npx create-next-app@latest web --typescript --tailwind --app

# 4. Set up database
cd web
pnpm add prisma @prisma/client
# Copy schema from above, then:
pnpm prisma generate
pnpm prisma db push

# 5. Start developing!
pnpm dev
```

**Next file to create:** `apps/web/prisma/schema.prisma` (schema provided above)

---

**Remember:** This is a 12-week project. Take it one step at a time. Build, test, iterate.

**You got this!** 🚀
