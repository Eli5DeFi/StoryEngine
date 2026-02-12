# Blockchain Setup Guide

Complete guide for setting up blockchain infrastructure for NarrativeForge.

## 🎯 Overview

This guide covers:
1. Launching $FORGE token on Base
2. Deploying betting pool contracts
3. Setting up wallet connection
4. Testing on Base Sepolia testnet
5. Mainnet deployment

---

## 📋 Prerequisites

**Required:**
- Bankr API key ([get here](https://bankr.bot/api))
- Base Sepolia testnet ETH ([faucet](https://faucet.base.org/))
- MetaMask or compatible wallet

**Optional (for contract deployment):**
- Private key for deployer wallet
- Basescan API key ([get here](https://basescan.org/apis))

---

## 🪙 Step 1: Launch $FORGE Token

### Option A: Via Bankr Skill (Easiest)

**In any OpenClaw chat, just say:**

```
"launch a token named NarrativeForge with symbol FORGE on base testnet with 1 billion supply"
```

**Or for mainnet:**
```
"launch a token named NarrativeForge with symbol FORGE on base mainnet with 1 billion supply"
```

**Bankr will:**
- Deploy ERC-20 token contract
- Set up initial liquidity
- Return token address
- Handle all gas fees

**Save the token address:**
```bash
# Add to .env
echo 'NEXT_PUBLIC_FORGE_TOKEN_ADDRESS=0x...' >> .env
```

### Option B: Via Bankr SDK (Programmatic)

```typescript
import { TokenManager } from '@narrative-forge/bankr-integration'
import { BankrClient } from '@narrative-forge/bankr-integration'

const client = new BankrClient({
  apiKey: process.env.BANKR_API_KEY!,
  chain: 'base',
})

const tokenManager = new TokenManager(client)

// Launch token
const tokenAddress = await tokenManager.launchForgeToken({
  name: 'NarrativeForge',
  symbol: 'FORGE',
  chain: 'base', // or 'base' for mainnet
  initialSupply: '1000000000', // 1B tokens
  metadata: {
    description: 'Platform token for NarrativeForge - bet on AI story choices',
    website: 'https://narrativeforge.ai',
  },
})

console.log('✅ $FORGE launched:', tokenAddress)
```

### Option C: Manual Deployment (Advanced)

If you want full control, deploy your own ERC-20:

```bash
cd packages/contracts

# Create token contract
cat > src/ForgeToken.sol << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ForgeToken is ERC20 {
    constructor() ERC20("NarrativeForge", "FORGE") {
        _mint(msg.sender, 1_000_000_000 * 10**decimals());
    }
}
EOF

# Deploy
forge create --rpc-url base_sepolia \
  --private-key $PRIVATE_KEY \
  --verify \
  src/ForgeToken.sol:ForgeToken
```

---

## 🔧 Step 2: Deploy Betting Pool Contracts

### For Testnet (Base Sepolia)

```bash
cd packages/contracts

# Set environment variables
export PRIVATE_KEY="0x..."
export FORGE_TOKEN_ADDRESS="0x..."  # From Step 1

# Run testnet deployment (includes mock FORGE if needed)
forge script script/DeployTestnet.s.sol \
  --rpc-url base_sepolia \
  --broadcast \
  --verify

# Save the output addresses
# ChapterBettingPool: 0x...
```

### For Mainnet (Base)

```bash
# Set environment variables
export PRIVATE_KEY="0x..."
export FORGE_TOKEN_ADDRESS="0x..."  # Real $FORGE from Bankr
export BASESCAN_API_KEY="..."      # For verification

# Deploy to mainnet
forge script script/Deploy.s.sol \
  --rpc-url base \
  --broadcast \
  --verify

# IMPORTANT: This costs real ETH for gas!
```

### Update .env with Contract Addresses

```bash
# Add to .env
echo 'NEXT_PUBLIC_BETTING_POOL_ADDRESS=0x...' >> .env
echo 'NEXT_PUBLIC_FORGE_TOKEN_ADDRESS=0x...' >> .env
```

---

## 💼 Step 3: Add Liquidity to $FORGE

### Via Bankr Skill

```
"add liquidity for token 0x[FORGE_ADDRESS] on base testnet with 0.5 ETH and 100000 FORGE"
```

**This will:**
- Create a liquidity pool (usually on Uniswap)
- Add your ETH + FORGE to the pool
- Enable trading

**For mainnet, adjust amounts:**
```
"add liquidity for token 0x[FORGE_ADDRESS] on base with 5 ETH and 1000000 FORGE"
```

### Via SDK

```typescript
await tokenManager.addLiquidity({
  tokenAddress: forgeAddress,
  ethAmount: '0.5',      // ETH to add
  tokenAmount: '100000', // FORGE to add
  chain: 'base',
})
```

---

## 🔗 Step 4: Set Up Wallet Connection (Frontend)

### Install Dependencies

```bash
cd apps/web
pnpm add wagmi viem @tanstack/react-query @rainbow-me/rainbowkit
```

### Create Wagmi Config

Create `apps/web/src/lib/wagmi.ts`:

```typescript
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base, baseSepolia } from 'wagmi/chains'

export const wagmiConfig = getDefaultConfig({
  appName: 'NarrativeForge',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [
    ...(process.env.NODE_ENV === 'production' ? [base] : [baseSepolia]),
  ],
  ssr: true,
})
```

### Update Root Layout

Update `apps/web/src/app/layout.tsx`:

```typescript
import '@rainbow-me/rainbowkit/styles.css'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from '@/lib/wagmi'

const queryClient = new QueryClient()

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
              {children}
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  )
}
```

### Add Connect Wallet Button

Update `apps/web/src/components/landing/Navbar.tsx`:

```typescript
import { ConnectButton } from '@rainbow-me/rainbowkit'

// Replace the placeholder button with:
<ConnectButton />
```

---

## 🧪 Step 5: Test on Testnet

### Get Test Tokens

1. **Get Base Sepolia ETH:**
   - Visit: https://faucet.base.org/
   - Connect wallet
   - Request testnet ETH

2. **Get Test FORGE:**
   ```
   "send 1000 FORGE to 0x[YOUR_WALLET] on base testnet"
   ```
   (Using Bankr if you have FORGE, or use the deployed MockForgeToken)

### Test Betting Flow

1. **Connect Wallet**
   - Visit your app: http://localhost:3000
   - Click "Connect Wallet"
   - Approve connection

2. **Navigate to Story**
   - Go to /story/[storyId]
   - View active betting pool

3. **Place Test Bet**
   - Select a choice
   - Enter amount (e.g., 10 FORGE)
   - Click "Place Bet"
   - Approve transaction in MetaMask
   - Wait for confirmation

4. **Verify On-Chain**
   - Check transaction on Base Sepolia explorer
   - Verify bet recorded in database
   - Check pool totals updated

---

## 📊 Step 6: Verify Setup

### Contract Verification Checklist

- [ ] $FORGE token deployed and verified on Basescan
- [ ] ChapterBettingPool deployed and verified
- [ ] Initial liquidity added (trading enabled)
- [ ] Contract addresses saved in .env
- [ ] Wallet connection working on frontend

### Frontend Integration Checklist

- [ ] ConnectButton renders correctly
- [ ] Wallet connection flow works
- [ ] $FORGE balance displays
- [ ] Betting transaction submits
- [ ] Transaction confirmation shows
- [ ] Balance updates after bet

### Database Integration Checklist

- [ ] Bet creation API works
- [ ] On-chain transaction hash stored
- [ ] Pool totals update correctly
- [ ] User balance tracked

---

## 🚀 Step 7: Mainnet Deployment

**⚠️ IMPORTANT: Do NOT deploy to mainnet until fully tested on testnet!**

### Pre-Launch Checklist

- [ ] All testnet tests passing
- [ ] Smart contracts audited (recommended)
- [ ] Frontend thoroughly tested
- [ ] Database migrations ready
- [ ] Monitoring set up (Sentry, etc.)
- [ ] Gas fees budgeted (~$50-100 for deployment)

### Mainnet Launch Steps

1. **Launch $FORGE on Base Mainnet**
   ```
   "launch a token named NarrativeForge with symbol FORGE on base mainnet with 1 billion supply"
   ```

2. **Deploy Betting Contracts**
   ```bash
   export FORGE_TOKEN_ADDRESS="0x..."  # Mainnet FORGE
   forge script script/Deploy.s.sol --rpc-url base --broadcast --verify
   ```

3. **Add Substantial Liquidity**
   ```
   "add liquidity for token 0x... on base with 10 ETH and 5000000 FORGE"
   ```

4. **Update Production Environment**
   ```bash
   # In Vercel dashboard, update:
   NEXT_PUBLIC_FORGE_TOKEN_ADDRESS=0x...
   NEXT_PUBLIC_BETTING_POOL_ADDRESS=0x...
   NEXT_PUBLIC_CHAIN_ID=8453
   ```

5. **Deploy Frontend**
   ```bash
   vercel --prod
   ```

6. **Monitor First Transactions**
   - Watch Basescan for activity
   - Monitor error logs (Sentry)
   - Check database for consistency

---

## 🔍 Monitoring & Maintenance

### On-Chain Monitoring

**Basescan:**
- Betting pool transactions
- $FORGE transfers
- Gas usage
- Contract interactions

**Set up alerts:**
```bash
# Use Basescan API for transaction monitoring
curl "https://api.basescan.org/api?module=account&action=txlist&address=0x[POOL_ADDRESS]&startblock=0&endblock=99999999&sort=desc&apikey=$BASESCAN_API_KEY"
```

### Off-Chain Monitoring

**Database consistency:**
```sql
-- Check bet totals match blockchain
SELECT 
  pool_id,
  SUM(amount) as db_total,
  -- Compare with on-chain totalPool
FROM bets
GROUP BY pool_id
```

**Error tracking:**
- Failed transactions
- Incorrect pool totals
- Missing bet records

---

## 🐛 Troubleshooting

### Token Launch Fails

**Issue:** Bankr returns error

**Solutions:**
- Check BANKR_API_KEY is valid
- Verify sufficient balance for gas
- Try testnet first
- Check Bankr API status

### Contract Deployment Fails

**Issue:** Forge script fails

**Solutions:**
```bash
# Check balance
cast balance $DEPLOYER_ADDRESS --rpc-url base_sepolia

# Test locally first
anvil  # In one terminal
forge script script/DeployTestnet.s.sol --rpc-url local --broadcast

# Check gas price
cast gas-price --rpc-url base_sepolia
```

### Wallet Connection Doesn't Work

**Issue:** ConnectButton doesn't show

**Solutions:**
- Verify WalletConnect project ID
- Check wagmi config
- Ensure RainbowKit CSS imported
- Check browser console for errors

### Transaction Fails

**Issue:** Bet transaction reverts

**Common causes:**
- Insufficient FORGE balance
- Insufficient gas
- Pool already closed
- Amount below minimum bet

**Debug:**
```typescript
// Add detailed logging
try {
  const tx = await contract.placeBet(...)
  console.log('Transaction hash:', tx.hash)
  const receipt = await tx.wait()
  console.log('Receipt:', receipt)
} catch (error) {
  console.error('Transaction failed:', error)
  // Check error.reason for revert message
}
```

---

## 💰 Cost Estimates

### Testnet (Free)
- Token deployment: Free (testnet ETH from faucet)
- Contract deployment: Free
- Testing: Free
- Total: $0

### Mainnet Deployment
- Token launch (via Bankr): Included in Bankr fees
- ChapterBettingPool deployment: ~$20-50 (gas fees)
- Initial liquidity: Your choice (e.g., 10 ETH + 5M FORGE)
- Total: ~$20-50 + liquidity

### Ongoing Costs
- Pool resolutions: ~$1-2 per resolution
- Payout distributions: Included in resolution
- Monitoring: Free (Basescan)

---

## 📚 Additional Resources

### Documentation
- [Base Docs](https://docs.base.org/)
- [Wagmi Docs](https://wagmi.sh/)
- [RainbowKit Docs](https://www.rainbowkit.com/)
- [Foundry Book](https://book.getfoundry.sh/)

### Tools
- [Base Sepolia Faucet](https://faucet.base.org/)
- [Base Sepolia Explorer](https://sepolia.basescan.org/)
- [Base Mainnet Explorer](https://basescan.org/)
- [Bankr Dashboard](https://bankr.bot/)

### Support
- Base Discord: https://discord.gg/base
- Bankr Discord: https://discord.gg/bankr

---

## ✅ Success Criteria

**Testnet Launch Complete When:**
- [x] $FORGE token launched on Base Sepolia
- [x] Betting pool contract deployed
- [x] Liquidity added (trading enabled)
- [x] Wallet connection works
- [x] First test bet placed successfully
- [x] Transaction confirmed on-chain
- [x] Bet recorded in database

**Mainnet Launch Complete When:**
- [ ] $FORGE token live on Base
- [ ] Betting pool contract deployed
- [ ] Substantial liquidity added
- [ ] Frontend deployed to production
- [ ] First real bet placed
- [ ] All monitoring in place
- [ ] Revenue flowing! 💰

---

**Ready to launch? Start with:**

```bash
# 1. Get Bankr API key from https://bankr.bot/api

# 2. Launch $FORGE (in OpenClaw chat):
"launch a token named NarrativeForge with symbol FORGE on base testnet with 1 billion supply"

# 3. Deploy contracts
cd packages/contracts
forge script script/DeployTestnet.s.sol --rpc-url base_sepolia --broadcast

# 4. Test!
```

Good luck! 🚀
