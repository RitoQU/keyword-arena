// 预生成 100 个系统角色的脚本
// 运行方式：在项目根目录执行 node supabase/seed-npcs.mjs

import { readFileSync } from "fs";
const envContent = readFileSync(".env.local", "utf8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx > 0) {
    process.env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
  }
}

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!MINIMAX_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("请设置环境变量：MINIMAX_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// 100 组多样化关键词
const KEYWORD_SETS = [
  ["火焰", "龙", "骑士"], ["冰霜", "女巫", "月亮"], ["机械", "义体", "黑客"],
  ["樱花", "武士", "剑"], ["雷电", "神话", "锤子"], ["暗影", "刺客", "毒药"],
  ["光明", "圣骑士", "盾"], ["海洋", "海盗", "炮弹"], ["沙漠", "法老", "诅咒"],
  ["森林", "精灵", "弓箭"], ["星空", "宇航员", "激光"], ["地下", "矮人", "矿石"],
  ["血族", "吸血鬼", "蝙蝠"], ["狼人", "满月", "利爪"], ["僵尸", "末日", "病毒"],
  ["天使", "翅膀", "治愈"], ["恶魔", "地狱", "火焰"], ["忍者", "暗器", "烟雾"],
  ["枪手", "西部", "荒野"], ["拳师", "格斗", "气功"], ["厨师", "菜刀", "火焰"],
  ["音乐", "吟游诗人", "魔法"], ["炼金术", "药剂", "变异"], ["时间", "穿越", "沙漏"],
  ["空间", "传送", "裂缝"], ["重力", "黑洞", "粉碎"], ["植物", "藤蔓", "毒素"],
  ["昆虫", "蜂群", "蚁后"], ["鸟类", "风暴", "羽翼"], ["深渊", "触手", "混沌"],
  ["蒸汽朋克", "齿轮", "飞艇"], ["赛博朋克", "霓虹", "数据"], ["仙侠", "飞剑", "丹药"],
  ["修罗", "六臂", "怒火"], ["佛陀", "金身", "禅定"], ["道士", "符咒", "桃木剑"],
  ["猫咪", "毛球", "利爪"], ["熊猫", "竹子", "太极"], ["凤凰", "涅槃", "火焰"],
  ["麒麟", "祥瑞", "雷霆"], ["白虎", "金属", "风暴"], ["玄武", "龟甲", "洪水"],
  ["朱雀", "烈焰", "重生"], ["青龙", "风雨", "雷电"], ["孙悟空", "金箍棒", "筋斗云"],
  ["哪吒", "风火轮", "乾坤圈"], ["二郎神", "天眼", "哮天犬"], ["钢铁侠", "科技", "飞行"],
  ["蜘蛛侠", "蛛丝", "感应"], ["绿巨人", "愤怒", "力量"], ["雷神", "锤子", "闪电"],
  ["巫师", "魔杖", "咒语"], ["德鲁伊", "变形", "自然"], ["死灵法师", "骷髅", "诅咒"],
  ["圣女", "祈祷", "光环"], ["狂战士", "双斧", "嗜血"], ["游侠", "陷阱", "追踪"],
  ["工匠", "锻造", "符文"], ["学者", "魔导书", "知识"], ["舞者", "刀锋", "魅惑"],
  ["海妖", "歌声", "深海"], ["树人", "森林", "根须"], ["石像鬼", "石化", "飞行"],
  ["独角兽", "彩虹", "净化"], ["九尾狐", "幻术", "魅惑"], ["雪女", "冰霜", "暴风雪"],
  ["河童", "水球", "摔跤"], ["天狗", "旋风", "长鼻"],
  ["AI", "代码", "计算"], ["量子", "纠缠", "概率"], ["暗物质", "引力", "虚空"],
  ["像素", "方块", "8位"], ["彩虹", "糖果", "甜蜜"], ["闪电", "速度", "音爆"],
  ["岩浆", "火山", "毁灭"], ["水晶", "折射", "棱镜"], ["磁力", "金属", "控制"],
  ["毒蛇", "剧毒", "速度"], ["蝎子", "尾刺", "沙漠"], ["章鱼", "墨汁", "触手"],
  ["灯笼鱼", "深海", "发光"], ["蘑菇", "孢子", "幻觉"], ["仙人掌", "荆棘", "沙漠"],
  ["竹子", "坚韧", "生长"], ["藤蔓", "绞杀", "寄生"],
  ["骰子", "运气", "赌博"], ["镜子", "反射", "分身"], ["钟表", "时间", "齿轮"],
  ["棋子", "策略", "黑白"], ["纸牌", "魔术", "欺诈"], ["面具", "变脸", "神秘"],
  ["傀儡", "丝线", "操控"], ["稻草人", "田野", "乌鸦"],
  ["咖啡", "提神", "苦涩"], ["拉面", "热汤", "筷子"], ["寿司", "鲜鱼", "刀工"],
  ["披萨", "芝士", "火炉"], ["冰淇淋", "甜蜜", "冰冻"],
  ["书虫", "知识", "眼镜"], ["猫头鹰", "智慧", "夜视"], ["乌鸦", "诡计", "黑暗"],
  ["蜂鸟", "速度", "花蜜"], ["巨鲸", "深海", "声波"], ["鲨鱼", "撕咬", "血腥"],
];

function buildNpcPrompt(keywords) {
  return `你是一个创意角色设计师。请根据以下关键词生成一个游戏NPC角色。

关键词：${keywords.join("、")}

要求：
1. 角色可以是人、动物、机器人、怪兽、虚构角色等任何类型
2. 基于关键词创造性地设计角色，要有逻辑且有趣味性
3. D&D六维属性总点数在60-80之间，每项3-20之间
4. 武器最多3个，防具最多3个，技能最多3个，特殊物品最多3个
5. HP上限基于体质(CON)计算：HP = CON * 8 + 20

请严格按以下JSON格式返回（不要包含任何其他文字）：
{
  "name": "角色名字",
  "description": "角色的背景故事和外观描述（2-3句话）",
  "str": 10, "dex": 10, "con": 10, "int_val": 10, "wis": 10, "cha": 10,
  "weapons": [{"name": "武器名", "type": "类型", "attack": 15, "effect": "效果"}],
  "armors": [{"name": "防具名", "type": "类型", "defense": 10, "effect": "效果"}],
  "skills": [{"name": "技能名", "source": "来源", "damage": 25, "effect": "效果", "cooldown": 2}],
  "items": [{"name": "物品名", "description": "描述", "effect": "效果", "power": 5}]
}`;
}

async function generateOneNpc(keywords, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await fetch("https://api.minimax.chat/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MINIMAX_API_KEY}`,
        },
        body: JSON.stringify({
          model: "MiniMax-Text-01",
          messages: [
            { role: "system", content: "你是一个游戏角色设计师，只返回JSON。" },
            { role: "user", content: buildNpcPrompt(keywords) },
          ],
          temperature: 0.95,
          max_tokens: 1500,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error(`  API error (${resp.status}): ${errText.slice(0, 100)}`);
        if (resp.status === 429) {
          console.log("  Rate limited, waiting 3s...");
          await new Promise((r) => setTimeout(r, 3000));
          continue;
        }
        return null;
      }

      const result = await resp.json();
      const content = result.choices?.[0]?.message?.content;
      if (!content) return null;

      const jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      const data = JSON.parse(jsonStr);

      // 基础校验
      const stats = ["str", "dex", "con", "int_val", "wis", "cha"];
      let total = 0;
      for (const s of stats) {
        if (typeof data[s] !== "number" || data[s] < 3 || data[s] > 20) return null;
        total += data[s];
      }
      if (total < 50 || total > 90) return null;
      if (!data.name || !Array.isArray(data.weapons)) return null;

      return data;
    } catch (e) {
      console.error(`  Parse error: ${e.message}`);
    }
  }
  return null;
}

async function insertNpc(data, keywords) {
  const con = data.con;
  const maxHp = con * 8 + 20;

  const resp = await fetch(`${SUPABASE_URL}/rest/v1/characters`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      user_id: null,
      name: data.name,
      keywords: keywords.join("、"),
      description: data.description,
      str: data.str,
      dex: data.dex,
      con: data.con,
      int_val: data.int_val,
      wis: data.wis,
      cha: data.cha,
      max_hp: maxHp,
      weapons: data.weapons,
      armors: data.armors,
      skills: data.skills,
      items: data.items,
      is_system: true,
    }),
  });

  return resp.ok;
}

async function main() {
  console.log(`开始生成 ${KEYWORD_SETS.length} 个系统角色...`);

  // 检查已有多少系统角色
  const checkResp = await fetch(
    `${SUPABASE_URL}/rest/v1/characters?is_system=eq.true&select=id`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );
  const existing = await checkResp.json();
  const startIdx = existing.length;
  console.log(`已有 ${startIdx} 个系统角色，从第 ${startIdx + 1} 个开始`);

  let success = 0;
  let fail = 0;

  for (let i = startIdx; i < KEYWORD_SETS.length; i++) {
    const kw = KEYWORD_SETS[i];
    process.stdout.write(`[${i + 1}/${KEYWORD_SETS.length}] ${kw.join("、")} ... `);

    const data = await generateOneNpc(kw);
    if (!data) {
      console.log("❌ 生成失败");
      fail++;
      continue;
    }

    const ok = await insertNpc(data, kw);
    if (ok) {
      console.log(`✅ ${data.name}`);
      success++;
    } else {
      console.log("❌ 写入失败");
      fail++;
    }

    // 间隔 1.5 秒避免 rate limit
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(`\n完成！成功: ${success}, 失败: ${fail}`);
}

main();
