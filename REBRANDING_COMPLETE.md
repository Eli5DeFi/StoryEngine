# ✅ Rebranding Complete: NarrativeForge → Voidborne

**Date:** Feb 10, 2026 22:40 WIB  
**Commit:** `ff0e911`

---

## 🎭 What Changed

### Brand Identity
- **Name:** NarrativeForge → **Voidborne**
- **Tagline:** "Ruins of the Future" → **"The Silent Throne"**
- **Focus:** Multi-story platform → **Single immersive narrative**

### Story Content
**Removed:**
- ❌ "The Last Archive" (Post-Apocalyptic Sci-Fi)
- ❌ "The Singing Sands" (Mythological Fantasy)
- ❌ All placeholder/example stories

**Kept:**
- ✅ **VOIDBORNE: The Silent Throne** (Space Political Sci-Fi)
  - Chapter 1: "Succession"
  - 3 betting choices
  - Active betting pool on Base Sepolia

### Technical Changes

#### 1. Database
- **Reset:** Wiped all old story data
- **Reseeded:** With Voidborne story only
- **Story ID:** 1 (matches deployed contracts)
- **Pool Address:** `0xD4C57AC117670C8e1a8eDed3c05421d404488123`
- **USDC Address:** `0xe0761EFa93aB7dfc4d0042476C5dEA9b7B83E132`

#### 2. Branding Updates

**Landing Page:**
- Hero title: "VOIDBORNE: The Silent Throne"
- Ceremonial header: "The Grand Conclave"
- CTA button: "Enter the Conclave"
- Single featured story (centered layout)

**Navbar:**
- Logo: Voidborne / The Silent Throne
- "Stories" link → "The Story" (links to /story/1)

**Footer:**
- Brand name: Voidborne
- Description updated for space political narrative
- Social links: @voidborne (Twitter, Discord, Telegram)

**Metadata:**
- Page title: "Voidborne: The Silent Throne"
- Description: Space political saga focus
- Keywords: Added "space opera", "political intrigue"
- Open Graph: Updated for Voidborne branding

#### 3. Package Names
Changed from `@narrative-forge/*` to `@voidborne/*`:
- `@voidborne/web`
- `@voidborne/contracts`
- `@voidborne/database`

#### 4. Documentation
- **README.md:** Updated with Voidborne story description
- **package.json:** Root package renamed to "voidborne"

---

## 📋 Files Modified (11 files)

### Frontend Components
1. `apps/web/src/app/layout.tsx` - Metadata & title
2. `apps/web/src/components/landing/Hero.tsx` - Main headline
3. `apps/web/src/components/landing/Navbar.tsx` - Logo & nav links
4. `apps/web/src/components/landing/Footer.tsx` - Branding & links
5. `apps/web/src/components/landing/FeaturedStories.tsx` - Single story layout

### Configuration
6. `package.json` - Root package name & description
7. `apps/web/package.json` - Package name & dependencies
8. `packages/contracts/package.json` - Package name
9. `packages/database/package.json` - Package name

### Data & Docs
10. `packages/database/prisma/seed.ts` - Voidborne story data
11. `README.md` - Project description

---

## 🔗 Live Changes

**Homepage:** http://localhost:3000
- Hero now shows "VOIDBORNE: The Silent Throne"
- Single story card (centered)
- "Enter the Conclave" CTA → `/story/1`

**Story Page:** http://localhost:3000/story/1
- Chapter 1: "Succession"
- 3 betting options
- Betting pool connected to Base Sepolia contracts

---

## ✅ Testing Checklist

After rebranding, verify:
- [ ] Homepage loads with Voidborne branding
- [ ] Story page shows Chapter 1 correctly
- [ ] Betting interface functional
- [ ] Wallet connection works
- [ ] All links point to correct pages
- [ ] No references to "NarrativeForge" remain
- [ ] Database has only Voidborne story

**Dev Server:** Running at http://localhost:3000  
**Database:** PostgreSQL (reseeded successfully)

---

## 🚀 Next Steps

**Immediate:**
1. ✅ Test betting flow end-to-end (see `E2E_TESTING_GUIDE.md`)
2. ✅ Verify contracts on Basescan (see `scripts/verify-contracts.sh`)

**Soon:**
3. ⏳ Launch $FORGE token (`scripts/launch-forge-token.sh`)
4. ⏳ Set up production database
5. ⏳ Deploy to Vercel

**Future:**
6. ⏳ Generate Chapter 2 (after Chapter 1 bets resolved)
7. ⏳ Add more story branches
8. ⏳ Build out the 5 houses lore

---

## 🎨 Design Consistency

**"Ruins of the Future" Aesthetic Maintained:**
- ✅ Gold/Teal/Purple color scheme
- ✅ Cinzel display font
- ✅ Glassmorphism cards
- ✅ Starfield backgrounds
- ✅ Ceremonial tone

**Now Enhanced With:**
- Space political theme
- Grand Conclave focus
- House Valdris branding
- Thread Stitching lore

---

## 📊 Story Data

**VOIDBORNE: The Silent Throne**
- **Genre:** Space Political Sci-Fi
- **Chapter 1:** "Succession"
- **Word Count:** 387 words
- **Read Time:** 2 minutes
- **Choices:** 3 (each with unique consequences)
- **Betting Window:** 7 days
- **Min Bet:** 10 USDC
- **Max Bet:** 10,000 USDC

**Three Choices:**
1. **Claim responsibility** - Demonstrate Thread Stitching
2. **Deny involvement** - Investigate quietly
3. **Propose alliance** - Unite against unknown threat

**Five Houses:**
- House Valdris (Silent Throne)
- House Korr (Diplomacy & Trade)
- House Hadron (Void Fleets)
- House Solenne (Faith & Ascension)
- House Sable (Science & Technology)

---

**Rebranding Status:** ✅ COMPLETE  
**Commits Pushed:** 1 commit  
**Branch:** `main`  
**Ready For:** Testing → Production deployment

---

_Last updated: Feb 10, 2026 22:40 WIB_
