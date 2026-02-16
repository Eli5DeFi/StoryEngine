# Anvil WebSocket Ready - February 16, 2026 14:43 GMT+7

## ✅ Status: Anvil Running with WebSocket Support

---

## Connection Details

### HTTP JSON-RPC ✅
```
URL: http://127.0.0.1:8545
Method: POST with JSON payload
Status: WORKING
```

**Test:**
```bash
curl -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Response: {"jsonrpc":"2.0","id":1,"result":"0x0"} ✅
```

---

### WebSocket ✅
```
URL: ws://127.0.0.1:8545
Protocol: WebSocket
Status: WORKING
```

**Test:**
```javascript
const WebSocket = require('ws');
const ws = new WebSocket('ws://127.0.0.1:8545');

ws.on('open', () => {
  ws.send(JSON.stringify({
    jsonrpc: '2.0',
    method: 'eth_blockNumber',
    params: [],
    id: 1
  }));
});

ws.on('message', (data) => {
  console.log('Response:', data.toString());
  // Response: {"jsonrpc":"2.0","id":1,"result":"0x0"} ✅
});
```

---

## Network Configuration

**Host:** 0.0.0.0 (accessible from all interfaces)  
**Port:** 8545  
**Chain ID:** 31337  
**Accounts:** 10 test accounts with 10,000 ETH each

---

## Test Accounts

**Deployer (Account #0):**
```
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Balance: 10,000 ETH
```

**User 1 (Account #1):**
```
Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
Balance: 10,000 ETH
```

**User 2 (Account #2):**
```
Address: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
Balance: 10,000 ETH
```

---

## Usage Examples

### ethers.js (HTTP)
```javascript
const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');

// Get block number
const blockNumber = await provider.getBlockNumber();
console.log('Block:', blockNumber);

// Get balance
const balance = await provider.getBalance('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
console.log('Balance:', ethers.formatEther(balance), 'ETH');
```

---

### ethers.js (WebSocket)
```javascript
const { ethers } = require('ethers');

const provider = new ethers.WebSocketProvider('ws://127.0.0.1:8545');

// Subscribe to new blocks
provider.on('block', (blockNumber) => {
  console.log('New block:', blockNumber);
});

// Subscribe to pending transactions
provider.on('pending', (txHash) => {
  console.log('Pending tx:', txHash);
});
```

---

### web3.js (HTTP)
```javascript
const Web3 = require('web3');

const web3 = new Web3('http://127.0.0.1:8545');

// Get block number
const blockNumber = await web3.eth.getBlockNumber();
console.log('Block:', blockNumber);
```

---

### web3.js (WebSocket)
```javascript
const Web3 = require('web3');

const web3 = new Web3('ws://127.0.0.1:8545');

// Subscribe to new blocks
web3.eth.subscribe('newBlockHeaders', (error, blockHeader) => {
  if (!error) {
    console.log('New block:', blockHeader.number);
  }
});
```

---

### MetaMask Connection

**Add Custom Network:**
1. Open MetaMask
2. Click Networks dropdown → "Add Network"
3. Click "Add a network manually"

**Settings:**
```
Network Name: Anvil Local
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency Symbol: ETH
```

**Import Test Account:**
1. Click account icon → "Import Account"
2. Select "Private Key"
3. Paste: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
4. Account imported with 10,000 ETH ✅

---

## Deployment Ready

### Using Hardhat (when npm cache fixed)

```javascript
// hardhat.config.js
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

```bash
npx hardhat run scripts/deploy.js --network localhost
```

---

### Using Foundry

```bash
forge create --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  src/CombinatorialPool_v2_FIXED.sol:CombinatorialBettingPool \
  --constructor-args $USDC $TREASURY $OPS
```

---

### Using Remix IDE

**Connect to Injected Provider:**
1. Add Anvil network to MetaMask (see above)
2. Import test account to MetaMask
3. In Remix: Deploy & Run → Environment → "Injected Provider - MetaMask"
4. MetaMask will prompt to connect to 127.0.0.1:8545
5. Deploy contracts via Remix UI ✅

---

## Frontend Integration

### React + wagmi
```typescript
import { createConfig, http } from 'wagmi'
import { localhost } from 'wagmi/chains'

export const config = createConfig({
  chains: [localhost],
  transports: {
    [localhost.id]: http('http://127.0.0.1:8545'),
  },
})
```

---

### React + ethers
```typescript
import { ethers } from 'ethers'

// HTTP provider
const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545')

// WebSocket provider (for real-time updates)
const wsProvider = new ethers.WebSocketProvider('ws://127.0.0.1:8545')

// Listen for new blocks
wsProvider.on('block', (blockNumber) => {
  console.log('New block:', blockNumber)
})
```

---

## Testing WebSocket Support

**Run the test script:**
```bash
cd poc/combinatorial-betting
node test-ws.js
```

**Expected output:**
```
✅ WebSocket connected!
✅ Response: {"jsonrpc":"2.0","id":1,"result":"0x0"}
🔌 WebSocket disconnected
```

---

## Control Commands

**Check Status:**
```bash
curl -s http://127.0.0.1:8545 \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  | jq .
```

**Stop Anvil:**
```bash
pkill anvil
```

**Restart Anvil (with WebSocket):**
```bash
anvil --port 8545 --chain-id 31337 --host 0.0.0.0
```

**View Logs:**
```bash
# Anvil logs to stdout, check your terminal or use:
ps aux | grep anvil
```

---

## Common Issues & Solutions

### "Connection header did not include 'upgrade'"

**Cause:** Trying to use WebSocket on HTTP-only Anvil  
**Solution:** Restart Anvil with `--host 0.0.0.0` (enables WebSocket) ✅

---

### "ECONNREFUSED 127.0.0.1:8545"

**Cause:** Anvil not running  
**Solution:** Start Anvil: `anvil --port 8545 --chain-id 31337 --host 0.0.0.0`

---

### MetaMask shows "Request failed"

**Cause:** Network not added or wrong Chain ID  
**Solution:** 
1. Verify Chain ID is 31337
2. Use HTTP URL (not WebSocket): `http://127.0.0.1:8545`
3. Clear MetaMask activity data (Settings → Advanced → Clear Activity Data)

---

## What Changed

**Previous Setup:**
```bash
anvil --port 8545 --chain-id 31337
# HTTP only, no WebSocket support
```

**Current Setup:**
```bash
anvil --port 8545 --chain-id 31337 --host 0.0.0.0
# HTTP + WebSocket support ✅
```

**Key Difference:** `--host 0.0.0.0` enables WebSocket connections

---

## Summary

✅ **HTTP JSON-RPC:** Working  
✅ **WebSocket:** Working  
✅ **10 Test Accounts:** Loaded  
✅ **MetaMask Ready:** Can connect  
✅ **Deployment Ready:** Hardhat/Foundry/Remix  

**Anvil Process:** Running in background (PID can be found with `ps aux | grep anvil`)  
**Stop Command:** `pkill anvil`

---

## Next Steps

1. **Deploy Contracts:** Use Hardhat, Foundry, or Remix
2. **Connect Frontend:** Use HTTP or WebSocket provider
3. **Test Functions:** Schedule chapters, place bets, settle outcomes
4. **Security Testing:** Test all 14 security fixes manually

---

**Created:** February 16, 2026 14:43 GMT+7  
**HTTP URL:** http://127.0.0.1:8545  
**WebSocket URL:** ws://127.0.0.1:8545  
**Status:** ✅ READY FOR DEPLOYMENT
