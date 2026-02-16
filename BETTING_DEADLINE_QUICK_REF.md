# ⏰ Betting Deadline - Quick Reference

## Timeline Example

```
📅 Monday 10:00 AM
↓ Schedule Chapter 5 (generation: Tuesday 12:00 PM)
↓
🟢 Betting OPEN (25 hours)
↓
📅 Tuesday 11:00 AM
↓ DEADLINE (1 hour before generation)
↓
🔴 Betting CLOSED (1 hour safety buffer)
↓
📅 Tuesday 12:00 PM
↓ AI generates story
↓ Outcome resolved
↓
💰 Winners paid
```

---

## Admin Commands

### 1. Schedule Chapter
```javascript
// When: Before creating outcomes
// Effect: Sets generation time + auto-calculates deadline

const generationTime = Date.parse('2026-02-18 12:00:00') / 1000;
await bettingPool.scheduleChapter(5, generationTime);

// Result:
// - generationTime: Tue 12:00 PM
// - bettingDeadline: Tue 11:00 AM (auto)
```

### 2. Create Outcomes
```javascript
// When: After scheduling chapter
// Effect: Inherits deadline from chapter

await bettingPool.createOutcome(
  OutcomeType.STORY_CHOICE,
  "Regent allies with Valdris",
  5,  // chapterId
  1   // choiceId
);

// Outcome automatically gets:
// - bettingDeadline: Tue 11:00 AM
```

### 3. Extend Deadline (Optional)
```javascript
// When: Generation delayed
// Effect: Pushes deadline forward (can't shorten!)

const newGenTime = Date.parse('2026-02-18 15:00:00') / 1000;
await bettingPool.extendDeadline(5, newGenTime);

// New deadline: Tue 2:00 PM (auto-calculated)
```

### 4. Mark Published
```javascript
// When: After story published
// Effect: Locks schedule (no more changes)

await bettingPool.markChapterPublished(5);
```

---

## User Checks

### Check if Betting Open
```javascript
const isOpen = await bettingPool.isBettingOpen(5);

if (isOpen) {
  // Show betting UI
} else {
  // Show "Betting Closed"
}
```

### Get Time Remaining
```javascript
const seconds = await bettingPool.getTimeUntilDeadline(5);

if (seconds > 0) {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  console.log(`Closes in ${hours}h ${mins}m`);
} else {
  console.log('Closed');
}
```

### Place Bet (Auto-Checks Deadline)
```javascript
try {
  await bettingPool.placeCombiBet([12, 13], amount, BetType.PARLAY);
  console.log('Bet placed!');
} catch (error) {
  if (error.message.includes('BettingClosed')) {
    alert('Betting deadline passed');
  }
}
```

---

## Frontend Components

### Countdown Timer
```tsx
<BettingCountdown chapterId={5} />
// Displays: "⏰ Closes in: 5h 23m 12s"
```

### Status Badge
```tsx
<BettingStatusBadge chapterId={5} />
// Shows: "🟢 Betting Open" or "🔴 Betting Closed"
```

### Conditional Form
```tsx
{isBettingOpen ? (
  <PlaceBetForm outcomes={outcomes} />
) : (
  <BettingClosedMessage />
)}
```

---

## Key Rules

✅ **Betting closes 1 hour before generation**  
✅ **Deadline can only be extended (never shortened)**  
✅ **Once published, schedule is immutable**  
✅ **Each outcome inherits chapter deadline**  
✅ **Combo bets check ALL outcomes**  

❌ **Can't bet after deadline**  
❌ **Can't shorten deadline**  
❌ **Can't change published schedule**  

---

## Error Handling

```javascript
// Error: BettingClosed()
// Reason: Current time >= deadline
// Fix: Wait for next chapter

// Error: ChapterNotScheduled()
// Reason: Chapter not scheduled yet
// Fix: Admin calls scheduleChapter()

// Error: ChapterAlreadyPublished()
// Reason: Trying to change published schedule
// Fix: Can't change, schedule locked
```

---

## Gas Costs (Base L2)

| Function | Gas | Cost @ 0.05 gwei |
|----------|-----|------------------|
| scheduleChapter() | ~50K | $0.003 |
| createOutcome() | ~80K | $0.004 |
| placeCombiBet() | ~150K | $0.008 |
| extendDeadline() | ~40K | $0.002 |

---

## Testing Checklist

- [ ] Schedule chapter in future
- [ ] Create outcomes (inherits deadline)
- [ ] Place bet before deadline (succeeds)
- [ ] Place bet after deadline (reverts)
- [ ] Extend deadline (succeeds)
- [ ] Try to shorten deadline (reverts)
- [ ] Mark published
- [ ] Try to extend published chapter (reverts)
- [ ] Multi-chapter combo (checks all deadlines)
- [ ] Frontend countdown updates
- [ ] Status badge shows correct state

---

*See ANTI_BOTTING_DEADLINE.md for full documentation*
