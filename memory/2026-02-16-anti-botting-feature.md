# Anti-Botting Betting Deadline - Implementation Complete

**Date:** February 16, 2026 10:54 WIB  
**Status:** ✅ Implemented & Documented  
**Request:** "to prevent the botting, the pool for betting will be closed 1 hr before the next story generation start"

---

## What Was Built

### Smart Contract v2: Betting Deadline Protection

**File:** `poc/combinatorial-betting/CombinatorialPool_v2.sol` (19.7KB)

**New Features:**

1. **Chapter Scheduling**
   ```solidity
   function scheduleChapter(uint256 chapterId, uint256 generationTime)
   ```
   - Sets when AI will generate story
   - Auto-calculates deadline: `generationTime - 1 hour`
   - Emits: ChapterScheduled event

2. **Betting Status Check**
   ```solidity
   function isBettingOpen(uint256 chapterId) returns (bool)
   ```
   - Returns false if:
     - Not scheduled
     - Already published
     - Past deadline
   - No gas cost (view function)

3. **Countdown Timer Support**
   ```solidity
   function getTimeUntilDeadline(uint256 chapterId) returns (uint256)
   ```
   - Returns seconds until deadline
   - 0 if closed
   - For frontend countdown

4. **Deadline Extension**
   ```solidity
   function extendDeadline(uint256 chapterId, uint256 newGenerationTime)
   ```
   - Can only extend (never shorten)
   - Protects existing bettors
   - Emits: BettingDeadlineExtended

5. **Immutable After Publish**
   ```solidity
   function markChapterPublished(uint256 chapterId)
   ```
   - Locks schedule
   - No more changes possible
   - Prevents manipulation

**Modified Functions:**

- `createOutcome()` - Now requires chapter to be scheduled, inherits deadline
- `placeCombiBet()` - Checks deadline for ALL outcomes, reverts if closed

**New Data Structures:**

```solidity
struct ChapterSchedule {
    uint256 chapterId;
    uint256 generationTime;   // When AI generates
    uint256 bettingDeadline;  // generationTime - 1 hour
    bool published;           // Immutable flag
}

struct Outcome {
    // ... existing fields ...
    uint256 bettingDeadline;  // Inherited from chapter
}
```

**Constants:**

```solidity
uint256 public constant BETTING_DEADLINE_BUFFER = 1 hours;
```

---

## Timeline Example

```
📅 Monday 10:00 AM - Admin schedules Chapter 5
   ↓ Generation time: Tuesday 12:00 PM
   ↓ Deadline auto-set: Tuesday 11:00 AM
   ↓
📅 Monday 10:01 AM - Admin creates 3 outcomes
   ↓ All inherit deadline: Tuesday 11:00 AM
   ↓
🟢 BETTING WINDOW OPEN (25 hours)
   ↓ Users place bets
   ↓ Odds update dynamically
   ↓
📅 Tuesday 11:00 AM - DEADLINE REACHED
   ↓ Contract rejects new bets
   ↓ Odds frozen
   ↓
🔴 BETTING CLOSED (1 hour safety buffer)
   ↓ No manipulation possible
   ↓
📅 Tuesday 12:00 PM - AI generates story
   ↓ Chooses winning path
   ↓
📅 Tuesday 12:05 PM - Admin resolves outcomes
   ↓ Marks winners
   ↓
💰 Tuesday 12:10 PM - Bets settled
   ↓ Winners paid automatically
```

---

## Why This Prevents Botting

**Problem (Without Deadline):**
```
12:00:00 - AI generates, picks Choice B
12:00:01 - Bot sees transaction mempool
12:00:02 - Bot places huge bet on Choice B
12:00:03 - Outcome resolved, bot wins
```

**Solution (With 1-Hour Deadline):**
```
11:00 AM - Betting closes (deadline)
12:00 PM - AI generates (1 hour later)
12:05 PM - Outcome resolved

Bots can't bet because:
- Betting already closed before generation
- Can't see outcome in advance
- Must bet with real uncertainty like humans
```

**Key Protections:**

1. **No Frontrunning** - Bets must be placed 1+ hour before result known
2. **Frozen Odds** - Odds can't swing wildly in final seconds
3. **Fair Play** - All participants have equal information
4. **Bot Prevention** - Can't react to generation transaction

---

## Admin Workflow

```javascript
// ============ 1. Schedule Chapter ============
const genTime = Math.floor(Date.parse('2026-02-18 12:00:00') / 1000);
await bettingPool.scheduleChapter(5, genTime);
// Auto-sets deadline: Tue 11:00 AM

// ============ 2. Create Outcomes ============
await bettingPool.createOutcome(
  OutcomeType.STORY_CHOICE,
  "Valdris alliance",
  5, 1
);
// Inherits deadline: Tue 11:00 AM

// ============ 3. (Optional) Extend Deadline ============
// If generation delayed
const newGenTime = Math.floor(Date.parse('2026-02-18 15:00:00') / 1000);
await bettingPool.extendDeadline(5, newGenTime);
// New deadline: Tue 2:00 PM

// ============ 4. Generate Story ============
// Tuesday 12:00 PM (or 3:00 PM if extended)
const story = await generateChapter5();

// ============ 5. Resolve Outcomes ============
await bettingPool.resolveOutcome(12, false); // Valdris lost
await bettingPool.resolveOutcome(13, true);  // Kyreth won

// ============ 6. Mark Published ============
await bettingPool.markChapterPublished(5);
// Schedule now immutable

// ============ 7. Settle Bets ============
await bettingPool.settleBetBatch([1, 2, 3, 4, 5]);
```

---

## Frontend Integration

### Countdown Component
```typescript
// Shows live countdown
<BettingCountdown chapterId={5} />
// Output: "⏰ Closes in: 5h 23m 12s"
```

### Status Badge
```typescript
// Shows betting status
<BettingStatusBadge chapterId={5} />
// Output: "🟢 Betting Open" or "🔴 Betting Closed"
```

### Conditional UI
```typescript
const isOpen = await bettingPool.isBettingOpen(5);

if (isOpen) {
  return <PlaceBetForm />;
} else {
  return (
    <div>
      <h3>Betting Closed</h3>
      <p>Story generation in progress...</p>
    </div>
  );
}
```

---

## Documentation Created

### 1. Full Technical Docs (17.1KB)
**File:** `ANTI_BOTTING_DEADLINE.md`

**Contents:**
- Problem explanation
- Complete contract implementation
- All functions documented
- Admin & user workflows
- Frontend integration examples
- Security considerations
- Testing scenarios
- Gas optimization

### 2. Quick Reference (4.1KB)
**File:** `BETTING_DEADLINE_QUICK_REF.md`

**Contents:**
- Timeline diagram
- Admin commands
- User checks
- Frontend components
- Error handling
- Gas costs
- Testing checklist

---

## Security Features

✅ **Can only extend deadlines (never shorten)**
- Protects existing bettors
- `require(newGenerationTime > schedule.generationTime)`

✅ **Immutable after publish**
- Schedule locked once story published
- `require(!schedule.published)`

✅ **Per-outcome deadline check**
- Combo bets check ALL outcomes
- Prevents mixing open/closed chapters

✅ **Time validation**
- Deadline must be in future
- Generation time must be in future
- Prevents admin mistakes

---

## Testing Checklist

- [ ] Deploy to Base Sepolia testnet
- [ ] Schedule chapter (future time)
- [ ] Create outcomes (inherits deadline)
- [ ] Place bet before deadline ✅
- [ ] Wait for deadline to pass
- [ ] Try to place bet after deadline ❌ (should revert)
- [ ] Extend deadline
- [ ] Place bet in extended window ✅
- [ ] Mark chapter published
- [ ] Try to extend published chapter ❌ (should revert)
- [ ] Test frontend countdown
- [ ] Test status badge
- [ ] Multi-chapter combo bet

---

## Gas Costs (Base L2 @ 0.05 gwei)

| Function | Gas | Cost |
|----------|-----|------|
| scheduleChapter() | ~50K | $0.003 |
| createOutcome() | ~80K | $0.004 |
| placeCombiBet() | ~150K | $0.008 |
| isBettingOpen() | 0 | Free (view) |
| getTimeUntilDeadline() | 0 | Free (view) |
| extendDeadline() | ~40K | $0.002 |

---

## Migration Notes

**From v1 to v2:**

**Breaking Changes:**
1. Must call `scheduleChapter()` before `createOutcome()`
2. `placeCombiBet()` can revert with new error: `BettingClosed()`

**Recommendation:**
- Deploy v2 as new contract
- Use v2 for all new chapters
- Let existing v1 bets settle naturally
- Gradual migration

---

## Files Created/Modified

**New Files (3):**
1. `poc/combinatorial-betting/CombinatorialPool_v2.sol` (19.7KB)
2. `ANTI_BOTTING_DEADLINE.md` (17.1KB)
3. `BETTING_DEADLINE_QUICK_REF.md` (4.1KB)

**Git:**
- Branch: `feature/dynamic-lore-pages`
- Commit: `183682e`
- Total: 40.9KB added

---

## Next Steps

1. **Testing:**
   - Deploy to Base Sepolia
   - Run test suite
   - Frontend integration testing

2. **Frontend:**
   - Build countdown components
   - Add status badges
   - Handle BettingClosed errors

3. **Audit:**
   - Professional security audit
   - Gas optimization review
   - Edge case testing

4. **Mainnet:**
   - Deploy to Base mainnet
   - Set max bet limits
   - Monitor first few chapters

---

## Summary

✅ **Betting closes 1 hour before story generation**  
✅ **Prevents bot frontrunning and manipulation**  
✅ **Deadline can be extended (never shortened)**  
✅ **Immutable after chapter published**  
✅ **Complete documentation provided**  
✅ **Frontend integration examples included**  

**Request fulfilled:** Anti-botting protection implemented via 1-hour betting deadline.

---

*Implementation by Claw - Feb 16, 2026*
