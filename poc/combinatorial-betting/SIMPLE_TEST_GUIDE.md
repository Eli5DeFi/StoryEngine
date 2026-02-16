# Simple Local Testing Guide - CombinatorialPool_v2_FIXED

## ✅ Status: Anvil Running Locally

**Local blockchain:** http://127.0.0.1:8545  
**Chain ID:** 31337  
**Test Accounts:** 10 accounts with 10,000 ETH each

---

## Current Situation

**Foundry Compilation Issues:**
- OpenZeppelin v5.0.0 certora dependencies conflict
- ds-test submodule issues
- Complex dependency tree

**Solution:** Manual testing approach until dependencies are resolved

---

## Test Account Details

**Account #0 (Deployer):**
```
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Balance: 10,000 ETH
```

**Account #1 (User 1):**
```
Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
Balance: 10,000 ETH
```

**Account #2 (User 2):**
```
Address: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
Balance: 10,000 ETH
```

---

## Option 1: Manual Deployment (Recommended)

### Step 1: Compile Contract with Solc

```bash
# Install solc if needed
npm install -g solc

# Compile (after resolving OZ imports)
solc --optimize --bin --abi CombinatorialPool_v2_FIXED.sol -o build/
```

### Step 2: Deploy Mock USDC

```bash
# Create simple ERC20 mock
cast send --private-key $PRIVATE_KEY --create <BYTECODE>
```

### Step 3: Deploy Betting Pool

```bash
# Deploy with constructor args
cast send --private-key $PRIVATE_KEY --create <BYTECODE> \
  --constructor-args $USDC_ADDRESS $TREASURY $OPS_WALLET
```

---

## Option 2: Use Hardhat (Alternative)

### Setup

```bash
cd poc/combinatorial-betting
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```

### Configure hardhat.config.js

```javascript
module.exports = {
  solidity: "0.8.23",
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

### Deploy Script

```javascript
// scripts/deploy.js
async function main() {
  const [deployer] = await ethers.getSigners();
  
  // Deploy Mock USDC
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.deployed();
  
  // Deploy Betting Pool
  const Pool = await ethers.getContractFactory("CombinatorialBettingPool");
  const pool = await Pool.deploy(
    usdc.address,
    deployer.address, // treasury
    deployer.address  // ops wallet
  );
  await pool.deployed();
  
  console.log("USDC deployed to:", usdc.address);
  console.log("Pool deployed to:", pool.address);
}

main();
```

### Run

```bash
npx hardhat run scripts/deploy.js --network localhost
```

---

## Option 3: Using Cast (Quick Tests)

### Check Anvil Connection

```bash
cast block-number --rpc-url http://127.0.0.1:8545
```

### Send Test Transaction

```bash
cast send \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --rpc-url http://127.0.0.1:8545 \
  0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \
  --value 1ether
```

### Check Balance

```bash
cast balance 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \
  --rpc-url http://127.0.0.1:8545
```

---

## What's Working

✅ **Anvil:** Running on port 8545  
✅ **Test Accounts:** 10 accounts loaded  
✅ **Contract Code:** Security-hardened and ready  
✅ **Test Suite Code:** 26 tests written  

---

## What Needs Resolution

⏳ **Foundry Dependencies:**
- OpenZeppelin v5.0.0 certora conflict
- forge-std ds-test submodule
- Library test directories

⏳ **Compilation:**
- Need to compile contracts successfully
- Generate ABI + bytecode

⏳ **Deployment:**
- Deploy Mock USDC first
- Deploy CombinatorialPool_v2_FIXED
- Verify deployment

---

## Recommended Next Steps

### Immediate (5 minutes)

1. **Try Hardhat Compilation:**
   ```bash
   cd poc/combinatorial-betting
   npm init -y
   npm install --save-dev hardhat @openzeppelin/contracts@5.0.0
   npx hardhat init
   mv src/CombinatorialPool_v2_FIXED.sol contracts/
   npx hardhat compile
   ```

2. **Deploy with Hardhat:**
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

3. **Test Manually:**
   - Call functions with cast
   - Verify state changes
   - Test betting flow

### Short-term (this week)

1. Resolve Foundry dependencies (use OZ v4.9.x instead of v5.0.0)
2. Get test suite running
3. Full automated testing

### Alternative: Use Production Testnet

Skip local testing and deploy directly to Base Sepolia:
```bash
forge create --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY \
  CombinatorialPool_v2_FIXED \
  --constructor-args $USDC $TREASURY $OPS
```

---

## Testing Checklist (Manual)

Once deployed, test these manually with cast:

### Basic Functions

- [ ] `scheduleChapter(chapterId, generationTime)`
- [ ] `createOutcome(type, description, chapterId, choiceId)`
- [ ] `isBettingOpen(chapterId)`
- [ ] `getTimeUntilDeadline(chapterId)`

### Betting

- [ ] Approve USDC
- [ ] `placeCombiBet(outcomeIds, amount, betType, minOdds)`
- [ ] Verify bet recorded
- [ ] Check odds calculation

### Settlement

- [ ] `resolveOutcome(outcomeId, occurred)`
- [ ] `settleBet(betId)`
- [ ] Verify payout
- [ ] Check fee distribution

### Security Features

- [ ] Test 2-step ownership transfer
- [ ] Test pause mechanism
- [ ] Test deadline extension (7-day limit)
- [ ] Test slippage protection
- [ ] Test batch settlement limit (50 max)

---

## Environment Variables

```bash
export ANVIL_RPC=http://127.0.0.1:8545
export DEPLOYER_PK=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
export DEPLOYER_ADDR=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

---

## Summary

**Anvil:** ✅ Running  
**Contracts:** ✅ Security-hardened  
**Tests:** ✅ Written (26 tests)  
**Compilation:** ⏳ Dependency issues  
**Deployment:** ⏳ Pending compilation  

**Quickest Path Forward:** Use Hardhat instead of Foundry for now

---

**Created:** February 16, 2026 14:15 GMT+7  
**Anvil PID:** Check with `ps aux | grep anvil`  
**Stop Anvil:** `pkill anvil` or Ctrl+C
