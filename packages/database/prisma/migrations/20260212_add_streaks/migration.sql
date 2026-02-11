-- Add streak fields to User model
ALTER TABLE "users"
ADD COLUMN "currentStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "longestStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "streakMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN "lastBetDate" TIMESTAMP,
ADD COLUMN "consecutiveWins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "streakShieldsAvailable" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "streakShieldUsedAt" TIMESTAMP;

-- Add streak fields to Bet model
ALTER TABLE "bets"
ADD COLUMN "streakMultiplier" DOUBLE PRECISION DEFAULT 1.0,
ADD COLUMN "wasStreakBroken" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "usedStreakShield" BOOLEAN NOT NULL DEFAULT false;

-- Create indexes for efficient streak queries
CREATE INDEX "users_currentStreak_idx" ON "users"("currentStreak");
CREATE INDEX "users_longestStreak_idx" ON "users"("longestStreak");
