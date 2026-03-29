-- BOSS 挑战系统：数据库迁移
-- 在 Supabase SQL Editor 中执行

-- characters 表：区分 BOSS 角色（NULL=普通, 1-5=BOSS等级）
ALTER TABLE characters ADD COLUMN IF NOT EXISTS boss_tier INT DEFAULT NULL;

-- BOSS 进度表
CREATE TABLE IF NOT EXISTS user_boss_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  boss_tier INT NOT NULL,
  defeated BOOLEAN DEFAULT FALSE,
  attempts INT DEFAULT 0,
  defeated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  UNIQUE(user_id, boss_tier)
);

CREATE INDEX IF NOT EXISTS idx_boss_progress_user ON user_boss_progress(user_id);

ALTER TABLE user_boss_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all via service role" ON user_boss_progress FOR ALL USING (true);

-- users 表：称号
ALTER TABLE users ADD COLUMN IF NOT EXISTS title TEXT DEFAULT NULL;
