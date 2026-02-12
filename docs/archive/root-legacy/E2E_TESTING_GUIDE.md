# End-to-End Testing Guide

## Prerequisites

1. **Wallet Setup:**
   - MetaMask installed with Base Sepolia network configured
   - Network details:
     - RPC URL: `https://sepolia.base.org`
     - Chain ID: `84532`
     - Currency: ETH
     - Block Explorer: `https://sepolia.basescan.org`

2. **Get Test Tokens:**
   - **Sepolia ETH**: https://sepoliafaucet.com
   - **Mock USDC**: Already deployed at `0xe0761EFa93aB7dfc4d0042476C5dEA9b7B83E132`
     - To mint: Call `mint(address to, uint256 amount)` on Basescan
     - Amount: 1000000 (= 1 USDC, 6 decimals)

3. **Dev Server Running:**
   ```bash
   cd /Users/eli5defi/.openclaw/workspace/StoryEngine
   pnpm dev
   ```
   - Homepage: http://localhost:3000
   - Story page: http://localhost:3000/story/1

---

## Test Flow

### 1. Connect Wallet ✅

1. Navigate to http://localhost:3000
2. Click **"Connect Wallet"** button (top right)
3. Select MetaMask from RainbowKit modal
4. Approve connection
5. Verify:
   - ✅ Wallet address displayed (truncated: 0xEFc0...Eb6B)
   - ✅ Network shows "Base Sepolia"
   - ✅ No console errors in DevTools

**Expected Result:** Wallet connected, no SSR errors

---

### 2. Navigate to Story ✅

1. Click on **"The Last Archive"** card
2. URL changes to `/story/1`
3. Verify:
   - ✅ Story title displayed
   - ✅ Chapter content loads
   - ✅ Betting interface visible
   - ✅ 3 branches shown (Branch A, B, C)

**Expected Result:** Story page renders with betting interface

---

### 3. View Betting Pool Stats 📊

**Check the betting interface displays:**
- Total pool size (should be 0 initially)
- Odds for each branch (should be equal if no bets)
- Betting deadline (7 days from pool creation)
- Your USDC balance

**Expected Result:** Pool stats load from blockchain

---

### 4. Approve USDC Spending 💰

**First time only:**
1. Enter bet amount (e.g., `100` = 100 USDC)
2. Select a branch (e.g., Branch A)
3. Click **"Approve USDC"** button
4. MetaMask popup appears
5. Confirm transaction
6. Wait for confirmation (~2-5 seconds)

**Verify on Basescan:**
- Navigate to: https://sepolia.basescan.org/address/0xe0761EFa93aB7dfc4d0042476C5dEA9b7B83E132
- Check "Token Approvals" tab
- Should show approval for ChapterBettingPool contract

**Expected Result:** USDC approved for betting contract

---

### 5. Place Bet 🎲

1. Enter bet amount: `10` (minimum = 10 USDC)
2. Select **Branch A**
3. Click **"Place Bet"** button
4. MetaMask popup appears
5. Review transaction:
   - **To:** `0xD4C57AC117670C8e1a8eDed3c05421d404488123` (ChapterBettingPool)
   - **Function:** `placeBet(uint8 branchIndex, uint256 amount)`
   - **Data:** Branch = 0, Amount = 10000000 (10 USDC with 6 decimals)
6. Confirm transaction
7. Wait for confirmation (~2-5 seconds)

**Expected Result:** Transaction succeeds, bet recorded on-chain

---

### 6. Verify on Basescan 🔍

**View your bet:**
1. Navigate to: https://sepolia.basescan.org/address/0xD4C57AC117670C8e1a8eDed3c05421d404488123
2. Click "Transactions" tab
3. Find your `placeBet` transaction
4. Click transaction hash
5. Verify:
   - ✅ Status: Success ✅
   - ✅ From: Your wallet address
   - ✅ To: ChapterBettingPool contract
   - ✅ Value: 0 ETH (USDC transfer)
   - ✅ Function: `placeBet(0, 10000000)`

**View bet details (read contract):**
1. Go to "Read Contract" tab
2. Call `getBetInfo(storyId, chapterId, branchIndex, betterAddress)`
   - `storyId`: 1
   - `chapterId`: 1
   - `branchIndex`: 0 (Branch A)
   - `betterAddress`: Your wallet
3. Should return: `(amount: 10000000, claimed: false)`

**Expected Result:** Bet visible on blockchain explorer

---

### 7. Check Updated Pool Stats 📈

**Back on the story page:**
1. Refresh the page
2. Verify betting interface updates:
   - ✅ Total pool size increased by 10 USDC
   - ✅ Branch A odds changed (now has more bets)
   - ✅ Your bet shows in "Your Bets" section
   - ✅ Pool composition updated

**Expected Result:** UI reflects on-chain state

---

## Edge Cases to Test

### Test 1: Minimum Bet (10 USDC)
- Enter `10` → Should succeed
- Enter `9` → Should show error: "Minimum bet is 10 USDC"

### Test 2: Maximum Bet (10,000 USDC)
- Enter `10000` → Should succeed (if you have balance)
- Enter `10001` → Should show error: "Maximum bet is 10,000 USDC"

### Test 3: Insufficient Balance
- Enter amount > your USDC balance
- Should show error: "Insufficient USDC balance"

### Test 4: Multiple Bets
- Place bet on Branch A (10 USDC)
- Place another bet on Branch A (20 USDC)
- Both should succeed
- Total bet on Branch A = 30 USDC

### Test 5: Bet on Different Branches
- Place bet on Branch A (10 USDC)
- Place bet on Branch B (15 USDC)
- Both should succeed
- Pool should show bets on both branches

### Test 6: Bet After Deadline
- Wait until betting deadline passes (7 days)
- Try to place bet
- Should show error: "Betting period has ended"

---

## Contract Addresses (Base Sepolia)

| Contract | Address | Explorer |
|----------|---------|----------|
| Mock USDC | `0xe0761EFa93aB7dfc4d0042476C5dEA9b7B83E132` | [View](https://sepolia.basescan.org/address/0xe0761EFa93aB7dfc4d0042476C5dEA9b7B83E132) |
| ChapterBettingPool | `0xD4C57AC117670C8e1a8eDed3c05421d404488123` | [View](https://sepolia.basescan.org/address/0xD4C57AC117670C8e1a8eDed3c05421d404488123) |
| Deployer Wallet | `0xEFc063544506823DD291e04E873ca40E0CF0Eb6B` | [View](https://sepolia.basescan.org/address/0xEFc063544506823DD291e04E873ca40E0CF0Eb6B) |

---

## Troubleshooting

### Issue: "Insufficient USDC balance"
**Solution:** Mint more USDC:
1. Go to Mock USDC on Basescan
2. "Write Contract" → "mint"
3. `to`: Your wallet address
4. `amount`: 1000000000 (1,000 USDC)

### Issue: "User rejected transaction"
**Solution:** Make sure you approve the transaction in MetaMask

### Issue: "Transaction reverted"
**Possible causes:**
- Bet amount < 10 USDC or > 10,000 USDC
- Insufficient USDC approval
- Betting period ended
- Check Basescan transaction for revert reason

### Issue: "Network Error"
**Solution:** 
- Check you're on Base Sepolia network
- Verify RPC endpoint is working
- Refresh page and try again

---

## Success Criteria ✅

- [ ] Wallet connects without SSR errors
- [ ] Story page loads with betting interface
- [ ] Pool stats load from blockchain
- [ ] USDC approval succeeds
- [ ] Bet placement succeeds
- [ ] Transaction visible on Basescan
- [ ] Bet details readable on-chain
- [ ] UI updates after bet placement
- [ ] All edge cases handled gracefully

---

## Next Steps After Testing

1. ✅ **Contract Verification** (Step 3)
2. ✅ **Launch $FORGE Token** (Step 5)
3. ✅ **Production Database Setup** (Step 6)
4. ✅ **Deploy to Vercel** (Step 7)
5. ✅ **Test on Staging** (Step 8)
6. ✅ **Deploy to Base Mainnet** (Step 9)

---

**Dev Server:** http://localhost:3000  
**Docs:** `BUILD_PROGRESS.md`, `BLOCKCHAIN_STATUS.md`  
**Support:** Check console logs in DevTools for detailed errors
