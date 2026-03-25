-- 关键词竞技场 数据库初始化
-- 运行方式：在 Supabase SQL Editor 中执行

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(8) NOT NULL,
  code VARCHAR(4) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, code)
);

-- 角色表
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  keywords TEXT,
  description TEXT,
  -- D&D 六维属性
  str INT NOT NULL DEFAULT 10,
  dex INT NOT NULL DEFAULT 10,
  con INT NOT NULL DEFAULT 10,
  int_val INT NOT NULL DEFAULT 10,
  wis INT NOT NULL DEFAULT 10,
  cha INT NOT NULL DEFAULT 10,
  -- HP
  max_hp INT NOT NULL DEFAULT 100,
  -- 装备和技能（JSON）
  weapons JSONB DEFAULT '[]'::jsonb,
  armors JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  items JSONB DEFAULT '[]'::jsonb,
  -- 元数据
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 对战记录表
CREATE TABLE battles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player1_id UUID REFERENCES characters(id),
  player2_id UUID REFERENCES characters(id),
  winner_id UUID REFERENCES characters(id),
  battle_log JSONB,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 每日限额追踪表
CREATE TABLE daily_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  generations INT DEFAULT 0,
  battles INT DEFAULT 0,
  UNIQUE(user_id, date)
);

-- 索引
CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_characters_is_system ON characters(is_system);
CREATE INDEX idx_battles_player1 ON battles(player1_id);
CREATE INDEX idx_battles_player2 ON battles(player2_id);
CREATE INDEX idx_daily_limits_user_date ON daily_limits(user_id, date);

-- RLS 策略（Row Level Security）
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_limits ENABLE ROW LEVEL SECURITY;

-- 允许匿名用户通过 API 访问（我们在服务端用 service_role key 操作）
CREATE POLICY "Allow all via service role" ON users FOR ALL USING (true);
CREATE POLICY "Allow all via service role" ON characters FOR ALL USING (true);
CREATE POLICY "Allow all via service role" ON battles FOR ALL USING (true);
CREATE POLICY "Allow all via service role" ON daily_limits FOR ALL USING (true);
