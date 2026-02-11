# Feature Spec: Interactive Decision Tree Visualizer 🌳

**Status:** Ready for Implementation  
**Priority:** HIGH (Unique Value Proposition)  
**Estimated Dev Time:** 3-4 days  
**Category:** Story Feature + Data Visualization

---

## 🎯 The Problem

Current story reading experience lacks:
- **Historical context** (what choices were made?)
- **Alternative paths** (what if we chose differently?)
- **Visual storytelling** (hard to see narrative branches)
- **Replay value** (can't explore other timelines)

Result: Stories feel linear. Users don't appreciate the complexity of branching narratives.

---

## 💡 The Solution

**Interactive Decision Tree That Shows:**
1. All chapters + choices made
2. Alternative paths not taken
3. Community vote distribution per choice
4. "What-if" simulator for alternate timelines
5. Butterfly effect visualization

### Core Features

#### 1. **Tree Visualization**

```
Chapter 1: The Awakening
    ↓
Choice A (Chosen: 67%) ← YOU BET HERE ✓
    ↓
Chapter 2: The Revelation
    ↓
Choice B (Chosen: 43%) ← YOU BET HERE ✗
    ↓
Chapter 3: ??? (CURRENT)
    ↓
[Vote Now]

Alternative Timeline (33% voted):
Choice A' → Chapter 2' → Different outcome
```

**Visual Style:**
- Nodes = Chapters (circles with cover images)
- Edges = Choices (lines with vote %)
- Colors:
  - Gold = Chosen path
  - Gray = Not taken
  - Green = You predicted correctly
  - Red = You predicted wrong
  - Blue = Not yet resolved

#### 2. **What-If Simulator**

Click any past choice → See AI-generated alternate chapter

```
┌─────────────────────────────────────────┐
│  🔮 What If: Choice B Was Chosen?       │
├─────────────────────────────────────────┤
│                                         │
│  "Instead of trusting House Valdris,   │
│   you allied with the Stitchers. The   │
│   Silent Throne now belongs to..."     │
│                                         │
│  [Read Full Alternate Chapter]          │
│  [Return to Canon Timeline]            │
└─────────────────────────────────────────┘
```

**AI Generation:**
- Use GPT-4 to generate alternate outcomes
- Base on original prompt + "But what if [choice]"
- Cache for 7 days (expensive to regenerate)
- Show "speculative" badge (not canon)

#### 3. **Butterfly Effect View**

Show how early choices cascade:

```
Chapter 1: Choice A (67%)
    ↓
Unlocked: House Valdris Alliance
    ↓
Chapter 3: Only available if Choice A
    ↓
Chapter 7: Final boss changes
```

**Mechanic:**
- Some choices lock/unlock future paths
- Show which choices affected what
- Create "key decision" highlights

#### 4. **Community Pulse**

Overlay vote distribution on tree:

```
Chapter 2 Voting:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
67% Choice A: Trust Valdris
33% Choice B: Join Stitchers
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your Bet: Choice B (minority)
Payout if correct: 3.03x
```

---

## 🎮 User Experience

### 1. Tree Navigation

**Main View: "Story Map"**
- Full tree from Chapter 1 → Current
- Zoom/pan controls (like Google Maps)
- Click chapter → Read content
- Click choice → See vote breakdown
- Hover → Preview chapter summary

**Mobile:**
- Vertical scrolling tree
- Collapse/expand branches
- Swipe between timelines

### 2. Timeline Switcher

**Toggle View:**
```
[Canon Timeline] [Alternate Timeline 1] [Alternate Timeline 2]
```

- Canon = Actual story path
- Alternates = Major "what-if" branches
- Generated on-demand (first click)
- Saved for future readers

### 3. Personal Journey

**Highlight Your Bets:**
- Green checkmarks = Correct predictions
- Red X = Wrong predictions
- Gray = Didn't bet
- Show your accuracy % on tree

**Stats Panel:**
```
┌─────────────────────────┐
│  Your Story Stats       │
├─────────────────────────┤
│  Chapters Read: 12/15   │
│  Bets Placed: 10        │
│  Correct: 7 (70%)       │
│  Total Winnings: $420   │
│  Streak: 3 🔥🔥🔥       │
└─────────────────────────┘
```

### 4. Annotations

**Add to each node:**
- Chapter title + summary
- Publish date
- Total bets on that chapter
- Winner choice
- Top 3 bettors (whale tracker)

---

## 🏗️ Technical Implementation

### Database Schema Changes

```prisma
// New model: DecisionTreeNode
model DecisionTreeNode {
  id            String   @id @default(cuid())
  createdAt     DateTime @default(now())
  
  // Tree structure
  storyId       String
  story         Story    @relation(fields: [storyId], references: [id])
  
  chapterId     String   @unique
  chapter       Chapter  @relation(fields: [chapterId], references: [id])
  
  // Hierarchy
  parentNodeId  String?
  parentChoice  String?  // Which choice led here
  depth         Int      @default(0)
  
  // Metadata
  isCanon       Boolean  @default(true)
  isAlternate   Boolean  @default(false)
  
  // Relationships
  children      DecisionTreeNode[] @relation("NodeHierarchy")
  parent        DecisionTreeNode?  @relation("NodeHierarchy", fields: [parentNodeId], references: [id])
  
  @@index([storyId, depth])
  @@map("decision_tree_nodes")
}

// New model: AlternateChapter (What-If scenarios)
model AlternateChapter {
  id            String   @id @default(cuid())
  createdAt     DateTime @default(now())
  
  // Original chapter reference
  originalChapterId String
  originalChapter   Chapter @relation(fields: [originalChapterId], references: [id])
  
  // Alternate content
  title         String
  content       String   @db.Text
  summary       String?  @db.Text
  
  // What changed?
  divergenceChoice String // Which choice created this branch
  
  // AI metadata
  aiModel       String   // GPT-4
  generatedAt   DateTime @default(now())
  viewCount     Int      @default(0)
  
  // Cache
  expiresAt     DateTime // Regenerate after 7 days
  
  @@index([originalChapterId])
  @@map("alternate_chapters")
}

// Update Chapter model
model Chapter {
  // ... existing fields
  
  // Tree relationships
  treeNode         DecisionTreeNode?
  alternateVersions AlternateChapter[]
}
```

**Migration:**
```bash
pnpm prisma migrate dev --name add_decision_tree
```

### API Endpoints

#### 1. GET `/api/stories/[storyId]/tree`

**Response:**
```json
{
  "storyId": "...",
  "nodes": [
    {
      "id": "node1",
      "chapterId": "ch1",
      "chapterNumber": 1,
      "title": "The Awakening",
      "depth": 0,
      "isCanon": true,
      "children": [
        {
          "id": "node2",
          "chapterId": "ch2",
          "parentChoice": "choice-a",
          "choiceText": "Trust House Valdris",
          "voteDistribution": {
            "choice-a": 0.67,
            "choice-b": 0.33
          },
          "totalBets": 1425,
          "chosenOption": "choice-a"
        }
      ]
    }
  ],
  "userBets": [
    {
      "chapterId": "ch1",
      "choiceId": "choice-a",
      "isCorrect": true,
      "payout": 120.5
    }
  ],
  "stats": {
    "totalChapters": 15,
    "chaptersRead": 12,
    "betsPlaced": 10,
    "correctBets": 7,
    "accuracy": 0.70,
    "totalWinnings": 420.75
  }
}
```

#### 2. POST `/api/stories/[storyId]/what-if`

**Request:**
```json
{
  "chapterId": "ch2",
  "alternateChoiceId": "choice-b"
}
```

**Response:**
```json
{
  "alternateChapterId": "alt-ch3",
  "title": "Alternate Chapter 3: Alliance with Stitchers",
  "content": "...",
  "summary": "...",
  "divergencePoint": "Chapter 2: Choice B",
  "isSpeculative": true,
  "generatedAt": "2026-02-12T05:00:00Z"
}
```

**Backend Logic:**
```typescript
// Check cache first
const existing = await prisma.alternateChapter.findFirst({
  where: {
    originalChapterId: chapterId,
    divergenceChoice: alternateChoiceId,
    expiresAt: { gte: new Date() }
  }
})

if (existing) {
  return existing
}

// Generate new alternate chapter
const originalChapter = await prisma.chapter.findUnique({
  where: { id: chapterId },
  include: { story: true, choices: true }
})

const prompt = `
Continue the story "${originalChapter.story.title}" but with an alternate choice:

Original choice: ${originalChapter.choices[0].text}
Alternate choice: ${alternateChoice.text}

Previous chapter:
${originalChapter.content}

Write the next chapter (500-800 words) showing how the alternate choice changes the story.
`

const aiResponse = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: prompt }]
})

// Save to database
const alternateChapter = await prisma.alternateChapter.create({
  data: {
    originalChapterId: chapterId,
    divergenceChoice: alternateChoiceId,
    title: extractTitle(aiResponse.content),
    content: aiResponse.content,
    aiModel: 'gpt-4o',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
})

return alternateChapter
```

#### 3. GET `/api/stories/[storyId]/butterfly-effect`

**Response:**
```json
{
  "cascades": [
    {
      "originChapter": 1,
      "originChoice": "choice-a",
      "effects": [
        {
          "chapter": 3,
          "unlocked": ["ally-valdris-quest"],
          "locked": ["stitcher-rebellion"]
        },
        {
          "chapter": 7,
          "changedOutcome": "Boss fight: Valdris helps you"
        }
      ]
    }
  ]
}
```

### React Components

#### 1. `DecisionTreeViz.tsx` (Main Component)

```tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import * as d3 from 'd3'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

export function DecisionTreeViz({ storyId, userId }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [treeData, setTreeData] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)
  
  useEffect(() => {
    fetchTreeData()
  }, [storyId])
  
  useEffect(() => {
    if (treeData && svgRef.current) {
      renderTree()
    }
  }, [treeData])
  
  async function fetchTreeData() {
    const res = await fetch(`/api/stories/${storyId}/tree?userId=${userId}`)
    const data = await res.json()
    setTreeData(data)
  }
  
  function renderTree() {
    const svg = d3.select(svgRef.current)
    const width = 1200
    const height = 800
    
    // Create tree layout
    const treeLayout = d3.tree()
      .size([height - 100, width - 200])
    
    // Convert data to hierarchy
    const root = d3.hierarchy(treeData.nodes[0], d => d.children)
    const treeNodes = treeLayout(root)
    
    // Clear previous render
    svg.selectAll('*').remove()
    
    const g = svg.append('g')
      .attr('transform', 'translate(100, 50)')
    
    // Draw links (edges)
    g.selectAll('.link')
      .data(treeNodes.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x)
      )
      .attr('stroke', d => {
        const choice = d.target.data.parentChoice
        const userBet = getUserBet(d.target.data.chapterId)
        
        if (!choice) return '#666'
        if (userBet?.isCorrect) return '#10B981' // Green
        if (userBet && !userBet.isCorrect) return '#EF4444' // Red
        return '#F59E0B' // Gold (canon)
      })
      .attr('stroke-width', 2)
      .attr('fill', 'none')
    
    // Draw nodes (chapters)
    const nodeGroup = g.selectAll('.node')
      .data(treeNodes.descendants())
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.y},${d.x})`)
      .on('click', (event, d) => setSelectedNode(d.data))
    
    // Node circles
    nodeGroup.append('circle')
      .attr('r', 30)
      .attr('fill', d => {
        if (d.data.isCurrentChapter) return '#F59E0B' // Gold
        if (d.data.isAlternate) return '#6B7280' // Gray
        return '#0EA5E9' // Blue
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
    
    // Node labels
    nodeGroup.append('text')
      .attr('dy', -40)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', 14)
      .attr('font-weight', 'bold')
      .text(d => `Ch ${d.data.chapterNumber}`)
    
    // Vote distribution (if available)
    nodeGroup.filter(d => d.data.voteDistribution)
      .append('text')
      .attr('dy', 50)
      .attr('text-anchor', 'middle')
      .attr('fill', '#A3A3A3')
      .attr('font-size', 10)
      .text(d => {
        const votes = d.data.voteDistribution
        return `${(votes * 100).toFixed(0)}% voted`
      })
    
    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 2])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })
    
    svg.call(zoom)
  }
  
  function getUserBet(chapterId: string) {
    return treeData?.userBets?.find(b => b.chapterId === chapterId)
  }
  
  return (
    <div className="relative">
      {/* Controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button className="glass-card p-2 rounded-lg hover:bg-white/10">
          <ZoomIn className="w-5 h-5" />
        </button>
        <button className="glass-card p-2 rounded-lg hover:bg-white/10">
          <ZoomOut className="w-5 h-5" />
        </button>
        <button className="glass-card p-2 rounded-lg hover:bg-white/10">
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
      
      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-[800px] bg-void-950 rounded-2xl"
        viewBox="0 0 1200 800"
      />
      
      {/* Node Details Panel */}
      {selectedNode && (
        <NodeDetailsPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  )
}
```

#### 2. `NodeDetailsPanel.tsx`

```tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles } from 'lucide-react'
import { useState } from 'react'

export function NodeDetailsPanel({ node, onClose }) {
  const [alternateContent, setAlternateContent] = useState(null)
  const [loading, setLoading] = useState(false)
  
  async function generateAlternate() {
    setLoading(true)
    
    const res = await fetch(`/api/stories/${node.storyId}/what-if`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chapterId: node.chapterId,
        alternateChoiceId: node.alternateChoiceId
      })
    })
    
    const data = await res.json()
    setAlternateContent(data)
    setLoading(false)
  }
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="glass-card p-8 rounded-2xl max-w-2xl max-h-[80vh] overflow-y-auto mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                {node.title}
              </h2>
              <div className="flex items-center gap-3 text-sm text-void-400">
                <span>Chapter {node.chapterNumber}</span>
                <span>•</span>
                <span>{node.totalBets} bets</span>
                {node.voteDistribution && (
                  <>
                    <span>•</span>
                    <span>{(node.voteDistribution * 100).toFixed(0)}% consensus</span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Summary */}
          <div className="mb-6">
            <p className="text-void-300">{node.summary}</p>
          </div>
          
          {/* Vote Breakdown */}
          {node.choices && (
            <div className="mb-6">
              <h3 className="text-lg font-display font-bold text-gold mb-3">
                Vote Distribution
              </h3>
              {node.choices.map((choice) => (
                <div key={choice.id} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground">{choice.text}</span>
                    <span className="text-gold font-medium">
                      {(choice.percentage * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-void-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gold transition-all"
                      style={{ width: `${choice.percentage * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* What-If Button */}
          {node.alternateChoice && !alternateContent && (
            <button
              onClick={generateAlternate}
              disabled={loading}
              className="w-full px-6 py-3 bg-drift-teal hover:bg-drift-teal/80 text-void-950 font-ui font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-void-950 border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  What If: {node.alternateChoice}?
                </>
              )}
            </button>
          )}
          
          {/* Alternate Content */}
          {alternateContent && (
            <div className="mt-6 p-4 bg-drift-teal/10 border border-drift-teal/30 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-drift-teal" />
                <span className="text-xs text-drift-teal font-medium uppercase">
                  Speculative Timeline
                </span>
              </div>
              <h3 className="text-lg font-display font-bold text-foreground mb-2">
                {alternateContent.title}
              </h3>
              <p className="text-void-300 text-sm leading-relaxed">
                {alternateContent.summary}
              </p>
              <button className="mt-4 text-sm text-drift-teal hover:text-drift-teal/80 font-medium">
                Read Full Alternate Chapter →
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
```

#### 3. Integration into Story Page

```tsx
// In apps/web/src/app/story/[storyId]/page.tsx

import { DecisionTreeViz } from '@/components/story/DecisionTreeViz'

export default function StoryPage({ params }: { params: { storyId: string } }) {
  const [view, setView] = useState<'read' | 'tree'>('read')
  
  return (
    <div>
      {/* View Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView('read')}
          className={cn(
            'px-4 py-2 rounded-lg font-ui font-medium',
            view === 'read' ? 'bg-gold text-void-950' : 'bg-void-900 text-void-400'
          )}
        >
          Read Story
        </button>
        <button
          onClick={() => setView('tree')}
          className={cn(
            'px-4 py-2 rounded-lg font-ui font-medium',
            view === 'tree' ? 'bg-gold text-void-950' : 'bg-void-900 text-void-400'
          )}
        >
          🌳 Decision Tree
        </button>
      </div>
      
      {/* Content */}
      {view === 'read' ? (
        <ChapterReader storyId={params.storyId} />
      ) : (
        <DecisionTreeViz storyId={params.storyId} />
      )}
    </div>
  )
}
```

---

## 📊 Expected Impact

### Engagement Metrics

**Before Tree Visualizer:**
- Session duration: 3 min (read + bet + leave)
- Pages/session: 1.2
- Return rate: 20%
- Social shares: 5/day

**After Tree Visualizer (Projected):**
- Session duration: 12 min (+300%)
- Pages/session: 4.5 (+275%)
- Return rate: 45% (+125%)
- Social shares: 50/day (+900%)

**Why It Works:**
1. **Exploration** → Users explore alternate paths
2. **Nostalgia** → Revisit past choices
3. **Curiosity** → What-if scenarios
4. **Social Proof** → Share their tree with friends
5. **Replayability** → Multiple timelines

### Unique Value Proposition

**What competitors can't copy:**
- Netflix → No interactivity
- Twitch Plays → No persistence
- Text adventures → No visualization
- Traditional books → Linear only

**NarrativeForge = Only platform with:**
- AI-generated branching narratives
- Blockchain betting
- Visual decision trees
- What-if simulator
- Community-driven storytelling

---

## ✅ Implementation Checklist

### Phase 1: Backend (Day 1-2)
- [ ] Prisma schema updates
- [ ] Database migration
- [ ] Tree building algorithm
- [ ] API: GET `/api/stories/[id]/tree`
- [ ] API: POST `/api/stories/[id]/what-if`
- [ ] API: GET `/api/stories/[id]/butterfly-effect`
- [ ] What-if AI generation logic
- [ ] Caching layer for alternates

### Phase 2: Frontend (Day 2-3)
- [ ] Install D3.js (`pnpm add d3 @types/d3`)
- [ ] `DecisionTreeViz.tsx` component
- [ ] `NodeDetailsPanel.tsx` component
- [ ] `WhatIfGenerator.tsx` component
- [ ] Zoom/pan controls
- [ ] Mobile-responsive tree
- [ ] Loading states

### Phase 3: Polish (Day 4)
- [ ] Animations (node entrance, link drawing)
- [ ] User bet highlights (green/red)
- [ ] Stats panel
- [ ] Butterfly effect overlay
- [ ] Social sharing ("Check out my decision tree!")
- [ ] Analytics tracking
- [ ] Performance optimization

---

## 🚀 Launch Strategy

### Week 1: Beta
- Enable for existing stories (backfill)
- Announce: "See the full story map!"
- Collect user feedback

### Week 2: What-If Launch
- Enable AI-generated alternates
- Run contest: "Best What-If Scenario Wins $500"
- Press outreach (unique feature)

### Week 3: Social
- Add share feature
- Influencer campaigns
- TikTok demos (visual storytelling)

---

## 📝 Success Metrics

**Track:**
1. Tree view rate (% users who open tree)
2. Avg time on tree
3. What-if generation rate
4. Share rate (Twitter/Discord)
5. Return visits (to check tree updates)

**Goals:**
- 70%+ users open tree at least once
- 5+ min avg session on tree
- 30% generate a what-if
- 20% share their tree
- 2x return visit rate

---

## 🎯 Why This Is a 10x Feature

1. **Unique Differentiator** → No one else has this
2. **Viral Potential** → Beautiful, shareable visualizations
3. **Replayability** → Infinite alternate timelines
4. **Educational** → Shows branching narrative complexity
5. **Sticky** → Users come back to update their tree
6. **Premium Feel** → Looks expensive and polished

**Result:** NarrativeForge becomes the **ONLY** platform where you can truly explore all possible story timelines.

---

**Ready to implement? Start with Phase 1 backend! 🚀**
