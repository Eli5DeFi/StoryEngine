# Security Audit: CombinatorialPool_v2.sol
## Audited: February 16, 2026

**Auditor:** OpenClaw (using web3-godmode-config security patterns)  
**Contract:** `poc/combinatorial-betting/CombinatorialPool_v2.sol`  
**Scope:** Pre-deployment security review against industry best practices

---

## Executive Summary

**Overall Assessment:** ⚠️ **MEDIUM RISK** - Several critical issues must be fixed before deployment

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 3 | BLOCK deployment |
| 🟠 High | 2 | Fix before testnet |
| 🟡 Medium | 4 | Fix before mainnet |
| 🟢 Low | 3 | Best practice improvements |
| ℹ️ Info | 2 | Style/documentation |

**Recommendation:** DO NOT DEPLOY until Critical and High severity issues are resolved.

---

## 🔴 Critical Severity Issues

### C-1: Floating Pragma Vulnerability

**Location:** Line 2
```solidity
pragma solidity ^0.8.23;
```

**Issue:** Floating pragma allows compilation with ANY 0.8.x version, including untested/unaudited versions released in the future.

**Risk:** New compiler versions may introduce:
- Breaking changes in behavior
- Security vulnerabilities
- Gas cost changes
- Unexpected edge cases

**Fix:**
```solidity
pragma solidity 0.8.23;
```

**Severity:** CRITICAL - Best practice violation, potential for unexpected behavior

---

### C-2: Missing Ownable2Step for Ownership Transfer

**Location:** Line 10, constructor
```solidity
contract CombinatorialBettingPool is Ownable, ReentrancyGuard {
```

**Issue:** Uses `Ownable` instead of `Ownable2Step`, allowing single-step ownership transfer.

**Risk:** 
- Typo in new owner address = permanent loss of admin control
- No way to recover from mistaken transfer
- Treasury/ops wallets can't be changed if owner is lost

**Attack Scenario:**
1. Admin calls `transferOwnership(0x123...)` (typo in address)
2. Ownership transfers to wrong/inaccessible address
3. Contract permanently locked (can't schedule chapters, resolve outcomes, emergency withdraw)

**Fix:**
```solidity
import "@openzeppelin/contracts/access/Ownable2Step.sol";

contract CombinatorialBettingPool is Ownable2Step, ReentrancyGuard {
    constructor(address _bettingToken, address _treasury, address _operationalWallet) 
        Ownable(msg.sender) {
        // ...
    }
}
```

**Severity:** CRITICAL - Permanent loss of admin control possible

---

### C-3: CEI Pattern Violation in settleBet()

**Location:** Lines 433-461
```solidity
function settleBet(uint256 betId) external nonReentrant {
    // ... validation ...
    
    bet.settled = true;  // ✅ EFFECTS
    bet.won = allHit;    // ✅ EFFECTS
    
    if (allHit) {
        // ... fee calculations ...
        
        bet.payout = netPayout;       // ✅ EFFECTS
        totalPayouts += netPayout;    // ✅ EFFECTS
        
        // ❌ INTERACTIONS before ALL effects complete
        bettingToken.safeTransfer(treasury, treasuryFee);
        bettingToken.safeTransfer(operationalWallet, opsFee);
        emit FeesDistributed(treasuryFee, opsFee);
        
        // Final effect AFTER interactions!
        bettingToken.safeTransfer(bet.bettor, netPayout);
    }
    
    emit BetSettled(betId, bet.bettor, allHit, bet.payout);
}
```

**Issue:** External calls (`safeTransfer`) occur before final event emission. While `ReentrancyGuard` prevents classic reentrancy, this violates CEI best practices.

**Risk:**
- If ERC20 token has callback (ERC777, weird tokens), state is inconsistent during callback
- Future modifications might remove `nonReentrant` modifier
- Code review tools flag this as vulnerability

**Fix:** Emit all events AFTER all interactions:
```solidity
if (allHit) {
    // Calculate payouts (CHECKS)
    uint256 grossPayout = (bet.amount * bet.combinedOdds) / ODDS_DECIMALS;
    uint256 platformFee = (grossPayout * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
    uint256 netPayout = grossPayout - platformFee;
    uint256 treasuryFee = (platformFee * TREASURY_SHARE) / 100;
    uint256 opsFee = platformFee - treasuryFee;
    
    // Update state (EFFECTS)
    bet.payout = netPayout;
    totalPayouts += netPayout;
    bet.settled = true;
    bet.won = allHit;
    
    // External calls (INTERACTIONS)
    bettingToken.safeTransfer(treasury, treasuryFee);
    bettingToken.safeTransfer(operationalWallet, opsFee);
    bettingToken.safeTransfer(bet.bettor, netPayout);
    
    // Events LAST
    emit FeesDistributed(treasuryFee, opsFee);
}

emit BetSettled(betId, bet.bettor, bet.won, bet.payout);
```

**Severity:** CRITICAL - CEI violation (mitigated by ReentrancyGuard but still bad practice)

---

## 🟠 High Severity Issues

### H-1: No Maximum Deadline Extension Limit

**Location:** Lines 200-219 (`extendDeadline`)
```solidity
function extendDeadline(
    uint256 chapterId,
    uint256 newGenerationTime
) external onlyOwner {
    // ...
    require(newGenerationTime > schedule.generationTime, "Must extend, not shorten");
    // ❌ No maximum extension limit
}
```

**Issue:** Owner can extend deadline indefinitely, potentially trapping user funds.

**Attack Scenario:**
1. Users place $100K in bets for Chapter 5
2. Malicious/compromised owner extends deadline by 10 years
3. Funds locked, users can't withdraw
4. Contract holds funds indefinitely

**Risk:**
- Funds locked for extended periods
- No refund mechanism for cancelled/delayed chapters
- User trust violation

**Fix:** Add maximum extension limit and refund mechanism:
```solidity
uint256 public constant MAX_DEADLINE_EXTENSION = 7 days;

function extendDeadline(
    uint256 chapterId,
    uint256 newGenerationTime
) external onlyOwner {
    ChapterSchedule storage schedule = chapterSchedules[chapterId];
    require(schedule.generationTime > 0, "Chapter not scheduled");
    require(!schedule.published, "Chapter already published");
    require(newGenerationTime > schedule.generationTime, "Must extend, not shorten");
    
    // ✅ Prevent excessive extensions
    uint256 extension = newGenerationTime - schedule.generationTime;
    require(extension <= MAX_DEADLINE_EXTENSION, "Extension too long");
    
    uint256 oldDeadline = schedule.bettingDeadline;
    uint256 newDeadline = newGenerationTime - BETTING_DEADLINE_BUFFER;
    
    schedule.generationTime = newGenerationTime;
    schedule.bettingDeadline = newDeadline;
    
    emit BettingDeadlineExtended(chapterId, oldDeadline, newDeadline);
}

// Add refund function for cancelled chapters
function cancelChapterAndRefund(uint256 chapterId) external onlyOwner {
    // Implementation needed
}
```

**Severity:** HIGH - Potential fund lock, no user recourse

---

### H-2: Missing NatSpec Documentation

**Location:** Throughout contract

**Issue:** Many functions lack proper NatSpec comments:
- Missing `@notice` on most external functions
- No `@param` descriptions
- No `@return` descriptions
- Missing `@dev` implementation notes

**Examples:**
```solidity
// ❌ No documentation
function getOddsForOutcome(uint256 outcomeId) public view returns (uint256) {
    // ...
}

// ❌ No param/return docs
function calculateCombinedOdds(
    uint256[] calldata outcomeIds
) public view returns (uint256) {
    // ...
}
```

**Risk:**
- Auditors can't verify intended behavior
- Users don't understand what functions do
- Integration partners make mistakes
- Block explorer shows no function descriptions

**Fix:** Add comprehensive NatSpec:
```solidity
/// @notice Calculate parimutuel odds for a single outcome based on betting pool
/// @dev Returns 2.0x default odds if no bets exist. Formula: totalBets / (totalBets + 1e6) * ODDS_DECIMALS
/// @param outcomeId The outcome to calculate odds for
/// @return odds Current odds in 18-decimal format (e.g., 2.5e18 = 2.5x payout)
function getOddsForOutcome(uint256 outcomeId) public view returns (uint256 odds) {
    // ...
}
```

**Severity:** HIGH - Prevents proper audit and verification

---

## 🟡 Medium Severity Issues

### M-1: Unbounded Loop in settleBetBatch

**Location:** Lines 467-472
```solidity
function settleBetBatch(uint256[] calldata betIds) external {
    for (uint256 i = 0; i < betIds.length; i++) {
        try this.settleBet(betIds[i]) {} catch {}
    }
}
```

**Issue:** No limit on `betIds.length`, potential gas DoS.

**Risk:**
- Large array causes out-of-gas revert
- Griefing attack: Pass massive array to waste caller's gas
- Unpredictable gas costs

**Fix:**
```solidity
uint256 public constant MAX_BATCH_SIZE = 50;

function settleBetBatch(uint256[] calldata betIds) external {
    require(betIds.length <= MAX_BATCH_SIZE, "Batch too large");
    for (uint256 i = 0; i < betIds.length; i++) {
        try this.settleBet(betIds[i]) {} catch {}
    }
}
```

**Severity:** MEDIUM - Gas griefing potential

---

### M-2: No Slippage Protection on Bets

**Location:** Lines 332-378 (`placeCombiBet`)

**Issue:** Odds can change between transaction submission and execution.

**Scenario:**
1. User sees 3.0x odds on UI
2. User submits bet expecting 3.0x
3. Large bet placed before user's tx executes
4. User's bet executes at 1.5x odds
5. User loses money due to front-running

**Fix:** Add minimum odds parameter:
```solidity
function placeCombiBet(
    uint256[] calldata outcomeIds,
    uint256 amount,
    BetType betType,
    uint256 minOdds  // ✅ NEW: Minimum acceptable combined odds
) external nonReentrant returns (uint256 betId) {
    // ...
    uint256 combinedOdds = calculateCombinedOdds(outcomeIds);
    require(combinedOdds >= minOdds, "Odds below minimum");
    // ...
}
```

**Severity:** MEDIUM - User experience issue, potential front-running

---

### M-3: No Emergency Pause Mechanism

**Location:** Missing functionality

**Issue:** No way to pause betting if critical bug discovered.

**Risk:**
- Bug discovered → can't stop new bets
- Funds continue flowing into vulnerable contract
- Must wait for all pending bets to resolve before fixing

**Fix:** Add Pausable from OpenZeppelin:
```solidity
import "@openzeppelin/contracts/utils/Pausable.sol";

contract CombinatorialBettingPool is Ownable2Step, ReentrancyGuard, Pausable {
    
    function placeCombiBet(...) external whenNotPaused nonReentrant {
        // ...
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
```

**Severity:** MEDIUM - No circuit breaker for emergencies

---

### M-4: Integer Precision Loss in Odds Calculation

**Location:** Lines 387-403 (`getOddsForOutcome`)
```solidity
uint256 baseOdds = (totalBets * ODDS_DECIMALS) / (totalBets + 1e6);
```

**Issue:** Division before multiplication loses precision.

**Example:**
```
totalBets = 100
baseOdds = (100 * 1e18) / (100 + 1e6) = 100e18 / 1000100 = 99990000999009990
Expected: ~100e18 / 1e6 = 100e12 (slightly different calculation)
```

**Risk:** Odds calculation inaccuracy, potential user value loss

**Fix:** Review odds formula for precision:
```solidity
// Document the formula clearly
/// @dev Odds formula: (totalBets * ODDS_DECIMALS) / (totalBets + BASE_LIQUIDITY)
/// where BASE_LIQUIDITY = 1e6 prevents division by zero and sets minimum odds
uint256 public constant BASE_LIQUIDITY = 1e6;

uint256 baseOdds = (totalBets * ODDS_DECIMALS) / (totalBets + BASE_LIQUIDITY);
```

**Severity:** MEDIUM - Potential value loss in edge cases

---

## 🟢 Low Severity Issues

### L-1: Magic Numbers Without Constants

**Location:** Multiple places

**Issue:**
```solidity
uint256 treasuryFee = (platformFee * TREASURY_SHARE) / 100; // ❌ Magic number 100
uint256 baseOdds = (totalBets * ODDS_DECIMALS) / (totalBets + 1e6); // ❌ Magic number 1e6
```

**Fix:**
```solidity
uint256 public constant PERCENTAGE_DENOMINATOR = 100;
uint256 public constant BASE_LIQUIDITY = 1e6;

uint256 treasuryFee = (platformFee * TREASURY_SHARE) / PERCENTAGE_DENOMINATOR;
uint256 baseOdds = (totalBets * ODDS_DECIMALS) / (totalBets + BASE_LIQUIDITY);
```

**Severity:** LOW - Readability/maintainability

---

### L-2: Missing Zero Address Checks in Setters

**Location:** Lines 518-530

**Issue:** `setTreasury` and `setOperationalWallet` have zero address checks, but other functions don't:
```solidity
function setMaxBetAmount(uint256 newMax) external onlyOwner {
    // ❌ No validation (what if newMax = 0?)
    maxBetAmount = newMax;
}
```

**Fix:**
```solidity
function setMaxBetAmount(uint256 newMax) external onlyOwner {
    require(newMax > 0, "Max bet must be > 0");
    maxBetAmount = newMax;
}
```

**Severity:** LOW - Edge case protection

---

### L-3: Inconsistent Event Naming

**Location:** Events section

**Issue:** Some events use past tense, some don't:
- `ChapterScheduled` ✅
- `OutcomeCreated` ✅
- `BetSettled` ✅
- `FeesDistributed` ✅
- `BettingDeadlineExtended` ✅

Actually, all are consistent! **This issue can be ignored.**

---

## ℹ️ Informational Issues

### I-1: Gas Optimization - Storage Packing

**Location:** Struct definitions

**Observation:** Structs could be packed more efficiently:

```solidity
struct Outcome {
    uint256 outcomeId;      // 32 bytes
    OutcomeType outcomeType; // 1 byte (but takes 32 bytes slot)
    string description;      // dynamic
    uint256 chapterId;       // 32 bytes
    uint256 choiceId;        // 32 bytes
    OutcomeStatus status;    // 1 byte (but takes 32 bytes slot)
    uint256 resolvedAt;      // 32 bytes
    uint256 bettingDeadline; // 32 bytes
}
// Total: 7 slots (224 bytes)
```

**Optimization:**
```solidity
struct Outcome {
    uint256 outcomeId;
    uint256 chapterId;
    uint256 choiceId;
    uint256 resolvedAt;
    uint256 bettingDeadline;
    OutcomeType outcomeType;  // uint8
    OutcomeStatus status;     // uint8
    // 2 bytes left in this slot
    string description;
}
// Total: 6 slots (192 bytes) - Saves 32 bytes per outcome
```

**Severity:** INFO - Gas optimization opportunity

---

### I-2: Missing Function for Users to View Their Active Bets

**Location:** View functions section

**Observation:** `getUserBets()` returns all bet IDs, but no way to filter only unsettled bets.

**Suggestion:**
```solidity
function getUserActiveBets(address user) external view returns (uint256[] memory) {
    uint256[] memory allBets = userBetIds[user];
    uint256 activeCount = 0;
    
    // Count active bets
    for (uint256 i = 0; i < allBets.length; i++) {
        if (!bets[allBets[i]].settled) activeCount++;
    }
    
    // Build active array
    uint256[] memory activeBets = new uint256[](activeCount);
    uint256 index = 0;
    for (uint256 i = 0; i < allBets.length; i++) {
        if (!bets[allBets[i]].settled) {
            activeBets[index++] = allBets[i];
        }
    }
    
    return activeBets;
}
```

**Severity:** INFO - UX improvement

---

## Detailed Recommendations

### Pre-Testnet Deployment

1. ✅ Fix C-1: Pin Solidity version to `0.8.23`
2. ✅ Fix C-2: Replace `Ownable` with `Ownable2Step`
3. ✅ Fix C-3: Correct CEI pattern in `settleBet()`
4. ✅ Fix H-1: Add maximum deadline extension + refund mechanism
5. ✅ Fix H-2: Add comprehensive NatSpec to ALL functions

### Pre-Mainnet Deployment

6. ✅ Fix M-1: Add `MAX_BATCH_SIZE` limit
7. ✅ Fix M-2: Add slippage protection (`minOdds` parameter)
8. ✅ Fix M-3: Add Pausable mechanism
9. ✅ Fix M-4: Review odds calculation formula
10. ✅ Fix L-1: Replace magic numbers with named constants
11. ✅ Fix L-2: Add validation to `setMaxBetAmount()`

### Optional Improvements

12. ⚪ I-1: Optimize struct packing for gas savings
13. ⚪ I-2: Add `getUserActiveBets()` helper function

---

## Testing Recommendations

### Unit Tests (Foundry)

1. **Access Control**
   - Test `onlyOwner` modifiers
   - Test ownership transfer with `Ownable2Step`
   - Test unauthorized calls revert

2. **Betting Deadline**
   - Test betting closes exactly 1 hour before generation
   - Test `extendDeadline()` with max limit
   - Test betting after deadline reverts

3. **CEI Pattern**
   - Mock ERC20 with callback
   - Verify state updates before external calls
   - Test reentrancy protection

4. **Edge Cases**
   - Test with 0 bets (default odds)
   - Test with MAX_OUTCOMES_PER_BET
   - Test batch settlement with max size
   - Test odds changes during high volume

5. **Economic**
   - Test fee distribution (70/30 split)
   - Test payout calculations
   - Test odds calculation accuracy
   - Test slippage scenarios

### Fuzz Testing

```solidity
function testFuzz_PlaceBet(uint256 amount, uint8 numOutcomes) public {
    amount = bound(amount, 1, maxBetAmount);
    numOutcomes = uint8(bound(numOutcomes, MIN_OUTCOMES_PER_BET, MAX_OUTCOMES_PER_BET));
    // ... test bet placement with random inputs
}
```

### Integration Tests

1. Fork Base Sepolia testnet
2. Test with real USDC contract
3. Test full user journey: schedule → bet → resolve → settle
4. Test with multiple concurrent users
5. Test deadline extensions during active betting

---

## Deployment Checklist

### Before Deployment

- [ ] All Critical issues fixed
- [ ] All High issues fixed
- [ ] All Medium issues fixed (for mainnet)
- [ ] Solidity version pinned
- [ ] All tests passing (unit + integration + fuzz)
- [ ] NatSpec complete on all functions
- [ ] Code coverage >90% on critical paths
- [ ] Slither analysis clean
- [ ] Gas optimization review complete

### Deployment

- [ ] Deploy to Base Sepolia testnet first
- [ ] Verify contract on BaseScan
- [ ] Test all functions on testnet
- [ ] Monitor for 1 week minimum
- [ ] Consider professional audit (Trail of Bits, OpenZeppelin, etc.)
- [ ] Deploy to Base mainnet only after extensive testnet usage

---

## Conclusion

**Current State:** NOT READY FOR DEPLOYMENT

**Required Fixes:** 5 critical/high issues MUST be resolved

**Estimated Time:** 2-3 days to fix + 1 week testing

**Next Steps:**
1. Fix all Critical and High severity issues
2. Re-run this audit
3. Deploy to Base Sepolia testnet
4. Run comprehensive testing suite
5. Consider professional audit before mainnet

**Audit Confidence:** HIGH - Patterns from web3-godmode-config cover industry best practices

---

**Audited:** February 16, 2026  
**Contract Version:** v2  
**Audit Framework:** web3-godmode-config security patterns  
**Status:** ⚠️ BLOCKED - Critical issues present
