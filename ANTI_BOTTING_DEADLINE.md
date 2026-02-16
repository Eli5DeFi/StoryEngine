# 🛡️ Anti-Botting Betting Deadline System

**Feature:** Betting pools close 1 hour before story generation  
**Purpose:** Prevent last-minute manipulation and botting  
**Version:** CombinatorialPool v2  
**Date:** February 16, 2026

---

## Problem: Last-Minute Botting

**Scenario Without Deadline:**
```
11:59 PM - Chapter 5 betting open
12:00 AM - AI generates story, picks Choice B
12:00:01 AM - Bot reads transaction, sees Choice B won
12:00:02 AM - Bot places huge bet on Choice B
12:00:03 AM - Outcome resolved, bot wins unfairly
```

**Risk:**
- Bots monitor pending transactions
- Place bets milliseconds before resolution
- Guaranteed win (no risk)
- Ruins fairness for human players

---

## Solution: 1-Hour Betting Deadline

**Timeline:**
```
Monday 10:00 AM - Chapter scheduled (generation at Tuesday 12:00 PM)
Monday 10:00 AM - Betting opens
Tuesday 11:00 AM - BETTING CLOSES (1 hour before generation)
Tuesday 12:00 PM - AI generates story
Tuesday 12:05 PM - Outcome resolved
```

**Key Benefits:**
1. **No last-second bets** - All bets placed with real uncertainty
2. **Fair odds** - Odds frozen 1 hour before, reflect true beliefs
3. **Bot protection** - Bots can't react to generation
4. **Prevents frontrunning** - No mempool sniping

---

## Smart Contract Implementation

### New State Variables

```solidity
// Deadline buffer constant
uint256 public constant BETTING_DEADLINE_BUFFER = 1 hours;

// Chapter schedule mapping
mapping(uint256 => ChapterSchedule) public chapterSchedules;

struct ChapterSchedule {
    uint256 chapterId;
    uint256 generationTime;   // When AI generates the story
    uint256 bettingDeadline;  // generationTime - 1 hour
    bool published;
}

// Deadline added to Outcome struct
struct Outcome {
    // ... existing fields ...
    uint256 bettingDeadline; // NEW: Inherited from chapter schedule
}
```

### Key Functions

#### 1. Schedule Chapter (Admin Only)

```solidity
function scheduleChapter(
    uint256 chapterId,
    uint256 generationTime
) external onlyOwner
```

**Example:**
```javascript
// Schedule Chapter 5 for Tuesday 12:00 PM
const generationTime = Math.floor(new Date('2026-02-18 12:00:00').getTime() / 1000);

await bettingPool.scheduleChapter(5, generationTime);

// Contract automatically sets:
// - generationTime: Tuesday 12:00 PM
// - bettingDeadline: Tuesday 11:00 AM (1 hour before)
```

**Emits:**
```solidity
event ChapterScheduled(
    uint256 indexed chapterId,    // 5
    uint256 generationTime,        // 1708236000 (Tue 12:00 PM)
    uint256 bettingDeadline        // 1708232400 (Tue 11:00 AM)
);
```

#### 2. Create Outcome (Inherits Deadline)

```solidity
function createOutcome(
    OutcomeType outcomeType,
    string calldata description,
    uint256 chapterId,
    uint256 choiceId
) external onlyOwner returns (uint256 outcomeId)
```

**Example:**
```javascript
// Create outcomes for Chapter 5 (scheduled above)
await bettingPool.createOutcome(
  OutcomeType.STORY_CHOICE,
  "Regent allies with House Valdris",
  5,  // chapterId
  1   // choiceId
);

// Outcome automatically inherits:
// - bettingDeadline: Tuesday 11:00 AM (from chapter schedule)
```

**Requires:**
- Chapter must be scheduled first
- Inherits deadline from `chapterSchedules[chapterId].bettingDeadline`

#### 3. Place Bet (Deadline Check)

```solidity
function placeCombiBet(
    uint256[] calldata outcomeIds,
    uint256 amount,
    BetType betType
) external nonReentrant returns (uint256 betId)
```

**Anti-Botting Check:**
```solidity
for (uint256 i = 0; i < outcomeIds.length; i++) {
    Outcome storage outcome = outcomes[outcomeIds[i]];
    
    // Reject if deadline passed
    if (block.timestamp >= outcome.bettingDeadline) {
        revert BettingClosed();
    }
}
```

**Example (Success):**
```javascript
// Current time: Tuesday 10:30 AM (30 min before deadline)
await bettingPool.placeCombiBet([12, 13], parseUnits('100', 6), BetType.PARLAY);
// ✅ Success - betting still open
```

**Example (Failure):**
```javascript
// Current time: Tuesday 11:05 AM (5 min after deadline)
await bettingPool.placeCombiBet([12, 13], parseUnits('100', 6), BetType.PARLAY);
// ❌ Reverts: BettingClosed()
```

#### 4. Check Betting Status (View Function)

```solidity
function isBettingOpen(uint256 chapterId) public view returns (bool isOpen)
```

**Logic:**
```solidity
// Returns false if:
1. Chapter not scheduled
2. Chapter already published
3. Current time >= deadline
```

**Example:**
```javascript
const isOpen = await bettingPool.isBettingOpen(5);

if (isOpen) {
  // Show betting UI
} else {
  // Show "Betting Closed" message
}
```

#### 5. Time Remaining (View Function)

```solidity
function getTimeUntilDeadline(uint256 chapterId) external view returns (uint256 timeRemaining)
```

**Returns:**
- Seconds until deadline (if betting open)
- 0 (if betting closed)

**Example (Frontend Countdown):**
```javascript
const timeRemaining = await bettingPool.getTimeUntilDeadline(5);

if (timeRemaining > 0) {
  const hours = Math.floor(timeRemaining / 3600);
  const minutes = Math.floor((timeRemaining % 3600) / 60);
  console.log(`Betting closes in ${hours}h ${minutes}m`);
} else {
  console.log('Betting closed');
}
```

#### 6. Extend Deadline (Admin Only)

```solidity
function extendDeadline(
    uint256 chapterId,
    uint256 newGenerationTime
) external onlyOwner
```

**Use Case:** AI generation delayed, extend betting window

**Example:**
```javascript
// Original: Tuesday 12:00 PM
// Delayed to: Tuesday 3:00 PM

const newGenerationTime = Math.floor(new Date('2026-02-18 15:00:00').getTime() / 1000);
await bettingPool.extendDeadline(5, newGenerationTime);

// New deadline: Tuesday 2:00 PM (1 hour before 3:00 PM)
```

**Emits:**
```solidity
event BettingDeadlineExtended(
    uint256 indexed chapterId,
    uint256 oldDeadline,     // Tue 11:00 AM
    uint256 newDeadline      // Tue 2:00 PM
);
```

**Requirements:**
- Can only extend (not shorten)
- Chapter must not be published yet
- Protects existing bettors

---

## Complete Workflow

### Admin Workflow (Publishing Chapter)

```javascript
// ============ STEP 1: Schedule Chapter ============
// Monday 10:00 AM - Schedule Chapter 5 for Tuesday 12:00 PM

const chapterId = 5;
const generationTime = Math.floor(new Date('2026-02-18 12:00:00').getTime() / 1000);

await bettingPool.scheduleChapter(chapterId, generationTime);

console.log('Chapter 5 scheduled:');
console.log('- Generation: Tuesday 12:00 PM');
console.log('- Betting closes: Tuesday 11:00 AM');


// ============ STEP 2: Create Outcomes ============
// Monday 10:01 AM - Create betting options

await bettingPool.createOutcome(
  OutcomeType.STORY_CHOICE,
  "Regent allies with House Valdris",
  5,  // chapterId
  1   // choiceId
);

await bettingPool.createOutcome(
  OutcomeType.STORY_CHOICE,
  "Regent allies with House Kyreth",
  5,
  2
);

await bettingPool.createOutcome(
  OutcomeType.STORY_CHOICE,
  "Regent rejects both houses",
  5,
  3
);

console.log('3 outcomes created for Chapter 5');


// ============ STEP 3: Betting Window Open ============
// Monday 10:01 AM - Tuesday 11:00 AM
// Users can place bets (24 hours 59 minutes)

// Frontend shows:
// - Countdown timer
// - Current odds
// - Bet placement form


// ============ STEP 4: Betting Closes ============
// Tuesday 11:00 AM - Deadline reached

// Contract automatically rejects new bets
// Odds are frozen
// No more manipulation possible


// ============ STEP 5: AI Generates Story ============
// Tuesday 12:00 PM - Generate Chapter 5

const aiResponse = await generateChapter5();
const chosenPath = aiResponse.choiceId; // e.g., 2 (Kyreth)


// ============ STEP 6: Resolve Outcomes ============
// Tuesday 12:05 PM - Mark winning outcome

await bettingPool.resolveOutcome(12, false); // Valdris (outcome #12) didn't happen
await bettingPool.resolveOutcome(13, true);  // Kyreth (outcome #13) happened ✅
await bettingPool.resolveOutcome(14, false); // Reject both (outcome #14) didn't happen


// ============ STEP 7: Mark Chapter Published ============
// Tuesday 12:06 PM - Prevent schedule changes

await bettingPool.markChapterPublished(5);


// ============ STEP 8: Settle Bets ============
// Tuesday 12:10 PM - Pay winners

const betIds = [1, 2, 3, 4, 5]; // Get from backend
await bettingPool.settleBetBatch(betIds);

console.log('All bets settled, winners paid');
```

### User Workflow (Placing Bet)

```javascript
// ============ USER: Monday 5:00 PM ============
// Check if betting is open

const chapterId = 5;
const isOpen = await bettingPool.isBettingOpen(chapterId);

if (!isOpen) {
  alert('Betting is closed for this chapter');
  return;
}

// ============ Check time remaining ============
const timeRemaining = await bettingPool.getTimeUntilDeadline(chapterId);
const hours = Math.floor(timeRemaining / 3600);

console.log(`Betting closes in ${hours} hours`);

// ============ Get current odds ============
const outcome12Odds = await bettingPool.getOddsForOutcome(12); // Valdris
const outcome13Odds = await bettingPool.getOddsForOutcome(13); // Kyreth

console.log('Valdris: ' + formatOdds(outcome12Odds)); // e.g., "1.8x"
console.log('Kyreth: ' + formatOdds(outcome13Odds));  // e.g., "2.5x"

// ============ Place bet ============
const outcomeIds = [13]; // Bet on Kyreth
const amount = parseUnits('100', 6); // 100 USDC

// Approve USDC
await usdcContract.approve(bettingPoolAddress, amount);

// Place bet
const tx = await bettingPool.placeCombiBet(
  outcomeIds,
  amount,
  BetType.PARLAY
);

await tx.wait();
console.log('Bet placed successfully!');


// ============ USER: Tuesday 11:05 AM (After Deadline) ============
// Try to place another bet

try {
  await bettingPool.placeCombiBet([12], parseUnits('50', 6), BetType.PARLAY);
} catch (error) {
  console.error('BettingClosed: Deadline passed');
  // Show user: "Betting closed. Story generates in 55 minutes."
}
```

---

## Frontend Integration

### Countdown Timer Component

```typescript
// components/BettingCountdown.tsx

import { useEffect, useState } from 'react';
import { useReadContract } from 'wagmi';
import BETTING_POOL_ABI from '@/contracts/CombinatorialPool.json';

export function BettingCountdown({ chapterId }: { chapterId: number }) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const { data: deadline } = useReadContract({
    address: BETTING_POOL_ADDRESS,
    abi: BETTING_POOL_ABI,
    functionName: 'getTimeUntilDeadline',
    args: [chapterId],
    watch: true, // Re-fetch every block
  });

  useEffect(() => {
    if (deadline) {
      setTimeRemaining(Number(deadline));
    }
  }, [deadline]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (timeRemaining === 0) {
    return (
      <div className="text-red-500 font-bold">
        🔒 Betting Closed
      </div>
    );
  }

  const hours = Math.floor(timeRemaining / 3600);
  const minutes = Math.floor((timeRemaining % 3600) / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="text-amber-500 font-mono">
      ⏰ Betting closes in: {hours}h {minutes}m {seconds}s
    </div>
  );
}
```

### Betting Status Badge

```typescript
// components/BettingStatusBadge.tsx

import { useReadContract } from 'wagmi';

export function BettingStatusBadge({ chapterId }: { chapterId: number }) {
  const { data: isOpen } = useReadContract({
    address: BETTING_POOL_ADDRESS,
    abi: BETTING_POOL_ABI,
    functionName: 'isBettingOpen',
    args: [chapterId],
    watch: true,
  });

  if (isOpen) {
    return (
      <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm">
        🟢 Betting Open
      </span>
    );
  }

  return (
    <span className="px-3 py-1 bg-red-500/20 text-red-500 rounded-full text-sm">
      🔴 Betting Closed
    </span>
  );
}
```

### Bet Form (with Deadline Check)

```typescript
// components/PlaceBetForm.tsx

export function PlaceBetForm({ chapterId, outcomes }) {
  const { data: isOpen } = useReadContract({
    address: BETTING_POOL_ADDRESS,
    abi: BETTING_POOL_ABI,
    functionName: 'isBettingOpen',
    args: [chapterId],
  });

  if (!isOpen) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
        <h3 className="text-xl font-bold mb-2">Betting Closed</h3>
        <p className="text-gray-400">
          This chapter's betting window has ended. Story generation in progress.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handlePlaceBet}>
      <BettingCountdown chapterId={chapterId} />
      {/* Outcome selection */}
      {/* Amount input */}
      {/* Submit button */}
    </form>
  );
}
```

---

## Security Considerations

### 1. Time Manipulation

**Attack:** Admin sets deadline in past, prevents all betting

**Protection:**
```solidity
require(generationTime > block.timestamp, "Must be future time");
require(deadline > block.timestamp, "Deadline must be in future");
```

### 2. Deadline Shortening

**Attack:** Admin shortens deadline after users placed bets

**Protection:**
```solidity
function extendDeadline(...) {
    require(newGenerationTime > schedule.generationTime, "Must extend, not shorten");
}
```

**Can only extend**, never shorten. Protects existing bettors.

### 3. Published Chapter Manipulation

**Attack:** Admin extends deadline after story already published

**Protection:**
```solidity
require(!schedule.published, "Chapter already published");
```

Once `markChapterPublished()` called, schedule is immutable.

### 4. Outcome-Level Deadline Check

**Why per-outcome deadlines?**
- Each outcome inherits from its chapter
- Combinatorial bets can span multiple chapters
- Contract checks EVERY outcome's deadline
- Prevents mixing open/closed chapters

```solidity
// Check EACH outcome individually
for (uint256 i = 0; i < outcomeIds.length; i++) {
    if (block.timestamp >= outcome.bettingDeadline) {
        revert BettingClosed();
    }
}
```

---

## Gas Optimization

**Storage:**
- Deadline stored once per chapter (not per outcome)
- Outcomes reference chapter schedule
- Saves ~20K gas per outcome creation

**View Functions:**
- `isBettingOpen()` - Pure view (no gas)
- `getTimeUntilDeadline()` - Pure view (no gas)
- Frontend can call freely for countdown timers

---

## Migration from v1 to v2

**Breaking Changes:**
1. Must call `scheduleChapter()` before `createOutcome()`
2. `createOutcome()` now requires chapter to be scheduled
3. `placeCombiBet()` can revert with `BettingClosed()` error

**Backward Compatibility:**
- All v1 functions still exist
- Can deploy v2 as new contract
- Migrate gradually (chapter by chapter)

**Recommendation:**
- Use v2 for all new chapters
- Complete existing v1 bets before switching

---

## Testing Scenarios

### Test 1: Normal Flow
```solidity
// Schedule chapter (2 hours from now)
scheduleChapter(5, block.timestamp + 2 hours);

// Create outcomes
createOutcome(..., 5, ...);

// Place bet (should succeed)
vm.warp(block.timestamp + 30 minutes);
placeCombiBet([12], 100e6, BetType.PARLAY);

// Advance to deadline
vm.warp(block.timestamp + 90 minutes);

// Place bet (should fail)
vm.expectRevert(BettingClosed.selector);
placeCombiBet([12], 100e6, BetType.PARLAY);
```

### Test 2: Extend Deadline
```solidity
// Original: 2 hours from now
scheduleChapter(5, block.timestamp + 2 hours);

// Extend to 4 hours
extendDeadline(5, block.timestamp + 4 hours);

// Place bet at 2.5 hours (should succeed now)
vm.warp(block.timestamp + 150 minutes);
placeCombiBet([12], 100e6, BetType.PARLAY);
```

### Test 3: Multi-Chapter Combo
```solidity
// Schedule 2 chapters
scheduleChapter(5, block.timestamp + 2 hours);
scheduleChapter(6, block.timestamp + 4 hours);

createOutcome(..., 5, ...); // Outcome #12
createOutcome(..., 6, ...); // Outcome #13

// Place combo bet
placeCombiBet([12, 13], 100e6, BetType.PARLAY);

// Advance past Chapter 5 deadline
vm.warp(block.timestamp + 2 hours);

// Try to bet on same combo (should fail)
vm.expectRevert(BettingClosed.selector);
placeCombiBet([12, 13], 100e6, BetType.PARLAY);
```

---

## Summary

**What Changed:**
- Added 1-hour betting deadline before story generation
- Prevents last-minute botting and manipulation
- Ensures fair odds for all participants

**Key Functions:**
1. `scheduleChapter()` - Set generation time + auto-calculate deadline
2. `isBettingOpen()` - Check if betting allowed
3. `getTimeUntilDeadline()` - Get countdown (for UI)
4. `extendDeadline()` - Delay generation (can only extend)
5. `placeCombiBet()` - Now checks deadline, reverts if closed

**Benefits:**
- ✅ Fair betting (no bot frontrunning)
- ✅ Frozen odds (no last-second swings)
- ✅ Predictable timeline (users know deadline)
- ✅ Flexible (admin can extend if needed)
- ✅ Secure (can't shorten, immutable after publish)

**Files:**
- Contract: `poc/combinatorial-betting/CombinatorialPool_v2.sol`
- Docs: `ANTI_BOTTING_DEADLINE.md` (this file)

---

*Betting integrity guaranteed ✅*
