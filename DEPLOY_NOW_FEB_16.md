# Deploy Now - Quick Start Guide (February 16, 2026 15:24 GMT+7)

## ✅ Anvil Running

**Status:** Local blockchain ready  
**URL:** http://127.0.0.1:8545 (HTTP + WebSocket)  
**Chain ID:** 31337  
**Test Accounts:** 10 accounts × 10,000 ETH

---

## 🚀 Fastest Deployment Path: Remix IDE (15 minutes)

### Step 1: Open Remix (1 minute)

1. Go to https://remix.ethereum.org
2. Click "Workspaces" → "Create Workspace"
3. Name it "Voidborne" → Click "OK"

---

### Step 2: Upload Contract (2 minutes)

**Option A: Upload File**
1. In file explorer, right-click "contracts" folder
2. Click "Upload File"
3. Navigate to: `/Users/eli5defi/.openclaw/workspace/StoryEngine/poc/combinatorial-betting/src/CombinatorialPool_v2_FIXED.sol`
4. Upload it

**Option B: Copy-Paste**
1. Create new file: `contracts/CombinatorialPool_v2_FIXED.sol`
2. Copy entire contents from local file
3. Paste into Remix editor

---

### Step 3: Install OpenZeppelin (2 minutes)

**Remix will auto-detect imports and suggest installation**

OR manually:

1. Click "Plugin Manager" (plug icon on left sidebar)
2. Search for "Dependency Installer"
3. Activate it
4. In Dependencies panel, install:
   - `@openzeppelin/contracts@5.0.0`

---

### Step 4: Compile (1 minute)

1. Click "Solidity Compiler" icon (left sidebar)
2. Select compiler version: `0.8.23`
3. Enable "Optimization" → 200 runs
4. Click "Compile CombinatorialPool_v2_FIXED.sol"
5. Wait for green checkmark ✅

---

### Step 5: Connect to Anvil via MetaMask (3 minutes)

**Add Anvil Network to MetaMask:**

1. Open MetaMask
2. Click network dropdown → "Add Network" → "Add a network manually"
3. Fill in:
   ```
   Network name: Anvil Local
   RPC URL: http://127.0.0.1:8545
   Chain ID: 31337
   Currency symbol: ETH
   ```
4. Click "Save"
5. Switch to "Anvil Local" network

**Import Test Account:**

1. Click account icon → "Import Account"
2. Select "Private Key"
3. Paste: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
4. Click "Import"
5. You should see 10,000 ETH balance ✅

---

### Step 6: Deploy Mock USDC (2 minutes)

**Create MockUSDC.sol:**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {
        _mint(msg.sender, 1_000_000 * 1e6); // 1M USDC
    }
    
    function decimals() public pure override returns (uint8) {
        return 6;
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

1. Create new file: `contracts/MockUSDC.sol`
2. Paste above code
3. Compile it
4. Go to "Deploy & Run Transactions" (left sidebar)
5. Environment: "Injected Provider - MetaMask"
6. MetaMask will connect to Anvil ✅
7. Select "MockUSDC" in dropdown
8. Click "Deploy"
9. Confirm in MetaMask
10. **Copy the deployed address** (e.g., `0x5FbDB2315678afecb367f032d93F642f64180aa3`)

---

### Step 7: Deploy CombinatorialBettingPool (2 minutes)

1. In "Deploy & Run" panel, select `CombinatorialBettingPool`
2. Fill constructor arguments (comma-separated):
   ```
   USDC_ADDRESS, TREASURY_ADDRESS, OPS_WALLET_ADDRESS
   ```
   
   **Example:**
   ```
   0x5FbDB2315678afecb367f032d93F642f64180aa3,0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266,0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   ```
   
   *(Using deployer address for treasury and ops for simplicity)*

3. Click "Deploy"
4. Confirm in MetaMask
5. **Copy the deployed address** ✅

---

### Step 8: Test Basic Functions (2 minutes)

**Schedule a Chapter:**

1. Expand deployed `CombinatorialBettingPool` contract
2. Find `scheduleChapter` function
3. Fill in:
   ```
   chapterId: 1
   generationTime: 1771317600  (2 days from now)
   ```
4. Click "transact"
5. Confirm in MetaMask
6. Wait for confirmation ✅

**Create an Outcome:**

1. Find `createOutcome` function
2. Fill in:
   ```
   outcomeType: 0  (Character)
   description: "Aria survives"
   chapterId: 1
   choiceId: 1
   ```
3. Click "transact"
4. Confirm ✅

**Check if Betting is Open:**

1. Find `isBettingOpen` function (view function, blue button)
2. Input: `chapterId: 1`
3. Click "call"
4. Should return `true` ✅

---

## 🎉 Deployment Complete!

**Deployed Contracts:**
- ✅ MockUSDC: `0x...` (your address)
- ✅ CombinatorialBettingPool: `0x...` (your address)

**Next:** Test the full betting cycle

---

## 🧪 Full Betting Cycle Test (5 minutes)

### 1. Approve USDC

1. Switch to MockUSDC contract in Remix
2. Find `approve` function
3. Fill in:
   ```
   spender: <CombinatorialBettingPool address>
   amount: 1000000  (1,000 USDC with 6 decimals)
   ```
4. Click "transact" → Confirm

### 2. Place a Bet

1. Switch back to CombinatorialBettingPool
2. Find `placeCombiBet` function
3. Fill in:
   ```
   outcomeIds: [1]
   amount: 100000000  (100 USDC)
   betType: 0  (AND)
   minOdds: 0  (no slippage protection for testing)
   ```
4. Click "transact" → Confirm
5. Transaction should succeed ✅

### 3. Check Your Bet

1. Find `getBet` function (view)
2. Input: `betId: 1`
3. Click "call"
4. Should show your bet details ✅

### 4. Check Odds

1. Find `calculateCombinedOdds` function (view)
2. Input: `outcomeIds: [1]`
3. Click "call"
4. Should return current odds (e.g., `2000000000000000000` = 2.0x)

---

## 🛡️ Security Feature Testing (Optional, 10 minutes)

### Test Ownable2Step

```javascript
// In Remix console:
const [deployer, user2] = await web3.eth.getAccounts();

// Step 1: Transfer ownership
await pool.transferOwnership(user2);

// Check owner (should still be deployer)
await pool.owner(); // = deployer ✅

// Step 2: Accept ownership (from user2)
await pool.acceptOwnership({ from: user2 });

// Check owner (should now be user2)
await pool.owner(); // = user2 ✅
```

### Test Pause Mechanism

```javascript
// Pause contract
await pool.pause();

// Try to bet (should fail)
try {
  await pool.placeCombiBet([1], 100000000, 0, 0);
  console.log("❌ Should have reverted");
} catch (e) {
  console.log("✅ Correctly paused");
}

// Unpause
await pool.unpause();

// Now bet should work
await pool.placeCombiBet([1], 100000000, 0, 0); // ✅
```

---

## 📊 Deployment Summary

**Time:** ~15 minutes  
**Cost:** 0 ETH (local testnet)  
**Contracts Deployed:** 2 (MockUSDC + BettingPool)  
**Functions Tested:** Schedule, Create, Approve, Bet, Check

---

## 🚀 Next Steps

### Option 1: Continue Local Testing
- Test all 26 security scenarios
- Try batch settlement
- Test deadline extensions
- Simulate full story cycle

### Option 2: Deploy to Base Sepolia
```bash
forge create --rpc-url https://sepolia.base.org \
  --private-key $YOUR_PRIVATE_KEY \
  --verify \
  src/CombinatorialPool_v2_FIXED.sol:CombinatorialBettingPool \
  --constructor-args 0x036CbD53842c5426634e7929541eC2318f3dCF7e $TREASURY $OPS
```

### Option 3: Connect Frontend
- Update contract addresses in `apps/web/src/lib/contracts.ts`
- Test betting UI
- Verify real-time updates

---

## 🔧 Troubleshooting

### "Transaction reverted"
- Check constructor args are correct
- Ensure USDC address is valid
- Verify you have ETH for gas

### "Insufficient funds"
- Make sure you imported the test account with 10K ETH
- Check you're on Anvil network (Chain ID 31337)

### "Contract not compiling"
- Verify Solidity version is 0.8.23
- Check OpenZeppelin is installed
- Try clearing cache and recompiling

---

## ✅ Success Checklist

- [ ] Anvil running on port 8545
- [ ] MetaMask connected to Anvil
- [ ] Test account imported (10K ETH)
- [ ] MockUSDC deployed
- [ ] CombinatorialBettingPool deployed
- [ ] Chapter scheduled
- [ ] Outcome created
- [ ] USDC approved
- [ ] Bet placed successfully
- [ ] Bet verified in contract

---

**Created:** February 16, 2026 15:24 GMT+7  
**Anvil:** Running on http://127.0.0.1:8545  
**Status:** Ready for deployment via Remix IDE  
**Estimated Time:** 15 minutes to full deployment + testing
