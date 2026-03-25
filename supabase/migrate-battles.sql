-- Phase 2: 更新 battles 表结构以匹配对战 API
-- 在 Supabase SQL Editor 中执行

-- 1. 删除旧表和索引
DROP INDEX IF EXISTS idx_battles_player1;
DROP INDEX IF EXISTS idx_battles_player2;
DROP TABLE IF EXISTS battles;

-- 2. 创建新的 battles 表
CREATE TABLE battles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES users(id),
  player_character_id UUID REFERENCES characters(id),
  opponent_character_id UUID REFERENCES characters(id),
  winner TEXT NOT NULL CHECK (winner IN ('player', 'opponent', 'draw')),
  rounds JSONB NOT NULL,
  total_rounds INT NOT NULL,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建索引
CREATE INDEX idx_battles_player ON battles(player_id);
CREATE INDEX idx_battles_created ON battles(created_at DESC);

-- 4. 启用 RLS 并允许 service_role 访问
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all via service role" ON battles FOR ALL USING (true);
