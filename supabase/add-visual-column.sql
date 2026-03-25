-- 添加 visual JSONB 列到 characters 表
-- 用于存储角色的视觉配置（原型、帽子、翅膀、光环等）
-- 在 Supabase Dashboard SQL Editor 中执行此文件
ALTER TABLE characters ADD COLUMN IF NOT EXISTS visual JSONB DEFAULT NULL;
