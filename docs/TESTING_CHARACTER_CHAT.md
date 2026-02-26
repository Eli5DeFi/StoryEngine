# Testing Guide: Character Chat Feature

**Feature:** Character Consciousness Protocol (CCP)  
**Status:** Production Ready  
**Date:** February 17, 2026

---

## Quick Test (5 minutes)

### Prerequisites

```bash
# 1. Ensure ANTHROPIC_API_KEY is set
cat .env | grep ANTHROPIC_API_KEY

# 2. Install dependencies (if not done)
pnpm install

# 3. Start dev server
cd apps/web
pnpm dev
```

### Test Flow

1. **Navigate:** `http://localhost:3000/characters`
2. **Verify:** Character grid loads (Commander Zara Vex visible)
3. **Click:** Commander Zara Vex card
4. **Verify:** Chat interface loads
5. **Send:** "Hello, Commander Zara"
6. **Verify:**
   - Response appears in ~2-3 seconds
   - XP increases to 10
   - Level remains 1
   - Progress bar shows 10/50 XP (20%)
7. **Send:** 4 more messages
8. **Verify:**
   - XP reaches 50
   - Level increases to 2
   - "🔓 Secret Unlocked!" modal appears
   - Secret text is displayed
9. **Refresh:** Page
10. **Verify:**
    - Messages persist
    - XP and level persist
    - Conversation continues from where you left off

**✅ If all steps pass, feature is working correctly!**

---

## Comprehensive Test Suite

### 1. Character Selection Page

**Test Case 1.1: Page Loads**
- Navigate to `/characters`
- ✅ Page loads without errors
- ✅ Header "Character Consciousness Protocol" visible
- ✅ Feature cards visible (Build Relationships, Unlock Secrets, Influence Story)

**Test Case 1.2: Character Grid**
- ✅ At least 1 character card visible
- ✅ Character name displayed
- ✅ House affiliation displayed
- ✅ Current state (Chapter, State, Location) displayed
- ✅ "Start Conversation →" CTA visible

**Test Case 1.3: Hover Effects**
- Hover over character card
- ✅ Card background lightens
- ✅ Glow effect appears
- ✅ Arrow icon moves right
- ✅ Name changes to blue color

**Test Case 1.4: Responsive Layout**
- Resize browser to mobile width (375px)
- ✅ Grid switches to 1 column
- Resize to tablet (768px)
- ✅ Grid switches to 2 columns
- Resize to desktop (1024px)
- ✅ Grid switches to 3 columns

---

### 2. Character Chat Interface

**Test Case 2.1: Page Loads**
- Navigate to `/characters/zara-001`
- ✅ Page loads without errors
- ✅ Character name in header
- ✅ "Back" button visible
- ✅ Relationship level widget visible
- ✅ Chat area visible
- ✅ Input area visible
- ✅ Empty state message visible

**Test Case 2.2: Relationship Dashboard**
- ✅ "Relationship Level" label visible
- ✅ "Level 1" displayed
- ✅ XP progress bar visible
- ✅ "0/50 XP" text visible
- ✅ Progress bar is empty (0%)

**Test Case 2.3: Input Area**
- ✅ Textarea placeholder: "Message Commander Zara Vex..."
- ✅ Send button visible
- ✅ Send button disabled (no text)
- Type "Hello"
- ✅ Send button enabled
- ✅ Help text visible: "Press Enter to send, Shift+Enter for new line"

---

### 3. Conversation Flow

**Test Case 3.1: Send First Message**
- Type: "Hello, Commander Zara"
- Press Enter (or click Send)
- ✅ User message appears (blue, right-aligned)
- ✅ Timestamp visible
- ✅ Loading animation appears (3 bouncing dots)
- Wait ~2-3 seconds
- ✅ Character response appears (gray, left-aligned)
- ✅ Timestamp visible
- ✅ XP increases to 10
- ✅ Progress bar updates to 20% (10/50)
- ✅ Level remains 1
- ✅ Input is cleared and focused

**Test Case 3.2: Keyboard Shortcuts**
- Type: "Tell me about yourself"
- Press Enter (without Shift)
- ✅ Message sends
- Type: "How are you" + Shift+Enter
- ✅ New line created (message NOT sent)
- Complete message and press Enter
- ✅ Message sends

**Test Case 3.3: Multiple Messages**
- Send 4 more messages (any content)
- ✅ Each message adds 10 XP
- ✅ Progress bar updates correctly
- ✅ All messages display correctly
- ✅ Auto-scroll to bottom works

---

### 4. Level Up and Secret Unlock

**Test Case 4.1: Level Up Trigger**
- Continue from previous test (40 XP)
- Send 1 more message
- ✅ XP reaches 50
- ✅ Level increases to 2
- ✅ "🔓 Secret Unlocked!" modal appears
- ✅ Modal displays secret text
- ✅ "Continue Conversation" button visible

**Test Case 4.2: Secret Content**
- Read secret text
- ✅ Text matches expected Level 1 secret:
  "Her brother Marcus died under suspicious circumstances 5 years ago."

**Test Case 4.3: Close Modal**
- Click "Continue Conversation"
- ✅ Modal closes
- ✅ Chat interface remains active
- ✅ Can continue sending messages
- Click outside modal (background)
- ✅ Modal closes

**Test Case 4.4: Progress Reset**
- After level up
- ✅ XP counter shows "0/50 XP"
- ✅ Progress bar resets to 0%
- ✅ Level shows "2"

---

### 5. Data Persistence

**Test Case 5.1: Conversation Saves**
- Have a conversation with 5 messages
- Refresh the page
- ✅ All messages persist
- ✅ XP value persists
- ✅ Level persists
- ✅ Conversation history intact

**Test Case 5.2: Multiple Characters**
- Chat with Zara (5 messages)
- Navigate back to `/characters`
- Start chat with another character (if available)
- ✅ New conversation starts fresh (0 XP)
- Navigate back to Zara
- ✅ Previous conversation restored

**Test Case 5.3: Clear Data**
- Open browser DevTools
- Navigate to Application → Local Storage
- Find key `chat-zara-001`
- Delete the key
- Refresh page
- ✅ Conversation reset
- ✅ XP reset to 0
- ✅ Level reset to 1
- ✅ Empty state visible

---

### 6. AI Response Quality

**Test Case 6.1: In-Character Responses**
- Send: "Tell me about your background"
- ✅ Response mentions military background
- ✅ Response mentions Station Alpha-7
- ✅ Tone is direct and professional
- ✅ No fourth-wall breaking ("I'm an AI", etc.)

**Test Case 6.2: Personality Consistency**
- Send: "Are you scared?"
- At Level 1:
- ✅ Response is guarded ("I don't fear easily", etc.)
- At Level 5+:
- ✅ Response reveals vulnerabilities

**Test Case 6.3: Secret Relevance**
- At Level 5, ask: "What happened during the treaty?"
- ✅ Response references planted malware (Level 5 secret)
- ✅ Secret is mentioned naturally in conversation

**Test Case 6.4: Relationship Awareness**
- At Level 1, ask: "What's your deepest secret?"
- ✅ Character deflects or refuses
- At Level 10, ask same question
- ✅ Character shares willingly

---

### 7. Error Handling

**Test Case 7.1: Empty Message**
- Click send button with empty textarea
- ✅ Nothing happens
- ✅ No API call made
- ✅ Send button disabled

**Test Case 7.2: API Error**
- Stop API key temporarily (comment out in .env)
- Restart server
- Send message
- ✅ Error logged to console
- ✅ User message removed (reverted)
- ✅ Loading state ends
- ✅ User can try again

**Test Case 7.3: Network Error**
- Block network in DevTools
- Send message
- ✅ Graceful failure
- ✅ Message not added permanently
- ✅ Can retry after network restored

---

### 8. Performance

**Test Case 8.1: Response Time**
- Send message
- Measure time to first response
- ✅ Response appears in <5 seconds
- ✅ Loading indicator visible during wait

**Test Case 8.2: Long Conversations**
- Have conversation with 50+ messages
- ✅ Page remains responsive
- ✅ Scroll works smoothly
- ✅ No memory leaks
- ✅ Input remains functional

**Test Case 8.3: Message Length**
- Send very long message (500+ words)
- ✅ Message displays correctly
- ✅ Response is coherent
- Send very short message ("Yes")
- ✅ Response is appropriate length

---

### 9. Mobile Responsiveness

**Test Case 9.1: Layout (375px width)**
- Resize to mobile (375px)
- ✅ Character grid: 1 column
- ✅ Chat messages stack properly
- ✅ Input area full width
- ✅ Relationship widget stacks vertically
- ✅ Modal fits on screen

**Test Case 9.2: Touch Interactions**
- Use mobile emulation in DevTools
- ✅ Character cards tap correctly
- ✅ Send button taps correctly
- ✅ Textarea tap opens keyboard
- ✅ Modal closes on tap outside

**Test Case 9.3: Tablet (768px width)**
- Resize to tablet
- ✅ Character grid: 2 columns
- ✅ Chat interface uses 60% width
- ✅ Relationship widget fits in header

---

### 10. Accessibility

**Test Case 10.1: Keyboard Navigation**
- Tab through interface
- ✅ Back button focusable
- ✅ Character cards focusable
- ✅ Textarea focusable
- ✅ Send button focusable
- ✅ Modal button focusable
- Press Enter on focused Send button
- ✅ Message sends

**Test Case 10.2: Screen Reader**
- Enable screen reader (VoiceOver/NVDA)
- ✅ Character names announced
- ✅ Messages have role labels
- ✅ Level and XP announced
- ✅ Secret unlock modal announced

**Test Case 10.3: Color Contrast**
- Use DevTools Lighthouse
- ✅ All text meets WCAG AA contrast ratio
- ✅ Buttons have sufficient contrast

---

## Automated Testing (Future)

### Unit Tests

```typescript
// Example test structure (not implemented yet)

describe('CharacterChat API', () => {
  it('returns character info', async () => {
    const res = await fetch('/api/character-chat?characterId=zara-001')
    const data = await res.json()
    expect(data.characterId).toBe('zara-001')
  })

  it('calculates XP correctly', async () => {
    const res = await fetch('/api/character-chat', {
      method: 'POST',
      body: JSON.stringify({
        characterId: 'zara-001',
        userId: 'test',
        message: 'Hello',
        conversationHistory: [],
        currentXp: 0
      })
    })
    const data = await res.json()
    expect(data.xp).toBe(10)
    expect(data.level).toBe(1)
  })

  it('unlocks secrets at correct levels', async () => {
    // Send messages to reach Level 2
    // Verify secret unlocked
  })
})
```

### Integration Tests

```typescript
// Example E2E test (Playwright/Cypress)

test('Complete conversation flow', async ({ page }) => {
  await page.goto('/characters')
  await page.click('text=Commander Zara Vex')
  await page.fill('textarea', 'Hello')
  await page.press('textarea', 'Enter')
  await expect(page.locator('.message-assistant')).toBeVisible()
  await expect(page.locator('text=10/50 XP')).toBeVisible()
})
```

---

## Performance Benchmarks

### Target Metrics

- **Page Load:** <2 seconds
- **First Response:** <5 seconds
- **Input Latency:** <100ms
- **Scroll FPS:** 60 FPS
- **Memory Usage:** <50 MB per conversation

### Measurement Tools

- Chrome DevTools Performance tab
- Lighthouse CI
- WebPageTest.org

---

## Regression Testing Checklist

Before each release:

- [ ] All 10 test sections pass
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] API costs within budget
- [ ] Mobile works on real device
- [ ] Persistence works after browser restart
- [ ] Secret unlocks at correct levels
- [ ] Character personality consistent

---

## Bug Reporting Template

```markdown
## Bug Report

**Severity:** Critical / High / Medium / Low
**Environment:** Dev / Staging / Production
**Browser:** Chrome 120 / Safari 17 / Firefox 122

### Steps to Reproduce
1. Navigate to `/characters/zara-001`
2. Send message "Hello"
3. ...

### Expected Behavior
XP should increase to 10

### Actual Behavior
XP remains at 0

### Screenshots
[Attach screenshot]

### Console Errors
[Paste any errors from DevTools]

### Additional Context
Happened after refreshing page
```

---

## Test Summary

**Total Test Cases:** 50+  
**Coverage Areas:**
- ✅ UI/UX
- ✅ API Integration
- ✅ Data Persistence
- ✅ AI Quality
- ✅ Error Handling
- ✅ Performance
- ✅ Mobile
- ✅ Accessibility

**Estimated Testing Time:**
- Quick Test: 5 minutes
- Full Manual Test: 45 minutes
- Automated Tests: TBD

---

**Last Updated:** February 17, 2026  
**Tester:** [Your Name]  
**Version:** 1.0.0
