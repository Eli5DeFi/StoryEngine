-- Performance Optimization Indexes (Feb 14, 2026)
-- Adds missing indexes for common query patterns

-- Bets table - frequently queried by createdAt for trending/recent data
CREATE INDEX IF NOT EXISTS "idx_bets_created_at" ON "bets"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_bets_pool_created" ON "bets"("poolId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_bets_user_created" ON "bets"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_bets_choice_created" ON "bets"("choiceId", "createdAt" DESC);

-- BettingPools table - frequently filtered by status and closesAt
CREATE INDEX IF NOT EXISTS "idx_pools_status_closes" ON "betting_pools"("status", "closesAt");
CREATE INDEX IF NOT EXISTS "idx_pools_chapter" ON "betting_pools"("chapterId");

-- Choices table - queried with chapter joins
CREATE INDEX IF NOT EXISTS "idx_choices_chapter" ON "choices"("chapterId");

-- Chapters table - queried by story and chapter number
CREATE INDEX IF NOT EXISTS "idx_chapters_story_number" ON "chapters"("storyId", "chapterNumber");

-- OddsSnapshots table - frequently queried by poolId and timestamp
CREATE INDEX IF NOT EXISTS "idx_odds_snapshots_pool_time" ON "odds_snapshots"("poolId", "timestamp" DESC);

-- Characters table - queried by story
CREATE INDEX IF NOT EXISTS "idx_characters_story" ON "characters"("storyId");

-- Composite index for leaderboard queries (user stats)
CREATE INDEX IF NOT EXISTS "idx_users_winrate_bets" ON "users"("winRate" DESC, "totalBets" DESC);
CREATE INDEX IF NOT EXISTS "idx_users_streak" ON "users"("currentStreak" DESC);

-- UserBadges - queried by userId
CREATE INDEX IF NOT EXISTS "idx_user_badges_user" ON "user_badges"("userId");

-- Notifications - frequently filtered by user and read status
CREATE INDEX IF NOT EXISTS "idx_notifications_user_read_created" ON "notifications"("userId", "read", "createdAt" DESC);

-- Add comment explaining the optimization
COMMENT ON INDEX "idx_bets_created_at" IS 'Performance index for trending/recent bets queries';
COMMENT ON INDEX "idx_pools_status_closes" IS 'Performance index for active pools queries';
COMMENT ON INDEX "idx_odds_snapshots_pool_time" IS 'Performance index for odds history queries';
