-- Performance Optimization Indexes
-- Created: Feb 11, 2026
-- Purpose: Speed up frequently executed queries

-- ========================================
-- BETTING POOLS
-- ========================================

-- Index for finding open betting pools
-- Used in: platform-stats, trending, story pages
CREATE INDEX IF NOT EXISTS idx_betting_pools_open_status
ON betting_pools(status, "closesAt")
WHERE status = 'OPEN';

-- Index for story-specific pools
CREATE INDEX IF NOT EXISTS idx_betting_pools_chapter
ON betting_pools("chapterId", status);

-- ========================================
-- BETS
-- ========================================

-- Index for user betting history
-- Used in: my-bets page, user dashboard
CREATE INDEX IF NOT EXISTS idx_bets_user_recent
ON bets("walletAddress", "createdAt" DESC);

-- Index for pool bets (betting interface)
CREATE INDEX IF NOT EXISTS idx_bets_pool_recent
ON bets("poolId", "createdAt" DESC);

-- Index for winner queries (leaderboard)
-- Partial index (only winning bets)
CREATE INDEX IF NOT EXISTS idx_bets_winners
ON bets("walletAddress", payout, "createdAt" DESC)
WHERE "isWinner" = true;

-- Index for timeframe queries (stats, analytics)
CREATE INDEX IF NOT EXISTS idx_bets_timeframe
ON bets("createdAt" DESC, amount);

-- Composite index for user performance
CREATE INDEX IF NOT EXISTS idx_bets_user_performance
ON bets("walletAddress", "isWinner", payout);

-- ========================================
-- USERS
-- ========================================

-- Index for wallet lookups (used frequently)
CREATE INDEX IF NOT EXISTS idx_users_wallet
ON users("walletAddress");

-- ========================================
-- STORIES & CHAPTERS
-- ========================================

-- Index for active stories
CREATE INDEX IF NOT EXISTS idx_stories_active
ON stories(status, "createdAt" DESC);

-- Index for story chapters
CREATE INDEX IF NOT EXISTS idx_chapters_story
ON chapters("storyId", "chapterNumber");

-- ========================================
-- QUERY PERFORMANCE NOTES
-- ========================================

-- These indexes target the most expensive queries:
--
-- 1. Platform stats (betting/platform-stats)
--    - idx_betting_pools_open_status: Open pools count
--    - idx_bets_timeframe: Volume aggregation
--    - idx_bets_winners: Biggest win query
--
-- 2. User dashboard (my-bets)
--    - idx_bets_user_recent: Betting history
--    - idx_bets_user_performance: Win rate, ROI
--
-- 3. Story betting interface
--    - idx_bets_pool_recent: Recent bets on pool
--    - idx_betting_pools_chapter: Pool lookup
--
-- 4. Analytics/Leaderboard
--    - idx_bets_winners: Top performers
--    - idx_users_wallet: User lookups

-- ========================================
-- MAINTENANCE
-- ========================================

-- Monitor index usage:
-- SELECT * FROM pg_stat_user_indexes 
-- WHERE schemaname = 'public' 
-- ORDER BY idx_scan DESC;

-- Check index sizes:
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY pg_relation_size(indexrelid) DESC;
