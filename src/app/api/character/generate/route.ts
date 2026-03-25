import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextRequest, NextResponse } from "next/server";

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY!;
const MINIMAX_BASE_URL = "https://api.minimax.chat/v1";

// 角色生成的 Prompt
function buildPrompt(keywords: string[]): string {
  const keywordStr = keywords.length > 0 ? keywords.join("、") : "完全随机";
  return `你是一个创意角色设计师。请根据以下关键词生成一个游戏角色。

关键词：${keywordStr}

要求：
1. 角色可以是人、动物、机器人、怪兽、虚构角色等任何类型
2. 基于关键词创造性地设计角色，要有逻辑且有趣味性
3. D&D六维属性总点数在60-80之间，每项3-20之间
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

// 校验生成的角色数据
function validateCharacter(data: Record<string, unknown>): string | null {
  const stats = ["str", "dex", "con", "int_val", "wis", "cha"];
  let total = 0;

  for (const stat of stats) {
    const val = data[stat];
    if (typeof val !== "number" || val < 3 || val > 20) {
      return `属性 ${stat} 不合法: ${val}`;
    }
    total += val as number;
  }

  if (total < 50 || total > 90) {
    // 允许一些弹性但不能太离谱
    return `属性总和 ${total} 超出范围 (50-90)`;
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

    // 解析关键词
    const keywordList: string[] = [];
    if (keywords && typeof keywords === "string") {
      const parts = keywords
        .split(/[,，\s]+/)
        .map((k: string) => k.trim())
        .filter((k: string) => k.length > 0 && k.length <= 5);
      keywordList.push(...parts.slice(0, 3));
    }

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
          { role: "user", content: buildPrompt(keywordList) },
        ],
        temperature: 0.9,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("MiniMax API error:", response.status, errText);
      return NextResponse.json(
        { error: "AI 生成失败，请重试" },
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
    const validationError = validateCharacter(charData);
    if (validationError) {
      console.error("Validation error:", validationError, charData);
      return NextResponse.json(
        { error: `角色数据校验失败: ${validationError}，请重试` },
        { status: 502 }
      );
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
