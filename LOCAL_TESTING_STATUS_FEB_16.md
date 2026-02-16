# Local Testing Status - February 16, 2026 14:15 GMT+7

## ✅ Current Status: Anvil Running + Hardhat Installing

---

## What's Running

### ✅ Anvil (Local Blockchain)

**Status:** Running on http://127.0.0.1:8545  
**Chain ID:** 31337  
**Accounts:** 10 test accounts with 10,000 ETH each  

**Test Accounts:**
```
Account #0 (Deployer):
  Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
  Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
  Balance: 10,000 ETH

Account #1 (User 1):
  Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
  Balance: 10,000 ETH

Account #2 (User 2):
  Address: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
  Balance: 10,000 ETH
```

---

## Setup Progress

### ✅ Completed

1. Started Anvil local blockchain
2. Confirmed 10 test accounts available
3. Verified transaction functionality
4. Created `src/` directory
5. Copied `CombinatorialPool_v2_FIXED.sol` to `src/`
6. Initialized npm package
7. Installing Hardhat + dependencies

### ⏳ In Progress

- Installing Hardhat
- Installing @openzeppelin/contracts@5.0.0
- Installing hardhat-toolbox

### 🔜 Next Steps

1. Create hardhat.config.js
2. Create deployment script
3. Compile contracts
4. Deploy to local Anvil
5. Test manually

---

## Why Hardhat Instead of Foundry?

**Foundry Issues:**
- OpenZeppelin v5.0.0 certora files missing patched/ directory
- ds-test submodule conflicts
- Complex library dependency tree
- Compiler errors on certora harness files

**Hardhat Advantages:**
- Simpler dependency management
- Better error messages
- Easier to debug
- Works with OZ v5.0.0 out of the box
- JavaScript/TypeScript testing (more familiar for many devs)

---

## Files Created

1. `deploy-local.js` (3.8KB) - Basic deployment script
2. `SIMPLE_TEST_GUIDE.md` (6.2KB) - Testing walkthrough
3. `foundry-simple.toml` (393 bytes) - Simplified Foundry config (not working)
4. `src/CombinatorialPool_v2_FIXED.sol` - Contract ready for compilation

---

## Deployment Plan

### Step 1: Configure Hardhat

```javascript
// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    version: "0.8.23",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: [
        "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
      ]
    }
  }
};
```

### Step 2: Create Mock USDC Contract

```solidity
// contracts/MockUSDC.sol
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "USDC") {
        _mint(msg.sender, 1_000_000 * 1e6);
    }
    
    function decimals() public pure override returns (uint8) {
        return 6;
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
```

### Step 3: Deployment Script

```javascript
// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const [deployer, treasury, ops] = await ethers.getSigners();
  
  console.log("Deploying with account:", deployer.address);
  console.log("Balance:", await deployer.provider.getBalance(deployer.address));
  
  // Deploy Mock USDC
  console.log("\n📝 Deploying Mock USDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  console.log("✅ Mock USDC deployed to:", await usdc.getAddress());
  
  // Mint USDC to test accounts
  console.log("\n💰 Minting USDC to test accounts...");
  await usdc.mint(deployer.address, ethers.parseUnits("10000", 6));
  await usdc.mint(treasury.address, ethers.parseUnits("10000", 6));
  await usdc.mint(ops.address, ethers.parseUnits("10000", 6));
  
  // Deploy Betting Pool
  console.log("\n🎲 Deploying CombinatorialBettingPool...");
  const Pool = await ethers.getContractFactory("CombinatorialBettingPool");
  const pool = await Pool.deploy(
    await usdc.getAddress(),
    treasury.address,
    ops.address
  );
  await pool.waitForDeployment();
  console.log("✅ Pool deployed to:", await pool.getAddress());
  
  // Test basic function
  console.log("\n🧪 Testing basic functions...");
  
  // Schedule a chapter
  const generationTime = Math.floor(Date.now() / 1000) + (2 * 24 * 60 * 60); // +2 days
  await pool.scheduleChapter(1, generationTime);
  console.log("✅ Chapter 1 scheduled");
  
  // Create outcome
  const tx = await pool.createOutcome(0, "Test outcome", 1, 1);
  await tx.wait();
  console.log("✅ Outcome created");
  
  // Check if betting is open
  const isOpen = await pool.isBettingOpen(1);
  console.log("✅ Betting open:", isOpen);
  
  console.log("\n🎉 Deployment complete!");
  console.log("\nContract Addresses:");
  console.log("  USDC:", await usdc.getAddress());
  console.log("  Pool:", await pool.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Step 4: Run Deployment

```bash
npx hardhat run scripts/deploy.js --network localhost
```

---

## Testing Plan

### Manual Tests (Using Hardhat Console)

```bash
npx hardhat console --network localhost
```

```javascript
// Get contracts
const usdc = await ethers.getContractAt("MockUSDC", "0x...");
const pool = await ethers.getContractAt("CombinatorialBettingPool", "0x...");

// Test betting flow
const [user1] = await ethers.getSigners();

// 1. Approve USDC
await usdc.approve(await pool.getAddress(), ethers.parseUnits("100", 6));

// 2. Place bet
await pool.placeCombiBet([1], ethers.parseUnits("100", 6), 0, 0);

// 3. Check bet
const bet = await pool.getBet(1);
console.log("Bet:", bet);
```

---

## Security Tests (Manual)

### 1. Ownable2Step

```javascript
const [owner, newOwner] = await ethers.getSigners();

// Step 1: Transfer ownership
await pool.transferOwnership(newOwner.address);

// Owner should still be original
const currentOwner = await pool.owner();
console.log("Owner after transfer:", currentOwner); // Should be original

// Step 2: Accept ownership
await pool.connect(newOwner).acceptOwnership();

// Now it should be new owner
const finalOwner = await pool.owner();
console.log("Owner after accept:", finalOwner); // Should be newOwner
```

### 2. Pause Mechanism

```javascript
// Pause
await pool.pause();

// Try to bet (should fail)
try {
  await pool.placeCombiBet([1], ethers.parseUnits("100", 6), 0, 0);
  console.log("❌ Should have failed");
} catch (e) {
  console.log("✅ Correctly reverted when paused");
}

// Unpause
await pool.unpause();

// Now should work
await pool.placeCombiBet([1], ethers.parseUnits("100", 6), 0, 0);
console.log("✅ Works after unpause");
```

### 3. Deadline Extension (7-day limit)

```javascript
const chapterId = 1;
const originalTime = await pool.chapterSchedules(chapterId);

// Try to extend by 8 days (should fail)
try {
  const newTime = originalTime.generationTime + (8 * 24 * 60 * 60);
  await pool.extendDeadline(chapterId, newTime);
  console.log("❌ Should have failed");
} catch (e) {
  console.log("✅ Correctly prevented >7 day extension");
}

// Extend by 3 days (should work)
const newTime = originalTime.generationTime + (3 * 24 * 60 * 60);
await pool.extendDeadline(chapterId, newTime);
console.log("✅ 3-day extension worked");
```

### 4. Slippage Protection

```javascript
// Get current odds
const odds = await pool.calculateCombinedOdds([1]);
console.log("Current odds:", ethers.formatUnits(odds, 18));

// Set minOdds higher than current (should fail)
try {
  await pool.placeCombiBet(
    [1], 
    ethers.parseUnits("100", 6), 
    0, 
    odds + ethers.parseUnits("1", 18) // 1.0 higher
  );
  console.log("❌ Should have failed");
} catch (e) {
  console.log("✅ Slippage protection working");
}

// Set minOdds lower (should work)
await pool.placeCombiBet([1], ethers.parseUnits("100", 6), 0, 0);
console.log("✅ Bet with acceptable odds worked");
```

### 5. Batch Settlement Limit (50 max)

```javascript
// Try to settle 51 bets (should fail)
const betIds = Array.from({length: 51}, (_, i) => i + 1);
try {
  await pool.settleBetBatch(betIds);
  console.log("❌ Should have failed");
} catch (e) {
  console.log("✅ Correctly limited to 50 bets");
}

// 50 bets should work
const validBetIds = betIds.slice(0, 50);
await pool.settleBetBatch(validBetIds);
console.log("✅ 50-bet batch worked");
```

---

## Expected Timeline

**Now (2:15 PM):** Hardhat installing  
**2:20 PM:** Create hardhat.config.js  
**2:25 PM:** Create contracts + deploy script  
**2:30 PM:** Compile contracts  
**2:35 PM:** Deploy to local Anvil  
**2:40 PM:** Manual testing  
**2:50 PM:** Security feature testing  
**3:00 PM:** Complete local testing report

---

## Success Criteria

### Deployment

- [ ] Mock USDC deploys successfully
- [ ] CombinatorialBettingPool deploys successfully
- [ ] Constructor args accepted (USDC, treasury, ops)
- [ ] Contracts verified on local node

### Basic Functionality

- [ ] Chapter scheduling works
- [ ] Outcome creation works
- [ ] Betting window logic correct (1-hour buffer)
- [ ] Bet placement works
- [ ] Odds calculation works
- [ ] Settlement works
- [ ] Fee distribution works (70/30)

### Security Features

- [ ] Ownable2Step requires 2 steps
- [ ] Pause prevents betting
- [ ] Unpause allows betting
- [ ] Deadline extension limited to 7 days
- [ ] Slippage protection works
- [ ] Batch limit enforced (50 max)

---

## Fallback Plan

If Hardhat also has issues:

1. **Use Remix IDE** (https://remix.ethereum.org)
   - Upload contract
   - Compile in browser
   - Deploy to Anvil via web3 provider
   - Test via Remix UI

2. **Direct solc compilation**
   ```bash
   solc --optimize --bin --abi \
     --allow-paths node_modules \
     CombinatorialPool_v2_FIXED.sol
   ```

3. **Deploy with cast**
   ```bash
   cast send --create <bytecode> \
     --constructor-args $USDC $TREASURY $OPS
   ```

---

## Summary

**Anvil:** ✅ Running smoothly  
**Hardhat:** ⏳ Installing  
**Contracts:** ✅ Ready (security-hardened)  
**Tests:** ✅ Manual test plan ready  
**Timeline:** ~45 minutes to full local deployment + testing

---

**Created:** February 16, 2026 14:15 GMT+7  
**Anvil URL:** http://127.0.0.1:8545  
**Status:** Setting up Hardhat for compilation + deployment  
**Next:** Deploy + test manually
