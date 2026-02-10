# 🎭 NarrativeForge

**AI-Generated Visual Novel × Prediction Market Platform**

> Where stories write themselves, and readers bet on the outcome.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Base](https://img.shields.io/badge/Chain-Base%20L2-blue)](https://base.org)

---

## 🌟 What is NarrativeForge?

**NarrativeForge** is a decentralized platform where:

- 🤖 **AI generates** epic fantasy visual novels with branching narratives
- 🎲 **Readers predict** which story path the AI will choose
- 💰 **Winners earn** from a parimutuel betting pool
- 📚 **Compendium tracks** all lore, characters, monsters, and relationships
- 🧠 **Narrative coherence** maintained through persistent world state

### The Core Loop

```
Chapter Published → Betting Opens (3-5 branches) → Bets Placed 
→ Betting Closes → AI Selects Branch → Pool Settles 
→ 85% to Winners, 12.5% Treasury, 2.5% Ops → Next Chapter
```

---

## 🏗️ Architecture

### Tech Stack

**Frontend**
- Next.js 14 (App Router)
- Vanilla CSS + CSS Modules  
- Zustand (state management)
- wagmi v2 + RainbowKit (wallet)
- D3.js (relationship graphs)
- Socket.io (real-time)

**Backend**
- Node.js 20
- tRPC (type-safe APIs)
- PostgreSQL 16
- Redis 7
- BullMQ (job queue)
- Pinecone (vector DB)

**AI**
- OpenAI GPT-4o (primary)
- Anthropic Claude 3.5 (fallback)
- DALL-E 3 (images)
- OpenAI embeddings

**Blockchain**
- Base L2 (Ethereum)
- Solidity 0.8.24+
- Foundry (Forge + Cast)
- USDC (betting token)

---

## 📁 Project Structure

```
narrativeforge/
├── apps/
│   └── web/              # Next.js 14 app
├── packages/
│   └── contracts/        # Foundry smart contracts
├── services/
│   ├── story-engine/     # AI generation
│   ├── betting-service/  # Pool management
│   ├── compendium-service/ # Lore extraction
│   └── blockchain-service/ # Contract interaction
├── docs/
│   └── IMPLEMENTATION.md # Full specification (this file source)
└── docker-compose.yml
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- Foundry (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)
- PostgreSQL 16
- Redis 7

### Installation

```bash
# Clone repo
git clone https://github.com/eli5-claw/StoryEngine.git
cd StoryEngine

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your API keys

# Start local services (Postgres + Redis)
docker-compose up -d

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

### Deploy Smart Contracts (Local)

```bash
cd packages/contracts

# Start local Anvil node
anvil

# Deploy contracts (new terminal)
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

---

## 🎮 Core Features

### 1. Visual Novel Reader
- **Typewriter text** with character-by-character reveal
- **Scene transitions** (fade/slide/dissolve)
- **Character sprites** with expression states
- **Ambient audio** per scene mood
- **Parallax backgrounds**

### 2. Prediction Market Betting
- **Parimutuel pools** (pool-based odds)
- **3-5 branches** per chapter
- **Live odds** updating in real-time
- **Smart contract settlement** (trustless)
- **85/12.5/2.5 split** (winners/treasury/ops)

### 3. AI Story Engine
- **GPT-4o** narrative generation
- **Coherence checking** via embeddings
- **World state management** (persistent JSON)
- **Branch selection** (weighted algorithm, NOT bet-influenced)
- **Entropy factor** (10% randomness prevents perfect prediction)

### 4. Living Compendium
- **Auto-extracted** from chapters
- **Character profiles** with AI portraits
- **Relationship graphs** (D3.js force-directed)
- **Monster bestiary**
- **Timeline** of events
- **Lore encyclopedia**

### 5. AI Agent Participation
- **Agent registry** (on-chain)
- **API access** for automated betting
- **Separate leaderboard**
- **Strategy privacy** (only bets are public)

---

## 💡 Smart Contract: ChapterBettingPool

```solidity
contract ChapterBettingPool {
    // 85% to winners, 12.5% treasury, 2.5% ops
    uint256 public constant WINNER_SHARE_BPS = 8500;
    
    function placeBet(uint8 branch, uint256 amount, bool isAgent) external;
    function lockPool() external onlyOwner;
    function settlePool(uint8 winningBranch) external onlyOwner;
    function claimReward() external;
    
    // Pro-rata payout: userBet / totalWinningBets * winnerPool
}
```

**Key Security Features:**
- ✅ ReentrancyGuard on all state changes
- ✅ Overflow protection (Solidity 0.8+)
- ✅ Commit-reveal for high-value pools
- ✅ Emergency `cancelPool()` function
- ✅ Multi-sig settlement oracle

---

## 📊 Database Schema (Highlights)

```sql
-- Stories
CREATE TABLE stories (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    world_state JSONB, -- persistent world/character state
    status VARCHAR(20) -- active, paused, completed
);

-- Chapters
CREATE TABLE chapters (
    id SERIAL PRIMARY KEY,
    story_id INTEGER REFERENCES stories(id),
    chapter_number INTEGER,
    content TEXT,
    content_ipfs VARCHAR(100),
    selected_branch_index SMALLINT
);

-- Character Relationships
CREATE TABLE character_relationships (
    character_a_id INTEGER,
    character_b_id INTEGER,
    relationship_type VARCHAR(50), -- ally, rival, family, romantic, mentor
    intensity DECIMAL(3,2), -- 0.0 to 1.0 (line thickness in graph)
    established_chapter INTEGER
);
```

---

## 🛡️ Security & Anti-Manipulation

| Risk | Mitigation |
|------|------------|
| **Bet-influenced story** | Selection algorithm has ZERO access to bet data |
| **Perfect prediction** | 10% entropy factor in branch selection |
| **Whale dominance** | Min/max bet caps |
| **Front-running** | Commit-reveal scheme + 5-min buffer |
| **Smart contract exploits** | Full audit pre-launch (Certik/Trail of Bits) |

---

## 🗺️ Roadmap

### ✅ Phase 1: Foundation (Weeks 1-3)
- [x] Project scaffolding
- [ ] Database schema + migrations
- [ ] Core smart contract + tests
- [ ] Basic Story Engine
- [ ] Wallet connection

### 🔄 Phase 2: Core Experience (Weeks 4-6)
- [ ] Visual novel reader component
- [ ] Chapter generation pipeline
- [ ] Betting UI + live odds
- [ ] Deploy to Base Sepolia
- [ ] WebSocket integration

### 📅 Phase 3: Compendium (Weeks 7-8)
- [ ] Compendium extraction
- [ ] Character relationship diagram
- [ ] Monster bestiary
- [ ] Lore + timeline

### 🤖 Phase 4: AI Agents (Weeks 9-10)
- [ ] Agent registry
- [ ] Agent betting SDK
- [ ] Leaderboards
- [ ] Scene illustrations
- [ ] Mobile responsive

### 🚀 Phase 5: Launch (Weeks 11-12)
- [ ] Smart contract audit
- [ ] Penetration testing
- [ ] Load testing (1000 concurrent)
- [ ] Beta testing
- [ ] Mainnet deployment

---

## 🧪 Testing

```bash
# Smart contract tests (Foundry)
cd packages/contracts
forge test -vvv

# Backend tests
pnpm test

# E2E tests (Playwright)
pnpm test:e2e

# Load testing
k6 run tests/load/betting.js
```

**Coverage Targets:**
- Smart contracts: **100%** line coverage
- Backend: **90%+**
- E2E: Critical paths (read, bet, claim)

---

## 📖 Documentation

- **Full Implementation Plan:** [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md) (84KB spec)
- **Smart Contract Spec:** [packages/contracts/README.md](packages/contracts/README.md)
- **Story Engine Design:** [services/story-engine/README.md](services/story-engine/README.md)
- **API Reference:** [docs/API.md](docs/API.md)
- **Compendium System:** [docs/COMPENDIUM.md](docs/COMPENDIUM.md)

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Key areas needing help:**
- Visual novel UI/UX design
- LLM prompt engineering
- Smart contract security review
- Scene illustration generation
- Audio/music composition

---

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **Fantasy Story Writer Skill** for narrative frameworks
- **Foundry** for blazing-fast contract development
- **Base** for cheap, fast L2 transactions
- **OpenAI** for GPT-4o narrative generation

---

## 📬 Contact

- **Twitter:** [@NarrativeForge](https://twitter.com/NarrativeForge)
- **Discord:** [discord.gg/narrativeforge](https://discord.gg/narrativeforge)
- **Email:** hello@narrativeforge.xyz

---

**Built with ❤️ by [eli5defi](https://twitter.com/Eli5defi)**

> *"Where every choice writes history, and every prediction shapes destiny."*
