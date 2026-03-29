-- 连胜 + 首胜机制：users 表新增字段
-- 在 Supabase SQL Editor 中执行

-- current_streak: 当前连胜次数，输/平归零
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0;

-- max_streak: 历史最高连胜，只增不减
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_streak INT DEFAULT 0;

-- last_first_win_date: 上次首胜日期，判定今日首胜
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_first_win_date DATE DEFAULT NULL;
