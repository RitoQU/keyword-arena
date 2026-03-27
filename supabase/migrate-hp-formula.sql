-- 迁移：HP 公式从 CON * 8 + 20 升级为 CON * 11 + 40
-- 更新所有存量角色的 max_hp 以匹配新公式
-- 战斗引擎已在运行时重算 HP，此迁移确保角色卡/排行榜等展示一致

UPDATE characters
SET max_hp = con * 11 + 40
WHERE max_hp != con * 11 + 40;
