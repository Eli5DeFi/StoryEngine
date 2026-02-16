# 🎭 Voidborne: The Silent Throne

**AI-Generated Narrative × Blockchain Prediction Markets**

Bet on story outcomes. Win if you predict correctly. Shape the narrative through collective intelligence.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.23-lightgrey)](https://soliditylang.org/)

---

## 🚀 What is Voidborne?

**Voidborne** is a space political saga where readers bet USDC on AI-generated story outcomes.

- **📖 Read** immersive space opera chapters
- **🎲 Bet** on character actions and plot branches
- **🤖 AI Decides** based on narrative logic + betting patterns
- **💰 Win** your share of the pool if you predicted correctly

### Example

```
Chapter ends: "Captain Reyes faces a choice..."

You bet: 100 USDC on "Negotiate with rebels"
Others bet: 400 USDC total on other outcomes
Total pool: 500 USDC

AI chooses: "Negotiate with rebels" ✅
You win: ~237.5 USDC (95% of pool after 5% fee)
Profit: +137.5 USDC 🎉
```

---

## ⚡ Quick Start

```bash
# 1. Clone & install
git clone https://github.com/Eli5DeFi/StoryEngine.git
cd StoryEngine
pnpm install

# 2. Set up environment
cp apps/web/.env.example apps/web/.env
# Add your SUPABASE_URL and SUPABASE_ANON_KEY

# 3. Start local blockchain (Anvil)
cd poc/combinatorial-betting
anvil --host 127.0.0.1 --port 8545

# 4. Deploy contracts (new terminal)
./scripts/deploy-local.sh

# 5. Start dev server (new terminal)
cd apps/web
pnpm dev

# 6. Open http://localhost:3000
```

**Full setup guide:** [DEPLOYMENT_COMPLETE_FEB_16.md](./DEPLOYMENT_COMPLETE_FEB_16.md)

---

## 🎯 How It Works

### 1. **Betting Phase**
- Read the current chapter
- Choose your predicted outcomes
- Place USDC bets (Parimutuel system)
- **Deadline:** 1 hour before story generation (anti-botting)

### 2. **Story Generation**
- AI analyzes narrative coherence
- Considers betting patterns
- Generates next chapter
- Publishes on-chain

### 3. **Settlement**
- Winning bets share 95% of pool
- 5% platform fee
- Instant payouts

### 4. **Character Chat** ⚡ NEW
- Chat with AI-powered character agents 24/7
- Build relationships from Stranger to Soulbound
- Unlock secrets as trust grows
- Influence the narrative through conversations
- **Try it:** `/characters`

---

## 🏗️ Architecture

```
Frontend (Next.js)
    ↓
Supabase (DB) + Smart Contracts (Solidity)
    ↓
Base Blockchain (USDC betting)
```

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- RainbowKit (wallet connection)
- Wagmi/Viem (blockchain)

**Smart Contracts:**
- Solidity 0.8.23
- Foundry (testing)
- OpenZeppelin (security)
- 31 comprehensive tests

**Backend:**
- Supabase (PostgreSQL)
- Prisma ORM
- Next.js API routes

**Blockchain:**
- Base (production)
- Anvil (local testing)

---

## 📦 Project Structure

```
StoryEngine/
├── apps/
│   └── web/                    # Next.js frontend
│       ├── src/
│       │   ├── app/            # Pages & API routes
│       │   ├── components/     # React components
│       │   └── hooks/          # Custom hooks
│       └── package.json
├── poc/
│   └── combinatorial-betting/  # Smart contracts
│       ├── CombinatorialPool_v2_FIXED.sol
│       ├── test/               # Foundry tests
│       └── contracts/          # MockUSDC
├── packages/
│   ├── database/               # Prisma schema
│   └── contracts/              # Contract ABIs
└── scripts/                    # Deployment scripts
```

---

## 🎮 Features

### ✅ Live

- **Betting System**
  - Parimutuel odds calculation
  - 1-hour anti-botting deadline
  - Combinatorial bets (bet on multiple outcomes)
  - Smart contract enforcement

- **Lore System**
  - 5 political houses with backstories
  - Character profiles
  - Protocol descriptions

- **UI/UX**
  - Glassmorphism design ("Ruins of the Future" theme)
  - Responsive (mobile + desktop)
  - Real-time countdown timers
  - Wallet connection (RainbowKit)

### 🚧 In Progress

- Full betting cycle testing
- AI story generation integration
- Testnet deployment (Base Sepolia)

### 📋 Roadmap

**Q1 2026:**
- ✅ Smart contracts + tests
- ✅ Frontend UI
- ✅ Betting interface
- ⏳ Testnet launch
- ⏳ AI integration

**Q2 2026:**
- Character Soul-Bound Tokens (NFTs)
- Leaderboards
- Analytics dashboard
- Mainnet launch

---

## 🛠️ Development

### Prerequisites

- Node.js 20+
- pnpm 9+
- Foundry (for contracts)
- Anvil (local blockchain)

### Environment Variables

```bash
# apps/web/.env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

### Commands

```bash
# Install dependencies
pnpm install

# Start local blockchain
anvil --host 127.0.0.1 --port 8545

# Deploy contracts locally
cd poc/combinatorial-betting
./scripts/deploy-local.sh

# Run contract tests
forge test -vv

# Start dev server
cd apps/web
pnpm dev

# Build for production
pnpm build
```

---

## 🧪 Testing

### Smart Contract Tests

```bash
cd poc/combinatorial-betting
forge test -vvv
```

**Coverage:**
- 31 tests covering all security fixes
- 100% coverage on critical paths
- Tests: creation, minting, revenue, claims, security, admin, views

### Manual Testing Guide

See [DEPLOYMENT_TESTING_GUIDE.md](./DEPLOYMENT_TESTING_GUIDE.md) for full betting cycle tests.

---

## 🔐 Security

**Audit Status:** Pre-audit (professional audit recommended before mainnet)

**Security Features:**
- 2-step ownership transfer (Ownable2Step)
- Emergency pause mechanism (Pausable)
- Reentrancy guards
- Input validation
- Deadline enforcement (7-day max extension)
- Batch processing limits (50 max)
- Slippage protection

**Audit Report:** [SECURITY_FIXES_FEB_16.md](./SECURITY_FIXES_FEB_16.md)

---

## 📚 Documentation

### Guides
- [DEPLOYMENT_COMPLETE_FEB_16.md](./DEPLOYMENT_COMPLETE_FEB_16.md) - Complete setup guide
- [DEPLOYMENT_TESTING_GUIDE.md](./DEPLOYMENT_TESTING_GUIDE.md) - Testing instructions
- [SECURITY_FIXES_FEB_16.md](./SECURITY_FIXES_FEB_16.md) - Security audit results
- [ANTI_BOTTING_DEADLINE.md](./ANTI_BOTTING_DEADLINE.md) - Anti-botting system

### Features
- [PREDICTION_MARKET_EXPLAINED.md](./PREDICTION_MARKET_EXPLAINED.md) - How betting works
- [CHARACTER_SBT_IMPLEMENTATION.md](./CHARACTER_SBT_IMPLEMENTATION.md) - NFT system (PR #26)

### Technical
- [BUILD_FIXES_FEB_16.md](./BUILD_FIXES_FEB_16.md) - Build system fixes
- [COMPLETE_BUILD_STATUS_FEB_16.md](./COMPLETE_BUILD_STATUS_FEB_16.md) - Build status

---

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Please include:**
- Description of changes
- Test coverage
- Documentation updates
- Screenshots (if UI changes)

---

## 🎨 Design System

**Theme:** "Ruins of the Future" - Ancient elegance meets high-tech decay

**Colors:**
- Gold: `#d4a853` (primary accent)
- Void Purple: `#1E1B3A` (backgrounds)
- Drift Teal: `#2DD4BF` (secondary)
- Deep Space: `#0F172A` (base)

**Typography:**
- Display: Cinzel (serif, elegant)
- UI: Space Grotesk (mono, modern)

**Components:**
- Glassmorphism cards
- Ambient glow effects
- Smooth transitions (500ms)
- Responsive layouts

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file.

---

## 📞 Contact

- **GitHub:** [@Eli5DeFi](https://github.com/Eli5DeFi)
- **Twitter:** [@Eli5DeFi](https://twitter.com/Eli5DeFi)
- **Issues:** [GitHub Issues](https://github.com/Eli5DeFi/StoryEngine/issues)

---

## 🙏 Acknowledgments

- **OpenZeppelin** - Smart contract security
- **Foundry** - Smart contract development
- **Base** - L2 blockchain network
- **RainbowKit** - Beautiful wallet UX
- **Supabase** - Backend infrastructure
- **Vercel** - Deployment platform

---

## 🗺️ Current Status

**Last Updated:** February 16, 2026

- ✅ Smart contracts deployed (local Anvil)
- ✅ Frontend UI complete
- ✅ Security audit complete (14/14 issues fixed)
- ⏳ Testnet deployment (Base Sepolia) - Ready
- ⏳ AI integration - In progress
- ⏳ Professional audit - Recommended before mainnet

**Latest PRs:**
- #26: Character Soul-Bound Tokens ($3.4M revenue potential)
- #27: Performance optimization (-57% bundle size)

---

**Ready to shape the future of interactive fiction?** 🚀

```bash
git clone https://github.com/Eli5DeFi/StoryEngine.git
cd StoryEngine && pnpm install && pnpm dev
```
