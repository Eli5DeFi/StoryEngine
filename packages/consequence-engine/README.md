# @voidborne/consequence-engine

**Consequence Propagation Engine** for Voidborne - Track narrative state and propagate choice outcomes across chapters.

## Overview

The Consequence Propagation Engine (CPE) makes every player choice have permanent, rippling consequences throughout the narrative. Characters remember, relationships evolve, world states change, and plot threads interweave based on betting outcomes.

### Key Features

- **Persistent Narrative State** - Track characters, world state, and plot threads across chapters
- **Consequence Rules** - Define how choices affect future narrative
- **Conditional Logic** - Rules trigger based on current state
- **AI Integration** - Generate context for AI chapter generation
- **Visual Feedback** - React components for displaying consequences

## Installation

```bash
cd packages/consequence-engine
pnpm install
pnpm build
```

## Quick Start

### 1. Initialize Narrative State

```typescript
import { ConsequenceEngine, ConsequenceStorage } from '@voidborne/consequence-engine'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const storage = new ConsequenceStorage(prisma)

// Create initial state for a new story
const initialState = ConsequenceEngine.initializeState('story-123')
await storage.saveState(initialState)
```

### 2. Define Consequence Rules

```typescript
import { createExampleRules } from '@voidborne/consequence-engine'

// Create example rules for Voidborne Chapter 3
const rules = createExampleRules('story-123')

// Save rules to database
for (const rule of rules) {
  await storage.saveRule(rule)
}
```

### 3. Apply Consequences After Choice

```typescript
// When a bet is placed or a choice is made
const currentState = await storage.getLatestState('story-123')
const rules = await storage.loadRulesForChoice('story-123', 'choice-accuse-kaelen')

const result = await ConsequenceEngine.applyConsequences(
  currentState,
  'choice-accuse-kaelen',
  rules
)

if (result.success) {
  // Save updated state
  await storage.saveState(result.newState)
  
  // Log applied consequences
  console.log(`Applied ${result.appliedRules.length} rules`)
  console.log(`Made ${result.changes.length} state changes`)
  
  // Show to user (optional)
  result.appliedRules.forEach(rule => {
    if (rule.displayText) {
      console.log(`📢 ${rule.displayText}`)
    }
  })
}
```

### 4. Generate AI Context

```typescript
// When generating next chapter
const state = await storage.getLatestState('story-123')
const allRules = await storage.loadRules('story-123')

const context = ConsequenceEngine.generateAIContext(state, 4, allRules)
const prompt = ConsequenceEngine.formatForPrompt(context)

// Use prompt with Claude/GPT-4
const chapterContent = await generateWithAI(`
You are writing Chapter 4 of Voidborne.

${prompt}

Generate the chapter content following these constraints...
`)
```

## Core Concepts

### Narrative State

The complete state of the narrative at a given chapter:

```typescript
interface NarrativeState {
  storyId: string
  chapterNumber: number
  
  // Character states
  characters: {
    [characterId: string]: {
      alive: boolean
      reputation: number // -100 to +100
      location: string
      relationships: Record<string, number>
      traumaticEvents: string[]
      secrets: string[]
      powerLevel: number
    }
  }
  
  // World state
  world: {
    politicalTension: number // 0-100
    economicStability: number
    factionInfluence: Record<string, number>
    activeWars: string[]
    discoveredTechnologies: string[]
    cosmicAnomalies: string[]
  }
  
  // Plot threads
  plotThreads: {
    [threadId: string]: {
      status: 'dormant' | 'active' | 'resolved'
      tension: number
      keySuspects: string[]
      cluesDiscovered: number
    }
  }
}
```

### Consequence Rules

Define how choices affect narrative state:

```typescript
const rule: ConsequenceRule = {
  id: 'rule-accuse-kaelen',
  name: 'Kaelen Reputation Drop',
  description: 'Publicly accusing Lord Kaelen damages his reputation',
  storyId: 'story-123',
  triggerChoiceId: 'choice-accuse-kaelen',
  triggerChapter: 3,
  
  // State mutations
  mutations: [
    { op: 'add', path: 'characters.lord-kaelen.reputation', value: -65 },
    { op: 'set', path: 'characters.lord-kaelen.relationships.player', value: -80 },
  ],
  
  // Future requirements
  futureRequirements: {
    4: ['Lord Kaelen must plot revenge'],
    12: ['Lord Kaelen betrays player if relationship < -70'],
  },
  
  // Display
  displayText: '⚠️ Lord Kaelen now despises you',
  severity: 'critical',
}
```

### Mutation Operations

Supported operations for modifying state:

- `set` - Set value directly
- `add` - Add to number
- `subtract` - Subtract from number
- `multiply` - Multiply number
- `append` - Add to array
- `remove` - Remove from array
- `toggle` - Toggle boolean

### Conditional Rules

Rules can have conditions that must be met:

```typescript
const conditionalRule: ConsequenceRule = {
  // ... base fields ...
  conditions: [
    { path: 'world.politicalTension', operator: 'gt', value: 80 },
    { path: 'characters.lord-kaelen.reputation', operator: 'lt', value: -60 },
  ],
  // Only triggers if BOTH conditions are true
}
```

## API Reference

### ConsequenceEngine

#### `initializeState(storyId: string): NarrativeState`

Create initial narrative state for a new story.

#### `applyConsequences(state, choiceId, rules): Promise<ConsequenceTriggerResult>`

Apply consequence rules after a choice is made.

#### `generateAIContext(state, targetChapter, rules): AIGenerationContext`

Generate AI generation context from current state.

#### `formatForPrompt(context): string`

Format AI context as a text prompt for Claude/GPT-4.

#### `validateRule(rule): { valid: boolean; errors: string[] }`

Validate a consequence rule definition.

### ConsequenceStorage

#### `saveState(state): Promise<void>`

Save narrative state to database.

#### `loadState(storyId, chapterNumber): Promise<NarrativeState | null>`

Load specific chapter state.

#### `getLatestState(storyId): Promise<NarrativeState>`

Get most recent state (or initialize new).

#### `saveRule(rule): Promise<void>`

Save consequence rule.

#### `loadRules(storyId): Promise<ConsequenceRule[]>`

Load all rules for a story.

#### `loadRulesForChoice(storyId, choiceId): Promise<ConsequenceRule[]>`

Load rules that trigger for a specific choice.

#### `advanceState(storyId, fromChapter, toChapter): Promise<NarrativeState>`

Clone state to next chapter.

## React Components

### ConsequenceTree

Visualize consequence results:

```tsx
import { ConsequenceTree } from '@/components/consequence/ConsequenceTree'

function ChapterPage() {
  const [result, setResult] = useState<ConsequenceTriggerResult | null>(null)
  
  const handleChoice = async (choiceId: string) => {
    const res = await fetch(`/api/consequences/apply`, {
      method: 'POST',
      body: JSON.stringify({ choiceId }),
    })
    const data = await res.json()
    setResult(data)
  }
  
  return (
    <div>
      {/* ... choice buttons ... */}
      
      {result && <ConsequenceTree result={result} />}
    </div>
  )
}
```

## Database Schema

Required Prisma models:

```prisma
model NarrativeState {
  id            String   @id @default(cuid())
  storyId       String
  chapterNumber Int
  state         Json
  
  @@unique([storyId, chapterNumber])
  @@map("narrative_states")
}

model ConsequenceRule {
  id              String   @id @default(cuid())
  storyId         String
  triggerChoiceId String
  triggerChapter  Int
  mutations       Json
  conditions      Json?
  futureRequirements Json?
  displayText     String?
  severity        String?
  
  @@map("consequence_rules")
}
```

## Examples

See `src/examples.ts` for complete example rules for Voidborne Chapter 3.

## Testing

```bash
pnpm test
```

## License

MIT
