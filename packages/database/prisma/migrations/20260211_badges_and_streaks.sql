-- Add badges and streaks to User table
ALTER TABLE users ADD COLUMN current_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN longest_streak INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_bet_date TIMESTAMP;

-- Create badges table
CREATE TABLE badges (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Badge info
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  rarity TEXT NOT NULL, -- COMMON, RARE, EPIC, LEGENDARY
  
  -- Unlock criteria
  criteria_type TEXT NOT NULL, -- STREAK, PROFIT, WINS, VOLUME, SPECIAL
  criteria_value INTEGER,
  
  UNIQUE(name)
);

-- Create user_badges junction table
CREATE TABLE user_badges (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  
  earned_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge ON user_badges(badge_id);

-- Seed initial badges
INSERT INTO badges (id, name, description, icon, rarity, criteria_type, criteria_value) VALUES
  ('badge_first_blood', 'First Blood', 'Place your first bet', '🎯', 'COMMON', 'WINS', 1),
  ('badge_hot_streak', 'Hot Streak', 'Win 3 bets in a row', '🔥', 'RARE', 'STREAK', 3),
  ('badge_perfect_week', 'Perfect Week', 'Win 7 bets in a row', '⚡', 'EPIC', 'STREAK', 7),
  ('badge_legend', 'Legendary Predictor', 'Win 15 bets in a row', '👑', 'LEGENDARY', 'STREAK', 15),
  ('badge_whale', 'High Roller', 'Wager $10,000+ total', '🐋', 'EPIC', 'VOLUME', 10000),
  ('badge_profitable', 'Profit King', 'Earn $1,000+ profit', '💰', 'RARE', 'PROFIT', 1000),
  ('badge_diamond_hands', 'Diamond Hands', 'Hold through 100+ bets', '💎', 'LEGENDARY', 'BETS', 100);
