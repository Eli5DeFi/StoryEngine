# VOIDBORNE PHASE 1 - Quick Start Guide
**Get Lore Live This Weekend**

---

## What We're Building (This Weekend)

**Goal:** Make all Voidborne lore readable in-app. No database changes, pure content & UI.

**Scope:**
- 7 House profiles
- 14 Protocol overviews  
- 5 Protagonist bios
- Setting/Universe explanation
- Clean navigation & UI

**Time:** 3-4 hours focused work

---

## Step-by-Step Implementation

### Step 1: Setup Structure (5 min)
```bash
cd /Users/eli5defi/.openclaw/workspace/StoryEngine
./scripts/setup-lore-phase1.sh
```

This creates all directories and placeholder files.

---

### Step 2: Create Content Data (60 min)

#### 2.1 Houses Data
**File:** `apps/web/src/content/lore/houses.ts`

```typescript
export interface House {
  id: string;
  name: string;
  title: string;
  description: string;
  governance: string;
  strengths: string[];
  weaknesses: string[];
  culture: string;
  color: string;
  icon: string;
}

export const HOUSES: House[] = [
  {
    id: 'valdris',
    name: 'House Valdris',
    title: 'The Iron Throne',
    description: `Controls the densest Node cluster in known space. 
The wealthiest and most militarily powerful House. Their culture is 
one of disciplined hierarchy, aristocratic obligation, and controlled 
brutality. They believe the strong have a duty to rule — but also a 
duty to protect.`,
    governance: 'Hereditary monarchy with a council of Blade-Peers who can challenge the Throne through ritual combat or economic competition.',
    strengths: [
      'Dense Node cluster control',
      '40% of all refined Lumenase production',
      'Strongest military force',
      'Disciplined hierarchy'
    ],
    weaknesses: [
      'Brutal succession politics',
      'Internal power struggles',
      'Rigid hierarchy limits innovation'
    ],
    culture: `Valdris culture worships strength, duty, and honor. 
The strong have obligations. Power must be earned and maintained 
through constant vigilance. Succession is brutal but necessary — 
it ensures only the capable rule.`,
    color: '#8B0000', // Dark red
    icon: '⚔️'
  },
  // ... 6 more houses
];
```

**Data Source:** Extract from `VOIDBORNE_SETTING_BIBLE_v1.1.md` Section III.3.1

#### 2.2 Protocols Data
**File:** `apps/web/src/content/lore/protocols.ts`

```typescript
export interface Protocol {
  id: string;
  code: string;
  name: string;
  spectrum: 'HARD' | 'SOFT' | 'HYBRID';
  primaryStrand: string;
  secondaryStrand?: string;
  domain: string;
  description: string;
  shortDesc: string;
  tiers: {
    foundational: string;
    professional: string;
    strategic: string;
    schema: string;
  };
  color: string;
  icon: string;
}

export const PROTOCOLS: Protocol[] = [
  {
    id: 'geodesist',
    code: 'SR-01',
    name: 'Geodesist Protocol',
    spectrum: 'HARD',
    primaryStrand: 'L-Strand',
    secondaryStrand: 'G-Strand',
    domain: 'Space, Navigation, Spatial Geometry',
    description: `Reading Strand-lines to calculate faster-than-light 
transit routes through Lattice corridors called Geodesics. Every 
interstellar ship requires a Resonant navigator. Without them, you 
travel at sub-light. With them, you cross sectors in days.`,
    shortDesc: 'Space navigation and FTL travel',
    tiers: {
      foundational: 'Perceive Geodesic corridors, sense nearby Nodes, basic navigation',
      professional: 'Independent FTL navigation, corridor manipulation, multi-jump routing',
      strategic: 'Create new Geodesics, spatial folding, planetary-scale perception',
      schema: 'Rewrite spatial geometry, pocket dimensions, convergence perception'
    },
    color: '#4169E1', // Royal blue
    icon: '🧭'
  },
  // ... 13 more protocols
];
```

**Data Source:** Extract from `VOIDBORNE_RESONANT_POWERS_CODEX_v1.md` Part Two

#### 2.3 Protagonists Data
**File:** `apps/web/src/content/lore/protagonists.ts`

```typescript
export interface Protagonist {
  id: string;
  name: string;
  title: string;
  house: string;
  protocol?: string;
  order?: number;
  background: string;
  greyArea: string;
  centralQuestion: string;
  image?: string;
}

export const PROTAGONISTS: Protagonist[] = [
  {
    id: 'sera-valdris',
    name: 'Sera Valdris',
    title: 'The Heir Who Doesn\'t Want the Throne',
    house: 'valdris',
    protocol: 'geodesist',
    order: 6,
    background: `Third-born daughter of the Valdris ruling family. 
She was never supposed to matter — her two older brothers were groomed 
for succession. Then her eldest brother was assassinated, and the 
second defected to House Solvane. Now Sera is the heir, and she is 
not ready.`,
    greyArea: `Sera is compassionate and reformist in a House that runs 
on controlled violence. She wants to change Valdris from within — end 
the succession blood-rites, share Lumenase production more equitably, 
and reduce military spending. But every concession she makes is read 
as weakness by the Blade-Peers, and her reforms keep getting people 
killed through unintended consequences.`,
    centralQuestion: 'Can you reform a system of power without becoming the thing you\'re trying to change?'
  },
  // ... 4 more protagonists
];
```

**Data Source:** Extract from `VOIDBORNE_SETTING_BIBLE_v1.1.md` Section IV

#### 2.4 Setting Data
**File:** `apps/web/src/content/lore/setting.ts`

```typescript
export interface CosmologySection {
  title: string;
  content: string;
}

export const COSMOLOGY: CosmologySection[] = [
  {
    title: 'The Lattice',
    content: `The universe is not a smooth continuum. At the Planck-scale, 
spacetime is structured from discrete filaments called Strands — remnants 
of the initial conditions of the Big Bang. Where Strands overlap or knot, 
they create Nodes: localized regions where the normal laws of physics 
become negotiable.`
  },
  {
    title: 'Strands',
    content: `Strands are one-dimensional topological defects in spacetime...`
  },
  // ... more sections
];

export const DISCIPLINES = [
  {
    name: 'Geodesy',
    description: 'Navigation through Lattice corridors...'
  },
  // ... 3 more
];
```

**Data Source:** Extract from `VOIDBORNE_SETTING_BIBLE_v1.1.md` Section II

---

### Step 3: Build UI Components (90 min)

#### 3.1 House Card Component
**File:** `apps/web/src/components/lore/HouseCard.tsx`

```typescript
import Link from 'next/link';
import { House } from '@/content/lore/houses';

interface HouseCardProps {
  house: House;
}

export function HouseCard({ house }: HouseCardProps) {
  return (
    <Link href={`/lore/houses/${house.id}`}>
      <div className="group relative overflow-hidden rounded-lg border border-border bg-card p-6 transition-all hover:border-primary hover:shadow-lg">
        {/* Color accent bar */}
        <div 
          className="absolute left-0 top-0 h-full w-1"
          style={{ backgroundColor: house.color }}
        />
        
        {/* Icon & Title */}
        <div className="mb-4 flex items-center gap-3">
          <span className="text-4xl">{house.icon}</span>
          <div>
            <h3 className="text-xl font-bold">{house.name}</h3>
            <p className="text-sm text-muted-foreground">{house.title}</p>
          </div>
        </div>
        
        {/* Description */}
        <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
          {house.description}
        </p>
        
        {/* Strengths preview */}
        <div className="flex flex-wrap gap-2">
          {house.strengths.slice(0, 2).map((strength, i) => (
            <span 
              key={i}
              className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary"
            >
              {strength}
            </span>
          ))}
          {house.strengths.length > 2 && (
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              +{house.strengths.length - 2} more
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
```

#### 3.2 Protocol Card Component
**File:** `apps/web/src/components/lore/ProtocolCard.tsx`

Similar structure to HouseCard, adapted for Protocol data.

#### 3.3 Character Profile Component
**File:** `apps/web/src/components/lore/CharacterProfile.tsx`

Full-page character bio with background, grey area, and central question.

---

### Step 4: Create Pages (60 min)

#### 4.1 Lore Home Page
**File:** `apps/web/src/app/lore/page.tsx`

```typescript
import { HOUSES } from '@/content/lore/houses';
import { PROTOCOLS } from '@/content/lore/protocols';
import { PROTAGONISTS } from '@/content/lore/protagonists';
import { HouseCard } from '@/components/lore/HouseCard';
import { ProtocolCard } from '@/components/lore/ProtocolCard';
import Link from 'next/link';

export default function LorePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-12">
        <h1 className="mb-4 text-4xl font-bold">Voidborne: The Silent Throne</h1>
        <p className="text-lg text-muted-foreground">
          Explore the universe, houses, protocols, and characters of Voidborne
        </p>
      </div>
      
      {/* Houses Section */}
      <section className="mb-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold">The Seven Houses</h2>
          <Link href="/lore/houses" className="text-primary hover:underline">
            View All →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {HOUSES.slice(0, 3).map(house => (
            <HouseCard key={house.id} house={house} />
          ))}
        </div>
      </section>
      
      {/* Protocols Section */}
      <section className="mb-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold">The Fourteen Protocols</h2>
          <Link href="/lore/protocols" className="text-primary hover:underline">
            View All →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PROTOCOLS.slice(0, 3).map(protocol => (
            <ProtocolCard key={protocol.id} protocol={protocol} />
          ))}
        </div>
      </section>
      
      {/* Characters Section */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold">The Five Protagonists</h2>
          <Link href="/lore/characters" className="text-primary hover:underline">
            View All →
          </Link>
        </div>
        {/* Character cards grid */}
      </section>
    </div>
  );
}
```

#### 4.2 Houses List Page
**File:** `apps/web/src/app/lore/houses/page.tsx`

Full grid of all 7 houses.

#### 4.3 Individual House Page
**File:** `apps/web/src/app/lore/houses/[houseId]/page.tsx`

```typescript
import { HOUSES } from '@/content/lore/houses';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return HOUSES.map(house => ({
    houseId: house.id
  }));
}

export default function HouseDetailPage({
  params
}: {
  params: { houseId: string }
}) {
  const house = HOUSES.find(h => h.id === params.houseId);
  if (!house) notFound();
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Full house detail view */}
      <HouseDetail house={house} />
    </div>
  );
}
```

Repeat pattern for protocols and characters.

---

### Step 5: Add Navigation (30 min)

#### 5.1 Update Main Navigation
**File:** `apps/web/src/components/layout/Navigation.tsx` (or wherever nav lives)

Add "Lore" link to main nav:

```typescript
const navItems = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/lore', label: 'Lore' }, // NEW
  { href: '/leaderboards', label: 'Leaderboards' },
  // ... etc
];
```

#### 5.2 Create Lore Sub-Navigation
**File:** `apps/web/src/components/lore/LoreNavigation.tsx`

Tabbed navigation for lore sections:

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const LORE_TABS = [
  { href: '/lore', label: 'Overview' },
  { href: '/lore/houses', label: 'Houses' },
  { href: '/lore/protocols', label: 'Protocols' },
  { href: '/lore/characters', label: 'Characters' },
  { href: '/lore/setting', label: 'Setting' },
];

export function LoreNavigation() {
  const pathname = usePathname();
  
  return (
    <div className="border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex gap-8">
          {LORE_TABS.map(tab => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "border-b-2 px-1 py-4 text-sm font-medium transition-colors",
                pathname === tab.href
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
```

Add `<LoreNavigation />` to all lore pages.

---

### Step 6: Polish & Ship (30 min)

- [ ] Test all pages (mobile + desktop)
- [ ] Fix responsive issues
- [ ] Add loading states if needed
- [ ] Verify all links work
- [ ] Dark mode check
- [ ] Commit & push
- [ ] Deploy (Vercel auto-deploys from main)

---

## Files to Create (Checklist)

### Content (7 files)
- [ ] `apps/web/src/content/lore/index.ts`
- [ ] `apps/web/src/content/lore/houses.ts`
- [ ] `apps/web/src/content/lore/protocols.ts`
- [ ] `apps/web/src/content/lore/protagonists.ts`
- [ ] `apps/web/src/content/lore/setting.ts`
- [ ] `apps/web/src/content/lore/artes/geodesist.ts`
- [ ] `apps/web/src/content/lore/artes/tensor.ts`
(+ 12 more arte files as needed)

### Components (7 files)
- [ ] `apps/web/src/components/lore/HouseCard.tsx`
- [ ] `apps/web/src/components/lore/HouseDetail.tsx`
- [ ] `apps/web/src/components/lore/ProtocolCard.tsx`
- [ ] `apps/web/src/components/lore/ProtocolDetail.tsx`
- [ ] `apps/web/src/components/lore/CharacterProfile.tsx`
- [ ] `apps/web/src/components/lore/LoreNavigation.tsx`
- [ ] `apps/web/src/components/lore/LoreTabs.tsx`

### Pages (8 files)
- [ ] `apps/web/src/app/lore/page.tsx`
- [ ] `apps/web/src/app/lore/houses/page.tsx`
- [ ] `apps/web/src/app/lore/houses/[houseId]/page.tsx`
- [ ] `apps/web/src/app/lore/protocols/page.tsx`
- [ ] `apps/web/src/app/lore/protocols/[protocolId]/page.tsx`
- [ ] `apps/web/src/app/lore/characters/page.tsx`
- [ ] `apps/web/src/app/lore/characters/[characterId]/page.tsx`
- [ ] `apps/web/src/app/lore/setting/page.tsx`

---

## Ready to Start?

Run setup script:
```bash
cd /Users/eli5defi/.openclaw/workspace/StoryEngine
./scripts/setup-lore-phase1.sh
```

Then start building! 🦾

---

**Priority Order:**
1. Setup structure (5 min)
2. Create Houses data + UI (60 min total)
3. Create Protocols data + UI (60 min total)
4. Create Characters data + UI (45 min total)
5. Add navigation (30 min)
6. Polish & ship (30 min)

**Total: ~3.5 hours** ⚡

Let's ship lore this weekend!
