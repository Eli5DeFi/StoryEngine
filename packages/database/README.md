# @narrative-forge/database

Database schema and Prisma client for NarrativeForge.

## Features

- **PostgreSQL** database with Prisma ORM
- **Type-safe** queries with auto-generated types
- **Migration** support for schema evolution
- **Seed data** for development/testing
- **Utility functions** for common operations

## Schema Overview

### Core Entities

**Users** - Wallet-based authentication, stats, betting history
```typescript
{
  walletAddress: string
  username?: string
  totalBets: number
  winRate: number
  bets: Bet[]
}
```

**Stories** - AI-generated interactive fiction
```typescript
{
  title: string
  genre: string
  status: StoryStatus
  chapters: Chapter[]
  totalBets: Decimal
}
```

**Chapters** - Individual story segments with choices
```typescript
{
  chapterNumber: number
  content: string (full text)
  status: ChapterStatus
  choices: Choice[]
  bettingPool?: BettingPool
}
```

**Choices** - Story branching options
```typescript
{
  text: string
  isChosen: boolean
  aiScore: number
  totalBets: Decimal
  bets: Bet[]
}
```

**BettingPools** - Parimutuel betting on AI choices
```typescript
{
  status: PoolStatus
  totalPool: Decimal
  closesAt: Date
  bets: Bet[]
}
```

**Bets** - Individual user bets
```typescript
{
  user: User
  choice: Choice
  amount: Decimal
  isWinner: boolean
  payout?: Decimal
}
```

### Analytics & AI

**AIGeneration** - Logs for all AI operations
**Analytics** - Daily platform metrics

## Setup

### 1. Install Dependencies

```bash
cd packages/database
npm install
```

### 2. Set Database URL

```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/narrativeforge?schema=public"
```

### 3. Run Migrations

```bash
# Push schema to database (development)
npm run db:push

# Or create migration (production)
npm run db:migrate
```

### 4. Seed Database

```bash
npm run db:seed
```

This creates sample data:
- 2 users (alice_crypto, bob_trader)
- 1 story ("The Last Starforge")
- 2 chapters (1 resolved, 1 with active betting)
- 4 choices
- 1 active betting pool
- Sample bets

### 5. Open Prisma Studio

```bash
npm run db:studio
```

View and edit data at http://localhost:5555

## Usage

### In Your App

```typescript
import { prisma } from '@narrative-forge/database'

// Get active stories
const stories = await prisma.story.findMany({
  where: { status: 'ACTIVE' },
  include: {
    chapters: {
      orderBy: { chapterNumber: 'asc' },
    },
  },
})

// Get betting pool with choices
const pool = await prisma.bettingPool.findUnique({
  where: { id: poolId },
  include: {
    chapter: {
      include: {
        choices: {
          include: {
            _count: {
              select: { bets: true },
            },
          },
        },
      },
    },
    bets: {
      include: {
        user: true,
      },
    },
  },
})

// Create a bet
const bet = await prisma.bet.create({
  data: {
    userId: user.id,
    poolId: pool.id,
    choiceId: choice.id,
    amount: 10.5,
    odds: 2.125,
    txHash: '0x...',
  },
})
```

### Utility Functions

```typescript
import { calculateOdds, calculatePayout, formatTimeRemaining } from '@narrative-forge/database'

// Calculate odds for a choice
const odds = calculateOdds(choiceBets, totalPool)

// Calculate payout for winning bet
const payout = calculatePayout(betAmount, choiceBets, totalPool, 0.85)

// Time remaining in pool
const timeLeft = formatTimeRemaining(pool.closesAt)
// Returns: "4h 23m"
```

## Database Schema

### Users Table
- `id` - CUID primary key
- `walletAddress` - Unique Ethereum address
- `username` - Optional display name
- `totalBets` - Number of bets placed
- `totalWon` - Total FORGE won
- `totalLost` - Total FORGE lost
- `winRate` - Win percentage (0-100)

### Stories Table
- `id` - CUID primary key
- `title` - Story name
- `genre` - Sci-Fi, Fantasy, etc.
- `status` - ACTIVE, PAUSED, COMPLETED, ARCHIVED
- `currentChapter` - Latest chapter number
- `totalReaders` - Unique readers
- `totalBets` - Total FORGE wagered

### Chapters Table
- `id` - CUID primary key
- `storyId` - Foreign key to Story
- `chapterNumber` - Sequential number
- `content` - Full chapter text
- `status` - DRAFT, PUBLISHED, BETTING, RESOLVED
- `aiModel` - Model used for generation
- `publishedAt` - Publication timestamp

### Choices Table
- `id` - CUID primary key
- `chapterId` - Foreign key to Chapter
- `choiceNumber` - 1, 2, 3, etc.
- `text` - Choice description
- `isChosen` - AI's selection
- `aiScore` - AI's preference (0-100)
- `totalBets` - Total FORGE on this choice

### BettingPools Table
- `id` - CUID primary key
- `chapterId` - Foreign key to Chapter (unique)
- `status` - PENDING, OPEN, CLOSED, RESOLVING, RESOLVED
- `totalPool` - Sum of all bets
- `closesAt` - Deadline for bets
- `contractAddress` - On-chain pool address
- `winningChoiceId` - Winner after resolution

### Bets Table
- `id` - CUID primary key
- `userId` - Foreign key to User
- `poolId` - Foreign key to BettingPool
- `choiceId` - Foreign key to Choice
- `amount` - Bet amount in FORGE
- `isWinner` - True if won
- `payout` - Winnings (if won)

## Migrations

### Create Migration

```bash
npm run db:migrate
# Name: add_user_avatar_field
```

This creates:
- Migration SQL in `prisma/migrations/`
- Updates `@prisma/client` types

### Reset Database

```bash
npm run db:reset
```

⚠️ **Warning:** Deletes all data and re-runs migrations + seed

## Best Practices

### 1. Use Transactions for Multi-Step Operations

```typescript
await prisma.$transaction(async (tx) => {
  // Create bet
  const bet = await tx.bet.create({ data: betData })
  
  // Update choice totals
  await tx.choice.update({
    where: { id: choiceId },
    data: {
      totalBets: { increment: betAmount },
      betCount: { increment: 1 },
    },
  })
  
  // Update pool totals
  await tx.bettingPool.update({
    where: { id: poolId },
    data: {
      totalPool: { increment: betAmount },
      totalBets: { increment: 1 },
    },
  })
})
```

### 2. Use Select to Reduce Data Transfer

```typescript
const user = await prisma.user.findUnique({
  where: { walletAddress },
  select: {
    id: true,
    username: true,
    walletAddress: true,
    // Don't include relations unless needed
  },
})
```

### 3. Use Include Sparingly

```typescript
// Bad: Loads all bets (could be 1000s)
const pool = await prisma.bettingPool.findUnique({
  where: { id },
  include: { bets: true },
})

// Good: Aggregate instead
const pool = await prisma.bettingPool.findUnique({
  where: { id },
  include: {
    _count: {
      select: { bets: true },
    },
  },
})
```

### 4. Index Frequently Queried Fields

Already indexed in schema:
- `User.walletAddress` (unique)
- `Story.status + createdAt`
- `BettingPool.status + closesAt`
- `Bet.userId, poolId, choiceId`

## Testing

### Unit Tests

```typescript
import { prisma } from '@narrative-forge/database'

describe('Betting', () => {
  beforeEach(async () => {
    await prisma.bet.deleteMany()
  })

  it('creates a bet', async () => {
    const bet = await prisma.bet.create({
      data: {
        userId: 'user_123',
        poolId: 'pool_456',
        choiceId: 'choice_789',
        amount: 10,
      },
    })
    
    expect(bet.amount).toBe(10)
  })
})
```

### Integration Tests

```typescript
import { exec } from 'child_process'

beforeAll(async () => {
  // Reset test database
  exec('npm run db:reset -- --force')
})
```

## Troubleshooting

### "Could not connect to database"

Check `DATABASE_URL` in `.env`:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/narrativeforge"
```

### "Table does not exist"

Run migrations:
```bash
npm run db:push
```

### "Prisma Client not generated"

Generate client:
```bash
npm run db:generate
```

### "Seed script fails"

Reset and try again:
```bash
npm run db:reset
```

## Production

### Environment Variables

```bash
# Production
DATABASE_URL="postgresql://user:password@production-host:5432/narrativeforge?schema=public&sslmode=require"

# Enable connection pooling
DATABASE_URL="postgresql://user:password@pooler.production.com:5432/narrativeforge?pgbouncer=true"
```

### Migrations

```bash
# Don't use db:push in production!
# Always use migrations:
npx prisma migrate deploy
```

### Backups

```bash
# Backup
pg_dump -U user -h host narrativeforge > backup.sql

# Restore
psql -U user -h host narrativeforge < backup.sql
```

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

## Schema Visualization

```
User ─┬─> Bet ──> BettingPool ──> Chapter ──> Story
      └─> Story (author)
      
Choice ──> Chapter
       └─> Bet

AIGeneration (logs all AI operations)
Analytics (daily metrics)
```

## Next Steps

1. **Set up your database** (PostgreSQL locally or cloud)
2. **Run migrations**: `npm run db:push`
3. **Seed data**: `npm run db:seed`
4. **Build API routes** using this schema
5. **Test queries** in Prisma Studio

Happy coding! 🚀
