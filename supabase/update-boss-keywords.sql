-- 更新 BOSS 关键词 + T5 属性修正
-- 在 Supabase SQL Editor 中执行

-- T3 炼金贤者：关键词更新（命中 Epic trigger "魔法"）
UPDATE characters SET keywords = '魔法 炼金 贤者' WHERE name = '炼金贤者' AND boss_tier = 3;

-- T4 裂地巨兽：关键词更新（命中 Epic trigger "泰坦"）
UPDATE characters SET keywords = '泰坦 地震 獠牙' WHERE name = '裂地巨兽' AND boss_tier = 4;

-- T5 虚空之眼：关键词更新（命中 Legendary trigger "混沌"）+ 属性 98→95
UPDATE characters SET 
  keywords = '混沌 湮灭 虚空',
  int_val = 17,
  wis = 17,
  cha = 13
WHERE name = '虚空之眼' AND boss_tier = 5;
