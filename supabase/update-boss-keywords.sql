-- 更新 BOSS 关键词 + 属性 + 形象
-- 在 Supabase SQL Editor 中执行

-- T1 守卫石像：visual 升级（dark→fire 红色火焰光环）
UPDATE characters SET 
  visual = '{"archetype":"giant","hat":"horn","aura":"fire","held":"shield"}'::jsonb
WHERE name = '守卫石像' AND boss_tier = 1;

-- T2 暗影刺客：visual 升级（新增蝙蝠小翼）
UPDATE characters SET 
  visual = '{"archetype":"ninja","aura":"dark","held":"dual","wings":"tiny"}'::jsonb
WHERE name = '暗影刺客' AND boss_tier = 2;

-- T3 炼金贤者：关键词升级 + visual 升级（halo→crown 贤者加冕）
UPDATE characters SET 
  keywords = '禁忌炼金师 万毒贤者石 水银蚀魂体',
  visual = '{"archetype":"mage","hat":"crown","aura":"holy","held":"staff"}'::jsonb
WHERE name = '炼金贤者' AND boss_tier = 3;

-- T4 裂地巨兽：关键词5字化 + visual 升级（beast→dragon + 恶魔翼）
UPDATE characters SET 
  keywords = '远古泰坦兽 天崩地裂者 噬骨巨獠牙',
  visual = '{"archetype":"dragon","hat":"horn","aura":"fire","wings":"demon"}'::jsonb
WHERE name = '裂地巨兽' AND boss_tier = 4;

-- T5 虚空之眼：关键词5字化 + 属性修正 + visual 升级（halo→crown + 权杖）
UPDATE characters SET 
  keywords = '鸿蒙混沌体 虚空湮灭者 次元裂隙眼',
  int_val = 17, wis = 17, cha = 13,
  visual = '{"archetype":"elemental","hat":"crown","wings":"demon","aura":"dark","held":"staff"}'::jsonb
WHERE name = '虚空之眼' AND boss_tier = 5;
