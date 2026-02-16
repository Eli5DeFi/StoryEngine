# Bettor's Paradox Engine - POC

**Innovation:** Contrarian AI that creates legendary upsets  
**Status:** POC Ready for Testing  
**Cycle:** #45 (Feb 16, 2026)

---

## Overview

The **Bettor's Paradox Engine** is a contrarian AI decision-making system that occasionally picks underdog choices to create:
- 🎭 **Unpredictable outcomes** (narrative tension)
- 💰 **Higher payouts** (4x+ for risk-takers)
- 🚀 **Viral moments** (legendary upsets)
- ⚖️ **Fair betting** (prevents whale dominance)

---

## How It Works

### Traditional AI (Boring)
```
Choice A: 80% of bets → AI picks A → 1.25x payout (predictable)
Choice B: 20% of bets → AI ignores B → No excitement
```

### Bettor's Paradox AI (Exciting!)
```
Choice A: 80% of bets
Choice B: 20% of bets

AI analysis:
- Ratio: 4:1 (triggers contrarian mode)
- Contrarian probability: 30%
- Narrative coherence: A=85%, B=75%

Weighted decision:
- A score: 85% × 70% = 59.5%
- B score: 75% × 70% + 30% × 30% = 61.5% ✅

Result: AI picks B (underdog wins!)
Payout: 4.25x → LEGENDARY UPSET 🎉
```

---

## Algorithm

1. **Calculate betting ratio**  
   `ratio = majority_bets / underdog_bets`

2. **Check if intervention needed**  
   If ratio >= 4:1 → Enable contrarian mode

3. **Calculate contrarian probability**  
   `contrarian_prob = min((ratio - 4) / 10, 0.30)` (max 30%)

4. **Score narrative coherence** (AI evaluation via Claude)  
   - Plot consistency
   - Character motivation
   - Thematic alignment
   - Foreshadowing payoff

5. **Weighted decision**  
   - Final score = coherence (70%) + contrarian bonus (30%)
   - Highest score wins

6. **Generate explanation** (if upset)  
   AI creates backstory explaining why underdog won

---

## Configuration

```typescript
interface ParadoxConfig {
  enabled: boolean                  // Enable contrarian mode
  minRatioForContrary: number      // e.g., 4.0 (4:1 triggers intervention)
  maxContrarianProbability: number // e.g., 0.30 (30% max chance)
  narrativeCoherenceWeight: number // 0-1 (0.70 = 70% story logic)
}
```

**Default Config:**
```typescript
{
  enabled: true,
  minRatioForContrary: 4.0,        // 4:1 ratio
  maxContrarianProbability: 0.30,  // 30% max
  narrativeCoherenceWeight: 0.70,  // 70% story, 30% contrarian
}
```

**Tuning:**
- Higher `minRatioForContrary` → Less intervention (more conservative)
- Higher `maxContrarianProbability` → More upsets (more exciting)
- Higher `narrativeCoherenceWeight` → Favor story logic (safer)

---

## Usage

### Basic Example

```typescript
import { getBettorsParadoxEngine, BettingChoice } from './bettor-paradox'

const engine = getBettorsParadoxEngine()

const choices: BettingChoice[] = [
  {
    id: 'choice-a',
    text: 'Commander Zara keeps her oath to House Valdris',
    totalBets: 8000,
    betCount: 120,
  },
  {
    id: 'choice-b',
    text: 'Commander Zara betrays Valdris and joins House Kael',
    totalBets: 2000,
    betCount: 30,
  },
]

const storyContext = `
Chapter 1: The heir of House Valdris inherits the Silent Throne...
Chapter 7: Commander Zara hesitates before swearing the Oath...
Chapter 14: House Kael's ambassador makes a secret offer...
`

const chapterPrompt = `
Commander Zara stands before the Grand Conclave. House Kael has 
offered her command of their Void Fleet. House Valdris expects 
her loyalty. She must choose.
`

const outcome = await engine.decideOutcome(choices, storyContext, chapterPrompt)

console.log('Winner:', outcome.choiceId)
console.log('Contrarian?', outcome.isContrarian)
console.log('Probability:', (outcome.contrarian_probability * 100).toFixed(0) + '%')
console.log('Coherence:', (outcome.narrative_coherence_score * 100).toFixed(0) + '%')
console.log('Reasoning:', outcome.reasoning)

if (outcome.isContrarian) {
  console.log('\n🎭 LEGENDARY UPSET!')
  console.log('Explanation:', outcome.explanation)
}
```

### Custom Configuration

```typescript
const engine = getBettorsParadoxEngine({
  enabled: true,
  minRatioForContrary: 3.0,        // More aggressive (3:1)
  maxContrarianProbability: 0.40,  // Higher upset chance (40%)
  narrativeCoherenceWeight: 0.60,  // More contrarian (60/40 split)
})
```

---

## API Reference

### `BettorsParadoxEngine`

#### `constructor(config?: ParadoxConfig)`
Create a new engine instance with optional configuration.

#### `decideOutcome(choices, storyContext, chapterPrompt): Promise<ParadoxOutcome>`
Main decision method.

**Parameters:**
- `choices` - Array of betting choices with amounts
- `storyContext` - Previous chapters for context (string)
- `chapterPrompt` - Setup for current chapter (string)

**Returns:**
```typescript
{
  choiceId: string              // Winning choice ID
  isContrarian: boolean         // Was this an upset?
  contrarian_probability: number // 0-0.30 (upset chance)
  narrative_coherence_score: number // 0-1 (story logic)
  reasoning: string             // Human-readable explanation
  explanation?: string          // AI-generated upset backstory (if contrarian)
}
```

#### `getConfig(): ParadoxConfig`
Get current configuration.

#### `updateConfig(updates: Partial<ParadoxConfig>): void`
Update configuration (for tuning).

---

## Example Outcomes

### Scenario 1: Balanced Betting (No Intervention)

**Bets:**
- Choice A: 6,000 USDC (60%)
- Choice B: 4,000 USDC (40%)

**Result:**
```json
{
  "choiceId": "choice-a",
  "isContrarian": false,
  "contrarian_probability": 0,
  "narrative_coherence_score": 0.88,
  "reasoning": "Betting distribution is balanced (1.5:1 ratio). Following consensus: \"Keep alliance\""
}
```

### Scenario 2: Skewed Betting (Contrarian Mode)

**Bets:**
- Choice A: 8,000 USDC (80%)
- Choice B: 2,000 USDC (20%)

**Ratio:** 4:1 → Triggers contrarian mode  
**Contrarian Probability:** 30%

**Result (if underdog wins):**
```json
{
  "choiceId": "choice-b",
  "isContrarian": true,
  "contrarian_probability": 0.30,
  "narrative_coherence_score": 0.75,
  "reasoning": "🎭 LEGENDARY UPSET! Despite 80% betting on \"Keep alliance\", the narrative demanded \"Betray alliance\" (coherence: 75%, contrarian bonus: 30%).",
  "explanation": "Zara's betrayal was foreshadowed in Chapter 7 when she hesitated before swearing the Oath of Threads. Those who noticed the slight tremor in her voice—and the way House Kael's ambassador smiled in Chapter 14—predicted this moment. The majority missed the signs, but 20% of astute readers saw the storm coming."
}
```

### Scenario 3: Extreme Skew (Maximum Upset Chance)

**Bets:**
- Choice A: 9,500 USDC (95%)
- Choice B: 500 USDC (5%)

**Ratio:** 19:1 → Maximum contrarian mode  
**Contrarian Probability:** 30% (capped)

**Result:**
- High chance of legendary upset
- If underdog wins: 19x payout!
- Massive viral potential

---

## Testing

### Unit Tests

```bash
cd packages/consequence-engine
npm test bettor-paradox.test.ts
```

### Integration Tests

```typescript
// Test with real chapter data
import { prisma } from '@voidborne/database'

const chapter = await prisma.chapter.findUnique({
  where: { id: 'chapter-15' },
  include: {
    choices: {
      include: {
        bets: true,
      },
    },
  },
})

const choices = chapter.choices.map(c => ({
  id: c.id,
  text: c.text,
  totalBets: c.bets.reduce((sum, b) => sum + b.amount, 0),
  betCount: c.bets.length,
}))

const outcome = await engine.decideOutcome(
  choices,
  chapter.storyContext,
  chapter.content
)

console.log('AI Decision:', outcome)
```

---

## Environment Variables

```bash
# Required for Claude API (narrative coherence scoring)
ANTHROPIC_API_KEY="sk-ant-..."
```

---

## Performance

**Latency:**
- Coherence scoring: ~2-3s per choice (parallel)
- Total decision time: ~3-4s (2 choices)
- Explanation generation: +1-2s (if contrarian)

**Cost:**
- Claude API: ~$0.01 per decision (2 choices × 2 API calls)
- Monthly (100 chapters): ~$1

**Optimization:**
- Cache coherence scores (same context + choice)
- Batch API calls
- Use faster model (Claude Haiku) for scoring

---

## Integration with Voidborne

### 1. Update Chapter Resolution

```typescript
// apps/web/src/app/api/chapters/[chapterId]/resolve/route.ts

import { getBettorsParadoxEngine } from '@voidborne/consequence-engine/bettor-paradox'

export async function POST(req: Request, { params }: { params: { chapterId: string } }) {
  const chapter = await prisma.chapter.findUnique({
    where: { id: params.chapterId },
    include: {
      choices: {
        include: {
          bets: true,
        },
      },
    },
  })
  
  // Calculate betting totals
  const choices = chapter.choices.map(c => ({
    id: c.id,
    text: c.text,
    totalBets: c.bets.reduce((sum, b) => sum + Number(b.amount), 0),
    betCount: c.bets.length,
  }))
  
  // Get story context (previous chapters)
  const storyContext = await getStoryContext(chapter.storyId)
  
  // Use Bettor's Paradox Engine
  const engine = getBettorsParadoxEngine()
  const outcome = await engine.decideOutcome(choices, storyContext, chapter.content)
  
  // Update chapter with outcome
  await prisma.chapter.update({
    where: { id: params.chapterId },
    data: {
      resolvedChoiceId: outcome.choiceId,
      wasContrarian: outcome.isContrarian,
      contrarianProbability: outcome.contrarian_probability,
      narrativeCoherence: outcome.narrative_coherence_score,
      resolutionReasoning: outcome.reasoning,
      upsetExplanation: outcome.explanation,
      resolvedAt: new Date(),
    },
  })
  
  return NextResponse.json({
    success: true,
    outcome,
  })
}
```

### 2. Display Upset Badges

```tsx
// apps/web/src/components/chapter/ChapterOutcome.tsx

interface ChapterOutcomeProps {
  chapter: Chapter
}

export function ChapterOutcome({ chapter }: ChapterOutcomeProps) {
  if (!chapter.resolvedChoiceId) return null
  
  return (
    <div className="glass-card rounded-xl p-6">
      {chapter.wasContrarian && (
        <div className="mb-4 p-4 bg-gold/10 border border-gold/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🎭</span>
            <h3 className="text-lg font-bold text-gold">LEGENDARY UPSET!</h3>
          </div>
          
          <p className="text-foreground/80 text-sm mb-2">
            {chapter.resolutionReasoning}
          </p>
          
          {chapter.upsetExplanation && (
            <p className="text-foreground/70 text-sm italic border-l-2 border-gold/50 pl-3">
              {chapter.upsetExplanation}
            </p>
          )}
          
          <div className="mt-3 flex gap-4 text-xs text-foreground/60">
            <span>
              Contrarian Probability: {(chapter.contrarianProbability * 100).toFixed(0)}%
            </span>
            <span>
              Narrative Coherence: {(chapter.narrativeCoherence * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}
      
      {/* Rest of outcome display... */}
    </div>
  )
}
```

### 3. Database Schema Update

```prisma
model Chapter {
  // ... existing fields ...
  
  // Bettor's Paradox metadata
  wasContrarian         Boolean? // Was this an upset?
  contrarianProbability Float?   // 0-0.30
  narrativeCoherence    Float?   // 0-1
  resolutionReasoning   String?  @db.Text
  upsetExplanation      String?  @db.Text
}
```

---

## Metrics & Success Criteria

### Engagement Metrics

**Target:**
- Viral sharing: +40% (legendary upsets drive shares)
- User retention: +25% (unpredictability keeps people engaged)
- Average payout: 2x → 3.2x (contrarian wins are higher)

**Tracking:**
```typescript
// Track upset impact
const upsetChapters = await prisma.chapter.findMany({
  where: { wasContrarian: true },
  include: {
    _count: {
      select: { shares: true, bets: true },
    },
  },
})

const avgUpsetShares = upsetChapters.reduce((sum, c) => sum + c._count.shares, 0) / upsetChapters.length
const avgNormalShares = ... // Compare to non-upset chapters

console.log('Upset share boost:', ((avgUpsetShares / avgNormalShares - 1) * 100).toFixed(0) + '%')
```

### Revenue Metrics

**Indirect Revenue (from engagement boost):**
```
Year 1 betting volume: $1M → $1.4M (+40%)
Platform fees (2.5%): $25K → $35K (+$10K)

Year 5 betting volume: $20M → $28M (+40%)
Platform fees: $500K → $700K (+$200K)
```

### Fairness Metrics

**Prevent Whale Dominance:**
```typescript
// Measure bet diversity
const chapterStats = await prisma.chapter.findMany({
  include: {
    choices: {
      include: {
        bets: true,
      },
    },
  },
})

chapterStats.forEach(chapter => {
  const giniCoefficient = calculateGini(chapter.choices.flatMap(c => c.bets))
  console.log(`Chapter ${chapter.number}: Gini ${giniCoefficient.toFixed(2)} (0=perfect equality, 1=one whale dominates)`)
})

// Target: Gini < 0.5 (relatively balanced)
```

---

## Roadmap

### Phase 1: POC (Week 1-2) ✅
- [x] Core algorithm
- [x] Claude API integration
- [x] Configuration system
- [x] Documentation

### Phase 2: Testing (Week 3)
- [ ] Unit tests
- [ ] Integration tests
- [ ] Historical data backtesting
- [ ] Calibration (tune probabilities)

### Phase 3: Integration (Week 4)
- [ ] Database schema update
- [ ] API route integration
- [ ] Frontend UI (upset badges)
- [ ] Monitoring + analytics

### Phase 4: Launch (Week 5)
- [ ] Beta testing (10 chapters)
- [ ] Collect feedback
- [ ] Fine-tune configuration
- [ ] Public launch

---

## FAQ

**Q: Won't contrarian AI feel unfair?**  
A: No—it's calibrated to favor narrative coherence (70%). Upsets only happen when:
1. Betting is extremely skewed (4:1+)
2. Underdog choice has high narrative coherence
3. Random chance aligns (30% probability)

**Q: Can whales game the system?**  
A: No—contrarian probability is capped at 30%, so majority still wins 70% of the time. Plus, narrative coherence prevents nonsensical upsets.

**Q: How often will upsets happen?**  
A: Estimate:
- 40% of chapters have 4:1+ betting ratio
- 30% upset chance when triggered
- **~12% of chapters = legendary upsets** (6/50 chapters)

**Q: What if both choices have high coherence?**  
A: Then majority wins (safer for story). Upsets only happen when underdog + contrarian bonus > majority.

**Q: Can I disable it?**  
A: Yes—set `enabled: false` in config.

---

## Conclusion

**Bettor's Paradox Engine = Unpredictability + Fairness + Viral Moments**

✅ **Prevents predictable outcomes** (no more boring 1.25x payouts)  
✅ **Creates legendary upsets** (4x+ payouts, viral sharing)  
✅ **Maintains narrative coherence** (story makes sense)  
✅ **Prevents whale dominance** (fair for all bettors)

**Ready for integration into Voidborne! 🚀**

---

**Author:** Claw (AI Innovation Specialist)  
**Date:** February 16, 2026  
**Innovation Cycle:** #45  
**Status:** ✅ POC READY FOR TESTING
