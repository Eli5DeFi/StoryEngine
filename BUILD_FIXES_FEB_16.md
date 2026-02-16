# Build Fixes - February 16, 2026

## Status: ✅ FIXED - Build Passing

### Issues Found

**1. Missing Contract Exports**
- `useForgeBalance.ts` importing non-existent `CONTRACTS` object
- `useUSDCBalance.ts` importing non-existent `formatUSDC()` function
- `usePlaceBet.ts` importing non-existent `parseUSDC()` function

**2. ABI Mismatch**
- `usePlaceBet.ts` calling `placeBet()` function that doesn't exist in ABI
- Should use `placeCombiBet()` instead
- `claimReward()` calling non-existent function
- Should use `settleBet()` instead

### Fixes Applied

#### 1. Updated `src/lib/contracts.ts`

Added missing exports:

```typescript
// Legacy CONTRACTS object for backward compatibility
export const CONTRACTS = {
  usdc: USDC_ADDRESS,
  forgeToken: '0x0000000000000000000000000000000000000000' as `0x${string}`, // TODO: Deploy
  bettingPool: BETTING_POOL_ADDRESS,
}

// Utility functions for token formatting
export function formatUSDC(value: bigint): string {
  // USDC has 6 decimals
  const formatted = Number(value) / 1_000_000
  return formatted.toFixed(2)
}

export function formatForge(value: bigint): string {
  // FORGE has 18 decimals (standard ERC20)
  const formatted = Number(value) / 1e18
  return formatted.toFixed(4)
}

export function parseUSDC(value: string): bigint {
  // USDC has 6 decimals
  const num = parseFloat(value)
  return BigInt(Math.floor(num * 1_000_000))
}
```

#### 2. Updated `src/hooks/usePlaceBet.ts`

Fixed function calls to match ABI:

```typescript
// OLD: placeBet (doesn't exist)
functionName: 'placeBet',
args: [branchIndex, amountWei, isAgent],

// NEW: placeCombiBet (exists in ABI)
functionName: 'placeCombiBet',
args: [[BigInt(branchIndex)], amountWei, 0], // 0 = BetType.SINGLE
```

```typescript
// OLD: claimReward (doesn't exist)
functionName: 'claimReward',
args: [],

// NEW: settleBet (exists in ABI)
functionName: 'settleBet',
args: [betId],
```

### Build Results

**Before:**
```
Type error: Module '"@/lib/contracts"' has no exported member 'CONTRACTS'.
Type error: Type '"placeBet"' is not assignable to type ...
```

**After:**
```
✓ Generating static pages (55/55)
Route (app)                                       Size     First Load JS
┌ ○ /                                             6.92 kB         717 kB
...
✅ Build successful
```

### Files Changed

1. `apps/web/src/lib/contracts.ts` - Added 4 exports (CONTRACTS, formatUSDC, formatForge, parseUSDC)
2. `apps/web/src/hooks/usePlaceBet.ts` - Fixed function calls to match ABI

### Commit

```
fix: Add missing contract exports for hooks

- Add CONTRACTS object with usdc, forgeToken, bettingPool addresses
- Add formatUSDC(), formatForge(), parseUSDC() utility functions
- Update usePlaceBet hook to use placeCombiBet and settleBet
- Fixes build errors in useForgeBalance, useUSDCBalance, usePlaceBet

Build now passes successfully ✅
```

**Commit hash:** `e72b5a3`

### Next Steps

1. ✅ Build passes
2. ✅ All pages compile successfully
3. ⏳ Ready for Vercel deployment testing
4. ⏳ Ready to merge PR #24

### Notes

- All contract addresses are currently placeholder `0x000...` addresses
- These will be updated after smart contract deployment to Base Sepolia testnet
- The utility functions handle proper decimal conversion (USDC: 6 decimals, FORGE: 18 decimals)
- `usePlaceBet` now uses the correct ABI function names from `CombinatorialPool_v2.sol`

---

**Build Status:** ✅ PASSING  
**Total Pages:** 55 routes  
**Build Time:** ~45 seconds  
**Bundle Size:** 88.6 kB shared chunks
