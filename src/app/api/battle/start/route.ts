import { supabaseAdmin } from "@/lib/supabase-admin";
import { runBattle } from "@/lib/battle-engine";
import { NextRequest, NextResponse } from "next/server";
import type { Character } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { userId, characterId } = await request.json();

    if (!userId || !characterId) {
      return NextResponse.json({ error: "参数缺失" }, { status: 400 });
    }

    // 检查每日对战限额
    const today = new Date().toISOString().split("T")[0];
    const { data: limit } = await supabaseAdmin
      .from("daily_limits")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .single();

    if (limit && limit.battles >= 20) {
      return NextResponse.json(
        { error: "今日对战次数已用完（20/20），请明天再来！" },
        { status: 429 }
      );
    }

    // 获取玩家角色
    const { data: playerChar, error: playerErr } = await supabaseAdmin
      .from("characters")
      .select("*")
      .eq("id", characterId)
      .eq("user_id", userId)
      .single();

    if (playerErr || !playerChar) {
      return NextResponse.json({ error: "找不到你的角色" }, { status: 404 });
    }

    // 随机匹配对手（排除自己的角色）
    const { data: rawOpponents, error: oppErr } = await supabaseAdmin
      .from("characters")
      .select("*")
      .neq("user_id", userId);

    let allOpponents = rawOpponents || [];

    if (oppErr || allOpponents.length === 0) {
      // 找系统角色
      const { data: sysChars } = await supabaseAdmin
        .from("characters")
        .select("*")
        .eq("is_system", true);

      if (!sysChars || sysChars.length === 0) {
        return NextResponse.json(
          { error: "没有可匹配的对手，请等待更多玩家加入！" },
          { status: 404 }
        );
      }
      allOpponents = sysChars;
    }

    // 随机选一个对手
    const opponentChar = allOpponents[Math.floor(Math.random() * allOpponents.length)] as Character;

    // 获取对手的创建者信息（如果是玩家角色）
    let opponentCreator: { name: string; code: string } | null = null;
    if (opponentChar.user_id) {
      const { data: creatorUser } = await supabaseAdmin
        .from("users")
        .select("name, code")
        .eq("id", opponentChar.user_id)
        .single();
      if (creatorUser) {
        opponentCreator = creatorUser;
      }
    }

    // 执行战斗
    const battleResult = runBattle(playerChar as Character, opponentChar);

    // 保存战斗记录
    const { data: battle, error: insertErr } = await supabaseAdmin
      .from("battles")
      .insert({
        player_id: userId,
        player_character_id: characterId,
        opponent_character_id: opponentChar.id,
        winner: battleResult.winner,
        rounds: battleResult.rounds,
        total_rounds: battleResult.totalRounds,
        summary: battleResult.summary,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Battle insert error:", insertErr);
      return NextResponse.json({ error: "保存对战记录失败" }, { status: 500 });
    }

    // 更新每日对战计数
    if (limit) {
      await supabaseAdmin
        .from("daily_limits")
        .update({ battles: limit.battles + 1 })
        .eq("id", limit.id);
    } else {
      await supabaseAdmin.from("daily_limits").insert({
        user_id: userId,
        date: today,
        generations: 0,
        battles: 1,
      });
    }

    return NextResponse.json({
      battleId: battle.id,
      result: {
        ...battleResult,
        id: battle.id,
        created_at: battle.created_at,
      },
      opponentCreator,
      remainingBattles: 20 - ((limit?.battles || 0) + 1),
    });
  } catch (err) {
    console.error("Battle API error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
