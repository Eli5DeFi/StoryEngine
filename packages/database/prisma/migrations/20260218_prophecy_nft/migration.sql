-- Migration: 20260218_prophecy_nft
-- Prophecy NFT System (Innovation Cycle #49 — "The Living Cosmos")
-- Add Prophecy and ProphecyMint models

-- ─── Enums ────────────────────────────────────────────────────────────────────

CREATE TYPE "ProphecyStatus" AS ENUM ('PENDING', 'UNFULFILLED', 'ECHOED', 'FULFILLED');

-- ─── Prophecy ─────────────────────────────────────────────────────────────────

CREATE TABLE "prophecies" (
    "id"             TEXT NOT NULL,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    "chapterId"      TEXT NOT NULL,
    "contentHash"    TEXT NOT NULL,
    "text"           TEXT,
    "teaser"         TEXT NOT NULL,
    "pendingURI"     TEXT NOT NULL,
    "fulfilledURI"   TEXT,
    "echoedURI"      TEXT,
    "unfulfilledURI" TEXT,
    "mintedCount"    INTEGER NOT NULL DEFAULT 0,
    "maxSupply"      INTEGER NOT NULL DEFAULT 100,
    "revealed"       BOOLEAN NOT NULL DEFAULT false,
    "revealedAt"     TIMESTAMP(3),
    "status"         "ProphecyStatus" NOT NULL DEFAULT 'PENDING',
    "fulfilledAt"    TIMESTAMP(3),
    "targetEvent"    TEXT,
    "relevanceScore" DOUBLE PRECISION,
    "artTheme"       TEXT,

    CONSTRAINT "prophecies_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "prophecies_chapterId_status_idx" ON "prophecies"("chapterId", "status");
CREATE INDEX "prophecies_status_idx" ON "prophecies"("status");

ALTER TABLE "prophecies"
    ADD CONSTRAINT "prophecies_chapterId_fkey"
    FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── ProphecyMint ─────────────────────────────────────────────────────────────

CREATE TABLE "prophecy_mints" (
    "id"            TEXT NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prophecyId"    TEXT NOT NULL,
    "userId"        TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "mintOrder"     INTEGER NOT NULL,
    "tokenId"       TEXT,
    "txHash"        TEXT,
    "forgePaid"     DOUBLE PRECISION NOT NULL DEFAULT 5,

    CONSTRAINT "prophecy_mints_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "prophecy_mints_prophecyId_mintOrder_key"
    ON "prophecy_mints"("prophecyId", "mintOrder");

CREATE UNIQUE INDEX "prophecy_mints_prophecyId_userId_key"
    ON "prophecy_mints"("prophecyId", "userId");

CREATE INDEX "prophecy_mints_userId_idx"   ON "prophecy_mints"("userId");
CREATE INDEX "prophecy_mints_prophecyId_idx" ON "prophecy_mints"("prophecyId");

ALTER TABLE "prophecy_mints"
    ADD CONSTRAINT "prophecy_mints_prophecyId_fkey"
    FOREIGN KEY ("prophecyId") REFERENCES "prophecies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "prophecy_mints"
    ADD CONSTRAINT "prophecy_mints_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
