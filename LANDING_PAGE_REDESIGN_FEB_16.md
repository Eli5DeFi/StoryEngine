# Landing Page Redesign - Feb 16, 2026

## Overview

Completely reformatted landing page to match the cinematic, full-screen design style from reference (https://wlfebrrgtfq2o.ok.kimi.link).

## Key Changes

### 1. **Hero Section** - Full-Screen Cinematic
- **Before:** Card-based layout with gradients
- **After:** Full viewport height with dramatic background image
- **Typography:** Bold, wide, uppercase tech font (`THE SILENT THRONE`)
- **CTAs:** Monospace buttons with tech styling (`> INITIATE_LINK`, `ENTER THE LATTICE`)
- **Background:** Cinematic image with dark overlay (throne/castle scene)

### 2. **Six Strands Section** - NEW
- Grid layout showcasing the six fundamental strands
- Each card has:
  - Unique icon
  - Strand name with color coding
  - Description
  - Glassmorphic styling with colored borders
  - Hover effects with glow
- Background: Cosmic void/portal image
- Colors match each strand:
  - G-STRAND (Blue): Gravity / Space
  - L-STRAND (Orange): Light / Energy
  - S-STRAND (Red): Entropy / Time
  - R-STRAND (Green): Matter / Form
  - C-STRAND (Purple): Consciousness
  - Ø-STRAND (Gray): Null / Void

### 3. **Protocols Section** - NEW
- Dark, compliance-themed section
- Lists three protocols:
  - SR-01: SEVERANCE
  - NL-ø: NULLIFICATION
  - AX-09: AXIOM
- "COMPLIANCE MANDATORY" label
- Glassmorphic protocol cards
- Background: Dark sci-fi scene

### 4. **Navigation** - Minimal Redesign
- **Before:** Complex nav with icons and subtitles
- **After:** Minimal uppercase labels
- Links: LORE | STRANDS | HOUSES | PROTOCOLS | CONTACT
- Monospace font with wide letter spacing
- Cleaner, more focused design

## Design System

### Typography
- **Hero Titles:** Bold, wide, uppercase (clamp(3rem, 10vw, 7rem))
- **Section Titles:** Bold, wide, uppercase (clamp(2rem, 6vw, 4rem))
- **Labels:** Monospace, uppercase, letter-spaced (0.15em)
- **Body:** Gray-300, readable size

### Colors
- **Background:** Pure black (#000000)
- **Overlays:** Black with varying opacity (60-90%)
- **Glass Cards:** `rgba(30, 41, 59, 0.6)` with backdrop blur
- **Borders:** Strand-specific colors at 40% opacity
- **Text:** White to gray-300 hierarchy

### Layout
- **Sections:** Full viewport height (min-h-screen)
- **Spacing:** Generous whitespace
- **Alignment:** Centered content
- **Responsive:** Fluid typography using clamp()

### Effects
- **Backdrop Blur:** 20px for glassmorphism
- **Shadows:** Colored glows for strand elements
- **Transitions:** 300ms ease for hover states
- **Animations:** fadeIn with staggered delays

## Images Required

Add these to `/apps/web/public/images/`:

1. **throne-hero.jpg** - Dark throne/castle scene for hero
2. **void-portal.jpg** - Cosmic portal for strands section
3. **protocols-bg.jpg** - Dark sci-fi scene for protocols

See `LANDING_PAGE_IMAGES_NEEDED.md` for detailed specifications and sources.

## Files Changed

### New Components
- `apps/web/src/components/landing/SixStrands.tsx` (3.8KB)
- `apps/web/src/components/landing/Protocols.tsx` (4.3KB)

### Updated Components
- `apps/web/src/components/landing/Hero.tsx` (3.6KB)
- `apps/web/src/components/landing/Navbar.tsx` (3.8KB)
- `apps/web/src/app/page.tsx` (1.2KB)

### Documentation
- `LANDING_PAGE_IMAGES_NEEDED.md` (1.7KB)

**Total:** 7 files, ~18KB of code

## Testing

```bash
# Start dev server
cd apps/web
npm run dev

# Visit http://localhost:3000
```

## Next Steps

1. **Add Images:** Place three hero images in `/apps/web/public/images/`
2. **Test Responsiveness:** Check mobile, tablet, desktop views
3. **Add Smooth Scroll:** Implement smooth scrolling for anchor links
4. **Footer Updates:** Consider updating footer to match new minimal style
5. **Performance:** Images should be optimized (WebP, lazy loading)

## Design Philosophy

**From:** "Glassmorphic cards on gradient background" (product showcase)  
**To:** "Cinematic full-bleed sections" (immersive storytelling)

This redesign shifts the landing page from a traditional SaaS product page to an **immersive story experience** — matching the dark, mysterious tone of Voidborne's narrative.

## Commit

```
feat: reformat landing page with cinematic full-screen design
- Hero: Full-screen cinematic background with bold typography
- Six Strands: Glassmorphic cards grid with strand-specific colors
- Protocols: Dark list section with compliance theme
- Navbar: Minimal design with uppercase monospace labels
```

**Status:** ✅ Complete and committed to `optimize/performance-cost-ux-feb16-2026` branch
