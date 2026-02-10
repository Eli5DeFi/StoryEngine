# Bankr Skill Installed ✅

**Date:** February 10, 2026  
**Status:** ✓ Ready - Available across all OpenClaw sessions

---

## 🎉 What Was Installed

**Bankr Skill** - AI-powered crypto trading agent via natural language

**Location:** `~/.openclaw/skills/bankr/`  
**Source:** https://github.com/BankrBot/openclaw-skills

**Capabilities:**
- 🪙 Trading (buy/sell/swap tokens)
- 💼 Portfolio management (check balances)
- 📈 Market research (token prices, analytics)
- 🖼️ NFT operations
- 🎲 Prediction markets (Polymarket)
- ⚡ Leverage trading (Avantis)
- 🔄 DeFi operations
- 🤖 Automated trading (DCA, limit orders, stop-loss)
- 🚀 Token deployment
- 📝 Arbitrary transaction submission

**Supported Chains:**
- Base (primary for NarrativeForge)
- Ethereum
- Polygon
- Solana
- Unichain

---

## 🚀 How to Use

### In Any OpenClaw Session

You can now use natural language to interact with Bankr:

```
"what is the price of ETH?"
"what are my balances?"
"buy $5 of BNKR on base"
"swap 0.1 ETH for USDC on base"
"deploy a token named FORGE with symbol FORGE on base"
"set up DCA to buy $10 of ETH daily for 30 days"
"what is my base wallet address?"
```

### Launch $FORGE Token

```
"launch a token named NarrativeForge with symbol FORGE on base with 1 billion initial supply"
```

### Check Token Stats

```
"what is the price of token 0x... on base?"
"show trading volume for token 0x... on base"
```

### Buy/Sell $FORGE

```
"buy 100 FORGE with ETH on base"
"sell 50 FORGE for ETH on base"
```

### Automated Trading

```
"set up DCA to buy $10 of FORGE daily on base"
"set limit order to buy FORGE at $0.001 on base"
"set stop loss for FORGE at $0.0008 on base"
```

### Portfolio Management

```
"what are my balances on base?"
"show my portfolio value"
"transfer 100 FORGE to 0x... on base"
```

---

## 🔗 Integration with NarrativeForge

### Option 1: Direct Natural Language (Recommended for Quick Tasks)

Just ask me in chat:
```
"Launch the $FORGE token on Base testnet"
"Check my Base wallet balance"
"Buy 0.1 ETH worth of FORGE"
```

I'll use the Bankr skill automatically.

### Option 2: Programmatic SDK (Recommended for App Integration)

Use the `@narrative-forge/bankr-integration` package in your code:

```typescript
import { BankrClient, TokenManager } from '@narrative-forge/bankr-integration'

const client = new BankrClient({
  apiKey: process.env.BANKR_API_KEY,
  chain: 'base',
})

const tokenManager = new TokenManager(client)
const tokenAddress = await tokenManager.launchForgeToken()
```

**Benefits of SDK:**
- Type safety (TypeScript)
- Error handling
- Structured responses
- Better for production apps

**Benefits of Natural Language:**
- Faster for quick tasks
- No code required
- Interactive debugging
- Better for exploration

---

## 🎯 Next Steps with Bankr Skill

### Today (Right Now!)

Test the skill:
```
"what is the price of ETH on base?"
"what is my base wallet address?"
```

### This Week

Launch $FORGE:
```
"launch a token named NarrativeForge with symbol FORGE on base testnet with 1 billion supply"
```

Get the token address, then:
```
"add liquidity for token 0x... on base with 1 ETH and 100000 FORGE"
```

### Next Week

Set up automated trading:
```
"set up DCA to accumulate 0.01 ETH of FORGE daily on base for 365 days"
```

Monitor trading fees:
```
"show trading fees earned for token 0x... on base"
```

---

## 📚 Documentation

### Bankr Resources
- [Bankr Documentation](https://docs.bankr.bot/)
- [OpenClaw Integration](https://docs.bankr.bot/openclaw/installation)
- [Available Skills](https://docs.bankr.bot/openclaw/available-skills)
- [Agent API](https://docs.bankr.bot/agent-api/overview)

### NarrativeForge Integration
- [Bankr Integration Summary](./BANKR_INTEGRATION_SUMMARY.md)
- [SDK Package README](./packages/bankr-integration/README.md)
- [Quick Start Guide](./QUICK_START.md)

---

## 🔐 Setup Required

### Get Bankr API Key

1. Visit [bankr.bot/api](https://bankr.bot/api)
2. Sign up / log in
3. Generate an API key
4. Set environment variable:

```bash
export BANKR_API_KEY=your_api_key_here
```

Or add to OpenClaw config:
```bash
openclaw config set bankr.apiKey your_api_key_here
```

### Test Connection

```
"test bankr connection"
# or
"what is the price of ETH?"
```

If it works, you'll see the current ETH price. If not, check your API key.

---

## ⚡ Example Workflows

### Workflow 1: Launch $FORGE Token (5 minutes)

```bash
# 1. Check wallet
"what is my base wallet address?"

# 2. Check balance (need gas for deployment)
"what is my ETH balance on base?"

# 3. Launch token
"launch a token named NarrativeForge with symbol FORGE on base testnet with 1 billion supply"
# Returns: Token address 0x...

# 4. Verify deployment
"what is the price of token 0x... on base?"

# 5. Add liquidity
"add liquidity for token 0x... on base with 1 ETH and 100000 FORGE"
```

### Workflow 2: Set Up Automated Trading (2 minutes)

```bash
# 1. Get token address (from Workflow 1)
TOKEN_ADDRESS=0x...

# 2. Set up DCA (dollar-cost averaging)
"set up DCA to buy 0.01 ETH of token $TOKEN_ADDRESS daily on base for 365 days"

# 3. Set limit order
"set limit order to buy token $TOKEN_ADDRESS at $0.001 on base with 10000 tokens"

# 4. Set stop-loss
"set stop loss for token $TOKEN_ADDRESS at $0.0008 on base with 5000 tokens"
```

### Workflow 3: Monitor Performance (ongoing)

```bash
# Check trading fees earned
"show trading fees earned for token 0x... on base"

# Check token price
"what is the price of token 0x... on base?"

# Check your balance
"what is my FORGE balance on base?"

# Check liquidity
"show liquidity and volume for token 0x... on base"
```

---

## 🆚 Bankr Skill vs SDK Package

### Use Bankr Skill When:
- ✅ Quick testing / exploration
- ✅ Manual operations (launch token, add liquidity)
- ✅ Debugging issues
- ✅ Learning Bankr capabilities
- ✅ One-off transactions

**Example:**
```
"launch $FORGE token on base testnet"
```

### Use SDK Package When:
- ✅ Production application code
- ✅ Automated workflows
- ✅ Type safety required
- ✅ Error handling needed
- ✅ Integration with Next.js/React

**Example:**
```typescript
const tokenAddress = await tokenManager.launchForgeToken({
  name: 'NarrativeForge',
  symbol: 'FORGE',
  chain: 'base',
})
```

### Best Practice: Use Both!

**Development:** Use natural language skill for quick testing
```
"test: buy 0.01 ETH of FORGE on base testnet"
```

**Production:** Use SDK in your app
```typescript
await tokenManager.buyForge({
  tokenAddress: config.FORGE_TOKEN_ADDRESS,
  ethAmount: ethAmount,
  chain: 'base',
})
```

---

## 🎉 You're All Set!

**What's ready:**
- ✅ Bankr skill installed globally
- ✅ Available in all OpenClaw sessions
- ✅ SDK package for programmatic use
- ✅ Landing page with Bankr integration
- ✅ Complete documentation

**Next steps:**
1. Get Bankr API key from [bankr.bot/api](https://bankr.bot/api)
2. Test connection: `"what is the price of ETH?"`
3. Launch $FORGE: `"launch token on base testnet"`
4. Deploy landing page to Vercel
5. Start building! 🚀

---

**Questions?**
- Bankr Support: support@bankr.bot
- Bankr Discord: https://discord.gg/bankr
- Bankr Docs: https://docs.bankr.bot/

**Happy building! 🎉**
