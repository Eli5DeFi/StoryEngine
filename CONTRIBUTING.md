# Contributing to Voidborne

Thank you for your interest in contributing! This guide will help you get started.

---

## 🚀 Quick Start

1. **Fork the repository**
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/StoryEngine.git
   cd StoryEngine
   ```
3. **Install dependencies:**
   ```bash
   pnpm install
   ```
4. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
5. **Make your changes**
6. **Test thoroughly**
7. **Submit a Pull Request**

---

## 📋 Pull Request Guidelines

### PR Title Format

```
[Category]: Brief description

Examples:
✅ feat: Add character leveling system
✅ fix: Resolve betting deadline bug
✅ docs: Update deployment guide
✅ refactor: Optimize contract gas usage
✅ test: Add integration tests for betting flow
```

### Categories

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation only
- `refactor`: Code refactoring (no functional changes)
- `test`: Adding or updating tests
- `perf`: Performance improvements
- `chore`: Maintenance tasks
- `style`: Code style/formatting

### PR Description Template

```markdown
## Description
Brief explanation of what this PR does.

## Motivation
Why is this change needed? What problem does it solve?

## Changes
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests passing
- [ ] Manual testing completed
- [ ] Smart contracts tested (if applicable)

## Screenshots (if applicable)
[Add screenshots for UI changes]

## Documentation
- [ ] README updated (if needed)
- [ ] Code comments added
- [ ] API documentation updated (if applicable)

## Breaking Changes
List any breaking changes or migrations needed.

## Related Issues
Closes #issue_number
```

---

## 📊 Innovation Proposals

**Innovation proposals should be included in Pull Requests, not the main repository.**

### Format

1. **Create a feature branch:**
   ```bash
   git checkout -b innovation/feature-name
   ```

2. **Include proposal in PR description:**
   ```markdown
   ## Innovation Proposal
   
   ### Problem
   What problem does this solve?
   
   ### Solution
   How does this solve it?
   
   ### Impact
   - Revenue potential: $X
   - User engagement: +X%
   - Technical complexity: Easy/Medium/Hard
   
   ### Implementation
   - Phase 1: ...
   - Phase 2: ...
   
   ### POC (if applicable)
   [Link to proof-of-concept code]
   ```

3. **Discuss in PR comments** (not separate documents)

### Why?

- **Keeps repo clean:** Innovation context lives with the code
- **Easier tracking:** See which innovations were implemented
- **Better discussion:** GitHub PR comments > separate docs
- **Single source of truth:** Code + proposal in one place

---

## 🧪 Testing Requirements

### Smart Contracts

All smart contract changes **MUST** include tests:

```bash
cd poc/combinatorial-betting
forge test -vvv
```

**Required coverage:**
- ✅ Happy path tests
- ✅ Edge case tests
- ✅ Security tests (reentrancy, overflow, etc.)
- ✅ Gas optimization tests

### Frontend

```bash
cd apps/web
pnpm test        # Unit tests
pnpm test:e2e    # E2E tests (Playwright)
pnpm type-check  # TypeScript
pnpm lint        # ESLint
```

---

## 📝 Code Style

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow ESLint rules (`pnpm lint`)
- Use `const` over `let` when possible
- Prefer functional programming patterns
- Add JSDoc comments for public APIs

```typescript
/**
 * Calculate parimutuel odds for a given outcome
 * @param totalPool - Total USDC in pool
 * @param outcomeAmount - USDC bet on this outcome
 * @returns Decimal odds (e.g., 2.5 = 2.5x payout)
 */
export function calculateOdds(totalPool: bigint, outcomeAmount: bigint): number {
  // Implementation
}
```

### Solidity

- Solidity 0.8.23+ (pinned version)
- Follow OpenZeppelin patterns
- NatSpec comments required
- Gas optimization where possible
- Security first

```solidity
/// @notice Place a combinatorial bet on multiple outcomes
/// @param outcomeIds Array of outcome IDs to bet on
/// @param amount Total USDC amount to bet
/// @param betType Type of bet (PARLAY, ACCUMULATOR, SYSTEM)
/// @param minOdds Minimum acceptable combined odds (slippage protection)
/// @return betId The ID of the created bet
function placeCombiBet(
    uint256[] calldata outcomeIds,
    uint256 amount,
    BetType betType,
    uint256 minOdds
) external whenNotPaused nonReentrant returns (uint256 betId) {
    // Implementation
}
```

---

## 🗂️ File Structure

### Where to Add New Files

```
apps/web/src/
├── app/              # Next.js pages & API routes
├── components/       # React components
│   ├── betting/      # Betting-related components
│   ├── landing/      # Landing page sections
│   └── wallet/       # Wallet connection components
├── hooks/            # Custom React hooks
├── lib/              # Utilities & helpers
└── styles/           # Global styles

poc/combinatorial-betting/
├── *.sol             # Smart contracts (root level)
├── contracts/        # Dependencies (MockUSDC, etc.)
├── test/             # Foundry tests
└── script/           # Deployment scripts
```

### Naming Conventions

- **Components:** PascalCase (`BettingInterface.tsx`)
- **Hooks:** camelCase with `use` prefix (`usePlaceBet.ts`)
- **Utils:** camelCase (`calculateOdds.ts`)
- **Contracts:** PascalCase (`CombinatorialBettingPool.sol`)
- **Tests:** Match filename with `.t.sol` suffix (`CombinatorialPool.t.sol`)

---

## 🔐 Security

### Reporting Vulnerabilities

**DO NOT** open public issues for security vulnerabilities.

Instead, email: **security@voidborne.ai** (or create a private security advisory on GitHub)

### Security Checklist for Smart Contracts

- [ ] Reentrancy protection (use `nonReentrant`)
- [ ] Integer overflow/underflow checks (Solidity 0.8+)
- [ ] Access control (use `onlyOwner`, `Pausable`, etc.)
- [ ] Input validation (require statements)
- [ ] CEI pattern (Checks-Effects-Interactions)
- [ ] Gas optimization (avoid unbounded loops)
- [ ] Emergency pause mechanism
- [ ] 2-step ownership transfer

---

## 📦 Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Examples:**

```bash
feat(betting): add combinatorial bet support

- Implement parlay, accumulator, and system bets
- Add combined odds calculation
- Update UI to support multi-outcome selection

Closes #42
```

```bash
fix(contracts): prevent reentrancy in settlement

- Add nonReentrant modifier to settleBet function
- Follow CEI pattern for state changes
- Add test case for reentrancy attack

Fixes #128
```

---

## 🚢 Release Process

1. **Create release branch:**
   ```bash
   git checkout -b release/v1.2.0
   ```

2. **Update version numbers:**
   - `package.json` files
   - Contract version comments
   - Documentation

3. **Run full test suite:**
   ```bash
   pnpm test
   forge test -vvv
   ```

4. **Create release PR**

5. **After merge, tag release:**
   ```bash
   git tag -a v1.2.0 -m "Release v1.2.0"
   git push origin v1.2.0
   ```

---

## 🙋 Getting Help

- **Discord:** Coming soon!
- **GitHub Issues:** [Open an issue](https://github.com/Eli5DeFi/StoryEngine/issues)
- **Twitter:** [@Eli5DeFi](https://twitter.com/Eli5DeFi)

---

## 📜 Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone.

### Our Standards

**Positive behavior:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community

**Unacceptable behavior:**
- Trolling, insulting/derogatory comments
- Public or private harassment
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to **conduct@voidborne.ai**.

---

## ✅ Pre-submission Checklist

Before submitting your PR, ensure:

- [ ] Code follows style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] Commit messages follow conventions
- [ ] No merge conflicts
- [ ] PR description is complete
- [ ] Breaking changes are documented
- [ ] Security considerations addressed

---

**Thank you for contributing to Voidborne!** 🎉

Every contribution, no matter how small, helps make the project better.
