-- BOSS 角色种子数据
-- 在 Supabase SQL Editor 中执行（需先执行 add-boss-system.sql）

-- BOSS 1: 守卫石像 — 纯坦教学
INSERT INTO characters (
  name, keywords, description,
  str, dex, con, int_val, wis, cha, max_hp,
  weapons, armors, skills, items, visual,
  is_system, boss_tier, user_id
) VALUES (
  '守卫石像',
  '花岗岩 盾牌 沉眠',
  '沉睡千年的石像守卫，当入侵者踏入圣殿，它的眼中重新燃起红光。笨重但坚不可摧，每一拳都带着山岳般的重量。',
  14, 6, 18, 6, 8, 6, 238,
  '[{"name":"花岗岩重拳","type":"拳套","attack":16,"effect":"以石化之拳碾碎对手"},{"name":"圣殿石柱","type":"钝器","attack":14,"effect":"连根拔起的石柱横扫"}]'::jsonb,
  '[{"name":"花岗岩外壳","type":"天然护甲","defense":18,"effect":"岩石构成的躯体，刀剑难伤"},{"name":"苔藓覆层","type":"附加护甲","defense":8,"effect":"千年苔藓的额外缓冲"}]'::jsonb,
  '[{"name":"大地震颤","source":"大地之力","damage":28,"effect":"重踏地面释放地震波，同时减速对手","cooldown":3},{"name":"石化凝视","source":"远古魔眼","damage":18,"effect":"红色光芒射出，有几率使对手石化一回合","cooldown":4}]'::jsonb,
  '[{"name":"远古修复核心","description":"石像体内的魔力核心","effect":"每回合少量回复HP","power":10}]'::jsonb,
  '{"archetype":"giant","hat":"horn","aura":"fire","held":"shield"}'::jsonb,
  true, 1, NULL
);

-- BOSS 2: 暗影刺客 — 高速脆皮
INSERT INTO characters (
  name, keywords, description,
  str, dex, con, int_val, wis, cha, max_hp,
  weapons, armors, skills, items, visual,
  is_system, boss_tier, user_id
) VALUES (
  '暗影刺客',
  '毒刃 暗杀 隐匿',
  '从暗影中诞生的无形杀手，你看不见他的身影，只能感受到毒刃划过皮肤的冰凉。速度极快但不堪一击——如果你能碰到他的话。',
  10, 19, 8, 12, 14, 8, 128,
  '[{"name":"噬魂毒匕","type":"匕首","attack":14,"effect":"淬毒的黑曜石匕首，伤口持续灼痛"},{"name":"影刃·月蚀","type":"短剑","attack":12,"effect":"凝固暗影铸成的短剑，切割灵魂"}]'::jsonb,
  '[{"name":"暗影斗篷","type":"轻甲","defense":6,"effect":"融入黑暗的斗篷，难以被锁定"},{"name":"烟雾护符","type":"饰品","defense":4,"effect":"释放烟雾干扰对手视线"}]'::jsonb,
  '[{"name":"影分身突袭","source":"暗影秘术","damage":30,"effect":"分裂为三个残影同时攻击，暴击率极高","cooldown":3},{"name":"毒雾爆发","source":"毒师传承","damage":22,"effect":"引爆体内蓄积的毒素形成毒雾","cooldown":4}]'::jsonb,
  '[{"name":"消失粉末","description":"一把银色粉末","effect":"被命中后有几率闪避下一次攻击","power":12}]'::jsonb,
  '{"archetype":"ninja","aura":"dark","held":"dual","wings":"tiny"}'::jsonb,
  true, 2, NULL
);

-- BOSS 3: 炼金贤者 — 物品战术流
INSERT INTO characters (
  name, keywords, description,
  str, dex, con, int_val, wis, cha, max_hp,
  weapons, armors, skills, items, visual,
  is_system, boss_tier, user_id
) VALUES (
  '炼金贤者',
  '禁忌炼金师 万毒贤者石 水银蚀魂体',
  '穷尽一生研究禁忌炼金术的老者。他的武器不是剑，而是一瓶瓶颜色诡异的药剂。每一场战斗都是他的化学实验——而你是实验对象。',
  8, 10, 14, 18, 16, 12, 194,
  '[{"name":"水银法杖","type":"法杖","attack":10,"effect":"流动的水银凝聚为杖身，释放剧毒"},{"name":"腐蚀药瓶","type":"投掷","attack":12,"effect":"投掷强酸药剂，腐蚀护甲"}]'::jsonb,
  '[{"name":"炼金长袍","type":"法袍","defense":10,"effect":"浸透魔药的长袍，抵抗元素伤害"},{"name":"水银护盾","type":"魔法盾","defense":8,"effect":"环绕身体的水银球体，自动偏转攻击"}]'::jsonb,
  '[{"name":"万毒归一","source":"禁忌炼金","damage":26,"effect":"混合七种剧毒形成终极毒素","cooldown":3},{"name":"贤者之石","source":"终极炼成","damage":32,"effect":"短暂激活贤者之石的力量，释放纯粹能量","cooldown":5}]'::jsonb,
  '[{"name":"生命药剂","description":"微微发光的绿色药水","effect":"回复大量HP，同时提升下次攻击伤害","power":18}]'::jsonb,
  '{"archetype":"mage","hat":"crown","aura":"holy","held":"staff"}'::jsonb,
  true, 3, NULL
);

-- BOSS 4: 裂地巨兽 — 爆发肉盾
INSERT INTO characters (
  name, keywords, description,
  str, dex, con, int_val, wis, cha, max_hp,
  weapons, armors, skills, items, visual,
  is_system, boss_tier, user_id
) VALUES (
  '裂地巨兽',
  '远古泰坦兽 天崩地裂者 噄骨巨獠牙',
  '从地底深处钻出的远古巨兽，仅仅是行走就让大地龟裂。它不懂策略，不会魔法，只有纯粹而压倒性的暴力。面对它，技巧毫无意义——你需要的是硬实力。',
  20, 8, 20, 6, 6, 8, 260,
  '[{"name":"山岳獠牙","type":"天然武器","attack":22,"effect":"比钢铁还硬的巨型獠牙"},{"name":"碎岩尾锤","type":"天然武器","attack":18,"effect":"岩石包裹的尾巴，一击粉碎巨石"}]'::jsonb,
  '[{"name":"玄武岩甲壳","type":"天然护甲","defense":20,"effect":"覆盖全身的火山岩甲壳，近乎无敌"},{"name":"熔岩血脉","type":"内甲","defense":6,"effect":"流淌着熔岩的血液灼伤近身攻击者"}]'::jsonb,
  '[{"name":"裂地冲撞","source":"原始之力","damage":35,"effect":"全力冲撞，大地在脚下崩裂","cooldown":3},{"name":"火山喷吐","source":"地心之火","damage":28,"effect":"从口中喷出地底岩浆","cooldown":4}]'::jsonb,
  '[{"name":"地心结晶","description":"吞噬的地心能量结晶","effect":"受到致命攻击时有几率硬扛住并反击","power":15}]'::jsonb,
  '{"archetype":"dragon","hat":"horn","aura":"fire","wings":"demon"}'::jsonb,
  true, 4, NULL
);

-- BOSS 5: 虚空之眼 — 全属性终极BOSS
INSERT INTO characters (
  name, keywords, description,
  str, dex, con, int_val, wis, cha, max_hp,
  weapons, armors, skills, items, visual,
  is_system, boss_tier, user_id
) VALUES (
  '虚空之眼',
  '鸿蒙混沌体 虚空湮灭者 次元裂隙眼',
  '从维度裂缝中窥视这个世界的存在，没有人知道它是什么。它预知你的每一个动作，每一次呼吸。强大、全面、无可匹敌——除非你也已经站在了传说的巅峰。',
  16, 16, 16, 17, 17, 13, 216,
  '[{"name":"湮灭射线","type":"能量","attack":18,"effect":"从瞳孔中射出的紫色毁灭光线"},{"name":"次元裂斩","type":"空间","attack":16,"effect":"撕裂空间本身造成伤害"}]'::jsonb,
  '[{"name":"次元屏障","type":"力场","defense":14,"effect":"扭曲空间形成的防御屏障"},{"name":"预知护盾","type":"心灵","defense":10,"effect":"预见攻击轨迹自动规避"}]'::jsonb,
  '[{"name":"虚空湮灭","source":"次元能量","damage":36,"effect":"聚集虚空能量释放毁灭波动，无视护甲","cooldown":4},{"name":"时空回溯","source":"预知之力","damage":20,"effect":"回溯时间撤销受到的伤害并反击","cooldown":5}]'::jsonb,
  '[{"name":"维度之心","description":"跳动着的紫色能量核心","effect":"极小概率令对手的攻击在时空中迷失","power":20}]'::jsonb,
  '{"archetype":"elemental","hat":"crown","wings":"demon","aura":"dark","held":"staff"}'::jsonb,
  true, 5, NULL
);
