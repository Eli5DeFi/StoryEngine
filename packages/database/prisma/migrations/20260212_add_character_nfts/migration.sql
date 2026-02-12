-- Add Character Memory NFT tracking

-- Character NFT metadata
CREATE TABLE IF NOT EXISTS "CharacterNFT" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tokenId" INTEGER NOT NULL UNIQUE,
  "userId" TEXT NOT NULL,
  "contractAddress" TEXT NOT NULL,
  "chainId" INTEGER NOT NULL DEFAULT 8453, -- Base mainnet
  
  -- Stats (mirrored from on-chain)
  "totalBets" INTEGER NOT NULL DEFAULT 0,
  "totalWagered" DECIMAL(20, 6) NOT NULL DEFAULT 0,
  "totalWon" DECIMAL(20, 6) NOT NULL DEFAULT 0,
  "winRate" INTEGER NOT NULL DEFAULT 0, -- Basis points (0-10000)
  "currentStreak" INTEGER NOT NULL DEFAULT 0,
  "longestStreak" INTEGER NOT NULL DEFAULT 0,
  
  -- Evolution traits
  "archetype" INTEGER NOT NULL DEFAULT 0, -- 0=NONE, 1=STRATEGIST, 2=GAMBLER, 3=ORACLE, 4=CONTRARIAN
  "riskLevel" INTEGER NOT NULL DEFAULT 0, -- 0=CONSERVATIVE, 1=BALANCED, 2=AGGRESSIVE
  "alignment" INTEGER NOT NULL DEFAULT 0, -- 0=NEUTRAL, 1=ORDER, 2=CHAOS
  
  -- Metadata
  "metadataURI" TEXT,
  "imageURI" TEXT,
  "mintedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "CharacterNFT_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- NFT Badges
CREATE TABLE IF NOT EXISTS "CharacterBadge" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "nftId" TEXT NOT NULL,
  "badgeId" TEXT NOT NULL, -- bytes32 as hex string
  "name" TEXT NOT NULL,
  "chapterId" TEXT NOT NULL,
  "rarity" INTEGER NOT NULL, -- 0=COMMON, 1=RARE, 2=EPIC, 3=LEGENDARY
  
  "earnedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  
  CONSTRAINT "CharacterBadge_nftId_fkey" FOREIGN KEY ("nftId") REFERENCES "CharacterNFT"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CharacterBadge_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- NFT Evolution History (track changes over time)
CREATE TABLE IF NOT EXISTS "CharacterEvolution" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "nftId" TEXT NOT NULL,
  
  "eventType" TEXT NOT NULL, -- 'MINT' | 'ARCHETYPE_CHANGE' | 'RISK_CHANGE' | 'ALIGNMENT_CHANGE' | 'BADGE_EARNED'
  "previousValue" TEXT,
  "newValue" TEXT,
  "triggerBetId" TEXT, -- Bet that triggered evolution
  
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "CharacterEvolution_nftId_fkey" FOREIGN KEY ("nftId") REFERENCES "CharacterNFT"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CharacterEvolution_triggerBetId_fkey" FOREIGN KEY ("triggerBetId") REFERENCES "Bet"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS "CharacterNFT_userId_idx" ON "CharacterNFT"("userId");
CREATE INDEX IF NOT EXISTS "CharacterNFT_tokenId_idx" ON "CharacterNFT"("tokenId");
CREATE INDEX IF NOT EXISTS "CharacterNFT_archetype_idx" ON "CharacterNFT"("archetype");
CREATE INDEX IF NOT EXISTS "CharacterNFT_winRate_idx" ON "CharacterNFT"("winRate");
CREATE INDEX IF NOT EXISTS "CharacterNFT_longestStreak_idx" ON "CharacterNFT"("longestStreak");

CREATE INDEX IF NOT EXISTS "CharacterBadge_nftId_idx" ON "CharacterBadge"("nftId");
CREATE INDEX IF NOT EXISTS "CharacterBadge_badgeId_idx" ON "CharacterBadge"("badgeId");
CREATE INDEX IF NOT EXISTS "CharacterBadge_rarity_idx" ON "CharacterBadge"("rarity");

CREATE INDEX IF NOT EXISTS "CharacterEvolution_nftId_idx" ON "CharacterEvolution"("nftId");
CREATE INDEX IF NOT EXISTS "CharacterEvolution_eventType_idx" ON "CharacterEvolution"("eventType");
CREATE INDEX IF NOT EXISTS "CharacterEvolution_createdAt_idx" ON "CharacterEvolution"("createdAt");

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "CharacterNFT_userId_key" ON "CharacterNFT"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "CharacterBadge_nftId_badgeId_key" ON "CharacterBadge"("nftId", "badgeId");
