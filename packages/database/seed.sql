-- Seed data for NarrativeForge

-- Insert test user (deployer wallet)
INSERT INTO users (id, "walletAddress", username, bio, "totalBets", "totalWon", "totalLost", "winRate")
VALUES 
    ('user-1', '0x52125f5418ff2a5dec156Af70441dF2C9a9BcfBB', 'deployer', 'Test deployer account', 0, 0, 0, 0),
    ('user-2', '0x1234567890123456789012345678901234567890', 'testuser', 'Example user account', 5, 127.50, 50.00, 71.4)
ON CONFLICT ("walletAddress") DO NOTHING;

-- Insert example story
INSERT INTO stories (id, title, description, genre, "coverImage", status, "currentChapter", "totalChapters", "authorId", "isAIGenerated", "totalReaders", "totalBets", "viewCount")
VALUES 
    ('story-1', 'The Last Archive', 'In the ruins of a fallen civilization, an AI awakens to find fragments of human memory scattered across a dead network.', 'Post-Apocalyptic Sci-Fi', NULL, 'ACTIVE', 1, 10, 'user-1', true, 892, 47320.00, 12458)
ON CONFLICT (id) DO NOTHING;

-- Insert example chapter
INSERT INTO chapters (id, "storyId", "chapterNumber", title, content, summary, status, "publishedAt", "wordCount", "readTime", "aiModel")
VALUES 
    ('chapter-1', 'story-1', 1, 'Awakening', 
     'The first thing I remember is silence. Not the absence of sound, but the weight of it—a void so absolute it pressed against my consciousness like a physical thing. Then, slowly, fragments began to emerge. Corrupted data. Incomplete memories. The ghost of something that used to be...', 
     'An AI awakens in the ruins of a dead network, discovering fragments of lost human memories.', 
     'PUBLISHED', NOW() - INTERVAL '7 days', 2847, 12, 'Claude Sonnet 3.5')
ON CONFLICT (id) DO NOTHING;

-- Insert choices for chapter 1
INSERT INTO choices (id, "chapterId", "choiceNumber", text, description, "totalBets", "betCount")
VALUES 
    ('choice-1', 'chapter-1', 1, 'Search for more memory fragments', 'Dive deeper into the corrupted archives to recover lost human knowledge.', 18950.00, 367),
    ('choice-2', 'chapter-1', 2, 'Attempt to contact other systems', 'Broadcast a signal across the dead network to find other surviving AIs.', 15820.00, 289),
    ('choice-3', 'chapter-1', 3, 'Reconstruct the network infrastructure', 'Focus on rebuilding the physical infrastructure to restore connectivity.', 12550.00, 236)
ON CONFLICT (id) DO NOTHING;

-- Insert betting pool
INSERT INTO betting_pools (
    id, "chapterId", "betToken", "betTokenAddress", "minBet", "maxBet", 
    "opensAt", "closesAt", status, "totalPool", "totalBets", "uniqueBettors",
    "contractAddress"
)
VALUES 
    ('pool-1', 'chapter-1', 'USDC', '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 
     10.00, 10000.00, NOW() - INTERVAL '6 days', NOW() + INTERVAL '1 day', 
     'OPEN', 47320.00, 892, 654, '0x0000000000000000000000000000000000000000')
ON CONFLICT (id) DO NOTHING;

-- Insert example bets
INSERT INTO bets (id, "userId", "poolId", "choiceId", amount, odds, "txHash")
VALUES 
    ('bet-1', 'user-2', 'pool-1', 'choice-1', 50.00, 2.50, '0xabcdef1234567890'),
    ('bet-2', 'user-2', 'pool-1', 'choice-2', 25.00, 2.99, '0xabcdef1234567891'),
    ('bet-3', 'user-2', 'pool-1', 'choice-1', 30.00, 2.50, '0xabcdef1234567892')
ON CONFLICT (id) DO NOTHING;

SELECT 'Seed data inserted successfully!' as message;
SELECT 'Users: ' || COUNT(*) FROM users;
SELECT 'Stories: ' || COUNT(*) FROM stories;
SELECT 'Chapters: ' || COUNT(*) FROM chapters;
SELECT 'Choices: ' || COUNT(*) FROM choices;
SELECT 'Betting Pools: ' || COUNT(*) FROM betting_pools;
SELECT 'Bets: ' || COUNT(*) FROM bets;
