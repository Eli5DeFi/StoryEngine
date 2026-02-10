-- NarrativeForge Database Schema
-- Generated manually for Prisma schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "walletAddress" TEXT UNIQUE NOT NULL,
    nonce TEXT,
    username TEXT UNIQUE,
    bio TEXT,
    avatar TEXT,
    "totalBets" INTEGER DEFAULT 0,
    "totalWon" DECIMAL(20,6) DEFAULT 0,
    "totalLost" DECIMAL(20,6) DEFAULT 0,
    "winRate" DOUBLE PRECISION DEFAULT 0
);

-- Stories table
CREATE TABLE IF NOT EXISTS stories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    genre TEXT NOT NULL,
    "coverImage" TEXT,
    status TEXT DEFAULT 'ACTIVE',
    "currentChapter" INTEGER DEFAULT 1,
    "totalChapters" INTEGER DEFAULT 0,
    "authorId" TEXT NOT NULL REFERENCES users(id),
    "isAIGenerated" BOOLEAN DEFAULT true,
    "totalReaders" INTEGER DEFAULT 0,
    "totalBets" DECIMAL(20,6) DEFAULT 0,
    "viewCount" INTEGER DEFAULT 0
);

-- Chapters table
CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "storyId" TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    "chapterNumber" INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    "headerImage" TEXT,
    images TEXT[] DEFAULT '{}',
    "wordCount" INTEGER DEFAULT 0,
    "readTime" INTEGER DEFAULT 0,
    status TEXT DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP,
    "aiModel" TEXT,
    "aiPrompt" TEXT,
    "generationTime" INTEGER,
    UNIQUE("storyId", "chapterNumber")
);

-- Choices table
CREATE TABLE IF NOT EXISTS choices (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "chapterId" TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    "choiceNumber" INTEGER NOT NULL,
    text TEXT NOT NULL,
    description TEXT,
    "isChosen" BOOLEAN DEFAULT false,
    "chosenAt" TIMESTAMP,
    "aiScore" DOUBLE PRECISION,
    "aiReasoning" TEXT,
    "totalBets" DECIMAL(20,6) DEFAULT 0,
    "betCount" INTEGER DEFAULT 0,
    "oddsSnapshot" DOUBLE PRECISION,
    UNIQUE("chapterId", "choiceNumber")
);

-- Betting Pools table
CREATE TABLE IF NOT EXISTS betting_pools (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "chapterId" TEXT UNIQUE NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    "betToken" TEXT DEFAULT 'USDC',
    "betTokenAddress" TEXT NOT NULL,
    "minBet" DECIMAL(20,6) DEFAULT 10,
    "maxBet" DECIMAL(20,6) DEFAULT 10000,
    "opensAt" TIMESTAMP NOT NULL,
    "closesAt" TIMESTAMP NOT NULL,
    "resolvedAt" TIMESTAMP,
    status TEXT DEFAULT 'PENDING',
    "totalPool" DECIMAL(20,6) DEFAULT 0,
    "totalBets" INTEGER DEFAULT 0,
    "uniqueBettors" INTEGER DEFAULT 0,
    "contractAddress" TEXT,
    "contractTxHash" TEXT,
    "winningChoiceId" TEXT,
    "winnersPaid" DECIMAL(20,6) DEFAULT 0,
    "treasuryCut" DECIMAL(20,6) DEFAULT 0,
    "devCut" DECIMAL(20,6) DEFAULT 0
);

-- Bets table
CREATE TABLE IF NOT EXISTS bets (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "userId" TEXT NOT NULL REFERENCES users(id),
    "poolId" TEXT NOT NULL REFERENCES betting_pools(id),
    "choiceId" TEXT NOT NULL REFERENCES choices(id),
    amount DECIMAL(20,6) NOT NULL,
    "isWinner" BOOLEAN DEFAULT false,
    payout DECIMAL(20,6),
    "payoutTxHash" TEXT,
    odds DOUBLE PRECISION,
    "txHash" TEXT
);

-- AI Generations table
CREATE TABLE IF NOT EXISTS ai_generations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    type TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    model TEXT NOT NULL,
    provider TEXT NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    "tokensUsed" INTEGER,
    cost DECIMAL(10,6),
    latency INTEGER,
    status TEXT NOT NULL,
    error TEXT
);

-- Analytics table
CREATE TABLE IF NOT EXISTS analytics (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    date DATE UNIQUE NOT NULL,
    "activeUsers" INTEGER DEFAULT 0,
    "newUsers" INTEGER DEFAULT 0,
    "storiesCreated" INTEGER DEFAULT 0,
    "chaptersPublished" INTEGER DEFAULT 0,
    "totalBets" INTEGER DEFAULT 0,
    "totalVolume" DECIMAL(20,6) DEFAULT 0,
    "uniqueBettors" INTEGER DEFAULT 0,
    "platformFees" DECIMAL(20,6) DEFAULT 0,
    "tradingFees" DECIMAL(20,6) DEFAULT 0,
    "aiCalls" INTEGER DEFAULT 0,
    "aiCost" DECIMAL(10,6) DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users("walletAddress");
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories(status, "createdAt");
CREATE INDEX IF NOT EXISTS idx_stories_genre ON stories(genre);
CREATE INDEX IF NOT EXISTS idx_chapters_story ON chapters("storyId", "chapterNumber");
CREATE INDEX IF NOT EXISTS idx_choices_chapter ON choices("chapterId");
CREATE INDEX IF NOT EXISTS idx_pools_status ON betting_pools(status, "closesAt");
CREATE INDEX IF NOT EXISTS idx_bets_user ON bets("userId");
CREATE INDEX IF NOT EXISTS idx_bets_pool ON bets("poolId");
CREATE INDEX IF NOT EXISTS idx_bets_choice ON bets("choiceId");
CREATE INDEX IF NOT EXISTS idx_ai_entity ON ai_generations("entityId", "entityType");
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(date);

-- Success message
SELECT 'Database schema created successfully!' as message;
