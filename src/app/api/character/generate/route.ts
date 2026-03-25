import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY!;
const MINIMAX_BASE_URL = "https://api.minimax.chat/v1";

// 角色生成的 Prompt
function buildPrompt(keywords: string[], powerTier: string): string {
  const keywordStr = keywords.length > 0 ? keywords.join("、") : "完全随机";

  // 根据 powerTier 设定属性范围
  const tierGuide: Record<string, string> = {
    legendary: "属性总点数在78-85之间，武器攻击力15-25，技能伤害30-50，防具防御力12-20。这个角色应当极其强大。",
    epic: "属性总点数在72-80之间，武器攻击力12-22，技能伤害25-40，防具防御力10-18。",
    rare: "属性总点数在65-75之间，武器攻击力10-18，技能伤害20-35，防具防御力8-15。",
    common: "属性总点数在55-68之间，武器攻击力6-14，技能伤害12-25，防具防御力5-12。角色虽然平凡但也有独特之处。",
  };

  // 随机风格提示，确保相同关键词产出不同角色 (OPT-13)
  const styleSeeds = [
    "偏向东方玄幻风格", "偏向西方奇幻风格", "偏向赛博朋克风格",
    "偏向蒸汽朋克风格", "偏向日式动漫风格", "偏向北欧神话风格",
    "偏向中国武侠风格", "偏向科幻太空风格", "偏向暗黑哥特风格",
    "偏向可爱Q版风格", "偏向史诗战争风格", "偏向自然精灵风格",
  ];
  const styleSeed = styleSeeds[Math.floor(Math.random() * styleSeeds.length)];
  const randomId = Math.random().toString(36).slice(2, 8);

  return `你是一个创意角色设计师。请根据以下关键词生成一个游戏角色。

关键词：${keywordStr}
创意种子：#${randomId}（请基于这个随机种子发挥创意，确保每次生成都不同）
风格倾向：${styleSeed}

⚠️ 重要规则 — 关键词强度感知：
角色的强度必须与关键词暗示的力量等级匹配。
- 如果关键词暗示了传奇/神话级别的存在（如：超人、神、无限宝石、灭霸、宇宙、毁灭），角色应有极高的属性
- 如果关键词暗示了普通/日常事物（如：橘子、普通人、铅笔、蚂蚁），角色属性应偏低
- 关键词的想象力和创意很重要，但不应让"普通橘子"打败"超人"

当前角色的强度等级：${powerTier.toUpperCase()}
${tierGuide[powerTier]}

具体要求：
1. 角色可以是人、动物、机器人、怪兽、虚构角色等任何类型
2. 基于关键词创造性地设计角色，要有逻辑且有趣味性
3. 每项属性在3-20之间
4. 武器最多3个，防具最多3个，技能最多3个，特殊物品最多3个
5. 技能来源可以是科幻、修仙、漫画、电影等任何题材
6. 特殊物品可以是任何东西，效果可以强可以弱甚至为0
7. HP上限基于体质(CON)计算：HP = CON * 8 + 20

请严格按以下JSON格式返回（不要包含任何其他文字）：
{
  "name": "角色名字",
  "description": "角色的背景故事和外观描述（2-3句话）",
  "str": 10,
  "dex": 10,
  "con": 10,
  "int_val": 10,
  "wis": 10,
  "cha": 10,
  "weapons": [
    {"name": "武器名", "type": "武器类型", "attack": 15, "effect": "特殊效果描述"}
  ],
  "armors": [
    {"name": "防具名", "type": "防具类型", "defense": 10, "effect": "特殊效果描述"}
  ],
  "skills": [
    {"name": "技能名", "source": "来源作品/体系", "damage": 25, "effect": "技能效果描述", "cooldown": 2}
  ],
  "items": [
    {"name": "物品名", "description": "物品描述", "effect": "效果描述", "power": 5}
  ]
}`;
}

// 根据关键词判断角色强度等级
function assessPowerTier(keywords: string[]): string {
  if (keywords.length === 0) return "rare";

  const combined = keywords.join(" ").toLowerCase();

  // 传奇级关键词
  const legendaryPatterns = [
    "超人", "神", "无限", "宝石", "灭霸", "宇宙", "毁灭", "创世", "万能",
    "全能", "至高", "永恒", "不朽", "绝对", "无敌", "最强", "终极", "究极",
    "天帝", "天神", "混沌", "鸿蒙", "盘古", "女娲", "奥丁", "宙斯",
    "龙王", "魔神", "上帝", "耶稣", "佛祖", "如来",
    "superman", "god", "infinity", "thanos", "omnipotent",
  ];

  // 史诗级关键词
  const epicPatterns = [
    "龙", "凤凰", "魔王", "英雄", "传说", "暗黑", "圣", "魔法",
    "核弹", "量子", "黑洞", "反物质", "奇点", "异次元",
    "钢铁侠", "蜘蛛侠", "蝙蝠侠", "绿巨人", "雷神", "金刚狼",
    "悟空", "哪吒", "吕布", "关羽", "赵云",
    "泰坦", "巨人", "恶魔", "天使", "死神",
    "王者", "帝王", "霸主", "征服者",
  ];

  // 普通级关键词
  const commonPatterns = [
    "普通", "平凡", "日常", "办公", "上班",
    "橘子", "桔子", "苹果", "香蕉", "水果", "蔬菜",
    "铅笔", "橡皮", "书包", "作业", "课本",
    "蜗牛", "蚯蚓", "地鼠", "鸽子",
    "路人", "行人", "学生", "打工人",
    "拖鞋", "袜子", "毛巾",
  ];

  for (const p of legendaryPatterns) {
    if (combined.includes(p)) return "legendary";
  }
  for (const p of epicPatterns) {
    if (combined.includes(p)) return "epic";
  }
  for (const p of commonPatterns) {
    if (combined.includes(p)) return "common";
  }
  return "rare"; // 默认稀有级
}

// 校验生成的角色数据
function validateCharacter(data: Record<string, unknown>, powerTier: string): string | null {
  const stats = ["str", "dex", "con", "int_val", "wis", "cha"];
  let total = 0;

  for (const stat of stats) {
    const val = data[stat];
    if (typeof val !== "number" || val < 3 || val > 20) {
      return `属性 ${stat} 不合法: ${val}`;
    }
    total += val as number;
  }

  // 根据等级放宽校验范围
  const maxTotal = powerTier === "legendary" ? 95 : powerTier === "epic" ? 90 : 90;
  if (total < 40 || total > maxTotal) {
    return `属性总和 ${total} 超出范围 (40-${maxTotal})`;
  }

  if (!data.name || typeof data.name !== "string") return "缺少名字";
  if (!data.description || typeof data.description !== "string") return "缺少描述";

  const arrayFields = ["weapons", "armors", "skills", "items"];
  for (const field of arrayFields) {
    if (!Array.isArray(data[field])) return `${field} 不是数组`;
    if ((data[field] as unknown[]).length > 3) return `${field} 超过3个`;
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, keywords } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 检查用户是否已有角色
    const { data: existingChar } = await supabaseAdmin
      .from("characters")
      .select("id")
      .eq("user_id", userId)
      .eq("is_system", false)
      .single();

    if (existingChar) {
      return NextResponse.json(
        { error: "你已经有一个角色了，请先删除现有角色" },
        { status: 400 }
      );
    }

    // 检查每日生成限额
    const today = new Date().toISOString().split("T")[0];
    const { data: limit } = await supabaseAdmin
      .from("daily_limits")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .single();

    if (limit && limit.generations >= 3) {
      return NextResponse.json(
        { error: "今日生成次数已用完（3/3），请明天零点后再试" },
        { status: 429 }
      );
    }

    // 获取用户名（彩蛋检测用）
    const { data: currentUser } = await supabaseAdmin
      .from("users")
      .select("name")
      .eq("id", userId)
      .single();
    const userName = currentUser?.name?.toUpperCase() || "";

    // 解析关键词
    const keywordList: string[] = [];
    if (keywords && typeof keywords === "string") {
      const parts = keywords
        .split(/[,，\s]+/)
        .map((k: string) => k.trim())
        .filter((k: string) => k.length > 0 && k.length <= 5);
      keywordList.push(...parts.slice(0, 3));
    }

    // 评估关键词强度等级
    const powerTier = assessPowerTier(keywordList);

    // 调用 MiniMax API 生成角色
    const response = await fetch(`${MINIMAX_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MINIMAX_API_KEY}`,
      },
      body: JSON.stringify({
        model: "MiniMax-Text-01",
        messages: [
          {
            role: "system",
            content:
              "你是一个游戏角色设计师，只返回JSON格式的数据，不要包含任何其他文字、markdown标记或代码块标记。",
          },
          { role: "user", content: buildPrompt(keywordList, powerTier) },
        ],
        temperature: 0.95,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("MiniMax API error:", response.status, errText);
      return NextResponse.json(
        { error: `AI 生成失败 (${response.status}): ${errText.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "AI 返回为空，请重试" },
        { status: 502 }
      );
    }

    // 解析 JSON（处理可能的 markdown 代码块包裹）
    let charData: Record<string, unknown>;
    try {
      const jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      charData = JSON.parse(jsonStr);
    } catch {
      console.error("JSON parse error, raw content:", content);
      return NextResponse.json(
        { error: "AI 生成的角色数据格式异常，请重试" },
        { status: 502 }
      );
    }

    // 校验
    const validationError = validateCharacter(charData, powerTier);
    if (validationError) {
      console.error("Validation error:", validationError, charData);
      return NextResponse.json(
        { error: `角色数据校验失败: ${validationError}，请重试` },
        { status: 502 }
      );
    }

    // === 彩蛋 OPT-14: 特殊玩家金色传说装备 ===
    const vipNames = ["YUZHI", "JIAOZI", "AMEI"];
    const isVip = vipNames.includes(userName);
    if (isVip) {
      // 添加一件金色传说装备
      const legendaryWeapons: Record<string, { name: string; type: string; attack: number; effect: string }> = {
        YUZHI: { name: "✦ 鱼之金剑·创世之刃", type: "传说武器", attack: 30, effect: "金色传说！攻击时有30%概率造成双倍伤害" },
        JIAOZI: { name: "✦ 饺子神锤·天降奇缘", type: "传说武器", attack: 28, effect: "金色传说！每次攻击恢复自身5%HP" },
        AMEI: { name: "✦ 阿美圣弓·星辰之矢", type: "传说武器", attack: 29, effect: "金色传说！无视敌方50%防御" },
      };
      const legendaryItem = legendaryWeapons[userName];
      (charData.weapons as unknown[]).unshift(legendaryItem);
      // 角色名添加金色标记
      charData.name = `✦ ${charData.name} ✦`;
    }

    // === 彩蛋 OPT-15: 蚂蚁+消金+信用卡 → 最强角色 ===
    const kwSorted = keywordList.map(k => k.trim()).sort().join(",");
    const isAntEgg = kwSorted === "信用卡,消金,蚂蚁";
    if (isAntEgg) {
      charData.str = 20; charData.dex = 20; charData.con = 20;
      charData.int_val = 20; charData.wis = 20; charData.cha = 20;
      charData.weapons = [
        { name: "花呗·无限额度斩", type: "金融神器", attack: 35, effect: "对敌方造成信用打击，额外扣除10%最大HP" },
        { name: "借呗·债务连锁", type: "金融神器", attack: 30, effect: "伤害会在下一回合再次触发（利息伤害）" },
        { name: "余额宝·复利之盾", type: "金融神器", attack: 25, effect: "攻击的同时回复自身HP" },
      ];
      charData.armors = [
        { name: "芝麻信用·钛金护甲", type: "信用之盾", defense: 25, effect: "信用分越高防御越强，减免50%伤害" },
        { name: "支付宝·量子防火墙", type: "科技护盾", defense: 20, effect: "有概率完全免疫一次攻击" },
      ];
      charData.skills = [
        { name: "全民消费狂潮", source: "蚂蚁消金", damage: 60, effect: "释放消费金融的终极力量，对全场造成毁灭性打击", cooldown: 3 },
        { name: "大数据风控", source: "芝麻信用", damage: 45, effect: "精准识别对方弱点，必定暴击", cooldown: 2 },
        { name: "移动支付·链接万物", source: "支付宝", damage: 35, effect: "触发连锁攻击，追加一次额外攻击", cooldown: 1 },
      ];
      charData.items = [
        { name: "金色蚂蚁徽章", description: "蚂蚁集团传说级徽章", effect: "每回合自动恢复10%HP", power: 15 },
        { name: "信用卡黑卡", description: "无限额度的黑金信用卡", effect: "战斗开始时提升全属性2点", power: 10 },
      ];
      charData.description = `${charData.description} 【终极隐藏角色】拥有蚂蚁消金的全部力量，信用卡的无限额度加持，是竞技场中的绝对王者！`;
    }

    // 计算 HP
    const con = charData.con as number;
    const maxHp = con * 8 + 20;

    // 写入数据库
    const { data: character, error: insertError } = await supabaseAdmin
      .from("characters")
      .insert({
        user_id: userId,
        name: charData.name,
        keywords: keywordList.join("、") || "随机生成",
        description: charData.description,
        str: charData.str,
        dex: charData.dex,
        con: charData.con,
        int_val: charData.int_val,
        wis: charData.wis,
        cha: charData.cha,
        max_hp: maxHp,
        weapons: charData.weapons,
        armors: charData.armors,
        skills: charData.skills,
        items: charData.items,
        is_system: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: "保存角色失败" },
        { status: 500 }
      );
    }

    // 更新每日限额
    if (limit) {
      await supabaseAdmin
        .from("daily_limits")
        .update({ generations: limit.generations + 1 })
        .eq("id", limit.id);
    } else {
      await supabaseAdmin
        .from("daily_limits")
        .insert({ user_id: userId, date: today, generations: 1, battles: 0 });
    }

    return NextResponse.json({ character });
  } catch (err) {
    console.error("Generate error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
