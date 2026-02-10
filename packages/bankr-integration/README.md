# @narrative-forge/bankr-integration

Bankr SDK integration for NarrativeForge - enabling self-sustaining AI story generation through token trading fees.

## Features

- 🪙 **$FORGE Token Launch** - Platform token on Base with automated fee collection
- 💼 **Wallet Infrastructure** - Cross-chain wallet management (Base, Ethereum, Polygon, Unichain, Solana)
- 📈 **Trading Management** - DCA, limit orders, stop-losses for automated market making
- 💰 **Fee-Funded Compute** - Trading fees automatically fund AI story generation costs
- 🔄 **Liquidity Provision** - Automated liquidity management for $FORGE pairs

## Installation

```bash
npm install @bankr/sdk viem zod
# or
bun add @bankr/sdk viem zod
```

## Setup

### Option 1: API Key (Recommended for Production)

```typescript
import { BankrClient } from '@narrative-forge/bankr-integration';

const client = new BankrClient({
  apiKey: process.env.BANKR_API_KEY,
  chain: 'base',
});
```

### Option 2: Private Key (Self-Custody)

```typescript
const client = new BankrClient({
  privateKey: process.env.BANKR_PRIVATE_KEY,
  chain: 'base',
});
```

## Usage

### Launch $FORGE Token

```typescript
import { TokenManager } from '@narrative-forge/bankr-integration';

const tokenManager = new TokenManager(client);

// Launch on Base
const tokenAddress = await tokenManager.launchForgeToken({
  name: 'NarrativeForge',
  symbol: 'FORGE',
  chain: 'base',
  initialSupply: '1000000000', // 1B tokens
  metadata: {
    description: 'Platform token for NarrativeForge',
    website: 'https://narrativeforge.ai',
  },
});

console.log('$FORGE launched at:', tokenAddress);
```

### Get Token Info

```typescript
const tokenInfo = await tokenManager.getForgeTokenInfo(tokenAddress);
console.log({
  price: tokenInfo.priceUSD,
  marketCap: tokenInfo.marketCap,
  volume24h: tokenInfo.tradingVolume24h,
  holders: tokenInfo.holders,
});
```

### Trading Fees Analytics

```typescript
const fees = await tokenManager.getTradingFees(tokenAddress);
console.log({
  totalEarned: fees.totalFeesUSD,
  last24h: fees.fees24h,
  trades: fees.trades24h,
});
```

### Buy/Sell $FORGE

```typescript
// User buys $FORGE with ETH
await tokenManager.buyForge({
  tokenAddress,
  ethAmount: '0.1', // 0.1 ETH
  chain: 'base',
});

// User sells $FORGE for ETH
await tokenManager.sellForge({
  tokenAddress,
  tokenAmount: '1000', // 1000 FORGE
  chain: 'base',
});
```

### Automated Trading

```typescript
import { TradingManager } from '@narrative-forge/bankr-integration';

const tradingManager = new TradingManager(client);

// Set up DCA to accumulate $FORGE
await tradingManager.setupDCA({
  tokenAddress,
  amountPerPeriod: '0.01', // 0.01 ETH per period
  intervalHours: 24,       // Daily
  totalPeriods: 30,        // For 30 days
  chain: 'base',
});

// Set limit order
await tradingManager.setLimitOrder({
  tokenAddress,
  side: 'buy',
  price: '0.001',          // Buy at $0.001
  amount: '10000',         // 10,000 FORGE
  chain: 'base',
});

// Set stop-loss
await tradingManager.setStopLoss({
  tokenAddress,
  triggerPrice: '0.0008',  // Sell if drops to $0.0008
  amount: '5000',          // 5,000 FORGE
  chain: 'base',
});
```

### Wallet Management

```typescript
import { WalletManager } from '@narrative-forge/bankr-integration';

const walletManager = new WalletManager(client);

// Get wallet address
const address = await walletManager.getAddress('base');

// Check balances
const ethBalance = await walletManager.getETHBalance('base');
const forgeBalance = await walletManager.getTokenBalance(tokenAddress, 'base');

// Transfer tokens
await walletManager.transfer({
  to: '0x...',
  amount: '100',
  tokenAddress,
  chain: 'base',
});

// Check sufficient balance before transaction
const hasFunds = await walletManager.hasSufficientBalance({
  amount: '0.1',
  chain: 'base',
});
```

## Environment Variables

```env
# Choose one authentication method:
BANKR_API_KEY=your_api_key_here        # For production (recommended)
BANKR_PRIVATE_KEY=0x...                # For self-custody mode

# Optional:
BANKR_BASE_URL=https://api.bankr.bot   # Default endpoint
```

## Integration with NarrativeForge

### Revenue Model

```
┌─────────────────────────────────────────────────────┐
│                  Revenue Sources                    │
├─────────────────────────────────────────────────────┤
│ 1. Betting Pool Dev Fee      │ 2.5% of each pool   │
│ 2. $FORGE Trading Fees        │ ~0.3% per trade     │
│ 3. Liquidity Provider Rewards │ LP incentives       │
└─────────────────────────────────────────────────────┘
                        ↓
              Trading Fees Flow Back
                        ↓
┌─────────────────────────────────────────────────────┐
│              Fund AI Compute Costs                  │
├─────────────────────────────────────────────────────┤
│ • Story generation (GPT-4, Claude)                  │
│ • Image generation (DALL-E, Midjourney)             │
│ • Server infrastructure                             │
└─────────────────────────────────────────────────────┘
```

### Self-Sustaining Loop

1. Users buy $FORGE → Trading fees collected
2. Users bet $FORGE on story choices → Betting fees collected
3. Trading fees fund AI story generation
4. Better stories → More users → More trading volume
5. Loop repeats → Platform becomes self-sustaining

## API Reference

### BankrClient

- `prompt(text: string)` - Execute natural language commands
- `getWalletAddress(chain?: Chain)` - Get wallet address
- `getBalances()` - Get all balances
- `getPrice(token: string, chain?: Chain)` - Get token price

### TokenManager

- `launchForgeToken(params?)` - Launch $FORGE token
- `getForgeTokenInfo(address, chain?)` - Get token stats
- `getTradingFees(address, chain?)` - Get fee analytics
- `buyForge(params)` - Buy $FORGE with ETH
- `sellForge(params)` - Sell $FORGE for ETH
- `addLiquidity(params)` - Add liquidity to pool

### TradingManager

- `setupDCA(params)` - Set up dollar-cost averaging
- `setLimitOrder(params)` - Place limit order
- `setStopLoss(params)` - Set stop-loss order
- `getMarketData(address, chain?)` - Get market data
- `getLiquidityMetrics(address, chain?)` - Get liquidity stats

### WalletManager

- `getAddress(chain?)` - Get wallet address
- `getAllBalances()` - Get all token balances
- `getTokenBalance(address, chain?)` - Get specific token balance
- `getETHBalance(chain?)` - Get ETH balance
- `transfer(params)` - Transfer tokens
- `hasSufficientBalance(params)` - Check balance

## Supported Chains

| Chain    | Native Token | Status |
|----------|--------------|---------|
| Base     | ETH          | ✅ Primary |
| Ethereum | ETH          | ✅ Supported |
| Polygon  | POL          | ✅ Supported |
| Unichain | ETH          | ✅ Supported |
| Solana   | SOL          | ✅ Supported |

## Security Notes

- **Never expose private keys** - Use API key mode in production
- **Gas sponsorship** - Bankr covers gas fees for better UX
- **Rate limiting** - Implement client-side rate limiting
- **Error handling** - All methods throw on failure, wrap in try/catch

## Example: Complete Integration

```typescript
import { 
  BankrClient, 
  TokenManager, 
  TradingManager 
} from '@narrative-forge/bankr-integration';

async function initializeNarrativeForge() {
  // 1. Initialize client
  const client = new BankrClient({
    apiKey: process.env.BANKR_API_KEY,
    chain: 'base',
  });

  // 2. Launch $FORGE token
  const tokenManager = new TokenManager(client);
  const forgeAddress = await tokenManager.launchForgeToken();
  
  console.log('✅ $FORGE launched:', forgeAddress);

  // 3. Add initial liquidity (1 ETH + 100K FORGE)
  await tokenManager.addLiquidity({
    tokenAddress: forgeAddress,
    ethAmount: '1.0',
    tokenAmount: '100000',
  });

  console.log('✅ Liquidity added');

  // 4. Set up automated market making
  const tradingManager = new TradingManager(client);
  await tradingManager.setupDCA({
    tokenAddress: forgeAddress,
    amountPerPeriod: '0.01',
    intervalHours: 24,
    totalPeriods: 365, // 1 year
  });

  console.log('✅ DCA configured');

  // 5. Monitor trading fees
  setInterval(async () => {
    const fees = await tokenManager.getTradingFees(forgeAddress);
    console.log('💰 Fees earned (24h):', fees.fees24h);
  }, 3600000); // Every hour

  return forgeAddress;
}
```

## Next Steps

1. **Deploy**: Launch $FORGE on Base testnet first
2. **Test**: Execute trades, verify fee collection
3. **Integrate**: Connect to betting pool contracts
4. **Monitor**: Track trading volume and fees earned
5. **Scale**: Add more liquidity pairs and trading pairs

## Resources

- [Bankr Documentation](https://docs.bankr.bot/)
- [Agent API Reference](https://docs.bankr.bot/agent-api/overview)
- [TypeScript SDK](https://docs.bankr.bot/sdk/installation)
- [Token Launching Guide](https://docs.bankr.bot/token-launching/overview)

## Support

- Discord: [Bankr Community](https://discord.gg/bankr)
- Twitter: [@BankrBot](https://twitter.com/BankrBot)
- Email: support@bankr.bot
