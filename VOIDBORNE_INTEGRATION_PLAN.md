# VOIDBORNE LORE INTEGRATION PLAN
**Modular Approach - Ship Fast, Build Deep**

---

## PHASE 1: CONTENT FIRST (Ship This Weekend)
**Goal:** Make the lore readable in-app ASAP. No backend changes required.

### Tasks (3-4 hours)

#### 1.1 Create Lore Content Structure
```
apps/web/src/content/
├── lore/
│   ├── index.ts                    # Export all lore modules
│   ├── houses.ts                   # 7 Houses data
│   ├── protocols.ts                # 14 Protocols overview
│   ├── protagonists.ts             # 5 Main characters
│   ├── setting.ts                  # Universe, Lattice, Nodes
│   └── artes/                      # Arte detailed breakdowns
│       ├── geodesist.ts
│       ├── tensor.ts
│       ├── fracturer.ts
│       └── ... (14 total)
```

**Data Format:**
```typescript
// houses.ts example
export interface House {
  id: string;
  name: string;
  title: string;
  description: string;
  governance: string;
  strengths: string[];
  weaknesses: string[];
  culture: string;
  color: string; // For UI theming
  icon: string;  // Emoji or icon name
}

export const HOUSES: House[] = [
  {
    id: 'valdris',
    name: 'House Valdris',
    title: 'The Iron Throne',
    description: 'Controls the densest Node cluster...',
    // ... etc
  },
  // ... 6 more houses
];
```

#### 1.2 Create Lore Pages (Next.js Routes)
```
apps/web/src/app/
├── lore/
│   ├── page.tsx                    # Lore home (overview grid)
│   ├── houses/
│   │   ├── page.tsx                # All houses
│   │   └── [houseId]/page.tsx      # Individual house detail
│   ├── protocols/
│   │   ├── page.tsx                # All protocols
│   │   └── [protocolId]/page.tsx   # Individual protocol detail
│   ├── characters/
│   │   ├── page.tsx                # All protagonists
│   │   └── [characterId]/page.tsx  # Individual character
│   └── setting/
│       └── page.tsx                # Universe, Lattice, Nodes explanation
```

#### 1.3 Create Lore UI Components
```
apps/web/src/components/lore/
├── HouseCard.tsx                   # House preview card
├── HouseDetail.tsx                 # Full house view
├── ProtocolCard.tsx                # Protocol preview
├── ProtocolDetail.tsx              # Full protocol breakdown
├── CharacterProfile.tsx            # Character detail page
├── LoreNavigation.tsx              # Lore section nav
└── LoreTabs.tsx                    # Tab navigation for lore sections
```

#### 1.4 Add Navigation
- Add "Lore" to main nav
- Create lore section with tabbed navigation (Houses / Protocols / Characters / Setting)
- Breadcrumb navigation for deep pages

#### 1.5 Styling & Polish
- Use existing design system (Tailwind components)
- House-specific color theming (Valdris = red, Solvane = purple, etc.)
- Responsive design (mobile-friendly)
- Dark mode support

### Deliverables (Phase 1)
✅ 4 lore pages live  
✅ 7 House profiles readable  
✅ 14 Protocol overviews available  
✅ 5 Character profiles published  
✅ Setting/Universe explanation  
✅ Navigation integrated  

**Ship it Saturday night!**

---

## PHASE 2: DATABASE SCHEMA (Week of Feb 16-22)
**Goal:** Extend database to support full lore system, character progression, and gameplay integration.

### 2.1 New Database Models

#### Lore Tables (Read-Only Reference Data)
```prisma
model House {
  id          String @id // valdris, meridian, etc.
  name        String
  title       String
  description String @db.Text
  governance  String @db.Text
  strengths   String[] // Array
  weaknesses  String[] // Array
  culture     String @db.Text
  color       String // Hex color
  icon        String // Emoji/icon
  
  // Relationships
  characters  Character[]
  
  @@map("houses")
}

model Protocol {
  id              String @id // geodesist, tensor, fracturer
  name            String
  code            String // SR-01, SR-02, etc.
  spectrum        String // HARD, SOFT, HYBRID
  primaryStrand   String // L-Strand, R-Strand, etc.
  secondaryStrand String?
  domain          String // Navigation, Engineering, etc.
  description     String @db.Text
  
  // Tier descriptions (JSON)
  // { "tier1": { ... }, "tier2": { ... } }
  tiers           Json
  
  // Relationships
  artes           Arte[]
  characters      Character[] // Characters with this protocol
  
  @@map("protocols")
}

model Arte {
  id          String @id @default(cuid())
  protocolId  String
  protocol    Protocol @relation(fields: [protocolId], references: [id])
  
  name        String // "Pathsense", "Corridor Read", etc.
  type        ArteType // PASSIVE, COMBAT, UTILITY
  tier        Int // 1-4 (Foundational, Professional, Strategic, Schema)
  order       Int // 9th-0 Order requirement
  
  description String @db.Text
  mechanics   String @db.Text
  cost        String @db.Text // Energy cost description
  range       String // "Arm's reach", "100m", "Kilometers"
  duration    String // "Instant", "Minutes", "Sustained"
  
  // Variations & schools
  variations  Json? // Different schools/approaches
  
  @@map("artes")
}

enum ArteType {
  PASSIVE
  COMBAT
  UTILITY
}
```

#### Character Progression (Gameplay Integration)
```prisma
// Extend existing Character model
model Character {
  // ... existing fields ...
  
  // VOIDBORNE EXTENSIONS:
  
  // House affiliation
  houseId     String?
  house       House? @relation(fields: [houseId], references: [id])
  
  // Resonance abilities
  isResonant  Boolean @default(false)
  protocolId  String?
  protocol    Protocol? @relation(fields: [protocolId], references: [id])
  
  // Progression
  resonantOrder Int @default(9) // 9th = Initiate, 8th = next tier, etc.
  channelCapacity Float @default(1.0) // 0-10 scale
  saturationLevel Float @default(0.0) // 0-100% (entropy debt)
  
  // Learned Artes (many-to-many)
  knownArtes  CharacterArte[]
  
  // Lumenase usage tracking
  lumenaseDoses Int @default(0)
  
  // Artifacts (optional - for high-level characters)
  artifacts   Json? // Array of artifact names/types
}

model CharacterArte {
  id          String @id @default(cuid())
  characterId String
  character   Character @relation(fields: [characterId], references: [id])
  
  arteId      String
  arte        Arte @relation(fields: [arteId], references: [id])
  
  // Proficiency
  learnedAt   DateTime @default(now())
  proficiency Float @default(1.0) // 0-10 scale
  usageCount  Int @default(0)
  
  @@unique([characterId, arteId])
  @@map("character_artes")
}
```

#### Story Integration (Link Choices to Lore)
```prisma
// Extend existing Choice model
model Choice {
  // ... existing fields ...
  
  // VOIDBORNE EXTENSIONS:
  
  // House/Protocol implications
  favorsHouse   String? // Which house benefits from this choice
  requiresProtocol String? // Requires character to have this protocol
  
  // Resonance requirements
  minResonantOrder Int? // Minimum Order to unlock this choice
  requiresArte     String? // Requires specific Arte knowledge
  
  // Consequences
  houseReputation  Json? // { "valdris": +10, "solvane": -5 }
  characterGrowth  Json? // { "protocolXP": 50, "newArte": "path_sense" }
}
```

### 2.2 Migration Strategy
```bash
# Create migration
cd packages/database
npx prisma migrate dev --name add_voidborne_lore

# Seed lore data
npx prisma db seed
```

### 2.3 Seed Data Script
```typescript
// packages/database/prisma/seed-lore.ts
import { PrismaClient } from '@prisma/client';
import { HOUSES } from './seed-data/houses';
import { PROTOCOLS } from './seed-data/protocols';
import { ARTES } from './seed-data/artes';

const prisma = new PrismaClient();

async function seedLore() {
  // Seed houses
  for (const house of HOUSES) {
    await prisma.house.upsert({
      where: { id: house.id },
      update: house,
      create: house,
    });
  }
  
  // Seed protocols
  for (const protocol of PROTOCOLS) {
    await prisma.protocol.upsert({
      where: { id: protocol.id },
      update: protocol,
      create: protocol,
    });
  }
  
  // Seed artes (500+ total from all protocols)
  for (const arte of ARTES) {
    await prisma.arte.create({
      data: arte,
    });
  }
  
  console.log('✅ Lore seeded successfully');
}

seedLore();
```

### Deliverables (Phase 2)
✅ Database schema extended  
✅ Migrations created & tested  
✅ Lore data seeded (Houses, Protocols, Artes)  
✅ Character progression system ready  
✅ Choice-to-lore connections enabled  

---

## PHASE 3: INTERACTIVE FEATURES (Ongoing)
**Goal:** Make lore unlock through gameplay, create interactive experiences.

### 3.1 Interactive Codex (Week 3)
**Features:**
- Search across all lore (Houses, Protocols, Artes, Characters)
- Filter by Protocol tier, House affiliation, Arte type
- "Unlock on discovery" - lore entries revealed through story progression
- Progress tracking (% of codex discovered)
- Favorites/bookmarks

**Tech:**
- Search: Algolia or local Fuse.js
- UI: Searchable grid with filters
- State: Track unlocked entries per user

### 3.2 Character Progression System (Week 4)
**Features:**
- Character sheets showing Protocol/Order/Artes
- Progression tied to story choices
- "Level up" when character advances Order
- Arte mastery system (use artes in choices to gain proficiency)
- Visual progression trees

**UI Components:**
- Character progression dashboard
- Arte unlock notifications
- Order advancement ceremonies (with lore)

### 3.3 House Reputation System (Week 5)
**Features:**
- Track player's standing with each House
- Choices affect House reputation
- Reputation gates certain story paths
- Visual reputation meters
- House-specific rewards/consequences

**Integration:**
- Choice consequences calculate reputation changes
- Story branches based on reputation thresholds
- End-of-chapter reputation summary

### 3.4 Protocol Demonstrations (Week 6)
**Features:**
- Interactive visualizations of how Artes work
- "Simulate" artes in 3D (using Three.js/React Three Fiber)
- Compare different Protocol approaches to same problem
- Educational mini-games (practice Geodesic navigation, Tensor shaping)

**Tech Stack:**
- Three.js / React Three Fiber for 3D
- Framer Motion for animations
- Canvas-based simulations

### 3.5 Story-Lore Connections (Ongoing)
**Features:**
- Inline lore tooltips in story text
- "Learn more" links to codex entries
- Character actions demonstrate Protocol abilities
- Betting options reference House politics
- Real-time lore reveals during chapter resolution

---

## IMPLEMENTATION TIMELINE

### Weekend (Feb 15-16)
✅ **PHASE 1 COMPLETE**
- Static lore pages live
- Content readable
- Basic navigation

### Week 2 (Feb 17-22)
🔨 **PHASE 2 START**
- Mon-Tue: Schema design & review
- Wed-Thu: Migrations + seed data
- Fri: Testing & deployment
- Weekend: Phase 2 complete

### Week 3 (Feb 24-Mar 1)
🔨 **PHASE 3.1: Interactive Codex**
- Search implementation
- Filter UI
- Unlock system

### Week 4 (Mar 3-8)
🔨 **PHASE 3.2: Character Progression**
- Character sheets
- Arte mastery
- Order advancement

### Week 5 (Mar 10-15)
🔨 **PHASE 3.3: House Reputation**
- Reputation tracking
- Choice integration
- Visual meters

### Ongoing
🔨 **PHASE 3.4 & 3.5**
- Protocol demonstrations (when we have bandwidth)
- Continuous story-lore integration

---

## TECH STACK ADDITIONS

### New Dependencies
```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.0.0",  // Data fetching
    "fuse.js": "^7.0.0",                 // Local search
    "framer-motion": "^11.0.0",          // Animations
    "@react-three/fiber": "^8.0.0",      // 3D (Phase 3.4)
    "@react-three/drei": "^9.0.0"        // 3D helpers (Phase 3.4)
  }
}
```

### File Structure (Final)
```
apps/web/src/
├── app/
│   ├── lore/                       # Lore pages (Phase 1)
│   ├── codex/                      # Interactive codex (Phase 3.1)
│   └── progression/                # Character progression (Phase 3.2)
├── components/
│   ├── lore/                       # Lore display components
│   ├── codex/                      # Codex UI (Phase 3.1)
│   └── progression/                # Progression UI (Phase 3.2)
├── content/
│   └── lore/                       # Static lore data (Phase 1)
├── lib/
│   ├── lore/                       # Lore utilities
│   ├── progression/                # Progression logic
│   └── search/                     # Search implementation (Phase 3.1)
└── hooks/
    ├── useLore.ts                  # Lore data fetching
    ├── useProgression.ts           # Character progression
    └── useHouseReputation.ts       # House reputation tracking
```

---

## SUCCESS METRICS

### Phase 1
- [ ] Lore pages load < 2s
- [ ] Mobile responsive (all lore readable on phone)
- [ ] All 7 Houses documented
- [ ] All 14 Protocols documented
- [ ] All 5 Protagonists profiled

### Phase 2
- [ ] Database migration runs without errors
- [ ] 500+ Artes seeded successfully
- [ ] Character progression queries < 100ms
- [ ] Zero breaking changes to existing schema

### Phase 3
- [ ] Codex search returns results < 300ms
- [ ] Character progression feels rewarding (user testing)
- [ ] House reputation visibly affects story
- [ ] Protocol demonstrations run smoothly (60fps)

---

## NEXT STEPS (RIGHT NOW)

1. **Create lore content files** (`apps/web/src/content/lore/`)
2. **Build lore pages** (`apps/web/src/app/lore/`)
3. **Create UI components** (`apps/web/src/components/lore/`)
4. **Add navigation** (main nav + lore nav)
5. **Ship it!**

---

**Let's start with Phase 1. Ready to build the lore pages?** 🦾
