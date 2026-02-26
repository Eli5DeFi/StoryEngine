# Character Chat Feature

**Status:** ✅ Production Ready  
**Innovation Cycle:** February 16, 2026  
**Feature:** Character Consciousness Protocol (CCP)

---

## Overview

The **Character Chat** feature allows users to have real-time conversations with AI-powered character agents from the Voidborne universe. Characters remember past interactions, build relationships with users, and unlock secrets as trust grows.

### Key Features

✅ **Real-time AI Conversations** - Powered by Claude Sonnet 4.5  
✅ **Relationship Leveling** - 10 levels from Stranger to Soulbound  
✅ **Progressive Secret Unlocking** - 5 secrets per character revealed as trust builds  
✅ **Conversation Memory** - Persistent chat history stored locally  
✅ **Dynamic Personality** - Characters respond in-character based on their backstory and current state  
✅ **XP System** - 10 XP per message, 50 XP per level

---

## User Flow

### 1. Character Selection

**URL:** `/characters`

Users see a grid of available characters with:
- Character name and house affiliation
- Current emotional state
- Location in the story
- Current chapter

**Action:** Click any character to start chatting

### 2. Chat Interface

**URL:** `/characters/[characterId]`

#### Layout

```
┌─────────────────────────────────────────────┐
│ Header: Character Info + Relationship Level │
├─────────────────────────────────────────────┤
│                                             │
│  Chat Messages (scrollable)                 │
│    - User messages (blue, right-aligned)   │
│    - Character messages (gray, left)       │
│                                             │
├─────────────────────────────────────────────┤
│ Input Area: Textarea + Send Button          │
└─────────────────────────────────────────────┘
```

#### Relationship Dashboard

Top-right header shows:
- **Level:** Current relationship level (1-10)
- **XP Progress Bar:** Visual progress to next level
- **XP Counter:** "25/50 XP" format

#### Secret Unlock Modal

When a user levels up and unlocks a secret:
1. Modal appears with "🔓 Secret Unlocked!"
2. Displays the unlocked secret text
3. "Continue Conversation" button dismisses modal

---

## Technical Implementation

### API Routes

#### `GET /api/character-chat`

**Query Parameters:**
- `characterId` (optional) - Get specific character info

**Response (single character):**
```json
{
  "characterId": "zara-001",
  "name": "Commander Zara Vex",
  "house": "Valdris (formerly)",
  "currentState": {
    "chapterId": 1,
    "emotionalState": "Tense but controlled",
    "location": "Flagship Retribution"
  },
  "personality": {
    "values": ["Loyalty", "Justice", "Strategic thinking"],
    "speechPatterns": ["Direct", "Military precision"]
  }
}
```

**Response (all characters):**
```json
{
  "characters": [
    { "characterId": "zara-001", "name": "...", ... }
  ]
}
```

---

#### `POST /api/character-chat`

**Request Body:**
```json
{
  "characterId": "zara-001",
  "userId": "user-1",
  "message": "Tell me about your brother",
  "conversationHistory": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "..." }
  ],
  "currentXp": 40
}
```

**Response:**
```json
{
  "response": "My brother Marcus... [long response]",
  "xp": 50,
  "level": 2,
  "leveledUp": true,
  "secretsUnlocked": [
    "Her brother Marcus died under suspicious circumstances 5 years ago."
  ],
  "character": {
    "id": "zara-001",
    "name": "Commander Zara Vex"
  }
}
```

---

### Frontend Components

#### `/app/characters/page.tsx`

Character selection grid. Features:
- Fetches all characters from API
- Responsive grid layout (1 col mobile, 2 col tablet, 3 col desktop)
- Hover effects and smooth animations
- Links to individual character chat pages

#### `/app/characters/[characterId]/page.tsx`

Main chat interface. Features:
- Real-time message sending
- Auto-scroll to newest message
- XP and level tracking
- Secret unlock modal
- Persistent conversation storage (localStorage)
- Loading states and error handling

---

## Character Profile Structure

### Example: Commander Zara Vex

```typescript
{
  characterId: 'zara-001',
  name: 'Commander Zara Vex',
  house: 'Valdris (formerly)',
  personality: {
    values: ['Loyalty', 'Justice', 'Strategic thinking'],
    fears: ['Betrayal', 'Powerlessness', 'Losing loved ones'],
    goals: ['Revenge', 'Protect fleet', 'Uncover truth'],
    speechPatterns: ['Direct', 'Military precision', 'Dark humor', 'Guarded']
  },
  lore: {
    backstory: "Born on Station Alpha-7, rose to fleet commander at 28...",
    secrets: [
      { level: 1, text: "Brother died 5 years ago" },
      { level: 3, text: "Has evidence linking Admiral Theron to death" },
      { level: 5, text: "Planted malware in Valdris systems" },
      { level: 7, text: "Funds rebel cells with stolen assets" },
      { level: 10, text: "Brother is alive, infiltrated Shadow Council" }
    ]
  },
  currentState: {
    chapterId: 1,
    emotionalState: 'Tense but controlled',
    location: 'Flagship Retribution',
    knownInformation: [
      'Silent Throne is vacant',
      'Three houses compete',
      'Valdris heir rumored weak'
    ]
  }
}
```

---

## XP and Leveling System

### XP Mechanics

- **XP per message:** 10 XP
- **XP per level:** 50 XP
- **Max level:** 10 (450 total XP)

### Level Progression

| Level | Total XP | Relationship Tier | Secrets Available |
|-------|----------|-------------------|-------------------|
| 1     | 0-49     | Stranger          | None              |
| 2     | 50-99    | Acquaintance      | 1                 |
| 3     | 100-149  | Acquaintance      | 2                 |
| 4     | 150-199  | Friend            | 2                 |
| 5     | 200-249  | Friend            | 3                 |
| 6     | 250-299  | Confidant         | 3                 |
| 7     | 300-349  | Confidant         | 4                 |
| 8     | 350-399  | Trusted           | 4                 |
| 9     | 400-449  | Trusted           | 4                 |
| 10    | 450+     | Soulbound         | 5 (all)           |

### AI Prompt Adjustments by Level

**Level 1 (Stranger):**
- Guarded responses
- No personal details
- Professional tone only

**Level 3 (Acquaintance):**
- Share opinions
- Minor concerns
- Slightly warmer

**Level 5 (Friend):**
- Reveal vulnerabilities
- Share first 3 secrets
- Ask for user's opinion

**Level 7 (Confidant):**
- Dark secrets revealed
- Deep emotional trust
- Seek user's advice

**Level 10 (Soulbound):**
- Complete honesty
- All secrets unlocked
- Treat user as closest ally

---

## Data Persistence

### LocalStorage Structure

**Key:** `chat-${characterId}`

**Value:**
```json
{
  "messages": [
    { "role": "user", "content": "...", "timestamp": "..." },
    { "role": "assistant", "content": "...", "timestamp": "..." }
  ],
  "xp": 120,
  "level": 3,
  "secretsUnlocked": [
    "Brother died 5 years ago",
    "Has evidence linking Admiral Theron"
  ]
}
```

**Why localStorage?**
- No backend database needed for MVP
- Instant load times
- Works offline
- Easy to implement

**Future:** Migrate to Supabase database for:
- Cross-device sync
- Cloud backup
- Analytics tracking
- Multi-user support

---

## API Cost Analysis

### Claude Sonnet 4.5 Pricing

**Model:** `claude-sonnet-4-5-20250131`

- **Input:** $3 per million tokens (~$0.003 per 1K tokens)
- **Output:** $15 per million tokens (~$0.015 per 1K tokens)

### Per-Message Cost

**Typical message:**
- System prompt: ~800 tokens (input)
- Conversation history: ~200 tokens (input)
- User message: ~50 tokens (input)
- Character response: ~300 tokens (output)

**Cost:** ~$0.0078 per message (~$0.008)

### Monthly Cost Projections

**Free Tier (5 messages/day):**
- 1,000 users × 5 messages × 30 days = 150,000 messages/month
- Cost: 150,000 × $0.008 = **$1,200/month**

**Premium Tier (50 messages/day):**
- 200 users × 50 messages × 30 days = 300,000 messages/month
- Cost: 300,000 × $0.008 = **$2,400/month**

**Total:** ~$3,600/month for 1,000 free + 200 premium users

**Revenue:** 200 premium × $9.99/month = **$1,998/month**

**Net:** -$1,602/month (breakeven at ~450 premium users)

---

## Testing

### Manual Testing

1. **Start dev server:**
   ```bash
   cd apps/web
   pnpm dev
   ```

2. **Navigate to** `http://localhost:3000/characters`

3. **Test flow:**
   - Click on Commander Zara Vex
   - Send message: "Hello, Commander"
   - Verify response appears
   - Check XP increases by 10
   - Send 5 messages to level up
   - Verify secret unlock modal appears

4. **Test persistence:**
   - Refresh page
   - Verify messages and XP are restored
   - Continue conversation

5. **Test edge cases:**
   - Empty message (should not send)
   - Long message (should wrap properly)
   - Rapid sending (should queue properly)

### API Testing

```bash
# Test character list
curl http://localhost:3000/api/character-chat

# Test single character info
curl "http://localhost:3000/api/character-chat?characterId=zara-001"

# Test chat
curl -X POST http://localhost:3000/api/character-chat \
  -H "Content-Type: application/json" \
  -d '{
    "characterId": "zara-001",
    "userId": "test-user",
    "message": "Tell me about yourself",
    "conversationHistory": [],
    "currentXp": 0
  }'
```

---

## Deployment Checklist

### Environment Variables

Ensure these are set in production:

```bash
ANTHROPIC_API_KEY=sk-ant-... # Required for AI chat
```

### Vercel Deployment

1. Push to feature branch
2. Vercel auto-deploys preview
3. Test character chat on preview URL
4. Verify API key is set in Vercel dashboard
5. Merge to main for production deploy

### Post-Deployment Validation

- [ ] Navigate to `/characters`
- [ ] Select a character
- [ ] Send a message
- [ ] Verify AI response appears
- [ ] Check XP increases
- [ ] Verify localStorage persistence works
- [ ] Test on mobile device
- [ ] Check console for errors

---

## Future Enhancements

### Phase 2 (Q2 2026)

- [ ] **Group Chats:** Talk to 2-3 characters simultaneously
- [ ] **Voice Mode:** ElevenLabs TTS integration for character voices
- [ ] **Premium Tier:** Subscription paywall for unlimited messages
- [ ] **Supabase Integration:** Cloud-synced conversations
- [ ] **Mobile Apps:** iOS/Android native apps

### Phase 3 (Q3 2026)

- [ ] **Character NFT Integration:** Owning a character SBT unlocks exclusive conversations
- [ ] **Influence System:** Conversation outcomes affect future story chapters
- [ ] **Achievements:** Unlock badges for relationship milestones
- [ ] **Social Sharing:** Share favorite conversations on Twitter

---

## Troubleshooting

### "ANTHROPIC_API_KEY not configured"

**Solution:** Add `ANTHROPIC_API_KEY` to `.env` file in project root

### Messages not persisting

**Solution:** Check browser localStorage. Clear and try again.

### Character not responding

**Solution:** Check API logs. Verify Claude API is reachable.

### XP not increasing

**Solution:** Check localStorage. May need to clear and start fresh.

---

## Support

**Questions?**
- Discord: [discord.gg/voidborne]
- GitHub Issues: [github.com/Eli5DeFi/StoryEngine/issues]
- Email: support@voidborne.live

---

**Created:** February 17, 2026  
**Last Updated:** February 17, 2026  
**Version:** 1.0.0
