# ✅ Frontend Running Locally - February 16, 2026 16:10 GMT+7

## 🌐 Application Open

**URL:** http://localhost:3000  
**Status:** ✅ Running  
**Browser:** Opened automatically

---

## 🔧 Configuration

### Network
- **Chain ID:** 31337 (Anvil Local)
- **RPC URL:** http://127.0.0.1:8545

### Deployed Contracts
- **MockUSDC:** `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **BettingPool:** `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`

### Frontend Configuration
- Updated `apps/web/src/lib/contracts.ts` ✅
- Updated `apps/web/.env.local` ✅
- Dev server restarted with new config ✅

---

## 🦊 MetaMask Setup (Required)

To interact with the contracts, you need to:

### 1. Add Anvil Network to MetaMask

**Network Details:**
```
Network name: Anvil Local
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency symbol: ETH
```

**Steps:**
1. Open MetaMask
2. Click network dropdown → "Add Network" → "Add a network manually"
3. Fill in details above
4. Click "Save"
5. Switch to "Anvil Local" network

---

### 2. Import Test Account

**Account Details:**
```
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Balance: ~10,000 ETH + 1,000,000 USDC
```

**Steps:**
1. Click MetaMask account icon
2. Click "Import Account"
3. Select "Private Key"
4. Paste private key above
5. Click "Import"
6. You should see 10,000 ETH balance ✅

---

## 🎮 What You Can Do

### Current Pages Available

1. **Home** (`/`) - Landing page
2. **Lore** (`/lore`) - Story background
3. **Houses** (`/lore/houses-dynamic`) - House information
4. **About** (`/about`) - About the project
5. **FAQ** (`/faq`) - Frequently asked questions

### Interactive Features (Once Connected)

**Note:** Betting features require:
1. Chapter scheduled (use cast commands)
2. Outcomes created (use cast commands)
3. USDC approval
4. MetaMask connected to Anvil network

---

## 🧪 Full Test Workflow

### Step 1: Setup Backend (Using Terminal)

```bash
# 1. Schedule a chapter
cast send 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 \
  "scheduleChapter(uint256,uint256)" \
  1 $(($(date +%s) + 172800)) \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# 2. Create outcomes
cast send 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 \
  "createOutcome(uint8,string,uint256,uint256)" \
  0 "Aria survives" 1 1 \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

cast send 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 \
  "createOutcome(uint8,string,uint256,uint256)" \
  1 "Alliance formed" 1 2 \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### Step 2: Use Frontend (In Browser)

1. **Connect Wallet** - Click "Connect Wallet" button
2. **Switch Network** - MetaMask will prompt to switch to Anvil
3. **View Balances** - Should see ETH and USDC balances
4. **Approve USDC** - Approve betting pool to spend USDC
5. **Place Bet** - Select outcomes and place bet
6. **View Bet** - See your active bets

---

## 🛠️ Development Commands

### Stop Frontend
```bash
# Find process
ps aux | grep "next dev"

# Kill it
pkill -f "next dev"
```

### Restart Frontend
```bash
cd /Users/eli5defi/.openclaw/workspace/StoryEngine/apps/web
pnpm dev
```

### Check Logs
```bash
# Frontend logs appear in terminal where pnpm dev is running
```

---

## 📊 Current Status

| Component | Status | Details |
|-----------|--------|---------|
| Anvil | ✅ Running | http://127.0.0.1:8545 |
| Frontend | ✅ Running | http://localhost:3000 |
| MockUSDC | ✅ Deployed | 0x5FbDB...0aa3 |
| BettingPool | ✅ Deployed | 0xe7f17...0512 |
| Browser | ✅ Opened | Ready for interaction |
| MetaMask | ⏳ Pending | Need to add Anvil network + import account |

---

## 🔍 Troubleshooting

### "Wrong Network" Error
- Make sure MetaMask is on Anvil Local (Chain ID 31337)
- RPC URL: http://127.0.0.1:8545

### Can't See Balances
- Ensure you imported the test account
- Private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

### Contract Not Found
- Verify Anvil is running: `cast block-number --rpc-url http://127.0.0.1:8545`
- Redeploy if needed (see `DEPLOYMENT_COMPLETE_FEB_16.md`)

### Page Not Loading
- Check frontend is running: http://localhost:3000
- Restart if needed: `cd apps/web && pnpm dev`

---

## 📁 Configuration Files Changed

1. `apps/web/src/lib/contracts.ts` - Updated contract addresses
2. `apps/web/.env.local` - Updated to Anvil network

**Committed:** Changes saved to git

---

## 🎯 Next Steps

1. ✅ Frontend is running
2. ⏳ Add Anvil network to MetaMask
3. ⏳ Import test account to MetaMask
4. ⏳ Schedule chapter + create outcomes (via cast)
5. ⏳ Connect wallet in frontend
6. ⏳ Test full betting cycle

---

**Created:** February 16, 2026 16:10 GMT+7  
**Frontend URL:** http://localhost:3000  
**Status:** Ready for interaction!
