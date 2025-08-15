-- Create leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
  id BIGSERIAL PRIMARY KEY,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  game_duration INTEGER NOT NULL DEFAULT 0, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create player_stats table
CREATE TABLE IF NOT EXISTS player_stats (
  id BIGSERIAL PRIMARY KEY,
  player_name TEXT UNIQUE NOT NULL,
  total_games INTEGER NOT NULL DEFAULT 0,
  best_score INTEGER NOT NULL DEFAULT 0,
  total_score BIGINT NOT NULL DEFAULT 0,
  average_score DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_created_at ON leaderboard(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_player_stats_best_score ON player_stats(best_score DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access on leaderboard" ON leaderboard
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on player_stats" ON player_stats
  FOR SELECT USING (true);

-- Create policies for authenticated insert/update
CREATE POLICY "Allow authenticated insert on leaderboard" ON leaderboard
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated insert on player_stats" ON player_stats
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update on player_stats" ON player_stats
  FOR UPDATE USING (true);

-- Function to update player stats automatically
CREATE OR REPLACE FUNCTION update_player_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO player_stats (player_name, total_games, best_score, total_score, average_score, updated_at)
  VALUES (
    NEW.player_name,
    1,
    NEW.score,
    NEW.score,
    NEW.score,
    NOW()
  )
  ON CONFLICT (player_name) DO UPDATE SET
    total_games = player_stats.total_games + 1,
    best_score = GREATEST(player_stats.best_score, NEW.score),
    total_score = player_stats.total_score + NEW.score,
    average_score = (player_stats.total_score + NEW.score) / (player_stats.total_games + 1),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update player stats when new score is added
CREATE TRIGGER trigger_update_player_stats
  AFTER INSERT ON leaderboard
  FOR EACH ROW
  EXECUTE FUNCTION update_player_stats();