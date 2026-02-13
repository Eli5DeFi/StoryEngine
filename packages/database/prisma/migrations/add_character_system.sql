-- Character Memory System Migration
-- Add character tracking, memories, relationships, and alternate outcomes

-- Characters table
CREATE TABLE "characters" (
  "id" TEXT PRIMARY KEY,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "storyId" TEXT NOT NULL REFERENCES "stories"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "portrait" TEXT,
  "traits" JSONB DEFAULT '{}' NOT NULL,
  "firstAppearance" INTEGER NOT NULL,
  "lastAppearance" INTEGER NOT NULL,
  "totalAppearances" INTEGER DEFAULT 0 NOT NULL,
  UNIQUE("storyId", "name")
);

CREATE INDEX "characters_storyId_idx" ON "characters"("storyId");

-- Character memories table
CREATE TYPE "MemoryType" AS ENUM ('DECISION', 'RELATIONSHIP', 'REVELATION', 'TRAUMA', 'ACHIEVEMENT');

CREATE TABLE "character_memories" (
  "id" TEXT PRIMARY KEY,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "characterId" TEXT NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "chapterId" TEXT NOT NULL,
  "choiceId" TEXT,
  "eventType" "MemoryType" NOT NULL,
  "description" TEXT NOT NULL,
  "emotionalImpact" DOUBLE PRECISION NOT NULL,
  "importance" INTEGER NOT NULL
);

CREATE INDEX "character_memories_characterId_idx" ON "character_memories"("characterId");
CREATE INDEX "character_memories_chapterId_idx" ON "character_memories"("chapterId");

-- Character relationships table
CREATE TYPE "RelationType" AS ENUM ('FAMILY', 'FRIEND', 'ROMANTIC', 'RIVAL', 'MENTOR', 'ENEMY', 'ALLY', 'NEUTRAL');

CREATE TABLE "character_relationships" (
  "id" TEXT PRIMARY KEY,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "characterAId" TEXT NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "characterBId" TEXT NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "score" DOUBLE PRECISION DEFAULT 0 NOT NULL,
  "relationshipType" "RelationType" NOT NULL,
  "history" JSONB DEFAULT '[]' NOT NULL,
  UNIQUE("characterAId", "characterBId")
);

CREATE INDEX "character_relationships_characterAId_idx" ON "character_relationships"("characterAId");
CREATE INDEX "character_relationships_characterBId_idx" ON "character_relationships"("characterBId");

-- Alternate outcomes table
CREATE TABLE "alternate_outcomes" (
  "id" TEXT PRIMARY KEY,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "chapterId" TEXT NOT NULL,
  "choiceId" TEXT NOT NULL,
  "preview" TEXT NOT NULL,
  "fullContent" TEXT,
  "aiModel" TEXT NOT NULL,
  "generated" BOOLEAN DEFAULT false NOT NULL,
  "viewCount" INTEGER DEFAULT 0 NOT NULL,
  UNIQUE("chapterId", "choiceId")
);

CREATE INDEX "alternate_outcomes_chapterId_idx" ON "alternate_outcomes"("chapterId");

-- Add relationship to stories table
ALTER TABLE "stories" ADD COLUMN IF NOT EXISTS "hasCharacterSystem" BOOLEAN DEFAULT false NOT NULL;

-- Add indexes for performance
CREATE INDEX "characters_name_idx" ON "characters"("name");
CREATE INDEX "character_memories_importance_idx" ON "character_memories"("importance" DESC);
CREATE INDEX "alternate_outcomes_viewCount_idx" ON "alternate_outcomes"("viewCount" DESC);
